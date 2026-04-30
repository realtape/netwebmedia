<?php
/**
 * Convert Chile audit-link clickers into pipeline deals.
 *
 * Reads:  api-php/data/audit-views.log + the leads CSV (all_leads_5x.csv → santiago_leads.csv)
 * Writes: contacts (INSERT IGNORE on email), deals (one per contact, idempotent)
 * Fires:  wf_trigger('deal_stage', ['stage' => 'Qualified']) per new deal so the
 *         workflow chain (SL-03 proposal prep, SL-09 high-value escalation, etc.) runs.
 *
 * GET /crm-vanilla/api/?r=import_clickers&token=NWM_IMPORT_CHILE_2026
 *   →  apply (insert + fire workflows). Returns summary JSON.
 * GET /crm-vanilla/api/?r=import_clickers&token=NWM_IMPORT_CHILE_2026&dry=1
 *   →  preview. No DB writes, no workflow triggers.
 *
 * Idempotent — safe to re-run. Skips contacts that already exist (by email)
 * and skips deals that already exist (by contact_id + source).
 */
if ($method !== 'GET') jsonError('Use GET', 405);
if (!hash_equals(IMPORT_CSV_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/wf_bridge.php';
pin_org_to_master();

$dry      = !empty($_GET['dry']);
$ROOT     = realpath(__DIR__ . '/../../..');
$LOG_PATH = $ROOT . '/api-php/data/audit-views.log';
$CSV_PATH = file_exists($ROOT . '/api-php/data/all_leads_5x.csv')
          ? $ROOT . '/api-php/data/all_leads_5x.csv'
          : $ROOT . '/api-php/data/santiago_leads.csv';

if (!file_exists($LOG_PATH)) jsonError('audit-views.log not found at ' . $LOG_PATH, 500);
if (!file_exists($CSV_PATH)) jsonError('leads CSV not found at ' . $CSV_PATH, 500);

$db = getDB();

/* ── 1. Resolve "Qualified" stage_id ───────────────────────────────── */
$stmt = $db->query("SELECT id, name FROM pipeline_stages WHERE name IN ('Qualified', 'Calificado') LIMIT 1");
$stage = $stmt->fetch();
$qualified_stage_id = $stage ? (int)$stage['id'] : 3; // fallback to canonical stage 3

/* ── 2. Load CSV into email→row map ────────────────────────────────── */
$leads = [];
$fp = fopen($CSV_PATH, 'r');
$headers = fgetcsv($fp);
$headers[0] = ltrim($headers[0], "\xEF\xBB\xBF");
$hMap = array_flip($headers);
$get = function (array $row, string $col) use ($hMap): string {
    return isset($hMap[$col]) ? trim((string)($row[$hMap[$col]] ?? '')) : '';
};
while ($row = fgetcsv($fp)) {
    if (count($row) !== count($headers)) continue;
    $e = strtolower($get($row, 'email'));
    if ($e === '' || strpos($e, '@') === false) continue;
    if (isset($leads[$e])) continue; // first wins (CSV may dupe)
    $leads[$e] = [
        'name'      => $get($row, 'name')    ?: $get($row, 'company'),
        'phone'     => $get($row, 'phone'),
        'company'   => $get($row, 'company'),
        'role'      => $get($row, 'role'),
        'city'      => $get($row, 'city'),
        'niche_key' => $get($row, 'niche_key'),
        'niche'     => $get($row, 'niche'),
        'website'   => $get($row, 'website'),
    ];
}
fclose($fp);

/* ── 3. Load unique clickers from log ──────────────────────────────── */
$clickers = [];
foreach (@file($LOG_PATH, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    $p = explode("\t", $line);
    $e = strtolower(trim($p[0] ?? ''));
    if ($e === '' || strpos($e, '@') === false) continue;
    if (isset($clickers[$e])) {
        $clickers[$e]['click_count']++;
        if (!empty($p[1])) $clickers[$e]['last_click_at'] = $p[1];
    } else {
        $clickers[$e] = [
            'email'         => $e,
            'first_click_at'=> $p[1] ?? '',
            'last_click_at' => $p[1] ?? '',
            'click_count'   => 1,
        ];
    }
}

/* ── 4. For each clicker: upsert contact, create deal if missing ──── */
$counts = [
    'unique_clickers'      => count($clickers),
    'contacts_inserted'    => 0,
    'contacts_existing'    => 0,
    'deals_created'        => 0,
    'deals_skipped_existing'=> 0,
    'wf_fired'             => 0,
    'enriched'             => 0,
    'no_csv_match'         => 0,
];
$created_deals = [];

foreach ($clickers as $email => $click) {
    $L = $leads[$email] ?? null;
    if ($L) $counts['enriched']++; else $counts['no_csv_match']++;

    /* ── Tier deal value by perceived enterprise size — Hilton/Accor/Marriott/Hyatt = $10k */
    $bigChain = false;
    $domain = strtolower(substr(strrchr($email, '@') ?: '', 1));
    foreach (['hilton.com','accor.com','marriott.com','hyatt.com','ihg.com','wyndham.com'] as $chain) {
        if ($domain === $chain) { $bigChain = true; break; }
    }
    $deal_value = $bigChain ? 10000 : 2500;
    $deal_prob  = $bigChain ? 50    : 35;
    $tags_for_ctx = $bigChain ? ['enterprise', 'mql', 'chile_clicker'] : ['mql', 'chile_clicker'];

    /* ── Upsert contact ──────────────────────────────────── */
    $contact_id = null;
    $existing = $db->prepare('SELECT id, phone, company, status FROM contacts WHERE email = ? LIMIT 1');
    $existing->execute([$email]);
    $row = $existing->fetch();

    if ($row) {
        $contact_id = (int)$row['id'];
        $counts['contacts_existing']++;
        /* Backfill niche/city in notes if we have CSV data + contact's notes is empty */
        if ($L && !$dry) {
            $upd = ['status' => 'prospect']; // upgrade lead → prospect since they showed intent
            $u = $db->prepare("UPDATE contacts SET status = ? WHERE id = ?");
            $u->execute([$upd['status'], $contact_id]);
        }
    } else {
        if (!$dry) {
            $name = $L['name'] ?? $email;
            $stmt = $db->prepare('INSERT INTO contacts (name, email, phone, company, role, status, value, last_contact, notes, segment)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $notesJson = json_encode([
                'city'      => $L['city']      ?? null,
                'niche_key' => $L['niche_key'] ?? null,
                'niche'     => $L['niche']     ?? null,
                'website'   => $L['website']   ?? null,
                'source'    => 'chile_campaign_2026_clicker',
                'click_count' => $click['click_count'],
                'first_click_at' => $click['first_click_at'],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt->execute([
                $name,
                $email,
                $L['phone'] ?? null,
                $L['company'] ?? null,
                $L['role'] ?? null,
                'prospect',
                $deal_value,
                date('Y-m-d'),
                $notesJson,
                'chile_' . ($L['city'] ?? 'unknown'),
            ]);
            $contact_id = (int)$db->lastInsertId();
        }
        $counts['contacts_inserted']++;
    }

    if ($dry) {
        $created_deals[] = [
            'email' => $email,
            'company' => $L['company'] ?? '?',
            'niche' => $L['niche'] ?? '?',
            'city' => $L['city'] ?? '?',
            'value' => $deal_value,
            'probability' => $deal_prob,
            'tier' => $bigChain ? 'enterprise' : 'standard',
            'click_count' => $click['click_count'],
        ];
        $counts['deals_created']++;
        continue;
    }

    /* ── Skip deal creation if a chile_clicker deal already exists for this contact ── */
    $existingDeal = $db->prepare("SELECT id FROM deals WHERE contact_id = ? AND source = 'cold_email_chile_clicked' LIMIT 1");
    $existingDeal->execute([$contact_id]);
    if ($existingDeal->fetch()) {
        $counts['deals_skipped_existing']++;
        continue;
    }

    /* ── Create deal at Qualified ─────────────────────────── */
    $deal_title = ($L['company'] ?? $email) . ' — Audit click follow-up';
    $insDeal = $db->prepare('INSERT INTO deals (title, company, value, contact_id, stage_id, probability, days_in_stage, source, notes, next_action, next_followup_date)
                             VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)');
    $dealNotes = "Auto-imported from Chile campaign click. Email opened audit link {$click['click_count']}× (last: {$click['last_click_at']}). " .
                 ($L ? "Niche: {$L['niche']}. City: {$L['city']}. Site: {$L['website']}." : 'No CSV match — investigate.') .
                 ($bigChain ? " ENTERPRISE chain ({$domain}) — escalate to Carlos." : '');
    $next_action = $bigChain
        ? 'Personal outreach from Carlos (enterprise tier)'
        : 'SDR call within 24h — they clicked the audit link';
    $insDeal->execute([
        $deal_title,
        $L['company'] ?? null,
        $deal_value,
        $contact_id,
        $qualified_stage_id,
        $deal_prob,
        'cold_email_chile_clicked',
        $dealNotes,
        $next_action,
        date('Y-m-d', strtotime('+1 day')),
    ]);
    $deal_id = (int)$db->lastInsertId();
    $counts['deals_created']++;

    /* ── Fire workflow chain (SL-03 qualified→proposal prep, SL-09 if >$10k) ── */
    $ctx = [
        'deal_id'        => $deal_id,
        'title'          => $deal_title,
        'company'        => $L['company'] ?? '',
        'value'          => $deal_value,
        'probability'    => $deal_prob,
        'source'         => 'cold_email_chile_clicked',
        'stage'          => 'Qualified',
        'contact_id'     => $contact_id,
        'email'          => $email,
        'name'           => $L['name'] ?? '',
        'first_name'     => preg_split('/\s+/', $L['name'] ?? '', 2)[0] ?? '',
        'phone'          => $L['phone'] ?? '',
        'contact_phone'  => $L['phone'] ?? '',
        'niche'          => $L['niche'] ?? '',
        'niche_key'      => $L['niche_key'] ?? '',
        'city'           => $L['city'] ?? '',
        'website'        => $L['website'] ?? '',
        'lang'           => 'es',
        'tags'           => $tags_for_ctx,
        'click_count'    => $click['click_count'],
        'first_click_at' => $click['first_click_at'],
        'last_click_at'  => $click['last_click_at'],
        'notes'          => $dealNotes,
    ];
    $r = wf_fire('deal_stage', ['stage' => 'Qualified'], $ctx);
    if (!empty($r['ok']) && !empty($r['count'])) $counts['wf_fired'] += (int)$r['count'];

    $created_deals[] = [
        'deal_id'     => $deal_id,
        'email'       => $email,
        'company'     => $L['company'] ?? '?',
        'niche'       => $L['niche'] ?? '?',
        'city'        => $L['city'] ?? '?',
        'value'       => $deal_value,
        'tier'        => $bigChain ? 'enterprise' : 'standard',
        'click_count' => $click['click_count'],
        'workflows_fired' => $r['count'] ?? 0,
    ];
}

jsonResponse([
    'ok'       => true,
    'mode'     => $dry ? 'dry_run' : 'apply',
    'log_file' => basename($LOG_PATH),
    'csv_file' => basename($CSV_PATH),
    'qualified_stage_id' => $qualified_stage_id,
    'counts'   => $counts,
    'deals'    => $created_deals,
]);

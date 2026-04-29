<?php
/**
 * Campaigns: create, list, build audience, send.
 *
 * POST /api/?r=campaigns                  → create draft
 * GET  /api/?r=campaigns[&id=N]           → list or fetch
 * PUT  /api/?r=campaigns&id=N             → update
 * DELETE /api/?r=campaigns&id=N           → delete
 * POST /api/?r=campaigns&id=N&action=preview → render merged subject/html for first contact
 * POST /api/?r=campaigns&id=N&action=send    → send to all matching contacts
 * POST /api/?r=campaigns&id=N&action=test    → send one test to body.to
 */

require_once __DIR__ . '/../lib/email_sender.php';
require_once __DIR__ . '/../lib/tenancy.php';

$db = getDB();
$action = $_GET['action'] ?? '';
$siteBase = 'https://netwebmedia.com';
$orgId = is_org_schema_applied() ? current_org_id() : null;
[$tWhereCamp, $tParamsCamp] = tenancy_where('c');
[$tWhereCampNoAlias, $tParamsCampNoAlias] = tenancy_where();

/**
 * Aggregate stats across all campaigns OR a single campaign (when $id given).
 * Pulls live numbers from `campaign_sends` so we don't drift from the
 * counters cached on `email_campaigns` (those are best-effort).
 */
if (!function_exists('pct')) {
    function pct($num, $den) {
        if (!$den) return 0.0;
        return round(($num / $den) * 100, 1);
    }
}

if ($action === 'stats' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // ---- Per-campaign rollups from campaign_sends ----
    $rollupSql = "
        SELECT
            c.id, c.name, c.status, c.sent_at, c.from_name, c.from_email,
            c.created_at,
            COALESCE(SUM(CASE WHEN s.status IN ('sent','opened','clicked') THEN 1 ELSE 0 END), 0) AS sent_count,
            COALESCE(SUM(CASE WHEN s.status = 'opened' OR s.opened_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS opened_count,
            COALESCE(SUM(CASE WHEN s.status = 'clicked' OR s.clicked_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked_count,
            COALESCE(SUM(CASE WHEN s.status = 'bounced' THEN 1 ELSE 0 END), 0) AS bounced_count,
            COALESCE(SUM(CASE WHEN s.status = 'unsubscribed' THEN 1 ELSE 0 END), 0) AS unsub_count,
            COALESCE(SUM(CASE WHEN s.status = 'failed' THEN 1 ELSE 0 END), 0) AS failed_count,
            COUNT(s.id) AS total_rows
        FROM email_campaigns c
        LEFT JOIN campaign_sends s ON s.campaign_id = c.id
    ";
    $rollupParams = [];
    if ($tWhereCamp) { $rollupSql .= ' WHERE ' . $tWhereCamp; $rollupParams = $tParamsCamp; }
    $rollupSql .= ' GROUP BY c.id ORDER BY c.created_at DESC';
    $rs = $db->prepare($rollupSql);
    $rs->execute($rollupParams);
    $rows = $rs->fetchAll();

    $campaigns = [];
    $overall = ['sent' => 0, 'opened' => 0, 'clicked' => 0, 'bounced' => 0, 'unsubscribed' => 0, 'failed' => 0];
    foreach ($rows as $r) {
        $sent = (int)$r['sent_count'];
        $opened = (int)$r['opened_count'];
        $clicked = (int)$r['clicked_count'];
        $bounced = (int)$r['bounced_count'];
        $unsub = (int)$r['unsub_count'];
        $failed = (int)$r['failed_count'];
        $overall['sent']         += $sent;
        $overall['opened']       += $opened;
        $overall['clicked']      += $clicked;
        $overall['bounced']      += $bounced;
        $overall['unsubscribed'] += $unsub;
        $overall['failed']       += $failed;
        $campaigns[] = [
            'id'      => (int)$r['id'],
            'name'    => $r['name'],
            'status'  => $r['status'],
            'sent_at' => $r['sent_at'],
            'created_at' => $r['created_at'],
            'from_name'  => $r['from_name'],
            'from_email' => $r['from_email'],
            'totals'  => [
                'sent'         => $sent,
                'opened'       => $opened,
                'clicked'      => $clicked,
                'bounced'      => $bounced,
                'unsubscribed' => $unsub,
                'failed'       => $failed,
            ],
            'rates'   => [
                'open_pct'  => pct($opened, $sent),
                'click_pct' => pct($clicked, $sent),
                'unsub_pct' => pct($unsub, $sent),
            ],
        ];
    }

    // ---- Single-campaign drilldown ----
    if ($id) {
        $detail = null;
        foreach ($campaigns as $c) { if ($c['id'] === (int)$id) { $detail = $c; break; } }
        if (!$detail) jsonError('Campaign not found', 404);

        // by_status: counts per status enum value
        $bs = $db->prepare("SELECT status, COUNT(*) AS n FROM campaign_sends WHERE campaign_id = ? GROUP BY status");
        $bs->execute([(int)$id]);
        $byStatus = [];
        foreach ($bs->fetchAll() as $row) { $byStatus[$row['status']] = (int)$row['n']; }

        // recent_activity: last 25 ordered by most recent activity timestamp
        $ra = $db->prepare("
            SELECT email, status, sent_at, opened_at, clicked_at
            FROM campaign_sends
            WHERE campaign_id = ?
            ORDER BY GREATEST(
                COALESCE(sent_at, '1970-01-01'),
                COALESCE(opened_at, '1970-01-01'),
                COALESCE(clicked_at, '1970-01-01')
            ) DESC
            LIMIT 25
        ");
        $ra->execute([(int)$id]);
        $recentActivity = $ra->fetchAll();

        // timeline: per-day rollup
        $tl = $db->prepare("
            SELECT
                DATE(sent_at) AS day,
                COUNT(*) AS sent_count,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened_count,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked_count
            FROM campaign_sends
            WHERE campaign_id = ? AND sent_at IS NOT NULL
            GROUP BY DATE(sent_at)
            ORDER BY day ASC
        ");
        $tl->execute([(int)$id]);
        $timeline = array_map(function ($r) {
            return [
                'date'          => $r['day'],
                'sent_count'    => (int)$r['sent_count'],
                'opened_count'  => (int)$r['opened_count'],
                'clicked_count' => (int)$r['clicked_count'],
            ];
        }, $tl->fetchAll());

        $detail['by_status']       = $byStatus;
        $detail['recent_activity'] = $recentActivity;
        $detail['timeline']        = $timeline;
        jsonResponse($detail);
    }

    jsonResponse([
        'campaigns' => $campaigns,
        'overall'   => $overall,
        'count'     => count($campaigns),
    ]);
}

function buildAudienceSQL(?string $filterJson): array {
    $filter = $filterJson ? json_decode($filterJson, true) : [];
    if (!is_array($filter)) $filter = [];
    $where = ["c.email IS NOT NULL", "c.email <> ''", "c.email LIKE '%@%.%'", "c.email NOT LIKE '% %'", "NOT EXISTS (SELECT 1 FROM unsubscribes u WHERE u.email = c.email)"];
    $params = [];
    if (!empty($filter['status'])) {
        $where[] = 'c.status = ?';
        $params[] = $filter['status'];
    }
    if (!empty($filter['niche'])) {
        $where[] = '(c.role LIKE ? OR c.notes LIKE ?)';
        $params[] = '%' . $filter['niche'] . '%';
        $params[] = '%"niche":"' . $filter['niche'] . '"%';
    }
    if (!empty($filter['city'])) {
        $where[] = '(c.role LIKE ? OR c.notes LIKE ?)';
        $params[] = '%' . $filter['city'] . '%';
        $params[] = '%"city":"' . $filter['city'] . '"%';
    }
    if (!empty($filter['ids']) && is_array($filter['ids'])) {
        $placeholders = implode(',', array_fill(0, count($filter['ids']), '?'));
        $where[] = "c.id IN ($placeholders)";
        $params = array_merge($params, $filter['ids']);
    }
    return [implode(' AND ', $where), $params];
}

// ---- Non-CRUD actions ----
if ($id && $action) {
    $sql = 'SELECT * FROM email_campaigns WHERE id = ?';
    $params = [$id];
    if ($tWhereCampNoAlias) { $sql .= ' AND ' . $tWhereCampNoAlias; $params = array_merge($params, $tParamsCampNoAlias); }
    $s = $db->prepare($sql);
    $s->execute($params);
    $camp = $s->fetch();
    if (!$camp) jsonError('Campaign not found', 404);

    // Resolve template if linked
    $subject = $camp['subject'];
    $html    = $camp['body_html'];
    if ($camp['template_id']) {
        $s = $db->prepare('SELECT subject, body_html FROM email_templates WHERE id = ?');
        $s->execute([$camp['template_id']]);
        $tpl = $s->fetch();
        if ($tpl) {
            $subject = $subject ?: $tpl['subject'];
            $html    = $html    ?: $tpl['body_html'];
        }
    }
    if (!$subject || !$html) jsonError('Campaign has no subject or body', 400);

    if ($action === 'preview') {
        [$whereSql, $params] = buildAudienceSQL($camp['audience_filter']);
        $stmt = $db->prepare("SELECT c.* FROM contacts c WHERE $whereSql LIMIT 1");
        $stmt->execute($params);
        $contact = $stmt->fetch();
        if (!$contact) jsonError('No contacts match the audience', 400);
        $token = bin2hex(random_bytes(16));
        $vars = buildContactVars($contact, $siteBase, $token);
        jsonResponse([
            'to'      => $contact['email'],
            'subject' => mergeTags($subject, $vars),
            'html'    => instrumentTracking(mergeTags($html, $vars), $siteBase, $token),
            'vars'    => $vars,
        ]);
    }

    if ($action === 'test') {
        $d = getInput();
        $to = $d['to'] ?? '';
        if (!$to) jsonError('body.to required');
        $sample = $d['sample'] ?? [];
        $notesMeta = [];
        if (!empty($sample['city']))    $notesMeta['city']    = $sample['city'];
        if (!empty($sample['niche']))   $notesMeta['niche']   = $sample['niche'];
        if (!empty($sample['website'])) $notesMeta['website'] = $sample['website'];
        if (!empty($sample['page']))    $notesMeta['page']    = $sample['page'];
        $contact = [
            'name'    => $sample['name']    ?? 'Test User',
            'company' => $sample['company'] ?? 'Test Co',
            'email'   => $to,
            'role'    => $sample['role']    ?? '',
            'notes'   => $notesMeta ? json_encode($notesMeta) : null,
        ];
        $token = bin2hex(random_bytes(16));
        $vars = buildContactVars($contact, $siteBase, $token);
        $mergedHtml = instrumentTracking(mergeTags($html, $vars), $siteBase, $token);
        $mergedSub  = mergeTags($subject, $vars);
        try {
            $fromName  = !empty($d['from_name'])  ? $d['from_name']  : $camp['from_name'];
            $fromEmail = !empty($d['from_email']) ? $d['from_email'] : $camp['from_email'];
            $res = mailSend([
                'to' => $to, 'subject' => $mergedSub, 'html' => $mergedHtml,
                'from_name' => $fromName, 'from_email' => $fromEmail,
                'reply_to' => 'hola@netwebmedia.com',
            ]);
            jsonResponse(['sent' => true, 'id' => $res['id'] ?? null]);
        } catch (Throwable $e) {
            jsonError('Send failed: ' . $e->getMessage(), 500);
        }
    }

    if ($action === 'send') {
        $d = getInput();
        $dryRun = !empty($d['dry_run']);
        $limit  = isset($d['limit']) ? (int)$d['limit'] : 0;

        [$whereSql, $params] = buildAudienceSQL($camp['audience_filter']);
        $sql = "SELECT c.* FROM contacts c WHERE $whereSql";
        if ($limit > 0) {
            $sql .= " LIMIT :__rl";
        }
        $stmt = $db->prepare($sql);
        foreach ($params as $i => $v) {
            $stmt->bindValue(is_int($i) ? $i + 1 : $i, $v);
        }
        if ($limit > 0) {
            $stmt->bindValue(':__rl', $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
        $contacts = $stmt->fetchAll();

        if ($dryRun) jsonResponse(['dry_run' => true, 'would_send' => count($contacts)]);

        $db->prepare("UPDATE email_campaigns SET status='sending' WHERE id = ?")->execute([$id]);

        $ok = 0; $fail = 0; $errors = [];
        foreach ($contacts as $c) {
            $token = bin2hex(random_bytes(16));
            $vars = buildContactVars($c, $siteBase, $token);
            $mergedSub  = mergeTags($subject, $vars);
            $mergedHtml = instrumentTracking(mergeTags($html, $vars), $siteBase, $token);

            $db->prepare('INSERT INTO campaign_sends (campaign_id, contact_id, email, token, status) VALUES (?, ?, ?, ?, ?)')
                ->execute([$id, $c['id'], $c['email'], $token, 'queued']);
            $sendId = (int)$db->lastInsertId();
            try {
                $res = mailSend([
                    'to' => $c['email'], 'subject' => $mergedSub, 'html' => $mergedHtml,
                    'from_name' => $camp['from_name'], 'from_email' => $camp['from_email'],
                ]);
                $db->prepare("UPDATE campaign_sends SET status='sent', sent_at=NOW(), provider_id=? WHERE id=?")
                    ->execute([$res['id'] ?? null, $sendId]);
                $ok++;
            } catch (Throwable $e) {
                $db->prepare("UPDATE campaign_sends SET status='failed', error=? WHERE id=?")
                    ->execute([substr($e->getMessage(), 0, 500), $sendId]);
                $errors[] = $c['email'] . ': ' . $e->getMessage();
                $fail++;
            }
            // Respect Resend rate limit: 10 req/sec
            usleep(120000);
        }
        $db->prepare("UPDATE email_campaigns SET status='sent', sent_at=NOW(), sent_count = sent_count + ? WHERE id = ?")
            ->execute([$ok, $id]);
        jsonResponse(['sent' => $ok, 'failed' => $fail, 'errors' => array_slice($errors, 0, 5)]);
    }

    jsonError('Unknown action: ' . $action);
}

// ---- CRUD ----
switch ($method) {
    case 'GET':
        if ($id) {
            $s = $db->prepare('SELECT * FROM email_campaigns WHERE id = ?');
            $s->execute([$id]);
            $row = $s->fetch();
            if (!$row) jsonError('Campaign not found', 404);
            jsonResponse($row);
        }
        jsonResponse($db->query('SELECT * FROM email_campaigns ORDER BY created_at DESC')->fetchAll());
        break;

    case 'POST':
        $d = getInput();
        if (empty($d['name'])) jsonError('name required');
        $audience = isset($d['audience_filter']) ? (is_array($d['audience_filter']) ? json_encode($d['audience_filter']) : $d['audience_filter']) : null;
        $s = $db->prepare('INSERT INTO email_campaigns (name, template_id, subject, body_html, from_name, from_email, audience_filter, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $s->execute([
            $d['name'],
            $d['template_id'] ?? null,
            $d['subject'] ?? null,
            $d['body_html'] ?? null,
            $d['from_name'] ?? 'NetWebMedia',
            $d['from_email'] ?? 'newsletter@netwebmedia.com',
            $audience,
            $d['status'] ?? 'draft',
            $d['scheduled_at'] ?? null,
        ]);
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        $d = getInput();
        $fields = []; $params = [];
        foreach (['name','template_id','subject','body_html','from_name','from_email','status','scheduled_at'] as $f) {
            if (array_key_exists($f, $d)) { $fields[] = "$f = ?"; $params[] = $d[$f]; }
        }
        if (array_key_exists('audience_filter', $d)) {
            $fields[] = 'audience_filter = ?';
            $params[] = is_array($d['audience_filter']) ? json_encode($d['audience_filter']) : $d['audience_filter'];
        }
        if (!$fields) jsonError('No fields to update');
        $params[] = $id;
        $db->prepare('UPDATE email_campaigns SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        jsonResponse(['updated' => true]);
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $db->prepare('DELETE FROM email_campaigns WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}

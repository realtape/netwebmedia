<?php
/**
 * cron_chile_campaign.php
 *
 * Sends the next 100 unsent Chilean contacts for a given campaign.
 * Run daily via cPanel Cron Jobs:
 *   php /home/webmed6/public_html/companies/crm-vanilla/api/cron_chile_campaign.php
 *
 * Usage:
 *   php cron_chile_campaign.php --campaign=<ID> [--dry-run]
 *
 * The script picks contacts where:
 *   - notes JSON contains "country":"CL" OR city in Chilean cities
 *   - email is not in unsubscribes
 *   - contact has NOT already been sent this campaign (not in campaign_sends for this campaign_id)
 * Sends exactly 100 (or fewer if the list is exhausted) and exits.
 */

define('BATCH_SIZE', 100);

// ── Bootstrap ────────────────────────────────────────────────────────────────
$cliArgs = [];
foreach (array_slice($argv ?? [], 1) as $arg) {
    if (preg_match('/^--(\w[\w-]*)(?:=(.*))?$/', $arg, $m)) {
        $cliArgs[$m[1]] = $m[2] ?? true;
    }
}

$campaignId = isset($cliArgs['campaign']) ? (int)$cliArgs['campaign'] : 0;
$dryRun     = isset($cliArgs['dry-run']);

if (!$campaignId) {
    fwrite(STDERR, "Usage: php cron_chile_campaign.php --campaign=<ID> [--dry-run]\n");
    exit(1);
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/email_sender.php';

$db = getDB();

// ── Load campaign ─────────────────────────────────────────────────────────────
$stmt = $db->prepare('SELECT * FROM email_campaigns WHERE id = ?');
$stmt->execute([$campaignId]);
$camp = $stmt->fetch();
if (!$camp) {
    fwrite(STDERR, "Campaign #$campaignId not found.\n");
    exit(1);
}

// Resolve subject + body (direct or via template)
$subject = $camp['subject'];
$html    = $camp['body_html'];
if ($camp['template_id']) {
    $t = $db->prepare('SELECT subject, body_html FROM email_templates WHERE id = ?');
    $t->execute([$camp['template_id']]);
    $tpl = $t->fetch();
    if ($tpl) {
        $subject = $subject ?: $tpl['subject'];
        $html    = $html    ?: $tpl['body_html'];
    }
}
if (!$subject || !$html) {
    fwrite(STDERR, "Campaign #$campaignId has no subject or body.\n");
    exit(1);
}

// ── Fetch next unsent Chilean contacts ───────────────────────────────────────
$chileanCities = ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Temuco',
                  'Viña del Mar', 'Rancagua', 'Talca', 'Arica', 'Iquique',
                  'Puerto Montt', 'La Serena', 'Coquimbo', 'Calama'];

$cityPlaceholders = implode(',', array_fill(0, count($chileanCities), '?'));

$sql = "
    SELECT c.*
    FROM contacts c
    WHERE c.email IS NOT NULL
      AND c.email <> ''
      AND NOT EXISTS (
          SELECT 1 FROM unsubscribes u WHERE u.email = c.email
      )
      AND NOT EXISTS (
          SELECT 1 FROM campaign_sends cs
          WHERE cs.campaign_id = ? AND cs.contact_id = c.id
      )
      AND (
          JSON_UNQUOTE(JSON_EXTRACT(c.notes, '$.country')) = 'CL'
          OR JSON_UNQUOTE(JSON_EXTRACT(c.notes, '$.city')) IN ($cityPlaceholders)
      )
    ORDER BY c.id ASC
    LIMIT " . BATCH_SIZE;

$params = array_merge([$campaignId], $chileanCities);
$stmt   = $db->prepare($sql);
$stmt->execute($params);
$contacts = $stmt->fetchAll();

$total = count($contacts);
$date  = date('Y-m-d H:i:s');

if ($total === 0) {
    echo "[$date] Campaign #$campaignId — No more unsent Chilean contacts. Campaign complete.\n";
    // Mark campaign sent if not already
    $db->prepare("UPDATE email_campaigns SET status='sent', sent_at=COALESCE(sent_at, NOW()) WHERE id = ? AND status != 'sent'")
       ->execute([$campaignId]);
    exit(0);
}

if ($dryRun) {
    echo "[$date] DRY RUN — Campaign #$campaignId — Would send to $total contacts:\n";
    foreach ($contacts as $c) {
        echo "  · [{$c['id']}] {$c['email']}\n";
    }
    exit(0);
}

// ── Mark campaign as sending ──────────────────────────────────────────────────
$db->prepare("UPDATE email_campaigns SET status='sending' WHERE id = ? AND status IN ('draft','scheduled')")
   ->execute([$campaignId]);

// ── Send batch ────────────────────────────────────────────────────────────────
$siteBase = 'https://netwebmedia.com';
$ok = 0; $fail = 0; $errors = [];

foreach ($contacts as $c) {
    $token      = bin2hex(random_bytes(16));
    $vars       = buildContactVars($c, $siteBase, $token);
    $mergedSub  = mergeTags($subject, $vars);
    $mergedHtml = instrumentTracking(mergeTags($html, $vars), $siteBase, $token);

    // Record as queued before attempting send
    $db->prepare('INSERT INTO campaign_sends (campaign_id, contact_id, email, token, status) VALUES (?, ?, ?, ?, ?)')
       ->execute([$campaignId, $c['id'], $c['email'], $token, 'queued']);
    $sendId = (int)$db->lastInsertId();

    try {
        $res = resendSend([
            'to'         => $c['email'],
            'subject'    => $mergedSub,
            'html'       => $mergedHtml,
            'from_name'  => $camp['from_name']  ?: 'Carlos Martinez | NetWebMedia',
            'from_email' => $camp['from_email'] ?: 'newsletter@netwebmedia.com',
            'reply_to'   => 'hola@netwebmedia.com',
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

    // Respect Resend rate limit (max 10 req/sec)
    usleep(120000); // 120ms between sends
}

// Update sent_count
$db->prepare("UPDATE email_campaigns SET sent_count = sent_count + ? WHERE id = ?")
   ->execute([$ok, $campaignId]);

// ── Report ────────────────────────────────────────────────────────────────────
echo "[$date] Campaign #$campaignId — Sent: $ok | Failed: $fail\n";
if ($errors) {
    foreach (array_slice($errors, 0, 5) as $e) {
        echo "  ERROR: $e\n";
    }
}
exit($fail > 0 ? 1 : 0);

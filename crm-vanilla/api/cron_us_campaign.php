<?php
/**
 * cron_us_campaign.php
 *
 * Daily cron: sends the next BATCH_SIZE unsent contacts for the US blast campaign.
 * Skips contacts already processed (any status) in this campaign.
 *
 * cPanel cron (daily at 8 AM Santiago / 11 AM UTC):
 *   0 11 * * * php /home/webmed6/public_html/crm-vanilla/api/cron_us_campaign.php >> /home/webmed6/logs/us_campaign.log 2>&1
 *
 * Manual run:
 *   php cron_us_campaign.php [--dry-run] [--limit=350]
 */

define('CAMPAIGN_ID',  38);
define('BATCH_SIZE',   350);
define('SITE_BASE',    'https://netwebmedia.com');

$dryRun = in_array('--dry-run', $argv ?? []);
$limit  = BATCH_SIZE;
foreach (($argv ?? []) as $arg) {
    if (preg_match('/^--limit=(\d+)$/', $arg, $m)) $limit = (int)$m[1];
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/email_sender.php';

$db   = getDB();
$date = date('Y-m-d H:i:s');

// ── Fetch campaign ─────────────────────────────────────────────────────────────
$camp = $db->prepare('SELECT * FROM email_campaigns WHERE id = ?');
$camp->execute([CAMPAIGN_ID]);
$camp = $camp->fetch();
if (!$camp) { echo "[$date] Campaign #" . CAMPAIGN_ID . " not found.\n"; exit(1); }

$subject = $camp['subject'];
$html    = $camp['body_html'];

// ── Fetch next unsent contacts ─────────────────────────────────────────────────
// Valid email + not unsubscribed + not already attempted in this campaign
$stmt = $db->prepare("
    SELECT c.*
    FROM contacts c
    WHERE c.email IS NOT NULL
      AND c.email <> ''
      AND c.email LIKE '%@%.%'
      AND c.email NOT LIKE '% %'
      AND NOT EXISTS (SELECT 1 FROM unsubscribes u WHERE u.email = c.email)
      AND NOT EXISTS (
          SELECT 1 FROM campaign_sends cs
          WHERE cs.campaign_id = ? AND cs.contact_id = c.id
      )
    ORDER BY c.id ASC
    LIMIT ?
");
$stmt->execute([CAMPAIGN_ID, $limit]);
$contacts = $stmt->fetchAll();
$total = count($contacts);

if ($total === 0) {
    echo "[$date] ✅ All contacts sent. Campaign #" . CAMPAIGN_ID . " complete.\n";
    $db->prepare("UPDATE email_campaigns SET status='sent', sent_at=COALESCE(sent_at,NOW()) WHERE id=?")
       ->execute([CAMPAIGN_ID]);
    exit(0);
}

echo "[$date] Sending to $total contacts (limit=$limit, dry_run=" . ($dryRun ? 'yes' : 'no') . ")\n";

if ($dryRun) {
    foreach ($contacts as $c) {
        echo "  · [{$c['id']}] {$c['name']} <{$c['email']}>\n";
    }
    exit(0);
}

// ── Send ───────────────────────────────────────────────────────────────────────
$ok = 0; $fail = 0;

foreach ($contacts as $c) {
    $token      = bin2hex(random_bytes(16));
    $vars       = buildContactVars($c, SITE_BASE, $token);
    $mergedSub  = mergeTags($subject, $vars);
    $mergedHtml = instrumentTracking(mergeTags($html, $vars), SITE_BASE, $token);

    $db->prepare('INSERT INTO campaign_sends (campaign_id, contact_id, email, token, status) VALUES (?,?,?,?,?)')
       ->execute([CAMPAIGN_ID, $c['id'], $c['email'], $token, 'queued']);
    $sendId = (int)$db->lastInsertId();

    try {
        $res = mailSend([
            'to'         => $c['email'],
            'subject'    => $mergedSub,
            'html'       => $mergedHtml,
            'from_name'  => $camp['from_name'],
            'from_email' => $camp['from_email'],
            'reply_to'   => 'hola@netwebmedia.com',
        ]);
        $db->prepare("UPDATE campaign_sends SET status='sent', sent_at=NOW(), provider_id=? WHERE id=?")
           ->execute([$res['id'] ?? null, $sendId]);
        $ok++;
    } catch (Throwable $e) {
        $db->prepare("UPDATE campaign_sends SET status='failed', error=? WHERE id=?")
           ->execute([substr($e->getMessage(), 0, 500), $sendId]);
        echo "  ✗ {$c['email']}: {$e->getMessage()}\n";
        $fail++;
    }

    usleep(120000); // 120 ms — ~8 emails/sec max
}

$db->prepare("UPDATE email_campaigns SET sent_count = sent_count + ? WHERE id=?")
   ->execute([$ok, CAMPAIGN_ID]);

echo "[$date] Done — Sent: $ok | Failed: $fail | Remaining: ~" . (65750 - $ok - $fail) . "\n";
exit($fail > 0 ? 1 : 0);

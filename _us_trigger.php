<?php
/**
 * One-shot: clears failed campaign_sends for campaign #38, then fires
 * cron_us_campaign.php in the background using the correct PHP CLI binary.
 * Self-deletes after running. v4 — phpmail provider, force-redeploy bump.
 */
require_once __DIR__ . '/crm-vanilla/api/config.php';

// ── 1. Clear any failed rows so cron can retry them ───────────────────────
$db  = getDB();
$del = $db->prepare("DELETE FROM campaign_sends WHERE campaign_id = 38 AND status = 'failed'");
$del->execute();
$deleted = $del->rowCount();

// ── 2. Find CLI PHP ───────────────────────────────────────────────────────
$php    = PHP_BINARY;
$phpDir = dirname($php);
$cli    = $phpDir . '/php';
if (!is_executable($cli)) $cli = $php;

// ── 3. Spawn cron in background ───────────────────────────────────────────
$script = '/home/webmed6/public_html/crm-vanilla/api/cron_us_campaign.php';
$log    = '/home/webmed6/logs/us_campaign.log';
file_put_contents($log, '');  // truncate old log

$cmd = "nohup {$cli} {$script} >> {$log} 2>&1 & echo \$!";
$pid = shell_exec($cmd);

echo json_encode([
    'deleted_failed' => $deleted,
    'triggered'      => true,
    'cli_used'       => $cli,
    'pid'            => (int)trim($pid ?? '0'),
    'log'            => $log,
]);
@unlink(__FILE__);

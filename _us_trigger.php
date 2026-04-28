<?php
/**
 * One-shot: fires cron_us_campaign.php in the background and returns immediately.
 * Self-deletes after spawning.
 */
$script = '/home/webmed6/public_html/crm-vanilla/api/cron_us_campaign.php';
$log    = '/home/webmed6/logs/us_campaign.log';
$cmd    = "nohup php {$script} >> {$log} 2>&1 & echo \$!";
$pid    = shell_exec($cmd);
echo json_encode(['triggered' => true, 'pid' => (int)trim($pid ?? '0'), 'log' => $log]);
@unlink(__FILE__);

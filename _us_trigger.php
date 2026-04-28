<?php
/**
 * One-shot: fires cron_us_campaign.php in the background using the
 * correct PHP CLI binary (PHP_BINARY = same PHP version as the site).
 * Self-deletes after spawning.
 */
$php    = PHP_BINARY;  // e.g. /opt/cpanel/ea-php82/root/usr/bin/php-cgi → but we need -cli
// On EA4 cPanel the CGI binary lives alongside a 'php' CLI binary in the same dir
$phpDir = dirname($php);
$cli    = $phpDir . '/php';               // /opt/cpanel/ea-phpXX/root/usr/bin/php
if (!is_executable($cli)) $cli = $php;   // fallback to whatever PHP_BINARY is

$script = '/home/webmed6/public_html/crm-vanilla/api/cron_us_campaign.php';
$log    = '/home/webmed6/logs/us_campaign.log';

// Truncate old log so we can read a clean result
file_put_contents($log, '');

$cmd = "nohup {$cli} {$script} >> {$log} 2>&1 & echo \$!";
$pid = shell_exec($cmd);

echo json_encode([
    'triggered' => true,
    'php_binary' => $php,
    'cli_used'  => $cli,
    'pid'       => (int)trim($pid ?? '0'),
    'log'       => $log,
]);
@unlink(__FILE__);

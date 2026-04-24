<?php
if (($_GET['token'] ?? '') !== 'nwm-chile-2026') { http_response_code(403); exit; }
header('Content-Type: text/plain; charset=utf-8');

$cronLine = '0 14 * * * php /home/webmed6/public_html/companies/crm-vanilla/api/send_chile_now.php >> /home/webmed6/logs/chile_campaign.log 2>&1';

// Get existing crontab
exec('crontab -l 2>/dev/null', $existing, $ret);

// Check if already added
foreach ($existing as $line) {
    if (strpos($line, 'send_chile_now.php') !== false) {
        echo "Cron already set:\n$line\n";
        @unlink(__FILE__);
        exit;
    }
}

// Add new line and write back
$existing[] = $cronLine;
$newCrontab = implode("\n", $existing) . "\n";
$tmpFile = tempnam(sys_get_temp_dir(), 'cron_');
file_put_contents($tmpFile, $newCrontab);
exec("crontab $tmpFile", $out, $exitCode);
unlink($tmpFile);

if ($exitCode === 0) {
    echo "Cron job added successfully!\n";
    echo "Schedule: every day at 14:00 UTC (10:00 AM Santiago)\n";
    echo "Command: $cronLine\n";
    exec('crontab -l', $verify);
    echo "\nFull crontab now:\n" . implode("\n", $verify) . "\n";
} else {
    echo "Failed to set cron (exit code $exitCode). exec() may be disabled.\n";
}
@unlink(__FILE__);

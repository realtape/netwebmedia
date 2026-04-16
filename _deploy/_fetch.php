<?php
// One-shot bootstrap: create _cron/, fetch the two files from temp.sh.
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
$root = realpath(__DIR__ . '/..');
$cron = $root . '/_cron';
if (!is_dir($cron)) mkdir($cron, 0755, true);

function grab($url, $dest, $UA) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => $UA,
        CURLOPT_TIMEOUT => 60,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code === 200 && $body !== false) {
        file_put_contents($dest, $body);
        return strlen($body);
    }
    return "ERR $code";
}

$r1 = grab('https://temp.sh/nCfVO/publish-daily.php', $cron . '/publish-daily.php', $UA);
$r2 = grab('https://temp.sh/xysFr/queue-tomorrow.json', $cron . '/queue.json', $UA);

echo "cron_dir=$cron\npublish=$r1\nqueue=$r2\n";
echo "php=" . (file_exists($cron.'/publish-daily.php') ? filesize($cron.'/publish-daily.php') : 'no') . "\n";
echo "json=" . (file_exists($cron.'/queue.json') ? filesize($cron.'/queue.json') : 'no') . "\n";

@unlink(__FILE__);

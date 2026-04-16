<?php
/* v11 bootstrap: fetches the v11 zip and extracts into /public_html. Self-deletes. */
header('Content-Type: text/plain');

$url         = 'https://temp.sh/hDQbN/netwebmedia-update-v11.zip';
$dest_zip    = __DIR__ . '/update-v11.zip';
$extract_to  = __DIR__;

echo "v11 bootstrap\nurl: $url\nextract_to: $extract_to\n";

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_POST          => true,
  CURLOPT_POSTFIELDS    => '',
  CURLOPT_TIMEOUT       => 60,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_USERAGENT     => 'Mozilla/5.0 (deploy-bot)',
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo "http: $code\n";
if ($err) echo "err: $err\n";
echo "bytes: " . strlen($body) . "\n";

if ($code !== 200 || strlen($body) < 1000) { echo "ABORT: fetch failed\n"; exit; }
if (substr($body, 0, 2) !== "PK") { echo "ABORT: not a zip\nhead: " . bin2hex(substr($body, 0, 8)) . "\n"; exit; }

file_put_contents($dest_zip, $body);
echo "wrote zip: " . filesize($dest_zip) . " bytes\n";

$zip = new ZipArchive();
if ($zip->open($dest_zip) !== true) { echo "ABORT: zip open failed\n"; exit; }
$count = $zip->numFiles;
echo "zip entries: $count\n";
for ($i = 0; $i < $count; $i++) echo "  + " . $zip->getNameIndex($i) . "\n";
$zip->extractTo($extract_to);
$zip->close();
echo "EXTRACTED OK\n";
@unlink($dest_zip);

$check = [
  $extract_to . '/api/lib/mailer.php',
  $extract_to . '/api/lib/workflows.php',
  $extract_to . '/api/routes/cron.php',
  $extract_to . '/api/routes/workflows.php',
  $extract_to . '/assets/nwm-forms.js',
];
foreach ($check as $f) echo (file_exists($f) ? '  OK   ' : '  MISS ') . $f . "\n";

@unlink(__FILE__);
echo "DONE (self-deleted)\n";
echo "\nNext: hit https://netwebmedia.com/api/migrate.php?token=<first-16-chars-of-jwt_secret> to add new tables\n";

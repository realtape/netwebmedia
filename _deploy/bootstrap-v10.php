<?php
/* v10 bootstrap: fetch zip from temp.sh (POST), extract into public_html, self-delete.
   Deploys:
     - /public_html/api/        (PHP REST API + migrate.php + seed-data.json)
     - /public_html/login.html
     - /public_html/register.html
     - /public_html/cms/js/api-client.js, cms/js/cms.js
     - /public_html/app/js/api-client.js, app/js/app.js
*/
header('Content-Type: text/plain');

// REPLACE THIS URL after uploading netwebmedia-update-v10.zip to temp.sh
$url         = 'https://temp.sh/vooGt/netwebmedia-update-v10.zip';
$dest_zip    = __DIR__ . '/update-v10.zip';
$extract_to  = __DIR__;   // should be /home/webmed6/public_html

echo "v10 bootstrap\n";
echo "url: $url\n";
echo "extract_to: $extract_to\n";

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
if (substr($body, 0, 2) !== "PK") {
  echo "ABORT: not a zip\n";
  echo "head: " . bin2hex(substr($body, 0, 8)) . "\n";
  exit;
}

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

/* Quick sanity check */
$check = [
  $extract_to . '/api/index.php',
  $extract_to . '/api/migrate.php',
  $extract_to . '/login.html',
];
foreach ($check as $f) echo (file_exists($f) ? '  OK   ' : '  MISS ') . $f . "\n";

@unlink(__FILE__);
echo "DONE (self-deleted)\n";
echo "\nNext: hit https://netwebmedia.com/api/migrate.php?token=<first-16-chars-of-jwt_secret>\n";

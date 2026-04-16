<?php
/* v8 bootstrap: fetch zip from temp.sh (POST), extract to public_html, self-delete */
header('Content-Type: text/plain');
$url = 'https://temp.sh/RXoql/netwebmedia-update-v8.zip';
$dest_zip = __DIR__ . '/update-v8.zip';
$extract_to = __DIR__;

echo "v8 bootstrap\n";
echo "url: $url\n";
echo "extract_to: $extract_to\n";

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => '',
  CURLOPT_TIMEOUT => 60,
  CURLOPT_SSL_VERIFYPEER => false,
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "http: $code\n";
if ($err) echo "err: $err\n";
echo "bytes: " . strlen($body) . "\n";

if ($code !== 200 || strlen($body) < 1000) {
  echo "ABORT: fetch failed\n";
  exit;
}

/* Verify it's a zip (PK header) */
if (substr($body, 0, 2) !== "PK") {
  echo "ABORT: not a zip (first bytes: " . bin2hex(substr($body, 0, 4)) . ")\n";
  echo "sample: " . substr($body, 0, 200) . "\n";
  exit;
}

file_put_contents($dest_zip, $body);
echo "wrote zip: " . filesize($dest_zip) . " bytes\n";

$zip = new ZipArchive();
if ($zip->open($dest_zip) === true) {
  $count = $zip->numFiles;
  echo "zip files: $count\n";
  for ($i = 0; $i < $count; $i++) {
    $name = $zip->getNameIndex($i);
    echo "  + $name\n";
  }
  $zip->extractTo($extract_to);
  $zip->close();
  echo "EXTRACTED OK\n";
  @unlink($dest_zip);
} else {
  echo "ABORT: zip open failed\n";
  exit;
}

@unlink(__FILE__);
echo "DONE (self-deleted)\n";

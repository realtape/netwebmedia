<?php
// CMO price update bootstrap - fetches ZIP from temp.sh, extracts, runs fix.
@set_time_limit(0);
@ini_set('memory_limit', '256M');
header('Content-Type: application/json');

$url  = 'https://temp.sh/wuUdP/netwebmedia-cmo-update.zip';
$root = __DIR__;
$tmp  = $root . '/_cmo_update.zip';

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_TIMEOUT        => 60,
  CURLOPT_SSL_VERIFYPEER => false,
]);
$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$data || $code !== 200) {
  echo json_encode(['err' => 'download_failed', 'http' => $code]);
  @unlink(__FILE__);
  exit;
}

file_put_contents($tmp, $data);
$zip = new ZipArchive();
if ($zip->open($tmp) !== true) {
  echo json_encode(['err' => 'bad_zip', 'size' => strlen($data)]);
  @unlink($tmp); @unlink(__FILE__);
  exit;
}

$n = $zip->numFiles;
$zip->extractTo($root);
$zip->close();
@unlink($tmp);

// Opcache invalidate billing.php
$billing = $root . '/api/routes/billing.php';
if (file_exists($billing)) {
  if (function_exists('opcache_invalidate')) @opcache_invalidate($billing, true);
  @touch($billing);
}

// Run company page fix inline
$companies = $root . '/companies';
$scanned = 0; $updated = 0; $examples = [];
if (is_dir($companies)) {
  $old = 'Fractional CMO tier at $1,997/mo available.';
  $new = 'AI Fractional CMO from <strong>$249/mo Starter &middot; $999/mo Growth &middot; $1,999/mo Scale</strong>.';
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($companies));
  foreach ($it as $f) {
    if (!$f->isFile() || substr($f->getFilename(), -5) !== '.html') continue;
    $scanned++;
    $src = file_get_contents($f->getPathname());
    if ($src === false || strpos($src, $old) === false) continue;
    file_put_contents($f->getPathname(), str_replace($old, $new, $src));
    $updated++;
    if (count($examples) < 5) $examples[] = str_replace($root, '', $f->getPathname());
  }
}

echo json_encode([
  'ok'       => true,
  'extracted'=> $n,
  'billing'  => file_exists($billing) ? 'touched' : 'missing',
  'companies'=> ['scanned' => $scanned, 'updated' => $updated, 'examples' => $examples],
]);
@unlink(__FILE__);

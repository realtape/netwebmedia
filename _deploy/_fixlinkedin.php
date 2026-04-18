<?php
@set_time_limit(0);
$root = '/home/webmed6/public_html';
$old = 'linkedin.com/company/netwebmedia';
$new = 'linkedin.com/in/netwebmedia';

$scanned = 0; $updated = 0; $examples = [];
$exclude = ['/_deploy','/node_modules','/vendor','/logs','/video-out'];

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  $path = $f->getPathname();
  foreach ($exclude as $e) if (strpos($path, $e) !== false) continue 2;
  $ext = strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION));
  if (!in_array($ext, ['html','js','php','json','xml'])) continue;
  $src = @file_get_contents($path);
  if (!$src || strpos($src, $old) === false) continue;
  $scanned++;
  $new_src = str_replace($old, $new, $src);
  if ($new_src !== $src) {
    file_put_contents($path, $new_src);
    $updated++;
    if (count($examples) < 10) $examples[] = str_replace('/home/webmed6/public_html','',$path);
  }
}

header('Content-Type: application/json');
echo json_encode(['scanned'=>$scanned,'updated'=>$updated,'examples'=>$examples,'from'=>$old,'to'=>$new], JSON_PRETTY_PRINT);
@unlink(__FILE__);

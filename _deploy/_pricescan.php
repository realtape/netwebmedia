<?php
@set_time_limit(0);
$root = '/home/webmed6/public_html';
$hits = [];
$patterns = [
  '/\$[0-9\.,]+\s*CLP/iu',
  '/CLP\s*\/\s*mes/iu',
  '/desde\s+\$[0-9\.,]+/iu',
];
$exclude = ['/_deploy','/node_modules','/vendor','/companies','/demo'];

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  $ext = strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION));
  if (!in_array($ext, ['html','js','php'])) continue;
  $path = $f->getPathname();
  foreach ($exclude as $e) if (strpos($path, $e) !== false) continue 2;
  $src = file_get_contents($path);
  if (!$src) continue;
  foreach ($patterns as $p) {
    if (preg_match_all($p, $src, $m)) {
      $rel = str_replace('/home/webmed6/public_html','',$path);
      $hits[$rel] = array_slice(array_unique($m[0]), 0, 3);
      break;
    }
  }
  if (count($hits) > 30) break;
}
header('Content-Type: application/json');
echo json_encode($hits, JSON_PRETTY_PRINT);
@unlink(__FILE__);

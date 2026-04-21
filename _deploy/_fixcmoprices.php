<?php
// One-shot: update CMO prices in all company audit pages (Chile + USA)
@set_time_limit(0);
$root = '/home/webmed6/public_html/companies';
if (!is_dir($root)) { header('Content-Type: application/json'); echo json_encode(['err'=>'no_companies_dir']); @unlink(__FILE__); exit; }

$old = 'Fractional CMO tier at $1,997/mo available.';
$new = 'AI Fractional CMO from <strong>$249/mo Starter &middot; $999/mo Growth &middot; $1,999/mo Scale</strong>.';

$scanned = 0; $updated = 0; $examples = [];

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  if (substr($f->getFilename(), -5) !== '.html') continue;
  $scanned++;
  $path = $f->getPathname();
  $src = file_get_contents($path);
  if ($src === false) continue;
  if (strpos($src, $old) === false) continue;
  $updated_src = str_replace($old, $new, $src);
  if ($updated_src !== $src) {
    file_put_contents($path, $updated_src);
    $updated++;
    if (count($examples) < 5) $examples[] = str_replace('/home/webmed6/public_html', '', $path);
  }
}

header('Content-Type: application/json');
echo json_encode(['ok'=>true, 'scanned'=>$scanned, 'updated'=>$updated, 'examples'=>$examples]);
@unlink(__FILE__);

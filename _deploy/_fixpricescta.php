<?php
@set_time_limit(0);
$root = '/home/webmed6/public_html/companies';
if (!is_dir($root)) { echo json_encode(['err'=>'no_companies_dir']); exit; }

$scanned = 0; $updated = 0; $examples = [];

// Old CTA variants we want to replace
$oldPatterns = [
  // With or without thin space, HTML entities, etc.
  '/Ver\s+planes\s+desde\s+\$47[\.,]?000\s+CLP\s*\/\s*mes/iu',
  '/Ver\s+planes\s+desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu',
  '/desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu',
];

$newCta = 'Ver planes desde $39 USD/mes (bundles desde $1,295 USD/mes)';
$newShort = 'desde $39 USD/mes';

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  if (substr($f->getFilename(), -5) !== '.html') continue;
  $scanned++;
  $path = $f->getPathname();
  $src = file_get_contents($path);
  if (!$src) continue;
  $orig = $src;
  // Specific long CTA first
  $src = preg_replace('/Ver\s+planes\s+desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', $newCta, $src);
  // Any other CLP/mes fragments
  $src = preg_replace('/desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', $newShort, $src);
  $src = preg_replace('/\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', '$39 USD/mes', $src);
  if ($src !== $orig) {
    file_put_contents($path, $src);
    $updated++;
    if (count($examples) < 3) $examples[] = str_replace('/home/webmed6/public_html','',$path);
  }
}

header('Content-Type: application/json');
echo json_encode(['scanned'=>$scanned, 'updated'=>$updated, 'examples'=>$examples]);
@unlink(__FILE__);

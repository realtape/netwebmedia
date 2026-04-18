<?php
@set_time_limit(0);
$roots = [
  '/home/webmed6/public_html',  // catches / + /cms + /crm + /companies
];
$scanned=0; $updated=0; $examples=[];
$exclude = ['/_deploy','/node_modules','/vendor'];

foreach ($roots as $root) {
  if (!is_dir($root)) continue;
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));
  foreach ($it as $f) {
    if (!$f->isFile()) continue;
    $path = $f->getPathname();
    foreach ($exclude as $e) if (strpos($path, $e) !== false) continue 2;
    $ext = strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION));
    if (!in_array($ext, ['html','js','php'])) continue;
    $src = file_get_contents($path);
    if (!$src) continue;
    $orig = $src;

    // Don't touch our actual pricing page, billing.php, or generator sources
    if (strpos($path, 'api/routes/billing.php') !== false) continue;

    // Replace $47.000 CLP / $47,000 CLP / any similar CLP price string
    $src = preg_replace('/\$[0-9][0-9\.\,]*\s*CLP\s*\/\s*mes/iu', '\$39 USD/mes', $src);
    $src = preg_replace('/\$[0-9][0-9\.\,]*\s*CLP/iu', '\$39 USD', $src);

    if ($src !== $orig) {
      file_put_contents($path, $src);
      $updated++;
      if (count($examples) < 10) $examples[] = str_replace('/home/webmed6/public_html','',$path);
    }
    $scanned++;
  }
}
header('Content-Type: application/json');
echo json_encode(['scanned'=>$scanned, 'updated'=>$updated, 'examples'=>$examples], JSON_PRETTY_PRINT);
@unlink(__FILE__);

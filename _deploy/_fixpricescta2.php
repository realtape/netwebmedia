<?php
@set_time_limit(0);
$root = '/home/webmed6/public_html/companies';
if (!is_dir($root)) { echo json_encode(['err'=>'no_companies_dir']); exit; }

$scanned = 0; $updated = 0; $examples = [];

// Escape dollar signs so preg_replace doesn't treat $1,295 as backreference.
// Using \$ in the replacement string is the correct way.
$newCta   = 'Ver planes desde \$39 USD/mes (bundles desde \$1,295 USD/mes)';
$newShort = 'desde \$39 USD/mes';
$newAmt   = '\$39 USD/mes';

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  if (substr($f->getFilename(), -5) !== '.html') continue;
  $scanned++;
  $path = $f->getPathname();
  $src = file_get_contents($path);
  if (!$src) continue;
  $orig = $src;

  // Fix the previously-broken CTAs (missing $ signs and commas eaten)
  // "Ver planes desde  USD/mes (bundles desde ,295 USD/mes)"
  $src = preg_replace(
    '/Ver\s+planes\s+desde\s+USD\/mes\s*\(bundles\s+desde\s+,295\s+USD\/mes\)/iu',
    $newCta,
    $src
  );
  // "desde  USD/mes"
  $src = preg_replace('/desde\s+USD\/mes(?!\))/iu', $newShort, $src);
  // " USD/mes" standalone (shouldn't need much — defensive)
  // skip

  // Now also handle any remaining original CLP strings (in case we re-run on fresh ones)
  $src = preg_replace('/Ver\s+planes\s+desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', $newCta, $src);
  $src = preg_replace('/desde\s+\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', $newShort, $src);
  $src = preg_replace('/\$[0-9\.,]+\s+CLP\s*\/\s*mes/iu', $newAmt, $src);

  if ($src !== $orig) {
    file_put_contents($path, $src);
    $updated++;
    if (count($examples) < 3) $examples[] = str_replace('/home/webmed6/public_html','',$path);
  }
}

header('Content-Type: application/json');
echo json_encode(['scanned'=>$scanned, 'updated'=>$updated, 'examples'=>$examples]);
@unlink(__FILE__);

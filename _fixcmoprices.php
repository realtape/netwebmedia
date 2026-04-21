<?php
// One-shot: update CMO prices in all company audit pages (Chile + USA).
// Copied to /public_html/ so it runs with webmed6's full tree access.
// Scans /home/webmed6/public_html/companies/**/*.html.
// Self-deletes after execution. Safe to re-run — idempotent.
//
// Updated 2026-04-21 by engineering-lead:
//   - New tier prices: $249 Lite / $999 Growth / $2,499 Scale
//   - Added second-pass patterns so a prior run's output doesn't break reruns
//   - Added ?dry=1 mode for a preview

@set_time_limit(0);
header('Content-Type: application/json');

$root = '/home/webmed6/public_html/companies';
if (!is_dir($root)) {
  echo json_encode(['err' => 'no_companies_dir', 'root' => $root]);
  @unlink(__FILE__);
  exit;
}

$dry = !empty($_GET['dry']);

// Replacements, ordered. Each entry is [needle, replacement].
// We intentionally match the FULL sentence so we don't corrupt
// competitor-quote lines that mention "$1,997" as a HubSpot price.
$replacements = [
  [
    'Fractional CMO tier at $1,997/mo available.',
    'AI Fractional CMO from <strong>$249/mo Lite &middot; $999/mo Growth &middot; $2,499/mo Scale</strong>.',
  ],
  // If a prior script already switched the sentence to a stale "$1,999 Scale" version,
  // repair it on the rerun rather than leaving bad data behind.
  [
    'AI Fractional CMO from <strong>$249/mo Lite &middot; $999/mo Growth &middot; $1,999/mo Scale</strong>.',
    'AI Fractional CMO from <strong>$249/mo Lite &middot; $999/mo Growth &middot; $2,499/mo Scale</strong>.',
  ],
];

$scanned = 0;
$updated = 0;
$examples = [];
$errors = [];

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  if (substr($f->getFilename(), -5) !== '.html') continue;

  $scanned++;
  $path = $f->getPathname();
  $src = file_get_contents($path);
  if ($src === false) { $errors[] = ['read_fail' => $path]; continue; }

  $new = $src;
  foreach ($replacements as $pair) {
    [$old, $repl] = $pair;
    if (strpos($new, $old) !== false) {
      $new = str_replace($old, $repl, $new);
    }
  }

  if ($new !== $src) {
    if (!$dry) {
      $ok = file_put_contents($path, $new);
      if ($ok === false) { $errors[] = ['write_fail' => $path]; continue; }
    }
    $updated++;
    if (count($examples) < 5) {
      $examples[] = str_replace('/home/webmed6/public_html', '', $path);
    }
  }
}

echo json_encode([
  'ok'       => true,
  'dry_run'  => $dry,
  'scanned'  => $scanned,
  'updated'  => $updated,
  'examples' => $examples,
  'errors'   => $errors,
  'ts'       => date('c'),
], JSON_UNESCAPED_SLASHES);

// Self-destruct on real runs only — keep the script for retries during dry-run
if (!$dry) { @unlink(__FILE__); }

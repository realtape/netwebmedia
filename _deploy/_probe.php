<?php
// Find which billing.php is actually served by the /api/ route
$candidates = [
  '/home/webmed6/public_html/api-php/routes/billing.php',
  '/home/webmed6/public_html/api/routes/billing.php',
  '/home/webmed6/api-php/routes/billing.php',
];
$out = [];
foreach ($candidates as $p) {
  if (file_exists($p)) {
    $out[$p] = ['mtime'=>filemtime($p), 'size'=>filesize($p), 'has_agent_starter'=>strpos(file_get_contents($p),'agent_starter')!==false];
  } else {
    $out[$p] = 'missing';
  }
}
// also check the index.php api entry
$idx = ['/home/webmed6/public_html/api-php/index.php','/home/webmed6/public_html/api/index.php'];
foreach ($idx as $p) { $out['idx:'.$p] = file_exists($p) ? filemtime($p) : 'missing'; }
header('Content-Type: application/json');
echo json_encode($out, JSON_PRETTY_PRINT);
@unlink(__FILE__);

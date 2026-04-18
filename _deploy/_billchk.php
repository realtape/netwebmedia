<?php
header('Content-Type: application/json');
$paths = [
  '/home/webmed6/public_html/api/routes/billing.php',
  '/home/webmed6/public_html/api-php/routes/billing.php',
];
$out = [];
foreach ($paths as $p) {
  if (!file_exists($p)) { $out[$p] = 'MISSING'; continue; }
  $c = file_get_contents($p);
  preg_match_all("/'code'\s*(?:=>|=>)\s*'([a-z_]+)'/", $c, $m);
  $out[$p] = [
    'size' => filesize($p),
    'mtime' => date('c', filemtime($p)),
    'codes_found' => $m[1],
    'count' => count($m[1]),
  ];
}
echo json_encode($out, JSON_PRETTY_PRINT);
@unlink(__FILE__);

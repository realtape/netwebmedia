<?php
header('Content-Type: application/json');
$root = '/home/webmed6/public_html';
$paths = [
  'js/main.js',
  'assets/nwm-i18n.js',
  'privacy.html',
  'terms.html',
  'pricing-onepager.html',
  'services.html',
  'index.html',
];
$out = [];
foreach ($paths as $p) {
  $abs = $root . '/' . $p;
  if (!file_exists($abs)) { $out[$p] = 'MISSING'; continue; }
  $content = file_get_contents($abs);
  $out[$p] = [
    'size' => filesize($abs),
    'mtime' => date('c', filemtime($abs)),
    'has_whatsapp' => strpos($content, 'initWhatsAppWidget') !== false || strpos($content, 'nwm-wa-widget') !== false,
    'has_privacy_link' => strpos($content, '/privacy.html') !== false,
    'has_CLP' => preg_match('/CLP\s*\/\s*mes|\$[0-9][0-9\.,]*\s*CLP/iu', $content) ? true : false,
  ];
}
echo json_encode($out, JSON_PRETTY_PRINT);
@unlink(__FILE__);

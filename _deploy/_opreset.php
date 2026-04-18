<?php
@set_time_limit(30);
header('Content-Type: application/json');

$out = [
  'opcache_enabled' => ini_get('opcache.enable'),
  'reset' => null, 'invalidated' => [],
];
if (function_exists('opcache_reset')) {
  $out['reset'] = opcache_reset() ? 'ok' : 'failed';
}
$files = [
  '/home/webmed6/public_html/api/routes/billing.php',
  '/home/webmed6/public_html/api/index.php',
];
foreach ($files as $f) {
  if (function_exists('opcache_invalidate') && file_exists($f)) {
    $out['invalidated'][$f] = opcache_invalidate($f, true) ? 'ok' : 'failed';
    @touch($f);
  }
}
echo json_encode($out, JSON_PRETTY_PRINT);
@unlink(__FILE__);

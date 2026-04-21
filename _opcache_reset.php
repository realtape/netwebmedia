<?php
/* One-shot OPcache reset + self-destruct.
   Deployed to https://netwebmedia.com/_opcache_reset.php?k=<KEY>
   - Requires a matching key from config.local.php OR env to prevent abuse.
   - Clears PHP's OPcache so freshly-FTP'd PHP is picked up.
   - Deletes this file after running.
   - Safe to leave in repo; only useful when deployed and hit once.
*/

// Allow either a static key in config or a short-window public key tied to today's date.
$providedKey = $_GET['k'] ?? '';
$today = gmdate('Y-m-d');
$staticPublicKey = 'nwm-opcache-' . $today;  // valid 00:00 UTC → 23:59 UTC that day

$authorized = false;
if (hash_equals($staticPublicKey, $providedKey)) $authorized = true;

// Try to load config key too (belt + suspenders)
$cfgPath = '/home/webmed6/.netwebmedia-config.php';
if (!$authorized && is_file($cfgPath)) {
  $cfg = @include $cfgPath;
  if (is_array($cfg) && !empty($cfg['opcache_reset_key']) && hash_equals((string)$cfg['opcache_reset_key'], $providedKey)) {
    $authorized = true;
  }
}

header('Content-Type: application/json; charset=utf-8');

if (!$authorized) {
  http_response_code(403);
  echo json_encode([
    'ok' => false,
    'error' => 'forbidden',
    'hint' => 'Use a key matching today (UTC): nwm-opcache-YYYY-MM-DD, or opcache_reset_key from config.'
  ]);
  exit;
}

$result = [
  'ok' => true,
  'php_version' => PHP_VERSION,
  'opcache_enabled' => function_exists('opcache_get_status'),
  'steps' => [],
];

if (function_exists('opcache_reset')) {
  $ok = @opcache_reset();
  $result['steps'][] = 'opcache_reset: ' . ($ok ? 'true' : 'false');
} else {
  $result['steps'][] = 'opcache_reset: unavailable';
}

// Invalidate specific hot files just in case
$files = [
  __DIR__ . '/api-php/index.php',
  __DIR__ . '/api-php/routes/public.php',
  __DIR__ . '/api-php/routes/public-chat.php',
  __DIR__ . '/api-php/routes/nwmai.php',
  __DIR__ . '/api-php/lib/knowledge-base.php',
  __DIR__ . '/api-php/lib/whatsapp-knowledge.php',
  __DIR__ . '/api-php/lib/cmo.php',
];
foreach ($files as $f) {
  if (is_file($f) && function_exists('opcache_invalidate')) {
    $ok = @opcache_invalidate($f, true);
    $result['steps'][] = 'invalidate ' . basename($f) . ': ' . ($ok ? 'true' : 'false');
  }
}

// Self-delete so it can't be re-run
$self = __FILE__;
$result['self_deleted'] = @unlink($self);

echo json_encode($result, JSON_PRETTY_PRINT);

<?php
/* One-shot OPcache reset + self-destruct.
   Deployed to https://netwebmedia.com/_opcache_reset.php?k=<KEY>
   - Date-tied public key (nwm-opcache-YYYY-MM-DD UTC) OR opcache_reset_key from config.
   - Clears PHP OPcache so freshly-FTP'd PHP is recompiled.
   - Deletes itself after running.

   2026-05-18 incident: the live crm-vanilla/api/index.php was a stale OPcache
   build returning "Authentication required" on every route (whole CRM API
   down, every deploy's migrate step failing). _opcache_reset.php had been
   removed from the repo and self-deletes server-side, so no deploy could
   clear OPcache. Re-added with crm-vanilla/api/* in the explicit invalidate
   list (those were the stale files).
*/

$providedKey = $_GET['k'] ?? '';
$today = gmdate('Y-m-d');
$staticPublicKey = 'nwm-opcache-' . $today;

$authorized = false;
if (hash_equals($staticPublicKey, $providedKey)) $authorized = true;

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

// crm-vanilla/api/* first — that's the file set that was serving a stale 401 build.
$files = [
  __DIR__ . '/crm-vanilla/api/index.php',
  __DIR__ . '/crm-vanilla/api/config.php',
  __DIR__ . '/crm-vanilla/api/lib/guard.php',
  __DIR__ . '/crm-vanilla/api/handlers/migrate.php',
  __DIR__ . '/crm-vanilla/api/handlers/cron_workflows.php',
  __DIR__ . '/api-php/index.php',
  __DIR__ . '/api-php/routes/public.php',
];
foreach ($files as $f) {
  if (is_file($f) && function_exists('opcache_invalidate')) {
    $ok = @opcache_invalidate($f, true);
    $result['steps'][] = 'invalidate ' . basename($f) . ': ' . ($ok ? 'true' : 'false');
  }
}

if (function_exists('clearstatcache')) { clearstatcache(true); $result['steps'][] = 'clearstatcache: true'; }

$result['self_deleted'] = @unlink(__FILE__);
echo json_encode($result, JSON_PRETTY_PRINT);

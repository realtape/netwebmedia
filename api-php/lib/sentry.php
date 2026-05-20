<?php
/* NWM Sentry PHP bootstrap.
 * Install once on server:   composer require sentry/sentry
 * Set SENTRY_DSN in .env (loaded by env.php). No-ops if unset or SDK missing.
 */
(function () {
  $dsn = getenv('SENTRY_DSN');
  if (!$dsn) return;
  $autoload = __DIR__ . '/../../vendor/autoload.php';
  if (!file_exists($autoload)) return; // SDK not installed yet; silently skip
  require_once $autoload;
  if (!function_exists('\Sentry\init')) return;

  \Sentry\init([
    'dsn'         => $dsn,
    'environment' => getenv('SENTRY_ENV') ?: (php_sapi_name() === 'cli' ? 'cli' : 'production'),
    'release'     => getenv('NWM_RELEASE') ?: 'nwm@unknown',
    'traces_sample_rate' => 0.1,
    'send_default_pii'   => false,
  ]);

  set_exception_handler(function ($e) {
    try { \Sentry\captureException($e); } catch (\Throwable $_) {}
    error_log('[nwm] uncaught: ' . $e->getMessage());
  });
})();

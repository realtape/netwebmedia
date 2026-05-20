<?php
/**
 * NetWebMedia Sentry PHP bootstrap — Vanilla cURL, no SDK dependency
 *
 * Reads DSN from config.local.php → config()['sentry_dsn']
 * Sends exceptions + errors to Sentry via JSON HTTP POST
 *
 * Setup: Carlos must add to config.local.php:
 *   'sentry_dsn' => 'https://key@sentry.io/project_id'
 *
 * This file is included early in api-php/index.php to catch exceptions.
 */

(function () {
  // Try to get DSN from config()
  if (!function_exists('config')) {
    // config() not available; silently disable
    return;
  }

  $cfg = @config();
  $dsn = $cfg['sentry_dsn'] ?? null;

  if (!$dsn) {
    // DSN not configured; silently disable
    return;
  }

  // Parse DSN: https://key@sentry.io/project_id
  $dsn_parts = parse_url($dsn);
  if (!isset($dsn_parts['scheme'], $dsn_parts['user'], $dsn_parts['host'])) {
    error_log('[sentry-vanilla] Invalid DSN format');
    return;
  }

  // Extract components
  $key = $dsn_parts['user'];
  $secret = $dsn_parts['pass'] ?? '';  // May be empty
  $host = $dsn_parts['host'];
  $port = $dsn_parts['port'] ?? ($dsn_parts['scheme'] === 'https' ? 443 : 80);
  $path = $dsn_parts['path'] ?? '';    // e.g. /123456
  $project_id = trim($path, '/');

  if (!$key || !$project_id) {
    error_log('[sentry-vanilla] Invalid DSN: missing key or project_id');
    return;
  }

  // Sentry envelope endpoint
  $sentry_url = "{$dsn_parts['scheme']}://{$host}:{$port}/api/{$project_id}/envelope/";

  // Determine environment
  $env = $_SERVER['HTTP_HOST'] === 'netwebmedia.com' ? 'production' : 'development';

  /**
   * Send an event to Sentry via cURL
   */
  $send_to_sentry = function ($event_data, $is_error = false) use ($sentry_url, $key, $secret, $env) {
    if (!extension_loaded('curl')) {
      return;  // cURL not available; silently skip
    }

    // Sample: 100% for errors, 10% for exceptions
    $sample_rate = $is_error ? 1.0 : 0.1;
    if (mt_rand(1, 100) > ($sample_rate * 100)) {
      return;  // Sampled out
    }

    $ch = curl_init($sentry_url);
    if (!$ch) return;

    $auth = "Sentry sentry_key={$key}";
    if ($secret) {
      $auth .= ", sentry_secret={$secret}";
    }

    $headers = [
      "Authorization: {$auth}",
      "Content-Type: application/x-sentry-envelope",
      "X-Sentry-Auth: {$auth}",
    ];

    // Envelope format: header (JSON) + newline + event (JSON)
    $envelope_header = json_encode([
      'event_id' => bin2hex(random_bytes(8)),
    ]) ?: '{}';

    $event_data['environment'] = $env;
    $event_data['platform'] = 'php';
    $event_data['timestamp'] = time();

    $envelope_body = json_encode($event_data) ?: '{}';
    $envelope = "{$envelope_header}\n{$envelope_body}";

    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $envelope,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 5,
      CURLOPT_CONNECTTIMEOUT => 3,
    ]);

    // Send; ignore response
    @curl_exec($ch);
    curl_close($ch);
  };

  /**
   * Exception handler
   */
  set_exception_handler(function ($exception) use ($send_to_sentry) {
    $msg = $exception->getMessage();
    $file = $exception->getFile();
    $line = $exception->getLine();
    $trace = $exception->getTraceAsString();

    error_log("[nwm-exception] {$msg} at {$file}:{$line}");

    $send_to_sentry([
      'message' => $msg,
      'level' => 'error',
      'logger' => 'php',
      'culprit' => "{$file}:{$line}",
      'exception' => [
        [
          'type' => get_class($exception),
          'value' => $msg,
          'stacktrace' => [
            'frames' => [
              [
                'filename' => $file,
                'lineno' => $line,
              ],
            ],
          ],
        ],
      ],
    ], true);
  });

  /**
   * Error handler — catches warnings, notices, etc.
   */
  set_error_handler(function ($errno, $errstr, $errfile, $errline) use ($send_to_sentry) {
    // Map PHP error levels to Sentry severity
    $severity_map = [
      E_ERROR => 'fatal',
      E_WARNING => 'warning',
      E_PARSE => 'fatal',
      E_NOTICE => 'info',
      E_CORE_ERROR => 'fatal',
      E_CORE_WARNING => 'warning',
      E_COMPILE_ERROR => 'fatal',
      E_COMPILE_WARNING => 'warning',
      E_USER_ERROR => 'error',
      E_USER_WARNING => 'warning',
      E_USER_NOTICE => 'info',
      E_STRICT => 'info',
      E_RECOVERABLE_ERROR => 'error',
      E_DEPRECATED => 'info',
      E_USER_DEPRECATED => 'info',
    ];

    $level = $severity_map[$errno] ?? 'error';
    $is_critical = in_array($level, ['error', 'fatal']);

    error_log("[nwm-error] {$errstr} ({$errno}) at {$errfile}:{$errline}");

    $send_to_sentry([
      'message' => $errstr,
      'level' => $level,
      'logger' => 'php',
      'culprit' => "{$errfile}:{$errline}",
      'exception' => [
        [
          'type' => "PHP Error {$errno}",
          'value' => $errstr,
          'stacktrace' => [
            'frames' => [
              [
                'filename' => $errfile,
                'lineno' => $errline,
              ],
            ],
          ],
        ],
      ],
    ], $is_critical);

    // Return false to let PHP's internal handler also run (don't suppress)
    return false;
  });
})();

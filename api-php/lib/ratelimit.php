<?php
/* File-backed sliding-window rate limiter.
 *
 * No Redis dependency. Survives PHP-FPM worker restarts. Keyed by an arbitrary
 * bucket name (e.g. ip, ip+endpoint, ip+token). Calls err()/exit on 429 so
 * callers don't have to handle the response themselves.
 *
 * Used by /api/public/* endpoints to keep public endpoints — especially those
 * that hit the Anthropic API — from being weaponized into a billing DoS.
 */

require_once __DIR__ . '/response.php';

/**
 * Enforce a sliding-window rate limit. On limit-hit, sets Retry-After and
 * responds 429 via err(); does not return.
 *
 * @param string $bucket   Logical bucket (e.g. "audit", "newsletter", "agent_chat:abc123").
 *                         Becomes part of the file path; arbitrary string allowed (hashed).
 * @param int    $maxReqs  Max requests permitted in the window.
 * @param int    $window   Window length in seconds.
 * @param string|null $key Identity key, defaults to client IP. Use to scope by
 *                         token+IP or similar. Hashed before disk write.
 */
function rate_limit_check($bucket, $maxReqs, $window, $key = null) {
  if ($key === null) $key = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

  $rlDir = __DIR__ . '/../data/ratelimit';
  if (!is_dir($rlDir)) { @mkdir($rlDir, 0700, true); }

  // Bucket folder per endpoint so different endpoints don't share counters.
  $bucketDir = $rlDir . '/' . preg_replace('/[^a-z0-9_-]/i', '_', $bucket);
  if (!is_dir($bucketDir)) { @mkdir($bucketDir, 0700, true); }

  $rlFile = $bucketDir . '/' . hash('sha256', (string)$key) . '.json';
  $now = time();

  $hits = [];
  if (file_exists($rlFile)) {
    $raw = @file_get_contents($rlFile);
    $decoded = $raw ? json_decode($raw, true) : null;
    if (is_array($decoded)) $hits = $decoded;
  }

  // Drop entries outside the window.
  $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t >= $now - $window));

  if (count($hits) >= $maxReqs) {
    $oldest = min($hits);
    $retryAfter = max(1, $window - ($now - $oldest));
    header('Retry-After: ' . $retryAfter);
    err(
      'Rate limit exceeded. Try again in ' . ceil($retryAfter / 60) . ' minute(s).',
      429,
      ['retry_after' => $retryAfter, 'limit' => $maxReqs, 'window_seconds' => $window]
    );
  }

  $hits[] = $now;
  @file_put_contents($rlFile, json_encode($hits), LOCK_EX);
}

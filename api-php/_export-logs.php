<?php
/* Read-only export of the campaign dedup logs so lists can be filtered
 * offline. Returns the union of every "already touched" email across both
 * campaigns (sent + failed + unsubscribed), plus per-log counts.
 *
 * URL:  https://netwebmedia.com/api/_export-logs
 * Auth: MIGRATE_TOKEN via X-Auth-Token header (or ?token=)
 *
 * ?format=json (default) → { counts:{}, emails:[...] }
 * ?format=txt            → one email per line (the union set)
 * ?which=us|chile|all    → restrict to one campaign's logs (default all)
 */

require_once __DIR__ . '/lib/db.php';

// Fail closed: deny if no migrate token is configured (no hardcoded fallback).
$cfg      = config();
$expected = $cfg['migrate_token'] ?? (defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : null);
$presented = (string)($_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '');
if (!is_string($expected) || $expected === '' || !hash_equals($expected, $presented)) {
  http_response_code(401);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'unauthorized']);
  exit;
}

$which  = $_GET['which']  ?? 'all';
$format = $_GET['format'] ?? 'json';
$dir    = __DIR__ . '/data';

$logs = [
  'us_sent'   => ['file' => 'us-sent.log',       'camp' => 'us'],
  'us_w3'     => ['file' => 'us-w3-sent.log',    'camp' => 'us'],
  'us_failed' => ['file' => 'us-failed.log',     'camp' => 'us'],
  'cl_sent'   => ['file' => 'chile-sent.log',    'camp' => 'chile'],
  'cl_failed' => ['file' => 'chile-failed.log',  'camp' => 'chile'],
  'unsub'     => ['file' => 'unsubscribes.log',  'camp' => 'all'],
];

$counts = [];
$union  = [];

foreach ($logs as $key => $meta) {
  if ($which !== 'all' && $meta['camp'] !== 'all' && $meta['camp'] !== $which) {
    continue;
  }
  $path = $dir . '/' . $meta['file'];
  $n = 0;
  if (is_file($path)) {
    foreach (file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
      $e = strtolower(trim(explode("\t", $line)[0] ?? ''));
      if ($e === '' || strpos($e, '@') === false) continue;
      $union[$e] = true;
      $n++;
    }
  }
  $counts[$key] = ['file' => $meta['file'], 'lines' => $n, 'exists' => is_file($path)];
}

if ($format === 'txt') {
  header('Content-Type: text/plain; charset=utf-8');
  header('Cache-Control: no-store');
  echo implode("\n", array_keys($union));
  exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode([
  'which'        => $which,
  'counts'       => $counts,
  'union_unique' => count($union),
  'emails'       => array_keys($union),
], JSON_UNESCAPED_SLASHES);

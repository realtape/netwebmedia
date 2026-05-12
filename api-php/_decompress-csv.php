<?php
/* One-time decompression endpoint for wave-3 CSV.
 *
 * The 144MB usa_5x_full.csv can't be committed to git directly (size cap).
 * We ship the gzipped version (~6.5MB) via the normal deploy workflow,
 * then hit this endpoint once to decompress it on the server.
 *
 * URL: https://netwebmedia.com/api/_decompress-csv?file=usa_5x_full.csv
 * Auth: MIGRATE_TOKEN via X-Auth-Token header (or ?token=)
 *
 * Safe to call multiple times — idempotent (re-extracts if .gz still present).
 * After successful decompression, the .gz file is removed from the server.
 */

require_once __DIR__ . '/lib/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

set_time_limit(120);

// Auth — uses MIGRATE_TOKEN, same as the schema migration endpoint
$cfg      = config();
$expected = $cfg['migrate_token']
         ?? (defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : 'NWM_MIGRATE_2026');
$presented = (string)($_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '');
if (!hash_equals($expected, $presented)) {
  http_response_code(401);
  echo json_encode(['error' => 'unauthorized']);
  exit;
}

$file = $_GET['file'] ?? '';
if (!preg_match('/^[a-z0-9_.-]+\.csv$/i', $file)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid file param — expected pattern *.csv']);
  exit;
}

$dir  = __DIR__ . '/data';
$gz   = $dir . '/' . $file . '.gz';
$csv  = $dir . '/' . $file;

if (!file_exists($gz)) {
  http_response_code(404);
  echo json_encode([
    'error'    => '.gz file not found',
    'expected' => $gz,
    'csv_exists' => file_exists($csv),
    'csv_size'   => file_exists($csv) ? filesize($csv) : null,
  ]);
  exit;
}

$gz_size_before = filesize($gz);
$started        = microtime(true);

// Stream decompression (chunked so we don't blow PHP memory on a 144MB file)
$in  = gzopen($gz, 'rb');
$out = fopen($csv, 'wb');
if (!$in || !$out) {
  if ($in)  gzclose($in);
  if ($out) fclose($out);
  http_response_code(500);
  echo json_encode(['error' => 'failed to open files for decompression']);
  exit;
}

$bytes = 0;
while (!gzeof($in)) {
  $chunk = gzread($in, 1024 * 1024); // 1MB chunks
  if ($chunk === false) break;
  $written = fwrite($out, $chunk);
  if ($written === false) break;
  $bytes += $written;
}
gzclose($in);
fclose($out);

$ok        = file_exists($csv) && filesize($csv) > $gz_size_before;
$csv_size  = file_exists($csv) ? filesize($csv) : 0;
$elapsed_s = round(microtime(true) - $started, 2);

// Tidy up — remove the .gz now that we have the CSV
$gz_removed = false;
if ($ok && file_exists($gz)) {
  $gz_removed = @unlink($gz);
}

echo json_encode([
  'ok'              => $ok,
  'file'            => $file,
  'csv_size_bytes'  => $csv_size,
  'csv_size_mb'     => round($csv_size / 1024 / 1024, 1),
  'gz_size_before'  => $gz_size_before,
  'gz_removed'      => $gz_removed,
  'elapsed_seconds' => $elapsed_s,
  'csv_path'        => $csv,
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

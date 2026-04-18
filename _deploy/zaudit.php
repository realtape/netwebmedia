<?php
/* Batch audit runner.
   GET  /zaudit.php?status             → summary
   GET  /zaudit.php?go=1&limit=25      → audit next N unaudited contacts
   GET  /zaudit.php?go=1&limit=25&all  → continue until done (single invocation, time-limited)
*/
@set_time_limit(0);
@ini_set('memory_limit', '512M');
require_once '/home/webmed6/public_html/api/lib/db.php';
require_once '/home/webmed6/public_html/api/routes/audit.php';

function normalize_website($w) {
  $w = trim((string)$w);
  if (!$w) return '';
  if (!preg_match('#^https?://#i', $w)) $w = 'https://' . $w;
  return $w;
}

function audit_one($row) {
  $d = json_decode($row['data'], true) ?: [];
  $url = normalize_website($d['website'] ?? '');
  if (!$url) return ['skipped' => 'no website'];
  // Skip if already audited within 24h
  if (!empty($d['audit_last_at']) && (time() - strtotime($d['audit_last_at'])) < 86400) return ['skipped' => 'fresh'];

  $fetch = aud_fetch_url($url, 'GET');
  if (!$fetch['ok'] || $fetch['status'] >= 400) {
    $d['audit_last_at']  = date('c');
    $d['audit_error']    = 'fetch failed (' . ($fetch['status'] ?? 'err') . ')';
    $d['audit_score']    = 0;
    qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($d, JSON_UNESCAPED_UNICODE), $row['id']]);
    return ['failed' => $d['audit_error']];
  }

  $parsed   = aud_parse_html($fetch['body'], $url);
  $headers  = strtolower($fetch['headers']);
  $perf = [
    't_ms'    => $fetch['t_ms'],
    'size_kb' => (int) round($fetch['size_bytes'] / 1024),
    'gzip'    => strpos($headers, 'content-encoding:') !== false && preg_match('/content-encoding:\s*(gzip|br|deflate)/', $headers),
    'cache'   => strpos($headers, 'cache-control:') !== false || strpos($headers, 'expires:') !== false,
  ];
  $security = [
    'https'  => strpos($fetch['final_url'], 'https://') === 0,
    'ssl_ok' => !empty($fetch['ssl_ok']),
    'hsts'   => strpos($headers, 'strict-transport-security:') !== false,
  ];
  $scores = aud_score($parsed, $perf, $security);
  $recs   = aud_recommendations($parsed, $perf, $security, $scores, []);

  $d['audit_score']      = $scores['overall'];
  $d['audit_scores']     = $scores;
  $d['audit_top_issues'] = array_slice(array_column($recs, 'issue'), 0, 5);
  $d['audit_timing_ms']  = $perf['t_ms'];
  $d['audit_final_url']  = $fetch['final_url'];
  $d['audit_last_at']    = date('c');
  unset($d['audit_error']);
  qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($d, JSON_UNESCAPED_UNICODE), $row['id']]);
  return ['ok' => true, 'score' => $scores['overall']];
}

// Status
if (isset($_GET['status'])) {
  $total     = qOne("SELECT COUNT(*) AS n FROM resources WHERE type='contact'")['n'];
  $withSite  = qOne("SELECT COUNT(*) AS n FROM resources WHERE type='contact' AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) <> ''")['n'];
  $audited   = qOne("SELECT COUNT(*) AS n FROM resources WHERE type='contact' AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.audit_last_at')) IS NOT NULL")['n'];
  $by_bucket = qAll("SELECT CASE
      WHEN JSON_EXTRACT(data,'$.audit_score') IS NULL THEN 'not_audited'
      WHEN JSON_EXTRACT(data,'$.audit_score') >= 85 THEN 'excellent'
      WHEN JSON_EXTRACT(data,'$.audit_score') >= 65 THEN 'good'
      WHEN JSON_EXTRACT(data,'$.audit_score') >= 40 THEN 'needs_work'
      ELSE 'critical' END AS bucket, COUNT(*) AS n
    FROM resources WHERE type='contact' GROUP BY bucket");
  header('Content-Type: application/json');
  echo json_encode([
    'total'          => (int)$total,
    'with_website'   => (int)$withSite,
    'audited'        => (int)$audited,
    'remaining'      => max(0, (int)$withSite - (int)$audited),
    'score_buckets'  => $by_bucket,
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  exit;
}

if (!isset($_GET['go'])) { echo 'pass ?go=1&limit=25 to audit next batch, or ?status for summary'; exit; }

$limit = max(1, min(500, (int)($_GET['limit'] ?? 25)));
$continueAll = isset($_GET['all']);
$maxRuntime = 50; // seconds per invocation to be safe
$startedAt  = time();
$totalStats = ['audited' => 0, 'failed' => 0, 'skipped' => 0];

while (true) {
  $rows = qAll("SELECT id, data FROM resources
    WHERE type='contact'
      AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) IS NOT NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) <> ''
      AND (JSON_EXTRACT(data,'$.audit_last_at') IS NULL
           OR STR_TO_DATE(SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(data,'$.audit_last_at')),1,19),'%Y-%m-%dT%H:%i:%s') < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    ORDER BY id ASC LIMIT $limit");
  if (!$rows) break;
  foreach ($rows as $r) {
    $res = audit_one($r);
    if (isset($res['ok']))        $totalStats['audited']++;
    elseif (isset($res['failed']))$totalStats['failed']++;
    else                          $totalStats['skipped']++;
    if (!$continueAll && $totalStats['audited'] + $totalStats['failed'] + $totalStats['skipped'] >= $limit) break 2;
    if (time() - $startedAt >= $maxRuntime) break 2;
  }
  if (!$continueAll) break;
}

$remaining = qOne("SELECT COUNT(*) AS n FROM resources
  WHERE type='contact'
    AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.website')) <> ''
    AND (JSON_EXTRACT(data,'$.audit_last_at') IS NULL
         OR STR_TO_DATE(SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(data,'$.audit_last_at')),1,19),'%Y-%m-%dT%H:%i:%s') < DATE_SUB(NOW(), INTERVAL 24 HOUR)))['n'];

header('Content-Type: application/json');
echo json_encode([
  'ok'        => true,
  'processed' => $totalStats,
  'elapsed_s' => time() - $startedAt,
  'remaining' => (int)$remaining,
  'hint'      => $remaining > 0 ? ('call again with ?go=1&limit=' . $limit . ' or &all=1 to continue') : 'all done',
], JSON_PRETTY_PRINT);

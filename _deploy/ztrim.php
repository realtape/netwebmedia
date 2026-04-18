<?php
/* Trim contacts to quotas:
    - Metropolitana: keep top 200
    - Every other named region: keep top 50
    - Drop everything with no valid email
    Ranking: nwm_score DESC, then created_at DESC (newer wins).
    Dry-run unless ?go=1.
*/
require_once '/home/webmed6/public_html/api/lib/db.php';
@set_time_limit(0);

$quotas = ['Metropolitana' => 200]; // default 50 everywhere else

$rows = qAll("SELECT id, title, data, created_at FROM resources WHERE type='contact' ORDER BY created_at DESC");
$by_region = [];
$no_email = [];

foreach ($rows as $r) {
  $d = json_decode($r['data'], true) ?: [];
  $email = strtolower(trim((string)($d['email'] ?? '')));
  $valid_email = $email && strpos($email, '@') !== false && $email !== 'not found';
  if (!$valid_email) { $no_email[] = (int)$r['id']; continue; }
  $region = $d['region'] ?? null;
  if (!$region) $region = 'Otra';
  $score = (int) ($d['nwm_score'] ?? 0);
  $by_region[$region][] = [
    'id' => (int)$r['id'],
    'title' => $r['title'],
    'email' => $email,
    'score' => $score,
    'created_at' => $r['created_at'],
  ];
}

// Rank each region and mark which to keep / drop
$keep_ids = [];
$drop_over_quota = [];
$summary = [];
foreach ($by_region as $region => $items) {
  usort($items, function($a, $b){
    if ($a['score'] !== $b['score']) return $b['score'] - $a['score'];
    return strcmp($b['created_at'], $a['created_at']);
  });
  $quota = $quotas[$region] ?? 50;
  $keep = array_slice($items, 0, $quota);
  $drop = array_slice($items, $quota);
  foreach ($keep as $k) $keep_ids[] = $k['id'];
  foreach ($drop as $k) $drop_over_quota[] = $k['id'];
  $summary[$region] = ['total' => count($items), 'keep' => count($keep), 'drop' => count($drop), 'quota' => $quota];
}
ksort($summary);

$to_delete = array_merge($no_email, $drop_over_quota);

$dry = !isset($_GET['go']) || $_GET['go'] !== '1';
if ($dry) {
  header('Content-Type: application/json');
  echo json_encode([
    'dry_run'        => true,
    'total_contacts' => count($rows),
    'no_email_count' => count($no_email),
    'over_quota_count' => count($drop_over_quota),
    'to_delete'      => count($to_delete),
    'to_keep'        => count($keep_ids),
    'by_region'      => $summary,
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  exit;
}

$deleted = 0;
if ($to_delete) {
  $chunks = array_chunk($to_delete, 500);
  foreach ($chunks as $ch) {
    $ph = implode(',', array_fill(0, count($ch), '?'));
    qExec("DELETE FROM resources WHERE id IN ($ph)", $ch);
    $deleted += count($ch);
  }
}

$remaining = qAll("SELECT JSON_UNQUOTE(JSON_EXTRACT(data,'$.region')) AS region, COUNT(*) AS n FROM resources WHERE type='contact' GROUP BY region ORDER BY n DESC");

header('Content-Type: application/json');
echo json_encode([
  'ok'              => true,
  'deleted'         => $deleted,
  'remaining_total' => array_sum(array_column($remaining, 'n')),
  'remaining_by_region' => $remaining,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
@unlink(__FILE__);

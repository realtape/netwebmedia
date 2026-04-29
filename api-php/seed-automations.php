<?php
/* Pipeline automations seeder. Idempotent — upserts by slug.
   Usage: GET /api/seed-automations.php?token=<first-16-chars-of-jwt_secret>
   Optional: &org_id=1   (defaults to 1)
   Optional: &dry=1      (preview only, no DB writes)
*/
require __DIR__ . '/lib/db.php';
header('Content-Type: text/plain; charset=utf-8');

$cfg = config();
if (($_GET['token'] ?? '') !== substr($cfg['jwt_secret'], 0, 16)) {
  http_response_code(403);
  echo "Forbidden. Provide ?token=<first-16-chars-of-jwt_secret>\n";
  exit;
}

$orgId = (int)($_GET['org_id'] ?? 1);
$dry   = !empty($_GET['dry']);

$jsonPath = __DIR__ . '/data/pipeline-automations.json';
if (!is_file($jsonPath)) { http_response_code(500); echo "Missing $jsonPath\n"; exit; }

$src = json_decode(file_get_contents($jsonPath), true);
if (!$src || empty($src['workflows'])) { http_response_code(500); echo "Invalid JSON or no workflows\n"; exit; }

echo "── Pipeline automations seed ──\n";
echo "Source:  $jsonPath (v" . ($src['version'] ?? '?') . ")\n";
echo "Org ID:  $orgId\n";
echo "Mode:    " . ($dry ? 'DRY RUN (no writes)' : 'WRITE') . "\n";
echo "Found:   " . count($src['workflows']) . " workflows\n\n";

$pdo = db();
$inserted = 0; $updated = 0; $skipped = 0;

foreach ($src['workflows'] as $wf) {
  $slug   = $wf['slug']   ?? null;
  $title  = $wf['title']  ?? null;
  $status = $wf['status'] ?? 'active';
  $data   = $wf['data']   ?? null;

  if (!$slug || !$title || !$data) {
    echo "SKIP (missing slug/title/data): " . json_encode($wf) . "\n";
    $skipped++; continue;
  }

  $existing = $pdo->prepare("SELECT id FROM resources WHERE type='workflow' AND org_id=? AND slug=? LIMIT 1");
  $existing->execute([$orgId, $slug]);
  $row = $existing->fetch(PDO::FETCH_ASSOC);

  $dataJson = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

  if ($row) {
    echo "UPDATE  $slug — id={$row['id']}  ($title)\n";
    if (!$dry) {
      $u = $pdo->prepare("UPDATE resources SET title=?, status=?, data=?, updated_at=NOW() WHERE id=?");
      $u->execute([$title, $status, $dataJson, $row['id']]);
    }
    $updated++;
  } else {
    echo "INSERT  $slug  ($title)\n";
    if (!$dry) {
      $i = $pdo->prepare("INSERT INTO resources (org_id, type, slug, title, status, data, owner_id, created_at, updated_at) VALUES (?, 'workflow', ?, ?, ?, ?, NULL, NOW(), NOW())");
      $i->execute([$orgId, $slug, $title, $status, $dataJson]);
    }
    $inserted++;
  }
}

echo "\n── Done ──\n";
echo "Inserted: $inserted\n";
echo "Updated:  $updated\n";
echo "Skipped:  $skipped\n";
echo $dry ? "(no writes — re-run without &dry=1 to apply)\n" : "All workflows are now active in resources(type=workflow).\n";

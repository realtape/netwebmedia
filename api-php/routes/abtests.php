<?php
/* A/B Test engine.
   - Admin creates tests with variants (A, B, C...)
   - Public snippet /api/public/ab/assign?test={slug}&visitor={uuid} → returns which variant
   - Public /api/public/ab/convert?test={slug}&visitor={uuid} → records conversion
   - Reporting over time
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function ab_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS ab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    hypothesis TEXT,
    variants JSON NOT NULL,
    traffic_split JSON,
    status VARCHAR(20) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id)
  )");
  db()->exec("CREATE TABLE IF NOT EXISTS ab_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    visitor VARCHAR(64) NOT NULL,
    variant VARCHAR(20) NOT NULL,
    event VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_test (test_id, visitor), KEY ix_event (test_id, event, variant)
  )");
}

function route_abtests($parts, $method) {
  ab_ensure_schema();
  $u = requirePaidAccess();
  $org = (int)$u['org_id'];

  if (empty($parts) && $method === 'GET') {
    $rows = qAll("SELECT * FROM ab_tests WHERE org_id = ? ORDER BY id DESC", [$org]);
    foreach ($rows as &$r) {
      $r['variants'] = json_decode($r['variants'], true);
      $r['traffic_split'] = json_decode($r['traffic_split'], true);
      $stats = qAll("SELECT variant, event, COUNT(DISTINCT visitor) AS n FROM ab_events WHERE test_id = ? GROUP BY variant, event", [$r['id']]);
      $r['stats'] = $stats;
    }
    json_out(['items' => $rows]);
  }

  if (empty($parts) && $method === 'POST') {
    $b = required(['slug', 'name', 'variants']);
    if (!is_array($b['variants']) || count($b['variants']) < 2) err('variants must be array of 2+', 400);
    $split = $b['traffic_split'] ?? null;
    qExec("INSERT INTO ab_tests (org_id, slug, name, hypothesis, variants, traffic_split, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [$org, $b['slug'], $b['name'], $b['hypothesis'] ?? null, json_encode($b['variants']), $split ? json_encode($split) : null, $b['status'] ?? 'running']);
    json_out(['ok' => true, 'id' => lastId()], 201);
  }

  $id = (int)($parts[0] ?? 0);
  $t = qOne("SELECT * FROM ab_tests WHERE id = ? AND org_id = ?", [$id, $org]);
  if (!$t) err('Not found', 404);

  if ($method === 'PUT') {
    $b = body();
    $fields = []; $params = [];
    foreach (['slug','name','hypothesis','status'] as $f) if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    if (array_key_exists('variants', $b))      { $fields[] = "variants = ?"; $params[] = json_encode($b['variants']); }
    if (array_key_exists('traffic_split', $b)) { $fields[] = "traffic_split = ?"; $params[] = json_encode($b['traffic_split']); }
    if (!$fields) err('Nothing to update', 400);
    $params[] = $id;
    qExec("UPDATE ab_tests SET " . implode(',', $fields) . " WHERE id = ?", $params);
    json_out(['ok' => true]);
  }
  if ($method === 'DELETE') { qExec("DELETE FROM ab_tests WHERE id = ?", [$id]); qExec("DELETE FROM ab_events WHERE test_id = ?", [$id]); json_out(['ok' => true]); }
  err('Method not allowed', 405);
}

function route_public_ab($parts, $method) {
  ab_ensure_schema();
  $action = $parts[1] ?? '';
  $slug = trim($_GET['test'] ?? '');
  $visitor = preg_replace('/[^a-zA-Z0-9_-]/', '', trim($_GET['visitor'] ?? ''));
  if (!$slug || !$visitor) err('test + visitor required', 400);
  $t = qOne("SELECT * FROM ab_tests WHERE slug = ? AND status = 'running'", [$slug]);
  if (!$t) err('No running test', 404);
  $variants = json_decode($t['variants'], true) ?: [];
  if (!$variants) err('No variants', 500);

  if ($action === 'assign') {
    // Deterministic assignment: hash visitor + slug → bucket
    $h = crc32($visitor . '|' . $slug);
    $names = array_column($variants, 'name') ?: array_keys($variants);
    $idx = abs($h) % count($names);
    $variant = $names[$idx];
    qExec("INSERT INTO ab_events (test_id, visitor, variant, event) VALUES (?, ?, ?, 'assign')", [$t['id'], $visitor, $variant]);
    $payload = $variants[$idx] ?? ['name' => $variant];
    json_out(['variant' => $variant, 'payload' => $payload]);
  }
  if ($action === 'convert') {
    $existing = qOne("SELECT variant FROM ab_events WHERE test_id = ? AND visitor = ? AND event = 'assign' ORDER BY id ASC LIMIT 1", [$t['id'], $visitor]);
    if (!$existing) err('No assign for visitor', 404);
    qExec("INSERT INTO ab_events (test_id, visitor, variant, event) VALUES (?, ?, ?, 'convert')", [$t['id'], $visitor, $existing['variant']]);
    json_out(['ok' => true, 'variant' => $existing['variant']]);
  }
  err('Not found', 404);
}

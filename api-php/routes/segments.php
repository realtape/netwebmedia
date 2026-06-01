<?php
/**
 * Segments — saved named filters reusable across contacts, SMS, tasks, campaigns.
 *
 * Routes (all auth):
 *   GET    /api/segments                  — list
 *   POST   /api/segments                  — create  { name, description, filter }
 *   GET    /api/segments/{id}             — get + member count + sample (3 contacts)
 *   PUT    /api/segments/{id}             — update
 *   DELETE /api/segments/{id}             — delete
 *   GET    /api/segments/{id}/members     — list contact IDs (paginated)
 *   POST   /api/segments/preview          — preview an unsaved filter { filter }
 *
 * Filter shape (all keys optional, AND-combined):
 *   {
 *     segment, niche_key, status, lifecycle_stage, region, city,
 *     has_phone (bool), has_email (bool), has_website (bool),
 *     score_gte (int), score_lte (int)
 *   }
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function segments_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS segments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    user_id     INT DEFAULT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    filter      JSON DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_segments($parts, $method) {
  segments_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'preview' && $method === 'POST') {
    return segments_preview_unsaved($user);
  }

  $id = $sub !== null && ctype_digit((string)$sub) ? (int)$sub : null;
  if ($id) {
    $action = $parts[1] ?? null;
    if ($action === 'members' && $method === 'GET') return segments_members($id, $user);
    if (!$action) {
      if ($method === 'GET')    return segments_get($id, $user);
      if ($method === 'PUT')    return segments_update($id, $user);
      if ($method === 'DELETE') return segments_delete($id, $user);
    }
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return segments_list($user);
  if ($method === 'POST') return segments_create($user);
  err('Method not allowed', 405);
}

function segments_list($user) {
  $org = (int)($user['org_id'] ?? 1);
  $rows = qAll("SELECT * FROM segments WHERE org_id = ? ORDER BY id DESC", [$org]);
  foreach ($rows as &$r) $r = segments_decorate($r);
  json_out(['segments' => $rows]);
}

function segments_get($id, $user) {
  $row = qOne("SELECT * FROM segments WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Segment not found', 404);
  $row = segments_decorate($row);
  $eval = segments_resolve($row['filter']);
  $row['member_count'] = $eval['count'];
  $row['sample']       = array_slice($eval['contacts'], 0, 3);
  json_out(['segment' => $row]);
}

function segments_create($user) {
  $b = body();
  if (empty($b['name'])) err('name is required');
  qExec(
    "INSERT INTO segments (org_id, user_id, name, description, filter) VALUES (?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      trim($b['name']),
      $b['description'] ?? null,
      isset($b['filter']) ? json_encode($b['filter']) : null,
    ]
  );
  json_out(['ok' => true, 'id' => lastId()], 201);
}

function segments_update($id, $user) {
  $row = qOne("SELECT id FROM segments WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Segment not found', 404);
  $b = body();
  $sets = []; $params = [];
  foreach (['name','description','filter'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'filter') $v = $v === null ? null : json_encode($v);
    $sets[] = "$k = ?"; $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE segments SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function segments_delete($id, $user) {
  $row = qOne("SELECT id FROM segments WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Segment not found', 404);
  qExec("DELETE FROM segments WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function segments_members($id, $user) {
  $row = qOne("SELECT filter FROM segments WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Segment not found', 404);
  $filter = $row['filter'] ? json_decode($row['filter'], true) : [];
  $eval = segments_resolve($filter);
  $limit = max(1, min(1000, (int)qparam('limit', 200)));
  json_out([
    'count'   => $eval['count'],
    'members' => array_slice($eval['contacts'], 0, $limit),
  ]);
}

function segments_preview_unsaved($user) {
  $b = body();
  $filter = $b['filter'] ?? [];
  $eval = segments_resolve($filter);
  json_out([
    'ok'     => true,
    'count'  => $eval['count'],
    'sample' => array_slice($eval['contacts'], 0, 5),
  ]);
}

function segments_decorate($r) {
  $r['id']      = (int)$r['id'];
  $r['org_id']  = (int)$r['org_id'];
  $r['user_id'] = $r['user_id'] !== null ? (int)$r['user_id'] : null;
  $r['filter']  = $r['filter'] ? json_decode($r['filter'], true) : null;
  return $r;
}

/**
 * Resolve a filter to an array of contacts. Returns ['count', 'contacts'].
 * Each contact has: id, name, email, phone, segment, niche_key, status, etc. (flat fields from data JSON).
 */
function segments_resolve($filter) {
  $f = is_array($filter) ? $filter : (json_decode((string)$filter, true) ?: []);

  try {
    $rows = qAll("SELECT id, data FROM resources WHERE type='contact' LIMIT 5000");
  } catch (Exception $e) { return ['count' => 0, 'contacts' => []]; }

  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    if (!segments_match($d, $f)) continue;
    $d['id'] = (int)$r['id'];
    $out[] = $d;
  }
  return ['count' => count($out), 'contacts' => $out];
}

function segments_match($d, $f) {
  if (!empty($f['has_phone'])    && empty($d['phone']))   return false;
  if (!empty($f['has_email'])    && empty($d['email']))   return false;
  if (!empty($f['has_website'])  && empty($d['website'])) return false;
  if (!empty($f['segment'])         && ($d['segment']         ?? '') !== $f['segment'])         return false;
  if (!empty($f['niche_key'])       && ($d['niche_key']       ?? '') !== $f['niche_key'])       return false;
  if (!empty($f['status'])          && ($d['status']          ?? '') !== $f['status'])          return false;
  if (!empty($f['lifecycle_stage']) && ($d['lifecycle_stage'] ?? '') !== $f['lifecycle_stage']) return false;
  if (!empty($f['region'])          && ($d['region']          ?? '') !== $f['region'])          return false;
  if (!empty($f['city'])            && ($d['city']            ?? '') !== $f['city'])            return false;
  if (isset($f['score_gte']) && (int)($d['score'] ?? 0) < (int)$f['score_gte']) return false;
  if (isset($f['score_lte']) && (int)($d['score'] ?? 0) > (int)$f['score_lte']) return false;
  return true;
}

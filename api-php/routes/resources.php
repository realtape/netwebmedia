<?php
/* /api/resources/{type}[/{id}]
   Generic CRUD for any resource type stored in the `resources` table. */

/**
 * Keep the dedicated `public_token` column in sync with what's in
 * `data.public_token` for type='ai_agent'. Best-effort: if the column hasn't
 * been added yet (migrate.php not run), the UPDATE is silently skipped.
 *
 * This is the write side of the cross-tenant agent leak fix in
 * routes/ai.php::route_public_agent_chat — that lookup prefers the indexed
 * column; if rows lack a value, the lookup falls back to JSON_EXTRACT.
 */
function _resources_sync_public_token($id, $type, $data) {
  if ($type !== 'ai_agent') return;
  $token = is_array($data) ? ($data['public_token'] ?? null) : null;
  if ($token !== null && !is_string($token)) $token = null;
  if (is_string($token) && !preg_match('/^[A-Za-z0-9_\-]{1,64}$/', $token)) {
    // Don't write garbage into a UNIQUE indexed column.
    $token = null;
  }
  try {
    qExec("UPDATE resources SET public_token = ? WHERE id = ?", [$token, $id]);
  } catch (Throwable $e) {
    // Column may not exist yet on this install; safe to ignore.
  }
}

function route_resources($parts, $method) {
  $type = $parts[0] ?? null;
  if (!$type) err('Missing resource type', 400);
  if (!preg_match('/^[a-z_][a-z0-9_-]{0,48}$/', $type)) err('Invalid resource type', 400);

  $id = isset($parts[1]) ? (int) $parts[1] : null;

  $u = requirePaidAccess();
  $org = (int) $u['org_id'];

  // GET list
  if (!$id && $method === 'GET') {
    $q = qparam('q', '');
    $status = qparam('status', '');
    $limit = max(1, min(500, (int) qparam('limit', 100)));
    $offset = max(0, (int) qparam('offset', 0));

    $where = ['org_id = ?', 'type = ?'];
    $params = [$org, $type];
    if ($status !== '') { $where[] = 'status = ?'; $params[] = $status; }
    if ($q !== '') {
      $where[] = '(title LIKE ? OR slug LIKE ? OR data LIKE ?)';
      $like = '%' . $q . '%';
      array_push($params, $like, $like, $like);
    }
    $whereSql = implode(' AND ', $where);

    $total = (int) qOne("SELECT COUNT(*) AS c FROM resources WHERE $whereSql", $params)['c'];
    $rows = qAll(
      "SELECT id, slug, title, status, data, owner_id, created_at, updated_at
       FROM resources WHERE $whereSql ORDER BY updated_at DESC LIMIT $limit OFFSET $offset",
      $params
    );
    foreach ($rows as &$r) $r['data'] = json_decode($r['data'], true);
    json_out(['total' => $total, 'limit' => $limit, 'offset' => $offset, 'items' => $rows]);
  }

  // GET one
  if ($id && $method === 'GET') {
    $r = qOne("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?", [$id, $org, $type]);
    if (!$r) err('Not found', 404);
    $r['data'] = json_decode($r['data'], true);
    json_out($r);
  }

  // POST create
  if (!$id && $method === 'POST') {
    $b = body();
    $data = $b['data'] ?? [];
    $title = $b['title'] ?? null;
    $slug = $b['slug'] ?? null;
    $status = $b['status'] ?? 'active';
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [$org, $type, $slug, $title, $status, json_encode($data), $u['id']]
    );
    $newId = lastId();
    _resources_sync_public_token($newId, $type, $data);
    $r = qOne("SELECT * FROM resources WHERE id = ?", [$newId]);
    $r['data'] = json_decode($r['data'], true);
    log_activity('resource.create', $type, $newId, ['title' => $title]);
    json_out($r, 201);
  }

  // PUT update
  if ($id && $method === 'PUT') {
    $row = qOne("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?", [$id, $org, $type]);
    if (!$row) err('Not found', 404);
    $b = body();
    $fields = [];
    $params = [];
    foreach (['slug', 'title', 'status'] as $f) {
      if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if (array_key_exists('data', $b)) { $fields[] = "data = ?"; $params[] = json_encode($b['data']); }
    if (!$fields) err('No fields to update');
    $params[] = $id;
    qExec("UPDATE resources SET " . implode(', ', $fields) . " WHERE id = ?", $params);
    if (array_key_exists('data', $b)) {
      _resources_sync_public_token($id, $type, $b['data']);
    }
    $r = qOne("SELECT * FROM resources WHERE id = ?", [$id]);
    $r['data'] = json_decode($r['data'], true);
    log_activity('resource.update', $type, $id);
    json_out($r);
  }

  // DELETE
  if ($id && $method === 'DELETE') {
    $row = qOne("SELECT id FROM resources WHERE id = ? AND org_id = ? AND type = ?", [$id, $org, $type]);
    if (!$row) err('Not found', 404);
    qExec("DELETE FROM resources WHERE id = ?", [$id]);
    log_activity('resource.delete', $type, $id);
    json_out(['ok' => true]);
  }

  err('Method not allowed', 405);
}

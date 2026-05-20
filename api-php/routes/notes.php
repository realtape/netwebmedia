<?php
/**
 * Notes — threaded annotations on contacts, deals, and tasks.
 *
 * Routes (all auth):
 *   GET    /api/notes?contact_id=X | deal_id=X | task_id=X — list notes for a record
 *   POST   /api/notes              — create  { body, contact_id?, deal_id?, task_id?, pinned? }
 *   PUT    /api/notes/{id}         — update body / pinned
 *   DELETE /api/notes/{id}         — delete (author or admin only)
 *
 * Each note emits a `note.added` / `note.updated` / `note.deleted` activity event so it
 * shows up in the contact/deal timeline.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function notes_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS notes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    user_id     INT DEFAULT NULL,
    contact_id  INT DEFAULT NULL,
    deal_id     INT DEFAULT NULL,
    task_id     INT DEFAULT NULL,
    body        TEXT NOT NULL,
    pinned      TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_contact (contact_id, pinned, created_at),
    KEY ix_deal    (deal_id,    pinned, created_at),
    KEY ix_task    (task_id,    pinned, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_notes($parts, $method) {
  notes_ensure_schema();
  $user = requireAuth();

  $id = isset($parts[0]) && ctype_digit((string)$parts[0]) ? (int)$parts[0] : null;
  if ($id) {
    if ($method === 'PUT')    return notes_update($id, $user);
    if ($method === 'DELETE') return notes_delete($id, $user);
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return notes_list($user);
  if ($method === 'POST') return notes_create($user);
  err('Method not allowed', 405);
}

function notes_list($user) {
  $org = (int)($user['org_id'] ?? 1);
  $where = ['n.org_id = ?']; $params = [$org];
  if ($c = qparam('contact_id')) { $where[] = 'n.contact_id = ?'; $params[] = (int)$c; }
  if ($d = qparam('deal_id'))    { $where[] = 'n.deal_id = ?';    $params[] = (int)$d; }
  if ($t = qparam('task_id'))    { $where[] = 'n.task_id = ?';    $params[] = (int)$t; }
  if (count($where) === 1) err('Pass contact_id, deal_id, or task_id');

  $rows = qAll(
    "SELECT n.*, u.name AS author_name, u.email AS author_email
       FROM notes n
       LEFT JOIN users u ON u.id = n.user_id
      WHERE " . implode(' AND ', $where) . "
      ORDER BY n.pinned DESC, n.created_at DESC LIMIT 200",
    $params
  );
  foreach ($rows as &$r) {
    $r['id']         = (int)$r['id'];
    $r['user_id']    = $r['user_id']    !== null ? (int)$r['user_id']    : null;
    $r['contact_id'] = $r['contact_id'] !== null ? (int)$r['contact_id'] : null;
    $r['deal_id']    = $r['deal_id']    !== null ? (int)$r['deal_id']    : null;
    $r['task_id']    = $r['task_id']    !== null ? (int)$r['task_id']    : null;
    $r['pinned']     = (int)$r['pinned'];
  }
  json_out(['notes' => $rows, 'count' => count($rows)]);
}

function notes_create($user) {
  $b = body();
  $body = trim((string)($b['body'] ?? ''));
  if (!$body) err('body is required');
  if (mb_strlen($body) > 5000) err('Note too long (max 5000 chars)');

  $contactId = isset($b['contact_id']) ? (int)$b['contact_id'] : null;
  $dealId    = isset($b['deal_id'])    ? (int)$b['deal_id']    : null;
  $taskId    = isset($b['task_id'])    ? (int)$b['task_id']    : null;
  if (!$contactId && !$dealId && !$taskId) err('Attach at least one of contact_id, deal_id, task_id');

  qExec(
    "INSERT INTO notes (org_id, user_id, contact_id, deal_id, task_id, body, pinned)
     VALUES (?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      $contactId, $dealId, $taskId,
      $body,
      !empty($b['pinned']) ? 1 : 0,
    ]
  );
  $id = lastId();

  if (function_exists('log_activity')) {
    log_activity('note.added', $contactId ? 'contact' : ($dealId ? 'deal' : 'task'),
                 $contactId ?: ($dealId ?: $taskId),
                 ['note_id' => $id, 'preview' => mb_substr($body, 0, 80),
                  'contact_id' => $contactId, 'deal_id' => $dealId, 'task_id' => $taskId]);
  }

  $row = qOne(
    "SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.id = ?",
    [$id]
  );
  json_out(['note' => $row], 201);
}

function notes_update($id, $user) {
  $row = qOne("SELECT * FROM notes WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Note not found', 404);
  // Only author or admin can edit
  if ((int)$row['user_id'] !== (int)$user['id'] && ($user['role'] ?? '') !== 'admin') {
    err('Forbidden', 403);
  }

  $b = body();
  $sets = []; $params = [];
  if (array_key_exists('body', $b)) {
    $body = trim((string)$b['body']);
    if (!$body) err('body required');
    if (mb_strlen($body) > 5000) err('Note too long');
    $sets[] = 'body = ?'; $params[] = $body;
  }
  if (array_key_exists('pinned', $b)) {
    $sets[] = 'pinned = ?'; $params[] = !empty($b['pinned']) ? 1 : 0;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE notes SET " . implode(', ', $sets) . " WHERE id = ?", $params);

  if (function_exists('log_activity')) {
    log_activity('note.updated', null, $id, ['fields' => array_keys($b)]);
  }

  $updated = qOne(
    "SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.id = ?",
    [$id]
  );
  json_out(['note' => $updated]);
}

function notes_delete($id, $user) {
  $row = qOne("SELECT * FROM notes WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Note not found', 404);
  if ((int)$row['user_id'] !== (int)$user['id'] && ($user['role'] ?? '') !== 'admin') {
    err('Forbidden', 403);
  }
  qExec("DELETE FROM notes WHERE id = ?", [$id]);
  if (function_exists('log_activity')) {
    log_activity('note.deleted', null, $id, [
      'contact_id' => $row['contact_id'], 'deal_id' => $row['deal_id'], 'task_id' => $row['task_id'],
    ]);
  }
  json_out(['ok' => true, 'id' => $id]);
}

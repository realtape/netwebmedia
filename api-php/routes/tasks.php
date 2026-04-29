<?php
/**
 * Tasks — sales rep to-dos linked to contacts and deals.
 *
 * Routes:
 *  GET    /api/tasks                  — list (filters: status, assigned_to, contact_id, deal_id, due, q)
 *  GET    /api/tasks/stats            — counts by status
 *  GET    /api/tasks/upcoming         — tasks due in next 7 days, current user
 *  GET    /api/tasks/:id              — fetch one
 *  POST   /api/tasks                  — create
 *  PUT    /api/tasks/:id              — update
 *  POST   /api/tasks/:id/complete     — mark complete (logs activity)
 *  POST   /api/tasks/:id/reopen       — undo complete
 *  DELETE /api/tasks/:id              — delete
 *
 * All routes require auth. assigned_to defaults to current user on create.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function tasks_ensure_schema() {
  static $done = false;
  if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS tasks (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    org_id       INT NOT NULL DEFAULT 1,
    title        VARCHAR(255) NOT NULL,
    description  TEXT DEFAULT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'open',
    priority     VARCHAR(20) NOT NULL DEFAULT 'normal',
    task_type    VARCHAR(40) NOT NULL DEFAULT 'todo',
    due_at       DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    assigned_to  INT DEFAULT NULL,
    created_by   INT DEFAULT NULL,
    contact_id   INT DEFAULT NULL,
    deal_id      INT DEFAULT NULL,
    meta         JSON DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org_status (org_id, status, due_at),
    KEY ix_assigned (assigned_to, status),
    KEY ix_contact (contact_id),
    KEY ix_deal (deal_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_tasks($parts, $method) {
  tasks_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'stats' && $method === 'GET') return tasks_stats($user);
  if ($sub === 'upcoming' && $method === 'GET') return tasks_upcoming($user);

  if (ctype_digit((string)$sub)) {
    $id = (int)$sub;
    $action = $parts[1] ?? null;
    if ($action === 'complete' && $method === 'POST') return tasks_complete($id, $user);
    if ($action === 'reopen' && $method === 'POST') return tasks_reopen($id, $user);
    if (!$action) {
      if ($method === 'GET')    return tasks_get($id, $user);
      if ($method === 'PUT')    return tasks_update($id, $user);
      if ($method === 'DELETE') return tasks_delete($id, $user);
    }
    err('Task route not found', 404);
  }

  if (!$sub) {
    if ($method === 'GET')  return tasks_list($user);
    if ($method === 'POST') return tasks_create($user);
  }

  err('Tasks route not found', 404);
}

function tasks_list($user) {
  $org = (int)($user['org_id'] ?? 1);
  $where = ['org_id = ?'];
  $params = [$org];

  if ($s = qparam('status'))      { $where[] = 'status = ?';      $params[] = $s; }
  if ($a = qparam('assigned_to')) { $where[] = 'assigned_to = ?'; $params[] = (int)$a; }
  if ($c = qparam('contact_id'))  { $where[] = 'contact_id = ?';  $params[] = (int)$c; }
  if ($d = qparam('deal_id'))     { $where[] = 'deal_id = ?';     $params[] = (int)$d; }
  if ($q = qparam('q'))           { $where[] = '(title LIKE ? OR description LIKE ?)';
                                    $params[] = "%$q%"; $params[] = "%$q%"; }

  $due = qparam('due'); // overdue | today | week
  if ($due === 'overdue') {
    $where[] = "due_at < NOW() AND status NOT IN ('done','cancelled')";
  } elseif ($due === 'today') {
    $where[] = "DATE(due_at) = CURDATE()";
  } elseif ($due === 'week') {
    $where[] = "due_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)";
  }

  $limit  = max(1, min(500, (int)(qparam('limit', 100))));
  $offset = max(0, (int)(qparam('offset', 0)));
  $sql = "SELECT * FROM tasks WHERE " . implode(' AND ', $where)
       . " ORDER BY (status='done') ASC, COALESCE(due_at, '9999-12-31') ASC, id DESC"
       . " LIMIT $limit OFFSET $offset";

  $rows = qAll($sql, $params);
  foreach ($rows as &$r) $r = tasks_decorate($r);

  $total = (int)(qOne(
    "SELECT COUNT(*) c FROM tasks WHERE " . implode(' AND ', $where), $params
  )['c'] ?? 0);

  json_out(['tasks' => $rows, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

function tasks_get($id, $user) {
  $row = tasks_find($id, $user);
  if (!$row) err('Task not found', 404);
  json_out(['task' => tasks_decorate($row)]);
}

function tasks_create($user) {
  $b = body();
  if (empty($b['title'])) err('title is required');

  $row = [
    'org_id'      => (int)($user['org_id'] ?? 1),
    'title'       => trim($b['title']),
    'description' => $b['description'] ?? null,
    'status'      => tasks_norm_status($b['status'] ?? 'open'),
    'priority'    => tasks_norm_priority($b['priority'] ?? 'normal'),
    'task_type'   => tasks_norm_type($b['task_type'] ?? 'todo'),
    'due_at'      => tasks_parse_date($b['due_at'] ?? null),
    'assigned_to' => isset($b['assigned_to']) ? (int)$b['assigned_to'] : (int)$user['id'],
    'created_by'  => (int)$user['id'],
    'contact_id'  => isset($b['contact_id']) ? (int)$b['contact_id'] : null,
    'deal_id'     => isset($b['deal_id'])    ? (int)$b['deal_id']    : null,
    'meta'        => isset($b['meta']) ? json_encode($b['meta']) : null,
  ];

  qExec(
    "INSERT INTO tasks (org_id,title,description,status,priority,task_type,due_at,assigned_to,created_by,contact_id,deal_id,meta)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    array_values($row)
  );
  $id = lastId();

  log_activity('task.created', 'task', $id, ['title' => $row['title'], 'contact_id' => $row['contact_id'], 'deal_id' => $row['deal_id']]);

  $created = qOne("SELECT * FROM tasks WHERE id = ?", [$id]);
  json_out(['task' => tasks_decorate($created)], 201);
}

function tasks_update($id, $user) {
  $row = tasks_find($id, $user);
  if (!$row) err('Task not found', 404);

  $b = body();
  $sets = []; $params = [];
  $allowed = ['title','description','priority','task_type','due_at','assigned_to','contact_id','deal_id','status','meta'];
  foreach ($allowed as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'status')    $v = tasks_norm_status($v);
    if ($k === 'priority')  $v = tasks_norm_priority($v);
    if ($k === 'task_type') $v = tasks_norm_type($v);
    if ($k === 'due_at')    $v = tasks_parse_date($v);
    if ($k === 'meta')      $v = $v === null ? null : json_encode($v);
    if (in_array($k, ['assigned_to','contact_id','deal_id'])) {
      $v = ($v === '' || $v === null) ? null : (int)$v;
    }
    $sets[] = "$k = ?";
    $params[] = $v;
  }
  if (!$sets) err('No fields to update');

  $params[] = $id;
  qExec("UPDATE tasks SET " . implode(', ', $sets) . " WHERE id = ?", $params);

  log_activity('task.updated', 'task', $id, ['fields' => array_keys($b)]);

  $updated = qOne("SELECT * FROM tasks WHERE id = ?", [$id]);
  json_out(['task' => tasks_decorate($updated)]);
}

function tasks_complete($id, $user) {
  $row = tasks_find($id, $user);
  if (!$row) err('Task not found', 404);
  qExec("UPDATE tasks SET status='done', completed_at=NOW() WHERE id=?", [$id]);
  log_activity('task.completed', 'task', $id, [
    'title'      => $row['title'],
    'contact_id' => $row['contact_id'],
    'deal_id'    => $row['deal_id'],
  ]);
  $updated = qOne("SELECT * FROM tasks WHERE id = ?", [$id]);
  json_out(['task' => tasks_decorate($updated)]);
}

function tasks_reopen($id, $user) {
  $row = tasks_find($id, $user);
  if (!$row) err('Task not found', 404);
  qExec("UPDATE tasks SET status='open', completed_at=NULL WHERE id=?", [$id]);
  log_activity('task.reopened', 'task', $id);
  $updated = qOne("SELECT * FROM tasks WHERE id = ?", [$id]);
  json_out(['task' => tasks_decorate($updated)]);
}

function tasks_delete($id, $user) {
  $row = tasks_find($id, $user);
  if (!$row) err('Task not found', 404);
  qExec("DELETE FROM tasks WHERE id=?", [$id]);
  log_activity('task.deleted', 'task', $id);
  json_out(['ok' => true, 'id' => $id]);
}

function tasks_stats($user) {
  $org = (int)($user['org_id'] ?? 1);
  $rows = qAll(
    "SELECT status, COUNT(*) c FROM tasks WHERE org_id=? GROUP BY status",
    [$org]
  );
  $by = ['open' => 0, 'in_progress' => 0, 'done' => 0, 'cancelled' => 0];
  foreach ($rows as $r) $by[$r['status']] = (int)$r['c'];

  $overdue = (int)(qOne(
    "SELECT COUNT(*) c FROM tasks WHERE org_id=? AND status NOT IN ('done','cancelled') AND due_at < NOW()",
    [$org]
  )['c'] ?? 0);

  $today = (int)(qOne(
    "SELECT COUNT(*) c FROM tasks WHERE org_id=? AND status NOT IN ('done','cancelled') AND DATE(due_at)=CURDATE()",
    [$org]
  )['c'] ?? 0);

  $mine_open = (int)(qOne(
    "SELECT COUNT(*) c FROM tasks WHERE org_id=? AND assigned_to=? AND status NOT IN ('done','cancelled')",
    [$org, (int)$user['id']]
  )['c'] ?? 0);

  json_out(['ok' => true, 'by_status' => $by, 'overdue' => $overdue, 'due_today' => $today, 'mine_open' => $mine_open]);
}

function tasks_upcoming($user) {
  $org = (int)($user['org_id'] ?? 1);
  $rows = qAll(
    "SELECT * FROM tasks
     WHERE org_id=? AND assigned_to=? AND status NOT IN ('done','cancelled')
       AND (due_at IS NULL OR due_at <= DATE_ADD(NOW(), INTERVAL 7 DAY))
     ORDER BY COALESCE(due_at, '9999-12-31') ASC, priority DESC, id DESC
     LIMIT 50",
    [$org, (int)$user['id']]
  );
  foreach ($rows as &$r) $r = tasks_decorate($r);
  json_out(['tasks' => $rows]);
}

function tasks_find($id, $user) {
  return qOne("SELECT * FROM tasks WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
}

function tasks_decorate($row) {
  if (!$row) return $row;
  $row['id']          = (int)$row['id'];
  $row['org_id']      = (int)$row['org_id'];
  $row['assigned_to'] = $row['assigned_to'] !== null ? (int)$row['assigned_to'] : null;
  $row['created_by']  = $row['created_by']  !== null ? (int)$row['created_by']  : null;
  $row['contact_id']  = $row['contact_id']  !== null ? (int)$row['contact_id']  : null;
  $row['deal_id']     = $row['deal_id']     !== null ? (int)$row['deal_id']     : null;
  $row['meta']        = $row['meta'] ? json_decode($row['meta'], true) : null;
  $row['overdue']     = (!in_array($row['status'], ['done','cancelled']) && $row['due_at'] && strtotime($row['due_at']) < time());
  return $row;
}

function tasks_norm_status($s) {
  $s = strtolower(trim((string)$s));
  return in_array($s, ['open','in_progress','done','cancelled'], true) ? $s : 'open';
}
function tasks_norm_priority($p) {
  $p = strtolower(trim((string)$p));
  return in_array($p, ['low','normal','high','urgent'], true) ? $p : 'normal';
}
function tasks_norm_type($t) {
  $t = strtolower(trim((string)$t));
  return in_array($t, ['todo','call','email','meeting','follow_up','demo','proposal'], true) ? $t : 'todo';
}
function tasks_parse_date($v) {
  if (!$v) return null;
  $ts = strtotime($v);
  return $ts ? date('Y-m-d H:i:s', $ts) : null;
}

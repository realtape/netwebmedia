<?php
/**
 * Activity Timeline — unified feed across activity_log + email engagement + tasks.
 *
 * Routes:
 *  GET /api/timeline?contact_id=X    — feed for one contact
 *  GET /api/timeline?deal_id=X       — feed for one deal
 *  GET /api/timeline?user_id=X       — actions taken by a user
 *  GET /api/timeline                 — global recent activity (admin)
 *
 * Query params: limit (default 50, max 200), since (ISO date), types (csv: task,email,deal,note,sync,call,wa)
 *
 * Sources merged:
 *  - activity_log table (auth events, resource CRUD, task lifecycle, custom log_activity calls)
 *  - tasks table (open/completed/overdue tasks for context)
 *  - campaign_recipients (email opens / clicks / sends, when contact_id matches)
 *  - resources (notes appended to contact/deal data)
 *
 * Output: array of normalized events sorted desc by timestamp.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function timeline_ensure_schema() {
  static $done = false;
  if ($done) return;
  // Mirror of log_activity() target — created defensively in case auth.sql wasn't run.
  db()->exec("CREATE TABLE IF NOT EXISTS activity_log (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    org_id        INT NOT NULL DEFAULT 1,
    user_id       INT DEFAULT NULL,
    action        VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50) DEFAULT NULL,
    resource_id   INT DEFAULT NULL,
    meta          JSON DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_org_time (org_id, created_at),
    KEY ix_user (user_id, created_at),
    KEY ix_resource (resource_type, resource_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_timeline($parts, $method) {
  if ($method !== 'GET') err('Method not allowed', 405);
  timeline_ensure_schema();
  $user = requireAuth();

  $contactId = qparam('contact_id') ? (int)qparam('contact_id') : null;
  $dealId    = qparam('deal_id')    ? (int)qparam('deal_id')    : null;
  $userId    = qparam('user_id')    ? (int)qparam('user_id')    : null;
  $limit     = max(1, min(200, (int)qparam('limit', 50)));
  $since     = qparam('since');
  $types     = qparam('types') ? array_map('trim', explode(',', qparam('types'))) : null;

  $events = [];

  // 1) activity_log entries
  $events = array_merge($events, timeline_from_activity_log($user, $contactId, $dealId, $userId, $since, $limit));

  // 2) tasks linked to this contact/deal (creation, completion)
  if ($contactId || $dealId) {
    $events = array_merge($events, timeline_from_tasks($user, $contactId, $dealId, $since, $limit));
  }

  // 3) email engagement (campaigns) — only when scoped to a contact
  if ($contactId) {
    $events = array_merge($events, timeline_from_campaigns($user, $contactId, $since, $limit));
  }

  // Filter by types if given
  if ($types) {
    $events = array_values(array_filter($events, fn($e) => in_array($e['kind'], $types, true)));
  }

  // Sort desc + cap
  usort($events, fn($a, $b) => strcmp($b['ts'], $a['ts']));
  $events = array_slice($events, 0, $limit);

  json_out([
    'ok'       => true,
    'events'   => $events,
    'count'    => count($events),
    'scope'    => array_filter([
      'contact_id' => $contactId, 'deal_id' => $dealId, 'user_id' => $userId,
    ]),
  ]);
}

function timeline_from_activity_log($user, $contactId, $dealId, $userId, $since, $limit) {
  $org = (int)($user['org_id'] ?? 1);
  $where = ['al.org_id = ?'];
  $params = [$org];

  if ($contactId) {
    // Activity may reference contact directly (resource_type=contact) or via task/deal meta
    $where[] = "((al.resource_type='contact' AND al.resource_id = ?)
                  OR JSON_EXTRACT(al.meta, '$.contact_id') = ?)";
    $params[] = $contactId; $params[] = $contactId;
  }
  if ($dealId) {
    $where[] = "((al.resource_type='deal' AND al.resource_id = ?)
                  OR JSON_EXTRACT(al.meta, '$.deal_id') = ?)";
    $params[] = $dealId; $params[] = $dealId;
  }
  if ($userId) {
    $where[] = "al.user_id = ?";
    $params[] = $userId;
  }
  if ($since) {
    $where[] = "al.created_at >= ?";
    $params[] = $since;
  }

  try {
    $rows = qAll(
      "SELECT al.id, al.action, al.resource_type, al.resource_id, al.meta, al.created_at,
              al.user_id, u.name AS user_name, u.email AS user_email
       FROM activity_log al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE " . implode(' AND ', $where) . "
       ORDER BY al.created_at DESC
       LIMIT $limit",
      $params
    );
  } catch (Exception $e) { return []; }

  $out = [];
  foreach ($rows as $r) {
    $meta = $r['meta'] ? json_decode($r['meta'], true) : null;
    $out[] = [
      'kind'         => timeline_classify_action($r['action']),
      'action'       => $r['action'],
      'ts'           => $r['created_at'],
      'resource_type'=> $r['resource_type'],
      'resource_id'  => $r['resource_id'] !== null ? (int)$r['resource_id'] : null,
      'user'         => $r['user_id'] ? [
                          'id'    => (int)$r['user_id'],
                          'name'  => $r['user_name'],
                          'email' => $r['user_email'],
                        ] : null,
      'meta'         => $meta,
      'summary'      => timeline_summarize($r['action'], $meta, $r['user_name']),
    ];
  }
  return $out;
}

function timeline_from_tasks($user, $contactId, $dealId, $since, $limit) {
  $org = (int)($user['org_id'] ?? 1);
  $where = ['t.org_id = ?'];
  $params = [$org];
  if ($contactId) { $where[] = 't.contact_id = ?'; $params[] = $contactId; }
  if ($dealId)    { $where[] = 't.deal_id = ?';    $params[] = $dealId; }
  if ($since)     { $where[] = "GREATEST(COALESCE(t.completed_at, t.updated_at), t.created_at) >= ?"; $params[] = $since; }

  try {
    $rows = qAll(
      "SELECT t.id, t.title, t.status, t.task_type, t.priority, t.due_at,
              t.completed_at, t.created_at, t.updated_at,
              u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE " . implode(' AND ', $where) . "
       ORDER BY t.updated_at DESC
       LIMIT $limit",
      $params
    );
  } catch (Exception $e) { return []; }

  $out = [];
  foreach ($rows as $r) {
    if ($r['status'] === 'done' && $r['completed_at']) {
      $out[] = [
        'kind'    => 'task',
        'action'  => 'task.completed',
        'ts'      => $r['completed_at'],
        'resource_type' => 'task',
        'resource_id'   => (int)$r['id'],
        'summary' => "✅ {$r['assignee_name']} completed task: " . $r['title'],
        'meta'    => ['title' => $r['title'], 'task_type' => $r['task_type']],
      ];
    } else {
      $overdue = $r['due_at'] && strtotime($r['due_at']) < time();
      $out[] = [
        'kind'    => 'task',
        'action'  => $overdue ? 'task.overdue' : 'task.open',
        'ts'      => $r['created_at'],
        'resource_type' => 'task',
        'resource_id'   => (int)$r['id'],
        'summary' => ($overdue ? '⚠️ Overdue: ' : '📋 Task: ') . $r['title']
                     . ($r['assignee_name'] ? " (→ {$r['assignee_name']})" : ''),
        'meta'    => ['title' => $r['title'], 'task_type' => $r['task_type'], 'due_at' => $r['due_at'], 'priority' => $r['priority']],
      ];
    }
  }
  return $out;
}

function timeline_from_campaigns($user, $contactId, $since, $limit) {
  // Resolve contact email via resources (preferred) or contacts table
  $email = null;
  try {
    $row = qOne("SELECT data FROM resources WHERE id=? AND type='contact'", [$contactId]);
    if ($row) { $d = json_decode($row['data'] ?? '{}', true); $email = $d['email'] ?? null; }
  } catch (Exception $e) {}
  if (!$email) {
    try {
      $row = qOne("SELECT email FROM contacts WHERE id=?", [$contactId]);
      if ($row) $email = $row['email'];
    } catch (Exception $e) {}
  }
  if (!$email) return [];

  try {
    $where = "cr.email = ?";
    $params = [$email];
    if ($since) { $where .= " AND COALESCE(cr.clicked_at, cr.opened_at, cr.sent_at) >= ?"; $params[] = $since; }

    $rows = qAll(
      "SELECT cr.email, cr.sent_at, cr.opened_at, cr.clicked_at, c.subject, c.id AS campaign_id
       FROM campaign_recipients cr
       LEFT JOIN campaigns c ON c.id = cr.campaign_id
       WHERE $where
       ORDER BY COALESCE(cr.clicked_at, cr.opened_at, cr.sent_at) DESC
       LIMIT $limit",
      $params
    );
  } catch (Exception $e) { return []; }

  $out = [];
  foreach ($rows as $r) {
    $subject = $r['subject'] ?: '(untitled campaign)';
    if ($r['clicked_at']) {
      $out[] = [
        'kind' => 'email', 'action' => 'email.clicked', 'ts' => $r['clicked_at'],
        'resource_type' => 'campaign', 'resource_id' => (int)$r['campaign_id'],
        'summary' => "🔗 Clicked link in: $subject",
        'meta'    => ['subject' => $subject],
      ];
    }
    if ($r['opened_at']) {
      $out[] = [
        'kind' => 'email', 'action' => 'email.opened', 'ts' => $r['opened_at'],
        'resource_type' => 'campaign', 'resource_id' => (int)$r['campaign_id'],
        'summary' => "👁 Opened: $subject",
        'meta'    => ['subject' => $subject],
      ];
    }
    if ($r['sent_at']) {
      $out[] = [
        'kind' => 'email', 'action' => 'email.sent', 'ts' => $r['sent_at'],
        'resource_type' => 'campaign', 'resource_id' => (int)$r['campaign_id'],
        'summary' => "✉️ Sent: $subject",
        'meta'    => ['subject' => $subject],
      ];
    }
  }
  return $out;
}

function timeline_classify_action($action) {
  if (strpos($action, 'task.')   === 0) return 'task';
  if (strpos($action, 'email.')  === 0) return 'email';
  if (strpos($action, 'deal.')   === 0) return 'deal';
  if (strpos($action, 'contact.') === 0) return 'contact';
  if (strpos($action, 'note.')   === 0) return 'note';
  if (strpos($action, 'wa.')     === 0 || strpos($action, 'whatsapp.') === 0) return 'wa';
  if (strpos($action, 'call.')   === 0) return 'call';
  if (strpos($action, 'sync.')   === 0 || strpos($action, 'hubspot.') === 0) return 'sync';
  if (strpos($action, 'lead.')   === 0) return 'lead';
  if (strpos($action, 'auth.')   === 0) return 'auth';
  return 'other';
}

function timeline_summarize($action, $meta, $userName) {
  $u = $userName ?: 'system';
  $title = $meta['title'] ?? $meta['subject'] ?? $meta['name'] ?? null;
  $map = [
    'task.created'    => "📋 $u created task" . ($title ? ": $title" : ''),
    'task.completed'  => "✅ $u completed task" . ($title ? ": $title" : ''),
    'task.updated'    => "✏️ $u updated task" . ($title ? ": $title" : ''),
    'task.deleted'    => "🗑 $u deleted a task",
    'task.reopened'   => "↩️ $u reopened task" . ($title ? ": $title" : ''),
    'deal.created'    => "💼 $u created a deal",
    'deal.updated'    => "✏️ $u updated a deal",
    'deal.won'        => "🏆 $u marked deal won",
    'deal.lost'       => "❌ $u marked deal lost",
    'contact.created' => "👤 $u added a contact",
    'contact.updated' => "✏️ $u updated a contact",
    'note.added'      => "📝 $u added a note",
    'lead.qualified'  => "✨ Lead qualified",
    'lead.assigned'   => "👥 Lead assigned",
    'hubspot.synced'  => "🔄 HubSpot synced",
  ];
  return $map[$action] ?? "$u: $action";
}

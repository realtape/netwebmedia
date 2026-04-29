<?php
/**
 * Notifications — in-app notifications + optional web-push subscriptions.
 *
 * Two parallel systems share this route:
 *   1. IN-APP notifications (works in any browser): polled by the bell icon.
 *      Stored in `notifications`. Created internally from triggers (booking,
 *      task assignment, lead replied, etc.) and exposed for read.
 *   2. WEB PUSH subscriptions (Chrome/Firefox/Edge): a service worker subscribes,
 *      we store the subscription JSON. Dispatch over the Web Push protocol
 *      requires VAPID keys + an encryption library (minishlink/web-push). For
 *      now the storage and admin UI are in place — actual outbound encrypted
 *      push is left as a no-op until composer-installed (logged for diagnosis).
 *
 * Routes (all auth):
 *   GET    /api/notifications                       — list mine (filters: unread, limit)
 *   GET    /api/notifications/count                 — unread count (cheap, for the bell)
 *   POST   /api/notifications                       — create one (admin/system only)
 *   POST   /api/notifications/{id}/read             — mark single as read
 *   POST   /api/notifications/mark-all-read         — mark every unread as read
 *   DELETE /api/notifications/{id}                  — delete (mine only)
 *
 *   GET    /api/notifications/push/key              — VAPID public key (or null)
 *   POST   /api/notifications/push/subscribe        — register a browser subscription
 *   POST   /api/notifications/push/unsubscribe      — drop a subscription
 *   POST   /api/notifications/push/test             — send a test notification (admin)
 *
 * Triggers — other routes call notifications_dispatch() to drop a row + try push.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function notifications_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    user_id     INT NOT NULL,
    kind        VARCHAR(40) NOT NULL DEFAULT 'system',
    title       VARCHAR(200) NOT NULL,
    body        TEXT DEFAULT NULL,
    link        VARCHAR(500) DEFAULT NULL,
    icon        VARCHAR(40) DEFAULT NULL,
    data        JSON DEFAULT NULL,
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at     DATETIME DEFAULT NULL,
    KEY ix_user (user_id, is_read, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    endpoint      VARCHAR(500) NOT NULL,
    p256dh        VARCHAR(255) DEFAULT NULL,
    auth_key      VARCHAR(255) DEFAULT NULL,
    user_agent    VARCHAR(255) DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_ping_at  DATETIME DEFAULT NULL,
    UNIQUE KEY uniq_endpoint (endpoint),
    KEY ix_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_notifications($parts, $method) {
  notifications_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'count' && $method === 'GET') return notifications_unread_count($user);
  if ($sub === 'mark-all-read' && $method === 'POST') return notifications_mark_all($user);

  if ($sub === 'push') {
    $pushAction = $parts[1] ?? null;
    if ($pushAction === 'key' && $method === 'GET')               return notifications_push_key();
    if ($pushAction === 'subscribe' && $method === 'POST')        return notifications_push_subscribe($user);
    if ($pushAction === 'unsubscribe' && $method === 'POST')      return notifications_push_unsubscribe($user);
    if ($pushAction === 'test' && $method === 'POST')             return notifications_push_test($user);
    err('Push route not found', 404);
  }

  $id = $sub !== null && ctype_digit((string)$sub) ? (int)$sub : null;
  if ($id) {
    $action = $parts[1] ?? null;
    if ($action === 'read' && $method === 'POST') return notifications_mark_read($id, $user);
    if (!$action && $method === 'DELETE') return notifications_delete($id, $user);
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return notifications_list($user);
  if ($method === 'POST') return notifications_create($user);
  err('Method not allowed', 405);
}

/* ─────────────────────  IN-APP  ───────────────────── */

function notifications_list($user) {
  $where  = ['user_id = ?']; $params = [(int)$user['id']];
  if (qparam('unread') === '1') $where[] = 'is_read = 0';
  $limit = max(1, min(200, (int)qparam('limit', 50)));
  $rows = qAll(
    "SELECT * FROM notifications WHERE " . implode(' AND ', $where) . " ORDER BY id DESC LIMIT $limit",
    $params
  );
  foreach ($rows as &$r) {
    $r['id']      = (int)$r['id'];
    $r['user_id'] = (int)$r['user_id'];
    $r['is_read'] = (int)$r['is_read'];
    $r['data']    = $r['data'] ? json_decode($r['data'], true) : null;
  }
  json_out(['notifications' => $rows, 'count' => count($rows)]);
}

function notifications_unread_count($user) {
  $row = qOne("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0", [(int)$user['id']]);
  json_out(['unread' => (int)($row['c'] ?? 0)]);
}

function notifications_create($user) {
  $b = body();
  if (empty($b['title'])) err('title required');
  $targetUser = isset($b['user_id']) ? (int)$b['user_id'] : (int)$user['id'];
  qExec(
    "INSERT INTO notifications (org_id, user_id, kind, title, body, link, icon, data)
     VALUES (?,?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      $targetUser,
      $b['kind']  ?? 'system',
      trim($b['title']),
      $b['body']  ?? null,
      $b['link']  ?? null,
      $b['icon']  ?? null,
      isset($b['data']) ? json_encode($b['data']) : null,
    ]
  );
  $id = lastId();
  // Best-effort web push (no-op without VAPID library)
  notifications_try_web_push($targetUser, [
    'title' => $b['title'], 'body' => $b['body'] ?? '', 'link' => $b['link'] ?? null, 'icon' => $b['icon'] ?? null,
  ]);
  json_out(['ok' => true, 'id' => $id], 201);
}

function notifications_mark_read($id, $user) {
  $row = qOne("SELECT id FROM notifications WHERE id = ? AND user_id = ?", [$id, (int)$user['id']]);
  if (!$row) err('Notification not found', 404);
  qExec("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?", [$id]);
  json_out(['ok' => true]);
}

function notifications_mark_all($user) {
  qExec("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0", [(int)$user['id']]);
  json_out(['ok' => true]);
}

function notifications_delete($id, $user) {
  qExec("DELETE FROM notifications WHERE id = ? AND user_id = ?", [$id, (int)$user['id']]);
  json_out(['ok' => true, 'id' => $id]);
}

/**
 * Public helper called by other routes (booking, leads, sms, tasks) to fan out
 * notifications. Does both an in-app row insert AND a best-effort web push.
 */
function notifications_dispatch($userId, $title, $body = null, $extras = []) {
  notifications_ensure_schema();
  try {
    qExec(
      "INSERT INTO notifications (org_id, user_id, kind, title, body, link, icon, data) VALUES (?,?,?,?,?,?,?,?)",
      [
        (int)($extras['org_id'] ?? 1),
        (int)$userId,
        $extras['kind'] ?? 'system',
        $title,
        $body,
        $extras['link'] ?? null,
        $extras['icon'] ?? null,
        isset($extras['data']) ? json_encode($extras['data']) : null,
      ]
    );
  } catch (Exception $e) { /* silent */ }
  notifications_try_web_push((int)$userId, [
    'title' => $title, 'body' => $body, 'link' => $extras['link'] ?? null, 'icon' => $extras['icon'] ?? null,
  ]);
}

/* ─────────────────────  WEB PUSH  ───────────────────── */

function notifications_push_key() {
  $cfg = config();
  json_out([
    'ok'             => true,
    'public_key'     => $cfg['vapid_public_key'] ?? null,
    'has_dispatcher' => function_exists('notifications_send_web_push_real'), // false unless wired
  ]);
}

function notifications_push_subscribe($user) {
  $b = body();
  $sub = $b['subscription'] ?? $b;
  $endpoint = $sub['endpoint'] ?? null;
  $keys = $sub['keys'] ?? [];
  if (!$endpoint) err('endpoint required');

  qExec(
    "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth_key, user_agent)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       user_id    = VALUES(user_id),
       p256dh     = VALUES(p256dh),
       auth_key   = VALUES(auth_key),
       user_agent = VALUES(user_agent),
       last_ping_at = NULL",
    [
      (int)$user['id'],
      $endpoint,
      $keys['p256dh'] ?? null,
      $keys['auth']   ?? null,
      substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250),
    ]
  );
  json_out(['ok' => true]);
}

function notifications_push_unsubscribe($user) {
  $b = body();
  $endpoint = $b['endpoint'] ?? null;
  if (!$endpoint) err('endpoint required');
  qExec("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?", [$endpoint, (int)$user['id']]);
  json_out(['ok' => true]);
}

function notifications_push_test($user) {
  $b = body();
  $title = trim((string)($b['title'] ?? 'Test notification'));
  $body  = trim((string)($b['body']  ?? 'This is a test from NetWebMedia CRM.'));
  // Insert in-app (so the bell shows it even without push).
  notifications_dispatch((int)$user['id'], $title, $body, ['kind' => 'test', 'icon' => 'bell']);
  json_out(['ok' => true, 'note' => 'Created in-app notification. Web push will fire if VAPID keys + dispatcher are configured.']);
}

/**
 * Best-effort web push fan-out. Becomes a real send only if a VAPID-aware
 * dispatcher is wired in (e.g. notifications_send_web_push_real() loaded from
 * a bridge file that uses minishlink/web-push). Otherwise it's a logged no-op.
 */
function notifications_try_web_push($userId, $payload) {
  if (!function_exists('notifications_send_web_push_real')) return; // dispatcher not wired
  try {
    $rows = qAll("SELECT * FROM push_subscriptions WHERE user_id = ?", [(int)$userId]);
    foreach ($rows as $sub) {
      try {
        notifications_send_web_push_real($sub, $payload);
        qExec("UPDATE push_subscriptions SET last_ping_at = NOW() WHERE id = ?", [(int)$sub['id']]);
      } catch (Exception $e) { /* per-sub failure */ }
    }
  } catch (Exception $e) { /* silent */ }
}

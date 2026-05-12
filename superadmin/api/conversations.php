<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_require();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sa_error('Method not allowed', 405);

try { $db = getDB(); } catch (Exception $e) { sa_error('Database error', 500); }

// Return messages for a single conversation
$convId = (int)($_GET['conv'] ?? 0);
if ($convId) {
    $stmt = $db->prepare(
        'SELECT m.id, m.sender, m.body, m.sent_at,
                c.channel, c.subject,
                ct.name AS contact_name, ct.email AS contact_email
         FROM messages m
         JOIN conversations c  ON c.id  = m.conversation_id
         LEFT JOIN contacts ct ON ct.id = c.contact_id
         WHERE m.conversation_id = ?
         ORDER BY m.sent_at ASC'
    );
    $stmt->execute([$convId]);
    sa_json(['messages' => $stmt->fetchAll()]);
}

// List conversations
$search  = trim($_GET['q']       ?? '');
$channel = trim($_GET['channel'] ?? '');
$ALLOWED_CHANNEL = ['', 'email', 'sms', 'whatsapp'];
if (!in_array($channel, $ALLOWED_CHANNEL, true)) $channel = '';

$where  = [];
$params = [];
if ($search) {
    $like     = '%' . $search . '%';
    $where[]  = '(cv.subject LIKE ? OR ct.name LIKE ? OR ct.email LIKE ?)';
    $params   = array_merge($params, [$like, $like, $like]);
}
if ($channel) {
    $where[]  = 'cv.channel = ?';
    $params[] = $channel;
}

$sql = 'SELECT cv.id, cv.channel, cv.subject, cv.unread,
               cv.created_at, cv.updated_at,
               ct.name AS contact_name, ct.email AS contact_email,
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = cv.id) AS msg_count,
               (SELECT m2.body FROM messages m2 WHERE m2.conversation_id = cv.id ORDER BY m2.sent_at DESC LIMIT 1) AS last_msg
        FROM conversations cv
        LEFT JOIN contacts ct ON ct.id = cv.contact_id';
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY cv.updated_at DESC LIMIT 200';

$stmt = $db->prepare($sql);
$stmt->execute($params);

$total = (int)$db->query('SELECT COUNT(*) FROM conversations')->fetchColumn();

sa_json(['conversations' => $stmt->fetchAll(), 'total' => $total]);

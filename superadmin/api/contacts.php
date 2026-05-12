<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_require();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $allowed = 'https://admin.netwebmedia.com';
    if ($origin && $origin !== $allowed) sa_error('Forbidden', 403);
    if (!$origin && !str_starts_with($referer, $allowed)) sa_error('Forbidden', 403);

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);
    if (!$id) sa_error('Contact ID required');

    $ALLOWED_FIELDS = ['name', 'email', 'phone', 'company', 'role', 'status', 'value', 'notes'];
    $ALLOWED_STATUS = ['lead', 'prospect', 'customer', 'churned'];
    $updates = [];
    $params  = [];
    foreach ($ALLOWED_FIELDS as $f) {
        if (!array_key_exists($f, $data)) continue;
        if ($f === 'status' && !in_array($data[$f], $ALLOWED_STATUS, true)) sa_error('Invalid status');
        $updates[] = "`$f` = ?";
        $params[]  = $data[$f] === '' ? null : $data[$f];
    }
    if (!$updates) sa_error('Nothing to update');
    $params[] = $id;
    try {
        $db->prepare('UPDATE contacts SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        sa_json(['ok' => true]);
    } catch (Exception $e) {
        sa_error('Database error', 500);
    }
}

if ($method !== 'GET') sa_error('Method not allowed', 405);

try {
    $db = getDB();
} catch (Exception $e) {
    sa_error('Database error', 500);
}

$search = trim($_GET['q']      ?? '');
$status = trim($_GET['status'] ?? '');
$ALLOWED_STATUS = ['', 'lead', 'prospect', 'customer', 'churned'];
if (!in_array($status, $ALLOWED_STATUS, true)) $status = '';

$where  = [];
$params = [];

if ($search) {
    $like     = '%' . $search . '%';
    $where[]  = '(name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?)';
    $params   = array_merge($params, [$like, $like, $like, $like]);
}
if ($status) {
    $where[]  = 'status = ?';
    $params[] = $status;
}

$sql = 'SELECT id, name, email, phone, company, role, status, value, last_contact, created_at
        FROM contacts';
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY created_at DESC LIMIT 300';

try {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $contacts = $stmt->fetchAll();

    $total = (int)$db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();
    $byStatus = $db->query(
        "SELECT status, COUNT(*) AS cnt FROM contacts GROUP BY status"
    )->fetchAll(PDO::FETCH_KEY_PAIR);

    sa_json([
        'contacts' => $contacts,
        'total'    => $total,
        'byStatus' => $byStatus,
    ]);
} catch (Exception $e) {
    error_log('[superadmin/contacts] ' . $e->getMessage());
    sa_error('Database error', 500);
}

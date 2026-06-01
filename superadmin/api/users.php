<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_require();

$method = $_SERVER['REQUEST_METHOD'];

// Reject cross-origin writes
if ($method === 'POST') {
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $allowed = 'https://admin.netwebmedia.com';
    if ($origin && $origin !== $allowed) sa_error('Forbidden', 403);
    if (!$origin && !str_starts_with($referer, $allowed)) sa_error('Forbidden', 403);
}

try {
    $db = getDB();
} catch (Exception $e) {
    sa_error('Database error', 500);
}

if ($method === 'GET') {
    $search  = trim($_GET['q'] ?? '');
    $status  = $_GET['status'] ?? '';
    $ALLOWED_STATUS_FILTER = ['', 'active', 'suspended', 'cancelled', 'pending_payment', 'demo'];

    if (!in_array($status, $ALLOWED_STATUS_FILTER, true)) $status = '';

    $where  = [];
    $params = [];

    if ($search) {
        $where[]  = '(name LIKE ? OR email LIKE ? OR company LIKE ?)';
        $like     = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }
    if ($status) {
        $where[]  = 'status = ?';
        $params[] = $status;
    }

    $sql = 'SELECT id, name, email, company, role, plan, status, niche, created_at, last_login
            FROM users';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY created_at DESC LIMIT 200';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sa_json(['users' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);
    if (!$id) sa_error('User ID required');

    $ALLOWED_STATUS = ['active', 'suspended', 'cancelled', 'pending_payment'];
    $ALLOWED_PLAN   = ['starter', 'professional', 'enterprise'];
    $ALLOWED_ROLE   = ['user', 'superadmin'];

    $updates = [];
    $params  = [];

    if (array_key_exists('status', $data)) {
        if (!in_array($data['status'], $ALLOWED_STATUS, true)) sa_error('Invalid status');
        $updates[] = 'status = ?';
        $params[]  = $data['status'];
    }
    if (array_key_exists('plan', $data)) {
        if (!in_array($data['plan'], $ALLOWED_PLAN, true)) sa_error('Invalid plan');
        $updates[] = 'plan = ?';
        $params[]  = $data['plan'];
    }
    if (array_key_exists('role', $data)) {
        if (!in_array($data['role'], $ALLOWED_ROLE, true)) sa_error('Invalid role');
        $updates[] = 'role = ?';
        $params[]  = $data['role'];
    }

    if (!$updates) sa_error('Nothing to update');

    $params[] = $id;
    try {
        $db->prepare('UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?')
           ->execute($params);
        sa_json(['ok' => true]);
    } catch (Exception $e) {
        error_log('[superadmin/users] ' . $e->getMessage());
        sa_error('Database error', 500);
    }
}

sa_error('Method not allowed', 405);

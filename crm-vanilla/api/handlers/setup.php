<?php
/**
 * One-time setup endpoint
 * Creates the admin user with a proper bcrypt hash
 * DELETE THIS FILE after running it once!
 */
// Restrict to localhost and private networks only
$remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';
$allowed_ips = ['127.0.0.1', '::1'];
$is_private = (
    strpos($remoteIp, '10.')    === 0 ||
    strpos($remoteIp, '192.168.') === 0 ||
    preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $remoteIp)
);
if (!in_array($remoteIp, $allowed_ips, true) && !$is_private) {
    jsonError('Access restricted to localhost', 403);
}
if ($method !== 'POST') jsonError('Use POST', 405);

$db = getDB();
$data = getInput();

$action = $data['action'] ?? '';

if ($action === 'create_admin') {
    $password = $data['password'] ?? 'NWM2026!';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Check if admin exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(['carlos@netwebmedia.com']);
    $exists = $stmt->fetch();

    if ($exists) {
        $db->prepare('UPDATE users SET password_hash = ? WHERE email = ?')
            ->execute([$hash, 'carlos@netwebmedia.com']);
        jsonResponse(['updated' => true, 'hash_preview' => substr($hash, 0, 20) . '...']);
    } else {
        $db->prepare('INSERT INTO users (name, email, password_hash, company, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute(['Carlos Martinez', 'carlos@netwebmedia.com', $hash, 'NetWebMedia', 'superadmin', 'enterprise', 'active']);
        jsonResponse(['created' => true, 'hash_preview' => substr($hash, 0, 20) . '...']);
    }
}

if ($action === 'create_user') {
    if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
        jsonError('name, email, and password required');
    }
    $hash = password_hash($data['password'], PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password_hash, company, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $data['name'],
        $data['email'],
        $hash,
        $data['company'] ?? '',
        $data['role'] ?? 'user',
        $data['plan'] ?? 'starter',
        $data['status'] ?? 'pending_payment'
    ]);
    jsonResponse(['created' => true, 'id' => (int)$db->lastInsertId()]);
}

jsonError('Unknown action. Use: create_admin or create_user');

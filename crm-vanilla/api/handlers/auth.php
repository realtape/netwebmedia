<?php
require_once __DIR__ . '/../lib/guard.php';
_guard_session_start();

$db   = getDB();
$data = getInput();

// Logout
if ($method === 'POST' && ($data['action'] ?? '') === 'logout') {
    session_destroy();
    jsonResponse(['ok' => true]);
}

if ($method !== 'POST') jsonError('Method not allowed', 405);

$email    = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonError('Email and password required');
}

$stmt = $db->prepare(
    'SELECT id, name, email, company, password_hash, role, status FROM users WHERE email = ?'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonError('Invalid email or password', 401);
}

if (in_array($user['status'], ['suspended', 'cancelled'], true)) {
    jsonError('Account suspended. Contact support@netwebmedia.com', 403);
}

// Start authenticated session
$_SESSION['nwm_uid'] = (int)$user['id'];

$db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

jsonResponse([
    'id'               => (int)$user['id'],
    'name'             => $user['name'],
    'email'            => $user['email'],
    'company'          => $user['company'] ?? '',
    'type'             => $user['role'] ?? 'user',
    'status'           => $user['status'],
    'requires_payment' => $user['status'] === 'pending_payment',
]);

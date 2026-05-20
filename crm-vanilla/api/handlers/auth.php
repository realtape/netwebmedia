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

try {
    $stmt = $db->prepare(
        'SELECT id, name, email, company, password_hash, role, status, plan, niche FROM users WHERE email = ?'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();
} catch (PDOException $e) {
    // niche/plan column may not exist on fresh installs; retry without them
    $stmt = $db->prepare(
        'SELECT id, name, email, company, password_hash, role, status FROM users WHERE email = ?'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user) { $user['plan'] = null; $user['niche'] = null; }
}

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonError('Invalid email or password', 401);
}

if (in_array($user['status'], ['suspended', 'cancelled'], true)) {
    jsonError('Account suspended. Contact support@netwebmedia.com', 403);
}

// Start authenticated session — regenerate ID to prevent session fixation
session_regenerate_id(true);
$_SESSION['nwm_uid'] = (int)$user['id'];

$db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

jsonResponse([
    'id'               => (int)$user['id'],
    'name'             => $user['name'],
    'email'            => $user['email'],
    'company'          => $user['company'] ?? '',
    'type'             => $user['role'] ?? 'user',
    'status'           => $user['status'],
    'plan'             => $user['plan'] ?? null,
    'niche'            => $user['niche'] ?? null,
    'requires_payment' => $user['status'] === 'pending_payment',
]);

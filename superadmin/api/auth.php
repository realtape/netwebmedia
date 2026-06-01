<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_start();
header('Content-Type: application/json; charset=utf-8');

// Reject non-same-origin requests on state changes
$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowed = 'https://admin.netwebmedia.com';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($origin && $origin !== $allowed) sa_error('Forbidden', 403);
    if (!$origin && !str_starts_with($referer, $allowed)) sa_error('Forbidden', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents('php://input'), true) ?? [];

// Logout
if ($method === 'POST' && ($data['action'] ?? '') === 'logout') {
    session_destroy();
    sa_json(['ok' => true]);
}

if ($method !== 'POST') sa_error('Method not allowed', 405);

$email    = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (!$email || !$password) sa_error('Email and password required');

try {
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT id, name, email, company, password_hash, role, status FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();
} catch (Exception $e) {
    error_log('[superadmin/auth] DB error: ' . $e->getMessage());
    sa_error('Database error', 500);
}

if (!$user || !password_verify($password, $user['password_hash'])) {
    sa_error('Invalid email or password', 401);
}

if (($user['role'] ?? '') !== 'superadmin') {
    sa_error('Access denied — superadmin credentials required', 403);
}

if (in_array($user['status'], ['suspended', 'cancelled'], true)) {
    sa_error('Account suspended. Contact support@netwebmedia.com', 403);
}

session_regenerate_id(true);
$_SESSION['sa_user'] = [
    'id'    => (int)$user['id'],
    'name'  => $user['name'],
    'email' => $user['email'],
    'role'  => $user['role'],
];

sa_json(['ok' => true, 'name' => $user['name']]);

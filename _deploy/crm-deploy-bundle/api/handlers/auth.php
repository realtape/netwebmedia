<?php
$db = getDB();

if ($method !== 'POST') jsonError('Method not allowed', 405);

$data = getInput();
$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonError('Email and password required');
}

// Look up user in the users table
$stmt = $db->prepare('SELECT id, name, email, company, password_hash, role, status FROM users WHERE email = ? AND status = ?');
$stmt->execute([$email, 'active']);
$user = $stmt->fetch();

if (!$user) {
    jsonError('Invalid email or password', 401);
}

if (!password_verify($password, $user['password_hash'])) {
    jsonError('Invalid email or password', 401);
}

// Update last login
$db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

jsonResponse([
    'id'      => (int)$user['id'],
    'name'    => $user['name'],
    'email'   => $user['email'],
    'company' => $user['company'] ?? '',
    'type'    => $user['role'] ?? 'user',
]);

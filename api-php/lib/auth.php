<?php
$AUTH_USER = null;

function getToken() {
  // Prefer X-Auth-Token header (works cross-origin without cookies)
  $h = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
  if ($h) return $h;
  // Fallback to cookie
  return $_COOKIE['nwm_token'] ?? '';
}

function setSessionCookie($token, $expiresTs) {
  setcookie('nwm_token', $token, [
    'expires'  => $expiresTs,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

function clearSessionCookie() {
  setcookie('nwm_token', '', ['expires' => time() - 3600, 'path' => '/']);
}

function createSession($userId) {
  $token = bin2hex(random_bytes(32));
  $expiresSec = time() + 60 * 60 * 24 * 30; // 30 days
  $expires = date('Y-m-d H:i:s', $expiresSec);
  qExec("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [$token, $userId, $expires]);
  setSessionCookie($token, $expiresSec);
  return $token;
}

function currentUser() {
  global $AUTH_USER;
  if ($AUTH_USER !== null) return $AUTH_USER;
  $token = getToken();
  if (!$token) return $AUTH_USER = false;
  $row = qOne(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()",
    [$token]
  );
  return $AUTH_USER = ($row ?: false);
}

function requireAuth() {
  $u = currentUser();
  if (!$u) err('Not authenticated', 401);
  return $u;
}

function requireRole($role) {
  $u = requireAuth();
  if ($u['role'] !== $role && $u['role'] !== 'admin') err('Forbidden', 403);
  return $u;
}

function sanitizeUser($u) {
  if (!$u) return null;
  return [
    'id' => (int) $u['id'],
    'email' => $u['email'],
    'name' => $u['name'],
    'role' => $u['role'],
    'status' => $u['status'] ?? 'active',
    'org_id' => (int) $u['org_id'],
    'created_at' => $u['created_at'],
  ];
}

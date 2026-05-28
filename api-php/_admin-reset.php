<?php
/* ONE-SHOT admin password reset.
   - Token-gated (first 16 chars of JWT_SECRET, same pattern as migrate.php).
   - Resets an existing admin's password or seeds a new admin row.
   - Force role='admin', status='active', org_id=1.
   - DELETE THIS FILE after use.

   Usage:
     curl -X POST "https://netwebmedia.com/api/_admin-reset?token=<first16>" \
       -H "Content-Type: application/json" \
       -d '{"email":"carlos@netwebmedia.com","password":"..."}'
*/
require_once __DIR__ . '/lib/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cfg = config();
$token = $_GET['token'] ?? ($_SERVER['HTTP_X_RESET_TOKEN'] ?? '');
$expected = substr($cfg['jwt_secret'], 0, 16);
if (!hash_equals($expected, (string)$token)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden — provide ?token=<first-16-chars-of-jwt_secret>']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = strtolower(trim($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');
$name = trim($body['name'] ?? 'Carlos Martinez');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid email']);
  exit;
}
if (strlen($password) < 8) {
  http_response_code(400);
  echo json_encode(['error' => 'Password must be at least 8 characters']);
  exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo = db();

$existing = null;
try {
  $stmt = $pdo->prepare("SELECT id, email, role, status FROM users WHERE email = ?");
  $stmt->execute([$email]);
  $existing = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB lookup failed: ' . $e->getMessage()]);
  exit;
}

if ($existing) {
  try {
    $upd = $pdo->prepare("UPDATE users SET password_hash = ?, role = 'admin', status = 'active', name = ? WHERE id = ?");
    $upd->execute([$hash, $name, $existing['id']]);
    echo json_encode([
      'ok' => true,
      'action' => 'updated',
      'user_id' => (int)$existing['id'],
      'email' => $email,
      'role' => 'admin',
      'status' => 'active',
    ]);
  } catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB update failed: ' . $e->getMessage()]);
  }
  exit;
}

// Insert new admin row
try {
  $ins = $pdo->prepare("INSERT INTO users (email, password_hash, name, role, status, org_id) VALUES (?, ?, ?, 'admin', 'active', 1)");
  $ins->execute([$email, $hash, $name]);
  echo json_encode([
    'ok' => true,
    'action' => 'inserted',
    'user_id' => (int)$pdo->lastInsertId(),
    'email' => $email,
    'role' => 'admin',
    'status' => 'active',
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB insert failed: ' . $e->getMessage()]);
}

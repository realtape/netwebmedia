<?php
/* ONE-SHOT CRM-side admin reset. Token-gated.
   Updates webmed6_crm.users for superadmin panel access.
   DELETE THIS FILE + its route mapping after use. */

header('Content-Type: application/json; charset=utf-8');

// Hardcoded one-shot token — committed for ~10 min, then handler removed.
// Same JWT_SECRET-first-16 value used by api-php side for consistency.
$EXPECTED = '1d69280fba8c8dbb';
$got = $_GET['token'] ?? ($_SERVER['HTTP_X_RESET_TOKEN'] ?? '');
if (!hash_equals($EXPECTED, (string)$got)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = strtolower(trim($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');
$name = trim($body['name'] ?? 'Carlos Martinez');
$role = strtolower(trim($body['role'] ?? 'superadmin'));
if (!in_array($role, ['user','admin','superadmin'], true)) $role = 'admin';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid email']);
  exit;
}
if (strlen($password) < 8) {
  http_response_code(400);
  echo json_encode(['error' => 'Password too short']);
  exit;
}

try {
  $pdo = getDB();  // already connected to webmed6_crm
  $hash = password_hash($password, PASSWORD_BCRYPT);

  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
  $stmt->execute([$email]);
  $existing = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($existing) {
    $upd = $pdo->prepare("UPDATE users SET password_hash = ?, role = ?, status = 'active', name = ? WHERE id = ?");
    $upd->execute([$hash, $role, $name, $existing['id']]);
    echo json_encode([
      'ok' => true, 'db' => 'webmed6_crm', 'action' => 'updated',
      'id' => (int)$existing['id'], 'email' => $email, 'role' => $role,
    ]);
  } else {
    $ins = $pdo->prepare("INSERT INTO users (name, email, password_hash, company, role, plan, status) VALUES (?, ?, ?, 'NetWebMedia', ?, 'enterprise', 'active')");
    $ins->execute([$name, $email, $hash, $role]);
    echo json_encode([
      'ok' => true, 'db' => 'webmed6_crm', 'action' => 'inserted',
      'id' => (int)$pdo->lastInsertId(), 'email' => $email, 'role' => $role,
    ]);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB op failed: ' . $e->getMessage()]);
}

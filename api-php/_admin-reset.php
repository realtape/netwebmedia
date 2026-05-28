<?php
/* ONE-SHOT admin password reset / role bump.
   Token-gated (first 16 chars of JWT_SECRET, same pattern as migrate.php).
   DELETE THIS FILE after use.

   Usage:
     curl -X POST "https://netwebmedia.com/api/_admin-reset?token=<first16>" \
       -H "Content-Type: application/json" \
       -d '{"email":"carlos@...", "password":"...", "role":"superadmin"}'
*/
require_once __DIR__ . '/lib/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cfg = config();
$token = $_GET['token'] ?? ($_SERVER['HTTP_X_RESET_TOKEN'] ?? '');
$expected = substr($cfg['jwt_secret'], 0, 16);
if (!hash_equals($expected, (string)$token)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = strtolower(trim($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');
$name = trim($body['name'] ?? 'Carlos Martinez');
$role = strtolower(trim($body['role'] ?? 'admin'));
if (!in_array($role, ['user','admin','superadmin'], true)) $role = 'admin';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid email']);
  exit;
}
if ($password !== '' && strlen($password) < 8) {
  http_response_code(400);
  echo json_encode(['error' => 'Password must be at least 8 characters (or empty to only bump role)']);
  exit;
}

$pdo = db();
$result = ['ok' => true, 'tables_updated' => []];

// --- webmed6_nwm.users (api-php side) -------------------------------------
try {
  $stmt = $pdo->prepare("SELECT id, role FROM users WHERE email = ?");
  $stmt->execute([$email]);
  $existing = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($existing) {
    if ($password !== '') {
      $hash = password_hash($password, PASSWORD_BCRYPT);
      $upd = $pdo->prepare("UPDATE users SET password_hash = ?, role = ?, status = 'active', name = ? WHERE id = ?");
      $upd->execute([$hash, $role, $name, $existing['id']]);
    } else {
      $upd = $pdo->prepare("UPDATE users SET role = ?, status = 'active', name = ? WHERE id = ?");
      $upd->execute([$role, $name, $existing['id']]);
    }
    $result['tables_updated'][] = ['db' => 'webmed6_nwm', 'table' => 'users', 'action' => 'updated', 'id' => (int)$existing['id'], 'role' => $role];
  } else {
    if ($password === '') {
      throw new Exception('Cannot create user without password');
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins = $pdo->prepare("INSERT INTO users (email, password_hash, name, role, status, org_id) VALUES (?, ?, ?, ?, 'active', 1)");
    $ins->execute([$email, $hash, $name, $role]);
    $result['tables_updated'][] = ['db' => 'webmed6_nwm', 'table' => 'users', 'action' => 'inserted', 'id' => (int)$pdo->lastInsertId(), 'role' => $role];
  }
} catch (Throwable $e) {
  $result['nwm_error'] = $e->getMessage();
}

// --- webmed6_crm.users (crm-vanilla side) ---------------------------------
// Connect to the CRM DB separately. Same MySQL user has access to both.
$crmCfg = require __DIR__ . '/../crm-vanilla/api/config.local.php';
try {
  // crm-vanilla/api/config.local.php uses define() — load constants and use them
  if (defined('DB_HOST') && defined('DB_NAME_CRM') && defined('DB_USER') && defined('DB_PASS')) {
    $crmPdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME_CRM . ';charset=utf8mb4',
      DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true]
    );
  } else {
    // Fallback: assume same credentials as nwm, just different DB name
    $crmPdo = new PDO(
      'mysql:host=localhost;dbname=webmed6_crm;charset=utf8mb4',
      $cfg['db_user'] ?? 'webmed6_nwm',
      $cfg['db_pass'] ?? '',
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true]
    );
  }

  $stmt = $crmPdo->prepare("SELECT id FROM users WHERE email = ?");
  $stmt->execute([$email]);
  $crmExisting = $stmt->fetch(PDO::FETCH_ASSOC);

  $hashForCrm = $password !== '' ? password_hash($password, PASSWORD_BCRYPT) : null;

  if ($crmExisting) {
    if ($hashForCrm !== null) {
      $upd = $crmPdo->prepare("UPDATE users SET password_hash = ?, role = ?, status = 'active', name = ? WHERE id = ?");
      $upd->execute([$hashForCrm, $role, $name, $crmExisting['id']]);
    } else {
      $upd = $crmPdo->prepare("UPDATE users SET role = ?, status = 'active', name = ? WHERE id = ?");
      $upd->execute([$role, $name, $crmExisting['id']]);
    }
    $result['tables_updated'][] = ['db' => 'webmed6_crm', 'table' => 'users', 'action' => 'updated', 'id' => (int)$crmExisting['id'], 'role' => $role];
  } else {
    if ($hashForCrm !== null) {
      $ins = $crmPdo->prepare("INSERT INTO users (name, email, password_hash, company, role, plan, status) VALUES (?, ?, ?, 'NetWebMedia', ?, 'enterprise', 'active')");
      $ins->execute([$name, $email, $hashForCrm, $role]);
      $result['tables_updated'][] = ['db' => 'webmed6_crm', 'table' => 'users', 'action' => 'inserted', 'id' => (int)$crmPdo->lastInsertId(), 'role' => $role];
    }
  }
} catch (Throwable $e) {
  $result['crm_error'] = $e->getMessage();
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);

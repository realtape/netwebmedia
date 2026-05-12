<?php
// One-shot account creator — DELETE AFTER USE
// Token: nwm-sa-init-2026
if (($_GET['t'] ?? '') !== 'nwm-sa-init-2026') { http_response_code(403); die('no'); }

$cfg = dirname(__DIR__) . '/crm-vanilla/api/config.php';
require_once $cfg;
$db = getDB();

$email = 'carlos@netwebmedia.com';
$name  = 'Carlos Martinez';
$hash  = password_hash('?68;fC!:@.L!NgS', PASSWORD_BCRYPT);

$ex = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$ex->execute([$email]);
$row = $ex->fetch();

if ($row) {
    $db->prepare('UPDATE users SET role=?,password_hash=?,status=?,name=? WHERE email=?')
       ->execute(['superadmin', $hash, 'active', $name, $email]);
    echo 'updated';
} else {
    $db->prepare('INSERT INTO users (name,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())')
       ->execute([$name, $email, $hash, 'superadmin', 'active']);
    echo 'created';
}

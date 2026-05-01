<?php
/**
 * ONE-TIME admin password reset script.
 * DELETE THIS FILE after use.
 * Access: https://netwebmedia.com/crm-vanilla/admin-reset.php?token=NWM_RESET_2026_TEMP
 */

define('RESET_TOKEN', 'NWM_RESET_2026_TEMP');

if (($_GET['token'] ?? '') !== RESET_TOKEN) {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/api/config.php';

$db = getDB();

$email  = 'carlos@netwebmedia.com';
$hash   = '$2b$10$iFyXfGRAUBN8uydzLteSo.h89f8kh4JyhDl.yjE6zjTFKzasZu.Fy'; // NWM2026!
$name   = 'Carlos Martinez';
$role   = 'admin';
$status = 'active';

// Create table if missing (safety net)
$db->exec("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    company VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    plan VARCHAR(50),
    niche VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    last_login DATETIME
)");

// Upsert: insert if not exists, update password if exists
$stmt = $db->prepare("
    INSERT INTO users (name, email, company, password_hash, role, status)
    VALUES (?, ?, 'NetWebMedia', ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        status = VALUES(status)
");
$stmt->execute([$name, $email, $hash, $role, $status]);

$stmt = $db->prepare("SELECT id, email, role, status FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode([
    'ok'      => true,
    'message' => 'Admin password reset successfully. DELETE this file now.',
    'user'    => $user,
]);

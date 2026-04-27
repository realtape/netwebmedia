<?php
/**
 * ONE-TIME BULK CONTACT IMPORTER
 * --------------------------------
 * Accepts a JSON array of contacts via POST and bulk-inserts them into
 * the CRM contacts table.
 *
 * SECURITY: Protected by a one-time token in the X-Import-Token header.
 * DELETE THIS FILE FROM THE REPO after the import is complete.
 *
 * Usage:
 *   POST https://app.netwebmedia.com/import_contacts.php
 *   Header: X-Import-Token: nwm-import-7f3k2026
 *   Body:   [ { "name":..., "email":..., ... }, ... ]
 */

require_once __DIR__ . '/api/config.php';

define('IMPORT_TOKEN', 'nwm-import-7f3k2026');

// CORS + method gate
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Import-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Auth check
$token = $_SERVER['HTTP_X_IMPORT_TOKEN'] ?? '';
if (!hash_equals(IMPORT_TOKEN, $token)) {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden — invalid import token']));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'POST required']));
}

// Parse input
$raw = file_get_contents('php://input');
$batch = json_decode($raw, true);

if (!is_array($batch) || empty($batch)) {
    http_response_code(400);
    die(json_encode(['error' => 'Expected JSON array of contacts']));
}

// Increase limits for large batches
set_time_limit(120);
ini_set('memory_limit', '256M');

$db = getDB();

// Prepare single insert statement
$stmt = $db->prepare(
    'INSERT INTO contacts (name, email, phone, company, role, status, value, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

$inserted = 0;
$errors   = 0;

$db->beginTransaction();
try {
    foreach ($batch as $c) {
        $name = trim($c['name'] ?? '');
        if ($name === '') { $errors++; continue; }

        $stmt->execute([
            $name,
            $c['email']   ?? null,
            $c['phone']   ?? null,
            $c['company'] ?? null,
            $c['role']    ?? null,
            $c['status']  ?? 'lead',
            (float)($c['value']  ?? 0),
            $c['notes']   ?? null,
        ]);
        $inserted++;
    }
    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    die(json_encode(['error' => $e->getMessage()]));
}

echo json_encode([
    'ok'         => true,
    'inserted'   => $inserted,
    'errors'     => $errors,
    'batch_size' => count($batch),
]);

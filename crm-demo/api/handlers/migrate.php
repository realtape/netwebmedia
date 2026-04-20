<?php
/**
 * One-time migration: apply schema_email.sql to create email marketing tables.
 * Token-protected. Delete after running, or check idempotency (CREATE TABLE IF NOT EXISTS).
 *
 * POST /api/?r=migrate&token=NWM_MIGRATE_2026
 */
if ($method !== 'POST') jsonError('Use POST', 405);
if (($_GET['token'] ?? '') !== 'NWM_MIGRATE_2026') jsonError('Invalid token', 403);

$db = getDB();
$sqlFile = __DIR__ . '/../schema_email.sql';
if (!file_exists($sqlFile)) jsonError('schema_email.sql not found', 500);

$sql = file_get_contents($sqlFile);
// Strip comments
$sql = preg_replace('/^\s*--.*$/m', '', $sql);
$statements = array_filter(array_map('trim', explode(';', $sql)));

$ran = 0; $errors = [];
foreach ($statements as $stmt) {
    if (!$stmt) continue;
    try {
        $db->exec($stmt);
        $ran++;
    } catch (Throwable $e) {
        $errors[] = substr($stmt, 0, 80) . ' → ' . $e->getMessage();
    }
}
jsonResponse(['ran' => $ran, 'errors' => $errors]);

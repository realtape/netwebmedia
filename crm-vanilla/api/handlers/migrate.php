<?php
/**
 * One-time migration endpoint — runs a named schema SQL file.
 *
 * Usage:
 *   POST /api/?r=migrate&token=NWM_MIGRATE_2026              → runs schema_email.sql (legacy default)
 *   POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=segment → runs schema_segment.sql
 *
 * Token-protected. SQL files must live in /api/ and follow the naming
 * convention schema_{name}.sql. Only lowercase a-z names are accepted.
 */
if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(MIGRATE_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

// Sanitise the schema name — a-z, 0-9, _ allowed; strip leading/trailing _ to prevent path traversal
$schemaName = preg_replace('/[^a-z0-9_]/', '', strtolower($_GET['schema'] ?? 'email'));
$schemaName = trim($schemaName, '_');
$sqlFile = __DIR__ . '/../schema_' . $schemaName . '.sql';

if (!file_exists($sqlFile)) jsonError("Schema file schema_{$schemaName}.sql not found", 500);

$db  = getDB();
$sql = file_get_contents($sqlFile);

// Strip -- comments
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

// Return 207 (Multi-Status-ish) when some statements failed so callers don't think it succeeded.
$status = empty($errors) ? 200 : 207;
jsonResponse(['schema' => $schemaName, 'ran' => $ran, 'errors' => $errors], $status);

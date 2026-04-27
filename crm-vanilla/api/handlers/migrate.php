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
if (($_GET['token'] ?? '') !== 'NWM_MIGRATE_2026') jsonError('Invalid token', 403);

// Sanitise the schema name — only a-z allowed to prevent path traversal
$schemaName = preg_replace('/[^a-z]/', '', strtolower($_GET['schema'] ?? 'email'));
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

jsonResponse(['schema' => $schemaName, 'ran' => $ran, 'errors' => $errors]);

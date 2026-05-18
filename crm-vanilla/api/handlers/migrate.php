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

/**
 * Split a SQL script into statements on top-level `;` only. Respects
 * '...' and "..." string literals (with doubled-quote and backslash
 * escapes), block comments, and -- / # line comments, so a `;` inside
 * any of those does NOT split the statement.
 */
function migrate_split_sql(string $sql): array {
    $stmts = [];
    $buf = '';
    $n = strlen($sql);
    $i = 0;
    while ($i < $n) {
        $ch = $sql[$i];
        $nx = $i + 1 < $n ? $sql[$i + 1] : '';

        // Line comment: -- … or # … (run to end of line)
        if (($ch === '-' && $nx === '-') || $ch === '#') {
            while ($i < $n && $sql[$i] !== "\n") { $buf .= $sql[$i]; $i++; }
            continue;
        }
        // Block comment: /* … */
        if ($ch === '/' && $nx === '*') {
            $buf .= '/*'; $i += 2;
            while ($i < $n && !($sql[$i] === '*' && ($i + 1 < $n ? $sql[$i + 1] : '') === '/')) {
                $buf .= $sql[$i]; $i++;
            }
            if ($i < $n) { $buf .= '*/'; $i += 2; }
            continue;
        }
        // String literal: '…' or "…"
        if ($ch === "'" || $ch === '"') {
            $q = $ch;
            $buf .= $ch; $i++;
            while ($i < $n) {
                $c = $sql[$i];
                $buf .= $c;
                if ($c === '\\' && $i + 1 < $n) { $buf .= $sql[$i + 1]; $i += 2; continue; }
                if ($c === $q) {
                    if ($i + 1 < $n && $sql[$i + 1] === $q) { $buf .= $sql[$i + 1]; $i += 2; continue; }
                    $i++; break;
                }
                $i++;
            }
            continue;
        }
        // Top-level statement terminator
        if ($ch === ';') {
            $t = trim($buf);
            if ($t !== '') $stmts[] = $t;
            $buf = '';
            $i++;
            continue;
        }
        $buf .= $ch;
        $i++;
    }
    $t = trim($buf);
    if ($t !== '') $stmts[] = $t;
    return $stmts;
}

// Quote/comment-aware split so a `;` inside a string literal or block
// comment no longer tears a statement (F-12). MySQL parses -- / # / *​/
// comments itself, so we keep them in the buffer rather than pre-stripping.
$statements = migrate_split_sql($sql);

// MySQL error codes / messages that mean "the change is already applied" — safe to skip on idempotent re-runs.
$idempotent_codes = [
    '1060',      // ER_DUP_FIELDNAME — Duplicate column name
    '1061',      // ER_DUP_KEYNAME   — Duplicate key name
    '1050',      // ER_TABLE_EXISTS_ERROR
    '1062',      // ER_DUP_ENTRY (only matters if backfill UNIQUE clashes)
    '1826',      // ER_FK_DUP_NAME   — Duplicate foreign key constraint name (MySQL 5.7+)
    'errno: 121',// InnoDB "Duplicate key on write or update" — old-style FK name clash (errno 121 surfaces as 1005)
];

$ran = 0; $skipped = 0; $errors = [];
foreach ($statements as $stmt) {
    if (!$stmt) continue;
    try {
        $db->exec($stmt);
        $ran++;
    } catch (Throwable $e) {
        $msg = $e->getMessage();
        // Prefer driver-specific code (errorInfo[1] for PDOException, errno for mysqli),
        // fall back to substring match only for non-PDO surfaces (e.g. 'errno: 121').
        $driverCode = null;
        if ($e instanceof PDOException && is_array($e->errorInfo ?? null) && isset($e->errorInfo[1])) {
            $driverCode = (string)$e->errorInfo[1];
        }
        $hit = false;
        foreach ($idempotent_codes as $code) {
            if ($driverCode !== null && $driverCode === $code) { $skipped++; $hit = true; break; }
            if ($driverCode === null && strpos($msg, $code) !== false) { $skipped++; $hit = true; break; }
            // Special-case the InnoDB FK-name clash hint that doesn't surface as a numeric driver code.
            if ($code === 'errno: 121' && strpos($msg, 'errno: 121') !== false) { $skipped++; $hit = true; break; }
        }
        if (!$hit) $errors[] = substr($stmt, 0, 80) . ' → ' . $msg;
    }
}

// Return 207 (Multi-Status-ish) when some statements failed so callers don't think it succeeded.
$status = empty($errors) ? 200 : 207;
jsonResponse(['schema' => $schemaName, 'ran' => $ran, 'skipped' => $skipped, 'errors' => $errors], $status);

<?php
/**
 * Offsite backup export — READ-ONLY full dump of the CURRENT database
 * (webmed6_crm). Token-gated; no session/user auth (maintenance token,
 * same model as MIGRATE_TOKEN).
 *
 * URL:  GET https://netwebmedia.com/crm/api/?r=db_export&token=<BACKUP_TOKEN>
 *
 * Response: a gzip-compressed JSON FILE payload (the body IS the file).
 *   Content-Type:        application/gzip
 *   Content-Disposition: attachment; filename="webmed6_crm-<YYYY-MM-DD>.json.gz"
 *   Body: gzencode(json_encode({
 *     meta:   { db, generated_at, table_count, row_counts:{table:count} },
 *     tables: { <table>: [<all rows as assoc>...] }
 *   }))
 *   NOTE: we deliberately do NOT set Content-Encoding: gzip. The gzip bytes
 *   are the file's content, not an HTTP transfer-encoding; the local puller
 *   saves the raw bytes to <db>-<date>.json.gz. Setting Content-Encoding
 *   would make compliant HTTP clients transparently inflate it.
 *
 * -----------------------------------------------------------------------------
 * DEPLOY-NOTES — how to activate
 *   1. Add a GitHub Actions secret BACKUP_TOKEN = a strong random 64-char hex
 *      string (e.g. `openssl rand -hex 32`).
 *   2. Push to main → .github/workflows/deploy-site-root.yml writes BACKUP_TOKEN
 *      into crm-vanilla/api/config.local.php (and api-php/config.local.php) as a
 *      define()/array key.
 *   Until the secret is set, the BACKUP_TOKEN fallback in config.php is the
 *   non-secret placeholder 'NWM_BACKUP_UNSET'. We refuse to authenticate against
 *   that placeholder (and against an empty token), so the endpoint is INERT —
 *   it returns 403 to everyone until a real secret is deployed.
 * -----------------------------------------------------------------------------
 *
 * Security: this endpoint exposes ALL customer PII behind a single token.
 *   - Always fail closed (403) on missing/placeholder/mismatched token.
 *   - hash_equals() to avoid timing oracles.
 *   - Read-only: SELECT only; nothing is written to the server disk.
 *   - Scoped to DATABASE() base tables only — never crosses to webmed6_nwm.
 *   - Consider fronting with an IP allowlist / rate limit (see CTO notes).
 */

// --- Token guard (fail closed) ------------------------------------------------
// BACKUP_TOKEN is defined in config.php (already required by index.php before
// this handler is included). Reject the committed placeholder and empty tokens
// so a missing config.local.php can never expose the dump.
$expect    = defined('BACKUP_TOKEN') ? (string)BACKUP_TOKEN : '';
$presented = (string)($_GET['token'] ?? $_POST['token'] ?? ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? ''));

if ($expect === '' || $expect === 'NWM_BACKUP_UNSET' || !hash_equals($expect, $presented)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => 'forbidden']);
    exit;
}

// --- Export (read-only) -------------------------------------------------------
try {
    $db = getDB();

    // Enumerate base tables of the CURRENT database only. Bound to DATABASE()
    // so this can never read across into webmed6_nwm. Views/system tables are
    // excluded via table_type = 'BASE TABLE'.
    $stmt = $db->query(
        "SELECT table_name FROM information_schema.tables
          WHERE table_schema = DATABASE()
            AND table_type = 'BASE TABLE'
          ORDER BY table_name"
    );
    // information_schema column case varies by MySQL build — normalize.
    $tableNames = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $name = $row['table_name'] ?? $row['TABLE_NAME'] ?? null;
        if ($name !== null && $name !== '') {
            $tableNames[] = (string)$name;
        }
    }

    $tables    = [];
    $rowCounts = [];

    foreach ($tableNames as $table) {
        // Identifier comes from information_schema (not user input), but quote
        // defensively anyway: backtick-wrap and escape embedded backticks.
        $quoted = '`' . str_replace('`', '``', $table) . '`';
        $rows   = $db->query("SELECT * FROM {$quoted}")->fetchAll(PDO::FETCH_ASSOC);
        $tables[$table]    = $rows;
        $rowCounts[$table] = count($rows);
    }

    $payload = [
        'meta' => [
            'db'           => DB_NAME,
            'generated_at' => date('c'),
            'table_count'  => count($tableNames),
            'row_counts'   => $rowCounts,
        ],
        'tables' => $tables,
    ];

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('json_encode failed: ' . json_last_error_msg());
    }

    $gz = gzencode($json, 6);
    if ($gz === false) {
        throw new RuntimeException('gzencode failed');
    }

    $filename = DB_NAME . '-' . date('Y-m-d') . '.json.gz';

    // The body IS the file. Do NOT set Content-Encoding: gzip (see header note).
    http_response_code(200);
    header('Content-Type: application/gzip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($gz));
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo $gz;
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

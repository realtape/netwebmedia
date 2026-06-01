<?php
/**
 * api-php admin maintenance routes (webmed6_nwm).
 *
 * Token-gated, no session/user auth (maintenance token, same model as the
 * MIGRATE_TOKEN-gated one-shot endpoints). Reachable via the dispatcher in
 * api-php/index.php at path group "admin-export".
 *
 *   GET https://netwebmedia.com/api/admin-export
 *       (token sent via the X-Backup-Token request header — never in the URL)
 *
 * See crm-vanilla/api/handlers/db_export.php for the full contract /
 * DEPLOY-NOTES (this is the webmed6_nwm twin of that handler).
 */

/**
 * Offsite backup export — READ-ONLY full dump of the CURRENT database
 * (webmed6_nwm). Streams a single gzip-compressed JSON FILE payload.
 *
 *   Content-Type:        application/gzip
 *   Content-Disposition: attachment; filename="webmed6_nwm-<YYYY-MM-DD>.json.gz"
 *   Body: gzencode(json_encode({ meta:{db,generated_at,table_count,row_counts},
 *                                tables:{<table>:[rows...]} }))
 *
 * Deliberately NO Content-Encoding: gzip — the gzip bytes ARE the file content
 * (the local puller saves raw bytes), not an HTTP transfer-encoding.
 */
function route_admin_export($method) {
  // Rate limit (blunt brute-force attempts against the token).
  require_once __DIR__ . '/../lib/ratelimit.php';
  rate_limit_check('admin_export', 6, 3600); // 6 hits / hour / IP (429 + exit on excess)

  $cfg = config();
  $ip  = $_SERVER['REMOTE_ADDR'] ?? '';

  // Optional IP allowlist (OFF by default). Set BACKUP_IP_ALLOWLIST (env) to a
  // comma-separated list to refuse any other source IP. Empty => no IP gate
  // (token is the gate). Off by default so the unattended puller stays reliable.
  $ipAllow = trim((string)(getenv('BACKUP_IP_ALLOWLIST') ?: ($cfg['backup_ip_allowlist'] ?? '')));
  if ($ipAllow !== '') {
    $allowed = array_filter(array_map('trim', explode(',', $ipAllow)));
    if (!in_array($ip, $allowed, true)) {
      error_log('[admin-export] DENY ip=' . $ip . ' reason=ip_not_allowed');
      http_response_code(403);
      header('Content-Type: application/json; charset=utf-8');
      header('Cache-Control: no-store');
      echo json_encode(['error' => 'forbidden']);
      exit;
    }
  }

  // Token guard (fail closed; header-only — never accept the token in the URL).
  // Sent as X-Backup-Token (preferred) or X-Auth-Token. Read the backup token
  // from the config() array (deploy-generated) with a defined() fallback. Reject
  // the committed placeholder + empty tokens so a missing config.local.php can
  // never expose the dump.
  $expected  = $cfg['backup_token'] ?? (defined('BACKUP_TOKEN') ? BACKUP_TOKEN : null);
  $presented = (string)($_SERVER['HTTP_X_BACKUP_TOKEN'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');

  if (!is_string($expected) || $expected === '' || $expected === 'NWM_BACKUP_UNSET'
      || !hash_equals($expected, $presented)) {
    error_log('[admin-export] DENY ip=' . $ip . ' reason=bad_token');
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => 'forbidden']);
    exit;
  }
  error_log('[admin-export] OK ip=' . $ip);

  try {
    $pdo = db();

    // Current database name (for filename + meta). DATABASE() is the connection's
    // active schema; we never look outside it.
    $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

    // Enumerate base tables of the CURRENT database only.
    $stmt = $pdo->query(
      "SELECT table_name FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
        ORDER BY table_name"
    );
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
      // Identifier is from information_schema, not user input; quote defensively.
      $quoted = '`' . str_replace('`', '``', $table) . '`';
      $rows   = $pdo->query("SELECT * FROM {$quoted}")->fetchAll(PDO::FETCH_ASSOC);
      $tables[$table]    = $rows;
      $rowCounts[$table] = count($rows);
    }

    $payload = [
      'meta' => [
        'db'           => $dbName,
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

    $filename = $dbName . '-' . date('Y-m-d') . '.json.gz';

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
}

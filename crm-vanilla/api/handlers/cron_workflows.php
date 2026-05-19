<?php
/**
 * Workflow cron runner (CRM-native, webmed6_crm).
 *
 * Called every 5 min by cPanel:
 *   curl -s -A "Mozilla/5.0" \
 *     "https://netwebmedia.com/crm-vanilla/api/?r=cron_workflows&token=<MIGRATE_TOKEN>"
 *
 * MIGRATE_TOKEN is defined in config.local.php (generated from GitHub Secrets
 * SECRET_MIGRATE_TOKEN). Same token used by the migrate endpoint.
 * If the secret is unset, config.php generates a random per-process fallback
 * (bin2hex(random_bytes(32))) — there is no static default to memorize.
 *
 * GET  ?r=cron_workflows&token=…  → process pending runs, return JSON summary
 * POST ?r=cron_workflows&action=stats&token=…  → queue depth stats only
 */

require_once __DIR__ . '/../lib/wf_crm.php';

// Token guard — uses MIGRATE_TOKEN (same constant as migrate.php / dedupe.php)
$token  = $_GET['token'] ?? $_POST['token'] ?? '';
$expect = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : '';
if (!$expect || !hash_equals($expect, $token)) {
    jsonResponse(['error' => 'Forbidden', 'hint' => 'Pass ?token=<MIGRATE_TOKEN from config.local.php>'], 403);
}

$db     = getDB();
$action = $_POST['action'] ?? $_GET['action'] ?? 'run';

// Schema guard — ensure table exists before querying. Includes claim_token
// (added in schema_workflow_runs_claim.sql) so a fresh-DB deploy has full
// concurrency safety from the first cron tick.
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `workflow_runs` (
          `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `workflow_id`  BIGINT UNSIGNED NOT NULL,
          `user_id`      BIGINT UNSIGNED DEFAULT NULL,
          `org_id`       BIGINT UNSIGNED DEFAULT NULL,
          `status`       ENUM('pending','running','waiting','completed','failed') NOT NULL DEFAULT 'pending',
          `step_index`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
          `context_json` MEDIUMTEXT DEFAULT NULL,
          `next_run_at`  DATETIME DEFAULT NULL,
          `error`        TEXT DEFAULT NULL,
          `claim_token`  VARCHAR(32) DEFAULT NULL,
          `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          INDEX `idx_wr_status_next` (`status`, `next_run_at`),
          INDEX `idx_wr_workflow`    (`workflow_id`),
          INDEX `idx_wr_claim`       (`claim_token`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // Table already exists — ignore
}

if ($action === 'stats') {
    $stats = $db->query(
        "SELECT status, COUNT(*) AS cnt FROM workflow_runs GROUP BY status"
    )->fetchAll(PDO::FETCH_KEY_PAIR);
    jsonResponse(['stats' => $stats, 'ts' => date('c')]);
}

// Audit-table TTL: prune workflow_run_steps rows older than 90 days, plus
// any workflow_runs in completed/failed state older than 90 days. Runs at
// most once per UTC day (gated by a marker row in a tiny scratch table) so
// 288 cron firings/day don't all hammer the same DELETE.
//
// Tuning: 90 days is generous for a CRM client to debug "why did this fail
// last quarter?" — adjust here if storage becomes a real cost.
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `cron_marker` (
          `name` VARCHAR(64) NOT NULL PRIMARY KEY,
          `last_run_at` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $sel = $db->prepare("SELECT last_run_at FROM cron_marker WHERE name = 'workflow_audit_prune'");
    $sel->execute();
    $lastRun = $sel->fetchColumn();
    $shouldPrune = !$lastRun || strtotime($lastRun) < (time() - 24 * 3600);

    if ($shouldPrune) {
        $deletedSteps = $db->exec(
            "DELETE FROM workflow_run_steps WHERE created_at < (NOW() - INTERVAL 90 DAY)"
        );
        $deletedRuns = $db->exec(
            "DELETE FROM workflow_runs
              WHERE status IN ('completed','failed')
                AND updated_at < (NOW() - INTERVAL 90 DAY)"
        );
        $db->prepare(
            "INSERT INTO cron_marker (name, last_run_at) VALUES ('workflow_audit_prune', NOW())
             ON DUPLICATE KEY UPDATE last_run_at = NOW()"
        )->execute();
        error_log(sprintf(
            '[cron_workflows] audit prune: %d step rows, %d run rows removed (>90d)',
            (int)$deletedSteps, (int)$deletedRuns
        ));
    }
} catch (Throwable $e) {
    error_log('[cron_workflows] audit prune failed: ' . $e->getMessage());
}

// Run pending
$start   = microtime(true);
$results = wf_crm_run_pending($db);
$elapsed = round((microtime(true) - $start) * 1000);

jsonResponse([
    'ok'      => true,
    'ran'     => count($results),
    'results' => $results,
    'elapsed_ms' => $elapsed,
    'ts'      => date('c'),
]);

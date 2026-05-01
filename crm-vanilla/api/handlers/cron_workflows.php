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
 * Fallback default (if secret not set): NWM_MIGRATE_2026_ROTATED_7d790e0bb4992a6e
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

// Schema guard — ensure table exists before querying
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
          `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          INDEX `idx_wr_status_next` (`status`, `next_run_at`),
          INDEX `idx_wr_workflow`    (`workflow_id`)
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

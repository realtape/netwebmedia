<?php
/**
 * Workflow runs audit reader (read-only).
 *
 * GET /api/?r=workflow_runs                            — list recent runs (tenant-scoped, last 100)
 * GET /api/?r=workflow_runs&workflow_id=N              — filter by workflow
 * GET /api/?r=workflow_runs&status=pending|...         — filter by status
 * GET /api/?r=workflow_runs&id=N                       — fetch one run + its full step audit
 *
 * Backed by the workflow_runs queue + workflow_run_steps audit table that
 * the engine writes on every step. Lets a tenant self-serve "why didn't my
 * workflow run?" without grepping PHP error logs.
 *
 * Tenancy: scoped via workflow_runs.org_id when org schema is applied,
 * otherwise via workflow_runs.user_id. Read-only — no PUT/POST/DELETE.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db    = getDB();
$user  = guard_user();
$uid   = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
if (!$user || !$uid) jsonError('Authentication required', 401);

$orgId = is_org_schema_applied() ? current_org_id() : null;

// Defensive lazy create — keeps the route working before migrations have run.
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `workflow_run_steps` (
          `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `run_id` BIGINT UNSIGNED NOT NULL,
          `step_index` SMALLINT UNSIGNED NOT NULL,
          `step_type` VARCHAR(50) NOT NULL,
          `result` VARCHAR(200) NOT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          INDEX `idx_wrs_run` (`run_id`),
          INDEX `idx_wrs_created` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $_) { /* swallow */ }

// Tenant filter on workflow_runs. Mirrors the per-handler tenancy_where()
// pattern but against the run's own org_id / user_id so legacy NULL rows
// remain visible to the row owner.
function workflow_runs_tenant_clause(?int $orgId, ?int $uid): array {
    if ($orgId !== null) {
        return [' (r.org_id = ? OR r.org_id IS NULL) ', [$orgId]];
    }
    if ($uid !== null) {
        return [' (r.user_id = ? OR r.user_id IS NULL) ', [$uid]];
    }
    return [' 1=1 ', []];
}

if ($method !== 'GET') jsonError('Method not allowed', 405);

[$tClause, $tParams] = workflow_runs_tenant_clause($orgId, $uid);

if ($id) {
    // Single-run detail — run header + every recorded step.
    $sql = "SELECT r.id, r.workflow_id, r.status, r.step_index, r.context_json,
                   r.next_run_at, r.error, r.created_at, r.updated_at,
                   w.name AS workflow_name, w.trigger_type, w.trigger_filter
              FROM workflow_runs r
              JOIN workflows w ON w.id = r.workflow_id
             WHERE r.id = ? AND $tClause
             LIMIT 1";
    $params = array_merge([$id], $tParams);
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $run = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$run) jsonError('Run not found', 404);

    // Steps for this run.
    $stepsStmt = $db->prepare(
        "SELECT id, step_index, step_type, result, created_at
           FROM workflow_run_steps
          WHERE run_id = ?
          ORDER BY id ASC"
    );
    $stepsStmt->execute([$id]);
    $run['steps'] = $stepsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode context for the UI.
    if (!empty($run['context_json'])) {
        $decoded = json_decode($run['context_json'], true);
        $run['context'] = is_array($decoded) ? $decoded : null;
    } else {
        $run['context'] = null;
    }
    unset($run['context_json']);

    jsonResponse($run);
}

// List view — recent runs with denormalised summary fields for cheap rendering.
$where = [$tClause];
$params = $tParams;

$wfId = isset($_GET['workflow_id']) ? (int)$_GET['workflow_id'] : 0;
if ($wfId > 0) {
    $where[] = 'r.workflow_id = ?';
    $params[] = $wfId;
}

$status = $_GET['status'] ?? '';
$ALLOWED_STATUS = ['pending', 'running', 'waiting', 'completed', 'failed'];
if ($status !== '' && in_array($status, $ALLOWED_STATUS, true)) {
    $where[] = 'r.status = ?';
    $params[] = $status;
}

$limit = isset($_GET['limit']) ? max(1, min(500, (int)$_GET['limit'])) : 100;

$sql = "SELECT r.id, r.workflow_id, r.status, r.step_index, r.next_run_at,
               r.error, r.created_at, r.updated_at,
               w.name AS workflow_name, w.trigger_type,
               (SELECT COUNT(*) FROM workflow_run_steps s WHERE s.run_id = r.id) AS step_count,
               (SELECT s.result FROM workflow_run_steps s WHERE s.run_id = r.id ORDER BY s.id DESC LIMIT 1) AS last_result
          FROM workflow_runs r
          JOIN workflows w ON w.id = r.workflow_id
         WHERE " . implode(' AND ', $where) . "
         ORDER BY r.id DESC
         LIMIT $limit";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Cast numeric fields the SQL returns as strings.
foreach ($rows as &$r) {
    $r['workflow_id'] = (int)$r['workflow_id'];
    $r['step_index']  = (int)$r['step_index'];
    $r['step_count']  = (int)$r['step_count'];
}
unset($r);

jsonResponse($rows);

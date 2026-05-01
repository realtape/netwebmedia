<?php
/**
 * Workflows: visual sequence/automation builder CRUD.
 *
 * GET    /api/?r=workflows           → list all workflows (tenant-scoped)
 * GET    /api/?r=workflows&id=N      → fetch one
 * POST   /api/?r=workflows           → create  body: {name, trigger_type, trigger_filter, steps_json, status}
 * PUT    /api/?r=workflows&id=N      → update (any subset of the above fields)
 * DELETE /api/?r=workflows&id=N      → delete (with tenant ownership check)
 *
 * Tenancy: rows are filtered through tenancy_where() — works for both legacy
 * user_id-scoped tenancy and the newer organization_id model. Lazy-creates
 * the table on first hit so the route works even if schema_workflows.sql
 * hasn't been run yet (defence-in-depth — the deploy migrate hook runs it,
 * but we don't want a missing-table 500 on a fresh DB).
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db    = getDB();
$user  = guard_user();
$uid   = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
$orgId = is_org_schema_applied() ? current_org_id() : null;

// ─── Lazy table create ────────────────────────────────────────────────
// Mirrors schema_workflows.sql exactly; running both is safe (IF NOT EXISTS).
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `workflows` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
            `user_id` INT UNSIGNED DEFAULT NULL,
            `name` VARCHAR(200) NOT NULL,
            `trigger_type` VARCHAR(50) NOT NULL DEFAULT 'manual',
            `trigger_filter` VARCHAR(200) DEFAULT NULL,
            `steps_json` TEXT NOT NULL,
            `status` VARCHAR(20) NOT NULL DEFAULT 'active',
            `last_run_at` DATETIME DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_wf_org` (`organization_id`),
            INDEX `idx_wf_user` (`user_id`),
            INDEX `idx_wf_trigger` (`trigger_type`, `status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // Non-fatal — table likely already exists. Real errors will surface on the SELECT.
}

[$tWhere, $tParams] = tenancy_where();

// ─── Allowed enums (kept in sync with the JS step-card builder) ───────
$ALLOWED_TRIGGERS = ['contact_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'manual'];
$ALLOWED_STATUSES = ['active', 'paused', 'draft'];
$ALLOWED_STEP_TYPES = ['wait', 'send_email', 'add_tag', 'remove_tag', 'create_task'];

/**
 * Normalize and validate the steps array. Accepts either a JSON string or a
 * decoded array. Returns the canonicalized JSON string ready for storage.
 * Throws (via jsonError) on malformed input.
 */
function workflows_normalize_steps($raw, array $allowedTypes): string {
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) jsonError('steps_json must be a JSON array', 400);
        $raw = $decoded;
    }
    if (!is_array($raw)) jsonError('steps_json must be an array', 400);

    $out = [];
    foreach ($raw as $i => $step) {
        if (!is_array($step) || empty($step['type'])) {
            jsonError("Step $i: missing 'type'", 400);
        }
        $type = (string)$step['type'];
        if (!in_array($type, $allowedTypes, true)) {
            jsonError("Step $i: invalid type '$type'", 400);
        }
        $cfg = isset($step['config']) && is_array($step['config']) ? $step['config'] : [];

        // Type-specific config sanitization (defence in depth — the UI also validates).
        switch ($type) {
            case 'wait':
                $delay = (int)($cfg['delay'] ?? 0);
                if ($delay < 0) $delay = 0;
                $unit = in_array(($cfg['unit'] ?? 'minutes'), ['minutes', 'hours', 'days'], true)
                    ? $cfg['unit'] : 'minutes';
                $cfg = ['delay' => $delay, 'unit' => $unit];
                break;
            case 'send_email':
                $cfg = [
                    'template_id'   => isset($cfg['template_id']) ? (int)$cfg['template_id'] : null,
                    'template_name' => isset($cfg['template_name']) ? substr((string)$cfg['template_name'], 0, 200) : null,
                ];
                break;
            case 'add_tag':
            case 'remove_tag':
                $cfg = ['tag' => substr((string)($cfg['tag'] ?? ''), 0, 100)];
                break;
            case 'create_task':
                $cfg = ['title' => substr((string)($cfg['title'] ?? ''), 0, 200)];
                break;
        }

        $out[] = ['type' => $type, 'config' => $cfg];
    }
    return json_encode($out, JSON_UNESCAPED_UNICODE);
}

// ─── CRUD ────────────────────────────────────────────────────────────
switch ($method) {

    case 'GET':
        if ($id) {
            $sql = 'SELECT id, organization_id, user_id, name, trigger_type, trigger_filter, steps_json, status, last_run_at, created_at, updated_at FROM workflows WHERE id = ?';
            $params = [$id];
            if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
            $s = $db->prepare($sql);
            $s->execute($params);
            $row = $s->fetch();
            if (!$row) jsonError('Workflow not found', 404);
            jsonResponse($row);
        }

        $sql = 'SELECT id, name, trigger_type, trigger_filter, steps_json, status, last_run_at, created_at, updated_at FROM workflows';
        $params = [];
        if ($tWhere) { $sql .= ' WHERE ' . $tWhere; $params = $tParams; }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';
        $s = $db->prepare($sql);
        $s->execute($params);
        $rows = $s->fetchAll();
        // Compute step_count for the list view so the UI doesn't have to parse JSON.
        foreach ($rows as &$r) {
            $steps = json_decode($r['steps_json'] ?? '[]', true);
            $r['step_count'] = is_array($steps) ? count($steps) : 0;
        }
        unset($r);
        jsonResponse($rows);
        break;

    case 'POST':
        if (!$user || !$uid) jsonError('Authentication required', 401);
        // Block X-Org-Slug-based cross-org INSERT (matches campaigns.php pattern).
        if (function_exists('require_org_access_for_write')) {
            require_org_access_for_write('member');
        }
        $d = getInput();
        $name = trim((string)($d['name'] ?? ''));
        if ($name === '') jsonError('name required');
        if (strlen($name) > 200) $name = substr($name, 0, 200);

        $trigger = (string)($d['trigger_type'] ?? 'manual');
        if (!in_array($trigger, $ALLOWED_TRIGGERS, true)) jsonError('Invalid trigger_type');

        $triggerFilter = isset($d['trigger_filter']) ? substr((string)$d['trigger_filter'], 0, 200) : null;

        $status = (string)($d['status'] ?? 'active');
        if (!in_array($status, $ALLOWED_STATUSES, true)) $status = 'active';

        $stepsRaw = $d['steps_json'] ?? ($d['steps'] ?? []);
        $stepsJson = workflows_normalize_steps($stepsRaw, $ALLOWED_STEP_TYPES);

        if ($orgId !== null) {
            $s = $db->prepare(
                'INSERT INTO workflows (organization_id, user_id, name, trigger_type, trigger_filter, steps_json, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $s->execute([$orgId, $uid, $name, $trigger, $triggerFilter, $stepsJson, $status]);
        } else {
            $s = $db->prepare(
                'INSERT INTO workflows (user_id, name, trigger_type, trigger_filter, steps_json, status)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $s->execute([$uid, $name, $trigger, $triggerFilter, $stepsJson, $status]);
        }
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$user || !$uid) jsonError('Authentication required', 401);
        if (!$id) jsonError('ID required');

        // Ownership check via tenancy_where — same row visibility as GET.
        $sql = 'SELECT id FROM workflows WHERE id = ?';
        $params = [$id];
        if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
        $s = $db->prepare($sql);
        $s->execute($params);
        if (!$s->fetch()) jsonError('Workflow not found', 404);

        $d = getInput();
        $fields = []; $params = [];
        if (array_key_exists('name', $d)) {
            $name = trim((string)$d['name']);
            if ($name === '') jsonError('name cannot be empty');
            $fields[] = 'name = ?'; $params[] = substr($name, 0, 200);
        }
        if (array_key_exists('trigger_type', $d)) {
            if (!in_array($d['trigger_type'], $ALLOWED_TRIGGERS, true)) jsonError('Invalid trigger_type');
            $fields[] = 'trigger_type = ?'; $params[] = $d['trigger_type'];
        }
        if (array_key_exists('trigger_filter', $d)) {
            $fields[] = 'trigger_filter = ?';
            $params[] = $d['trigger_filter'] === null ? null : substr((string)$d['trigger_filter'], 0, 200);
        }
        if (array_key_exists('status', $d)) {
            if (!in_array($d['status'], $ALLOWED_STATUSES, true)) jsonError('Invalid status');
            $fields[] = 'status = ?'; $params[] = $d['status'];
        }
        if (array_key_exists('steps_json', $d) || array_key_exists('steps', $d)) {
            $stepsRaw = $d['steps_json'] ?? $d['steps'];
            $fields[] = 'steps_json = ?';
            $params[] = workflows_normalize_steps($stepsRaw, $ALLOWED_STEP_TYPES);
        }
        if (!$fields) jsonError('No fields to update');

        $params[] = $id;
        $updSql = 'UPDATE workflows SET ' . implode(', ', $fields) . ' WHERE id = ?';
        if ($tWhere) { $updSql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
        $db->prepare($updSql)->execute($params);
        jsonResponse(['updated' => true]);
        break;

    case 'DELETE':
        if (!$user || !$uid) jsonError('Authentication required', 401);
        if (!$id) jsonError('ID required');
        $delSql = 'DELETE FROM workflows WHERE id = ?';
        $delParams = [$id];
        if ($tWhere) { $delSql .= ' AND ' . $tWhere; $delParams = array_merge($delParams, $tParams); }
        $stmt = $db->prepare($delSql);
        $stmt->execute($delParams);
        if ($stmt->rowCount() === 0) jsonError('Workflow not found', 404);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}

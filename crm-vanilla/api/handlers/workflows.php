<?php
/**
 * Workflows: visual sequence/automation builder CRUD + engine bridge.
 *
 * GET    /api/?r=workflows                        list all workflows (tenant-scoped)
 * GET    /api/?r=workflows&id=N                   fetch one
 * POST   /api/?r=workflows                        create
 *   body: {name, trigger_type, trigger_filter, steps_json, status}
 * PUT    /api/?r=workflows&id=N                   update
 * DELETE /api/?r=workflows&id=N                   delete
 *
 * POST   /api/?r=workflows&id=N&action=run_now    fire the workflow immediately (admin)
 * POST   /api/?r=workflows&action=backfill_engine_mirror   ensure every workflows row
 *                                                          has a matching resources mirror (admin)
 *
 * Tenancy: rows filtered through tenancy_where(). Lazy-creates the workflows table
 * AND a workflows_resource_link mapping table on first hit so the route works even
 * if schema_workflows.sql / schema_workflows_to_resources.sql have not run yet
 * (defence-in-depth: deploy migrate runs them, but a missing-table 500 on a fresh
 * DB would be a worse failure mode).
 *
 * ─── Engine bridge (NEW) ──────────────────────────────────────────────────
 * The visual builder writes to `workflows`. The runtime engine in
 * api-php/lib/workflows.php only reads `resources WHERE type='workflow'`.
 * On every INSERT/UPDATE/DELETE we mirror the row into `resources` with a
 * deterministic slug (wf-builder-{workflows.id}) and a translated data JSON
 * shape that the engine understands. The link is tracked in
 * workflows_resource_link so UPDATE / DELETE can find the mirror in O(1)
 * without a slug LIKE scan.
 *
 * Vocabulary translation lives in workflows_translate_to_engine_format().
 * Keep it pure — easy to unit-test, and the only place trigger/step names
 * are mapped between the two systems.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db    = getDB();
$user  = guard_user();
$uid   = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
$orgId = is_org_schema_applied() ? current_org_id() : null;

// ─── Lazy table create ────────────────────────────────────────────────
// Mirrors schema_workflows.sql exactly + the resource-link mapping table.
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
    // Mapping table — chosen over ALTER TABLE ADD COLUMN to avoid the
    // MySQL-version branch (IF NOT EXISTS on ADD COLUMN is 8.0.29+).
    // Idempotent on every deploy.
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `workflows_resource_link` (
            `workflow_id` INT NOT NULL PRIMARY KEY,
            `resource_id` INT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_wrl_resource` (`resource_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // Non-fatal — tables likely already exist. Real errors will surface on the SELECT.
}

[$tWhere, $tParams] = tenancy_where();

// ─── Allowed enums (kept in sync with the JS step-card builder) ───────
$ALLOWED_TRIGGERS = ['contact_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'manual'];
$ALLOWED_STATUSES = ['active', 'paused', 'draft'];
$ALLOWED_STEP_TYPES = ['wait', 'send_email', 'add_tag', 'remove_tag', 'create_task'];

/* ─── Vocabulary translation (visual builder → engine) ────────────────────
 *
 * The runtime engine understands a different vocabulary than the builder UI.
 * This function translates:
 *
 *   builder trigger_type           → engine trigger.type     extra fields
 *   ───────────────────────────      ─────────────────────   ────────────
 *   contact_created                  contact_created          (added to wf_trigger_registry)
 *   form_submitted                   form_submission          form_id from trigger_filter
 *   tag_added                        tag_added                tag from trigger_filter
 *   deal_stage_changed               deal_stage               stage from trigger_filter
 *   manual                           manual                   —
 *
 *   builder step type    cfg                          → engine action  fields
 *   ────────────────────────────────────────────────    ─────────────  ────────────
 *   wait               {delay, unit:minutes|hours|days}  wait           {minutes|hours|days}
 *   send_email         {template_id, template_name}      send_email     {template_id, to:'submitter'}
 *   add_tag            {tag}                             tag            {tag}
 *   remove_tag         {tag}                             untag          {tag}
 *   create_task        {title}                           create_task    {title_tpl, due_in_days:1}
 *
 * Returns the JSON-encodable array that becomes resources.data.
 * Keep this function pure (no DB calls, no $_SERVER reads) for testability.
 */
function workflows_translate_to_engine_format(string $name, string $triggerType, ?string $triggerFilter, $stepsJson, ?int $workflowsId = null): array {
    // ─── Trigger ──
    $trigger = ['type' => $triggerType];
    switch ($triggerType) {
        case 'form_submitted':
            $trigger['type'] = 'form_submission';
            if ($triggerFilter !== null && $triggerFilter !== '') $trigger['form_id'] = $triggerFilter;
            break;
        case 'tag_added':
            if ($triggerFilter !== null && $triggerFilter !== '') $trigger['tag'] = $triggerFilter;
            break;
        case 'deal_stage_changed':
            $trigger['type'] = 'deal_stage';
            if ($triggerFilter !== null && $triggerFilter !== '') $trigger['stage'] = $triggerFilter;
            break;
        case 'contact_created':
        case 'manual':
        default:
            break;
    }

    // ─── Steps ──
    $steps = is_string($stepsJson) ? (json_decode($stepsJson, true) ?: []) : (is_array($stepsJson) ? $stepsJson : []);
    $engineSteps = [];
    foreach ($steps as $step) {
        if (!is_array($step) || empty($step['type'])) continue;
        $cfg = isset($step['config']) && is_array($step['config']) ? $step['config'] : [];

        switch ($step['type']) {
            case 'wait':
                $delay = max(0, (int)($cfg['delay'] ?? 0));
                $unit  = in_array(($cfg['unit'] ?? 'minutes'), ['minutes', 'hours', 'days'], true)
                    ? $cfg['unit'] : 'minutes';
                $key = $unit; // 'minutes' | 'hours' | 'days' — engine understands all three
                $engineSteps[] = ['action' => 'wait', $key => $delay];
                break;

            case 'send_email':
                $eStep = ['action' => 'send_email', 'to' => 'submitter'];
                if (!empty($cfg['template_id'])) $eStep['template_id'] = (int)$cfg['template_id'];
                // template_name is metadata-only for the UI; not used at runtime.
                $engineSteps[] = $eStep;
                break;

            case 'add_tag':
                $engineSteps[] = ['action' => 'tag', 'tag' => (string)($cfg['tag'] ?? '')];
                break;

            case 'remove_tag':
                $engineSteps[] = ['action' => 'untag', 'tag' => (string)($cfg['tag'] ?? '')];
                break;

            case 'create_task':
                $engineSteps[] = [
                    'action'      => 'create_task',
                    'title_tpl'   => (string)($cfg['title'] ?? 'Follow up'),
                    'due_in_days' => 1,
                ];
                break;

            default:
                // Unknown step type — skip rather than crash the engine.
                break;
        }
    }

    $out = [
        'trigger' => $trigger,
        'steps'   => $engineSteps,
        '_source' => 'visual_builder',
    ];
    if ($workflowsId !== null) $out['_workflows_id'] = (int)$workflowsId;
    return $out;
}

/**
 * Upsert the resources-mirror row for a given workflows row.
 * Returns the resources.id of the mirror.
 */
function workflows_upsert_engine_mirror(PDO $db, int $workflowsId, array $row): int {
    $slug      = 'wf-builder-' . $workflowsId;
    $title     = (string)($row['name'] ?? 'Workflow');
    // resources.status === 'active' is what wf_active_for_trigger() checks. Map
    // builder 'paused' / 'draft' to anything else so they don't fire — the engine
    // does an exact-match `status='active'` filter.
    $status    = ($row['status'] ?? 'active') === 'active' ? 'active' : 'inactive';
    $orgId     = (int)($row['organization_id'] ?? 1);
    if ($orgId < 1) $orgId = 1;
    $ownerId   = !empty($row['user_id']) ? (int)$row['user_id'] : null;

    $data = workflows_translate_to_engine_format(
        $title,
        (string)($row['trigger_type'] ?? 'manual'),
        $row['trigger_filter'] ?? null,
        $row['steps_json'] ?? '[]',
        $workflowsId
    );
    $dataJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Existing mirror?
    $stmt = $db->prepare('SELECT resource_id FROM workflows_resource_link WHERE workflow_id = ? LIMIT 1');
    $stmt->execute([$workflowsId]);
    $existingResourceId = (int)($stmt->fetchColumn() ?: 0);

    if ($existingResourceId > 0) {
        // Verify it still exists (could have been hand-deleted from resources)
        $chk = $db->prepare("SELECT id FROM resources WHERE id = ? AND type='workflow' LIMIT 1");
        $chk->execute([$existingResourceId]);
        if ($chk->fetchColumn()) {
            $upd = $db->prepare(
                "UPDATE resources SET org_id = ?, slug = ?, title = ?, status = ?, data = ?, owner_id = ?, updated_at = NOW() WHERE id = ?"
            );
            $upd->execute([$orgId, $slug, $title, $status, $dataJson, $ownerId, $existingResourceId]);
            return $existingResourceId;
        }
        // Stale link — fall through and re-insert.
    }

    // Fallback: locate by slug (handles the case where a previous deploy created
    // the mirror but the link table was reset).
    $stmt = $db->prepare("SELECT id FROM resources WHERE type='workflow' AND slug = ? LIMIT 1");
    $stmt->execute([$slug]);
    $foundId = (int)($stmt->fetchColumn() ?: 0);
    if ($foundId > 0) {
        $upd = $db->prepare(
            "UPDATE resources SET org_id = ?, title = ?, status = ?, data = ?, owner_id = ?, updated_at = NOW() WHERE id = ?"
        );
        $upd->execute([$orgId, $title, $status, $dataJson, $ownerId, $foundId]);
        // Restore link
        $db->prepare('REPLACE INTO workflows_resource_link (workflow_id, resource_id) VALUES (?, ?)')
           ->execute([$workflowsId, $foundId]);
        return $foundId;
    }

    // Insert fresh.
    $ins = $db->prepare(
        "INSERT INTO resources (org_id, type, slug, title, status, data, owner_id, created_at, updated_at)
         VALUES (?, 'workflow', ?, ?, ?, ?, ?, NOW(), NOW())"
    );
    $ins->execute([$orgId, $slug, $title, $status, $dataJson, $ownerId]);
    $resourceId = (int)$db->lastInsertId();

    $db->prepare('REPLACE INTO workflows_resource_link (workflow_id, resource_id) VALUES (?, ?)')
       ->execute([$workflowsId, $resourceId]);

    return $resourceId;
}

/**
 * Delete the resources-mirror row for a given workflows row, if present.
 * Best-effort: errors are swallowed (the workflows row is already gone).
 */
function workflows_delete_engine_mirror(PDO $db, int $workflowsId): void {
    try {
        $stmt = $db->prepare('SELECT resource_id FROM workflows_resource_link WHERE workflow_id = ? LIMIT 1');
        $stmt->execute([$workflowsId]);
        $rid = (int)($stmt->fetchColumn() ?: 0);
        if ($rid > 0) {
            $db->prepare("DELETE FROM resources WHERE id = ? AND type = 'workflow'")->execute([$rid]);
        } else {
            // Slug fallback for legacy rows.
            $db->prepare("DELETE FROM resources WHERE type = 'workflow' AND slug = ?")
               ->execute(['wf-builder-' . $workflowsId]);
        }
        $db->prepare('DELETE FROM workflows_resource_link WHERE workflow_id = ?')->execute([$workflowsId]);
    } catch (Throwable $_) { /* swallow */ }
}

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

/**
 * Return the full workflows row for a given id, scoped to the current tenant.
 * Used by mirror-upsert and run_now.
 */
function workflows_fetch_row(PDO $db, int $id, ?string $tWhere, array $tParams): ?array {
    $sql = 'SELECT id, organization_id, user_id, name, trigger_type, trigger_filter, steps_json, status FROM workflows WHERE id = ?';
    $params = [$id];
    if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
    $s = $db->prepare($sql);
    $s->execute($params);
    $row = $s->fetch();
    return $row ?: null;
}

/* ─── Action dispatch (admin-only sub-actions) ──────────────────────────── */
$action = $_GET['action'] ?? null;

if ($action === 'run_now' && $method === 'POST') {
    if (!$user || !$uid) jsonError('Authentication required', 401);
    if (!$id) jsonError('id required', 400);

    if (function_exists('require_org_access_for_write')) {
        require_org_access_for_write('admin');
    }

    $row = workflows_fetch_row($db, $id, $tWhere, $tParams);
    if (!$row) jsonError('Workflow not found', 404);

    // CRM-native engine (webmed6_crm). No cross-DB dependency on api-php.
    require_once __DIR__ . '/../lib/wf_crm.php';

    $context = [
        'triggered_by_user_id' => $uid,
        'manual_test'          => true,
        'fired_at'             => date('c'),
        'source'               => 'crm_run_now',
    ];
    try {
        $runId = wf_crm_run_now((int)$row['id'], $context, $db);
        // Update last_run_at on the builder row (best-effort).
        try { $db->prepare('UPDATE workflows SET last_run_at = NOW() WHERE id = ?')->execute([$id]); } catch (Throwable $_) {}
        jsonResponse(['ok' => true, 'run_id' => $runId, 'started' => $runId !== null]);
    } catch (Throwable $e) {
        jsonError('Run failed: ' . $e->getMessage(), 500);
    }
}

if ($action === 'backfill_engine_mirror' && $method === 'POST') {
    if (!$user || !$uid) jsonError('Authentication required', 401);
    if (function_exists('require_org_access_for_write')) {
        require_org_access_for_write('admin');
    }

    // Iterate every workflows row visible to the current tenant (admins see their
    // own org by default; master-org admins see everything via tenancy semantics).
    $sql = 'SELECT id, organization_id, user_id, name, trigger_type, trigger_filter, steps_json, status FROM workflows';
    $params = [];
    if ($tWhere) { $sql .= ' WHERE ' . $tWhere; $params = $tParams; }
    $s = $db->prepare($sql);
    $s->execute($params);

    $created = 0; $updated = 0; $errors = [];
    while ($row = $s->fetch()) {
        try {
            // Detect create-vs-update by checking the link table first.
            $chk = $db->prepare('SELECT resource_id FROM workflows_resource_link WHERE workflow_id = ? LIMIT 1');
            $chk->execute([$row['id']]);
            $hadLink = (bool)$chk->fetchColumn();
            workflows_upsert_engine_mirror($db, (int)$row['id'], $row);
            if ($hadLink) $updated++; else $created++;
        } catch (Throwable $e) {
            $errors[] = ['workflow_id' => (int)$row['id'], 'error' => $e->getMessage()];
        }
    }
    jsonResponse(['ok' => true, 'created' => $created, 'updated' => $updated, 'errors' => $errors]);
}

// ─── CRUD ────────────────────────────────────────────────────────────
switch ($method) {

    case 'GET':
        if ($id) {
            $sql = 'SELECT w.id, w.organization_id, w.user_id, w.name, w.trigger_type, w.trigger_filter, w.steps_json, w.status, w.last_run_at, w.created_at, w.updated_at, l.resource_id
                    FROM workflows w
                    LEFT JOIN workflows_resource_link l ON l.workflow_id = w.id
                    WHERE w.id = ?';
            $params = [$id];
            if ($tWhere) {
                // Re-alias tenancy_where to the workflows alias `w.` if the helper
                // returned bare column names. tenancy_where() returns clauses using
                // unqualified column names; workflows columns (organization_id, user_id)
                // are the same on the table itself, so alias substitution is safe.
                $sql .= ' AND ' . $tWhere;
                $params = array_merge($params, $tParams);
            }
            $s = $db->prepare($sql);
            $s->execute($params);
            $row = $s->fetch();
            if (!$row) jsonError('Workflow not found', 404);
            $row['resource_id'] = $row['resource_id'] !== null ? (int)$row['resource_id'] : null;
            jsonResponse($row);
        }

        $sql = 'SELECT w.id, w.name, w.trigger_type, w.trigger_filter, w.steps_json, w.status, w.last_run_at, w.created_at, w.updated_at, l.resource_id
                FROM workflows w
                LEFT JOIN workflows_resource_link l ON l.workflow_id = w.id';
        $params = [];
        if ($tWhere) { $sql .= ' WHERE ' . $tWhere; $params = $tParams; }
        $sql .= ' ORDER BY w.created_at DESC LIMIT 500';
        $s = $db->prepare($sql);
        $s->execute($params);
        $rows = $s->fetchAll();
        // Compute step_count for the list view so the UI doesn't have to parse JSON.
        foreach ($rows as &$r) {
            $steps = json_decode($r['steps_json'] ?? '[]', true);
            $r['step_count'] = is_array($steps) ? count($steps) : 0;
            $r['resource_id'] = $r['resource_id'] !== null ? (int)$r['resource_id'] : null;
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
        $newId = (int)$db->lastInsertId();

        // ── Engine mirror (dual-write) ──
        $resourceId = null;
        try {
            $row = workflows_fetch_row($db, $newId, null, []);
            if ($row) $resourceId = workflows_upsert_engine_mirror($db, $newId, $row);
        } catch (Throwable $e) {
            // Mirror failure does NOT roll back the create — the builder row is
            // the source of truth. Re-running backfill_engine_mirror reconciles.
            error_log('workflows mirror upsert failed (id=' . $newId . '): ' . $e->getMessage());
        }
        jsonResponse(['id' => $newId, 'resource_id' => $resourceId], 201);
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

        // ── Engine mirror (dual-write) ──
        $resourceId = null;
        try {
            $row = workflows_fetch_row($db, $id, null, []);
            if ($row) $resourceId = workflows_upsert_engine_mirror($db, (int)$id, $row);
        } catch (Throwable $e) {
            error_log('workflows mirror upsert failed (id=' . $id . '): ' . $e->getMessage());
        }
        jsonResponse(['updated' => true, 'resource_id' => $resourceId]);
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

        // ── Engine mirror cleanup (dual-write) ──
        workflows_delete_engine_mirror($db, (int)$id);

        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}

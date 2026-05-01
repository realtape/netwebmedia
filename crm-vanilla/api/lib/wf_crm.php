<?php
/**
 * CRM-native workflow engine (webmed6_crm).
 *
 * Reads from `workflows` table directly — no cross-DB dependency on api-php.
 * All step execution operates on CRM contacts/deals/tasks in the same DB.
 *
 * Public surface:
 *   wf_crm_trigger(string $type, array $match, array $ctx, ?int $uid, ?int $orgId) : int  (queued run count)
 *   wf_crm_run_pending(PDO $db) : array  (run cron — call from cron_workflows handler)
 *   wf_crm_run_now(int $workflowId, array $ctx, PDO $db) : int|null  (admin run_now)
 *
 * Supported step types (from visual builder vocabulary):
 *   send_email, wait, add_tag, remove_tag, tag, untag,
 *   update_field, move_stage, create_task, webhook, send_whatsapp,
 *   if, log, notify_team
 *
 * Fail-open: individual step errors are logged and the run is failed,
 * but they never block the CRM API response.
 */

require_once __DIR__ . '/email_sender.php';

/* ──────────────────────────────────────────────────────────────────────────
 * Trigger matching
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Fire a trigger. Finds all active workflows whose trigger_type matches $type
 * and whose optional trigger_filter (string) matches $match['tag'] or
 * $match['stage'] etc. Queues a workflow_run for each. Returns count queued.
 */
function wf_crm_trigger(string $type, array $match, array $ctx, ?int $uid, ?int $orgId): int {
    $db = getDB();
    try {
        $stmt = $db->prepare(
            "SELECT id, user_id, organization_id, trigger_filter, steps_json
               FROM workflows
              WHERE status = 'active' AND trigger_type = ?"
        );
        $stmt->execute([$type]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        error_log('[wf_crm] trigger lookup failed: ' . $e->getMessage());
        return 0;
    }

    $queued = 0;
    foreach ($rows as $row) {
        // Optional filter check: if trigger_filter is set it must equal
        // the primary match value (tag name, stage slug, form slug, etc.)
        $filter = trim($row['trigger_filter'] ?? '');
        if ($filter !== '') {
            $matchVal = $match['tag'] ?? ($match['stage'] ?? ($match['slug'] ?? ($match['form_id'] ?? '')));
            if (strtolower($filter) !== strtolower((string)$matchVal)) continue;
        }

        $runUid   = $uid   ?? $row['user_id']         ?? null;
        $runOrgId = $orgId ?? $row['organization_id'] ?? null;
        try {
            wf_crm_enqueue((int)$row['id'], $runUid, $runOrgId, $ctx, $db);
            $queued++;
        } catch (Throwable $e) {
            error_log('[wf_crm] enqueue failed wf=' . $row['id'] . ': ' . $e->getMessage());
        }
    }
    return $queued;
}

/**
 * Queue a workflow run immediately (pending, step 0).
 */
function wf_crm_enqueue(int $workflowId, ?int $uid, ?int $orgId, array $ctx, PDO $db): int {
    $db->prepare(
        'INSERT INTO workflow_runs (workflow_id, user_id, org_id, status, step_index, context_json, next_run_at, created_at, updated_at)
         VALUES (?, ?, ?, "pending", 0, ?, NOW(), NOW(), NOW())'
    )->execute([$workflowId, $uid, $orgId, json_encode($ctx)]);
    return (int)$db->lastInsertId();
}

/* ──────────────────────────────────────────────────────────────────────────
 * Cron runner — call every 5 min from cron_workflows handler
 * ─────────────────────────────────────────────────────────────────────── */

function wf_crm_run_pending(PDO $db): array {
    $stmt = $db->prepare(
        "SELECT r.*, w.steps_json
           FROM workflow_runs r
           JOIN workflows w ON w.id = r.workflow_id
          WHERE r.status IN ('pending','waiting')
            AND (r.next_run_at IS NULL OR r.next_run_at <= NOW())
          ORDER BY r.id ASC
          LIMIT 50"
    );
    $stmt->execute();
    $runs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];
    foreach ($runs as $run) {
        try {
            $res = wf_crm_advance($run, $db);
            $results[] = ['id' => $run['id'], 'wf' => $run['workflow_id'], 'result' => $res];
        } catch (Throwable $e) {
            error_log('[wf_crm] advance run=' . $run['id'] . ' threw: ' . $e->getMessage());
            $db->prepare("UPDATE workflow_runs SET status='failed', error=?, updated_at=NOW() WHERE id=?")
               ->execute([$e->getMessage(), $run['id']]);
            $results[] = ['id' => $run['id'], 'wf' => $run['workflow_id'], 'result' => 'exception'];
        }
    }
    return $results;
}

/**
 * Admin: fire a specific workflow immediately with given context.
 * Returns the run_id or null on failure.
 */
function wf_crm_run_now(int $workflowId, array $ctx, PDO $db): ?int {
    $row = $db->prepare("SELECT * FROM workflows WHERE id = ?")->execute([$workflowId]);
    // Simpler: just enqueue and advance synchronously
    try {
        $runId = wf_crm_enqueue($workflowId, null, null, $ctx, $db);
        $run = $db->prepare(
            "SELECT r.*, w.steps_json FROM workflow_runs r JOIN workflows w ON w.id=r.workflow_id WHERE r.id=?"
        );
        $run->execute([$runId]);
        $runRow = $run->fetch(PDO::FETCH_ASSOC);
        if ($runRow) wf_crm_advance($runRow, $db);
        return $runId;
    } catch (Throwable $e) {
        error_log('[wf_crm] run_now wf=' . $workflowId . ': ' . $e->getMessage());
        return null;
    }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Step execution
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Advance one run by executing the current step.
 * Updates workflow_runs status in place.
 */
function wf_crm_advance(array $run, PDO $db): string {
    $steps    = json_decode($run['steps_json'] ?? '[]', true) ?: [];
    $idx      = (int)$run['step_index'];
    $ctx      = json_decode($run['context_json'] ?? '{}', true) ?: [];
    $runId    = (int)$run['id'];

    if (empty($steps)) {
        $db->prepare("UPDATE workflow_runs SET status='completed', updated_at=NOW() WHERE id=?")
           ->execute([$runId]);
        return 'no_steps';
    }

    // Normalise step vocabulary (visual builder → engine)
    $steps = array_map('wf_crm_normalise_step', $steps);

    if ($idx >= count($steps)) {
        $db->prepare("UPDATE workflow_runs SET status='completed', updated_at=NOW() WHERE id=?")
           ->execute([$runId]);
        return 'already_done';
    }

    $step = $steps[$idx];
    $action = $step['type'] ?? ($step['action'] ?? 'log');
    $config = $step['config'] ?? $step;  // visual builder puts config under 'config'

    // Mark running
    $db->prepare("UPDATE workflow_runs SET status='running', updated_at=NOW() WHERE id=?")->execute([$runId]);

    $stepResult = 'ok';
    $advanceIdx = true;
    $waitUntil  = null;
    $extraSteps = null;  // for 'if' branches

    switch ($action) {

        /* ── wait ────────────────────────────────────────────────────── */
        case 'wait':
            $delay = (int)($config['delay'] ?? $config['minutes'] ?? $config['hours'] ?? $config['days'] ?? 1);
            $unit  = strtolower($config['unit'] ?? (isset($config['hours']) ? 'hours' : (isset($config['days']) ? 'days' : 'minutes')));
            $minutes = match($unit) {
                'hours', 'hour'   => $delay * 60,
                'days',  'day'    => $delay * 60 * 24,
                default           => $delay,
            };
            $waitUntil  = date('Y-m-d H:i:s', time() + $minutes * 60);
            $advanceIdx = true;   // move to next step; next_run_at gates it
            $stepResult = "wait_{$minutes}min";
            break;

        /* ── send_email ──────────────────────────────────────────────── */
        case 'send_email':
            $to = $config['to'] ?? ($ctx['email'] ?? null);
            if (!$to) { $stepResult = 'no_recipient'; break; }
            if (str_contains($to, '{{')) {
                // Simple token replace: {{contact.email}}, {{email}}
                $to = preg_replace_callback('/\{\{([^}]+)\}\}/', fn($m) =>
                    $ctx[trim($m[1])] ?? ($ctx['contact'][trim($m[1])] ?? ''), $to);
            }
            if (!filter_var($to, FILTER_VALIDATE_EMAIL)) { $stepResult = 'bad_email'; break; }
            $subject = $config['subject'] ?? 'Message from NetWebMedia';
            $body    = $config['body']    ?? '';
            // Replace basic merge tags
            foreach ($ctx as $k => $v) {
                if (is_scalar($v)) {
                    $subject = str_replace('{{' . $k . '}}', (string)$v, $subject);
                    $body    = str_replace('{{' . $k . '}}', (string)$v, $body);
                }
            }
            $html = nl2br(htmlspecialchars($body));
            $res  = mailSend(['to' => $to, 'subject' => $subject, 'html' => $html]);
            $stepResult = $res['ok'] ? 'email_sent' : 'email_failed';
            break;

        /* ── tag / add_tag ───────────────────────────────────────────── */
        case 'tag':
        case 'add_tag':
            $tag = $config['tag'] ?? ($config['value'] ?? '');
            if ($tag && !empty($ctx['contact_id'])) {
                wf_crm_add_tag((int)$ctx['contact_id'], $tag, $db);
                // Cascade: fire tag_added trigger
                try {
                    wf_crm_trigger('tag_added', ['tag' => $tag],
                        array_merge($ctx, ['_cascade_depth' => ($ctx['_cascade_depth'] ?? 0) + 1]),
                        $run['user_id'] ?? null, $run['org_id'] ?? null);
                } catch (Throwable $_) {}
            }
            $stepResult = $tag ? "tag_added:$tag" : 'no_tag';
            break;

        /* ── untag / remove_tag ──────────────────────────────────────── */
        case 'untag':
        case 'remove_tag':
            $tag = $config['tag'] ?? ($config['value'] ?? '');
            if ($tag && !empty($ctx['contact_id'])) {
                wf_crm_remove_tag((int)$ctx['contact_id'], $tag, $db);
                try {
                    wf_crm_trigger('tag_removed', ['tag' => $tag],
                        array_merge($ctx, ['_cascade_depth' => ($ctx['_cascade_depth'] ?? 0) + 1]),
                        $run['user_id'] ?? null, $run['org_id'] ?? null);
                } catch (Throwable $_) {}
            }
            $stepResult = $tag ? "tag_removed:$tag" : 'no_tag';
            break;

        /* ── update_field ────────────────────────────────────────────── */
        case 'update_field':
            $field = $config['field'] ?? '';
            $value = $config['value'] ?? '';
            $ALLOWED = ['status', 'segment', 'niche', 'source', 'company', 'city', 'country'];
            if ($field && in_array($field, $ALLOWED) && !empty($ctx['contact_id'])) {
                $db->prepare("UPDATE contacts SET {$field} = ?, updated_at = NOW() WHERE id = ?")
                   ->execute([$value, $ctx['contact_id']]);
                $stepResult = "field_{$field}={$value}";
            } else {
                $stepResult = 'skipped_bad_field';
            }
            break;

        /* ── move_stage ──────────────────────────────────────────────── */
        case 'move_stage':
            $stage = $config['stage'] ?? '';
            if ($stage && !empty($ctx['contact_id'])) {
                $db->prepare("UPDATE deals SET stage = ?, updated_at = NOW() WHERE contact_id = ? ORDER BY id DESC LIMIT 1")
                   ->execute([$stage, $ctx['contact_id']]);
                $stepResult = "stage→{$stage}";
                // Cascade trigger
                try {
                    wf_crm_trigger('deal_stage', ['stage' => $stage],
                        array_merge($ctx, ['_cascade_depth' => ($ctx['_cascade_depth'] ?? 0) + 1]),
                        $run['user_id'] ?? null, $run['org_id'] ?? null);
                } catch (Throwable $_) {}
            }
            break;

        /* ── create_task ─────────────────────────────────────────────── */
        case 'create_task':
            $title = $config['title'] ?? ($config['title_tpl'] ?? 'Task from workflow');
            foreach ($ctx as $k => $v) {
                if (is_scalar($v)) $title = str_replace('{{' . $k . '}}', (string)$v, $title);
            }
            $dueIn   = (int)($config['due_in_days'] ?? 1);
            $dueDate = date('Y-m-d', strtotime("+{$dueIn} days"));
            try {
                $db->prepare(
                    "INSERT INTO events (user_id, org_id, contact_id, type, title, start_time, created_at, updated_at)
                     VALUES (?, ?, ?, 'task', ?, ?, NOW(), NOW())"
                )->execute([
                    $run['user_id'] ?? null,
                    $run['org_id']  ?? null,
                    $ctx['contact_id'] ?? null,
                    $title,
                    $dueDate . ' 09:00:00',
                ]);
                $stepResult = 'task_created';
            } catch (Throwable $e) {
                $stepResult = 'task_failed:' . $e->getMessage();
            }
            break;

        /* ── webhook ─────────────────────────────────────────────────── */
        case 'webhook':
            $url     = $config['url'] ?? '';
            $payload = $config['payload'] ?? $ctx;
            if (!filter_var($url, FILTER_VALIDATE_URL)) { $stepResult = 'bad_url'; break; }
            try {
                require_once __DIR__ . '/url_guard.php';
                url_guard($url);
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT        => 10,
                    CURLOPT_POST           => true,
                    CURLOPT_POSTFIELDS     => json_encode(is_array($payload) ? $payload : $ctx),
                    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                ]);
                $resp = curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                $stepResult = "webhook_{$code}";
            } catch (Throwable $e) {
                $stepResult = 'webhook_blocked:' . $e->getMessage();
            }
            break;

        /* ── send_whatsapp ───────────────────────────────────────────── */
        case 'send_whatsapp':
            $to   = $config['to'] ?? ($ctx['phone'] ?? null);
            $body = $config['body'] ?? '';
            if (!$to) { $stepResult = 'no_phone'; break; }
            try {
                require_once __DIR__ . '/twilio_client.php';
                $res = twilioSendWhatsapp($to, $body);
                $stepResult = $res['ok'] ? 'wa_sent' : 'wa_failed';
            } catch (Throwable $e) {
                $stepResult = 'wa_error:' . $e->getMessage();
            }
            break;

        /* ── notify_team ─────────────────────────────────────────────── */
        case 'notify_team':
            $msg = $config['message'] ?? 'Workflow notification';
            foreach ($ctx as $k => $v) {
                if (is_scalar($v)) $msg = str_replace('{{' . $k . '}}', (string)$v, $msg);
            }
            mailSend([
                'to'      => 'hello@netwebmedia.com',
                'subject' => '[NWM Workflow] ' . $msg,
                'html'    => '<p>' . htmlspecialchars($msg) . '</p>',
            ]);
            $stepResult = 'team_notified';
            break;

        /* ── if (conditional branch) ─────────────────────────────────── */
        case 'if':
            $cond  = $config['condition'] ?? [];
            $field = $cond['field'] ?? '';
            $op    = $cond['op']    ?? 'eq';
            $cval  = $cond['value'] ?? '';
            $actual = $ctx[$field] ?? ($ctx['contact'][$field] ?? null);
            $pass   = match($op) {
                'eq'       => (string)$actual === (string)$cval,
                'neq'      => (string)$actual !== (string)$cval,
                'contains' => str_contains((string)$actual, (string)$cval),
                'gt'       => (float)$actual > (float)$cval,
                'lt'       => (float)$actual < (float)$cval,
                'exists'   => !empty($actual),
                default    => false,
            };
            $branch = $pass ? ($config['then'] ?? []) : ($config['else'] ?? []);
            if (!empty($branch)) {
                // Inject branch steps AFTER current idx
                $extraSteps = $branch;
            }
            $stepResult = 'if_' . ($pass ? 'then' : 'else');
            break;

        /* ── log ─────────────────────────────────────────────────────── */
        case 'log':
        default:
            $msg = $config['message'] ?? ("step: $action");
            foreach ($ctx as $k => $v) {
                if (is_scalar($v)) $msg = str_replace('{{' . $k . '}}', (string)$v, $msg);
            }
            error_log("[wf_crm] run={$runId} step={$idx} log: {$msg}");
            $stepResult = 'logged';
            break;
    }

    // Handle 'if' branch injection: prepend branch steps into context so they run next
    if ($extraSteps) {
        // Store injected steps in context for pickup next advance
        $ctx['_injected_steps'] = $extraSteps;
        $ctx['_injected_at']    = $idx;
    }

    $nextIdx = $idx + 1;
    $newCtx  = json_encode($ctx);

    if ($waitUntil) {
        $db->prepare(
            "UPDATE workflow_runs SET status='waiting', step_index=?, context_json=?, next_run_at=?, error=NULL, updated_at=NOW() WHERE id=?"
        )->execute([$nextIdx, $newCtx, $waitUntil, $runId]);
        return $stepResult;
    }

    if ($nextIdx >= count($steps)) {
        $db->prepare(
            "UPDATE workflow_runs SET status='completed', step_index=?, context_json=?, next_run_at=NULL, error=NULL, updated_at=NOW() WHERE id=?"
        )->execute([$nextIdx, $newCtx, $runId]);
        return $stepResult;
    }

    // More steps remain — stay pending, advance index, re-run synchronously (non-wait steps)
    $db->prepare(
        "UPDATE workflow_runs SET status='pending', step_index=?, context_json=?, next_run_at=NULL, error=NULL, updated_at=NOW() WHERE id=?"
    )->execute([$nextIdx, $newCtx, $runId]);

    // Recurse synchronously for non-wait steps (max depth guard via step_index)
    if ($nextIdx < count($steps)) {
        $nextRun = array_merge($run, [
            'step_index'   => $nextIdx,
            'context_json' => $newCtx,
            'status'       => 'pending',
        ]);
        return wf_crm_advance($nextRun, $db);
    }

    return $stepResult;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Vocabulary normalisation: visual builder → engine
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * The visual builder stores steps like:
 *   {"type":"add_tag","config":{"tag":"mql"}}
 *   {"type":"wait","config":{"delay":2,"unit":"hours"}}
 * The engine expects the same shape. This function ensures 'type' is set
 * and aliases any legacy 'action' key. No-op if already correct.
 */
function wf_crm_normalise_step(array $step): array {
    if (!isset($step['type']) && isset($step['action'])) {
        $step['type'] = $step['action'];
    }
    if (!isset($step['config'])) {
        // Flat legacy format: merge non-'type'/'action' keys into config
        $config = array_diff_key($step, array_flip(['type', 'action']));
        if ($config) $step['config'] = $config;
    }
    return $step;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Contact helpers (tags)
 * ─────────────────────────────────────────────────────────────────────── */

function wf_crm_add_tag(int $contactId, string $tag, PDO $db): void {
    $row = $db->prepare("SELECT tags FROM contacts WHERE id=?")->execute([$contactId])
        ? null : null;
    $stmt = $db->prepare("SELECT tags FROM contacts WHERE id=?");
    $stmt->execute([$contactId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return;
    $tags = array_filter(array_map('trim', explode(',', $row['tags'] ?? '')));
    if (!in_array($tag, $tags)) {
        $tags[] = $tag;
        $db->prepare("UPDATE contacts SET tags=?, updated_at=NOW() WHERE id=?")
           ->execute([implode(',', $tags), $contactId]);
    }
}

function wf_crm_remove_tag(int $contactId, string $tag, PDO $db): void {
    $stmt = $db->prepare("SELECT tags FROM contacts WHERE id=?");
    $stmt->execute([$contactId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return;
    $tags = array_filter(array_map('trim', explode(',', $row['tags'] ?? '')));
    $tags = array_values(array_filter($tags, fn($t) => $t !== $tag));
    $db->prepare("UPDATE contacts SET tags=?, updated_at=NOW() WHERE id=?")
       ->execute([implode(',', $tags), $contactId]);
}

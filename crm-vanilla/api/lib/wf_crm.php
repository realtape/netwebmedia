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
 * Auto-reply hardcoded denylist (PR 3, spec §10).
 *
 * These are NON-OVERRIDABLE by tenant config. The auto_reply_config table can
 * append to the topic denylist via `denylist_topics` JSON, but cannot subtract
 * from these. Belt-and-suspenders against AI hallucination + prompt injection.
 *
 * Synced with:
 *   - kb.json `auto_send_blocked_contact_tags` (informational, used by drafter)
 *   - ai_draft_reply_regex_denylist() in handlers/ai_draft_reply.php (raw text sweep)
 * ─────────────────────────────────────────────────────────────────────── */

const WF_CRM_HARDCODED_DENYLIST_TOPICS = [
    'legal', 'refund', 'complaint', 'custom_quote', 'contract',
    'competitor_mention', 'gdpr', 'cancel', 'lawsuit', 'lawyer',
    'nda', 'invoice_dispute', 'chargeback',
];

const WF_CRM_HARDCODED_DENYLIST_TAGS = ['enterprise', 'at_risk', 'vip', 'paused'];

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
            if ($unit === 'hours' || $unit === 'hour') {
                $minutes = $delay * 60;
            } elseif ($unit === 'days' || $unit === 'day') {
                $minutes = $delay * 60 * 24;
            } else {
                $minutes = $delay;
            }
            $waitUntil  = date('Y-m-d H:i:s', time() + $minutes * 60);
            $advanceIdx = true;   // move to next step; next_run_at gates it
            $stepResult = "wait_{$minutes}min";
            break;

        /* ── send_email ──────────────────────────────────────────────── */
        case 'send_email':
            $to = $config['to'] ?? ($ctx['email'] ?? null);
            if (!$to) { $stepResult = 'no_recipient'; break; }
            if (strpos($to, '{{') !== false) {
                // Simple token replace: {{contact.email}}, {{email}}
                $ctxRef = $ctx;
                $to = preg_replace_callback('/\{\{([^}]+)\}\}/', function ($m) use ($ctxRef) {
                    $k = trim($m[1]);
                    return isset($ctxRef[$k]) ? $ctxRef[$k] : (isset($ctxRef['contact'][$k]) ? $ctxRef['contact'][$k] : '');
                }, $to);
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
                require_once __DIR__ . '/wa_meta_send.php';
                $res = wa_meta_send((string)$to, (string)$body);
                $stepResult = $res['success'] ? 'wa_sent' : 'wa_failed:' . ($res['error'] ?? 'unknown');
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
            switch ($op) {
                case 'eq':      $pass = ((string)$actual === (string)$cval); break;
                case 'neq':     $pass = ((string)$actual !== (string)$cval); break;
                case 'contains':$pass = (strpos((string)$actual, (string)$cval) !== false); break;
                case 'gt':      $pass = ((float)$actual > (float)$cval); break;
                case 'lt':      $pass = ((float)$actual < (float)$cval); break;
                case 'exists':  $pass = !empty($actual); break;
                default:        $pass = false; break;
            }
            $branch = $pass ? ($config['then'] ?? []) : ($config['else'] ?? []);
            if (!empty($branch)) {
                // Inject branch steps AFTER current idx
                $extraSteps = $branch;
            }
            $stepResult = 'if_' . ($pass ? 'then' : 'else');
            break;

        /* ── draft_ai_reply (PR 3, auto-reply system) ────────────────── */
        case 'draft_ai_reply':
            try {
                // Sentinel: tell ai_draft_reply.php to skip its route dispatcher
                // and just register function definitions. PHP function decls are
                // hoisted, so the dispatcher being skipped doesn't affect us.
                if (!defined('AI_DRAFT_REPLY_AS_LIBRARY')) {
                    define('AI_DRAFT_REPLY_AS_LIBRARY', true);
                }
                require_once __DIR__ . '/../handlers/ai_draft_reply.php';
                $convId = (int)($ctx['conversation_id'] ?? 0);
                if ($convId <= 0) {
                    $stepResult = 'draft_skipped:no_conversation_id';
                    break;
                }

                // Tenancy comes from the run row (already scoped at trigger time).
                $orgId = (int)($run['org_id']  ?? 0) ?: null;
                $uid   = (int)($run['user_id'] ?? 0) ?: null;

                // Defensive lazy-create — keeps the engine working before migrate ran.
                $db->exec(
                    "CREATE TABLE IF NOT EXISTS conversation_drafts (
                      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      organization_id BIGINT UNSIGNED NULL,
                      user_id INT UNSIGNED NULL,
                      conversation_id BIGINT UNSIGNED NOT NULL,
                      message_id BIGINT UNSIGNED NULL,
                      channel ENUM('email','sms','whatsapp','ig_dm') NOT NULL,
                      draft_body MEDIUMTEXT NOT NULL,
                      draft_subject VARCHAR(300) NULL,
                      confidence DECIMAL(4,3) NOT NULL DEFAULT 0,
                      topic VARCHAR(80) NULL,
                      status ENUM('pending_approval','approved','auto_sent','sent','rejected','edited_sent','expired','shadow') NOT NULL DEFAULT 'pending_approval',
                      shadow_mode TINYINT(1) NOT NULL DEFAULT 0,
                      source ENUM('ai','holding','human_override') NOT NULL DEFAULT 'ai',
                      approval_channel ENUM('whatsapp','crm','none') NULL,
                      approver_user_id INT UNSIGNED NULL,
                      edited_body MEDIUMTEXT NULL,
                      audit_blob MEDIUMTEXT NULL,
                      expires_at DATETIME NULL,
                      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      approved_at DATETIME NULL,
                      sent_at DATETIME NULL,
                      INDEX idx_cd_conv (conversation_id),
                      INDEX idx_cd_status (status, expires_at),
                      INDEX idx_cd_org (organization_id),
                      INDEX idx_cd_pending (status, created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );

                $cfg = wf_crm_load_auto_reply_config($db, $orgId);
                $shadow = (int)($cfg['shadow_mode_enabled'] ?? 1);
                $failsafeMin = (int)($cfg['failsafe_minutes'] ?? 4);
                if ($failsafeMin < 1) $failsafeMin = 4;

                $draft = ai_draft_reply($convId, $db);

                $channel = (string)($draft['channel'] ?? 'email');
                $allowedChannels = ['email','sms','whatsapp','ig_dm'];
                if (!in_array($channel, $allowedChannels, true)) $channel = 'email';

                $auditJson = json_encode($draft['audit_blob'] ?? [], JSON_UNESCAPED_UNICODE);
                $msgId = isset($ctx['message_id']) ? (int)$ctx['message_id'] : null;

                $expiresAt = date('Y-m-d H:i:s', time() + $failsafeMin * 60);

                $ins = $db->prepare(
                    "INSERT INTO conversation_drafts
                       (organization_id, user_id, conversation_id, message_id, channel,
                        draft_body, draft_subject, confidence, topic,
                        status, shadow_mode, source, audit_blob, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, 'ai', ?, ?)"
                );
                $ins->execute([
                    $orgId,
                    $uid,
                    $convId,
                    $msgId,
                    $channel,
                    (string)($draft['draft'] ?? ''),
                    isset($draft['subject']) && $draft['subject'] !== '' ? (string)$draft['subject'] : null,
                    (float)($draft['confidence'] ?? 0),
                    isset($draft['topic']) && $draft['topic'] !== '' ? (string)$draft['topic'] : null,
                    $shadow ? 1 : 0,
                    $auditJson,
                    $expiresAt,
                ]);
                $draftId = (int)$db->lastInsertId();

                $ctx['draft_id']       = $draftId;
                $ctx['confidence']     = (float)($draft['confidence'] ?? 0);
                $ctx['topic']          = (string)($draft['topic'] ?? '');
                $ctx['channel']        = $channel;
                $ctx['lang']           = (string)($draft['lang'] ?? 'en');
                $ctx['requires_human'] = !empty($draft['requires_human']);
                $ctx['human_reason']   = $draft['human_reason'] ?? null;
                $ctx['shadow_mode']    = $shadow ? 1 : 0;
                $ctx['expires_at']     = $expiresAt;

                $stepResult = 'drafted:' . $draftId;
            } catch (Throwable $e) {
                error_log('[wf_crm] draft_ai_reply failed run=' . $runId . ': ' . $e->getMessage());
                $stepResult = 'draft_failed:' . substr($e->getMessage(), 0, 80);
                // Force route to approval so we never auto-send on a broken draft.
                $ctx['route'] = 'approval';
                $ctx['route_reasons'][] = 'drafter_exception';
            }
            break;

        /* ── route_by_confidence (PR 3) ──────────────────────────────── */
        case 'route_by_confidence':
            try {
                $orgId = (int)($run['org_id'] ?? 0) ?: null;
                $cfg = wf_crm_load_auto_reply_config($db, $orgId);

                $threshold = isset($config['threshold'])
                    ? (float)$config['threshold']
                    : (float)($cfg['confidence_threshold'] ?? 0.85);

                $reasons = isset($ctx['route_reasons']) && is_array($ctx['route_reasons'])
                    ? $ctx['route_reasons'] : [];

                $route = 'auto';
                $confidence = (float)($ctx['confidence'] ?? 0);
                $topic = (string)($ctx['topic'] ?? '');

                // 1. Drafter said requires_human (KB safety + regex denylist already evaluated there).
                if (!empty($ctx['requires_human'])) {
                    $route = 'approval';
                    $reasons[] = 'requires_human:' . (string)($ctx['human_reason'] ?? 'unspecified');
                }

                // 2. Hardcoded topic denylist — non-overridable by tenant config.
                if ($topic !== '' && in_array(strtolower($topic), array_map('strtolower', WF_CRM_HARDCODED_DENYLIST_TOPICS), true)) {
                    $route = 'approval';
                    $reasons[] = 'denylist_topic:' . $topic;
                }

                // 3. Tenant-configured topic denylist (additive on top of hardcoded list).
                $tenantDeny = [];
                if (!empty($cfg['denylist_topics'])) {
                    $decoded = json_decode((string)$cfg['denylist_topics'], true);
                    if (is_array($decoded)) {
                        $tenantDeny = array_map('strtolower', array_map('strval', $decoded));
                    }
                }
                if ($topic !== '' && in_array(strtolower($topic), $tenantDeny, true)) {
                    $route = 'approval';
                    $reasons[] = 'tenant_denylist_topic:' . $topic;
                }

                // 4. Contact tag denylist (hardcoded).
                $contactId = (int)($ctx['contact_id'] ?? 0);
                if ($contactId > 0) {
                    try {
                        $tStmt = $db->prepare('SELECT tags FROM contacts WHERE id = ? LIMIT 1');
                        $tStmt->execute([$contactId]);
                        $tagsStr = (string)($tStmt->fetchColumn() ?: '');
                        if ($tagsStr !== '') {
                            $contactTags = array_filter(array_map(function($t) {
                                return strtolower(trim($t));
                            }, explode(',', $tagsStr)));
                            $blockedTagSet = array_map('strtolower', WF_CRM_HARDCODED_DENYLIST_TAGS);
                            $hits = array_values(array_intersect($contactTags, $blockedTagSet));
                            if (!empty($hits)) {
                                $route = 'approval';
                                $reasons[] = 'denylist_tag:' . implode(',', $hits);
                            }
                        }
                    } catch (Throwable $_) { /* tags column missing — skip silently */ }
                }

                // 5. Confidence threshold.
                if ($confidence < $threshold) {
                    $route = 'approval';
                    $reasons[] = 'confidence:' . sprintf('%.3f<%.3f', $confidence, $threshold);
                }

                // 6. Tenant allowlist topics (if set, topic must be in it).
                if (!empty($cfg['allowlist_topics'])) {
                    $allow = json_decode((string)$cfg['allowlist_topics'], true);
                    if (is_array($allow) && !empty($allow)) {
                        $allowLower = array_map('strtolower', array_map('strval', $allow));
                        if ($topic === '' || !in_array(strtolower($topic), $allowLower, true)) {
                            $route = 'approval';
                            $reasons[] = 'topic_not_allowlisted:' . $topic;
                        }
                    }
                }

                // 7. IG DM channel — never auto-send (no inbound infra yet, spec §8).
                $channel = (string)($ctx['channel'] ?? '');
                if ($channel === 'ig_dm') {
                    $route = 'approval';
                    $reasons[] = 'channel_ig_dm_force_approval';
                }

                $ctx['route'] = $route;
                $ctx['route_reasons'] = $reasons;
                $stepResult = 'route:' . $route;
            } catch (Throwable $e) {
                error_log('[wf_crm] route_by_confidence failed run=' . $runId . ': ' . $e->getMessage());
                // Fail-closed — anything we can't evaluate goes to approval.
                $ctx['route'] = 'approval';
                $ctx['route_reasons'][] = 'router_exception';
                $stepResult = 'route_error';
            }
            break;

        /* ── auto_send_if_eligible (PR 3) ────────────────────────────── */
        case 'auto_send_if_eligible':
            try {
                if (($ctx['route'] ?? 'approval') !== 'auto') {
                    $stepResult = 'auto_send_skipped:not_auto';
                    break;
                }
                $draftId = (int)($ctx['draft_id'] ?? 0);
                if ($draftId <= 0) {
                    $stepResult = 'auto_send_skipped:no_draft_id';
                    break;
                }
                $shadow = (int)($ctx['shadow_mode'] ?? 1);

                if ($shadow) {
                    // Shadow mode: mark and exit. No real send.
                    $db->prepare(
                        "UPDATE conversation_drafts
                            SET status='shadow', sent_at=NULL, updated_at=NOW()
                          WHERE id = ?"
                    )->execute([$draftId]);
                    $stepResult = 'auto_send_shadow';
                    break;
                }

                // Real send path: load the draft + conversation context.
                $row = wf_crm_load_draft_with_conv($db, $draftId);
                if (!$row) {
                    $stepResult = 'auto_send_failed:draft_not_found';
                    break;
                }
                $channel = (string)$row['channel'];
                $body    = (string)$row['draft_body'];
                $subject = $row['draft_subject'];
                $convId  = (int)$row['conversation_id'];

                // TODO(PR 4): replace this dispatch with channel_send($channel, $conv, $body, $subject).
                // For PR 3 we inline the existing sender calls. ig_dm is force-routed to approval upstream
                // by route_by_confidence, so we should never reach here for ig_dm.
                $sendOk = false; $sendErr = null;
                if ($channel === 'email') {
                    require_once __DIR__ . '/email_sender.php';
                    $to = $row['contact_email'] ?? null;
                    if (!$to) { $sendErr = 'no_recipient_email'; }
                    else {
                        $res = mailSend([
                            'to'      => $to,
                            'subject' => $subject ?: 'Reply from NetWebMedia',
                            'html'    => nl2br(htmlspecialchars($body)),
                        ]);
                        $sendOk = !empty($res['ok']);
                        if (!$sendOk) $sendErr = $res['error'] ?? 'mail_send_failed';
                    }
                } elseif ($channel === 'whatsapp') {
                    require_once __DIR__ . '/wa_meta_send.php';
                    $phone = $row['contact_phone'] ?? null;
                    if (!$phone) { $sendErr = 'no_recipient_phone'; }
                    else {
                        $res = wa_meta_send((string)$phone, $body);
                        $sendOk = $res['success'];
                        if (!$sendOk) $sendErr = 'wa_meta_send_failed:' . ($res['error'] ?? 'unknown');
                    }
                } elseif ($channel === 'sms') {
                    require_once __DIR__ . '/twilio_client.php';
                    $phone = $row['contact_phone'] ?? null;
                    if (!$phone) { $sendErr = 'no_recipient_phone'; }
                    else {
                        $sid = twilio_send($phone, $body, 'sms');
                        $sendOk = $sid !== false;
                        if (!$sendOk) $sendErr = 'twilio_sms_failed';
                    }
                } else {
                    // ig_dm or unknown — should have been routed to approval. Defense-in-depth.
                    $sendErr = 'channel_not_supported_in_auto_send:' . $channel;
                }

                if (!$sendOk) {
                    // Mark draft rejected with the error captured in audit_blob.
                    $audit = wf_crm_audit_merge($row['audit_blob'] ?? null, ['send_error' => (string)$sendErr]);
                    $db->prepare(
                        "UPDATE conversation_drafts
                            SET status='rejected', audit_blob=?, updated_at=NOW()
                          WHERE id = ?"
                    )->execute([$audit, $draftId]);
                    error_log('[wf_crm] auto_send_if_eligible send failed draft=' . $draftId . ' err=' . $sendErr);
                    $stepResult = 'auto_send_failed:' . substr((string)$sendErr, 0, 60);
                    break;
                }

                // Persist outbound message into messages + flip draft status.
                $convOrg = isset($row['conv_org_id']) && $row['conv_org_id'] !== null ? (int)$row['conv_org_id'] : null;
                if ($convOrg !== null) {
                    $db->prepare(
                        "INSERT INTO messages (organization_id, conversation_id, sender, body, sent_at)
                         VALUES (?, ?, 'me', ?, NOW())"
                    )->execute([$convOrg, $convId, $body]);
                } else {
                    $db->prepare(
                        "INSERT INTO messages (conversation_id, sender, body, sent_at)
                         VALUES (?, 'me', ?, NOW())"
                    )->execute([$convId, $body]);
                }
                $db->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?")->execute([$convId]);

                $db->prepare(
                    "UPDATE conversation_drafts
                        SET status='auto_sent', sent_at=NOW(), updated_at=NOW()
                      WHERE id = ?"
                )->execute([$draftId]);
                $stepResult = 'auto_sent';
            } catch (Throwable $e) {
                error_log('[wf_crm] auto_send_if_eligible exception run=' . $runId . ': ' . $e->getMessage());
                $stepResult = 'auto_send_exception';
            }
            break;

        /* ── push_for_approval (PR 3 — STUB; PR 5 wires real WhatsApp send) ── */
        case 'push_for_approval':
            try {
                if (($ctx['route'] ?? 'approval') !== 'approval') {
                    $stepResult = 'push_skipped:not_approval';
                    break;
                }
                $draftId = (int)($ctx['draft_id'] ?? 0);
                if ($draftId <= 0) {
                    $stepResult = 'push_skipped:no_draft_id';
                    break;
                }
                // STUB: PR 5 will dispatch a WhatsApp message to Carlos's operator number.
                // The CRM polling badge already picks up the row via status='pending_approval'.
                $db->prepare(
                    "UPDATE conversation_drafts
                        SET approval_channel='whatsapp', updated_at=NOW()
                      WHERE id = ?"
                )->execute([$draftId]);
                error_log('[PUSH STUB] would send draft ' . $draftId . ' to operator (PR 5)');
                $stepResult = 'push_stub:' . $draftId;
            } catch (Throwable $e) {
                error_log('[wf_crm] push_for_approval exception run=' . $runId . ': ' . $e->getMessage());
                $stepResult = 'push_exception';
            }
            break;

        /* ── holding_reply_if_no_approval (PR 3 — wait+check pair) ──── */
        case 'holding_reply_if_no_approval':
            try {
                $waitMinutes = (int)($config['wait_minutes'] ?? 4);
                if ($waitMinutes < 1) $waitMinutes = 4;

                if (empty($ctx['holding_wait_started_at'])) {
                    // First entry: arm the wait. Setting $advanceIdx=false keeps step_index
                    // pointed at this step so the next pending tick re-enters here with
                    // holding_wait_started_at set, falling through to the resume branch.
                    $ctx['holding_wait_started_at'] = date('Y-m-d H:i:s');
                    $waitUntil  = date('Y-m-d H:i:s', time() + $waitMinutes * 60);
                    $advanceIdx = false;
                    $stepResult = 'holding_armed:' . $waitMinutes . 'min';
                    break;
                }

                // Resume: re-read the draft. If still pending_approval / shadow, send holding.
                $draftId = (int)($ctx['draft_id'] ?? 0);
                if ($draftId <= 0) { $stepResult = 'holding_skipped:no_draft_id'; break; }

                $sel = $db->prepare(
                    "SELECT cd.id, cd.status, cd.channel, cd.conversation_id,
                            c.phone AS contact_phone, c.email AS contact_email,
                            conv.organization_id AS conv_org_id
                       FROM conversation_drafts cd
                       LEFT JOIN conversations conv ON conv.id = cd.conversation_id
                       LEFT JOIN contacts c ON c.id = conv.contact_id
                      WHERE cd.id = ?"
                );
                $sel->execute([$draftId]);
                $drow = $sel->fetch(PDO::FETCH_ASSOC);
                if (!$drow) { $stepResult = 'holding_skipped:draft_gone'; break; }

                if (!in_array($drow['status'], ['pending_approval', 'shadow'], true)) {
                    // Already actioned (auto_sent / approved / rejected / etc.) — nothing to do.
                    $stepResult = 'holding_skipped:status=' . $drow['status'];
                    break;
                }

                $orgId = (int)($run['org_id'] ?? 0) ?: null;
                $cfg = wf_crm_load_auto_reply_config($db, $orgId);
                $lang = (string)($ctx['lang'] ?? 'en');
                $body = $lang === 'es'
                    ? ((string)($cfg['holding_reply_es'] ?? '') ?: 'Recibido — Carlos responde en la próxima hora.')
                    : ((string)($cfg['holding_reply_en'] ?? '') ?: 'Got your message — Carlos will respond within the hour.');

                $channel = (string)$drow['channel'];
                $convId  = (int)$drow['conversation_id'];

                // TODO(PR 4): swap to channel_send().
                $sendOk = false; $sendErr = null;
                if ($channel === 'email') {
                    require_once __DIR__ . '/email_sender.php';
                    $to = $drow['contact_email'] ?? null;
                    if (!$to) { $sendErr = 'no_recipient_email'; }
                    else {
                        $res = mailSend([
                            'to'      => $to,
                            'subject' => 'Got your message',
                            'html'    => nl2br(htmlspecialchars($body)),
                        ]);
                        $sendOk = !empty($res['ok']);
                        if (!$sendOk) $sendErr = $res['error'] ?? 'mail_send_failed';
                    }
                } elseif ($channel === 'whatsapp') {
                    require_once __DIR__ . '/wa_meta_send.php';
                    $phone = $drow['contact_phone'] ?? null;
                    if (!$phone) { $sendErr = 'no_recipient_phone'; }
                    else {
                        $res = wa_meta_send((string)$phone, $body);
                        $sendOk = $res['success'];
                        if (!$sendOk) $sendErr = 'wa_meta_send_failed:' . ($res['error'] ?? 'unknown');
                    }
                } elseif ($channel === 'sms') {
                    require_once __DIR__ . '/twilio_client.php';
                    $phone = $drow['contact_phone'] ?? null;
                    if (!$phone) { $sendErr = 'no_recipient_phone'; }
                    else {
                        $sid = twilio_send($phone, $body, 'sms');
                        $sendOk = $sid !== false;
                        if (!$sendOk) $sendErr = 'twilio_sms_failed';
                    }
                } else {
                    $sendErr = 'channel_not_supported_for_holding:' . $channel;
                }

                if (!$sendOk) {
                    error_log('[wf_crm] holding send failed draft=' . $draftId . ' err=' . $sendErr);
                    $stepResult = 'holding_send_failed:' . substr((string)$sendErr, 0, 60);
                    break;
                }

                // Persist holding message into messages table (separate from the AI draft row,
                // which we deliberately leave at status=pending_approval/shadow so Carlos's
                // eventual approval still triggers the real reply as a follow-up).
                $convOrg = isset($drow['conv_org_id']) && $drow['conv_org_id'] !== null ? (int)$drow['conv_org_id'] : null;
                if ($convOrg !== null) {
                    $db->prepare(
                        "INSERT INTO messages (organization_id, conversation_id, sender, body, sent_at)
                         VALUES (?, ?, 'me', ?, NOW())"
                    )->execute([$convOrg, $convId, $body]);
                } else {
                    $db->prepare(
                        "INSERT INTO messages (conversation_id, sender, body, sent_at)
                         VALUES (?, 'me', ?, NOW())"
                    )->execute([$convId, $body]);
                }
                $db->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?")->execute([$convId]);

                // Mark the draft `source='holding'` for audit traceability — does NOT mark sent.
                // This preserves the AI draft so a later approval still fires the real reply.
                $db->prepare(
                    "UPDATE conversation_drafts SET source='holding', updated_at=NOW() WHERE id = ?"
                )->execute([$draftId]);

                $stepResult = 'holding_sent';
            } catch (Throwable $e) {
                error_log('[wf_crm] holding_reply_if_no_approval exception run=' . $runId . ': ' . $e->getMessage());
                $stepResult = 'holding_exception';
            }
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

    // $advanceIdx = false means "re-enter the same step on the next pending tick".
    // Used by holding_reply_if_no_approval which is a wait+resume self-pair.
    $nextIdx = $advanceIdx ? ($idx + 1) : $idx;
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
    $tagToRemove = $tag;
    $tags = array_values(array_filter($tags, function ($t) use ($tagToRemove) { return $t !== $tagToRemove; }));
    $db->prepare("UPDATE contacts SET tags=?, updated_at=NOW() WHERE id=?")
       ->execute([implode(',', $tags), $contactId]);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Auto-reply helpers (PR 3)
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Load auto_reply_config for a given org. Cached per-request, per-org. Returns the
 * defaults when the row is missing so the engine never blocks on a fresh DB.
 */
function wf_crm_load_auto_reply_config(PDO $db, ?int $orgId): array {
    static $cache = [];
    $key = (string)($orgId ?? '0');
    if (isset($cache[$key])) return $cache[$key];

    $defaults = [
        'organization_id'      => $orgId,
        'shadow_mode_enabled'  => 1,
        'confidence_threshold' => 0.85,
        'allowlist_topics'     => null,
        'denylist_topics'      => null,
        'holding_reply_en'     => 'Got your message — Carlos will respond within the hour.',
        'holding_reply_es'     => 'Recibido — Carlos responde en la próxima hora.',
        'failsafe_minutes'     => 4,
    ];

    if ($orgId === null) { $cache[$key] = $defaults; return $defaults; }

    try {
        // Defensive lazy create — engine must work before migrate ran.
        $db->exec(
            "CREATE TABLE IF NOT EXISTS auto_reply_config (
              organization_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
              shadow_mode_enabled TINYINT(1) NOT NULL DEFAULT 1,
              confidence_threshold DECIMAL(4,3) NOT NULL DEFAULT 0.850,
              allowlist_topics TEXT NULL,
              denylist_topics TEXT NULL,
              holding_reply_en TEXT NULL,
              holding_reply_es TEXT NULL,
              failsafe_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 4,
              scratch_json TEXT NULL,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $stmt = $db->prepare(
            "SELECT organization_id, shadow_mode_enabled, confidence_threshold,
                    allowlist_topics, denylist_topics,
                    holding_reply_en, holding_reply_es, failsafe_minutes
               FROM auto_reply_config
              WHERE organization_id = ? LIMIT 1"
        );
        $stmt->execute([$orgId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $merged = array_merge($defaults, $row);
            $cache[$key] = $merged;
            return $merged;
        }
    } catch (Throwable $e) {
        error_log('[wf_crm] auto_reply_config load failed: ' . $e->getMessage());
    }
    $cache[$key] = $defaults;
    return $defaults;
}

/**
 * Hydrate a draft row with its conversation + contact for outbound dispatch.
 * Single LEFT JOIN inside webmed6_crm — no cross-DB call.
 */
function wf_crm_load_draft_with_conv(PDO $db, int $draftId): ?array {
    $stmt = $db->prepare(
        "SELECT cd.id, cd.conversation_id, cd.channel, cd.draft_body, cd.draft_subject,
                cd.audit_blob,
                conv.organization_id AS conv_org_id,
                c.phone AS contact_phone, c.email AS contact_email
           FROM conversation_drafts cd
           LEFT JOIN conversations conv ON conv.id = cd.conversation_id
           LEFT JOIN contacts c ON c.id = conv.contact_id
          WHERE cd.id = ? LIMIT 1"
    );
    $stmt->execute([$draftId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * Merge extra keys into an existing audit_blob JSON string. Returns the
 * re-encoded JSON string. Resilient to missing/corrupt input.
 */
function wf_crm_audit_merge(?string $existingJson, array $extra): string {
    $base = [];
    if ($existingJson) {
        $decoded = json_decode($existingJson, true);
        if (is_array($decoded)) $base = $decoded;
    }
    foreach ($extra as $k => $v) $base[$k] = $v;
    return json_encode($base, JSON_UNESCAPED_UNICODE);
}

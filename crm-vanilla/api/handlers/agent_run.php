<?php
/**
 * NetWebMedia OS — Agent run orchestrator  (Phase 4)
 *
 *   GET  /crm/api/?r=agent_run&action=catalog   -> roster + skills + budget usage
 *   GET  /crm/api/?r=agent_run&action=list       -> recent runs for this org
 *   GET  /crm/api/?r=agent_run&id=N              -> one run (org-scoped)
 *   POST /crm/api/?r=agent_run  {agent,skill,input,trigger}  -> dispatch a skill
 *
 * Every run is org-scoped via org_where()/require_org_access() and logged to
 * agent_runs (the per-org cost ledger the monthly token budget enforces against).
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/agent_dispatcher.php';

$db = getDB();
$u  = guard_user();
if (!$u || empty($u['id'])) jsonError('Authentication required', 401);

$orgId = current_org_id();
if ($orgId === null) jsonError('No organization resolved for this session', 400);
require_org_access($orgId, 'member');

// Load org OS state once.
$stmt = $db->prepare('SELECT os_enabled, os_plan, billing_status, agent_token_budget_monthly, os_agents_enabled
                        FROM organizations WHERE id = ? LIMIT 1');
$stmt->execute([$orgId]);
$org = $stmt->fetch() ?: [];
$isMaster   = ($orgId === ORG_MASTER_ID);
$osEnabled  = $isMaster ? 1 : (int)($org['os_enabled'] ?? 0);
$budget     = $isMaster ? 0 : (int)($org['agent_token_budget_monthly'] ?? 0); // 0 = unlimited
$enabledSet = os_org_enabled_agents($org['os_agents_enabled'] ?? null);

/** Resolve which agent slugs are enabled for this org (JSON column or default-on set). */
function os_org_enabled_agents($json): array {
    if ($json) {
        $arr = json_decode($json, true);
        if (is_array($arr) && $arr) return array_values(array_filter($arr, 'is_string'));
    }
    return os_default_on_agents();
}

// -------------------------------------------------------------------- GET ----
if ($method === 'GET') {
    $action = $_GET['action'] ?? ($id ? 'get' : 'catalog');

    if ($action === 'catalog') {
        $catalog = os_agent_catalog();
        $used = os_agent_tokens_used_this_month($db, $orgId);
        $usedCost = (int)$db->query("SELECT COALESCE(SUM(cost_usd_cents),0) FROM agent_runs
            WHERE organization_id = " . (int)$orgId . " AND created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();
        $agents = [];
        foreach ($catalog as $slug => $a) {
            $skills = [];
            foreach ($a['skills'] as $sk => $sv) $skills[] = ['slug' => $sk, 'label' => $sv['label']];
            $agents[] = [
                'slug'       => $slug,
                'label'      => $a['label'],
                'tier'       => $a['tier'],
                'default_on' => (bool)$a['default_on'],
                'enabled'    => in_array($slug, $enabledSet, true),
                'skills'     => $skills,
            ];
        }
        jsonResponse([
            'agents'   => $agents,
            'os_enabled' => (bool)$osEnabled,
            'configured' => (defined('ANTHROPIC_API_KEY') && ANTHROPIC_API_KEY !== ''),
            'budget'   => [
                'monthly_tokens'  => $budget,
                'used_tokens'     => $used,
                'used_usd_cents'  => $usedCost,
                'unlimited'       => $budget === 0,
            ],
        ]);
    }

    if ($action === 'list') {
        [$ow, $op] = org_where();
        $stmt = $db->prepare("SELECT id, agent_slug, skill_slug, model, status, cost_usd_cents,
                                     input_tokens, output_tokens, created_at
                                FROM agent_runs WHERE $ow ORDER BY id DESC LIMIT 30");
        $stmt->execute($op);
        jsonResponse(['runs' => $stmt->fetchAll() ?: []]);
    }

    // single run
    if (!$id) jsonError('Missing run id', 400);
    [$ow, $op] = org_where();
    $stmt = $db->prepare("SELECT * FROM agent_runs WHERE id = ? AND $ow LIMIT 1");
    $stmt->execute(array_merge([$id], $op));
    $run = $stmt->fetch();
    if (!$run) jsonError('Run not found', 404);
    jsonResponse(['run' => $run]);
}

// ------------------------------------------------------------------- POST ----
if ($method !== 'POST') jsonError('Use GET or POST', 405);

if (!$osEnabled) jsonError('NetWebMedia OS is not enabled for this organization', 402);

require_org_access_for_write('member');

$in    = getInput();
$agent = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($in['agent'] ?? '')));
$skill = preg_replace('/[^a-z0-9_\-]/', '', strtolower((string)($in['skill'] ?? '')));
$input = $in['input'] ?? '';
$ALLOWED_TRIGGERS = ['command_bar', 'workflow', 'schedule', 'api'];
$trigger = in_array(($in['trigger'] ?? 'command_bar'), $ALLOWED_TRIGGERS, true) ? $in['trigger'] : 'command_bar';

$catalog = os_agent_catalog();
if (!isset($catalog[$agent]))                    jsonError('Unknown agent', 404);
if (!isset($catalog[$agent]['skills'][$skill]))  jsonError('Unknown skill for this agent', 404);
if (!in_array($agent, $enabledSet, true))        jsonError('That agent is not enabled for this organization', 403);

// Insert the run row (running).
$stmt = $db->prepare(
    'INSERT INTO agent_runs
        (organization_id, user_id, agent_slug, skill_slug, status, trigger, input_blob, started_at)
     VALUES (?, ?, ?, ?, "running", ?, ?, NOW())'
);
$stmt->execute([$orgId, (int)$u['id'], $agent, $skill, $trigger,
                mb_substr(is_array($input) ? json_encode($input) : (string)$input, 0, 16000)]);
$runId = (int)$db->lastInsertId();

try {
    $res = os_agent_dispatch($agent, $skill, $input, $orgId, $db, $budget);

    $upd = $db->prepare(
        'UPDATE agent_runs SET status="done", model=?, input_tokens=?, output_tokens=?,
            cost_usd_cents=?, output_blob=?, finished_at=NOW() WHERE id=?'
    );
    $upd->execute([$res['model'], $res['input_tokens'], $res['output_tokens'],
                   $res['cost_usd_cents'], mb_substr($res['output'], 0, 60000), $runId]);

    jsonResponse([
        'ok'             => true,
        'run_id'         => $runId,
        'status'         => 'done',
        'agent'          => $agent,
        'skill'          => $skill,
        'model'          => $res['model'],
        'output'         => $res['output'],
        'input_tokens'   => $res['input_tokens'],
        'output_tokens'  => $res['output_tokens'],
        'cost_usd_cents' => $res['cost_usd_cents'],
    ]);
} catch (AgentDispatchError $e) {
    $db->prepare('UPDATE agent_runs SET status="error", error=?, finished_at=NOW() WHERE id=?')
       ->execute([substr($e->getMessage(), 0, 500), $runId]);
    jsonResponse(['ok' => false, 'run_id' => $runId, 'reason' => $e->reason, 'error' => $e->getMessage()],
                 $e->httpCode);
}

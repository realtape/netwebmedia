<?php
/**
 * Lifecycle stages — subscriber → lead → MQL → SQL → opportunity → customer.
 *
 * Routes (all auth):
 *   GET  /api/lifecycle/stages        — canonical stage list + counts (funnel)
 *   GET  /api/lifecycle/contacts      — contacts in a given stage (filter ?stage=)
 *   POST /api/lifecycle/recompute     — recompute lifecycle_stage for ALL contacts based on score
 *   POST /api/lifecycle/transition    — move a single contact { contact_id, stage, reason? }
 *
 * Lifecycle is auto-derived from `score` on lead qualification, but can be manually
 * overridden via /transition. Manual moves don't get reset by /recompute.
 *
 * Default thresholds (overridable via lifecycle_config):
 *   score = 0           → subscriber
 *   1   ≤ score < 30    → lead
 *   30  ≤ score < 60    → mql
 *   60  ≤ score < 100   → sql
 *   100 ≤ score < 200   → opportunity
 *   score ≥ 200          → customer
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

const LIFECYCLE_STAGES = ['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'churned'];

function lifecycle_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS lifecycle_config (
    org_id   INT PRIMARY KEY,
    config   JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_lifecycle($parts, $method) {
  lifecycle_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'stages'     && $method === 'GET')  return lifecycle_stages($user);
  if ($sub === 'contacts'   && $method === 'GET')  return lifecycle_contacts($user);
  if ($sub === 'recompute'  && $method === 'POST') return lifecycle_recompute($user);
  if ($sub === 'transition' && $method === 'POST') return lifecycle_transition($user);

  err('Lifecycle route not found', 404);
}

function lifecycle_stages($user) {
  $rows = qAll("SELECT id, data FROM resources WHERE type='contact'");
  $by = array_fill_keys(LIFECYCLE_STAGES, 0);
  $unstaged = 0;
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    $stage = $d['lifecycle_stage'] ?? lifecycle_derive_stage($d['score'] ?? 0);
    if (in_array($stage, LIFECYCLE_STAGES, true)) $by[$stage]++;
    else $unstaged++;
  }
  $total = array_sum($by) + $unstaged;
  json_out([
    'ok'        => true,
    'stages'    => array_map(function ($k) use ($by, $total) {
      return [
        'stage'    => $k,
        'count'    => $by[$k],
        'pct'      => $total > 0 ? round($by[$k] * 100 / $total, 1) : 0,
      ];
    }, LIFECYCLE_STAGES),
    'unstaged'  => $unstaged,
    'total'     => $total,
  ]);
}

function lifecycle_contacts($user) {
  $stage = qparam('stage', '');
  if (!$stage || !in_array($stage, LIFECYCLE_STAGES, true)) {
    err('stage is required (one of: ' . implode(', ', LIFECYCLE_STAGES) . ')');
  }
  $limit = max(1, min(1000, (int)qparam('limit', 200)));

  $rows = qAll("SELECT id, data, created_at FROM resources WHERE type='contact'");
  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    $cur = $d['lifecycle_stage'] ?? lifecycle_derive_stage($d['score'] ?? 0);
    if ($cur !== $stage) continue;
    $out[] = [
      'id'    => (int)$r['id'],
      'name'  => $d['name']  ?? '',
      'email' => $d['email'] ?? '',
      'phone' => $d['phone'] ?? '',
      'company'=>$d['company'] ?? '',
      'score' => (int)($d['score'] ?? 0),
      'stage' => $cur,
      'created_at' => $r['created_at'],
    ];
    if (count($out) >= $limit) break;
  }
  json_out(['contacts' => $out, 'count' => count($out), 'stage' => $stage]);
}

function lifecycle_recompute($user) {
  $rows = qAll("SELECT id, data FROM resources WHERE type='contact'");
  $updated = $skipped = 0;
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    if (!empty($d['lifecycle_manual'])) { $skipped++; continue; }
    $derived = lifecycle_derive_stage($d['score'] ?? 0);
    if (($d['lifecycle_stage'] ?? null) === $derived) continue;
    $d['lifecycle_stage'] = $derived;
    qExec(
      "UPDATE resources SET data = ?, updated_at = NOW() WHERE id = ?",
      [json_encode($d), (int)$r['id']]
    );
    $updated++;
  }
  if (function_exists('log_activity')) {
    log_activity('lifecycle.recomputed', null, null, ['updated' => $updated, 'skipped' => $skipped]);
  }
  json_out(['ok' => true, 'updated' => $updated, 'skipped_manual' => $skipped, 'total' => count($rows)]);
}

function lifecycle_transition($user) {
  $b = body();
  $contactId = (int)($b['contact_id'] ?? 0);
  $stage     = (string)($b['stage']    ?? '');
  $reason    = (string)($b['reason']   ?? '');
  if (!$contactId) err('contact_id is required');
  if (!in_array($stage, LIFECYCLE_STAGES, true)) err('Invalid stage');

  $row = qOne("SELECT data FROM resources WHERE id = ? AND type = 'contact'", [$contactId]);
  if (!$row) err('Contact not found', 404);

  $d = json_decode($row['data'] ?? '{}', true) ?: [];
  $previous = $d['lifecycle_stage'] ?? null;
  $d['lifecycle_stage']  = $stage;
  $d['lifecycle_manual'] = 1;
  $d['lifecycle_changed_at'] = date('Y-m-d H:i:s');

  qExec(
    "UPDATE resources SET data = ?, updated_at = NOW() WHERE id = ?",
    [json_encode($d), $contactId]
  );

  if (function_exists('log_activity')) {
    log_activity('lifecycle.transition', 'contact', $contactId, [
      'from' => $previous, 'to' => $stage, 'reason' => $reason,
    ]);
  }
  json_out(['ok' => true, 'from' => $previous, 'to' => $stage]);
}

/**
 * Derive lifecycle stage from a score using built-in thresholds.
 * Available globally so the leads scoring engine can call it on qualify.
 */
function lifecycle_derive_stage($score) {
  $s = (int)$score;
  if ($s <= 0)   return 'subscriber';
  if ($s < 30)   return 'lead';
  if ($s < 60)   return 'mql';
  if ($s < 100)  return 'sql';
  if ($s < 200)  return 'opportunity';
  return 'customer';
}

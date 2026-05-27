<?php
/**
 * Lead import, qualification, routing, and sequence enrollment.
 *
 * Routes:
 * POST   /api/leads/import/csv          — import prospects from CSV file
 * POST   /api/leads/qualify             — score & qualify pending leads (uses scoring rules)
 * POST   /api/leads/assign              — assign qualified leads to team
 * POST   /api/leads/enroll-sequences    — enroll in nurture sequences
 * GET    /api/leads/status              — pipeline stats
 * GET    /api/leads/scoring-rules       — list scoring rules (configurable engine)
 * POST   /api/leads/scoring-rules       — create rule
 * PUT    /api/leads/scoring-rules/:id   — update rule
 * DELETE /api/leads/scoring-rules/:id   — delete rule
 * POST   /api/leads/score-preview       — preview score for sample contact data
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/email-sequences.php';

function leads_ensure_scoring_schema() {
  static $done = false;
  if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    name        VARCHAR(150) NOT NULL,
    field       VARCHAR(80) NOT NULL,
    operator    VARCHAR(20) NOT NULL DEFAULT 'present',
    value       VARCHAR(500) DEFAULT NULL,
    points      INT NOT NULL DEFAULT 0,
    enabled     TINYINT(1) NOT NULL DEFAULT 1,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org_enabled (org_id, enabled)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS lead_scoring_config (
    org_id      INT PRIMARY KEY,
    threshold   INT NOT NULL DEFAULT 30,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_leads($parts, $method) {
  $sub = $parts[0] ?? null;

  if ($sub === 'import' && ($parts[1] ?? null) === 'csv' && $method === 'POST') {
    return leads_import_csv();
  }

  if ($sub === 'qualify' && $method === 'POST') {
    return leads_qualify();
  }

  if ($sub === 'assign' && $method === 'POST') {
    return leads_assign();
  }

  if ($sub === 'enroll-sequences' && $method === 'POST') {
    return leads_enroll_sequences();
  }

  if ($sub === 'status' && $method === 'GET') {
    return leads_status();
  }

  if ($sub === 'scoring-rules') {
    leads_ensure_scoring_schema();
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    if ($id) {
      if ($method === 'PUT')    return leads_scoring_rule_update($id);
      if ($method === 'DELETE') return leads_scoring_rule_delete($id);
      err('Method not allowed', 405);
    }
    if ($method === 'GET')  return leads_scoring_rules_list();
    if ($method === 'POST') return leads_scoring_rule_create();
    err('Method not allowed', 405);
  }

  if ($sub === 'score-preview' && $method === 'POST') {
    leads_ensure_scoring_schema();
    return leads_score_preview();
  }

  err('Leads route not found', 404);
}

/**
 * Import prospects from CSV. Expects multipart form with 'file' field.
 * CSV columns: name,email,phone,company,role,niche_key,city,state,website,notes
 */
function leads_import_csv() {
  if (!isset($_FILES['file'])) {
    return err('No file uploaded', 400);
  }

  $tmp = $_FILES['file']['tmp_name'];
  $name = $_FILES['file']['name'];

  if (!is_uploaded_file($tmp)) {
    return err('Invalid upload', 400);
  }

  $imported = $failed = 0;
  $errors = [];

  if (($handle = fopen($tmp, 'r')) === false) {
    return err('Cannot read file', 400);
  }

  $header = null;
  $row_num = 0;

  while (($row = fgetcsv($handle)) !== false) {
    $row_num++;

    // Skip header
    if ($row_num === 1) {
      $header = $row;
      continue;
    }

    // Parse row
    $data = [];
    foreach ($header as $i => $col) {
      $data[$col] = $row[$i] ?? '';
    }

    $email = strtolower(trim($data['email'] ?? ''));
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $errors[] = "Row $row_num: invalid email";
      $failed++;
      continue;
    }

    // Check if already exists
    $exists = qOne(
      "SELECT id FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email')=?",
      [$email]
    );

    if ($exists) {
      // Update existing
      $contact_data = qOne(
        "SELECT data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email')=?",
        [$email]
      );
      $existing = json_decode($contact_data['data'] ?? '{}', true) ?: [];

      $merged = array_merge($existing, [
        'name'             => $data['name'] ?? $existing['name'] ?? '',
        'email'            => $email,
        'phone'            => $data['phone'] ?? $existing['phone'] ?? '',
        'company'          => $data['company'] ?? $existing['company'] ?? '',
        'role'             => $data['role'] ?? $existing['role'] ?? '',
        'niche_key'        => $data['niche_key'] ?? $existing['niche_key'] ?? '',
        'city'             => $data['city'] ?? $existing['city'] ?? '',
        'state'            => $data['state'] ?? $existing['state'] ?? '',
        'website'          => $data['website'] ?? $existing['website'] ?? '',
        'notes'            => $data['notes'] ?? $existing['notes'] ?? '',
        'status'           => $existing['status'] ?? 'raw',
        'imported_at'      => $existing['imported_at'] ?? date('Y-m-d H:i:s'),
        'updated_at'       => date('Y-m-d H:i:s')
      ]);

      qExec(
        "UPDATE resources SET data=?, updated_at=NOW() WHERE type='contact' AND JSON_EXTRACT(data, '$.email')=?",
        [json_encode($merged), $email]
      );
    } else {
      // Insert new
      $contact_data = [
        'name'        => $data['name'] ?? '',
        'email'       => $email,
        'phone'       => $data['phone'] ?? '',
        'company'     => $data['company'] ?? '',
        'role'        => $data['role'] ?? '',
        'niche_key'   => $data['niche_key'] ?? '',
        'city'        => $data['city'] ?? '',
        'state'       => $data['state'] ?? '',
        'website'     => $data['website'] ?? '',
        'notes'       => $data['notes'] ?? '',
        'status'      => 'raw',
        'imported_at' => date('Y-m-d H:i:s')
      ];

      qExec(
        "INSERT INTO resources (type, data, created_at) VALUES ('contact', ?, NOW())",
        [json_encode($contact_data)]
      );
    }

    $imported++;
  }

  fclose($handle);

  json_out([
    'ok' => true,
    'file' => $name,
    'imported' => $imported,
    'failed' => $failed,
    'errors' => array_slice($errors, 0, 10) // Return first 10 errors
  ]);
}

/**
 * Score & qualify pending leads (status='raw' → status='qualified'|'disqualified').
 * Uses configurable rules from lead_scoring_rules; falls back to built-in defaults
 * when no rules are configured.
 */
function leads_qualify() {
  leads_ensure_scoring_schema();
  $batch = max(1, min(100, (int)($_POST['batch'] ?? 25)));

  $rules = leads_load_rules();
  $threshold = leads_load_threshold();

  $leads = qAll(
    "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='raw' LIMIT $batch"
  );

  $qualified = $disqualified = 0;
  $applied_rules = []; // count usage for telemetry

  foreach ($leads as $lead) {
    $data = json_decode($lead['data'] ?? '{}', true) ?: [];

    $eval = leads_score_contact($data, $rules);
    $score = $eval['score'];
    foreach ($eval['matched'] as $name) {
      $applied_rules[$name] = ($applied_rules[$name] ?? 0) + 1;
    }

    $status = $score >= $threshold ? 'qualified' : 'disqualified';
    $data['status'] = $status;
    $data['score'] = $score;
    $data['score_breakdown'] = $eval['breakdown'];
    $data['qualified_at'] = date('Y-m-d H:i:s');

    // Auto-derive lifecycle stage from score, but only if the contact hasn't been
    // manually transitioned (preserves human override).
    if (empty($data['lifecycle_manual'])) {
      if (!function_exists('lifecycle_derive_stage')) {
        @require_once __DIR__ . '/lifecycle.php';
      }
      if (function_exists('lifecycle_derive_stage')) {
        $data['lifecycle_stage'] = lifecycle_derive_stage($score);
      }
    }

    qExec(
      "UPDATE resources SET data=?, updated_at=NOW() WHERE id=?",
      [json_encode($data), $lead['id']]
    );

    if (function_exists('log_activity')) {
      log_activity($status === 'qualified' ? 'lead.qualified' : 'lead.disqualified',
                   'contact', (int)$lead['id'],
                   ['score' => $score, 'threshold' => $threshold]);
    }

    if ($status === 'qualified') $qualified++;
    else $disqualified++;
  }

  json_out([
    'ok' => true,
    'qualified' => $qualified,
    'disqualified' => $disqualified,
    'processed' => $qualified + $disqualified,
    'threshold' => $threshold,
    'rules_applied' => $applied_rules,
    'engine' => $rules ? 'configured' : 'defaults',
  ]);
}

/* ─────────────  Scoring rule engine  ───────────── */

function leads_default_rules() {
  return [
    ['name' => 'Valid email',     'field' => 'email',     'operator' => 'email',   'value' => null, 'points' => 10],
    ['name' => 'Phone present',   'field' => 'phone',     'operator' => 'present', 'value' => null, 'points' => 5],
    ['name' => 'Website present', 'field' => 'website',   'operator' => 'present', 'value' => null, 'points' => 10],
    ['name' => 'Niche identified','field' => 'niche_key', 'operator' => 'present', 'value' => null, 'points' => 15],
  ];
}

function leads_load_rules() {
  try {
    $rows = qAll("SELECT * FROM lead_scoring_rules WHERE enabled=1 ORDER BY sort_order ASC, id ASC");
    if ($rows) return $rows;
  } catch (Exception $e) {}
  return leads_default_rules();
}

function leads_load_threshold() {
  try {
    $row = qOne("SELECT threshold FROM lead_scoring_config LIMIT 1");
    if ($row && isset($row['threshold'])) return (int)$row['threshold'];
  } catch (Exception $e) {}
  return 30;
}

/**
 * Score a single contact using rules. Returns ['score', 'matched' (rule names), 'breakdown'].
 * Operators:
 *   present   — non-empty
 *   absent    — empty/missing
 *   email     — passes FILTER_VALIDATE_EMAIL
 *   equals    — case-insensitive equality
 *   contains  — substring match (CI)
 *   starts    — prefix match (CI)
 *   in        — value in comma-separated list (CI)
 *   matches   — regex (PCRE)
 *   gt / gte / lt / lte — numeric compare
 */
function leads_score_contact($data, $rules) {
  $score = 0;
  $matched = [];
  $breakdown = [];

  foreach ($rules as $r) {
    $field = $r['field'] ?? '';
    $op    = strtolower($r['operator'] ?? 'present');
    $val   = $r['value'] ?? null;
    $pts   = (int)($r['points'] ?? 0);
    $name  = $r['name'] ?? "$field $op";

    $actual = $data[$field] ?? null;
    if ($actual === '') $actual = null;
    $hit = false;

    switch ($op) {
      case 'present':  $hit = $actual !== null && $actual !== ''; break;
      case 'absent':   $hit = $actual === null || $actual === ''; break;
      case 'email':    $hit = is_string($actual) && filter_var($actual, FILTER_VALIDATE_EMAIL) !== false; break;
      case 'equals':   $hit = $actual !== null && strcasecmp((string)$actual, (string)$val) === 0; break;
      case 'contains': $hit = $actual !== null && stripos((string)$actual, (string)$val) !== false; break;
      case 'starts':   $hit = $actual !== null && stripos((string)$actual, (string)$val) === 0; break;
      case 'in':
        $list = array_map('strtolower', array_map('trim', explode(',', (string)$val)));
        $hit = $actual !== null && in_array(strtolower((string)$actual), $list, true);
        break;
      case 'matches':
        $hit = $actual !== null && @preg_match('#' . str_replace('#', '\#', (string)$val) . '#i', (string)$actual) === 1;
        break;
      case 'gt':  $hit = is_numeric($actual) && (float)$actual >  (float)$val; break;
      case 'gte': $hit = is_numeric($actual) && (float)$actual >= (float)$val; break;
      case 'lt':  $hit = is_numeric($actual) && (float)$actual <  (float)$val; break;
      case 'lte': $hit = is_numeric($actual) && (float)$actual <= (float)$val; break;
      default:    $hit = false;
    }

    if ($hit) {
      $score += $pts;
      $matched[] = $name;
      $breakdown[] = ['rule' => $name, 'field' => $field, 'op' => $op, 'points' => $pts];
    }
  }

  return ['score' => $score, 'matched' => $matched, 'breakdown' => $breakdown];
}

function leads_scoring_rules_list() {
  $rules = qAll("SELECT * FROM lead_scoring_rules ORDER BY sort_order ASC, id ASC");
  foreach ($rules as &$r) {
    $r['id']         = (int)$r['id'];
    $r['org_id']     = (int)$r['org_id'];
    $r['points']     = (int)$r['points'];
    $r['enabled']    = (int)$r['enabled'];
    $r['sort_order'] = (int)$r['sort_order'];
  }
  $threshold = leads_load_threshold();
  $defaults  = $rules ? null : leads_default_rules();
  json_out([
    'rules'     => $rules,
    'threshold' => $threshold,
    'using_defaults' => empty($rules),
    'defaults'  => $defaults,
  ]);
}

function leads_scoring_rule_create() {
  $b = body();
  if (empty($b['name']) || empty($b['field'])) err('name and field are required');
  $row = [
    1,
    trim($b['name']),
    trim($b['field']),
    strtolower($b['operator'] ?? 'present'),
    $b['value'] ?? null,
    (int)($b['points'] ?? 0),
    isset($b['enabled']) ? (int)!!$b['enabled'] : 1,
    (int)($b['sort_order'] ?? 0),
  ];
  qExec(
    "INSERT INTO lead_scoring_rules (org_id,name,field,operator,value,points,enabled,sort_order)
     VALUES (?,?,?,?,?,?,?,?)",
    $row
  );
  $id = lastId();
  if (isset($b['threshold'])) {
    leads_set_threshold((int)$b['threshold']);
  }
  json_out(['ok' => true, 'id' => $id], 201);
}

function leads_scoring_rule_update($id) {
  $b = body();
  $sets = []; $params = [];
  foreach (['name','field','operator','value','points','enabled','sort_order'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $sets[] = "$k = ?";
    $params[] = in_array($k, ['points','enabled','sort_order']) ? (int)$b[$k] : $b[$k];
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE lead_scoring_rules SET " . implode(', ', $sets) . " WHERE id = ?", $params);

  if (isset($b['threshold'])) leads_set_threshold((int)$b['threshold']);
  json_out(['ok' => true]);
}

function leads_scoring_rule_delete($id) {
  qExec("DELETE FROM lead_scoring_rules WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function leads_set_threshold($t) {
  qExec(
    "INSERT INTO lead_scoring_config (org_id, threshold) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE threshold = VALUES(threshold)",
    [$t]
  );
}

function leads_score_preview() {
  $b = body();
  $contact = $b['contact'] ?? $b;
  $rules = leads_load_rules();
  $threshold = leads_load_threshold();
  $eval = leads_score_contact($contact, $rules);
  json_out([
    'ok'        => true,
    'score'     => $eval['score'],
    'matched'   => $eval['matched'],
    'breakdown' => $eval['breakdown'],
    'threshold' => $threshold,
    'verdict'   => $eval['score'] >= $threshold ? 'qualified' : 'disqualified',
  ]);
}

/**
 * Assign qualified leads to team members (round-robin or least-loaded).
 */
function leads_assign() {
  $strategy = $_POST['strategy'] ?? 'round_robin'; // or 'least_loaded'

  $leads = qAll(
    "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='qualified' AND JSON_EXTRACT(data, '$.assigned_to') IS NULL LIMIT 50"
  );

  if (!$leads) {
    json_out(['ok' => true, 'assigned' => 0]);
  }

  // Get team members (users with role=sales_rep or similar)
  $team = qAll(
    "SELECT id, data FROM resources WHERE type='user' AND JSON_EXTRACT(data, '$.role') IN ('sales_rep', 'sales_manager') ORDER BY id ASC"
  );

  if (!$team) {
    return err('No team members configured', 400);
  }

  $assigned = 0;
  $team_idx = 0;

  foreach ($leads as $lead) {
    $data = json_decode($lead['data'] ?? '{}', true) ?: [];

    // Round-robin or least-loaded assignment
    if ($strategy === 'least_loaded') {
      // Count assigned leads per team member
      $loads = [];
      foreach ($team as $member) {
        $count = qOne(
          "SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.assigned_to')=?",
          [$member['id']]
        );
        $loads[$member['id']] = (int)($count['c'] ?? 0);
      }
      $team_id = array_keys($loads, min($loads))[0];
    } else {
      $team_id = $team[$team_idx % count($team)]['id'];
      $team_idx++;
    }

    $data['assigned_to'] = $team_id;
    $data['assigned_at'] = date('Y-m-d H:i:s');

    qExec(
      "UPDATE resources SET data=?, updated_at=NOW() WHERE id=?",
      [json_encode($data), $lead['id']]
    );

    $assigned++;
  }

  json_out(['ok' => true, 'assigned' => $assigned]);
}

/**
 * Enroll qualified+assigned leads in nurture sequences.
 */
function leads_enroll_sequences() {
  $sequence_id = $_POST['sequence'] ?? 'welcome';
  $batch = max(1, min(100, (int)($_POST['batch'] ?? 25)));

  $leads = qAll(
    "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='qualified' AND JSON_EXTRACT(data, '$.assigned_to') IS NOT NULL AND JSON_EXTRACT(data, '$.enrolled_in') IS NULL LIMIT $batch"
  );

  $enrolled = 0;

  foreach ($leads as $lead) {
    $data = json_decode($lead['data'] ?? '{}', true) ?: [];

    $context = [
      'email'      => $data['email'] ?? '',
      'name'       => $data['name'] ?? '',
      'first_name' => explode(' ', $data['name'] ?? '')[0] ?? '',
      'company'    => $data['company'] ?? '',
      'website'    => $data['website'] ?? '',
      'niche'      => $data['niche_key'] ?? '',
      'lang'       => 'en'
    ];

    $result = seq_enroll($lead['id'], $sequence_id, $context);

    if ($result['enrolled'] > 0) {
      $data['enrolled_in'] = $sequence_id;
      $data['enrolled_at'] = date('Y-m-d H:i:s');

      qExec(
        "UPDATE resources SET data=?, updated_at=NOW() WHERE id=?",
        [json_encode($data), $lead['id']]
      );

      $enrolled++;
    }
  }

  json_out(['ok' => true, 'enrolled' => $enrolled]);
}

/**
 * Pipeline status: counts at each stage.
 */
function leads_status() {
  $raw = (int)(qOne("SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='raw'")['c'] ?? 0);
  $qualified = (int)(qOne("SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='qualified' AND JSON_EXTRACT(data, '$.assigned_to') IS NULL")['c'] ?? 0);
  $assigned = (int)(qOne("SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.status')='qualified' AND JSON_EXTRACT(data, '$.assigned_to') IS NOT NULL AND JSON_EXTRACT(data, '$.enrolled_in') IS NULL")['c'] ?? 0);
  $enrolled = (int)(qOne("SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.enrolled_in') IS NOT NULL")['c'] ?? 0);

  json_out([
    'ok' => true,
    'pipeline' => [
      'raw' => $raw,
      'qualified' => $qualified,
      'assigned' => $assigned,
      'enrolled' => $enrolled,
      'total' => $raw + $qualified + $assigned + $enrolled
    ]
  ]);
}

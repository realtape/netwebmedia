<?php
/**
 * Snapshots — clone an org's configuration (workflows, scoring rules, pipeline stages,
 * booking links, SMS campaign templates, segments) for replicating client setups.
 *
 * Routes (all auth):
 *   GET    /api/snapshots                — list saved snapshots
 *   POST   /api/snapshots                — create from current org config
 *                                            { name, description, includes? }
 *                                            includes = string[] of section names; default: all
 *   GET    /api/snapshots/{id}           — view snapshot payload
 *   POST   /api/snapshots/{id}/apply     — clone INTO current org
 *                                            { sections? = subset to apply, overwrite? = bool }
 *   DELETE /api/snapshots/{id}           — delete snapshot
 *   GET    /api/snapshots/{id}/export    — download as JSON file (Content-Disposition: attachment)
 *   POST   /api/snapshots/import         — import from posted JSON { snapshot: {...} }
 *
 * Sections currently supported (auto-skipped if a section's source table doesn't exist):
 *   - lead_scoring_rules + threshold (lead_scoring_config)
 *   - pipeline_stages
 *   - booking_links
 *   - sms_campaigns (drafts only — body + audience filter)
 *   - segments
 *   - email_templates (sequences)
 *
 * Workflows are not currently included because workflows.php uses a runtime resources
 * row pattern that's harder to deep-copy safely without manual review. Roadmap.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

const SNAPSHOT_SECTIONS = [
  'lead_scoring_rules', 'pipeline_stages', 'booking_links',
  'sms_campaigns', 'segments', 'email_templates',
];

function snapshots_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS snapshots (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    org_id       INT NOT NULL DEFAULT 1,
    user_id      INT DEFAULT NULL,
    name         VARCHAR(150) NOT NULL,
    description  TEXT DEFAULT NULL,
    payload      LONGTEXT NOT NULL,
    sections     JSON DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_org   (org_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_snapshots($parts, $method) {
  snapshots_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'import' && $method === 'POST') return snapshots_import($user);

  $id = $sub !== null && ctype_digit((string)$sub) ? (int)$sub : null;
  if ($id) {
    $action = $parts[1] ?? null;
    if ($action === 'apply'  && $method === 'POST') return snapshots_apply($id, $user);
    if ($action === 'export' && $method === 'GET')  return snapshots_export($id, $user);
    if (!$action) {
      if ($method === 'GET')    return snapshots_get($id, $user);
      if ($method === 'DELETE') return snapshots_delete($id, $user);
    }
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return snapshots_list($user);
  if ($method === 'POST') return snapshots_create($user);
  err('Method not allowed', 405);
}

function snapshots_list($user) {
  $rows = qAll(
    "SELECT id, name, description, sections, created_at FROM snapshots WHERE org_id = ? ORDER BY id DESC",
    [(int)($user['org_id'] ?? 1)]
  );
  foreach ($rows as &$r) {
    $r['id']       = (int)$r['id'];
    $r['sections'] = $r['sections'] ? json_decode($r['sections'], true) : null;
  }
  json_out(['snapshots' => $rows]);
}

function snapshots_get($id, $user) {
  $row = qOne(
    "SELECT * FROM snapshots WHERE id = ? AND org_id = ?",
    [$id, (int)($user['org_id'] ?? 1)]
  );
  if (!$row) err('Snapshot not found', 404);
  $row['id']       = (int)$row['id'];
  $row['payload']  = json_decode($row['payload'], true);
  $row['sections'] = $row['sections'] ? json_decode($row['sections'], true) : null;
  json_out(['snapshot' => $row]);
}

function snapshots_create($user) {
  $b = body();
  if (empty($b['name'])) err('name is required');

  $includes = isset($b['includes']) && is_array($b['includes']) ? $b['includes'] : SNAPSHOT_SECTIONS;
  $payload  = snapshots_export_org_state($includes);

  qExec(
    "INSERT INTO snapshots (org_id, user_id, name, description, payload, sections) VALUES (?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      trim($b['name']),
      $b['description'] ?? null,
      json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
      json_encode(array_keys($payload)),
    ]
  );
  if (function_exists('log_activity')) {
    log_activity('snapshot.created', 'snapshot', lastId(), [
      'name' => $b['name'], 'sections' => array_keys($payload),
    ]);
  }
  json_out(['ok' => true, 'id' => lastId(), 'sections' => array_keys($payload)], 201);
}

function snapshots_apply($id, $user) {
  $b = body();
  $row = qOne("SELECT * FROM snapshots WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Snapshot not found', 404);
  $payload = json_decode($row['payload'], true);
  if (!is_array($payload)) err('Snapshot payload corrupted', 500);

  $sections = isset($b['sections']) && is_array($b['sections']) ? $b['sections'] : array_keys($payload);
  $overwrite = !empty($b['overwrite']);

  $applied = snapshots_apply_payload($payload, $sections, $overwrite);

  if (function_exists('log_activity')) {
    log_activity('snapshot.applied', 'snapshot', $id, [
      'sections' => $sections, 'overwrite' => $overwrite, 'inserted' => $applied,
    ]);
  }
  json_out(['ok' => true, 'inserted' => $applied]);
}

function snapshots_delete($id, $user) {
  $row = qOne("SELECT id FROM snapshots WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Snapshot not found', 404);
  qExec("DELETE FROM snapshots WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function snapshots_export($id, $user) {
  $row = qOne("SELECT * FROM snapshots WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Snapshot not found', 404);
  $filename = preg_replace('/[^a-z0-9\-]+/i', '-', $row['name']) . '-' . date('Ymd') . '.json';
  $payload = json_decode($row['payload'], true);
  $bundle = [
    'nwm_snapshot_version' => 1,
    'name'                 => $row['name'],
    'description'          => $row['description'],
    'exported_at'          => date('c'),
    'sections'             => array_keys($payload ?: []),
    'payload'              => $payload,
  ];
  header('Content-Type: application/json; charset=utf-8');
  header('Content-Disposition: attachment; filename="' . $filename . '"');
  echo json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function snapshots_import($user) {
  $b = body();
  $bundle = $b['snapshot'] ?? $b;
  if (!is_array($bundle) || empty($bundle['payload'])) err('Invalid snapshot bundle');

  $name = trim((string)($bundle['name'] ?? 'Imported snapshot'));
  $payload = $bundle['payload'];
  qExec(
    "INSERT INTO snapshots (org_id, user_id, name, description, payload, sections) VALUES (?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      $name,
      $bundle['description'] ?? null,
      json_encode($payload),
      json_encode(array_keys($payload)),
    ]
  );
  json_out(['ok' => true, 'id' => lastId(), 'name' => $name], 201);
}

/* ─────────────────────  EXPORT (read state)  ───────────────────── */

function snapshots_export_org_state($includes) {
  $payload = [];

  if (in_array('lead_scoring_rules', $includes, true)) {
    try {
      $rules = qAll("SELECT name, field, operator, value, points, enabled, sort_order FROM lead_scoring_rules ORDER BY sort_order, id");
      $cfg = qOne("SELECT threshold FROM lead_scoring_config LIMIT 1");
      $payload['lead_scoring_rules'] = [
        'rules'     => $rules,
        'threshold' => $cfg ? (int)$cfg['threshold'] : 30,
      ];
    } catch (Exception $e) {}
  }

  if (in_array('pipeline_stages', $includes, true)) {
    try {
      $stages = qAll("SELECT name, position, color FROM pipeline_stages ORDER BY position, id");
      if ($stages) $payload['pipeline_stages'] = $stages;
    } catch (Exception $e) {}
  }

  if (in_array('booking_links', $includes, true)) {
    try {
      $links = qAll(
        "SELECT slug, title, description, duration_min, buffer_min, advance_min_hours,
                advance_max_days, meeting_type, meeting_location, is_active
           FROM booking_links"
      );
      if ($links) $payload['booking_links'] = $links;
    } catch (Exception $e) {}
  }

  if (in_array('sms_campaigns', $includes, true)) {
    try {
      // Only export draft campaigns (treat as templates)
      $rows = qAll(
        "SELECT name, body, audience_filter FROM sms_campaigns WHERE status = 'draft'"
      );
      if ($rows) {
        foreach ($rows as &$r) $r['audience_filter'] = $r['audience_filter'] ? json_decode($r['audience_filter'], true) : null;
        $payload['sms_campaigns'] = $rows;
      }
    } catch (Exception $e) {}
  }

  if (in_array('segments', $includes, true)) {
    try {
      $rows = qAll("SELECT name, description, filter FROM segments");
      if ($rows) {
        foreach ($rows as &$r) $r['filter'] = $r['filter'] ? json_decode($r['filter'], true) : null;
        $payload['segments'] = $rows;
      }
    } catch (Exception $e) {}
  }

  if (in_array('email_templates', $includes, true)) {
    try {
      $rows = qAll("SELECT name, subject, body_html, niche FROM email_templates");
      if ($rows) $payload['email_templates'] = $rows;
    } catch (Exception $e) {}
  }

  return $payload;
}

/* ─────────────────────  APPLY (write state)  ───────────────────── */

function snapshots_apply_payload($payload, $sections, $overwrite) {
  $applied = [];

  if (in_array('lead_scoring_rules', $sections, true) && !empty($payload['lead_scoring_rules'])) {
    $applied['lead_scoring_rules'] = snapshots_apply_lead_scoring($payload['lead_scoring_rules'], $overwrite);
  }
  if (in_array('pipeline_stages', $sections, true) && !empty($payload['pipeline_stages'])) {
    $applied['pipeline_stages'] = snapshots_apply_pipeline_stages($payload['pipeline_stages'], $overwrite);
  }
  if (in_array('booking_links', $sections, true) && !empty($payload['booking_links'])) {
    $applied['booking_links'] = snapshots_apply_booking_links($payload['booking_links']);
  }
  if (in_array('sms_campaigns', $sections, true) && !empty($payload['sms_campaigns'])) {
    $applied['sms_campaigns'] = snapshots_apply_sms($payload['sms_campaigns']);
  }
  if (in_array('segments', $sections, true) && !empty($payload['segments'])) {
    $applied['segments'] = snapshots_apply_segments($payload['segments']);
  }
  if (in_array('email_templates', $sections, true) && !empty($payload['email_templates'])) {
    $applied['email_templates'] = snapshots_apply_email_templates($payload['email_templates']);
  }
  return $applied;
}

function snapshots_apply_lead_scoring($data, $overwrite) {
  try {
    if ($overwrite) {
      qExec("DELETE FROM lead_scoring_rules");
    }
    $count = 0;
    foreach (($data['rules'] ?? []) as $r) {
      qExec(
        "INSERT INTO lead_scoring_rules (org_id, name, field, operator, value, points, enabled, sort_order)
         VALUES (1,?,?,?,?,?,?,?)",
        [$r['name'], $r['field'], $r['operator'], $r['value'] ?? null,
         (int)$r['points'], (int)($r['enabled'] ?? 1), (int)($r['sort_order'] ?? 0)]
      );
      $count++;
    }
    if (isset($data['threshold'])) {
      qExec(
        "INSERT INTO lead_scoring_config (org_id, threshold) VALUES (1, ?)
         ON DUPLICATE KEY UPDATE threshold = VALUES(threshold)",
        [(int)$data['threshold']]
      );
    }
    return $count;
  } catch (Exception $e) { return 0; }
}

function snapshots_apply_pipeline_stages($stages, $overwrite) {
  try {
    if ($overwrite) qExec("DELETE FROM pipeline_stages");
    $count = 0;
    foreach ($stages as $s) {
      qExec(
        "INSERT INTO pipeline_stages (name, position, color) VALUES (?,?,?)",
        [$s['name'], (int)($s['position'] ?? 0), $s['color'] ?? null]
      );
      $count++;
    }
    return $count;
  } catch (Exception $e) { return 0; }
}

function snapshots_apply_booking_links($links) {
  $count = 0;
  foreach ($links as $l) {
    try {
      $slug = $l['slug'];
      // Avoid slug collision by suffixing if needed
      if (qOne("SELECT id FROM booking_links WHERE slug = ?", [$slug])) {
        $slug .= '-' . substr(bin2hex(random_bytes(3)), 0, 6);
      }
      qExec(
        "INSERT INTO booking_links
           (org_id, user_id, slug, title, description, duration_min, buffer_min,
            advance_min_hours, advance_max_days, meeting_type, meeting_location, is_active)
         VALUES (1, 1, ?,?,?,?,?,?,?,?,?,0)",
        [
          $slug, $l['title'], $l['description'] ?? null,
          (int)($l['duration_min'] ?? 30), (int)($l['buffer_min'] ?? 0),
          (int)($l['advance_min_hours'] ?? 4), (int)($l['advance_max_days'] ?? 30),
          $l['meeting_type'] ?? 'video', $l['meeting_location'] ?? null,
        ]
      );
      $count++;
    } catch (Exception $e) {}
  }
  return $count;
}

function snapshots_apply_sms($rows) {
  $count = 0;
  foreach ($rows as $r) {
    try {
      qExec(
        "INSERT INTO sms_campaigns (org_id, user_id, name, body, audience_filter, status)
         VALUES (1, 1, ?, ?, ?, 'draft')",
        [$r['name'], $r['body'], isset($r['audience_filter']) ? json_encode($r['audience_filter']) : null]
      );
      $count++;
    } catch (Exception $e) {}
  }
  return $count;
}

function snapshots_apply_segments($rows) {
  $count = 0;
  foreach ($rows as $r) {
    try {
      qExec(
        "INSERT INTO segments (org_id, user_id, name, description, filter) VALUES (1, 1, ?, ?, ?)",
        [$r['name'], $r['description'] ?? null, isset($r['filter']) ? json_encode($r['filter']) : null]
      );
      $count++;
    } catch (Exception $e) {}
  }
  return $count;
}

function snapshots_apply_email_templates($rows) {
  $count = 0;
  foreach ($rows as $r) {
    try {
      qExec(
        "INSERT INTO email_templates (name, subject, body_html, niche) VALUES (?,?,?,?)",
        [$r['name'], $r['subject'], $r['body_html'], $r['niche'] ?? null]
      );
      $count++;
    } catch (Exception $e) {}
  }
  return $count;
}

<?php
/**
 * Forms — drag-drop forms with progressive profiling.
 *
 * Progressive profiling: when a returning visitor (identified by a
 * `nwm_visitor` cookie or by submitted email) hits a form, the public render
 * endpoint hides fields whose value is already known on their contact record
 * and substitutes the next unanswered field from a configured "queue" list.
 * This means a 5-field form can be split across 5 visits, capturing one new
 * data point each time without re-asking what's already on file.
 *
 * Routes:
 *   ADMIN (auth):
 *     GET    /api/forms                       — list
 *     POST   /api/forms                       — create
 *     GET    /api/forms/{id}                  — get + recent submissions count
 *     PUT    /api/forms/{id}                  — update
 *     DELETE /api/forms/{id}                  — delete
 *     GET    /api/forms/{id}/submissions      — list submissions
 *     GET    /api/forms/{id}/embed            — embed snippet (HTML iframe + JS)
 *
 *   PUBLIC (no auth):
 *     GET    /api/forms/public/{slug}?visitor=X[&email=Y]  — resolved schema (filters known fields)
 *     POST   /api/forms/public/{slug}/submit  — submit; honeypot + rate-limit
 *
 * Field types:
 *   text, email, phone, number, textarea, select, checkbox, hidden, consent
 *
 * Schema shape (stored as JSON in `forms.fields`):
 *   [
 *     { name: "first_name", label: "First name", type: "text", required: true, queue: 1 },
 *     { name: "company",    label: "Company",    type: "text", required: false, queue: 2 },
 *     ...
 *   ]
 *
 * `queue` is the progressive-profiling priority — higher = ask later. Required
 * fields are always shown (even if known) unless explicitly opted out.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

const FORM_FIELD_TYPES = ['text','email','phone','number','textarea','select','checkbox','hidden','consent'];

function forms_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS forms (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    org_id        INT NOT NULL DEFAULT 1,
    user_id       INT DEFAULT NULL,
    slug          VARCHAR(80) NOT NULL UNIQUE,
    name          VARCHAR(150) NOT NULL,
    description   TEXT DEFAULT NULL,
    fields        JSON NOT NULL,
    settings      JSON DEFAULT NULL,
    redirect_url  VARCHAR(500) DEFAULT NULL,
    success_msg   VARCHAR(500) DEFAULT NULL,
    notify_email  VARCHAR(200) DEFAULT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_slug (slug),
    KEY ix_org  (org_id, is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS form_submissions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    form_id      INT NOT NULL,
    visitor      VARCHAR(64) DEFAULT NULL,
    contact_id   INT DEFAULT NULL,
    payload      JSON NOT NULL,
    ip           VARCHAR(45) DEFAULT NULL,
    user_agent   VARCHAR(255) DEFAULT NULL,
    referrer     VARCHAR(500) DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_form_time (form_id, created_at),
    KEY ix_visitor (visitor),
    KEY ix_contact (contact_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS form_visitor_state (
    visitor    VARCHAR(64) PRIMARY KEY,
    contact_id INT DEFAULT NULL,
    known      JSON DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_forms($parts, $method) {
  forms_ensure_schema();
  $sub = $parts[0] ?? null;

  // ── PUBLIC ──
  if ($sub === 'public') {
    $slug = $parts[1] ?? null;
    if (!$slug) err('slug required', 400);
    $action = $parts[2] ?? null;
    if ($action === 'submit' && $method === 'POST') return forms_public_submit($slug);
    if (!$action && $method === 'GET') return forms_public_get($slug);
    err('Method not allowed', 405);
  }

  // ── ADMIN ──
  $user = requireAuth();
  $id = $sub !== null && ctype_digit((string)$sub) ? (int)$sub : null;
  if ($id) {
    $action = $parts[1] ?? null;
    if ($action === 'submissions' && $method === 'GET') return forms_submissions($id, $user);
    if ($action === 'embed'       && $method === 'GET') return forms_embed_snippet($id, $user);
    if (!$action) {
      if ($method === 'GET')    return forms_get($id, $user);
      if ($method === 'PUT')    return forms_update($id, $user);
      if ($method === 'DELETE') return forms_delete($id, $user);
    }
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return forms_list($user);
  if ($method === 'POST') return forms_create($user);
  err('Method not allowed', 405);
}

/* ─────────────────────  ADMIN  ───────────────────── */

function forms_list($user) {
  $rows = qAll(
    "SELECT f.*,
            (SELECT COUNT(*) FROM form_submissions s WHERE s.form_id = f.id) AS submission_count
       FROM forms f WHERE f.org_id = ? ORDER BY f.id DESC",
    [(int)($user['org_id'] ?? 1)]
  );
  foreach ($rows as &$r) {
    $r['id']               = (int)$r['id'];
    $r['fields']           = json_decode($r['fields'], true);
    $r['settings']         = $r['settings'] ? json_decode($r['settings'], true) : null;
    $r['is_active']        = (int)$r['is_active'];
    $r['submission_count'] = (int)$r['submission_count'];
  }
  json_out(['forms' => $rows]);
}

function forms_get($id, $user) {
  $row = qOne("SELECT * FROM forms WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Form not found', 404);
  $row['fields']   = json_decode($row['fields'], true);
  $row['settings'] = $row['settings'] ? json_decode($row['settings'], true) : null;
  $row['submission_count'] = (int)(qOne("SELECT COUNT(*) c FROM form_submissions WHERE form_id = ?", [$id])['c'] ?? 0);
  json_out(['form' => $row]);
}

function forms_create($user) {
  $b = body();
  if (empty($b['name']))   err('name required');
  $fields = is_array($b['fields'] ?? null) ? $b['fields'] : [];
  $fields = forms_normalize_fields($fields);

  $slug = trim((string)($b['slug'] ?? ''));
  if (!$slug) $slug = forms_slugify($b['name']);
  $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($slug));
  if (qOne("SELECT id FROM forms WHERE slug = ?", [$slug])) {
    $slug .= '-' . substr(bin2hex(random_bytes(3)), 0, 6);
  }

  qExec(
    "INSERT INTO forms (org_id, user_id, slug, name, description, fields, settings, redirect_url, success_msg, notify_email, is_active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      $slug,
      trim($b['name']),
      $b['description'] ?? null,
      json_encode($fields),
      isset($b['settings']) ? json_encode($b['settings']) : null,
      $b['redirect_url'] ?? null,
      $b['success_msg']  ?? null,
      $b['notify_email'] ?? null,
      isset($b['is_active']) ? (int)!!$b['is_active'] : 1,
    ]
  );
  json_out(['ok' => true, 'id' => lastId(), 'slug' => $slug], 201);
}

function forms_update($id, $user) {
  $row = qOne("SELECT id FROM forms WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Form not found', 404);
  $b = body();
  $sets = []; $params = [];
  $allowed = ['slug','name','description','fields','settings','redirect_url','success_msg','notify_email','is_active'];
  foreach ($allowed as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'fields')   $v = json_encode(forms_normalize_fields(is_array($v) ? $v : []));
    if ($k === 'settings') $v = $v === null ? null : json_encode($v);
    if ($k === 'is_active') $v = (int)!!$v;
    if ($k === 'slug')     $v = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)$v));
    $sets[] = "$k = ?"; $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE forms SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function forms_delete($id, $user) {
  $row = qOne("SELECT id FROM forms WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Form not found', 404);
  qExec("DELETE FROM form_submissions WHERE form_id = ?", [$id]);
  qExec("DELETE FROM forms WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function forms_submissions($id, $user) {
  $row = qOne("SELECT id FROM forms WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Form not found', 404);
  $rows = qAll(
    "SELECT * FROM form_submissions WHERE form_id = ? ORDER BY id DESC LIMIT 200",
    [$id]
  );
  foreach ($rows as &$r) $r['payload'] = json_decode($r['payload'], true);
  json_out(['submissions' => $rows]);
}

function forms_embed_snippet($id, $user) {
  $row = qOne("SELECT slug, name FROM forms WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Form not found', 404);
  $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'netwebmedia.com');
  $iframe = '<iframe src="' . $base . '/form.html?slug=' . htmlspecialchars($row['slug'], ENT_QUOTES) . '" style="width:100%;max-width:560px;height:640px;border:0;border-radius:12px" loading="lazy"></iframe>';
  $direct_url = $base . '/form.html?slug=' . $row['slug'];
  json_out([
    'ok'         => true,
    'iframe_html'=> $iframe,
    'direct_url' => $direct_url,
    'slug'       => $row['slug'],
  ]);
}

/* ─────────────────────  PUBLIC  ───────────────────── */

function forms_public_get($slug) {
  $row = qOne("SELECT * FROM forms WHERE slug = ? AND is_active = 1", [$slug]);
  if (!$row) err('Form not found', 404);

  $fields = json_decode($row['fields'], true) ?: [];
  $visitor = trim((string)qparam('visitor', ''));
  $emailHint = strtolower(trim((string)qparam('email', '')));

  // Identify known data: from visitor state or by email
  $known = [];
  if ($visitor) {
    $st = qOne("SELECT * FROM form_visitor_state WHERE visitor = ?", [$visitor]);
    if ($st) $known = json_decode($st['known'] ?? '{}', true) ?: [];
  }
  if ($emailHint && filter_var($emailHint, FILTER_VALIDATE_EMAIL)) {
    try {
      $contact = qOne(
        "SELECT data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ?",
        [$emailHint]
      );
      if ($contact) {
        $d = json_decode($contact['data'] ?? '{}', true) ?: [];
        $known = array_merge($known, $d);
      }
    } catch (Exception $e) {}
  }

  // Filter the field list: hide fields whose value is already known unless `always_show` set.
  $output = [];
  foreach ($fields as $f) {
    $name = $f['name'] ?? '';
    if (!$name) continue;
    $isKnown = array_key_exists($name, $known) && $known[$name] !== '' && $known[$name] !== null;
    if ($isKnown && empty($f['always_show'])) continue;
    if ($isKnown) {
      $f['default'] = $known[$name];
      $f['known']   = true;
    }
    $output[] = $f;
  }

  // Sort by queue (lower = ask sooner). Hidden fields stay in place.
  usort($output, function ($a, $b) {
    return (int)($a['queue'] ?? 0) <=> (int)($b['queue'] ?? 0);
  });

  json_out([
    'ok'           => true,
    'slug'         => $row['slug'],
    'name'         => $row['name'],
    'description'  => $row['description'],
    'fields'       => $output,
    'success_msg'  => $row['success_msg'],
    'redirect_url' => $row['redirect_url'],
    'visitor'      => $visitor ?: bin2hex(random_bytes(16)),
  ]);
}

function forms_public_submit($slug) {
  $row = qOne("SELECT * FROM forms WHERE slug = ? AND is_active = 1", [$slug]);
  if (!$row) err('Form not found', 404);

  $b = body();

  // Honeypot
  if (!empty($b['website']) || !empty($b['hp_field'])) {
    json_out(['ok' => true, 'submission_id' => 0]);
  }

  // Rate-limit per IP+slug to 5 per minute
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  if ($ip) {
    $recent = qOne(
      "SELECT COUNT(*) c FROM form_submissions s
        JOIN forms f ON f.id = s.form_id
       WHERE f.slug = ? AND s.ip = ? AND s.created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)",
      [$slug, $ip]
    );
    if ((int)($recent['c'] ?? 0) >= 5) err('Too many submissions, please wait', 429);
  }

  $fields = json_decode($row['fields'], true) ?: [];
  $payload = [];
  $required_missing = [];

  foreach ($fields as $f) {
    $name = $f['name'] ?? '';
    if (!$name) continue;
    $val = $b[$name] ?? null;
    if (is_string($val)) $val = trim($val);

    if (!empty($f['required']) && ($val === null || $val === '' || $val === false)) {
      $required_missing[] = $name;
    }
    if ($val !== null && $val !== '') {
      // Type-validate email
      if (($f['type'] ?? '') === 'email' && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
        err('Invalid email for ' . $name, 400);
      }
      $payload[$name] = $val;
    }
  }
  if ($required_missing) err('Required fields missing: ' . implode(', ', $required_missing), 400);

  // Resolve / upsert contact by email if present
  $contactId = null;
  if (!empty($payload['email']) && filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
    $contactId = forms_upsert_contact($payload, $slug);
  }

  // Visitor state
  $visitor = trim((string)($b['visitor'] ?? ''));
  if (!$visitor) $visitor = bin2hex(random_bytes(16));

  $existing = qOne("SELECT known FROM form_visitor_state WHERE visitor = ?", [$visitor]);
  $known = $existing ? (json_decode($existing['known'] ?? '{}', true) ?: []) : [];
  $known = array_merge($known, $payload);
  qExec(
    "INSERT INTO form_visitor_state (visitor, contact_id, known) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE contact_id = VALUES(contact_id), known = VALUES(known)",
    [$visitor, $contactId, json_encode($known)]
  );

  qExec(
    "INSERT INTO form_submissions (form_id, visitor, contact_id, payload, ip, user_agent, referrer)
     VALUES (?,?,?,?,?,?,?)",
    [
      (int)$row['id'],
      $visitor,
      $contactId,
      json_encode($payload),
      $ip,
      substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250),
      substr($_SERVER['HTTP_REFERER'] ?? '', 0, 500),
    ]
  );
  $submissionId = lastId();

  if (function_exists('log_activity')) {
    log_activity('form.submitted', $contactId ? 'contact' : 'form', $contactId ?: (int)$row['id'], [
      'form_slug'    => $row['slug'],
      'submission_id'=> $submissionId,
      'fields_filled'=> array_keys($payload),
      'contact_id'   => $contactId,
    ]);
  }

  // Optional notify email (best-effort, only if mailer.php available)
  if (!empty($row['notify_email']) && function_exists('send_mail')) {
    try {
      $body = '<p>New submission to form <strong>' . htmlspecialchars($row['name']) . '</strong>:</p><ul>';
      foreach ($payload as $k => $v) $body .= '<li><strong>' . htmlspecialchars($k) . ':</strong> ' . htmlspecialchars(is_scalar($v) ? (string)$v : json_encode($v)) . '</li>';
      $body .= '</ul>';
      @send_mail($row['notify_email'], 'New form submission: ' . $row['name'], $body);
    } catch (Exception $e) {}
  }

  json_out([
    'ok'             => true,
    'submission_id'  => $submissionId,
    'visitor'        => $visitor,
    'success_msg'    => $row['success_msg'] ?: 'Thanks — your submission has been received.',
    'redirect_url'   => $row['redirect_url'] ?: null,
  ], 201);
}

function forms_upsert_contact($payload, $sourceSlug) {
  $email = strtolower(trim((string)$payload['email']));
  if (!$email) return null;

  $existing = qOne(
    "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ?",
    [$email]
  );

  $merge = array_filter([
    'email'      => $email,
    'name'       => $payload['name']       ?? $payload['full_name']  ?? null,
    'first_name' => $payload['first_name'] ?? null,
    'last_name'  => $payload['last_name']  ?? null,
    'phone'      => $payload['phone']      ?? null,
    'company'    => $payload['company']    ?? null,
    'website'    => $payload['website']    ?? null,
    'role'       => $payload['role']       ?? $payload['job_title'] ?? null,
    'city'       => $payload['city']       ?? null,
    'niche_key'  => $payload['niche_key']  ?? $payload['industry']  ?? null,
    'message'    => $payload['message']    ?? null,
    'source'     => 'form:' . $sourceSlug,
    'updated_at' => date('Y-m-d H:i:s'),
  ], function ($v) { return $v !== null && $v !== ''; });

  // Combine first/last into name if not already set
  if (empty($merge['name']) && (!empty($merge['first_name']) || !empty($merge['last_name']))) {
    $merge['name'] = trim(($merge['first_name'] ?? '') . ' ' . ($merge['last_name'] ?? ''));
  }

  try {
    if ($existing) {
      $data = json_decode($existing['data'] ?? '{}', true) ?: [];
      $data = array_merge($data, $merge);
      qExec("UPDATE resources SET data = ?, updated_at = NOW() WHERE id = ?", [json_encode($data), (int)$existing['id']]);
      return (int)$existing['id'];
    }
    $merge['status']      = 'lead';
    $merge['imported_at'] = date('Y-m-d H:i:s');
    qExec("INSERT INTO resources (type, data, created_at) VALUES ('contact', ?, NOW())", [json_encode($merge)]);
    return (int)lastId();
  } catch (Exception $e) {
    return null;
  }
}

function forms_normalize_fields($fields) {
  $out = [];
  foreach ($fields as $i => $f) {
    if (!is_array($f)) continue;
    $name = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($f['name'] ?? '')));
    if (!$name) continue;
    $type = in_array(($f['type'] ?? 'text'), FORM_FIELD_TYPES, true) ? $f['type'] : 'text';
    $out[] = [
      'name'        => $name,
      'label'       => (string)($f['label'] ?? ucfirst($name)),
      'type'        => $type,
      'required'    => !empty($f['required']) ? 1 : 0,
      'placeholder' => $f['placeholder'] ?? null,
      'options'     => $type === 'select' && isset($f['options']) ? array_values((array)$f['options']) : null,
      'default'     => $f['default'] ?? null,
      'queue'       => isset($f['queue']) ? (int)$f['queue'] : ($i + 1),
      'always_show' => !empty($f['always_show']) ? 1 : 0,
      'help'        => $f['help'] ?? null,
    ];
  }
  return $out;
}

function forms_slugify($s) {
  $s = strtolower((string)$s);
  $s = preg_replace('/[^a-z0-9]+/', '-', $s);
  $s = trim($s, '-');
  return substr($s ?: 'form', 0, 60);
}

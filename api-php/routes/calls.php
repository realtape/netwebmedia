<?php
/**
 * Calls — log outbound and inbound calls. Pairs with the click-to-dial widget
 * (which logs intent immediately) and Twilio Voice status callbacks (which
 * later upgrade the row with status, duration, recording_url).
 *
 * Routes (auth required for admin endpoints; the Twilio status webhook is public
 * but signature-verified):
 *
 *   GET    /api/calls?contact_id=X                — list calls for a contact
 *   GET    /api/calls?user_id=X                   — calls handled by a rep
 *   GET    /api/calls/recent                      — recent across the org
 *   POST   /api/calls                             — log a call (manual / click-to-dial)
 *   PUT    /api/calls/{id}                        — update outcome / duration / notes
 *   DELETE /api/calls/{id}                        — delete (admin or owner)
 *
 *   POST   /api/calls/twilio-status               — Twilio Voice status callback (public)
 *
 * call.status: dialing, in_progress, completed, no_answer, busy, failed, voicemail
 * call.outcome: connected, left_voicemail, follow_up, not_interested, wrong_number, …
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function calls_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS calls (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    org_id        INT NOT NULL DEFAULT 1,
    user_id       INT DEFAULT NULL,
    contact_id    INT DEFAULT NULL,
    direction     VARCHAR(10) NOT NULL DEFAULT 'outbound',
    from_phone    VARCHAR(50) DEFAULT NULL,
    to_phone      VARCHAR(50) DEFAULT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'dialing',
    outcome       VARCHAR(40) DEFAULT NULL,
    duration_sec  INT NOT NULL DEFAULT 0,
    notes         TEXT DEFAULT NULL,
    twilio_sid    VARCHAR(80) DEFAULT NULL,
    recording_url VARCHAR(500) DEFAULT NULL,
    started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at      DATETIME DEFAULT NULL,
    KEY ix_contact (contact_id, started_at),
    KEY ix_user    (user_id, started_at),
    KEY ix_status  (status),
    KEY ix_sid     (twilio_sid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_calls($parts, $method) {
  calls_ensure_schema();
  $sub = $parts[0] ?? null;

  if ($sub === 'twilio-status' && $method === 'POST') return calls_twilio_callback();

  $user = requireAuth();
  if ($sub === 'recent' && $method === 'GET') return calls_recent($user);

  $id = $sub !== null && ctype_digit((string)$sub) ? (int)$sub : null;
  if ($id) {
    if ($method === 'PUT')    return calls_update($id, $user);
    if ($method === 'DELETE') return calls_delete($id, $user);
    err('Method not allowed', 405);
  }

  if ($method === 'GET')  return calls_list($user);
  if ($method === 'POST') return calls_create($user);
  err('Method not allowed', 405);
}

function calls_list($user) {
  $where = ['org_id = ?']; $params = [(int)($user['org_id'] ?? 1)];
  if ($c = qparam('contact_id')) { $where[] = 'contact_id = ?'; $params[] = (int)$c; }
  if ($u = qparam('user_id'))    { $where[] = 'user_id = ?';    $params[] = (int)$u; }
  if ($s = qparam('status'))     { $where[] = 'status = ?';     $params[] = $s; }
  $limit = max(1, min(500, (int)qparam('limit', 100)));
  $rows = qAll(
    "SELECT * FROM calls WHERE " . implode(' AND ', $where) . " ORDER BY started_at DESC LIMIT $limit",
    $params
  );
  json_out(['calls' => $rows]);
}

function calls_recent($user) {
  $rows = qAll(
    "SELECT c.*, u.name AS user_name FROM calls c
       LEFT JOIN users u ON u.id = c.user_id
      WHERE c.org_id = ? ORDER BY c.started_at DESC LIMIT 50",
    [(int)($user['org_id'] ?? 1)]
  );
  json_out(['calls' => $rows]);
}

function calls_create($user) {
  $b = body();
  $contactId = isset($b['contact_id']) ? (int)$b['contact_id'] : null;
  $to = trim((string)($b['to_phone'] ?? ''));
  if (!$to && !$contactId) err('to_phone or contact_id required');

  // Resolve to_phone from contact if not supplied
  if (!$to && $contactId) {
    try {
      $row = qOne("SELECT data FROM resources WHERE id = ? AND type = 'contact'", [$contactId]);
      if ($row) {
        $d = json_decode($row['data'] ?? '{}', true) ?: [];
        $to = $d['phone'] ?? '';
      }
    } catch (Exception $e) {}
  }

  $cfg = config();
  qExec(
    "INSERT INTO calls (org_id, user_id, contact_id, direction, from_phone, to_phone, status, outcome, notes)
     VALUES (?,?,?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      $contactId,
      $b['direction'] ?? 'outbound',
      $b['from_phone'] ?? ($cfg['twilio_from'] ?? null),
      $to ?: null,
      $b['status']  ?? 'dialing',
      $b['outcome'] ?? null,
      $b['notes']   ?? null,
    ]
  );
  $id = lastId();

  if (function_exists('log_activity')) {
    log_activity('call.logged', $contactId ? 'contact' : null, $contactId ?: $id, [
      'call_id' => $id, 'to' => $to, 'direction' => $b['direction'] ?? 'outbound',
      'contact_id' => $contactId,
    ]);
  }

  $row = qOne("SELECT * FROM calls WHERE id = ?", [$id]);
  json_out(['call' => $row], 201);
}

function calls_update($id, $user) {
  $row = qOne("SELECT * FROM calls WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Call not found', 404);

  $b = body();
  $sets = []; $params = [];
  foreach (['status','outcome','duration_sec','notes','recording_url','ended_at'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'duration_sec') $v = (int)$v;
    if ($k === 'ended_at' && $v) {
      $ts = strtotime((string)$v);
      $v = $ts ? date('Y-m-d H:i:s', $ts) : null;
    }
    $sets[] = "$k = ?"; $params[] = $v;
  }
  if (!$sets) err('No fields to update');

  // Auto-fill ended_at on completion if missing
  if (in_array('completed', array_map('strval', $params), true) && !in_array('ended_at = ?', $sets, true) && empty($row['ended_at'])) {
    $sets[] = 'ended_at = NOW()';
  }
  $params[] = $id;
  qExec("UPDATE calls SET " . implode(', ', $sets) . " WHERE id = ?", $params);

  if (function_exists('log_activity')) {
    log_activity('call.updated', 'call', $id, ['fields' => array_keys($b), 'contact_id' => $row['contact_id']]);
  }
  $updated = qOne("SELECT * FROM calls WHERE id = ?", [$id]);
  json_out(['call' => $updated]);
}

function calls_delete($id, $user) {
  $row = qOne("SELECT * FROM calls WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Call not found', 404);
  if ((int)$row['user_id'] !== (int)$user['id'] && ($user['role'] ?? '') !== 'admin') err('Forbidden', 403);
  qExec("DELETE FROM calls WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

/**
 * Twilio Voice status callback. Verifies signature like whatsapp.php / webhooks.php
 * patterns and updates the call row identified by twilio_sid.
 */
function calls_twilio_callback() {
  $cfg = config();
  if (!empty($cfg['twilio_token'])) {
    $sig = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';
    $url = ($_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '') . ($_SERVER['REQUEST_URI'] ?? '');
    $sorted = $_POST; ksort($sorted);
    $expected = base64_encode(hash_hmac('sha1', $url . http_build_query($sorted), $cfg['twilio_token'], true));
    if (!hash_equals($expected, $sig)) {
      header('Content-Type: text/xml');
      http_response_code(403);
      echo '<?xml version="1.0" encoding="UTF-8"?><Response/>';
      exit;
    }
  }

  $sid    = $_POST['CallSid']       ?? '';
  $status = $_POST['CallStatus']    ?? '';
  $dur    = (int)($_POST['CallDuration'] ?? 0);
  $rec    = $_POST['RecordingUrl']  ?? null;

  if ($sid) {
    $row = qOne("SELECT id FROM calls WHERE twilio_sid = ?", [$sid]);
    if ($row) {
      $sets = []; $params = [];
      $map = [
        'completed' => 'completed',
        'no-answer' => 'no_answer',
        'busy'      => 'busy',
        'failed'    => 'failed',
        'in-progress' => 'in_progress',
        'queued'    => 'dialing',
        'ringing'   => 'dialing',
      ];
      $localStatus = $map[$status] ?? $status;
      $sets[] = 'status = ?'; $params[] = $localStatus;
      if ($dur) { $sets[] = 'duration_sec = ?'; $params[] = $dur; }
      if ($rec) { $sets[] = 'recording_url = ?'; $params[] = $rec; }
      if ($localStatus === 'completed') $sets[] = 'ended_at = NOW()';
      $params[] = (int)$row['id'];
      qExec("UPDATE calls SET " . implode(', ', $sets) . " WHERE id = ?", $params);
    }
  }

  header('Content-Type: text/xml; charset=utf-8');
  echo '<?xml version="1.0" encoding="UTF-8"?><Response/>';
  exit;
}

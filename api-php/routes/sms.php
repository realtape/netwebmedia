<?php
/**
 * SMS — bulk campaigns via Twilio.
 *
 * ADMIN (auth):
 *   GET    /api/sms/campaigns                  — list campaigns
 *   POST   /api/sms/campaigns                  — create draft
 *   GET    /api/sms/campaigns/{id}             — get campaign + recipient stats
 *   PUT    /api/sms/campaigns/{id}             — update draft
 *   DELETE /api/sms/campaigns/{id}             — delete draft
 *   POST   /api/sms/campaigns/{id}/preview     — preview audience size + sample render
 *   POST   /api/sms/campaigns/{id}/send        — queue all recipients & flip to 'sending'
 *   POST   /api/sms/campaigns/{id}/cancel      — pause
 *   GET    /api/sms/campaigns/{id}/recipients  — list recipients (with status filter)
 *
 *   GET    /api/sms/opt-outs                   — list opt-outs
 *   POST   /api/sms/opt-outs                   — manually opt out a phone
 *   DELETE /api/sms/opt-outs/{id}              — re-subscribe (admin override)
 *
 *   GET    /api/sms/inbound                    — list received SMS
 *
 * PUBLIC:
 *   POST   /api/sms/webhook                    — Twilio inbound webhook (handles STOP)
 *
 * CRON (token):
 *   POST   /api/sms/cron/process?token=...&batch=100 — send next batch
 *
 * Twilio config (from /home/webmed6/.netwebmedia-config.php):
 *   twilio_sid, twilio_token, twilio_from
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/mailer.php'; // for render_template()

function sms_ensure_schema() {
  static $done = false;
  if ($done) return;

  db()->exec("CREATE TABLE IF NOT EXISTS sms_campaigns (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    org_id            INT NOT NULL DEFAULT 1,
    user_id           INT DEFAULT NULL,
    name              VARCHAR(150) NOT NULL,
    body              TEXT NOT NULL,
    audience_filter   JSON DEFAULT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at      DATETIME DEFAULT NULL,
    started_at        DATETIME DEFAULT NULL,
    finished_at       DATETIME DEFAULT NULL,
    total_recipients  INT NOT NULL DEFAULT 0,
    sent_count        INT NOT NULL DEFAULT 0,
    failed_count      INT NOT NULL DEFAULT 0,
    opted_out_count   INT NOT NULL DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_status     (status, scheduled_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS sms_recipients (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id   INT NOT NULL,
    contact_id    INT DEFAULT NULL,
    phone         VARCHAR(50) NOT NULL,
    name          VARCHAR(150) DEFAULT NULL,
    body          TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    twilio_sid    VARCHAR(80) DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    sent_at       DATETIME DEFAULT NULL,
    delivered_at  DATETIME DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_campaign_status (campaign_id, status),
    KEY ix_phone (phone),
    KEY ix_sid (twilio_sid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS sms_opt_outs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    phone         VARCHAR(50) NOT NULL UNIQUE,
    reason        VARCHAR(40) NOT NULL DEFAULT 'STOP',
    opted_out_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by    INT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS sms_inbound (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    from_phone  VARCHAR(50) NOT NULL,
    body        TEXT,
    twilio_sid  VARCHAR(80) DEFAULT NULL UNIQUE,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_from (from_phone)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $done = true;
}

function route_sms($parts, $method) {
  sms_ensure_schema();
  $sub = $parts[0] ?? null;

  // ── PUBLIC ──
  if ($sub === 'webhook' && $method === 'POST') return sms_webhook();

  // ── CRON ──
  if ($sub === 'cron' && ($parts[1] ?? null) === 'process' && $method === 'POST') {
    return sms_cron_process();
  }

  // Everything below is admin-protected
  $user = requireAuth();

  if ($sub === 'campaigns') {
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    $action = $parts[2] ?? null;

    if (!$id) {
      if ($method === 'GET')  return sms_campaigns_list($user);
      if ($method === 'POST') return sms_campaign_create($user);
      err('Method not allowed', 405);
    }
    if ($action === 'preview'    && $method === 'POST') return sms_campaign_preview($id, $user);
    if ($action === 'send'       && $method === 'POST') return sms_campaign_send($id, $user);
    if ($action === 'cancel'     && $method === 'POST') return sms_campaign_cancel($id, $user);
    if ($action === 'recipients' && $method === 'GET')  return sms_campaign_recipients($id, $user);
    if (!$action) {
      if ($method === 'GET')    return sms_campaign_get($id, $user);
      if ($method === 'PUT')    return sms_campaign_update($id, $user);
      if ($method === 'DELETE') return sms_campaign_delete($id, $user);
    }
    err('SMS campaign route not found', 404);
  }

  if ($sub === 'opt-outs') {
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    if ($id && $method === 'DELETE') return sms_opt_out_delete($id, $user);
    if ($method === 'GET')           return sms_opt_outs_list($user);
    if ($method === 'POST')          return sms_opt_out_create($user);
    err('Method not allowed', 405);
  }

  if ($sub === 'inbound' && $method === 'GET') return sms_inbound_list($user);

  err('SMS route not found', 404);
}

/* ─────────────────────  CAMPAIGNS  ───────────────────── */

function sms_campaigns_list($user) {
  $rows = qAll(
    "SELECT * FROM sms_campaigns WHERE org_id = ? ORDER BY id DESC LIMIT 200",
    [(int)($user['org_id'] ?? 1)]
  );
  foreach ($rows as &$r) $r = sms_campaign_decorate($r);
  json_out(['campaigns' => $rows]);
}

function sms_campaign_get($id, $user) {
  $row = qOne(
    "SELECT * FROM sms_campaigns WHERE id = ? AND org_id = ?",
    [$id, (int)($user['org_id'] ?? 1)]
  );
  if (!$row) err('Campaign not found', 404);
  $row = sms_campaign_decorate($row);

  // Recipient counts by status
  $by = qAll(
    "SELECT status, COUNT(*) c FROM sms_recipients WHERE campaign_id = ? GROUP BY status",
    [$id]
  );
  $stats = ['pending'=>0,'sent'=>0,'delivered'=>0,'failed'=>0,'opted_out'=>0];
  foreach ($by as $r) $stats[$r['status']] = (int)$r['c'];
  $row['stats'] = $stats;
  json_out(['campaign' => $row]);
}

function sms_campaign_create($user) {
  $b = body();
  if (empty($b['name']) || empty($b['body'])) err('name and body are required');
  if (mb_strlen($b['body']) > 1500) err('SMS body too long (max 1500 chars)');

  qExec(
    "INSERT INTO sms_campaigns (org_id, user_id, name, body, audience_filter, status, scheduled_at)
     VALUES (?,?,?,?,?,'draft',?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      trim($b['name']),
      trim($b['body']),
      isset($b['audience_filter']) ? json_encode($b['audience_filter']) : null,
      sms_parse_dt($b['scheduled_at'] ?? null),
    ]
  );
  $id = lastId();
  json_out(['ok' => true, 'id' => $id], 201);
}

function sms_campaign_update($id, $user) {
  $row = qOne("SELECT * FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Campaign not found', 404);
  if (!in_array($row['status'], ['draft','scheduled'], true)) err('Cannot edit a campaign that is sending or sent', 409);

  $b = body();
  $sets = []; $params = [];
  foreach (['name','body','audience_filter','scheduled_at','status'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'audience_filter') $v = $v === null ? null : json_encode($v);
    if ($k === 'scheduled_at')    $v = sms_parse_dt($v);
    if ($k === 'status' && !in_array($v, ['draft','scheduled','paused'], true)) continue;
    if ($k === 'body' && mb_strlen($v) > 1500) err('SMS body too long (max 1500 chars)');
    $sets[] = "$k = ?";
    $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE sms_campaigns SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function sms_campaign_delete($id, $user) {
  $row = qOne("SELECT status FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Campaign not found', 404);
  if (in_array($row['status'], ['sending','sent'], true)) err('Cannot delete a sent or sending campaign', 409);
  qExec("DELETE FROM sms_recipients WHERE campaign_id = ?", [$id]);
  qExec("DELETE FROM sms_campaigns WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function sms_campaign_preview($id, $user) {
  $c = qOne("SELECT * FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$c) err('Campaign not found', 404);
  $audience = sms_resolve_audience($c['audience_filter'] ?? null);
  $sample = array_slice($audience, 0, 3);
  $rendered = [];
  foreach ($sample as $contact) {
    $rendered[] = [
      'phone' => $contact['phone'] ?? '',
      'name'  => $contact['name']  ?? '',
      'body'  => sms_render($c['body'], $contact),
    ];
  }
  json_out([
    'ok'             => true,
    'audience_size'  => count($audience),
    'sample'         => $rendered,
    'opt_out_count'  => sms_count_opt_outs(array_column($audience, 'phone')),
  ]);
}

function sms_campaign_send($id, $user) {
  $c = qOne("SELECT * FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$c) err('Campaign not found', 404);
  if (in_array($c['status'], ['sending','sent'], true)) err('Campaign is already sending or sent', 409);

  $cfg = config();
  if (empty($cfg['twilio_sid']) || empty($cfg['twilio_token']) || empty($cfg['twilio_from'])) {
    err('Twilio is not configured (twilio_sid, twilio_token, twilio_from missing)', 503);
  }

  $audience = sms_resolve_audience($c['audience_filter'] ?? null);
  if (!$audience) err('No recipients match the audience filter', 400);

  // Load opt-outs once
  $optOut = sms_load_opt_out_set();

  $total = $skipped = 0;
  // Wipe any prior pending recipients (e.g. from a paused/draft state) before re-queuing
  qExec("DELETE FROM sms_recipients WHERE campaign_id = ? AND status IN ('pending','opted_out')", [$id]);

  foreach ($audience as $contact) {
    $phone = sms_normalize_phone($contact['phone'] ?? '');
    if (!$phone) { $skipped++; continue; }

    $body = sms_render($c['body'], $contact);
    $body = sms_append_stop_disclaimer($body);

    $status = isset($optOut[$phone]) ? 'opted_out' : 'pending';

    qExec(
      "INSERT INTO sms_recipients (campaign_id, contact_id, phone, name, body, status)
       VALUES (?,?,?,?,?,?)",
      [$id, isset($contact['id']) ? (int)$contact['id'] : null,
       $phone, $contact['name'] ?? null, $body, $status]
    );
    $total++;
  }

  $optedOutCount = (int)(qOne("SELECT COUNT(*) c FROM sms_recipients WHERE campaign_id=? AND status='opted_out'", [$id])['c'] ?? 0);

  qExec(
    "UPDATE sms_campaigns SET status='sending', started_at=NOW(),
       total_recipients=?, opted_out_count=?, sent_count=0, failed_count=0
     WHERE id = ?",
    [$total, $optedOutCount, $id]
  );

  if (function_exists('log_activity')) {
    log_activity('sms.campaign_started', 'sms_campaign', $id, [
      'name' => $c['name'], 'total' => $total, 'opted_out' => $optedOutCount, 'skipped' => $skipped,
    ]);
  }

  json_out([
    'ok'             => true,
    'queued'         => $total,
    'opted_out'      => $optedOutCount,
    'skipped'        => $skipped,
    'note'           => 'Cron will pick up pending recipients and send via Twilio',
  ]);
}

function sms_campaign_cancel($id, $user) {
  $c = qOne("SELECT * FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$c) err('Campaign not found', 404);
  qExec("UPDATE sms_campaigns SET status='paused' WHERE id = ?", [$id]);
  json_out(['ok' => true]);
}

function sms_campaign_recipients($id, $user) {
  $c = qOne("SELECT id FROM sms_campaigns WHERE id=? AND org_id=?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$c) err('Campaign not found', 404);
  $where = ['campaign_id = ?'];
  $params = [$id];
  if ($s = qparam('status')) { $where[] = 'status = ?'; $params[] = $s; }
  $limit = max(1, min(500, (int)qparam('limit', 100)));
  $rows = qAll(
    "SELECT * FROM sms_recipients WHERE " . implode(' AND ', $where) . " ORDER BY id DESC LIMIT $limit",
    $params
  );
  json_out(['recipients' => $rows]);
}

function sms_campaign_decorate($r) {
  $r['id']               = (int)$r['id'];
  $r['org_id']           = (int)$r['org_id'];
  $r['user_id']          = $r['user_id'] !== null ? (int)$r['user_id'] : null;
  $r['total_recipients'] = (int)$r['total_recipients'];
  $r['sent_count']       = (int)$r['sent_count'];
  $r['failed_count']     = (int)$r['failed_count'];
  $r['opted_out_count']  = (int)$r['opted_out_count'];
  $r['audience_filter']  = $r['audience_filter'] ? json_decode($r['audience_filter'], true) : null;
  return $r;
}

/* ─────────────────────  AUDIENCE  ───────────────────── */

/**
 * Resolve audience filter into a list of contacts {id, name, email, phone, ...flat fields}.
 * Filter shape: { segment, niche_key, status, region, has_phone (bool, default true) }.
 * Pulls from resources table where type='contact'. Falls back to contacts table if present.
 */
function sms_resolve_audience($filterJson) {
  $f = $filterJson ? (is_array($filterJson) ? $filterJson : json_decode($filterJson, true)) : [];
  $f = is_array($f) ? $f : [];

  $rows = [];
  try {
    $rows = qAll("SELECT id, data FROM resources WHERE type='contact' LIMIT 5000");
  } catch (Exception $e) { return []; }

  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    if (empty($d['phone']) && empty($f['allow_no_phone'])) continue;
    if (!empty($f['segment'])    && ($d['segment']    ?? '') !== $f['segment'])    continue;
    if (!empty($f['niche_key'])  && ($d['niche_key']  ?? '') !== $f['niche_key'])  continue;
    if (!empty($f['status'])     && ($d['status']     ?? '') !== $f['status'])     continue;
    if (!empty($f['region'])     && ($d['region']     ?? '') !== $f['region'])     continue;
    if (!empty($f['city'])       && ($d['city']       ?? '') !== $f['city'])       continue;

    $contact = $d;
    $contact['id'] = (int)$r['id'];
    $contact['first_name'] = explode(' ', $d['name'] ?? '')[0] ?? '';
    $out[] = $contact;
  }
  return $out;
}

/* ─────────────────────  OPT-OUTS  ───────────────────── */

function sms_opt_outs_list($user) {
  $rows = qAll("SELECT * FROM sms_opt_outs ORDER BY opted_out_at DESC LIMIT 500");
  json_out(['opt_outs' => $rows, 'count' => count($rows)]);
}

function sms_opt_out_create($user) {
  $b = body();
  $phone = sms_normalize_phone($b['phone'] ?? '');
  if (!$phone) err('Valid phone required');
  $reason = $b['reason'] ?? 'manual';
  qExec(
    "INSERT INTO sms_opt_outs (phone, reason, created_by) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE reason=VALUES(reason), opted_out_at=NOW()",
    [$phone, $reason, (int)$user['id']]
  );
  json_out(['ok' => true, 'phone' => $phone]);
}

function sms_opt_out_delete($id, $user) {
  qExec("DELETE FROM sms_opt_outs WHERE id = ?", [$id]);
  json_out(['ok' => true]);
}

function sms_load_opt_out_set() {
  $rows = qAll("SELECT phone FROM sms_opt_outs");
  $set = [];
  foreach ($rows as $r) $set[$r['phone']] = true;
  return $set;
}

function sms_count_opt_outs($phones) {
  $phones = array_filter(array_map('sms_normalize_phone', $phones));
  if (!$phones) return 0;
  $set = sms_load_opt_out_set();
  $n = 0;
  foreach ($phones as $p) if (isset($set[$p])) $n++;
  return $n;
}

/* ─────────────────────  WEBHOOK (Twilio inbound)  ───────────────────── */

function sms_webhook() {
  // Twilio posts application/x-www-form-urlencoded
  $from = $_POST['From'] ?? '';
  $body = trim($_POST['Body'] ?? '');
  $sid  = $_POST['MessageSid'] ?? null;

  $phone = sms_normalize_phone($from);
  if (!$phone) {
    header('Content-Type: text/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response/>';
    exit;
  }

  // Log the inbound regardless
  try {
    qExec(
      "INSERT IGNORE INTO sms_inbound (from_phone, body, twilio_sid) VALUES (?,?,?)",
      [$phone, $body, $sid]
    );
  } catch (Exception $e) {}

  // Auto-handle STOP / UNSUBSCRIBE / END / QUIT / CANCEL (carrier-required keywords)
  $upper = strtoupper(trim($body));
  $stopKeywords = ['STOP','UNSUBSCRIBE','END','QUIT','CANCEL','OPTOUT','OPT-OUT','OPT OUT'];
  if (in_array($upper, $stopKeywords, true)) {
    qExec(
      "INSERT INTO sms_opt_outs (phone, reason) VALUES (?, 'STOP')
       ON DUPLICATE KEY UPDATE reason='STOP', opted_out_at=NOW()",
      [$phone]
    );
    if (function_exists('log_activity')) {
      log_activity('sms.opted_out', null, null, ['phone' => $phone]);
    }

    // Reply with required confirmation
    $reply = "You've been unsubscribed and will not receive further messages. Reply HELP for help.";
    header('Content-Type: text/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' .
         htmlspecialchars($reply, ENT_XML1) . '</Message></Response>';
    exit;
  }

  // Auto-handle START / SUBSCRIBE (re-opt-in)
  if (in_array($upper, ['START','UNSTOP','SUBSCRIBE','YES'], true)) {
    qExec("DELETE FROM sms_opt_outs WHERE phone = ?", [$phone]);
    $reply = "You've been re-subscribed. Reply STOP to opt out at any time.";
    header('Content-Type: text/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' .
         htmlspecialchars($reply, ENT_XML1) . '</Message></Response>';
    exit;
  }

  // HELP keyword
  if ($upper === 'HELP') {
    $reply = "NetWebMedia: text STOP to unsubscribe. Msg & data rates may apply. Support: support@netwebmedia.com";
    header('Content-Type: text/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' .
         htmlspecialchars($reply, ENT_XML1) . '</Message></Response>';
    exit;
  }

  // Anything else: empty TwiML response (don't auto-reply)
  header('Content-Type: text/xml; charset=utf-8');
  echo '<?xml version="1.0" encoding="UTF-8"?><Response/>';
  exit;
}

function sms_inbound_list($user) {
  $rows = qAll("SELECT * FROM sms_inbound ORDER BY received_at DESC LIMIT 200");
  json_out(['inbound' => $rows]);
}

/* ─────────────────────  CRON / SENDER  ───────────────────── */

function sms_cron_process() {
  $cfg = config();
  $expected = substr($cfg['jwt_secret'] ?? '', 0, 16);
  $token = qparam('token', '');
  if (!$expected || !hash_equals($expected, $token)) err('Forbidden', 403);

  if (empty($cfg['twilio_sid']) || empty($cfg['twilio_token']) || empty($cfg['twilio_from'])) {
    json_out(['ok' => false, 'reason' => 'twilio_not_configured']);
  }

  $batch = max(1, min(500, (int)qparam('batch', 100)));

  // First, promote any 'scheduled' campaigns whose time has come.
  qExec("UPDATE sms_campaigns SET status='sending', started_at=COALESCE(started_at, NOW())
          WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()");

  // Pick pending recipients across all sending campaigns, oldest first.
  $rows = qAll(
    "SELECT r.*, c.id AS cid
       FROM sms_recipients r
       JOIN sms_campaigns c ON c.id = r.campaign_id
      WHERE r.status = 'pending' AND c.status = 'sending'
      ORDER BY r.id ASC
      LIMIT $batch"
  );

  $sent = $failed = 0;
  $touchedCampaigns = [];
  foreach ($rows as $r) {
    $touchedCampaigns[(int)$r['campaign_id']] = true;
    $resp = sms_send_via_twilio($cfg, $r['phone'], $r['body']);
    if ($resp['ok']) {
      qExec(
        "UPDATE sms_recipients SET status='sent', twilio_sid=?, sent_at=NOW(), error_message=NULL WHERE id=?",
        [$resp['sid'] ?? null, (int)$r['id']]
      );
      $sent++;
    } else {
      qExec(
        "UPDATE sms_recipients SET status='failed', error_message=? WHERE id=?",
        [substr($resp['error'] ?? 'unknown', 0, 1000), (int)$r['id']]
      );
      $failed++;
    }
  }

  // Update campaign counters and finish those with no pending left.
  foreach (array_keys($touchedCampaigns) as $cid) {
    $stats = qOne(
      "SELECT
         SUM(status='sent')      AS sent,
         SUM(status='failed')    AS failed,
         SUM(status='pending')   AS pending,
         SUM(status='opted_out') AS opted_out
       FROM sms_recipients WHERE campaign_id = ?",
      [$cid]
    );
    $sentCount     = (int)($stats['sent'] ?? 0);
    $failedCount   = (int)($stats['failed'] ?? 0);
    $pending       = (int)($stats['pending'] ?? 0);
    $optedOut      = (int)($stats['opted_out'] ?? 0);

    if ($pending === 0) {
      qExec(
        "UPDATE sms_campaigns SET sent_count=?, failed_count=?, opted_out_count=?, status='sent', finished_at=NOW() WHERE id=?",
        [$sentCount, $failedCount, $optedOut, $cid]
      );
      if (function_exists('log_activity')) {
        log_activity('sms.campaign_finished', 'sms_campaign', $cid, [
          'sent' => $sentCount, 'failed' => $failedCount, 'opted_out' => $optedOut,
        ]);
      }
    } else {
      qExec(
        "UPDATE sms_campaigns SET sent_count=?, failed_count=?, opted_out_count=? WHERE id=?",
        [$sentCount, $failedCount, $optedOut, $cid]
      );
    }
  }

  json_out([
    'ok'        => true,
    'processed' => count($rows),
    'sent'      => $sent,
    'failed'    => $failed,
    'time'      => date('c'),
  ]);
}

function sms_send_via_twilio($cfg, $to, $body) {
  $ch = curl_init('https://api.twilio.com/2010-04-01/Accounts/' . $cfg['twilio_sid'] . '/Messages.json');
  curl_setopt_array($ch, [
    CURLOPT_USERPWD => $cfg['twilio_sid'] . ':' . $cfg['twilio_token'],
    CURLOPT_POST => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_POSTFIELDS => http_build_query([
      'To'   => $to,
      'From' => $cfg['twilio_from'],
      'Body' => $body,
    ]),
  ]);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $errn = curl_errno($ch);
  $errs = curl_error($ch);
  curl_close($ch);

  if ($errn) return ['ok' => false, 'error' => 'curl: ' . $errs];

  $data = json_decode($resp, true);
  if ($code >= 200 && $code < 300) {
    return ['ok' => true, 'sid' => $data['sid'] ?? null];
  }
  $msg = is_array($data) && isset($data['message']) ? $data['message'] : ('HTTP ' . $code);
  return ['ok' => false, 'error' => $msg, 'http' => $code];
}

/* ─────────────────────  HELPERS  ───────────────────── */

function sms_render($template, $vars) {
  // Use mailer.php's render_template (does {{var}} substitution + htmlspecialchars).
  // Decode entities afterwards because SMS is plain text, not HTML.
  $rendered = render_template($template, $vars);
  return html_entity_decode($rendered, ENT_QUOTES, 'UTF-8');
}

function sms_append_stop_disclaimer($body) {
  // Carrier compliance: ensure an opt-out path is communicated. Add only if not already mentioned.
  if (stripos($body, 'STOP') !== false) return $body;
  return rtrim($body) . "\nReply STOP to opt out.";
}

function sms_normalize_phone($p) {
  $p = trim((string)$p);
  if (!$p) return '';
  // Strip everything except digits and a leading +
  $clean = preg_replace('/[^\d+]/', '', $p);
  if ($clean === '') return '';
  // If no leading + but starts with country digits, leave as-is; Twilio accepts E.164.
  if ($clean[0] !== '+') {
    // 10-digit US numbers → prepend +1
    $digits = ltrim($clean, '0');
    if (strlen($digits) === 10) $clean = '+1' . $digits;
    else $clean = '+' . $digits;
  }
  return $clean;
}

function sms_parse_dt($v) {
  if (!$v) return null;
  $ts = strtotime((string)$v);
  return $ts ? date('Y-m-d H:i:s', $ts) : null;
}

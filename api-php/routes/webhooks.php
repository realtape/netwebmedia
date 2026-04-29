<?php
/* Public webhook receivers — fire workflow triggers from external sources.
 *
 * All routes are public (no auth). Each is fail-open: if a workflow trigger
 * throws, we still return 200 to the upstream so the provider doesn't retry-storm.
 *
 *   POST /api/public/track-visit              — page visit pixel
 *   POST /api/public/appointments/webhook     — Calendly + generic
 *   POST /api/public/reviews/webhook          — Google reviews + generic
 *   POST /api/public/voice/webhook            — Twilio Voice status callback
 *   POST /api/public/email-inbound/webhook    — SendGrid Parse / Postmark Inbound / generic
 *
 * Each handler normalizes the incoming payload, looks up or creates the
 * relevant contact, builds a workflow context, then calls wf_trigger().
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/workflows.php';
require_once __DIR__ . '/../lib/response.php';

/* ── Schema bootstrap (idempotent) ─────────────────────────────────────── */

function wh_ensure_schema() {
  static $done = false;
  if ($done) return;
  $done = true;
  qExec("CREATE TABLE IF NOT EXISTS page_visits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) DEFAULT NULL,
    contact_id INT DEFAULT NULL,
    session_id VARCHAR(64) DEFAULT NULL,
    page_url VARCHAR(512) NOT NULL,
    referrer VARCHAR(512) DEFAULT NULL,
    user_agent VARCHAR(512) DEFAULT NULL,
    ip VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_email_url (email, page_url),
    INDEX ix_session (session_id),
    INDEX ix_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  qExec("CREATE TABLE IF NOT EXISTS appointment_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    appointment_id VARCHAR(128) DEFAULT NULL,
    invitee_email VARCHAR(255) DEFAULT NULL,
    invitee_name VARCHAR(255) DEFAULT NULL,
    appointment_date VARCHAR(32) DEFAULT NULL,
    raw_payload MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_email (invitee_email),
    INDEX ix_appt (appointment_id),
    INDEX ix_event (event_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  qExec("CREATE TABLE IF NOT EXISTS review_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(32) NOT NULL,
    rating TINYINT DEFAULT NULL,
    author_email VARCHAR(255) DEFAULT NULL,
    author_name VARCHAR(255) DEFAULT NULL,
    place_name VARCHAR(255) DEFAULT NULL,
    review_text MEDIUMTEXT,
    review_url VARCHAR(512) DEFAULT NULL,
    raw_payload MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_source (source),
    INDEX ix_email (author_email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  qExec("CREATE TABLE IF NOT EXISTS voice_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    call_sid VARCHAR(64) NOT NULL,
    call_status VARCHAR(32) NOT NULL,
    from_number VARCHAR(32) DEFAULT NULL,
    to_number VARCHAR(32) DEFAULT NULL,
    duration INT DEFAULT NULL,
    raw_payload MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_call_status (call_sid, call_status),
    INDEX ix_from (from_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  qExec("CREATE TABLE IF NOT EXISTS inbound_emails (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) DEFAULT NULL,
    to_email VARCHAR(255) DEFAULT NULL,
    subject VARCHAR(512) DEFAULT NULL,
    body MEDIUMTEXT,
    in_reply_to VARCHAR(255) DEFAULT NULL,
    message_id VARCHAR(255) DEFAULT NULL,
    raw_payload MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_from (from_email),
    INDEX ix_subj (subject(100))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/* ── Helper: look up or build a contact-context bundle from email/phone ── */

function wh_contact_ctx_from_email($email, $org_id = 1) {
  if (!$email) return [];
  $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND org_id=? AND JSON_EXTRACT(data,'$.email')=? LIMIT 1", [$org_id, $email]);
  if (!$c) return ['email' => $email];
  $d = json_decode($c['data'], true) ?: [];
  $first = $d['first_name'] ?? (preg_split('/\s+/', $d['name'] ?? '', 2)[0] ?? '');
  return array_merge($d, [
    'contact_id' => (int)$c['id'],
    'email'      => $email,
    'first_name' => $first,
    'lang'       => $d['lang'] ?? 'en',
  ]);
}

function wh_contact_ctx_from_phone($phone, $org_id = 1) {
  if (!$phone) return [];
  $clean = preg_replace('/[^0-9+]/', '', $phone);
  $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND org_id=? AND JSON_EXTRACT(data,'$.phone')=? LIMIT 1", [$org_id, $clean]);
  if (!$c) {
    /* Fallback: try unprefixed match */
    $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND org_id=? AND JSON_EXTRACT(data,'$.phone') LIKE ? LIMIT 1", [$org_id, '%' . substr($clean, -10)]);
  }
  if (!$c) return ['phone' => $phone];
  $d = json_decode($c['data'], true) ?: [];
  $first = $d['first_name'] ?? (preg_split('/\s+/', $d['name'] ?? '', 2)[0] ?? '');
  return array_merge($d, [
    'contact_id' => (int)$c['id'],
    'phone'      => $phone,
    'first_name' => $first,
    'lang'       => $d['lang'] ?? 'en',
  ]);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 1) PAGE VISIT TRACKING
 * ───────────────────────────────────────────────────────────────────────── */

function wh_route_track_visit() {
  wh_ensure_schema();
  $b = body() ?: [];
  $page = trim((string)($b['page_url'] ?? $_SERVER['HTTP_REFERER'] ?? ''));
  if ($page === '') { json_out(['ok' => false, 'reason' => 'no_page_url']); return; }
  $page = substr($page, 0, 512);

  $email   = isset($b['email']) ? strtolower(trim((string)$b['email'])) : null;
  if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) $email = null;
  $session = isset($b['session_id']) && preg_match('/^[a-z0-9_\-]{6,64}$/i', (string)$b['session_id']) ? (string)$b['session_id'] : null;
  $contactId = isset($b['contact_id']) ? (int)$b['contact_id'] : null;
  $referrer  = $_SERVER['HTTP_REFERER'] ?? null;
  $ua        = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 512) : null;
  $ip        = $_SERVER['REMOTE_ADDR'] ?? null;

  /* Cheap bot filter — skip obvious crawlers */
  if ($ua && preg_match('/bot|spider|crawl|slurp|preview|scanner/i', $ua)) {
    json_out(['ok' => true, 'skipped' => 'bot']);
    return;
  }

  qExec(
    'INSERT INTO page_visits (email, contact_id, session_id, page_url, referrer, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)',
    [$email, $contactId, $session, $page, $referrer, $ua, $ip]
  );

  /* Compute total visits to this URL by this identity for the trigger context */
  $visitCount = 1;
  if ($email) {
    $visitCount = (int) qOne('SELECT COUNT(*) AS c FROM page_visits WHERE email = ? AND page_url = ?', [$email, $page])['c'];
  } elseif ($session) {
    $visitCount = (int) qOne('SELECT COUNT(*) AS c FROM page_visits WHERE session_id = ? AND page_url = ?', [$session, $page])['c'];
  }

  /* Match by path-prefix so MK-04 page_visit:/pricing matches /pricing.html, /pricing/foo, etc. */
  $path = parse_url($page, PHP_URL_PATH) ?: '/';

  $ctx = array_merge(
    wh_contact_ctx_from_email($email),
    [
      'page_url'    => $page,
      'page_path'   => $path,
      'visit_count' => $visitCount,
      'session_id'  => $session,
      'referrer'    => $referrer,
      'channel'     => 'web',
    ]
  );

  /* Try precise match on workflow's page_url field via prefix — wf_active_for_trigger
     does string equality, so we additionally fire generic and let the workflow's
     'if' branch on visit_count handle thresholding (MK-04). We pass page_path as the
     match key so workflows can pin to "/pricing" etc. */
  try {
    /* Fire two ways: once with no constraint (generic listeners), once keyed to path */
    wf_trigger('page_visit', [], $ctx, 1);
    wf_trigger('page_visit', ['page_url' => $path], $ctx, 1);
  } catch (Throwable $e) {
    error_log('[track-visit wf] ' . $e->getMessage());
  }

  json_out(['ok' => true, 'visit_count' => $visitCount, 'path' => $path]);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 2) APPOINTMENTS — Calendly + generic
 * ───────────────────────────────────────────────────────────────────────── */

function wh_route_appointments() {
  wh_ensure_schema();
  $raw = file_get_contents('php://input');
  $j   = json_decode($raw, true);
  if (!is_array($j)) { json_out(['ok' => true, 'skipped' => 'invalid_json']); return; }

  /* Calendly v2 webhook shape: { event: "invitee.created"|"invitee.canceled", payload: { event, invitee } } */
  $eventType = $j['event'] ?? ($j['type'] ?? '');
  $payload   = $j['payload'] ?? $j;

  $invitee = $payload['invitee'] ?? null;
  $eventDef = $payload['event'] ?? null;

  $email = strtolower(trim((string)($invitee['email'] ?? $payload['email'] ?? $j['email'] ?? '')));
  $name  = trim((string)($invitee['name'] ?? $payload['name'] ?? $j['name'] ?? ''));
  $apptId = (string)($payload['uri'] ?? $eventDef['uri'] ?? $j['appointment_id'] ?? '');
  $apptStart = (string)($eventDef['start_time'] ?? $payload['start_time'] ?? $j['start_time'] ?? '');
  $apptTitle = (string)($eventDef['name'] ?? $j['appointment_title'] ?? 'Meeting');

  /* Provider detection */
  $provider = 'generic';
  if (strpos($eventType, 'invitee.') === 0 || isset($payload['invitee'])) $provider = 'calendly';
  elseif (isset($j['kind']) && $j['kind'] === 'calendar#event')          $provider = 'google_calendar';

  /* Map event type → wf trigger */
  $wfTrigger = null;
  $et = strtolower($eventType);
  if (in_array($et, ['invitee.created', 'booking.created', 'appointment.created', 'created'])) {
    $wfTrigger = 'appointment_booked';
  } elseif (in_array($et, ['invitee.canceled', 'invitee.cancelled', 'booking.canceled', 'appointment.canceled', 'canceled', 'no_show', 'noshow'])) {
    $wfTrigger = 'appointment_noshow';
  } elseif (!empty($payload['no_show']) || !empty($j['no_show'])) {
    $wfTrigger = 'appointment_noshow';
  }

  qExec(
    'INSERT INTO appointment_events (provider, event_type, appointment_id, invitee_email, invitee_name, appointment_date, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)',
    [$provider, $eventType ?: 'unknown', $apptId, $email, $name, $apptStart, $raw]
  );

  if (!$wfTrigger) {
    json_out(['ok' => true, 'logged_only' => true, 'event_type' => $eventType]);
    return;
  }

  $ctx = array_merge(
    wh_contact_ctx_from_email($email),
    [
      'appointment_id'    => $apptId,
      'appointment_title' => $apptTitle,
      'appointment_date'  => substr($apptStart, 0, 10),
      'appointment_time'  => substr($apptStart, 11, 5),
      'meeting_link'      => $payload['location']['join_url'] ?? $payload['location'] ?? '',
      'calendar_link'     => $payload['cancel_url'] ?? '',
      'provider'          => $provider,
      'name'              => $name,
      'channel'           => 'calendar',
    ]
  );

  try { wf_trigger($wfTrigger, [], $ctx, 1); }
  catch (Throwable $e) { error_log('[appointments wf] ' . $e->getMessage()); }

  json_out(['ok' => true, 'fired' => $wfTrigger, 'provider' => $provider]);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 3) REVIEWS — generic, supports Google review push, Trustpilot, manual
 * ───────────────────────────────────────────────────────────────────────── */

function wh_route_reviews() {
  wh_ensure_schema();
  $raw = file_get_contents('php://input');
  $j   = json_decode($raw, true) ?: [];

  /* Optional shared secret for the manual/admin path: ?token=<jwt_secret first 16> */
  /* No auth on the public webhook path itself — providers don't sign reviews. We
     log everything raw and let admin curate stale rows out of review_events. */

  $source     = strtolower((string)($j['source'] ?? 'generic'));
  $rating     = isset($j['rating']) ? (int)$j['rating'] : null;
  $authorEmail= strtolower(trim((string)($j['author_email'] ?? $j['email'] ?? '')));
  $authorName = trim((string)($j['author_name'] ?? $j['name'] ?? ''));
  $placeName  = trim((string)($j['place_name'] ?? $j['business_name'] ?? 'NetWebMedia'));
  $reviewText = trim((string)($j['review_text'] ?? $j['comment'] ?? $j['text'] ?? ''));
  $reviewUrl  = trim((string)($j['review_url'] ?? $j['url'] ?? ''));

  qExec(
    'INSERT INTO review_events (source, rating, author_email, author_name, place_name, review_text, review_url, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [$source ?: 'generic', $rating, $authorEmail ?: null, $authorName ?: null, $placeName ?: null, $reviewText, $reviewUrl ?: null, $raw]
  );

  $ctx = array_merge(
    wh_contact_ctx_from_email($authorEmail),
    [
      'source'      => $source,
      'rating'      => $rating,
      'author_name' => $authorName,
      'place_name'  => $placeName,
      'review_text' => $reviewText,
      'review_url'  => $reviewUrl,
      'name'        => $authorName,
      'channel'     => 'reviews',
    ]
  );

  try { wf_trigger('review_posted', [], $ctx, 1); }
  catch (Throwable $e) { error_log('[reviews wf] ' . $e->getMessage()); }

  json_out(['ok' => true, 'source' => $source, 'rating' => $rating]);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 4) TWILIO VOICE — missed calls
 * ───────────────────────────────────────────────────────────────────────── */

function wh_verify_twilio_signature($url) {
  $cfg = config();
  if (empty($cfg['twilio_token'])) return true; /* dev mode: accept */
  $sig = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';
  if (!$sig) return false;
  $params = $_POST;
  ksort($params);
  $body = $url;
  foreach ($params as $k => $v) $body .= $k . $v;
  $expected = base64_encode(hash_hmac('sha1', $body, $cfg['twilio_token'], true));
  return hash_equals($expected, $sig);
}

function wh_route_voice() {
  wh_ensure_schema();

  /* Twilio sends application/x-www-form-urlencoded */
  $cfg = config();
  $url = ($cfg['base_url'] ?? 'https://netwebmedia.com') . '/api/public/voice/webhook';
  if (!wh_verify_twilio_signature($url)) {
    http_response_code(403);
    header('Content-Type: text/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    exit;
  }

  $callSid    = (string)($_POST['CallSid']    ?? '');
  $callStatus = strtolower((string)($_POST['CallStatus'] ?? ''));
  $from       = (string)($_POST['From']       ?? '');
  $to         = (string)($_POST['To']         ?? '');
  $duration   = isset($_POST['CallDuration']) ? (int)$_POST['CallDuration'] : null;

  /* Only "no-answer", "busy", "failed", "canceled" are missed-call states.
     "completed" with very short duration (<5s) is also effectively a missed call. */
  $missed = in_array($callStatus, ['no-answer', 'busy', 'failed', 'canceled']) ||
            ($callStatus === 'completed' && $duration !== null && $duration < 5);

  /* Always log the event for observability */
  try {
    qExec(
      'INSERT INTO voice_events (call_sid, call_status, from_number, to_number, duration, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE duration=VALUES(duration), raw_payload=VALUES(raw_payload)',
      [$callSid, $callStatus, $from, $to, $duration, json_encode($_POST)]
    );
  } catch (Throwable $_) {}

  if ($missed && $callSid && $from) {
    $ctx = array_merge(
      wh_contact_ctx_from_phone($from),
      [
        'from_number' => $from,
        'phone'       => $from,
        'to_number'   => $to,
        'call_sid'    => $callSid,
        'call_status' => $callStatus,
        'duration'    => $duration,
        'channel'     => 'voice',
      ]
    );
    /* Look for an open deal owned by this contact — pass deal info into ctx */
    if (!empty($ctx['contact_id'])) {
      $deal = qOne(
        "SELECT id, title FROM resources WHERE type='deal' AND status NOT IN ('closed_won','closed_lost')
         AND JSON_EXTRACT(data,'$.contact_id')=? ORDER BY id DESC LIMIT 1",
        [$ctx['contact_id']]
      );
      if ($deal) {
        $ctx['deal_id']    = (int)$deal['id'];
        $ctx['deal_title'] = $deal['title'];
      }
    }
    try { wf_trigger('missed_call', [], $ctx, 1); }
    catch (Throwable $e) { error_log('[voice wf] ' . $e->getMessage()); }
  }

  /* Always reply with empty TwiML so Twilio is happy */
  header('Content-Type: text/xml; charset=UTF-8');
  echo '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  exit;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 5) INBOUND EMAIL — SendGrid Parse / Postmark Inbound / generic
 * ───────────────────────────────────────────────────────────────────────── */

function wh_route_email_inbound() {
  wh_ensure_schema();

  $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
  $provider = 'generic';
  $from = $fromName = $to = $subject = $bodyText = $inReplyTo = $messageId = '';

  if (strpos($contentType, 'application/json') !== false) {
    /* Postmark Inbound shape */
    $raw = file_get_contents('php://input');
    $j   = json_decode($raw, true) ?: [];
    $provider  = !empty($j['MessageStream']) || !empty($j['MessageID']) ? 'postmark' : 'generic';
    $from      = strtolower(trim((string)($j['FromFull']['Email'] ?? $j['From'] ?? $j['from'] ?? '')));
    $fromName  = trim((string)($j['FromFull']['Name'] ?? $j['from_name'] ?? ''));
    $to        = strtolower(trim((string)($j['OriginalRecipient'] ?? $j['ToFull'][0]['Email'] ?? $j['To'] ?? $j['to'] ?? '')));
    $subject   = trim((string)($j['Subject'] ?? $j['subject'] ?? ''));
    $bodyText  = trim((string)($j['TextBody'] ?? $j['StrippedTextReply'] ?? $j['text'] ?? $j['body'] ?? ''));
    $inReplyTo = trim((string)($j['Headers'][array_search('In-Reply-To', array_column($j['Headers'] ?? [], 'Name'))]['Value'] ?? $j['in_reply_to'] ?? ''));
    $messageId = trim((string)($j['MessageID'] ?? $j['message_id'] ?? ''));
    $rawForLog = $raw;
  } else {
    /* SendGrid Parse / Mailgun Routes — multipart or x-www-form-urlencoded */
    $provider  = !empty($_POST['envelope']) ? 'sendgrid' : (!empty($_POST['recipient']) ? 'mailgun' : 'generic');
    $from      = strtolower(trim((string)($_POST['from'] ?? $_POST['sender'] ?? '')));
    /* SendGrid sometimes embeds "Name <email@x>" — extract */
    if (preg_match('/<([^>]+)>/', $from, $m)) $from = strtolower(trim($m[1]));
    $fromName  = trim((string)($_POST['from_name'] ?? ''));
    $to        = strtolower(trim((string)($_POST['to'] ?? $_POST['recipient'] ?? '')));
    if (preg_match('/<([^>]+)>/', $to, $m)) $to = strtolower(trim($m[1]));
    $subject   = trim((string)($_POST['subject'] ?? ''));
    $bodyText  = trim((string)($_POST['text'] ?? $_POST['stripped-text'] ?? $_POST['body-plain'] ?? ''));
    $inReplyTo = trim((string)($_POST['in-reply-to'] ?? $_POST['In-Reply-To'] ?? ''));
    $messageId = trim((string)($_POST['message-id'] ?? $_POST['Message-Id'] ?? ''));
    $rawForLog = json_encode($_POST);
  }

  if (!$from) { json_out(['ok' => true, 'skipped' => 'no_from']); return; }

  qExec(
    'INSERT INTO inbound_emails (provider, from_email, from_name, to_email, subject, body, in_reply_to, message_id, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [$provider, $from, $fromName ?: null, $to ?: null, $subject ?: null, $bodyText, $inReplyTo ?: null, $messageId ?: null, $rawForLog]
  );

  /* Detect "is a reply" — any of: In-Reply-To set, Subject starts with Re:, References header, body quoted */
  $isReply = !empty($inReplyTo) || preg_match('/^(re|fwd?):/i', trim($subject)) || strpos($bodyText, '> ') !== false;

  $ctx = array_merge(
    wh_contact_ctx_from_email($from),
    [
      'from'         => $from,
      'from_name'    => $fromName,
      'to'           => $to,
      'subject'      => $subject,
      'reply_body'   => $bodyText,
      'message'      => $bodyText,
      'in_reply_to'  => $inReplyTo,
      'message_id'   => $messageId,
      'is_reply'     => $isReply ? 1 : 0,
      'provider'     => $provider,
      'channel'      => 'email',
      'name'         => $fromName ?: ($ctx['name'] ?? ''),
    ]
  );

  /* Fire two triggers: a generic webhook_in:email_reply that MK-03 listens for
     when it's a reply, plus a less-specific webhook_in:email_inbound for any
     workflow that wants every inbound message. */
  try {
    if ($isReply) {
      wf_trigger('webhook_in', ['source' => 'email_reply'],   $ctx, 1);
    }
    wf_trigger('webhook_in', ['source' => 'email_inbound'], $ctx, 1);
  } catch (Throwable $e) {
    error_log('[email-inbound wf] ' . $e->getMessage());
  }

  json_out(['ok' => true, 'provider' => $provider, 'is_reply' => (bool)$isReply]);
}

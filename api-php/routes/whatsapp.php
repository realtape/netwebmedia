<?php
/*
 * NetWebMedia WhatsApp Business Bot
 *
 * Routes:
 *   GET  /api/whatsapp/webhook   — Meta webhook verification (hub.challenge)
 *   POST /api/whatsapp/webhook   — Inbound message (Twilio form-encoded OR Meta JSON)
 *   GET  /api/whatsapp/stats     — Conversation stats (admin auth required)
 *   POST /api/whatsapp/reset     — Clear a conversation (admin, body: {phone})
 *
 * Providers supported:
 *   • Twilio  — form-encoded POST, reply via TwiML in the response body
 *   • Meta Cloud API — JSON POST, reply via Meta Send API (requires WHATSAPP_META_TOKEN + WHATSAPP_PHONE_ID)
 *
 * Config keys (in netwebmedia-config.php or .env):
 *   anthropic_api_key     — Claude API key (already used by ai.php)
 *   whatsapp_verify_token — token you set in Meta/Twilio dashboard
 *   twilio_sid, twilio_token, twilio_from — Twilio credentials (already used by workflows.php)
 *   whatsapp_meta_token   — Meta System User token (Meta Cloud API path)
 *   whatsapp_phone_id     — Meta phone number ID (Meta Cloud API path)
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/whatsapp-knowledge.php';

// ── Schema ────────────────────────────────────────────────────────────────────

function wa_ensure_schema(): void {
  static $done = false;
  if ($done) return;
  db()->exec("
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      phone      VARCHAR(30)            NOT NULL,
      role       ENUM('user','assistant') NOT NULL,
      message    TEXT                   NOT NULL,
      provider   VARCHAR(10)            NOT NULL DEFAULT 'twilio',
      created_at TIMESTAMP              NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_phone_time (phone, created_at)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ");
  $done = true;
}

// ── Main router ───────────────────────────────────────────────────────────────

function route_whatsapp(array $parts, string $method): void {
  $sub = $parts[0] ?? 'webhook';

  if ($sub === 'webhook') {
    if ($method === 'GET')  { wa_handle_verify(); return; }
    if ($method === 'POST') { wa_handle_inbound(); return; }
  }

  if ($sub === 'stats' && $method === 'GET') {
    wa_handle_stats();
    return;
  }

  if ($sub === 'reset' && $method === 'POST') {
    wa_handle_reset();
    return;
  }

  err('WhatsApp route not found', 404);
}

// ── Meta webhook verification ─────────────────────────────────────────────────

function wa_handle_verify(): void {
  $cfg   = config();
  $token = $cfg['whatsapp_verify_token'] ?? 'nwm-whatsapp-verify';
  $mode  = $_GET['hub_mode']         ?? $_GET['hub.mode']         ?? '';
  $vtok  = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
  $chall = $_GET['hub_challenge']    ?? $_GET['hub.challenge']    ?? '';

  if ($mode === 'subscribe' && $vtok === $token) {
    http_response_code(200);
    echo $chall;
    exit;
  }
  http_response_code(403);
  echo 'Forbidden';
  exit;
}

// ── Inbound message dispatcher ────────────────────────────────────────────────

function wa_handle_inbound(): void {
  wa_ensure_schema();

  // Detect provider by Content-Type
  $ct = $_SERVER['CONTENT_TYPE'] ?? '';

  if (strpos($ct, 'application/json') !== false) {
    wa_handle_meta();
  } else {
    // Twilio sends application/x-www-form-urlencoded
    wa_handle_twilio();
  }
}

// ── Twilio path ───────────────────────────────────────────────────────────────

function wa_handle_twilio(): void {
  $cfg = config();

  // Verify Twilio signature — REQUIRED when twilio_token is configured. Twilio
  // always sends X-Twilio-Signature; a missing header means the request is
  // unauthenticated (e.g. direct attacker POST). Reject with 403 either when
  // the header is absent or when the HMAC doesn't match.
  if (!empty($cfg['twilio_token'])) {
    $sig      = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';
    $url      = ($cfg['base_url'] ?? 'https://netwebmedia.com') . '/api/whatsapp/webhook';
    $expected = base64_encode(hash_hmac('sha1', $url . wa_sorted_params($_POST), $cfg['twilio_token'], true));
    if (!$sig || !hash_equals($expected, $sig)) {
      http_response_code(403);
      header('Content-Type: text/xml');
      echo '<Response></Response>';
      exit;
    }
  }

  $from = preg_replace('/^whatsapp:/', '', $_POST['From'] ?? '');
  $body = trim($_POST['Body'] ?? '');

  if (!$from || !$body) {
    wa_twiml_reply('');
    return;
  }

  $reply = wa_generate_reply($from, $body, 'twilio');
  wa_twiml_reply($reply);
}

function wa_sorted_params(array $params): string {
  ksort($params);
  $out = '';
  foreach ($params as $k => $v) $out .= $k . $v;
  return $out;
}

function wa_twiml_reply(string $message): void {
  header('Content-Type: text/xml; charset=UTF-8');
  if ($message === '') {
    echo '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  } else {
    echo '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' .
         htmlspecialchars($message, ENT_XML1 | ENT_QUOTES, 'UTF-8') .
         '</Message></Response>';
  }
  exit;
}

// ── Meta Cloud API path ───────────────────────────────────────────────────────

function wa_handle_meta(): void {
  $raw = file_get_contents('php://input');

  // Verify Meta X-Hub-Signature-256. Meta signs every webhook POST with
  // HMAC-SHA256 of the raw body using the App Secret from developers.facebook.com.
  // Fail-closed: if the secret is unset, reject all Meta-path POSTs. NWM's
  // production WhatsApp runs through Twilio (handled above); the Meta path is
  // kept code-ready but disabled until a Meta app is provisioned and
  // WA_META_APP_SECRET is set in GitHub Actions secrets.
  $cfg = config();
  $secret = $cfg['whatsapp_meta_app_secret'] ?? '';
  if (empty($secret)) {
    error_log('whatsapp meta: POST received but whatsapp_meta_app_secret unset — rejecting (fail-closed). Provision Meta App Secret to enable.');
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Meta path not configured']);
    exit;
  }
  $sig = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
  $expected = 'sha256=' . hash_hmac('sha256', $raw, $secret);
  if (!$sig || !hash_equals($expected, $sig)) {
    error_log('whatsapp meta: signature mismatch (sig=' . substr($sig, 0, 20) . '..., expected=' . substr($expected, 0, 20) . '...)');
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid signature']);
    exit;
  }

  $data = json_decode($raw, true);

  // Always ack immediately
  http_response_code(200);
  header('Content-Type: application/json');

  // Dig into the payload
  $entry   = $data['entry'][0] ?? null;
  $changes = $entry['changes'][0] ?? null;
  $value   = $changes['value'] ?? null;
  $msgs    = $value['messages'] ?? [];

  if (empty($msgs)) {
    echo json_encode(['ok' => true]);
    exit;
  }

  $msg  = $msgs[0];
  $from = $msg['from'] ?? '';
  $body = trim($msg['text']['body'] ?? '');
  $type = $msg['type'] ?? '';

  if ($type !== 'text' || !$from || !$body) {
    echo json_encode(['ok' => true]);
    exit;
  }

  echo json_encode(['ok' => true]);

  // Flush before slow Claude call
  if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
  } else {
    ob_end_flush();
    flush();
  }

  $reply = wa_generate_reply($from, $body, 'meta');
  wa_bot_meta_reply($from, $reply);
}

/**
 * Internal bot-path Meta send: used only by wa_handle_meta() for the
 * synchronous reply after fastcgi_finish_request(). Reads token/phoneId
 * from config() (api-php convention). Named distinctly from the CRM library
 * function wa_meta_send() in crm-vanilla/api/lib/wa_meta_send.php (which
 * uses PHP constants) to prevent fatal redeclaration when wf_crm.php pulls
 * that library into the same request.
 */
function wa_bot_meta_reply(string $to, string $message): void {
  $cfg     = config();
  $token   = $cfg['whatsapp_meta_token'] ?? '';
  $phoneId = $cfg['whatsapp_phone_id']   ?? '';
  if (!$token || !$phoneId || !$message) return;

  $ch = curl_init("https://graph.facebook.com/v20.0/{$phoneId}/messages");
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
      'Authorization: Bearer ' . $token,
      'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'messaging_product' => 'whatsapp',
      'to'                => $to,
      'type'              => 'text',
      'text'              => ['body' => $message],
    ]),
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  curl_exec($ch);
  curl_close($ch);
}

// ── AI reply generator ────────────────────────────────────────────────────────

function wa_rate_limited(string $phone, int $limit = 50, int $windowHours = 24): bool {
  try {
    $row = qOne(
      "SELECT COUNT(*) AS c FROM whatsapp_sessions
        WHERE phone = ? AND role = 'user'
          AND created_at >= DATE_SUB(NOW(), INTERVAL $windowHours HOUR)",
      [$phone]
    );
    return ((int)($row['c'] ?? 0)) >= $limit;
  } catch (Throwable $e) {
    return false;
  }
}

function wa_generate_reply(string $phone, string $userMessage, string $provider): string {
  /* Workflow trigger: fire once per inbound WA message so workflows that
     listen for "whatsapp_inbound" can react (lead capture, AI follow-up,
     SDR notify, etc.). Wrapped in try/catch so chat replies never fail
     because of a workflow error. */
  try {
    require_once __DIR__ . '/../lib/workflows.php';
    $waCtx = [
      'channel'   => 'whatsapp',
      'provider'  => $provider,
      'from'      => $phone,
      'phone'     => $phone,
      'message'   => $userMessage,
      'reply_body'=> $userMessage,
    ];
    /* Try to enrich with contact lookup if a record exists */
    try {
      $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data,'$.phone')=? LIMIT 1", [$phone]);
      if ($c) {
        $d = json_decode($c['data'], true) ?: [];
        $waCtx['contact_id'] = $c['id'];
        $waCtx['email']      = $d['email'] ?? null;
        $waCtx['name']       = $d['name'] ?? null;
        $waCtx['lang']       = $d['lang'] ?? null;
        $waCtx['company']    = $d['company'] ?? null;
      }
    } catch (Throwable $_) {}
    wf_trigger('whatsapp_inbound', [], $waCtx, 1);
  } catch (Throwable $e) {
    error_log('[whatsapp_inbound trigger] ' . $e->getMessage());
  }

  // Rate-limit per phone BEFORE saving or calling Claude — protects credits from a single bad actor.
  if (wa_rate_limited($phone)) {
    $limited = "You've hit today's message limit for this chat. For a quick answer, see plans at https://netwebmedia.com/pricing.html, request a free async AI audit at https://netwebmedia.com/contact.html, or email hello@netwebmedia.com.";
    wa_save_turn($phone, 'user',      $userMessage, $provider);
    wa_save_turn($phone, 'assistant', $limited, $provider);
    wa_mirror_to_crm($phone, $userMessage, 'inbound');
    wa_mirror_to_crm($phone, $limited,     'outbound');
    return $limited;
  }

  // Save user turn to whatsapp_sessions (webmed6_nwm) and mirror inbound to CRM (webmed6_crm).
  wa_save_turn($phone, 'user', $userMessage, $provider);

  /* ─── Mirror inbound into webmed6_crm + fire conversation_inbound ────────
   * wa_mirror_to_crm() opens a dedicated PDO to webmed6_crm (separate from
   * the api-php db() PDO bound to webmed6_nwm — NEVER JOIN across DBs).
   * Trigger fires only when mirror succeeded so the engine has a valid conv_id. */
  $mirror = wa_mirror_to_crm($phone, $userMessage, 'inbound');
  if ($mirror !== null) {
    try {
      require_once __DIR__ . '/../../crm-vanilla/api/lib/wf_crm.php';
      // Reuse the PDO that the mirror returned — do NOT open a third connection.
      // The wf_crm engine internally calls getDB() which returns a static singleton
      // bound to webmed6_crm; that's the same DB we just wrote into, so the engine
      // will see the conversation/message rows we just inserted. (Note: wf_crm uses
      // its own getDB() PDO — different connection, same DB — and that's fine.)
      wf_crm_trigger(
        'conversation_inbound',
        ['channel' => 'whatsapp'],
        [
          'conversation_id' => $mirror['conv_id'],
          'message_id'      => $mirror['message_id'],
          'channel'         => 'whatsapp',
          'contact_id'      => $mirror['contact_id'],
          'inbound_body'    => $userMessage,
        ],
        $mirror['user_id'],
        $mirror['org_id']
      );
    } catch (\Throwable $e) {
      error_log('WA conversation_inbound trigger failed: ' . $e->getMessage());
    }
  }

  // Load recent history (last 20 turns = 10 exchanges)
  $history = wa_load_history($phone, 20);

  // Call Claude Haiku — fast & cheap for chat
  $result = wa_call_claude($userMessage, $history);

  if (!empty($result['error'])) {
    $fallback = "Sorry, I hit a technical hiccup. Please email us at hello@netwebmedia.com and we'll reply within a few hours. 🙏";
    wa_save_turn($phone, 'assistant', $fallback, $provider);
    wa_mirror_to_crm($phone, $fallback, 'outbound');
    return $fallback;
  }

  $reply = trim($result['text'] ?? '');
  if (!$reply) {
    $reply = "Thanks for reaching out! For a quick answer, email us at hello@netwebmedia.com.";
  }

  wa_save_turn($phone, 'assistant', $reply, $provider);
  wa_mirror_to_crm($phone, $reply, 'outbound'); // Mirror bot reply into webmed6_crm so CRM shows full thread
  return $reply;
}

function wa_call_claude(string $userMessage, array $history): array {
  $cfg = config();
  $key = $cfg['anthropic_api_key'] ?? '';

  if (!$key) {
    return ['text' => "(Mock) Anthropic key not configured. Set anthropic_api_key in your config."];
  }

  $messages = [];
  foreach ($history as $h) {
    $messages[] = ['role' => $h['role'], 'content' => $h['message']];
  }
  $messages[] = ['role' => 'user', 'content' => $userMessage];

  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
      'Content-Type: application/json',
      'x-api-key: ' . $key,
      'anthropic-version: 2023-06-01',
      'anthropic-beta: prompt-caching-2024-07-31',
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'model'      => 'claude-haiku-4-5',
      'max_tokens' => 400,
      'system'     => [
        [
          'type' => 'text',
          'text' => nwm_whatsapp_system_prompt(),
          'cache_control' => ['type' => 'ephemeral'],
        ]
      ],
      'messages' => $messages,
    ]),
    CURLOPT_TIMEOUT => 55,
  ]);

  $res  = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $j = json_decode($res, true) ?: [];
  if ($code >= 300) return ['error' => $j['error']['message'] ?? 'Claude API error', 'code' => $code];

  $text = '';
  foreach ($j['content'] ?? [] as $blk) {
    if (($blk['type'] ?? '') === 'text') $text .= $blk['text'];
  }
  return ['text' => $text, 'usage' => $j['usage'] ?? null];
}

// ── Conversation storage ──────────────────────────────────────────────────────

function wa_save_turn(string $phone, string $role, string $message, string $provider): void {
  try {
    qExec(
      "INSERT INTO whatsapp_sessions (phone, role, message, provider) VALUES (?, ?, ?, ?)",
      [$phone, $role, $message, $provider]
    );
  } catch (Throwable $e) { /* non-blocking */ }
}

// wa_sync_crm() removed: it was querying contacts/conversations/messages from
// webmed6_nwm (the api-php DB) where those tables don't exist — silently failing
// every call. CRM sync is now handled exclusively by wa_mirror_to_crm(), which
// opens a correct second PDO to webmed6_crm. Both inbound and outbound turns are
// mirrored there so the Conversations module shows the full thread.

/**
 * PR 3: Cross-DB mirror — webmed6_nwm → webmed6_crm.
 *
 * Opens a SECOND PDO connection scoped to webmed6_crm (api-php's db() PDO is
 * scoped to webmed6_nwm and we MUST NOT JOIN across DBs — CLAUDE.md rule).
 *
 * Behavior:
 *   1. Find or create a contacts row in webmed6_crm for this phone.
 *   2. Find or create a conversations row (channel='whatsapp') for that contact.
 *   3. INSERT a messages row tied to that conversation.
 *
 * Tenancy: all rows belong to org 1 (Carlos's master org) because we don't
 * yet route inbound WA by tenant. TODO(multi-tenant-WA): once Twilio/Meta
 * subaccount-per-tenant lands, look up org_id from the inbound phone's
 * destination number, not just the source phone.
 *
 * Returns ['conv_id', 'message_id', 'contact_id', 'org_id', 'user_id'] on success,
 * or null on any failure. The WA webhook MUST NOT propagate exceptions — Meta
 * retries 5xx responses and would generate duplicate inbound rows.
 *
 * @return array{conv_id:int,message_id:int,contact_id:int,org_id:int,user_id:?int}|null
 */
function wa_mirror_to_crm(string $phone, string $body, string $direction = 'inbound'): ?array {
  static $crmPdo = null;

  // Phase 1 multi-tenant decision: WA inbound assigned to master org (1).
  $ORG_ID = 1;
  $USER_ID = null;

  $phone = trim($phone);
  $body  = (string)$body;
  if ($phone === '' || $body === '') return null;
  $sender = ($direction === 'inbound') ? 'them' : 'me';

  try {
    if ($crmPdo === null) {
      // Read CRM creds. The deploy injects DB_PASS into both api-php and crm-vanilla
      // configs (same MySQL user pwd in cPanel). For the CRM connection we explicitly
      // use the webmed6_crm user/db. If the constant isn't defined yet (pre-deploy /
      // missing config.local.php), bail rather than guessing.
      $cfg = config();
      $dbPass = $cfg['db_pass'] ?? '';
      if ($dbPass === '') {
        error_log('wa_mirror_to_crm: db_pass unset — cannot open webmed6_crm connection');
        return null;
      }
      $dsn = 'mysql:host=' . ($cfg['db_host'] ?? 'localhost') . ';dbname=webmed6_crm;charset=utf8mb4';
      $crmPdo = new PDO($dsn, 'webmed6_crm', $dbPass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
      ]);
    }

    // 1. Find or create contact (webmed6_crm.contacts).
    $sel = $crmPdo->prepare("SELECT id FROM contacts WHERE phone = ? LIMIT 1");
    $sel->execute([$phone]);
    $row = $sel->fetch();
    if ($row) {
      $contactId = (int)$row['id'];
    } else {
      $ins = $crmPdo->prepare(
        "INSERT INTO contacts (name, phone, source, status, created_at)
         VALUES (?, ?, 'whatsapp', 'lead', NOW())"
      );
      $ins->execute(["WhatsApp: $phone", $phone]);
      $contactId = (int)$crmPdo->lastInsertId();
    }

    // 2. Find or create conversation (webmed6_crm.conversations).
    $sel2 = $crmPdo->prepare(
      "SELECT id FROM conversations WHERE contact_id = ? AND channel = 'whatsapp' LIMIT 1"
    );
    $sel2->execute([$contactId]);
    $convRow = $sel2->fetch();
    if ($convRow) {
      $convId = (int)$convRow['id'];
    } else {
      // Insert with organization_id when the column exists (post-tenancy migration).
      // Tolerant of pre-tenancy schema — fall back to the legacy column set.
      try {
        $ins = $crmPdo->prepare(
          "INSERT INTO conversations (organization_id, contact_id, channel, subject, unread, updated_at)
           VALUES (?, ?, 'whatsapp', ?, 1, NOW())"
        );
        $ins->execute([$ORG_ID, $contactId, "WhatsApp – $phone"]);
      } catch (Throwable $e) {
        $ins = $crmPdo->prepare(
          "INSERT INTO conversations (contact_id, channel, subject, unread, updated_at)
           VALUES (?, 'whatsapp', ?, 1, NOW())"
        );
        $ins->execute([$contactId, "WhatsApp – $phone"]);
      }
      $convId = (int)$crmPdo->lastInsertId();
    }

    // 3. Insert the message. Idempotency guard against double-fire (5s dedup).
    $dup = $crmPdo->prepare(
      "SELECT id FROM messages
        WHERE conversation_id = ? AND body = ? AND sender = ?
          AND sent_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
        LIMIT 1"
    );
    $dup->execute([$convId, $body, $sender]);
    $existing = $dup->fetch();
    if ($existing) {
      $msgId = (int)$existing['id'];
    } else {
      try {
        $insMsg = $crmPdo->prepare(
          "INSERT INTO messages (organization_id, conversation_id, sender, body, sent_at)
           VALUES (?, ?, ?, ?, NOW())"
        );
        $insMsg->execute([$ORG_ID, $convId, $sender, $body]);
      } catch (Throwable $e) {
        // Fallback for pre-tenancy schema without organization_id.
        $insMsg = $crmPdo->prepare(
          "INSERT INTO messages (conversation_id, sender, body, sent_at)
           VALUES (?, ?, ?, NOW())"
        );
        $insMsg->execute([$convId, $sender, $body]);
      }
      $msgId = (int)$crmPdo->lastInsertId();
    }

    // Bump conversation updated_at + unread on inbound. Tolerant of column shape.
    if ($sender === 'them') {
      try {
        $crmPdo->prepare(
          "UPDATE conversations SET updated_at = NOW(), unread = unread + 1 WHERE id = ?"
        )->execute([$convId]);
      } catch (Throwable $_) {
        $crmPdo->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?")
               ->execute([$convId]);
      }
    } else {
      $crmPdo->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?")
             ->execute([$convId]);
    }

    return [
      'conv_id'    => $convId,
      'message_id' => $msgId,
      'contact_id' => $contactId,
      'org_id'     => $ORG_ID,
      'user_id'    => $USER_ID,
    ];
  } catch (Throwable $e) {
    error_log('wa_mirror_to_crm error: ' . $e->getMessage());
    return null;
  }
}

function wa_load_history(string $phone, int $limit = 20): array {
  try {
    $rows = qAll(
      "SELECT role, message FROM (
         SELECT id, role, message FROM whatsapp_sessions
         WHERE phone = ?
         ORDER BY id DESC LIMIT $limit
       ) t ORDER BY id ASC",
      [$phone]
    );
    return $rows ?: [];
  } catch (Throwable $e) {
    return [];
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

function wa_handle_stats(): void {
  require_once __DIR__ . '/../lib/auth.php';
  $user = currentUser();
  if (!$user) err('Unauthorized', 401);

  wa_ensure_schema();

  $total   = (int) qOne("SELECT COUNT(DISTINCT phone) AS c FROM whatsapp_sessions")['c'];
  $msgs    = (int) qOne("SELECT COUNT(*) AS c FROM whatsapp_sessions")['c'];
  $today   = (int) qOne("SELECT COUNT(*) AS c FROM whatsapp_sessions WHERE DATE(created_at) = CURDATE()")['c'];
  $recent  = qAll(
    "SELECT phone, MAX(created_at) AS last_msg, COUNT(*) AS turns
     FROM whatsapp_sessions GROUP BY phone ORDER BY last_msg DESC LIMIT 20"
  );

  json_out([
    'unique_conversations' => $total,
    'total_messages'       => $msgs,
    'messages_today'       => $today,
    'recent_conversations' => $recent,
  ]);
}

function wa_handle_reset(): void {
  require_once __DIR__ . '/../lib/auth.php';
  $user = currentUser();
  if (!$user) err('Unauthorized', 401);

  wa_ensure_schema();

  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $phone = trim($b['phone'] ?? '');
  if (!$phone) err('phone required', 400);

  qExec("DELETE FROM whatsapp_sessions WHERE phone = ?", [$phone]);
  json_out(['ok' => true, 'phone' => $phone]);
}

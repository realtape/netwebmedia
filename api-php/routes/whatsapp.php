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

  if (str_contains($ct, 'application/json')) {
    wa_handle_meta();
  } else {
    // Twilio sends application/x-www-form-urlencoded
    wa_handle_twilio();
  }
}

// ── Twilio path ───────────────────────────────────────────────────────────────

function wa_handle_twilio(): void {
  $cfg = config();

  // Optional: verify Twilio signature
  if (!empty($cfg['twilio_token'])) {
    $sig      = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';
    $url      = ($cfg['base_url'] ?? 'https://netwebmedia.com') . '/api/whatsapp/webhook';
    $expected = base64_encode(hash_hmac('sha1', $url . wa_sorted_params($_POST), $cfg['twilio_token'], true));
    if ($sig && !hash_equals($expected, $sig)) {
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
  $raw  = file_get_contents('php://input');
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
  wa_meta_send($from, $reply);
}

function wa_meta_send(string $to, string $message): void {
  $cfg     = config();
  $token   = $cfg['whatsapp_meta_token'] ?? '';
  $phoneId = $cfg['whatsapp_phone_id']   ?? '';
  if (!$token || !$phoneId || !$message) return;

  $ch = curl_init("https://graph.facebook.com/v19.0/{$phoneId}/messages");
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
  ]);
  curl_exec($ch);
  curl_close($ch);
}

// ── AI reply generator ────────────────────────────────────────────────────────

function wa_generate_reply(string $phone, string $userMessage, string $provider): string {
  // Save user turn
  wa_save_turn($phone, 'user', $userMessage, $provider);

  // Load recent history (last 20 turns = 10 exchanges)
  $history = wa_load_history($phone, 20);

  // Call Claude Haiku — fast & cheap for chat
  $result = wa_call_claude($userMessage, $history);

  if (!empty($result['error'])) {
    $fallback = "Sorry, I hit a technical hiccup. Please email us at hello@netwebmedia.com and we'll reply within a few hours. 🙏";
    wa_save_turn($phone, 'assistant', $fallback, $provider);
    return $fallback;
  }

  $reply = trim($result['text'] ?? '');
  if (!$reply) {
    $reply = "Thanks for reaching out! For a quick answer, email us at hello@netwebmedia.com.";
  }

  wa_save_turn($phone, 'assistant', $reply, $provider);
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
      'model'      => 'claude-haiku-4-5-20251001',
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
  $user = auth_user();
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
  $user = auth_user();
  if (!$user) err('Unauthorized', 401);

  wa_ensure_schema();

  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $phone = trim($b['phone'] ?? '');
  if (!$phone) err('phone required', 400);

  qExec("DELETE FROM whatsapp_sessions WHERE phone = ?", [$phone]);
  json_out(['ok' => true, 'phone' => $phone]);
}

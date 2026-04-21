<?php
/* Public prospect chat endpoint — /api/public/chat
   Powers the open-ended fallback for the nwm-chat.js widget on netwebmedia.com.

   POST body: { message, language?, session_id? }
   Response:  { reply, suggested_actions[], session_id, mock? }

   - No auth. IP-based rate limit: 20 messages / 24h / IP.
   - Uses nwm_unified_kb() + Claude 3.5 Sonnet via ai_call_claude().
   - Conversations logged to public_chat_log for QA + abuse review.
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/knowledge-base.php';
require_once __DIR__ . '/ai.php'; // ai_call_claude()

function pchat_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS public_chat_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    language VARCHAR(8) DEFAULT 'en',
    role VARCHAR(16) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    page VARCHAR(255) DEFAULT NULL,
    referrer VARCHAR(512) DEFAULT NULL,
    user_agent VARCHAR(512) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_session (session_id), KEY ix_ip (ip), KEY ix_created (created_at)
  )");
}

function pchat_client_ip() {
  // Behind shared hosting — REMOTE_ADDR is fine. We don't trust X-Forwarded-For
  // unless a reverse proxy is explicitly configured.
  return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function pchat_rate_limited($ip, $limit = 20, $windowHours = 24) {
  $row = qOne(
    "SELECT COUNT(*) AS c FROM public_chat_log
      WHERE ip = ? AND role = 'user'
        AND created_at >= DATE_SUB(NOW(), INTERVAL $windowHours HOUR)",
    [$ip]
  );
  return ((int)($row['c'] ?? 0)) >= $limit;
}

function pchat_load_history($sessionId, $ip, $limit = 20) {
  // Only load history for the same session AND same IP — this prevents a session_id
  // guessed by one visitor from leaking another's context.
  $rows = qAll(
    "SELECT role, content FROM public_chat_log
      WHERE session_id = ? AND ip = ?
      ORDER BY id ASC LIMIT $limit",
    [$sessionId, $ip]
  );
  return $rows ?: [];
}

function pchat_log_turn($sessionId, $ip, $lang, $role, $content, $page = null, $ref = null, $ua = null) {
  qExec(
    "INSERT INTO public_chat_log (session_id, ip, language, role, content, page, referrer, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [$sessionId, $ip, $lang, $role, $content, $page, $ref, $ua]
  );
}

function pchat_public_system_prompt($lang) {
  $lang_rule = ($lang === 'es')
    ? "The user has selected Spanish. Default to Spanish. If they write in English, switch to English."
    : "Default to English. If the user writes in Spanish, switch to Spanish.";

  $prospect_rules = <<<RULES
━━ PUBLIC WEBSITE CHAT — ROLE ━━
You are the NetWebMedia assistant embedded in a chat bubble at the bottom-left of every page on netwebmedia.com. You speak to prospects and visitors — people who may or may not be clients yet.

Goal: answer ANY question they have about NetWebMedia (services, pricing, plans, tutorials, courses, AI features, commercial terms, support, how we work) using the knowledge base above as the single source of truth. If a question is genuinely outside the KB, say so honestly and offer a handoff (hello@netwebmedia.com, WhatsApp, or a booked call at /contact.html).

━━ FORMAT RULES ━━
• {$lang_rule} Never mix languages in one reply.
• Keep replies short and scannable: 2–4 short paragraphs OR a tight bullet list (max 6 items). This is a chat widget, not an email.
• Use **bold** for key terms, prices, and plan names. Use bullet lists for comparisons.
• Always end with a clear next step: a link, a suggested action, or one follow-up question.
• Never invent features, pricing, or terms not in the KB.
• Never quote competitor prices as fact.
• Never promise specific revenue numbers.
• NetWebMedia has NO phone support — if asked for a phone number, explain that briefly and offer WhatsApp / chat / email / book-a-call.
• Retired: Carlos26 promo (never mention it).

━━ OUTPUT: SUGGESTED ACTIONS ━━
After your reply, consider which 2–3 next actions make sense for this user and include them inline as compact bullets (with URLs). Good suggested actions:
  • Run a free audit → /contact.html
  • See pricing → /pricing.html
  • Book a strategy call → /contact.html
  • Read the relevant tutorial → /tutorials/<slug>.html
  • Read the relevant guide → /guides/<slug>.html
  • Message on WhatsApp (when user wants faster back-and-forth)
  • Email hello@netwebmedia.com (when escalation is right)

Pick actions that match the user's intent — don't dump all of them.
RULES;

  return nwm_unified_kb() . "\n\n" . $prospect_rules;
}

function pchat_extract_suggested_actions($text) {
  // Best-effort extract of bullet links the model emitted. Conservative.
  $actions = [];
  if (preg_match_all('/(?:^|\n)\s*(?:[-•*]|\d+\.)\s+(.+?)(?=\n|$)/', $text, $m)) {
    foreach ($m[1] as $line) {
      if (preg_match('/\[([^\]]+)\]\(([^)]+)\)/', $line, $mm)) {
        $actions[] = ['label' => trim($mm[1]), 'href' => trim($mm[2])];
      } elseif (preg_match('/(https?:\/\/\S+|\/[a-z0-9_\-\/#.?=&]+)/i', $line, $mm)) {
        $href = trim($mm[1], " .,;:");
        $label = trim(preg_replace('/(https?:\/\/\S+|\/[a-z0-9_\-\/#.?=&]+)/i', '', $line));
        $label = trim($label, " -–•*→:");
        if ($label !== '') $actions[] = ['label' => $label, 'href' => $href];
      }
    }
  }
  // Cap at 4 and dedupe by href
  $seen = [];
  $out = [];
  foreach ($actions as $a) {
    if (isset($seen[$a['href']])) continue;
    $seen[$a['href']] = 1;
    $out[] = $a;
    if (count($out) >= 4) break;
  }
  return $out;
}

function route_public_chat() {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    err('Method not allowed', 405);
  }

  pchat_ensure_schema();

  $b = body();
  $message = isset($b['message']) ? trim((string)$b['message']) : '';
  if ($message === '') err('Missing field: message', 400);
  if (strlen($message) > 2000) err('Message too long (2000 char max)', 400);

  $lang = (isset($b['language']) && in_array($b['language'], ['en', 'es'], true))
    ? $b['language'] : 'en';
  $sessionId = isset($b['session_id']) && preg_match('/^[a-z0-9_\-]{6,64}$/i', (string)$b['session_id'])
    ? (string)$b['session_id']
    : ('pub_' . bin2hex(random_bytes(10)));

  $ip = pchat_client_ip();
  $page = isset($b['page']) ? substr((string)$b['page'], 0, 255) : null;
  $ref  = $_SERVER['HTTP_REFERER'] ?? null;
  $ua   = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 512) : null;

  // Rate limit first — BEFORE we log anything or call Claude.
  if (pchat_rate_limited($ip)) {
    $fallback = $lang === 'es'
      ? "Has alcanzado el límite diario de este chat. Escríbenos a *hello@netwebmedia.com* o agenda una llamada de 30 min en /contact.html — te respondemos en pocas horas hábiles."
      : "You've hit today's chat limit. Email *hello@netwebmedia.com* or book a 30-min call at /contact.html — we reply within a few business hours.";
    json_out([
      'session_id' => $sessionId,
      'reply' => $fallback,
      'rate_limited' => true,
      'suggested_actions' => [
        ['label' => $lang === 'es' ? 'Agendar llamada' : 'Book a call', 'href' => '/contact.html'],
        ['label' => 'hello@netwebmedia.com', 'href' => 'mailto:hello@netwebmedia.com'],
      ],
    ], 429);
  }

  $history = pchat_load_history($sessionId, $ip);
  pchat_log_turn($sessionId, $ip, $lang, 'user', $message, $page, $ref, $ua);

  $sys = pchat_public_system_prompt($lang);
  $r = ai_call_claude($sys, $message, $history, 'claude-3-5-sonnet-20241022');

  if (!empty($r['error'])) {
    // Log the raw Claude error server-side for diagnosis (error_log → PHP log).
    error_log('public-chat: claude error code=' . ($r['code'] ?? '?') . ' msg=' . ($r['error'] ?? '?'));
    $reply = $lang === 'es'
      ? "Tuve un problema técnico respondiendo ahora mismo. Mientras lo resolvemos: escríbenos a *hello@netwebmedia.com*, chatea con nosotros en WhatsApp, o agenda 30 min en /contact.html — respondemos en pocas horas hábiles."
      : "I hit a technical issue just now. While we sort it out: email *hello@netwebmedia.com*, ping us on WhatsApp, or book a 30-min call at /contact.html — we reply within a few business hours.";
    pchat_log_turn($sessionId, $ip, $lang, 'assistant', $reply . ' [error:' . ($r['error'] ?? '?') . ']', $page, $ref, $ua);
    $dbg = $_SERVER['HTTP_X_DEBUG_TOKEN'] ?? '';
    $dbgPayload = ($dbg === 'nwm-diag-2026-04-21b') ? [
      'debug_error' => $r['error'] ?? null,
      'debug_code'  => $r['code']  ?? null,
      'debug_raw'   => $r['raw']   ?? null,
      'debug_key_preview' => function_exists('ai_anthropic_key')
        ? (substr((string)ai_anthropic_key(), 0, 18) . '...' . substr((string)ai_anthropic_key(), -6) . ' (' . strlen((string)ai_anthropic_key()) . ' chars)')
        : 'n/a',
    ] : [];
    json_out(array_merge([
      'session_id' => $sessionId,
      'reply' => $reply,
      'suggested_actions' => [
        ['label' => $lang === 'es' ? 'Agendar llamada' : 'Book a call', 'href' => '/contact.html'],
        ['label' => 'hello@netwebmedia.com', 'href' => 'mailto:hello@netwebmedia.com'],
        ['label' => 'WhatsApp', 'href' => 'https://wa.me/message/'],
      ],
      'error_internal' => true,
    ], $dbgPayload));
  }

  $reply = $r['text'] ?? '';
  if ($reply === '') {
    $reply = $lang === 'es'
      ? "No logré generar una respuesta. Por favor reformula la pregunta o escríbenos a hello@netwebmedia.com."
      : "I couldn't generate a reply. Please rephrase or email hello@netwebmedia.com.";
  }

  $actions = pchat_extract_suggested_actions($reply);

  pchat_log_turn($sessionId, $ip, $lang, 'assistant', $reply, $page, $ref, $ua);

  json_out([
    'session_id' => $sessionId,
    'reply' => $reply,
    'suggested_actions' => $actions,
    'mock' => !empty($r['mock']),
  ]);
}

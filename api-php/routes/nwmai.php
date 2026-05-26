<?php
/* NWMai — unified AI assistant for NetWebMedia CRM + CMS users.
   Wraps ai_call_claude() with a NWMai-branded system prompt, context injection,
   and session storage in the resources table (no schema change required).

   Routes:
     POST /api/nwmai/chat        Auth. {message, session_id?, context?} -> reply + session_id
     POST /api/nwmai/generate    Auth. {kind, input, tone?, language?}  -> structured output
                                 kind in: page_draft, blog_section, meta, email_subject,
                                          email_body, summary, next_steps, translate
     GET  /api/nwmai/sessions    Auth. list user's last 20 NWMai sessions
     GET  /api/nwmai/session/{id}  Auth. return full message history
     DELETE /api/nwmai/session/{id}  Auth. delete a session
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/knowledge-base.php';
require_once __DIR__ . '/ai.php';  // for ai_call_claude() + ai_ensure_schema()

function nwmai_system_prompt($context = []) {
  // Prepend the full NetWebMedia KB so NWMai can answer any prospect/client
  // question about pricing, plans, features, tutorials, etc. in addition to
  // its in-app assistant role. Context-injection (route/entity/user) is kept.
  $kb = nwm_unified_kb();
  $role = "━━ NWMai ROLE (in addition to the KB above) ━━\n"
        . "You are NWMai, the unified AI assistant built into the NetWebMedia platform (CRM + CMS + Marketing).\n"
        . "Beyond answering any NetWebMedia question from the knowledge base above, you also help logged-in users:\n"
        . "draft emails and SMS, summarize deals and tickets, generate CMS pages and blog posts, write SEO meta,\n"
        . "translate content (EN/ES), build automations, and suggest next best actions.\n"
        . "Be concise, action-oriented, and executive in tone. Never invent data — if you don't have it, ask.\n"
        . "Default language: English. If the user writes in Spanish, reply in Spanish.";
  if (!empty($context['route']))  $role .= "\n\nCurrent CRM route: {$context['route']}";
  if (!empty($context['entity'])) $role .= "\nCurrent entity: " . json_encode($context['entity']);
  if (!empty($context['user']))   $role .= "\nUser: " . json_encode($context['user']);
  return $kb . "\n\n" . $role;
}

function nwmai_load_history($sessionId, $limit = 20) {
  return qAll(
    "SELECT role, content FROM agent_conversations WHERE session_id = ? ORDER BY id ASC LIMIT $limit",
    [$sessionId]
  ) ?: [];
}

function nwmai_save_turn($orgId, $sessionId, $role, $content) {
  // reuse the agent_conversations table; agent_id = 0 means "NWMai core"
  qExec(
    "INSERT INTO agent_conversations (org_id, agent_id, session_id, role, content) VALUES (?, 0, ?, ?, ?)",
    [$orgId, $sessionId, $role, $content]
  );
}

function route_nwmai($parts, $method) {
  ai_ensure_schema();
  $sub = $parts[0] ?? '';

  // --- POST /api/nwmai/chat ------------------------------------------------
  if ($sub === 'chat' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['message']);
    $context = $b['context'] ?? [];
    if (is_string($context)) $context = json_decode($context, true) ?: [];
    $session = $b['session_id'] ?? ('nwmai_' . bin2hex(random_bytes(12)));
    $history = nwmai_load_history($session);
    nwmai_save_turn($u['org_id'], $session, 'user', $b['message']);
    $sys = nwmai_system_prompt(array_merge(
      ['user' => ['name' => $u['name'] ?? '', 'role' => $u['role'] ?? '']],
      is_array($context) ? $context : []
    ));
    $r = ai_call_claude($sys, $b['message'], $history);
    $reply = $r['text'] ?? ('Error: ' . ($r['error'] ?? 'unknown'));
    nwmai_save_turn($u['org_id'], $session, 'assistant', $reply);
    json_out([
      'session_id' => $session,
      'reply'      => $reply,
      'mock'       => !empty($r['mock']),
      'usage'      => $r['usage'] ?? null,
    ]);
  }

  // --- POST /api/nwmai/generate -------------------------------------------
  if ($sub === 'generate' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['kind', 'input']);
    $kind  = strtolower((string)$b['kind']);
    $input = (string)$b['input'];
    $tone  = $b['tone']     ?? 'professional, executive';
    $lang  = $b['language'] ?? 'en';

    $prompts = [
      'page_draft'    => "Draft a full CMS landing page in clean, semantic HTML. Include: an H1, an H2 subheader, 3 feature blocks, 1 social proof block, and a CTA. Topic:",
      'blog_section' => "Write one blog-post section (200-300 words) with a H2 heading. Topic:",
      'meta'          => "Return JSON: {title (under 60 chars), description (under 155 chars), og_title, og_description}. Source content:",
      'email_subject' => "Return 5 email subject-line options, one per line, optimized for open rate. Context:",
      'email_body'    => "Draft a short marketing email body (under 120 words) with a clear CTA. Context:",
      'summary'       => "Summarize the following in 3 executive bullet points:",
      'next_steps'    => "Given the context, propose 3 concrete next actions the user should take, each starting with a verb. Context:",
      'translate'     => "Translate the following to the requested language, preserving tone and CTAs. Target language: $lang. Source:",
    ];
    if (!isset($prompts[$kind])) err('Unknown kind. Allowed: ' . implode(', ', array_keys($prompts)), 400);

    $sys = "You are NWMai's content engine. Tone: $tone. Language: $lang. Reply with ONLY the requested artifact — no preamble, no closing remarks.";
    $user = $prompts[$kind] . "\n\n" . $input;
    $r = ai_call_claude($sys, $user, []);
    json_out([
      'kind'   => $kind,
      'output' => $r['text'] ?? null,
      'mock'   => !empty($r['mock']),
      'error'  => $r['error'] ?? null,
    ]);
  }

  // --- GET /api/nwmai/sessions --------------------------------------------
  if ($sub === 'sessions' && $method === 'GET') {
    $u = requirePaidAccess();
    $rows = qAll(
      "SELECT session_id, MIN(created_at) AS started_at, MAX(created_at) AS last_at,
              COUNT(*) AS turns,
              (SELECT content FROM agent_conversations c2
                 WHERE c2.session_id = c1.session_id AND c2.role = 'user'
                 ORDER BY id ASC LIMIT 1) AS first_message
         FROM agent_conversations c1
        WHERE org_id = ? AND agent_id = 0 AND session_id LIKE 'nwmai_%'
        GROUP BY session_id
        ORDER BY last_at DESC
        LIMIT 20",
      [$u['org_id']]
    );
    json_out(['sessions' => $rows ?: []]);
  }

  // --- GET/DELETE /api/nwmai/session/{id} ---------------------------------
  if ($sub === 'session' && !empty($parts[1])) {
    $u  = requirePaidAccess();
    $id = $parts[1];
    if ($method === 'GET') {
      $rows = qAll(
        "SELECT role, content, created_at FROM agent_conversations
          WHERE session_id = ? AND org_id = ? AND agent_id = 0
          ORDER BY id ASC",
        [$id, $u['org_id']]
      );
      json_out(['session_id' => $id, 'messages' => $rows ?: []]);
    }
    if ($method === 'DELETE') {
      qExec(
        "DELETE FROM agent_conversations WHERE session_id = ? AND org_id = ? AND agent_id = 0",
        [$id, $u['org_id']]
      );
      json_out(['ok' => true, 'deleted' => $id]);
    }
  }

  err('Not found', 404);
}

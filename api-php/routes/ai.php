<?php
/* NetWebMedia AI routes — Claude-powered agent chat + content briefs.
   Routes:
     POST /api/ai/chat                         Auth. {agent_id, message, session_id?} → Claude reply
     POST /api/ai/brief                        Auth. {topic, keywords[]} → SEO content brief
     POST /api/public/agents/chat              Public. Same as /ai/chat but keyed by agent's public_token
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function ai_anthropic_key() {
  $c = config();
  return $c['anthropic_api_key'] ?? '';
}

function ai_call_claude($systemPrompt, $userMessage, $history = [], $model = 'claude-sonnet-4-6') {
  $key = ai_anthropic_key();
  if (!$key) {
    return ['mock' => true, 'text' => "(Mock reply — ANTHROPIC_API_KEY not configured)\n\nThanks for your message: \"$userMessage\". A real Claude response would appear here once the API key is set in /home/webmed6/.netwebmedia-config.php."];
  }
  $messages = [];
  foreach ($history as $h) {
    if (!empty($h['role']) && !empty($h['content'])) $messages[] = ['role' => $h['role'], 'content' => $h['content']];
  }
  $messages[] = ['role' => 'user', 'content' => $userMessage];

  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [
    CURLOPT_POST => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-api-key: ' . $key,
      'anthropic-version: 2023-06-01',
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'model' => $model,
      'max_tokens' => 1024,
      'system' => $systemPrompt ?: 'You are a helpful assistant for NetWebMedia clients.',
      'messages' => $messages,
    ]),
    CURLOPT_TIMEOUT => 60,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $curlErr = curl_error($ch);
  curl_close($ch);
  $j = json_decode($res, true) ?: [];
  if ($curlErr) {
    error_log('ai_call_claude curl error: ' . $curlErr);
    return ['error' => 'Network error reaching Claude: ' . $curlErr, 'code' => 0];
  }
  if ($code >= 300) {
    $msg = $j['error']['message'] ?? ('Claude HTTP ' . $code);
    error_log('ai_call_claude HTTP ' . $code . ': ' . substr($res ?: '', 0, 500));
    return ['error' => $msg, 'code' => $code, 'raw' => substr($res ?: '', 0, 500)];
  }
  $text = '';
  foreach ($j['content'] ?? [] as $blk) if (($blk['type'] ?? '') === 'text') $text .= $blk['text'];
  return ['text' => $text, 'model' => $model, 'usage' => $j['usage'] ?? null];
}

function ai_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS agent_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    agent_id INT NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_session (session_id), KEY ix_agent (agent_id)
  )");
}

function ai_agent_load($id) {
  return qOne("SELECT * FROM resources WHERE id = ? AND type = 'ai_agent'", [$id]);
}

function ai_history($sessionId, $limit = 20) {
  $rows = qAll("SELECT role, content FROM agent_conversations WHERE session_id = ? ORDER BY id ASC LIMIT $limit", [$sessionId]);
  return $rows;
}

function route_ai($parts, $method) {
  ai_ensure_schema();
  $sub = $parts[0] ?? '';

  if ($sub === 'chat' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['agent_id', 'message']);
    $agent = ai_agent_load((int)$b['agent_id']);
    if (!$agent || (int)$agent['org_id'] !== (int)$u['org_id']) err('Agent not found', 404);
    $data = json_decode($agent['data'] ?: '{}', true) ?: [];
    $session = $b['session_id'] ?? bin2hex(random_bytes(16));
    $history = ai_history($session);
    qExec("INSERT INTO agent_conversations (org_id, agent_id, session_id, role, content) VALUES (?, ?, ?, 'user', ?)",
      [$u['org_id'], $agent['id'], $session, $b['message']]);
    $r = ai_call_claude($data['system_prompt'] ?? '', $b['message'], $history, $data['model'] ?? 'claude-sonnet-4-6');
    $reply = $r['text'] ?? ('Error: ' . ($r['error'] ?? 'unknown'));
    qExec("INSERT INTO agent_conversations (org_id, agent_id, session_id, role, content) VALUES (?, ?, ?, 'assistant', ?)",
      [$u['org_id'], $agent['id'], $session, $reply]);
    json_out(['session_id' => $session, 'reply' => $reply, 'mock' => !empty($r['mock'])]);
  }

  if ($sub === 'brief' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['topic']);
    $keywords = $b['keywords'] ?? [];
    $sys = 'You are an AI SEO strategist. Produce a structured content brief in JSON with keys: title_options (array of 3), target_keyword, intent, audience, outline (array of H2 sections with 2-3 bullet notes each), internal_links_suggestions, cta_suggestions, word_count_target, meta_description.';
    $prompt = "Topic: {$b['topic']}\nTarget keywords: " . (is_array($keywords) ? implode(', ', $keywords) : $keywords) . "\n\nReturn ONLY the JSON object.";
    $r = ai_call_claude($sys, $prompt, []);
    json_out(['brief' => $r['text'] ?? null, 'mock' => !empty($r['mock']), 'error' => $r['error'] ?? null]);
  }

  // Forward content subroutes
  if ($sub === 'content') {
    require_once __DIR__ . '/content.php';
    $sub_parts = array_slice($parts, 1);
    route_ai_content($sub_parts, $method);
    return;
  }

  err('Not found', 404);
}

function route_public_agent_chat($parts, $method) {
  ai_ensure_schema();
  if ($method !== 'POST') err('Method not allowed', 405);
  $b = required(['public_token', 'message']);
  $agent = qOne("SELECT * FROM resources WHERE type = 'ai_agent' AND data LIKE ?", ['%"public_token":"' . addslashes($b['public_token']) . '"%']);
  if (!$agent) err('Agent not found', 404);
  $data = json_decode($agent['data'] ?: '{}', true) ?: [];
  $session = $b['session_id'] ?? bin2hex(random_bytes(16));
  $history = ai_history($session);
  qExec("INSERT INTO agent_conversations (org_id, agent_id, session_id, role, content) VALUES (?, ?, ?, 'user', ?)",
    [$agent['org_id'], $agent['id'], $session, $b['message']]);
  $r = ai_call_claude($data['system_prompt'] ?? '', $b['message'], $history, $data['model'] ?? 'claude-sonnet-4-6');
  $reply = $r['text'] ?? ('Error: ' . ($r['error'] ?? 'unknown'));
  qExec("INSERT INTO agent_conversations (org_id, agent_id, session_id, role, content) VALUES (?, ?, ?, 'assistant', ?)",
    [$agent['org_id'], $agent['id'], $session, $reply]);
  json_out(['session_id' => $session, 'reply' => $reply, 'mock' => !empty($r['mock'])]);
}

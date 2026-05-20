<?php
/* Fractional CMO Agent API
   GET    /api/cmo/deliverables               list library (public, no auth) or list org deliverables (authed)
   POST   /api/cmo/deliverable                {type, inputs, company, context?} -> produce structured deliverable
   GET    /api/cmo/deliverables/{id}          fetch a stored deliverable
   POST   /api/cmo/chat                       {message, thread_id?, company?, context?} -> conversational reply
   GET    /api/cmo/threads/{thread_id}        message history for a thread
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/cmo.php';

function route_cmo($parts, $method) {
  cmo_ensure_schema();

  // GET /api/cmo/library (public list of deliverable types)
  if (($parts[0] ?? '') === 'library' && $method === 'GET') {
    $items = [];
    foreach (cmo_deliverable_library() as $code => $t) {
      $items[] = [
        'code' => $code,
        'name' => $t['name'],
        'icon' => $t['icon'],
        'desc' => $t['desc'],
        'required' => $t['required'],
      ];
    }
    json_out(['items' => $items]);
  }

  // GET /api/cmo/deliverables (authed — list org history)
  if (($parts[0] ?? '') === 'deliverables' && empty($parts[1]) && $method === 'GET') {
    $u = requirePaidAccess();
    $rows = qAll(
      'SELECT id, type, title, created_at FROM cmo_deliverables WHERE org_id = ? ORDER BY id DESC LIMIT 100',
      [$u['org_id']]
    );
    json_out(['items' => $rows]);
  }

  // GET /api/cmo/deliverables/{id}
  if (($parts[0] ?? '') === 'deliverables' && !empty($parts[1]) && $method === 'GET') {
    $u = requirePaidAccess();
    $row = qOne(
      'SELECT * FROM cmo_deliverables WHERE id = ? AND org_id = ?',
      [(int)$parts[1], $u['org_id']]
    );
    if (!$row) err('Not found', 404);
    $row['inputs'] = json_decode($row['inputs_json'] ?: '{}', true);
    $row['usage']  = json_decode($row['usage_json'] ?: 'null', true);
    unset($row['inputs_json'], $row['usage_json']);
    json_out($row);
  }

  // POST /api/cmo/deliverable (authed — generate new)
  if (($parts[0] ?? '') === 'deliverable' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['type', 'inputs']);
    $library = cmo_deliverable_library();
    $type = $b['type'];
    if (!isset($library[$type])) err('Unknown deliverable type', 400);

    $tpl = $library[$type];
    $inputs = is_array($b['inputs']) ? $b['inputs'] : [];
    $company = $b['company'] ?? ($inputs['company_name'] ?? '');
    $context = $b['context'] ?? [];

    // Validate required fields minimally (the rendered prompt will also flag gaps)
    $prompt = cmo_render_prompt($tpl['prompt_template'], $inputs);
    $system = cmo_system_prompt($company, $context);

    $r = cmo_call_claude($system, [['role' => 'user', 'content' => $prompt]], 3500);
    if (empty($r['ok'])) err('Agent error: ' . ($r['error'] ?? 'unknown'), 500);

    $title = $tpl['name'] . ($company ? ' — ' . $company : '') . ' · ' . date('Y-m-d');
    qExec(
      "INSERT INTO cmo_deliverables (org_id, user_id, type, title, inputs_json, output_md, usage_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [$u['org_id'], $u['id'], $type, $title, json_encode($inputs), $r['text'], json_encode($r['usage']), ]
    );
    $id = lastId();
    json_out(['ok' => true, 'id' => $id, 'title' => $title, 'output_md' => $r['text'], 'usage' => $r['usage']], 201);
  }

  // POST /api/cmo/chat
  if (($parts[0] ?? '') === 'chat' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['message']);
    $thread = $b['thread_id'] ?? ('t-' . substr(bin2hex(random_bytes(6)), 0, 10));
    $company = $b['company'] ?? '';
    $context = $b['context'] ?? [];

    // Pull last 20 messages from thread for continuity
    $hist = qAll(
      "SELECT role, content FROM cmo_messages WHERE thread_id = ? AND org_id = ? ORDER BY id DESC LIMIT 20",
      [$thread, $u['org_id']]
    );
    $hist = array_reverse($hist);

    // Save the incoming user message
    qExec(
      "INSERT INTO cmo_messages (org_id, user_id, thread_id, role, content, created_at) VALUES (?, ?, ?, 'user', ?, NOW())",
      [$u['org_id'], $u['id'], $thread, $b['message']]
    );

    // Build messages array: history + current
    $messages = [];
    foreach ($hist as $h) $messages[] = ['role' => $h['role'], 'content' => $h['content']];
    $messages[] = ['role' => 'user', 'content' => $b['message']];

    $system = cmo_system_prompt($company, $context);
    $r = cmo_call_claude($system, $messages, 2000);
    if (empty($r['ok'])) err('Agent error: ' . ($r['error'] ?? 'unknown'), 500);

    // Save assistant reply
    qExec(
      "INSERT INTO cmo_messages (org_id, user_id, thread_id, role, content, created_at) VALUES (?, ?, ?, 'assistant', ?, NOW())",
      [$u['org_id'], $u['id'], $thread, $r['text']]
    );

    json_out([
      'ok' => true,
      'thread_id' => $thread,
      'reply' => $r['text'],
      'usage' => $r['usage'],
    ]);
  }

  // GET /api/cmo/threads/{thread_id}
  if (($parts[0] ?? '') === 'threads' && !empty($parts[1]) && $method === 'GET') {
    $u = requirePaidAccess();
    $rows = qAll(
      "SELECT role, content, created_at FROM cmo_messages WHERE thread_id = ? AND org_id = ? ORDER BY id",
      [$parts[1], $u['org_id']]
    );
    json_out(['thread_id' => $parts[1], 'items' => $rows]);
  }

  err('CMO route not found', 404);
}

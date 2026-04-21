<?php
/* Workflow executor (v2 — GHL-parity expansion).
   A "workflow" is a resource of type=workflow. Its data JSON shape:
   {
     trigger: {
       type: "form_submission" | "manual" | "cron" | "deal_stage" |
             "tag_added" | "tag_removed" | "page_visit" | "appointment_booked" |
             "missed_call" | "review_posted" | "date_field" | "webhook_in",
       form_id?, stage?, tag?, page_url?, field?, days_offset?
     },
     steps: [
       { action: "send_email", to, subject, body, template? },
       { action: "send_sms",   to, body },                   // Twilio (stub)
       { action: "send_whatsapp", to, body },                // Twilio (stub)
       { action: "wait",       minutes | hours | days },
       { action: "wait_until", time_of_day, days_of_week? }, // business-hours gating
       { action: "tag",        tag },
       { action: "untag",      tag },
       { action: "update_field", field, value },
       { action: "move_stage", stage },
       { action: "create_deal", title_tpl, value },
       { action: "create_task", title_tpl, due_in_days },
       { action: "assign_user", strategy: "round_robin"|"least_loaded"|"user_id", user_id? },
       { action: "notify_team", channel: "email"|"slack", message },
       { action: "webhook",    url, payload },
       { action: "http_get",   url, save_as },
       { action: "ai_reply",   prompt_tpl, save_as },
       { action: "if",         condition: { field, op: "eq"|"neq"|"contains"|"gt"|"lt"|"exists", value },
                               then: [...steps], else?: [...steps] },
       { action: "goto_step",  step_name },
       { action: "log",        message }
     ]
   }
*/

require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/heygen.php';
require_once __DIR__ . '/vapi.php';

/* ─── Trigger matching ─────────────────────────────────────────────────── */

function wf_active_for_trigger($type, $match = []) {
  $rows = qAll("SELECT * FROM resources WHERE type='workflow' AND status='active'");
  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'], true) ?: [];
    $t = $d['trigger'] ?? [];
    if (($t['type'] ?? '') !== $type) continue;
    $ok = true;
    foreach ($match as $k => $v) {
      if (isset($t[$k]) && strtolower($t[$k]) !== strtolower($v)) { $ok = false; break; }
    }
    if ($ok) $out[] = $r;
  }
  return $out;
}

function wf_trigger_registry() {
  return [
    'form_submission'    => 'When a form is submitted',
    'manual'             => 'Manual run / API call',
    'cron'               => 'Scheduled (daily / weekly)',
    'deal_stage'         => 'Deal stage changes',
    'tag_added'          => 'Tag added to contact',
    'tag_removed'        => 'Tag removed from contact',
    'page_visit'         => 'Pixel-tracked page visit',
    'appointment_booked' => 'Appointment booked',
    'appointment_noshow' => 'Appointment no-show',
    'missed_call'        => 'Missed call (Twilio)',
    'review_posted'      => 'Review posted (Google / platform)',
    'date_field'         => 'Date field reached (birthday, renewal)',
    'webhook_in'         => 'Inbound webhook',
  ];
}

function wf_action_registry() {
  return [
    'send_email'     => 'Send email',
    'send_sms'       => 'Send SMS (Twilio)',
    'send_whatsapp'  => 'Send WhatsApp (Twilio)',
    'wait'           => 'Wait N minutes / hours / days',
    'wait_until'     => 'Wait until next business hour',
    'tag'            => 'Add tag',
    'untag'          => 'Remove tag',
    'update_field'   => 'Update contact field',
    'move_stage'     => 'Move deal to stage',
    'create_deal'    => 'Create deal',
    'create_task'    => 'Create task',
    'assign_user'    => 'Assign owner (round-robin)',
    'notify_team'    => 'Notify team (email / Slack)',
    'webhook'        => 'POST to webhook',
    'http_get'       => 'Fetch URL, save response',
    'ai_reply'       => 'Claude-generated message',
    'if'             => 'If/else branch',
    'goto_step'      => 'Jump to named step',
    'log'            => 'Log message',
    'heygen_video'   => 'Generate HeyGen avatar video',
    'vapi_call'      => 'Make outbound AI voice call (Vapi)',
  ];
}

/* ─── Queueing ─────────────────────────────────────────────────────────── */

function wf_enqueue($workflow_id, $org_id, $context) {
  qExec(
    'INSERT INTO workflow_runs (workflow_id, org_id, status, step_index, context_json, next_run_at, created_at, updated_at)
     VALUES (?, ?, "pending", 0, ?, NOW(), NOW(), NOW())',
    [$workflow_id, $org_id, json_encode($context)]
  );
  return lastId();
}

/* ─── Action implementations ───────────────────────────────────────────── */

function wf_resolve_to($to, $ctx) {
  $cfg = config();
  if ($to === 'admin')  return 'admin@' . parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST);
  if ($to === 'submitter' || $to === 'contact.email') return $ctx['email'] ?? ($ctx['contact']['email'] ?? null);
  if (filter_var($to, FILTER_VALIDATE_EMAIL)) return $to;
  return render_template($to, $ctx);
}

function wf_step_send_email($step, $ctx) {
  $subject = render_template($step['subject'] ?? '(no subject)', $ctx);
  $body_inner = render_template($step['body'] ?? '<p>(empty)</p>', $ctx);
  $html = email_shell($subject, $body_inner);
  $resolved = wf_resolve_to($step['to'] ?? 'admin', $ctx);
  if (!filter_var($resolved, FILTER_VALIDATE_EMAIL)) return ['ok' => false, 'reason' => 'bad_recipient', 'to' => $resolved];
  $ok = send_mail($resolved, $subject, $html);
  return ['ok' => $ok, 'to' => $resolved, 'subject' => $subject];
}

function wf_step_send_sms($step, $ctx) {
  // Twilio not wired yet — stub that logs the intent.
  $cfg = config();
  if (empty($cfg['twilio_sid'])) {
    return ['ok' => true, 'stubbed' => true, 'reason' => 'twilio_not_configured',
            'to' => render_template($step['to'] ?? '', $ctx),
            'body' => render_template($step['body'] ?? '', $ctx)];
  }
  $to   = html_entity_decode(render_template($step['to'] ?? '', $ctx), ENT_QUOTES, 'UTF-8');
  $body = html_entity_decode(render_template($step['body'] ?? '', $ctx), ENT_QUOTES, 'UTF-8');
  $ch = curl_init('https://api.twilio.com/2010-04-01/Accounts/' . $cfg['twilio_sid'] . '/Messages.json');
  curl_setopt_array($ch, [
    CURLOPT_USERPWD => $cfg['twilio_sid'] . ':' . $cfg['twilio_token'],
    CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 10,
    CURLOPT_POSTFIELDS => http_build_query(['To'=>$to, 'From'=>$cfg['twilio_from'] ?? '', 'Body'=>$body]),
  ]);
  $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ['ok' => $code >= 200 && $code < 300, 'http' => $code, 'to' => $to];
}

function wf_step_send_whatsapp($step, $ctx) {
  // Same as SMS but with whatsapp: prefix. Stubbed if no Twilio.
  $step['to']   = 'whatsapp:' . render_template($step['to'] ?? '', $ctx);
  return wf_step_send_sms($step, $ctx);
}

function wf_step_webhook($step, $ctx) {
  $url = render_template($step['url'] ?? '', $ctx);
  if (!filter_var($url, FILTER_VALIDATE_URL)) return ['ok' => false, 'reason' => 'bad_url'];
  $payload = json_encode($step['payload'] ?? $ctx);
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload, CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  ]);
  $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ['ok' => $code >= 200 && $code < 300, 'http' => $code, 'resp' => substr($resp ?: '', 0, 400)];
}

function wf_step_http_get($step, $ctx, &$ctxRef) {
  $url = render_template($step['url'] ?? '', $ctx);
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>10, CURLOPT_FOLLOWLOCATION=>1]);
  $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if (!empty($step['save_as'])) $ctxRef[$step['save_as']] = substr($resp ?: '', 0, 5000);
  return ['ok' => $code >= 200 && $code < 300, 'http' => $code, 'size' => strlen($resp ?: '')];
}

function wf_step_create_deal($step, $ctx, $org_id) {
  $title = render_template($step['title_tpl'] ?? 'New deal', $ctx);
  $value = $step['value'] ?? 0;
  $slug  = 'auto-' . substr(bin2hex(random_bytes(4)), 0, 8);
  $data  = ['title' => $title, 'value' => $value, 'stage' => 'New Lead', 'probability' => 10, 'auto' => true, 'source' => $ctx];
  qExec(
    'INSERT INTO resources (org_id, type, slug, title, status, data, owner_id, created_at, updated_at)
     VALUES (?, "deal", ?, ?, "new_lead", ?, NULL, NOW(), NOW())',
    [$org_id, $slug, $title, json_encode($data)]
  );
  return ['ok' => true, 'deal_id' => lastId(), 'slug' => $slug];
}

function wf_step_create_task($step, $ctx, $org_id) {
  $title = render_template($step['title_tpl'] ?? 'Follow up', $ctx);
  $due_days = (int)($step['due_in_days'] ?? 1);
  $slug  = 'task-' . substr(bin2hex(random_bytes(4)), 0, 8);
  $data  = ['title'=>$title, 'due_at'=>date('c', time() + $due_days*86400), 'source'=>$ctx];
  qExec(
    'INSERT INTO resources (org_id, type, slug, title, status, data, created_at, updated_at)
     VALUES (?, "task", ?, ?, "open", ?, NOW(), NOW())',
    [$org_id, $slug, $title, json_encode($data)]
  );
  return ['ok' => true, 'task_id' => lastId()];
}

function wf_step_tag($step, $ctx, $org_id, $remove = false) {
  $tag = $step['tag'] ?? '';
  if (!$tag) return ['ok' => false, 'reason' => 'no_tag'];
  $email = $ctx['email'] ?? ($ctx['contact']['email'] ?? null);
  if (!$email) return ['ok' => false, 'reason' => 'no_contact_email_in_ctx'];
  $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND org_id=? AND JSON_EXTRACT(data,'$.email')=? LIMIT 1", [$org_id, $email]);
  if (!$c) return ['ok' => false, 'reason' => 'contact_not_found'];
  $d = json_decode($c['data'], true) ?: [];
  $tags = $d['tags'] ?? [];
  if ($remove) { $tags = array_values(array_filter($tags, fn($t) => $t !== $tag)); }
  else { if (!in_array($tag, $tags)) $tags[] = $tag; }
  $d['tags'] = $tags;
  qExec('UPDATE resources SET data=?, updated_at=NOW() WHERE id=?', [json_encode($d), $c['id']]);
  return ['ok' => true, 'contact_id' => $c['id'], 'tags' => $tags];
}

function wf_step_update_field($step, $ctx, $org_id) {
  $field = $step['field'] ?? '';
  if (!$field) return ['ok' => false, 'reason' => 'no_field'];
  $value = render_template((string)($step['value'] ?? ''), $ctx);
  $email = $ctx['email'] ?? ($ctx['contact']['email'] ?? null);
  if (!$email) return ['ok' => false, 'reason' => 'no_contact_email'];
  $c = qOne("SELECT id, data FROM resources WHERE type='contact' AND org_id=? AND JSON_EXTRACT(data,'$.email')=? LIMIT 1", [$org_id, $email]);
  if (!$c) return ['ok' => false, 'reason' => 'contact_not_found'];
  $d = json_decode($c['data'], true) ?: [];
  $d[$field] = $value;
  qExec('UPDATE resources SET data=?, updated_at=NOW() WHERE id=?', [json_encode($d), $c['id']]);
  return ['ok' => true, 'field' => $field, 'value' => $value];
}

function wf_step_move_stage($step, $ctx, $org_id) {
  $stage = $step['stage'] ?? '';
  $deal_id = $ctx['deal_id'] ?? null;
  if (!$deal_id || !$stage) return ['ok' => false, 'reason' => 'no_deal_or_stage'];
  qExec("UPDATE resources SET status=?, data=JSON_SET(data, '$.stage', ?), updated_at=NOW() WHERE id=? AND org_id=? AND type='deal'",
        [strtolower(str_replace(' ','_',$stage)), $stage, $deal_id, $org_id]);
  return ['ok' => true, 'deal_id' => $deal_id, 'stage' => $stage];
}

function wf_step_assign_user($step, $ctx, $org_id) {
  $strategy = $step['strategy'] ?? 'round_robin';
  $users = qAll("SELECT id FROM users WHERE org_id = ? ORDER BY id", [$org_id]);
  if (!$users) return ['ok' => false, 'reason' => 'no_users'];
  $chosen = null;
  if ($strategy === 'user_id' && !empty($step['user_id'])) {
    $chosen = (int)$step['user_id'];
  } elseif ($strategy === 'least_loaded') {
    // Pick user with fewest open deals
    $best = null; $bestCount = PHP_INT_MAX;
    foreach ($users as $u) {
      $n = (int) qVal("SELECT COUNT(*) FROM resources WHERE type='deal' AND owner_id=? AND status NOT IN ('closed_won','closed_lost')", [$u['id']]);
      if ($n < $bestCount) { $bestCount = $n; $best = $u['id']; }
    }
    $chosen = $best;
  } else {
    // round robin by time
    $chosen = $users[((int)(time()/60)) % count($users)]['id'];
  }
  if (!empty($ctx['deal_id'])) {
    qExec('UPDATE resources SET owner_id=?, updated_at=NOW() WHERE id=?', [$chosen, $ctx['deal_id']]);
  }
  return ['ok' => true, 'assigned_user_id' => $chosen, 'strategy' => $strategy];
}

function wf_step_notify_team($step, $ctx, $org_id) {
  $channel = $step['channel'] ?? 'email';
  $msg = render_template($step['message'] ?? '', $ctx);
  if ($channel === 'slack') {
    $cfg = config();
    if (empty($cfg['slack_webhook'])) return ['ok' => true, 'stubbed' => true, 'msg' => $msg];
    $ch = curl_init($cfg['slack_webhook']);
    curl_setopt_array($ch, [
      CURLOPT_POST=>1, CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>10,
      CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
      CURLOPT_POSTFIELDS=>json_encode(['text'=>$msg]),
    ]);
    $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['ok' => $code === 200, 'http' => $code];
  }
  // email to all users of the org
  $users = qAll("SELECT email FROM users WHERE org_id = ?", [$org_id]);
  $sent = 0;
  foreach ($users as $u) { if (send_mail($u['email'], 'NWM Notification', email_shell('NWM Notification', '<p>'.htmlspecialchars($msg).'</p>'))) $sent++; }
  return ['ok' => true, 'emailed' => $sent, 'msg' => $msg];
}

function wf_step_ai_reply($step, $ctx, &$ctxRef) {
  $cfg = config();
  $key = $cfg['anthropic_api_key'] ?? '';
  if (!$key) return ['ok' => false, 'reason' => 'no_anthropic_key'];
  $prompt = render_template($step['prompt_tpl'] ?? '', $ctx);
  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [
    CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-api-key: ' . $key,
      'anthropic-version: 2023-06-01',
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'model' => 'claude-sonnet-4-6',
      'max_tokens' => 600,
      'messages' => [['role'=>'user','content'=>$prompt]],
    ]),
  ]);
  $resp = curl_exec($ch); curl_close($ch);
  $j = json_decode($resp, true);
  $text = $j['content'][0]['text'] ?? '';
  if (!empty($step['save_as'])) $ctxRef[$step['save_as']] = $text;
  return ['ok' => (bool)$text, 'chars' => strlen($text)];
}

/* ─── Expression / condition eval ──────────────────────────────────────── */

function wf_eval_condition($cond, $ctx) {
  $field = $cond['field'] ?? '';
  $op    = $cond['op'] ?? 'eq';
  $val   = $cond['value'] ?? null;
  $have  = wf_ctx_get($ctx, $field);
  switch ($op) {
    case 'eq':       return (string)$have === (string)$val;
    case 'neq':      return (string)$have !== (string)$val;
    case 'contains': return is_string($have) && strpos($have, (string)$val) !== false;
    case 'gt':       return is_numeric($have) && (float)$have >  (float)$val;
    case 'lt':       return is_numeric($have) && (float)$have <  (float)$val;
    case 'exists':   return !empty($have);
    case 'empty':    return empty($have);
    default:         return false;
  }
}

function wf_ctx_get($ctx, $path) {
  $parts = explode('.', $path);
  $cur = $ctx;
  foreach ($parts as $p) {
    if (is_array($cur) && array_key_exists($p, $cur)) $cur = $cur[$p];
    else return null;
  }
  return $cur;
}

/* ─── HeyGen video step ─────────────────────────────────────────────────── */

function wf_step_heygen_video($step, $ctx) {
  $avatar_id = $step['avatar_id'] ?? (config()['heygen_default_avatar'] ?? '');
  $voice_id  = $step['voice_id']  ?? 'en-US-Matthew';
  $script    = render_template($step['script'] ?? '', $ctx);
  $dimension = $step['dimension'] ?? ['width' => 720, 'height' => 1280]; // 9:16 Reels default

  if (!$avatar_id) return ['ok' => false, 'reason' => 'no avatar_id and heygen_default_avatar not set'];
  if (!$script)    return ['ok' => false, 'reason' => 'empty script'];

  $res = heygen_create_video($avatar_id, $script, $voice_id, $dimension);
  if (!empty($res['error']))  return ['ok' => false, 'reason' => $res['error']];
  if (!empty($res['data']['video_id'])) {
    return ['ok' => true, 'video_id' => $res['data']['video_id'], 'status' => 'processing'];
  }
  return ['ok' => false, 'reason' => 'unexpected HeyGen response', 'resp' => $res];
}

/* ─── Vapi call step ─────────────────────────────────────────────────────── */

function wf_step_vapi_call($step, $ctx) {
  $phone        = render_template($step['to'] ?? ($ctx['phone'] ?? ''), $ctx);
  $assistant_id = $step['assistant_id'] ?? null;

  if (!$phone) return ['ok' => false, 'reason' => 'no phone number in context or step.to'];

  $res = vapi_call($phone, $assistant_id);
  if (!empty($res['error'])) return ['ok' => false, 'reason' => $res['error']];
  return ['ok' => true, 'call_id' => $res['id'] ?? null, 'status' => $res['status'] ?? 'queued'];
}

/* ─── Main executor ────────────────────────────────────────────────────────── */

function wf_run_step($step, &$ctx, $org_id) {
  $action = $step['action'] ?? '';
  switch ($action) {
    case 'send_email':    return wf_step_send_email($step, $ctx);
    case 'send_sms':      return wf_step_send_sms($step, $ctx);
    case 'send_whatsapp': return wf_step_send_whatsapp($step, $ctx);
    case 'webhook':       return wf_step_webhook($step, $ctx);
    case 'http_get':      return wf_step_http_get($step, $ctx, $ctx);
    case 'create_deal':   return wf_step_create_deal($step, $ctx, $org_id);
    case 'create_task':   return wf_step_create_task($step, $ctx, $org_id);
    case 'tag':           return wf_step_tag($step, $ctx, $org_id, false);
    case 'untag':         return wf_step_tag($step, $ctx, $org_id, true);
    case 'update_field':  return wf_step_update_field($step, $ctx, $org_id);
    case 'move_stage':    return wf_step_move_stage($step, $ctx, $org_id);
    case 'assign_user':   return wf_step_assign_user($step, $ctx, $org_id);
    case 'notify_team':   return wf_step_notify_team($step, $ctx, $org_id);
    case 'ai_reply':      return wf_step_ai_reply($step, $ctx, $ctx);
    case 'log':           return ['ok' => true, 'msg' => render_template($step['message'] ?? '', $ctx)];
    case 'heygen_video':  return wf_step_heygen_video($step, $ctx);
    case 'vapi_call':     return wf_step_vapi_call($step, $ctx);
    case 'wait':
      $mins = (int)($step['minutes'] ?? 0)
            + (int)($step['hours']   ?? 0) * 60
            + (int)($step['days']    ?? 0) * 1440;
      return ['ok' => true, 'wait_minutes' => $mins];
    case 'wait_until':
      // Wait until next occurrence of time_of_day (HH:MM) on allowed days_of_week (array 0-6, default M-F)
      $tod = $step['time_of_day'] ?? '09:00';
      $days = $step['days_of_week'] ?? [1,2,3,4,5];
      $now = new DateTime('now');
      $tgt = DateTime::createFromFormat('H:i', $tod);
      if (!$tgt) $tgt = new DateTime('09:00');
      $tgt->setDate((int)$now->format('Y'), (int)$now->format('m'), (int)$now->format('d'));
      for ($i = 0; $i < 8; $i++) {
        if ($tgt > $now && in_array((int)$tgt->format('w'), $days)) break;
        $tgt->modify('+1 day');
      }
      $diff = max(0, ($tgt->getTimestamp() - $now->getTimestamp()) / 60);
      return ['ok' => true, 'wait_minutes' => (int)$diff];
    case 'if':
      $pass = wf_eval_condition($step['condition'] ?? [], $ctx);
      $branch = $pass ? ($step['then'] ?? []) : ($step['else'] ?? []);
      foreach ($branch as $sub) {
        $r = wf_run_step($sub, $ctx, $org_id);
        if (isset($r['wait_minutes']) && $r['wait_minutes'] > 0) return $r; // propagate wait
      }
      return ['ok' => true, 'branch' => $pass ? 'then' : 'else'];
    default:
      return ['ok' => false, 'reason' => 'unknown_action', 'action' => $action];
  }
}

function wf_advance($run) {
  $wf = qOne('SELECT * FROM resources WHERE id = ?', [$run['workflow_id']]);
  if (!$wf) {
    qExec('UPDATE workflow_runs SET status="failed", error=?, updated_at=NOW() WHERE id=?', ['workflow missing', $run['id']]);
    return;
  }
  $def = json_decode($wf['data'], true) ?: [];
  $steps = $def['steps'] ?? [];
  $ctx = json_decode($run['context_json'], true) ?: [];
  $idx = (int)$run['step_index'];

  while ($idx < count($steps)) {
    $step = $steps[$idx];
    $res = wf_run_step($step, $ctx, $run['org_id']);

    qExec(
      'INSERT INTO workflow_step_log (run_id, step_index, action, result_json, created_at) VALUES (?, ?, ?, ?, NOW())',
      [$run['id'], $idx, $step['action'] ?? '?', json_encode($res)]
    );

    /* Wait step → schedule next_run_at and leave pending. Applies to wait + wait_until + nested wait inside if. */
    if (!empty($res['wait_minutes'])) {
      qExec(
        'UPDATE workflow_runs SET step_index=?, context_json=?, next_run_at=DATE_ADD(NOW(), INTERVAL ? MINUTE), updated_at=NOW() WHERE id=?',
        [$idx + 1, json_encode($ctx), (int)$res['wait_minutes'], $run['id']]
      );
      return;
    }

    $idx++;
  }

  qExec('UPDATE workflow_runs SET status="completed", step_index=?, context_json=?, next_run_at=NULL, updated_at=NOW() WHERE id=?',
        [$idx, json_encode($ctx), $run['id']]);
}

function wf_trigger($type, $match, $context, $org_id) {
  $workflows = wf_active_for_trigger($type, $match);
  $out = [];
  foreach ($workflows as $wf) {
    $run_id = wf_enqueue($wf['id'], $org_id, $context);
    $run = qOne('SELECT * FROM workflow_runs WHERE id = ?', [$run_id]);
    wf_advance($run);
    $out[] = ['workflow_id' => $wf['id'], 'run_id' => $run_id, 'title' => $wf['title']];
  }
  return $out;
}

function wf_run_pending() {
  $rows = qAll('SELECT * FROM workflow_runs WHERE status="pending" AND (next_run_at IS NULL OR next_run_at <= NOW()) ORDER BY id LIMIT 50');
  foreach ($rows as $r) wf_advance($r);
  return count($rows);
}

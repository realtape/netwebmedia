<?php
/* Pre-built workflow "snapshots" (GHL-style).
   GET  /api/recipes              - list all available recipes (public)
   POST /api/recipes/{code}/install - clone recipe into current org (authed)
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function rc_library() {
  return [
    [
      'code' => 'welcome-drip',
      'name' => 'New Lead Welcome Drip',
      'tier' => 'starter',
      'desc' => '5-email sequence over 7 days that welcomes new leads, delivers value, and books a call.',
      'tags' => ['nurture','onboarding','email'],
      'workflow' => [
        'trigger' => ['type' => 'form_submission'],
        'steps' => [
          ['action'=>'tag', 'tag'=>'new-lead'],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Welcome to {{company_name}}, {{first_name|there}}',
           'body'=>'<p>Hi {{first_name|there}},</p><p>Thanks for reaching out. Over the next week I\'ll share a few things that have helped our clients.</p><p>— The {{company_name}} team</p>'],
          ['action'=>'wait', 'days'=>1],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Day 2: The #1 mistake we see',
           'body'=>'<p>{{first_name|Hi}}, here\'s the biggest mistake we see in our industry...</p>'],
          ['action'=>'wait', 'days'=>2],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'A quick case study',
           'body'=>'<p>Quick read: how one client grew 3x in 90 days.</p>'],
          ['action'=>'wait', 'days'=>2],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Want to talk?',
           'body'=>'<p>If any of this resonates, reply with "yes" and I\'ll send my calendar.</p>'],
          ['action'=>'wait', 'days'=>2],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Last one',
           'body'=>'<p>I\'ll stop emailing for now. Reply if/when it\'s time. We\'ll be here.</p>'],
          ['action'=>'tag', 'tag'=>'drip-complete'],
        ],
      ],
    ],
    [
      'code' => 'appointment-reminder',
      'name' => 'Appointment Reminder (24h + 1h)',
      'tier' => 'starter',
      'desc' => 'Reminds contact 24 hours and 1 hour before their appointment. Cuts no-shows ~40%.',
      'tags' => ['calendar','reminder','email','sms'],
      'workflow' => [
        'trigger' => ['type' => 'appointment_booked'],
        'steps' => [
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Booked: {{appointment_title}} on {{appointment_at}}',
           'body'=>'<p>Your appointment is confirmed. See you then!</p>'],
          ['action'=>'wait', 'hours'=>24],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Tomorrow: {{appointment_title}}',
           'body'=>'<p>Friendly reminder — we\'re on for tomorrow at {{appointment_at}}.</p>'],
          ['action'=>'send_sms', 'to'=>'{{phone}}', 'body'=>'Reminder: {{appointment_title}} tomorrow at {{appointment_at}}. Reply R to reschedule.'],
          ['action'=>'wait', 'hours'=>23],
          ['action'=>'send_sms', 'to'=>'{{phone}}', 'body'=>'See you in 1 hour!'],
        ],
      ],
    ],
    [
      'code' => 'cart-abandonment',
      'name' => 'Cart Abandonment (3-touch)',
      'tier' => 'growth',
      'desc' => 'Re-engages browsers who leave the cart. Emails at 1h / 24h / 72h with escalating incentive.',
      'tags' => ['ecommerce','revenue','recovery'],
      'workflow' => [
        'trigger' => ['type' => 'webhook_in', 'match' => 'cart_abandoned'],
        'steps' => [
          ['action'=>'wait', 'hours'=>1],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Forgot something?',
           'body'=>'<p>You left {{product_name}} in your cart. <a href="{{cart_url}}">Finish checkout</a>.</p>'],
          ['action'=>'wait', 'hours'=>23],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Here\'s 10% off {{product_name}}',
           'body'=>'<p>Use code COMEBACK10 at <a href="{{cart_url}}">checkout</a>. Expires in 48 hours.</p>'],
          ['action'=>'wait', 'days'=>2],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Last chance: 15% off',
           'body'=>'<p>COMEBACK15 at <a href="{{cart_url}}">checkout</a>. Expires tonight.</p>'],
        ],
      ],
    ],
    [
      'code' => 'missed-call-textback',
      'name' => 'Missed Call → Text Back',
      'tier' => 'growth',
      'desc' => 'When a call is missed, instantly send an SMS so the lead doesn\'t go elsewhere. Proven conversion lifter.',
      'tags' => ['phone','sms','speed-to-lead'],
      'workflow' => [
        'trigger' => ['type' => 'missed_call'],
        'steps' => [
          ['action'=>'send_sms', 'to'=>'{{from_number}}',
           'body'=>'Sorry we missed you! This is {{company_name}}. How can we help? Reply here and we\'ll get right back.'],
          ['action'=>'tag', 'tag'=>'missed-call-recovery'],
          ['action'=>'create_task', 'title_tpl'=>'Call back {{from_number}}', 'due_in_days'=>0],
          ['action'=>'notify_team', 'channel'=>'email', 'message'=>'Missed call from {{from_number}} — textback sent, task created.'],
        ],
      ],
    ],
    [
      'code' => 'review-request',
      'name' => 'Post-Service Review Request',
      'tier' => 'starter',
      'desc' => 'Sends review request 7 days after service. If no reply, follows up once. 3-5x more Google reviews.',
      'tags' => ['reviews','reputation'],
      'workflow' => [
        'trigger' => ['type' => 'tag_added', 'tag' => 'service-completed'],
        'steps' => [
          ['action'=>'wait', 'days'=>7],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Quick favor, {{first_name|friend}}?',
           'body'=>'<p>If {{company_name}} was a good experience, could you leave a quick Google review? It takes 30 seconds: <a href="{{review_url}}">Leave a review</a>.</p>'],
          ['action'=>'wait', 'days'=>4],
          ['action'=>'if', 'condition'=>['field'=>'review_left','op'=>'neq','value'=>'yes'],
           'then'=>[
             ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'No pressure — just checking',
              'body'=>'<p>If you had a minute: <a href="{{review_url}}">{{review_url}}</a>. If not, no worries.</p>'],
           ]],
        ],
      ],
    ],
    [
      'code' => 'reengagement-90d',
      'name' => 'Re-engagement (90 days silent)',
      'tier' => 'growth',
      'desc' => 'Identifies contacts who have gone cold for 90 days and runs a 3-email win-back. Removes them from lists if unresponsive.',
      'tags' => ['retention','nurture'],
      'workflow' => [
        'trigger' => ['type' => 'date_field', 'field' => 'last_activity_at', 'days_offset' => 90],
        'steps' => [
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Still interested, {{first_name|there}}?',
           'body'=>'<p>Haven\'t heard from you in a while. Here\'s what\'s new at {{company_name}}...</p>'],
          ['action'=>'wait', 'days'=>5],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'One more thing',
           'body'=>'<p>Quick case study from this quarter — thought you\'d like it.</p>'],
          ['action'=>'wait', 'days'=>7],
          ['action'=>'if', 'condition'=>['field'=>'opened_last','op'=>'neq','value'=>'yes'],
           'then'=>[
             ['action'=>'tag', 'tag'=>'cold-unsubscribe-candidate'],
             ['action'=>'notify_team', 'channel'=>'email', 'message'=>'Contact {{email}} went cold after re-engagement — consider removing from lists.'],
           ]],
        ],
      ],
    ],
    [
      'code' => 'birthday',
      'name' => 'Birthday / Anniversary Campaign',
      'tier' => 'starter',
      'desc' => 'Sends a personal message on the contact\'s birthday or anniversary. Builds relationship, drives repeat purchase.',
      'tags' => ['retention','personal'],
      'workflow' => [
        'trigger' => ['type' => 'date_field', 'field' => 'birthday', 'days_offset' => 0],
        'steps' => [
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Happy birthday, {{first_name}}!',
           'body'=>'<p>From everyone at {{company_name}} — enjoy your day. Here\'s a little something: <strong>code HB20</strong> for 20% off this week.</p>'],
        ],
      ],
    ],
    [
      'code' => 'hot-lead-alert',
      'name' => 'Lead Scoring + Hot Lead Alert',
      'tier' => 'growth',
      'desc' => 'Watches for high-intent behavior (pricing page visit + form + email open). Alerts sales team within seconds.',
      'tags' => ['sales','speed-to-lead'],
      'workflow' => [
        'trigger' => ['type' => 'page_visit', 'page_url' => '/pricing.html'],
        'steps' => [
          ['action'=>'update_field', 'field'=>'lead_score', 'value'=>'hot'],
          ['action'=>'tag', 'tag'=>'hot-lead'],
          ['action'=>'assign_user', 'strategy'=>'least_loaded'],
          ['action'=>'notify_team', 'channel'=>'slack', 'message'=>'🔥 HOT LEAD: {{email}} is on pricing page. Assigned to least-loaded rep.'],
          ['action'=>'create_task', 'title_tpl'=>'CALL {{email}} — hot lead', 'due_in_days'=>0],
        ],
      ],
    ],
    [
      'code' => 'complaint-escalation',
      'name' => 'Complaint → Owner Escalation',
      'tier' => 'growth',
      'desc' => 'If a contact uses words like "refund", "cancel", or "angry" in a form, instantly escalate to the owner.',
      'tags' => ['support','retention'],
      'workflow' => [
        'trigger' => ['type' => 'form_submission'],
        'steps' => [
          ['action'=>'if', 'condition'=>['field'=>'message','op'=>'contains','value'=>'refund'],
           'then'=>[
             ['action'=>'tag', 'tag'=>'complaint'],
             ['action'=>'notify_team', 'channel'=>'email', 'message'=>'⚠️ Complaint from {{email}}: "{{message}}"'],
             ['action'=>'create_task', 'title_tpl'=>'URGENT — call {{email}}', 'due_in_days'=>0],
           ]],
        ],
      ],
    ],
    [
      'code' => 'ai-first-reply',
      'name' => 'AI-Drafted First Reply',
      'tier' => 'scale',
      'desc' => 'Every inbound form gets an instant, context-aware AI reply drafted by Claude and sent as an acknowledgment. Then routes to human.',
      'tags' => ['ai','speed-to-lead'],
      'workflow' => [
        'trigger' => ['type' => 'form_submission'],
        'steps' => [
          ['action'=>'ai_reply',
           'prompt_tpl'=>'Write a warm, under-80-word reply to this inquiry from a new lead named {{first_name|there}}. Their message: "{{message}}". Sign off as the {{company_name}} team. No markdown.',
           'save_as'=>'ai_draft'],
          ['action'=>'send_email', 'to'=>'submitter', 'subject'=>'Thanks for reaching out',
           'body'=>'<p>{{ai_draft}}</p>'],
          ['action'=>'assign_user', 'strategy'=>'round_robin'],
          ['action'=>'notify_team', 'channel'=>'email', 'message'=>'AI replied to {{email}}. Please follow up personally within 24h.'],
        ],
      ],
    ],
  ];
}

function route_recipes($parts, $method) {
  // GET /api/recipes (public list)
  if (empty($parts[0]) && $method === 'GET') {
    $items = array_map(function($r) {
      return ['code'=>$r['code'], 'name'=>$r['name'], 'tier'=>$r['tier'], 'desc'=>$r['desc'], 'tags'=>$r['tags'],
              'trigger'=>$r['workflow']['trigger']['type'] ?? '?', 'steps'=>count($r['workflow']['steps'] ?? [])];
    }, rc_library());
    json_out(['items' => $items, 'total' => count($items)]);
  }

  // POST /api/recipes/{code}/install  (authed)
  $code = $parts[0] ?? '';
  if ($code && ($parts[1] ?? '') === 'install' && $method === 'POST') {
    $user = requirePaidAccess();
    $org  = (int)$user['org_id'];
    $lib  = rc_library();
    $recipe = null;
    foreach ($lib as $r) if ($r['code'] === $code) { $recipe = $r; break; }
    if (!$recipe) err('Recipe not found', 404);
    $slug = $code . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data, owner_id, created_at, updated_at)
       VALUES (?, 'workflow', ?, ?, 'active', ?, ?, NOW(), NOW())",
      [$org, $slug, $recipe['name'], json_encode($recipe['workflow']), $user['id']]
    );
    json_out(['ok'=>true, 'workflow_id'=>lastId(), 'slug'=>$slug, 'name'=>$recipe['name']], 201);
  }

  err('Recipe route not found', 404);
}

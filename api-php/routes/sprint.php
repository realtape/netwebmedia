<?php
/* Sprint admin route — 30-Day Founding Client Sprint (May 5–Jun 4, 2026)
 * GET  /api/sprint/webinar-subs         — list webinar registrations
 * GET  /api/sprint/webinar-subs/stats   — aggregate stats by niche / utm_source
 * GET  /api/sprint/summary              — top-line sprint metrics
 *
 * Auth: requires admin token (X-Auth-Token: <nwm_token>).
 */
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function route_sprint($parts, $method) {
  $u = requireUser(); // admin auth

  $sub = $parts[0] ?? '';
  $sub2 = $parts[1] ?? '';

  if ($method === 'GET' && $sub === 'webinar-subs' && $sub2 === '') {
    return sprint_webinar_list();
  }
  if ($method === 'GET' && $sub === 'webinar-subs' && $sub2 === 'stats') {
    return sprint_webinar_stats();
  }
  if ($method === 'GET' && $sub === 'summary') {
    return sprint_summary();
  }
  err('Sprint route not found', 404);
}

/* The form_id slug used by /lp/webinar-ai-marketing-system.html. */
function sprint_webinar_form_slug() {
  return 'webinar-ai-marketing-system';
}

function sprint_webinar_form_id() {
  $slug = sprint_webinar_form_slug();
  $row = qOne("SELECT id FROM resources WHERE type='form' AND slug = ? LIMIT 1", [$slug]);
  return $row ? (int)$row['id'] : 0;
}

function sprint_webinar_list() {
  $formId = sprint_webinar_form_id();
  if (!$formId) {
    json_out(['ok' => true, 'submissions' => [], 'note' => 'No webinar form created yet — first registration will auto-create it.']);
    return;
  }
  $limit = max(1, min(500, (int)($_GET['limit'] ?? 200)));
  $rows = qAll(
    "SELECT id, data, ip, created_at FROM form_submissions WHERE form_id = ? ORDER BY id DESC LIMIT $limit",
    [$formId]
  );
  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    $out[] = [
      'id'           => (int)$r['id'],
      'name'         => $d['name'] ?? '',
      'email'        => $d['email'] ?? '',
      'company'      => $d['company'] ?? '',
      'niche'        => $d['niche'] ?? '',
      'utm_source'   => $d['utm_source'] ?? '',
      'utm_campaign' => $d['utm_campaign'] ?? '',
      'utm_medium'   => $d['utm_medium'] ?? '',
      'utm_content'  => $d['utm_content'] ?? '',
      'referrer'     => $d['referrer'] ?? '',
      'webinar'      => $d['webinar'] ?? '',
      'created_at'   => $r['created_at'],
      'ip'           => $r['ip'] ?? ''
    ];
  }
  json_out(['ok' => true, 'submissions' => $out, 'total' => count($out)]);
}

function sprint_webinar_stats() {
  $formId = sprint_webinar_form_id();
  $byNiche = []; $bySource = []; $byDay = []; $total = 0;
  if ($formId) {
    $rows = qAll(
      "SELECT data, DATE(created_at) AS d FROM form_submissions WHERE form_id = ?",
      [$formId]
    );
    $total = count($rows);
    foreach ($rows as $r) {
      $d = json_decode($r['data'] ?? '{}', true) ?: [];
      $n = $d['niche'] ?: 'unspecified';
      $s = $d['utm_source'] ?: 'direct';
      $byNiche[$n] = ($byNiche[$n] ?? 0) + 1;
      $bySource[$s] = ($bySource[$s] ?? 0) + 1;
      $day = $r['d'];
      $byDay[$day] = ($byDay[$day] ?? 0) + 1;
    }
  }

  // Sprint targets (from marketing-plan.html)
  $targets = ['bear' => 20, 'base' => 50, 'bull' => 100];
  ksort($byDay);

  json_out([
    'ok'        => true,
    'period'    => 'May 5–Jun 4, 2026',
    'total'     => $total,
    'targets'   => $targets,
    'progress_pct' => $targets['base'] > 0 ? round(($total / $targets['base']) * 100) : 0,
    'by_niche'  => $byNiche,
    'by_source' => $bySource,
    'by_day'    => $byDay,
  ]);
}

function sprint_summary() {
  // Form-submission firehose stats during sprint window
  $start = '2026-05-05 00:00:00';
  $end   = '2026-06-05 00:00:00';

  $sub = qOne(
    "SELECT COUNT(*) AS c FROM form_submissions WHERE created_at >= ? AND created_at < ?",
    [$start, $end]
  );
  $totalSubs = (int)($sub['c'] ?? 0);

  // Contacts captured during sprint
  $cont = qOne(
    "SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND created_at >= ? AND created_at < ?",
    [$start, $end]
  );
  $totalContacts = (int)($cont['c'] ?? 0);

  // Sprint-tagged contacts (utm_campaign = 30d-sprint-may26 anywhere in data)
  $sprintTagged = qOne(
    "SELECT COUNT(*) AS c FROM resources WHERE type='contact' AND data LIKE ?",
    ['%30d-sprint-may26%']
  );
  $sprintAttributed = (int)($sprintTagged['c'] ?? 0);

  // Webinar registrations
  $webId = sprint_webinar_form_id();
  $webRegs = 0;
  if ($webId) {
    $w = qOne(
      "SELECT COUNT(*) AS c FROM form_submissions WHERE form_id = ? AND created_at >= ? AND created_at < ?",
      [$webId, $start, $end]
    );
    $webRegs = (int)($w['c'] ?? 0);
  }

  json_out([
    'ok'                    => true,
    'period'                => 'May 5–Jun 4, 2026',
    'total_form_submissions'=> $totalSubs,
    'total_contacts'        => $totalContacts,
    'sprint_attributed'     => $sprintAttributed,
    'webinar_registrations' => $webRegs,
    'targets' => [
      'clients_signed' => ['bear' => 1,  'base' => 3,    'bull' => 5],
      'webinar_regs'   => ['bear' => 20, 'base' => 50,   'bull' => 100],
      'discovery_calls'=> ['bear' => 2,  'base' => 8,    'bull' => 15],
      'mrr'            => ['bear' => 249,'base' => 4470, 'bull' => 7460],
    ],
  ]);
}

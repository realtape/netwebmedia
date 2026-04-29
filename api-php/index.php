<?php
/* NetWebMedia API — single-entry router
   URL pattern: /api/{group}/{sub...}  e.g. /api/auth/login, /api/resources/page/42 */

/* Canonical entry point is /api/ — this file should only be reached via
   the bridge at /api/index.php. Direct access to /api-php/ is redirected. */
if (!defined('NWM_BRIDGE') && isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/api-php/') === 0) {
  // Redirect /api-php/foo to /api/foo keeping query string
  $uri = str_replace('/api-php/', '/api/', $_SERVER['REQUEST_URI']);
  header('HTTP/1.1 301 Moved Permanently');
  header('Location: ' . $uri);
  exit;
}

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/guard.php';  // requirePaidAccess() / requireAdmin()

cors();

// Parse path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api/?#', '', $uri);
$uri = trim($uri, '/');
$parts = $uri === '' ? [] : explode('/', $uri);
$method = $_SERVER['REQUEST_METHOD'];

// Health check
if ($parts[0] === 'health') {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, max-age=0');
  http_response_code(200);
  echo json_encode(['ok' => true, 'time' => time(), 'service' => 'netwebmedia']);
  exit;
}

// Root: API info
if (empty($parts)) {
  json_out([
    'name' => 'NetWebMedia API',
    'version' => '1.0.0',
    'routes' => [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/auth/me',
      'GET/POST /api/resources/{type}',
      'GET/PUT/DELETE /api/resources/{type}/{id}',
      'POST /api/leads/import/csv       (import prospects from CSV)',
      'POST /api/leads/qualify          (score & qualify raw leads via rule engine)',
      'POST /api/leads/assign           (assign qualified leads to team)',
      'POST /api/leads/enroll-sequences (enroll in nurture sequences)',
      'GET  /api/leads/status           (pipeline metrics)',
      'GET/POST /api/leads/scoring-rules            (configure scoring rules)',
      'PUT/DELETE /api/leads/scoring-rules/{id}     (update or delete rule)',
      'POST /api/leads/score-preview    (preview score for a sample contact)',
      'GET  /api/hubspot/sync           (full sync: contacts + deals)',
      'GET  /api/hubspot/contacts/sync  (contacts only)',
      'GET  /api/hubspot/deals/sync     (deals only)',
      'POST /api/hubspot/webhook        (receive HubSpot webhook)',
      'GET/POST /api/tasks              (sales rep to-dos linked to contacts/deals)',
      'GET/PUT/DELETE /api/tasks/{id}   (single task)',
      'POST /api/tasks/{id}/complete    (mark task done, logs activity)',
      'POST /api/tasks/{id}/reopen      (undo complete)',
      'GET  /api/tasks/stats            (counts by status, overdue, mine_open)',
      'GET  /api/tasks/upcoming         (next 7 days for current user)',
      'GET  /api/timeline?contact_id=X  (unified activity feed for a contact)',
      'GET  /api/timeline?deal_id=X     (activity feed for a deal)',
      'GET  /api/booking/links/{slug}              (public: link config)',
      'GET  /api/booking/links/{slug}/slots        (public: available time slots)',
      'POST /api/booking/links/{slug}/book         (public: create booking)',
      'GET/POST /api/booking/cancel?token=...      (public: cancel booking)',
      'GET  /api/booking/ics?id=X&token=...        (public: ICS calendar file)',
      'GET/POST /api/booking/admin/links           (admin: manage booking links)',
      'PUT/DELETE /api/booking/admin/links/{id}    (admin: update or delete a link)',
      'GET/PUT /api/booking/admin/availability     (admin: weekly schedule)',
      'GET  /api/booking/admin/bookings            (admin: list bookings)',
      'POST /api/booking/admin/bookings/{id}/cancel (admin: cancel a booking)',
      'GET/POST /api/sms/campaigns                (admin: bulk SMS campaigns)',
      'GET/PUT/DELETE /api/sms/campaigns/{id}     (admin: single campaign)',
      'POST /api/sms/campaigns/{id}/preview       (admin: audience size + sample render)',
      'POST /api/sms/campaigns/{id}/send          (admin: queue all recipients)',
      'POST /api/sms/campaigns/{id}/cancel        (admin: pause campaign)',
      'GET  /api/sms/campaigns/{id}/recipients    (admin: list recipients with status)',
      'GET/POST /api/sms/opt-outs                 (admin: manage opt-out list)',
      'GET  /api/sms/inbound                      (admin: inbound SMS log)',
      'POST /api/sms/webhook                      (Twilio inbound — handles STOP)',
      'POST /api/sms/cron/process?token=...       (cron: send next batch)',
      'GET/POST /api/notes?contact_id=X|deal_id=X|task_id=X (threaded annotations)',
      'PUT/DELETE /api/notes/{id}                 (edit/delete note, author or admin only)',
      'GET/POST /api/segments                     (saved dynamic segments)',
      'GET/PUT/DELETE /api/segments/{id}          (single segment + member count)',
      'GET  /api/segments/{id}/members            (resolve segment to contact list)',
      'POST /api/segments/preview                 (preview an unsaved filter)',
      'GET  /api/lifecycle/stages                 (funnel counts per stage)',
      'GET  /api/lifecycle/contacts?stage=...     (contacts in a stage)',
      'POST /api/lifecycle/recompute              (auto-derive stage from score)',
      'POST /api/lifecycle/transition             (manually move a contact)',
      'GET  /api/forecast                         (weighted pipeline by stage)',
      'GET  /api/forecast/by-owner                (forecast per sales rep)',
      'GET  /api/forecast/by-month                (next 6 months close-date breakdown)',
      'GET/POST /api/snapshots                    (clone-config snapshots)',
      'GET/DELETE /api/snapshots/{id}             (single snapshot)',
      'POST /api/snapshots/{id}/apply             (clone snapshot into current org)',
      'GET  /api/snapshots/{id}/export            (download snapshot as JSON)',
      'POST /api/snapshots/import                 (import a snapshot bundle)',
      'POST /api/public/forms/submit',
      'GET  /api/public/blog',
      'GET  /api/public/blog/{slug}',
      'GET  /api/public/stats',
      'GET  /api/whatsapp/webhook  (Meta verification)',
      'POST /api/whatsapp/webhook  (Twilio or Meta inbound)',
      'GET  /api/whatsapp/stats    (admin)',
      'POST /api/whatsapp/reset    (admin, body: {phone})',
      'POST /api/public/chat       (prospect chatbot, unified KB, rate-limited)',
    ],
    'server_time' => date('c'),
  ]);
}

$group = array_shift($parts);

try {
  if ($group === 'auth') {
    require __DIR__ . '/routes/auth.php';
    route_auth($parts[0] ?? '', $method);
  } elseif ($group === 'resources') {
    require __DIR__ . '/routes/resources.php';
    route_resources($parts, $method);
  } elseif ($group === 'public') {
    // Short-circuit prospect chat before loading routes/public.php — the
    // unified-KB chatbot endpoint lives in its own file to avoid OPcache
    // collisions with the rest of the public router.
    if (($parts[0] ?? '') === 'chat' && !isset($parts[1])) {
      require __DIR__ . '/routes/public-chat.php';
      route_public_chat();
      exit;
    }
    require __DIR__ . '/routes/public.php';
    route_public($parts, $method);
  } elseif ($group === 'workflows') {
    require __DIR__ . '/routes/workflows.php';
    route_workflows($parts, $method);
  } elseif ($group === 'cron') {
    require __DIR__ . '/routes/cron.php';
    route_cron($parts, $method);
  } elseif ($group === 'billing') {
    require __DIR__ . '/routes/billing.php';
    route_billing($parts, $method);
  } elseif ($group === 'ai') {
    require __DIR__ . '/routes/ai.php';
    route_ai($parts, $method);
  } elseif ($group === 'nwmai') {
    require __DIR__ . '/routes/nwmai.php';
    route_nwmai($parts, $method);
  } elseif ($group === 'campaigns') {
    require __DIR__ . '/routes/campaigns.php';
    route_campaigns($parts, $method);
  } elseif ($group === 'migrate-wa') {
    // One-shot WhatsApp history migration (token-protected).
    require __DIR__ . '/migrate_wa_to_crm.php';
    exit;
  } elseif ($group === 'chile-send') {
    // One-off Chile cold-outreach trigger (token-protected, see chile-send.php).
    require __DIR__ . '/chile-send.php';
    exit;
  } elseif ($group === 'ab-tests' || $group === 'abtests') {
    require __DIR__ . '/routes/abtests.php';
    route_abtests($parts, $method);
  } elseif ($group === 'knowledge') {
    require __DIR__ . '/routes/content.php';
    route_knowledge($parts, $method);
  } elseif ($group === 'recipes') {
    require __DIR__ . '/routes/recipes.php';
    route_recipes($parts, $method);
  } elseif ($group === 'video') {
    require __DIR__ . '/routes/video.php';
    route_video($parts, $method);
  } elseif ($group === 'social') {
    require __DIR__ . '/routes/social.php';
    route_social($parts, $method);
  } elseif ($group === 'cmo') {
    require __DIR__ . '/routes/cmo.php';
    route_cmo($parts, $method);
  } elseif ($group === 'catalogue') {
    require __DIR__ . '/routes/catalogue.php';
    route_catalogue($parts, $method);
  } elseif ($group === 'whatsapp') {
    require __DIR__ . '/routes/whatsapp.php';
    route_whatsapp($parts, $method);
  } elseif ($group === 'heygen') {
    require __DIR__ . '/routes/heygen.php';
    route_heygen($parts, $method);
  } elseif ($group === 'vapi') {
    require __DIR__ . '/routes/vapi.php';
    route_vapi($parts, $method);
  } elseif ($group === 'comments') {
    require __DIR__ . '/routes/comments.php';
    route_comments($parts, $method);
  } elseif ($group === 'leads') {
    require __DIR__ . '/routes/leads.php';
    route_leads($parts, $method);
  } elseif ($group === 'hubspot') {
    require __DIR__ . '/routes/hubspot.php';
    route_hubspot($parts, $method);
  } elseif ($group === 'tasks') {
    require __DIR__ . '/routes/tasks.php';
    route_tasks($parts, $method);
  } elseif ($group === 'timeline') {
    require __DIR__ . '/routes/timeline.php';
    route_timeline($parts, $method);
  } elseif ($group === 'booking') {
    require __DIR__ . '/routes/booking.php';
    route_booking($parts, $method);
  } elseif ($group === 'sms') {
    require __DIR__ . '/routes/sms.php';
    route_sms($parts, $method);
  } elseif ($group === 'notes') {
    require __DIR__ . '/routes/notes.php';
    route_notes($parts, $method);
  } elseif ($group === 'segments') {
    require __DIR__ . '/routes/segments.php';
    route_segments($parts, $method);
  } elseif ($group === 'lifecycle') {
    require __DIR__ . '/routes/lifecycle.php';
    route_lifecycle($parts, $method);
  } elseif ($group === 'forecast') {
    require __DIR__ . '/routes/forecast.php';
    route_forecast($parts, $method);
  } elseif ($group === 'snapshots') {
    require __DIR__ . '/routes/snapshots.php';
    route_snapshots($parts, $method);
  } else {
    err('Route not found', 404);
  }
} catch (PDOException $e) {
  err('Database error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
  err('Server error: ' . $e->getMessage(), 500);
}

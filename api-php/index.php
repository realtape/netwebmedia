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
  } else {
    err('Route not found', 404);
  }
} catch (PDOException $e) {
  err('Database error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
  err('Server error: ' . $e->getMessage(), 500);
}

<?php
/* NetWebMedia API — single-entry router
   URL pattern: /api/{group}/{sub...}  e.g. /api/auth/login, /api/resources/page/42 */

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
  } else {
    err('Route not found', 404);
  }
} catch (PDOException $e) {
  err('Database error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
  err('Server error: ' . $e->getMessage(), 500);
}

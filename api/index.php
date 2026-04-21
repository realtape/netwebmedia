<?php
/* NetWebMedia /api/ bridge
   ────────────────────────
   The canonical PHP router lives at /public_html/api-php/index.php. That
   directory is server-side blocked from direct public access by the root
   .htaccess rule `RewriteRule ^api-php(/|$) - [F,L]`. Public traffic hits
   /api/* and is served by THIS file, which hands off to the api-php router.

   Why this bridge exists:
     1. cPanel / InMotion shipped a legacy /public_html/api/ directory with
        stale PHP predating the api-php/ refactor (referenced auth_user()
        which no longer exists). This bridge overrides it.
     2. The `/api/` URL is the documented public path for the API, and all
        clients (nwm-chat.js, CRM front-end, WhatsApp webhook provider, etc.)
        point here.
     3. Keeps api-php/ the single source of truth for routing logic — this
        file must NEVER contain business logic. It only forwards.

   The companion `/api/.htaccess` forces EVERY request under /api/ through
   this file, so stale siblings in /public_html/api/ subdirectories are
   unreachable.
*/

$router = __DIR__ . '/../api-php/index.php';

if (!file_exists($router)) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode([
    'error' => 'api-php router not found',
    'detail' => 'Expected at ' . $router,
  ]);
  exit;
}

require $router;

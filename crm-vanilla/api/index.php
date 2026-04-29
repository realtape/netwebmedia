<?php
/**
 * NetWebMedia CRM API Router
 *
 * Routes: /api/{resource}[/{id}]
 * Methods: GET, POST, PUT, DELETE
 */

require_once __DIR__ . '/config.php';

// CORS headers — use declared constant, not wildcard
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Parse route from query string (mod_security safe)
$resource = $_GET['r'] ?? '';
$id  = isset($_GET['id']) ? (int)$_GET['id'] : null;
$sub = $_GET['sub'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Route to handler
$handlers = [
    'contacts'      => __DIR__ . '/handlers/contacts.php',
    'deals'         => __DIR__ . '/handlers/deals.php',
    'stages'        => __DIR__ . '/handlers/stages.php',
    'conversations' => __DIR__ . '/handlers/conversations.php',
    'messages'      => __DIR__ . '/handlers/messages.php',
    'events'        => __DIR__ . '/handlers/events.php',
    'stats'         => __DIR__ . '/handlers/stats.php',
    'seed'          => __DIR__ . '/handlers/seed.php',
    'seed_contacts' => __DIR__ . '/handlers/seed_contacts.php',
    'leads'         => __DIR__ . '/handlers/leads.php',
    'auth'          => __DIR__ . '/handlers/auth.php',
    'hubspot'       => __DIR__ . '/handlers/hubspot.php',
    'intake'        => __DIR__ . '/handlers/intake.php',
    'analyze'       => __DIR__ . '/handlers/analyze.php',
    'proposal'      => __DIR__ . '/handlers/proposal.php',
    'templates'     => __DIR__ . '/handlers/templates.php',
    'campaigns'     => __DIR__ . '/handlers/campaigns.php',
    'track'         => __DIR__ . '/handlers/track.php',
    'migrate'       => __DIR__ . '/handlers/migrate.php',
    'dedupe'        => __DIR__ . '/handlers/dedupe.php',
    'seed_templates'=> __DIR__ . '/handlers/seed_templates.php',
    'email_status'  => __DIR__ . '/handlers/email_status.php',
    'social'        => __DIR__ . '/handlers/social.php',
    'admin'         => __DIR__ . '/handlers/admin.php',
    'unsubscribes'  => __DIR__ . '/handlers/unsubscribes.php',
    'settings'      => __DIR__ . '/handlers/settings.php',
    'reporting'     => __DIR__ . '/handlers/reporting.php',
    'payments'      => __DIR__ . '/handlers/payments.php',
    'invoices'      => __DIR__ . '/handlers/payments.php',
    'import_csv'    => __DIR__ . '/handlers/import_csv.php',
    'import_best'         => __DIR__ . '/handlers/import_best.php',
    'gen_best_usa'           => __DIR__ . '/handlers/gen_best_usa.php',
    'filter_identifiable'    => __DIR__ . '/handlers/filter_identifiable.php',
    'filter_marketing_ready' => __DIR__ . '/handlers/filter_marketing_ready.php',
    'domain_audit'           => __DIR__ . '/handlers/domain_audit.php',
    'realtime'               => __DIR__ . '/handlers/realtime.php',
    'niche_config'          => __DIR__ . '/handlers/niche_config.php',
    'niche_metrics'         => __DIR__ . '/handlers/niche_metrics.php',
    'seed_client_templates' => __DIR__ . '/handlers/seed_client_templates.php',
    'organizations'         => __DIR__ . '/handlers/organizations.php',
];

if (!isset($handlers[$resource])) {
    jsonError('Unknown resource: ' . $resource, 404);
}

// Public routes need no auth. All others run the payment gate:
// demo/guest users (no PHP session) pass through; pending_payment users get HTTP 402.
$public_routes = ['auth', 'track', 'intake', 'leads', 'analyze', 'proposal', 'import_best', 'filter_identifiable', 'filter_marketing_ready', 'domain_audit', 'dedupe'];
if (!in_array($resource, $public_routes, true)) {
    require_once __DIR__ . '/lib/guard.php';
    require_guard();
}

// Gate all writes behind a real session.
// Token-protected routes (seed/migrate) handle their own auth internally.
$token_write_routes = [
    'seed', 'seed_contacts', 'seed_templates', 'seed_client_templates',
    'migrate', 'niche_config',
];
if (!in_array($method, ['GET', 'OPTIONS', 'HEAD'], true)
    && !in_array($resource, $public_routes, true)
    && !in_array($resource, $token_write_routes, true)
) {
    require_once __DIR__ . '/lib/guard.php';
    $writeUser = guard_user();
    if (!$writeUser || empty($writeUser['id'])) {
        jsonError('Authentication required', 401);
    }

    // CSRF defense: cookie-authenticated state changes must come from our own origin.
    // Token-protected routes are exempt (they're called by deploy scripts / cron).
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $allowed = ALLOWED_ORIGIN;
    $okOrigin = $origin && strpos($origin, $allowed) === 0;
    $okRefer  = $referer && strpos($referer, $allowed) === 0;
    if (!$okOrigin && !$okRefer) {
        jsonError('Cross-origin write blocked', 403);
    }
}

require $handlers[$resource];

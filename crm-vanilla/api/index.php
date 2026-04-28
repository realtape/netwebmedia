<?php
/**
 * NetWebMedia CRM API Router
 *
 * Routes: /api/{resource}[/{id}]
 * Methods: GET, POST, PUT, DELETE
 */

require_once __DIR__ . '/config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
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
    'setup'         => __DIR__ . '/handlers/setup.php',
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
    'realtime'      => __DIR__ . '/handlers/realtime.php',
];

if (!isset($handlers[$resource])) {
    jsonError('Unknown resource: ' . $resource, 404);
}

// Public routes need no auth. All others run the payment gate:
// demo/guest users (no PHP session) pass through; pending_payment users get HTTP 402.
$public_routes = ['auth', 'track', 'intake', 'leads', 'analyze', 'proposal'];
if (!in_array($resource, $public_routes, true)) {
    require_once __DIR__ . '/lib/guard.php';
    require_guard();
}

require $handlers[$resource];

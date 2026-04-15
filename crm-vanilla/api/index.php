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
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
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
    'leads'         => __DIR__ . '/handlers/leads.php',
    'auth'          => __DIR__ . '/handlers/auth.php',
    'setup'         => __DIR__ . '/handlers/setup.php',
    'hubspot'       => __DIR__ . '/handlers/hubspot.php',
    'intake'        => __DIR__ . '/handlers/intake.php',
    'analyze'       => __DIR__ . '/handlers/analyze.php',
    'proposal'      => __DIR__ . '/handlers/proposal.php',
];

if (!isset($handlers[$resource])) {
    jsonError('Unknown resource: ' . $resource, 404);
}

require $handlers[$resource];

<?php
/**
 * HubSpot bi-directional sync — cron entrypoint
 *
 * Suggested cPanel cron (run every 15 minutes):
 *   [slash]15 [star] [star] [star] [star] /usr/bin/php /home/webmed6/public_html/app/api/cron_hubspot_sync.php >> /home/webmed6/logs/hs_sync.log 2>&1
 */
require_once __DIR__ . '/config.php';

// Stub the JSON helpers used by the handler (we're running CLI, not HTTP)
if (!function_exists('jsonResponse')) {
    function jsonResponse(array $data, int $code = 200): void { echo json_encode($data) . "\n"; exit; }
}
if (!function_exists('jsonError')) {
    function jsonError(string $msg, int $code = 400): void { fwrite(STDERR, "ERR: $msg\n"); exit(1); }
}
if (!function_exists('getInput')) {
    function getInput(): array { return []; }
}

// Re-declare the functions directly (avoid the HTTP router path)
$method = 'GET';
$_GET['action'] = 'sync';
$id = null;

$ts = date('Y-m-d H:i:s');
echo "[$ts] HubSpot sync starting...\n";
require __DIR__ . '/handlers/hubspot.php';

<?php
/**
 * HubSpot ↔ CRM bidirectional sync (HTTP router).
 * Delegates to lib/hubspot_client.php for the actual work.
 */
require_once __DIR__ . '/../lib/hubspot_client.php';

if (!defined('HUBSPOT_TOKEN') || HUBSPOT_TOKEN === '') {
    jsonError('HUBSPOT_TOKEN not configured on server', 500);
}

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'status') {
            $r = hs_request('GET', '/crm/v3/objects/contacts?limit=1');
            jsonResponse([
                'connected' => $r['code'] === 200,
                'http_code' => $r['code'],
                'sample_total' => $r['body']['total'] ?? null,
            ]);
        }
        if ($action === 'pull')  jsonResponse(['pull' => hs_pull_into_local($db)]);
        if ($action === 'push')  jsonResponse(['push' => hs_push_all($db)]);
        if ($action === 'sync') {
            $push = hs_push_all($db);
            $pull = hs_pull_into_local($db);
            jsonResponse(['push' => $push, 'pull' => $pull]);
        }
        jsonError('Unknown action. Use ?action=status|push|pull|sync');
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['email'])) jsonError('email is required');
        $hsId = hs_upsert_contact($data);
        jsonResponse(['hubspot_id' => $hsId, 'ok' => $hsId !== null]);
        break;

    default:
        jsonError('Method not allowed', 405);
}

<?php
/**
 * NetWebMedia OS — Connector management  (Phase 3)
 *
 *   GET  /crm/api/?r=os_connectors                       -> list (no token material)
 *   POST /crm/api/?r=os_connectors {action:"disconnect",provider}
 *
 * Token material never leaves connector_store.php. This handler only lists
 * status and revokes. OAuth grant flows live in oauth_google.php / oauth_slack.php.
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/connector_store.php';

$db = getDB();
$u  = guard_user();
if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
$orgId = current_org_id();
if ($orgId === null) jsonError('No organization resolved', 400);
require_org_access($orgId, 'member');

$PROVIDERS = ['gmail', 'gcal', 'slack', 'hubspot', 'stripe'];

if ($method === 'GET') {
    $rows = os_connectors_list($db, $orgId);
    $byProvider = [];
    foreach ($rows as $r) $byProvider[$r['provider']] = $r;
    $out = [];
    foreach ($PROVIDERS as $p) {
        $r = $byProvider[$p] ?? null;
        $out[] = [
            'provider'      => $p,
            'status'        => $r['status'] ?? 'not_connected',
            'account_label' => $r['account_label'] ?? null,
            'connected_at'  => $r['created_at'] ?? null,
            'connectable'   => os_connectors_available() && in_array($p, ['gmail', 'gcal', 'slack'], true),
        ];
    }
    jsonResponse([
        'connectors' => $out,
        'available'  => os_connectors_available(),
        'note'       => os_connectors_available() ? null : 'Connector encryption key not configured on the server.',
    ]);
}

if ($method !== 'POST') jsonError('Use GET or POST', 405);
require_org_access_for_write('admin');

$in = getInput();
$action   = $in['action'] ?? '';
$provider = preg_replace('/[^a-z]/', '', strtolower((string)($in['provider'] ?? '')));

if ($action === 'disconnect') {
    if (!in_array($provider, $PROVIDERS, true)) jsonError('Unknown provider', 422);
    os_connector_disconnect($db, $orgId, $provider);
    // best-effort audit
    try {
        $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, target, ip)
                      VALUES (?, ?, "connector.disconnect", ?, ?)')
           ->execute([$orgId, (int)$u['id'], $provider, $_SERVER['REMOTE_ADDR'] ?? null]);
    } catch (Throwable $e) { /* audit table may not exist yet */ }
    jsonResponse(['ok' => true]);
}

jsonError('Unknown action', 400);

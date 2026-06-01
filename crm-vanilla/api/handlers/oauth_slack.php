<?php
/**
 * NetWebMedia OS — Slack OAuth  (Phase 3, stretch)
 *
 *   GET /crm/api/?r=oauth_slack&action=start | callback
 *
 * Wired but gated: 503 until SLACK_OAUTH_CLIENT_ID / _SECRET are set. Same
 * HMAC-signed-state pattern as oauth_google. Stores the bot token for posting
 * agent output to a channel.
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/connector_store.php';

$action = $_GET['action'] ?? 'start';
$base   = defined('OS_PUBLIC_BASE') && OS_PUBLIC_BASE ? OS_PUBLIC_BASE : 'https://netwebmedia.com';
$redirectUri = $base . '/crm/api/?r=oauth_slack&action=callback';

$clientId = defined('SLACK_OAUTH_CLIENT_ID') ? (string)SLACK_OAUTH_CLIENT_ID : '';
$clientSecret = defined('SLACK_OAUTH_CLIENT_SECRET') ? (string)SLACK_OAUTH_CLIENT_SECRET : '';
if ($clientId === '' || $clientSecret === '') jsonError('Slack connector not configured', 503);
if (!os_connectors_available()) jsonError('Connector encryption key not configured', 503);

function os_slack_sign(string $p): string {
    return rtrim(strtr(base64_encode($p), '+/', '-_'), '=') . '.' . hash_hmac('sha256', $p, MIGRATE_TOKEN);
}
function os_slack_verify(string $s): ?array {
    $x = explode('.', $s, 2); if (count($x) !== 2) return null;
    $p = base64_decode(strtr($x[0], '-_', '+/')); if ($p === false) return null;
    if (!hash_equals(hash_hmac('sha256', $p, MIGRATE_TOKEN), $x[1])) return null;
    $d = json_decode($p, true);
    if (!is_array($d) || empty($d['org']) || (time() - (int)($d['t'] ?? 0)) > 900) return null;
    return $d;
}

if ($action === 'start') {
    $u = guard_user();
    if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
    $orgId = current_org_id();
    if ($orgId === null) jsonError('No organization resolved', 400);
    require_org_access($orgId, 'admin');
    $state = os_slack_sign(json_encode(['org' => $orgId, 'uid' => (int)$u['id'], 't' => time()]));
    $params = http_build_query([
        'client_id'    => $clientId,
        'scope'        => 'chat:write,channels:read',
        'redirect_uri' => $redirectUri,
        'state'        => $state,
    ]);
    header('Location: https://slack.com/oauth/v2/authorize?' . $params);
    exit;
}

if ($action === 'callback') {
    $code = (string)($_GET['code'] ?? '');
    $st = os_slack_verify((string)($_GET['state'] ?? ''));
    if ($code === '' || $st === null) { header('Location: /os/connectors.html?error=oauth_state'); exit; }
    $orgId = (int)$st['org'];
    $post = http_build_query([
        'code' => $code, 'client_id' => $clientId, 'client_secret' => $clientSecret, 'redirect_uri' => $redirectUri,
    ]);
    $ch = curl_init('https://slack.com/api/oauth.v2.access');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 30,
        CURLOPT_POSTFIELDS => $post]);
    $raw = curl_exec($ch); curl_close($ch);
    $tok = json_decode((string)$raw, true);
    if (!is_array($tok) || empty($tok['ok']) || empty($tok['access_token'])) {
        header('Location: /os/connectors.html?error=oauth_exchange'); exit;
    }
    $db = getDB();
    $label = $tok['team']['name'] ?? 'Slack';
    os_connector_upsert($db, $orgId, 'slack', $tok['access_token'], null, null, $tok['scope'] ?? null, $label);
    try {
        $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, target, ip)
                      VALUES (?, ?, "connector.connect", "slack", ?)')
           ->execute([$orgId, (int)($st['uid'] ?? 0), $_SERVER['REMOTE_ADDR'] ?? null]);
    } catch (Throwable $e) {}
    header('Location: /os/connectors.html?connected=slack');
    exit;
}

jsonError('Unknown action', 400);

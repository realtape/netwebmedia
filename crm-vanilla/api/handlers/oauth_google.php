<?php
/**
 * NetWebMedia OS — Google OAuth (Gmail + Calendar)  (Phase 3)
 *
 *   GET /crm/api/?r=oauth_google&action=start      -> redirect to Google consent
 *   GET /crm/api/?r=oauth_google&action=callback   -> exchange code, store tokens
 *
 * Wired but gated: returns 503 until GOOGLE_OAUTH_CLIENT_ID / _SECRET are set
 * (a real Google Cloud OAuth app must be registered first). State is HMAC-signed
 * against MIGRATE_TOKEN with the org id embedded — prevents CSRF + cross-tenant
 * token replant. One grant covers both Gmail-read and Calendar scopes; we store
 * it under both the 'gmail' and 'gcal' connector rows.
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/connector_store.php';

$action = $_GET['action'] ?? 'start';
$base   = defined('OS_PUBLIC_BASE') && OS_PUBLIC_BASE ? OS_PUBLIC_BASE : 'https://netwebmedia.com';
$redirectUri = $base . '/crm/api/?r=oauth_google&action=callback';

$clientId = defined('GOOGLE_OAUTH_CLIENT_ID') ? (string)GOOGLE_OAUTH_CLIENT_ID : '';
$clientSecret = defined('GOOGLE_OAUTH_CLIENT_SECRET') ? (string)GOOGLE_OAUTH_CLIENT_SECRET : '';
if ($clientId === '' || $clientSecret === '') {
    jsonError('Google connector not configured (GOOGLE_OAUTH_CLIENT_ID/_SECRET unset)', 503);
}
if (!os_connectors_available()) jsonError('Connector encryption key not configured (CONNECTOR_ENC_KEY)', 503);

function os_oauth_sign(string $payload): string {
    return rtrim(strtr(base64_encode($payload), '+/', '-_'), '=') . '.' .
           hash_hmac('sha256', $payload, MIGRATE_TOKEN);
}
function os_oauth_verify(string $state): ?array {
    $parts = explode('.', $state, 2);
    if (count($parts) !== 2) return null;
    $payload = base64_decode(strtr($parts[0], '-_', '+/'));
    if ($payload === false) return null;
    if (!hash_equals(hash_hmac('sha256', $payload, MIGRATE_TOKEN), $parts[1])) return null;
    $d = json_decode($payload, true);
    if (!is_array($d) || empty($d['org']) || empty($d['t'])) return null;
    if (time() - (int)$d['t'] > 900) return null; // 15-min window
    return $d;
}

// ---------------------------------------------------------------- start ------
if ($action === 'start') {
    $u = guard_user();
    if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
    $orgId = current_org_id();
    if ($orgId === null) jsonError('No organization resolved', 400);
    require_org_access($orgId, 'admin');

    $state = os_oauth_sign(json_encode(['org' => $orgId, 'uid' => (int)$u['id'], 't' => time()]));
    $params = http_build_query([
        'client_id'     => $clientId,
        'redirect_uri'  => $redirectUri,
        'response_type' => 'code',
        'access_type'   => 'offline',
        'prompt'        => 'consent',
        'include_granted_scopes' => 'true',
        'scope'         => 'openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events',
        'state'         => $state,
    ]);
    header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
    exit;
}

// ---------------------------------------------------------------- callback ---
if ($action === 'callback') {
    $code  = (string)($_GET['code'] ?? '');
    $state = (string)($_GET['state'] ?? '');
    $st = os_oauth_verify($state);
    if ($code === '' || $st === null) { header('Location: /os/connectors.html?error=oauth_state'); exit; }
    $orgId = (int)$st['org'];

    $post = http_build_query([
        'code'          => $code,
        'client_id'     => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri'  => $redirectUri,
        'grant_type'    => 'authorization_code',
    ]);
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 30,
        CURLOPT_POSTFIELDS => $post,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    $raw = curl_exec($ch); $hc = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $tok = json_decode((string)$raw, true);
    if ($hc !== 200 || !is_array($tok) || empty($tok['access_token'])) {
        header('Location: /os/connectors.html?error=oauth_exchange'); exit;
    }
    $expiresAt = time() + (int)($tok['expires_in'] ?? 3600);
    $db = getDB();
    // Store under both gmail + gcal (one grant, both scopes).
    foreach (['gmail', 'gcal'] as $prov) {
        os_connector_upsert($db, $orgId, $prov, $tok['access_token'],
            $tok['refresh_token'] ?? null, $expiresAt, $tok['scope'] ?? null, 'Google');
    }
    try {
        $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, target, ip)
                      VALUES (?, ?, "connector.connect", "google", ?)')
           ->execute([$orgId, (int)($st['uid'] ?? 0), $_SERVER['REMOTE_ADDR'] ?? null]);
    } catch (Throwable $e) {}
    header('Location: /os/connectors.html?connected=google');
    exit;
}

jsonError('Unknown action', 400);

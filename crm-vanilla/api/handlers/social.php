<?php
/**
 * Social Media API Handler
 * Routes: GET|POST|DELETE /api/social/{providers|credentials|feed|sync|posts}
 */

require_once __DIR__ . '/../lib/guard.php';
require_once __DIR__ . '/../lib/social/fetchers.php';

$user = require_guard();
$uid  = (int)($user['id'] ?? 0);
$db   = getDB();
$sub  = $_GET['sub'] ?? '';

switch ($sub) {
    case 'providers':
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        handleProviders($uid, $db);
        break;

    case 'credentials':
        if ($method === 'POST')        handleSaveCredentials($uid, $db);
        elseif ($method === 'DELETE')  handleDeleteCredentials($uid, $db);
        else jsonError('Method not allowed', 405);
        break;

    case 'feed':
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        handleFeed($uid, $db);
        break;

    case 'sync':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        handleSync($uid, $db);
        break;

    case 'posts':
        // Planner: scheduled posts stored in CRM (future feature — return empty for now)
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        jsonResponse(['items' => []]);
        break;

    default:
        jsonError('Unknown social endpoint: ' . htmlspecialchars($sub), 404);
}

/* ── Handlers ─────────────────────────────────────────────────────────────── */

function handleProviders(int $uid, PDO $db): void {
    $stmt = $db->prepare(
        'SELECT provider, connected_at, last_sync_at, post_count
         FROM social_credentials WHERE user_id = ?'
    );
    $stmt->execute([$uid]);
    $rows = $stmt->fetchAll();

    $connectedMap = [];
    foreach ($rows as $r) {
        $connectedMap[$r['provider']] = $r;
    }

    $providers = [];
    foreach (['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'] as $p) {
        $row = $connectedMap[$p] ?? null;
        $providers[] = [
            'id'          => $p,
            'connected'   => $row !== null,
            'connected_at'=> $row['connected_at'] ?? null,
            'last_sync_at'=> $row['last_sync_at'] ?? null,
            'post_count'  => (int)($row['post_count'] ?? 0),
            'note'        => $row ? '' : '',
        ];
    }
    jsonResponse(['items' => $providers]);
}

function handleSaveCredentials(int $uid, PDO $db): void {
    $data     = getInput();
    $provider = trim($data['provider'] ?? '');
    $fields   = $data['fields'] ?? [];

    $allowed = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    if (!in_array($provider, $allowed, true)) jsonError('Invalid provider');
    if (empty($fields) || !is_array($fields)) jsonError('No credential fields provided');

    // Sanitize: only allow known string values
    $clean = [];
    foreach ($fields as $k => $v) {
        if (is_string($k) && is_string($v)) $clean[$k] = trim($v);
    }
    if (!$clean) jsonError('No valid credential fields');

    $enc = SocialEncryptor::encrypt($clean);
    $db->prepare(
        'INSERT INTO social_credentials (user_id, provider, credentials_enc)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE credentials_enc = VALUES(credentials_enc), connected_at = NOW()'
    )->execute([$uid, $provider, $enc]);

    // Trigger an immediate sync
    $result = runSync($uid, $provider, $db);
    jsonResponse(['ok' => true, 'synced' => $result['synced'], 'error' => $result['error']]);
}

function handleDeleteCredentials(int $uid, PDO $db): void {
    $data     = getInput();
    $provider = trim($_GET['provider'] ?? $data['provider'] ?? '');
    if (!$provider) jsonError('provider required');

    $db->prepare('DELETE FROM social_credentials WHERE user_id = ? AND provider = ?')
       ->execute([$uid, $provider]);
    $db->prepare('DELETE FROM social_posts WHERE user_id = ? AND provider = ?')
       ->execute([$uid, $provider]);

    jsonResponse(['ok' => true]);
}

function handleFeed(int $uid, PDO $db): void {
    $provider = trim($_GET['provider'] ?? '');
    $limit    = min((int)($_GET['limit'] ?? 60), 200);
    $offset   = max((int)($_GET['offset'] ?? 0), 0);

    $sql    = 'SELECT id, provider, platform_id, caption, media_url, thumbnail_url,
                      post_type, likes_count, comments_count, shares_count,
                      views_count, reach_count, permalink, published_at, cached_at
               FROM social_posts WHERE user_id = ?';
    $params = [$uid];

    if ($provider) {
        $sql    .= ' AND provider = ?';
        $params[] = $provider;
    }
    $sql .= ' ORDER BY published_at DESC LIMIT ' . (int)$limit . ' OFFSET ' . (int)$offset;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll();

    foreach ($posts as &$p) {
        foreach (['likes_count', 'comments_count', 'shares_count', 'views_count', 'reach_count'] as $f) {
            $p[$f] = (int)$p[$f];
        }
    }
    unset($p);

    // Also return per-provider sync metadata
    $metaStmt = $db->prepare(
        'SELECT provider, last_sync_at, post_count FROM social_credentials WHERE user_id = ?'
    );
    $metaStmt->execute([$uid]);
    $meta = [];
    foreach ($metaStmt->fetchAll() as $r) {
        $meta[$r['provider']] = [
            'last_sync_at' => $r['last_sync_at'],
            'post_count'   => (int)$r['post_count'],
        ];
    }

    jsonResponse(['items' => $posts, 'meta' => $meta, 'total' => count($posts)]);
}

function handleSync(int $uid, PDO $db): void {
    $data     = getInput();
    $provider = trim($data['provider'] ?? '');

    $allowed = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    if ($provider && !in_array($provider, $allowed, true)) jsonError('Invalid provider');

    if ($provider) {
        $result = runSync($uid, $provider, $db);
        jsonResponse(['results' => [$provider => $result]]);
    }

    // Sync all connected providers
    $stmt = $db->prepare('SELECT provider FROM social_credentials WHERE user_id = ?');
    $stmt->execute([$uid]);
    $providers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $results = [];
    foreach ($providers as $p) {
        $results[$p] = runSync($uid, $p, $db);
    }
    jsonResponse(['results' => $results]);
}

/* ── Sync Runner ──────────────────────────────────────────────────────────── */

function runSync(int $uid, string $provider, PDO $db): array {
    $stmt = $db->prepare(
        'SELECT credentials_enc FROM social_credentials WHERE user_id = ? AND provider = ?'
    );
    $stmt->execute([$uid, $provider]);
    $row = $stmt->fetch();
    if (!$row) return ['synced' => 0, 'error' => 'Not connected'];

    $creds = SocialEncryptor::decrypt($row['credentials_enc']);
    if (!$creds) return ['synced' => 0, 'error' => 'Could not decrypt credentials'];

    $fetchers = [
        'facebook'  => 'FacebookFetcher',
        'instagram' => 'InstagramFetcher',
        'linkedin'  => 'LinkedInFetcher',
        'youtube'   => 'YouTubeFetcher',
        'tiktok'    => 'TikTokFetcher',
    ];
    $class = $fetchers[$provider] ?? null;
    if (!$class) return ['synced' => 0, 'error' => 'Unknown provider'];

    $fetcher = new $class();
    $result  = $fetcher->sync($creds, $uid, $db);

    // If the fetcher refreshed a token (YouTube), re-encrypt and persist
    if (!empty($result['_creds'])) {
        $newEnc = SocialEncryptor::encrypt($result['_creds']);
        $db->prepare(
            'UPDATE social_credentials SET credentials_enc = ? WHERE user_id = ? AND provider = ?'
        )->execute([$newEnc, $uid, $provider]);
        unset($result['_creds']);
    }

    // Update sync metadata
    $db->prepare(
        'UPDATE social_credentials
         SET last_sync_at = NOW(),
             post_count   = (SELECT COUNT(*) FROM social_posts WHERE user_id = ? AND provider = ?)
         WHERE user_id = ? AND provider = ?'
    )->execute([$uid, $provider, $uid, $provider]);

    return $result;
}

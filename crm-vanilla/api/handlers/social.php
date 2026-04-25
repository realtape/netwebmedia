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

// Ensure social tables exist (schema may not have been applied on this server)
$db->exec('CREATE TABLE IF NOT EXISTS `social_credentials` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT UNSIGNED NOT NULL DEFAULT 0,
  `provider`        ENUM(\'facebook\',\'instagram\',\'linkedin\',\'youtube\',\'tiktok\') NOT NULL,
  `credentials_enc` TEXT NOT NULL,
  `connected_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_sync_at`    TIMESTAMP NULL DEFAULT NULL,
  `post_count`      INT UNSIGNED DEFAULT 0,
  UNIQUE KEY `uk_user_provider` (`user_id`, `provider`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB');
$db->exec('CREATE TABLE IF NOT EXISTS `social_posts` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT UNSIGNED NOT NULL DEFAULT 0,
  `provider`       ENUM(\'facebook\',\'instagram\',\'linkedin\',\'youtube\',\'tiktok\') NOT NULL,
  `platform_id`    VARCHAR(255) NOT NULL,
  `caption`        TEXT DEFAULT NULL,
  `media_url`      VARCHAR(2048) DEFAULT NULL,
  `thumbnail_url`  VARCHAR(2048) DEFAULT NULL,
  `post_type`      VARCHAR(50) DEFAULT \'post\',
  `likes_count`    INT UNSIGNED DEFAULT 0,
  `comments_count` INT UNSIGNED DEFAULT 0,
  `shares_count`   INT UNSIGNED DEFAULT 0,
  `views_count`    INT UNSIGNED DEFAULT 0,
  `reach_count`    INT UNSIGNED DEFAULT 0,
  `permalink`      VARCHAR(2048) DEFAULT NULL,
  `published_at`   DATETIME DEFAULT NULL,
  `cached_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_provider_post` (`user_id`, `provider`, `platform_id`),
  INDEX `idx_user_provider` (`user_id`, `provider`),
  INDEX `idx_published` (`published_at`)
) ENGINE=InnoDB');
$db->exec('CREATE TABLE IF NOT EXISTS `social_scheduled` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT UNSIGNED NOT NULL DEFAULT 0,
  `providers`    VARCHAR(255) NOT NULL,
  `caption`      TEXT NOT NULL,
  `media_url`    VARCHAR(2048) DEFAULT NULL,
  `status`       ENUM(\'scheduled\',\'publishing\',\'published\',\'failed\') DEFAULT \'scheduled\',
  `scheduled_at` DATETIME NOT NULL,
  `published_at` DATETIME NULL DEFAULT NULL,
  `error`        TEXT NULL DEFAULT NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status_scheduled` (`status`, `scheduled_at`)
) ENGINE=InnoDB');

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
        if ($method === 'GET')       handleListScheduled($uid, $db);
        elseif ($method === 'POST')  handleCreateScheduled($uid, $db);
        else jsonError('Method not allowed', 405);
        break;

    case 'publish':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        handlePublishDue($uid, $db);
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

/* ── Scheduled Posts ─────────────────────────────────────────────────────── */

function handleListScheduled(int $uid, PDO $db): void {
    $ensureSql = 'CREATE TABLE IF NOT EXISTS `social_scheduled` (
      `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
      `providers` VARCHAR(255) NOT NULL,
      `caption` TEXT NOT NULL,
      `media_url` VARCHAR(2048) DEFAULT NULL,
      `status` ENUM("scheduled","publishing","published","failed") DEFAULT "scheduled",
      `scheduled_at` DATETIME NOT NULL,
      `published_at` DATETIME NULL DEFAULT NULL,
      `error` TEXT NULL DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_user` (`user_id`),
      INDEX `idx_status_scheduled` (`status`, `scheduled_at`)
    ) ENGINE=InnoDB';
    $db->exec($ensureSql);

    $stmt = $db->prepare(
        'SELECT id, providers, caption, media_url, status, scheduled_at, published_at, created_at
         FROM social_scheduled WHERE user_id = ? ORDER BY scheduled_at ASC'
    );
    $stmt->execute([$uid]);
    jsonResponse(['items' => $stmt->fetchAll()]);
}

function handleCreateScheduled(int $uid, PDO $db): void {
    $data = getInput();
    $caption      = trim($data['caption'] ?? '');
    $providers    = $data['providers'] ?? [];
    $scheduled_at = trim($data['scheduled_at'] ?? date('Y-m-d H:i:s'));
    $media_url    = trim($data['media_url'] ?? '');

    if (!$caption) jsonError('caption required');
    if (empty($providers) || !is_array($providers)) jsonError('providers required');

    $allowed = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    $clean   = array_values(array_intersect($providers, $allowed));
    if (!$clean) jsonError('No valid providers');

    $db->exec('CREATE TABLE IF NOT EXISTS `social_scheduled` (
      `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
      `providers` VARCHAR(255) NOT NULL,
      `caption` TEXT NOT NULL,
      `media_url` VARCHAR(2048) DEFAULT NULL,
      `status` ENUM("scheduled","publishing","published","failed") DEFAULT "scheduled",
      `scheduled_at` DATETIME NOT NULL,
      `published_at` DATETIME NULL DEFAULT NULL,
      `error` TEXT NULL DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_user` (`user_id`),
      INDEX `idx_status_scheduled` (`status`, `scheduled_at`)
    ) ENGINE=InnoDB');

    $stmt = $db->prepare(
        'INSERT INTO social_scheduled (user_id, providers, caption, media_url, scheduled_at)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$uid, implode(',', $clean), $caption, $media_url ?: null, $scheduled_at]);
    $id = (int)$db->lastInsertId();

    jsonResponse(['ok' => true, 'id' => $id], 201);
}

function handlePublishDue(int $uid, PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS `social_scheduled` (
      `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
      `providers` VARCHAR(255) NOT NULL,
      `caption` TEXT NOT NULL,
      `media_url` VARCHAR(2048) DEFAULT NULL,
      `status` ENUM("scheduled","publishing","published","failed") DEFAULT "scheduled",
      `scheduled_at` DATETIME NOT NULL,
      `published_at` DATETIME NULL DEFAULT NULL,
      `error` TEXT NULL DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_user` (`user_id`),
      INDEX `idx_status_scheduled` (`status`, `scheduled_at`)
    ) ENGINE=InnoDB');

    $data  = getInput();
    $force = !empty($data['force']) || !empty($_GET['force']) || !empty($_POST['force']);

    $sql = $force
        ? "SELECT id, providers, caption, media_url FROM social_scheduled WHERE user_id = ? AND status IN ('scheduled','publishing','failed')"
        : 'SELECT id, providers, caption, media_url FROM social_scheduled WHERE user_id = ? AND status = "scheduled" AND scheduled_at <= NOW()';

    $stmt = $db->prepare($sql);
    $stmt->execute([$uid]);
    $due = $stmt->fetchAll();

    if (!$due) jsonResponse(['published' => 0, 'message' => 'No posts due']);

    $results = [];
    foreach ($due as $post) {
        $providerList = explode(',', $post['providers']);
        $db->prepare('UPDATE social_scheduled SET status = "publishing" WHERE id = ?')
           ->execute([$post['id']]);

        $errors = [];
        foreach ($providerList as $provider) {
            $credRow = $db->prepare(
                'SELECT credentials_enc FROM social_credentials WHERE user_id = ? AND provider = ?'
            );
            $credRow->execute([$uid, $provider]);
            $row = $credRow->fetch();
            if (!$row) { $errors[] = $provider . ':not_connected'; continue; }

            $creds = SocialEncryptor::decrypt($row['credentials_enc']);
            if (!$creds) { $errors[] = $provider . ':decrypt_failed'; continue; }

            $ok = publishToProvider($provider, $post['caption'], $post['media_url'] ?? '', $creds);
            if (!$ok) $errors[] = $provider . ':publish_failed';
        }

        $status = empty($errors) ? 'published' : 'failed';
        $db->prepare(
            'UPDATE social_scheduled SET status = ?, published_at = NOW(), error = ? WHERE id = ?'
        )->execute([$status, $errors ? implode('; ', $errors) : null, $post['id']]);

        $results[] = ['id' => $post['id'], 'status' => $status, 'errors' => $errors];
    }

    jsonResponse(['published' => count($results), 'results' => $results]);
}

function publishToProvider(string $provider, string $caption, string $media_url, array $creds): bool {
    switch ($provider) {
        case 'instagram':
            if (empty($creds['ig_user_id']) || empty($creds['ig_access_token'])) return false;
            $container = socialPost(
                'https://graph.facebook.com/v18.0/' . $creds['ig_user_id'] . '/media',
                ['image_url' => $media_url ?: null, 'caption' => $caption, 'media_type' => $media_url ? 'IMAGE' : 'TEXT', 'access_token' => $creds['ig_access_token']]
            );
            if (empty($container['id'])) return false;
            $pub = socialPost(
                'https://graph.facebook.com/v18.0/' . $creds['ig_user_id'] . '/media_publish',
                ['creation_id' => $container['id'], 'access_token' => $creds['ig_access_token']]
            );
            return !empty($pub['id']);

        case 'facebook':
            if (empty($creds['fb_page_id']) || empty($creds['fb_page_token'])) return false;
            $r = socialPost(
                'https://graph.facebook.com/v18.0/' . $creds['fb_page_id'] . '/feed',
                ['message' => $caption, 'access_token' => $creds['fb_page_token']]
            );
            return !empty($r['id']);

        default:
            return false;
    }
}

function socialPost(string $url, array $fields): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body = curl_exec($ch);
    curl_close($ch);
    return json_decode($body ?: '{}', true) ?? [];
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

<?php
/**
 * Facebook Page publish handler — schedules video + carousel posts to the @netwebmedia FB Page.
 *
 * Pre-flight env required:
 *   FB_PAGE_ID       — numeric Page ID (NOT the @username)
 *   FB_PAGE_TOKEN    — long-lived Page access token w/ pages_manage_posts + pages_read_engagement
 *
 * Token-gated like cron_workflows: ?token=<MIGRATE_TOKEN>
 *
 * Routes:
 *   GET  /api/?r=fb_publish&action=status&token=…
 *           → readiness probe; verifies FB_PAGE_ID/FB_PAGE_TOKEN configured + valid via /me call
 *   POST /api/?r=fb_publish&action=schedule&token=…
 *           body: {posts: [{post_number, format: 'video'|'carousel', caption, scheduled_at_unix,
 *                            video_url?, image_urls?: [..]}], dry_run?: bool}
 *           → schedules each post via FB Graph; logs to fb_publish_log; returns array of results.
 *   GET  /api/?r=fb_publish&action=list&token=…
 *           → returns recent fb_publish_log rows (audit).
 *
 * Idempotency: post_number is unique in fb_publish_log. Re-running schedule for an already-
 * successful post_number returns the existing fb_post_id without re-calling FB.
 */

$db = getDB();

// Dual auth — accept either:
//   (a) MIGRATE_TOKEN (cron / CI use case)
//   (b) Admin/superadmin session via X-Auth-Token (admin UI / browser-driven use case)
// This was added 2026-05-11 to allow Carlos's logged-in browser session to fire FB schedules
// without needing to paste the production MIGRATE_TOKEN into chat. The session path uses the
// existing guard helper which validates nwm_token against the users table.
$auth_ok = false;
$auth_method = null;
$token  = $_GET['token'] ?? $_POST['token'] ?? '';
$expect = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : '';
if ($expect && $token !== '' && hash_equals($expect, (string)$token)) {
    $auth_ok = true;
    $auth_method = 'migrate_token';
}
if (!$auth_ok) {
    // Try session-admin auth as fallback
    require_once __DIR__ . '/../lib/guard.php';
    $user = function_exists('guard_user') ? guard_user() : null;
    if ($user && in_array(($user['role'] ?? ''), ['admin', 'superadmin', 'owner'], true)) {
        $auth_ok = true;
        $auth_method = 'session_' . $user['role'];
    }
}
if (!$auth_ok) {
    jsonResponse(['error' => 'Forbidden', 'hint' => 'Pass ?token=<MIGRATE_TOKEN> or authenticate as admin via X-Auth-Token'], 403);
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

function fb_env(string $key, string $default = ''): string {
    if (defined($key)) return (string)constant($key);
    $v = getenv($key);
    return $v !== false ? (string)$v : $default;
}

// Schema guard — audit log table
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `fb_publish_log` (
          `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `post_number`       INT UNSIGNED NOT NULL,
          `format`            ENUM('video','carousel') NOT NULL,
          `scheduled_at_unix` INT UNSIGNED NOT NULL,
          `caption`           TEXT,
          `asset_urls_json`   TEXT,
          `fb_post_id`        VARCHAR(64) DEFAULT NULL,
          `fb_video_id`       VARCHAR(64) DEFAULT NULL,
          `fb_photo_ids_json` TEXT,
          `status`            ENUM('pending','scheduled','failed','dry_run') NOT NULL DEFAULT 'pending',
          `error`             TEXT,
          `response_json`     MEDIUMTEXT,
          `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uniq_post_number` (`post_number`),
          INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // ignore — exists
}

$pageId = fb_env('FB_PAGE_ID');
$pageTk = fb_env('FB_PAGE_TOKEN');
$gv     = 'v20.0';

function fb_curl_post(string $url, array $fields, int $timeout = 30): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = is_string($resp) ? json_decode($resp, true) : null;
    return ['http' => (int)$code, 'body' => $body, 'raw' => $resp];
}

function fb_curl_get(string $url, int $timeout = 15): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = is_string($resp) ? json_decode($resp, true) : null;
    return ['http' => (int)$code, 'body' => $body, 'raw' => $resp];
}

// ── status ──────────────────────────────────────────────────────────────────
if ($action === 'status') {
    $cfg = ['fb_page_id' => $pageId ? 'set' : 'unset', 'fb_page_token' => $pageTk ? 'set' : 'unset'];
    if (!$pageId || !$pageTk) {
        jsonResponse([
            'configured' => false,
            'config'     => $cfg,
            'note'       => 'Add FB_PAGE_ID + FB_PAGE_TOKEN to GitHub Secrets and redeploy. See deploy-site-root.yml.',
        ]);
    }
    // Verify token by hitting /me (works for both User and Page tokens) and
    // /{page-id} (verifies the token has access to the configured Page).
    $rMe = fb_curl_get("https://graph.facebook.com/{$gv}/me?fields=id,name&access_token=" . urlencode($pageTk));
    $rPg = fb_curl_get("https://graph.facebook.com/{$gv}/" . urlencode($pageId) . "?fields=id,name,access_token&access_token=" . urlencode($pageTk));
    $meOk    = ($rMe['http'] >= 200 && $rMe['http'] < 300 && !empty($rMe['body']['id']));
    $pgOk    = ($rPg['http'] >= 200 && $rPg['http'] < 300 && !empty($rPg['body']['id']));
    $isPageToken = $meOk && (string)$rMe['body']['id'] === (string)$pageId;
    $isUserToken = $meOk && !$isPageToken;
    jsonResponse([
        'configured'        => true,
        'config'            => $cfg,
        'me_response'       => $rMe['body'],
        'page_response'     => $rPg['body'],
        'me_ok'             => $meOk,
        'page_accessible'   => $pgOk,
        'token_kind'        => $isPageToken ? 'page' : ($isUserToken ? 'user' : 'unknown'),
        'note'              => $isPageToken && $pgOk
            ? 'Ready. Token is a Page token for the configured FB_PAGE_ID.'
            : ($isUserToken && $pgOk
                ? 'Token is a User token with access to the Page. Posts will work, but Page tokens are recommended. /me/accounts can return the Page-scoped token.'
                : ($pgOk
                    ? 'Token can access the Page but identity is unclear.'
                    : 'Token cannot access the configured Page. Check FB_PAGE_ID + FB_PAGE_TOKEN scopes (pages_manage_posts).')),
    ]);
}

// ── list ────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $rows = $db->query(
        "SELECT id, post_number, format, scheduled_at_unix, fb_post_id, fb_video_id, status, error, created_at, updated_at
         FROM fb_publish_log ORDER BY post_number ASC"
    )->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['scheduled_at_iso'] = gmdate('c', (int)$r['scheduled_at_unix']);
    }
    jsonResponse(['count' => count($rows), 'rows' => $rows]);
}

// ── schedule ────────────────────────────────────────────────────────────────
if ($action === 'schedule') {
    if (!$pageId || !$pageTk) {
        http_response_code(503);
        jsonResponse(['error' => 'FB_PAGE_ID/FB_PAGE_TOKEN not configured', 'hint' => 'Add to GitHub Secrets + redeploy.']);
    }

    $raw = file_get_contents('php://input');
    $in  = $raw ? json_decode($raw, true) : [];
    if (!is_array($in)) jsonError('Invalid JSON body', 400);

    $posts  = isset($in['posts']) && is_array($in['posts']) ? $in['posts'] : [];
    $dryRun = !empty($in['dry_run']);
    if (!$posts) jsonError('posts[] required', 400);

    $results = [];
    foreach ($posts as $p) {
        $postNum    = isset($p['post_number']) ? (int)$p['post_number'] : 0;
        $format     = isset($p['format']) ? (string)$p['format'] : '';
        $caption    = isset($p['caption']) ? (string)$p['caption'] : '';
        $schedUnix  = isset($p['scheduled_at_unix']) ? (int)$p['scheduled_at_unix'] : 0;
        $videoUrl   = isset($p['video_url']) ? (string)$p['video_url'] : '';
        $imageUrls  = isset($p['image_urls']) && is_array($p['image_urls']) ? $p['image_urls'] : [];

        // Validate
        if ($postNum < 1)              { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'post_number required']; continue; }
        if (!in_array($format, ['video','carousel'], true)) { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'format must be video|carousel']; continue; }
        if ($caption === '')           { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'caption required']; continue; }
        if ($schedUnix < time() + 600) { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'scheduled_at_unix must be >= now+10min (FB minimum)']; continue; }
        if ($schedUnix > time() + 6 * 30 * 86400) { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'scheduled_at_unix must be <= now+6mo (FB maximum)']; continue; }
        if ($format === 'video' && !$videoUrl)              { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'video_url required for format=video']; continue; }
        if ($format === 'carousel' && count($imageUrls) < 2) { $results[] = ['post_number' => $postNum, 'status' => 'failed', 'error' => 'image_urls[] of >= 2 required for format=carousel']; continue; }

        // Idempotency — already scheduled?
        $stmt = $db->prepare("SELECT id, status, fb_post_id, fb_video_id FROM fb_publish_log WHERE post_number = ?");
        $stmt->execute([$postNum]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($existing && $existing['status'] === 'scheduled') {
            $results[] = [
                'post_number' => $postNum,
                'status'      => 'already_scheduled',
                'fb_post_id'  => $existing['fb_post_id'],
                'fb_video_id' => $existing['fb_video_id'],
            ];
            continue;
        }

        $assetUrlsJson = json_encode(['video_url' => $videoUrl, 'image_urls' => $imageUrls]);

        if ($dryRun) {
            // Insert as dry_run, no FB call
            $upsert = $db->prepare(
                "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, status)
                 VALUES (?, ?, ?, ?, ?, 'dry_run')
                 ON DUPLICATE KEY UPDATE format=VALUES(format), scheduled_at_unix=VALUES(scheduled_at_unix),
                                         caption=VALUES(caption), asset_urls_json=VALUES(asset_urls_json), status='dry_run', error=NULL"
            );
            $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson]);
            $results[] = ['post_number' => $postNum, 'status' => 'dry_run', 'scheduled_at_iso' => gmdate('c', $schedUnix)];
            continue;
        }

        // ── format=video ────────────────────────────────────────────────────
        if ($format === 'video') {
            $url = "https://graph.facebook.com/{$gv}/" . urlencode($pageId) . "/videos";
            $r = fb_curl_post($url, [
                'file_url'                => $videoUrl,
                'description'             => $caption,
                'published'               => 'false',
                'scheduled_publish_time'  => (string)$schedUnix,
                'access_token'            => $pageTk,
            ], 60);

            if ($r['http'] >= 200 && $r['http'] < 300 && !empty($r['body']['id'])) {
                $videoId = (string)$r['body']['id'];
                $upsert = $db->prepare(
                    "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, fb_video_id, status, response_json)
                     VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)
                     ON DUPLICATE KEY UPDATE format=VALUES(format), scheduled_at_unix=VALUES(scheduled_at_unix),
                                             caption=VALUES(caption), asset_urls_json=VALUES(asset_urls_json),
                                             fb_video_id=VALUES(fb_video_id), status='scheduled', error=NULL,
                                             response_json=VALUES(response_json)"
                );
                $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson, $videoId, json_encode($r['body'])]);
                $results[] = ['post_number' => $postNum, 'status' => 'scheduled', 'fb_video_id' => $videoId, 'scheduled_at_iso' => gmdate('c', $schedUnix)];
            } else {
                $err = is_array($r['body']) && isset($r['body']['error']['message']) ? $r['body']['error']['message'] : 'unknown';
                $upsert = $db->prepare(
                    "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, status, error, response_json)
                     VALUES (?, ?, ?, ?, ?, 'failed', ?, ?)
                     ON DUPLICATE KEY UPDATE status='failed', error=VALUES(error), response_json=VALUES(response_json)"
                );
                $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson, $err, json_encode($r['body'])]);
                $results[] = ['post_number' => $postNum, 'status' => 'failed', 'http' => $r['http'], 'error' => $err, 'fb_response' => $r['body']];
            }
            continue;
        }

        // ── format=carousel (photos + feed post) ────────────────────────────
        if ($format === 'carousel') {
            $photoIds = [];
            $abortErr = null;
            foreach ($imageUrls as $imgUrl) {
                $url = "https://graph.facebook.com/{$gv}/" . urlencode($pageId) . "/photos";
                $r = fb_curl_post($url, [
                    'url'          => $imgUrl,
                    'published'    => 'false',
                    'access_token' => $pageTk,
                ], 30);
                if ($r['http'] >= 200 && $r['http'] < 300 && !empty($r['body']['id'])) {
                    $photoIds[] = (string)$r['body']['id'];
                } else {
                    $abortErr = is_array($r['body']) && isset($r['body']['error']['message']) ? $r['body']['error']['message'] : ('photo upload http ' . $r['http']);
                    break;
                }
            }
            if ($abortErr || count($photoIds) !== count($imageUrls)) {
                $upsert = $db->prepare(
                    "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, fb_photo_ids_json, status, error)
                     VALUES (?, ?, ?, ?, ?, ?, 'failed', ?)
                     ON DUPLICATE KEY UPDATE status='failed', fb_photo_ids_json=VALUES(fb_photo_ids_json), error=VALUES(error)"
                );
                $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson, json_encode($photoIds), $abortErr ?: 'partial photo upload']);
                $results[] = ['post_number' => $postNum, 'status' => 'failed', 'stage' => 'photo_upload', 'partial_photo_ids' => $photoIds, 'error' => $abortErr];
                continue;
            }

            // Create the scheduled feed post with all photos attached
            $url = "https://graph.facebook.com/{$gv}/" . urlencode($pageId) . "/feed";
            $attached = [];
            foreach ($photoIds as $pid) $attached[] = ['media_fbid' => $pid];
            $r = fb_curl_post($url, [
                'message'                => $caption,
                'attached_media'         => json_encode($attached),
                'published'              => 'false',
                'scheduled_publish_time' => (string)$schedUnix,
                'access_token'           => $pageTk,
            ], 30);

            if ($r['http'] >= 200 && $r['http'] < 300 && !empty($r['body']['id'])) {
                $postId = (string)$r['body']['id'];
                $upsert = $db->prepare(
                    "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, fb_post_id, fb_photo_ids_json, status, response_json)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
                     ON DUPLICATE KEY UPDATE fb_post_id=VALUES(fb_post_id), fb_photo_ids_json=VALUES(fb_photo_ids_json),
                                             status='scheduled', error=NULL, response_json=VALUES(response_json)"
                );
                $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson, $postId, json_encode($photoIds), json_encode($r['body'])]);
                $results[] = ['post_number' => $postNum, 'status' => 'scheduled', 'fb_post_id' => $postId, 'photo_count' => count($photoIds), 'scheduled_at_iso' => gmdate('c', $schedUnix)];
            } else {
                $err = is_array($r['body']) && isset($r['body']['error']['message']) ? $r['body']['error']['message'] : 'unknown';
                $upsert = $db->prepare(
                    "INSERT INTO fb_publish_log (post_number, format, scheduled_at_unix, caption, asset_urls_json, fb_photo_ids_json, status, error, response_json)
                     VALUES (?, ?, ?, ?, ?, ?, 'failed', ?, ?)
                     ON DUPLICATE KEY UPDATE fb_photo_ids_json=VALUES(fb_photo_ids_json), status='failed', error=VALUES(error), response_json=VALUES(response_json)"
                );
                $upsert->execute([$postNum, $format, $schedUnix, $caption, $assetUrlsJson, json_encode($photoIds), $err, json_encode($r['body'])]);
                $results[] = ['post_number' => $postNum, 'status' => 'failed', 'stage' => 'feed_post', 'photo_ids' => $photoIds, 'http' => $r['http'], 'error' => $err, 'fb_response' => $r['body']];
            }
            continue;
        }
    }

    jsonResponse([
        'ok'       => true,
        'count'    => count($results),
        'dry_run'  => $dryRun,
        'results'  => $results,
        'ts'       => date('c'),
    ]);
}

jsonError('Unknown action. Use status|schedule|list', 400);

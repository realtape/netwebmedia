<?php
/* Social posting + scheduling.
   Providers (all OAuth-wired):
     - instagram  (Meta Graph API)
     - facebook   (Meta Graph API / Pages)
     - linkedin   (LinkedIn UGC API)
     - youtube    (YouTube Data API v3 — resumable upload)
     - tiktok     (TikTok Content Posting API)

   GET  /api/social/providers              list providers + connected status (per-org)
   POST /api/social/schedule               queue a post (multi-provider)
   GET  /api/social/posts                  list scheduled + published
   POST /api/social/publish-due            internal: publish anything where scheduled_at <= NOW
   DELETE /api/social/posts/{id}           cancel a scheduled post
   GET  /api/social/credentials            return masked credentials for this org (admin)
   POST /api/social/credentials            save/update credentials for this org (admin)
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/guard.php';

/* ── Schema ──────────────────────────────────────────────────────────── */

function sp_ensure_schema() {
  qExec("CREATE TABLE IF NOT EXISTS social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT,
    providers JSON,
    caption TEXT,
    media_url VARCHAR(500),
    media_type ENUM('image','video','text') DEFAULT 'text',
    status ENUM('scheduled','publishing','published','failed','cancelled') DEFAULT 'scheduled',
    scheduled_at DATETIME,
    published_at DATETIME,
    results_json JSON,
    error TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX (org_id), INDEX (status), INDEX (scheduled_at)
  )");
  qExec("CREATE TABLE IF NOT EXISTS social_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    key_name VARCHAR(50) NOT NULL,
    key_value TEXT NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY org_provider_key (org_id, provider, key_name),
    INDEX (org_id)
  )");
}

/* ── Credentials — DB first, config-file fallback ────────────────────── */

function sp_creds($org_id) {
  static $cache = [];
  if (isset($cache[$org_id])) return $cache[$org_id];

  // Pull everything stored for this org in the DB
  $rows = qAll('SELECT key_name, key_value FROM social_credentials WHERE org_id = ?', [$org_id]);
  $db = [];
  foreach ($rows as $r) $db[$r['key_name']] = $r['key_value'];

  // Merge with config-file defaults (DB wins on conflict)
  $cfg = config();
  $cache[$org_id] = array_merge($cfg, $db);
  return $cache[$org_id];
}

function sp_save_cred($org_id, $provider, $key, $value) {
  qExec(
    "INSERT INTO social_credentials (org_id, provider, key_name, key_value, updated_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE key_value = VALUES(key_value), updated_at = NOW()",
    [$org_id, $provider, $key, $value]
  );
}

/* ── Provider list ───────────────────────────────────────────────────── */

function sp_providers($org_id) {
  $c = sp_creds($org_id);
  return [
    [
      'id'        => 'instagram',
      'name'      => 'Instagram',
      'connected' => !empty($c['ig_access_token']) && !empty($c['ig_user_id']),
      'note'      => 'Meta Graph API — requires an IG Business account linked to a Facebook Page.',
      'fields'    => ['ig_user_id', 'ig_access_token'],
    ],
    [
      'id'        => 'facebook',
      'name'      => 'Facebook',
      'connected' => !empty($c['fb_page_token']) && !empty($c['fb_page_id']),
      'note'      => 'Facebook Pages API — Page ID + long-lived Page Access Token.',
      'fields'    => ['fb_page_id', 'fb_page_token'],
    ],
    [
      'id'        => 'linkedin',
      'name'      => 'LinkedIn',
      'connected' => !empty($c['li_access_token']) && !empty($c['li_urn']),
      'note'      => 'LinkedIn UGC API — Company page URN + OAuth access token.',
      'fields'    => ['li_access_token', 'li_urn'],
    ],
    [
      'id'        => 'youtube',
      'name'      => 'YouTube',
      'connected' => !empty($c['yt_access_token']) && !empty($c['yt_channel_id']),
      'note'      => 'YouTube Data API v3 — OAuth 2.0 access token + refresh token + channel ID.',
      'fields'    => ['yt_channel_id', 'yt_access_token', 'yt_refresh_token'],
    ],
    [
      'id'        => 'tiktok',
      'name'      => 'TikTok',
      'connected' => !empty($c['tt_access_token']),
      'note'      => 'TikTok Content Posting API — requires sandbox-approved app.',
      'fields'    => ['tt_access_token'],
    ],
  ];
}

/* ── Publishing ───────────────────────────────────────────────────────── */

function sp_publish($provider, $caption, $media_url, $media_type, $org_id) {
  $c = sp_creds($org_id);
  switch ($provider) {

    case 'facebook':
      if (empty($c['fb_page_id']) || empty($c['fb_page_token']))
        return ['ok'=>false, 'stubbed'=>true, 'reason'=>'fb_not_configured'];
      $endpoint = 'https://graph.facebook.com/v18.0/' . $c['fb_page_id'] . '/feed';
      $fields   = ['message'=>$caption, 'access_token'=>$c['fb_page_token']];
      if ($media_url && $media_type === 'image') {
        $endpoint     = 'https://graph.facebook.com/v18.0/' . $c['fb_page_id'] . '/photos';
        $fields['url'] = $media_url;
      }
      return sp_post_form($endpoint, $fields);

    case 'instagram':
      if (empty($c['ig_user_id']) || empty($c['ig_access_token']))
        return ['ok'=>false, 'stubbed'=>true, 'reason'=>'ig_not_configured'];
      // Two-step: create media container → publish.
      $create = sp_post_form(
        'https://graph.facebook.com/v18.0/' . $c['ig_user_id'] . '/media',
        ['image_url'=>$media_url, 'caption'=>$caption, 'access_token'=>$c['ig_access_token']]
      );
      if (!$create['ok'] || empty($create['json']['id'])) return $create;
      return sp_post_form(
        'https://graph.facebook.com/v18.0/' . $c['ig_user_id'] . '/media_publish',
        ['creation_id'=>$create['json']['id'], 'access_token'=>$c['ig_access_token']]
      );

    case 'linkedin':
      if (empty($c['li_access_token']) || empty($c['li_urn']))
        return ['ok'=>false, 'stubbed'=>true, 'reason'=>'li_not_configured'];
      $body = [
        'author'          => $c['li_urn'],
        'lifecycleState'  => 'PUBLISHED',
        'specificContent' => [
          'com.linkedin.ugc.ShareContent' => [
            'shareCommentary'  => ['text' => $caption],
            'shareMediaCategory' => $media_url ? 'IMAGE' : 'NONE',
          ],
        ],
        'visibility' => ['com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC'],
      ];
      return sp_post_json('https://api.linkedin.com/v2/ugcPosts', $body, [
        'Authorization: Bearer ' . $c['li_access_token'],
        'X-Restli-Protocol-Version: 2.0.0',
      ]);

    case 'youtube':
      if (empty($c['yt_access_token']) || empty($c['yt_channel_id']))
        return ['ok'=>false, 'stubbed'=>true, 'reason'=>'yt_not_configured'];
      if ($media_type !== 'video' || empty($media_url))
        return ['ok'=>false, 'reason'=>'yt_requires_video_url'];

      // Optionally refresh the access token first.
      $token = $c['yt_access_token'];
      if (!empty($c['yt_refresh_token'])) {
        $cfg_file = config();
        $refreshed = sp_yt_refresh_token($c['yt_refresh_token'], $cfg_file['yt_client_id'] ?? '', $cfg_file['yt_client_secret'] ?? '');
        if (!empty($refreshed['access_token'])) $token = $refreshed['access_token'];
      }

      // Step 1 — Initiate resumable upload session.
      $meta = json_encode([
        'snippet' => ['title' => substr($caption, 0, 100), 'description' => $caption, 'channelId' => $c['yt_channel_id']],
        'status'  => ['privacyStatus' => 'public'],
      ]);
      $sess_ch = curl_init('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status');
      curl_setopt_array($sess_ch, [
        CURLOPT_POST           => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HEADER         => 1,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
          'Authorization: Bearer ' . $token,
          'Content-Type: application/json; charset=UTF-8',
          'X-Upload-Content-Type: video/mp4',
        ],
        CURLOPT_POSTFIELDS => $meta,
      ]);
      $sess_resp = curl_exec($sess_ch);
      $sess_code = curl_getinfo($sess_ch, CURLINFO_HTTP_CODE);
      curl_close($sess_ch);
      if ($sess_code !== 200)
        return ['ok'=>false, 'reason'=>'yt_session_failed', 'http'=>$sess_code, 'raw'=>substr($sess_resp,0,500)];

      preg_match('/Location:\s*(https:\/\/[^\r\n]+)/i', $sess_resp, $m);
      $upload_url = trim($m[1] ?? '');
      if (!$upload_url) return ['ok'=>false, 'reason'=>'yt_no_upload_url'];

      // Step 2 — Stream video bytes from media_url to YouTube.
      $vid_ch = curl_init($media_url);
      curl_setopt_array($vid_ch, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_FOLLOWLOCATION=>1, CURLOPT_TIMEOUT=>120]);
      $video_bytes = curl_exec($vid_ch);
      curl_close($vid_ch);
      if (!$video_bytes) return ['ok'=>false, 'reason'=>'yt_video_fetch_failed'];

      $up_ch = curl_init($upload_url);
      curl_setopt_array($up_ch, [
        CURLOPT_CUSTOMREQUEST  => 'PUT',
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_TIMEOUT        => 300,
        CURLOPT_HTTPHEADER     => ['Content-Type: video/mp4', 'Content-Length: ' . strlen($video_bytes)],
        CURLOPT_POSTFIELDS     => $video_bytes,
      ]);
      $up_resp = curl_exec($up_ch);
      $up_code = curl_getinfo($up_ch, CURLINFO_HTTP_CODE);
      curl_close($up_ch);
      $json = json_decode($up_resp, true);
      return ['ok'=>$up_code>=200&&$up_code<300, 'http'=>$up_code, 'json'=>$json, 'raw'=>substr($up_resp?:'',0,800)];

    case 'tiktok':
      if (empty($c['tt_access_token']))
        return ['ok'=>false, 'stubbed'=>true, 'reason'=>'tt_not_configured'];
      // TikTok Content Posting API: init upload → chunk upload → publish.
      // Phase 1: video upload init
      $init = sp_post_json('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', [
        'post_info'    => ['title'=>substr($caption,0,150), 'privacy_level'=>'PUBLIC_TO_EVERYONE', 'disable_duet'=>false, 'disable_comment'=>false, 'disable_stitch'=>false],
        'source_info'  => ['source'=>'PULL_FROM_URL', 'video_url'=>$media_url],
      ], ['Authorization: Bearer '.$c['tt_access_token'], 'Content-Type: application/json; charset=UTF-8']);
      return $init;

    default:
      return ['ok'=>false, 'reason'=>'unknown_provider'];
  }
}

function sp_yt_refresh_token($refresh_token, $client_id, $client_secret) {
  if (!$client_id || !$client_secret) return [];
  $ch = curl_init('https://oauth2.googleapis.com/token');
  curl_setopt_array($ch, [
    CURLOPT_POST           => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_POSTFIELDS     => http_build_query([
      'client_id'     => $client_id,
      'client_secret' => $client_secret,
      'refresh_token' => $refresh_token,
      'grant_type'    => 'refresh_token',
    ]),
  ]);
  $resp = curl_exec($ch); curl_close($ch);
  return json_decode($resp, true) ?: [];
}

/* ── HTTP helpers ─────────────────────────────────────────────────────── */

function sp_post_form($url, $fields) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST           => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_POSTFIELDS     => http_build_query($fields),
  ]);
  $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ['ok'=>$code>=200&&$code<300, 'http'=>$code, 'json'=>json_decode($resp,true), 'raw'=>substr($resp?:'',0,800)];
}

function sp_post_json($url, $body, $headers = []) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST           => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json'], $headers),
    CURLOPT_POSTFIELDS     => json_encode($body),
  ]);
  $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ['ok'=>$code>=200&&$code<300, 'http'=>$code, 'json'=>json_decode($resp,true), 'raw'=>substr($resp?:'',0,800)];
}

/* ── Router ───────────────────────────────────────────────────────────── */

function route_social($parts, $method) {
  sp_ensure_schema();

  // GET /api/social/providers
  if (($parts[0] ?? '') === 'providers' && $method === 'GET') {
    $u = requirePaidAccess();
    json_out(['items' => sp_providers((int)$u['org_id'])]);
  }

  // GET /api/social/credentials  — returns keys present (values masked)
  if (($parts[0] ?? '') === 'credentials' && $method === 'GET') {
    $u = requireAdmin();
    $rows = qAll(
      'SELECT provider, key_name, updated_at FROM social_credentials WHERE org_id = ? ORDER BY provider, key_name',
      [(int)$u['org_id']]
    );
    json_out(['items' => $rows]);
  }

  // POST /api/social/credentials  — body: { provider, fields: { key: value, ... } }
  if (($parts[0] ?? '') === 'credentials' && $method === 'POST') {
    $u   = requireAdmin();
    $b   = required(['provider', 'fields']);
    $prov = trim($b['provider']);
    $allowed_providers = ['instagram','facebook','linkedin','youtube','tiktok'];
    if (!in_array($prov, $allowed_providers)) err('Invalid provider', 400);
    $fields = $b['fields'];
    if (!is_array($fields) || empty($fields)) err('fields must be a non-empty object', 400);
    foreach ($fields as $key => $val) {
      sp_save_cred((int)$u['org_id'], $prov, (string)$key, (string)$val);
    }
    json_out(['ok' => true, 'provider' => $prov, 'saved' => count($fields)]);
  }

  // POST /api/social/schedule
  if (($parts[0] ?? '') === 'schedule' && $method === 'POST') {
    $u    = requirePaidAccess();
    $b    = required(['providers', 'caption']);
    $provs = is_array($b['providers']) ? $b['providers'] : [];
    if (!$provs) err('providers must be a non-empty array', 400);
    $scheduled_at = $b['scheduled_at'] ?? date('Y-m-d H:i:s');
    qExec(
      "INSERT INTO social_posts (org_id, user_id, providers, caption, media_url, media_type, status, scheduled_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW())",
      [(int)$u['org_id'], (int)$u['id'], json_encode($provs), $b['caption'],
       $b['media_url'] ?? null, $b['media_type'] ?? 'text', $scheduled_at]
    );
    json_out(['ok'=>true, 'id'=>lastId()], 201);
  }

  // GET /api/social/posts
  if (($parts[0] ?? '') === 'posts' && empty($parts[1]) && $method === 'GET') {
    $u    = requirePaidAccess();
    $rows = qAll(
      'SELECT * FROM social_posts WHERE org_id = ? ORDER BY scheduled_at ASC, id DESC LIMIT 200',
      [(int)$u['org_id']]
    );
    json_out(['items' => $rows]);
  }

  // DELETE /api/social/posts/{id}
  if (($parts[0] ?? '') === 'posts' && !empty($parts[1]) && $method === 'DELETE') {
    $u = requirePaidAccess();
    qExec(
      "UPDATE social_posts SET status='cancelled', updated_at=NOW() WHERE id=? AND org_id=? AND status='scheduled'",
      [(int)$parts[1], (int)$u['org_id']]
    );
    json_out(['ok' => true]);
  }

  // POST /api/social/publish-due  — internal cron endpoint
  if (($parts[0] ?? '') === 'publish-due' && $method === 'POST') {
    $due = qAll("SELECT * FROM social_posts WHERE status='scheduled' AND scheduled_at <= NOW() ORDER BY id LIMIT 20");
    $processed = 0;
    foreach ($due as $p) {
      qExec("UPDATE social_posts SET status='publishing', updated_at=NOW() WHERE id=?", [$p['id']]);
      $results = [];
      $allOk   = true;
      foreach (json_decode($p['providers'], true) ?: [] as $prov) {
        $r = sp_publish($prov, $p['caption'], $p['media_url'], $p['media_type'], (int)$p['org_id']);
        $results[$prov] = $r;
        if (empty($r['ok'])) $allOk = false;
      }
      qExec(
        "UPDATE social_posts SET status=?, published_at=NOW(), results_json=?, updated_at=NOW() WHERE id=?",
        [$allOk ? 'published' : 'failed', json_encode($results), $p['id']]
      );
      $processed++;
    }
    json_out(['processed' => $processed]);
  }

  err('Social route not found', 404);
}

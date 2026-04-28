<?php
/**
 * Social Media Platform Fetchers
 * Handles credential encryption and live data sync for all 5 platforms.
 */

/* ── Encryption ─────────────────────────────────────────────────────────── */

class SocialEncryptor {
    private static function key(): string {
        $raw = defined('SOCIAL_ENC_KEY') ? SOCIAL_ENC_KEY : '';
        if (!$raw) $raw = DB_PASS . DB_NAME . DB_USER;
        return substr(hash('sha256', $raw, true), 0, 32);
    }

    static function encrypt(array $data): string {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE);
        $iv   = random_bytes(16);
        $enc  = openssl_encrypt($json, 'AES-256-CBC', self::key(), OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $enc);
    }

    static function decrypt(string $stored): ?array {
        try {
            $raw  = base64_decode($stored, true);
            if ($raw === false || strlen($raw) < 17) return null;
            $iv   = substr($raw, 0, 16);
            $enc  = substr($raw, 16);
            $json = openssl_decrypt($enc, 'AES-256-CBC', self::key(), OPENSSL_RAW_DATA, $iv);
            if ($json === false) return null;
            $arr  = json_decode($json, true);
            return is_array($arr) ? $arr : null;
        } catch (Throwable $e) {
            return null;
        }
    }
}

/* ── Base Fetcher ────────────────────────────────────────────────────────── */

abstract class SocialFetcherBase {
    protected function httpGet(string $url, array $headers = [], int $timeout = 12): ?array {
        $ctx = stream_context_create(['http' => [
            'method'         => 'GET',
            'header'         => implode("\r\n", $headers),
            'timeout'        => $timeout,
            'ignore_errors'  => true,
            'follow_location'=> 1,
        ]]);
        $body = @file_get_contents($url, false, $ctx);
        if ($body === false) return null;
        $data = json_decode($body, true);
        return is_array($data) ? $data : null;
    }

    protected function httpPost(string $url, array $headers, string $body, int $timeout = 12): ?array {
        $ctx = stream_context_create(['http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", $headers),
            'content'       => $body,
            'timeout'       => $timeout,
            'ignore_errors' => true,
        ]]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp === false) return null;
        $data = json_decode($resp, true);
        return is_array($data) ? $data : null;
    }

    abstract public function sync(array $creds, int $uid, PDO $db): array;

    protected function upsertPost(PDO $db, array $p): void {
        static $stmt = null;
        if (!$stmt) {
            $stmt = $db->prepare(
                'INSERT INTO social_posts
                    (user_id,provider,platform_id,caption,media_url,thumbnail_url,
                     post_type,likes_count,comments_count,shares_count,views_count,
                     reach_count,permalink,published_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE
                    caption=VALUES(caption), media_url=VALUES(media_url),
                    thumbnail_url=VALUES(thumbnail_url),
                    likes_count=VALUES(likes_count), comments_count=VALUES(comments_count),
                    shares_count=VALUES(shares_count), views_count=VALUES(views_count),
                    reach_count=VALUES(reach_count), cached_at=NOW()'
            );
        }
        $stmt->execute([
            $p['user_id'], $p['provider'], $p['platform_id'],
            $p['caption'] ?? null, $p['media_url'] ?? null, $p['thumbnail_url'] ?? null,
            $p['post_type'] ?? 'post',
            (int)($p['likes_count'] ?? 0), (int)($p['comments_count'] ?? 0),
            (int)($p['shares_count'] ?? 0), (int)($p['views_count'] ?? 0),
            (int)($p['reach_count'] ?? 0),
            $p['permalink'] ?? null, $p['published_at'] ?? null,
        ]);
    }
}

/* ── Facebook ────────────────────────────────────────────────────────────── */

class FacebookFetcher extends SocialFetcherBase {
    public function sync(array $creds, int $uid, PDO $db): array {
        $pageId = trim($creds['fb_page_id'] ?? '');
        $token  = trim($creds['fb_page_token'] ?? '');
        if (!$pageId || !$token) return ['synced' => 0, 'error' => 'Missing Page ID or token'];

        $fields = 'message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares';
        $url    = "https://graph.facebook.com/v19.0/{$pageId}/posts?fields={$fields}&access_token={$token}&limit=25";
        $data   = $this->httpGet($url);

        if (!$data) return ['synced' => 0, 'error' => 'Could not reach Facebook API'];
        if (isset($data['error'])) return ['synced' => 0, 'error' => $data['error']['message'] ?? 'Facebook API error'];

        $count = 0;
        foreach ($data['data'] ?? [] as $p) {
            if (empty($p['id'])) continue;
            $this->upsertPost($db, [
                'user_id'        => $uid,
                'provider'       => 'facebook',
                'platform_id'    => $p['id'],
                'caption'        => $p['message'] ?? null,
                'media_url'      => $p['full_picture'] ?? null,
                'thumbnail_url'  => $p['full_picture'] ?? null,
                'post_type'      => 'post',
                'likes_count'    => $p['likes']['summary']['total_count'] ?? 0,
                'comments_count' => $p['comments']['summary']['total_count'] ?? 0,
                'shares_count'   => $p['shares']['count'] ?? 0,
                'permalink'      => $p['permalink_url'] ?? null,
                'published_at'   => isset($p['created_time'])
                    ? gmdate('Y-m-d H:i:s', strtotime($p['created_time'])) : null,
            ]);
            $count++;
        }
        return ['synced' => $count, 'error' => null];
    }
}

/* ── Instagram ───────────────────────────────────────────────────────────── */

class InstagramFetcher extends SocialFetcherBase {
    public function sync(array $creds, int $uid, PDO $db): array {
        $userId = trim($creds['ig_user_id'] ?? '');
        $token  = trim($creds['ig_access_token'] ?? '');
        if (!$userId || !$token) return ['synced' => 0, 'error' => 'Missing User ID or token'];

        $fields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink';
        $url    = "https://graph.facebook.com/v19.0/{$userId}/media?fields={$fields}&access_token={$token}&limit=25";
        $data   = $this->httpGet($url);

        if (!$data) return ['synced' => 0, 'error' => 'Could not reach Instagram API'];
        if (isset($data['error'])) return ['synced' => 0, 'error' => $data['error']['message'] ?? 'Instagram API error'];

        $count = 0;
        foreach ($data['data'] ?? [] as $p) {
            if (empty($p['id'])) continue;
            $isVideo   = strtoupper($p['media_type'] ?? '') === 'VIDEO';
            $mediaUrl  = $isVideo ? null : ($p['media_url'] ?? null);
            $thumbUrl  = $p['thumbnail_url'] ?? $p['media_url'] ?? null;
            $this->upsertPost($db, [
                'user_id'        => $uid,
                'provider'       => 'instagram',
                'platform_id'    => $p['id'],
                'caption'        => $p['caption'] ?? null,
                'media_url'      => $mediaUrl,
                'thumbnail_url'  => $thumbUrl,
                'post_type'      => strtolower($p['media_type'] ?? 'image'),
                'likes_count'    => $p['like_count'] ?? 0,
                'comments_count' => $p['comments_count'] ?? 0,
                'permalink'      => $p['permalink'] ?? null,
                'published_at'   => isset($p['timestamp'])
                    ? gmdate('Y-m-d H:i:s', strtotime($p['timestamp'])) : null,
            ]);
            $count++;
        }
        return ['synced' => $count, 'error' => null];
    }
}

/* ── LinkedIn ────────────────────────────────────────────────────────────── */

class LinkedInFetcher extends SocialFetcherBase {
    private $token;

    public function sync(array $creds, int $uid, PDO $db): array {
        $this->token = trim($creds['li_access_token'] ?? '');
        $urn   = trim($creds['li_urn'] ?? '');
        if (!$this->token || !$urn) return ['synced' => 0, 'error' => 'Missing token or URN'];

        // URL-encode the URN for the List() wrapper
        $encodedUrn = rawurlencode($urn);
        $url = "https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List({$encodedUrn})&count=20&sortBy=LAST_MODIFIED";
        $data = $this->httpGet($url, [
            "Authorization: Bearer {$this->token}",
            "X-Restli-Protocol-Version: 2.0.0",
            "LinkedIn-Version: 202401",
        ]);

        if (!$data) return ['synced' => 0, 'error' => 'Could not reach LinkedIn API'];
        if (isset($data['serviceErrorCode'])) {
            return ['synced' => 0, 'error' => $data['message'] ?? 'LinkedIn API error'];
        }

        $count = 0;
        foreach ($data['elements'] ?? [] as $p) {
            $postId = $p['id'] ?? '';
            if (!$postId) continue;

            $share   = $p['specificContent']['com.linkedin.ugc.ShareContent'] ?? [];
            $caption = $share['shareCommentary']['text'] ?? null;
            $tsMs    = $p['firstPublishedAt'] ?? ($p['created']['time'] ?? 0);
            $pubAt   = $tsMs ? gmdate('Y-m-d H:i:s', intval($tsMs / 1000)) : null;

            // Thumbnail from first media element if present
            $thumb = null;
            $mediaArr = $share['media'] ?? [];
            if (!empty($mediaArr[0]['thumbnails'][0]['url'])) {
                $thumb = $mediaArr[0]['thumbnails'][0]['url'];
            }

            // FIX #4: Fetch engagement metrics (likes, comments, shares) from LinkedIn socialActions API
            $engagement = $this->fetchEngagement($postId);

            $this->upsertPost($db, [
                'user_id'        => $uid,
                'provider'       => 'linkedin',
                'platform_id'    => $postId,
                'caption'        => $caption,
                'thumbnail_url'  => $thumb,
                'post_type'      => 'post',
                'likes_count'    => $engagement['likeCount'] ?? 0,
                'comments_count' => $engagement['commentCount'] ?? 0,
                'shares_count'   => $engagement['shareCount'] ?? 0,
                'published_at'   => $pubAt,
            ]);
            $count++;
        }
        return ['synced' => $count, 'error' => null];
    }

    private function fetchEngagement(string $postId): array {
        // FIX #4: Query LinkedIn socialActions endpoint to get engagement metrics
        // The postId from /v2/ugcPosts is already a URN (e.g., "urn:li:ugcPost:123456")
        $encodedTarget = rawurlencode($postId);
        $url = "https://api.linkedin.com/v2/socialMetrics?ids={$encodedTarget}&fields=likeCount,commentCount";

        $data = $this->httpGet($url, [
            "Authorization: Bearer {$this->token}",
            "X-Restli-Protocol-Version: 2.0.0",
            "LinkedIn-Version: 202401",
        ]);

        if (!is_array($data)) return [];

        // Extract metrics from the response
        // socialMetrics returns a map with URN as key
        $metrics = $data['results'][$postId] ?? [];

        // If socialMetrics doesn't work, try falling back to socialActions endpoint
        if (empty($metrics)) {
            $metrics = $this->fetchEngagementFallback($postId);
        }

        return [
            'likeCount'     => $metrics['likeCount'] ?? 0,
            'commentCount'  => $metrics['commentCount'] ?? 0,
            'shareCount'    => $metrics['shareCount'] ?? 0,
        ];
    }

    private function fetchEngagementFallback(string $postId): array {
        // Fallback to socialActions endpoint if socialMetrics doesn't return data
        $encodedTarget = rawurlencode($postId);
        $url = "https://api.linkedin.com/v2/socialActions?q=target&targets=List({$encodedTarget})";

        $data = $this->httpGet($url, [
            "Authorization: Bearer {$this->token}",
            "X-Restli-Protocol-Version: 2.0.0",
            "LinkedIn-Version: 202401",
        ]);

        if (!is_array($data)) return [];

        $metrics = [];
        foreach ($data['elements'] ?? [] as $action) {
            $actionType = $action['action'] ?? '';
            if ($actionType === 'LIKE') {
                $metrics['likeCount'] = ($metrics['likeCount'] ?? 0) + 1;
            } elseif ($actionType === 'COMMENT') {
                $metrics['commentCount'] = ($metrics['commentCount'] ?? 0) + 1;
            } elseif ($actionType === 'SHARE') {
                $metrics['shareCount'] = ($metrics['shareCount'] ?? 0) + 1;
            }
        }

        return $metrics;
    }
}

/* ── YouTube ─────────────────────────────────────────────────────────────── */

class YouTubeFetcher extends SocialFetcherBase {
    public function sync(array $creds, int $uid, PDO $db): array {
        $channelId    = trim($creds['yt_channel_id'] ?? '');
        $accessToken  = trim($creds['yt_access_token'] ?? '');
        $refreshToken = trim($creds['yt_refresh_token'] ?? '');
        $clientId     = trim($creds['yt_client_id'] ?? '');
        $clientSecret = trim($creds['yt_client_secret'] ?? '');

        if (!$channelId || !$accessToken) return ['synced' => 0, 'error' => 'Missing Channel ID or token'];

        // Attempt token refresh
        if ($refreshToken && $clientId && $clientSecret) {
            $fresh = $this->refreshAccessToken($refreshToken, $clientId, $clientSecret);
            if ($fresh) {
                $accessToken = $fresh;
                // Persist new token back to DB via a second upsert handled by handler
                // Store in creds for handler to re-encrypt
                $creds['yt_access_token'] = $fresh;
            }
        }

        $searchUrl = "https://www.googleapis.com/youtube/v3/search"
            . "?channelId={$channelId}&type=video&order=date&maxResults=25&part=snippet"
            . "&access_token={$accessToken}";
        $search = $this->httpGet($searchUrl);

        if (!$search) return ['synced' => 0, 'error' => 'Could not reach YouTube API'];
        if (isset($search['error'])) {
            return ['synced' => 0, 'error' => $search['error']['message'] ?? 'YouTube API error'];
        }

        $items = $search['items'] ?? [];
        if (!$items) return ['synced' => 0, 'error' => null];

        $videoIds = [];
        foreach ($items as $item) {
            $vid = $item['id']['videoId'] ?? null;
            if ($vid) $videoIds[] = $vid;
        }

        $statsMap = $videoIds ? $this->fetchStats($videoIds, $accessToken) : [];

        $count = 0;
        foreach ($items as $item) {
            $vid  = $item['id']['videoId'] ?? null;
            if (!$vid) continue;
            $snip = $item['snippet'] ?? [];
            $stats = $statsMap[$vid] ?? [];
            $thumb = $snip['thumbnails']['high']['url']
                ?? $snip['thumbnails']['medium']['url']
                ?? $snip['thumbnails']['default']['url']
                ?? null;

            $this->upsertPost($db, [
                'user_id'        => $uid,
                'provider'       => 'youtube',
                'platform_id'    => $vid,
                'caption'        => $snip['title'] ?? null,
                'thumbnail_url'  => $thumb,
                'post_type'      => 'video',
                'likes_count'    => $stats['likeCount'] ?? 0,
                'comments_count' => $stats['commentCount'] ?? 0,
                'views_count'    => $stats['viewCount'] ?? 0,
                'permalink'      => "https://www.youtube.com/watch?v={$vid}",
                'published_at'   => isset($snip['publishedAt'])
                    ? gmdate('Y-m-d H:i:s', strtotime($snip['publishedAt'])) : null,
            ]);
            $count++;
        }

        // Persist refreshed token if updated
        if (!empty($creds['yt_access_token']) && $creds['yt_access_token'] !== $accessToken) {
            // Already handled above; no-op here
        }

        return ['synced' => $count, 'error' => null, '_creds' => $creds];
    }

    private function fetchStats(array $ids, string $token): array {
        $idStr = implode(',', array_map('rawurlencode', $ids));
        $url   = "https://www.googleapis.com/youtube/v3/videos?id={$idStr}&part=statistics&access_token={$token}";
        $data  = $this->httpGet($url);
        $map   = [];
        foreach ($data['items'] ?? [] as $item) {
            $map[$item['id']] = $item['statistics'] ?? [];
        }
        return $map;
    }

    private function refreshAccessToken(string $refreshToken, string $clientId, string $clientSecret): ?string {
        $resp = $this->httpPost(
            'https://oauth2.googleapis.com/token',
            ['Content-Type: application/x-www-form-urlencoded'],
            http_build_query([
                'grant_type'    => 'refresh_token',
                'refresh_token' => $refreshToken,
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
            ])
        );
        return $resp['access_token'] ?? null;
    }
}

/* ── TikTok ──────────────────────────────────────────────────────────────── */

class TikTokFetcher extends SocialFetcherBase {
    public function sync(array $creds, int $uid, PDO $db): array {
        $token = trim($creds['tt_access_token'] ?? '');
        if (!$token) return ['synced' => 0, 'error' => 'Missing access token'];

        $fields = 'id,title,cover_image_url,video_description,like_count,comment_count,share_count,view_count,create_time';
        $url    = "https://open.tiktokapis.com/v2/video/list/?fields={$fields}";
        $resp   = $this->httpPost($url, [
            "Authorization: Bearer {$token}",
            'Content-Type: application/json',
        ], json_encode(['max_count' => 20]));

        if (!$resp) return ['synced' => 0, 'error' => 'Could not reach TikTok API'];
        $errCode = $resp['error']['code'] ?? 'ok';
        if ($errCode !== 'ok') {
            // FIX #5: Detect sandbox approval issues and provide helpful guidance
            $errMsg = $resp['error']['message'] ?? 'TikTok API error';
            $isSandboxIssue = false;

            // Check for common sandbox/authorization errors
            if (in_array($errCode, [40001, 10001, 10002, 10003], true)) {
                // Authorization/scope issues typically indicate sandbox not approved
                $isSandboxIssue = true;
            }
            if (stripos($errMsg, 'not authorized') !== false ||
                stripos($errMsg, 'unauthorized') !== false ||
                stripos($errMsg, 'permission') !== false) {
                $isSandboxIssue = true;
            }

            if ($isSandboxIssue) {
                return ['synced' => 0, 'error' => 'TikTok sandbox not approved. Visit your TikTok Developer Portal to request sandbox access for the Video List API.', 'sandbox_blocked' => true];
            }

            return ['synced' => 0, 'error' => $errMsg];
        }

        $count = 0;
        foreach ($resp['data']['videos'] ?? [] as $v) {
            if (empty($v['id'])) continue;
            $caption = $v['title'] ?? $v['video_description'] ?? null;
            $this->upsertPost($db, [
                'user_id'        => $uid,
                'provider'       => 'tiktok',
                'platform_id'    => $v['id'],
                'caption'        => $caption,
                'thumbnail_url'  => $v['cover_image_url'] ?? null,
                'post_type'      => 'video',
                'likes_count'    => $v['like_count'] ?? 0,
                'comments_count' => $v['comment_count'] ?? 0,
                'shares_count'   => $v['share_count'] ?? 0,
                'views_count'    => $v['view_count'] ?? 0,
                'published_at'   => isset($v['create_time'])
                    ? gmdate('Y-m-d H:i:s', $v['create_time']) : null,
            ]);
            $count++;
        }
        return ['synced' => $count, 'error' => null];
    }
}

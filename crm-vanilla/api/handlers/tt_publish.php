<?php
/**
 * TikTok Content Posting API publish handler — direct-posts reel MP4s to @netwebmedia.
 *
 * Pre-flight env required:
 *   TT_ACCESS_TOKEN    — long-lived TikTok access token w/ video.publish + video.upload + user.info.basic scopes
 *   TT_CLIENT_KEY      — TikTok app client key (for audit / token refresh; not strictly required per call)
 *   TT_REEL_BASE_URL   — public base for reel MP4 URLs (default https://netwebmedia.com)
 *
 * Token-gated like fb_publish: ?token=<MIGRATE_TOKEN>
 *
 * Routes:
 *   GET  /api/?r=tt_publish&action=status&token=…
 *           → readiness probe; verifies TT_ACCESS_TOKEN via /v2/post/publish/creator_info/query/
 *           → returns creator nickname, allowed privacy levels, max video duration, comment caps
 *   GET  /api/?r=tt_publish&action=spec&reel=1_aeo_en|1_aeo_es|2_growth_en|2_growth_es|3_scale_en|3_scale_es&token=…
 *           → returns the TT-ready publish payload spec for a given reel (URL + caption + post_info)
 *   POST /api/?r=tt_publish&action=publish&token=…
 *           body: {reel: '1_aeo_en'|..., caption_override?: string, privacy_level?: 'PUBLIC_TO_EVERYONE'|'SELF_ONLY'|...,
 *                  disable_duet?: bool, disable_stitch?: bool, disable_comment?: bool, dry_run?: bool}
 *           → 503 if env not configured. Calls /v2/post/publish/video/init/ with PULL_FROM_URL. Returns publish_id.
 *   POST /api/?r=tt_publish&action=status_check&token=…
 *           body: {publish_id: 'v_pub_url~...'}
 *           → polls /v2/post/publish/status/fetch/ — returns status (PROCESSING_UPLOAD|PUBLISH_COMPLETE|FAILED|...)
 *   GET  /api/?r=tt_publish&action=list&token=…
 *           → returns recent tt_publish_log rows (audit).
 *
 * Idempotency: reel key + scheduled_at_unix is unique in tt_publish_log. Re-publish of the same
 * reel within a 24h window returns the existing publish_id without re-calling TikTok.
 *
 * Setup checklist (Carlos hands — NONE of this can be automated):
 *   1. Create TikTok app at https://developers.tiktok.com → "Manage apps" → "Connect an app"
 *   2. Add Login Kit + Content Posting API products to the app
 *   3. Apply for "Direct Post" permission (required for auto-publish without manual confirm).
 *      Estimated TikTok review: 2–4 weeks. Provide use-case description + recorded demo.
 *   4. Verify domain ownership: app settings → URL Prefix Configuration → add
 *      `https://netwebmedia.com/assets/social/campaign/` and complete TXT-record verification.
 *      Without this, PULL_FROM_URL returns "url_ownership_unverified".
 *   5. Generate access token via OAuth2 flow (or use TikTok's test-token flow during sandbox)
 *      with scopes: video.publish, video.upload, user.info.basic.
 *   6. Set GitHub Secrets: TT_ACCESS_TOKEN, TT_CLIENT_KEY. Redeploy main.
 *   7. Hit `GET /api/?r=tt_publish&action=status&token=<MIGRATE_TOKEN>` to confirm readiness.
 */

$db = getDB();

// Token guard — same MIGRATE_TOKEN as cron_workflows / migrate / fb_publish
$token  = $_GET['token'] ?? $_POST['token'] ?? '';
$expect = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : '';
if (!$expect || !hash_equals($expect, (string)$token)) {
    jsonResponse(['error' => 'Forbidden', 'hint' => 'Pass ?token=<MIGRATE_TOKEN>'], 403);
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

function tt_env(string $key, string $default = ''): string {
    if (defined($key)) return (string)constant($key);
    $v = getenv($key);
    return $v !== false ? (string)$v : $default;
}

// Schema guard — audit log table
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `tt_publish_log` (
          `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `reel_key`          VARCHAR(64) NOT NULL,
          `caption`           TEXT,
          `privacy_level`     VARCHAR(48) NOT NULL DEFAULT 'PUBLIC_TO_EVERYONE',
          `video_url`         VARCHAR(512) NOT NULL,
          `publish_id`        VARCHAR(128) DEFAULT NULL,
          `tt_post_id`        VARCHAR(128) DEFAULT NULL,
          `status`            ENUM('pending','processing','complete','failed','dry_run') NOT NULL DEFAULT 'pending',
          `error`             TEXT,
          `response_json`     MEDIUMTEXT,
          `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          INDEX `idx_reel_key` (`reel_key`),
          INDEX `idx_publish_id` (`publish_id`),
          INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // ignore — exists
}

$ttToken = tt_env('TT_ACCESS_TOKEN');
$ttKey   = tt_env('TT_CLIENT_KEY');
$reelBase = rtrim(tt_env('TT_REEL_BASE_URL', 'https://netwebmedia.com'), '/');
$apiBase = 'https://open.tiktokapis.com/v2';

/** Built-in reel catalog — matches assets/social/campaign/reel_*.mp4 */
function tt_reel_def(string $key): ?array {
    $defs = [
        '1_aeo_en' => [
            'theme'    => 'AEO',
            'language' => 'en',
            'filename' => 'reel_1_aeo_en_final.mp4',
            'caption'  => "SEO is over. AEO is starting.\n\nBuyers ask ChatGPT, not Google. The brands cited in those answers get the calls. We get SMBs cited in AI answer engines in 60 days flat.\n\nFree audit at netwebmedia.com.\n\n#AEO #AnswerEngineOptimization #AIMarketing #SmallBusiness #DigitalMarketing #ChatGPT #FractionalCMO",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
        '1_aeo_es' => [
            'theme'    => 'AEO',
            'language' => 'es',
            'filename' => 'reel_1_aeo_es_final.mp4',
            'caption'  => "SEO está cambiando. Llega el AEO.\n\nLos compradores le preguntan a ChatGPT, no a Google. Las marcas citadas en esas respuestas ganan. Hacemos que tu PyME sea citada en 60 días.\n\nAuditoría gratis en netwebmedia.com.\n\n#AEO #MarketingDigital #IA #PyME #ChatGPT #CMO",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
        '2_growth_en' => [
            'theme'    => 'Growth',
            'language' => 'en',
            'filename' => 'reel_2_growth_en_final.mp4',
            'caption'  => "One senior operator + 12 AI agents > 40-person agency.\n\nSame agency-grade output. Half the cost. No handoffs. Direct line to the founder.\n\nWe ship in days, not quarters. Book a strategy call at netwebmedia.com.\n\n#AIagents #FractionalCMO #SmallBusiness #MarketingAgency #Automation",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
        '2_growth_es' => [
            'theme'    => 'Growth',
            'language' => 'es',
            'filename' => 'reel_2_growth_es_final.mp4',
            'caption'  => "Un operador senior + 12 agentes de IA > agencia de 40 personas.\n\nMismo nivel de output. Mitad del costo. Sin handoffs. Línea directa al fundador.\n\nLanzamos en días, no en trimestres. Agenda en netwebmedia.com.\n\n#IA #AgenciaIA #CMO #PyME #MarketingAutomatizado",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
        '3_scale_en' => [
            'theme'    => 'Scale',
            'language' => 'en',
            'filename' => 'reel_3_scale_en_final.mp4',
            'caption'  => "How a Chilean-founded agency is winning US SMB CMO seats.\n\nBilingual EN/ES. AI-native from day one. 14 verticals dialed in. 340% average ROI. 4.4× conversion vs traditional agencies.\n\nSee case studies at netwebmedia.com.\n\n#StartupStory #FractionalCMO #BilingualMarketing #SMB #AIAgency",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
        '3_scale_es' => [
            'theme'    => 'Scale',
            'language' => 'es',
            'filename' => 'reel_3_scale_es_final.mp4',
            'caption'  => "Cómo una agencia chilena está ganando contratos de CMO en PyMEs estadounidenses.\n\nBilingüe ES/EN. AI-native desde el día uno. 14 verticales. ROI promedio 340%. 4.4× conversión vs agencias tradicionales.\n\nVer casos en netwebmedia.com.\n\n#EmprendimientoChileno #CMO #MarketingDigital #PyME #IA",
            'privacy'  => 'PUBLIC_TO_EVERYONE',
        ],
    ];
    return $defs[$key] ?? null;
}

function tt_allowed_reels(): array {
    return ['1_aeo_en', '1_aeo_es', '2_growth_en', '2_growth_es', '3_scale_en', '3_scale_es'];
}

function tt_allowed_privacy(): array {
    return ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR'];
}

/** Generate the TT-ready spec for a reel — video URL + caption + post_info. */
function tt_publish_spec(string $reelKey, string $reelBase, ?string $captionOverride = null, ?string $privacy = null): array {
    $def = tt_reel_def($reelKey);
    if (!$def) return ['error' => 'unknown reel'];

    $videoUrl = $reelBase . '/assets/social/campaign/' . $def['filename'];
    $caption  = $captionOverride !== null && $captionOverride !== '' ? $captionOverride : $def['caption'];
    $priv     = $privacy ?: $def['privacy'];

    return [
        'reel_key'   => $reelKey,
        'theme'      => $def['theme'],
        'language'   => $def['language'],
        'video_url'  => $videoUrl,
        'post_info'  => [
            'title'                    => $caption,
            'privacy_level'            => $priv,
            'disable_duet'             => false,
            'disable_comment'          => false,
            'disable_stitch'           => false,
            'video_cover_timestamp_ms' => 1000,
        ],
        'source_info' => [
            'source'    => 'PULL_FROM_URL',
            'video_url' => $videoUrl,
        ],
    ];
}

function tt_curl_post_json(string $url, string $accessToken, array $body, int $timeout = 30): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json; charset=UTF-8',
        ],
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $parsed = is_string($resp) ? json_decode($resp, true) : null;
    return ['http' => (int)$code, 'body' => $parsed, 'raw' => $resp];
}

// ── status ──────────────────────────────────────────────────────────────────
if ($action === 'status') {
    $cfg = [
        'tt_access_token' => $ttToken ? 'set' : 'unset',
        'tt_client_key'   => $ttKey ? 'set' : 'unset',
        'reel_base_url'   => $reelBase,
    ];
    if (!$ttToken) {
        jsonResponse([
            'configured' => false,
            'config'     => $cfg,
            'note'       => 'Add TT_ACCESS_TOKEN (+ optionally TT_CLIENT_KEY) to GitHub Secrets and redeploy. See tt_publish.php header for full setup checklist.',
            'reels_available' => tt_allowed_reels(),
        ]);
    }

    // Probe TikTok creator_info endpoint — returns nickname, privacy levels, comment caps.
    $r = tt_curl_post_json($apiBase . '/post/publish/creator_info/query/', $ttToken, []);
    $ok = ($r['http'] >= 200 && $r['http'] < 300 && !empty($r['body']['data']));
    jsonResponse([
        'configured'      => true,
        'config'          => $cfg,
        'creator_ok'      => $ok,
        'creator_info'    => $r['body']['data'] ?? null,
        'error'           => $r['body']['error'] ?? null,
        'reels_available' => tt_allowed_reels(),
        'note'            => $ok
            ? 'Ready. Token valid; creator metadata fetched.'
            : 'Token rejected by TikTok. Verify scopes (video.publish, user.info.basic) + that domain ownership is verified in TikTok Developer Portal → URL Prefix Configuration.',
    ]);
}

// ── spec ────────────────────────────────────────────────────────────────────
if ($action === 'spec') {
    $reel = (string)($_GET['reel'] ?? '');
    if (!in_array($reel, tt_allowed_reels(), true)) {
        jsonError('reel must be one of: ' . implode(', ', tt_allowed_reels()), 400);
    }
    jsonResponse(['spec' => tt_publish_spec($reel, $reelBase)]);
}

// ── publish ─────────────────────────────────────────────────────────────────
if ($action === 'publish') {
    if (!$ttToken) {
        http_response_code(503);
        jsonResponse(['error' => 'TT_ACCESS_TOKEN not configured', 'hint' => 'Add to GitHub Secrets + redeploy.']);
    }

    $raw = file_get_contents('php://input');
    $in  = $raw ? json_decode($raw, true) : [];
    if (!is_array($in)) jsonError('Invalid JSON body', 400);

    $reel    = (string)($in['reel'] ?? '');
    $capOvr  = isset($in['caption_override']) ? (string)$in['caption_override'] : null;
    $priv    = isset($in['privacy_level']) ? (string)$in['privacy_level'] : null;
    $dryRun  = !empty($in['dry_run']);

    if (!in_array($reel, tt_allowed_reels(), true)) {
        jsonError('reel must be one of: ' . implode(', ', tt_allowed_reels()), 400);
    }
    if ($priv !== null && !in_array($priv, tt_allowed_privacy(), true)) {
        jsonError('privacy_level must be one of: ' . implode(', ', tt_allowed_privacy()), 400);
    }

    $spec = tt_publish_spec($reel, $reelBase, $capOvr, $priv);
    if (isset($spec['error'])) jsonError($spec['error'], 400);

    // Idempotency: same reel published in last 24h?
    $stmt = $db->prepare(
        "SELECT id, status, publish_id, tt_post_id FROM tt_publish_log
         WHERE reel_key = ? AND status IN ('processing','complete','dry_run')
         AND created_at >= (NOW() - INTERVAL 24 HOUR)
         ORDER BY id DESC LIMIT 1"
    );
    $stmt->execute([$reel]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        jsonResponse([
            'reel_key'   => $reel,
            'status'     => 'already_published_recently',
            'publish_id' => $existing['publish_id'],
            'tt_post_id' => $existing['tt_post_id'],
            'log_id'     => $existing['id'],
            'note'       => '24h idempotency guard — same reel was published in the last 24 hours. Pass a different reel or wait.',
        ]);
    }

    // Pre-flight: confirm video URL is reachable (HEAD with browser UA — InMotion mod_security blocks bare curl)
    $ch = curl_init($spec['video_url']);
    curl_setopt_array($ch, [
        CURLOPT_NOBODY          => true,
        CURLOPT_RETURNTRANSFER  => true,
        CURLOPT_TIMEOUT         => 12,
        CURLOPT_FOLLOWLOCATION  => true,
        CURLOPT_SSL_VERIFYPEER  => true,
        CURLOPT_USERAGENT       => 'Mozilla/5.0 (compatible; NetWebMedia-Publisher/1.0)',
    ]);
    curl_exec($ch);
    $videoCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($videoCode < 200 || $videoCode >= 300) {
        jsonError("Video URL pre-flight failed: HTTP {$videoCode} on {$spec['video_url']}", 502);
    }

    if ($dryRun) {
        $stmt = $db->prepare(
            "INSERT INTO tt_publish_log (reel_key, caption, privacy_level, video_url, status, response_json)
             VALUES (?, ?, ?, ?, 'dry_run', ?)"
        );
        $stmt->execute([
            $reel,
            $spec['post_info']['title'],
            $spec['post_info']['privacy_level'],
            $spec['video_url'],
            json_encode(['dry_run' => true, 'spec' => $spec]),
        ]);
        jsonResponse([
            'reel_key'  => $reel,
            'status'    => 'dry_run',
            'spec'      => $spec,
            'note'      => 'Dry run logged — no call made to TikTok. Re-run with dry_run=false to publish.',
        ]);
    }

    // Init upload — TikTok Content Posting API v2
    $initBody = [
        'post_info'   => $spec['post_info'],
        'source_info' => $spec['source_info'],
    ];
    $r = tt_curl_post_json($apiBase . '/post/publish/video/init/', $ttToken, $initBody);

    $publishId = $r['body']['data']['publish_id'] ?? null;
    $tokenOk   = ($r['http'] >= 200 && $r['http'] < 300 && $publishId);

    // Log result
    $stmt = $db->prepare(
        "INSERT INTO tt_publish_log (reel_key, caption, privacy_level, video_url, publish_id, status, error, response_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $reel,
        $spec['post_info']['title'],
        $spec['post_info']['privacy_level'],
        $spec['video_url'],
        $publishId,
        $tokenOk ? 'processing' : 'failed',
        $tokenOk ? null : ('HTTP ' . $r['http'] . ': ' . ($r['body']['error']['message'] ?? $r['raw'])),
        json_encode($r['body'] ?? ['raw' => $r['raw']], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);
    $logId = (int)$db->lastInsertId();

    if (!$tokenOk) {
        http_response_code(502);
        jsonResponse([
            'reel_key'  => $reel,
            'log_id'    => $logId,
            'status'    => 'failed',
            'http'      => $r['http'],
            'error'     => $r['body']['error'] ?? null,
            'tiktok_response' => $r['body'],
            'note'      => 'TikTok rejected init. Common causes: url_ownership_unverified (verify domain in TT dev portal) | invalid access token | scope missing video.publish',
        ]);
    }

    jsonResponse([
        'reel_key'    => $reel,
        'log_id'      => $logId,
        'status'      => 'processing',
        'publish_id'  => $publishId,
        'note'        => 'TikTok accepted the init. Poll via action=status_check with this publish_id every 5–10s until status=PUBLISH_COMPLETE.',
    ]);
}

// ── status_check ────────────────────────────────────────────────────────────
if ($action === 'status_check') {
    if (!$ttToken) {
        http_response_code(503);
        jsonResponse(['error' => 'TT_ACCESS_TOKEN not configured']);
    }
    $raw = file_get_contents('php://input');
    $in  = $raw ? json_decode($raw, true) : [];
    $publishId = (string)($in['publish_id'] ?? $_GET['publish_id'] ?? '');
    if ($publishId === '') jsonError('publish_id required', 400);

    $r = tt_curl_post_json($apiBase . '/post/publish/status/fetch/', $ttToken, ['publish_id' => $publishId]);
    $data = $r['body']['data'] ?? null;
    $ttStatus = $data['status'] ?? 'UNKNOWN';

    // Update log row
    if ($ttStatus === 'PUBLISH_COMPLETE') {
        $postId = $data['publicaly_available_post_id'][0] ?? ($data['post_id'] ?? null);
        $db->prepare("UPDATE tt_publish_log SET status='complete', tt_post_id=?, response_json=? WHERE publish_id=?")
            ->execute([$postId, json_encode($r['body']), $publishId]);
    } elseif (in_array($ttStatus, ['FAILED', 'PROCESSING_FAILED', 'PUBLISH_FAILED'], true)) {
        $db->prepare("UPDATE tt_publish_log SET status='failed', error=?, response_json=? WHERE publish_id=?")
            ->execute([$data['fail_reason'] ?? $ttStatus, json_encode($r['body']), $publishId]);
    }

    jsonResponse([
        'publish_id' => $publishId,
        'tt_status'  => $ttStatus,
        'data'       => $data,
        'http'       => $r['http'],
    ]);
}

// ── list ────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $rows = $db->query(
        "SELECT id, reel_key, privacy_level, publish_id, tt_post_id, status, error, created_at, updated_at
         FROM tt_publish_log ORDER BY id DESC LIMIT 50"
    )->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['count' => count($rows), 'rows' => $rows]);
}

jsonError("Unknown action '{$action}'. Allowed: status | spec | publish | status_check | list", 400);

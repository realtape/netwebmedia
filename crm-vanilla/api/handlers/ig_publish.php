<?php
/**
 * Instagram Graph API publish handler — supports CAROUSEL (image set) and REELS (video) publishing
 * to @netwebmedia. Mirrors the fb_publish.php triple-auth + idempotent log pattern.
 *
 * Pre-flight env required:
 *   IG_BUSINESS_ACCOUNT_ID   — the Instagram Business Account ID (NOT the @username)
 *   IG_GRAPH_TOKEN           — long-lived access token w/ instagram_content_publish + pages_show_list
 *   IG_IMAGE_BASE_URL        — public base for slide PNG URLs (default https://netwebmedia.com)
 *
 * Auth: MIGRATE_TOKEN via ?token=, OR CRM session admin/owner, OR api-php session admin (mirrors fb_publish.php).
 *
 * Routes:
 *
 *   ── Status / inspection ───────────────────────────────────────────────────
 *   GET  /api/?r=ig_publish&action=status&token=…
 *           → readiness probe; verifies token + account access via /me + /{ig-user-id}
 *   GET  /api/?r=ig_publish&action=list&token=…
 *           → returns recent ig_publish_log rows (audit)
 *
 *   ── Carousel (legacy, image sets) ─────────────────────────────────────────
 *   GET  /api/?r=ig_publish&action=spec&carousel=a|b|c
 *           → returns IG-ready carousel payload spec (image URLs + caption)
 *   POST /api/?r=ig_publish&action=publish&token=…
 *           body: {carousel: 'a'|'b'|'c', caption?: string, dry_run?: bool}
 *           → publishes a 5-slide carousel; 3-step Meta flow (children → CAROUSEL container → publish)
 *
 *   ── Reels (service-reels-2026 batch — R2 through R10) ─────────────────────
 *   GET  /api/?r=ig_publish&action=reel_list&token=…
 *           → returns the catalog of 9 service reels (key, hook, post_date, status from log)
 *   GET  /api/?r=ig_publish&action=reel_spec&reel=R2|…|R10&token=…
 *           → returns IG-ready reel payload (video_url + caption)
 *   POST /api/?r=ig_publish&action=publish_reel&token=…
 *           body: {reel: 'R2'|…|'R10', caption_override?: string, share_to_feed?: bool, dry_run?: bool, poll_seconds?: int}
 *           → async Meta flow: (1) create REELS container → (2) poll status until FINISHED → (3) media_publish
 *           → idempotent on reel_key. If a prior container_id exists and isn't published yet,
 *             resumes the publish on that container instead of re-uploading.
 *   POST /api/?r=ig_publish&action=publish_all_reels&token=…
 *           body: {share_to_feed?: bool, dry_run?: bool, only?: ['R2','R3',…]}
 *           → sequentially publishes every reel in the catalog (or the `only` subset)
 *
 * Idempotency: `ig_publish_log.reel_key` (or `carousel_key`) is UNIQUE. Re-running a publish
 * with the same key returns the existing row's media_id when status='complete', or resumes
 * the existing container_id when status='processing'.
 */

$db = getDB();

// ── Triple auth (mirrors fb_publish.php) ────────────────────────────────────
$auth_ok = false;
$auth_method = null;
$token  = $_GET['token'] ?? $_POST['token'] ?? '';
$expect = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : '';
if ($expect && $token !== '' && hash_equals($expect, (string)$token)) {
    $auth_ok = true;
    $auth_method = 'migrate_token';
}
if (!$auth_ok) {
    require_once __DIR__ . '/../lib/guard.php';
    $user = function_exists('guard_user') ? guard_user() : null;
    if ($user && in_array(($user['role'] ?? ''), ['admin', 'superadmin', 'owner'], true)) {
        $auth_ok = true;
        $auth_method = 'session_' . $user['role'];
    }
}
if (!$auth_ok) {
    $bearer = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? ($_COOKIE['nwm_token'] ?? '');
    if ($bearer && strlen($bearer) >= 32) {
        $ch = curl_init('https://netwebmedia.com/api/auth/me');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['X-Auth-Token: ' . $bearer, 'Accept: application/json', 'User-Agent: NWM-IGPublish-AuthCheck/1.0'],
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code >= 200 && $code < 300 && is_string($body)) {
            $me = json_decode($body, true);
            $role = $me['user']['role'] ?? $me['role'] ?? '';
            if (in_array($role, ['admin', 'superadmin', 'owner'], true)) {
                $auth_ok = true;
                $auth_method = 'api_php_session_' . $role;
            }
        }
    }
}
if (!$auth_ok) {
    jsonResponse(['error' => 'Forbidden', 'hint' => 'Pass ?token=<MIGRATE_TOKEN>, or authenticate as admin via X-Auth-Token (CRM or api-php session).'], 403);
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$ALLOWED_CAROUSELS = ['a', 'b', 'c'];
$gv = 'v20.0';

// ── Service reels catalog (9 reels, matches assets/social/higgsfield/service-reels-2026/MANIFEST.json) ──
function ig_service_reels(): array {
    return [
        'R2' => [
            'service' => 'AI Content Creation & Copywriting',
            'hook'    => 'From Weeks to Minutes',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013908_20a2b178-f5de-4971-80ac-ce8c2e7b7dc8.mp4',
            'caption' => "From weeks to minutes. ⚡\n\nWhat used to take a full content team all week now happens before your first coffee.\n\nAI-powered copywriting that:\n→ Writes your emails, ads, and social posts\n→ Matches your brand voice automatically\n→ Scales across 14+ industries\n\nNo more staring at a blank page.\nNo more last-minute copy scrambles.\n\n👉 Book a free content audit — link in bio.\n\n#AIContentCreation #ContentMarketing #AIMarketing #DigitalMarketing #CopywritingTips #MarketingAutomation #ContentStrategy #SmallBusinessMarketing #MarketingAgency #AItools #ContentCreator #MarketingTips #GrowthMarketing #BusinessGrowth #NetWebMedia",
        ],
        'R3' => [
            'service' => 'Multi-Platform Content Strategy',
            'hook'    => 'One Strategy. All Platforms.',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013911_84ba09d2-de23-488c-a8fb-adca93794dc5.mp4',
            'caption' => "One strategy. Every platform. Zero chaos.\n\nMost businesses post randomly and wonder why nothing sticks.\n\nThe brands winning in 2026 have one thing in common:\n→ A unified cross-platform strategy\n→ Content adapted for each channel\n→ Consistent messaging that compounds\n\nInstagram. YouTube. Facebook. TikTok.\nOne source of truth. All four channels fed.\n\n💬 DM us \"STRATEGY\" for a free content audit.\n\n#ContentStrategy #MultiPlatformMarketing #SocialMediaMarketing #DigitalMarketing #MarketingStrategy #ContentMarketing #SocialMediaStrategy #InstagramMarketing #YouTubeMarketing #FacebookMarketing #MarketingAgency #BrandStrategy #DigitalAgency #GrowthMarketing #NetWebMedia",
        ],
        'R4' => [
            'service' => 'SEO & AI Search Optimization',
            'hook'    => 'Stop Guessing. Rank on Google.',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013914_1242f89d-73a0-42fe-abe3-3e7205fa08c3.mp4',
            'caption' => "Stop guessing. Start ranking. 🎯\n\nIf your website isn't on page 1, your competitors are eating your lunch.\n\nHere's what actually moves the needle in 2026:\n→ AI-first keyword research\n→ AEO (Answer Engine Optimization) for ChatGPT & Gemini\n→ Schema markup that gets you cited by AI\n\nWe've helped businesses in 14 industries climb from page 4 to position 1.\n\n📊 Free SEO + AEO audit — link in bio.\n\n#SEO #SearchEngineOptimization #AEO #AnswerEngineOptimization #GoogleRanking #DigitalMarketing #LocalSEO #SEOtips #ContentSEO #AISearch #MarketingAgency #OrganicGrowth #SEOstrategy #SearchMarketing #NetWebMedia",
        ],
        'R5' => [
            'service' => 'Lead Generation & Conversion Optimization',
            'hook'    => 'More Leads. Better Leads.',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013918_299789b7-b283-4403-9105-67c6cd19f16c.mp4',
            'caption' => "More leads. Better leads. Lower cost. 🚀\n\nGetting traffic is easy. Converting it is the hard part.\n\nMost businesses lose 94% of visitors without capturing a single lead.\n\nWe fix that by:\n→ Rebuilding your conversion funnel from the ground up\n→ A/B testing every CTA and landing page element\n→ Scoring leads automatically so your sales team closes faster\n\nThe result? More pipeline. Less wasted budget.\n\n📈 Free conversion audit — link in bio.\n\n#LeadGeneration #ConversionOptimization #DigitalMarketing #SalesMarketing #MarketingFunnel #LeadGen #B2BMarketing #ConversionRate #CRO #MarketingStrategy #SalesGrowth #GrowthHacking #MarketingAgency #BusinessGrowth #NetWebMedia",
        ],
        'R6' => [
            'service' => 'Performance Analytics & Reporting',
            'hook'    => "Numbers Don't Lie",
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013921_051bd9da-e222-4158-8bd4-6a5485f85fa9.mp4',
            'caption' => "Numbers don't lie. Your gut does. 📊\n\nMost businesses run their marketing on vibes.\nThe ones that scale run it on data.\n\nWe build dashboards that show you:\n→ CAC — what each customer actually costs\n→ LTV — how much each customer is worth\n→ ROAS — your real return on ad spend\n→ CTR & CPC — where your funnel leaks\n\nWhen you can see everything, you fix everything.\n\n💻 DM us for a dashboard demo.\n\n#MarketingAnalytics #DataDrivenMarketing #DigitalMarketing #PerformanceMarketing #ROAS #MarketingMetrics #BusinessIntelligence #MarketingROI #DataAnalytics #KPIs #MarketingDashboard #GrowthMarketing #MarketingAgency #DigitalStrategy #NetWebMedia",
        ],
        'R7' => [
            'service' => 'Video Marketing & Production',
            'hook'    => 'Video Stops the Scroll',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013925_0b5a1e85-2441-49a6-8963-c4aa8d34c3c2.mp4',
            'caption' => "Video stops the scroll. Everything else hopes to. 🎬\n\nStatic posts are losing reach. Video gets 3x the engagement.\n\nBut not just any video — strategic video that:\n→ Opens with a hook in the first 2 seconds\n→ Delivers value that keeps viewers watching\n→ Ends with a CTA that actually converts\n\nFrom YouTube to Reels to paid ad creative, we produce video content that works for your brand.\n\n📅 Book a free video strategy call — link in bio.\n\n#VideoMarketing #VideoContent #ContentMarketing #ReelsMarketing #YoutubeMarketing #VideoProduction #DigitalMarketing #SocialMediaVideo #VideoStrategy #ContentCreator #VideoAds #MarketingAgency #BrandVideo #VisualMarketing #NetWebMedia",
        ],
        'R8' => [
            'service' => 'Email Marketing Automation',
            'hook'    => 'Your Emails Are Underperforming',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013928_bf1e7dfe-35ff-4842-932f-60e864bff85a.mp4',
            'caption' => "Your emails are underperforming. Here's why. 📧\n\nAverage open rate across industries: 21%.\nOur clients' average: 43%.\n\nThe difference isn't a better subject line.\nIt's a smarter system:\n\n→ Segmented lists (no more blasting everyone)\n→ Automated sequences triggered by behavior\n→ Personalization beyond just \"Hi [First Name]\"\n→ Re-engagement flows that win back cold subscribers\n\nEmail still delivers the highest ROI of any channel.\nYou just need to do it right.\n\n📬 Free email audit — link in bio.\n\n#EmailMarketing #EmailAutomation #DigitalMarketing #MarketingAutomation #EmailStrategy #EmailList #LeadNurturing #MarketingTips #EmailCampaign #AutomationMarketing #CRMMarketing #GrowthMarketing #MarketingAgency #EmailMarketingTips #NetWebMedia",
        ],
        'R9' => [
            'service' => 'Social Media Management & Scheduling',
            'hook'    => 'Never Miss a Post Again',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013931_bacfa51a-5e38-44e0-90bf-86de964f911a.mp4',
            'caption' => "Never miss a post again. 📅\n\nPosting inconsistently is worse than not posting at all.\nThe algorithm rewards consistency. Full stop.\n\nWe set up a system that:\n→ Plans your content 4 weeks ahead\n→ Schedules posts automatically across all platforms\n→ Monitors engagement so you never miss a comment\n→ Reports what's working so you can double down\n\nYour brand stays visible. You stay focused on your business.\n\n💬 DM \"SOCIAL\" to streamline your content.\n\n#SocialMediaManagement #SocialMediaMarketing #ContentScheduling #DigitalMarketing #SocialMediaStrategy #ContentCalendar #InstagramMarketing #FacebookMarketing #SocialMediaTips #MarketingAutomation #ContentPlanning #MarketingAgency #BrandConsistency #SocialMedia #NetWebMedia",
        ],
        'R10' => [
            'service' => 'Paid Ads Management',
            'hook'    => 'Stop Burning Ad Budget',
            'video_url' => 'https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU/hf_20260512_013934_b0b714cd-0792-441c-a8eb-0b5cc0d7ddfb.mp4',
            'caption' => "Stop burning your ad budget. 🔥\n\nIf your ROAS is below 3x, you're leaving money on the table.\n\nMost businesses waste 40–60% of their ad spend on:\n→ Wrong audiences\n→ Weak creative\n→ No optimization cadence\n\nWe manage Google, Meta, and TikTok Ads with a data-first approach:\n→ CPC from \$4.20 → \$1.10\n→ ROAS from 1.2x → 4.8x\n→ Conversions up. Budget down.\n\n📊 Free ad audit — link in bio.\n\n#PaidAds #GoogleAds #MetaAds #TikTokAds #PaidAdvertising #DigitalMarketing #PerformanceMarketing #ROAS #AdOptimization #PPC #FacebookAds #MarketingROI #AdStrategy #GrowthMarketing #NetWebMedia",
        ],
    ];
}

function ig_env(string $key, string $default = ''): string {
    if (defined($key)) return (string)constant($key);
    $v = getenv($key);
    return $v !== false ? (string)$v : $default;
}

// ── Schema guard — idempotent audit log ─────────────────────────────────────
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `ig_publish_log` (
          `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `kind`              ENUM('carousel','reel') NOT NULL,
          `item_key`          VARCHAR(64) NOT NULL,
          `caption`           TEXT,
          `media_url`         VARCHAR(512) DEFAULT NULL,
          `container_id`      VARCHAR(64) DEFAULT NULL,
          `child_container_ids_json` TEXT,
          `ig_media_id`       VARCHAR(64) DEFAULT NULL,
          `status`            ENUM('pending','processing','complete','failed','dry_run') NOT NULL DEFAULT 'pending',
          `error`             TEXT,
          `response_json`     MEDIUMTEXT,
          `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uniq_kind_item` (`kind`, `item_key`),
          INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // ignore — exists
}

// ── HTTP helpers ────────────────────────────────────────────────────────────
function ig_curl_post(string $url, array $fields, int $timeout = 20): array {
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

function ig_curl_get(string $url, int $timeout = 15): array {
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

function ig_get_input(): array {
    $raw = file_get_contents('php://input');
    $in  = $raw ? json_decode($raw, true) : null;
    if (!is_array($in)) {
        // fall back to POST form fields
        $in = $_POST ?: [];
    }
    return $in;
}

/** Carousel spec — image URLs + caption. (Legacy carousel functionality.) */
function ig_carousel_def(string $id): ?array {
    $defs = [
        'a' => [
            'title' => 'Who we are',
            'caption' => "AI-native fractional CMO. We get SMBs cited in ChatGPT, Claude, and Perplexity.\n\n• 60 days to first AI citation\n• 340% average ROI\n• 4.4x conversion vs traditional agencies\n\nFree audit at netwebmedia.com — \$997 credited toward first retainer.\n\n#AEO #AImarketing #fractionalCMO",
        ],
        'b' => [
            'title' => 'How NWM is different',
            'caption' => "Traditional agency: 40 people, 6 weeks, \"let me check with the team.\"\n\nNWM: 1 senior operator + 12 AI agents. Same agency-grade output, half the cost, no handoffs.\n\nDirect line to the founder. Bilingual EN/ES.\n\nBook a strategy call: netwebmedia.com/contact\n\n#agencylife #AIagents",
        ],
        'c' => [
            'title' => 'What is AEO?',
            'caption' => "SEO is over. AEO is starting.\n\nBuyers ask ChatGPT, not Google. The brands cited in those answers get the calls.\n\n• 18% of search is AI now (40% YoY growth)\n• Schema beats backlinks\n• Reviews still drive AI summaries\n\nFree AEO audit at netwebmedia.com.\n\n#AEO #AnswerEngineOptimization #SEO",
        ],
    ];
    return $defs[$id] ?? null;
}

function ig_publish_carousel_spec(string $carouselId, string $imageBase): array {
    $def = ig_carousel_def($carouselId);
    if (!$def) return ['error' => 'unknown carousel'];
    $slides = [];
    for ($i = 1; $i <= 5; $i++) {
        $slides[] = [
            'slide_number' => $i,
            'image_url'    => rtrim($imageBase, '/') . "/assets/social/carousels/{$carouselId}-slide-{$i}.png",
        ];
    }
    return [
        'carousel'   => $carouselId,
        'title'      => $def['title'],
        'caption'    => $def['caption'],
        'slides'     => $slides,
        'media_type' => 'CAROUSEL',
    ];
}

$accountId = ig_env('IG_BUSINESS_ACCOUNT_ID');
$tokenIG   = ig_env('IG_GRAPH_TOKEN');
$imageBase = ig_env('IG_IMAGE_BASE_URL', 'https://netwebmedia.com');

// ─────────────────────────────────────────────────────────────────────────────
// status
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'status') {
    $configured = (bool)$accountId && (bool)$tokenIG;
    $resp = [
        'configured'             => $configured,
        'ig_business_account_id' => $accountId ? 'set' : 'unset',
        'ig_graph_token'         => $tokenIG ? 'set' : 'unset',
        'ig_image_base_url'      => $imageBase,
        'available_carousels'    => $ALLOWED_CAROUSELS,
        'available_reels'        => array_keys(ig_service_reels()),
        'auth_method'            => $auth_method,
    ];
    if ($configured) {
        $rMe = ig_curl_get("https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "?fields=id,username,name&access_token=" . urlencode($tokenIG));
        $resp['account_response'] = $rMe['body'];
        $resp['account_accessible'] = ($rMe['http'] >= 200 && $rMe['http'] < 300 && !empty($rMe['body']['id']));
        $resp['note'] = $resp['account_accessible']
            ? 'Ready for live publish.'
            : 'Token cannot access the configured IG_BUSINESS_ACCOUNT_ID — check scopes (instagram_content_publish, pages_show_list, instagram_basic).';
    } else {
        $resp['note'] = 'IG_BUSINESS_ACCOUNT_ID and IG_GRAPH_TOKEN must be set in deploy secrets. See _deploy/social-publishing-unblock-2026-05-11.md.';
    }
    jsonResponse($resp);
}

// ─────────────────────────────────────────────────────────────────────────────
// list (audit log)
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $rows = $db->query(
        "SELECT id, kind, item_key, ig_media_id, container_id, status, error, created_at, updated_at
         FROM ig_publish_log ORDER BY created_at DESC LIMIT 50"
    )->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['count' => count($rows), 'rows' => $rows]);
}

// ─────────────────────────────────────────────────────────────────────────────
// reel_list — catalog of 9 service reels + their log status
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'reel_list') {
    $reels = ig_service_reels();
    $stmt = $db->prepare("SELECT item_key, status, ig_media_id, container_id, error, updated_at FROM ig_publish_log WHERE kind='reel'");
    $stmt->execute();
    $logIndex = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) $logIndex[$r['item_key']] = $r;
    $out = [];
    foreach ($reels as $key => $r) {
        $out[] = [
            'key'       => $key,
            'service'   => $r['service'],
            'hook'      => $r['hook'],
            'video_url' => $r['video_url'],
            'log'       => $logIndex[$key] ?? null,
        ];
    }
    jsonResponse(['count' => count($out), 'reels' => $out]);
}

// ─────────────────────────────────────────────────────────────────────────────
// reel_spec — single reel spec for dry-run inspection
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'reel_spec') {
    $key = strtoupper((string)($_GET['reel'] ?? ''));
    $reels = ig_service_reels();
    if (!isset($reels[$key])) jsonError(['error' => 'unknown reel', 'available' => array_keys($reels)], 400);
    jsonResponse(['reel' => $key] + $reels[$key]);
}

// ─────────────────────────────────────────────────────────────────────────────
// spec (carousel — legacy)
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'spec') {
    $carousel = strtolower((string)($_GET['carousel'] ?? ''));
    if (!in_array($carousel, $ALLOWED_CAROUSELS, true)) jsonError('carousel must be a, b, or c', 400);
    jsonResponse(ig_publish_carousel_spec($carousel, $imageBase));
}

// From here down, all actions are POST + require live config
if ($method !== 'POST') {
    jsonError('Use POST for publish actions. Unknown GET action: ' . $action, 400);
}

if (!$accountId || !$tokenIG) {
    http_response_code(503);
    jsonResponse(['error' => 'IG_BUSINESS_ACCOUNT_ID and IG_GRAPH_TOKEN not configured', 'hint' => 'Add to GitHub Secrets + redeploy.']);
}

// ─────────────────────────────────────────────────────────────────────────────
// publish_reel — async REELS publish (container → poll → publish)
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'publish_reel' || $action === 'publish_all_reels') {

    $in = ig_get_input();
    $reels = ig_service_reels();
    $shareToFeed = !array_key_exists('share_to_feed', $in) || !empty($in['share_to_feed']); // default true
    $dryRun      = !empty($in['dry_run']);
    $pollSeconds = isset($in['poll_seconds']) ? max(10, min(120, (int)$in['poll_seconds'])) : 90;

    $reelsToPublish = [];
    if ($action === 'publish_reel') {
        $key = strtoupper((string)($in['reel'] ?? ''));
        if (!isset($reels[$key])) jsonError(['error' => 'unknown reel', 'available' => array_keys($reels)], 400);
        $reelsToPublish[$key] = $reels[$key];
        // optional caption override
        if (!empty($in['caption_override']) && is_string($in['caption_override'])) {
            $reelsToPublish[$key]['caption'] = $in['caption_override'];
        }
    } else {
        // publish_all_reels — optionally filtered by `only`
        $only = isset($in['only']) && is_array($in['only']) ? array_map('strtoupper', $in['only']) : null;
        foreach ($reels as $k => $r) {
            if ($only !== null && !in_array($k, $only, true)) continue;
            $reelsToPublish[$k] = $r;
        }
    }

    $results = [];

    foreach ($reelsToPublish as $key => $r) {
        $videoUrl = $r['video_url'];
        $caption  = $r['caption'];

        // Idempotency check
        $stmt = $db->prepare("SELECT id, status, container_id, ig_media_id, error FROM ig_publish_log WHERE kind='reel' AND item_key=?");
        $stmt->execute([$key]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing && $existing['status'] === 'complete' && $existing['ig_media_id']) {
            $results[] = ['reel' => $key, 'status' => 'already_published', 'ig_media_id' => $existing['ig_media_id']];
            continue;
        }

        if ($dryRun) {
            $upsert = $db->prepare(
                "INSERT INTO ig_publish_log (kind, item_key, caption, media_url, status)
                 VALUES ('reel', ?, ?, ?, 'dry_run')
                 ON DUPLICATE KEY UPDATE caption=VALUES(caption), media_url=VALUES(media_url), status='dry_run', error=NULL"
            );
            $upsert->execute([$key, $caption, $videoUrl]);
            $results[] = ['reel' => $key, 'status' => 'dry_run', 'video_url' => $videoUrl, 'caption_preview' => substr($caption, 0, 100) . '…'];
            continue;
        }

        // ── Step 1: container (or resume) ───────────────────────────────────
        $containerId = ($existing && $existing['container_id']) ? $existing['container_id'] : null;
        if (!$containerId) {
            $url = "https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "/media";
            $payload = [
                'media_type'    => 'REELS',
                'video_url'     => $videoUrl,
                'caption'       => $caption,
                'share_to_feed' => $shareToFeed ? 'true' : 'false',
                'access_token'  => $tokenIG,
            ];
            $rc = ig_curl_post($url, $payload, 30);
            if ($rc['http'] < 200 || $rc['http'] >= 300 || empty($rc['body']['id'])) {
                $err = is_array($rc['body']) && isset($rc['body']['error']['message']) ? $rc['body']['error']['message'] : ('container http ' . $rc['http']);
                $upsert = $db->prepare(
                    "INSERT INTO ig_publish_log (kind, item_key, caption, media_url, status, error, response_json)
                     VALUES ('reel', ?, ?, ?, 'failed', ?, ?)
                     ON DUPLICATE KEY UPDATE caption=VALUES(caption), media_url=VALUES(media_url), status='failed', error=VALUES(error), response_json=VALUES(response_json)"
                );
                $upsert->execute([$key, $caption, $videoUrl, $err, json_encode($rc['body'])]);
                $results[] = ['reel' => $key, 'status' => 'failed', 'stage' => 'container_create', 'http' => $rc['http'], 'error' => $err, 'response' => $rc['body']];
                continue;
            }
            $containerId = (string)$rc['body']['id'];
            $upsert = $db->prepare(
                "INSERT INTO ig_publish_log (kind, item_key, caption, media_url, container_id, status)
                 VALUES ('reel', ?, ?, ?, ?, 'processing')
                 ON DUPLICATE KEY UPDATE caption=VALUES(caption), media_url=VALUES(media_url), container_id=VALUES(container_id), status='processing', error=NULL"
            );
            $upsert->execute([$key, $caption, $videoUrl, $containerId]);
        }

        // ── Step 2: poll container status until FINISHED ────────────────────
        $start = time();
        $status = null;
        $statusBody = null;
        while ((time() - $start) < $pollSeconds) {
            sleep(5);
            $url = "https://graph.facebook.com/{$gv}/" . urlencode($containerId) . "?fields=status_code,status&access_token=" . urlencode($tokenIG);
            $rs = ig_curl_get($url, 10);
            if ($rs['http'] >= 200 && $rs['http'] < 300 && is_array($rs['body'])) {
                $status = $rs['body']['status_code'] ?? null;
                $statusBody = $rs['body'];
                if (in_array($status, ['FINISHED', 'ERROR', 'EXPIRED', 'PUBLISHED'], true)) break;
            }
        }

        if ($status !== 'FINISHED' && $status !== 'PUBLISHED') {
            // Save state but don't fail permanently — caller can re-run to resume
            $note = $status ? "container status=$status after {$pollSeconds}s poll" : 'container status unknown after poll';
            $upsert = $db->prepare(
                "UPDATE ig_publish_log SET status='processing', error=?, response_json=? WHERE kind='reel' AND item_key=?"
            );
            $upsert->execute([$note, json_encode($statusBody), $key]);
            $results[] = ['reel' => $key, 'status' => 'still_processing', 'container_id' => $containerId, 'last_status_code' => $status, 'hint' => 'Re-run publish_reel for the same reel to resume.', 'response' => $statusBody];
            continue;
        }

        // ── Step 3: media_publish ──────────────────────────────────────────
        $url = "https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "/media_publish";
        $rp = ig_curl_post($url, ['creation_id' => $containerId, 'access_token' => $tokenIG], 30);
        if ($rp['http'] < 200 || $rp['http'] >= 300 || empty($rp['body']['id'])) {
            $err = is_array($rp['body']) && isset($rp['body']['error']['message']) ? $rp['body']['error']['message'] : ('publish http ' . $rp['http']);
            $upsert = $db->prepare(
                "UPDATE ig_publish_log SET status='failed', error=?, response_json=? WHERE kind='reel' AND item_key=?"
            );
            $upsert->execute([$err, json_encode($rp['body']), $key]);
            $results[] = ['reel' => $key, 'status' => 'failed', 'stage' => 'media_publish', 'container_id' => $containerId, 'http' => $rp['http'], 'error' => $err, 'response' => $rp['body']];
            continue;
        }

        $mediaId = (string)$rp['body']['id'];
        $upsert = $db->prepare(
            "UPDATE ig_publish_log SET status='complete', ig_media_id=?, error=NULL, response_json=? WHERE kind='reel' AND item_key=?"
        );
        $upsert->execute([$mediaId, json_encode($rp['body']), $key]);
        $results[] = ['reel' => $key, 'status' => 'published', 'container_id' => $containerId, 'ig_media_id' => $mediaId];
    }

    jsonResponse([
        'ok'      => true,
        'action'  => $action,
        'dry_run' => $dryRun,
        'count'   => count($results),
        'results' => $results,
        'ts'      => date('c'),
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// publish (carousel — legacy)
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'publish') {
    $d = ig_get_input();
    $carousel = strtolower((string)($d['carousel'] ?? ''));
    if (!in_array($carousel, $ALLOWED_CAROUSELS, true)) jsonError('carousel must be a, b, or c', 400);

    $spec = ig_publish_carousel_spec($carousel, $imageBase);
    $caption = isset($d['caption']) && is_string($d['caption']) ? $d['caption'] : $spec['caption'];
    $dryRun  = !empty($d['dry_run']);

    // Pre-flight: all 5 images must be reachable
    $unreachable = [];
    foreach ($spec['slides'] as $slide) {
        $ch = curl_init($slide['image_url']);
        curl_setopt_array($ch, [CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 5, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_FOLLOWLOCATION => true]);
        curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code < 200 || $code >= 400) $unreachable[] = ['url' => $slide['image_url'], 'http' => (int)$code];
    }
    if ($unreachable) {
        jsonError(['error' => 'One or more carousel images are unreachable', 'unreachable' => $unreachable, 'fix' => 'Run "Export all 15 as PNG" on /social-carousel-preview.html and upload PNGs.'], 412);
    }

    if ($dryRun) {
        $upsert = $db->prepare(
            "INSERT INTO ig_publish_log (kind, item_key, caption, status)
             VALUES ('carousel', ?, ?, 'dry_run')
             ON DUPLICATE KEY UPDATE caption=VALUES(caption), status='dry_run', error=NULL"
        );
        $upsert->execute([$carousel, $caption]);
        jsonResponse(['dry_run' => true, 'spec' => array_merge($spec, ['caption' => $caption])]);
    }

    // Idempotency
    $stmt = $db->prepare("SELECT id, status, ig_media_id FROM ig_publish_log WHERE kind='carousel' AND item_key=?");
    $stmt->execute([$carousel]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing && $existing['status'] === 'complete' && $existing['ig_media_id']) {
        jsonResponse(['carousel' => $carousel, 'status' => 'already_published', 'ig_media_id' => $existing['ig_media_id']]);
    }

    // 1) child containers
    $childIds = [];
    foreach ($spec['slides'] as $slide) {
        $url = "https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "/media";
        $rc = ig_curl_post($url, [
            'image_url'         => $slide['image_url'],
            'is_carousel_item'  => 'true',
            'access_token'      => $tokenIG,
        ], 20);
        if ($rc['http'] >= 200 && $rc['http'] < 300 && !empty($rc['body']['id'])) {
            $childIds[] = (string)$rc['body']['id'];
        } else {
            jsonError(['error' => 'Slide media upload failed', 'slide' => $slide['slide_number'], 'http' => $rc['http'], 'body' => $rc['body'], 'partial_child_ids' => $childIds], 502);
        }
    }

    // 2) CAROUSEL container
    $url = "https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "/media";
    $rcar = ig_curl_post($url, [
        'media_type'   => 'CAROUSEL',
        'children'     => implode(',', $childIds),
        'caption'      => $caption,
        'access_token' => $tokenIG,
    ], 20);
    if ($rcar['http'] < 200 || $rcar['http'] >= 300 || empty($rcar['body']['id'])) {
        jsonError(['error' => 'Carousel container creation failed', 'http' => $rcar['http'], 'body' => $rcar['body'], 'child_ids' => $childIds], 502);
    }
    $containerId = (string)$rcar['body']['id'];

    // 3) publish
    $url = "https://graph.facebook.com/{$gv}/" . urlencode($accountId) . "/media_publish";
    $rp = ig_curl_post($url, ['creation_id' => $containerId, 'access_token' => $tokenIG], 20);
    if ($rp['http'] < 200 || $rp['http'] >= 300 || empty($rp['body']['id'])) {
        jsonError(['error' => 'Final publish failed', 'http' => $rp['http'], 'body' => $rp['body'], 'carousel_container_id' => $containerId], 502);
    }
    $mediaId = (string)$rp['body']['id'];

    $upsert = $db->prepare(
        "INSERT INTO ig_publish_log (kind, item_key, caption, container_id, child_container_ids_json, ig_media_id, status, response_json)
         VALUES ('carousel', ?, ?, ?, ?, ?, 'complete', ?)
         ON DUPLICATE KEY UPDATE caption=VALUES(caption), container_id=VALUES(container_id),
                                 child_container_ids_json=VALUES(child_container_ids_json),
                                 ig_media_id=VALUES(ig_media_id), status='complete', error=NULL,
                                 response_json=VALUES(response_json)"
    );
    $upsert->execute([$carousel, $caption, $containerId, json_encode($childIds), $mediaId, json_encode($rp['body'])]);

    jsonResponse([
        'published'             => true,
        'carousel'              => $carousel,
        'instagram_media_id'    => $mediaId,
        'carousel_container_id' => $containerId,
        'child_container_ids'   => $childIds,
    ]);
}

jsonError('Unknown action. Use: status | list | spec | publish | reel_list | reel_spec | publish_reel | publish_all_reels', 400);

<?php
/**
 * Instagram Graph API publish stub handler.
 *
 * Minimal scaffold for posting carousel sets to @netwebmedia once Carlos
 * completes (a) Instagram Business Account connection to a Facebook Page,
 * (b) Facebook App + Instagram Content Publishing permission via App Review,
 * and (c) generates a long-lived access token. None of those can happen
 * autonomously — they all require human identity verification at Meta.
 *
 * Routes (admin only):
 *   GET  /api/?r=ig_publish&action=status                → readiness probe
 *   GET  /api/?r=ig_publish&action=spec&carousel=a|b|c   → returns the IG-ready
 *           publish payload spec for a given carousel ID, useful for verifying
 *           image URLs + caption before going live.
 *   POST /api/?r=ig_publish&action=publish               → actually publish.
 *           body: {carousel: 'a'|'b'|'c', caption?: string, dry_run?: bool}
 *           503 if env not configured (mirrors wa_flush.php pattern).
 *
 * Pre-flight env required for live publishing:
 *   IG_BUSINESS_ACCOUNT_ID   — the Instagram Business Account ID (NOT the @username)
 *   IG_GRAPH_TOKEN           — long-lived access token with instagram_content_publish
 *   IG_IMAGE_BASE_URL        — public base for slide PNG URLs (e.g. https://netwebmedia.com)
 *
 * Image URLs MUST be PNG/JPG and publicly reachable. The 15 slides ship as SVGs
 * at /assets/social/carousels/*.svg — Carlos exports them to PNG via the
 * "Export all 15 as PNG" button on /social-carousel-preview.html and uploads
 * the PNGs to /assets/social/carousels/*.png before live publish.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db    = getDB();
$user  = guard_user();
$uid   = ($user && !empty($user['id'])) ? (int)$user['id'] : null;

if (!$user || !$uid) jsonError('Authentication required', 401);
$role = $user['role'] ?? 'member';
if (!in_array($role, ['admin', 'owner'], true)) {
    jsonError('Admin role required for Instagram publishing', 403);
}

$action = isset($_GET['action']) ? (string)$_GET['action'] : 'status';

$ALLOWED_CAROUSELS = ['a', 'b', 'c'];

/** Built-in carousel definitions — these match assets/social/carousels/{a,b,c}-slide-{1..5}.png */
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

/** Generate the IG-ready spec for a carousel — image URLs + caption. */
function ig_publish_spec(string $carouselId, string $imageBase): array {
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
        'carousel'  => $carouselId,
        'title'     => $def['title'],
        'caption'   => $def['caption'],
        'slides'    => $slides,
        'media_type' => 'CAROUSEL',
    ];
}

/** Read env values from defines or env vars. */
function ig_env(string $key, string $default = ''): string {
    if (defined($key)) return (string)constant($key);
    $v = getenv($key);
    return $v !== false ? (string)$v : $default;
}

switch ($method) {

    case 'GET':
        if ($action === 'status') {
            $configured = (bool)ig_env('IG_BUSINESS_ACCOUNT_ID') && (bool)ig_env('IG_GRAPH_TOKEN');
            jsonResponse([
                'configured'             => $configured,
                'ig_business_account_id' => ig_env('IG_BUSINESS_ACCOUNT_ID') ? 'set' : 'unset',
                'ig_graph_token'         => ig_env('IG_GRAPH_TOKEN') ? 'set' : 'unset',
                'ig_image_base_url'      => ig_env('IG_IMAGE_BASE_URL', 'https://netwebmedia.com'),
                'available_carousels'    => $ALLOWED_CAROUSELS,
                'note'                   => $configured
                    ? 'Ready for live publish.'
                    : 'IG_BUSINESS_ACCOUNT_ID and IG_GRAPH_TOKEN must be set in deploy secrets. See _deploy/social-channel-activation.md §1 + §3 for the full setup. Note Instagram Content Publishing permission requires App Review (~2-4 weeks).',
            ]);
            break;
        }

        if ($action === 'spec') {
            $carousel = strtolower((string)($_GET['carousel'] ?? ''));
            if (!in_array($carousel, $ALLOWED_CAROUSELS, true)) jsonError('carousel must be a, b, or c', 400);
            $imageBase = ig_env('IG_IMAGE_BASE_URL', 'https://netwebmedia.com');
            jsonResponse(ig_publish_spec($carousel, $imageBase));
            break;
        }

        jsonError('Unknown GET action', 400);
        break;

    case 'POST':
        if (function_exists('require_org_access_for_write')) {
            require_org_access_for_write('admin');
        }

        if ($action === 'publish') {
            $accountId = ig_env('IG_BUSINESS_ACCOUNT_ID');
            $token     = ig_env('IG_GRAPH_TOKEN');
            $imageBase = ig_env('IG_IMAGE_BASE_URL', 'https://netwebmedia.com');

            $d = getInput();
            $carousel = strtolower((string)($d['carousel'] ?? ''));
            if (!in_array($carousel, $ALLOWED_CAROUSELS, true)) jsonError('carousel must be a, b, or c', 400);

            $spec = ig_publish_spec($carousel, $imageBase);
            $caption = isset($d['caption']) && is_string($d['caption']) ? $d['caption'] : $spec['caption'];
            $dryRun  = !empty($d['dry_run']);

            if (!$accountId || !$token) {
                http_response_code(503);
                jsonResponse([
                    'error' => 'Instagram Graph API not configured',
                    'detail' => 'IG_BUSINESS_ACCOUNT_ID and IG_GRAPH_TOKEN must be set in deploy secrets. Instagram Content Publishing permission also requires Facebook App Review (typically 2–4 weeks). Use action=spec to verify the publish payload in the meantime.',
                    'dry_run_spec' => $spec,
                ]);
                break;
            }

            // Verify the 5 image PNGs are reachable BEFORE attempting to upload to Meta
            $unreachable = [];
            foreach ($spec['slides'] as $slide) {
                $ch = curl_init($slide['image_url']);
                curl_setopt_array($ch, [
                    CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 5,
                    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_FOLLOWLOCATION => true,
                ]);
                curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($code < 200 || $code >= 400) $unreachable[] = ['url' => $slide['image_url'], 'http' => (int)$code];
            }
            if ($unreachable) {
                jsonError([
                    'error'       => 'One or more carousel images are unreachable',
                    'unreachable' => $unreachable,
                    'fix'         => 'Run "Export all 15 as PNG" on /social-carousel-preview.html and upload the PNGs to /assets/social/carousels/ before publish.',
                ], 412);
            }

            if ($dryRun) {
                jsonResponse([
                    'dry_run' => true,
                    'spec'    => array_merge($spec, ['caption' => $caption]),
                    'note'    => 'All slide images reachable. Live publish will: (1) upload 5 media containers, (2) create a CAROUSEL container, (3) call media_publish.',
                ]);
                break;
            }

            // Step 1: upload each slide as a media container with is_carousel_item=true
            $childIds = [];
            $errors = [];
            foreach ($spec['slides'] as $slide) {
                $url = "https://graph.facebook.com/v20.0/" . urlencode($accountId) . "/media";
                $payload = [
                    'image_url'         => $slide['image_url'],
                    'is_carousel_item'  => 'true',
                    'access_token'      => $token,
                ];
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST           => true,
                    CURLOPT_POSTFIELDS     => http_build_query($payload),
                    CURLOPT_TIMEOUT        => 15,
                    CURLOPT_SSL_VERIFYPEER => true,
                ]);
                $resp = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                $body = is_string($resp) ? json_decode($resp, true) : null;
                if ($httpCode >= 200 && $httpCode < 300 && !empty($body['id'])) {
                    $childIds[] = $body['id'];
                } else {
                    $errors[] = ['slide' => $slide['slide_number'], 'http' => $httpCode, 'body' => is_array($body) ? $body : ['raw' => substr((string)$resp, 0, 200)]];
                    break; // abort early — partial upload is worse than full retry
                }
            }
            if ($errors || count($childIds) !== 5) {
                jsonError(['error' => 'Slide media upload failed', 'errors' => $errors, 'partial_child_ids' => $childIds], 502);
            }

            // Step 2: create CAROUSEL container
            $url = "https://graph.facebook.com/v20.0/" . urlencode($accountId) . "/media";
            $payload = [
                'media_type'   => 'CAROUSEL',
                'children'     => implode(',', $childIds),
                'caption'      => $caption,
                'access_token' => $token,
            ];
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($payload),
                CURLOPT_TIMEOUT => 15, CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $body = is_string($resp) ? json_decode($resp, true) : null;
            if ($httpCode < 200 || $httpCode >= 300 || empty($body['id'])) {
                jsonError(['error' => 'Carousel container creation failed', 'http' => $httpCode, 'body' => $body, 'child_ids' => $childIds], 502);
            }
            $carouselContainerId = $body['id'];

            // Step 3: publish
            $url = "https://graph.facebook.com/v20.0/" . urlencode($accountId) . "/media_publish";
            $payload = ['creation_id' => $carouselContainerId, 'access_token' => $token];
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($payload),
                CURLOPT_TIMEOUT => 15, CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $body = is_string($resp) ? json_decode($resp, true) : null;
            if ($httpCode < 200 || $httpCode >= 300 || empty($body['id'])) {
                jsonError(['error' => 'Final publish failed', 'http' => $httpCode, 'body' => $body, 'carousel_container_id' => $carouselContainerId], 502);
            }

            jsonResponse([
                'published'              => true,
                'carousel'               => $carousel,
                'instagram_media_id'     => $body['id'],
                'carousel_container_id'  => $carouselContainerId,
                'child_container_ids'    => $childIds,
            ]);
            break;
        }

        jsonError('Unknown POST action', 400);
        break;

    default:
        jsonError('Method not allowed', 405);
}

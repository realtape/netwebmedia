<?php
/* GTmetrix-style Lighthouse runner via Google PageSpeed Insights API.
   Route: GET /api/psi?url=<URL>&strategy=mobile|desktop

   Returns the trimmed Lighthouse payload our /speed-test.html page needs:
   scores (perf/a11y/bp/seo), 6 Core Web Vitals, opportunities, diagnostics,
   and the final-state screenshot.

   Cached in the resources table for 1 hour per (url, strategy) — PSI takes
   15-30s per call and Google rate-limits the free tier hard. Cache key is
   sha1(url|strategy) so identical re-runs are instant.
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/url_guard.php';
require_once __DIR__ . '/../lib/ratelimit.php';

const PSI_CACHE_TTL_SEC = 3600;   // 1 hour
const PSI_TIMEOUT_SEC   = 60;     // PSI typically 15-30s, allow headroom
const PSI_RATE_MAX      = 10;     // per window
const PSI_RATE_WINDOW   = 600;    // 10 min

function _psi_extract($data, $url, $strategy) {
  $lr = $data['lighthouseResult'] ?? null;
  if (!$lr) return null;

  $cats = $lr['categories'] ?? [];
  $audits = $lr['audits'] ?? [];

  $scoreOf = function($key) use ($cats) {
    $s = $cats[$key]['score'] ?? null;
    return $s === null ? null : (int) round($s * 100);
  };

  $cwv = function($key) use ($audits) {
    $a = $audits[$key] ?? null;
    if (!$a) return null;
    return [
      'display' => $a['displayValue'] ?? '—',
      'value'   => $a['numericValue'] ?? null,
      'unit'    => $a['numericUnit'] ?? null,
      'score'   => $a['score'] ?? null,
    ];
  };

  // Lighthouse "opportunities" — fixable savings.
  $opportunities = [];
  foreach ($audits as $key => $a) {
    if (($a['details']['type'] ?? '') !== 'opportunity') continue;
    if (!isset($a['details']['overallSavingsMs']) && !isset($a['numericValue'])) continue;
    if (($a['score'] ?? 1) >= 0.9) continue; // skip already-good ones
    $opportunities[] = [
      'id'         => $key,
      'title'      => $a['title'] ?? $key,
      'description'=> $a['description'] ?? '',
      'savings_ms' => (int)($a['details']['overallSavingsMs'] ?? $a['numericValue'] ?? 0),
      'savings_bytes' => (int)($a['details']['overallSavingsBytes'] ?? 0),
      'score'      => $a['score'] ?? null,
    ];
  }
  usort($opportunities, function($a, $b) {
    return ($b['savings_ms'] ?? 0) <=> ($a['savings_ms'] ?? 0);
  });

  // Diagnostics — informational checks that failed.
  $diagnostics = [];
  $diagKeys = ['mainthread-work-breakdown','bootup-time','uses-rel-preconnect',
               'uses-rel-preload','font-display','third-party-summary',
               'dom-size','critical-request-chains','network-server-latency',
               'redirects','uses-http2','uses-passive-event-listeners',
               'no-document-write','total-byte-weight','unused-css-rules',
               'unused-javascript','modern-image-formats','offscreen-images',
               'render-blocking-resources','unminified-css','unminified-javascript',
               'efficient-animated-content','duplicated-javascript','legacy-javascript'];
  foreach ($diagKeys as $key) {
    $a = $audits[$key] ?? null;
    if (!$a) continue;
    if (($a['score'] ?? null) === null) continue;
    if (($a['score'] ?? 1) >= 0.9) continue; // skip passing
    $diagnostics[] = [
      'id'      => $key,
      'title'   => $a['title'] ?? $key,
      'display' => $a['displayValue'] ?? '',
      'score'   => $a['score'] ?? null,
    ];
  }
  usort($diagnostics, function($a, $b) {
    return ($a['score'] ?? 1) <=> ($b['score'] ?? 1);
  });

  // Final-state screenshot (PSI returns it as a data URI).
  $screenshot = $audits['final-screenshot']['details']['data'] ?? null;

  // CrUX field data (real-user metrics, when Google has CrUX data for the URL/origin).
  $loadingExp = $data['loadingExperience'] ?? null;
  $originExp  = $data['originLoadingExperience'] ?? null;

  return [
    'url'      => $url,
    'final_url'=> $lr['finalUrl'] ?? $lr['requestedUrl'] ?? $url,
    'strategy' => $strategy,
    'tested_at'=> $lr['fetchTime'] ?? gmdate('c'),
    'lighthouse_version' => $lr['lighthouseVersion'] ?? null,
    'user_agent' => $lr['userAgent'] ?? null,
    'scores'   => [
      'performance'    => $scoreOf('performance'),
      'accessibility'  => $scoreOf('accessibility'),
      'best_practices' => $scoreOf('best-practices'),
      'seo'            => $scoreOf('seo'),
    ],
    'cwv' => [
      'lcp' => $cwv('largest-contentful-paint'),
      'fcp' => $cwv('first-contentful-paint'),
      'cls' => $cwv('cumulative-layout-shift'),
      'tbt' => $cwv('total-blocking-time'),
      'si'  => $cwv('speed-index'),
      'tti' => $cwv('interactive'),
      'ttfb'=> $cwv('server-response-time'),
    ],
    'opportunities' => array_slice($opportunities, 0, 15),
    'diagnostics'   => array_slice($diagnostics, 0, 15),
    'screenshot'    => $screenshot,
    'crux' => [
      'url_experience'    => $loadingExp,
      'origin_experience' => $originExp,
    ],
  ];
}

function _psi_cache_get($url, $strategy) {
  $key = sha1(strtolower($url) . '|' . $strategy);
  try {
    $row = qOne(
      "SELECT data, updated_at FROM resources
       WHERE type='psi_cache' AND slug=?
       ORDER BY id DESC LIMIT 1",
      [$key]
    );
    if (!$row) return null;
    $updated = strtotime($row['updated_at']);
    if (time() - $updated > PSI_CACHE_TTL_SEC) return null;
    $d = json_decode($row['data'], true);
    if (!is_array($d)) return null;
    $d['_cached'] = true;
    $d['_cache_age_sec'] = time() - $updated;
    return $d;
  } catch (Throwable $_) { return null; }
}

function _psi_cache_put($url, $strategy, $payload) {
  $key = sha1(strtolower($url) . '|' . $strategy);
  try {
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data)
       VALUES (1, 'psi_cache', ?, ?, 'cached', ?)",
      [$key, substr($url, 0, 200), json_encode($payload, JSON_UNESCAPED_UNICODE)]
    );
  } catch (Throwable $_) { /* tolerate — cache is best-effort */ }
}

function route_psi($parts, $method) {
  if ($method !== 'GET') err('GET required', 405);

  // Outbound to Google's PSI API + heavy upstream work. Throttle per IP.
  rate_limit_check('psi', PSI_RATE_MAX, PSI_RATE_WINDOW);

  $url      = trim($_GET['url'] ?? '');
  $strategy = strtolower(trim($_GET['strategy'] ?? 'mobile'));
  $force    = !empty($_GET['fresh']);
  if (!in_array($strategy, ['mobile','desktop'], true)) $strategy = 'mobile';
  if (!$url) err('url required', 400);
  if (!preg_match('#^https?://#i', $url)) $url = 'https://' . $url;
  if (!parse_url($url, PHP_URL_HOST)) err('Invalid URL', 400);

  // SSRF gate — PSI fetches the URL from Google's network, but we still want
  // to refuse internal/loopback targets before burning the upstream call.
  url_guard_or_fail($url);

  if (!$force) {
    $cached = _psi_cache_get($url, $strategy);
    if ($cached) {
      json_out(['ok' => true, 'data' => $cached]);
      return;
    }
  }

  // Build PSI URL — API key optional, but the anonymous quota is shared
  // across the calling IP/project, so a key dedicated to NWM is strongly
  // recommended (25k/day free quota per project). Wired via deploy-time
  // config.local.php; falls back to env var and finally to no key.
  $cfg = function_exists('config') ? config() : [];
  $apiKey = $cfg['pagespeed_api_key']
         ?? (getenv('PAGESPEED_API_KEY') ?: (defined('PAGESPEED_API_KEY') ? PAGESPEED_API_KEY : ''));
  $psiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
          . '?url=' . urlencode($url)
          . '&strategy=' . $strategy
          . '&category=performance&category=accessibility&category=best-practices&category=seo'
          . ($apiKey ? '&key=' . urlencode($apiKey) : '');

  $ch = curl_init($psiUrl);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => PSI_TIMEOUT_SEC,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT      => 'NetWebMedia-PSI/1.0 (+https://netwebmedia.com)',
  ]);
  $raw  = curl_exec($ch);
  $eno  = curl_errno($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($eno) err('PSI request failed: ' . $err, 502);
  if ($code !== 200) {
    $body = @json_decode($raw, true);
    $msg = $body['error']['message'] ?? "PSI returned HTTP $code";
    err($msg, 502);
  }

  $data = json_decode($raw, true);
  if (!is_array($data)) err('PSI returned invalid JSON', 502);

  $extracted = _psi_extract($data, $url, $strategy);
  if (!$extracted) err('PSI response had no Lighthouse result', 502);

  _psi_cache_put($url, $strategy, $extracted);

  json_out(['ok' => true, 'data' => $extracted]);
}

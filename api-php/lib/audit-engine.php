<?php
/* NetWebMedia digital-presence audit engine v2.1
 *
 * Real measurements — no fabricated scores. Given a URL + niche key, returns
 * a structured audit with 14 dimension scores, a weighted aggregate 0-100
 * score, band, evidence-backed gaps/priorities/projections.
 *
 * Tier 1 checks (no API keys — always run):
 *   - crawlability  (robots.txt + HTTPS + noindex meta + sitemap declared)
 *   - schema markup (JSON-LD type detection + LocalBusiness field completeness)
 *   - lead capture  (forms + CRM embed patterns)
 *   - WhatsApp      (wa.me links + known widget scripts)
 *   - mobile conv.  (viewport + tel: + sticky CTA)
 *   - automation    (chat widget CDN patterns + exit-intent + email trackers)
 *   - analytics     (GA4 + GTM + pixel trackers — new in v2.1)
 *   - social        (profile link presence + parallel HTTP verification)
 *   - content       (sitemap.xml page count + blog path + Article schema)
 *   - branding      (Open Graph + favicon + title + meta description)
 *   - reputation    (trust signals: clients/team/press/awards/portfolio)
 *   - reviews       (Review/AggregateRating schema + star rating signals)
 *
 * Tier 2 (PSI — works without a key, set PAGESPEED_API_KEY for higher quota):
 *   - mobile speed  (real Core Web Vitals via Google PageSpeed Insights)
 *
 * Tier 3 (BRAVE_SEARCH_API_KEY) — replaces AEO heuristic with live SERP:
 *   - AEO           (domain appearance in niche+city search results)
 *
 * Public surface:
 *   nwm_audit_run(string $url, string $niche_key, string $city = 'Santiago'): array
 *   nwm_audit_cached(string $url, string $niche_key, string $city = 'Santiago'): array
 *
 * Cache: api-php/data/audit-cache/{md5(url|niche|city)}.json — 7-day TTL.
 */

require_once __DIR__ . '/env.php';

// ── Public entry: cached wrapper ──────────────────────────────────────
function nwm_audit_cached(string $url, string $niche_key, string $city = 'Santiago'): array {
  $cache_dir = __DIR__ . '/../data/audit-cache';
  if (!is_dir($cache_dir)) @mkdir($cache_dir, 0755, true);
  $hta = $cache_dir . '/.htaccess';
  if (!file_exists($hta)) @file_put_contents($hta, "Require all denied\n");

  $key = md5(strtolower($url) . '|' . $niche_key . '|' . strtolower($city));
  $cache_file = $cache_dir . '/' . $key . '.json';
  $ttl = 7 * 86400;

  if (is_readable($cache_file) && (time() - filemtime($cache_file)) < $ttl) {
    $cached = @json_decode((string)@file_get_contents($cache_file), true);
    if (is_array($cached) && isset($cached['score'])) return $cached;
  }

  $result = nwm_audit_run($url, $niche_key, $city);
  @file_put_contents($cache_file, json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  return $result;
}

// ── Public entry: run audit ───────────────────────────────────────────
function nwm_audit_run(string $url, string $niche_key, string $city = 'Santiago'): array {
  $url = nwm_audit_normalize_url($url);
  $started = microtime(true);

  $http = nwm_audit_fetch($url);
  if (!$http['ok']) {
    return nwm_audit_unreachable_result($url, $niche_key, $city, $http);
  }

  $html      = $http['body'];
  $final_url = $http['final_url'];

  // All 14 dimension checks. Each returns:
  //   ['label' => str, 'score' => 0-100, 'status' => pass|warn|fail|skipped,
  //    'detail' => str, 'evidence' => str, 'fix' => str]
  $dims = [
    'aeo'               => nwm_check_aeo($final_url, $html, $niche_key, $city),
    'mobile_speed'      => nwm_check_mobile_speed($final_url, $http, $html),
    'schema'            => nwm_check_schema($html, $niche_key),
    'lead_capture'      => nwm_check_lead_capture($html),
    'reviews'           => nwm_check_reviews($html),
    'whatsapp'          => nwm_check_whatsapp($html),
    'mobile_conversion' => nwm_check_mobile_conversion($html),
    'automation'        => nwm_check_automation($html),
    'analytics'         => nwm_check_analytics($html),
    'social'            => nwm_check_social($html),
    'content'           => nwm_check_content($html, $final_url),
    'branding'          => nwm_check_branding($html),
    'reputation'        => nwm_check_reputation($html),
    'crawlability'      => nwm_check_crawlability($final_url, $html, $http),
  ];

  // Weighted aggregate. Weights reflect lead-gen impact for LATAM SMBs.
  $weights = [
    'aeo'               => 1.2,
    'mobile_speed'      => 1.3,
    'schema'            => 1.0,
    'lead_capture'      => 1.3,
    'reviews'           => 0.9,
    'whatsapp'          => 1.2,
    'mobile_conversion' => 1.1,
    'automation'        => 0.8,
    'analytics'         => 0.9,
    'social'            => 0.7,
    'content'           => 0.9,
    'branding'          => 0.8,
    'reputation'        => 0.8,
    'crawlability'      => 1.0,
  ];

  $sum = 0; $wsum = 0;
  foreach ($dims as $k => $d) {
    if (($d['status'] ?? '') === 'skipped') continue;
    $w = $weights[$k] ?? 1.0;
    $sum  += ($d['score'] ?? 0) * $w;
    $wsum += $w;
  }
  $score = $wsum > 0 ? (int)round($sum / $wsum) : 0;
  $score = max(0, min(100, $score));

  [$band, $color] = nwm_audit_band($score);

  $gaps        = nwm_audit_gaps_from_dims($dims);
  $priorities  = nwm_audit_priorities_from_dims($dims);
  $projections = nwm_audit_projections_from_dims($dims, $score);

  return [
    'url'          => $url,
    'final_url'    => $final_url,
    'niche_key'    => $niche_key,
    'city'         => $city,
    'fetched_at'   => date('c'),
    'duration_ms'  => (int)round((microtime(true) - $started) * 1000),
    'reachable'    => true,
    'http'         => [
      'status'    => $http['status'],
      'https'     => $http['https'],
      'time_s'    => round($http['time_total'], 2),
      'ttfb_s'    => round($http['time_ttfb'] ?? 0, 2),
      'size_kb'   => (int)round($http['size'] / 1024),
      'redirects' => $http['redirect_count'],
    ],
    'score'        => $score,
    'band'         => $band,
    'color'        => $color,
    'dimensions'   => $dims,
    'gaps'         => $gaps,
    'priorities'   => $priorities,
    'projections'  => $projections,
    'engine'       => 'nwm-audit/2.1',
  ];
}

// ── URL normalization ─────────────────────────────────────────────────
function nwm_audit_normalize_url(string $url): string {
  $url = trim($url);
  if ($url === '') return '';
  if (!preg_match('#^https?://#i', $url)) $url = 'https://' . $url;
  return $url;
}

// ── HTTP fetch (cURL with timeout + redirect follow) ──────────────────
function nwm_audit_fetch(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 12,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_USERAGENT      => 'NetWebMediaAuditBot/2.1 (+https://netwebmedia.com/audit)',
    CURLOPT_HTTPHEADER     => [
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language: es-CL,es;q=0.9,en;q=0.8',
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_ENCODING       => '',
  ]);
  $body = curl_exec($ch);
  $err  = curl_error($ch);
  $info = curl_getinfo($ch);
  curl_close($ch);

  $status    = (int)($info['http_code'] ?? 0);
  $final_url = (string)($info['url'] ?? $url);
  $ok        = ($body !== false) && ($status >= 200 && $status < 400);

  return [
    'ok'             => $ok,
    'status'         => $status,
    'body'           => is_string($body) ? $body : '',
    'final_url'      => $final_url,
    'https'          => stripos($final_url, 'https://') === 0,
    'time_total'     => (float)($info['total_time'] ?? 0),
    'time_ttfb'      => (float)($info['starttransfer_time'] ?? 0),
    'size'           => (int)($info['size_download'] ?? (is_string($body) ? strlen($body) : 0)),
    'redirect_count' => (int)($info['redirect_count'] ?? 0),
    'error'          => $err,
  ];
}

// ── Shared helper: parse all JSON-LD blocks once ──────────────────────
// Returns an array of decoded JSON-LD objects (only valid ones).
// Used by multiple check functions to avoid repeated regex + json_decode.
function nwm_parse_ld_blocks(string $html): array {
  $blocks = [];
  if (!preg_match_all('#<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>#is', $html, $m)) {
    return $blocks;
  }
  foreach ($m[1] as $blob) {
    $data = @json_decode(trim($blob), true);
    if (is_array($data)) $blocks[] = $data;
  }
  return $blocks;
}

// ── Dimension: AEO presence ───────────────────────────────────────────
// Tier 3 (Brave API) → real SERP presence check
// Tier 1 fallback → on-page signals: FAQPage + entry count, HowTo, Article freshness, Q&A headings
function nwm_check_aeo(string $url, string $html, string $niche_key, string $city): array {
  $api_key = getenv('BRAVE_SEARCH_API_KEY') ?: '';
  $domain  = parse_url($url, PHP_URL_HOST) ?: '';
  $domain  = preg_replace('/^www\./i', '', $domain);

  // Tier 3: real SERP check via Brave Search API.
  if ($api_key !== '') {
    $queries = nwm_aeo_queries($niche_key, $city);
    $hits = 0; $checked = 0;
    foreach ($queries as $q) {
      $checked++;
      if (nwm_brave_search_contains($q, $domain, $api_key)) $hits++;
    }
    if ($checked > 0) {
      $score = (int)round(($hits / $checked) * 100);
      return [
        'label'    => 'Visibilidad en respuestas de IA (AEO)',
        'score'    => $score,
        'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
        'detail'   => "Tu dominio aparece en $hits de $checked búsquedas habituales del rubro en {$city}.",
        'evidence' => 'Brave Search API · ' . implode(' · ', array_slice($queries, 0, 3)),
        'fix'      => 'Estructurar AEO con FAQ schema, contenido por consulta y enlaces externos relevantes.',
      ];
    }
  }

  // Tier 1 fallback: parse JSON-LD for FAQ count + HowTo + article freshness; scan headings.
  $ld_blocks   = nwm_parse_ld_blocks($html);
  $has_faq     = false;
  $has_howto   = false;
  $has_article = false;
  $faq_count   = 0;
  $article_word_count = 0;

  foreach ($ld_blocks as $data) {
    $stack = [$data];
    while ($stack) {
      $node = array_pop($stack);
      if (!is_array($node)) continue;
      $t = $node['@type'] ?? '';
      $types = is_array($t) ? $t : [$t];
      if (in_array('FAQPage', $types, true)) {
        $has_faq = true;
        $entities  = $node['mainEntity'] ?? [];
        $faq_count = max($faq_count, is_array($entities) ? count($entities) : 1);
      }
      if (in_array('HowTo', $types, true)) {
        $has_howto = true;
      }
      if (array_intersect(['Article', 'BlogPosting', 'NewsArticle'], $types)) {
        $has_article = true;
        $wc = $node['wordCount'] ?? 0;
        if ((int)$wc > $article_word_count) $article_word_count = (int)$wc;
      }
      foreach ($node as $v) {
        if (is_array($v)) $stack[] = $v;
      }
    }
  }

  // FAQ fallback: if FAQPage detected but mainEntity not parseable
  if ($has_faq && !$faq_count) $faq_count = 1;

  // Check article freshness — datePublished within last 90 days.
  $article_fresh = false;
  if ($has_article && preg_match_all('/"datePublished"\s*:\s*"([^"]+)"/i', $html, $dp_m)) {
    $now = time();
    foreach ($dp_m[1] as $dp) {
      $ts = @strtotime($dp);
      if ($ts && ($now - $ts) <= 90 * 86400) { $article_fresh = true; break; }
    }
  }

  // Q&A heading count (graduated scoring).
  $qa_heading_count = (int)preg_match_all('/<h[23][^>]*>\s*[¿?]/i', $html);

  // HowTo schema: on-page step-by-step content.
  $has_org = false;
  foreach ($ld_blocks as $d) {
    $t = $d['@type'] ?? '';
    $tt = is_array($t) ? $t : [$t];
    if (array_intersect(['Organization', 'LocalBusiness'], $tt)) { $has_org = true; break; }
  }

  // Score composition:
  //   Base:               25 pts
  //   FAQPage:            up to 28 pts (8 pts × count, capped 28)
  //   HowTo schema:        8 pts
  //   Article present:    10 pts
  //   Article fresh:      10 pts (datePublished ≤ 90 days)
  //   Article wordCount:   5 pts (wordCount ≥ 800 in JSON-LD)
  //   Organization:        5 pts
  //   Q&A headings:       1 heading = 8 pts, ≥ 2 = 16 pts
  //   Heuristic cap: 85 — only Tier 3 SERP check can prove >85.
  $faq_pts = $has_faq ? min(28, max(8, $faq_count * 8)) : 0;
  $qa_pts  = $qa_heading_count >= 2 ? 16 : ($qa_heading_count === 1 ? 8 : 0);
  $score   = 25
           + $faq_pts
           + ($has_howto        ?  8 : 0)
           + ($has_article      ? 10 : 0)
           + ($article_fresh    ? 10 : 0)
           + ($article_word_count >= 800 ? 5 : 0)
           + ($has_org          ?  5 : 0)
           + $qa_pts;
  $score = min(85, $score);

  $parts = [];
  if ($has_faq)      $parts[] = "FAQPage con $faq_count pregunta/s";
  if ($has_howto)    $parts[] = 'HowTo schema';
  if ($has_article)  $parts[] = 'Article' . ($article_fresh ? ' (publicado ≤90 días)' : ' (fechas antiguas)');
  if ($qa_heading_count > 0) $parts[] = "Q&A en encabezados ($qa_heading_count)";

  return [
    'label'    => 'Visibilidad en respuestas de IA (AEO)',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $parts
      ? implode(' · ', $parts)
      : 'No detectamos señales AEO (FAQPage schema, Q&A, Article).',
    'evidence' => 'Heurístico on-page · FAQ:' . ($has_faq ? "sí ($faq_count)" : 'no')
                . ' · HowTo:' . ($has_howto ? 'sí' : 'no')
                . ' · Article:' . ($has_article ? 'sí' : 'no')
                . ($article_fresh ? ' (reciente)' : ''),
    'fix'      => 'Publicar página FAQ con FAQPage schema, HowTo para procesos clave y artículos por consulta del rubro en ' . $city . '.',
  ];
}

function nwm_aeo_queries(string $nk, string $city): array {
  $by = [
    'tourism'          => ["mejor hotel boutique en $city", "aparthotel $city", "alojamiento ejecutivo $city"],
    'restaurants'      => ["dónde comer bien en $city", "restaurante recomendado $city", "almuerzo ejecutivo $city"],
    'beauty'           => ["mejor peluquería en $city", "spa $city", "salón de belleza $city"],
    'law_firms'        => ["abogado laboral $city", "estudio jurídico $city", "abogado familia $city"],
    'real_estate'      => ["corredor de propiedades $city", "departamentos en venta $city"],
    'health'           => ["clínica dental $city", "kinesiólogo $city", "médico especialista $city"],
    'home_services'    => ["gasfíter $city", "electricista a domicilio $city", "servicio técnico $city"],
    'automotive'       => ["taller mecánico confiable $city", "venta autos usados $city"],
    'financial_services'  => ["asesor financiero $city", "contador pyme $city"],
    'events_weddings'  => ["organizador de bodas $city", "salón de eventos $city"],
    'wine_agriculture' => ["viñas boutique $city", "vino artesanal $city"],
    'education'        => ["preuniversitario $city", "instituto de inglés $city"],
    'local_specialist' => ["servicio especializado $city", "experto local $city"],
    'smb'              => ["pyme servicios $city", "agencia digital $city"],
  ];
  return $by[$nk] ?? $by['smb'];
}

function nwm_brave_search_contains(string $query, string $domain, string $api_key): bool {
  $url = 'https://api.search.brave.com/res/v1/web/search?q=' . urlencode($query) . '&count=10&country=CL&search_lang=es';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => ['Accept: application/json', 'X-Subscription-Token: ' . $api_key],
  ]);
  $resp = curl_exec($ch);
  curl_close($ch);
  if (!$resp) return false;
  $data = @json_decode($resp, true);
  foreach (($data['web']['results'] ?? []) as $r) {
    if (stripos((string)($r['url'] ?? ''), $domain) !== false) return true;
  }
  return false;
}

// ── Dimension: mobile speed ──────────────────────────────────────────
// Tier 2: PageSpeed Insights works WITHOUT an API key (rate-limited but functional).
// Set PAGESPEED_API_KEY env var for higher quota.
// Falls back to HTML performance budget analysis when PSI is unavailable.
function nwm_check_mobile_speed(string $url, array $http, string $html = ''): array {
  $api_key = getenv('PAGESPEED_API_KEY') ?: '';
  $psi_err = '';

  // Build PSI URL — key is optional.
  $psi_url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
           . '?url='      . urlencode($url)
           . '&strategy=mobile'
           . '&category=performance'
           . ($api_key !== '' ? '&key=' . urlencode($api_key) : '');

  $ch = curl_init($psi_url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 45,   // PSI typically responds in 15-30s
    CURLOPT_CONNECTTIMEOUT => 10,
  ]);
  $resp     = curl_exec($ch);
  $curl_err = curl_error($ch);
  curl_close($ch);

  if ($resp) {
    $data = @json_decode($resp, true);
    $perf = $data['lighthouseResult']['categories']['performance']['score'] ?? null;
    if ($perf !== null) {
      $score  = (int)round($perf * 100);
      $audits = $data['lighthouseResult']['audits'] ?? [];
      $lcp    = $audits['largest-contentful-paint']['displayValue']     ?? '—';
      $fcp    = $audits['first-contentful-paint']['displayValue']        ?? '—';
      $cls    = $audits['cumulative-layout-shift']['displayValue']        ?? '—';
      $tbt    = $audits['total-blocking-time']['displayValue']            ?? '—';
      $tti    = $audits['interactive']['displayValue']                    ?? '—';
      $rb_cnt = $audits['render-blocking-resources']['items'] ?? [];
      $rb_cnt = is_array($rb_cnt) ? count($rb_cnt) : 0;
      $img_ok = (float)($audits['uses-optimized-images']['score'] ?? 1.0);
      $webp   = (float)($audits['uses-webp-images']['score']      ?? 1.0);
      $detail = "Score $score/100 · LCP $lcp · FCP $fcp · CLS $cls · TBT $tbt · TTI $tti"
              . ($rb_cnt > 0 ? " · $rb_cnt recursos bloqueantes" : '')
              . ($img_ok < 0.5 ? ' · imágenes sin optimizar' : '')
              . ($webp < 0.5   ? ' · sin WebP' : '');
      return [
        'label'    => 'Velocidad móvil',
        'score'    => $score,
        'status'   => $score >= 70 ? 'pass' : ($score >= 50 ? 'warn' : 'fail'),
        'detail'   => $detail,
        'evidence' => 'Google PageSpeed Insights (Lighthouse mobile)' . ($api_key !== '' ? ' — clave API activa' : ''),
        'fix'      => 'Comprimir imágenes a WebP/AVIF, diferir JS no crítico, eliminar recursos bloqueantes y servir CSS crítico inline.',
      ];
    }
    // PSI returned a response but no performance score.
    $psi_err = $data['error']['message'] ?? ($data['error']['errors'][0]['message'] ?? 'sin score');
  }

  // Fallback: HTML performance budget analysis (when PSI is unavailable/quota exceeded).
  $ext_scripts    = (int)preg_match_all('#<script[^>]+src=["\']https?://#i', $html);
  $total_imgs     = max(1, (int)preg_match_all('/<img\b/i', $html));
  $lazy_imgs      = (int)preg_match_all('/loading=["\']lazy["\']/i', $html);
  $lazy_ratio     = $lazy_imgs / $total_imgs;
  $has_preload    = (bool)preg_match('/<link[^>]+rel=["\']preload["\']/i', $html);
  $has_preconnect = (bool)preg_match('/<link[^>]+rel=["\']preconnect["\']/i', $html);
  $defer_async    = (int)preg_match_all('/\b(defer|async)\b/i', $html);

  // cURL timing proxy as a signal.
  $t  = $http['time_total'] ?? 0;
  $kb = ($http['size'] ?? 0) / 1024;

  $time_pts    = $t < 1.0 ? 20 : ($t < 2.0 ? 15 : ($t < 3.0 ? 10 : ($t < 4.0 ? 5 : 0)));
  $size_pts    = $kb < 500 ? 20 : ($kb < 1000 ? 15 : ($kb < 2000 ? 10 : ($kb < 4000 ? 5 : 0)));
  $script_pts  = $ext_scripts <= 3 ? 20 : ($ext_scripts <= 6 ? 14 : ($ext_scripts <= 10 ? 8 : 0));
  $lazy_pts    = $lazy_ratio >= 0.5 ? 20 : (int)($lazy_ratio * 40);
  $hint_pts    = ($has_preload ? 10 : 0) + ($has_preconnect ? 5 : 0) + ($defer_async >= 2 ? 5 : 0);
  $score       = min(100, $time_pts + $size_pts + $script_pts + $lazy_pts + $hint_pts);

  $note = $psi_err ? " (PSI: $psi_err)" : ' (PSI no disponible)';
  return [
    'label'    => 'Velocidad móvil',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 50 ? 'warn' : 'fail'),
    'detail'   => sprintf(
      '%.2fs · %d KB · %d scripts externos · lazy ratio %.0f%%%s.',
      $t, (int)$kb, $ext_scripts, $lazy_ratio * 100, $note
    ),
    'evidence' => 'HTML performance budget (fallback) — scripts, lazy, preload/defer, cURL timing',
    'fix'      => 'Cargar imágenes con loading=lazy, diferir scripts externos y usar preconnect para dominios de terceros.',
  ];
}

// ── Dimension: schema markup ─────────────────────────────────────────
// Detects JSON-LD types + validates LocalBusiness field completeness.
function nwm_check_schema(string $html, string $niche_key): array {
  $ld_blocks = nwm_parse_ld_blocks($html);
  $types = [];

  foreach ($ld_blocks as $data) {
    $stack = [$data];
    while ($stack) {
      $node = array_pop($stack);
      if (!is_array($node)) continue;
      if (isset($node['@type'])) {
        $t = $node['@type'];
        if (is_array($t)) foreach ($t as $tt) $types[] = (string)$tt;
        else $types[] = (string)$t;
      }
      foreach ($node as $v) {
        if (is_array($v)) $stack[] = $v;
      }
    }
  }
  $types = array_values(array_unique($types));

  $niche_type_map = [
    'tourism'          => ['Hotel','LodgingBusiness'],
    'restaurants'      => ['Restaurant','FoodEstablishment'],
    'beauty'           => ['BeautySalon','HealthAndBeautyBusiness'],
    'law_firms'        => ['LegalService','Attorney'],
    'real_estate'      => ['RealEstateAgent'],
    'health'           => ['MedicalBusiness','MedicalClinic','Dentist','Physician'],
    'home_services'    => ['HomeAndConstructionBusiness','Plumber','Electrician'],
    'automotive'       => ['AutoRepair','AutoDealer'],
    'financial_services'  => ['FinancialService','AccountingService'],
    'events_weddings'  => ['EventVenue'],
    'education'        => ['EducationalOrganization'],
  ];
  $expected = $niche_type_map[$niche_key] ?? [];

  $local_subtypes = [
    'LocalBusiness','ProfessionalService','HomeAndConstructionBusiness',
    'FoodEstablishment','LodgingBusiness','MedicalBusiness','HealthAndBeautyBusiness',
    'SportsActivityLocation','EntertainmentBusiness','Store','FinancialService',
    'LegalService','AutomotiveBusiness','EducationalOrganization',
    'RealEstateAgent','Restaurant','Hotel','Dentist','Physician','BeautySalon',
    'AutoRepair','AutoDealer','Plumber','Electrician','AccountingService',
    'Attorney','EventVenue','MedicalClinic',
  ];
  $org_types = array_merge(['Organization','Corporation'], $local_subtypes);
  $has_org   = count(array_intersect($types, $org_types)) > 0;
  $has_local = count(array_intersect($types, $local_subtypes)) > 0 || count(array_intersect($types, $expected)) > 0;
  $has_niche = count(array_intersect($types, $expected)) > 0;

  // Base score from type presence.
  $score = 0;
  if ($has_org)   $score += 25;
  if ($has_local) $score += 30;
  if ($has_niche) $score += 30;
  if (!$expected && $has_org && $has_local) $score = max($score, 70);

  // Field completeness check for any LocalBusiness/Org node.
  $lb = nwm_schema_lb_completeness($ld_blocks, array_merge($org_types, $local_subtypes));
  $completeness_detail = '';
  if ($lb['found']) {
    $field_pts  = ($lb['has_name']    ? 4 : 0)
                + ($lb['has_address'] ? 5 : 0)
                + ($lb['has_phone']   ? 4 : 0)
                + ($lb['has_hours']   ? 2 : 0);
    $score += $field_pts;
    // Enrichment bonuses (sameAs, logo, priceRange).
    $score += ($lb['has_same_as']    ? 7 : 0);
    $score += ($lb['has_logo']       ? 5 : 0);
    $score += ($lb['has_price_range']? 3 : 0);
    // Missing name or address hard-caps the score.
    if (!$lb['has_name'] || !$lb['has_address']) $score = min($score, 65);
    $missing = [];
    if (!$lb['has_name'])    $missing[] = 'name';
    if (!$lb['has_address']) $missing[] = 'address';
    if (!$lb['has_phone'])   $missing[] = 'telephone';
    if (!$lb['has_hours'])   $missing[] = 'openingHours';
    $completeness_detail = $missing
      ? ' · Campos faltantes: ' . implode(', ', $missing)
      : ' · Campos requeridos completos ✓';
    if ($lb['has_same_as'])     $completeness_detail .= ' · sameAs ✓';
    if ($lb['has_logo'])        $completeness_detail .= ' · logo ✓';
    if ($lb['has_price_range']) $completeness_detail .= ' · priceRange ✓';
  }
  $score = min(100, $score);

  $detail = $types
    ? 'Tipos detectados: ' . implode(', ', array_slice($types, 0, 6))
    : 'No se encontraron bloques JSON-LD.';
  if ($expected && !$has_niche) {
    $detail .= ' · Falta schema del rubro: ' . implode('/', $expected) . '.';
  }
  $detail .= $completeness_detail;

  return [
    'label'    => 'Schema markup',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'JSON-LD scrape + validación de campos requeridos',
    'fix'      => 'Completar Organization + LocalBusiness con name, address, telephone, openingHours, sameAs, logo y '
                . ($expected ? implode('/', $expected) : 'tipo del rubro') . '.',
  ];
}

// Helper: find the first LocalBusiness/Org node in the parsed JSON-LD blocks and
// check required + enrichment field presence.
function nwm_schema_lb_completeness(array $ld_blocks, array $org_types): array {
  $empty = [
    'found'=>false,'has_name'=>false,'has_address'=>false,
    'has_phone'=>false,'has_hours'=>false,
    'has_same_as'=>false,'has_logo'=>false,'has_price_range'=>false,
  ];
  foreach ($ld_blocks as $data) {
    $stack = [$data];
    while ($stack) {
      $node = array_pop($stack);
      if (!is_array($node)) continue;
      if (isset($node['@type'])) {
        $t     = is_array($node['@type']) ? $node['@type'] : [$node['@type']];
        $match = count(array_intersect($t, $org_types)) > 0;
        if ($match) {
          return [
            'found'           => true,
            'has_name'        => !empty($node['name']),
            'has_address'     => !empty($node['address']) || !empty($node['streetAddress']),
            'has_phone'       => !empty($node['telephone']) || !empty($node['phone']),
            'has_hours'       => !empty($node['openingHours']) || !empty($node['openingHoursSpecification']),
            'has_same_as'     => !empty($node['sameAs']),
            'has_logo'        => !empty($node['logo']),
            'has_price_range' => !empty($node['priceRange']),
          ];
        }
      }
      foreach ($node as $v) {
        if (is_array($v)) $stack[] = $v;
      }
    }
  }
  return $empty;
}

// ── Dimension: lead capture ──────────────────────────────────────────
function nwm_check_lead_capture(string $html): array {
  $real_forms = max(0, preg_match_all('/<form\b(?![^>]*role=["\']search["\'])[^>]*>/i', $html));
  $providers  = [
    'HubSpot'          => '/(hsforms|hs-forms\.com)/i',
    'Typeform'         => '/typeform\.com/i',
    'Jotform'          => '/jotform\.com/i',
    'Calendly'         => '/calendly\.com/i',
    'Cal.com'          => '/cal\.com\/embed/i',
    'Acuity'           => '/acuityscheduling\.com/i',
    'TidyCal'          => '/tidycal\.com/i',
    'Gravity'          => '/gravityforms/i',
    'WPForms'          => '/wpforms/i',
    'Mailchimp'        => '/(mailchimp|mc\.us\d+\.list-manage)/i',
    'ActiveCampaign'   => '/activehosted\.com|activecampaign\.com/i',
    'ConvertKit'       => '/(convertkit|ck-page)/i',
    'crm-vanilla'      => '/(\/api\/leads|\/crm-vanilla|\/api\/public\/)/i',
  ];
  $found = [];
  foreach ($providers as $name => $rx) {
    if (preg_match($rx, $html)) $found[] = $name;
  }
  $has_email    = (bool)preg_match('/<input[^>]+type=["\']email["\']/i', $html);
  $has_tel      = (bool)preg_match('/<a[^>]+href=["\']tel:/i', $html);
  $has_mailto   = (bool)preg_match('/<a[^>]+href=["\']mailto:/i', $html);
  $has_cta_btn  = (bool)preg_match('/(cotiza|contáct|contact|solicita|reserva|agenda|pide|book|get.?start)/i', $html);
  $has_contact_page = (bool)preg_match('#href=["\'][^"\']*/(contact|contacto|cotizar|agendar)#i', $html);

  $score = 0;
  if ($real_forms > 0)     $score += 35;
  if ($has_email)          $score += 15;
  if ($found)              $score += 25;
  if ($has_tel)            $score +=  8;
  if ($has_mailto)         $score +=  7;
  if ($has_cta_btn)        $score += 10;
  if ($has_contact_page)   $score +=  5;
  $score = min(100, $score);

  $detail = $real_forms ? "Formularios: $real_forms" : 'No detectamos formularios de captura.';
  if ($found) $detail .= ' · Proveedores: ' . implode(', ', $found);
  if ($has_cta_btn)  $detail .= ' · CTA detectado ✓';
  if (!$has_email && !$found) $detail .= ' · Sin captura de correo automatizada.';

  return [
    'label'    => 'Captura de leads',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (forms + embeds + CTA)',
    'fix'      => 'Activar formulario de captura con respuesta automática y nurturing por correo + WhatsApp.',
  ];
}

// ── Dimension: reviews / GMB signals on site ─────────────────────────
function nwm_check_reviews(string $html): array {
  // Parse AggregateRating from JSON-LD for real star/review data.
  $rating_value  = 0.0;
  $review_count  = 0;
  $has_agg_schema = false;
  $ld_blocks = nwm_parse_ld_blocks($html);
  foreach ($ld_blocks as $data) {
    $stack = [$data];
    while ($stack) {
      $node = array_pop($stack);
      if (!is_array($node)) continue;
      $t = $node['@type'] ?? '';
      $tt = is_array($t) ? $t : [$t];
      if (in_array('AggregateRating', $tt, true)) {
        $has_agg_schema = true;
        $rv = (float)($node['ratingValue'] ?? 0);
        $rc = (int)($node['reviewCount'] ?? $node['ratingCount'] ?? 0);
        if ($rv > $rating_value) $rating_value = $rv;
        if ($rc > $review_count) $review_count = $rc;
      }
      foreach ($node as $v) {
        if (is_array($v)) $stack[] = $v;
      }
    }
  }

  $has_review_schema = $has_agg_schema || (bool)preg_match('/"@type"\s*:\s*"Review"/i', $html);
  $has_rating        = $has_agg_schema || (bool)preg_match('/(★|⭐|ratingValue)/i', $html);
  $has_section       = (bool)preg_match('/(testimonios?|rese(ñ|n)as|opiniones|lo que dicen)/i', $html);
  $has_gmb_link      = (bool)preg_match('#(g\.page/|maps\.app\.goo\.gl|google\.com/maps)#i', $html);
  $has_trustpilot    = (bool)preg_match('/trustpilot\.com/i', $html);
  $has_google_widget = (bool)preg_match('/(elfsight-google-reviews|widgetFeed\.reviews|googleapis\.com\/customsearch|placeId)/i', $html);

  $score = 0;
  if ($has_review_schema) $score += 40;
  if ($has_rating)        $score += 15;
  if ($has_section)       $score += 15;
  if ($has_gmb_link)      $score += 15;
  if ($has_trustpilot || $has_google_widget) $score += 10;
  // Quality bonus: high rating + enough reviews.
  if ($has_agg_schema && $rating_value >= 4.5 && $review_count >= 10) $score += 5;
  $score = min(100, $score);

  $detail = $has_review_schema
    ? 'Schema Review/AggregateRating detectado' . ($has_agg_schema ? " ($rating_value★, $review_count reseñas)" : '') . '.'
    : ($has_section ? 'Sección de testimonios sin schema.' : 'Sin testimonios ni reseñas visibles.');
  if (!$has_gmb_link)    $detail .= ' · Sin enlace a Google Business.';
  if ($has_trustpilot)   $detail .= ' · TrustPilot ✓';
  if ($has_google_widget) $detail .= ' · Widget de reseñas ✓';

  return [
    'label'    => 'Gestión de reseñas',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'JSON-LD AggregateRating + HTML scrape (schema + secciones + GMB link)',
    'fix'      => 'Mostrar reseñas con AggregateRating schema, enlazar a Google Business y mostrar puntuación visible.',
  ];
}

// ── Dimension: WhatsApp ──────────────────────────────────────────────
function nwm_check_whatsapp(string $html): array {
  $wame   = preg_match_all('#wa\.me/\d+#i', $html);
  $api    = preg_match_all('#api\.whatsapp\.com/send#i', $html);
  $proto  = (bool)preg_match('#whatsapp://send#i', $html);
  $cta    = (bool)preg_match('/whatsapp/i', $html);
  $widget = (bool)preg_match('/(elfsight-whatsapp|wa-chat|whatsapp-widget|chaty|nwm-site-chat\.js)/i', $html);
  // Pre-filled message is a stronger signal (warmer lead).
  $prefilled = (bool)preg_match('#wa\.me/\d+\?text=#i', $html);
  // Multiple numbers can cause confusion — mild penalty.
  $multi_num = ($wame > 1);

  $score = 0;
  if ($wame || $api)  $score += 55;
  if ($prefilled)     $score += 15;
  if ($proto)         $score += 10;
  if ($widget)        $score += 15;
  if (!$wame && !$api && $cta) $score += 10;
  if ($multi_num)     $score  = max(0, $score - 5);
  $score = min(100, $score);

  $detail = ($wame || $api)
    ? 'WhatsApp activo (' . ($wame + $api) . ' enlace/s)' . ($prefilled ? ' con mensaje pre-rellenado ✓' : '') . '.'
    : ($cta ? 'Mencionan WhatsApp pero sin enlace wa.me.' : 'Sin integración WhatsApp visible.');
  if ($widget) $detail .= ' · Widget detectado ✓';
  if ($multi_num) $detail .= ' · Múltiples números detectados.';

  return [
    'label'    => 'Integración WhatsApp',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (wa.me + mensaje pre-rellenado + widgets)',
    'fix'      => 'Botón WhatsApp flotante con wa.me?text= (mensaje pre-rellenado) por página de servicio.',
  ];
}

// ── Dimension: mobile conversion ─────────────────────────────────────
function nwm_check_mobile_conversion(string $html): array {
  $has_viewport  = (bool)preg_match('/<meta[^>]+name=["\']viewport["\'][^>]+content=[^>]*width=device-width/i', $html);
  $has_tel       = (bool)preg_match('/<a[^>]+href=["\']tel:/i', $html);
  $has_sticky    = (bool)preg_match('/(position\s*:\s*fixed|sticky-cta|floating-cta|btn-floating|fab|nwm-site-chat\.js)/i', $html);
  $has_amp       = (bool)preg_match('/<html[^>]*\s(amp|⚡)/i', $html);
  $touch_size    = (bool)preg_match('/min-(height|width)\s*:\s*4[4-9]px|min-(height|width)\s*:\s*[5-9]\d+px/', $html);
  // Lazy images ratio — many lazy = mobile-optimized.
  $total_imgs    = max(1, (int)preg_match_all('/<img\b/i', $html));
  $lazy_imgs     = (int)preg_match_all('/loading=["\']lazy["\']/i', $html);
  $lazy_ratio    = $lazy_imgs / $total_imgs;
  // CSS media queries count.
  $media_queries = (int)preg_match_all('/@media\s*\(/i', $html);
  // Font size — small fonts hurt mobile UX.
  $small_font    = (bool)preg_match('/font-size\s*:\s*([0-9]+)px/i', $html, $fm) && (int)($fm[1] ?? 16) < 14;
  // Above-fold CTA: any CTA text in the first 3000 chars.
  $above_fold    = substr($html, 0, 3000);
  $has_fold_cta  = (bool)preg_match('/(cotiza|contacta|agenda|reserva|whatsapp|llama|contact|book)/i', $above_fold);

  $score = 0;
  if ($has_viewport)       $score += 30;
  if ($has_tel)            $score += 15;
  if ($has_sticky)         $score += 20;
  if ($touch_size)         $score +=  8;
  if ($has_amp)            $score +=  5;
  if ($lazy_ratio >= 0.4)  $score += 10;
  if ($media_queries >= 3) $score +=  7;
  if ($has_fold_cta)       $score += 10;
  if ($small_font)         $score  = max(0, $score - 5);
  $score = min(100, $score);

  $bits = [
    $has_viewport ? 'viewport ✓' : 'viewport ✗',
    $has_tel      ? 'tel: ✓'     : 'tel: ✗',
    $has_sticky   ? 'CTA fijo ✓' : 'CTA fijo ✗',
    $has_fold_cta ? 'CTA above-fold ✓' : '',
    $lazy_ratio >= 0.4 ? sprintf('lazy imgs %.0f%% ✓', $lazy_ratio * 100) : '',
  ];
  $bits = array_filter($bits);

  return [
    'label'    => 'Conversión móvil',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => implode(' · ', $bits),
    'evidence' => 'HTML scrape (viewport + tel + sticky CTA + lazy ratio + media queries)',
    'fix'      => 'Botón tel: visible, CTA flotante en móvil, CTA above-fold y viewport responsive.',
  ];
}

// ── Dimension: automation (chat widgets + exit-intent + email) ────────
function nwm_check_automation(string $html): array {
  // Chat widgets.
  $chat_providers = [
    'Intercom'   => '/widget\.intercom\.io|intercomcdn/i',
    'Tawk.to'    => '/embed\.tawk\.to/i',
    'Drift'      => '/js\.driftt\.com/i',
    'Crisp'      => '/client\.crisp\.chat/i',
    'Tidio'      => '/code\.tidio\.co/i',
    'HubSpot'    => '/js\.hs-scripts\.com/i',
    'ManyChat'   => '/widget\.manychat\.com/i',
    'FB Chat'    => '/connect\.facebook\.net.*customerchat/i',
    'Zendesk'    => '/static\.zdassets\.com/i',
    'Freshchat'  => '/wchat\.freshchat\.com/i',
    'LiveChat'   => '/cdn\.livechatinc\.com/i',
    'Botpress'   => '/cdn\.botpress\.cloud/i',
    'NWM Chat'   => '/nwm-site-chat\.js|nwm-chat\.js/i',
  ];
  $chat_found = [];
  foreach ($chat_providers as $name => $rx) {
    if (preg_match($rx, $html)) $chat_found[] = $name;
  }

  // Exit-intent / engagement tools.
  $exit_providers = [
    'OptinMonster' => '/optinmonster\.com/i',
    'Sumo'         => '/load\.sumome\.com|sumo\.com/i',
    'Hello Bar'    => '/hellobar\.com/i',
    'Picreel'      => '/picreel\.com/i',
    'Wisepops'     => '/wisepops\.com/i',
  ];
  $exit_found = [];
  foreach ($exit_providers as $name => $rx) {
    if (preg_match($rx, $html)) $exit_found[] = $name;
  }

  // Email automation / marketing trackers.
  $email_providers = [
    'Mailchimp'      => '/(mailchimp|mc\.us\d+\.list-manage)/i',
    'ActiveCampaign' => '/activehosted\.com|activecampaign\.com/i',
    'ConvertKit'     => '/(convertkit|ck-page)/i',
    'Klaviyo'        => '/static\.klaviyo\.com/i',
    'Brevo'          => '/(sendinblue\.com|brevo\.com)/i',
    'crm-vanilla'    => '/(\/api\/leads|\/crm-vanilla|nwm-chat\.js)/i',
  ];
  $email_found = [];
  foreach ($email_providers as $name => $rx) {
    if (preg_match($rx, $html)) $email_found[] = $name;
  }

  // Independent scoring per category.
  $chat_score  = $chat_found  ? min(60, 40 + count($chat_found) * 20)  : 0;
  $exit_score  = $exit_found  ? min(20, count($exit_found) * 10)        : 0;
  $email_score = $email_found ? min(20, count($email_found) * 10)       : 0;
  $score = min(100, $chat_score + $exit_score + $email_score);

  $parts = [];
  if ($chat_found)  $parts[] = 'Chat: ' . implode(', ', $chat_found);
  if ($exit_found)  $parts[] = 'Exit-intent: ' . implode(', ', $exit_found);
  if ($email_found) $parts[] = 'Email: ' . implode(', ', $email_found);

  return [
    'label'    => 'Automatización',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $parts ? implode(' · ', $parts) : 'Sin widgets de chat ni automatización detectada.',
    'evidence' => 'HTML scrape (chat widgets + exit-intent + email automation CDN patterns)',
    'fix'      => 'Activar bot de chat 24/7 + secuencia de email automatizada para nurturing de leads.',
  ];
}

// ── Dimension: analytics (NEW in v2.1) ───────────────────────────────
// Detects measurement and analytics tools: GA4, GTM, Meta Pixel, heatmaps, etc.
// "You can't improve what you don't measure."
function nwm_check_analytics(string $html): array {
  $trackers = [
    'GA4'              => '/(gtag\.js\?id=G-|["\']G-[A-Z0-9]{5,}["\'])/i',
    'GA Universal'     => '/(analytics\.js["\'\s]|_gaq\.push|ga\(["\']create["\'])/i',
    'Tag Manager'      => '/(googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,})/i',
    'Meta Pixel'       => '/(fbevents\.js|fbq\(|facebook\.com\/tr\?)/i',
    'LinkedIn Insight' => '/(snap\.licdn\.com|linkedin_partner_id)/i',
    'Hotjar'           => '/(hotjar\.com\/c\/hotjar|_hjSettings)/i',
    'MS Clarity'       => '/(clarity\.ms\/tag|window\.clarity)/i',
    'TikTok Pixel'     => '/(analytics\.tiktok\.com|ttq\.track)/i',
    'Pinterest Tag'    => '/ct\.pinterest\.com\/v3/i',
    'Segment'          => '/cdn\.segment\.com\/analytics\.js/i',
  ];

  $found = [];
  foreach ($trackers as $name => $rx) {
    if (preg_match($rx, $html)) $found[] = $name;
  }

  // Scoring: GA4 = 35 pts (primary measurement tool)
  //          GTM  = 30 pts (tag management — enables all other tracking)
  //          Meta Pixel = 20 pts (paid retargeting)
  //          Heatmap (Hotjar/Clarity) = 15 pts (UX improvement insight)
  //          Other tracker = 5 pts each, up to 10 pts extra
  $score = 0;
  if (in_array('GA4', $found))          $score += 35;
  elseif (in_array('GA Universal', $found)) $score += 15; // legacy, partial credit
  if (in_array('Tag Manager', $found))  $score += 30;
  if (in_array('Meta Pixel', $found))   $score += 20;
  $heatmap = array_intersect(['Hotjar', 'MS Clarity'], $found);
  if ($heatmap)                         $score += 15;
  $others = array_diff($found, ['GA4', 'GA Universal', 'Tag Manager', 'Meta Pixel', 'Hotjar', 'MS Clarity']);
  $score += min(10, count($others) * 5);
  $score = min(100, $score);

  $detail = $found
    ? 'Trackers detectados: ' . implode(', ', $found)
    : 'Sin herramientas de analítica detectadas — no se puede medir ni mejorar.';

  return [
    'label'    => 'Analítica y medición',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (GA4 · GTM · Meta Pixel · heatmaps · otros trackers)',
    'fix'      => 'Instalar GA4 + Google Tag Manager como mínimo; agregar Meta Pixel si se usará paid social; Hotjar o Clarity para UX.',
  ];
}

// ── Dimension: social presence ───────────────────────────────────────
// Finds social profile URLs in HTML (excluding share URLs), then verifies
// each is live via parallel HEAD requests.
function nwm_check_social(string $html): array {
  $patterns = [
    // Negative lookahead to exclude share/intent/dialog URLs.
    'Instagram' => '#https?://(www\.)?instagram\.com/(?!p/|reel/|explore/|share[/?])[A-Za-z0-9._-]{2,}#i',
    'Facebook'  => '#https?://(www\.)?facebook\.com/(?!sharer?[./]|share[/?]|dialog/|plugins|login)[A-Za-z0-9.\-_]{2,}#i',
    'LinkedIn'  => '#https?://(www\.)?linkedin\.com/(company|in)/[A-Za-z0-9-]+#i',
    'TikTok'    => '#https?://(www\.)?tiktok\.com/@[A-Za-z0-9._-]+#i',
    'YouTube'   => '#https?://(www\.)?youtube\.com/(@|channel/|c/|user/)[A-Za-z0-9._-]+#i',
    'X/Twitter' => '#https?://(www\.)?(x|twitter)\.com/(?!intent/|share)[A-Za-z0-9_]{1,15}#i',
  ];

  $found = [];
  foreach ($patterns as $name => $rx) {
    if (preg_match($rx, $html, $match)) {
      // Normalize: strip trailing punctuation, anchors, etc.
      $found[$name] = rtrim($match[0], '.,;"\')>');
    }
  }

  // Parallel HTTP verification — all profiles checked concurrently via HEAD.
  $verified   = nwm_verify_social_profiles($found);
  $found_names = array_keys($found);
  $unverified  = array_diff($found_names, $verified);

  // Score: 22 pts per verified live profile, max 100.
  $score = min(100, count($verified) * 22);

  $detail = $verified
    ? 'Perfiles activos (' . count($verified) . '): ' . implode(', ', $verified)
    : ($found_names ? 'Links en HTML pero no verificables: ' . implode(', ', $found_names) : 'Sin enlaces a redes sociales.');
  if ($unverified) $detail .= ' · No verificados: ' . implode(', ', array_values($unverified));

  return [
    'label'    => 'Presencia social',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape + verificación HEAD de perfiles (' . count($found) . ' encontrados)',
    'fix'      => 'Enlazar 3+ redes activas (Instagram + Facebook + LinkedIn mínimo).',
  ];
}

// Parallel HTTP profile verification using curl_multi.
// Uses HEAD requests (CURLOPT_NOBODY) to avoid downloading page bodies.
// Returns array of platform names whose profile URLs returned a live response.
function nwm_verify_social_profiles(array $profiles): array {
  if (!$profiles) return [];

  $mh      = curl_multi_init();
  $handles = [];
  foreach ($profiles as $name => $profile_url) {
    $ch = curl_init($profile_url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_NOBODY         => true,   // HEAD request — no body downloaded
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS      => 3,
      CURLOPT_TIMEOUT        => 7,
      CURLOPT_CONNECTTIMEOUT => 4,
      CURLOPT_USERAGENT      => 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      CURLOPT_HTTPHEADER     => ['Accept: text/html,application/xhtml+xml,*/*;q=0.8'],
      CURLOPT_SSL_VERIFYPEER => false,
    ]);
    curl_multi_add_handle($mh, $ch);
    $handles[$name] = $ch;
  }

  // Execute all handles in parallel.
  $active = null;
  do {
    $status = curl_multi_exec($mh, $active);
    if ($active) curl_multi_select($mh, 0.5);
  } while ($active > 0 && $status === CURLM_OK);

  $verified = [];
  foreach ($handles as $name => $ch) {
    $http_code    = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $effective_url = (string)curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    // Reject redirects to login/error pages (non-existent profiles on some platforms).
    $is_error_page = (bool)preg_match('#/(login|signin|error|404|not[_-]found|accounts/login|session/new)#i', $effective_url);
    // 200: profile exists. 403/405: exists but HEAD not allowed — count as verified.
    if (($http_code >= 200 && $http_code < 400 && !$is_error_page)
     || $http_code === 403
     || $http_code === 405) {
      $verified[] = $name;
    }
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
  }
  curl_multi_close($mh);

  return $verified;
}

// ── Dimension: content depth ─────────────────────────────────────────
// Primary signal: sitemap.xml real page count.
// Secondary: blog/resource path presence + Article schema + video embeds.
// Fallback: word count proxy.
function nwm_check_content(string $html, string $url): array {
  $has_blog           = (bool)preg_match('#href=["\'][^"\']*/(blog|articulos|art%C3%ADculos|noticias|recursos|guias|gu%C3%ADas)#i', $html);
  $has_article_schema = (bool)preg_match('/"@type"\s*:\s*"(Article|BlogPosting)"/i', $html);
  $has_video          = (bool)preg_match('/(youtube\.com\/embed|vimeo\.com\/video|<video\b)/i', $html);
  $internal_links     = (int)preg_match_all('#href=["\'][^"\']*#i', $html);
  $has_time_tag       = (bool)preg_match('/<time[^>]+datetime=["\'][0-9]{4}-[0-9]{2}-[0-9]{2}["\']/i', $html);

  // Fetch sitemap — try standard locations.
  $host   = parse_url($url, PHP_URL_HOST) ?: '';
  $scheme = parse_url($url, PHP_URL_SCHEME) ?: 'https';
  $base   = ($host !== '') ? rtrim($scheme . '://' . $host, '/') : '';

  $page_count = 0;
  $sitemap_src = '';
  if ($base !== '') {
    foreach (['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'] as $path) {
      $sm_url = $base . $path;
      $ch = curl_init($sm_url);
      curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_USERAGENT      => 'NetWebMediaAuditBot/2.1',
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 2,
        CURLOPT_SSL_VERIFYPEER => false,
      ]);
      $sm_body   = curl_exec($ch);
      $sm_status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
      curl_close($ch);
      if ($sm_status === 200 && $sm_body) {
        $page_count = (int)preg_match_all('#<loc>#i', $sm_body);
        if ($page_count > 0) { $sitemap_src = $path; break; }
      }
    }
  }

  // Word count fallback (strip tags).
  $words = 0;
  if (!$page_count) {
    $text  = preg_replace('/\s+/', ' ', strip_tags($html));
    $words = $text ? str_word_count(strip_tags($text), 0, 'áéíóúñÁÉÍÓÚÑ') : 0;
  }

  // Scoring:
  //   Sitemap pages: 0-30 pts (≥20=30, ≥10=24, ≥5=17, ≥1=10)
  //   OR word count: 0-18 pts fallback
  //   Blog path:  25 pts
  //   Article schema: 22 pts
  //   Video embed: 10 pts
  //   <time datetime>: 8 pts (freshness signal)
  //   Internal links ≥ 10: 5 pts
  if ($page_count > 0) {
    $depth_pts = $page_count >= 20 ? 30 : ($page_count >= 10 ? 24 : ($page_count >= 5 ? 17 : 10));
  } else {
    $depth_pts = $words >= 800 ? 18 : ($words >= 400 ? 12 : ($words >= 200 ? 7 : 3));
  }
  $score = $depth_pts
         + ($has_blog           ? 25 : 0)
         + ($has_article_schema ? 22 : 0)
         + ($has_video          ? 10 : 0)
         + ($has_time_tag       ?  8 : 0)
         + ($internal_links >= 10 ? 5 : 0);
  $score = min(100, $score);

  $detail = $has_blog ? 'Sección de contenido detectada.' : 'Sin sección blog/recursos.';
  $detail .= $page_count > 0
    ? " · Sitemap: $page_count páginas."
    : " · $words palabras en home.";
  if ($has_video)    $detail .= ' · Video embeds ✓';
  if ($has_time_tag) $detail .= ' · Fechas de actualización ✓';

  return [
    'label'    => 'Contenido',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => $sitemap_src ? "Sitemap XML ($sitemap_src) + HTML scrape" : 'HTML scrape (word count fallback)',
    'fix'      => 'Publicar 1-2 artículos/mes con BlogPosting schema, videos explicativos y fechas actualizadas.',
  ];
}

// ── Dimension: branding (OG + favicon + title + meta desc) ───────────
function nwm_check_branding(string $html): array {
  $has_og_title  = (bool)preg_match('/<meta[^>]+property=["\']og:title["\']/i', $html);
  $has_og_desc   = (bool)preg_match('/<meta[^>]+property=["\']og:description["\']/i', $html);
  $has_og_image  = (bool)preg_match('/<meta[^>]+property=["\']og:image["\']/i', $html);
  $has_tw_card   = (bool)preg_match('/<meta[^>]+name=["\']twitter:card["\']/i', $html);
  $has_favicon   = (bool)preg_match('/<link[^>]+rel=["\'][^"\']*icon["\']/i', $html);
  $has_themecolor= (bool)preg_match('/<meta[^>]+name=["\']theme-color["\']/i', $html);

  preg_match('#<title[^>]*>(.*?)</title>#is', $html, $tm);
  $title     = isset($tm[1]) ? trim(html_entity_decode($tm[1])) : '';
  $title_len = mb_strlen($title);
  $title_ok  = $title_len >= 25 && $title_len <= 65;
  // Partial credit for close-but-wrong length.
  $title_pts = $title_ok ? 20 : ($title_len >= 15 ? 10 : 0);

  // Meta description quality.
  $meta_desc_pts = 0;
  if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']{1,})["\'][^>]*>/i', $html, $md_m)
   || preg_match('/<meta[^>]+content=["\']([^"\']{1,})["\'][^>]+name=["\']description["\'][^>]*>/i', $html, $md_m)) {
    $meta_desc_pts = 10;
    $md_len = mb_strlen($md_m[1] ?? '');
    if ($md_len >= 100 && $md_len <= 160) $meta_desc_pts += 5;
  }

  $score = ($has_og_title ? 12 : 0) + ($has_og_desc ? 12 : 0) + ($has_og_image ? 18 : 0)
          + ($has_tw_card ? 8 : 0) + ($has_favicon ? 12 : 0)
          + ($has_themecolor ? 5 : 0)
          + $title_pts + $meta_desc_pts;
  $score = min(100, $score);

  return [
    'label'    => 'Branding',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => 'Título: ' . ($title_ok ? "$title_len car ✓" : "$title_len car ✗")
                . ' · OG: ' . (($has_og_title && $has_og_desc && $has_og_image) ? 'completo' : 'parcial')
                . ' · Meta desc: ' . ($meta_desc_pts >= 10 ? 'sí' : 'no')
                . ' · Favicon: ' . ($has_favicon ? 'sí' : 'no')
                . ($has_themecolor ? ' · theme-color ✓' : ''),
    'evidence' => 'HTML scrape (OG + favicon + title + meta description)',
    'fix'      => 'Completar Open Graph (title/description/image), meta description 100-160 chars, favicon y título 25-65 caracteres.',
  ];
}

// ── Dimension: reputation (trust signals beyond reviews) ─────────────
function nwm_check_reputation(string $html): array {
  $has_press      = (bool)preg_match('/(en la prensa|nos mencionan|destacados en|featured in)/i', $html);
  $has_clients    = (bool)preg_match('/(nuestros clientes|clientes destacados|trusted by)/i', $html);
  $has_awards     = (bool)preg_match('/(premio|reconocimiento|award|certificad[oa])/i', $html);
  $has_about      = (bool)preg_match('#href=["\'][^"\']*/(nosotros|sobre|acerca|about|equipo)#i', $html);
  $has_team       = (bool)preg_match('/(nuestro equipo|fundador|founder|CEO)/i', $html);
  $has_portfolio  = (bool)preg_match('#href=["\'][^"\']*/(portfolio|trabajos|proyectos|casos|cases)#i', $html);
  $has_partner_logos = (bool)preg_match('/(partner|alianza|ally|sponsors?)/i', $html);
  // Social proof numbers: e.g. "200+ clientes", "+5 años", "más de 1000".
  $has_social_nums = (bool)preg_match('/(\d+\+|\+\d+|más de \d+)\s*(clientes|años|proyectos|empresas|reseñas)/i', $html);

  $score = ($has_press ? 15 : 0) + ($has_clients ? 20 : 0) + ($has_awards ? 15 : 0)
         + ($has_about ? 15 : 0) + ($has_team ? 15 : 0)
         + ($has_portfolio ? 10 : 0) + ($has_partner_logos ? 5 : 0)
         + ($has_social_nums ? 10 : 0);
  $score = min(100, $score);

  return [
    'label'    => 'Reputación',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => 'About:' . ($has_about ? 'sí' : 'no')
                . ' · Clientes:' . ($has_clients ? 'sí' : 'no')
                . ' · Equipo:' . ($has_team ? 'sí' : 'no')
                . ' · Portfolio:' . ($has_portfolio ? 'sí' : 'no')
                . ' · Premios:' . ($has_awards ? 'sí' : 'no')
                . ($has_social_nums ? ' · Números de prueba social ✓' : ''),
    'evidence' => 'HTML scrape (señales de credibilidad + prueba social)',
    'fix'      => 'Página "Sobre nosotros" con equipo, logos de clientes, portfolio de casos y números de prueba social (ej: "200+ clientes").',
  ];
}

// ── Dimension: crawlability ───────────────────────────────────────────
// Checks: HTTPS, redirects count, robots.txt, no Disallow:/, Sitemap: declared,
// no meta noindex (dual attribute order), canonical on own domain.
function nwm_check_crawlability(string $url, string $html, array $http = []): array {
  $scheme = parse_url($url, PHP_URL_SCHEME) ?: 'https';
  $host   = parse_url($url, PHP_URL_HOST) ?: '';
  $base   = rtrim($scheme . '://' . $host, '/');

  // ① Meta robots — noindex is a hard penalty. Check both attribute orders.
  $has_noindex = (bool)preg_match('/<meta[^>]+name=["\']robots["\']\s[^>]*content=[^>]*(noindex)/i', $html)
              || (bool)preg_match('/<meta[^>]+content=["\'][^"\']*noindex[^"\']*["\']\s[^>]*name=["\']robots["\']/i', $html);

  // ② HTTPS — prefer from main fetch result, fallback to URL string.
  $has_https = $http['https'] ?? (stripos($url, 'https://') === 0);

  // ③ Redirect count from main fetch.
  $redirect_count = $http['redirect_count'] ?? 0;
  $too_many_redirects = $redirect_count > 2;

  // ④ Canonical — must point to own domain (or be absent). Check both attribute orders.
  $canonical_ok = true;
  if (preg_match('/<link[^>]+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']/i', $html, $can_m)
   || preg_match('/<link[^>]+href=["\']([^"\']+)["\']\s+rel=["\']canonical["\']/i', $html, $can_m)) {
    $canonical_host = parse_url($can_m[1], PHP_URL_HOST) ?: '';
    if ($canonical_host && stripos($canonical_host, $host) === false) {
      $canonical_ok = false;
    }
  }

  // ⑤ Fetch robots.txt.
  $robots_url  = $base . '/robots.txt';
  $ch = curl_init($robots_url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_USERAGENT      => 'NetWebMediaAuditBot/2.1',
    CURLOPT_SSL_VERIFYPEER => false,
  ]);
  $robots_body   = curl_exec($ch);
  $robots_status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $has_robots         = ($robots_status === 200 && !empty($robots_body));
  $robots_blocks_all  = $has_robots && (bool)preg_match('/^\s*Disallow\s*:\s*\/\s*$/m', (string)$robots_body);
  $has_sitemap_decl   = $has_robots && (bool)preg_match('/^Sitemap\s*:/im', (string)$robots_body);

  // ⑥ Sitemap link in <head> (alternative to robots.txt declaration).
  $has_sitemap_link = (bool)preg_match('/<link[^>]+rel=["\']sitemap["\']/i', $html);

  // Score:
  //   Not noindexed + not blocking:  35 pts (fundamental)
  //   HTTPS:                         25 pts
  //   robots.txt present:            15 pts
  //   robots not blocking all:        5 pts
  //   Sitemap declared:              10 pts
  //   Redirect count penalty:       -10 pts if > 2 hops
  $score = 0;
  if (!$has_noindex && !$robots_blocks_all) $score += 35;
  if ($has_https)                            $score += 25;
  if ($has_robots)                           $score += 15;
  if ($has_robots && !$robots_blocks_all)    $score +=  5;
  if ($has_sitemap_decl || $has_sitemap_link) $score += 10;
  if ($too_many_redirects)                   $score  = max(0, $score - 10);
  $score = min(100, $score);

  $parts = [];
  if ($has_noindex)       $parts[] = 'meta noindex detectado ⚠';
  if (!$has_https)        $parts[] = 'sin HTTPS';
  if (!$has_robots)       $parts[] = 'sin robots.txt';
  if ($robots_blocks_all) $parts[] = 'robots.txt bloquea todo ⚠';
  if (!$canonical_ok)     $parts[] = 'canonical externo ⚠';
  if ($too_many_redirects) $parts[] = "$redirect_count redirecciones ⚠";
  if ($has_sitemap_decl)  $parts[] = 'Sitemap en robots.txt ✓';
  if ($has_sitemap_link)  $parts[] = 'sitemap en <head> ✓';
  if (!$parts)            $parts[] = 'indexable y rastreable ✓';

  return [
    'label'    => 'Rastreabilidad',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => implode(' · ', $parts),
    'evidence' => 'robots.txt (' . ($has_robots ? "HTTP $robots_status" : 'no encontrado') . ') + meta robots + HTTPS + redirects',
    'fix'      => 'Publicar robots.txt con Sitemap: declarado, sin Disallow:/ y asegurar HTTPS en todas las páginas.',
  ];
}

// ── Helpers: band, color, derived findings ───────────────────────────
function nwm_audit_band(int $score): array {
  if ($score >= 90) return ['Excelente', '#10b981'];
  if ($score >= 70) return ['Sólido',    '#10b981'];
  if ($score >= 55) return ['Medio',     '#FF671F'];
  if ($score >= 40) return ['Bajo',      '#f59e0b'];
  return                   ['Crítico',   '#ef4444'];
}

function nwm_audit_gaps_from_dims(array $dims): array {
  $items = $dims;
  uasort($items, fn($a,$b) => ($a['score']??0) <=> ($b['score']??0));
  $out = [];
  foreach ($items as $key => $d) {
    if (count($out) >= 6) break;
    if (($d['status'] ?? '') === 'skipped') continue;
    if (($d['score'] ?? 0) >= 80) continue;
    $out[] = ($d['label'] ?? $key) . ' — ' . ($d['detail'] ?? '');
  }
  if (!$out) {
    foreach (array_slice($items, 0, 3, true) as $key => $d) {
      $out[] = ($d['label'] ?? $key) . ' — ' . ($d['detail'] ?? '');
    }
  }
  return $out;
}

function nwm_audit_priorities_from_dims(array $dims): array {
  $items = $dims;
  uasort($items, fn($a,$b) => ($a['score']??0) <=> ($b['score']??0));
  $out = [];
  foreach ($items as $key => $d) {
    if (count($out) >= 3) break;
    if (($d['status'] ?? '') === 'skipped') continue;
    if (($d['score'] ?? 0) >= 80) continue;
    $out[] = ($d['fix'] ?? $d['label'] ?? $key);
  }
  if (!$out) {
    $out = [
      'Mantener cadencia de medición mensual y monitorear regresiones en Core Web Vitals.',
      'Profundizar AEO con FAQ por consulta del rubro y artículos por temporada.',
      'Sostener gestión activa de reseñas y referidos con follow-up automatizado.',
    ];
  }
  return $out;
}

function nwm_audit_projections_from_dims(array $dims, int $score): array {
  $out  = [];
  $weak = array_filter($dims, fn($d) => ($d['score'] ?? 0) < 60 && ($d['status'] ?? '') !== 'skipped');
  $target = min(95, $score + max(15, count($weak) * 6));

  if (isset($dims['mobile_speed']) && ($dims['mobile_speed']['score'] ?? 0) < 70) {
    $out[] = 'Recuperar 15-25% del tráfico móvil que hoy se pierde por velocidad bajo umbral.';
  }
  if (isset($dims['whatsapp']) && ($dims['whatsapp']['score'] ?? 0) < 70) {
    $out[] = 'Reducir tiempo de primera respuesta a menos de 2 minutos vía WhatsApp con bot inicial.';
  }
  if (isset($dims['lead_capture']) && ($dims['lead_capture']['score'] ?? 0) < 70) {
    $out[] = 'Capturar 30-80 leads nuevos al mes con formulario + nurturing automatizado.';
  }
  if (isset($dims['aeo']) && ($dims['aeo']['score'] ?? 0) < 70) {
    $out[] = 'Aparecer en respuestas de IA (ChatGPT, Claude, Perplexity) para 4-6 consultas del rubro.';
  }
  if (isset($dims['analytics']) && ($dims['analytics']['score'] ?? 0) < 50) {
    $out[] = 'Instalar analítica completa (GA4 + GTM) para medir y optimizar cada canal de adquisición.';
  }
  if (isset($dims['schema']) && ($dims['schema']['score'] ?? 0) < 70) {
    $out[] = 'Activar vista rica en Google con schema completo — más clics desde búsqueda local.';
  }
  if (isset($dims['crawlability']) && ($dims['crawlability']['score'] ?? 0) < 70) {
    $out[] = 'Corregir configuración de rastreabilidad para que Google indexe todas las páginas correctamente.';
  }
  $out[] = sprintf('Subir el puntaje de presencia digital de %d a %d+ en 90 días.', $score, $target);
  return array_slice($out, 0, 4);
}

// ── Unreachable result ────────────────────────────────────────────────
function nwm_audit_unreachable_result(string $url, string $nk, string $city, array $http): array {
  return [
    'url'        => $url,
    'final_url'  => $http['final_url'] ?? $url,
    'niche_key'  => $nk,
    'city'       => $city,
    'fetched_at' => date('c'),
    'reachable'  => false,
    'http'       => [
      'status'    => $http['status']         ?? 0,
      'https'     => $http['https']          ?? false,
      'time_s'    => round($http['time_total'] ?? 0, 2),
      'ttfb_s'    => round($http['time_ttfb'] ?? 0, 2),
      'size_kb'   => 0,
      'redirects' => $http['redirect_count'] ?? 0,
    ],
    'score'       => 0,
    'band'        => 'Crítico',
    'color'       => '#ef4444',
    'dimensions'  => [],
    'gaps'        => ['No pudimos acceder al sitio (HTTP ' . ($http['status'] ?? 'sin respuesta') . '). El análisis requiere acceso al sitio.'],
    'priorities'  => ['Verificar que el dominio resuelva, tenga HTTPS válido y responda en menos de 5 segundos.'],
    'projections' => ['Una vez accesible, completamos el análisis de 14 dimensiones.'],
    'engine'      => 'nwm-audit/2.1',
  ];
}

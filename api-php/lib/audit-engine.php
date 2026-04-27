<?php
/* NetWebMedia digital-presence audit engine.
 *
 * Real measurements (no fabricated scores). Given a URL + niche key, returns
 * a structured audit with 12 dimension scores, an aggregate 0-100 score, a
 * band (Crítico/Bajo/Medio/Sólido/Excelente), generated gaps/priorities/
 * projections derived from actual findings, and per-dimension evidence.
 *
 * Tier 1 checks (no API keys required) — always run:
 *   - reachability (HTTP status + HTTPS + redirect chain)
 *   - schema markup (JSON-LD presence + types)
 *   - lead capture (forms + form-embed scripts)
 *   - WhatsApp integration (wa.me links + CTAs)
 *   - mobile conversion (viewport meta, click-to-call, touch targets)
 *   - automation (chat widgets — Intercom/Tawk/Drift/Crisp/Tidio/etc.)
 *   - social presence (links to IG/FB/LI/TT/YT/X)
 *   - content depth (blog/articles/resources path, text volume)
 *   - branding (Open Graph + favicon + title quality)
 *   - reputation (testimonials/reviews/AggregateRating schema)
 *
 * Tier 2 (with PAGESPEED_API_KEY in env) — replaces the page-weight fallback:
 *   - mobile speed (real Core Web Vitals via PageSpeed Insights API)
 *
 * Tier 3 (with BRAVE_SEARCH_API_KEY in env) — replaces the AEO heuristic:
 *   - AEO presence (real SERP check for niche+city queries)
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
  // .htaccess deny — cache files must not be served via HTTP.
  $hta = $cache_dir . '/.htaccess';
  if (!file_exists($hta)) @file_put_contents($hta, "Require all denied\n");

  $key = md5(strtolower($url) . '|' . $niche_key . '|' . strtolower($city));
  $cache_file = $cache_dir . '/' . $key . '.json';
  $ttl = 7 * 86400; // 7 days

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

  // Fetch homepage (Tier 1 source-of-truth for most checks).
  $http = nwm_audit_fetch($url);

  if (!$http['ok']) {
    return nwm_audit_unreachable_result($url, $niche_key, $city, $http);
  }

  $html = $http['body'];
  $final_url = $http['final_url'];

  // Run all dimension checks. Each returns:
  //   ['label' => str, 'score' => 0-100, 'status' => pass|warn|fail|skipped,
  //    'detail' => str, 'evidence' => str, 'fix' => str]
  $dims = [
    'aeo'                => nwm_check_aeo($final_url, $html, $niche_key, $city),
    'mobile_speed'       => nwm_check_mobile_speed($final_url, $http),
    'schema'             => nwm_check_schema($html, $niche_key),
    'lead_capture'       => nwm_check_lead_capture($html),
    'reviews'            => nwm_check_reviews($html),
    'whatsapp'           => nwm_check_whatsapp($html),
    'mobile_conversion'  => nwm_check_mobile_conversion($html),
    'automation'         => nwm_check_automation($html),
    'social'             => nwm_check_social($html),
    'content'            => nwm_check_content($html, $final_url),
    'branding'           => nwm_check_branding($html),
    'reputation'         => nwm_check_reputation($html),
  ];

  // Weighted aggregate. Weights reflect impact on lead generation for SMBs.
  $weights = [
    'aeo'               => 1.2,
    'mobile_speed'      => 1.3,
    'schema'            => 1.0,
    'lead_capture'      => 1.3,
    'reviews'           => 0.9,
    'whatsapp'          => 1.2,  // Chile-specific weight
    'mobile_conversion' => 1.1,
    'automation'        => 0.8,
    'social'            => 0.7,
    'content'           => 0.9,
    'branding'          => 0.8,
    'reputation'        => 0.8,
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

  // Findings derived from the actual checks.
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
      'status'   => $http['status'],
      'https'    => $http['https'],
      'time_s'   => round($http['time_total'], 2),
      'size_kb'  => (int)round($http['size'] / 1024),
      'redirects' => $http['redirect_count'],
    ],
    'score'        => $score,
    'band'         => $band,
    'color'        => $color,
    'dimensions'   => $dims,
    'gaps'         => $gaps,
    'priorities'   => $priorities,
    'projections'  => $projections,
    'engine'       => 'nwm-audit/1.0',
  ];
}

// ── URL normalization ─────────────────────────────────────────────────
function nwm_audit_normalize_url(string $url): string {
  $url = trim($url);
  if ($url === '') return '';
  if (!preg_match('#^https?://#i', $url)) $url = 'https://' . $url;
  return $url;
}

// ── HTTP fetch (curl with timeout + redirect follow) ──────────────────
function nwm_audit_fetch(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 12,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_USERAGENT      => 'NetWebMediaAuditBot/1.0 (+https://netwebmedia.com/audit)',
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

  $status = (int)($info['http_code'] ?? 0);
  $final_url = (string)($info['url'] ?? $url);
  $ok = ($body !== false) && ($status >= 200 && $status < 400);

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

// ── Dimension: AEO presence ───────────────────────────────────────────
function nwm_check_aeo(string $url, string $html, string $niche_key, string $city): array {
  $api_key = getenv('BRAVE_SEARCH_API_KEY') ?: '';
  $domain  = parse_url($url, PHP_URL_HOST) ?: '';
  $domain  = preg_replace('/^www\./i', '', $domain);

  // Tier 3: real SERP check via Brave.
  if ($api_key !== '') {
    $queries = nwm_aeo_queries($niche_key, $city);
    $hits = 0; $checked = 0;
    foreach ($queries as $q) {
      $checked++;
      $found = nwm_brave_search_contains($q, $domain, $api_key);
      if ($found) $hits++;
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

  // Tier 1 fallback: heuristic from on-page AEO signals.
  // Strong signal: FAQPage schema + clear question-answer content + author/freshness.
  $has_faq      = (bool)preg_match('/"@type"\s*:\s*"FAQPage"/i', $html);
  $has_article  = (bool)preg_match('/"@type"\s*:\s*"(Article|BlogPosting|NewsArticle)"/i', $html);
  $has_org      = (bool)preg_match('/"@type"\s*:\s*"Organization"/i', $html);
  $has_qa_text  = preg_match_all('/<h[23][^>]*>\s*[¿?]/i', $html) >= 2;
  $score = 25
         + ($has_faq      ? 30 : 0)
         + ($has_article  ? 15 : 0)
         + ($has_org      ? 10 : 0)
         + ($has_qa_text  ? 20 : 0);
  $score = min(85, $score); // cap heuristic at 85 — only Tier 3 can prove >85.

  return [
    'label'    => 'Visibilidad en respuestas de IA (AEO)',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $has_faq
      ? 'Detectamos FAQPage schema y contenido estructurado tipo pregunta-respuesta.'
      : 'No detectamos señales fuertes de AEO (FAQPage schema, Q&A, Article).',
    'evidence' => 'Heurístico on-page · FAQ:' . ($has_faq?'sí':'no') . ' · Article:' . ($has_article?'sí':'no') . ' · Org:' . ($has_org?'sí':'no'),
    'fix'      => 'Publicar página FAQ con FAQPage schema y artículos por consulta del rubro en ' . $city . '.',
  ];
}

function nwm_aeo_queries(string $nk, string $city): array {
  $by = [
    'tourism'        => ["mejor hotel boutique en $city", "aparthotel $city", "alojamiento ejecutivo $city"],
    'restaurants'    => ["dónde comer bien en $city", "restaurante recomendado $city", "almuerzo ejecutivo $city"],
    'beauty'         => ["mejor peluquería en $city", "spa $city", "salón de belleza $city"],
    'law_firms'      => ["abogado laboral $city", "estudio jurídico $city", "abogado familia $city"],
    'real_estate'    => ["corredor de propiedades $city", "departamentos en venta $city"],
    'health'         => ["clínica dental $city", "kinesiólogo $city", "médico especialista $city"],
    'home_services'  => ["gasfíter $city", "electricista a domicilio $city", "servicio técnico $city"],
    'automotive'     => ["taller mecánico confiable $city", "venta autos usados $city"],
    'financial_services' => ["asesor financiero $city", "contador pyme $city"],
    'events_weddings'=> ["organizador de bodas $city", "salón de eventos $city"],
    'wine_agriculture'=> ["viñas boutique $city", "vino artesanal $city"],
    'education'      => ["preuniversitario $city", "instituto de inglés $city"],
    'local_specialist'=> ["servicio especializado $city", "experto local $city"],
    'smb'            => ["pyme servicios $city", "agencia digital $city"],
  ];
  return $by[$nk] ?? $by['smb'];
}

function nwm_brave_search_contains(string $query, string $domain, string $api_key): bool {
  $url = 'https://api.search.brave.com/res/v1/web/search?q=' . urlencode($query) . '&count=10&country=CL&search_lang=es';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => [
      'Accept: application/json',
      'X-Subscription-Token: ' . $api_key,
    ],
  ]);
  $resp = curl_exec($ch);
  curl_close($ch);
  if (!$resp) return false;
  $data = @json_decode($resp, true);
  $results = $data['web']['results'] ?? [];
  foreach ($results as $r) {
    $u = (string)($r['url'] ?? '');
    if (stripos($u, $domain) !== false) return true;
  }
  return false;
}

// ── Dimension: mobile speed ──────────────────────────────────────────
function nwm_check_mobile_speed(string $url, array $http): array {
  $api_key = getenv('PAGESPEED_API_KEY') ?: '';

  // Tier 2: real PageSpeed Insights call.
  if ($api_key !== '') {
    $psi_url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
             . '?url=' . urlencode($url)
             . '&strategy=mobile'
             . '&category=performance'
             . '&key=' . urlencode($api_key);
    $ch = curl_init($psi_url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT        => 45,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $data = $resp ? @json_decode($resp, true) : null;
    $perf = $data['lighthouseResult']['categories']['performance']['score'] ?? null;
    if ($perf !== null) {
      $score = (int)round($perf * 100);
      $audits = $data['lighthouseResult']['audits'] ?? [];
      $lcp = $audits['largest-contentful-paint']['displayValue'] ?? '—';
      $cls = $audits['cumulative-layout-shift']['displayValue'] ?? '—';
      $tbt = $audits['total-blocking-time']['displayValue'] ?? '—';
      return [
        'label'    => 'Velocidad móvil',
        'score'    => $score,
        'status'   => $score >= 70 ? 'pass' : ($score >= 50 ? 'warn' : 'fail'),
        'detail'   => "Performance score $score/100 · LCP $lcp · CLS $cls · TBT $tbt (Lighthouse mobile).",
        'evidence' => 'Google PageSpeed Insights API',
        'fix'      => 'Comprimir imágenes a WebP/AVIF, diferir JS no crítico y servir CSS crítico inline.',
      ];
    }
  }

  // Tier 1 fallback: total response time + payload size.
  $t = $http['time_total'] ?? 0;
  $kb = ($http['size'] ?? 0) / 1024;
  // Score: 100 if <1s and <500kb; degrades from there.
  $time_pts = $t < 1.0 ? 50 : ($t < 2.0 ? 40 : ($t < 3.0 ? 25 : ($t < 4.0 ? 15 : 5)));
  $size_pts = $kb < 500 ? 50 : ($kb < 1000 ? 40 : ($kb < 2000 ? 25 : ($kb < 4000 ? 15 : 5)));
  $score = $time_pts + $size_pts;
  return [
    'label'    => 'Velocidad móvil',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 50 ? 'warn' : 'fail'),
    'detail'   => sprintf('Carga total %.2fs · peso %d KB (proxy de velocidad — para Core Web Vitals reales activa PAGESPEED_API_KEY).', $t, $kb),
    'evidence' => 'cURL timing + payload',
    'fix'      => 'Reducir peso de página bajo 1 MB y servir bajo 2 segundos en móvil.',
  ];
}

// ── Dimension: schema markup ─────────────────────────────────────────
function nwm_check_schema(string $html, string $niche_key): array {
  $types = [];
  if (preg_match_all('#<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>#is', $html, $m)) {
    foreach ($m[1] as $blob) {
      $data = @json_decode(trim($blob), true);
      if (!$data) continue;
      $stack = is_array($data) ? [$data] : [];
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
  }
  $types = array_values(array_unique($types));

  $niche_type_map = [
    'tourism'         => ['Hotel','LodgingBusiness'],
    'restaurants'     => ['Restaurant','FoodEstablishment'],
    'beauty'          => ['BeautySalon','HealthAndBeautyBusiness'],
    'law_firms'       => ['LegalService','Attorney'],
    'real_estate'     => ['RealEstateAgent'],
    'health'          => ['MedicalBusiness','MedicalClinic','Dentist','Physician'],
    'home_services'   => ['HomeAndConstructionBusiness','Plumber','Electrician'],
    'automotive'      => ['AutoRepair','AutoDealer'],
    'financial_services' => ['FinancialService','AccountingService'],
    'events_weddings' => ['EventVenue'],
    'education'       => ['EducationalOrganization'],
  ];
  $expected = $niche_type_map[$niche_key] ?? [];
  // LocalBusiness subtypes — schema.org hierarchy (partial; covers common niches).
  $local_subtypes = [
    'LocalBusiness','ProfessionalService','HomeAndConstructionBusiness',
    'FoodEstablishment','LodgingBusiness','MedicalBusiness','HealthAndBeautyBusiness',
    'SportsActivityLocation','EntertainmentBusiness','Store','FinancialService',
    'LegalService','AutomotiveBusiness','EducationalOrganization',
    'RealEstateAgent','Restaurant','Hotel','Dentist','Physician','BeautySalon',
    'AutoRepair','AutoDealer','Plumber','Electrician','AccountingService',
    'Attorney','EventVenue','MedicalClinic',
  ];
  $org_types  = array_merge(['Organization','Corporation'], $local_subtypes);
  $has_org    = count(array_intersect($types, $org_types)) > 0;
  $has_local  = count(array_intersect($types, $local_subtypes)) > 0 || count(array_intersect($types, $expected)) > 0;
  $has_niche  = count(array_intersect($types, $expected)) > 0;

  $score = 0;
  if ($has_org)   $score += 30;
  if ($has_local) $score += 35;
  if ($has_niche) $score += 35;
  if (!$expected && $has_org && $has_local) $score = max($score, 75);
  $score = min(100, $score);

  $detail = $types
    ? 'Tipos detectados: ' . implode(', ', array_slice($types, 0, 6))
    : 'No se encontraron bloques JSON-LD.';
  if ($expected && !$has_niche) {
    $detail .= ' · Falta schema específico del rubro: ' . implode('/', $expected) . '.';
  }
  return [
    'label'    => 'Schema markup',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'JSON-LD scrape',
    'fix'      => 'Agregar Organization + LocalBusiness + ' . ($expected ? implode('/', $expected) : 'tipo del rubro') . ' con horario, dirección y teléfono.',
  ];
}

// ── Dimension: lead capture ──────────────────────────────────────────
function nwm_check_lead_capture(string $html): array {
  $forms = preg_match_all('/<form\b[^>]*>/i', $html);
  // Filter likely search forms.
  $real_forms = preg_match_all('/<form\b(?![^>]*role=["\']search["\'])[^>]*>/i', $html);
  $real_forms = max(0, $real_forms);

  $providers = [
    'HubSpot'   => '/(hsforms|hs-forms\.com)/i',
    'Typeform'  => '/typeform\.com/i',
    'Jotform'   => '/jotform\.com/i',
    'Calendly'  => '/calendly\.com/i',
    'Gravity'   => '/gravityforms/i',
    'WPForms'   => '/wpforms/i',
    'Mailchimp' => '/(mailchimp|mc\.us\d+\.list-manage)/i',
    'crm-vanilla' => '/(\/api\/leads|\/crm-vanilla)/i',
  ];
  $found = [];
  foreach ($providers as $name => $rx) {
    if (preg_match($rx, $html)) $found[] = $name;
  }
  $has_email = (bool)preg_match('/<input[^>]+type=["\']email["\']/i', $html);
  $has_tel   = (bool)preg_match('/<a[^>]+href=["\']tel:/i', $html);
  $has_mailto= (bool)preg_match('/<a[^>]+href=["\']mailto:/i', $html);

  $score = 0;
  if ($real_forms > 0) $score += 40;
  if ($has_email)      $score += 20;
  if ($found)          $score += 25;
  if ($has_tel)        $score += 8;
  if ($has_mailto)     $score += 7;
  $score = min(100, $score);

  $detail = $real_forms
    ? "Formularios detectados: $real_forms"
    : 'No detectamos formularios de captura.';
  if ($found) $detail .= ' · Proveedores: ' . implode(', ', $found);
  if (!$has_email && !$found) $detail .= ' · Sin captura de correo automatizada.';

  return [
    'label'    => 'Captura de leads',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (forms + embeds)',
    'fix'      => 'Activar formulario de captura con respuesta automática y nurturing por correo + WhatsApp.',
  ];
}

// ── Dimension: reviews / GMB signals on site ─────────────────────────
function nwm_check_reviews(string $html): array {
  $has_review_schema = (bool)preg_match('/"@type"\s*:\s*"(Review|AggregateRating)"/i', $html);
  $has_rating = (bool)preg_match('/(★|⭐|aggregateRating)/i', $html);
  $has_section = (bool)preg_match('/(testimonios?|rese(ñ|n)as|opiniones|lo que dicen)/i', $html);
  $has_gmb_link = (bool)preg_match('#(g\.page/|maps\.app\.goo\.gl|google\.com/maps)#i', $html);

  $score = 0;
  if ($has_review_schema) $score += 50;
  if ($has_rating)        $score += 15;
  if ($has_section)       $score += 20;
  if ($has_gmb_link)      $score += 15;
  $score = min(100, $score);

  $detail = $has_review_schema
    ? 'Detectamos schema Review/AggregateRating en el sitio.'
    : ($has_section ? 'Hay sección de testimonios pero sin schema.' : 'No detectamos testimonios ni reseñas en el sitio.');
  if (!$has_gmb_link) $detail .= ' · Sin enlace a Google Business / Maps.';

  return [
    'label'    => 'Gestión de reseñas',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (schema + secciones)',
    'fix'      => 'Mostrar reseñas con AggregateRating schema y enlazar a la ficha de Google Business.',
  ];
}

// ── Dimension: WhatsApp ──────────────────────────────────────────────
function nwm_check_whatsapp(string $html): array {
  $wame   = preg_match_all('#wa\.me/\d+#i', $html);
  $api    = preg_match_all('#api\.whatsapp\.com/send#i', $html);
  $proto  = (bool)preg_match('#whatsapp://send#i', $html);
  $cta    = (bool)preg_match('/whatsapp/i', $html);
  $widget = (bool)preg_match('/(elfsight-whatsapp|wa-chat|whatsapp-widget|chaty|nwm-site-chat\.js)/i', $html);

  $score = 0;
  if ($wame || $api) $score += 60;
  if ($proto)        $score += 15;
  if ($widget)       $score += 15;
  if (!$wame && !$api && $cta) $score += 10; // mention only — weak signal
  $score = min(100, $score);

  $detail = ($wame || $api)
    ? 'WhatsApp activo en el sitio (' . ($wame + $api) . ' enlace/s).'
    : ($cta ? 'Mencionan WhatsApp pero sin enlace directo wa.me.' : 'Sin integración WhatsApp visible.');
  if ($widget) $detail .= ' · Widget detectado.';

  return [
    'label'    => 'Integración WhatsApp',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (wa.me + widgets)',
    'fix'      => 'Botón WhatsApp flotante con wa.me y mensaje pre-rellenado por página.',
  ];
}

// ── Dimension: mobile conversion ─────────────────────────────────────
function nwm_check_mobile_conversion(string $html): array {
  $has_viewport = (bool)preg_match('/<meta[^>]+name=["\']viewport["\'][^>]+content=[^>]*width=device-width/i', $html);
  $has_tel      = (bool)preg_match('/<a[^>]+href=["\']tel:/i', $html);
  $has_sticky   = (bool)preg_match('/(position\s*:\s*fixed|sticky-cta|floating-cta|btn-floating|fab|nwm-site-chat\.js)/i', $html);
  $has_amp      = (bool)preg_match('/<html[^>]*\s(amp|⚡)/i', $html);
  $touch_size   = (bool)preg_match('/min-(height|width)\s*:\s*4[4-9]px|min-(height|width)\s*:\s*[5-9]\d+px/', $html);

  $score = 0;
  if ($has_viewport) $score += 40;
  if ($has_tel)      $score += 20;
  if ($has_sticky)   $score += 20;
  if ($touch_size)   $score += 10;
  if ($has_amp)      $score += 10;
  $score = min(100, $score);

  $bits = [];
  $bits[] = $has_viewport ? 'viewport ✓' : 'viewport ✗';
  $bits[] = $has_tel ? 'tel: ✓' : 'tel: ✗';
  $bits[] = $has_sticky ? 'CTA fijo ✓' : 'CTA fijo ✗';
  return [
    'label'    => 'Conversión móvil',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => implode(' · ', $bits),
    'evidence' => 'HTML scrape (viewport + tel + sticky CTA)',
    'fix'      => 'Botón tel: visible, CTA flotante en móvil y viewport responsive.',
  ];
}

// ── Dimension: automation (chat widgets) ─────────────────────────────
function nwm_check_automation(string $html): array {
  $providers = [
    'Intercom'  => '/widget\.intercom\.io|intercomcdn/i',
    'Tawk.to'   => '/embed\.tawk\.to/i',
    'Drift'     => '/js\.driftt\.com/i',
    'Crisp'     => '/client\.crisp\.chat/i',
    'Tidio'     => '/code\.tidio\.co/i',
    'HubSpot'   => '/js\.hs-scripts\.com/i',
    'ManyChat'  => '/widget\.manychat\.com/i',
    'FB Chat'   => '/connect\.facebook\.net.*customerchat/i',
    'Zendesk'   => '/static\.zdassets\.com/i',
    'Freshchat' => '/wchat\.freshchat\.com/i',
    'LiveChat'  => '/cdn\.livechatinc\.com/i',
    // NetWebMedia's own site-chat widget (WhatsApp FAB + AI chatbot)
    'NWM Chat'  => '/nwm-site-chat\.js|nwm-chat\.js/i',
  ];
  $found = [];
  foreach ($providers as $name => $rx) {
    if (preg_match($rx, $html)) $found[] = $name;
  }
  $score = $found ? min(100, 60 + count($found) * 20) : 0;
  return [
    'label'    => 'Automatización',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $found ? 'Widget(s) detectado/s: ' . implode(', ', $found) : 'No detectamos widgets de chat ni automatización.',
    'evidence' => 'HTML scrape (chat widget scripts)',
    'fix'      => 'Activar bot inicial 24/7 (WhatsApp + chat) para responder consultas en menos de 2 minutos.',
  ];
}

// ── Dimension: social presence ───────────────────────────────────────
function nwm_check_social(string $html): array {
  $platforms = [
    'Instagram' => '#https?://(www\.)?instagram\.com/[A-Za-z0-9._-]+#i',
    'Facebook'  => '#https?://(www\.)?facebook\.com/[A-Za-z0-9.\-_/]+#i',
    'LinkedIn'  => '#https?://(www\.)?linkedin\.com/(company|in)/[A-Za-z0-9-]+#i',
    'TikTok'    => '#https?://(www\.)?tiktok\.com/@[A-Za-z0-9._-]+#i',
    'YouTube'   => '#https?://(www\.)?youtube\.com/(@|channel/|c/|user/)[A-Za-z0-9._-]+#i',
    'X/Twitter' => '#https?://(www\.)?(x|twitter)\.com/[A-Za-z0-9_]+#i',
  ];
  $found = [];
  foreach ($platforms as $name => $rx) {
    if (preg_match($rx, $html)) $found[] = $name;
  }
  $score = min(100, count($found) * 22);
  return [
    'label'    => 'Presencia social',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $found ? 'Plataformas enlazadas: ' . implode(', ', $found) : 'No detectamos enlaces a redes sociales.',
    'evidence' => 'HTML scrape (links a perfiles)',
    'fix'      => 'Enlazar 3-4 redes con cuentas activas (mínimo Instagram + Facebook + LinkedIn).',
  ];
}

// ── Dimension: content depth ─────────────────────────────────────────
function nwm_check_content(string $html, string $url): array {
  $has_blog = (bool)preg_match('#href=["\'][^"\']*/(blog|articulos|art%C3%ADculos|noticias|recursos|guias|gu%C3%ADas)#i', $html);
  $has_article_schema = (bool)preg_match('/"@type"\s*:\s*"(Article|BlogPosting)"/i', $html);
  // Strip tags for word count.
  $text = strip_tags($html);
  $text = preg_replace('/\s+/', ' ', $text);
  $words = $text ? str_word_count(strip_tags($text), 0, 'áéíóúñÁÉÍÓÚÑ') : 0;
  $word_pts = $words >= 800 ? 35 : ($words >= 400 ? 25 : ($words >= 200 ? 15 : 5));

  $score = ($has_blog ? 35 : 0) + ($has_article_schema ? 30 : 0) + $word_pts;
  $score = min(100, $score);

  $detail = $has_blog ? 'Sección de contenido detectada.' : 'No detectamos sección de blog/recursos.';
  $detail .= ' · ' . $words . ' palabras visibles en home.';
  return [
    'label'    => 'Contenido',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => $detail,
    'evidence' => 'HTML scrape (blog path + word count)',
    'fix'      => 'Publicar 1-2 artículos/mes con BlogPosting schema, optimizados por consulta del rubro.',
  ];
}

// ── Dimension: branding (OG + favicon + title) ───────────────────────
function nwm_check_branding(string $html): array {
  $has_og_title = (bool)preg_match('/<meta[^>]+property=["\']og:title["\']/i', $html);
  $has_og_desc  = (bool)preg_match('/<meta[^>]+property=["\']og:description["\']/i', $html);
  $has_og_image = (bool)preg_match('/<meta[^>]+property=["\']og:image["\']/i', $html);
  $has_tw_card  = (bool)preg_match('/<meta[^>]+name=["\']twitter:card["\']/i', $html);
  $has_favicon  = (bool)preg_match('/<link[^>]+rel=["\'][^"\']*icon["\']/i', $html);
  preg_match('#<title[^>]*>(.*?)</title>#is', $html, $tm);
  $title = isset($tm[1]) ? trim(html_entity_decode($tm[1])) : '';
  $title_len = mb_strlen($title);
  $title_ok = $title_len >= 25 && $title_len <= 65;

  $score = ($has_og_title?15:0)+($has_og_desc?15:0)+($has_og_image?20:0)+($has_tw_card?10:0)+($has_favicon?15:0)+($title_ok?25:0);
  $score = min(100, $score);
  return [
    'label'    => 'Branding',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => 'Título: ' . ($title_ok ? "$title_len car ✓" : "$title_len car ✗") .
                  ' · OG: ' . (($has_og_title&&$has_og_desc&&$has_og_image)?'completo':'parcial') .
                  ' · Favicon: ' . ($has_favicon?'sí':'no'),
    'evidence' => 'HTML scrape (OG + favicon + title)',
    'fix'      => 'Completar Open Graph (title/description/image), favicon y título 25-65 caracteres.',
  ];
}

// ── Dimension: reputation (signals beyond reviews) ───────────────────
function nwm_check_reputation(string $html): array {
  $has_press = (bool)preg_match('/(en la prensa|nos mencionan|destacados en|featured in)/i', $html);
  $has_clients = (bool)preg_match('/(nuestros clientes|clientes destacados|trusted by)/i', $html);
  $has_awards  = (bool)preg_match('/(premio|reconocimiento|award|certificad[oa])/i', $html);
  $has_about   = (bool)preg_match('#href=["\'][^"\']*/(nosotros|sobre|acerca|about|equipo)#i', $html);
  $has_team    = (bool)preg_match('/(nuestro equipo|fundador|founder|CEO)/i', $html);

  $score = ($has_press?20:0)+($has_clients?25:0)+($has_awards?15:0)+($has_about?20:0)+($has_team?20:0);
  $score = min(100, $score);
  return [
    'label'    => 'Reputación',
    'score'    => $score,
    'status'   => $score >= 70 ? 'pass' : ($score >= 40 ? 'warn' : 'fail'),
    'detail'   => 'About:' . ($has_about?'sí':'no')
                . ' · Clientes:' . ($has_clients?'sí':'no')
                . ' · Equipo:' . ($has_team?'sí':'no')
                . ' · Premios:' . ($has_awards?'sí':'no'),
    'evidence' => 'HTML scrape (señales de credibilidad)',
    'fix'      => 'Página "Sobre nosotros" con equipo, logos de clientes/medios y certificaciones.',
  ];
}

// ── Helpers: band, color, derived findings ───────────────────────────
function nwm_audit_band(int $score): array {
  if ($score >= 90) return ['Excelente', '#10b981'];
  if ($score >= 70) return ['Sólido',    '#10b981'];
  if ($score >= 55) return ['Medio',     '#FF671F'];
  if ($score >= 40) return ['Bajo',      '#f59e0b'];
  return ['Crítico', '#ef4444'];
}

function nwm_audit_gaps_from_dims(array $dims): array {
  // Sort by score asc — worst first. Take the 6 worst that aren't 'pass'.
  $items = $dims;
  uasort($items, fn($a,$b) => ($a['score']??0) <=> ($b['score']??0));
  $out = [];
  foreach ($items as $key => $d) {
    if (count($out) >= 6) break;
    if (($d['status'] ?? '') === 'skipped') continue;
    if (($d['score'] ?? 0) >= 80) continue; // strong dimensions aren't gaps
    $out[] = ($d['label'] ?? $key) . ' — ' . ($d['detail'] ?? '');
  }
  // If everything is strong, surface the lowest 3 as "áreas a optimizar".
  if (!$out) {
    $top3 = array_slice($items, 0, 3, true);
    foreach ($top3 as $key => $d) {
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
    // All strong — show maintenance priorities.
    $out = [
      'Mantener cadencia de medición mensual y monitorear regresiones en Core Web Vitals.',
      'Profundizar AEO con FAQ por consulta del rubro y artículos por temporada.',
      'Sostener gestión activa de reseñas y referidos con follow-up automatizado.',
    ];
  }
  return $out;
}

function nwm_audit_projections_from_dims(array $dims, int $score): array {
  $out = [];
  $weak = array_filter($dims, fn($d) => ($d['score'] ?? 0) < 60 && ($d['status'] ?? '') !== 'skipped');
  $target = min(95, $score + max(15, count($weak) * 6));

  if (isset($dims['mobile_speed']) && ($dims['mobile_speed']['score'] ?? 0) < 70) {
    $out[] = 'Recuperar 15-25% del tráfico móvil que hoy se pierde por velocidad bajo umbral.';
  }
  if (isset($dims['whatsapp']) && ($dims['whatsapp']['score'] ?? 0) < 70) {
    $out[] = 'Reducir el tiempo de primera respuesta a menos de 2 minutos vía WhatsApp con bot inicial.';
  }
  if (isset($dims['lead_capture']) && ($dims['lead_capture']['score'] ?? 0) < 70) {
    $out[] = 'Capturar entre 30 y 80 leads nuevos al mes con formulario + nurturing automatizado.';
  }
  if (isset($dims['aeo']) && ($dims['aeo']['score'] ?? 0) < 70) {
    $out[] = 'Aparecer en respuestas de IA (ChatGPT, Claude, Perplexity) para 4-6 consultas habituales del rubro.';
  }
  if (isset($dims['schema']) && ($dims['schema']['score'] ?? 0) < 70) {
    $out[] = 'Activar vista rica en Google con schema completo — más clics desde búsqueda local.';
  }
  $out[] = sprintf('Subir el puntaje de presencia digital de %d a %d+ en 90 días.', $score, $target);
  return array_slice($out, 0, 4);
}

// ── Unreachable result (kept structurally compatible) ────────────────
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
      'size_kb'   => 0,
      'redirects' => $http['redirect_count'] ?? 0,
    ],
    'score'       => 0,
    'band'        => 'Crítico',
    'color'       => '#ef4444',
    'dimensions'  => [],
    'gaps'        => ['No pudimos acceder al sitio (HTTP ' . ($http['status'] ?? 'sin respuesta') . '). El resto del análisis depende de poder leer el sitio.'],
    'priorities'  => ['Verificar que el dominio resuelva, tenga HTTPS válido y responda en menos de 5 segundos.'],
    'projections' => ['Una vez accesible, podemos completar el análisis de 12 dimensiones.'],
    'engine'      => 'nwm-audit/1.0',
  ];
}

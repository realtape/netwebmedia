<?php
/**
 * AEO Citation Index — heuristic scorer.
 *
 * Public API:
 *   aeo_compute_score(string $url, string $brand_name = ''): array
 *     => ['ok'=>true, 'url'=>..., 'final_url'=>..., 'score'=>0-100,
 *         'sub_scores'=>['entity'=>N,'schema'=>N,'topical'=>N,'citations'=>N,'methodology'=>N],
 *         'signals'=>[...raw observations...],
 *         'actions'=>[3 strings],
 *         'computed_at'=>iso]
 *     or ['ok'=>false, 'error'=>'message']
 *
 * Scoring rubric (0-100 each, weighted total below):
 *
 *   entity (weight 20%)         — How clearly the page identifies the business as
 *                                 an entity AI engines can index.
 *     +25 Organization JSON-LD present
 *     +15 Person/founder JSON-LD or sameAs to social
 *     +15 brand_name appears in <title> AND H1
 *     +10 og:image present
 *     +10 canonical tag set + matches host
 *     +10 favicon / apple-touch-icon
 *     +10 meta description 70–160 chars
 *     +5  lang attribute
 *
 *   schema (weight 30%)         — Density of structured data. AI engines parse JSON-LD
 *                                 to know *what* the page is about.
 *     +20 any JSON-LD present
 *     +15 Article or BlogPosting
 *     +15 FAQPage
 *     +10 HowTo
 *     +10 BreadcrumbList
 *     +10 Service or Product
 *     +10 Organization
 *     +5  WebSite
 *     +5  Person
 *
 *   topical (weight 20%)        — Content depth signals. AI engines reward fact-
 *                                 dense pages with structured headings.
 *     +25 word_count >= 1500 (15 if >= 800, 8 if >= 400)
 *     +20 H1 count == 1 (10 if >= 1)
 *     +20 H2 count >= 4 (10 if >= 2)
 *     +15 lists or tables present (<ul>,<ol>,<table>)
 *     +10 internal links >= 5
 *     +10 images with alt text >= 3
 *
 *   citations (weight 15%)      — Citation surface — outbound proof + sameAs +
 *                                 sources AI engines can verify.
 *     +30 sameAs links (twitter/linkedin/github/etc) detected
 *     +25 outbound links to high-trust domains (.edu, .gov, wikipedia, nytimes, etc.)
 *     +20 anchor text "source" / "study" / "research" / "according to"
 *     +15 cite or blockquote elements
 *     +10 author byline detected
 *
 *   methodology (weight 15%)    — Trust + provenance signals. About / methodology /
 *                                 dateModified / contact info.
 *     +25 datePublished or dateModified in JSON-LD
 *     +20 visible "About" or "Methodology" or "How we" section
 *     +15 contact info (email / phone / address) present
 *     +15 author/Person JSON-LD
 *     +15 last-updated visible text in body
 *     +10 robots not noindex
 *
 * Weighted total: entity 20 + schema 30 + topical 20 + citations 15 + methodology 15.
 *
 * TODO v2: actually call Claude / GPT / Perplexity / Gemini APIs and ask domain-
 * relevant questions ("best CRM for restaurants", "answer engine optimization
 * agencies"), parse responses for citations to this URL/brand. The heuristic
 * here is a useful lead magnet and correlates well with citability, but it's
 * not a real citation test.
 */

require_once __DIR__ . '/../../crm-vanilla/api/lib/url_guard.php';

if (!function_exists('jsonError')) {
  // url_guard.php's url_guard_or_fail() calls jsonError on bad URLs. The CRM
  // API ships its own jsonError; for the public API context we substitute a
  // throwing version so route_aeo_score() can catch and return 400 cleanly.
  function jsonError($msg, $code = 400) {
    throw new RuntimeException('url_guard:' . $code . ':' . $msg);
  }
}

function aeo_fetch_url(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_FOLLOWLOCATION => 1,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_SSL_VERIFYPEER => 1,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; NetWebMedia-AEO-Index/1.0; +https://netwebmedia.com/aeo-index.html)',
    CURLOPT_HEADER         => 1,
    CURLOPT_ENCODING       => '',
    // Cap body at ~3MB to defend against huge responses.
    CURLOPT_PROGRESSFUNCTION => function ($r, $dlt, $dln) {
      return ($dln > 3 * 1024 * 1024) ? 1 : 0;
    },
    CURLOPT_NOPROGRESS => 0,
  ]);
  $raw = curl_exec($ch);
  $info = curl_getinfo($ch);
  $err = curl_error($ch);
  curl_close($ch);
  if ($raw === false) return ['ok' => false, 'err' => $err ?: 'fetch_failed'];
  $headerSize = $info['header_size'];
  return [
    'ok'        => true,
    'status'    => (int) $info['http_code'],
    'final_url' => $info['url'],
    'headers'   => substr($raw, 0, $headerSize),
    'body'      => substr($raw, $headerSize),
  ];
}

/**
 * Extract every JSON-LD block, decoded. Tolerant of malformed JSON.
 */
function aeo_extract_jsonld(string $html): array {
  $out = [];
  if (!preg_match_all('#<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>#is', $html, $m)) {
    return $out;
  }
  foreach ($m[1] as $raw) {
    $raw = trim($raw);
    // Strip CDATA / comments
    $raw = preg_replace('/^\s*<!\[CDATA\[|\]\]>\s*$/', '', $raw);
    $j = json_decode($raw, true);
    if ($j === null) continue;
    // Flatten @graph
    if (isset($j['@graph']) && is_array($j['@graph'])) {
      foreach ($j['@graph'] as $node) $out[] = $node;
    } elseif (is_array($j) && isset($j[0])) {
      foreach ($j as $node) $out[] = $node;
    } else {
      $out[] = $j;
    }
  }
  return $out;
}

function aeo_jsonld_has_type(array $nodes, string $type): bool {
  $type = strtolower($type);
  foreach ($nodes as $n) {
    if (!is_array($n)) continue;
    $t = $n['@type'] ?? '';
    if (is_array($t)) {
      foreach ($t as $tt) if (strtolower((string)$tt) === $type) return true;
    } elseif (strtolower((string)$t) === $type) {
      return true;
    }
  }
  return false;
}

function aeo_jsonld_any_type(array $nodes, array $types): bool {
  foreach ($types as $t) if (aeo_jsonld_has_type($nodes, $t)) return true;
  return false;
}

function aeo_jsonld_has_date(array $nodes): bool {
  foreach ($nodes as $n) {
    if (!is_array($n)) continue;
    if (!empty($n['datePublished']) || !empty($n['dateModified'])) return true;
  }
  return false;
}

function aeo_parse(string $html, string $url): array {
  $signals = [
    'title'            => null,
    'title_len'        => 0,
    'h1'               => [],
    'h1_count'         => 0,
    'h2_count'         => 0,
    'meta_desc'        => null,
    'meta_desc_len'    => 0,
    'canonical'        => null,
    'canonical_match'  => false,
    'lang'             => null,
    'has_favicon'      => false,
    'has_og_image'     => false,
    'has_robots_noindex' => false,
    'word_count'       => 0,
    'list_count'       => 0,
    'table_count'      => 0,
    'cite_count'       => 0,
    'images_total'     => 0,
    'images_with_alt'  => 0,
    'links_total'      => 0,
    'links_internal'   => 0,
    'links_external'   => 0,
    'sameas_links'     => 0,
    'high_trust_outbound' => 0,
    'has_source_anchors' => false,
    'has_author_byline' => false,
    'has_about_section' => false,
    'has_methodology_section' => false,
    'has_contact_info' => false,
    'has_last_updated_text' => false,
    'jsonld_count'     => 0,
    'jsonld_types'     => [],
  ];

  if ($html === '') return $signals;

  if (preg_match('/<html[^>]*\blang=["\']([^"\']+)["\']/i', $html, $m)) $signals['lang'] = $m[1];
  if (preg_match('/<title>\s*(.*?)\s*<\/title>/is', $html, $m)) {
    $signals['title'] = trim(strip_tags($m[1]));
    $signals['title_len'] = mb_strlen($signals['title']);
  }
  if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']/i', $html, $m) ||
      preg_match('/<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\']/i', $html, $m)) {
    $signals['meta_desc'] = $m[1];
    $signals['meta_desc_len'] = mb_strlen($m[1]);
  }
  if (preg_match('/<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)) {
    $signals['canonical'] = $m[1];
    $cHost = parse_url($m[1], PHP_URL_HOST);
    $uHost = parse_url($url, PHP_URL_HOST);
    $signals['canonical_match'] = ($cHost && $uHost && strcasecmp($cHost, $uHost) === 0);
  }
  $signals['has_favicon'] = (bool) preg_match('/<link[^>]+rel=["\'](?:icon|shortcut icon|apple-touch-icon)["\']/i', $html);
  $signals['has_og_image'] = (bool) preg_match('/<meta[^>]+property=["\']og:image["\']/i', $html);
  $signals['has_robots_noindex'] = (bool) preg_match('/<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex/i', $html);

  preg_match_all('/<h1[^>]*>(.*?)<\/h1>/is', $html, $h1m);
  foreach ($h1m[1] ?? [] as $h) {
    $t = trim(strip_tags($h));
    if ($t !== '') $signals['h1'][] = mb_substr($t, 0, 200);
  }
  $signals['h1_count'] = count($signals['h1']);
  $signals['h2_count'] = preg_match_all('/<h2[^>]*>/i', $html);
  $signals['list_count'] = preg_match_all('/<ul[^>]*>|<ol[^>]*>/i', $html);
  $signals['table_count'] = preg_match_all('/<table[^>]*>/i', $html);
  $signals['cite_count'] = preg_match_all('/<cite\b|<blockquote\b/i', $html);

  // Word count from visible text
  $textOnly = preg_replace('#<(script|style|nav|footer|svg)\b[^>]*>.*?</\1>#is', ' ', $html);
  $textOnly = strip_tags($textOnly);
  $textOnly = html_entity_decode($textOnly, ENT_QUOTES | ENT_HTML5, 'UTF-8');
  $signals['word_count'] = str_word_count(preg_replace('/\s+/', ' ', $textOnly));

  // Images
  preg_match_all('/<img\b[^>]*>/i', $html, $imgs);
  foreach ($imgs[0] ?? [] as $img) {
    $signals['images_total']++;
    if (preg_match('/\balt\s*=\s*["\'][^"\']+["\']/i', $img)) $signals['images_with_alt']++;
  }

  // Links — internal vs external + same-as social
  $host = strtolower((string) parse_url($url, PHP_URL_HOST));
  preg_match_all('/<a\b[^>]*href=["\']([^"\']+)["\']/i', $html, $links);
  $highTrust = ['.edu', '.gov', 'wikipedia.org', 'nytimes.com', 'bbc.', 'reuters.com', 'nature.com', 'arxiv.org', 'who.int', 'harvard.edu', 'mit.edu'];
  $sameAsHosts = ['twitter.com', 'x.com', 'linkedin.com', 'github.com', 'facebook.com', 'instagram.com', 'youtube.com', 'mastodon.', 'crunchbase.com'];
  foreach ($links[1] ?? [] as $href) {
    $signals['links_total']++;
    $lh = strtolower((string) parse_url($href, PHP_URL_HOST));
    if ($lh === '' || $lh === $host) {
      $signals['links_internal']++;
      continue;
    }
    $signals['links_external']++;
    foreach ($highTrust as $needle) {
      if (strpos($lh, $needle) !== false) { $signals['high_trust_outbound']++; break; }
    }
    foreach ($sameAsHosts as $needle) {
      if (strpos($lh, $needle) !== false) { $signals['sameas_links']++; break; }
    }
  }

  // Citation language — useful AEO signal even without proper schema
  if (preg_match('/\b(according to|source:|study\b|research shows|cited (?:by|in))\b/i', $textOnly)) {
    $signals['has_source_anchors'] = true;
  }
  if (preg_match('/\b(by\s+[A-Z][a-z]+\s+[A-Z][a-z]+|written by|author:)/', $textOnly)) {
    $signals['has_author_byline'] = true;
  }

  // Sections
  if (preg_match('/(about (?:us|the company|the author)|who we are|our story)/i', $textOnly)) $signals['has_about_section'] = true;
  if (preg_match('/(methodology|how we (?:rank|score|evaluate|test)|our process)/i', $textOnly)) $signals['has_methodology_section'] = true;
  if (preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i', $textOnly) ||
      preg_match('/\+?\d[\d\s().-]{7,}\d/', $textOnly)) {
    $signals['has_contact_info'] = true;
  }
  if (preg_match('/\b(last updated|updated:|published:|reviewed:)\b/i', $textOnly)) {
    $signals['has_last_updated_text'] = true;
  }

  // JSON-LD
  $nodes = aeo_extract_jsonld($html);
  $signals['jsonld_count'] = count($nodes);
  $types = [];
  foreach ($nodes as $n) {
    if (!is_array($n)) continue;
    $t = $n['@type'] ?? null;
    if (is_array($t)) foreach ($t as $tt) $types[] = (string)$tt;
    elseif ($t) $types[] = (string)$t;
  }
  $signals['jsonld_types'] = array_values(array_unique($types));
  $signals['_jsonld_nodes'] = $nodes; // not exposed externally

  return $signals;
}

function aeo_score_entity(array $s, string $brand): int {
  $nodes = $s['_jsonld_nodes'] ?? [];
  $score = 0;
  if (aeo_jsonld_has_type($nodes, 'Organization')) $score += 25;
  if (aeo_jsonld_has_type($nodes, 'Person') || $s['sameas_links'] >= 2) $score += 15;
  if ($brand !== '' && $s['title'] && stripos($s['title'], $brand) !== false) {
    $h1Match = false;
    foreach ($s['h1'] as $h) if (stripos($h, $brand) !== false) { $h1Match = true; break; }
    if ($h1Match) $score += 15;
    else $score += 7;
  } elseif ($brand === '') {
    // No brand provided — give partial credit if title + h1 are present at all.
    if ($s['title'] && $s['h1_count'] >= 1) $score += 10;
  }
  if ($s['has_og_image']) $score += 10;
  if ($s['canonical'] && $s['canonical_match']) $score += 10;
  elseif ($s['canonical']) $score += 5;
  if ($s['has_favicon']) $score += 10;
  if ($s['meta_desc_len'] >= 70 && $s['meta_desc_len'] <= 160) $score += 10;
  elseif ($s['meta_desc_len'] > 0) $score += 5;
  if ($s['lang']) $score += 5;
  return min(100, $score);
}

function aeo_score_schema(array $s): int {
  $nodes = $s['_jsonld_nodes'] ?? [];
  $score = 0;
  if ($s['jsonld_count'] >= 1) $score += 20;
  if (aeo_jsonld_any_type($nodes, ['Article', 'BlogPosting', 'NewsArticle'])) $score += 15;
  if (aeo_jsonld_has_type($nodes, 'FAQPage')) $score += 15;
  if (aeo_jsonld_has_type($nodes, 'HowTo')) $score += 10;
  if (aeo_jsonld_has_type($nodes, 'BreadcrumbList')) $score += 10;
  if (aeo_jsonld_any_type($nodes, ['Service', 'Product'])) $score += 10;
  if (aeo_jsonld_has_type($nodes, 'Organization')) $score += 10;
  if (aeo_jsonld_has_type($nodes, 'WebSite')) $score += 5;
  if (aeo_jsonld_has_type($nodes, 'Person')) $score += 5;
  return min(100, $score);
}

function aeo_score_topical(array $s): int {
  $score = 0;
  if ($s['word_count'] >= 1500) $score += 25;
  elseif ($s['word_count'] >= 800) $score += 15;
  elseif ($s['word_count'] >= 400) $score += 8;
  if ($s['h1_count'] === 1) $score += 20;
  elseif ($s['h1_count'] >= 1) $score += 10;
  if ($s['h2_count'] >= 4) $score += 20;
  elseif ($s['h2_count'] >= 2) $score += 10;
  if ($s['list_count'] >= 1 || $s['table_count'] >= 1) $score += 15;
  if ($s['links_internal'] >= 5) $score += 10;
  elseif ($s['links_internal'] >= 2) $score += 5;
  if ($s['images_with_alt'] >= 3) $score += 10;
  elseif ($s['images_with_alt'] >= 1) $score += 5;
  return min(100, $score);
}

function aeo_score_citations(array $s): int {
  $score = 0;
  if ($s['sameas_links'] >= 3) $score += 30;
  elseif ($s['sameas_links'] >= 1) $score += 15;
  if ($s['high_trust_outbound'] >= 2) $score += 25;
  elseif ($s['high_trust_outbound'] >= 1) $score += 12;
  if ($s['has_source_anchors']) $score += 20;
  if ($s['cite_count'] >= 1) $score += 15;
  if ($s['has_author_byline']) $score += 10;
  return min(100, $score);
}

function aeo_score_methodology(array $s): int {
  $nodes = $s['_jsonld_nodes'] ?? [];
  $score = 0;
  if (aeo_jsonld_has_date($nodes)) $score += 25;
  if ($s['has_about_section'] || $s['has_methodology_section']) $score += 20;
  if ($s['has_contact_info']) $score += 15;
  if (aeo_jsonld_has_type($nodes, 'Person')) $score += 15;
  if ($s['has_last_updated_text']) $score += 15;
  if (!$s['has_robots_noindex']) $score += 10;
  return min(100, $score);
}

/**
 * Build 3 plain-English action items from the lowest sub-scores.
 */
function aeo_build_actions(array $sub, array $signals): array {
  $catalog = [
    'entity' => [
      'Add an Organization JSON-LD block (logo, sameAs to your social profiles, founder Person reference) to the homepage. AI engines use this to confirm you exist as an entity.',
      'Make your brand name appear in the <title> AND the H1 of every key page — this is the single biggest "is this page about [brand]?" signal Claude and ChatGPT use.',
      'Set a canonical URL and og:image on every page. Without these, AI engines hedge on which URL to cite.',
    ],
    'schema' => [
      'Add FAQPage JSON-LD with 6–10 high-intent questions answered in your prospect\'s words. FAQs are the #1 most-cited schema type in Perplexity and Google AI Overviews.',
      'Wrap any tutorial or how-to content in HowTo JSON-LD. Step-by-step structure is heavily favored by ChatGPT and Claude when answering "how do I…" queries.',
      'Add BreadcrumbList to your category and detail pages — small lift, but it helps AI engines disambiguate page hierarchy.',
    ],
    'topical' => [
      'Get the page above 1,500 words of substantive content. AI engines penalize thin pages even when schema is perfect.',
      'Restructure to one H1 and at least 4 H2s. Section depth is a primary signal of topical authority.',
      'Add at least one comparison table or numbered list — extractable structured chunks are what gets quoted verbatim.',
    ],
    'citations' => [
      'Add a "Sources" or "References" section linking to .edu, .gov, or major-publisher pages. Outbound trust links materially raise citation likelihood.',
      'Link to your social and code/profile pages (Twitter, LinkedIn, GitHub) via sameAs in JSON-LD AND visible footer links. AI engines cross-reference identity through these.',
      'Add a visible author byline with a link to an author page or Person JSON-LD. AI engines weight bylined content over anonymous content.',
    ],
    'methodology' => [
      'Publish a visible "How we score / methodology / about" section. Claude and Perplexity heavily favor pages that show their work.',
      'Add datePublished and dateModified to your JSON-LD. Stale-looking pages get filtered out of AI answer pools.',
      'Surface a visible "Last updated: [date]" line on every key page. Freshness signal both for crawlers and human trust.',
    ],
  ];

  // Sort sub-scores ascending — pick actions from the 3 lowest categories.
  asort($sub);
  $picks = array_slice(array_keys($sub), 0, 3);
  $actions = [];
  foreach ($picks as $cat) {
    if (empty($catalog[$cat])) continue;
    $actions[] = $catalog[$cat][0]; // Always the highest-impact action in the bucket
  }
  return $actions;
}

function aeo_compute_score(string $url, string $brand_name = ''): array {
  // Normalize URL — accept naked hosts too.
  $url = trim($url);
  if ($url === '') return ['ok' => false, 'error' => 'url_required'];
  if (!preg_match('#^https?://#i', $url)) $url = 'https://' . $url;

  // SSRF guard. url_guard_or_fail() throws via our jsonError shim on bad URLs.
  try {
    $url = url_guard_or_fail($url);
  } catch (RuntimeException $e) {
    return ['ok' => false, 'error' => 'invalid_or_blocked_url'];
  }

  $fetch = aeo_fetch_url($url);
  if (!$fetch['ok']) return ['ok' => false, 'error' => 'fetch_failed: ' . ($fetch['err'] ?? 'unknown')];
  if ($fetch['status'] >= 400) return ['ok' => false, 'error' => 'http_' . $fetch['status']];

  $signals = aeo_parse($fetch['body'], $fetch['final_url'] ?: $url);

  $sub = [
    'entity'      => aeo_score_entity($signals, $brand_name),
    'schema'      => aeo_score_schema($signals),
    'topical'     => aeo_score_topical($signals),
    'citations'   => aeo_score_citations($signals),
    'methodology' => aeo_score_methodology($signals),
  ];

  // Weighted total: entity 20 + schema 30 + topical 20 + citations 15 + methodology 15
  $total = (int) round(
    $sub['entity']      * 0.20 +
    $sub['schema']      * 0.30 +
    $sub['topical']     * 0.20 +
    $sub['citations']   * 0.15 +
    $sub['methodology'] * 0.15
  );
  $total = max(0, min(100, $total));

  $actions = aeo_build_actions($sub, $signals);

  // Drop internal-only field before returning
  unset($signals['_jsonld_nodes']);

  return [
    'ok'          => true,
    'url'         => $url,
    'final_url'   => $fetch['final_url'] ?: $url,
    'http_status' => $fetch['status'],
    'score'       => $total,
    'sub_scores'  => $sub,
    'signals'     => $signals,
    'actions'     => $actions,
    'computed_at' => date('c'),
  ];
}

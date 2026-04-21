<?php
/* Deep website + social media audit for netwebmedia.com/analytics.html.
   Route: POST /api/public/audit
   Input: { url, email, name, company?, instagram?, facebook?, linkedin?, tiktok?, youtube? }
   Output: full audit JSON with scores, findings, recommendations.
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';

function aud_fetch_url($url, $method = 'GET') {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_NOBODY         => $method === 'HEAD',
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_FOLLOWLOCATION => 1,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 7,
    CURLOPT_SSL_VERIFYPEER => 0,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; NetWebMedia-Audit/1.0; +https://netwebmedia.com)',
    CURLOPT_HEADER         => 1,
    CURLOPT_ENCODING       => '',
  ]);
  $t0 = microtime(true);
  $raw = curl_exec($ch);
  $t_ms = (int) ((microtime(true) - $t0) * 1000);
  $info = curl_getinfo($ch);
  $err  = curl_error($ch);
  curl_close($ch);
  if ($raw === false) return ['ok' => false, 'err' => $err, 't_ms' => $t_ms, 'info' => $info];
  $headerSize = $info['header_size'];
  $headers = substr($raw, 0, $headerSize);
  $body    = substr($raw, $headerSize);
  return [
    'ok'         => true,
    'status'     => $info['http_code'],
    't_ms'       => $t_ms,
    'final_url'  => $info['url'],
    'size_bytes' => strlen($body),
    'headers'    => $headers,
    'body'       => $body,
    'ssl_ok'     => $info['ssl_verifyresult'] === 0,
    'redirect_count' => $info['redirect_count'],
  ];
}

function aud_parse_html($html, $baseUrl = '') {
  $out = [
    'title'           => null,
    'title_len'       => 0,
    'meta_description'=> null,
    'meta_desc_len'   => 0,
    'viewport'        => null,
    'canonical'       => null,
    'lang'            => null,
    'h1'              => [],
    'h2_count'        => 0,
    'images_total'    => 0,
    'images_no_alt'   => 0,
    'links_total'     => 0,
    'links_external'  => 0,
    'has_schema'      => false,
    'has_og'          => false,
    'has_twitter'     => false,
    'has_favicon'     => false,
    'has_gtag'        => false,
    'has_meta_pixel'  => false,
    'has_gtm'         => false,
    'has_hotjar'      => false,
    'has_service_worker' => false,
  ];
  if (!$html) return $out;

  if (preg_match('/<html[^>]*\blang=["\']([^"\']+)["\']/i', $html, $m)) $out['lang'] = $m[1];
  if (preg_match('/<title>\s*(.*?)\s*<\/title>/is', $html, $m)) { $out['title'] = trim($m[1]); $out['title_len'] = mb_strlen($out['title']); }
  if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m) ||
      preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']/i', $html, $m)) {
    $out['meta_description'] = $m[1]; $out['meta_desc_len'] = mb_strlen($m[1]);
  }
  if (preg_match('/<meta[^>]+name=["\']viewport["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) $out['viewport'] = $m[1];
  if (preg_match('/<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)) $out['canonical'] = $m[1];

  preg_match_all('/<h1[^>]*>(.*?)<\/h1>/is', $html, $h1m);
  foreach ($h1m[1] ?? [] as $h) { $t = trim(strip_tags($h)); if ($t !== '') $out['h1'][] = mb_substr($t, 0, 120); }
  $out['h2_count'] = preg_match_all('/<h2[^>]*>/i', $html);

  preg_match_all('/<img\b[^>]*>/i', $html, $imgs);
  $out['images_total'] = count($imgs[0] ?? []);
  foreach ($imgs[0] ?? [] as $img) {
    if (!preg_match('/\balt\s*=\s*["\'][^"\']+["\']/i', $img)) $out['images_no_alt']++;
  }

  preg_match_all('/<a\b[^>]*href=["\']([^"\']+)["\']/i', $html, $links);
  $host = parse_url($baseUrl, PHP_URL_HOST);
  foreach ($links[1] ?? [] as $href) {
    $out['links_total']++;
    $lh = parse_url($href, PHP_URL_HOST);
    if ($lh && $host && $lh !== $host) $out['links_external']++;
  }

  $out['has_schema']     = (bool) preg_match('/application\/ld\+json/i', $html);
  $out['has_og']         = (bool) preg_match('/property=["\']og:/i', $html);
  $out['has_twitter']    = (bool) preg_match('/name=["\']twitter:/i', $html);
  $out['has_favicon']    = (bool) preg_match('/<link[^>]+rel=["\'](icon|shortcut icon|apple-touch-icon)/i', $html);
  $out['has_gtag']       = (bool) preg_match('/googletagmanager\.com\/gtag|gtag\(|G-[A-Z0-9]{6,}/', $html);
  $out['has_gtm']        = (bool) preg_match('/googletagmanager\.com\/gtm|GTM-[A-Z0-9]+/', $html);
  $out['has_meta_pixel'] = (bool) preg_match('/connect\.facebook\.net\/.+fbevents|fbq\(/', $html);
  $out['has_hotjar']     = (bool) preg_match('/static\.hotjar\.com|hjid:/', $html);
  $out['has_service_worker'] = (bool) preg_match('/serviceWorker\.register/', $html);

  return $out;
}

function aud_score($parsed, $perf, $security) {
  // Five buckets, each 0-100, then average
  $seo = 0;
  $seo += $parsed['title'] ? 10 : 0;
  $seo += ($parsed['title_len'] >= 30 && $parsed['title_len'] <= 65) ? 10 : 0;
  $seo += $parsed['meta_description'] ? 10 : 0;
  $seo += ($parsed['meta_desc_len'] >= 70 && $parsed['meta_desc_len'] <= 160) ? 10 : 0;
  $seo += count($parsed['h1']) === 1 ? 15 : (count($parsed['h1']) >= 1 ? 8 : 0);
  $seo += $parsed['h2_count'] >= 2 ? 10 : 0;
  $seo += $parsed['has_schema'] ? 15 : 0;
  $seo += $parsed['has_og'] ? 10 : 0;
  $seo += $parsed['canonical'] ? 5 : 0;
  $seo += $parsed['lang'] ? 5 : 0;
  $seo = min(100, $seo);

  $perfScore = 0;
  if ($perf['t_ms']) {
    if ($perf['t_ms'] <= 800)       $perfScore += 50;
    elseif ($perf['t_ms'] <= 1500)  $perfScore += 35;
    elseif ($perf['t_ms'] <= 3000)  $perfScore += 20;
    else                            $perfScore += 5;
  }
  $perfScore += $perf['gzip'] ? 15 : 0;
  $perfScore += $perf['cache'] ? 15 : 0;
  if ($perf['size_kb'] && $perf['size_kb'] < 500)      $perfScore += 20;
  elseif ($perf['size_kb'] && $perf['size_kb'] < 1500) $perfScore += 10;
  $perfScore = min(100, $perfScore);

  $mobile = 0;
  $mobile += $parsed['viewport'] ? 50 : 0;
  if ($parsed['viewport'] && stripos($parsed['viewport'], 'width=device-width') !== false) $mobile += 30;
  if ($parsed['viewport'] && stripos($parsed['viewport'], 'initial-scale=1') !== false) $mobile += 20;
  $mobile = min(100, $mobile);

  $content = 0;
  $content += $parsed['images_total'] > 0 ? 20 : 0;
  if ($parsed['images_total'] > 0) {
    $altRatio = 1 - ($parsed['images_no_alt'] / max(1, $parsed['images_total']));
    $content += (int) ($altRatio * 30);
  }
  $content += $parsed['links_total'] >= 10 ? 20 : (int)($parsed['links_total'] * 2);
  $content += $parsed['links_external'] >= 2 ? 15 : (int)($parsed['links_external'] * 5);
  $content += $parsed['has_favicon'] ? 15 : 0;
  $content = min(100, $content);

  $sec = 0;
  $sec += $security['https'] ? 40 : 0;
  $sec += $security['ssl_ok'] ? 30 : 0;
  $sec += ($parsed['has_gtag'] || $parsed['has_gtm']) ? 15 : 0;
  $sec += $security['hsts'] ? 15 : 0;
  $sec = min(100, $sec);

  return [
    'seo'      => $seo,
    'performance' => $perfScore,
    'mobile'   => $mobile,
    'content'  => $content,
    'technical' => $sec,
    'overall'  => (int) round(($seo + $perfScore + $mobile + $content + $sec) / 5),
  ];
}

function aud_recommendations($parsed, $perf, $security, $scores, $socialsFound) {
  $r = [];
  if (!$parsed['title'])                       $r[] = ['severity'=>'high', 'issue'=>'Missing <title> tag', 'fix'=>'Add a 50–60 char descriptive title.'];
  if ($parsed['title'] && $parsed['title_len'] < 30) $r[] = ['severity'=>'medium', 'issue'=>'Title too short ('.$parsed['title_len'].' chars)', 'fix'=>'Expand to 50–60 chars for better CTR.'];
  if ($parsed['title'] && $parsed['title_len'] > 65) $r[] = ['severity'=>'low', 'issue'=>'Title too long ('.$parsed['title_len'].' chars)', 'fix'=>'Google truncates past ~60 chars.'];
  if (!$parsed['meta_description'])             $r[] = ['severity'=>'high', 'issue'=>'Missing meta description', 'fix'=>'Add a 150-char summary for search snippets.'];
  elseif ($parsed['meta_desc_len'] < 70)        $r[] = ['severity'=>'medium', 'issue'=>'Meta description too short', 'fix'=>'Aim for 120-155 chars.'];
  if (count($parsed['h1']) === 0)               $r[] = ['severity'=>'high', 'issue'=>'No H1 heading on page', 'fix'=>'Every page needs one clear H1.'];
  if (count($parsed['h1']) > 1)                 $r[] = ['severity'=>'medium', 'issue'=>'Multiple H1 headings', 'fix'=>'Use only one H1 per page; others should be H2/H3.'];
  if (!$parsed['viewport'])                     $r[] = ['severity'=>'high', 'issue'=>'Missing viewport meta (not mobile-optimized)', 'fix'=>'Add <meta name="viewport" content="width=device-width,initial-scale=1">.'];
  if (!$parsed['has_schema'])                   $r[] = ['severity'=>'medium', 'issue'=>'No structured data (schema.org)', 'fix'=>'Add JSON-LD for Organization, LocalBusiness, Product, etc. — huge SEO lift.'];
  if (!$parsed['has_og'])                       $r[] = ['severity'=>'medium', 'issue'=>'No Open Graph tags', 'fix'=>'Required for rich previews on Facebook, WhatsApp, LinkedIn.'];
  if (!$parsed['has_twitter'])                  $r[] = ['severity'=>'low', 'issue'=>'No Twitter Card tags'];
  if ($parsed['images_total'] && $parsed['images_no_alt']) $r[] = ['severity'=>'medium', 'issue'=>$parsed['images_no_alt'].' image(s) without alt text', 'fix'=>'Add descriptive alt attributes — accessibility + SEO.'];
  if (!$parsed['has_favicon'])                  $r[] = ['severity'=>'low', 'issue'=>'Missing favicon'];
  if (!$parsed['canonical'])                    $r[] = ['severity'=>'low', 'issue'=>'No canonical URL set'];
  if ($perf['t_ms'] > 3000)                     $r[] = ['severity'=>'high', 'issue'=>'Slow load time: '.$perf['t_ms'].'ms', 'fix'=>'Optimize images, enable CDN, use lazy-loading.'];
  elseif ($perf['t_ms'] > 1500)                 $r[] = ['severity'=>'medium', 'issue'=>'Moderate load time: '.$perf['t_ms'].'ms'];
  if (!$perf['gzip'])                           $r[] = ['severity'=>'medium', 'issue'=>'GZIP compression not enabled', 'fix'=>'Enable in .htaccess — reduces transfer size 70%.'];
  if (!$perf['cache'])                          $r[] = ['severity'=>'medium', 'issue'=>'No browser cache headers', 'fix'=>'Set Cache-Control for static assets.'];
  if (!$security['https'])                      $r[] = ['severity'=>'high', 'issue'=>'Not served over HTTPS', 'fix'=>'Install a free Let\'s Encrypt cert — required for SEO & trust.'];
  if (!$parsed['has_gtag'] && !$parsed['has_gtm']) $r[] = ['severity'=>'medium', 'issue'=>'No analytics tracking detected', 'fix'=>'Install Google Analytics 4 or GTM to measure visitors.'];
  if (!$parsed['has_meta_pixel'])               $r[] = ['severity'=>'low', 'issue'=>'No Meta Pixel detected', 'fix'=>'Needed for Facebook/Instagram retargeting.'];
  if (count($socialsFound) === 0)               $r[] = ['severity'=>'high', 'issue'=>'No active social media profiles detected', 'fix'=>'Create profiles on Instagram + Facebook at minimum — Chilean clients expect it.'];
  elseif (count($socialsFound) < 3)             $r[] = ['severity'=>'medium', 'issue'=>'Only '.count($socialsFound).' social platform(s) active', 'fix'=>'Add at least Instagram + Facebook + LinkedIn.'];
  return $r;
}

function aud_check_social($handles) {
  $platforms = [
    'instagram' => 'https://www.instagram.com/%s/',
    'facebook'  => 'https://www.facebook.com/%s',
    'linkedin'  => 'https://www.linkedin.com/company/%s/',
    'tiktok'    => 'https://www.tiktok.com/@%s',
    'youtube'   => 'https://www.youtube.com/@%s',
    'x'         => 'https://x.com/%s',
  ];
  $found = [];
  foreach ($platforms as $p => $tpl) {
    $h = trim((string)($handles[$p] ?? ''));
    if (!$h) continue;
    $h = ltrim($h, '@');
    $h = preg_replace('#^https?://[^/]+/@?#', '', $h);
    $h = rtrim($h, '/');
    if (!preg_match('/^[a-zA-Z0-9._-]{1,60}$/', $h)) continue;
    $url = sprintf($tpl, $h);
    $r = aud_fetch_url($url, 'HEAD');
    $ok = $r['ok'] && $r['status'] >= 200 && $r['status'] < 400;
    $found[$p] = ['handle' => $h, 'url' => $url, 'reachable' => $ok, 'status' => $r['status'] ?? 0];
  }
  return $found;
}

function route_public_audit($parts, $method) {
  if ($method !== 'POST') err('Method not allowed', 405);

  $b = body();
  $url   = trim($b['url'] ?? '');
  $email = trim($b['email'] ?? '');
  $name  = trim($b['name'] ?? '');
  if (!$url) err('url required', 400);
  if (!$email) err('email required', 400);

  if (!preg_match('#^https?://#i', $url)) $url = 'https://' . $url;
  $host = parse_url($url, PHP_URL_HOST);
  if (!$host) err('Invalid URL', 400);

  $fetch = aud_fetch_url($url, 'GET');
  if (!$fetch['ok']) err('Could not reach the site: ' . ($fetch['err'] ?? 'unknown'), 400);
  if ($fetch['status'] >= 400) err('Site returned HTTP ' . $fetch['status'], 400);

  $parsed = aud_parse_html($fetch['body'], $url);
  $headers = strtolower($fetch['headers']);
  $perf = [
    't_ms'    => $fetch['t_ms'],
    'size_kb' => (int) round($fetch['size_bytes'] / 1024),
    'gzip'    => strpos($headers, 'content-encoding:') !== false && preg_match('/content-encoding:\s*(gzip|br|deflate)/', $headers),
    'cache'   => strpos($headers, 'cache-control:') !== false || strpos($headers, 'expires:') !== false,
  ];
  $security = [
    'https'  => strpos($fetch['final_url'], 'https://') === 0,
    'ssl_ok' => !empty($fetch['ssl_ok']),
    'hsts'   => strpos($headers, 'strict-transport-security:') !== false,
  ];

  $socials = aud_check_social([
    'instagram' => $b['instagram'] ?? '',
    'facebook'  => $b['facebook']  ?? '',
    'linkedin'  => $b['linkedin']  ?? '',
    'tiktok'    => $b['tiktok']    ?? '',
    'youtube'   => $b['youtube']   ?? '',
    'x'         => $b['x']         ?? '',
  ]);
  $socialsFound = array_filter($socials, function($s){ return $s['reachable']; });

  $scores = aud_score($parsed, $perf, $security);
  $recs   = aud_recommendations($parsed, $perf, $security, $scores, $socialsFound);

  // Save as a CRM contact (lead)
  try {
    $adminOrg = qOne("SELECT org_id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1");
    $orgId = $adminOrg ? (int)$adminOrg['org_id'] : 1;
    $data = [
      'email' => $email, 'name' => $name ?: $email, 'company' => $b['company'] ?? null,
      'website' => $url, 'source' => 'deep-audit',
      'audit_score' => $scores['overall'], 'audit_scores' => $scores,
      'socials' => $socials, 'parsed' => $parsed, 'recommendations' => $recs,
      'submitted_at' => date('c'),
    ];
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (?, 'contact', ?, ?, 'lead', ?)",
      [$orgId, substr($email, 0, 200), $name ?: $email, json_encode($data, JSON_UNESCAPED_UNICODE)]
    );
  } catch (Throwable $_) { /* tolerate */ }

  // Optional: AI narrative if Anthropic key configured
  $narrative = null;
  $cfg = config();
  if (!empty($cfg['anthropic_api_key'])) {
    $summary = "Website: $url\nScores: SEO={$scores['seo']}, Performance={$scores['performance']}, Mobile={$scores['mobile']}, Content={$scores['content']}, Technical={$scores['technical']}, Overall={$scores['overall']}/100\nTop issues: ";
    foreach (array_slice($recs, 0, 8) as $r) $summary .= "- [{$r['severity']}] {$r['issue']}\n";
    $summary .= "\nSocial profiles reachable: " . implode(', ', array_keys($socialsFound));
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
      CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 40,
      CURLOPT_HTTPHEADER => ['Content-Type: application/json','x-api-key: ' . $cfg['anthropic_api_key'],'anthropic-version: 2023-06-01'],
      CURLOPT_POSTFIELDS => json_encode([
        'model' => 'claude-3-5-sonnet-20241022',
        'max_tokens' => 800,
        'system' => 'You are a senior digital marketing strategist at NetWebMedia. Produce a punchy, specific 3-paragraph audit summary in Spanish (Chile) for a prospect. First paragraph: where they shine. Second: the 2 biggest problems costing them customers. Third: concrete next 30-day plan (3 bullets). No fluff, no generic statements.',
        'messages' => [['role' => 'user', 'content' => $summary]],
      ]),
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $j = json_decode($res, true) ?: [];
    foreach ($j['content'] ?? [] as $blk) if (($blk['type'] ?? '') === 'text') $narrative = ($narrative ?? '') . $blk['text'];
  }

  json_out([
    'ok'              => true,
    'url'             => $url,
    'final_url'       => $fetch['final_url'],
    'http_status'     => $fetch['status'],
    'timing_ms'       => $perf['t_ms'],
    'size_kb'         => $perf['size_kb'],
    'parsed'          => $parsed,
    'performance'     => $perf,
    'security'        => $security,
    'socials'         => $socials,
    'socials_found'   => array_keys($socialsFound),
    'scores'          => $scores,
    'recommendations' => $recs,
    'narrative'       => $narrative,
  ]);
}

<?php
/**
 * Real website analyzer — fetches a URL server-side and runs actual checks.
 * GET /api/?r=analyze&url=https://example.com
 * Returns: {url, scores:{seo,perf,a11y,bp}, checks:{seo:[...], perf:[...], ...}, fetched_ms, size_kb}
 */

// Rate limit: 15 analyses per 5 minutes per IP (prevents abuse of outbound curl)
require_once __DIR__ . '/../lib/rate_limit.php';
rate_limit('analyze', 15, 300);

if ($method !== 'GET') jsonError('GET required', 405);

require_once __DIR__ . '/../lib/url_guard.php';
$url = url_guard_or_fail($_GET['url'] ?? '');

$start = microtime(true);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 3,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_USERAGENT      => 'NetWebMediaAnalyzer/1.0 (+https://netwebmedia.com)',
    CURLOPT_PROTOCOLS      => CURLPROTO_HTTP | CURLPROTO_HTTPS,
    CURLOPT_REDIR_PROTOCOLS=> CURLPROTO_HTTP | CURLPROTO_HTTPS,
]);
$html = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);
if (!$html) jsonError('Could not fetch URL (timeout or blocked)', 502);

$fetchedMs = round((microtime(true) - $start) * 1000);
$sizeKb = round(strlen($html) / 1024, 1);

$doc = new DOMDocument();
libxml_use_internal_errors(true);
$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
libxml_clear_errors();
$xp = new DOMXPath($doc);

// --- Helpers ---
function tagText(DOMXPath $xp, string $q): ?string {
    $n = $xp->query($q)->item(0);
    return $n ? trim($n->textContent) : null;
}
function tagAttr(DOMXPath $xp, string $q, string $attr): ?string {
    $n = $xp->query($q)->item(0);
    return $n && $n->hasAttribute($attr) ? $n->getAttribute($attr) : null;
}

// --- SEO checks ---
$title = tagText($xp, '//head/title');
$metaDesc = tagAttr($xp, '//meta[@name="description"]', 'content');
$canonical = tagAttr($xp, '//link[@rel="canonical"]', 'href');
$h1Count = $xp->query('//h1')->length;
$h2Count = $xp->query('//h2')->length;
$ogTitle = tagAttr($xp, '//meta[@property="og:title"]', 'content');
$ogImage = tagAttr($xp, '//meta[@property="og:image"]', 'content');
$twitter = tagAttr($xp, '//meta[@name="twitter:card"]', 'content');
$lang = tagAttr($xp, '//html', 'lang');
$schemaJsonLd = $xp->query('//script[@type="application/ld+json"]')->length;

$seoChecks = [];
$seoScore = 100;
$mark = function($cond, string $passText, string $failText, int $penalty = 10) use (&$seoChecks, &$seoScore) {
    $seoChecks[] = ['pass' => (bool)$cond, 'text' => $cond ? $passText : $failText];
    if (!$cond) $seoScore -= $penalty;
};
$mark($title && strlen($title) >= 30 && strlen($title) <= 65,
    "Title tag (" . strlen((string)$title) . " chars): " . htmlspecialchars((string)$title),
    "Title tag missing or wrong length: " . htmlspecialchars((string)$title), 15);
$mark($metaDesc && strlen($metaDesc) >= 80 && strlen($metaDesc) <= 180,
    "Meta description present (" . strlen((string)$metaDesc) . " chars)",
    "Meta description missing or wrong length", 12);
$mark($h1Count === 1, "Exactly one H1 tag", "H1 tags: $h1Count (should be 1)", 10);
$mark($h2Count >= 2, "$h2Count H2 subheadings", "Only $h2Count H2 tags (need more structure)", 5);
$mark($canonical, "Canonical URL set", "No canonical URL", 8);
$mark($ogTitle && $ogImage, "Open Graph tags present", "Missing Open Graph tags", 8);
$mark($twitter, "Twitter card tag present", "No Twitter card tag", 4);
$mark($lang, "HTML lang attribute set", "HTML lang attribute missing", 5);
$mark($schemaJsonLd > 0, "$schemaJsonLd JSON-LD schema block(s)", "No structured data (JSON-LD)", 8);

// --- Performance checks ---
$perfScore = 100;
$perfChecks = [];
$perfMark = function($cond, string $passText, string $failText, int $penalty = 10) use (&$perfChecks, &$perfScore) {
    $perfChecks[] = ['pass' => (bool)$cond, 'text' => $cond ? $passText : $failText];
    if (!$cond) $perfScore -= $penalty;
};
$perfMark($fetchedMs < 1500, "Server responded in {$fetchedMs}ms", "Slow server response: {$fetchedMs}ms", 15);
$perfMark($sizeKb < 200, "Page HTML size: {$sizeKb} KB", "Large HTML payload: {$sizeKb} KB", 10);
$imgCount = $xp->query('//img')->length;
$lazyImgs = $xp->query('//img[@loading="lazy"]')->length;
$perfMark($imgCount === 0 || $lazyImgs / max($imgCount, 1) > 0.5,
    "Lazy-loaded images: $lazyImgs / $imgCount",
    "Only $lazyImgs of $imgCount images lazy-loaded", 10);
$scripts = $xp->query('//script[@src]')->length;
$asyncScripts = $xp->query('//script[@src][@async or @defer]')->length;
$perfMark($scripts === 0 || $asyncScripts / max($scripts, 1) > 0.5,
    "Async/defer scripts: $asyncScripts / $scripts",
    "Only $asyncScripts of $scripts scripts async/deferred", 8);
$gzip = strpos(strtolower($info['content_type'] ?? ''), 'gzip') !== false;
$perfMark(true, "HTTPS: " . ($info['scheme'] === 'https' ? 'yes' : 'no'),
    "Not served over HTTPS", 10);
$perfMark($imgCount < 30, "$imgCount images on page", "$imgCount images — consider consolidation", 5);

// --- Accessibility checks ---
$a11yScore = 100;
$a11yChecks = [];
$a11yMark = function($cond, string $passText, string $failText, int $penalty = 10) use (&$a11yChecks, &$a11yScore) {
    $a11yChecks[] = ['pass' => (bool)$cond, 'text' => $cond ? $passText : $failText];
    if (!$cond) $a11yScore -= $penalty;
};
$imgs = $xp->query('//img');
$imgsWithAlt = 0;
foreach ($imgs as $img) if ($img->hasAttribute('alt') && trim($img->getAttribute('alt'))) $imgsWithAlt++;
$altRatio = $imgs->length ? $imgsWithAlt / $imgs->length : 1;
$a11yMark($altRatio >= 0.9, "Alt text: $imgsWithAlt/{$imgs->length} images",
    "Only $imgsWithAlt of {$imgs->length} images have alt text", 15);
$a11yMark($lang, "HTML lang attribute set", "HTML lang attribute missing", 10);
$buttons = $xp->query('//button')->length;
$inputs = $xp->query('//input')->length;
$labels = $xp->query('//label')->length;
$a11yMark($inputs === 0 || $labels >= $inputs * 0.5,
    "$labels labels for $inputs inputs",
    "Only $labels labels for $inputs inputs", 10);
$viewport = tagAttr($xp, '//meta[@name="viewport"]', 'content');
$a11yMark($viewport && strpos($viewport, 'width=device-width') !== false,
    "Viewport meta responsive", "Viewport meta missing or non-responsive", 10);
$skipLink = $xp->query('//a[contains(@href,"#main") or contains(@href,"#content")]')->length > 0;
$a11yMark($skipLink, "Skip-to-content link present", "No skip-to-content link", 5);
$landmarks = $xp->query('//main | //nav | //header | //footer')->length;
$a11yMark($landmarks >= 3, "$landmarks landmark elements", "Only $landmarks landmarks (need main/nav/header/footer)", 5);

// --- Best practices ---
$bpScore = 100;
$bpChecks = [];
$bpMark = function($cond, string $passText, string $failText, int $penalty = 10) use (&$bpChecks, &$bpScore) {
    $bpChecks[] = ['pass' => (bool)$cond, 'text' => $cond ? $passText : $failText];
    if (!$cond) $bpScore -= $penalty;
};
$bpMark(strpos($url, 'https://') === 0, "HTTPS enabled", "Not HTTPS", 20);
$bpMark($doc->doctype && strtolower($doc->doctype->name) === 'html', "Modern HTML5 doctype", "Missing or legacy doctype", 10);
$bpMark(!preg_match('/<font\b/i', $html), "No deprecated <font> tags", "Deprecated <font> tags present", 5);
$bpMark(!preg_match('/\sdocument\.write\s*\(/', $html), "No document.write()", "Uses document.write()", 8);
$bpMark($schemaJsonLd > 0, "Structured data present", "No structured data", 5);
$favicon = $xp->query('//link[contains(@rel,"icon")]')->length > 0;
$bpMark($favicon, "Favicon declared", "Favicon missing", 5);

$seoScore  = max(0, $seoScore);
$perfScore = max(0, $perfScore);
$a11yScore = max(0, $a11yScore);
$bpScore   = max(0, $bpScore);
$overall   = round(($seoScore + $perfScore + $a11yScore + $bpScore) / 4);

jsonResponse([
    'url'        => $url,
    'analyzed_at'=> date('c'),
    'fetched_ms' => $fetchedMs,
    'size_kb'    => $sizeKb,
    'http_code'  => $info['http_code'] ?? 0,
    'scores' => [
        'overall'      => $overall,
        'seo'          => $seoScore,
        'performance'  => $perfScore,
        'accessibility'=> $a11yScore,
        'best_practices'=> $bpScore,
    ],
    'checks' => [
        'seo'  => $seoChecks,
        'perf' => $perfChecks,
        'a11y' => $a11yChecks,
        'bp'   => $bpChecks,
    ],
    'meta' => [
        'title'    => $title,
        'meta_desc'=> $metaDesc,
        'h1_count' => $h1Count,
        'img_count'=> $imgs->length,
    ],
]);

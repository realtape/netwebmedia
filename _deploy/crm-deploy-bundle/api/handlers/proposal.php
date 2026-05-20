<?php
/**
 * Proposal generator — takes analyzer JSON + lead info, produces print-ready HTML proposal.
 * GET /api/?r=proposal&url=<target>&name=<name>&email=<email>&company=<company>
 * Returns: HTML (Content-Type: text/html) suitable for Save-as-PDF.
 */
if ($method !== 'GET') jsonError('GET required', 405);

$targetUrl = $_GET['url']     ?? '';
$leadName  = $_GET['name']    ?? 'Prospective Client';
$leadEmail = $_GET['email']   ?? '';
$company   = $_GET['company'] ?? parse_url($targetUrl, PHP_URL_HOST) ?: 'your company';
if (!filter_var($targetUrl, FILTER_VALIDATE_URL)) jsonError('valid url param required');

// Run analyzer inline
$origGet = $_GET;
ob_start();
$_GET = ['r' => 'analyze', 'url' => $targetUrl];
try {
    // We can't easily re-include analyze.php because it calls jsonResponse+exit.
    // Instead, duplicate the fetch+parse (simplified) here:
    $ch = curl_init($targetUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'NetWebMediaAnalyzer/1.0',
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $t0 = microtime(true);
    $html = curl_exec($ch) ?: '';
    $ms = round((microtime(true) - $t0) * 1000);
    $size = round(strlen($html) / 1024, 1);
    curl_close($ch);
} finally {
    ob_end_clean();
    $_GET = $origGet;
}

$doc = new DOMDocument();
libxml_use_internal_errors(true);
$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
libxml_clear_errors();
$xp = new DOMXPath($doc);

$title = $xp->query('//head/title')->item(0)?->textContent ?? '';
$hasMeta = $xp->query('//meta[@name="description"]')->length > 0;
$hasCanon = $xp->query('//link[@rel="canonical"]')->length > 0;
$hasOg = $xp->query('//meta[@property="og:title"]')->length > 0;
$hasSchema = $xp->query('//script[@type="application/ld+json"]')->length > 0;
$h1 = $xp->query('//h1')->length;
$imgs = $xp->query('//img')->length;
$imgsAlt = 0;
foreach ($xp->query('//img') as $i) if (trim($i->getAttribute('alt'))) $imgsAlt++;

$findings = [];
if (!$hasMeta) $findings[] = "Meta description missing — costs 30% of organic CTR";
if (!$hasCanon) $findings[] = "No canonical URL — duplicate-content exposure";
if (!$hasOg) $findings[] = "Missing Open Graph tags — broken social previews";
if (!$hasSchema) $findings[] = "No JSON-LD structured data — invisible to AI answer engines";
if ($h1 !== 1) $findings[] = "H1 count is $h1 (should be 1)";
if ($imgs > 0 && $imgsAlt / $imgs < 0.9) $findings[] = "Only $imgsAlt/$imgs images have alt text";
if ($ms > 1500) $findings[] = "Slow server response: {$ms}ms";
if ($size > 200) $findings[] = "Heavy HTML payload: {$size} KB";

// Crude score
$seoScore = 100;
if (!$hasMeta) $seoScore -= 15;
if (!$hasCanon) $seoScore -= 10;
if (!$hasOg) $seoScore -= 10;
if (!$hasSchema) $seoScore -= 15;
if ($h1 !== 1) $seoScore -= 10;
$seoScore = max(0, $seoScore);

header('Content-Type: text/html; charset=utf-8');
$date = date('F j, Y');
$escCompany = htmlspecialchars($company);
$escName = htmlspecialchars($leadName);
$escUrl = htmlspecialchars($targetUrl);

$findingsHtml = '';
foreach ($findings as $f) {
    $findingsHtml .= '<li>' . htmlspecialchars($f) . '</li>';
}
if (!$findingsHtml) $findingsHtml = '<li>No major issues detected — great work!</li>';

echo <<<HTML
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Proposal — $escCompany</title>
<style>
@page{size:A4;margin:18mm 16mm}body{font-family:Helvetica,Arial,sans-serif;color:#111;font-size:11pt;line-height:1.5}
.cover{min-height:92vh;background:linear-gradient(135deg,#012169,#051540);color:#fff;padding:60px 50px;page-break-after:always}
.cover h1{font-size:38pt;font-weight:900;margin-top:80px;line-height:1.05}.cover h1 span{color:#FF671F}
.label{font-size:10pt;letter-spacing:3px;text-transform:uppercase;color:#4A90D9;font-weight:700}
h2{font-size:18pt;color:#012169;border-left:5px solid #FF671F;padding-left:14px;margin:24px 0 10px}
ul{padding-left:0;list-style:none}ul li{background:#fff7ed;border-left:3px solid #FF671F;padding:10px 14px;margin-bottom:6px}
.score{display:inline-block;padding:20px 30px;background:#f7f9fc;border-radius:10px;font-size:32pt;font-weight:900;color:#012169}
</style></head><body>
<section class="cover">
  <div class="label">Website Audit Proposal</div>
  <h1>How we'd grow<br><span>$escCompany</span><br>by 10x in 90 days.</h1>
  <p style="color:#C8D4E6;margin-top:24px;">Prepared for $escName · $date</p>
</section>
<section>
  <h2>SEO Score: <span class="score">$seoScore/100</span></h2>
  <p>We analyzed <strong>$escUrl</strong> on $date. Server response: {$ms}ms · HTML size: {$size} KB</p>
  <h2>Critical Findings</h2>
  <ul>$findingsHtml</ul>
  <h2>Next Step</h2>
  <p>Reply to this proposal and we'll schedule a 30-minute call to walk through the plan. Email: hello@netwebmedia.com</p>
</section>
</body></html>
HTML;
exit;

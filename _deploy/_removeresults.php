<?php
/**
 * One-shot: strip "Results" nav links from all HTML pages under public_html.
 * Keeps results.html intact (so it can be re-linked later).
 *
 * Upload to: /home/webmed6/public_html/_removeresults.php
 * Visit:     https://netwebmedia.com/_removeresults.php?k=NWM2026-rmresults
 */
@set_time_limit(120);
@ini_set('memory_limit', '256M');
header('Content-Type: application/json');

$KEY = 'NWM2026-rmresults';
if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo json_encode(['err' => 'forbidden']);
    exit;
}

$root    = '/home/webmed6/public_html';
$exclude = ['/_deploy', '/node_modules', '/vendor', '/logs',
            '/video-out', '/video-tmp', '/.git', '/companies',
            '/site-upload', '/Netwebmedia-antigravity-copy-work'];

// Regexes in apply-order. Greedy stripping of nav links to results.html
// (paths: bare, ./, or ../). Leaves results.html file itself untouched.
$patterns = [
    // <li><a href="...results.html">Results</a></li> on its own line
    '#[ \t]*<li>\s*<a href="(?:\.{1,2}/)?results\.html"[^>]*>\s*Results\s*</a>\s*</li>\s*\n?#i',
    // bare <a href="...results.html">Results</a> on its own line
    '#[ \t]*<a href="(?:\.{1,2}/)?results\.html"[^>]*>\s*Results\s*</a>\s*\n?#i',
    // inline (multiple anchors concatenated, no surrounding whitespace)
    '#<a href="(?:\.{1,2}/)?results\.html"[^>]*>\s*Results\s*</a>#i',
];

$scanned = 0; $changed = 0; $removed_total = 0; $examples = [];

$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS)
);
foreach ($it as $f) {
    if (!$f->isFile()) continue;
    $path = $f->getPathname();
    foreach ($exclude as $e) if (strpos($path, $e) !== false) continue 2;
    if (strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION)) !== 'html') continue;
    // Never touch results.html itself
    if (basename($path) === 'results.html') continue;

    $scanned++;
    $src = @file_get_contents($path);
    if ($src === false) continue;

    $new = $src;
    $removed_here = 0;
    foreach ($patterns as $rx) {
        $out = preg_replace($rx, '', $new, -1, $cnt);
        if ($out !== null && $cnt > 0) {
            $new = $out;
            $removed_here += $cnt;
        }
    }

    if ($removed_here > 0 && $new !== $src) {
        if (@file_put_contents($path, $new) !== false) {
            $changed++;
            $removed_total += $removed_here;
            if (count($examples) < 15) {
                $examples[] = [
                    'file'    => str_replace($root, '', $path),
                    'removed' => $removed_here,
                ];
            }
        }
    }
}

echo json_encode([
    'scanned'       => $scanned,
    'files_changed' => $changed,
    'links_removed' => $removed_total,
    'examples'      => $examples,
], JSON_PRETTY_PRINT);

@unlink(__FILE__);

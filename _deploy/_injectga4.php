<?php
/**
 * One-shot GA4 injector. Scans public_html for HTML files that lack the
 * gtag snippet and inserts it before </head>. Idempotent (skips files that
 * already have gtag), self-deletes on success.
 *
 * Upload to: /home/webmed6/public_html/_injectga4.php
 * Visit:     https://netwebmedia.com/_injectga4.php?k=NWM2026-gainject
 */
@set_time_limit(120);
@ini_set('memory_limit', '256M');
header('Content-Type: application/json');

$KEY = 'NWM2026-gainject';
if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo json_encode(['err' => 'forbidden']);
    exit;
}

$root    = '/home/webmed6/public_html';
$gaId    = 'G-V71R6PD7C0';
$exclude = ['/_deploy', '/node_modules', '/vendor', '/logs',
            '/video-out', '/video-tmp', '/.git', '/companies'];

$snippet = "  <!-- Google Analytics 4 -->\n"
         . "  <script async src=\"https://www.googletagmanager.com/gtag/js?id={$gaId}\"></script>\n"
         . "  <script>\n"
         . "    window.dataLayer = window.dataLayer || [];\n"
         . "    function gtag(){ dataLayer.push(arguments); }\n"
         . "    gtag('js', new Date());\n"
         . "    gtag('config', '{$gaId}', { anonymize_ip: true });\n"
         . "  </script>\n";

$scanned = 0;
$already = 0;
$injected = 0;
$no_head = 0;
$examples = [];
$skipped  = [];

$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS)
);
foreach ($it as $f) {
    if (!$f->isFile()) continue;
    $path = $f->getPathname();
    foreach ($exclude as $e) if (strpos($path, $e) !== false) continue 2;
    if (strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION)) !== 'html') continue;

    $scanned++;
    $src = @file_get_contents($path);
    if ($src === false) continue;

    if (strpos($src, 'googletagmanager.com/gtag') !== false
        || strpos($src, "gtag('config'") !== false) {
        $already++;
        continue;
    }
    if (strpos($src, '</head>') === false) {
        $no_head++;
        $skipped[] = ['no </head>', str_replace($root, '', $path)];
        continue;
    }

    $new = preg_replace('#</head>#', $snippet . '</head>', $src, 1);
    if ($new === $src || $new === null) {
        $skipped[] = ['regex noop', str_replace($root, '', $path)];
        continue;
    }
    if (@file_put_contents($path, $new) === false) {
        $skipped[] = ['write failed', str_replace($root, '', $path)];
        continue;
    }
    $injected++;
    if (count($examples) < 15) {
        $examples[] = str_replace($root, '', $path);
    }
}

echo json_encode([
    'scanned'  => $scanned,
    'already'  => $already,
    'injected' => $injected,
    'no_head'  => $no_head,
    'examples' => $examples,
    'skipped'  => array_slice($skipped, 0, 10),
    'ga_id'    => $gaId,
], JSON_PRETTY_PRINT);

@unlink(__FILE__);

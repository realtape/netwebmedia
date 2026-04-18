<?php
/**
 * Remove hero CTA buttons linking to results.html on index.html.
 */
@set_time_limit(30);
header('Content-Type: application/json');
$KEY = 'NWM2026-rmresultscta';
if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo json_encode(['err' => 'forbidden']);
    exit;
}

$target = '/home/webmed6/public_html/index.html';
if (!file_exists($target)) { echo json_encode(['err' => 'no index.html']); exit; }
$src = file_get_contents($target);

// Match any <a href="results.html" ...>...</a> regardless of inner text
$pattern = '#[ \t]*<a href="(?:\.{1,2}/)?results\.html"[^>]*>[^<]*</a>\s*\n?#i';
$new = preg_replace($pattern, '', $src, -1, $cnt);

$ok = false;
if ($new !== null && $cnt > 0 && $new !== $src) {
    $ok = file_put_contents($target, $new) !== false;
}

echo json_encode([
    'file'    => str_replace('/home/webmed6/public_html', '', $target),
    'removed' => $cnt,
    'saved'   => $ok,
], JSON_PRETTY_PRINT);
@unlink(__FILE__);

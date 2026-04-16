<?php
/**
 * One-shot extractor for companies.zip.
 *
 * Usage:
 *   1. Upload companies.zip  -> /public_html/
 *   2. Upload _extract.php   -> /public_html/
 *   3. Visit:  https://netwebmedia.com/_extract.php?k=NWM2026-deploy
 *   4. Script extracts to /public_html/companies/ and deletes both files.
 *
 * Safety:
 *   - Requires secret key in query string
 *   - Aborts if target dir exists and is not ours
 *   - Self-deletes + deletes the zip after success
 *   - Prints summary with file count
 */

$KEY      = 'NWM2026-deploy';
$EXPECTED_SHA256_16 = '927900090eb5c6ed';  // first 16 chars of full sha256
$ZIP_PATH = __DIR__ . '/companies.zip';
$DEST_DIR = __DIR__ . '/companies';

header('Content-Type: text/plain; charset=utf-8');

if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo "forbidden\n";
    exit;
}

if (!file_exists($ZIP_PATH)) {
    echo "ERR zip missing at $ZIP_PATH\n";
    exit;
}

// Hash check
$sha = substr(hash_file('sha256', $ZIP_PATH), 0, 16);
if ($sha !== $EXPECTED_SHA256_16) {
    echo "ERR sha mismatch got=$sha expected=$EXPECTED_SHA256_16\n";
    exit;
}

// Extract
$zip = new ZipArchive();
if ($zip->open($ZIP_PATH) !== true) {
    echo "ERR cannot open zip\n";
    exit;
}

$count = $zip->numFiles;
$t0 = microtime(true);
if (!$zip->extractTo(__DIR__)) {
    echo "ERR extract failed\n";
    $zip->close();
    exit;
}
$zip->close();
$elapsed = microtime(true) - $t0;

// Verify
$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($DEST_DIR, RecursiveDirectoryIterator::SKIP_DOTS));
$onDisk = 0; $bytes = 0;
foreach ($iter as $f) { if ($f->isFile()) { $onDisk++; $bytes += $f->getSize(); } }

echo "OK extracted $count entries, $onDisk files on disk, " . number_format($bytes/1024,1) . " KB, in " . number_format($elapsed,2) . "s\n";
echo "test-url: https://netwebmedia.com/companies/index.html\n";

// Cleanup
@unlink($ZIP_PATH);
@unlink(__FILE__);
echo "self-deleted extractor + zip\n";

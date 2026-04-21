<?php
/**
 * _nwm-extract.php — one-shot extractor for nwm-deploy.zip.
 *
 * Usage:
 *   1. Upload nwm-deploy.zip  -> /public_html/
 *   2. Upload this file       -> /public_html/_nwm-extract.php
 *   3. Visit:
 *        https://netwebmedia.com/_nwm-extract.php?k=NWM2026-deploy
 *   4. Script:
 *        - verifies sha256-16
 *        - extracts every entry at /public_html/ (overwriting old files)
 *        - deletes nwm-deploy.zip
 *        - self-deletes
 *        - prints a summary
 *
 * If the sha256 check fails it does NOT extract and does NOT delete anything,
 * so a stale or half-uploaded zip cannot corrupt the site.
 */

$KEY                = 'NWM2026-deploy';
$EXPECTED_SHA256_16 = '2b8bbc91027be0ec';
$ZIP_PATH           = __DIR__ . '/nwm-deploy.zip';
$TARGET             = __DIR__;  // /public_html

header('Content-Type: text/plain; charset=utf-8');

if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo "forbidden\n";
    exit;
}

if (!file_exists($ZIP_PATH)) {
    echo "ERR: zip missing at $ZIP_PATH\n";
    exit;
}

$sha = substr(hash_file('sha256', $ZIP_PATH), 0, 16);
if ($sha !== $EXPECTED_SHA256_16) {
    echo "ERR: sha mismatch\n";
    echo "  got      $sha\n";
    echo "  expected $EXPECTED_SHA256_16\n";
    echo "  zip size ". filesize($ZIP_PATH) ." bytes\n";
    exit;
}

$zip = new ZipArchive();
$rc  = $zip->open($ZIP_PATH);
if ($rc !== true) {
    echo "ERR: cannot open zip (code=$rc)\n";
    exit;
}

$count = $zip->numFiles;
echo "opened nwm-deploy.zip, $count entries\n";
echo "extracting to $TARGET ...\n";

if (!$zip->extractTo($TARGET)) {
    echo "ERR: extractTo failed\n";
    $zip->close();
    exit;
}
$zip->close();

// Delete the zip
@unlink($ZIP_PATH);
echo "deleted nwm-deploy.zip\n";

// Self-delete
@unlink(__FILE__);
echo "deleted _nwm-extract.php\n";
echo "\nDONE. $count entries extracted.\n";
echo "Marketing pages + CRM (/app/) + API (/api/) are live.\n";

<?php
/**
 * _nwm-pull.php  —  fetch + extract nwm-deploy.zip in one request.
 *
 * Upload THIS FILE to  /public_html/_nwm-pull.php
 * Then visit:
 *   https://netwebmedia.com/_nwm-pull.php?k=NWM2026-deploy
 *
 * Flow:
 *   1. Downloads https://litter.catbox.moe/jc2s7p.zip (72h lifespan)
 *   2. Verifies sha256-16 == 2b8bbc91027be0ec
 *   3. Extracts at /public_html/ (overwrites older files)
 *   4. Deletes the zip and this script
 *   5. Prints a manifest of what changed
 *
 * Refuses to run if the hash doesn't match — a stale or corrupt bundle
 * cannot touch the live site.
 */

$KEY                = 'NWM2026-deploy';
$ZIP_URL            = 'https://litter.catbox.moe/t0n7t6.zip';
$EXPECTED_SHA256_16 = 'ef2979cd33f20d2d';
$ZIP_PATH           = __DIR__ . '/nwm-deploy.zip';
$TARGET             = __DIR__;

header('Content-Type: text/plain; charset=utf-8');

if (!isset($_GET['k']) || $_GET['k'] !== $KEY) {
    http_response_code(403);
    echo "forbidden\n";
    exit;
}

set_time_limit(300);
@ini_set('memory_limit', '256M');

// 1. Fetch
echo "[1/4] downloading $ZIP_URL ...\n";
$fp = @fopen($ZIP_PATH, 'wb');
if (!$fp) { echo "ERR cannot open $ZIP_PATH for write\n"; exit; }

$ch = curl_init($ZIP_URL);
curl_setopt_array($ch, [
    CURLOPT_FILE            => $fp,
    CURLOPT_FOLLOWLOCATION  => true,
    CURLOPT_TIMEOUT         => 240,
    CURLOPT_CONNECTTIMEOUT  => 30,
    CURLOPT_SSL_VERIFYPEER  => true,
    CURLOPT_USERAGENT       => 'nwm-deploy/1.0',
]);
$ok      = curl_exec($ch);
$httpCode= curl_getinfo($ch, CURLINFO_HTTP_CODE);
$errNo   = curl_errno($ch);
$errMsg  = curl_error($ch);
curl_close($ch);
fclose($fp);

if ($ok !== true || $httpCode !== 200) {
    echo "ERR download failed http=$httpCode errno=$errNo err=$errMsg\n";
    @unlink($ZIP_PATH);
    exit;
}
$bytes = filesize($ZIP_PATH);
echo "     downloaded " . number_format($bytes) . " bytes\n";

// 2. Verify
echo "[2/4] verifying sha256-16 ...\n";
$sha = substr(hash_file('sha256', $ZIP_PATH), 0, 16);
if ($sha !== $EXPECTED_SHA256_16) {
    echo "ERR sha mismatch\n";
    echo "    got      $sha\n";
    echo "    expected $EXPECTED_SHA256_16\n";
    @unlink($ZIP_PATH);
    exit;
}
echo "     ok ($sha)\n";

// 3. Extract
echo "[3/4] extracting to $TARGET ...\n";
$zip = new ZipArchive();
$rc  = $zip->open($ZIP_PATH);
if ($rc !== true) {
    echo "ERR zip open failed (code=$rc)\n";
    @unlink($ZIP_PATH);
    exit;
}
$count = $zip->numFiles;
if (!$zip->extractTo($TARGET)) {
    echo "ERR extractTo failed\n";
    $zip->close();
    @unlink($ZIP_PATH);
    exit;
}
$zip->close();
echo "     extracted $count entries\n";

// 4. Cleanup
echo "[4/4] cleanup ...\n";
@unlink($ZIP_PATH);
echo "     deleted nwm-deploy.zip\n";
@unlink(__FILE__);
echo "     deleted _nwm-pull.php\n";

echo "\nDONE. $count entries extracted to public_html/.\n";
echo "  Marketing HTML, /app/ (CRM), /api/ (PHP backend), /email-templates/, /tutorials/ are now live.\n";
echo "  Run database migrations via /api/migrate.php if schema changed.\n";

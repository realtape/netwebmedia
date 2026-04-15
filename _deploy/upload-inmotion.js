#!/usr/bin/env node
/**
 * Upload the latest site update to InMotion via cPanel Fileman API.
 *
 * HOW TO USE:
 *   1. Log in to cPanel at https://secure345.servconfig.com:2083 in your browser
 *   2. Open DevTools → Network tab → click any link
 *   3. Copy the "cpsess..." segment from any cPanel URL
 *      (looks like: cpsess1234567890)
 *   4. Save it as .deploy-session in the project root:
 *        echo "cpsess1234567890" > .deploy-session
 *   5. Run: node _deploy/upload-inmotion.js
 *
 * The script uploads the zip once, then runs a small PHP extractor on the server
 * to unzip into public_html/, then deletes itself. Total transfer: ~150 KB.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const CPANEL_USER = 'webmed6';
const REMOTE_HOME = '/home/webmed6/public_html';
const ZIP_NAME = 'netwebmedia-update-2026-04-15.zip';
const LOCAL_ZIP = path.join(__dirname, ZIP_NAME);

const sessionFile = path.join(__dirname, '..', '.deploy-session');
if (!fs.existsSync(sessionFile)) {
  console.error('[ERR] Missing .deploy-session file. See usage instructions at top of this script.');
  process.exit(1);
}
const SESSION = fs.readFileSync(sessionFile, 'utf8').trim();
if (!SESSION.startsWith('cpsess')) {
  console.error(`[ERR] .deploy-session does not look like a cpsess token: "${SESSION.slice(0, 20)}"...`);
  process.exit(1);
}
if (!fs.existsSync(LOCAL_ZIP)) {
  console.error(`[ERR] Zip not found at ${LOCAL_ZIP}`);
  process.exit(1);
}

function cpRequest(pathSuffix, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: `/${SESSION}${pathSuffix}`,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function saveFile(dir, filename, content) {
  const body =
    `cpanel_jsonapi_user=${CPANEL_USER}` +
    `&cpanel_jsonapi_apiversion=2` +
    `&cpanel_jsonapi_module=Fileman` +
    `&cpanel_jsonapi_func=savefile` +
    `&dir=${encodeURIComponent(dir)}` +
    `&filename=${encodeURIComponent(filename)}` +
    `&content=${encodeURIComponent(content)}`;
  if (Buffer.byteLength(body) > 50000) throw new Error(`Body too large: ${Buffer.byteLength(body)}`);
  return cpRequest('/json-api/cpanel', body);
}

function hitUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'netwebmedia.com',
      port: 443,
      path: urlPath,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (NWM-Deploy)' },
      rejectUnauthorized: false,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log(`\n→ Reading ${LOCAL_ZIP}`);
  const zipBuffer = fs.readFileSync(LOCAL_ZIP);
  const base64 = zipBuffer.toString('base64');
  const CHUNK_SIZE = 30000;
  const chunks = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) chunks.push(base64.slice(i, i + CHUNK_SIZE));
  console.log(`  ${zipBuffer.length} bytes → ${chunks.length} base64 chunks`);

  // 1. Create tmp dir
  console.log('→ Creating /public_html/_nwm_deploy/ ...');
  const mkdirBody =
    `cpanel_jsonapi_user=${CPANEL_USER}&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=mkdir&path=${encodeURIComponent(REMOTE_HOME)}&name=_nwm_deploy`;
  try { await cpRequest('/json-api/cpanel', mkdirBody); } catch (e) { /* may already exist */ }

  // 2. Upload base64 chunks as text files
  console.log(`→ Uploading ${chunks.length} chunks...`);
  for (let i = 0; i < chunks.length; i++) {
    await saveFile(`${REMOTE_HOME}/_nwm_deploy`, `chunk_${i}.txt`, chunks[i]);
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(' ok');

  // 3. Save + run PHP extractor
  console.log('→ Writing _nwm_extract.php ...');
  const extractorPHP = `<?php
set_time_limit(120);
$tmp = '${REMOTE_HOME}/_nwm_deploy';
$out = '${REMOTE_HOME}';
$data = '';
for ($i = 0; $i < ${chunks.length}; $i++) {
  $f = $tmp . '/chunk_' . $i . '.txt';
  if (!file_exists($f)) { echo "MISSING:$i"; exit; }
  $data .= file_get_contents($f);
  unlink($f);
}
$zipPath = $tmp . '/update.zip';
file_put_contents($zipPath, base64_decode($data));

$zip = new ZipArchive;
if ($zip->open($zipPath) !== true) { echo 'ZIP_OPEN_FAIL'; exit; }
$count = $zip->numFiles;
$zip->extractTo($out);
$zip->close();
unlink($zipPath);
@rmdir($tmp);
echo "OK:" . $count;
unlink(__FILE__);
?>`;
  await saveFile(REMOTE_HOME, '_nwm_extract.php', extractorPHP);
  await new Promise((r) => setTimeout(r, 600));

  console.log('→ Running extractor at https://netwebmedia.com/_nwm_extract.php ...');
  const result = await hitUrl('/_nwm_extract.php');
  console.log(`  HTTP ${result.status}: ${result.body.slice(0, 300)}`);
  if (!result.body.startsWith('OK:')) {
    console.error('[ERR] Extractor did not return OK. Check server logs.');
    process.exit(1);
  }
  const extracted = result.body.replace('OK:', '').trim();
  console.log(`\n✅  Deployed — ${extracted} files extracted into public_html/`);
  console.log(`   Live: https://netwebmedia.com/\n`);
}

main().catch((e) => {
  console.error(`\n[ERR] ${e.message}`);
  process.exit(1);
});

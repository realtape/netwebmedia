/**
 * push-and-pull.js — one-shot deployment via live cPanel session.
 *
 * 1. Uploads _nwm-pull.php to /home/webmed6/public_html/ via cPanel Fileman::savefile
 * 2. Triggers https://netwebmedia.com/_nwm-pull.php?k=NWM2026-deploy
 * 3. Prints the server's response (which extracts the zip and self-deletes)
 *
 * Usage:  node push-and-pull.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const SESSION     = 'cpsess8570220764';  // fresh, from browser URL bar 2026-04-20 1:53 PM
const USER        = 'webmed6';

const PHP_PATH    = path.join(__dirname, '_nwm-pull.php');
const PHP_CONTENT = fs.readFileSync(PHP_PATH, 'utf8');

function cpanelSaveFile() {
  return new Promise((resolve, reject) => {
    const body = [
      `cpanel_jsonapi_user=${USER}`,
      `cpanel_jsonapi_apiversion=2`,
      `cpanel_jsonapi_module=Fileman`,
      `cpanel_jsonapi_func=savefile`,
      `dir=${encodeURIComponent('/home/' + USER + '/public_html')}`,
      `filename=_nwm-pull.php`,
      `content=${encodeURIComponent(PHP_CONTENT)}`,
    ].join('&');

    const req = https.request({
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: `/${SESSION}/json-api/cpanel`,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'nwm-deploy/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function hit(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      rejectUnauthorized: true,
      headers: { 'User-Agent': 'nwm-deploy/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log(`[1/2] uploading _nwm-pull.php (${PHP_CONTENT.length} bytes) via cPanel Fileman::savefile ...`);
  const up = await cpanelSaveFile();
  console.log(`     HTTP ${up.status}`);
  console.log(`     ${up.body.slice(0, 400)}`);
  console.log();

  // Try to detect login-page response (which means session dead)
  if (up.body.includes('<html') && up.body.includes('login')) {
    console.log('ERR: response looks like a cPanel login page — session expired or invalid.');
    console.log('     Upload _deploy/_nwm-pull.php manually via cPanel File Manager into /public_html/');
    console.log('     Then visit: https://netwebmedia.com/_nwm-pull.php?k=NWM2026-deploy');
    process.exit(1);
  }

  console.log('[2/2] triggering https://netwebmedia.com/_nwm-pull.php?k=NWM2026-deploy ...');
  const pull = await hit('https://netwebmedia.com/_nwm-pull.php?k=NWM2026-deploy');
  console.log(`     HTTP ${pull.status}`);
  console.log('--- server response ---');
  console.log(pull.body);
  console.log('--- end response ---');
})().catch(e => { console.error('FAIL', e); process.exit(1); });

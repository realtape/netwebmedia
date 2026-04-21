#!/usr/bin/env node
/**
 * Upload bootstrap-cmo.php via cPanel FileMan, then trigger it.
 * The bootstrap downloads the update ZIP from temp.sh, extracts billing.php,
 * invalidates opcache, and patches all 684 company audit pages in one shot.
 *
 * Usage:
 *   1. Log into https://secure345.servconfig.com:2083
 *   2. Copy cpsess token from any cPanel URL
 *   3. echo "cpsessXXXXXXXXXX" > ../.deploy-session
 *   4. node _deploy/deploy-bootstrap-cmo.js
 */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const CPANEL_USER = 'webmed6';
const REMOTE_ROOT = '/home/webmed6/public_html';

const sessionFile = path.join(__dirname, '..', '.deploy-session');
if (!fs.existsSync(sessionFile)) { console.error('[ERR] Missing .deploy-session'); process.exit(1); }
const SESSION = fs.readFileSync(sessionFile, 'utf8').trim();
if (!SESSION.startsWith('cpsess')) { console.error(`[ERR] Bad token: ${SESSION.slice(0,20)}`); process.exit(1); }

function cpRequest(pathSuffix, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: CPANEL_HOST, port: CPANEL_PORT,
      path: `/${SESSION}${pathSuffix}`, method: 'POST',
      rejectUnauthorized: false,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,300)}`));
        try { const j = JSON.parse(data); if (j.cpanelresult?.error) return reject(new Error(j.cpanelresult.error)); } catch(e) {}
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function saveFile(remoteDir, filename, content) {
  const body =
    `cpanel_jsonapi_user=${CPANEL_USER}` +
    `&cpanel_jsonapi_apiversion=2` +
    `&cpanel_jsonapi_module=Fileman` +
    `&cpanel_jsonapi_func=savefile` +
    `&dir=${encodeURIComponent(remoteDir)}` +
    `&filename=${encodeURIComponent(filename)}` +
    `&content=${encodeURIComponent(content)}`;
  return cpRequest('/json-api/cpanel', body);
}

function hitUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'netwebmedia.com', port: 443, path: urlPath, method: 'GET', rejectUnauthorized: false, timeout: 120000 },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function main() {
  const bootstrap = fs.readFileSync(path.join(__dirname, 'bootstrap-cmo.php'), 'utf8');

  console.log('\n→ Uploading bootstrap-cmo.php via cPanel FileMan...');
  await saveFile(REMOTE_ROOT, 'bootstrap-cmo.php', bootstrap);
  console.log('  ✓ Uploaded');

  await new Promise(r => setTimeout(r, 1000));

  console.log('→ Running bootstrap at https://netwebmedia.com/bootstrap-cmo.php ...');
  const res = await hitUrl('/bootstrap-cmo.php');
  console.log(`  HTTP ${res.status}: ${res.body.slice(0, 600)}`);

  if (res.status === 200) {
    try {
      const j = JSON.parse(res.body);
      if (j.ok) {
        console.log(`\n  ✅ Extracted ${j.extracted} files`);
        console.log(`  ✅ billing.php: ${j.billing}`);
        console.log(`  ✅ Company pages: scanned=${j.companies?.scanned}, updated=${j.companies?.updated}`);
        if (j.companies?.examples?.length) {
          console.log('  Examples updated:');
          j.companies.examples.forEach(e => console.log('    ' + e));
        }
      } else {
        console.error('  ❌ Bootstrap reported error:', j);
      }
    } catch(e) { console.log('  Raw:', res.body.slice(0, 400)); }
  }

  // Verify live API
  console.log('\n→ Verifying /api/billing/plans ...');
  const plans = await hitUrl('/api/billing/plans');
  if (plans.status === 200) {
    const j = JSON.parse(plans.body);
    const cmo = (j.items||[]).filter(p => p.category === 'cmo');
    console.log('  CMO plans live on API:');
    for (const p of cmo) {
      console.log(`    ${p.code}: $${p.usd}/mo + $${p.setup} setup${p.highlight?' ⭐':''}${p.needs_contact?' (contact sales)':''}`);
    }
  } else {
    console.log(`  plans endpoint: HTTP ${plans.status}`);
  }

  console.log('\n✅  Done!\n');
}

main().catch(e => { console.error(`\n[ERR] ${e.message}`); process.exit(1); });

#!/usr/bin/env node
/**
 * Deploy CMO price update directly via cPanel FileMan API.
 * Writes billing.php + _fixcmoprices.php to the server, then runs the fix.
 *
 * Usage:
 *   1. Log in to https://secure345.servconfig.com:2083 in your browser
 *   2. Copy the cpsess token from any cPanel URL (e.g. /cpsess1234567890/...)
 *   3. echo "cpsess1234567890" > .deploy-session   (in NetWebMedia root)
 *   4. node _deploy/deploy-cmo-prices.js
 */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const CPANEL_USER = 'webmed6';
const REMOTE_ROOT = '/home/webmed6/public_html';

const sessionFile = path.join(__dirname, '..', '.deploy-session');
if (!fs.existsSync(sessionFile)) {
  console.error('[ERR] Missing .deploy-session — see usage above');
  process.exit(1);
}
const SESSION = fs.readFileSync(sessionFile, 'utf8').trim();
if (!SESSION.startsWith('cpsess')) {
  console.error(`[ERR] Bad cpsess token: "${SESSION.slice(0,20)}"`);
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
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,200)}`)); resolve(data); });
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
      { hostname: 'netwebmedia.com', port: 443, path: urlPath, method: 'GET', rejectUnauthorized: false },
      res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const root = path.join(__dirname, '..');

  // 1. Deploy billing.php
  console.log('\n→ Uploading api/routes/billing.php ...');
  const billing = fs.readFileSync(path.join(root, 'api-php/routes/billing.php'), 'utf8');
  await saveFile(`${REMOTE_ROOT}/api/routes`, 'billing.php', billing);
  console.log('  ✓ billing.php saved');

  // 2. Deploy _fixcmoprices.php (fix script for company pages)
  console.log('→ Uploading _fixcmoprices.php ...');
  const fix = fs.readFileSync(path.join(root, '_deploy/_fixcmoprices.php'), 'utf8');
  await saveFile(REMOTE_ROOT, '_fixcmoprices.php', fix);
  console.log('  ✓ _fixcmoprices.php saved');

  // 3. Deploy opcache poke
  console.log('→ Uploading _cmopoke2.php ...');
  const poke = `<?php
$files=['/home/webmed6/public_html/api/routes/billing.php'];
foreach($files as $f){if(file_exists($f)){if(function_exists('opcache_invalidate'))@opcache_invalidate($f,true);@touch($f);}}
echo json_encode(['touched'=>$files]);
@unlink(__FILE__);`;
  await saveFile(REMOTE_ROOT, '_cmopoke2.php', poke);
  console.log('  ✓ _cmopoke2.php saved');

  await new Promise(r => setTimeout(r, 800));

  // 4. Run opcache poke
  console.log('\n→ Invalidating opcache ...');
  const poke_res = await hitUrl('/_cmopoke2.php');
  console.log(`  HTTP ${poke_res.status}: ${poke_res.body.slice(0,200)}`);

  await new Promise(r => setTimeout(r, 500));

  // 5. Run company page fix
  console.log('→ Patching company audit pages (Chile + USA) ...');
  const fix_res = await hitUrl('/_fixcmoprices.php');
  console.log(`  HTTP ${fix_res.status}: ${fix_res.body.slice(0,500)}`);

  // 6. Verify billing API
  console.log('\n→ Verifying /api/billing/plans ...');
  const plans_res = await hitUrl('/api/billing/plans');
  if (plans_res.status === 200) {
    const json = JSON.parse(plans_res.body);
    const cmo = (json.items || []).filter(p => p.category === 'cmo');
    console.log('  CMO plans live:');
    for (const p of cmo) {
      console.log(`    ${p.code}: $${p.usd}/mo + $${p.setup} setup${p.highlight ? ' ⭐' : ''}${p.needs_contact ? ' (contact)' : ''}`);
    }
  } else {
    console.log(`  plans endpoint: HTTP ${plans_res.status}`);
  }

  console.log('\n✅  CMO price update deployed!\n');
}

main().catch(e => { console.error(`\n[ERR] ${e.message}`); process.exit(1); });

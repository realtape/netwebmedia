#!/usr/bin/env node
/**
 * Patch deploy: uploads only the two changed files to the live server.
 * Usage: node _deploy/patch-whatsapp.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const CPANEL_USER = 'webmed6';
const REMOTE_HOME = '/home/webmed6/public_html';

const sessionFile = path.join(__dirname, '..', '.deploy-session');
const SESSION = fs.readFileSync(sessionFile, 'utf8').trim();

const FILES = [
  {
    local: path.join(__dirname, '..', 'api-php', 'routes', 'whatsapp.php'),
    remote: `${REMOTE_HOME}/api-php/routes/whatsapp.php`,
  },
  {
    local: path.join(__dirname, '..', 'js', 'main.js'),
    remote: `${REMOTE_HOME}/js/main.js`,
  },
];

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
  const size = Buffer.byteLength(body);
  if (size > 200000) throw new Error(`Body too large: ${size}`);
  return cpRequest('/json-api/cpanel', body);
}

async function main() {
  if (!SESSION.startsWith('cpsess')) {
    console.error('[ERR] Invalid session token');
    process.exit(1);
  }

  for (const f of FILES) {
    const dir = path.posix.dirname(f.remote);
    const filename = path.posix.basename(f.remote);
    const content = fs.readFileSync(f.local, 'utf8');
    console.log(`→ Uploading ${filename} (${content.length} chars)...`);
    const res = await saveFile(dir, filename, content);
    const parsed = JSON.parse(res);
    if (parsed?.cpanelresult?.data?.[0]?.result === 1 || parsed?.result === 1) {
      console.log(`  ✓ ${filename} saved`);
    } else {
      console.log(`  Response: ${res.slice(0, 200)}`);
    }
  }
  console.log('\nDone. Test the webhook:');
  console.log('  curl -s -X POST "https://netwebmedia.com/api/whatsapp/webhook" \\');
  console.log('    -H "Content-Type: application/x-www-form-urlencoded" \\');
  console.log('    -H "User-Agent: TwilioProxy/1.1" \\');
  console.log('    -d "From=whatsapp%3A%2B15550000000&To=whatsapp%3A%2B17407363884&Body=Hi&MessageSid=SMtest001"');
}

main().catch((e) => { console.error('[FATAL]', e.message); process.exit(1); });

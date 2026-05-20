const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const SESSION = 'cpsess3504366338';
const LOCAL_DIR = path.join(__dirname, 'crm', 'out');

const failedFiles = [
  '_next/static/chunks/03~yq9q893hmn.js',
  '_next/static/chunks/04cip7gik9uzf.js',
  '_next/static/chunks/0mstyq17cbf8-.js',
  '_next/static/chunks/0n4z.7yu76je-.js',
  '_next/static/chunks/1413q_ywwwe2l.js',
  '_next/static/media/1bffadaabf893a1e-s.16ipb6fqu393i.woff2',
  '_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2',
];

// Strategy: Create a PHP script on the server that writes the file from inline base64
// Then execute it via cPanel's terminal or by hitting the URL via cPanel proxy

function savePHPWriter(relPath, base64Content) {
  return new Promise((resolve, reject) => {
    const targetPath = '/home/webmed6/public_html/app/' + relPath;
    const phpCode = `<?php
$dir = dirname('${targetPath}');
if (!is_dir($dir)) mkdir($dir, 0755, true);
$data = base64_decode('${base64Content}');
file_put_contents('${targetPath}', $data);
echo 'wrote ' . strlen($data) . ' bytes';
unlink(__FILE__);
?>`;

    const body = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=savefile&dir=/home/webmed6/public_html&filename=_writer_temp.php&content=${encodeURIComponent(phpCode)}`;

    const options = {
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: `/${SESSION}/json-api/cpanel`,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function executePhpWriter() {
  return new Promise((resolve, reject) => {
    // Hit the PHP file via cPanel proxy to execute it
    const options = {
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: `/${SESSION}/frontend/jupiter/cgi/proxy.cgi?url=http://127.0.0.1/_writer_temp.php`,
      method: 'GET',
      rejectUnauthorized: false,
    };

    // Try direct access instead
    const options2 = {
      hostname: 'netwebmedia.com',
      port: 443,
      path: '/_writer_temp.php',
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      }
    };

    const req = https.request(options2, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(`${res.statusCode}: ${data.slice(0, 200)}`));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  for (const rel of failedFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const content = fs.readFileSync(localPath);
    const base64 = content.toString('base64');

    console.log(`Processing ${rel} (${(content.length/1024).toFixed(0)}KB, ${(base64.length/1024).toFixed(0)}KB base64)...`);

    try {
      // Step 1: Save the PHP writer script
      const saveResult = await savePHPWriter(rel, base64);
      const parsed = JSON.parse(saveResult);
      if (parsed.cpanelresult?.event?.result !== 1) {
        console.log(`  ✗ Save failed: ${saveResult.slice(0, 200)}`);
        continue;
      }
      console.log(`  → PHP writer saved`);

      // Step 2: Execute the PHP writer
      await new Promise(r => setTimeout(r, 500));
      const execResult = await executePhpWriter();
      console.log(`  ✓ ${execResult}`);
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('Done!');
}

main().catch(console.error);

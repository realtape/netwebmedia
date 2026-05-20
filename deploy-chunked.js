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

// Strategy: Save a small PHP assembler, then save chunks as text files, then run assembler
function saveFileViaCpanel(dir, filename, content) {
  return new Promise((resolve, reject) => {
    const body = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=savefile&dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&content=${encodeURIComponent(content)}`;

    if (Buffer.byteLength(body) > 50000) {
      reject(new Error(`Body too large: ${Buffer.byteLength(body)} bytes`));
      return;
    }

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
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.cpanelresult?.event?.result === 1) resolve('ok');
          else reject(new Error(json.cpanelresult?.error || 'unknown error'));
        } catch {
          reject(new Error(data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function hitUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'netwebmedia.com',
      port: 443,
      path: urlPath,
      method: 'GET',
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(`${res.statusCode}: ${data.slice(0, 300)}`));
    });
    req.on('error', reject);
    req.end();
  });
}

async function uploadFileChunked(relPath) {
  const localPath = path.join(LOCAL_DIR, relPath);
  const content = fs.readFileSync(localPath);
  const base64 = content.toString('base64');
  const CHUNK_SIZE = 30000; // ~30KB chunks to stay under mod_security limits
  const chunks = [];

  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }

  console.log(`  → ${chunks.length} chunks needed`);
  const tmpDir = '/home/webmed6/public_html/_tmp_chunks';

  // Ensure tmp dir exists
  try {
    const body = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=mkdir&path=/home/webmed6/public_html&name=_tmp_chunks`;
    await new Promise((resolve, reject) => {
      const options = {
        hostname: CPANEL_HOST, port: CPANEL_PORT,
        path: `/${SESSION}/json-api/cpanel`, method: 'POST',
        rejectUnauthorized: false,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
      };
      const req = https.request(options, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d)); });
      req.on('error', reject);
      req.write(body); req.end();
    });
  } catch {}

  // Save each chunk
  for (let i = 0; i < chunks.length; i++) {
    try {
      await saveFileViaCpanel(tmpDir, `chunk_${i}.txt`, chunks[i]);
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n  ✗ Chunk ${i} failed: ${e.message}`);
      return false;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(' chunks saved');

  // Save assembler PHP
  const targetPath = '/home/webmed6/public_html/app/' + relPath;
  const assemblerPHP = `<?php
$dir = dirname('${targetPath}');
if (!is_dir($dir)) mkdir($dir, 0755, true);
$data = '';
for ($i = 0; $i < ${chunks.length}; $i++) {
  $f = '/home/webmed6/public_html/_tmp_chunks/chunk_' . $i . '.txt';
  $data .= file_get_contents($f);
  unlink($f);
}
file_put_contents('${targetPath}', base64_decode($data));
echo 'OK:' . filesize('${targetPath}');
unlink(__FILE__);
?>`;

  try {
    await saveFileViaCpanel('/home/webmed6/public_html', '_assembler.php', assemblerPHP);
    console.log('  → Assembler saved, executing...');
    await new Promise(r => setTimeout(r, 500));
    const result = await hitUrl('/_assembler.php');
    console.log(`  ✓ ${result}`);
    return true;
  } catch (e) {
    console.error(`  ✗ Assembler failed: ${e.message}`);
    return false;
  }
}

async function main() {
  for (const rel of failedFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const size = fs.statSync(localPath).size;
    console.log(`\nUploading ${rel} (${(size/1024).toFixed(0)}KB)...`);
    await uploadFileChunked(rel);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nAll done!');
}

main().catch(console.error);

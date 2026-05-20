const fs = require('fs');
const path = require('path');
const https = require('https');

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

function uploadViaPHP(relPath) {
  return new Promise((resolve, reject) => {
    const localPath = path.join(LOCAL_DIR, relPath);
    const content = fs.readFileSync(localPath);
    const base64 = content.toString('base64');
    const jsonBody = JSON.stringify({ path: relPath, content: base64 });

    const options = {
      hostname: 'netwebmedia.com',
      port: 443,
      path: '/_upload_helper.php',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
      });
    });
    req.on('error', reject);
    req.write(jsonBody);
    req.end();
  });
}

async function main() {
  for (const rel of failedFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const size = fs.statSync(localPath).size;
    try {
      console.log(`Uploading ${rel} (${(size/1024).toFixed(0)}KB)...`);
      const result = await uploadViaPHP(rel);
      console.log(`  ✓ ${result}`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Done!');
}

main().catch(console.error);

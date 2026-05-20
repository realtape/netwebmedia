const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const SESSION = 'cpsess3504366338';
const REMOTE_BASE = '/home/webmed6/public_html/app';
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

function uploadFile(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(localPath);
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
    const fileName = path.basename(remotePath);

    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file-0"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const headerBuf = Buffer.from(header, 'utf-8');
    const footerBuf = Buffer.from(footer, 'utf-8');
    const body = Buffer.concat([headerBuf, fileContent, footerBuf]);

    const options = {
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: `/${SESSION}/upload-ajax.html?dir=${encodeURIComponent(remoteDir)}&overwrite=1`,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const rel of failedFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const remotePath = REMOTE_BASE + '/' + rel;
    try {
      console.log(`Uploading ${rel}...`);
      await uploadFile(localPath, remotePath);
      console.log(`  ✓ Done`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
    // Wait 500ms between uploads
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Retry complete!');
}

main().catch(console.error);

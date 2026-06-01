const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const SESSION = 'cpsess3504366338';
const REMOTE_BASE = '/home/webmed6/public_html/app';
const LOCAL_DIR = path.join(__dirname, 'crm', 'out');

const failedJsFiles = [
  '_next/static/chunks/03~yq9q893hmn.js',
  '_next/static/chunks/04cip7gik9uzf.js',
  '_next/static/chunks/0mstyq17cbf8-.js',
  '_next/static/chunks/0n4z.7yu76je-.js',
  '_next/static/chunks/1413q_ywwwe2l.js',
];

const failedFontFiles = [
  '_next/static/media/1bffadaabf893a1e-s.16ipb6fqu393i.woff2',
  '_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2',
];

function saveFile(remotePath, content) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(remotePath).replace(/\\/g, '/');
    const filename = path.basename(remotePath);

    const body = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=savefile&dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&content=${encodeURIComponent(content)}`;

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
          if (json.cpanelresult && json.cpanelresult.event && json.cpanelresult.event.result === 1) {
            resolve('ok');
          } else {
            reject(new Error(data.slice(0, 300)));
          }
        } catch {
          reject(new Error(`Non-JSON: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function uploadBinary(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(localPath);
    const base64 = fileContent.toString('base64');
    // We'll save a base64 version and decode it server-side via a PHP script
    // Or just try the upload with a clean filename
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
    const fileName = path.basename(remotePath);

    // Try with a sanitized approach - use keepalive
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
      timeout: 30000,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Connection': 'keep-alive',
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
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  // Upload JS files via savefile API (text content)
  for (const rel of failedJsFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const remotePath = REMOTE_BASE + '/' + rel;
    const content = fs.readFileSync(localPath, 'utf-8');
    try {
      console.log(`Saving ${rel} (${(content.length/1024).toFixed(0)}KB)...`);
      await saveFile(remotePath, content);
      console.log(`  ✓ Done`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message.slice(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Upload font files via binary upload
  for (const rel of failedFontFiles) {
    const localPath = path.join(LOCAL_DIR, rel);
    const remotePath = REMOTE_BASE + '/' + rel;
    try {
      console.log(`Uploading font ${rel}...`);
      await uploadBinary(localPath, remotePath);
      console.log(`  ✓ Done`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('Retry complete!');
}

main().catch(console.error);

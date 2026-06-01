const fs = require('fs');
const path = require('path');
const https = require('https');

const CPANEL_HOST = 'secure345.servconfig.com';
const CPANEL_PORT = 2083;
const SESSION = 'cpsess3504366338';
const REMOTE_BASE = '/home/webmed6/public_html/app';
const LOCAL_DIR = path.join(__dirname, 'crm', 'out');

// Get all files recursively
function getFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results.push(...getFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// Skip .txt files and .svg files
const files = getFiles(LOCAL_DIR).filter(f => !f.endsWith('.txt') && !f.endsWith('.svg'));
console.log(`Found ${files.length} files to upload`);

// Create directories first, then upload files
const dirs = new Set();
for (const file of files) {
  const rel = path.relative(LOCAL_DIR, file);
  const dir = path.dirname(rel);
  if (dir !== '.') {
    // Add all parent dirs
    const parts = dir.split(path.sep);
    for (let i = 0; i < parts.length; i++) {
      dirs.add(parts.slice(0, i + 1).join('/'));
    }
  }
}

function makeRequest(apiPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CPANEL_HOST,
      port: CPANEL_PORT,
      path: apiPath,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {}
    };

    if (typeof body === 'string') {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

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
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function createDir(dirPath) {
  const parentDir = path.dirname(dirPath);
  const dirName = path.basename(dirPath);
  const body = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=mkdir&path=${encodeURIComponent(REMOTE_BASE + '/' + parentDir === REMOTE_BASE + '/.' ? REMOTE_BASE : REMOTE_BASE + '/' + parentDir)}&name=${encodeURIComponent(dirName)}`;
  // Use simpler approach
  const fullPath = REMOTE_BASE + '/' + dirPath;
  const parent = path.dirname(fullPath).replace(/\\/g, '/');
  const name = path.basename(fullPath);
  const reqBody = `cpanel_jsonapi_user=webmed6&cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=mkdir&path=${encodeURIComponent(parent)}&name=${encodeURIComponent(name)}`;
  return makeRequest(`/${SESSION}/json-api/cpanel`, reqBody);
}

async function main() {
  // Create directories
  const sortedDirs = [...dirs].sort();
  console.log(`Creating ${sortedDirs.length} directories...`);
  for (const dir of sortedDirs) {
    try {
      await createDir(dir);
      process.stdout.write('.');
    } catch (e) {
      console.error(`\nFailed to create dir ${dir}: ${e.message}`);
    }
  }
  console.log('\nDirs done.');

  // Upload files (4 at a time)
  console.log(`Uploading ${files.length} files...`);
  let completed = 0;
  const concurrency = 4;

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const promises = batch.map(async (file) => {
      const rel = path.relative(LOCAL_DIR, file).replace(/\\/g, '/');
      const remotePath = REMOTE_BASE + '/' + rel;
      try {
        await uploadFile(file, remotePath);
        completed++;
        process.stdout.write(`\r  ${completed}/${files.length}`);
      } catch (e) {
        console.error(`\nFailed: ${rel} - ${e.message}`);
      }
    });
    await Promise.all(promises);
  }
  console.log('\nUpload complete!');
}

main().catch(console.error);

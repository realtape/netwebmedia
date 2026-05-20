/* v10: PHP REST API + login/register + frontend api-client + auth gate in cms.js/app.js */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();

function addFile(localPath, archivePath) {
  if (!fs.existsSync(localPath)) { console.log('MISSING', localPath); return 0; }
  const buf = fs.readFileSync(localPath);
  zip.file(archivePath, buf);
  console.log('+', archivePath.padEnd(45), buf.length, 'bytes');
  return buf.length;
}

function addDir(localDir, archiveDir) {
  let bytes = 0;
  for (const name of fs.readdirSync(localDir)) {
    const local = path.join(localDir, name);
    const arch = archiveDir + '/' + name;
    const st = fs.statSync(local);
    if (st.isDirectory()) bytes += addDir(local, arch);
    else bytes += addFile(local, arch);
  }
  return bytes;
}

let total = 0;

// --- Backend (local api-php/ → server /api/) --------------------------
total += addDir('api-php', 'api');

// --- Auth pages -------------------------------------------------------
total += addFile('login.html',    'login.html');
total += addFile('register.html', 'register.html');

// --- Frontend JS + CSS updates ---------------------------------------
total += addFile('cms/js/api-client.js', 'cms/js/api-client.js');
total += addFile('cms/js/cms.js',        'cms/js/cms.js');
total += addFile('app/js/api-client.js', 'app/js/api-client.js');
total += addFile('app/js/app.js',        'app/js/app.js');

console.log('\ntotal raw bytes:', total);

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
}).then(buf => {
  const out = '_deploy/netwebmedia-update-v10.zip';
  fs.writeFileSync(out, buf);
  console.log('zip:', out, buf.length, 'bytes');
});

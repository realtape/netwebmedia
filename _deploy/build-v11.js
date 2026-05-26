/* v11: adds mailer, workflows, cron + wires contact form */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
function addFile(localPath, archivePath) {
  if (!fs.existsSync(localPath)) { console.log('MISSING', localPath); return 0; }
  const buf = fs.readFileSync(localPath);
  zip.file(archivePath, buf);
  console.log('+', archivePath.padEnd(50), buf.length, 'bytes');
  return buf.length;
}
function addDir(localDir, archiveDir) {
  let b = 0;
  for (const n of fs.readdirSync(localDir)) {
    const l = path.join(localDir, n), a = archiveDir + '/' + n;
    const s = fs.statSync(l);
    if (s.isDirectory()) b += addDir(l, a); else b += addFile(l, a);
  }
  return b;
}

let total = 0;
// Full backend (overwrites)
total += addDir('api-php', 'api');
// Universal form helper
total += addFile('assets/nwm-forms.js', 'assets/nwm-forms.js');
// Updated contact page
total += addFile('contact.html', 'contact.html');

console.log('\ntotal raw bytes:', total);
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then(buf => {
    const out = '_deploy/netwebmedia-update-v11.zip';
    fs.writeFileSync(out, buf);
    console.log('zip:', out, buf.length, 'bytes');
  });

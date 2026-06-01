const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();

// v9: CSS polish (CMS + CRM) + demo-maker.php
const files = [
  'cms/css/cms.css',       // huge polish patch
  'app/css/app.css',       // demo-chip + banner styles
];

let count = 0, totalBytes = 0;
for (const f of files) {
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    zip.file(f.replace(/\\/g, '/'), buf);
    count++;
    totalBytes += buf.length;
    console.log('+', f.padEnd(30), buf.length, 'bytes');
  } else {
    console.log('MISSING', f);
  }
}

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
}).then(buf => {
  fs.writeFileSync('_deploy/netwebmedia-update-v9.zip', buf);
  console.log('\nfiles:', count, 'raw:', totalBytes, 'zip:', buf.length);
});

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
const files = [
  'index.html', 'blog.html', 'css/styles.css'
];

for (const f of fs.readdirSync('blog')) {
  if (f.endsWith('.html')) files.push('blog/' + f);
}

let count = 0;
for (const f of files) {
  if (fs.existsSync(f)) {
    zip.file(f.replace(/\\/g, '/'), fs.readFileSync(f));
    count++;
  } else {
    console.log('skip', f);
  }
}

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
}).then(buf => {
  fs.writeFileSync('_deploy/netwebmedia-update-v4.zip', buf);
  console.log('bytes:', buf.length, 'files:', count);
});

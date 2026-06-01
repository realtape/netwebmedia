/* v12: newsletter endpoint, workflow admin UI, wired analytics + footer */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
function addFile(l, a) {
  if (!fs.existsSync(l)) { console.log('MISSING', l); return 0; }
  const buf = fs.readFileSync(l); zip.file(a, buf);
  console.log('+', a.padEnd(50), buf.length); return buf.length;
}
function addDir(l, a) { let b=0; for (const n of fs.readdirSync(l)) { const L=path.join(l,n), A=a+'/'+n, s=fs.statSync(L); if (s.isDirectory()) b+=addDir(L,A); else b+=addFile(L,A);} return b; }

let total = 0;
total += addDir('api-php', 'api');
total += addFile('assets/nwm-forms.js', 'assets/nwm-forms.js');
total += addFile('index.html', 'index.html');
total += addFile('analytics.html', 'analytics.html');
total += addFile('cms/workflows.html', 'cms/workflows.html');
total += addFile('cms/js/workflows.js', 'cms/js/workflows.js');
total += addFile('cms/js/api-client.js', 'cms/js/api-client.js');

console.log('\ntotal raw bytes:', total);
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }).then(buf => {
  const out = '_deploy/netwebmedia-update-v12.zip';
  fs.writeFileSync(out, buf);
  console.log('zip:', out, buf.length, 'bytes');
});

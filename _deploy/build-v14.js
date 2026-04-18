/* v14: Phase 1 restructure — updated links + api-client.js to all 4 locations */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
function addFile(local, archive) {
  if (!fs.existsSync(local)) { console.log('MISSING', local); return 0; }
  const buf = fs.readFileSync(local); zip.file(archive, buf);
  console.log('+', archive.padEnd(60), buf.length); return buf.length;
}

// Read changed files from git
const changed = execSync('git diff --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(f => f && !f.startsWith('_deploy/') && !f.startsWith('.claude/') && !f.startsWith('crm-vanilla/') && !f.startsWith('Netwebmedia-antigravity'))
  .filter(f => fs.existsSync(f));

let total = 0;
for (const f of changed) total += addFile(f, f);

// Also deploy api-client.js to the 3 new locations (crm + demo/crm + demo/cms)
const apiApp = 'app/js/api-client.js';
const apiCms = 'cms/js/api-client.js';
total += addFile(apiApp, 'crm/js/api-client.js');
total += addFile(apiApp, 'demo/crm/js/api-client.js');
total += addFile(apiCms, 'demo/cms/js/api-client.js');

// Deploy updated app.js to /crm/js/ and /demo/crm/js/
total += addFile('app/js/app.js', 'crm/js/app.js');
total += addFile('app/js/app.js', 'demo/crm/js/app.js');

console.log('\ntotal raw bytes:', total);
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }).then(buf => {
  const out = '_deploy/nwm-v14.zip';
  fs.writeFileSync(out, buf);
  console.log('zip:', out, buf.length, 'bytes');
});

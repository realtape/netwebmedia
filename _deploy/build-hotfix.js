#!/usr/bin/env node
/**
 * build-hotfix.js — packages the 4 critical changed files for hotfix deploy.
 * Files: .htaccess, js/nwm-chat.js, sitemap.xml, robots.txt
 * Output: _deploy/nwm-deploy.zip  (ready for upload-inmotion.js)
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
let total = 0;

function addFile(local, archive) {
  if (!fs.existsSync(local)) { console.log('MISSING', local); return 0; }
  const buf = fs.readFileSync(local);
  zip.file(archive, buf);
  console.log('+', archive.padEnd(55), buf.length, 'bytes');
  return buf.length;
}

total += addFile('.htaccess',        '.htaccess');
total += addFile('js/nwm-chat.js',   'js/nwm-chat.js');
total += addFile('sitemap.xml',      'sitemap.xml');
total += addFile('robots.txt',       'robots.txt');
total += addFile('pricing.html',     'pricing.html');

console.log('\nTotal raw bytes:', total);
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then(buf => {
    const out = '_deploy/nwm-deploy.zip';
    fs.writeFileSync(out, buf);
    console.log('Zip written:', out, '->', buf.length, 'bytes');
    console.log('\nRun: node _deploy/upload-inmotion.js');
  });

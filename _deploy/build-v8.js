const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();

// Pipeline files (re-include in case v7 wasn't fully deployed)
const pipelineFiles = [
  'app/sales-pipeline.html',
  'app/marketing-pipeline.html',
  'app/js/sales-pipeline.js',
  'app/js/marketing-pipeline.js',
  'app/js/app.js',           // updated with CMS switcher
  'app/css/app.css',         // updated with service-switch styles
  'app/css/pipelines.css',
];

// All CMS files
const cmsFiles = [
  // CMS HTML pages
  'cms/index.html',
  'cms/pages.html',
  'cms/blog.html',
  'cms/landing-pages.html',
  'cms/forms.html',
  'cms/templates.html',
  'cms/media.html',
  'cms/seo.html',
  'cms/workflows.html',
  'cms/ab-tests.html',
  'cms/memberships.html',
  'cms/settings.html',
  // CMS CSS
  'cms/css/cms.css',
  // CMS JS (shared + per-page)
  'cms/js/cms.js',
  'cms/js/data.js',
  'cms/js/dashboard.js',
  'cms/js/pages.js',
  'cms/js/blog.js',
  'cms/js/landing-pages.js',
  'cms/js/forms.js',
  'cms/js/templates.js',
  'cms/js/media.js',
  'cms/js/seo.js',
  'cms/js/workflows.js',
  'cms/js/ab-tests.js',
  'cms/js/memberships.js',
  'cms/js/settings.js',
];

const files = [...pipelineFiles, ...cmsFiles];

let count = 0;
let totalBytes = 0;
const missing = [];
for (const f of files) {
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    zip.file(f.replace(/\\/g, '/'), buf);
    count++;
    totalBytes += buf.length;
    console.log('+', f.padEnd(40), buf.length, 'bytes');
  } else {
    console.log('MISSING', f);
    missing.push(f);
  }
}

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
}).then(buf => {
  fs.writeFileSync('_deploy/netwebmedia-update-v8.zip', buf);
  console.log('');
  console.log('────────────────────────────────────────');
  console.log('files packed :', count);
  console.log('raw bytes    :', totalBytes);
  console.log('zip bytes    :', buf.length);
  console.log('output       : _deploy/netwebmedia-update-v8.zip');
  if (missing.length) {
    console.log('MISSING      :', missing.length);
    missing.forEach(m => console.log('  -', m));
  }
});

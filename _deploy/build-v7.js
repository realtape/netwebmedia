const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
process.chdir(path.join(__dirname, '..'));

const zip = new JSZip();
const files = [
  'app/sales-pipeline.html',
  'app/marketing-pipeline.html',
  'app/js/sales-pipeline.js',
  'app/js/marketing-pipeline.js',
  'app/js/app.js',
  'app/css/pipelines.css',
];
let count = 0;
for (const f of files) {
  if (fs.existsSync(f)) {
    zip.file(f.replace(/\\/g,'/'), fs.readFileSync(f));
    count++;
    console.log('+', f, fs.statSync(f).size, 'bytes');
  } else {
    console.log('MISSING', f);
  }
}
zip.generateAsync({type:'nodebuffer', compression:'DEFLATE', compressionOptions:{level:9}}).then(buf => {
  fs.writeFileSync('_deploy/netwebmedia-update-v7.zip', buf);
  console.log('zip bytes:', buf.length, 'files:', count);
});

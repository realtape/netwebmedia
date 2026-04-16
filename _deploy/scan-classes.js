const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'cms', 'js');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'cms.js' && f !== 'data.js');
const classes = new Set();
const rx = /class=\\?"([^"\\]+)\\?"/g;
for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  let m;
  while ((m = rx.exec(t)) !== null) {
    m[1].split(/\s+/).forEach(c => { if (c) classes.add(c); });
  }
}
console.log([...classes].sort().join('\n'));

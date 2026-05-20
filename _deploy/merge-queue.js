// Merge queue-tomorrow.json (the hand-written 20) + queue-generated.json (algorithmic) -> queue-full.json
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const tomorrow = JSON.parse(fs.readFileSync('_deploy/queue-tomorrow.json', 'utf8'));
const generated = JSON.parse(fs.readFileSync('_deploy/queue-generated.json', 'utf8'));

// De-dup by slug, tomorrow's hand-written posts first.
const seen = new Set();
const out = [];
for (const p of [...tomorrow, ...generated]) {
  if (seen.has(p.slug)) continue;
  seen.add(p.slug);
  out.push(p);
}
fs.writeFileSync('_deploy/queue-full.json', JSON.stringify(out));
console.log(`Merged ${tomorrow.length} hand + ${generated.length} generated -> ${out.length} total (${fs.statSync('_deploy/queue-full.json').size} bytes)`);
console.log(`Days of runway at 20/day: ${Math.floor(out.length/20)}`);

// Removes the Connect/hello@ footer column from all HTML files.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const { execSync } = require('child_process');
const out = execSync('git ls-files --others --cached --exclude-standard -- "*.html" "lp/*.html" "blog/*.html"', { encoding: 'utf8' });
// Simpler: just walk via fs
function walk(dir, results = []) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (['.venv','crm','node_modules','.git','email-templates'].includes(f)) continue;
      walk(fp, results);
    } else if (f.endsWith('.html')) {
      results.push(fp);
    }
  }
  return results;
}

const files = walk('.');
let patched = 0;

for (const fp of files) {
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('hello@netwebmedia.com')) continue;

  // Remove the Connect footer column (handles varying indentation)
  const before = html;
  html = html.replace(/[ \t]*<div class="footer-col"><h4>Connect<\/h4><ul>[\s\S]*?<\/ul><\/div>\n?/g, '');

  if (html !== before) {
    fs.writeFileSync(fp, html);
    patched++;
    console.log('+', fp);
  }
}
console.log(`\nPatched ${patched} files.`);

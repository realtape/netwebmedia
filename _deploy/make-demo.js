/* Generate /cms-demo/ and /app-demo/ as mirrors of /cms/ and /app/,
   with cross-links rewritten so demo ↔ demo and a demo banner injected. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
process.chdir(root);

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) {
    for (const f of fs.readdirSync(p)) rmrf(path.join(p, f));
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

function copyRec(src, dst) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copyRec(path.join(src, f), path.join(dst, f));
  } else {
    fs.copyFileSync(src, dst);
  }
}

function transformFiles(dir, ext, fn) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      transformFiles(p, ext, fn);
    } else if (ext.some(e => f.endsWith(e))) {
      const content = fs.readFileSync(p, 'utf8');
      const newContent = fn(content, p);
      if (newContent !== content) {
        fs.writeFileSync(p, newContent);
        console.log('  rewrote', path.relative(root, p));
      }
    }
  }
}

/* ── build /cms-demo/ ─────────────────────── */
console.log('\n=== building cms-demo ===');
rmrf('cms-demo');
copyRec('cms', 'cms-demo');

// Rewrite cross-links in cms-demo JS: ../app/ → ../app-demo/
transformFiles('cms-demo', ['.js', '.html'], (c) =>
  c.replace(/\.\.\/app\//g, '../app-demo/')
);

// Inject demo banner into every cms-demo HTML
transformFiles('cms-demo', ['.html'], (c) => {
  if (c.includes('demo-banner')) return c;
  const banner = '<div class="demo-banner">DEMO MODE — This is a public preview with sample data. Sign up for a real account at <a href="/">netwebmedia.com</a></div>';
  return c.replace(/<body>/, '<body>\n  ' + banner);
});

// Adjust CMS sidebar label in cms-demo/js/cms.js (brand text and switcher)
transformFiles('cms-demo/js', ['.js'], (c, p) => {
  if (!p.endsWith('cms.js')) return c;
  return c
    .replace(/'<span class="brand-text">NetWeb CMS<\/span>'/g,
             "'<span class=\"brand-text\">NetWeb CMS <em class=\"demo-chip\">demo</em></span>'")
    .replace(/'<div class="switch-name">NetWeb CRM<\/div>'/g,
             "'<div class=\"switch-name\">NetWeb CRM <em class=\"demo-chip-sm\">demo</em></div>'");
});

/* ── build /app-demo/ ─────────────────────── */
console.log('\n=== building app-demo ===');
rmrf('app-demo');
copyRec('app', 'app-demo');

// Rewrite cross-links: ../cms/ → ../cms-demo/
transformFiles('app-demo', ['.js', '.html'], (c) =>
  c.replace(/\.\.\/cms\//g, '../cms-demo/')
);

// Inject demo banner
transformFiles('app-demo', ['.html'], (c) => {
  if (c.includes('demo-banner')) return c;
  const banner = '<div class="demo-banner">DEMO MODE — This is a public preview with sample data. Sign up for a real account at <a href="/">netwebmedia.com</a></div>';
  return c.replace(/<body>/, '<body>\n  ' + banner);
});

// Adjust CRM sidebar label in app-demo/js/app.js
transformFiles('app-demo/js', ['.js'], (c, p) => {
  if (!p.endsWith('app.js')) return c;
  return c
    .replace(/'<span class="brand-text">NetWeb CRM<\/span>'/g,
             "'<span class=\"brand-text\">NetWeb CRM <em class=\"demo-chip\">demo</em></span>'")
    .replace(/'<div class="switch-name">NetWeb CMS<\/div>'/g,
             "'<div class=\"switch-name\">NetWeb CMS <em class=\"demo-chip-sm\">demo</em></div>'");
});

console.log('\n=== demo mirrors ready ===');
console.log('  /cms-demo/  (preview CMS)');
console.log('  /app-demo/  (preview CRM)');
console.log('Demo banner injected into all HTML files.');

// Removes multi-line Connect footer-col blocks (only those containing h4>Connect + email ul, not Newsletter).
const fs = require('fs');
process.chdir(require('path').join(__dirname, '..'));

const targets = [
  'aeo-agency.html','faq.html','nwm-cms.html','nwm-crm.html',
  'nwmai.html','services.html','index.html',
  'about.html','analytics.html','blog.html','cart.html','dashboard.html',
  'desktop-login.html','diagnostic.html','pricing.html','partners.html',
  'netwebmedia-inbox.html','results.html',
];

let patched = 0;
for (const f of targets) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  const before = html;

  // For index.html: Connect h4 + email ul are inside a footer-col that also has Newsletter — remove just the Connect part
  html = html.replace(/<h4>Connect<\/h4>\s*<ul>\s*<li><a href="mailto:hello@netwebmedia\.com">hello@netwebmedia\.com<\/a><\/li>[^<]*<\/ul>\s*/g, '');
  html = html.replace(/<h4>Connect<\/h4>\s*<ul>[\s\S]*?<\/ul>\s*/g, match => {
    // Only remove if it only contains email/simple links (no newsletter)
    if (!match.includes('newsletter') && !match.includes('Subscribe')) return '';
    return match;
  });

  // Remove entire footer-col if now empty (just whitespace between div tags)
  html = html.replace(/[ \t]*<div class="footer-col">\s*<\/div>\n?/g, '');

  if (html !== before) {
    fs.writeFileSync(f, html);
    patched++;
    console.log('+', f);
  }
}
console.log(`\nPatched ${patched} files.`);

// _deploy/generate-blogs.js
// Generates blog posts from posts-queue/*.json files and rebuilds blog.html.
// Each JSON file in posts-queue/ represents one post. After rendering to HTML
// inside /blog/, the JSON file is moved to posts-queue/_published/.
//
// Usage:
//   node _deploy/generate-blogs.js             # render everything pending
//   node _deploy/generate-blogs.js --limit 20  # render at most 20 posts
//
// To schedule "20 blogs per day", run this nightly with --limit 20 and keep
// posts-queue/ topped up with new .json drafts. (cron example at the bottom.)

const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const QUEUE_DIR = path.join('_deploy', 'posts-queue');
const PUBLISHED_DIR = path.join(QUEUE_DIR, '_published');
const BLOG_DIR = 'blog';

if (!fs.existsSync(PUBLISHED_DIR)) fs.mkdirSync(PUBLISHED_DIR, { recursive: true });

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

// Stock image pool — same logic as _deploy/stock-images.js
const IMG_POOL = {
  ai: ['1677442136019-21780ecad995','1526374965328-7f61d4dc18c5','1535378917042-10a22c95931a','1620712943543-bcc4688e7485','1655720828018-edd2daec9349','1485827404703-89b55fcc595e','1563089145-599997674d42'],
  code: ['1517694712202-14dd9538aa97','1555066931-4365d14bab8c','1515879218367-8466d910aaa4','1542831371-29b0f74f9713'],
  data: ['1551288049-bebda4e38f71','1460925895917-afdab827c52f','1543286386-713bdd548da4','1543286386-2e659306cd6c'],
  seo:  ['1432888498266-38ffec3eaf0a','1533750349088-cd871a92f312','1432821596592-e2c18b78144f'],
  video:['1522869635100-9f4c5e86aa37','1598899134739-24c46f58b8c0'],
  voice:['1590602847861-f357a9332bbc','1598488035139-bdbb2231ce04'],
  paid: ['1460925895917-afdab827c52f','1518186285589-2f7649de83e0'],
  regulation:['1589829545856-d10d557cf95f','1505664194779-8beaceb93744'],
  mobile:['1512941937669-90a1b58e7e9c','1511707171634-5f897ff02aa9'],
  chips:['1591799264318-7e6ef8ddb7ea','1518770660439-4636190af475'],
  creative:['1572044162444-ad60f128bdea','1558655146-9f40138edfeb'],
  meta: ['1611162617474-5b21e879e113','1563986768609-322da13575f3'],
  sales:['1556761175-5973dc0f32e7','1552664730-d307ca884978'],
};
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }
function imageFor(slug, topic) {
  const pool = IMG_POOL[topic] || IMG_POOL.ai;
  const id = pool[hash(slug) % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderPostHtml(post) {
  const slug = post.slug;
  const img = imageFor(slug, post.topic);
  const url = `https://netwebmedia.com/blog/${slug}.html`;
  const publishedISO = post.published || new Date().toISOString().slice(0, 10);
  const bodyHtml = post.sections.map(s => {
    if (s.h2) return `<h2>${esc(s.h2)}</h2>` + (s.paragraphs ? '\n\n' + s.paragraphs.map(p => `<p>${p}</p>`).join('\n\n') : '');
    if (s.h3) return `<h3>${esc(s.h3)}</h3>` + (s.paragraphs ? '\n\n' + s.paragraphs.map(p => `<p>${p}</p>`).join('\n\n') : '');
    if (s.list) return `<ul>\n` + s.list.map(li => `  <li>${li}</li>`).join('\n') + `\n</ul>`;
    if (s.olist) return `<ol>\n` + s.olist.map(li => `  <li>${li}</li>`).join('\n') + `\n</ol>`;
    if (s.quote) return `<blockquote>${esc(s.quote)}</blockquote>`;
    if (s.p) return `<p>${s.p}</p>`;
    return '';
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(post.title)} — NetWebMedia Blog</title>
  <meta name="description" content="${esc(post.description)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:title" content="${esc(post.title)}" />
  <meta property="og:description" content="${esc(post.description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="NetWebMedia" />
  <meta property="og:locale" content="en_US" />
  <meta property="article:published_time" content="${publishedISO}" />
  <meta property="article:author" content="${esc(post.author)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(post.title)}" />
  <meta name="twitter:description" content="${esc(post.description)}" />
  <meta name="twitter:image" content="${img}" />
  <link rel="stylesheet" href="../css/styles.css" />
  <link rel="icon" type="image/svg+xml" href="../assets/nwm-logo.svg" />
  <link rel="apple-touch-icon" href="../assets/nwm-logo.svg" />
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(post.title)},
  "description": ${JSON.stringify(post.description)},
  "author": { "@type": "Person", "name": ${JSON.stringify(post.author)} },
  "publisher": {
    "@type": "Organization",
    "name": "NetWebMedia",
    "logo": { "@type": "ImageObject", "url": "https://netwebmedia.com/assets/nwm-logo.svg" }
  },
  "datePublished": "${publishedISO}",
  "image": "${img}",
  "mainEntityOfPage": "${url}",
  "inLanguage": "en-US"
}
  </script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

<div class="lang-bar"><div class="container">
  <button class="lang-btn active" data-lang="en"><img class="flag" src="https://flagcdn.com/w40/us.png" alt="EN" loading="lazy" width="20" height="15" /> English</button>
  <button class="lang-btn" data-lang="es"><img class="flag" src="https://flagcdn.com/w40/es.png" alt="ES" loading="lazy" width="20" height="15" /> Español</button>
    <a href="/app/" class="lang-client-login" data-i18n="nav_dashboard">🔐 Client Login</a>
</div></div>

<nav class="navbar has-lang-bar" id="navbar"><div class="container"><div class="navbar-inner">
  <a href="../index.html" class="nav-logo"><img src="../assets/nwm-logo-horizontal.svg" alt="NetWebMedia" class="logo-lockup" style="height:52px"></a>
  <div class="nav-links">
    <a href="../services.html">Services</a>
    <a href="../about.html">About</a>
    <a href="../results.html">Results</a>
    <a href="../blog.html" class="active">Blog</a>
    <a href="../contact.html">Contact</a>
  </div>
  <div class="nav-ctas">
    <a href="../cart.html" class="nav-cart" aria-label="View cart">🛒<span class="nav-cart-count" aria-hidden="true">0</span></a>
    <a href="../dashboard.html" class="btn-nav-outline">Dashboard</a>
    <a href="../contact.html" class="btn-nav-solid">Get a Free Audit</a>
  </div>
  <button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>
</div></div></nav>

<main id="main">
<div class="mobile-menu" id="mobile-menu">
  <a href="../services.html">Services</a>
  <a href="../about.html">About</a>
  <a href="../results.html">Results</a>
  <a href="../blog.html">Blog</a>
  <a href="../contact.html">Contact</a>
  <a href="../contact.html" class="btn-primary">Get a Free Audit</a>
</div>

<section class="article-hero">
  <div class="container">
    <a class="article-back" href="../blog.html">← All articles</a>
    <div class="tag">${esc(post.tag)}</div>
    <h1>${esc(post.title)}</h1>
    <div class="article-meta">By ${esc(post.author)} · ${esc(post.dateLabel || publishedISO)} · ${esc(post.readTime || '6 min read')}</div>
    <div class="article-cover" style="background-image:url('${img}');background-size:cover;background-position:center;" role="img" aria-label="Article cover"></div>
  </div>
</section>

<article class="article-body">
${bodyHtml}

  <div class="article-cta-box">
    <h3>Want this working inside your own stack?</h3>
    <p>NetWebMedia builds AI marketing systems for US brands — from autonomous agents to full AEO-ready content engines. Book a free 30-minute strategy call and we'll map out the highest-ROI next step for your team.</p>
    <a class="btn-primary" href="../contact.html">Book a Free Strategy Call →</a>
  </div>

  <p style="text-align:center;margin-top:40px;">
    <a class="article-back" href="../blog.html">← Back to all articles</a>
  </p>
</article>
</main>

<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../index.html" class="nav-logo"><img src="../assets/nwm-logo-horizontal.svg" alt="NetWebMedia" class="logo-lockup" style="height:52px" loading="lazy" width="200" height="52"></a>
        <p>The world's most advanced AI marketing agency.</p>
      </div>
      <div class="footer-col"><h4>Services</h4><ul>
        <li><a href="../services.html#ai-automations">AI Automations</a></li>
        <li><a href="../services.html#ai-agents">AI Agents</a></li>
        <li><a href="../services.html#ai-seo">AI SEO</a></li>
        <li><a href="../services.html#paid-ads">Paid Ads</a></li>
      </ul></div>
      <div class="footer-col"><h4>Company</h4><ul>
        <li><a href="../about.html">About</a></li>
        <li><a href="../results.html">Results</a></li>
        <li><a href="../blog.html">Blog</a></li>
        <li><a href="../contact.html">Contact</a></li>
      </ul></div>
      <div class="footer-col"><h4>Connect</h4><ul>
        <li><a href="mailto:hello@netwebmedia.com">hello@netwebmedia.com</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 NetWebMedia. All rights reserved.</p>
    </div>
  </div>
</footer>
<script src="../js/main.js" defer></script>
<script src="../js/cart.js" defer></script>
</body>
</html>
`;
}

// --- Main ---
if (!fs.existsSync(QUEUE_DIR)) {
  console.log('no queue dir:', QUEUE_DIR);
  process.exit(0);
}
const pending = fs.readdirSync(QUEUE_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

let rendered = 0;
const renderedPosts = [];
for (const f of pending) {
  if (rendered >= LIMIT) break;
  const srcPath = path.join(QUEUE_DIR, f);
  const post = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const outPath = path.join(BLOG_DIR, post.slug + '.html');
  fs.writeFileSync(outPath, renderPostHtml(post));
  // Move JSON to _published/
  fs.renameSync(srcPath, path.join(PUBLISHED_DIR, f));
  renderedPosts.push(post);
  rendered++;
  console.log('+', post.slug);
}
console.log(`Rendered ${rendered} post(s).`);

// --- Rebuild blog.html listing ---
// Read every blog/*.html and produce a card for each, ordered by published_time desc.
function extractMeta(html) {
  const m = (re) => { const x = html.match(re); return x ? x[1] : ''; };
  return {
    title: m(/<h1>([^<]+)<\/h1>/),
    description: m(/<meta name="description" content="([^"]+)"/),
    tag: m(/<div class="tag">([^<]+)<\/div>/),
    author: m(/By ([^·<]+) ·/),
    readTime: m(/·\s*([0-9]+\s*min read)/),
    cover: m(/background-image:url\('([^']+)'\)/),
    published: m(/article:published_time" content="([^"]+)"/) || m(/"datePublished":\s*"([^"]+)"/),
  };
}

const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
const cards = blogFiles.map(f => {
  const html = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
  const meta = extractMeta(html);
  meta.slug = f.replace(/\.html$/, '');
  return meta;
}).sort((a, b) => (b.published || '').localeCompare(a.published || ''));

const cardsHtml = cards.map(c => `      <div class="glass-card blog-card scroll-reveal">
        <div class="blog-card-img" style="background-image:url('${c.cover}');background-size:cover;background-position:center;" role="img" aria-label="Cover image"></div>
        <div class="blog-card-body">
          <div class="blog-tag">${esc(c.tag)}</div>
          <h3 class="blog-title"><a href="blog/${c.slug}.html">${esc(c.title)}</a></h3>
          <p class="blog-excerpt">${esc(c.description)}</p>
          <div class="blog-meta">${esc(c.author.trim())} · ${esc(c.readTime || '6 min read')}</div>
        </div>
      </div>`).join('\n');

let blogHtml = fs.readFileSync('blog.html', 'utf8');
blogHtml = blogHtml.replace(
  /(<div class="blog-grid">)[\s\S]*?(\n\s*<\/div>\s*\n\s*<!-- Newsletter CTA -->)/,
  `$1\n${cardsHtml}$2`
);
fs.writeFileSync('blog.html', blogHtml);
console.log(`Rebuilt blog.html with ${cards.length} cards.`);

/* Cron example (runs nightly at 09:00 server time, publishes up to 20):
     0 9 * * *  cd /path/to/NetWebMedia && /usr/bin/node _deploy/generate-blogs.js --limit 20
*/

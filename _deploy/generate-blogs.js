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
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(post.title);
  const hasGuide = fs.existsSync(path.join('guides', slug + '.html'));
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

${hasGuide ? `  <aside class="article-guide-cta" style="margin:48px 0;border-radius:14px;overflow:hidden;box-shadow:0 18px 48px rgba(1,15,59,.12);background:#fff;border:1px solid #e5e7eb;">
    <div style="display:grid;grid-template-columns:220px 1fr;gap:0;">
      <div style="background:#010F3B;color:#fff;padding:28px 22px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">
        <div style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:800;color:#FF671F;letter-spacing:-0.3px;">NetWebMedia</div>
        <div>
          <div style="display:inline-block;background:#FF671F;color:#fff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:3px;margin-bottom:10px;">Free Guide</div>
          <div style="font-family:'Poppins',sans-serif;font-size:14px;font-weight:800;color:#fff;line-height:1.3;">${esc(post.title)}</div>
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,0.55);">${esc(post.author)} · 2026</div>
      </div>
      <div style="padding:28px 32px;">
        <div style="display:inline-block;background:#FFEADD;color:#FF671F;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;padding:4px 10px;border-radius:4px;margin-bottom:10px;">📥 PDF Download</div>
        <h3 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:800;color:#010F3B;margin:0 0 10px;line-height:1.25;">Get the full playbook — free</h3>
        <p style="font-size:15px;color:#4b5563;line-height:1.55;margin:0 0 18px;">This article covers the fundamentals. The complete PDF guide includes frameworks, implementation checklists, week-by-week rollout plans, and tactical examples you can apply immediately.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
          <a href="../assets/guides/${slug}.pdf" download class="btn-primary" style="display:inline-flex;align-items:center;gap:6px;">↓ Download Free PDF</a>
          <a href="../lp/${slug}.html" style="color:#010F3B;font-weight:600;font-size:14px;text-decoration:none;">See what's inside →</a>
        </div>
      </div>
    </div>
  </aside>
` : ''}
  <div class="article-cta-box">
    <h3>Want this working inside your own stack?</h3>
    <p>NetWebMedia builds AI marketing systems for US brands — from autonomous agents to full AEO-ready content engines. Book a free 30-minute strategy call and we'll map out the highest-ROI next step for your team.</p>
    <a class="btn-primary" href="../contact.html">Book a Free Strategy Call →</a>
  </div>

  <!-- Social Share -->
  <div class="article-share" style="margin:48px 0 32px;text-align:center;">
    <p style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 14px;">Share this article</p>
    <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
      <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#000;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X (Twitter)
      </a>
      <a href="https://linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#0A66C2;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
      <a href="https://facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#1877F2;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>
      <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#25D366;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        WhatsApp
      </a>
    </div>
  </div>

  <!-- Comments (Disqus) -->
  <div class="article-comments" style="margin:48px 0;">
    <div id="disqus_thread"></div>
    <script>
      var disqus_config = function () {
        this.page.url = '${url}';
        this.page.identifier = '${slug}';
      };
      (function() {
        var d = document, s = d.createElement('script');
        s.src = 'https://netwebmedia.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
      })();
    </script>
    <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
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
  // Move JSON to _published/ (overwrite if exists)
  const destPath = path.join(PUBLISHED_DIR, f);
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
  fs.renameSync(srcPath, destPath);
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

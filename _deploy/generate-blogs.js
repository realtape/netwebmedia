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

// Mixed pool — verified Unsplash CDN hashes: people working, AI interfaces, dashboards, tech screens
const MIXED_POOL = [
  // People working at computers / in meetings
  '1758762641372-e3b52bf061d4',
  '1522071820081-009f0129c71c',
  '1542744173-8e7e53415bb0',
  '1758691737568-a1572060ce5a',
  '1748256373165-e4d125c5124f',
  '1758691736424-4b4273948341',
  '1702047063975-0841a0621b5a',
  '1758876022088-2d46af5635c2',
  '1690264695514-3af95dfa51be',
  '1690264697065-33256aa3729b',
  '1713947501966-34897f21162e',
  // AI / chatbot interfaces
  '1762330467475-a565d04e1808',
  '1762330465857-07e4c81c0dfa',
  '1757310998648-f8aaa5572e8e',
  '1762328862557-e0a36587cd3c',
  // Digital dashboards / analytics screens
  '1551288049-bebda4e38f71',
  '1526628953301-3e589a6a8b74',
  '1560472354-b33ff0c44a43',
  '1666875753105-c63a6f3bdc86',
  // Code / tech screens
  '1460925895917-afdab827c52f',
  '1517694712202-14dd9538aa97',
  '1526374965328-7f61d4dc18c5',
  '1432888498266-38ffec3eaf0a',
];
const IMG_POOL = {
  ai: MIXED_POOL, code: MIXED_POOL, data: MIXED_POOL, seo: MIXED_POOL,
  video: MIXED_POOL, voice: MIXED_POOL, paid: MIXED_POOL, regulation: MIXED_POOL,
  mobile: MIXED_POOL, chips: MIXED_POOL, creative: MIXED_POOL, meta: MIXED_POOL,
  sales: MIXED_POOL,
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
      <button onclick="nwmCopyShare(this,'${url}')" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        Instagram
      </button>
      <button onclick="nwmCopyShare(this,'${url}')" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;background:#000;color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:opacity .2s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
        TikTok
      </button>
    </div>
  </div>
  <script>
  function nwmCopyShare(btn, url) {
    navigator.clipboard.writeText(url).then(function() {
      var orig = btn.innerHTML;
      btn.textContent = '✓ Link copied!';
      setTimeout(function(){ btn.innerHTML = orig; }, 2000);
    });
  }
  </script>

  <!-- Comments -->
  <div class="article-comments" id="comments" style="margin:48px 0;">
    <h3 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:800;color:#010F3B;margin:0 0 28px;">Comments</h3>

    <!-- Comment list -->
    <div id="nwm-comment-list" style="margin-bottom:36px;"></div>

    <!-- New comment form -->
    <div style="background:#f9fafb;border-radius:12px;padding:28px 32px;border:1px solid #e5e7eb;">
      <p style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;color:#010F3B;margin:0 0 20px;">Leave a comment</p>
      <form id="nwm-comment-form" onsubmit="nwmSubmitComment(event,'${slug}')">
        <input type="text" name="hp_field" style="display:none" tabindex="-1" autocomplete="off" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Name <span style="color:#ef4444">*</span></label>
            <input id="nwm-c-name" type="text" placeholder="Your name" required maxlength="100"
              style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;box-sizing:border-box;outline:none;" />
          </div>
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Email <span style="color:#9ca3af;font-weight:400">(optional, never shown)</span></label>
            <input id="nwm-c-email" type="email" placeholder="you@email.com" maxlength="200"
              style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;box-sizing:border-box;outline:none;" />
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Comment <span style="color:#ef4444">*</span></label>
          <textarea id="nwm-c-comment" rows="4" placeholder="Share your thoughts..." required maxlength="2000"
            style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:'Inter',sans-serif;resize:vertical;box-sizing:border-box;outline:none;"></textarea>
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <button type="submit" id="nwm-c-btn" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:#FF671F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;">Post comment</button>
          <span id="nwm-c-msg" style="font-size:13px;color:#6b7280;"></span>
        </div>
      </form>
    </div>

    <script>
    (function(){
      var API = '/api/comments';
      var slug = '${slug}';

      function timeAgo(iso) {
        var d = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (d < 60) return 'just now';
        if (d < 3600) return Math.floor(d/60) + ' min ago';
        if (d < 86400) return Math.floor(d/3600) + ' hr ago';
        if (d < 2592000) return Math.floor(d/86400) + ' days ago';
        return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      }

      function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

      function loadComments(){
        fetch(API + '?slug=' + encodeURIComponent(slug))
          .then(function(r){return r.json();})
          .then(function(d){
            var el = document.getElementById('nwm-comment-list');
            if (!el) return;
            if (!d.comments || d.comments.length === 0){
              el.innerHTML = '<p style="color:#9ca3af;font-size:14px;font-style:italic;">No comments yet — be the first!</p>';
              return;
            }
            el.innerHTML = d.comments.map(function(c){
              return '<div style="display:flex;gap:14px;padding:18px 0;border-bottom:1px solid #f3f4f6;">'
                + '<div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:#010F3B;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;font-size:16px;font-weight:800;color:#FF671F;">'
                + esc(c.name.charAt(0).toUpperCase())
                + '</div>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;">'
                + '<strong style="font-size:14px;font-weight:700;color:#111827;font-family:Poppins,sans-serif;">' + esc(c.name) + '</strong>'
                + '<span style="font-size:12px;color:#9ca3af;">' + timeAgo(c.created_at) + '</span>'
                + '</div>'
                + '<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">' + esc(c.comment).replace(/\n/g,'<br>') + '</p>'
                + '</div></div>';
            }).join('');
          })
          .catch(function(){});
      }

      window.nwmSubmitComment = function(e, slug){
        e.preventDefault();
        var btn = document.getElementById('nwm-c-btn');
        var msg = document.getElementById('nwm-c-msg');
        var hp  = e.target.querySelector('[name="hp_field"]').value;
        var name    = document.getElementById('nwm-c-name').value.trim();
        var email   = document.getElementById('nwm-c-email').value.trim();
        var comment = document.getElementById('nwm-c-comment').value.trim();
        btn.disabled = true;
        btn.textContent = 'Posting…';
        msg.textContent = '';
        fetch(API, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({slug:slug, name:name, email:email, comment:comment, hp_field:hp})
        })
        .then(function(r){return r.json();})
        .then(function(d){
          if (d.ok){
            msg.style.color = '#16a34a';
            msg.textContent = 'Comment posted!';
            document.getElementById('nwm-c-name').value = '';
            document.getElementById('nwm-c-email').value = '';
            document.getElementById('nwm-c-comment').value = '';
            loadComments();
          } else {
            msg.style.color = '#dc2626';
            msg.textContent = d.error || 'Something went wrong. Please try again.';
          }
          btn.disabled = false;
          btn.textContent = 'Post comment';
        })
        .catch(function(){
          msg.style.color = '#dc2626';
          msg.textContent = 'Network error. Please try again.';
          btn.disabled = false;
          btn.textContent = 'Post comment';
        });
      };

      loadComments();
    })();
    </script>
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
  (_, g1, g2) => g1 + '\n' + cardsHtml + g2
);
fs.writeFileSync('blog.html', blogHtml);
console.log(`Rebuilt blog.html with ${cards.length} cards.`);

/* Cron example (runs nightly at 09:00 server time, publishes up to 20):
     0 9 * * *  cd /path/to/NetWebMedia && /usr/bin/node _deploy/generate-blogs.js --limit 20
*/

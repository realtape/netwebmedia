// _deploy/generate-lp-guides.js
// Generates:
//   /lp/{slug}.html        — conversion landing page per guide
//   /guides/{slug}.html    — print-optimised guide (puppeteer → PDF in CI)
// Source: _deploy/guides-queue/{slug}.json
//
// Usage:
//   node _deploy/generate-lp-guides.js             # process all pending
//   node _deploy/generate-lp-guides.js --limit 5   # process up to 5
//   node _deploy/generate-lp-guides.js --all       # re-process _published too

const fs   = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const QUEUE_DIR     = path.join('_deploy', 'guides-queue');
const PUBLISHED_DIR = path.join(QUEUE_DIR, '_published');
const LP_DIR        = 'lp';
const GUIDES_DIR    = 'guides';

[PUBLISHED_DIR, LP_DIR, GUIDES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const limitArg  = process.argv.indexOf('--limit');
const LIMIT     = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const REPROCESS = process.argv.includes('--all');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Landing page ──────────────────────────────────────────────────────────
function renderLandingPage(g) {
  const pdfPath = `/assets/guides/${g.slug}.pdf`;
  const guideUrl = `https://netwebmedia.com/lp/${g.slug}.html`;

  const takeawaysHtml = (g.takeaways || [])
    .map(t => `<li>${esc(t)}</li>`).join('\n          ');

  const sectionCardsHtml = (g.sections || [])
    .slice(0, 8)
    .map((s, i) => `
      <div class="lp-section-card">
        <div class="lp-section-num">Section ${i + 1}</div>
        <h3>${esc(s.h2 || s.title || '')}</h3>
        <p>${esc(s.preview || (s.content || '').slice(0, 120) + '…')}</p>
      </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(g.guideTitle)} — Free Guide | NetWebMedia</title>
  <meta name="description" content="${esc(g.guideSubtitle || g.guideTitle)}" />
  <link rel="canonical" href="${guideUrl}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="${esc(g.guideTitle)}" />
  <meta property="og:description" content="${esc(g.guideSubtitle || '')}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${guideUrl}" />
  <meta property="og:site_name" content="NetWebMedia" />
  <link rel="stylesheet" href="../css/styles.css" />
  <link rel="stylesheet" href="../css/lp.css" />
  <link rel="icon" type="image/svg+xml" href="../assets/nwm-logo.svg" />
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
    <a href="../blog.html">Blog</a>
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

<!-- HERO -->
<section class="lp-hero">
  <div class="container lp-hero-inner">
    <div class="lp-hero-copy">
      <div class="tag">${esc(g.tag || 'Free Guide')}</div>
      <h1>${esc(g.guideTitle)}</h1>
      <p class="lp-subtitle">${esc(g.guideSubtitle || '')}</p>
      <ul class="lp-takeaways">
        ${takeawaysHtml}
      </ul>
      <a href="${pdfPath}" class="lp-download-btn" download>
        ↓ Download Free Guide (PDF)
      </a>
      <p class="lp-meta">${esc(g.pageCount || '10+ pages')} · By ${esc(g.author)} · Free download</p>
    </div>
    <div class="lp-guide-mockup" aria-hidden="true">
      <div class="lp-mockup-cover">
        <div class="lp-mockup-nwm">NetWebMedia</div>
        <div>
          <div class="lp-mockup-tag">${esc(g.tag || 'Guide')}</div>
          <div class="lp-mockup-title">${esc(g.guideTitle)}</div>
        </div>
        <div class="lp-mockup-author">By ${esc(g.author)}</div>
      </div>
    </div>
  </div>
</section>

<!-- WHAT'S INSIDE -->
<section class="lp-inside">
  <div class="container">
    <h2>What's inside</h2>
    <p class="lp-inside-sub">A practical playbook built for ${esc(g.audience || 'marketing teams')}</p>
    <div class="lp-sections-grid">
      ${sectionCardsHtml}
    </div>
  </div>
</section>

<!-- DOWNLOAD STRIP -->
<section class="lp-download-strip">
  <div class="container">
    <h2>Get the full guide — free</h2>
    <p>${esc(g.guideSubtitle || 'Download the complete PDF and start applying it today.')}</p>
    <a href="${pdfPath}" class="lp-download-btn" download>↓ Download PDF Now</a>
  </div>
</section>

<!-- NWM PITCH -->
<section class="lp-nwm-pitch">
  <div class="container lp-nwm-pitch-inner">
    <div>
      <h2>Want this running inside your stack?</h2>
      <p>NetWebMedia builds AI marketing systems for US brands — from autonomous content engines to full-funnel AI automation. We don't just write guides. We implement what's in them.</p>
      <ul class="lp-services-list">
        <li>AI Marketing Automation</li>
        <li>AEO &amp; AI-First SEO</li>
        <li>Autonomous AI Agents</li>
        <li>Paid Media + AI Creative</li>
      </ul>
      <a href="../contact.html" class="btn-primary">Book a Free 30-Min Strategy Call →</a>
    </div>
    <div class="lp-nwm-stat-box">
      <div class="lp-stat">
        <div class="lp-stat-num">3.2×</div>
        <div class="lp-stat-label">Average pipeline increase for clients in their first 6 months</div>
      </div>
      <div class="lp-stat">
        <div class="lp-stat-num">47%</div>
        <div class="lp-stat-label">Average reduction in cost-per-lead after AI automation implementation</div>
      </div>
      <div class="lp-stat">
        <div class="lp-stat-num">90 days</div>
        <div class="lp-stat-label">Typical time to first measurable ROI on AI marketing systems</div>
      </div>
    </div>
  </div>
</section>
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
</html>`;
}

// ─── Guide HTML (print-optimized, → PDF) ──────────────────────────────────
function renderGuideHtml(g) {
  function sectionHtml(s, idx) {
    let html = `
<div class="guide-section">
  <div class="guide-section-header">
    <div class="guide-section-num">Section ${idx + 1}</div>
    <h2>${esc(s.h2 || s.title || '')}</h2>
  </div>`;

    if (s.content)  html += `<p>${s.content}</p>`;
    if (s.content2) html += `<p>${s.content2}</p>`;
    if (s.content3) html += `<p>${s.content3}</p>`;

    if (s.h3) html += `<h3>${esc(s.h3)}</h3>`;

    if (s.list) {
      html += '<ul>' + s.list.map(li => `<li>${li}</li>`).join('') + '</ul>';
    }
    if (s.olist) {
      html += '<ol>' + s.olist.map(li => `<li>${li}</li>`).join('') + '</ol>';
    }
    if (s.steps) {
      html += '<div class="guide-steps">' +
        s.steps.map((st, i) => `
          <div class="guide-step">
            <div class="guide-step-num">${i + 1}</div>
            <div class="guide-step-body">
              <h4>${esc(st.title || st)}</h4>
              ${st.body ? `<p>${esc(st.body)}</p>` : ''}
            </div>
          </div>`).join('') +
        '</div>';
    }
    if (s.callout) {
      html += `<div class="guide-callout"><p>${esc(s.callout)}</p></div>`;
    }
    if (s.stat) {
      html += `<div class="guide-stat-box">
        <div class="guide-stat-num">${esc(s.stat.num)}</div>
        <div class="guide-stat-label">${esc(s.stat.label)}</div>
      </div>`;
    }
    if (s.content4) html += `<p>${s.content4}</p>`;
    if (s.content5) html += `<p>${s.content5}</p>`;

    html += '\n  <div class="guide-footer"><span class="guide-footer-brand">NetWebMedia</span><span class="guide-footer-url">netwebmedia.com</span></div>\n</div>';
    return html;
  }

  const tocItems = (g.sections || []).map((s, i) => `
    <div class="toc-item">
      <span class="toc-item-title">${esc(s.h2 || s.title || `Section ${i + 1}`)}</span>
      <span class="toc-item-desc">${esc(s.preview || (s.content || '').slice(0, 80) + '…')}</span>
    </div>`).join('\n');

  const checklistHtml = g.checklist ? `
<div class="guide-checklist">
  <h2>${esc(g.checklist.title || 'Implementation Checklist')}</h2>
  ${(g.checklist.groups || []).map(grp => `
  <div class="checklist-group">
    <h3>${esc(grp.title)}</h3>
    ${grp.items.map(item => `
    <div class="checklist-item">
      <div class="checklist-box"></div>
      <span>${esc(item)}</span>
    </div>`).join('')}
  </div>`).join('')}
  <div class="guide-footer"><span class="guide-footer-brand">NetWebMedia</span><span class="guide-footer-url">netwebmedia.com</span></div>
</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(g.guideTitle)} — NetWebMedia Guide</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="../css/guide.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@700;800&display=swap" rel="stylesheet">
</head>
<body class="guide-body">

<!-- COVER -->
<div class="guide-cover">
  <div class="guide-cover-top">
    <div class="guide-cover-nwm">NetWebMedia</div>
    <div class="guide-cover-year">2026</div>
  </div>
  <div class="guide-cover-body">
    <div class="guide-cover-tag">${esc(g.tag || 'Guide')}</div>
    <h1 class="guide-cover-title">${esc(g.guideTitle)}</h1>
    <p class="guide-cover-subtitle">${esc(g.guideSubtitle || '')}</p>
  </div>
  <div class="guide-cover-bottom">
    <div class="guide-cover-author">
      <strong>${esc(g.author)}</strong>
      ${esc(g.authorRole || 'NetWebMedia')}
    </div>
    <div class="guide-cover-meta">
      ${esc(g.pageCount || '12 pages')}<br>
      netwebmedia.com
    </div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="guide-toc">
  <div class="guide-toc-header"><h2>Contents</h2></div>
  ${tocItems}
  <div class="guide-footer"><span class="guide-footer-brand">NetWebMedia</span><span class="guide-footer-url">netwebmedia.com</span></div>
</div>

<!-- EXECUTIVE SUMMARY -->
<div class="guide-exec-summary">
  <div class="guide-exec-tag">Executive Summary</div>
  <h2>${esc(g.guideTitle)}</h2>
  <p>${esc(g.intro || '')}</p>
  <div class="guide-takeaways-box">
    <h3>In this guide</h3>
    <ul>
      ${(g.takeaways || []).map(t => `<li>${esc(t)}</li>`).join('\n      ')}
    </ul>
  </div>
  ${g.audience ? `<p><strong>Who this is for:</strong> ${esc(g.audience)}</p>` : ''}
  <div class="guide-footer"><span class="guide-footer-brand">NetWebMedia</span><span class="guide-footer-url">netwebmedia.com</span></div>
</div>

<!-- CONTENT SECTIONS -->
${(g.sections || []).map((s, i) => sectionHtml(s, i)).join('\n')}

<!-- CHECKLIST -->
${checklistHtml}

<!-- NWM CTA PAGE -->
<div class="guide-nwm-page">
  <div class="nwm-logo">NetWebMedia</div>
  <h2>${esc(g.nwmSection?.headline || 'Want this working inside your stack?')}</h2>
  <p>${esc(g.nwmSection?.body || 'NetWebMedia builds AI marketing systems for US brands. We implement what this guide covers — from autonomous agents to full-funnel AI content engines.')}</p>
  <div class="guide-nwm-services">
    <span class="guide-nwm-service">AI Marketing Automation</span>
    <span class="guide-nwm-service">AEO &amp; AI-First SEO</span>
    <span class="guide-nwm-service">Autonomous AI Agents</span>
    <span class="guide-nwm-service">Paid Media + AI Creative</span>
    <span class="guide-nwm-service">CRM + AI Workflows</span>
  </div>
  <div class="guide-cta-url">netwebmedia.com/contact</div>
</div>

</body>
</html>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────
if (!fs.existsSync(QUEUE_DIR)) {
  console.log('No guides-queue dir found:', QUEUE_DIR);
  process.exit(0);
}

let sources = fs.readdirSync(QUEUE_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

if (REPROCESS) {
  const published = fs.readdirSync(PUBLISHED_DIR).filter(f => f.endsWith('.json'));
  sources = [...sources, ...published.map(f => path.join('_published', f))];
}

let rendered = 0;
for (const f of sources) {
  if (rendered >= LIMIT) break;
  const srcPath = path.join(QUEUE_DIR, f);
  const guide   = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

  fs.writeFileSync(path.join(LP_DIR,     guide.slug + '.html'), renderLandingPage(guide));
  fs.writeFileSync(path.join(GUIDES_DIR, guide.slug + '.html'), renderGuideHtml(guide));

  if (!f.startsWith('_published')) {
    fs.renameSync(srcPath, path.join(PUBLISHED_DIR, path.basename(f)));
  }

  rendered++;
  console.log('+', guide.slug);
}
console.log(`Rendered ${rendered} guide(s). LP → /lp/  Guide → /guides/`);

// Renders Carlos Test's full email nurture sequence by combining _base.html
// with each template's EN body, substituting personalization tokens, and
// writing standalone HTML files. Then Puppeteer screenshots each one.
//
// Sequences captured (the full experience for a Free CRM signup interested
// in Fractional CMO, with niche=wine_agriculture):
//   1. welcome-1   ·  T+5 min   ·  account live
//   2. welcome-2   ·  T+3 days  ·  10-minute first win
//   3. welcome-3   ·  T+7 days  ·  meet the 5 AI Agents
//   4. wine_agriculture-plan-1  ·  niche +5 min  ·  growth plan being crafted
//   5. wine_agriculture-plan-2  ·  niche +2 hr   ·  3 growth levers
//   6. wine_agriculture-plan-3  ·  niche +2 day  ·  did the plan land?
//   7. aeo-brief-001-launch     ·  next Tuesday  ·  ChatGPT cites FAQs 3.2x
//
// Usage: node docs/client-onboarding-guide/render-emails.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..');
const TPL_DIR = path.join(ROOT, 'email-templates');
const OUT_DIR = path.join(__dirname, 'emails-rendered');
const SHOT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CARLOS = {
  first_name: 'Carlos',
  business_name: 'Chile Spirits',
  email: 'carlos@chilespirits.com',
};

// The canonical sequence — order matches the chronological journey.
const EMAILS = [
  {
    id: 'email-01-welcome-1',
    label: 'welcome-1',
    when: 'T + 5 minutes',
    when_short: 'Day 0',
    subject: 'Your NetWebMedia account is live',
    preview: '7 hubs, 46 modules, one login — start here',
    template: 'welcome-1.html',
    niche: false,
    primary_url: 'https://netwebmedia.com/crm',
    primary_cta: 'Open my dashboard',
  },
  {
    id: 'email-02-welcome-2',
    label: 'welcome-2',
    when: 'T + 3 days',
    when_short: 'Day 3',
    subject: 'Your 10-minute first win on the platform',
    preview: 'Contacts + Pipeline + Automations, done in ten',
    template: 'welcome-2.html',
    niche: false,
    primary_url: 'https://netwebmedia.com/crm-vanilla/contacts.html',
    primary_cta: 'Start with Contacts',
  },
  {
    id: 'email-03-welcome-3',
    label: 'welcome-3',
    when: 'T + 7 days',
    when_short: 'Day 7',
    subject: 'Meet the 5 AI Agents in your account',
    preview: 'Copilot, SDR, Voice AI, Video Factory, Content AI',
    template: 'welcome-3.html',
    niche: false,
    primary_url: 'https://netwebmedia.com/crm-vanilla/',
    primary_cta: 'Launch AI Copilot',
  },
  {
    id: 'email-04-wine-plan-1',
    label: 'wine_agriculture-plan-1',
    when: 'T + 14 days (niche trigger)',
    when_short: 'Day 14',
    subject: 'Your winery growth plan is being crafted, Carlos',
    preview: 'DTC, club retention, digital export — analyzed for your winery',
    template: 'niche/wine_agriculture-plan-1.html',
    niche: true,
    primary_url: 'https://netwebmedia.com/whatsapp.html?topic=wine-growth-plan',
    primary_cta: 'Send the plan on WhatsApp',
  },
  {
    id: 'email-05-wine-plan-2',
    label: 'wine_agriculture-plan-2',
    when: 'T + 14 days, +2 hours',
    when_short: 'Day 14',
    subject: '3 growth levers for your winery or vineyard, Carlos',
    preview: 'DTC, wine club, export — the three levers that move the needle',
    template: 'niche/wine_agriculture-plan-2.html',
    niche: true,
    primary_url: 'https://netwebmedia.com/industries/wine-agriculture/',
    primary_cta: 'See the full playbook',
  },
  {
    id: 'email-06-wine-plan-3',
    label: 'wine_agriculture-plan-3',
    when: 'T + 16 days',
    when_short: 'Day 16',
    subject: 'Did the winery growth plan land, Carlos?',
    preview: 'Open invitation — 15-min call, no pressure',
    template: 'niche/wine_agriculture-plan-3.html',
    niche: true,
    primary_url: 'https://netwebmedia.com/contact.html?topic=wine-growth&source=plan-3',
    primary_cta: 'Yes, let\'s talk',
  },
  {
    id: 'email-07-aeo-brief-001',
    label: 'aeo-brief-001',
    when: 'Next Tuesday after signup, 9am Santiago',
    when_short: 'Tue 9am',
    subject: 'ChatGPT now cites FAQs 3.2x more than text',
    preview: 'One observation, one action. 60 seconds. Every Tuesday.',
    template: 'aeo-brief-001-launch.html',
    niche: false,
    primary_url: 'https://netwebmedia.com/aeo-index.html?utm_source=aeo-brief',
    primary_cta: 'Score your AEO Citation Index',
  },
];

function readBase() {
  return fs.readFileSync(path.join(TPL_DIR, '_base.html'), 'utf8');
}

function readTemplate(rel) {
  return fs.readFileSync(path.join(TPL_DIR, rel), 'utf8');
}

function extractEN(tpl) {
  // Find content between LANG:EN and LANG:ES markers
  const en = tpl.indexOf('LANG:EN');
  const es = tpl.indexOf('LANG:ES');
  if (en === -1) return tpl; // no language split; use as-is
  const start = tpl.indexOf('-->', en) + 3;
  const end = es === -1 ? tpl.length : tpl.lastIndexOf('<!--', es);
  return tpl.slice(start, end).trim();
}

function substitute(html, tokens) {
  // Replace {{token|fallback}} and {{token}}
  return html.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [name, fallback] = expr.split('|').map(s => s.trim());
    if (Object.prototype.hasOwnProperty.call(tokens, name)) return tokens[name];
    return fallback ?? '';
  });
}

function renderEmail(email) {
  const base = readBase();
  const tpl = readTemplate(email.template);
  const en = extractEN(tpl);
  const tokens = {
    first_name: CARLOS.first_name,
    business_name: CARLOS.business_name,
    email: CARLOS.email,
    primary_url: email.primary_url,
    primary_cta_en: email.primary_cta,
    primary_cta_es: email.primary_cta,
    subject: email.subject,
    lang: 'en',
    preference_url: 'https://netwebmedia.com/api/public/email/preferences?token=test',
    unsubscribe_url: 'https://netwebmedia.com/api/public/email/unsubscribe?token=test',
  };
  const content = substitute(en, tokens);
  const html = substitute(base, { ...tokens, CONTENT: content })
    .replace('{{CONTENT}}', content); // belt + suspenders in case CONTENT was eaten by escape

  const dest = path.join(OUT_DIR, email.id + '.html');
  fs.writeFileSync(dest, html);
  return dest;
}

(async () => {
  // Render every email to HTML on disk.
  for (const e of EMAILS) {
    const dest = renderEmail(e);
    console.log(`Rendered ${e.id} -> ${path.relative(ROOT, dest)}`);
  }

  // Now screenshot each rendered HTML.
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
    defaultViewport: { width: 720, height: 1000, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();

  for (const e of EMAILS) {
    const url = 'file:///' + path.join(OUT_DIR, e.id + '.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Add a small inset around the email so the shadow is visible.
    await page.evaluate(() => {
      // Suppress site chat widget if it tries to load via the relative script.
      const s = document.querySelector('script[src*="nwm-site-chat"]');
      if (s) s.remove();
      document.body.style.padding = '0';
    });
    await new Promise(r => setTimeout(r, 200));

    // Auto-size viewport to the email height so we capture the whole message.
    const height = await page.evaluate(() => Math.min(document.body.scrollHeight + 40, 4000));
    await page.setViewport({ width: 720, height, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 150));

    const dest = path.join(SHOT_DIR, e.id + '.png');
    await page.screenshot({ path: dest, fullPage: false, type: 'png' });
    console.log(`Shot   ${e.id}.png  (${height}px tall)`);
  }

  await browser.close();
  console.log(`\nDone. ${EMAILS.length} emails rendered + screenshotted.`);
})();

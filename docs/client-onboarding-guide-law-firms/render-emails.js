// Renders Sarah Test's full law-firms nurture sequence.
// 7 emails: welcome 1-3 + law_firms-plan 1-3 + AEO brief #001.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..');
const TPL_DIR = path.join(ROOT, 'email-templates');
const OUT_DIR = path.join(__dirname, 'emails-rendered');
const SHOT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SARAH = {
  first_name: 'Sarah',
  business_name: 'Test Law Group',
  email: 'sarah@testlawgroup.com',
};

const EMAILS = [
  {
    id: 'email-01-welcome-1',
    label: 'welcome-1',
    when: 'T + 5 minutes',
    subject: 'Your NetWebMedia account is live',
    preview: '7 hubs, 46 modules, one login — start here',
    template: 'welcome-1.html',
    primary_url: 'https://netwebmedia.com/crm',
    primary_cta: 'Open my dashboard',
  },
  {
    id: 'email-02-welcome-2',
    label: 'welcome-2',
    when: 'T + 3 days',
    subject: 'Your 10-minute first win on the platform',
    preview: 'Contacts + Pipeline + Automations, done in ten',
    template: 'welcome-2.html',
    primary_url: 'https://netwebmedia.com/crm-vanilla/contacts.html',
    primary_cta: 'Start with Contacts',
  },
  {
    id: 'email-03-welcome-3',
    label: 'welcome-3',
    when: 'T + 7 days',
    subject: 'Meet the 5 AI Agents in your account',
    preview: 'Copilot, SDR, Voice AI, Video Factory, Content AI',
    template: 'welcome-3.html',
    primary_url: 'https://netwebmedia.com/crm-vanilla/',
    primary_cta: 'Launch AI Copilot',
  },
  {
    id: 'email-04-law-firms-plan-1',
    label: 'law_firms-plan-1',
    when: 'T + 14 days (niche trigger)',
    subject: 'Your law firm growth plan is being crafted, Sarah',
    preview: 'AEO citations, practice-area depth, intake — analyzed for your firm',
    template: 'niche/law_firms-plan-1.html',
    primary_url: 'https://netwebmedia.com/whatsapp.html?topic=law-firm-growth',
    primary_cta: 'Send the plan on WhatsApp',
  },
  {
    id: 'email-05-law-firms-plan-2',
    label: 'law_firms-plan-2',
    when: 'T + 14 days, +2 hours',
    subject: '3 growth levers for your law firm, Sarah',
    preview: 'Practice-area content, AEO citation, intake automation',
    template: 'niche/law_firms-plan-2.html',
    primary_url: 'https://netwebmedia.com/industries/legal-services/',
    primary_cta: 'See the full playbook',
  },
  {
    id: 'email-06-law-firms-plan-3',
    label: 'law_firms-plan-3',
    when: 'T + 16 days',
    subject: 'Did the law firm growth plan land, Sarah?',
    preview: 'Open invitation — 15-min call, no pressure',
    template: 'niche/law_firms-plan-3.html',
    primary_url: 'https://netwebmedia.com/contact.html?topic=law-firm-growth&source=plan-3',
    primary_cta: 'Yes, let\'s talk',
  },
  {
    id: 'email-07-aeo-brief-001',
    label: 'aeo-brief-001',
    when: 'Next Tuesday after signup, 9am Santiago',
    subject: 'ChatGPT now cites FAQs 3.2x more than text',
    preview: 'One observation, one action. 60 seconds. Every Tuesday.',
    template: 'aeo-brief-001-launch.html',
    primary_url: 'https://netwebmedia.com/aeo-index.html?utm_source=aeo-brief',
    primary_cta: 'Score your AEO Citation Index',
  },
];

function readBase() { return fs.readFileSync(path.join(TPL_DIR, '_base.html'), 'utf8'); }
function readTemplate(rel) { return fs.readFileSync(path.join(TPL_DIR, rel), 'utf8'); }

function extractEN(tpl) {
  const en = tpl.indexOf('LANG:EN');
  const es = tpl.indexOf('LANG:ES');
  if (en === -1) return tpl;
  const start = tpl.indexOf('-->', en) + 3;
  const end = es === -1 ? tpl.length : tpl.lastIndexOf('<!--', es);
  return tpl.slice(start, end).trim();
}

function substitute(html, tokens) {
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
    first_name: SARAH.first_name,
    business_name: SARAH.business_name,
    email: SARAH.email,
    primary_url: email.primary_url,
    primary_cta_en: email.primary_cta,
    primary_cta_es: email.primary_cta,
    subject: email.subject,
    lang: 'en',
    preference_url: 'https://netwebmedia.com/api/public/email/preferences?token=test',
    unsubscribe_url: 'https://netwebmedia.com/api/public/email/unsubscribe?token=test',
  };
  const content = substitute(en, tokens);
  const html = substitute(base, { ...tokens, CONTENT: content }).replace('{{CONTENT}}', content);
  const dest = path.join(OUT_DIR, email.id + '.html');
  fs.writeFileSync(dest, html);
  return dest;
}

(async () => {
  for (const e of EMAILS) {
    const dest = renderEmail(e);
    console.log(`Rendered ${e.id} -> ${path.relative(ROOT, dest)}`);
  }
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
    defaultViewport: { width: 720, height: 1000, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  for (const e of EMAILS) {
    const url = 'file:///' + path.join(OUT_DIR, e.id + '.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const s = document.querySelector('script[src*="nwm-site-chat"]');
      if (s) s.remove();
      document.body.style.padding = '0';
    });
    await new Promise(r => setTimeout(r, 200));
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

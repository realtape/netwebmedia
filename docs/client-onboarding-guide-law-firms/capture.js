// Puppeteer-driven screenshot capture — Law Firms edition.
// Test user: Sarah Test (sarah@testlawgroup.com) for Test Law Group.
// Niche: law_firms · Industry slug: legal-services · Subdomain candidates: law-firms, attorneys
//
// This run is MORE comprehensive than the wine_agriculture edition:
//   - 35 product screens (vs. 27 last time)
//   - Adds Sites/CMS module, Email Builder, Forms, SMS, Tasks, Payments, A/B Tests,
//     Campaigns, Diagnostic, Booking, Reputation, Social Connect
//   - Captures the /industries/legal-services/ public hub
//
// Usage: node docs/client-onboarding-guide-law-firms/capture.js
// Server: http://127.0.0.1:8083 (via .claude/launch.json "netwebmedia")

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TEST_USER = {
  name: 'Sarah Test',
  email: 'sarah@testlawgroup.com',
  password: 'TestLaw2026!',
  org_slug: 'test-law-group',
  org_name: 'Test Law Group',
  niche: 'law_firms',
};

const SCREENS = [
  // 1. Public site — discovery path for a law firm prospect
  { id: '01-homepage-hero',           url: '/index.html' },
  { id: '02-homepage-cmo-tiers',      url: '/index.html', scrollTo: 1800 },
  { id: '03-industries-legal',        url: '/industries/legal-services/' },
  { id: '04-industries-legal-resources', url: '/industries/legal-services/', scrollTo: 1400 },
  { id: '05-services-cmo',            url: '/services.html', scrollTo: 1100 },
  { id: '06-pricing-cmo-tiers',       url: '/pricing.html', scrollTo: 600 },
  { id: '07-pricing-cmo-standard',    url: '/pricing.html', scrollTo: 1400 },

  // 2. Registration
  { id: '08-register-free',           url: '/register.html?plan=free', authState: 'logged-out' },
  { id: '09-register-filled',         url: '/register.html?plan=free', action: 'fill-register', authState: 'logged-out' },

  // 3. Login + app shell
  { id: '10-app-login',               url: '/login.html', authState: 'logged-out' },
  { id: '11-crm-login',               url: '/crm-vanilla/login.html', authState: 'logged-out' },

  // 4. First-run niche picker (Sarah selects Law Firms)
  { id: '12-firstrun-niche',          url: '/crm-vanilla/index.html', nicheState: 'firstrun' },

  // 5. Core CRM modules (after niche selection — law_firms-configured)
  { id: '13-crm-dashboard',           url: '/crm-vanilla/index.html' },
  { id: '14-crm-contacts',            url: '/crm-vanilla/contacts.html' },
  { id: '15-crm-pipeline',            url: '/crm-vanilla/pipeline.html' },
  { id: '16-crm-conversations',       url: '/crm-vanilla/conversations.html' },
  { id: '17-crm-tasks',               url: '/crm-vanilla/tasks.html' },
  { id: '18-crm-calendar',            url: '/crm-vanilla/calendar.html' },
  { id: '19-crm-booking',             url: '/crm-vanilla/booking.html' },
  { id: '20-crm-sms',                 url: '/crm-vanilla/sms.html' },

  // 6. Marketing modules
  { id: '21-crm-campaigns',           url: '/crm-vanilla/campaigns.html' },
  { id: '22-crm-marketing',           url: '/crm-vanilla/marketing.html' },
  { id: '23-crm-email-builder',       url: '/crm-vanilla/email-builder.html' },
  { id: '24-crm-forms',               url: '/crm-vanilla/forms.html' },

  // 7. CMS / Sites — the headline of this walkthrough
  { id: '25-crm-sites-cms',           url: '/crm-vanilla/sites.html' },

  // 8. Growth / automation modules
  { id: '26-crm-automation',          url: '/crm-vanilla/automation.html' },
  { id: '27-crm-abtests',             url: '/crm-vanilla/abtests.html' },
  { id: '28-crm-social',              url: '/crm-vanilla/social.html' },
  { id: '29-crm-reputation',          url: '/crm-vanilla/reputation.html' },

  // 9. Service + admin modules
  { id: '30-crm-courses',             url: '/crm-vanilla/courses.html' },
  { id: '31-crm-documents',           url: '/crm-vanilla/documents.html' },
  { id: '32-crm-payments',            url: '/crm-vanilla/payments.html' },
  { id: '33-crm-reporting',           url: '/crm-vanilla/reporting.html' },
  { id: '34-crm-diagnostic',          url: '/crm-vanilla/diagnostic.html' },
  { id: '35-crm-settings',            url: '/crm-vanilla/settings.html' },

  // 10. CMO upgrade path
  { id: '36-whatsapp-handoff',        url: '/whatsapp.html?topic=fractional-cmo' },
  { id: '37-contact-cmo',             url: '/contact.html' },
  { id: '38-thanks',                  url: '/thanks.html' },
];

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
  });

  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORT);

  // Stub PHP API responses so empty-state UI renders.
  await page.evaluateOnNewDocument(() => {
    const isApi = (u) => !!u && (
      /\/api(?:-php)?\//.test(u) ||
      /\/crm-vanilla\/api\//.test(u) ||
      /api\/index\.php/.test(u) ||
      /\.php(\?|$)/.test(u)
    );
    const realFetch = window.fetch;
    window.fetch = function (resource, init) {
      const u = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      if (isApi(u)) {
        let body = { ok: true, data: [], items: [], results: [], total: 0, count: 0 };
        if (/dashboard|overview|stats|metrics/i.test(u)) {
          body = {
            ok: true,
            revenue: { current: 0, previous: 0, delta_pct: 0 },
            deals: [], schedule: [], contacts: [],
            counts: { contacts: 0, deals: 0, tasks: 0 }
          };
        }
        return Promise.resolve(new Response(JSON.stringify(body), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        }));
      }
      return realFetch.apply(this, arguments);
    };
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const realOpen = xhr.open;
      let stub = false;
      xhr.open = function (method, url) {
        stub = isApi(url);
        return realOpen.apply(xhr, arguments);
      };
      const realSend = xhr.send;
      xhr.send = function () {
        if (stub) {
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
            Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{"ok":true,"data":[],"items":[]}', configurable: true });
            xhr.onreadystatechange && xhr.onreadystatechange();
            xhr.onload && xhr.onload();
          }, 0);
          return;
        }
        return realSend.apply(xhr, arguments);
      };
      return xhr;
    };
  });

  // Pre-seed localStorage on origin.
  await page.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    try {
      localStorage.setItem('nwm_cookie_consent', 'all');
      localStorage.setItem('nwm_token', 'demo-token-' + Date.now());
      localStorage.setItem('nwm_user', JSON.stringify({
        id: 1001, name: user.name, email: user.email,
        organization: { id: 1001, slug: user.org_slug, name: user.org_name },
        plan: 'free', role: 'owner', niche: user.niche,
      }));
    } catch (e) {}
  }, TEST_USER);

  const results = [];

  for (const s of SCREENS) {
    const dest = path.join(OUT_DIR, s.id + '.png');

    await page.evaluate((user, firstrun, loggedOut) => {
      try {
        localStorage.setItem('nwm_cookie_consent', 'all');
        if (loggedOut) {
          localStorage.removeItem('nwm_token');
          localStorage.removeItem('nwm_user');
          localStorage.removeItem('nwm_niche_picker_dismissed');
        } else {
          const niche = firstrun ? null : user.niche;
          if (firstrun) localStorage.removeItem('nwm_niche_picker_dismissed');
          else localStorage.setItem('nwm_niche_picker_dismissed', '1');
          localStorage.setItem('nwm_token', 'demo-token-' + Date.now());
          localStorage.setItem('nwm_user', JSON.stringify({
            id: 1001, name: user.name, email: user.email,
            organization: { id: 1001, slug: user.org_slug, name: user.org_name },
            plan: 'free', role: 'owner', niche: niche,
          }));
        }
      } catch (e) {}
    }, TEST_USER, s.nicheState === 'firstrun', s.authState === 'logged-out');

    try {
      await page.goto(ORIGIN + s.url, { waitUntil: 'networkidle2', timeout: 20000 });
    } catch (e) {
      try { await page.goto(ORIGIN + s.url, { waitUntil: 'domcontentloaded', timeout: 10000 }); }
      catch (e2) { results.push({ id: s.id, status: 'navigation-failed', error: e2.message }); continue; }
    }

    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget, [id*="chat-widget"]').forEach(el => el.style.display = 'none');
      window.__nwm_screenshot_mode = true;
    });

    if (s.url.startsWith('/crm-vanilla/') || s.url.startsWith('/app/')) {
      try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => {
        const banner = document.getElementById('nwm-cookie-banner');
        if (banner) banner.remove();
      });
    }

    await new Promise(r => setTimeout(r, 600));

    if (s.action === 'fill-register') {
      try {
        await page.type('#name', TEST_USER.name, { delay: 30 });
        await page.type('#email', TEST_USER.email, { delay: 30 });
        await page.type('#password', TEST_USER.password, { delay: 30 });
        await page.click('#consent').catch(() => {});
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {}
    }

    if (typeof s.scrollTo === 'number') {
      await page.evaluate((y) => window.scrollTo(0, y), s.scrollTo);
      await new Promise(r => setTimeout(r, 300));
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Final banner cleanup.
    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    });

    try {
      await page.screenshot({ path: dest, fullPage: false, type: 'png' });
      const sz = fs.statSync(dest).size;
      results.push({ id: s.id, status: 'ok', size: sz, url: s.url });
      console.log(`OK ${s.id} ${sz} bytes (${s.url})`);
    } catch (e) {
      results.push({ id: s.id, status: 'screenshot-failed', error: e.message });
      console.log(`FAIL ${s.id} ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, '_manifest.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length} screenshots saved to ${OUT_DIR}`);
})();

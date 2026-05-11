// Puppeteer-driven screenshot capture for the NetWebMedia client onboarding guide.
// Walks the same path a brand-new client (Carlos Test, carlos@chilespirits.com)
// would take: homepage -> services -> pricing -> register -> app/CRM modules.
//
// Usage: node docs/client-onboarding-guide/capture.js
// Server expected at http://127.0.0.1:8083 (via .claude/launch.json "netwebmedia").

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TEST_USER = {
  name: 'Carlos Test',
  email: 'carlos@chilespirits.com',
  password: 'TestUser2026!',
};

// One screen per object. Order matches the guide narrative.
// `nicheState` = 'firstrun' to capture the industry-picker modal, otherwise the modal is dismissed.
const SCREENS = [
  // 1. Public site - Fractional CMO discovery
  { id: '01-homepage-hero',           url: '/index.html' },
  { id: '02-homepage-cmo-section',    url: '/index.html', scrollTo: 1800 },
  { id: '03-services',                url: '/services.html' },
  { id: '04-services-cmo',            url: '/services.html', scrollTo: 1100 },
  { id: '05-pricing-cmo-tiers',       url: '/pricing.html', scrollTo: 600 },
  { id: '06-pricing-cmo-standard',    url: '/pricing.html', scrollTo: 1400 },

  // 2. Registration
  { id: '07-register-free',           url: '/register.html?plan=free', authState: 'logged-out' },
  { id: '08-register-filled',         url: '/register.html?plan=free', action: 'fill-register', authState: 'logged-out' },

  // 3. App / CRM landing
  { id: '09-app-login',               url: '/login.html', authState: 'logged-out' },
  { id: '10-app-sales-pipeline-lite', url: '/app/sales-pipeline.html' },
  { id: '11-app-marketing-pipeline',  url: '/app/marketing-pipeline.html' },
  { id: '12-app-conversations',       url: '/app/conversations.html' },

  // 4. CRM-vanilla — first-run niche picker (the new client's first decision after login)
  { id: '13-crm-login',               url: '/crm-vanilla/login.html', authState: 'logged-out' },
  { id: '14-crm-firstrun-niche',      url: '/crm-vanilla/index.html', nicheState: 'firstrun' },

  // 5. CRM-vanilla deep modules (niche pre-selected so the dashboard renders clean)
  { id: '15-crm-dashboard',           url: '/crm-vanilla/index.html' },
  { id: '16-crm-contacts',            url: '/crm-vanilla/contacts.html' },
  { id: '17-crm-deals',               url: '/crm-vanilla/pipeline.html' },
  { id: '18-crm-marketing',           url: '/crm-vanilla/marketing.html' },
  { id: '19-crm-calendar',            url: '/crm-vanilla/calendar.html' },
  { id: '20-crm-reporting',           url: '/crm-vanilla/reporting.html' },
  { id: '21-crm-automation',          url: '/crm-vanilla/automation.html' },
  { id: '22-crm-documents',           url: '/crm-vanilla/documents.html' },
  { id: '23-crm-courses',             url: '/crm-vanilla/courses.html' },
  { id: '24-crm-settings',            url: '/crm-vanilla/settings.html' },

  // 6. Fractional CMO upgrade path back from the app
  { id: '25-whatsapp-handoff',        url: '/whatsapp.html?topic=fractional-cmo' },
  { id: '26-contact-cmo',             url: '/contact.html' },
  { id: '27-thanks',                  url: '/thanks.html' },
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

  // Stub /api/* and /crm-vanilla/api/* responses on every page load so the CRM
  // renders empty-state UI instead of "Error loading data" (no PHP locally).
  await page.evaluateOnNewDocument(() => {
    const isApi = (u) => {
      if (!u) return false;
      return /\/api(?:-php)?\//.test(u)
        || /\/crm-vanilla\/api\//.test(u)
        || /api\/index\.php/.test(u)
        || /\.php(\?|$)/.test(u);
    };
    const realFetch = window.fetch;
    window.fetch = function (resource, init) {
      const u = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      if (isApi(u)) {
        // Return shapes the CRM expects: empty arrays / zero counts / ok envelopes.
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
    // Same for XHR.
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

  // Pre-seed localStorage on the origin so cookie banner + first-run modals do not appear.
  await page.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    try {
      localStorage.setItem('nwm_cookie_consent', 'all');
      // Simulate a logged-in CRM session so /app and /crm-vanilla render the shell.
      localStorage.setItem('nwm_token', 'demo-token-' + Date.now());
      localStorage.setItem('nwm_user', JSON.stringify({
        id: 999,
        name: user.name,
        email: user.email,
        organization: { id: 999, slug: 'chilespirits', name: 'Chile Spirits' },
        plan: 'free',
        role: 'owner',
      }));
    } catch (e) {}
  }, TEST_USER);

  const results = [];

  for (const s of SCREENS) {
    const dest = path.join(OUT_DIR, s.id + '.png');

    // Set auth state BEFORE navigation so the page's own redirect scripts see the
    // right state (login.html redirects to /app/ if nwm_token exists, etc.).
    // We can only set localStorage on an origin we have already loaded once.
    await page.evaluate((user, firstrun, loggedOut) => {
      try {
        localStorage.setItem('nwm_cookie_consent', 'all');
        if (loggedOut) {
          localStorage.removeItem('nwm_token');
          localStorage.removeItem('nwm_user');
          localStorage.removeItem('nwm_niche_picker_dismissed');
        } else {
          const niche = firstrun ? null : 'wine_agriculture';
          if (firstrun) localStorage.removeItem('nwm_niche_picker_dismissed');
          else localStorage.setItem('nwm_niche_picker_dismissed', '1');
          localStorage.setItem('nwm_token', 'demo-token-' + Date.now());
          localStorage.setItem('nwm_user', JSON.stringify({
            id: 999, name: user.name, email: user.email,
            organization: { id: 999, slug: 'chilespirits', name: 'Chile Spirits' },
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

    // Re-apply localStorage in case a logout/redirect cleared it.
    await page.evaluate((user, firstrun, loggedOut) => {
      try {
        localStorage.setItem('nwm_cookie_consent', 'all');
        if (loggedOut) {
          // Login & register pages: no token, no user, no niche flag.
          localStorage.removeItem('nwm_token');
          localStorage.removeItem('nwm_user');
          localStorage.removeItem('nwm_niche_picker_dismissed');
        } else {
          const niche = firstrun ? null : 'wine_agriculture';
          if (firstrun) {
            localStorage.removeItem('nwm_niche_picker_dismissed');
          } else {
            localStorage.setItem('nwm_niche_picker_dismissed', '1');
          }
          localStorage.setItem('nwm_token', 'demo-token-' + Date.now());
          localStorage.setItem('nwm_user', JSON.stringify({
            id: 999, name: user.name, email: user.email,
            organization: { id: 999, slug: 'chilespirits', name: 'Chile Spirits' },
            plan: 'free', role: 'owner',
            niche: niche,
          }));
        }
      } catch (e) {}
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      window.__nwm_screenshot_mode = true;
    }, TEST_USER, s.nicheState === 'firstrun', s.authState === 'logged-out');

    // For pages whose layout depends on the user object (CRM modules), reload now
    // that the right user shape is in localStorage. The first navigation ran with
    // a stale user (no niche), which fired the picker modal.
    if (s.url.startsWith('/crm-vanilla/') || s.url.startsWith('/app/')) {
      try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
    }

    // Pages that lazy-render may need a moment.
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
    } else if (s.scrollTo === 'auto') {
      // Try scroll to the URL hash target.
      const hash = (s.url.split('#')[1] || '').trim();
      if (hash) {
        await page.evaluate((id) => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ block: 'start' });
        }, hash);
        await new Promise(r => setTimeout(r, 400));
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Final banner cleanup right before screenshot — some scripts inject after load.
    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      // Hide site chat widget for cleaner shots.
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget, [id*="chat-widget"]').forEach(el => el.style.display = 'none');
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

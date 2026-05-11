// Part 3 — capture CMO Standard ($1,490/mo) checkout flow.
//
// Why this matters: CMO Standard exceeds the CLP 350k preapproval cap, so
// MP returns a DIFFERENT flow:
//   - cmo_starter ($249/mo) → "preapproval" (recurring, /subscriptions/checkout)
//   - cmo_standard ($1,490/mo) → "one_time" Checkout Pro Preference
// We need to see and document the Checkout Pro UX too.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'https://netwebmedia.com';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TIMESTAMP = '2026-05-11';
const TEST_USER = {
  email: `tutorial-test-${TIMESTAMP}@netwebmedia.com`,
  password: `TutorialTest${TIMESTAMP.replace(/-/g, '')}!`,
};

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
    protocolTimeout: 120000,
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORT);
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');

  async function shot(id) {
    const dest = path.join(OUT_DIR, id + '.png');
    try { await page.screenshot({ path: dest, fullPage: false, type: 'png' }); }
    catch (e) { console.log(`  ⚠ screenshot ${id} failed: ${e.message}`); return; }
    console.log(`  📸 ${id}.png (${fs.statSync(dest).size} bytes)`);
  }

  console.log('[1/4] Loading login page + authenticating via API...');
  await page.goto(`${ORIGIN}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    try { localStorage.setItem('nwm_cookie_consent', 'all'); } catch (e) {}
    document.getElementById('nwm-cookie-banner')?.remove();
  });

  const loginResult = await page.evaluate(async (creds) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const body = await r.json();
    if (body.token) {
      localStorage.setItem('nwm_token', body.token);
      if (body.user) localStorage.setItem('nwm_user', JSON.stringify(body.user));
    }
    return { status: r.status, ok: !!body.token, user: body.user?.email, token_len: body.token?.length };
  }, TEST_USER);
  console.log('     ↳ Login:', JSON.stringify(loginResult));
  if (!loginResult.ok) { console.log('     ❌ Login failed.'); await browser.close(); return; }

  console.log('[2/4] Navigating to pricing page to highlight CMO Standard button...');
  await page.goto(`${ORIGIN}/pricing.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    document.getElementById('nwm-cookie-banner')?.remove();
    document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    const btn = document.querySelector('button[data-plan="cmo_standard"]');
    if (btn) {
      btn.scrollIntoView({ block: 'center' });
      btn.style.outline = '3px solid #FF671F';
      btn.style.outlineOffset = '4px';
      btn.style.boxShadow = '0 0 0 6px rgba(255,103,31,0.25), 0 8px 30px rgba(255,103,31,0.4)';
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await shot('15-pricing-cmo-standard-button');

  console.log('[3/4] POSTing /api/billing/checkout for cmo_standard...');
  const checkoutResult = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ plan_code: 'cmo_standard' })
      });
      const body = await r.json();
      return { status: r.status, body };
    } catch (e) { return { error: e.message }; }
  });
  console.log('     ↳ Checkout response (truncated):', JSON.stringify(checkoutResult).slice(0, 600));

  fs.writeFileSync(
    path.join(OUT_DIR, '_checkout-response-cmo-standard.json'),
    JSON.stringify(checkoutResult, null, 2)
  );

  if (!checkoutResult.body?.init_point) {
    console.log('     ⚠ No init_point — capturing current state');
    await shot('16-checkout-error');
    await browser.close();
    return;
  }

  console.log(`[4/4] Navigating to MP Checkout Pro: ${checkoutResult.body.init_point.slice(0, 80)}...`);
  try {
    await page.goto(checkoutResult.body.init_point, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.log(`     ⚠ Navigation: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 6000));
  console.log(`     ↳ Now at: ${page.url()}`);

  await shot('16-mercadopago-checkout-pro-standard');

  // Scroll for more views of the form.
  try {
    await page.evaluate(() => window.scrollTo(0, 250));
    await new Promise(r => setTimeout(r, 800));
    await shot('17-mp-checkout-pro-payment-options');
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(r => setTimeout(r, 800));
    await shot('18-mp-checkout-pro-detail');
  } catch (e) {}

  console.log('\n✓ CMO Standard flow captured.');
  await browser.close();
})();

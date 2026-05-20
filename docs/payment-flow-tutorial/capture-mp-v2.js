// Part 2 v2 — auth via API directly, then capture MP redirect.
// Bypasses UI selector issues by hitting /api/auth/login from the page context.

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

  console.log('[1/5] Loading login page (clean shot)...');
  await page.goto(`${ORIGIN}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    try { localStorage.setItem('nwm_cookie_consent', 'all'); } catch (e) {}
    document.getElementById('nwm-cookie-banner')?.remove();
    document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
  });
  await shot('08-login-page-clean');

  console.log('[2/5] Calling /api/auth/login from page context...');
  const loginResult = await page.evaluate(async (creds) => {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const body = await r.json();
      if (body.token) {
        try {
          localStorage.setItem('nwm_token', body.token);
          if (body.user) localStorage.setItem('nwm_user', JSON.stringify(body.user));
        } catch (e) {}
      }
      return { status: r.status, body: { ok: !!body.token, user_email: body.user?.email, org_id: body.user?.org_id, token_len: body.token?.length } };
    } catch (e) {
      return { error: e.message };
    }
  }, TEST_USER);
  console.log('     ↳ Login response:', JSON.stringify(loginResult));

  if (!loginResult.body?.ok) {
    console.log('     ❌ Login failed. Aborting.');
    await shot('09-login-failed');
    await browser.close();
    return;
  }

  console.log('[3/5] Calling /api/billing/checkout for cmo_starter...');
  const checkoutResult = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    if (!token) return { error: 'no_token' };
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ plan_code: 'cmo_starter' })
      });
      const body = await r.json();
      return { status: r.status, body };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('     ↳ Checkout response (truncated):', JSON.stringify(checkoutResult).slice(0, 600));

  // Save the response for the tutorial.
  fs.writeFileSync(
    path.join(OUT_DIR, '_checkout-response.json'),
    JSON.stringify(checkoutResult, null, 2)
  );

  if (!checkoutResult.body?.init_point) {
    console.log('     ⚠ No init_point in response. Saving raw error.');
    await shot('11-checkout-error-page');
    await browser.close();
    return;
  }

  console.log(`[4/5] Navigating to MP init_point: ${checkoutResult.body.init_point.slice(0, 100)}...`);
  try {
    await page.goto(checkoutResult.body.init_point, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.log(`     ⚠ Navigation error: ${e.message}`);
  }
  // Let MP render its checkout UI.
  await new Promise(r => setTimeout(r, 6000));
  console.log(`     ↳ Now at: ${page.url()}`);

  console.log('[5/5] Capturing Mercado Pago checkout pages...');
  await shot('12-mercadopago-checkout');
  // Scroll for additional views.
  try {
    await page.evaluate(() => window.scrollTo(0, 300));
    await new Promise(r => setTimeout(r, 800));
    await shot('13-mp-payment-options');
  } catch (e) {}
  try {
    await page.evaluate(() => window.scrollTo(0, 600));
    await new Promise(r => setTimeout(r, 800));
    await shot('14-mp-payment-details');
  } catch (e) {}

  console.log('\n✓ Done. Combined captures in', OUT_DIR);
  await browser.close();
})();

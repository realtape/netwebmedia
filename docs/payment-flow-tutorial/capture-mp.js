// Part 2 — login as the test user, trigger checkout, capture Mercado Pago redirect.
//
// Picks up where capture.js stopped (after registration). Avoids running
// page.evaluate during cross-origin navigation (which caused the timeout).

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
    // Bump protocolTimeout to handle cross-origin redirects to mercadopago.com.
    protocolTimeout: 90000,
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

  console.log('[1/6] Loading login page...');
  await page.goto(`${ORIGIN}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    try { localStorage.setItem('nwm_cookie_consent', 'all'); } catch (e) {}
    document.getElementById('nwm-cookie-banner')?.remove();
    document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
  });
  await shot('08-login-page-empty');

  console.log('[2/6] Filling login form...');
  await page.type('#email, [name="email"]', TEST_USER.email, { delay: 35 });
  await page.type('#password, [name="password"]', TEST_USER.password, { delay: 35 });
  await page.evaluate(() => {
    document.getElementById('nwm-cookie-banner')?.remove();
  });
  await shot('09-login-page-filled');

  console.log('[3/6] Submitting login...');
  // Click the submit button.
  await page.click('button[type="submit"], #submitBtn, .btn').catch(() => {});
  // Wait for either redirect or a logged-in indicator.
  try {
    await page.waitForFunction(
      () => location.pathname === '/app/' || location.pathname.startsWith('/app') || (window.NWMApi && window.NWMApi.token && window.NWMApi.token()),
      { timeout: 15000 }
    );
    console.log(`     ↳ Logged in. Now at: ${page.url()}`);
  } catch (e) {
    console.log(`     ⚠ Login state ambiguous after 15s. URL: ${page.url()}`);
  }
  await new Promise(r => setTimeout(r, 2000));
  await shot('10-logged-in-app-shell');

  console.log('[4/6] Navigating to pricing?checkout=cmo_starter...');
  await page.goto(`${ORIGIN}/pricing.html?checkout=cmo_starter`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    document.getElementById('nwm-cookie-banner')?.remove();
    document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    window.scrollTo(0, 1400);
  });
  await shot('11-pricing-auto-checkout-fired');

  console.log('[5/6] Manually triggering checkout (calling NWMApi.token + fetch)...');
  // Directly hit the checkout endpoint so we see exactly what response we get.
  // This gives us a screenshot AND a confirmed init_point.
  const checkoutResult = await page.evaluate(async () => {
    const token = (window.NWMApi && NWMApi.token && NWMApi.token()) || localStorage.getItem('nwm_token');
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
  console.log('     ↳ Checkout response:', JSON.stringify(checkoutResult).slice(0, 400));

  if (checkoutResult.body && checkoutResult.body.init_point) {
    console.log(`[6/6] Navigating to MP init_point: ${checkoutResult.body.init_point.slice(0, 80)}...`);
    try {
      await page.goto(checkoutResult.body.init_point, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e) {
      console.log(`     ⚠ Navigation error: ${e.message}`);
    }
    // Wait for MP page to settle.
    await new Promise(r => setTimeout(r, 5000));
    console.log(`     ↳ Now at: ${page.url()}`);
    await shot('12-mercadopago-checkout-landing');
    // Try to scroll down to see the payment form.
    try {
      await page.evaluate(() => window.scrollTo(0, 300));
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {}
    await shot('13-mercadopago-payment-form');
  } else if (checkoutResult.body && checkoutResult.body.mock_mode) {
    console.log('     ↳ MP returned MOCK mode (MP_ACCESS_TOKEN not configured)');
    await shot('12-mock-mode-response');
  } else {
    console.log(`     ↳ Unexpected checkout response — capturing current page`);
    await shot('12-checkout-error');
  }

  // Save the raw checkout response too for the tutorial.
  fs.writeFileSync(
    path.join(OUT_DIR, '_checkout-response.json'),
    JSON.stringify(checkoutResult, null, 2)
  );

  console.log('\n✓ Part 2 complete. Combined captures in', OUT_DIR);
  await browser.close();
})();

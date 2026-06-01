// Payment Flow Tutorial — captures every step of a real production checkout.
//
// SCOPE: signs up a real test user on netwebmedia.com (production), walks through
// the pricing page, registration, and Mercado Pago checkout redirect. STOPS at the
// MP checkout page BEFORE any credit card data is entered. No real payment is made.
//
// Cleanup after running:
//   1. Login to crm-vanilla as admin, find "Tutorial Tester" contact, delete it
//   2. Check webmed6_nwm users table for the test email, remove row
//   3. If a pending preapproval was created in MP, cancel via /api/billing/cancel
//
// Usage: node docs/payment-flow-tutorial/capture.js

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'https://netwebmedia.com';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Test user with a clearly-test name and a bouncing email so welcome sequence
// doesn't reach a real inbox. Cleanup notes at the bottom of this file.
const TIMESTAMP = '2026-05-11';
const TEST_USER = {
  name: 'Tutorial Tester',
  email: `tutorial-test-${TIMESTAMP}@netwebmedia.com`,
  password: `TutorialTest${TIMESTAMP.replace(/-/g, '')}!`,
};

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

async function shot(page, id, opts = {}) {
  const dest = path.join(OUT_DIR, id + '.png');
  // Always dismiss cookie banner and chat widget before screenshotting.
  await page.evaluate(() => {
    document.getElementById('nwm-cookie-banner')?.remove();
    document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget, [id*="chat-widget"]').forEach(el => el.style.display = 'none');
  });
  if (typeof opts.scrollTo === 'number') {
    await page.evaluate(y => window.scrollTo(0, y), opts.scrollTo);
    await new Promise(r => setTimeout(r, 300));
  } else if (typeof opts.scrollToSelector === 'string') {
    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'center' });
    }, opts.scrollToSelector);
    await new Promise(r => setTimeout(r, 300));
  }
  if (opts.highlight) {
    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.outline = '3px solid #FF671F';
        el.style.outlineOffset = '4px';
        el.style.boxShadow = '0 0 0 6px rgba(255,103,31,0.25), 0 8px 30px rgba(255,103,31,0.4)';
      }
    }, opts.highlight);
    await new Promise(r => setTimeout(r, 150));
  }
  await page.screenshot({ path: dest, fullPage: false, type: 'png' });
  const sz = fs.statSync(dest).size;
  console.log(`  📸 ${id}.png (${sz} bytes)`);
  return dest;
}

(async () => {
  console.log('Launching Chrome (real production browser)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
  });

  // Use a fresh isolated context so we land as a logged-out anonymous visitor.
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORT);
  // Set a real user-agent to avoid mod_security 406s.
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');

  // ── Step 1: Land on pricing page ──────────────────────────────────────────
  console.log('\n[1/12] Loading pricing page...');
  await page.goto(`${ORIGIN}/pricing.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  // Pre-accept cookies so subsequent screens are clean.
  await page.evaluate(() => {
    try { localStorage.setItem('nwm_cookie_consent', 'all'); } catch (e) {}
  });
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, '01-pricing-page-top');

  // ── Step 2: Scroll to CMO tiers ───────────────────────────────────────────
  console.log('[2/12] Scrolling to CMO Standard tier...');
  await shot(page, '02-pricing-cmo-tiers', { scrollTo: 1400 });

  // ── Step 3: Find the cheapest paid button (AEO Starter $249/mo) ───────────
  console.log('[3/12] Highlighting the buy button we will click...');
  // The button is hardcoded in pricing.html: data-plan="cmo_starter"
  await shot(page, '03-pricing-aeo-starter-button', {
    scrollToSelector: 'button[data-plan="cmo_starter"]',
    highlight: 'button[data-plan="cmo_starter"]',
  });

  // ── Step 4: Click the button → redirected to register ─────────────────────
  console.log('[4/12] Clicking Start AEO Starter $249/mo →...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    page.click('button[data-plan="cmo_starter"]'),
  ]);
  await new Promise(r => setTimeout(r, 1500));
  console.log(`     ↳ Redirected to: ${page.url()}`);
  await shot(page, '04-register-page-empty');

  // ── Step 5: Fill the registration form ────────────────────────────────────
  console.log('[5/12] Filling registration form with test user...');
  await page.type('#name', TEST_USER.name, { delay: 35 });
  await page.type('#email', TEST_USER.email, { delay: 35 });
  await page.type('#password', TEST_USER.password, { delay: 35 });
  await page.click('#consent').catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  await shot(page, '05-register-page-filled');

  // ── Step 6: Submit registration ───────────────────────────────────────────
  console.log('[6/12] Submitting registration...');
  // The form does NOT navigate — it calls NWMApi.register() then setTimeout(redirect).
  // We need to intercept the post-register state before the timeout fires.
  await page.click('#submitBtn');
  // Wait for either the success message OR the post-register navigation.
  try {
    await page.waitForFunction(
      () => {
        const msg = document.getElementById('msg');
        return msg && (msg.textContent.includes('Account created') || msg.textContent.includes('Cuenta creada') || msg.textContent.toLowerCase().includes('redirecting'));
      },
      { timeout: 15000 }
    );
    await shot(page, '06-register-success-message');
  } catch (e) {
    console.log('     ⚠ Did not see success message — capturing current state...');
    await shot(page, '06-register-current-state');
  }

  // ── Step 7: Wait for redirect / handle next step ──────────────────────────
  console.log('[7/12] Following post-registration redirect...');
  // Per pricing.html click handler, after register, location.href = '/pricing.html?checkout=cmo_starter'
  // is set by the redirect. But the actual register.html redirects to '/app/'.
  // Wait for whichever lands first.
  await new Promise(r => setTimeout(r, 4000));
  console.log(`     ↳ Now at: ${page.url()}`);
  await shot(page, '07-post-register-landing');

  // ── Step 8: If we're at /app/ instead of pricing, navigate back to pricing to checkout ─
  let url = page.url();
  if (!url.includes('/pricing.html') && !url.includes('mercadopago')) {
    console.log('[8/12] Navigating to /pricing.html?checkout=cmo_starter to trigger checkout...');
    await page.goto(`${ORIGIN}/pricing.html?checkout=cmo_starter`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    console.log(`     ↳ At: ${page.url()}`);
    await shot(page, '08-pricing-auto-checkout', { scrollTo: 1400 });
  } else {
    await shot(page, '08-already-redirecting', { scrollTo: 800 });
  }

  // ── Step 9-11: Wait for Mercado Pago redirect ─────────────────────────────
  console.log('[9/12] Waiting for Mercado Pago checkout redirect...');
  try {
    await page.waitForFunction(
      () => location.hostname.includes('mercadopago') || location.hostname.includes('mp-'),
      { timeout: 25000, polling: 500 }
    );
    console.log(`     ↳ Redirected to MP: ${page.url()}`);
    await new Promise(r => setTimeout(r, 3000));
    await shot(page, '09-mercadopago-checkout-page');

    // Scroll to capture more of the MP page.
    await shot(page, '10-mercadopago-payment-form', { scrollTo: 400 });
    await shot(page, '11-mercadopago-payment-form-detail', { scrollTo: 800 });
  } catch (e) {
    console.log(`     ⚠ MP redirect did not fire within 25s. Current URL: ${page.url()}`);
    // Try to manually trigger the checkout via the button.
    try {
      const has = await page.$('button[data-plan="cmo_starter"]');
      if (has) {
        console.log('     ↳ Found buy button — clicking manually...');
        await page.click('button[data-plan="cmo_starter"]');
        await new Promise(r => setTimeout(r, 5000));
        await shot(page, '09-after-manual-click');
      }
    } catch (e2) {}
    // Capture whatever state we're in.
    await shot(page, '12-final-state');
  }

  // ── Step 12: Final confirmation screen ────────────────────────────────────
  console.log('\n[12/12] Capturing final state...');
  await shot(page, '12-final-state-or-mp-page');

  console.log(`\n✓ Captured screenshots to ${OUT_DIR}`);
  console.log(`\nNEXT STEPS (cleanup):`);
  console.log(`  1. Delete test user: ${TEST_USER.email}`);
  console.log(`     - In webmed6_nwm.users (api-php database)`);
  console.log(`     - In webmed6_crm.contacts (CRM database, if synced)`);
  console.log(`  2. If a pending MP preapproval was created, cancel it:`);
  console.log(`     - Login to crm-vanilla as admin`);
  console.log(`     - POST /api/billing/cancel with the user's auth token`);
  console.log(`     - Or in Mercado Pago dashboard under Preapprovals`);

  await browser.close();
})();

// Cleanup — cancel the 2 test subscriptions created during the tutorial.
// Login as Tutorial Tester, then POST /api/billing/cancel twice.
// Each call cancels the MOST RECENT pending subscription (ORDER BY id DESC LIMIT 1).

const puppeteer = require('puppeteer');

const ORIGIN = 'https://netwebmedia.com';
const TIMESTAMP = '2026-05-11';
const TEST_USER = {
  email: `tutorial-test-${TIMESTAMP}@netwebmedia.com`,
  password: `TutorialTest${TIMESTAMP.replace(/-/g, '')}!`,
};

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    protocolTimeout: 60000,
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');

  console.log('[1] Loading login page + authenticating via API...');
  await page.goto(`${ORIGIN}/login.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const loginResult = await page.evaluate(async (creds) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const body = await r.json();
    if (body.token) localStorage.setItem('nwm_token', body.token);
    return { status: r.status, ok: !!body.token, user: body.user?.email };
  }, TEST_USER);
  console.log(`     ↳ Login: ${JSON.stringify(loginResult)}`);
  if (!loginResult.ok) { console.log('❌ Login failed.'); await browser.close(); return; }

  // First: check what subscription is active.
  console.log('\n[2] Checking current my-subscription before cancel...');
  const before1 = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/my-subscription', {
      headers: { 'X-Auth-Token': token },
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Current: ${JSON.stringify(before1).slice(0, 400)}`);

  // First cancel: subscription #9 (cmo_growth, the most recent)
  console.log('\n[3] POST /api/billing/cancel (#1 — should cancel subscription 9)...');
  const cancel1 = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({}),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Cancel #1: ${JSON.stringify(cancel1)}`);

  // Check again to see what's still pending.
  console.log('\n[4] Checking my-subscription after first cancel...');
  const after1 = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/my-subscription', {
      headers: { 'X-Auth-Token': token },
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Now: ${JSON.stringify(after1).slice(0, 400)}`);

  // Second cancel: subscription #8 (cmo_starter)
  console.log('\n[5] POST /api/billing/cancel (#2 — should cancel subscription 8)...');
  const cancel2 = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({}),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Cancel #2: ${JSON.stringify(cancel2)}`);

  // Final state.
  console.log('\n[6] Verifying — no active/pending subs remaining...');
  const finalCheck = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/my-subscription', {
      headers: { 'X-Auth-Token': token },
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Final: ${JSON.stringify(finalCheck).slice(0, 400)}`);

  // Third cancel attempt — should now return 404 "No active subscription"
  console.log('\n[7] Third cancel attempt — should 404 (no more subs to cancel)...');
  const cancel3 = await page.evaluate(async () => {
    const token = localStorage.getItem('nwm_token');
    const r = await fetch('/api/billing/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({}),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log(`     ↳ Confirm 404: ${JSON.stringify(cancel3)}`);

  console.log('\n✓ Cleanup complete.');
  await browser.close();
})();

// Billing integration test — exercises the full Mercado Pago checkout chain
// against a real environment (default: https://netwebmedia.com).
//
// What it tests, in order:
//   1. Public plans listing returns the expected catalog
//   2. Auth: register-or-login a persistent test user (NIGHTLY_TEST_EMAIL)
//   3. State precondition: cancel any leftover subs from a previous run
//   4. Preapproval flow: POST /api/billing/checkout {plan_code: "cmo_starter"}
//      → returns 200, flow="preapproval", real init_point on mercadopago.cl
//   5. my-subscription reflects the just-created subscription
//   6. Checkout Pro flow: POST /api/billing/checkout {plan_code: "cmo_growth"}
//      → returns 200, flow="one_time_checkout_pro", real preference init_point
//   7. my-subscription now reflects the most recent (cmo_growth)
//   8. Cancel — removes most-recent (cmo_growth)
//   9. my-subscription now reflects the previous (cmo_starter)
//  10. Cancel — removes cmo_starter
//  11. Cancel one more time — must return 404 (verifies scoping is tight)
//
// Catches the 3 regressions surfaced 2026-05-11:
//   - Missing promo_code columns on subscriptions table → 500 on checkout
//   - cmo_standard plan code mismatch → 400 "Unknown plan"
//   - cancel/my-subscription scoping by org_id only → cross-tenant escalation
//
// Usage:
//   ORIGIN=https://netwebmedia.com \
//   NIGHTLY_TEST_EMAIL=nightly-integration-test@netwebmedia.com \
//   NIGHTLY_TEST_PASSWORD=••••••• \
//   node tests/integration/billing-flow.test.js
//
// Exits 0 on all pass, 1 on any failure. Output is parseable by GitHub Actions.

const { test } = require('node:test');
const assert = require('node:assert');

const ORIGIN = process.env.ORIGIN || 'https://netwebmedia.com';
const TEST_EMAIL = process.env.NIGHTLY_TEST_EMAIL || 'nightly-integration-test@netwebmedia.com';
const TEST_PASSWORD = process.env.NIGHTLY_TEST_PASSWORD || 'NightlyIntegration2026!';

// Real-browser headers — netwebmedia.com mod_security 406-blocks bare curl/node UA.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Origin': new URL(ORIGIN).origin,
  'Referer': `${ORIGIN}/pricing.html`,
};

async function api(method, path, { token, body } = {}) {
  const h = { ...HEADERS };
  if (body) h['Content-Type'] = 'application/json';
  if (token) h['X-Auth-Token'] = token;
  const r = await fetch(`${ORIGIN}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* not JSON */ }
  return { status: r.status, body: json, raw: r };
}

// Get or create our persistent test user. Returns auth token.
async function getAuthToken() {
  const login = await api('POST', '/api/auth/login', {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (login.status === 200 && login.body?.token) return login.body.token;

  // First run for this email — register them.
  const reg = await api('POST', '/api/auth/register', {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Nightly Integration Test' },
  });
  if (reg.status === 200 && reg.body?.token) return reg.body.token;
  throw new Error(`Auth failed: login=${login.status}, register=${reg.status} · ${JSON.stringify(reg.body).slice(0, 200)}`);
}

// Cancel every active/pending subscription owned by the current user.
// After the user_id scoping fix, this only touches our own subs — safe.
async function cancelAllOurSubs(token) {
  for (let i = 0; i < 10; i++) {
    const r = await api('POST', '/api/billing/cancel', { token, body: {} });
    if (r.status === 404) return; // No more to cancel — we're clean.
    if (r.status !== 200) throw new Error(`cancel returned ${r.status}: ${JSON.stringify(r.body)}`);
  }
  throw new Error('Cancelled 10 subscriptions without hitting 404 — runaway state');
}

let TOKEN = null;

test('00. setup — get auth token + clean state', async () => {
  TOKEN = await getAuthToken();
  assert.strictEqual(typeof TOKEN, 'string');
  assert.strictEqual(TOKEN.length, 64, `Token should be 64 chars, got ${TOKEN.length}`);
  await cancelAllOurSubs(TOKEN);
  const sub = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.strictEqual(sub.status, 200);
  assert.strictEqual(sub.body?.subscription, null, 'After cleanup, my-subscription must be null');
});

test('01. /api/billing/plans returns the production catalog', async () => {
  const r = await api('GET', '/api/billing/plans');
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body?.items), 'plans must be an array');
  assert.ok(r.body.items.length >= 20, `Expected ≥20 plans, got ${r.body.items.length}`);
  const codes = r.body.items.map((p) => p.code);
  assert.ok(codes.includes('cmo_starter'), 'cmo_starter must exist in catalog');
  assert.ok(codes.includes('cmo_growth'), 'cmo_growth must exist (referenced by pricing.html button)');
  // Sanity: USD/CLP currency display matches the contract.
  assert.strictEqual(r.body.currency_display, 'USD');
  assert.strictEqual(r.body.currency_charge, 'CLP');
  assert.ok(r.body.fx_rate > 800 && r.body.fx_rate < 1200, `FX rate ${r.body.fx_rate} outside plausible USD/CLP range`);
});

test('02. /api/billing/plans includes cmo_growth at the expected $999 price', async () => {
  const r = await api('GET', '/api/billing/plans');
  const growth = r.body.items.find((p) => p.code === 'cmo_growth');
  assert.ok(growth, 'cmo_growth must exist');
  assert.strictEqual(growth.usd, 999, 'cmo_growth USD price must be 999 (matches pricing.html UI)');
  assert.strictEqual(growth.setup, 499, 'cmo_growth setup must be 499');
});

test('03. /api/billing/checkout requires auth (no token = 401)', async () => {
  const r = await api('POST', '/api/billing/checkout', { body: { plan_code: 'cmo_starter' } });
  assert.strictEqual(r.status, 401);
  assert.match(r.body?.error || '', /authenticated|auth/i);
});

test('04. /api/billing/checkout rejects unknown plan code (regression: cmo_standard 400)', async () => {
  const r = await api('POST', '/api/billing/checkout', {
    token: TOKEN,
    body: { plan_code: 'cmo_standard' },
  });
  assert.strictEqual(r.status, 400);
  assert.match(r.body?.error || '', /unknown plan/i);
});

test('05. /api/billing/checkout creates a preapproval for cmo_starter ($249 → CLP ≤ 350k)', async () => {
  const r = await api('POST', '/api/billing/checkout', {
    token: TOKEN,
    body: { plan_code: 'cmo_starter' },
  });
  assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert.strictEqual(r.body.flow, 'preapproval', 'cmo_starter must use preapproval flow (CLP within 350k cap)');
  assert.ok(Number.isInteger(r.body.subscription_id), 'subscription_id must be an integer');
  assert.ok(r.body.init_point, 'init_point must be returned');
  assert.match(r.body.init_point, /mercadopago\.(cl|com)/, 'init_point must point to mercadopago');
  assert.match(r.body.init_point, /preapproval_id=/, 'preapproval init_point must include preapproval_id');
});

test('06. /api/billing/my-subscription reflects the just-created subscription', async () => {
  const r = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.strictEqual(r.status, 200);
  assert.ok(r.body?.subscription, 'Subscription must exist after checkout');
  assert.strictEqual(r.body.subscription.plan_code, 'cmo_starter');
  assert.strictEqual(r.body.subscription.status, 'pending');
});

test('07. /api/billing/checkout creates Checkout Pro Preference for cmo_growth ($999 → CLP > 350k)', async () => {
  const r = await api('POST', '/api/billing/checkout', {
    token: TOKEN,
    body: { plan_code: 'cmo_growth' },
  });
  assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert.strictEqual(r.body.flow, 'one_time_checkout_pro', 'cmo_growth must use Checkout Pro flow (CLP > 350k cap)');
  assert.ok(Number.isInteger(r.body.subscription_id));
  assert.match(r.body.init_point, /pref_id=/, 'Checkout Pro init_point must include pref_id');
  assert.ok(r.body.note?.includes('One-time charge'), 'note must explain the one-time billing model');
});

test('08. my-subscription now returns the most-recent (cmo_growth)', async () => {
  const r = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.strictEqual(r.body.subscription.plan_code, 'cmo_growth');
  assert.strictEqual(r.body.subscription.status, 'pending');
});

test('09. /api/billing/cancel cancels most-recent pending sub', async () => {
  const r = await api('POST', '/api/billing/cancel', { token: TOKEN, body: {} });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.ok, true);
});

test('10. After cancel, my-subscription reverts to the older one (cmo_starter)', async () => {
  const r = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.ok(r.body?.subscription, 'Older subscription must still be visible');
  assert.strictEqual(r.body.subscription.plan_code, 'cmo_starter');
});

test('11. Cancel cmo_starter too', async () => {
  const r = await api('POST', '/api/billing/cancel', { token: TOKEN, body: {} });
  assert.strictEqual(r.status, 200);
});

test('12. After all cancels, my-subscription is null (verifies user_id scoping)', async () => {
  const r = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(
    r.body?.subscription,
    null,
    'my-subscription MUST be null — if it returns another user\'s sub, the org_id-only scoping bug has regressed'
  );
});

test('13. Extra cancel returns 404 (verifies scoping is tight)', async () => {
  const r = await api('POST', '/api/billing/cancel', { token: TOKEN, body: {} });
  assert.strictEqual(r.status, 404, `Extra cancel must 404 — if it cancels something else, the cross-tenant bug has regressed (got ${r.status}: ${JSON.stringify(r.body)})`);
  assert.match(r.body?.error || '', /no active subscription/i);
});

test('99. teardown — final state is clean', async () => {
  // Belt + suspenders — make sure we leave no trash even if a test above
  // bailed early. Idempotent: 404 is fine if there's nothing left.
  await cancelAllOurSubs(TOKEN);
  const r = await api('GET', '/api/billing/my-subscription', { token: TOKEN });
  assert.strictEqual(r.body?.subscription, null);
});

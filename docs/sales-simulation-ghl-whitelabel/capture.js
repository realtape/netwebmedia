// Sales Simulation — GHL White-Label SKU.
// Buyer: Marcus Test, Owner at Marcus Test Realty (real-estate broker).
// Plan: GHL White-Label sub-account · $497 one-time setup + $197/mo
//
// Per CLAUDE.md CRM Platform Decision: "Client-facing CRM SKU: GHL White-Label —
// productized deliverable for clients; each client gets a sub-account. ...
// When provisioning a new client, spin up a GHL sub-account using Estetica.Social
// as the template."
//
// Funnel — 5 stages:
//   1. New Lead         — demo requested via /pricing.html GHL section
//   2. Demo Scheduled
//   3. Demo Done        — Marcus saw the white-labeled CRM
//   4. Setup Paid       — Stripe checkout for $497 setup + $197/mo
//   5. Active Sub-Acct  — sub-account provisioned, snapshot deployed, training scheduled
//
// What's different: no AEO audit involvement, no engagement letter (just service order),
// short cycle (3-5 days), buyer just wants the tool not the service.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BUYER = {
  id: 7780,
  name: 'Marcus Test',
  email: 'marcus@marcustestrealty.com',
  phone: '+1 415 555 0419',
  company: 'Marcus Test Realty',
  region: 'US',
  source: 'pricing_page_ghl_cta',
  org_id: 1, user_id: 1,
};

const NWM_USER = {
  id: 1, name: 'Carlos Martinez', email: 'carlos@netwebmedia.com',
  organization: { id: 1, slug: 'netwebmedia', name: 'NetWebMedia' },
  plan: 'admin', role: 'owner', niche: 'smb',
};

const STAGES = [
  { id: 1, name: 'New Lead',         sort_order: 1, color: '#94a3b8', probability: 10 },
  { id: 2, name: 'Demo Scheduled',   sort_order: 2, color: '#60a5fa', probability: 30 },
  { id: 3, name: 'Demo Done',        sort_order: 3, color: '#a78bfa', probability: 55 },
  { id: 4, name: 'Setup Paid',       sort_order: 4, color: '#FF671F', probability: 100 },
  { id: 5, name: 'Active Sub-Acct',  sort_order: 5, color: '#22C55E', probability: 100 },
];

function dealAtStage(stageIdx) {
  const stage = STAGES[stageIdx];
  return {
    id: 9004,
    contact_id: BUYER.id,
    title: 'Marcus Test Realty — GHL White-Label',
    company: BUYER.company,
    contact_name: BUYER.name,
    contact_email: BUYER.email,
    stage: stage.name,
    stage_id: stage.id,
    value: stageIdx <= 2 ? 197 : 2861,  // $197/mo before close → annual $2,361 + setup $497
    amount: 197,
    setup_fee: 497,
    annual_value: 2361,
    first_invoice: 694,  // setup + month 1
    probability: stage.probability,
    source: 'Pricing page · GHL CTA',
    owner_id: 1,
    owner_name: stageIdx <= 2 ? 'Sales Director (agent)' : 'project-manager',
    days_in_stage: stageIdx === 0 ? 0 : 1,
    created_at: '2026-05-07T13:22:00Z',
    expected_close: '2026-05-11',
    status: 'open',
    _won_or_active: stageIdx >= 3,
  };
}

const SCREENS = STAGES.map((stage, i) => ({
  id: `${String(i + 1).padStart(2, '0')}-stage-${stage.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  url: '/crm-vanilla/pipeline.html',
  stageIdx: i,
  stageLabel: stage.name,
}));
SCREENS.push(
  { id: '06-contact-record', url: '/crm-vanilla/contacts.html',   stageIdx: 4 },
  { id: '07-dashboard',      url: '/crm-vanilla/index.html',      stageIdx: 4 },
  { id: '08-documents',      url: '/crm-vanilla/documents.html',  stageIdx: 3 },
  { id: '09-payments',       url: '/crm-vanilla/payments.html',   stageIdx: 4 },
  { id: '10-subaccounts',    url: '/crm-vanilla/subaccounts.html', stageIdx: 4 },
);

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

const ACTIVITY = [
  [
    { at: '2026-05-07 13:22', type: 'pageview', who: 'Marcus', text: 'Read /pricing.html · 6 min on page · clicked GHL White-Label "See live demo" CTA' },
    { at: '2026-05-07 13:28', type: 'form',     who: 'Marcus', text: 'Submitted demo-request form · business: 2-agent real-estate brokerage · current tool: spreadsheet' },
    { at: '2026-05-07 13:28', type: 'system',   who: 'system', text: 'sales-director notified via Slack #nwm-inbound · 2-min response SLA' },
  ],
  [
    { at: '2026-05-07 13:31', type: 'whatsapp', who: 'sales-director', text: 'Sent Calendly link · 30 min GHL demo' },
    { at: '2026-05-07 13:42', type: 'calendar', who: 'Marcus', text: 'Booked · Fri May 8, 14:00 PT' },
  ],
  [
    { at: '2026-05-08 14:00', type: 'meeting', who: 'sales-director', text: 'Demo · 28 min · walked through Estetica.Social template + showed Marcus what his white-labeled sub-account would look like' },
    { at: '2026-05-08 14:32', type: 'note',    who: 'sales-director', text: 'Marcus liked it · asked about own domain · confirmed $694 first-month math works' },
    { at: '2026-05-08 14:35', type: 'document', who: 'sales-director', text: 'Sent Stripe Checkout link via WhatsApp · service order auto-accepts at payment' },
  ],
  [
    { at: '2026-05-08 14:58', type: 'checkout', who: 'Marcus', text: 'Stripe Checkout · $497 setup + $197 month-1 = $694 · paid · subscription created' },
    { at: '2026-05-08 14:58', type: 'system',   who: 'system', text: 'Workflow fired · sub-account provisioning queued · welcome email sent' },
  ],
  [
    { at: '2026-05-08 15:14', type: 'system', who: 'project-manager', text: 'GHL sub-account "marcustestrealty.gohighlevel.com" provisioned from Estetica.Social snapshot' },
    { at: '2026-05-08 15:42', type: 'system', who: 'engineering-lead', text: 'White-label DNS pointed · branding applied (logo, colors from form) · admin user invited to Marcus' },
    { at: '2026-05-11 09:00', type: 'meeting', who: 'project-manager', text: '60-min onboarding training booked · Tue May 12, 10:00 PT' },
  ],
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: VIEWPORT, args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'] });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORT);

  await page.evaluateOnNewDocument((stages, buyer) => {
    const isApi = (u) => !!u && (/\/api(?:-php)?\//.test(u) || /\/crm-vanilla\/api\//.test(u) || /api\/index\.php/.test(u) || /\.php(\?|$)/.test(u));
    const reply = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const getDeal = () => { try { return JSON.parse(localStorage.getItem('__SIM_DEAL') || 'null'); } catch (e) { return null; } };
    const getActivity = () => { try { return JSON.parse(localStorage.getItem('__SIM_ACTIVITY') || '[]'); } catch (e) { return []; } };

    const route = (u) => {
      const currentDeal = getDeal();
      if (/niche_config/.test(u)) return { ok: true, pipeline_stages: stages.map(s => ({ name: s.name, sort_order: s.sort_order, color: s.color, probability: s.probability })) };
      if (/r=stages/.test(u) || /\/stages\b/.test(u)) return stages;
      if (/r=deals/.test(u) || /\/deals\b/.test(u)) return currentDeal ? [currentDeal] : [];
      if (/r=contacts/.test(u) || /\/contacts\b/.test(u)) {
        return [{
          id: buyer.id, name: buyer.name, email: buyer.email, phone: buyer.phone, company: buyer.company,
          region: buyer.region, status: 'customer', source: 'pricing_page_ghl_cta',
          tags: ['ghl-whitelabel-buyer','real-estate','tool-only','self-serve'],
          owner_id: 1, owner_name: 'project-manager',
          last_contacted_at: '2026-05-11T09:00:00Z',
          lifetime_value: currentDeal && currentDeal._won_or_active ? 2861 : 0,
          activities: getActivity(),
        }];
      }
      if (/dashboard|overview|stats/i.test(u)) {
        const won = currentDeal && currentDeal._won_or_active;
        return {
          ok: true,
          revenue: { current: won ? 694 : 0, previous: 0, delta_pct: 0 },
          deals: currentDeal ? [currentDeal] : [],
          schedule: won ? [{ when: 'Tue 10:00', title: 'GHL Training — Marcus Test Realty', who: 'Marcus + project-manager' }] : [],
          contacts: [{ id: buyer.id, name: buyer.name, email: buyer.email }],
          counts: { contacts: 1, deals: 1, tasks: won ? 4 : 0 },
        };
      }
      if (/r=documents|\/documents\b/.test(u)) {
        return [
          { id: 1, name: 'GHL White-Label Service Order.pdf', kind: 'service_order', deal_id: 9004, contact_id: buyer.id, sent_at: '2026-05-08', status: 'auto-accepted', size_kb: 84 },
          { id: 2, name: 'Brand Kit Intake — Marcus Test Realty.pdf', kind: 'intake', deal_id: 9004, contact_id: buyer.id, sent_at: '2026-05-08', status: 'received', size_kb: 1820 },
        ];
      }
      if (/r=payments|\/payments\b/.test(u)) {
        return [
          { id: 'inv_001', number: 'NWM-GHL-2026-0014', deal_id: 9004, contact: buyer.name, company: buyer.company, line_items: 'Setup + Month 1', amount: 694, status: 'paid', paid_at: '2026-05-08', method: 'Stripe Checkout' },
          { id: 'sub_001', number: 'SUB-GHL-0014', deal_id: 9004, contact: buyer.name, company: buyer.company, line_items: 'GHL White-Label monthly', amount: 197, status: 'active', next_charge_at: '2026-06-08', method: 'Stripe' },
        ];
      }
      if (/r=subaccounts|\/subaccounts\b/.test(u)) {
        return [
          { id: 'sub_marcus', client: buyer.company, domain: 'marcustestrealty.gohighlevel.com', plan: 'GHL White-Label', status: 'active', snapshot: 'Estetica.Social (real-estate adapted)', provisioned_at: '2026-05-08T15:14:00Z', admin: buyer.name, mrr: 197 },
          { id: 'sub_demo01', client: 'Demo Client 01', domain: 'demo01.gohighlevel.com', plan: 'GHL White-Label', status: 'active', snapshot: 'Estetica.Social', provisioned_at: '2026-03-15T10:00:00Z', admin: 'Demo User', mrr: 197 },
          { id: 'sub_demo02', client: 'Demo Client 02', domain: 'demo02.gohighlevel.com', plan: 'GHL White-Label', status: 'active', snapshot: 'Estetica.Social', provisioned_at: '2026-04-02T11:30:00Z', admin: 'Demo User', mrr: 197 },
        ];
      }
      return { ok: true, data: [], items: [] };
    };

    const realFetch = window.fetch;
    window.fetch = function (resource, init) {
      const u = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      if (isApi(u)) return Promise.resolve(reply(route(u)));
      return realFetch.apply(this, arguments);
    };
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const realOpen = xhr.open;
      let stubUrl = null;
      xhr.open = function (method, url) { stubUrl = isApi(url) ? url : null; return realOpen.apply(xhr, arguments); };
      const realSend = xhr.send;
      xhr.send = function () {
        if (stubUrl) {
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
            Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: JSON.stringify(route(stubUrl)), configurable: true });
            xhr.onreadystatechange && xhr.onreadystatechange();
            xhr.onload && xhr.onload();
          }, 0);
          return;
        }
        return realSend.apply(xhr, arguments);
      };
      return xhr;
    };
  }, STAGES, BUYER);

  await page.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    localStorage.setItem('nwm_cookie_consent', 'all');
    localStorage.setItem('nwm_niche_picker_dismissed', '1');
    localStorage.setItem('nwm_token', 'admin-token-' + Date.now());
    localStorage.setItem('nwm_user', JSON.stringify(user));
  }, NWM_USER);

  const results = [];
  for (const s of SCREENS) {
    const dest = path.join(OUT_DIR, s.id + '.png');
    const deal = dealAtStage(s.stageIdx);
    const activity = ACTIVITY[s.stageIdx] || [];

    await page.evaluate((d, a) => {
      localStorage.setItem('__SIM_DEAL', JSON.stringify(d));
      localStorage.setItem('__SIM_ACTIVITY', JSON.stringify(a));
    }, deal, activity);

    try { await page.goto(ORIGIN + s.url, { waitUntil: 'networkidle2', timeout: 20000 }); }
    catch (e) {
      try { await page.goto(ORIGIN + s.url, { waitUntil: 'domcontentloaded', timeout: 10000 }); }
      catch (e2) { results.push({ id: s.id, status: 'navigation-failed', error: e2.message }); continue; }
    }

    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    });

    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    });

    try {
      await page.screenshot({ path: dest, fullPage: false, type: 'png' });
      const sz = fs.statSync(dest).size;
      results.push({ id: s.id, status: 'ok', size: sz, stage: s.stageLabel || s.id });
      console.log(`OK ${s.id} ${sz} bytes  ${s.stageLabel || s.url}`);
    } catch (e) {
      results.push({ id: s.id, status: 'screenshot-failed', error: e.message });
      console.log(`FAIL ${s.id} ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, '_manifest.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length}`);
})();

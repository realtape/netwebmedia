// Sales Management Simulation — Sarah Test buys CMO Growth.
// Walks her deal through 8 pipeline stages, capturing the CRM at each point.
//
// Stages (NetWebMedia's own sales funnel — distinct from law_firms client pipeline):
//   1. New Lead          — fresh inbound, untouched
//   2. Qualified         — first reply via WhatsApp
//   3. Discovery Scheduled
//   4. Discovery Done    — notes captured
//   5. Proposal Sent     — CMO Growth quote attached
//   6. Negotiation       — back-and-forth (1 question answered)
//   7. Won               — engagement letter signed
//   8. Active Client     — onboarding kicks off
//
// Usage: node docs/sales-management-simulation/capture.js
// Server: http://127.0.0.1:8083

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BUYER = {
  id: 7777,
  name: 'Sarah Test',
  email: 'sarah@testlawgroup.com',
  phone: '+1 415 555 0182',
  company: 'Test Law Group',
  region: 'US',
  source: 'aeo_brief_001',
  org_id: 1,
  user_id: 1,
};

const NWM_USER = {
  id: 1, name: 'Carlos Martinez', email: 'carlos@netwebmedia.com',
  organization: { id: 1, slug: 'netwebmedia', name: 'NetWebMedia' },
  plan: 'admin', role: 'owner', niche: 'smb',
};

// NWM's own 8 sales stages.
const STAGES = [
  { id: 1, name: 'New Lead',             sort_order: 1, color: '#94a3b8', probability: 5 },
  { id: 2, name: 'Qualified',            sort_order: 2, color: '#60a5fa', probability: 20 },
  { id: 3, name: 'Discovery Scheduled',  sort_order: 3, color: '#818cf8', probability: 35 },
  { id: 4, name: 'Discovery Done',       sort_order: 4, color: '#a78bfa', probability: 50 },
  { id: 5, name: 'Proposal Sent',        sort_order: 5, color: '#FF671F', probability: 65 },
  { id: 6, name: 'Negotiation',          sort_order: 6, color: '#ff8c4a', probability: 80 },
  { id: 7, name: 'Won',                  sort_order: 7, color: '#22C55E', probability: 100 },
  { id: 8, name: 'Active Client',        sort_order: 8, color: '#10b981', probability: 100 },
];

// Build a deal at each stage. Amount + probability + activity track the journey.
function dealAtStage(stageIdx) {
  const stage = STAGES[stageIdx];
  return {
    id: 9001,
    contact_id: BUYER.id,
    title: 'Test Law Group — CMO Growth',
    company: BUYER.company,
    contact_name: BUYER.name,
    contact_email: BUYER.email,
    stage: stage.name,
    stage_id: stage.id,
    value: stageIdx === 0 ? 999 : (stageIdx <= 3 ? 999 : 11988),  // monthly → annual after discovery
    amount: 999,                   // CMO Growth monthly
    setup_fee: 499,
    annual_value: 11988,           // 12 * 999
    probability: stage.probability,
    source: 'AEO Brief #001',
    owner_id: 1,
    owner_name: 'Carlos Martinez',
    days_in_stage: stageIdx === 0 ? 0 : (stageIdx <= 4 ? stageIdx : 1),
    created_at: '2026-05-04T14:22:00Z',
    expected_close: '2026-05-18',
    // Keep status='open' so the deal shows in the kanban (Won/Active are stages, not a status filter here).
    status: 'open',
    // Internal marker for the dashboard stub to know we're at "won" / "active client" stages.
    _won_or_active: stageIdx >= 6,
  };
}

// One screen per object — order matches the 8-stage journey.
const SCREENS = STAGES.map((stage, i) => ({
  id: `${String(i + 1).padStart(2, '0')}-stage-${stage.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  url: '/crm-vanilla/pipeline.html',
  stageIdx: i,
  stageLabel: stage.name,
}));

// Also capture: the contact record + dashboard summary at Active Client stage.
SCREENS.push(
  { id: '09-contact-record-active',  url: '/crm-vanilla/contacts.html',     stageIdx: 7 },
  { id: '10-dashboard-won-deal',     url: '/crm-vanilla/index.html',        stageIdx: 7 },
  { id: '11-documents-engagement',   url: '/crm-vanilla/documents.html',    stageIdx: 6 },
  { id: '12-payments-first-invoice', url: '/crm-vanilla/payments.html',     stageIdx: 7 },
);

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

  // Stub API: serve niche_config (stages) + deals + contacts.
  await page.evaluateOnNewDocument((stages, buyer) => {
    const isApi = (u) => !!u && (
      /\/api(?:-php)?\//.test(u) || /\/crm-vanilla\/api\//.test(u) ||
      /api\/index\.php/.test(u) || /\.php(\?|$)/.test(u)
    );
    const reply = (body) => new Response(JSON.stringify(body), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

    // Read current deal + activity from localStorage (set before each navigation).
    const getDeal = () => {
      try { return JSON.parse(localStorage.getItem('__SIM_DEAL') || 'null'); } catch (e) { return null; }
    };
    const getActivity = () => {
      try { return JSON.parse(localStorage.getItem('__SIM_ACTIVITY') || '[]'); } catch (e) { return []; }
    };

    const route = (u) => {
      const currentDeal = getDeal();
      const activityFeed = getActivity();
      if (/niche_config/.test(u)) return { ok: true, pipeline_stages: stages.map(s => ({ name: s.name, sort_order: s.sort_order, color: s.color, probability: s.probability })) };
      if (/r=stages/.test(u) || /\/stages\b/.test(u)) return stages;
      if (/r=deals/.test(u) || /\/deals\b/.test(u)) {
        return currentDeal ? [currentDeal] : [];
      }
      if (/r=contacts/.test(u) || /\/contacts\b/.test(u)) {
        return [{
          id: buyer.id, name: buyer.name, email: buyer.email, phone: buyer.phone,
          company: buyer.company, region: buyer.region, status: 'customer',
          source: 'aeo_brief_001', tags: ['cmo-growth-buyer','law-firm','high-intent'],
          owner_id: 1, owner_name: 'Carlos Martinez',
          last_contacted_at: '2026-05-11T09:42:00Z',
          lifetime_value: currentDeal && currentDeal._won_or_active ? 11988 : 0,
          activities: activityFeed,
        }];
      }
      if (/dashboard|overview|stats/i.test(u)) {
        const won = currentDeal && currentDeal._won_or_active;
        return {
          ok: true,
          revenue: { current: won ? 1498 : 0, previous: 0, delta_pct: 0 },
          deals: currentDeal ? [currentDeal] : [],
          schedule: won ? [{ when: 'Tomorrow 10:00', title: 'Kickoff — Test Law Group', who: 'Carlos + Sarah' }] : [],
          contacts: [{ id: buyer.id, name: buyer.name, email: buyer.email }],
          counts: { contacts: 1, deals: 1, tasks: won ? 6 : 0 },
        };
      }
      if (/r=documents|\/documents\b/.test(u)) {
        return [
          { id: 1, name: 'CMO Growth Proposal — Test Law Group.pdf', kind: 'proposal', deal_id: 9001, contact_id: buyer.id, sent_at: '2026-05-09', status: 'viewed', size_kb: 412 },
          { id: 2, name: 'Engagement Letter — Test Law Group.pdf', kind: 'contract', deal_id: 9001, contact_id: buyer.id, sent_at: '2026-05-10', status: 'signed', size_kb: 218 },
          { id: 3, name: 'NDA — Test Law Group.pdf', kind: 'nda', deal_id: 9001, contact_id: buyer.id, sent_at: '2026-05-09', status: 'signed', size_kb: 96 },
        ];
      }
      if (/r=payments|\/payments\b/.test(u)) {
        return [
          { id: 'inv_001', number: 'NWM-2026-0042', deal_id: 9001, contact: buyer.name, company: buyer.company, line_items: 'Setup fee + Month 1', amount: 1498, status: 'paid', paid_at: '2026-05-11', method: 'Stripe' },
          { id: 'sub_001', number: 'SUB-NWM-0042', deal_id: 9001, contact: buyer.name, company: buyer.company, line_items: 'CMO Growth monthly', amount: 999, status: 'active', next_charge_at: '2026-06-11', method: 'Stripe' },
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
      xhr.open = function (method, url) {
        stubUrl = isApi(url) ? url : null;
        return realOpen.apply(xhr, arguments);
      };
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

  // Pre-seed localStorage as Carlos (NWM admin viewing his own pipeline).
  await page.goto(ORIGIN + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    localStorage.setItem('nwm_cookie_consent', 'all');
    localStorage.setItem('nwm_niche_picker_dismissed', '1');
    localStorage.setItem('nwm_token', 'admin-token-' + Date.now());
    localStorage.setItem('nwm_user', JSON.stringify(user));
  }, NWM_USER);

  const ACTIVITY_BY_STAGE = [
    [{ at: '2026-05-04 14:22', type: 'form', who: 'system', text: 'Form submit on legal-services landing page · "Free 48h Audit"' }],
    [
      { at: '2026-05-04 14:22', type: 'form',     who: 'system',  text: 'Form submit · legal-services LP' },
      { at: '2026-05-04 14:48', type: 'email',    who: 'Sarah',   text: 'Replied to welcome-1 — "Yes, looking for an audit + recommendation on CMO Growth"' },
      { at: '2026-05-04 15:02', type: 'whatsapp', who: 'Sarah',   text: 'Sent first WhatsApp · "Hi Carlos, got your email. When can we talk?"' },
    ],
    [
      { at: '2026-05-04 15:08', type: 'whatsapp', who: 'Carlos',  text: 'Sent Calendly link · 30 min discovery' },
      { at: '2026-05-04 15:14', type: 'calendar', who: 'Sarah',   text: 'Booked · Thu May 7, 10:00 AM PT' },
    ],
    [
      { at: '2026-05-07 10:00', type: 'meeting', who: 'Carlos+Sarah', text: 'Discovery call — 32 min · transcript saved · 3 pain points captured' },
      { at: '2026-05-07 10:48', type: 'note',    who: 'Carlos',  text: 'Sarah is 4-attorney PI firm · 12 leads/mo, ~18% converting to retainer · Wants CMO Growth with focus on intake automation' },
    ],
    [
      { at: '2026-05-09 09:14', type: 'document', who: 'Carlos', text: 'Sent · CMO Growth Proposal — Test Law Group.pdf (4 pages)' },
      { at: '2026-05-09 11:52', type: 'document', who: 'Sarah',  text: 'Viewed proposal · 8 minutes · returned to "Pricing" 3x' },
    ],
    [
      { at: '2026-05-10 08:31', type: 'email',  who: 'Sarah',  text: 'Question: "Can we start with month-to-month and switch to annual at month 4?"' },
      { at: '2026-05-10 08:54', type: 'email',  who: 'Carlos', text: 'Yes — confirmed in writing · sent revised engagement letter' },
    ],
    [
      { at: '2026-05-10 14:08', type: 'document', who: 'Sarah',  text: 'Signed Engagement Letter via DocuSign' },
      { at: '2026-05-11 09:42', type: 'payment',  who: 'system', text: 'Stripe charge · $1,498 (setup $499 + month 1 $999) · paid' },
    ],
    [
      { at: '2026-05-11 09:43', type: 'system',   who: 'system',  text: 'Workflow fired · "Won → kickoff" · 6 tasks created · welcome email sent · sub-account provisioned' },
      { at: '2026-05-11 09:45', type: 'calendar', who: 'system',  text: 'Kickoff scheduled · Wed May 13, 10:00 AM PT' },
    ],
  ];

  const results = [];

  for (const s of SCREENS) {
    const dest = path.join(OUT_DIR, s.id + '.png');
    const deal = dealAtStage(s.stageIdx);
    const activity = ACTIVITY_BY_STAGE[s.stageIdx] || [];

    // Persist deal state to localStorage so the API stub reads the right deal
    // even after a page reload (each reload runs evaluateOnNewDocument afresh).
    await page.evaluate((d, a) => {
      localStorage.setItem('__SIM_DEAL', JSON.stringify(d));
      localStorage.setItem('__SIM_ACTIVITY', JSON.stringify(a));
    }, deal, activity);

    try {
      await page.goto(ORIGIN + s.url, { waitUntil: 'networkidle2', timeout: 20000 });
    } catch (e) {
      try { await page.goto(ORIGIN + s.url, { waitUntil: 'domcontentloaded', timeout: 10000 }); }
      catch (e2) { results.push({ id: s.id, status: 'navigation-failed', error: e2.message }); continue; }
    }

    await page.evaluate(() => {
      const banner = document.getElementById('nwm-cookie-banner');
      if (banner) banner.remove();
      document.querySelectorAll('#nwm-site-chat, .nwm-chat-widget').forEach(el => el.style.display = 'none');
    });

    await new Promise(r => setTimeout(r, 1000));

    // For later pipeline stages, scroll the kanban board horizontally so the
    // active column is on-screen. Stages 0-3 fit; 4+ need ~stage*280px scroll.
    if (s.url === '/crm-vanilla/pipeline.html' && s.stageIdx >= 4) {
      await page.evaluate((idx) => {
        const board = document.getElementById('pipelineBoard');
        if (board) board.scrollLeft = (idx - 3) * 290;
      }, s.stageIdx);
      await new Promise(r => setTimeout(r, 250));
    }

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
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length} screenshots saved to ${OUT_DIR}`);
})();

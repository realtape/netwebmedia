// Sales Simulation — CMO Premium variant.
// Buyer: David Test, Managing Partner at Test Premium Law Group (12-attorney firm, $4M rev).
// Plan: CMO Premium · $2,990/mo · $999 setup · $35,880 year-1 commitment.
//
// What's different vs. CMO Standard:
//   - sales-director (agent) handles stages 2-4; Carlos joins for stage 5 onward
//   - Stage 6 is a SYNCHRONOUS proposal call (not async like Standard)
//   - Longer cycle: ~14 days vs. 7
//   - Higher dollar values throughout
//
// Stages:
//   1. New Lead
//   2. Qualified           (sales-director)
//   3. Discovery Scheduled (sales-director)
//   4. Discovery Done      (sales-director + Carlos handoff)
//   5. Proposal Sent
//   6. Proposal Call       (synchronous walkthrough — unique to Premium)
//   7. Won
//   8. Active Client

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BUYER = {
  id: 7778,
  name: 'David Test',
  email: 'david@testpremiumlaw.com',
  phone: '+1 415 555 0271',
  company: 'Test Premium Law Group',
  region: 'US',
  source: 'aeo_audit_purchase',
  org_id: 1, user_id: 1,
};

const NWM_USER = {
  id: 1, name: 'Carlos Martinez', email: 'carlos@netwebmedia.com',
  organization: { id: 1, slug: 'netwebmedia', name: 'NetWebMedia' },
  plan: 'admin', role: 'owner', niche: 'smb',
};

const STAGES = [
  { id: 1, name: 'New Lead',             sort_order: 1, color: '#94a3b8', probability: 5  },
  { id: 2, name: 'Qualified',            sort_order: 2, color: '#60a5fa', probability: 20 },
  { id: 3, name: 'Discovery Scheduled',  sort_order: 3, color: '#818cf8', probability: 35 },
  { id: 4, name: 'Discovery Done',       sort_order: 4, color: '#a78bfa', probability: 50 },
  { id: 5, name: 'Proposal Sent',        sort_order: 5, color: '#FF671F', probability: 60 },
  { id: 6, name: 'Proposal Call',        sort_order: 6, color: '#ff8c4a', probability: 80 },
  { id: 7, name: 'Won',                  sort_order: 7, color: '#22C55E', probability: 100 },
  { id: 8, name: 'Active Client',        sort_order: 8, color: '#10b981', probability: 100 },
];

function dealAtStage(stageIdx) {
  const stage = STAGES[stageIdx];
  return {
    id: 9002,
    contact_id: BUYER.id,
    title: 'Test Premium Law Group — CMO Premium',
    company: BUYER.company,
    contact_name: BUYER.name,
    contact_email: BUYER.email,
    stage: stage.name,
    stage_id: stage.id,
    value: stageIdx <= 3 ? 2990 : 35880,  // monthly → annual after discovery
    amount: 2990,
    setup_fee: 999,
    annual_value: 35880,
    probability: stage.probability,
    source: 'AEO Audit purchase ($997 credit)',
    owner_id: 1,
    owner_name: stageIdx <= 3 ? 'Sales Director (agent)' : 'Carlos Martinez',
    days_in_stage: stageIdx === 0 ? 0 : (stageIdx <= 6 ? 2 : 1),
    created_at: '2026-04-28T11:15:00Z',
    expected_close: '2026-05-12',
    status: 'open',
    _won_or_active: stageIdx >= 6,
  };
}

const SCREENS = STAGES.map((stage, i) => ({
  id: `${String(i + 1).padStart(2, '0')}-stage-${stage.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  url: '/crm-vanilla/pipeline.html',
  stageIdx: i,
  stageLabel: stage.name,
}));
SCREENS.push(
  { id: '09-contact-record-active',  url: '/crm-vanilla/contacts.html',  stageIdx: 7 },
  { id: '10-dashboard-won-deal',     url: '/crm-vanilla/index.html',     stageIdx: 7 },
  { id: '11-documents-premium',      url: '/crm-vanilla/documents.html', stageIdx: 6 },
  { id: '12-payments-premium',       url: '/crm-vanilla/payments.html',  stageIdx: 7 },
);

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

const ACTIVITY = [
  [{ at: '2026-04-28 11:15', type: 'system', who: 'system', text: 'AEO Audit purchased ($997) · written audit delivered to david@testpremiumlaw.com 48h later' }],
  [
    { at: '2026-04-28 11:15', type: 'system',   who: 'system', text: 'AEO Audit purchased · upgrade-to-retainer credit ($997) attached' },
    { at: '2026-04-30 16:42', type: 'document', who: 'David',  text: 'Reviewed audit report · scheduled call with sales-director' },
    { at: '2026-04-30 17:08', type: 'note',     who: 'sales-director', text: 'BANT confirmed · 12-attorney firm · $4M revenue · Decision-maker confirmed' },
  ],
  [
    { at: '2026-04-30 17:14', type: 'whatsapp', who: 'sales-director', text: 'Sent Calendly link · 45 min Premium discovery' },
    { at: '2026-04-30 17:35', type: 'calendar', who: 'David',  text: 'Booked · Mon May 4, 11:00 AM PT · 45 min slot' },
  ],
  [
    { at: '2026-05-04 11:00', type: 'meeting', who: 'sales-director', text: 'Discovery call · 47 min · transcript saved · 5 pain points captured' },
    { at: '2026-05-04 12:18', type: 'note',    who: 'sales-director', text: 'Handoff brief sent to Carlos · firm needs full marketing dept replacement · 6 practice areas, 4 cities' },
    { at: '2026-05-05 09:42', type: 'note',    who: 'Carlos', text: 'Reviewed brief · proposal scope: Premium with $1.5k/mo ad spend + AI SDR seat for senior partner' },
  ],
  [
    { at: '2026-05-06 14:08', type: 'document', who: 'Carlos', text: 'Sent · CMO Premium Proposal — Test Premium Law Group.pdf (6 pages)' },
    { at: '2026-05-06 16:24', type: 'document', who: 'David',  text: 'Viewed proposal · 14 minutes · forwarded to 2 partners' },
    { at: '2026-05-07 10:18', type: 'email',    who: 'David',  text: 'Replied: "Strong interest. Can we schedule a 45-min walkthrough with our team this week?"' },
  ],
  [
    { at: '2026-05-08 14:00', type: 'meeting', who: 'Carlos + 4 partners', text: 'Proposal Call · 52 min · 3 questions: SLA on content review, paid spend cap, exit on attorney moves to competitor' },
    { at: '2026-05-08 15:22', type: 'document', who: 'Carlos', text: 'Sent revised proposal addressing all 3 questions · NDA + engagement letter attached' },
  ],
  [
    { at: '2026-05-11 09:08', type: 'document', who: 'David',  text: 'Engagement Letter signed via DocuSign (all 3 partners co-signed)' },
    { at: '2026-05-11 09:09', type: 'payment',  who: 'system', text: 'Stripe charge · $3,989 (setup $999 + month 1 $2,990) · paid' },
  ],
  [
    { at: '2026-05-11 09:10', type: 'system',   who: 'system', text: 'Workflow fired · "Premium Won → kickoff" · 11 tasks created · all 4 partners CC\'d on welcome email' },
    { at: '2026-05-11 09:15', type: 'calendar', who: 'system', text: 'Premium kickoff scheduled · Thu May 14, 9:00 AM PT · 90 min · all partners + NWM team' },
  ],
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox'],
  });
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
          region: buyer.region, status: 'customer', source: 'aeo_audit_purchase',
          tags: ['cmo-premium-buyer','law-firm','large-firm','high-value'],
          owner_id: 1, owner_name: 'Carlos Martinez',
          last_contacted_at: '2026-05-11T09:42:00Z',
          lifetime_value: currentDeal && currentDeal._won_or_active ? 35880 : 0,
          activities: getActivity(),
        }];
      }
      if (/dashboard|overview|stats/i.test(u)) {
        const won = currentDeal && currentDeal._won_or_active;
        return {
          ok: true,
          revenue: { current: won ? 3989 : 0, previous: 0, delta_pct: 0 },
          deals: currentDeal ? [currentDeal] : [],
          schedule: won ? [{ when: 'Thu 09:00', title: 'Premium Kickoff — Test Premium Law', who: '4 partners + NWM team' }] : [],
          contacts: [{ id: buyer.id, name: buyer.name, email: buyer.email }],
          counts: { contacts: 1, deals: 1, tasks: won ? 11 : 0 },
        };
      }
      if (/r=documents|\/documents\b/.test(u)) {
        return [
          { id: 1, name: 'AEO Audit — Test Premium Law Group.pdf', kind: 'audit', deal_id: 9002, contact_id: buyer.id, sent_at: '2026-04-30', status: 'delivered', size_kb: 1240 },
          { id: 2, name: 'CMO Premium Proposal — Test Premium Law Group.pdf', kind: 'proposal', deal_id: 9002, contact_id: buyer.id, sent_at: '2026-05-06', status: 'viewed', size_kb: 768 },
          { id: 3, name: 'CMO Premium Proposal v2 (revised) — Test Premium Law Group.pdf', kind: 'proposal', deal_id: 9002, contact_id: buyer.id, sent_at: '2026-05-08', status: 'viewed', size_kb: 812 },
          { id: 4, name: 'Engagement Letter — Test Premium Law Group.pdf', kind: 'contract', deal_id: 9002, contact_id: buyer.id, sent_at: '2026-05-10', status: 'signed', size_kb: 264 },
          { id: 5, name: 'Mutual NDA — Test Premium Law Group.pdf', kind: 'nda', deal_id: 9002, contact_id: buyer.id, sent_at: '2026-05-06', status: 'signed', size_kb: 96 },
        ];
      }
      if (/r=payments|\/payments\b/.test(u)) {
        return [
          { id: 'inv_000', number: 'NWM-2026-0037', deal_id: 9002, contact: buyer.name, company: buyer.company, line_items: 'AEO Audit (one-time)', amount: 997, status: 'paid', paid_at: '2026-04-28', method: 'Stripe' },
          { id: 'inv_001', number: 'NWM-2026-0048', deal_id: 9002, contact: buyer.name, company: buyer.company, line_items: 'Setup fee + Month 1 (less $997 audit credit)', amount: 2992, status: 'paid', paid_at: '2026-05-11', method: 'Stripe' },
          { id: 'sub_001', number: 'SUB-NWM-0048', deal_id: 9002, contact: buyer.name, company: buyer.company, line_items: 'CMO Premium monthly', amount: 2990, status: 'active', next_charge_at: '2026-06-11', method: 'Stripe' },
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
  console.log(`\nDone. ${results.filter(r => r.status === 'ok').length}/${results.length}`);
})();

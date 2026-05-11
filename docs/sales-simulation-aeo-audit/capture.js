// Sales Simulation — AEO Audit ($997 one-time) variant.
// Buyer: Jamie Test, Solo Attorney at Jamie Test PLLC.
// Plan: AEO Audit · $997 one-time · 48h written delivery · 100% credit toward retainer
//
// Collapsed funnel — 3 stages only (no proposal, no negotiation, no engagement letter):
//   1. New Lead     (paid the $997)
//   2. Audit Delivered (within 48h)
//   3. Closed       (either upgraded to CMO retainer or stayed in nurture)
//
// This is the entry-hook funnel — most buyers self-serve via Stripe checkout, no human in the loop
// until delivery. The conversion goal is the 30-day upgrade to CMO Standard.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ORIGIN = 'http://127.0.0.1:8083';
const OUT_DIR = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BUYER = {
  id: 7779,
  name: 'Jamie Test',
  email: 'jamie@jamietestpllc.com',
  phone: '+1 415 555 0344',
  company: 'Jamie Test PLLC',
  region: 'US',
  source: 'organic_search',
  org_id: 1, user_id: 1,
};

const NWM_USER = {
  id: 1, name: 'Carlos Martinez', email: 'carlos@netwebmedia.com',
  organization: { id: 1, slug: 'netwebmedia', name: 'NetWebMedia' },
  plan: 'admin', role: 'owner', niche: 'smb',
};

const STAGES = [
  { id: 1, name: 'New Lead',         sort_order: 1, color: '#94a3b8', probability: 100 },  // Already paid
  { id: 2, name: 'Audit Delivered',  sort_order: 2, color: '#22C55E', probability: 100 },
  { id: 3, name: 'Closed',           sort_order: 3, color: '#10b981', probability: 100 },
];

function dealAtStage(stageIdx) {
  const stage = STAGES[stageIdx];
  return {
    id: 9003,
    contact_id: BUYER.id,
    title: 'Jamie Test PLLC — AEO Audit',
    company: BUYER.company,
    contact_name: BUYER.name,
    contact_email: BUYER.email,
    stage: stage.name,
    stage_id: stage.id,
    value: 997,
    amount: 997,
    probability: 100,
    source: 'Organic search · "AI marketing for solo attorneys"',
    owner_id: 1,
    owner_name: stageIdx === 0 ? 'System (no-touch)' : 'Carlos Martinez',
    days_in_stage: stageIdx === 0 ? 0 : (stageIdx === 1 ? 2 : 28),
    created_at: '2026-04-13T08:42:00Z',
    expected_close: '2026-04-15',
    status: 'open',
    _won_or_active: true,
  };
}

const SCREENS = STAGES.map((stage, i) => ({
  id: `${String(i + 1).padStart(2, '0')}-stage-${stage.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  url: '/crm-vanilla/pipeline.html',
  stageIdx: i,
  stageLabel: stage.name,
}));
SCREENS.push(
  { id: '04-contact-record', url: '/crm-vanilla/contacts.html',  stageIdx: 2 },
  { id: '05-dashboard',      url: '/crm-vanilla/index.html',     stageIdx: 2 },
  { id: '06-documents',      url: '/crm-vanilla/documents.html', stageIdx: 1 },
  { id: '07-payments',       url: '/crm-vanilla/payments.html',  stageIdx: 1 },
);

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

const ACTIVITY = [
  [
    { at: '2026-04-13 08:42', type: 'pageview', who: 'Jamie', text: 'Landed on /aeo-agency.html from Google search "AI marketing for solo attorneys"' },
    { at: '2026-04-13 08:48', type: 'pageview', who: 'Jamie', text: 'Read /industries/legal-services/ · 4 min on page' },
    { at: '2026-04-13 08:54', type: 'checkout', who: 'Jamie', text: 'Stripe Checkout · $997 AEO Audit · paid' },
    { at: '2026-04-13 08:54', type: 'system',   who: 'system', text: 'Workflow fired · audit-1 email sent · audit queued in cmo-agent backlog' },
  ],
  [
    { at: '2026-04-13 09:01', type: 'system', who: 'system', text: 'cmo-agent picked up audit task' },
    { at: '2026-04-13 14:22', type: 'system', who: 'cmo-agent', text: 'AEO baseline scan complete · 5 practice areas tested across ChatGPT/Claude/Perplexity' },
    { at: '2026-04-14 09:30', type: 'note',   who: 'Carlos', text: 'Reviewed AI scan results · added strategic recommendations · approved for delivery' },
    { at: '2026-04-15 07:00', type: 'document', who: 'system', text: 'Sent · AEO Audit — Jamie Test PLLC.pdf (18 pages) · audit-2 email fires' },
    { at: '2026-04-15 10:14', type: 'document', who: 'Jamie', text: 'Viewed audit · 22 minutes on document · downloaded twice' },
  ],
  [
    { at: '2026-04-18 11:08', type: 'email',   who: 'Jamie', text: 'Replied to audit-3 email: "Helpful. Not ready to commit yet — solo practice budget is tight."' },
    { at: '2026-04-18 11:42', type: 'email',   who: 'Carlos', text: 'Replied: "Totally understand. AEO Starter at $249/mo is a fit when you are ready — your $997 credits forward."' },
    { at: '2026-05-11 09:00', type: 'system',  who: 'system', text: 'Moved to Closed · enrolled in re_engagement nurture (90-day check back) · audit credit retained' },
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
          region: buyer.region, status: 'customer', source: 'organic_search',
          tags: ['aeo-audit-buyer','law-firm','solo-attorney','audit-credit-997'],
          owner_id: 1, owner_name: 'Carlos Martinez',
          last_contacted_at: '2026-04-18T11:42:00Z',
          lifetime_value: 997,
          activities: getActivity(),
        }];
      }
      if (/dashboard|overview|stats/i.test(u)) {
        return {
          ok: true,
          revenue: { current: 997, previous: 0, delta_pct: 0 },
          deals: currentDeal ? [currentDeal] : [],
          schedule: [],
          contacts: [{ id: buyer.id, name: buyer.name, email: buyer.email }],
          counts: { contacts: 1, deals: 1, tasks: 0 },
        };
      }
      if (/r=documents|\/documents\b/.test(u)) {
        return [
          { id: 1, name: 'AEO Audit — Jamie Test PLLC.pdf', kind: 'audit', deal_id: 9003, contact_id: buyer.id, sent_at: '2026-04-15', status: 'delivered', size_kb: 1240 },
          { id: 2, name: 'Service Order — AEO Audit.pdf', kind: 'service_order', deal_id: 9003, contact_id: buyer.id, sent_at: '2026-04-13', status: 'auto-accepted', size_kb: 64 },
        ];
      }
      if (/r=payments|\/payments\b/.test(u)) {
        return [
          { id: 'inv_001', number: 'NWM-2026-0029', deal_id: 9003, contact: buyer.name, company: buyer.company, line_items: 'AEO Audit (one-time)', amount: 997, status: 'paid', paid_at: '2026-04-13', method: 'Stripe Checkout' },
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

// Pipeline audit — pulls warm-leads snapshot from the production CRM.
//
// Outputs a ranked list of contacts to consider for this-week outreach:
//   Tier A — replied to anything in the last 30 days
//   Tier B — opened recent emails / has engagement signal
//   Tier C — older subscribers, low recent activity
//
// Usage:
//   1. Login to https://netwebmedia.com/crm-vanilla/ as admin
//   2. Open DevTools → Console → run:
//        copy(localStorage.getItem('nwm_token'))
//      to copy your auth token to clipboard
//   3. Run:
//        NWM_TOKEN="<paste-token-here>" node docs/this-week-sales-push/pipeline-audit.js
//   4. Output: console table + warm-leads.csv

const fs = require('fs');
const path = require('path');

const ORIGIN = process.env.ORIGIN || 'https://netwebmedia.com';
const TOKEN = process.env.NWM_TOKEN;

if (!TOKEN) {
  console.error('❌ NWM_TOKEN environment variable required.');
  console.error('   Get yours from https://netwebmedia.com/crm-vanilla/ → DevTools → localStorage.nwm_token');
  process.exit(1);
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': new URL(ORIGIN).origin,
  'Referer': `${ORIGIN}/crm-vanilla/contacts.html`,
  'X-Auth-Token': TOKEN,
};

async function fetchAll(path) {
  const r = await fetch(`${ORIGIN}${path}`, { headers: HEADERS });
  if (r.status !== 200) {
    console.error(`❌ ${path} returned HTTP ${r.status}`);
    const body = await r.text();
    console.error(body.slice(0, 400));
    process.exit(1);
  }
  return r.json();
}

function tier(contact) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const lastTouch = contact.last_contacted_at ? new Date(contact.last_contacted_at).getTime() : 0;
  const lastOpen = contact.last_email_open_at ? new Date(contact.last_email_open_at).getTime() : 0;
  const lastReply = contact.last_reply_at ? new Date(contact.last_reply_at).getTime() : 0;

  // Tier A: replied or strong touch in last 30 days.
  if (lastReply && (now - lastReply) < 30 * day) return 'A';
  if (contact.status === 'customer' || contact.status === 'lead') return 'A';
  if (lastTouch && (now - lastTouch) < 30 * day && (contact.tags || []).some(t => /high-intent|engaged|qualified/i.test(t))) return 'A';

  // Tier B: opened emails recently.
  if (lastOpen && (now - lastOpen) < 30 * day) return 'B';
  if (lastTouch && (now - lastTouch) < 60 * day) return 'B';

  // Tier C: subscriber but quiet.
  return 'C';
}

function fitScore(c) {
  // Higher = better fit for this-week law-firm push.
  let s = 0;
  const company = (c.company || '').toLowerCase();
  const tags = (c.tags || []).map(t => t.toLowerCase());
  if (/law|attorney|legal|firm|llp|p\.?c\.?|esq/i.test(c.company || '')) s += 40;
  if (tags.some(t => /law|legal|attorney/.test(t))) s += 20;
  if (c.niche === 'law_firms') s += 30;
  if (tags.includes('high-intent')) s += 25;
  if (tags.includes('audit-buyer') || tags.includes('aeo-audit-buyer')) s += 15;
  if (c.region === 'US') s += 10;  // primary market
  if (c.lifetime_value > 0) s += 10;
  return s;
}

(async () => {
  console.log(`Pulling contacts from ${ORIGIN}/crm-vanilla/api/?r=contacts ...`);
  const r = await fetchAll('/crm-vanilla/api/?r=contacts');
  const contacts = Array.isArray(r) ? r : (r.items || r.data || []);
  console.log(`Got ${contacts.length} contacts.\n`);

  // Score and tier every contact.
  const enriched = contacts.map(c => ({
    id: c.id,
    name: c.name || c.first_name + ' ' + (c.last_name || ''),
    email: c.email,
    phone: c.phone,
    company: c.company || '',
    region: c.region,
    status: c.status,
    tags: (c.tags || []).join(','),
    last_contacted_at: c.last_contacted_at,
    tier: tier(c),
    fit_score: fitScore(c),
  })).filter(c => c.email);

  // Sort by tier (A first) then fit_score.
  const sorted = enriched.sort((a, b) => {
    const tierOrder = { A: 0, B: 1, C: 2 };
    if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
    return b.fit_score - a.fit_score;
  });

  // Tier breakdown.
  const counts = { A: 0, B: 0, C: 0 };
  sorted.forEach(c => counts[c.tier]++);
  console.log('=== Tier breakdown ===');
  console.log(`  Tier A (warm/replied):     ${counts.A}`);
  console.log(`  Tier B (recent open):      ${counts.B}`);
  console.log(`  Tier C (older subscriber): ${counts.C}`);
  console.log();

  // Top-20 law-firm fits.
  const lawFirmFits = sorted.filter(c => c.fit_score >= 30).slice(0, 20);
  console.log(`=== Top ${lawFirmFits.length} law-firm fits (this-week candidates) ===`);
  console.table(lawFirmFits.map(c => ({
    tier: c.tier,
    fit: c.fit_score,
    name: (c.name || '').slice(0, 25),
    company: c.company.slice(0, 30),
    last_touch: c.last_contacted_at?.slice(0, 10) || '—',
  })));

  // Write CSV.
  const csvPath = path.resolve(__dirname, 'warm-leads.csv');
  const header = 'tier,fit_score,name,email,phone,company,region,status,tags,last_contacted_at\n';
  const rows = sorted.map(c => [
    c.tier, c.fit_score,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    c.email,
    c.phone || '',
    `"${c.company.replace(/"/g, '""')}"`,
    c.region || '',
    c.status || '',
    `"${c.tags.replace(/"/g, '""')}"`,
    c.last_contacted_at || '',
  ].join(',')).join('\n');
  fs.writeFileSync(csvPath, header + rows);
  console.log(`\n✓ Wrote ${sorted.length} contacts to ${csvPath}`);
  console.log(`  → Tier A + Tier B fits are your this-week outreach targets.`);
  console.log(`  → Open in Excel/Sheets and pick 15 names to send Tuesday morning.`);
})();

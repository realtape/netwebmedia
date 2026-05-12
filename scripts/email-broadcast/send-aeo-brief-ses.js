// NetWebMedia AEO Brief broadcast via AWS SES (SESv2 API).
//
// Sends a rendered HTML email template to a subscriber list with:
//   - Per-recipient personalization (first_name, language, unsubscribe token)
//   - Bilingual support (EN/ES split from a single LANG:EN / LANG:ES template)
//   - Proper deliverability headers (List-Unsubscribe RFC 8058, custom From, Reply-To)
//   - Throttled batching (~10 emails/sec to stay under SES default rate)
//   - Failure tracking — per-recipient bounce / complaint suppression handled by SES
//
// Required environment variables:
//   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY — IAM user with ses:SendEmail
//   AWS_REGION                                — e.g. us-east-1
//   SES_FROM_NAME                             — e.g. "Carlos · NetWebMedia"
//   SES_FROM_EMAIL                            — e.g. carlos@netwebmedia.com
//   SES_REPLY_TO                              — e.g. hello@netwebmedia.com
//   SUBSCRIBERS_CSV                           — path to CSV (default: ./subscribers.csv)
//   BRIEF_HTML                                — path to brief HTML (default: ../../email-templates/aeo-brief-002-jsonld.html)
//   BRIEF_BASE_HTML                           — path to _base.html wrapper (default: ../../email-templates/_base.html)
//   BRIEF_SUBJECT                             — e.g. "The 3 lines of JSON-LD most law firms are missing"
//   DRY_RUN                                   — "1" to skip the actual send (logs what would happen)
//
// Subscribers CSV format (header row required):
//   email,first_name,lang,unsubscribe_token,business_name
//   sarah@example.com,Sarah,en,abc123def456,Test Law Group
//   carlos@example.cl,Carlos,es,xyz789,Viña del Sur
//
// Usage:
//   AWS_ACCESS_KEY_ID=... \
//   AWS_SECRET_ACCESS_KEY=... \
//   AWS_REGION=us-east-1 \
//   SES_FROM_EMAIL=carlos@netwebmedia.com \
//   SES_REPLY_TO=hello@netwebmedia.com \
//   BRIEF_SUBJECT="The 3 lines of JSON-LD most law firms are missing" \
//   node scripts/email-broadcast/send-aeo-brief-ses.js

const fs = require('fs');
const path = require('path');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

// ─── Config ──────────────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-east-1';
const FROM_NAME = process.env.SES_FROM_NAME || 'Carlos · NetWebMedia';
const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const REPLY_TO = process.env.SES_REPLY_TO || FROM_EMAIL;
const SUBSCRIBERS_CSV = process.env.SUBSCRIBERS_CSV || path.resolve(__dirname, 'subscribers.csv');
const BRIEF_HTML = process.env.BRIEF_HTML || path.resolve(__dirname, '../../email-templates/aeo-brief-002-jsonld.html');
const BRIEF_BASE_HTML = process.env.BRIEF_BASE_HTML || path.resolve(__dirname, '../../email-templates/_base.html');
const BRIEF_SUBJECT = process.env.BRIEF_SUBJECT || 'The 3 lines of JSON-LD most law firms are missing';
const PRIMARY_URL = process.env.BRIEF_PRIMARY_URL || 'https://netwebmedia.com/aeo-index.html?utm_source=aeo-brief&utm_medium=email&utm_campaign=brief-002';
const PRIMARY_CTA_EN = process.env.BRIEF_PRIMARY_CTA_EN || 'Run my AEO check (60 seconds)';
const PRIMARY_CTA_ES = process.env.BRIEF_PRIMARY_CTA_ES || 'Correr mi chequeo AEO (60 segundos)';
const DRY_RUN = process.env.DRY_RUN === '1';
const SEND_RATE_PER_SEC = parseInt(process.env.SES_SEND_RATE || '10', 10); // Stay under SES default 14/sec
const BATCH_DELAY_MS = Math.ceil(1000 / SEND_RATE_PER_SEC);

if (!FROM_EMAIL) {
  console.error('❌ SES_FROM_EMAIL is required (e.g. carlos@netwebmedia.com)');
  process.exit(1);
}

// ─── Template rendering ──────────────────────────────────────────────────────
function readTemplates() {
  const baseHtml = fs.readFileSync(BRIEF_BASE_HTML, 'utf8');
  const briefHtml = fs.readFileSync(BRIEF_HTML, 'utf8');
  return { baseHtml, briefHtml };
}

function extractLang(content, lang) {
  // Templates use <!-- LANG:EN --> and <!-- LANG:ES --> markers.
  const enStart = content.indexOf('LANG:EN');
  const esStart = content.indexOf('LANG:ES');
  if (enStart === -1) return content; // No language split — use as-is.
  if (lang === 'es' && esStart !== -1) {
    const start = content.indexOf('-->', esStart) + 3;
    return content.slice(start).trim();
  }
  // Default to EN.
  const start = content.indexOf('-->', enStart) + 3;
  const end = esStart === -1 ? content.length : content.lastIndexOf('<!--', esStart);
  return content.slice(start, end).trim();
}

function substitute(html, tokens) {
  // Replace {{token|fallback}} and {{token}} patterns.
  return html.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [name, fallback] = expr.split('|').map(s => s.trim());
    if (Object.prototype.hasOwnProperty.call(tokens, name) && tokens[name] !== null && tokens[name] !== undefined) {
      return String(tokens[name]);
    }
    return fallback ?? '';
  });
}

function renderForRecipient(baseHtml, briefHtml, recipient) {
  const lang = (recipient.lang || 'en').toLowerCase();
  const langContent = extractLang(briefHtml, lang);

  const tokens = {
    first_name: recipient.first_name || (lang === 'es' ? 'hola' : 'there'),
    business_name: recipient.business_name || '',
    email: recipient.email,
    primary_url: PRIMARY_URL,
    primary_cta_en: PRIMARY_CTA_EN,
    primary_cta_es: PRIMARY_CTA_ES,
    subject: BRIEF_SUBJECT,
    lang,
    preference_url: `https://netwebmedia.com/api/public/email/preferences?token=${encodeURIComponent(recipient.unsubscribe_token || '')}`,
    unsubscribe_url: `https://netwebmedia.com/api/public/email/unsubscribe?token=${encodeURIComponent(recipient.unsubscribe_token || '')}`,
  };

  const content = substitute(langContent, tokens);
  // Wrap in base layout — base uses {{CONTENT}} placeholder.
  const html = substitute(baseHtml, { ...tokens, CONTENT: content }).replace('{{CONTENT}}', content);

  // Plain-text alternative — strip tags, decode common entities.
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d|tr|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, '·')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&iquest;/g, '¿')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&times;/g, '×')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { html, text };
}

// ─── Subscribers CSV parser (tiny, no dep) ────────────────────────────────────
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Naive CSV — doesn't handle commas inside quoted fields. Good enough for our shape.
    const fields = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (fields[i] || '').trim(); });
    return row;
  });
}

// ─── SES send ────────────────────────────────────────────────────────────────
async function sendOne(client, recipient, html, text) {
  const command = new SendEmailCommand({
    FromEmailAddress: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: { ToAddresses: [recipient.email] },
    ReplyToAddresses: [REPLY_TO],
    Content: {
      Simple: {
        Subject: { Data: BRIEF_SUBJECT, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
        Headers: [
          {
            Name: 'List-Unsubscribe',
            Value: `<mailto:unsubscribe@netwebmedia.com?subject=unsubscribe%20${encodeURIComponent(recipient.email)}>, <https://netwebmedia.com/api/public/email/unsubscribe?token=${encodeURIComponent(recipient.unsubscribe_token || '')}>`,
          },
          {
            Name: 'List-Unsubscribe-Post',
            Value: 'List-Unsubscribe=One-Click',
          },
          {
            Name: 'X-NWM-Campaign',
            Value: 'aeo-brief-002',
          },
        ],
      },
    },
    ConfigurationSetName: process.env.SES_CONFIG_SET || undefined, // Optional — for event tracking
  });
  return client.send(command);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`AEO Brief broadcast via AWS SES`);
  console.log(`  Region:     ${REGION}`);
  console.log(`  From:       ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`  Reply-To:   ${REPLY_TO}`);
  console.log(`  Subject:    ${BRIEF_SUBJECT}`);
  console.log(`  Subscribers: ${SUBSCRIBERS_CSV}`);
  console.log(`  Template:   ${path.relative(process.cwd(), BRIEF_HTML)}`);
  console.log(`  Rate:       ${SEND_RATE_PER_SEC}/sec`);
  console.log(`  Dry run:    ${DRY_RUN ? 'YES — no emails sent' : 'NO — live send'}`);
  console.log('');

  // Load templates + subscribers.
  const { baseHtml, briefHtml } = readTemplates();
  if (!fs.existsSync(SUBSCRIBERS_CSV)) {
    console.error(`❌ Subscribers CSV not found at ${SUBSCRIBERS_CSV}`);
    console.error(`   Expected header: email,first_name,lang,unsubscribe_token,business_name`);
    process.exit(1);
  }
  const csv = fs.readFileSync(SUBSCRIBERS_CSV, 'utf8');
  const subscribers = parseCsv(csv).filter(s => s.email && s.email.includes('@'));
  console.log(`Loaded ${subscribers.length} subscribers from ${SUBSCRIBERS_CSV}`);

  // Group by language for reporting.
  const byLang = subscribers.reduce((acc, s) => {
    const lang = (s.lang || 'en').toLowerCase();
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});
  console.log(`Language split: ${JSON.stringify(byLang)}\n`);

  // Render one preview for sanity check.
  if (subscribers.length > 0) {
    const preview = renderForRecipient(baseHtml, briefHtml, subscribers[0]);
    const previewPath = path.resolve(__dirname, '_preview.html');
    fs.writeFileSync(previewPath, preview.html);
    console.log(`Wrote preview for ${subscribers[0].email} → ${previewPath}`);
    console.log(`  HTML: ${preview.html.length} bytes`);
    console.log(`  Text: ${preview.text.length} bytes\n`);
  }

  if (DRY_RUN) {
    console.log('DRY RUN — exiting without sending. Inspect _preview.html.');
    process.exit(0);
  }

  // Live send.
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY required for live send');
    process.exit(1);
  }

  const client = new SESv2Client({ region: REGION });

  const results = { sent: 0, failed: 0, errors: [] };
  const t0 = Date.now();

  for (let i = 0; i < subscribers.length; i++) {
    const sub = subscribers[i];
    try {
      const { html, text } = renderForRecipient(baseHtml, briefHtml, sub);
      const r = await sendOne(client, sub, html, text);
      results.sent++;
      if ((i + 1) % 25 === 0 || i === subscribers.length - 1) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  Sent ${i + 1}/${subscribers.length} (${elapsed}s elapsed)`);
      }
    } catch (e) {
      results.failed++;
      results.errors.push({ email: sub.email, error: e.message });
      console.log(`  ⚠ Failed ${sub.email}: ${e.message}`);
    }
    if (i < subscribers.length - 1) await sleep(BATCH_DELAY_MS);
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✓ Broadcast complete in ${totalSec}s`);
  console.log(`  Sent:   ${results.sent}`);
  console.log(`  Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    const errorsPath = path.resolve(__dirname, '_errors.json');
    fs.writeFileSync(errorsPath, JSON.stringify(results.errors, null, 2));
    console.log(`  Errors written to ${errorsPath}`);
  }
  process.exit(results.failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});

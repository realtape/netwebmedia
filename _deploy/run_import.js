#!/usr/bin/env node
/**
 * Bulk Contact Importer — sends usa_crm_import.json to the live CRM
 * in batches via the temporary import_contacts.php endpoint.
 *
 * Usage:  node run_import.js
 * Prereq: import_contacts.php must already be deployed to the server.
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const ENDPOINT   = 'https://app.netwebmedia.com/import_contacts.php';
const TOKEN      = 'nwm-import-7f3k2026';
const BATCH_SIZE = 400;
const DELAY_MS   = 300; // ms between batches to avoid overwhelming the server

const JSON_FILE = path.join(__dirname, 'usa_crm_import.json');

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function postJSON(url, body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed  = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib     = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(payload),
        'X-Import-Token':  token,
      },
      timeout: 60000,
    };

    const req = lib.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${JSON_FILE} ...`);
  const raw      = fs.readFileSync(JSON_FILE, 'utf8');
  const contacts = JSON.parse(raw);
  console.log(`Loaded ${contacts.length.toLocaleString()} contacts`);

  const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);
  console.log(`Sending ${totalBatches} batches of up to ${BATCH_SIZE} each to:\n  ${ENDPOINT}\n`);

  let totalInserted = 0;
  let totalErrors   = 0;

  for (let i = 0; i < totalBatches; i++) {
    const batch = contacts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const batchNum = i + 1;

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} records) ... `);

    try {
      const { status, body } = await postJSON(ENDPOINT, batch, TOKEN);

      if (status === 200 && body.ok) {
        totalInserted += body.inserted;
        totalErrors   += body.errors || 0;
        process.stdout.write(`✓  inserted=${body.inserted} errors=${body.errors || 0}\n`);
      } else {
        process.stdout.write(`✗  HTTP ${status}: ${JSON.stringify(body)}\n`);
        totalErrors += batch.length;
      }
    } catch (err) {
      process.stdout.write(`✗  ${err.message}\n`);
      totalErrors += batch.length;
    }

    if (i < totalBatches - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n──────────────────────────────────');
  console.log(`  Total inserted : ${totalInserted.toLocaleString()}`);
  console.log(`  Total errors   : ${totalErrors.toLocaleString()}`);
  console.log(`  Grand total    : ${(totalInserted + totalErrors).toLocaleString()}`);
  console.log('──────────────────────────────────');
  console.log('\nDone! Remember to delete import_contacts.php from the repo.\n');
}

main().catch(e => { console.error(e); process.exit(1); });

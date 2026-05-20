// Screenshot the 3 sale artifacts (proposal / engagement letter / invoice).
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ART = path.resolve(__dirname, 'artifacts');
const SHOT = path.resolve(__dirname, 'screenshots');

const FILES = [
  { id: 'artifact-01-proposal',           file: 'proposal.html' },
  { id: 'artifact-02-engagement-letter',  file: 'engagement-letter.html' },
  { id: 'artifact-03-invoice',            file: 'invoice.html' },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: { width: 920, height: 1200, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  for (const f of FILES) {
    const url = 'file:///' + path.join(ART, f.file).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 250));
    const h = await page.evaluate(() => Math.min(document.body.scrollHeight + 40, 4200));
    await page.setViewport({ width: 920, height: h, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 150));
    const dest = path.join(SHOT, f.id + '.png');
    await page.screenshot({ path: dest, fullPage: false, type: 'png' });
    console.log(`Shot ${f.id}.png  (${h}px)`);
  }
  await browser.close();
})();

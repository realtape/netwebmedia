const puppeteer = require('puppeteer');
const path = require('path');
const ART = path.resolve(__dirname, 'artifacts');
const SHOT = path.resolve(__dirname, 'screenshots');
const FILES = [
  { id: 'artifact-01-proposal-v2',       file: 'proposal.html' },
  { id: 'artifact-02-engagement-letter', file: 'engagement-letter.html' },
  { id: 'artifact-03-invoice',           file: 'invoice.html' },
];
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'], defaultViewport: { width: 920, height: 1200 } });
  const page = await browser.newPage();
  for (const f of FILES) {
    await page.goto('file:///' + path.join(ART, f.file).replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 250));
    const h = await page.evaluate(() => Math.min(document.body.scrollHeight + 40, 4400));
    await page.setViewport({ width: 920, height: h });
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: path.join(SHOT, f.id + '.png'), type: 'png' });
    console.log(`Shot ${f.id}.png (${h}px)`);
  }
  await browser.close();
})();

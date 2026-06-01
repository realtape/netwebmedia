#!/usr/bin/env node
/**
 * Render the NWM circle/badge logo SVG to true 4K PNG (transparent bg).
 * Run from repo root:  node tools/render-circle-4k.js
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(ROOT, 'assets/4k');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC = 'assets/images/nwm-logo.svg';
const NAME = 'nwm-circle-4k.png';
const SIZE = 4096;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const svgRaw = fs.readFileSync(path.resolve(ROOT, SRC), 'utf8');
    const page = await browser.newPage();
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:transparent;}
      svg{display:block;width:${SIZE}px;height:${SIZE}px;}
    </style></head><body>${svgRaw}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 400));
    const outPath = path.join(OUT_DIR, NAME);
    await page.screenshot({ path: outPath, type: 'png', omitBackground: true,
      clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
    console.log(`OK  assets/4k/${NAME}  ${SIZE}x${SIZE}  (${(fs.statSync(outPath).size/1024).toFixed(1)} KB)`);
  } finally { await browser.close(); }
})().catch(e => { console.error('Render failed:', e); process.exit(1); });

#!/usr/bin/env node
/**
 * Render the NWM brand SVG logos to true 4K PNGs (crisp vector → raster).
 * Outputs to assets/4k/. Transparent backgrounds.
 *
 * Run from repo root:  node tools/render-logos-4k.js
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(ROOT, 'assets/4k');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const jobs = [
  // [svg path, png filename, width, height]
  ['assets/nwm-logo.svg',                'nwm-logo-4k.png',                 4096, 4096],
  ['assets/nwm-logo-horizontal.svg',     'nwm-logo-horizontal-4k.png',     3840,  640],
  ['assets/nwm-logo-horizontal-dark.svg','nwm-logo-horizontal-dark-4k.png',3840,  464],
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    for (const [src, name, w, h] of jobs) {
      const svgRaw = fs.readFileSync(path.resolve(ROOT, src), 'utf8');
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });

      const html = `<!doctype html><html><head><style>
        html,body{margin:0;padding:0;width:${w}px;height:${h}px;background:transparent;}
        svg{display:block;width:${w}px;height:${h}px;}
      </style></head><body>${svgRaw}</body></html>`;

      await page.setContent(html, { waitUntil: 'load' });
      await new Promise(r => setTimeout(r, 400)); // let webfonts settle

      const outPath = path.join(OUT_DIR, name);
      await page.screenshot({
        path: outPath,
        type: 'png',
        omitBackground: true,
        clip: { x: 0, y: 0, width: w, height: h }
      });
      const size = fs.statSync(outPath).size;
      console.log(`OK  assets/4k/${name}  ${w}x${h}  (${(size/1024).toFixed(1)} KB)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error('Render failed:', err); process.exit(1); });

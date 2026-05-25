#!/usr/bin/env node
/**
 * Render SVG logo assets to PNG at the sizes the site actually references.
 * Uses puppeteer (already in node_modules).
 *
 * Run from repo root:  node _deploy/render-logo-pngs.js
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');

const jobs = [
  // [svg path, png path, width, height, background]
  ['assets/nwm-logo.svg',                'assets/nwm-logo.png',             512, 512, null],
  ['assets/nwm-logo.svg',                'assets/nwm-apple-touch-icon.png', 180, 180, null],
  ['assets/nwm-logo-horizontal.svg',     'assets/nwm-logo-lockup.png',     1080, 180, null],
  ['assets/og-cover.svg',                'assets/og-cover.png',            1200, 630, null],
  ['assets/og-industries.svg',           'assets/og-industries.png',       1200, 630, null],
  ['assets/og-pricing.svg',              'assets/og-pricing.png',          1200, 630, null],
];

function fileUrl(p) {
  return 'file:///' + path.resolve(ROOT, p).replace(/\\/g, '/');
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    for (const [src, dst, w, h, bg] of jobs) {
      const svgRaw = fs.readFileSync(path.resolve(ROOT, src), 'utf8');
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });

      // Inline the SVG content directly so there's no cross-origin / file-scheme
      // weirdness and no race with external <img> loads. Force the SVG to fill
      // the viewport regardless of its declared width/height attributes.
      const html = `<!doctype html><html><head><style>
        html,body{margin:0;padding:0;width:${w}px;height:${h}px;${bg ? `background:${bg};` : 'background:transparent;'}}
        svg{display:block;width:${w}px;height:${h}px;}
      </style></head><body>${svgRaw}</body></html>`;

      await page.setContent(html, { waitUntil: 'load' });
      // Give external fonts (Poppins via @import in dark variant) a beat to load.
      await new Promise(r => setTimeout(r, 350));

      const outPath = path.resolve(ROOT, dst);
      await page.screenshot({
        path: outPath,
        type: 'png',
        omitBackground: !bg,
        clip: { x: 0, y: 0, width: w, height: h }
      });
      const size = fs.statSync(outPath).size;
      console.log(`✓ ${dst}  ${w}x${h}  (${(size/1024).toFixed(1)} KB)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});

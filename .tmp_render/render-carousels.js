// Renders 15 carousel SVG slides → PNG (1080x1080) for Instagram upload.
// Reads from ../assets/social/carousels/*.svg
// Writes to   ../assets/social/carousels/*.png

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const INPUT_DIR  = path.join(__dirname, '..', 'assets', 'social', 'carousels');
const SLIDE_SIZE = 1080;

async function renderSvgToPng(browser, svgPath, pngPath) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  // Wrap the SVG in a minimal HTML page sized to 1080x1080 so Puppeteer's
  // viewport screenshot exactly matches the Instagram square spec.
  const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#010F3B;width:1080px;height:1080px}
  svg{display:block;width:1080px;height:1080px}
</style></head>
<body>${svg}</body></html>`;

  const page = await browser.newPage();
  await page.setViewport({ width: SLIDE_SIZE, height: SLIDE_SIZE, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: pngPath, type: 'png', omitBackground: false });
  await page.close();
}

(async () => {
  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    console.error(`No SVG files in ${INPUT_DIR}`);
    process.exit(1);
  }

  console.log(`Rendering ${files.length} carousels at ${SLIDE_SIZE}x${SLIDE_SIZE}…`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });

  try {
    for (const f of files) {
      const svgPath = path.join(INPUT_DIR, f);
      const pngPath = path.join(INPUT_DIR, f.replace(/\.svg$/, '.png'));
      try {
        await renderSvgToPng(browser, svgPath, pngPath);
        console.log(`  ✓ ${f.replace(/\.svg$/, '.png')}`);
      } catch (err) {
        console.error(`  ✗ ${f}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log('Done.');
})();

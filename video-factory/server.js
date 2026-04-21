/* Thin Express wrapper around Remotion renderer.
   POST /render  body: { template, input, job_id }
   → bundles + renders → returns { url } (relative to public outputs dir)
*/
const express = require('express');
const path = require('path');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT     = process.env.PORT || 3030;
const OUT_DIR  = process.env.OUT_DIR  || path.join(__dirname, '..', 'video-out');
const OUT_BASE = process.env.OUT_BASE || '/video-out';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let bundleLocation = null;
async function ensureBundle() {
  if (bundleLocation) return bundleLocation;
  bundleLocation = await bundle({
    entryPoint: path.join(__dirname, 'src', 'index.tsx'),
    webpackOverride: (c) => c,
  });
  return bundleLocation;
}

app.post('/render', async (req, res) => {
  const { template, input, job_id } = req.body || {};
  if (!template) return res.status(400).json({ err: 'template required' });

  try {
    const loc = await ensureBundle();
    const compositionId = template; // composition id in src/index.tsx must equal template
    const composition = await selectComposition({
      serveUrl: loc,
      id: compositionId,
      inputProps: input || {},
    });

    const filename = `${template}-${job_id || Date.now()}.mp4`;
    const outputLocation = path.join(OUT_DIR, filename);

    await renderMedia({
      composition,
      serveUrl: loc,
      codec: 'h264',
      outputLocation,
      inputProps: input || {},
    });

    return res.json({
      ok: true,
      url: `${OUT_BASE}/${filename}`,
      template,
      job_id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ err: String(e && e.message || e) });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[nwm-video-factory] listening :${PORT}, out=${OUT_DIR}`));

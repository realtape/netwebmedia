#!/usr/bin/env node
/**
 * Build a minimal ZIP for the CMO price update:
 *   - api/routes/billing.php  (updated CMO SKU prices)
 *   - _fixcmoprices.php       (server-side fix for 684 company audit pages)
 *   - _cmopoke2.php           (opcache invalidation for billing.php)
 */
const fs   = require('fs');
const path = require('path');
const JSZip = require('jszip');

process.chdir(path.join(__dirname, '..'));
const root = process.cwd();

const zip = new JSZip();

// Updated billing.php -> api/routes/billing.php
const billingPath = path.join(root, 'api-php/routes/billing.php');
zip.file('api/routes/billing.php', fs.readFileSync(billingPath));
console.log('+ api/routes/billing.php');

// Updated nwm-i18n.js (adds all public site translations, fixes fallback)
const i18nPath = path.join(root, 'assets/nwm-i18n.js');
zip.file('assets/nwm-i18n.js', fs.readFileSync(i18nPath));
console.log('+ assets/nwm-i18n.js');

// pricing.html — minmax() fix + logo width/height
zip.file('pricing.html', fs.readFileSync(path.join(root, 'pricing.html')));
console.log('+ pricing.html (minmax fix + logo dims)');

// analytics.html — input min-width fix for mobile
zip.file('analytics.html', fs.readFileSync(path.join(root, 'analytics.html')));
console.log('+ analytics.html (input min-width fix)');

// main.js — mobile menu position fix (dynamic top based on navbar height)
zip.file('js/main.js', fs.readFileSync(path.join(root, 'js/main.js')));
console.log('+ js/main.js (mobile menu position fix)');

// styles.css — scroll-padding-top for anchor links behind fixed navbar
zip.file('css/styles.css', fs.readFileSync(path.join(root, 'css/styles.css')));
console.log('+ css/styles.css (scroll-padding-top fix)');

// Fix script for company pages
const fixPath = path.join(root, '_deploy/_fixcmoprices.php');
zip.file('_fixcmoprices.php', fs.readFileSync(fixPath));
console.log('+ _fixcmoprices.php');

// Opcache poke script
const pokePHP = `<?php
// Force mtime + opcache invalidate for billing.php
$files = [
  '/home/webmed6/public_html/api/routes/billing.php',
];
foreach ($files as $f) {
  if (file_exists($f)) {
    if (function_exists('opcache_invalidate')) @opcache_invalidate($f, true);
    @touch($f);
  }
}
echo json_encode(['touched' => $files]);
@unlink(__FILE__);
`;
zip.file('_cmopoke2.php', pokePHP);
console.log('+ _cmopoke2.php (opcache poke)');

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then(buf => {
    const out = path.join(__dirname, 'netwebmedia-cmo-update.zip');
    fs.writeFileSync(out, buf);
    console.log(`\nZIP built: ${out}`);
    console.log(`Size: ${(buf.length / 1024).toFixed(1)} KB, files: 3`);
  });

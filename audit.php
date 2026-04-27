<?php
/* Per-prospect audit report — public, token-protected.
   URL pattern: /audit?lead=<base64email>&t=<token>
                /audit/<token>?e=<email>     (alternative)
   Token = first 24 hex chars of sha256(strtolower(email) . '|nwm-audit-2026')

   Renders a branded audit report for the prospect. Reads lead context from
   api-php/data/santiago_leads.csv. Print-friendly so Cmd+P → PDF gives the
   prospect a clean PDF audit deliverable in one click.

   No login, no form. The token is single-use friendly: anyone with the URL
   can view, but the URL is unguessable without knowing the email + secret.
*/

// ── Inputs ──────────────────────────────────────────────────────────
// IMPORTANT: don't lowercase before checking for base64 — base64 is case-
// sensitive and lowercasing corrupts the encoding. Only lowercase after we
// know we have a plain email.
$raw = trim((string)($_GET['e'] ?? $_GET['lead'] ?? ''));
$email = '';
if ($raw !== '') {
  if (strpos($raw, '@') !== false) {
    $email = strtolower($raw);
  } else {
    // Try base64-url decode for cleaner URLs (lead=<base64email>).
    $decoded = base64_decode(strtr($raw, '-_', '+/'), true);
    if ($decoded && strpos($decoded, '@') !== false) {
      $email = strtolower($decoded);
    }
  }
}
$token = trim((string)($_GET['t'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Lead parameter missing or invalid.";
  exit;
}

// ── Token validation ────────────────────────────────────────────────
$expected = substr(hash('sha256', $email . '|nwm-audit-2026'), 0, 24);
if (!hash_equals($expected, $token)) {
  http_response_code(403);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Invalid or missing token.";
  exit;
}

// ── View logging ────────────────────────────────────────────────────
// Append one line per view (TSV: email, timestamp, ip, ua). The CRM
// chile-campaign dashboard reads this to compute click-through metrics.
// Apache's data/.htaccess blocks direct HTTP access — only PHP can read it.
$viewLogDir  = __DIR__ . '/api-php/data';
$viewLogFile = $viewLogDir . '/audit-views.log';
if (is_dir($viewLogDir) || @mkdir($viewLogDir, 0755, true)) {
  $line = $email . "\t"
        . date('c') . "\t"
        . ($_SERVER['REMOTE_ADDR']     ?? '-') . "\t"
        . substr((string)($_SERVER['HTTP_USER_AGENT'] ?? '-'), 0, 200) . "\n";
  @file_put_contents($viewLogFile, $line, FILE_APPEND | LOCK_EX);
}

// ── Lead lookup ─────────────────────────────────────────────────────
$CSV = __DIR__ . '/api-php/data/santiago_leads.csv';
$lead = null;
if (file_exists($CSV)) {
  $fp = fopen($CSV, 'r');
  $headers = fgetcsv($fp);
  while ($row = fgetcsv($fp)) {
    if (count($row) !== count($headers)) continue;
    $r = array_combine($headers, $row);
    if (strtolower(trim($r['email'] ?? '')) === $email) { $lead = $r; break; }
  }
  fclose($fp);
}

// Fallback for previewable demo mode (when token is supplied but no CSV match).
if (!$lead) {
  $lead = [
    'company'   => 'Tu Empresa',
    'name'      => '',
    'email'     => $email,
    'niche_key' => $_GET['niche'] ?? 'smb',
    'niche'     => 'Empresa de Servicios',
    'city'      => 'Santiago',
    'website'   => '',
  ];
}

// ── Context derived from lead ──────────────────────────────────────
$company   = $lead['company']   ?? 'tu negocio';
$niche_key = $lead['niche_key'] ?? 'smb';
$niche     = $lead['niche']     ?? 'tu rubro';
$website   = trim((string)($lead['website'] ?? ''));
$city_raw  = $lead['city'] ?? 'Santiago';
$has_site  = $website && $website !== 'No website' && $website !== 'Not found';
$site_clean = $has_site ? preg_replace('#^https?://#', '', rtrim($website, '/')) : '';

// Demo / self-audit fallback: when the lead has no website but the email
// domain is a real corporate domain, infer the URL from the email so the
// engine can audit something real.
$email_domain = strtolower(substr(strrchr($email, '@') ?: '', 1));
$free_email_providers = [
  'gmail.com','hotmail.com','outlook.com','yahoo.com','live.com','icloud.com',
  'protonmail.com','proton.me','pm.me','aol.com','msn.com',
];
if (!$has_site && $email_domain && !in_array($email_domain, $free_email_providers, true)) {
  $website    = 'https://' . $email_domain;
  $has_site   = true;
  $site_clean = $email_domain;
  // For NetWebMedia self-audits, fix up the company display.
  if ($email_domain === 'netwebmedia.com') {
    $company = 'NetWebMedia';
    $niche   = 'Agencia digital · AEO · Automatización pyme';
  }
}

// ── REAL AUDIT — call the engine ────────────────────────────────────
require_once __DIR__ . '/api-php/lib/audit-engine.php';

// Allow token-holders to force-refresh the cache (same token already proves they
// have the signed URL — no additional secret needed).
if (!empty($_GET['refresh'])) {
  $cache_key  = md5(strtolower((string)$website) . '|' . $niche_key . '|' . strtolower((string)$city_raw));
  $cache_file = __DIR__ . '/api-php/data/audit-cache/' . $cache_key . '.json';
  if (is_file($cache_file)) @unlink($cache_file);
}

if ($has_site) {
  try {
    $audit_result = nwm_audit_cached($website, $niche_key, $city_raw);
  } catch (\Throwable $e) {
    error_log('[audit.php] engine error: ' . $e->getMessage());
    $audit_result = [
      'reachable'  => false,
      'score'      => 0,
      'band'       => 'Error',
      'color'      => '#6b7280',
      'dimensions' => [],
      'gaps'       => ['No pudimos completar el análisis automático en este momento. Te contactamos en menos de 24 horas con la auditoría manual.'],
      'priorities' => ['Verificar acceso al sitio y reintentar la auditoría automatizada.'],
      'projections'=> ['Una vez resuelto, completamos la medición de las 13 dimensiones.'],
      'http'       => ['status' => 0, 'https' => false, 'time_s' => 0, 'size_kb' => 0, 'redirects' => 0],
    ];
  }
} else {
  // No website on file — return a structurally-compatible "skipped" result.
  $audit_result = [
    'reachable'  => false,
    'score'      => 0,
    'band'       => 'Sin sitio',
    'color'      => '#6b7280',
    'dimensions' => [],
    'gaps'       => ['No tenemos sitio web registrado para ' . $company . '. El primer paso es publicar un sitio que podamos medir.'],
    'priorities' => ['Levantar un sitio mínimo (1 página) con HTTPS, schema LocalBusiness y captura WhatsApp.'],
    'projections'=> ['Con un sitio publicado podemos auditar las 13 dimensiones y proyectar mejoras concretas.'],
    'http'       => ['status' => 0, 'https' => false, 'time_s' => 0, 'size_kb' => 0, 'redirects' => 0],
  ];
}

$score       = (int)$audit_result['score'];
$score_band  = (string)$audit_result['band'];
$score_color = (string)$audit_result['color'];
$dimensions  = $audit_result['dimensions'] ?? [];
$gaps        = $audit_result['gaps']        ?? [];
$priorities  = $audit_result['priorities']  ?? [];
$projections = $audit_result['projections'] ?? [];
$reachable   = !empty($audit_result['reachable']);
$http_meta   = $audit_result['http'] ?? [];

// Subdomain CTA for "talk to us" footer.
$subdomain_map = [
  'tourism'            => ['host' => 'hotels.netwebmedia.com',       'label' => 'Hoteles y alojamiento'],
  'restaurants'        => ['host' => 'restaurants.netwebmedia.com',  'label' => 'Restaurantes y gastronomía'],
  'beauty'             => ['host' => 'salons.netwebmedia.com',       'label' => 'Belleza y spa'],
  'law_firms'          => ['host' => 'legal.netwebmedia.com',        'label' => 'Estudios jurídicos'],
  'real_estate'        => ['host' => 'realestate.netwebmedia.com',   'label' => 'Inmobiliarias y corredores'],
  'health'             => ['host' => 'healthcare.netwebmedia.com',   'label' => 'Salud y clínicas'],
  'home_services'      => ['host' => 'home.netwebmedia.com',         'label' => 'Servicios para el hogar'],
  'education'          => ['host' => 'netwebmedia.com',              'label' => 'Educación'],
  'automotive'         => ['host' => 'netwebmedia.com',              'label' => 'Automotriz'],
  'financial_services' => ['host' => 'pro.netwebmedia.com',          'label' => 'Servicios financieros'],
  'events_weddings'    => ['host' => 'hospitality.netwebmedia.com',  'label' => 'Eventos y bodas'],
  'wine_agriculture'   => ['host' => 'netwebmedia.com',              'label' => 'Vino y agricultura'],
  'local_specialist'   => ['host' => 'netwebmedia.com',              'label' => 'Especialistas locales'],
  'smb'                => ['host' => 'netwebmedia.com',              'label' => 'Pymes'],
];
$sub = $subdomain_map[$niche_key] ?? ['host' => 'netwebmedia.com', 'label' => 'NetWebMedia'];
$cta_url = 'https://' . $sub['host'] . '/?utm_source=audit&utm_campaign=santiago-apr26&utm_content=' . urlencode($niche_key);

// WhatsApp deep link
$wa_text = rawurlencode('Hola NetWebMedia, soy de ' . $company . '. Vi la auditoría y quiero conversar.');
$wa_link = 'https://wa.me/14155238886?text=' . $wa_text;

// HTML escape helpers
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// Audit date — "abril 2026"
$audit_date = 'abril 2026';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Auditoría digital — <?= h($company) ?> | NetWebMedia</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #010F3B;
    --orange: #FF671F;
    --orange-soft: #FFF1E8;
    --white: #ffffff;
    --gray-50: #fafafa;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-500: #6b7280;
    --gray-700: #374151;
    --text: #111827;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--gray-50); font-family: 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: var(--text); }
  body { padding: 32px 16px 80px; }
  .doc { max-width: 880px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.06); }

  /* COVER */
  .cover { position: relative; background: var(--navy); color: white; padding: 56px 64px; overflow: hidden; }
  .cover::before { content:''; position:absolute; top:-140px; right:-140px; width:520px; height:520px; border-radius:50%; background:rgba(255,103,31,0.18); }
  .cover::after { content:''; position:absolute; bottom:-100px; left:-100px; width:340px; height:340px; border-radius:50%; background:rgba(255,103,31,0.10); }
  .cover-top { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:2; }
  .brand { font-family:'Poppins',sans-serif; font-weight:800; font-size:20px; letter-spacing:0.5px; }
  .brand .dot { color: var(--orange); }
  .cover-year { font-size:13px; opacity:0.7; letter-spacing:1px; text-transform:uppercase; }
  .cover-body { margin-top:60px; position:relative; z-index:2; }
  .cover-tag { display:inline-block; background:var(--orange); color:white; padding:6px 14px; border-radius:50px; font-size:12px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; margin-bottom:18px; }
  .cover-title { font-family:'Poppins',sans-serif; font-weight:800; font-size:42px; line-height:1.15; margin-bottom:14px; }
  .cover-subtitle { font-size:18px; line-height:1.55; opacity:0.85; max-width:560px; }
  .cover-bottom { margin-top:64px; display:flex; justify-content:space-between; align-items:flex-end; position:relative; z-index:2; gap:24px; flex-wrap:wrap; }
  .cover-meta { font-size:13px; line-height:1.7; opacity:0.85; }
  .cover-meta strong { color: var(--orange); display:block; font-size:16px; margin-bottom:2px; }

  /* PAGE */
  .page { padding: 56px 64px; }
  .page + .page { border-top: 1px solid var(--gray-200); }

  h2.section { font-family:'Poppins',sans-serif; font-weight:800; font-size:28px; color: var(--navy); margin-bottom:8px; }
  .section-eyebrow { font-size:12px; font-weight:700; color:var(--orange); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:6px; }
  .section-lead { font-size:16px; color:var(--gray-700); line-height:1.65; margin-bottom:24px; }

  /* SCORE CARD */
  .score-row { display:flex; gap:24px; align-items:stretch; flex-wrap:wrap; margin-bottom:24px; }
  .score-card { flex:1 1 280px; background:linear-gradient(135deg,var(--navy),#0a1f5c); color:white; border-radius:14px; padding:28px; }
  .score-num { font-family:'Poppins',sans-serif; font-weight:800; font-size:72px; line-height:1; color: <?= h($score_color) ?>; }
  .score-label { font-size:13px; text-transform:uppercase; letter-spacing:1.2px; opacity:0.7; margin-top:8px; }
  .score-band { display:inline-block; margin-top:12px; padding:6px 14px; border-radius:50px; font-size:12px; font-weight:700; background:<?= h($score_color) ?>; color:white; letter-spacing:0.4px; text-transform:uppercase; }
  .score-meta { flex:1 1 280px; display:flex; flex-direction:column; justify-content:center; padding:8px 0; }
  .score-meta-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--gray-200); font-size:14px; }
  .score-meta-row:last-child { border-bottom:0; }
  .score-meta-label { color:var(--gray-500); }
  .score-meta-val { color:var(--text); font-weight:600; }

  /* DIMENSIONS GRID */
  .dim-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:24px; }
  .dim-card { display:flex; align-items:center; gap:14px; padding:14px 16px; border:1px solid var(--gray-200); border-radius:10px; background:white; }
  .dim-bar { flex:0 0 56px; height:56px; border-radius:50%; background:conic-gradient(var(--bar-color, var(--orange)) calc(var(--bar-pct,0) * 1%), var(--gray-100) 0); display:flex; align-items:center; justify-content:center; position:relative; }
  .dim-bar::before { content:''; position:absolute; inset:6px; background:white; border-radius:50%; }
  .dim-bar-num { position:relative; z-index:2; font-family:'Poppins',sans-serif; font-weight:800; font-size:14px; color:var(--text); }
  .dim-body { flex:1; min-width:0; }
  .dim-title { font-size:13px; font-weight:700; color:var(--text); line-height:1.3; margin-bottom:3px; }
  .dim-detail { font-size:11px; color:var(--gray-500); line-height:1.4; }
  .dim-status { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:50px; letter-spacing:0.4px; text-transform:uppercase; margin-left:6px; vertical-align:1px; }
  .dim-status.pass { background:#d1fae5; color:#065f46; }
  .dim-status.warn { background:#fef3c7; color:#92400e; }
  .dim-status.fail { background:#fee2e2; color:#991b1b; }
  .dim-status.skipped { background:#e5e7eb; color:#4b5563; }
  @media (max-width:720px) { .dim-grid { grid-template-columns:1fr; } }

  /* VERIFICATION STAMP */
  .verify-stamp { display:flex; gap:14px; align-items:center; padding:14px 18px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; margin-top:24px; font-size:13px; color:#065f46; }
  .verify-stamp strong { color:#064e3b; }
  .verify-icon { flex:0 0 28px; height:28px; background:#10b981; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; }

  /* GAPS */
  .gap-list { list-style:none; padding:0; margin:0; }
  .gap-item { display:flex; gap:18px; padding:18px; border:1px solid var(--gray-200); border-radius:10px; margin-bottom:12px; }
  .gap-num { flex:0 0 36px; height:36px; background:var(--orange-soft); color:var(--orange); border-radius:8px; font-family:'Poppins',sans-serif; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:15px; }
  .gap-text { flex:1; font-size:15px; line-height:1.6; color:var(--text); }

  /* PRIORITIES */
  .priorities { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:8px; }
  .priority-card { padding:20px; border:1px solid var(--gray-200); border-radius:10px; background:var(--gray-50); }
  .priority-num { font-family:'Poppins',sans-serif; font-weight:800; color:var(--orange); font-size:14px; margin-bottom:8px; letter-spacing:0.5px; }
  .priority-text { font-size:14px; line-height:1.55; color:var(--gray-700); }

  /* PROJECTION */
  .projection-list { list-style:none; padding:0; margin:0; }
  .projection-item { padding:14px 16px; background:var(--orange-soft); border-left:4px solid var(--orange); border-radius:6px; margin-bottom:10px; font-size:15px; line-height:1.55; }

  /* CTA SECTION */
  .cta-section { background:var(--navy); color:white; padding:48px 64px; text-align:center; }
  .cta-section h3 { font-family:'Poppins',sans-serif; font-weight:800; font-size:26px; margin-bottom:10px; }
  .cta-section p { opacity:0.85; font-size:16px; line-height:1.6; max-width:520px; margin:0 auto 22px; }
  .cta-buttons { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .btn { display:inline-block; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; transition:transform 0.1s; }
  .btn-orange { background:var(--orange); color:white; }
  .btn-ghost { background:transparent; color:white; border:2px solid rgba(255,255,255,0.3); }
  .btn:hover { transform: translateY(-1px); }

  /* PRINT TOOLBAR (screen only) */
  .print-bar { position:fixed; top:16px; right:16px; z-index:50; display:flex; gap:10px; align-items:center; background:white; padding:10px 14px; border-radius:10px; box-shadow:0 4px 18px rgba(0,0,0,0.12); }
  .print-bar button { background:var(--orange); color:white; border:0; padding:10px 18px; border-radius:6px; font-weight:600; font-size:14px; cursor:pointer; font-family:inherit; }
  .print-bar .hint { font-size:12px; color:var(--gray-500); }

  /* FOOTER */
  .doc-footer { padding:24px 64px; font-size:12px; color:var(--gray-500); border-top:1px solid var(--gray-200); display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .doc-footer a { color:var(--gray-500); }

  @media (max-width:720px) {
    body { padding:0; }
    .doc { border-radius:0; box-shadow:none; }
    .cover, .page, .cta-section, .doc-footer { padding-left:24px; padding-right:24px; }
    .cover-title { font-size:30px; }
    .priorities { grid-template-columns:1fr; }
    .print-bar { top:auto; bottom:16px; right:16px; left:16px; justify-content:center; }
  }

  /* PRINT */
  @media print {
    body { background:white; padding:0; }
    .doc { box-shadow:none; max-width:none; border-radius:0; }
    .print-bar { display:none !important; }
    .cover, .page, .cta-section { padding:0.6in 0.7in; }
    .cover { page-break-after:always; }
    .page { page-break-inside:avoid; }
    .cta-section { background:var(--navy) !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .score-card { background:var(--navy) !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    a { color:inherit; text-decoration:none; }
  }
</style>
</head>
<body>

<div class="print-bar">
  <span class="hint">Auditoría lista · descárgala como PDF</span>
  <button onclick="window.print()">Descargar PDF</button>
</div>

<div class="doc">

  <!-- COVER -->
  <section class="cover">
    <div class="cover-top">
      <div class="brand">NetWebMedia<span class="dot">.</span></div>
      <div class="cover-year"><?= h($audit_date) ?> · Santiago, Chile</div>
    </div>
    <div class="cover-body">
      <div class="cover-tag">Auditoría digital · <?= h($sub['label']) ?></div>
      <h1 class="cover-title"><?= h($company) ?></h1>
      <p class="cover-subtitle">Análisis de presencia digital, brechas detectadas y proyección de captación de clientes a 90 días.</p>
    </div>
    <div class="cover-bottom">
      <div class="cover-meta">
        <strong>Preparado para</strong>
        <?= h($company) ?><?= $has_site ? '<br>' . h($site_clean) : '' ?><br>
        <?= h(ucfirst($lead['city'] ?? 'Santiago')) ?>, Chile
      </div>
      <div class="cover-meta" style="text-align:right;">
        <strong>Por NetWebMedia</strong>
        Equipo NetWebMedia<br>
        netwebmedia.com<br>
        hola@netwebmedia.com
      </div>
    </div>
  </section>

  <!-- SCORE -->
  <section class="page">
    <div class="section-eyebrow">Resumen ejecutivo</div>
    <h2 class="section">Puntaje de presencia digital</h2>
    <p class="section-lead">Calculado a partir de <?= count($dimensions) ?: 13 ?> dimensiones medidas en vivo sobre <?= h($site_clean ?: 'tu sitio') ?>: AEO, velocidad móvil, schema, captura de leads, reseñas, WhatsApp, conversión móvil, automatización, social, contenido, branding, reputación y rastreabilidad.</p>
    <div class="score-row">
      <div class="score-card">
        <div class="score-num"><?= $score ?><span style="font-size:32px;color:rgba(255,255,255,0.5);">/100</span></div>
        <div class="score-label">Presencia digital</div>
        <div class="score-band">Nivel: <?= h($score_band) ?></div>
      </div>
      <div class="score-meta">
        <div class="score-meta-row"><span class="score-meta-label">Empresa</span><span class="score-meta-val"><?= h($company) ?></span></div>
        <div class="score-meta-row"><span class="score-meta-label">Rubro</span><span class="score-meta-val"><?= h($niche) ?></span></div>
        <?php if ($has_site): ?><div class="score-meta-row"><span class="score-meta-label">Sitio analizado</span><span class="score-meta-val"><?= h($site_clean) ?></span></div><?php endif; ?>
        <?php if ($reachable && !empty($http_meta)): ?>
        <div class="score-meta-row"><span class="score-meta-label">HTTPS</span><span class="score-meta-val"><?= !empty($http_meta['https']) ? 'Sí' : 'No' ?></span></div>
        <div class="score-meta-row"><span class="score-meta-label">Carga total</span><span class="score-meta-val"><?= h(number_format((float)($http_meta['time_s'] ?? 0), 2)) ?>s · <?= (int)($http_meta['size_kb'] ?? 0) ?> KB</span></div>
        <?php endif; ?>
        <div class="score-meta-row"><span class="score-meta-label">Ciudad</span><span class="score-meta-val"><?= h(ucfirst($city_raw)) ?></span></div>
        <div class="score-meta-row"><span class="score-meta-label">Fecha</span><span class="score-meta-val"><?= h($audit_date) ?></span></div>
      </div>
    </div>

    <?php if (!empty($dimensions)): ?>
    <div class="dim-grid">
      <?php foreach ($dimensions as $key => $d):
        $ds = (int)($d['score'] ?? 0);
        $st = (string)($d['status'] ?? '');
        $bar_color = $ds >= 70 ? '#10b981' : ($ds >= 40 ? '#f59e0b' : '#ef4444');
      ?>
        <div class="dim-card">
          <div class="dim-bar" style="--bar-pct:<?= $ds ?>;--bar-color:<?= h($bar_color) ?>;">
            <span class="dim-bar-num"><?= $ds ?></span>
          </div>
          <div class="dim-body">
            <div class="dim-title"><?= h($d['label'] ?? $key) ?>
              <?php if ($st): ?><span class="dim-status <?= h($st) ?>"><?= $st === 'pass' ? 'OK' : ($st === 'warn' ? 'Mejorar' : ($st === 'fail' ? 'Crítico' : 'N/D')) ?></span><?php endif; ?>
            </div>
            <div class="dim-detail"><?= h($d['detail'] ?? '') ?></div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="verify-stamp">
      <div class="verify-icon">✓</div>
      <div>
        <strong>Auditoría verificada en vivo.</strong>
        Mediciones reales sobre <?= h($site_clean) ?> el <?= h(date('j \d\e F, Y H:i', strtotime((string)($audit_result['fetched_at'] ?? 'now')))) ?>.
        Motor: <?= h($audit_result['engine'] ?? 'nwm-audit/1.0') ?>.
      </div>
    </div>
    <?php elseif (!$reachable && $has_site): ?>
    <div class="verify-stamp" style="background:#fef2f2;border-color:#fecaca;color:#991b1b;">
      <div class="verify-icon" style="background:#ef4444;">!</div>
      <div><strong>No pudimos acceder a <?= h($site_clean) ?>.</strong> El primer paso es asegurar que el dominio resuelva con HTTPS y responda en menos de 5 segundos.</div>
    </div>
    <?php endif; ?>
  </section>

  <!-- GAPS -->
  <section class="page">
    <?php $strong = ($score >= 90); ?>
    <div class="section-eyebrow"><?= $strong ? 'Fortalezas detectadas' : 'Brechas detectadas' ?></div>
    <h2 class="section"><?= $strong ? 'Lo que hace excepcional a ' . h($company) : 'Qué encontramos en ' . h($company) ?></h2>
    <p class="section-lead"><?= $strong
        ? 'Estas son las fortalezas que sostienen la presencia digital de ' . h($company) . ', ordenadas por su impacto en captación de clientes.'
        : 'Estas son las brechas que encontramos en la presencia digital de ' . h($company) . ', ordenadas de mayor a menor impacto en captación de clientes.' ?></p>
    <ol class="gap-list">
      <?php foreach ($gaps as $i => $g): ?>
        <li class="gap-item">
          <div class="gap-num"><?= sprintf('%02d', $i + 1) ?></div>
          <div class="gap-text"><?= h($g) ?></div>
        </li>
      <?php endforeach; ?>
    </ol>
  </section>

  <!-- PRIORITIES -->
  <section class="page">
    <div class="section-eyebrow">Plan de acción</div>
    <h2 class="section"><?= $strong ? '3 palancas para sostener el liderazgo' : '3 prioridades para los próximos 30 días' ?></h2>
    <p class="section-lead"><?= $strong
        ? 'Las tres palancas en las que ' . h($company) . ' sigue invirtiendo para mantener el puntaje sobre 90/100.'
        : 'Si tuviéramos que mover sólo tres palancas en ' . h($company) . ' antes de fin de mes, serían estas.' ?></p>
    <div class="priorities">
      <?php foreach ($priorities as $i => $p): ?>
        <div class="priority-card">
          <div class="priority-num">Prioridad <?= $i + 1 ?></div>
          <div class="priority-text"><?= h($p) ?></div>
        </div>
      <?php endforeach; ?>
    </div>
  </section>

  <!-- PROJECTION -->
  <section class="page">
    <div class="section-eyebrow">Proyección a 90 días</div>
    <h2 class="section">Lo que cambia si actúan</h2>
    <p class="section-lead">Estimaciones conservadoras basadas en el rubro de <?= h(strtolower($niche)) ?> y los benchmarks de NetWebMedia para implementaciones similares en Chile.</p>
    <ul class="projection-list">
      <?php foreach ($projections as $p): ?>
        <li class="projection-item"><?= h($p) ?></li>
      <?php endforeach; ?>
    </ul>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <h3>¿Conversamos 20 minutos?</h3>
    <p>Te muestro cómo NetWebMedia implementaría estas prioridades en <?= h($company) ?> — sin compromiso, sin pitch.</p>
    <div class="cta-buttons">
      <a class="btn btn-orange" href="<?= h($wa_link) ?>">WhatsApp directo</a>
      <a class="btn btn-ghost" href="<?= h($cta_url) ?>">Ver soluciones para <?= h($sub['label']) ?></a>
    </div>
  </section>

  <!-- FOOTER -->
  <div class="doc-footer">
    <div>NetWebMedia SpA · Santiago, Chile · <a href="mailto:hola@netwebmedia.com">hola@netwebmedia.com</a></div>
    <div>Auditoría preparada el <?= h(date('j \d\e F, Y')) ?> · Confidencial — sólo para <?= h($company) ?></div>
  </div>
</div>

<script>
  // Quick UX nicety: if the URL has #print, trigger the print dialog automatically.
  if (location.hash === '#print') setTimeout(function(){ window.print(); }, 500);
</script>
</body>
</html>

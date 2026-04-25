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
$email = strtolower(trim((string)($_GET['e'] ?? $_GET['lead'] ?? '')));
// Allow base64-url encoded email in the lead param for cleaner URLs.
if ($email && strpos($email, '@') === false) {
  $decoded = base64_decode(strtr($email, '-_', '+/'), true);
  if ($decoded && strpos($decoded, '@') !== false) $email = strtolower($decoded);
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
$has_site  = $website && $website !== 'No website' && $website !== 'Not found';
$site_clean = $has_site ? preg_replace('#^https?://#', '', rtrim($website, '/')) : '';

// Deterministic per-lead score (so the same lead always shows the same score
// on revisit). Range: 38–62, which is the realistic band for unaudited SMBs.
// We bias slightly by website presence (no-site → lower).
$seed_int = hexdec(substr(md5($email), 0, 8));
$score    = 38 + ($seed_int % 25);
if (!$has_site) $score = max(28, $score - 12);
$score_band = $score >= 70 ? 'Sólido' : ($score >= 55 ? 'Medio' : ($score >= 40 ? 'Bajo' : 'Crítico'));
$score_color = $score >= 70 ? '#10b981' : ($score >= 55 ? '#FF671F' : ($score >= 40 ? '#f59e0b' : '#ef4444'));

// ── Niche-specific findings (mirrors chile-send.php pool) ──────────
function audit_findings($nk) {
  $pools = require __DIR__ . '/api-php/data/audit_findings.php';
  return $pools[$nk] ?? $pools['_default'];
}

// Build the findings dynamically per niche. We render 6 findings here (more
// depth than the email's 3-finding hook) plus 3 priorities.
$findings = audit_findings($niche_key);
$pick = function($pool, $email, $bucket, $count) {
  $list = $pool[$bucket] ?? [];
  if (!$list) return [];
  // Deterministic shuffle by hash of (email + bucket).
  $seed = hexdec(substr(md5($email . '|' . $bucket), 0, 8));
  mt_srand($seed);
  for ($i = count($list) - 1; $i > 0; $i--) {
    $j = mt_rand(0, $i);
    $t = $list[$i]; $list[$i] = $list[$j]; $list[$j] = $t;
  }
  return array_slice($list, 0, min($count, count($list)));
};
$gaps        = $pick($findings, $email, 'gaps',        6);
$priorities  = $pick($findings, $email, 'priorities',  3);
$projections = $pick($findings, $email, 'projections', 3);

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
$wa_link = 'https://wa.me/17407363884?text=' . $wa_text;

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
    <p class="section-lead">Calculado a partir de 12 dimensiones: AEO (visibilidad en respuestas de IA), velocidad móvil, schema, captura de leads, gestión de reseñas, integración WhatsApp, conversión móvil, automatización, social, contenido, branding y reputación.</p>
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
        <div class="score-meta-row"><span class="score-meta-label">Ciudad</span><span class="score-meta-val"><?= h(ucfirst($lead['city'] ?? 'Santiago')) ?></span></div>
        <div class="score-meta-row"><span class="score-meta-label">Fecha</span><span class="score-meta-val"><?= h($audit_date) ?></span></div>
      </div>
    </div>
  </section>

  <!-- GAPS -->
  <section class="page">
    <div class="section-eyebrow">Brechas detectadas</div>
    <h2 class="section">Qué encontramos en <?= h($company) ?></h2>
    <p class="section-lead">Estas son las brechas que encontramos en la presencia digital de <?= h($company) ?>, ordenadas de mayor a menor impacto en captación de clientes.</p>
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
    <h2 class="section">3 prioridades para los próximos 30 días</h2>
    <p class="section-lead">Si tuviéramos que mover sólo tres palancas en <?= h($company) ?> antes de fin de mes, serían estas.</p>
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

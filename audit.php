<?php
/* Per-prospect audit report — public, token-protected.
   URL pattern: /audit?lead=<base64email>&t=<token>
                /audit?e=<email>&t=<token>  (plain email)
   Token = first 24 hex chars of sha256(strtolower(email) . '|nwm-audit-2026')

   Renders a branded audit report for the prospect. Reads lead context from
   api-php/data/santiago_leads.csv. Print-friendly (Cmd+P → PDF).
*/

// ── Inputs ──────────────────────────────────────────────────────────
$raw = trim((string)($_GET['e'] ?? $_GET['lead'] ?? ''));
$email = '';
if ($raw !== '') {
  if (strpos($raw, '@') !== false) {
    $email = strtolower($raw);
  } else {
    $decoded = base64_decode(strtr($raw, '-_', '+/'), true);
    if ($decoded && strpos($decoded, '@') !== false) $email = strtolower($decoded);
  }
}
$token = trim((string)($_GET['t'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400); header('Content-Type: text/plain; charset=utf-8');
  echo "Lead parameter missing or invalid."; exit;
}

// ── Token validation ────────────────────────────────────────────────
$expected = substr(hash('sha256', $email . '|nwm-audit-2026'), 0, 24);
if (!hash_equals($expected, $token)) {
  http_response_code(403); header('Content-Type: text/plain; charset=utf-8');
  echo "Invalid or missing token."; exit;
}

// ── View logging ────────────────────────────────────────────────────
$viewLogDir  = __DIR__ . '/api-php/data';
$viewLogFile = $viewLogDir . '/audit-views.log';
if (is_dir($viewLogDir) || @mkdir($viewLogDir, 0755, true)) {
  $line = $email . "\t" . date('c') . "\t"
        . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\t"
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
if (!$lead) {
  $lead = ['company'=>'Tu Empresa','name'=>'','email'=>$email,
           'niche_key'=>$_GET['niche']??'smb','niche'=>'Empresa de Servicios',
           'city'=>'Santiago','website'=>''];
}

// ── Context ──────────────────────────────────────────────────────────
$company   = $lead['company']   ?? 'tu negocio';
$niche_key = $lead['niche_key'] ?? 'smb';
$niche     = $lead['niche']     ?? 'tu rubro';
$website   = trim((string)($lead['website'] ?? ''));
$city_raw  = $lead['city'] ?? 'Santiago';
$has_site  = $website && $website !== 'No website' && $website !== 'Not found';
$site_clean = $has_site ? preg_replace('#^https?://#', '', rtrim($website, '/')) : '';

// Email-domain fallback
$email_domain = strtolower(substr(strrchr($email, '@') ?: '', 1));
$free_providers = ['gmail.com','hotmail.com','outlook.com','yahoo.com','live.com','icloud.com','protonmail.com','proton.me','pm.me','aol.com','msn.com'];
if (!$has_site && $email_domain && !in_array($email_domain, $free_providers, true)) {
  $website = 'https://' . $email_domain; $has_site = true; $site_clean = $email_domain;
  if ($email_domain === 'netwebmedia.com') {
    $company = 'NetWebMedia'; $niche = 'Agencia digital · AEO · Automatización pyme';
  }
}

// ── Audit engine ─────────────────────────────────────────────────────
require_once __DIR__ . '/api-php/lib/audit-engine.php';

if (!empty($_GET['refresh'])) {
  $ck = md5(strtolower((string)$website).'|'.$niche_key.'|'.strtolower((string)$city_raw));
  $cf = __DIR__.'/api-php/data/audit-cache/'.$ck.'.json';
  if (is_file($cf)) @unlink($cf);
}

$_blank = ['status'=>0,'https'=>false,'time_s'=>0,'ttfb_s'=>0,'size_kb'=>0,'redirects'=>0];
if ($has_site) {
  try {
    $audit_result = nwm_audit_cached($website, $niche_key, $city_raw);
  } catch (\Throwable $e) {
    error_log('[audit.php] engine error: '.$e->getMessage());
    $audit_result = ['reachable'=>false,'score'=>0,'band'=>'Error','color'=>'#6b7280',
      'dimensions'=>[],'gaps'=>['No pudimos completar el análisis. Te contactamos en 24 h con la auditoría manual.'],
      'priorities'=>['Verificar acceso al sitio.'],'projections'=>['Una vez resuelto, medimos las 14 dimensiones.'],
      'http'=>$_blank,'tech_stack'=>[],'benchmarks'=>[]];
  }
} else {
  $audit_result = ['reachable'=>false,'score'=>0,'band'=>'Sin sitio','color'=>'#6b7280',
    'dimensions'=>[],'gaps'=>['No tenemos sitio registrado para '.$company.'. El primer paso es publicar un sitio que podamos medir.'],
    'priorities'=>['Levantar un sitio mínimo con HTTPS, schema LocalBusiness y captura WhatsApp.'],
    'projections'=>['Con un sitio publicado auditamos las 14 dimensiones y proyectamos mejoras concretas.'],
    'http'=>$_blank,'tech_stack'=>[],'benchmarks'=>[]];
}

$score       = (int)$audit_result['score'];
$score_band  = (string)$audit_result['band'];
$score_color = (string)$audit_result['color'];
$dimensions  = $audit_result['dimensions'] ?? [];
$benchmarks  = $audit_result['benchmarks'] ?? [];
$tech_stack  = $audit_result['tech_stack']  ?? [];
$gaps        = $audit_result['gaps']        ?? [];
$priorities  = $audit_result['priorities']  ?? [];
$projections = $audit_result['projections'] ?? [];
$reachable   = !empty($audit_result['reachable']);
$http_meta   = $audit_result['http'] ?? [];

// ── Niche subdomain map ───────────────────────────────────────────────
$subdomain_map = [
  'tourism'            => ['host'=>'hotels.netwebmedia.com',      'label'=>'Hoteles y alojamiento'],
  'restaurants'        => ['host'=>'restaurants.netwebmedia.com', 'label'=>'Restaurantes y gastronomía'],
  'beauty'             => ['host'=>'salons.netwebmedia.com',      'label'=>'Belleza y spa'],
  'law_firms'          => ['host'=>'legal.netwebmedia.com',       'label'=>'Estudios jurídicos'],
  'real_estate'        => ['host'=>'realestate.netwebmedia.com',  'label'=>'Inmobiliarias y corredores'],
  'health'             => ['host'=>'healthcare.netwebmedia.com',  'label'=>'Salud y clínicas'],
  'home_services'      => ['host'=>'home.netwebmedia.com',        'label'=>'Servicios para el hogar'],
  'education'          => ['host'=>'netwebmedia.com',             'label'=>'Educación'],
  'automotive'         => ['host'=>'netwebmedia.com',             'label'=>'Automotriz'],
  'financial_services' => ['host'=>'pro.netwebmedia.com',         'label'=>'Servicios financieros'],
  'events_weddings'    => ['host'=>'hospitality.netwebmedia.com', 'label'=>'Eventos y bodas'],
  'wine_agriculture'   => ['host'=>'netwebmedia.com',             'label'=>'Vino y agricultura'],
  'local_specialist'   => ['host'=>'netwebmedia.com',             'label'=>'Especialistas locales'],
  'smb'                => ['host'=>'netwebmedia.com',             'label'=>'Pymes'],
];
$sub     = $subdomain_map[$niche_key] ?? ['host'=>'netwebmedia.com','label'=>'NetWebMedia'];
$cta_url = 'https://'.$sub['host'].'/?utm_source=audit&utm_campaign=santiago-apr26&utm_content='.urlencode($niche_key);

// ── NWM services map: dimension key → what NWM offers ────────────────
$nwm_services = [
  'mobile_speed'      => ['icon'=>'⚡','title'=>'Sitio rápido y optimizado','problem'=>'Cada segundo de carga extra elimina el 20% del tráfico móvil.','service'=>'AI Website Build','detail'=>'Sitio optimizado en Next.js o WordPress con Core Web Vitals en verde.','time'=>'2–4 semanas','price'=>'desde USD 2,500'],
  'aeo'               => ['icon'=>'🤖','title'=>'Visibilidad en IA y buscadores','problem'=>'ChatGPT, Perplexity y Google AIO no te mencionan si no tienes la estructura.','service'=>'AEO Strategy + Ejecución','detail'=>'FAQ schema, artículos por consulta, sameAs y autoridad de dominio.','time'=>'30 días de activación','price'=>'incluido en CMO Growth · o AEO Audit $997'],
  'lead_capture'      => ['icon'=>'📥','title'=>'CRM y captura automatizada','problem'=>'Visitas que llegan y no convierten son presupuesto perdido.','service'=>'NWM CRM + Automatización','detail'=>'Formularios conectados al CRM, nurturing por WhatsApp + email, respuesta en <2 min.','time'=>'1–2 semanas','price'=>'CRM desde USD 49/mes'],
  'whatsapp'          => ['icon'=>'💬','title'=>'Canal WhatsApp 24/7','problem'=>'El 78% de los compradores en LATAM prefiere WhatsApp al formulario.','service'=>'WhatsApp Bot + Widget','detail'=>'Bot inicial, mensaje pre-rellenado por página y widget flotante para convertir fuera del horario.','time'=>'1 semana','price'=>'incluido en CMO Lite'],
  'analytics'         => ['icon'=>'📊','title'=>'Analítica completa GA4 + GTM','problem'=>'Sin datos no puedes saber qué canal genera clientes y cuál quema presupuesto.','service'=>'Setup analítica full-stack','detail'=>'GA4 + Google Tag Manager + Meta Pixel + atribución multicanal.','time'=>'3 días','price'=>'incluido en CMO Growth'],
  'schema'            => ['icon'=>'🔍','title'=>'Schema markup completo','problem'=>'Google no entiende qué eres ni dónde estás — pierdes clics de búsqueda local.','service'=>'AEO Migration Audit','detail'=>'Implementación de LocalBusiness, FAQPage, Review, sameAs y tipos del rubro.','time'=>'1 semana','price'=>'USD 997'],
  'automation'        => ['icon'=>'🤖','title'=>'Automatización y bots 24/7','problem'=>'Clientes potenciales que escriben fuera del horario no reciben respuesta.','service'=>'AI Automation Build','detail'=>'Bot de primer contacto, calificación de leads, agenda automática.','time'=>'2–3 semanas','price'=>'desde USD 1,500'],
  'content'           => ['icon'=>'✍️','title'=>'Contenido que posiciona','problem'=>'Sin contenido nuevo, Google y los modelos de IA pierden interés en el sitio.','service'=>'Calendario editorial + ejecución','detail'=>'2–4 artículos/mes con BlogPosting schema, FAQs y vídeos cortos.','time'=>'30 días','price'=>'incluido en CMO Lite'],
  'social'            => ['icon'=>'📱','title'=>'Redes activas y verificadas','problem'=>'Perfiles sin actividad pierden seguidores y reducen la confianza del comprador.','service'=>'Social Media Management','detail'=>'Calendarios, publicación, respuestas y reportes mensuales.','time'=>'2 semanas','price'=>'incluido en CMO Growth'],
  'branding'          => ['icon'=>'🎨','title'=>'Marca coherente online','problem'=>'Open Graph incompleto, título mal dimensionado = mala presentación en redes y buscadores.','service'=>'Branding digital + AI Website','detail'=>'OG tags, favicon, paleta, tipografía y guía de estilo aplicada al sitio.','time'=>'3–4 semanas','price'=>'incluido en AI Website Build'],
  'reputation'        => ['icon'=>'🏆','title'=>'Credibilidad y prueba social','problem'=>'Sin clientes, equipo ni logros visibles, el comprador no confía.','service'=>'Content & Reputation Package','detail'=>'Página "Sobre nosotros", logos de clientes, números de prueba social y casos de éxito.','time'=>'30 días','price'=>'incluido en CMO Growth'],
  'reviews'           => ['icon'=>'⭐','title'=>'Sistema de reseñas automático','problem'=>'El 93% de los compradores lee reseñas antes de contactar — si no las tienes, pierdes.','service'=>'Review Automation','detail'=>'Flujo post-servicio para pedir reseñas en Google, schema AggregateRating en el sitio.','time'=>'2 semanas','price'=>'incluido en CMO Growth'],
  'mobile_conversion' => ['icon'=>'📲','title'=>'Conversión móvil optimizada','problem'=>'Más del 60% del tráfico llega por móvil — si no convierte, el sitio no funciona.','service'=>'CRO Móvil + AI Website','detail'=>'Viewport correcto, CTA flotante, botón tel:, lazy loading y test de velocidad.','time'=>'1–2 semanas','price'=>'incluido en AI Website Build'],
  'crawlability'      => ['icon'=>'🕷️','title'=>'Rastreabilidad y SEO técnico','problem'=>'Errores en robots.txt o noindex impiden que Google indexe tus páginas.','service'=>'SEO técnico + AEO Audit','detail'=>'robots.txt, sitemap.xml, HTTPS, canonical, redireccionamientos y meta robots.','time'=>'3 días','price'=>'incluido en AEO Migration Audit'],
];

// Pick top 3 failing dimensions for the services section
$failing_dims = [];
$sorted_dims  = $dimensions;
uasort($sorted_dims, fn($a,$b) => ($a['score']??100) <=> ($b['score']??100));
foreach ($sorted_dims as $dkey => $dval) {
  if (count($failing_dims) >= 3) break;
  if (($dval['score'] ?? 100) < 70 && isset($nwm_services[$dkey])) $failing_dims[$dkey] = $nwm_services[$dkey];
}
// Fallback if everything passes
if (!$failing_dims) {
  $failing_dims = array_slice($nwm_services, 0, 3, true);
}

// ── Links ────────────────────────────────────────────────────────────
$wa_text = rawurlencode('Hola NetWebMedia, soy de '.$company.'. Vi la auditoría y quiero conversar.');
$wa_link = 'https://wa.me/56912345678?text='.$wa_text; // ← update to real NWM WA number

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
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
  --navy:#010F3B; --orange:#FF671F; --orange-soft:#FFF1E8;
  --white:#ffffff; --gray-50:#fafafa; --gray-100:#f3f4f6;
  --gray-200:#e5e7eb; --gray-500:#6b7280; --gray-700:#374151; --text:#111827;
  --green:#10b981; --amber:#f59e0b; --red:#ef4444;
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:var(--gray-50);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text);}
body{padding:32px 16px 80px;}
.doc{max-width:900px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.06);}

/* COVER */
.cover{position:relative;background:var(--navy);color:white;padding:56px 64px;overflow:hidden;}
.cover::before{content:'';position:absolute;top:-140px;right:-140px;width:520px;height:520px;border-radius:50%;background:rgba(255,103,31,0.18);}
.cover::after{content:'';position:absolute;bottom:-100px;left:-100px;width:340px;height:340px;border-radius:50%;background:rgba(255,103,31,0.10);}
.cover-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2;}
.brand{font-family:'Poppins',sans-serif;font-weight:800;font-size:20px;letter-spacing:0.5px;}
.brand .dot{color:var(--orange);}
.cover-year{font-size:13px;opacity:0.7;letter-spacing:1px;text-transform:uppercase;}
.cover-body{margin-top:60px;position:relative;z-index:2;}
.cover-tag{display:inline-block;background:var(--orange);color:white;padding:6px 14px;border-radius:50px;font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:18px;}
.cover-title{font-family:'Poppins',sans-serif;font-weight:800;font-size:42px;line-height:1.15;margin-bottom:14px;}
.cover-subtitle{font-size:18px;line-height:1.55;opacity:0.85;max-width:560px;}
.cover-bottom{margin-top:64px;display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:2;gap:24px;flex-wrap:wrap;}
.cover-meta{font-size:13px;line-height:1.7;opacity:0.85;}
.cover-meta strong{color:var(--orange);display:block;font-size:16px;margin-bottom:2px;}

/* PAGE */
.page{padding:56px 64px;}
.page+.page{border-top:1px solid var(--gray-200);}
h2.section{font-family:'Poppins',sans-serif;font-weight:800;font-size:28px;color:var(--navy);margin-bottom:8px;}
.section-eyebrow{font-size:12px;font-weight:700;color:var(--orange);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;}
.section-lead{font-size:15px;color:var(--gray-700);line-height:1.65;margin-bottom:24px;}

/* SCORE CARD */
.score-row{display:flex;gap:24px;align-items:stretch;flex-wrap:wrap;margin-bottom:24px;}
.score-card{flex:1 1 260px;background:linear-gradient(135deg,var(--navy),#0a1f5c);color:white;border-radius:14px;padding:28px;}
.score-num{font-family:'Poppins',sans-serif;font-weight:800;font-size:72px;line-height:1;color:<?= h($score_color) ?>;}
.score-label{font-size:13px;text-transform:uppercase;letter-spacing:1.2px;opacity:0.7;margin-top:8px;}
.score-band{display:inline-block;margin-top:12px;padding:6px 14px;border-radius:50px;font-size:12px;font-weight:700;background:<?= h($score_color) ?>;color:white;letter-spacing:0.4px;text-transform:uppercase;}
.score-meta{flex:1 1 260px;display:flex;flex-direction:column;justify-content:center;padding:8px 0;}
.score-meta-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--gray-200);font-size:13px;}
.score-meta-row:last-child{border-bottom:0;}
.score-meta-label{color:var(--gray-500);}
.score-meta-val{color:var(--text);font-weight:600;}
.tag-pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:var(--gray-100);color:var(--gray-700);}

/* DIMENSION GRID */
.dim-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:24px;}
.dim-card{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border:1px solid var(--gray-200);border-radius:10px;background:white;}
.dim-bar{flex:0 0 52px;height:52px;border-radius:50%;background:conic-gradient(var(--bar-color,var(--orange)) calc(var(--bar-pct,0)*1%),var(--gray-100) 0);display:flex;align-items:center;justify-content:center;position:relative;margin-top:2px;}
.dim-bar::before{content:'';position:absolute;inset:6px;background:white;border-radius:50%;}
.dim-bar-num{position:relative;z-index:2;font-family:'Poppins',sans-serif;font-weight:800;font-size:13px;color:var(--text);}
.dim-body{flex:1;min-width:0;}
.dim-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.dim-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:50px;letter-spacing:0.3px;text-transform:uppercase;}
.dim-status.pass{background:#d1fae5;color:#065f46;}
.dim-status.warn{background:#fef3c7;color:#92400e;}
.dim-status.fail{background:#fee2e2;color:#991b1b;}
.dim-status.skipped{background:#e5e7eb;color:#4b5563;}
.dim-detail{font-size:11px;color:var(--gray-500);line-height:1.4;margin-bottom:4px;}
.dim-benchmark{font-size:10px;color:var(--gray-500);margin-bottom:3px;}
.dim-benchmark .you{font-weight:700;color:var(--text);}
.dim-benchmark .delta-up{color:#059669;font-weight:600;}
.dim-benchmark .delta-dn{color:#dc2626;font-weight:600;}
.dim-fix{font-size:10px;color:var(--orange);line-height:1.4;font-style:italic;margin-top:2px;}
@media(max-width:720px){.dim-grid{grid-template-columns:1fr;}}

/* VERIFY STAMP */
.verify-stamp{display:flex;gap:14px;align-items:center;padding:14px 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-top:24px;font-size:13px;color:#065f46;}
.verify-stamp strong{color:#064e3b;}
.verify-icon{flex:0 0 28px;height:28px;background:var(--green);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;}

/* GAPS */
.gap-list{list-style:none;padding:0;margin:0;}
.gap-item{display:flex;gap:18px;padding:18px;border:1px solid var(--gray-200);border-radius:10px;margin-bottom:10px;}
.gap-num{flex:0 0 36px;height:36px;background:var(--orange-soft);color:var(--orange);border-radius:8px;font-family:'Poppins',sans-serif;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;}
.gap-text{flex:1;font-size:14px;line-height:1.6;color:var(--text);}

/* SERVICES SECTION */
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;}
.service-card{border:1px solid var(--gray-200);border-radius:12px;padding:22px 20px;background:white;display:flex;flex-direction:column;gap:10px;}
.service-card.highlight{border-color:var(--orange);background:var(--orange-soft);}
.service-icon{font-size:26px;line-height:1;}
.service-title{font-family:'Poppins',sans-serif;font-weight:800;font-size:15px;color:var(--navy);line-height:1.3;}
.service-problem{font-size:12px;color:var(--gray-700);line-height:1.5;border-left:3px solid var(--orange);padding-left:10px;font-style:italic;}
.service-badge{display:inline-block;background:var(--navy);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;}
.service-detail{font-size:12px;color:var(--gray-700);line-height:1.5;}
.service-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;}
.service-meta span{font-size:11px;background:var(--gray-100);color:var(--gray-700);padding:2px 8px;border-radius:20px;font-weight:600;}
@media(max-width:720px){.services-grid{grid-template-columns:1fr;}}

/* CMO PACKAGES */
.packages-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
.pkg-card{border-radius:12px;padding:24px 20px;display:flex;flex-direction:column;gap:10px;position:relative;}
.pkg-card.lite{background:var(--gray-50);border:1px solid var(--gray-200);}
.pkg-card.growth{background:var(--orange);color:white;}
.pkg-card.scale{background:var(--navy);color:white;}
.pkg-badge{position:absolute;top:-10px;right:16px;background:white;color:var(--orange);font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;border:1px solid var(--orange);}
.pkg-name{font-family:'Poppins',sans-serif;font-weight:800;font-size:18px;}
.pkg-price{font-family:'Poppins',sans-serif;font-weight:800;font-size:26px;line-height:1;}
.pkg-price span{font-size:13px;font-weight:400;opacity:0.8;}
.pkg-setup{font-size:11px;opacity:0.7;margin-top:-4px;}
.pkg-list{list-style:none;padding:0;margin:4px 0 0;display:flex;flex-direction:column;gap:6px;}
.pkg-list li{font-size:12px;line-height:1.4;padding-left:16px;position:relative;}
.pkg-list li::before{content:'✓';position:absolute;left:0;font-weight:700;}
.pkg-card.lite .pkg-list li::before{color:var(--orange);}
.pkg-cta{display:block;text-align:center;padding:10px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;margin-top:auto;}
.pkg-card.lite .pkg-cta{background:var(--navy);color:white;}
.pkg-card.growth .pkg-cta{background:white;color:var(--orange);}
.pkg-card.scale .pkg-cta{background:var(--orange);color:white;}
@media(max-width:720px){.packages-grid{grid-template-columns:1fr;}}

/* PRIORITIES */
.priorities{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:8px;}
.priority-card{padding:20px;border:1px solid var(--gray-200);border-radius:10px;background:var(--gray-50);}
.priority-num{font-family:'Poppins',sans-serif;font-weight:800;color:var(--orange);font-size:13px;margin-bottom:8px;letter-spacing:0.5px;}
.priority-text{font-size:13px;line-height:1.55;color:var(--gray-700);}
@media(max-width:720px){.priorities{grid-template-columns:1fr;}}

/* PROJECTION */
.projection-list{list-style:none;padding:0;margin:0;}
.projection-item{padding:14px 16px;background:var(--orange-soft);border-left:4px solid var(--orange);border-radius:6px;margin-bottom:10px;font-size:14px;line-height:1.55;}

/* CTA SECTION */
.cta-section{background:var(--navy);color:white;padding:48px 64px;text-align:center;}
.cta-section h3{font-family:'Poppins',sans-serif;font-weight:800;font-size:26px;margin-bottom:10px;}
.cta-section p{opacity:0.85;font-size:15px;line-height:1.6;max-width:520px;margin:0 auto 24px;}
.cta-buttons{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.btn{display:inline-block;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;transition:transform 0.1s;}
.btn-orange{background:var(--orange);color:white;}
.btn-ghost{background:transparent;color:white;border:2px solid rgba(255,255,255,0.3);}
.btn:hover{transform:translateY(-1px);}

/* PRINT TOOLBAR */
.print-bar{position:fixed;top:16px;right:16px;z-index:50;display:flex;gap:10px;align-items:center;background:white;padding:10px 14px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,0.12);}
.print-bar button{background:var(--orange);color:white;border:0;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;}
.print-bar .hint{font-size:12px;color:var(--gray-500);}

/* FOOTER */
.doc-footer{padding:24px 64px;font-size:12px;color:var(--gray-500);border-top:1px solid var(--gray-200);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.doc-footer a{color:var(--gray-500);}

@media(max-width:720px){
  body{padding:0;}
  .doc{border-radius:0;box-shadow:none;}
  .cover,.page,.cta-section,.doc-footer{padding-left:24px;padding-right:24px;}
  .cover-title{font-size:30px;}
  .print-bar{top:auto;bottom:16px;right:16px;left:16px;justify-content:center;}
}
@media print{
  body{background:white;padding:0;}
  .doc{box-shadow:none;max-width:none;border-radius:0;}
  .print-bar{display:none !important;}
  .cover,.page,.cta-section{padding:0.6in 0.7in;}
  .cover{page-break-after:always;}
  .page{page-break-inside:avoid;}
  .cta-section,.score-card,.pkg-card.growth,.pkg-card.scale{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  a{color:inherit;text-decoration:none;}
}
</style>
</head>
<body>

<div class="print-bar">
  <span class="hint">Auditoría lista · descárgala como PDF</span>
  <button onclick="window.print()">Descargar PDF</button>
</div>

<div class="doc">

<!-- ─── COVER ──────────────────────────────────────────────────────── -->
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
      <?= h($company) ?><?= $has_site ? '<br>'.h($site_clean) : '' ?><br>
      <?= h(ucfirst($lead['city'] ?? 'Santiago')) ?>, Chile
    </div>
    <div class="cover-meta" style="text-align:right;">
      <strong>Por NetWebMedia</strong>
      Equipo NetWebMedia<br>netwebmedia.com<br>hola@netwebmedia.com
    </div>
  </div>
</section>

<!-- ─── SCORE + DIMENSIONS ─────────────────────────────────────────── -->
<section class="page">
  <div class="section-eyebrow">Resumen ejecutivo</div>
  <h2 class="section">Puntaje de presencia digital</h2>
  <p class="section-lead">
    <?= count($dimensions) ?: 14 ?> dimensiones medidas en vivo sobre <strong><?= h($site_clean ?: 'tu sitio') ?></strong>:
    AEO, velocidad móvil, schema, captura de leads, reseñas, WhatsApp, conversión móvil,
    automatización, analítica, social, contenido, branding, reputación y rastreabilidad.
    Cada puntuación se compara con el promedio de pymes en LATAM.
  </p>

  <div class="score-row">
    <div class="score-card">
      <div class="score-num"><?= $score ?><span style="font-size:32px;color:rgba(255,255,255,0.4);">/100</span></div>
      <div class="score-label">Presencia digital</div>
      <div class="score-band">Nivel: <?= h($score_band) ?></div>
    </div>
    <div class="score-meta">
      <div class="score-meta-row"><span class="score-meta-label">Empresa</span><span class="score-meta-val"><?= h($company) ?></span></div>
      <div class="score-meta-row"><span class="score-meta-label">Rubro</span><span class="score-meta-val"><?= h($niche) ?></span></div>
      <?php if ($has_site): ?>
      <div class="score-meta-row"><span class="score-meta-label">Sitio auditado</span><span class="score-meta-val"><?= h($site_clean) ?></span></div>
      <?php endif; ?>
      <?php if (!empty($tech_stack['cms'])): ?>
      <div class="score-meta-row"><span class="score-meta-label">Tecnología</span><span class="score-meta-val"><?= h($tech_stack['cms']) ?><?= !empty($tech_stack['builder']) ? ' + '.h($tech_stack['builder']) : '' ?></span></div>
      <?php endif; ?>
      <?php if ($reachable && !empty($http_meta)): ?>
      <div class="score-meta-row"><span class="score-meta-label">HTTPS</span><span class="score-meta-val"><?= !empty($http_meta['https']) ? '✓ Activo' : '✗ Sin HTTPS' ?></span></div>
      <div class="score-meta-row">
        <span class="score-meta-label">Carga / TTFB</span>
        <span class="score-meta-val"><?= h(number_format((float)($http_meta['time_s']??0),2)) ?>s
          <?php if (!empty($http_meta['ttfb_s'])): ?>· TTFB <?= h(number_format((float)$http_meta['ttfb_s'],2)) ?>s<?php endif; ?>
          · <?= (int)($http_meta['size_kb']??0) ?> KB</span>
      </div>
      <?php if (!empty($http_meta['redirects'])): ?>
      <div class="score-meta-row"><span class="score-meta-label">Redirecciones</span><span class="score-meta-val"><?= (int)$http_meta['redirects'] ?></span></div>
      <?php endif; ?>
      <?php endif; ?>
      <div class="score-meta-row"><span class="score-meta-label">Ciudad</span><span class="score-meta-val"><?= h(ucfirst($city_raw)) ?></span></div>
      <div class="score-meta-row"><span class="score-meta-label">Motor / fecha</span><span class="score-meta-val"><?= h($audit_result['engine']??'nwm-audit/2.1') ?> · <?= h($audit_date) ?></span></div>
    </div>
  </div>

  <?php if (!empty($dimensions)): ?>
  <div class="dim-grid">
    <?php foreach ($dimensions as $dkey => $d):
      $ds         = (int)($d['score'] ?? 0);
      $st         = (string)($d['status'] ?? '');
      $bar_color  = $ds >= 70 ? '#10b981' : ($ds >= 40 ? '#f59e0b' : '#ef4444');
      $bench      = (int)($benchmarks[$dkey] ?? 0);
      $delta      = $ds - $bench;
      $fix_short  = mb_strimwidth((string)($d['fix'] ?? ''), 0, 100, '…');
    ?>
    <div class="dim-card">
      <div class="dim-bar" style="--bar-pct:<?= $ds ?>;--bar-color:<?= h($bar_color) ?>;">
        <span class="dim-bar-num"><?= $ds ?></span>
      </div>
      <div class="dim-body">
        <div class="dim-title">
          <?= h($d['label'] ?? $dkey) ?>
          <?php if ($st): ?><span class="dim-status <?= h($st) ?>"><?= $st==='pass'?'OK':($st==='warn'?'Mejorar':($st==='fail'?'Crítico':'N/D')) ?></span><?php endif; ?>
        </div>
        <?php if ($bench): ?>
        <div class="dim-benchmark">
          <span class="you"><?= $ds ?></span> vs promedio pyme <?= $bench ?>
          <?php if ($delta > 0): ?><span class="delta-up"> ▲+<?= $delta ?></span>
          <?php elseif ($delta < 0): ?><span class="delta-dn"> ▼<?= $delta ?></span>
          <?php endif; ?>
        </div>
        <?php endif; ?>
        <div class="dim-detail"><?= h($d['detail'] ?? '') ?></div>
        <?php if ($ds < 70 && $fix_short): ?>
        <div class="dim-fix">→ <?= h($fix_short) ?></div>
        <?php endif; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <div class="verify-stamp">
    <div class="verify-icon">✓</div>
    <div>
      <strong>Auditoría verificada en vivo.</strong>
      Mediciones reales sobre <?= h($site_clean) ?> el
      <?= h(date('j \d\e F, Y H:i', strtotime((string)($audit_result['fetched_at']??'now')))) ?>.
      <?php if ($reachable): ?>
        Tiempo de análisis: <?= h(number_format(($audit_result['duration_ms']??0)/1000,1)) ?>s.
      <?php endif; ?>
    </div>
  </div>
  <?php elseif (!$reachable && $has_site): ?>
  <div class="verify-stamp" style="background:#fef2f2;border-color:#fecaca;color:#991b1b;">
    <div class="verify-icon" style="background:#ef4444;">!</div>
    <div><strong>No pudimos acceder a <?= h($site_clean) ?>.</strong> El primer paso es asegurar dominio con HTTPS y respuesta en menos de 5 segundos.</div>
  </div>
  <?php endif; ?>
</section>

<!-- ─── BRECHAS ────────────────────────────────────────────────────── -->
<section class="page">
  <?php $strong = ($score >= 90); ?>
  <div class="section-eyebrow"><?= $strong ? 'Fortalezas detectadas' : 'Brechas detectadas' ?></div>
  <h2 class="section"><?= $strong ? 'Lo que hace excepcional a '.h($company) : 'Qué encontramos en '.h($company) ?></h2>
  <p class="section-lead">
    <?= $strong
      ? 'Fortalezas que sostienen la presencia digital de '.h($company).', ordenadas por impacto en captación.'
      : 'Brechas en la presencia digital de '.h($company).', ordenadas de mayor a menor impacto en captación de clientes.' ?>
  </p>
  <ol class="gap-list">
    <?php foreach ($gaps as $i => $g): ?>
    <li class="gap-item">
      <div class="gap-num"><?= sprintf('%02d',$i+1) ?></div>
      <div class="gap-text"><?= h($g) ?></div>
    </li>
    <?php endforeach; ?>
  </ol>
</section>

<!-- ─── QUÉ PUEDE HACER NWM ──────────────────────────────────────────── -->
<section class="page" style="background:var(--gray-50);">
  <div class="section-eyebrow">Cómo lo resolvemos</div>
  <h2 class="section">Lo que NetWebMedia implementaría en <?= h($company) ?></h2>
  <p class="section-lead">
    Cada brecha detectada tiene una solución concreta en nuestro sistema.
    Esto es exactamente lo que haríamos — sin agencias externas, sin intermediarios.
  </p>

  <!-- Service cards mapped to top failing dimensions -->
  <div class="services-grid">
    <?php foreach ($failing_dims as $skey => $svc): ?>
    <div class="service-card<?= count($failing_dims) > 1 && array_key_first($failing_dims)===$skey ? ' highlight' : '' ?>">
      <div class="service-icon"><?= $svc['icon'] ?></div>
      <div class="service-title"><?= h($svc['title']) ?></div>
      <div class="service-problem"><?= h($svc['problem']) ?></div>
      <span class="service-badge"><?= h($svc['service']) ?></span>
      <div class="service-detail"><?= h($svc['detail']) ?></div>
      <div class="service-meta">
        <span>⏱ <?= h($svc['time']) ?></span>
        <span>💰 <?= h($svc['price']) ?></span>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- CMO Package tiers -->
  <div style="margin-top:40px;">
    <p style="font-size:13px;font-weight:700;color:var(--orange);letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">Nuestros planes todo-incluido</p>
    <div class="packages-grid">

      <!-- CMO Lite -->
      <div class="pkg-card lite">
        <div class="pkg-name">CMO Lite</div>
        <div class="pkg-price">$249<span>/mes</span></div>
        <div class="pkg-setup">sin costo de activación</div>
        <ul class="pkg-list">
          <li>AEO + SEO strategy</li>
          <li>Calendario de contenido mensual</li>
          <li>NWM CRM incluido (hasta 1,000 contactos)</li>
          <li>Auditoría SEO trimestral</li>
          <li>WhatsApp widget básico</li>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>">Empezar →</a>
      </div>

      <!-- CMO Growth -->
      <div class="pkg-card growth" style="position:relative;">
        <span class="pkg-badge">Más popular</span>
        <div class="pkg-name">CMO Growth</div>
        <div class="pkg-price">$999<span>/mes</span></div>
        <div class="pkg-setup">$499 activación</div>
        <ul class="pkg-list">
          <li>Todo lo de CMO Lite</li>
          <li>Ads gestionados (USD 5k–20k/mes)</li>
          <li>Email nurture automatizado</li>
          <li>GA4 + GTM + Meta Pixel setup</li>
          <li>Reseñas automáticas post-servicio</li>
          <li>Llamada estratégica mensual</li>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>">Empezar →</a>
      </div>

      <!-- CMO Scale -->
      <div class="pkg-card scale">
        <div class="pkg-name">CMO Scale</div>
        <div class="pkg-price">$2,499<span>/mes</span></div>
        <div class="pkg-setup">$999 activación</div>
        <ul class="pkg-list">
          <li>Todo lo de CMO Growth</li>
          <li>AI SDR outbound</li>
          <li>12 videos cortos/mes</li>
          <li>Campañas demand-gen</li>
          <li>Planificación OKR trimestral</li>
          <li>Llamada estratégica semanal</li>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>">Empezar →</a>
      </div>

    </div>

    <!-- One-time projects note -->
    <div style="margin-top:20px;padding:16px 20px;background:white;border-radius:10px;border:1px solid var(--gray-200);font-size:13px;color:var(--gray-700);line-height:1.7;">
      <strong style="color:var(--navy);">¿Solo necesitas una cosa?</strong>
      También trabajamos por proyecto: <strong>AI Website Build</strong> desde USD 2,500 ·
      <strong>AI Automation Build</strong> desde USD 1,500 ·
      <strong>AEO Migration Audit</strong> USD 997 ·
      <strong>Custom AI Agent</strong> desde USD 3,000.
      <a href="<?= h($wa_link) ?>" style="color:var(--orange);font-weight:700;">Consultar →</a>
    </div>
  </div>
</section>

<!-- ─── PLAN DE ACCIÓN ────────────────────────────────────────────── -->
<section class="page">
  <div class="section-eyebrow">Plan de acción</div>
  <h2 class="section"><?= $strong ? '3 palancas para sostener el liderazgo' : '3 prioridades para los próximos 30 días' ?></h2>
  <p class="section-lead">
    <?= $strong
      ? 'Las tres palancas en las que '.h($company).' sigue invirtiendo para mantener el puntaje sobre 90/100.'
      : 'Si tuviéramos que mover sólo tres palancas en '.h($company).' antes de fin de mes, serían estas.' ?>
  </p>
  <div class="priorities">
    <?php foreach ($priorities as $i => $p): ?>
    <div class="priority-card">
      <div class="priority-num">Prioridad <?= $i+1 ?></div>
      <div class="priority-text"><?= h($p) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- ─── PROYECCIÓN ────────────────────────────────────────────────── -->
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

<!-- ─── CTA FINAL ─────────────────────────────────────────────────── -->
<section class="cta-section">
  <h3>¿Conversamos 20 minutos?</h3>
  <p>
    Sin pitch, sin compromiso. Te muestro exactamente cómo NetWebMedia
    implementaría cada solución en <?= h($company) ?> — con timeline y costo real.
  </p>
  <div class="cta-buttons">
    <a class="btn btn-orange" href="<?= h($wa_link) ?>">WhatsApp directo</a>
    <a class="btn btn-ghost" href="<?= h($cta_url) ?>">Soluciones para <?= h($sub['label']) ?></a>
  </div>
</section>

<!-- ─── FOOTER ────────────────────────────────────────────────────── -->
<div class="doc-footer">
  <div>NetWebMedia SpA · Santiago, Chile · <a href="mailto:hola@netwebmedia.com">hola@netwebmedia.com</a></div>
  <div>Auditoría preparada el <?= h(date('j \d\e F, Y')) ?> · Confidencial — sólo para <?= h($company) ?></div>
</div>

</div><!-- /.doc -->

<script>
  if (location.hash === '#print') setTimeout(function(){ window.print(); }, 500);
</script>
</body>
</html>

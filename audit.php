<?php
/* Per-prospect audit report — public, token-protected.
   URL pattern: /audit?lead=<base64email>&t=<token>[&lang=en]
                /audit?e=<email>&t=<token>[&lang=en]
   Token = first 24 hex chars of sha256(strtolower(email) . '|nwm-audit-2026')
   Lang  = 'es' (default) | 'en'
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
$lang  = in_array($_GET['lang'] ?? '', ['en','es']) ? $_GET['lang'] : 'es';

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
$CSV  = __DIR__ . '/api-php/data/santiago_leads.csv';
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

$email_domain    = strtolower(substr(strrchr($email, '@') ?: '', 1));
$free_providers  = ['gmail.com','hotmail.com','outlook.com','yahoo.com','live.com','icloud.com','protonmail.com','proton.me','pm.me','aol.com','msn.com'];
if (!$has_site && $email_domain && !in_array($email_domain, $free_providers, true)) {
  $website = 'https://' . $email_domain; $has_site = true; $site_clean = $email_domain;
  if ($email_domain === 'netwebmedia.com') {
    $company = 'NetWebMedia';
    $niche   = $lang === 'en' ? 'Digital agency · AEO · SMB Automation' : 'Agencia digital · AEO · Automatización pyme';
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
      'dimensions'=>[],'gaps'=>['Error al procesar el análisis. / Analysis processing error.'],
      'priorities'=>['Verificar acceso al sitio. / Verify site access.'],
      'projections'=>['Una vez resuelto, medimos las 14 dimensiones. / Once resolved, we measure all 14 dimensions.'],
      'http'=>$_blank,'tech_stack'=>[],'benchmarks'=>[]];
  }
} else {
  $audit_result = ['reachable'=>false,'score'=>0,'band'=>'Sin sitio / No site','color'=>'#6b7280',
    'dimensions'=>[],'gaps'=>['No tenemos sitio registrado para '.$company.'. / No website found for '.$company.'.'],
    'priorities'=>['Levantar un sitio mínimo con HTTPS. / Launch a minimum site with HTTPS.'],
    'projections'=>['Con un sitio publicado auditamos las 14 dimensiones. / With a live site we audit all 14 dimensions.'],
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

// ── Language helpers ──────────────────────────────────────────────────
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// Build language-toggle URL
$toggle_lang  = $lang === 'es' ? 'en' : 'es';
$toggle_label = $lang === 'es' ? 'English' : 'Español';
$current_qs   = $_GET; $current_qs['lang'] = $toggle_lang;
$toggle_url   = '?' . http_build_query($current_qs);

// Translation table — all static UI strings
$t = [
  'es' => [
    'page_title'        => 'Auditoría digital — %s | NetWebMedia',
    'download_pdf'      => 'Descargar PDF',
    'audit_ready'       => 'Auditoría lista · descárgala como PDF',
    'cover_tag'         => 'Auditoría digital · %s',
    'cover_subtitle'    => 'Análisis de presencia digital, brechas detectadas y proyección de captación de clientes a 90 días.',
    'prepared_for'      => 'Preparado para',
    'by_nwm'            => 'Por NetWebMedia',
    'score_eyebrow'     => 'Resumen ejecutivo',
    'score_title'       => 'Puntaje de presencia digital',
    'score_lead'        => '%d dimensiones medidas en vivo sobre <strong>%s</strong>: AEO, velocidad móvil, schema, captura de leads, reseñas, WhatsApp, conversión móvil, automatización, analítica, social, contenido, branding, reputación y rastreabilidad. Cada puntuación se compara con el promedio de pymes en LATAM.',
    'meta_company'      => 'Empresa',
    'meta_niche'        => 'Rubro',
    'meta_site'         => 'Sitio auditado',
    'meta_tech'         => 'Tecnología',
    'meta_https'        => 'HTTPS',
    'meta_https_yes'    => '✓ Activo',
    'meta_https_no'     => '✗ Sin HTTPS',
    'meta_speed'        => 'Carga / TTFB',
    'meta_redirects'    => 'Redirecciones',
    'meta_city'         => 'Ciudad',
    'meta_engine'       => 'Motor / fecha',
    'score_label'       => 'Presencia digital',
    'score_level'       => 'Nivel: %s',
    'dim_benchmark'     => '%d vs promedio pyme %d',
    'dim_status_pass'   => 'OK',
    'dim_status_warn'   => 'Mejorar',
    'dim_status_fail'   => 'Crítico',
    'dim_status_skip'   => 'N/D',
    'verified_live'     => '<strong>Auditoría verificada en vivo.</strong> Mediciones reales sobre %s el %s. Tiempo de análisis: %ss.',
    'no_access'         => '<strong>No pudimos acceder a %s.</strong> El primer paso es asegurar dominio con HTTPS y respuesta en menos de 5 segundos.',
    'gaps_eyebrow_hi'   => 'Fortalezas detectadas',
    'gaps_eyebrow_lo'   => 'Brechas detectadas',
    'gaps_title_hi'     => 'Lo que hace excepcional a %s',
    'gaps_title_lo'     => 'Qué encontramos en %s',
    'gaps_lead_hi'      => 'Fortalezas que sostienen la presencia digital de %s, ordenadas por impacto en captación.',
    'gaps_lead_lo'      => 'Brechas en la presencia digital de %s, ordenadas de mayor a menor impacto en captación de clientes.',
    'nwm_eyebrow'       => 'Cómo lo resolvemos',
    'nwm_title'         => 'Lo que NetWebMedia implementaría en %s',
    'nwm_lead'          => 'Cada brecha detectada tiene una solución concreta en nuestro sistema. Esto es exactamente lo que haríamos — sin agencias externas, sin intermediarios.',
    'svc_time'          => '⏱ %s',
    'svc_price'         => '💰 %s',
    'plans_eyebrow'     => 'Nuestros planes todo-incluido',
    'pkg_popular'       => 'Más popular',
    'pkg_cta'           => 'Empezar →',
    'pkg_lite_setup'    => 'sin costo de activación',
    'pkg_growth_setup'  => '$499 activación',
    'pkg_scale_setup'   => '$999 activación',
    'projects_note'     => '<strong>¿Solo necesitas una cosa?</strong> También trabajamos por proyecto: <strong>AI Website Build</strong> desde USD 2,500 · <strong>AI Automation Build</strong> desde USD 1,500 · <strong>AEO Migration Audit</strong> USD 997 · <strong>Custom AI Agent</strong> desde USD 3,000. <a href="%s" style="color:var(--orange);font-weight:700;">Consultar →</a>',
    'action_eyebrow'    => 'Plan de acción',
    'action_title_hi'   => '3 palancas para sostener el liderazgo',
    'action_title_lo'   => '3 prioridades para los próximos 30 días',
    'action_lead_hi'    => 'Las tres palancas en las que %s sigue invirtiendo para mantener el puntaje sobre 90/100.',
    'action_lead_lo'    => 'Si tuviéramos que mover sólo tres palancas en %s antes de fin de mes, serían estas.',
    'priority_label'    => 'Prioridad %d',
    'proj_eyebrow'      => 'Proyección a 90 días',
    'proj_title'        => 'Lo que cambia si actúan',
    'proj_lead'         => 'Estimaciones conservadoras basadas en el rubro de %s y los benchmarks de NetWebMedia para implementaciones similares en Chile.',
    'cta_title'         => '¿Conversamos 20 minutos?',
    'cta_body'          => 'Sin pitch, sin compromiso. Te muestro exactamente cómo NetWebMedia implementaría cada solución en %s — con timeline y costo real.',
    'cta_wa'            => 'WhatsApp directo',
    'cta_web'           => 'Soluciones para %s',
    'footer_left'       => 'NetWebMedia SpA · Santiago, Chile · <a href="mailto:hola@netwebmedia.com">hola@netwebmedia.com</a>',
    'footer_right'      => 'Auditoría preparada el %s · Confidencial — sólo para %s',
    'pkg_lite_feats'    => ['AEO + SEO strategy','Calendario de contenido mensual','NWM CRM incluido (hasta 1,000 contactos)','Auditoría SEO trimestral','WhatsApp widget básico'],
    'pkg_growth_feats'  => ['Todo lo de CMO Lite','Ads gestionados (USD 5k–20k/mes)','Email nurture automatizado','GA4 + GTM + Meta Pixel setup','Reseñas automáticas post-servicio','Llamada estratégica mensual'],
    'pkg_scale_feats'   => ['Todo lo de CMO Growth','AI SDR outbound','12 videos cortos/mes','Campañas demand-gen','Planificación OKR trimestral','Llamada estratégica semanal'],
  ],
  'en' => [
    'page_title'        => 'Digital Audit — %s | NetWebMedia',
    'download_pdf'      => 'Download PDF',
    'audit_ready'       => 'Audit ready · download as PDF',
    'cover_tag'         => 'Digital Audit · %s',
    'cover_subtitle'    => 'Digital presence analysis, identified gaps and 90-day client acquisition projection.',
    'prepared_for'      => 'Prepared for',
    'by_nwm'            => 'By NetWebMedia',
    'score_eyebrow'     => 'Executive summary',
    'score_title'       => 'Digital presence score',
    'score_lead'        => '%d dimensions measured live on <strong>%s</strong>: AEO, mobile speed, schema, lead capture, reviews, WhatsApp, mobile conversion, automation, analytics, social, content, branding, reputation and crawlability. Each score is benchmarked against the LATAM SMB average.',
    'meta_company'      => 'Company',
    'meta_niche'        => 'Industry',
    'meta_site'         => 'Site audited',
    'meta_tech'         => 'Technology',
    'meta_https'        => 'HTTPS',
    'meta_https_yes'    => '✓ Active',
    'meta_https_no'     => '✗ No HTTPS',
    'meta_speed'        => 'Load / TTFB',
    'meta_redirects'    => 'Redirects',
    'meta_city'         => 'City',
    'meta_engine'       => 'Engine / date',
    'score_label'       => 'Digital presence',
    'score_level'       => 'Level: %s',
    'dim_benchmark'     => '%d vs SMB avg %d',
    'dim_status_pass'   => 'OK',
    'dim_status_warn'   => 'Improve',
    'dim_status_fail'   => 'Critical',
    'dim_status_skip'   => 'N/A',
    'verified_live'     => '<strong>Live-verified audit.</strong> Real measurements on %s on %s. Analysis time: %ss.',
    'no_access'         => '<strong>Could not reach %s.</strong> First step: ensure the domain resolves with valid HTTPS and responds in under 5 seconds.',
    'gaps_eyebrow_hi'   => 'Strengths found',
    'gaps_eyebrow_lo'   => 'Gaps found',
    'gaps_title_hi'     => 'What makes %s exceptional',
    'gaps_title_lo'     => 'What we found at %s',
    'gaps_lead_hi'      => 'Strengths sustaining %s\'s digital presence, ranked by impact on client acquisition.',
    'gaps_lead_lo'      => 'Gaps in %s\'s digital presence, ranked from highest to lowest impact on client acquisition.',
    'nwm_eyebrow'       => 'How we fix it',
    'nwm_title'         => 'What NetWebMedia would implement at %s',
    'nwm_lead'          => 'Every detected gap has a concrete solution in our system. This is exactly what we would do — no external agencies, no middlemen.',
    'svc_time'          => '⏱ %s',
    'svc_price'         => '💰 %s',
    'plans_eyebrow'     => 'Our all-inclusive plans',
    'pkg_popular'       => 'Most popular',
    'pkg_cta'           => 'Get started →',
    'pkg_lite_setup'    => 'no setup fee',
    'pkg_growth_setup'  => '$499 setup',
    'pkg_scale_setup'   => '$999 setup',
    'projects_note'     => '<strong>Just need one thing?</strong> We also work project-by-project: <strong>AI Website Build</strong> from USD 2,500 · <strong>AI Automation Build</strong> from USD 1,500 · <strong>AEO Migration Audit</strong> USD 997 · <strong>Custom AI Agent</strong> from USD 3,000. <a href="%s" style="color:var(--orange);font-weight:700;">Inquire →</a>',
    'action_eyebrow'    => 'Action plan',
    'action_title_hi'   => '3 levers to sustain leadership',
    'action_title_lo'   => '3 priorities for the next 30 days',
    'action_lead_hi'    => 'The three levers %s keeps investing in to maintain a score above 90/100.',
    'action_lead_lo'    => 'If we could move only three levers at %s before end of month, these would be them.',
    'priority_label'    => 'Priority %d',
    'proj_eyebrow'      => '90-day projection',
    'proj_title'        => 'What changes if they act',
    'proj_lead'         => 'Conservative estimates based on the %s industry and NetWebMedia\'s benchmarks for similar implementations in Chile and LATAM.',
    'cta_title'         => 'Let\'s talk for 20 minutes?',
    'cta_body'          => 'No pitch, no commitment. We show you exactly how NetWebMedia would implement each solution at %s — with a real timeline and real cost.',
    'cta_wa'            => 'WhatsApp direct',
    'cta_web'           => 'Solutions for %s',
    'footer_left'       => 'NetWebMedia SpA · Santiago, Chile · <a href="mailto:hola@netwebmedia.com">hola@netwebmedia.com</a>',
    'footer_right'      => 'Audit prepared on %s · Confidential — for %s only',
    'pkg_lite_feats'    => ['AEO + SEO strategy','Monthly content calendar','NWM CRM included (up to 1,000 contacts)','Quarterly SEO audit','Basic WhatsApp widget'],
    'pkg_growth_feats'  => ['Everything in CMO Lite','Managed ads (USD 5k–20k/mo spend)','Automated email nurturing','GA4 + GTM + Meta Pixel setup','Automated post-service review requests','Monthly strategy call'],
    'pkg_scale_feats'   => ['Everything in CMO Growth','AI SDR outbound','12 short-form videos/month','Demand-gen campaigns','Quarterly OKR planning','Weekly strategy call'],
  ],
];
$T = $t[$lang]; // active translation set

// ── Niche subdomain map ───────────────────────────────────────────────
$subdomain_map = [
  'tourism'            => ['host'=>'hotels.netwebmedia.com',      'label_es'=>'Hoteles y alojamiento',       'label_en'=>'Hotels & lodging'],
  'restaurants'        => ['host'=>'restaurants.netwebmedia.com', 'label_es'=>'Restaurantes y gastronomía', 'label_en'=>'Restaurants & food'],
  'beauty'             => ['host'=>'salons.netwebmedia.com',      'label_es'=>'Belleza y spa',               'label_en'=>'Beauty & spa'],
  'law_firms'          => ['host'=>'legal.netwebmedia.com',       'label_es'=>'Estudios jurídicos',          'label_en'=>'Law firms'],
  'real_estate'        => ['host'=>'realestate.netwebmedia.com',  'label_es'=>'Inmobiliarias y corredores',  'label_en'=>'Real estate'],
  'health'             => ['host'=>'healthcare.netwebmedia.com',  'label_es'=>'Salud y clínicas',            'label_en'=>'Health & clinics'],
  'home_services'      => ['host'=>'home.netwebmedia.com',        'label_es'=>'Servicios para el hogar',     'label_en'=>'Home services'],
  'education'          => ['host'=>'netwebmedia.com',             'label_es'=>'Educación',                   'label_en'=>'Education'],
  'automotive'         => ['host'=>'netwebmedia.com',             'label_es'=>'Automotriz',                  'label_en'=>'Automotive'],
  'financial_services' => ['host'=>'pro.netwebmedia.com',         'label_es'=>'Servicios financieros',       'label_en'=>'Financial services'],
  'events_weddings'    => ['host'=>'hospitality.netwebmedia.com', 'label_es'=>'Eventos y bodas',             'label_en'=>'Events & weddings'],
  'wine_agriculture'   => ['host'=>'netwebmedia.com',             'label_es'=>'Vino y agricultura',          'label_en'=>'Wine & agriculture'],
  'local_specialist'   => ['host'=>'netwebmedia.com',             'label_es'=>'Especialistas locales',       'label_en'=>'Local specialists'],
  'smb'                => ['host'=>'netwebmedia.com',             'label_es'=>'Pymes',                       'label_en'=>'SMBs'],
];
$sub     = $subdomain_map[$niche_key] ?? ['host'=>'netwebmedia.com','label_es'=>'NetWebMedia','label_en'=>'NetWebMedia'];
$sub_label = $lang === 'en' ? $sub['label_en'] : $sub['label_es'];
$cta_url = 'https://'.$sub['host'].'/?utm_source=audit&utm_campaign=santiago-apr26&utm_content='.urlencode($niche_key).'&lang='.$lang;

// ── NWM services map (bilingual) ──────────────────────────────────────
$nwm_services = [
  'mobile_speed' => [
    'icon'       => '⚡',
    'title'      => $lang==='en' ? 'Fast, optimized site'            : 'Sitio rápido y optimizado',
    'problem'    => $lang==='en' ? 'Every extra second of load time removes 20% of mobile traffic.'
                                 : 'Cada segundo de carga extra elimina el 20% del tráfico móvil.',
    'service'    => 'AI Website Build',
    'detail'     => $lang==='en' ? 'Next.js or WordPress site with Core Web Vitals in the green.'
                                 : 'Sitio optimizado en Next.js o WordPress con Core Web Vitals en verde.',
    'time'       => $lang==='en' ? '2–4 weeks'    : '2–4 semanas',
    'price'      => 'from USD 2,500',
  ],
  'aeo' => [
    'icon'       => '🤖',
    'title'      => $lang==='en' ? 'AI & search engine visibility'    : 'Visibilidad en IA y buscadores',
    'problem'    => $lang==='en' ? 'ChatGPT, Perplexity and Google AIO won\'t mention you without proper structure.'
                                 : 'ChatGPT, Perplexity y Google AIO no te mencionan si no tienes la estructura.',
    'service'    => 'AEO Strategy + Execution',
    'detail'     => $lang==='en' ? 'FAQ schema, niche articles, sameAs and domain authority building.'
                                 : 'FAQ schema, artículos por consulta, sameAs y autoridad de dominio.',
    'time'       => $lang==='en' ? '30-day activation'  : '30 días de activación',
    'price'      => $lang==='en' ? 'in CMO Growth · or AEO Audit $997' : 'incluido en CMO Growth · o AEO Audit $997',
  ],
  'lead_capture' => [
    'icon'       => '📥',
    'title'      => $lang==='en' ? 'CRM & automated lead capture'    : 'CRM y captura automatizada',
    'problem'    => $lang==='en' ? 'Visitors who land and don\'t convert are wasted ad spend.'
                                 : 'Visitas que llegan y no convierten son presupuesto perdido.',
    'service'    => 'NWM CRM + Automation',
    'detail'     => $lang==='en' ? 'Forms connected to the CRM, WhatsApp + email nurturing, <2 min response.'
                                 : 'Formularios conectados al CRM, nurturing por WhatsApp + email, respuesta en <2 min.',
    'time'       => $lang==='en' ? '1–2 weeks'    : '1–2 semanas',
    'price'      => $lang==='en' ? 'CRM from USD 49/mo' : 'CRM desde USD 49/mes',
  ],
  'whatsapp' => [
    'icon'       => '💬',
    'title'      => $lang==='en' ? '24/7 WhatsApp channel'           : 'Canal WhatsApp 24/7',
    'problem'    => $lang==='en' ? '78% of buyers in LATAM prefer WhatsApp over a web form.'
                                 : 'El 78% de los compradores en LATAM prefiere WhatsApp al formulario.',
    'service'    => 'WhatsApp Bot + Widget',
    'detail'     => $lang==='en' ? 'First-response bot, pre-filled message per page and floating widget.'
                                 : 'Bot inicial, mensaje pre-rellenado por página y widget flotante.',
    'time'       => $lang==='en' ? '1 week'        : '1 semana',
    'price'      => $lang==='en' ? 'included in CMO Lite' : 'incluido en CMO Lite',
  ],
  'analytics' => [
    'icon'       => '📊',
    'title'      => $lang==='en' ? 'Full analytics setup GA4 + GTM'  : 'Analítica completa GA4 + GTM',
    'problem'    => $lang==='en' ? 'Without data you can\'t know which channel generates clients and which burns budget.'
                                 : 'Sin datos no puedes saber qué canal genera clientes y cuál quema presupuesto.',
    'service'    => $lang==='en' ? 'Full-stack analytics setup' : 'Setup analítica full-stack',
    'detail'     => $lang==='en' ? 'GA4 + Google Tag Manager + Meta Pixel + multi-channel attribution.'
                                 : 'GA4 + Google Tag Manager + Meta Pixel + atribución multicanal.',
    'time'       => $lang==='en' ? '3 days'       : '3 días',
    'price'      => $lang==='en' ? 'included in CMO Growth' : 'incluido en CMO Growth',
  ],
  'schema' => [
    'icon'       => '🔍',
    'title'      => $lang==='en' ? 'Complete schema markup'          : 'Schema markup completo',
    'problem'    => $lang==='en' ? 'Google doesn\'t understand what you are or where you are — you lose local search clicks.'
                                 : 'Google no entiende qué eres ni dónde estás — pierdes clics de búsqueda local.',
    'service'    => 'AEO Migration Audit',
    'detail'     => $lang==='en' ? 'LocalBusiness, FAQPage, Review, sameAs and niche-specific type implementation.'
                                 : 'Implementación de LocalBusiness, FAQPage, Review, sameAs y tipos del rubro.',
    'time'       => $lang==='en' ? '1 week'       : '1 semana',
    'price'      => 'USD 997',
  ],
  'automation' => [
    'icon'       => '🤖',
    'title'      => $lang==='en' ? 'AI bots & automation 24/7'       : 'Automatización y bots 24/7',
    'problem'    => $lang==='en' ? 'Potential clients who write outside business hours get no response.'
                                 : 'Clientes potenciales que escriben fuera del horario no reciben respuesta.',
    'service'    => 'AI Automation Build',
    'detail'     => $lang==='en' ? 'First-contact bot, lead qualification, automatic scheduling.'
                                 : 'Bot de primer contacto, calificación de leads, agenda automática.',
    'time'       => $lang==='en' ? '2–3 weeks'   : '2–3 semanas',
    'price'      => 'from USD 1,500',
  ],
  'content' => [
    'icon'       => '✍️',
    'title'      => $lang==='en' ? 'Content that ranks'              : 'Contenido que posiciona',
    'problem'    => $lang==='en' ? 'Without fresh content, Google and AI models lose interest in your site.'
                                 : 'Sin contenido nuevo, Google y los modelos de IA pierden interés en el sitio.',
    'service'    => $lang==='en' ? 'Editorial calendar + execution' : 'Calendario editorial + ejecución',
    'detail'     => $lang==='en' ? '2–4 articles/month with BlogPosting schema, FAQs and short videos.'
                                 : '2–4 artículos/mes con BlogPosting schema, FAQs y vídeos cortos.',
    'time'       => $lang==='en' ? '30 days'     : '30 días',
    'price'      => $lang==='en' ? 'included in CMO Lite' : 'incluido en CMO Lite',
  ],
  'social' => [
    'icon'       => '📱',
    'title'      => $lang==='en' ? 'Active, verified social media'   : 'Redes activas y verificadas',
    'problem'    => $lang==='en' ? 'Inactive profiles lose followers and reduce buyer trust.'
                                 : 'Perfiles sin actividad pierden seguidores y reducen la confianza del comprador.',
    'service'    => 'Social Media Management',
    'detail'     => $lang==='en' ? 'Calendars, publishing, replies and monthly reports.'
                                 : 'Calendarios, publicación, respuestas y reportes mensuales.',
    'time'       => $lang==='en' ? '2 weeks'     : '2 semanas',
    'price'      => $lang==='en' ? 'included in CMO Growth' : 'incluido en CMO Growth',
  ],
  'branding' => [
    'icon'       => '🎨',
    'title'      => $lang==='en' ? 'Coherent online brand'           : 'Marca coherente online',
    'problem'    => $lang==='en' ? 'Incomplete Open Graph and wrong title length = poor presentation on social and search.'
                                 : 'Open Graph incompleto y título mal dimensionado = mala presentación en redes y buscadores.',
    'service'    => 'Branding + AI Website',
    'detail'     => $lang==='en' ? 'OG tags, favicon, color palette, typography and style guide applied to the site.'
                                 : 'OG tags, favicon, paleta, tipografía y guía de estilo aplicada al sitio.',
    'time'       => $lang==='en' ? '3–4 weeks'   : '3–4 semanas',
    'price'      => $lang==='en' ? 'included in AI Website Build' : 'incluido en AI Website Build',
  ],
  'reputation' => [
    'icon'       => '🏆',
    'title'      => $lang==='en' ? 'Credibility & social proof'      : 'Credibilidad y prueba social',
    'problem'    => $lang==='en' ? 'Without visible clients, team or achievements, the buyer won\'t trust you.'
                                 : 'Sin clientes, equipo ni logros visibles, el comprador no confía.',
    'service'    => $lang==='en' ? 'Content & Reputation Package' : 'Paquete Contenido & Reputación',
    'detail'     => $lang==='en' ? '"About us" page, client logos, social proof numbers and case studies.'
                                 : 'Página "Sobre nosotros", logos de clientes, números de prueba social y casos de éxito.',
    'time'       => $lang==='en' ? '30 days'     : '30 días',
    'price'      => $lang==='en' ? 'included in CMO Growth' : 'incluido en CMO Growth',
  ],
  'reviews' => [
    'icon'       => '⭐',
    'title'      => $lang==='en' ? 'Automated review system'         : 'Sistema de reseñas automático',
    'problem'    => $lang==='en' ? '93% of buyers read reviews before contacting — if you don\'t have them, you lose.'
                                 : 'El 93% de los compradores lee reseñas antes de contactar — si no las tienes, pierdes.',
    'service'    => $lang==='en' ? 'Review Automation' : 'Automatización de Reseñas',
    'detail'     => $lang==='en' ? 'Post-service review request flow on Google + AggregateRating schema on site.'
                                 : 'Flujo post-servicio para pedir reseñas en Google + AggregateRating schema en el sitio.',
    'time'       => $lang==='en' ? '2 weeks'     : '2 semanas',
    'price'      => $lang==='en' ? 'included in CMO Growth' : 'incluido en CMO Growth',
  ],
  'mobile_conversion' => [
    'icon'       => '📲',
    'title'      => $lang==='en' ? 'Mobile conversion optimized'     : 'Conversión móvil optimizada',
    'problem'    => $lang==='en' ? 'Over 60% of traffic comes from mobile — if it doesn\'t convert, the site doesn\'t work.'
                                 : 'Más del 60% del tráfico llega por móvil — si no convierte, el sitio no funciona.',
    'service'    => 'CRO Móvil + AI Website',
    'detail'     => $lang==='en' ? 'Correct viewport, floating CTA, tel: button, lazy loading and speed test.'
                                 : 'Viewport correcto, CTA flotante, botón tel:, lazy loading y test de velocidad.',
    'time'       => $lang==='en' ? '1–2 weeks'   : '1–2 semanas',
    'price'      => $lang==='en' ? 'included in AI Website Build' : 'incluido en AI Website Build',
  ],
  'crawlability' => [
    'icon'       => '🕷️',
    'title'      => $lang==='en' ? 'Crawlability & technical SEO'    : 'Rastreabilidad y SEO técnico',
    'problem'    => $lang==='en' ? 'Errors in robots.txt or noindex tags prevent Google from indexing your pages.'
                                 : 'Errores en robots.txt o noindex impiden que Google indexe tus páginas.',
    'service'    => $lang==='en' ? 'Technical SEO + AEO Audit' : 'SEO técnico + AEO Audit',
    'detail'     => $lang==='en' ? 'robots.txt, sitemap.xml, HTTPS, canonical tags, redirects and meta robots.'
                                 : 'robots.txt, sitemap.xml, HTTPS, canonical, redireccionamientos y meta robots.',
    'time'       => $lang==='en' ? '3 days'      : '3 días',
    'price'      => $lang==='en' ? 'included in AEO Migration Audit' : 'incluido en AEO Migration Audit',
  ],
];

// Top 3 failing dimensions → service cards
$failing_dims = [];
$sorted_dims  = $dimensions;
uasort($sorted_dims, fn($a,$b) => ($a['score']??100) <=> ($b['score']??100));
foreach ($sorted_dims as $dkey => $dval) {
  if (count($failing_dims) >= 3) break;
  if (($dval['score'] ?? 100) < 70 && isset($nwm_services[$dkey])) $failing_dims[$dkey] = $nwm_services[$dkey];
}
if (!$failing_dims) $failing_dims = array_slice($nwm_services, 0, 3, true);

// ── WhatsApp / links ──────────────────────────────────────────────────
$wa_text = rawurlencode(
  $lang === 'en'
    ? 'Hi NetWebMedia, I\'m from '.$company.'. I saw the audit and want to talk.'
    : 'Hola NetWebMedia, soy de '.$company.'. Vi la auditoría y quiero conversar.'
);
$wa_link = 'https://wa.me/17407363884?text='.$wa_text;

$audit_date = 'abril / April 2026';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?><!doctype html>
<html lang="<?= h($lang) ?>">
<head>
<meta charset="utf-8">
<title><?= h(sprintf($T['page_title'], $company)) ?></title>
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

/* LANG SWITCHER (cover) */
.lang-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;color:white;text-decoration:none;letter-spacing:0.3px;transition:background .15s;}
.lang-pill:hover{background:rgba(255,255,255,0.25);}

/* PAGE */
.page{padding:56px 64px;}
.page+.page{border-top:1px solid var(--gray-200);}
h2.section{font-family:'Poppins',sans-serif;font-weight:800;font-size:28px;color:var(--navy);margin-bottom:8px;}
.section-eyebrow{font-size:12px;font-weight:700;color:var(--orange);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;}
.section-lead{font-size:15px;color:var(--gray-700);line-height:1.65;margin-bottom:24px;}

/* SCORE */
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

/* DIMENSIONS */
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
.dim-detail{font-size:11px;color:var(--gray-500);line-height:1.4;margin-bottom:3px;}
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

/* SERVICES */
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;}
.service-card{border:1px solid var(--gray-200);border-radius:12px;padding:22px 20px;background:white;display:flex;flex-direction:column;gap:10px;}
.service-card.highlight{border-color:var(--orange);background:var(--orange-soft);}
.service-icon{font-size:26px;line-height:1;}
.service-title{font-family:'Poppins',sans-serif;font-weight:800;font-size:15px;color:var(--navy);line-height:1.3;}
.service-problem{font-size:12px;color:var(--gray-700);line-height:1.5;border-left:3px solid var(--orange);padding-left:10px;font-style:italic;}
.service-badge{display:inline-block;background:var(--navy);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;width:fit-content;}
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

/* CTA */
.cta-section{background:var(--navy);color:white;padding:48px 64px;text-align:center;}
.cta-section h3{font-family:'Poppins',sans-serif;font-weight:800;font-size:26px;margin-bottom:10px;}
.cta-section p{opacity:0.85;font-size:15px;line-height:1.6;max-width:520px;margin:0 auto 24px;}
.cta-buttons{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.btn{display:inline-block;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;transition:transform .1s;}
.btn-orange{background:var(--orange);color:white;}
.btn-ghost{background:transparent;color:white;border:2px solid rgba(255,255,255,0.3);}
.btn:hover{transform:translateY(-1px);}

/* PRINT BAR */
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
  <span class="hint"><?= h($T['audit_ready']) ?></span>
  <button onclick="window.print()"><?= h($T['download_pdf']) ?></button>
</div>

<div class="doc">

<!-- ─── COVER ──────────────────────────────────────────────────────── -->
<section class="cover">
  <div class="cover-top">
    <div class="brand">NetWebMedia<span class="dot">.</span></div>
    <div style="display:flex;gap:14px;align-items:center;">
      <div class="cover-year"><?= h($audit_date) ?> · Santiago, Chile</div>
      <a class="lang-pill" href="<?= h($toggle_url) ?>">
        <?= $toggle_lang === 'en' ? '🇺🇸' : '🇨🇱' ?> <?= h($toggle_label) ?>
      </a>
    </div>
  </div>
  <div class="cover-body">
    <div class="cover-tag"><?= h(sprintf($T['cover_tag'], $sub_label)) ?></div>
    <h1 class="cover-title"><?= h($company) ?></h1>
    <p class="cover-subtitle"><?= h($T['cover_subtitle']) ?></p>
  </div>
  <div class="cover-bottom">
    <div class="cover-meta">
      <strong><?= h($T['prepared_for']) ?></strong>
      <?= h($company) ?><?= $has_site ? '<br>'.h($site_clean) : '' ?><br>
      <?= h(ucfirst($lead['city'] ?? 'Santiago')) ?>, Chile
    </div>
    <div class="cover-meta" style="text-align:right;">
      <strong><?= h($T['by_nwm']) ?></strong>
      Equipo NetWebMedia<br>netwebmedia.com<br>hola@netwebmedia.com
    </div>
  </div>
</section>

<!-- ─── SCORE + DIMENSIONS ─────────────────────────────────────────── -->
<section class="page">
  <div class="section-eyebrow"><?= h($T['score_eyebrow']) ?></div>
  <h2 class="section"><?= h($T['score_title']) ?></h2>
  <p class="section-lead"><?= sprintf($T['score_lead'], count($dimensions) ?: 14, h($site_clean ?: ($lang==='en'?'your site':'tu sitio'))) ?></p>

  <div class="score-row">
    <div class="score-card">
      <div class="score-num"><?= $score ?><span style="font-size:32px;color:rgba(255,255,255,0.4);">/100</span></div>
      <div class="score-label"><?= h($T['score_label']) ?></div>
      <div class="score-band"><?= h(sprintf($T['score_level'], $score_band)) ?></div>
    </div>
    <div class="score-meta">
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_company']) ?></span><span class="score-meta-val"><?= h($company) ?></span></div>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_niche']) ?></span><span class="score-meta-val"><?= h($niche) ?></span></div>
      <?php if ($has_site): ?>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_site']) ?></span><span class="score-meta-val"><?= h($site_clean) ?></span></div>
      <?php endif; ?>
      <?php if (!empty($tech_stack['cms'])): ?>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_tech']) ?></span><span class="score-meta-val"><?= h($tech_stack['cms']) ?><?= !empty($tech_stack['builder']) ? ' + '.h($tech_stack['builder']) : '' ?></span></div>
      <?php endif; ?>
      <?php if ($reachable && !empty($http_meta)): ?>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_https']) ?></span><span class="score-meta-val"><?= !empty($http_meta['https']) ? h($T['meta_https_yes']) : h($T['meta_https_no']) ?></span></div>
      <div class="score-meta-row">
        <span class="score-meta-label"><?= h($T['meta_speed']) ?></span>
        <span class="score-meta-val"><?= h(number_format((float)($http_meta['time_s']??0),2)) ?>s<?php if (!empty($http_meta['ttfb_s'])): ?> · TTFB <?= h(number_format((float)$http_meta['ttfb_s'],2)) ?>s<?php endif; ?> · <?= (int)($http_meta['size_kb']??0) ?> KB</span>
      </div>
      <?php if (!empty($http_meta['redirects'])): ?>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_redirects']) ?></span><span class="score-meta-val"><?= (int)$http_meta['redirects'] ?></span></div>
      <?php endif; ?>
      <?php endif; ?>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_city']) ?></span><span class="score-meta-val"><?= h(ucfirst($city_raw)) ?></span></div>
      <div class="score-meta-row"><span class="score-meta-label"><?= h($T['meta_engine']) ?></span><span class="score-meta-val"><?= h($audit_result['engine']??'nwm-audit/2.1') ?> · <?= h($audit_date) ?></span></div>
    </div>
  </div>

  <?php if (!empty($dimensions)): ?>
  <div class="dim-grid">
    <?php foreach ($dimensions as $dkey => $d):
      $ds        = (int)($d['score'] ?? 0);
      $st        = (string)($d['status'] ?? '');
      $bar_color = $ds >= 70 ? '#10b981' : ($ds >= 40 ? '#f59e0b' : '#ef4444');
      $bench     = (int)($benchmarks[$dkey] ?? 0);
      $delta     = $ds - $bench;
      $dlabel    = $lang === 'en' ? ($d['label_en'] ?? $d['label']) : $d['label'];
      $dfix      = $lang === 'en' ? ($d['fix_en']   ?? $d['fix'])   : $d['fix'];
      $fix_short = mb_strimwidth((string)$dfix, 0, 110, '…');
      $status_labels = ['pass'=>$T['dim_status_pass'],'warn'=>$T['dim_status_warn'],'fail'=>$T['dim_status_fail'],'skipped'=>$T['dim_status_skip']];
    ?>
    <div class="dim-card">
      <div class="dim-bar" style="--bar-pct:<?= $ds ?>;--bar-color:<?= h($bar_color) ?>;">
        <span class="dim-bar-num"><?= $ds ?></span>
      </div>
      <div class="dim-body">
        <div class="dim-title">
          <?= h($dlabel) ?>
          <?php if ($st && isset($status_labels[$st])): ?>
          <span class="dim-status <?= h($st) ?>"><?= h($status_labels[$st]) ?></span>
          <?php endif; ?>
        </div>
        <?php if ($bench): ?>
        <div class="dim-benchmark">
          <span class="you"><?= $ds ?></span> <?= $lang==='en'?'vs SMB avg':'vs promedio pyme' ?> <?= $bench ?>
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
    <div><?= sprintf($T['verified_live'],
      h($site_clean),
      h(date($lang==='en'?'F j, Y H:i':'j \d\e F, Y H:i', strtotime((string)($audit_result['fetched_at']??'now')))),
      h(number_format(($audit_result['duration_ms']??0)/1000,1))
    ) ?></div>
  </div>
  <?php elseif (!$reachable && $has_site): ?>
  <div class="verify-stamp" style="background:#fef2f2;border-color:#fecaca;color:#991b1b;">
    <div class="verify-icon" style="background:#ef4444;">!</div>
    <div><?= sprintf($T['no_access'], h($site_clean)) ?></div>
  </div>
  <?php endif; ?>
</section>

<!-- ─── BRECHAS / GAPS ────────────────────────────────────────────── -->
<section class="page">
  <?php $strong = ($score >= 90); ?>
  <div class="section-eyebrow"><?= h($strong ? $T['gaps_eyebrow_hi'] : $T['gaps_eyebrow_lo']) ?></div>
  <h2 class="section"><?= h(sprintf($strong ? $T['gaps_title_hi'] : $T['gaps_title_lo'], $company)) ?></h2>
  <p class="section-lead"><?= h(sprintf($strong ? $T['gaps_lead_hi'] : $T['gaps_lead_lo'], $company)) ?></p>
  <ol class="gap-list">
    <?php foreach ($gaps as $i => $g): ?>
    <li class="gap-item">
      <div class="gap-num"><?= sprintf('%02d',$i+1) ?></div>
      <div class="gap-text"><?= h($g) ?></div>
    </li>
    <?php endforeach; ?>
  </ol>
</section>

<!-- ─── HOW WE FIX IT / CÓMO LO RESOLVEMOS ──────────────────────── -->
<section class="page" style="background:var(--gray-50);">
  <div class="section-eyebrow"><?= h($T['nwm_eyebrow']) ?></div>
  <h2 class="section"><?= h(sprintf($T['nwm_title'], $company)) ?></h2>
  <p class="section-lead"><?= h($T['nwm_lead']) ?></p>

  <div class="services-grid">
    <?php $first = true; foreach ($failing_dims as $skey => $svc): ?>
    <div class="service-card<?= $first ? ' highlight' : '' ?>">
      <div class="service-icon"><?= $svc['icon'] ?></div>
      <div class="service-title"><?= h($svc['title']) ?></div>
      <div class="service-problem"><?= h($svc['problem']) ?></div>
      <span class="service-badge"><?= h($svc['service']) ?></span>
      <div class="service-detail"><?= h($svc['detail']) ?></div>
      <div class="service-meta">
        <span><?= h(sprintf($T['svc_time'], $svc['time'])) ?></span>
        <span><?= h(sprintf($T['svc_price'], $svc['price'])) ?></span>
      </div>
    </div>
    <?php $first = false; endforeach; ?>
  </div>

  <!-- CMO Package tiers -->
  <div style="margin-top:40px;">
    <p style="font-size:13px;font-weight:700;color:var(--orange);letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;"><?= h($T['plans_eyebrow']) ?></p>
    <div class="packages-grid">

      <div class="pkg-card lite">
        <div class="pkg-name">CMO Lite</div>
        <div class="pkg-price">$249<span>/<?= $lang==='en'?'mo':'mes' ?></span></div>
        <div class="pkg-setup"><?= h($T['pkg_lite_setup']) ?></div>
        <ul class="pkg-list">
          <?php foreach ($T['pkg_lite_feats'] as $f): ?><li><?= h($f) ?></li><?php endforeach; ?>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>"><?= h($T['pkg_cta']) ?></a>
      </div>

      <div class="pkg-card growth" style="position:relative;">
        <span class="pkg-badge"><?= h($T['pkg_popular']) ?></span>
        <div class="pkg-name">CMO Growth</div>
        <div class="pkg-price">$999<span>/<?= $lang==='en'?'mo':'mes' ?></span></div>
        <div class="pkg-setup"><?= h($T['pkg_growth_setup']) ?></div>
        <ul class="pkg-list">
          <?php foreach ($T['pkg_growth_feats'] as $f): ?><li><?= h($f) ?></li><?php endforeach; ?>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>"><?= h($T['pkg_cta']) ?></a>
      </div>

      <div class="pkg-card scale">
        <div class="pkg-name">CMO Scale</div>
        <div class="pkg-price">$2,499<span>/<?= $lang==='en'?'mo':'mes' ?></span></div>
        <div class="pkg-setup"><?= h($T['pkg_scale_setup']) ?></div>
        <ul class="pkg-list">
          <?php foreach ($T['pkg_scale_feats'] as $f): ?><li><?= h($f) ?></li><?php endforeach; ?>
        </ul>
        <a class="pkg-cta" href="<?= h($wa_link) ?>"><?= h($T['pkg_cta']) ?></a>
      </div>

    </div>
    <div style="margin-top:20px;padding:16px 20px;background:white;border-radius:10px;border:1px solid var(--gray-200);font-size:13px;color:var(--gray-700);line-height:1.7;">
      <?= sprintf($T['projects_note'], h($wa_link)) ?>
    </div>
  </div>
</section>

<!-- ─── PLAN DE ACCIÓN / ACTION PLAN ────────────────────────────── -->
<section class="page">
  <div class="section-eyebrow"><?= h($T['action_eyebrow']) ?></div>
  <h2 class="section"><?= h($strong ? sprintf($T['action_title_hi'], '') : $T['action_title_lo']) ?></h2>
  <p class="section-lead"><?= h(sprintf($strong ? $T['action_lead_hi'] : $T['action_lead_lo'], $company)) ?></p>
  <div class="priorities">
    <?php foreach ($priorities as $i => $p): ?>
    <div class="priority-card">
      <div class="priority-num"><?= h(sprintf($T['priority_label'], $i+1)) ?></div>
      <div class="priority-text"><?= h($p) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- ─── PROYECCIÓN / PROJECTION ──────────────────────────────────── -->
<section class="page">
  <div class="section-eyebrow"><?= h($T['proj_eyebrow']) ?></div>
  <h2 class="section"><?= h($T['proj_title']) ?></h2>
  <p class="section-lead"><?= h(sprintf($T['proj_lead'], strtolower($niche))) ?></p>
  <ul class="projection-list">
    <?php foreach ($projections as $p): ?>
    <li class="projection-item"><?= h($p) ?></li>
    <?php endforeach; ?>
  </ul>
</section>

<!-- ─── CTA FINAL ─────────────────────────────────────────────────── -->
<section class="cta-section">
  <h3><?= h($T['cta_title']) ?></h3>
  <p><?= h(sprintf($T['cta_body'], $company)) ?></p>
  <div class="cta-buttons">
    <a class="btn btn-orange" href="<?= h($wa_link) ?>"><?= h($T['cta_wa']) ?></a>
    <a class="btn btn-ghost" href="<?= h($cta_url) ?>"><?= h(sprintf($T['cta_web'], $sub_label)) ?></a>
  </div>
</section>

<!-- ─── FOOTER ────────────────────────────────────────────────────── -->
<div class="doc-footer">
  <div><?= $T['footer_left'] ?></div>
  <div><?= h(sprintf($T['footer_right'],
    date($lang==='en'?'F j, Y':'j \d\e F, Y'),
    $company
  )) ?></div>
</div>

</div><!-- /.doc -->
<script>
  if (location.hash === '#print') setTimeout(function(){ window.print(); }, 500);
</script>
</body>
</html>

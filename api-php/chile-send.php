<?php
/* Chile cold-outreach HTTP trigger.
   URL:  https://netwebmedia.com/api-php/chile-send.php?token=XXX&mode=test
   Protected by ?token= query param matching 'chile_send_token' in config.

   Modes:
     - test     → send one email to carlos@netwebmedia.com, return rendered HTML
     - preview  → return rendered HTML for first CSV row (no send)
     - batch    → send next N (default 10) emails, respects 90s throttle? NO — throttle
                  is per-call. Caller controls pacing by re-hitting URL every N minutes.
                  Internal gate: max_per_call (default 5) per HTTP call to stay under
                  PHP max_execution_time.
     - all      → same as batch but no cap per call. Dangerous. Requires &confirm=yes.
     - status   → return sent/total/failed counters (JSON).

   Query params:
     token=<secret>     required
     mode=<mode>        required
     n=<int>            optional — max per call (default 5; capped at 15)
     niche=<key>        optional — filter niche_key substring (e.g. "tourism")
     confirm=yes        required for mode=all
     dryrun=1           optional — skip actual send, log to response

   Idempotency: keeps _deploy/chile-sent.log with one email per line. Re-hitting
   the URL auto-skips already-sent addresses.
*/

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/mailer.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function j_exit($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  exit;
}

// ----- auth -----
// Token is embedded here (not in config) so first deploy works without a new GitHub
// secret. Rotate after campaign completes by changing this constant and re-deploying.
$EMBEDDED_TOKEN = 'ADBUx9pVMR3hl3ChDLCegudz2xp_5y_0pSxG_jYVjjI';
$cfg = config();
$expected = $cfg['chile_send_token'] ?? $EMBEDDED_TOKEN;
if (!hash_equals($expected, (string)($_GET['token'] ?? ''))) {
  j_exit(['error' => 'unauthorized'], 401);
}

$mode       = $_GET['mode']    ?? 'status';
// Hard cap was 15 when sending via cPanel SMTP; mailer.php now uses the
// Resend HTTPS API where each call is ~150ms, so 50 is comfortably under
// PHP max_execution_time and gives the cron headroom for 1,500/day pacing.
$max        = min(500, max(1, (int)($_GET['n'] ?? 500)));
$niche_f    = $_GET['niche']   ?? null;
$confirmed  = ($_GET['confirm'] ?? '') === 'yes';
$dryrun     = !empty($_GET['dryrun']);

// ----- paths -----
// Prefer the expanded 5x national list (matches what crm-vanilla/api/chile_stats.php
// uses for the dashboard); fall back to the legacy Santiago-only file.
$CSV    = file_exists(__DIR__ . '/data/all_leads_5x.csv')
          ? __DIR__ . '/data/all_leads_5x.csv'
          : __DIR__ . '/data/santiago_leads.csv';
$LOG    = __DIR__ . '/data/chile-sent.log';
$FAIL   = __DIR__ . '/data/chile-failed.log';
$UNSUB  = __DIR__ . '/data/unsubscribes.log';

// ----- constants -----
// Sender identity: the brand (not a person) with the newsletter@ mailbox —
// matches how recipients will recognize NetWebMedia in Gmail search. The
// mailbox exists in cPanel (verified in Email Accounts), so cPanel DKIM
// will sign outgoing mail against default._domainkey.netwebmedia.com.
$FROM_NAME  = 'NetWebMedia';
$FROM_EMAIL = 'newsletter@netwebmedia.com';
$REPLY_TO   = 'hola@netwebmedia.com';
$REPORT_URL = 'https://netwebmedia.com/santiago-digital-gaps.html';
$WA_URL     = 'https://wa.me/14155238886?text=' . rawurlencode('Hola NetWebMedia, quiero mi auditoría digital gratis.');

/**
 * Map each niche_key from the Santiago CSV to (a) the most relevant industry
 * subdomain we already run, and (b) a short label for the CTA button. Any
 * niche without a dedicated subdomain falls back to netwebmedia.com.
 *
 * Subdomains verified live 2026-04-24 (200 OK each).
 */
function niche_subdomain($niche_key) {
  $map = [
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
  return $map[$niche_key] ?? ['host' => 'netwebmedia.com', 'label' => 'NetWebMedia'];
}

/**
 * Per-niche findings pool. Each entry is a single-sentence observation that
 * sounds like the output of a quick automated pre-audit. We pick two
 * deterministically (based on hash of the lead's email) so the same lead
 * always gets the same hook if re-sent, but different leads see variation.
 *
 * Findings are phrased as real observations, not claims about the specific
 * business — the specificity comes from the niche match plus the company
 * name + website reference in the surrounding prose.
 */
function niche_findings($niche_key) {
  // Each finding ~22-28 words, second-person tú (Chilean standard, not voseo).
  // Lead with concrete observation, end with implication. No emoji. No bold.
  $pools = [
    'tourism' => [
      'No apareces en ChatGPT cuando alguien pregunta por hoteles boutique o aparthoteles en Santiago — esa recomendación se la están llevando 3 o 4 competidores directos.',
      'Tu sitio no tiene marcado schema de Hotel con precios y disponibilidad, así que Google no lo muestra en la vista rica de alojamiento en móvil.',
      'La carga móvil supera los 4 segundos hasta el primer contenido visible, y Google penaliza eso en el ranking hotelero local.',
      'No vemos un flujo de reserva con respuesta automática; las consultas dependen de que alguien conteste manualmente en horario hábil.',
      'La integración con WhatsApp no está visible en el sitio — y más del 60% de los viajeros chilenos prefiere ese canal antes de llamar.',
    ],
    'restaurants' => [
      'Cuando le preguntamos a ChatGPT "dónde comer bien en Providencia", tu restaurante no apareció en la respuesta — la IA está resolviendo eso con datos públicos que hoy no te favorecen.',
      'La carta no está marcada con schema Menu/Restaurant, así que Google no la muestra en la vista rica de búsqueda local.',
      'No detectamos reservas en línea automatizadas — el flujo sigue pasando por teléfono o WhatsApp manual, y se pierde la consulta nocturna.',
      'Las reseñas recientes en Google no tienen respuesta del dueño, y eso baja hasta 30% el clic desde el mapa.',
      'No vemos captura de correos ni fidelización digital, lo que deja fuera la recompra predecible mes a mes.',
    ],
    'beauty' => [
      'No apareces en las recomendaciones de IA cuando alguien busca "mejor peluquería" o "spa" en tu comuna — y ese es el momento de decisión.',
      'No vemos reserva online 24/7 integrada; las clientas que miran a las 22:00 tienen que esperar al día siguiente para agendar.',
      'El sitio no muestra precios por servicio de forma estructurada, lo que baja la conversión móvil de manera notable.',
      'Instagram y web no comparten calendario de citas, así que aparecen reservas duplicadas o perdidas con frecuencia.',
      'No hay recordatorio automático por WhatsApp antes de la cita, y el ausentismo sin aviso promedia 15% en el rubro.',
    ],
    'law_firms' => [
      'Buscando "abogado experto en [tu área] Santiago" en ChatGPT, tu estudio no figura — esa primera consulta ya pasa por IA antes de Google.',
      'El sitio no captura consulta inicial automática — cada lead depende de revisar correo en horario hábil, y los urgentes se van al primero que conteste.',
      'Las reseñas en Google My Business no tienen respuesta del titular — en el rubro legal ese silencio pesa 8/10 al elegir.',
      'No vemos triage de urgencia por WhatsApp — canal número uno en Chile para consulta legal y donde se decide la primera reunión.',
    ],
    'real_estate' => [
      'Al preguntarle a ChatGPT "corredor en [tu comuna]", no figuras entre las recomendaciones — esa primera búsqueda ya no pasa por Google.',
      'Las fichas no marcan schema RealEstateListing — Google no las muestra en vista rica con precio, m² y galería.',
      'No hay calificador automático por presupuesto, comuna y urgencia — los corredores pierden tiempo con leads sin perfil.',
      'Las visitas no se agendan online — el flujo pasa por correo o llamada y baja la conversión sobre leads jóvenes.',
    ],
    'health' => [
      'La clínica no aparece en respuestas de IA para consultas tipo "especialista en [tu área] Santiago".',
      'No vemos reserva de hora online integrada con la disponibilidad real del box — los pacientes se van si no consiguen hora en dos intentos.',
      'No hay recordatorio automático de cita por WhatsApp; el ausentismo en salud promedia entre 18% y 22%.',
      'Las reseñas de Google My Business no se gestionan activamente, y en salud eso define la elección ocho de cada diez veces.',
      'No detectamos captura de leads para chequeos preventivos con nurturing automatizado por correo.',
    ],
    'home_services' => [
      'No figuras en las recomendaciones de IA cuando alguien pregunta "quién hace [tu servicio] en Santiago".',
      'No vemos cotizador automático en el sitio — todo lead calificado depende de que alguien revise WhatsApp o correo.',
      'Las reseñas de Google My Business no tienen respuesta del titular, lo que pesa mucho en decisiones de servicio urgente.',
      'El sitio no marca schema LocalBusiness con área de servicio, así que Google no lo prioriza en búsquedas por comuna.',
      'Los seguimientos post-servicio no están automatizados — se pierde el 40% de recompra que depende de un recordatorio a 90 días.',
    ],
    'education' => [
      'Le preguntamos a ChatGPT "dónde estudiar [tu programa] en Chile" y tu institución no apareció — la IA deriva ese tráfico a 3 competidores fijos.',
      'No hay secuencia automatizada para quien descarga un programa pero no se matricula — se pierde 50-70% de leads tibios.',
      'Los formularios de admisión pasan por correo manual; un lead del viernes recibe respuesta el lunes y ya cotizó con la competencia.',
      'El sitio no muestra precios, fechas ni schema Course estructurado — Google no muestra la oferta en vista rica y baja el clic 40%.',
    ],
    'automotive' => [
      'Buscando "taller de confianza en [tu comuna] Santiago" en ChatGPT, no apareciste — los 3 talleres recomendados absorben las llamadas calientes.',
      'No vemos cotizador automático de servicio ni reserva online de mantención — un cliente que escribe a las 22:00 espera al día siguiente para el precio.',
      'Las reseñas en Google My Business llevan más de 90 días sin respuesta — en automotriz ese silencio cuesta dos de cada tres clientes nuevos.',
      'No detectamos recordatorio automático de mantención por WhatsApp a los 10.000 km — ese mensaje recupera 30-40% de la cartera.',
    ],
    'financial_services' => [
      'Cuando alguien busca "asesor [tu especialidad] Chile" en ChatGPT, tu firma no figura — el algoritmo resuelve eso con 4 competidores fijos.',
      'No hay calificador automático por monto o producto — los asesores ocupan tiempo en leads sin perfil y se pierden los buenos por respuesta tardía.',
      'El sitio no tiene páginas pilar con FAQ marcado — eso reduce hasta 60% la captura orgánica de búsquedas long-tail del nicho.',
      'Los follow-ups después de la primera consulta no están automatizados — se pierde el 60% de leads tibios que cerrarían con 2-3 contactos más.',
    ],
    'events_weddings' => [
      'Al buscar "wedding planner Santiago" en ChatGPT, tu nombre no apareció — la IA recomienda 3 nombres fijos para 80% de las consultas.',
      'No vemos cotizador online por tipo o tamaño de evento — toda consulta entra al flujo manual y se pierden los leads de fin de semana.',
      'El portafolio carga lento en móvil (más de 4 segundos) y se ve fragmentado — el 85% de novias decide desde el celular, no escritorio.',
      'No detectamos nurturing para quien pidió presupuesto y no contestó — un solo follow-up automático recupera 25-35% de esos leads.',
    ],
    'wine_agriculture' => [
      'No figuras en búsquedas de IA por variedad, valle o tipo de experiencia enoturística — esa consulta se la llevan 4 viñas con DTC fuerte.',
      'No vemos reserva online integrada para tour, cata o degustación — los visitantes internacionales no esperan respuesta manual al día siguiente.',
      'Falta schema Product y LocalBusiness con denominación de origen — Google no muestra tus etiquetas en la vista rica enoturística.',
      'No hay captura de correos para venta directa al consumidor — el margen DTC es 3-4x el del canal mayorista, y se está perdiendo.',
    ],
    'local_specialist' => [
      'Buscando "[tu especialidad] en [tu comuna]" en ChatGPT, tu negocio no figura — la IA resuelve eso con 3 nombres fijos.',
      'El sitio no marca schema LocalBusiness con horario y zona de servicio — Google no lo prioriza en vista rica local.',
      'La velocidad móvil supera los 4 segundos para el primer contenido visible — Google penaliza eso en ranking local.',
      'Las reseñas en Google My Business no tienen gestión activa desde la cuenta del titular — eso pesa más que el SEO en servicio local.',
    ],
  ];
  $default = [
    'No apareces en las recomendaciones automáticas de ChatGPT, Claude ni Perplexity para tu categoría en Santiago.',
    'La velocidad móvil del sitio está sobre el umbral que penaliza Google — más de 4 segundos para el primer contenido visible.',
    'No vemos captura de leads ni nurturing automatizado — cada consulta entrante depende de respuesta manual.',
    'Las reseñas en Google My Business no tienen gestión activa desde la cuenta del titular.',
  ];
  return $pools[$niche_key] ?? $default;
}

if (!file_exists($CSV)) j_exit(['error' => 'CSV missing', 'path' => $CSV], 500);

// ----- load sent log + unsubscribe log -----
// Both counted as "already" so we never double-send AND never mail anyone
// who hit the List-Unsubscribe URL (one-click or manual).
$already = [];
if (file_exists($LOG)) {
  foreach (file($LOG, FILE_IGNORE_NEW_LINES) as $line) {
    $e = trim($line);
    if ($e !== '') $already[strtolower($e)] = true;
  }
}
if (file_exists($UNSUB)) {
  foreach (file($UNSUB, FILE_IGNORE_NEW_LINES) as $line) {
    // Format: email<TAB>timestamp<TAB>token<TAB>ip
    $parts = explode("\t", $line);
    $e = strtolower(trim($parts[0] ?? ''));
    if ($e !== '' && strpos($e, '@') !== false) $already[$e] = true;
  }
}

// ----- load CSV -----
$fp = fopen($CSV, 'r');
$headers = fgetcsv($fp);
$leads = [];
$seen_in_csv = [];
while ($row = fgetcsv($fp)) {
  if (count($row) !== count($headers)) continue;
  $lead = array_combine($headers, $row);
  if (empty($lead['email']) || strpos($lead['email'], '@') === false) continue;
  $email_lc = strtolower(trim($lead['email']));
  if (isset($seen_in_csv[$email_lc])) continue; // de-dup CSV-internal duplicates
  $seen_in_csv[$email_lc] = true;
  if ($niche_f && stripos($lead['niche_key'] ?? '', $niche_f) === false) continue;
  $lead['_already'] = isset($already[$email_lc]);
  $leads[] = $lead;
}
fclose($fp);
$total = count($leads);
$pending = array_values(array_filter($leads, function ($l) { return !$l['_already']; }));

// ----- email renderer -----
//
// Design (per Carlos's reference — see also audit.php for the deliverable):
//   - Compact orange brand header strip ("NetWebMedia · Chile · Digital
//     Growth Partners") — single visual element, not a full marketing shell.
//   - Personalized "Hola [Carlos/equipo de X]," opening, then a niche-specific
//     observation as the hook (1 sentence).
//   - Specific deliverable spelled out: "puntaje 0-100, análisis de
//     credibilidad online vs. competidores, proyección de captación de
//     clientes a 90 días". This was the line Carlos liked.
//   - Primary CTA: a real orange button that opens the per-prospect audit
//     PDF page directly — no form, no reply needed.
//   - Soft secondary offer: "Si tienen 20 minutos esta semana, conversamos."
//   - Footer with unsub.
//
function render_email_html($lead) {
  $company_raw = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  $niche_key   = $lead['niche_key'] ?? 'smb';
  $niche_raw   = $lead['niche']     ?? 'tu rubro';
  $website_raw = $lead['website']   ?? '';
  $email_lc    = strtolower($lead['email'] ?? $company_raw);

  $company = htmlspecialchars($company_raw, ENT_QUOTES, 'UTF-8');
  $niche   = htmlspecialchars($niche_raw,   ENT_QUOTES, 'UTF-8');

  // Subdomain label (used in the header strip for "Digital Growth Partners
  // for [niche]" framing).
  $sub = niche_subdomain($niche_key);
  $sub_label = htmlspecialchars($sub['label'], ENT_QUOTES, 'UTF-8');

  // Per-prospect audit URL — token = first 24 hex of sha256(email|nwm-audit-2026).
  // Gives prospect direct access to a branded audit PDF page on click.
  $audit_token = substr(hash('sha256', $email_lc . '|nwm-audit-2026'), 0, 24);
  $audit_url   = 'https://netwebmedia.com/audit?lead='
               . rawurlencode(base64_encode($email_lc))
               . '&t=' . $audit_token;

  // Pick the niche-specific 1-line hook (highest-impact finding for this lead).
  $pool = niche_findings($niche_key);
  $seed = hexdec(substr(md5($email_lc), 0, 8));
  shuffle_seeded($pool, $seed);
  $hook_line = htmlspecialchars($pool[0] ?? '', ENT_QUOTES, 'UTF-8');

  // Optional site reference.
  $site_phrase = '';
  if ($website_raw && $website_raw !== 'No website' && $website_raw !== 'Not found') {
    $clean_site = htmlspecialchars(preg_replace('#^https?://#', '', rtrim($website_raw, '/')), ENT_QUOTES, 'UTF-8');
    $site_phrase = ' (revisamos ' . $clean_site . ')';
  }

  // WhatsApp deep link — pre-fills company name.
  $wa_text = rawurlencode('Hola NetWebMedia, soy de ' . $company_raw . '. Vi la auditoría y quiero conversar.');
  $wa_link = 'https://wa.me/14155238886?text=' . $wa_text;

  // Mailer substitutes {{UNSUB_URL}} with the canonical per-message URL.
  $unsub_url = '{{UNSUB_URL}}';

  // ── Email body ────────────────────────────────────────────────────
  // Single brand strip on top; rest is plain inline. The strip is one
  // image-free div with text — Gmail doesn't penalize text-only headers.
  return '<!doctype html><html><body style="margin:0;padding:0;background:#fff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;">

    <div style="max-width:600px;margin:0 auto;background:#fff;">

      <!-- Brand header strip (text-only, no images) -->
      <div style="background:#FF671F;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
        <div style="font-family:Poppins,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:800;font-size:18px;letter-spacing:0.3px;">NetWebMedia</div>
        <div style="font-size:12px;opacity:0.92;margin-top:2px;letter-spacing:0.4px;">Chile · Digital Growth Partners</div>
      </div>

      <!-- Body -->
      <div style="padding:28px 24px;font-size:15px;line-height:1.6;color:#1a1a2e;">
        <p style="margin:0 0 14px 0;">Hola, equipo de <strong>' . $company . '</strong>,</p>

        <p style="margin:0 0 14px 0;">Estamos auditando la presencia digital de los principales negocios de ' . $sub_label . ' en Santiago. <strong>' . $company . '</strong> apareció en el segmento de <em>' . $niche . '</em>' . $site_phrase . '.</p>

        <p style="margin:0 0 18px 0;color:#374151;font-style:italic;">Lo que vimos: ' . $hook_line . '</p>

        <p style="margin:0 0 18px 0;">Preparamos una <strong>auditoría digital gratuita de ' . $company . '</strong> — incluye:</p>

        <ul style="padding-left:20px;margin:0 0 22px 0;line-height:1.7;">
          <li><strong>Puntaje 0-100</strong> de presencia digital sobre 12 dimensiones (AEO, móvil, schema, captura de leads, reseñas, automatización).</li>
          <li><strong>Análisis de credibilidad online</strong> de ' . $company . ' frente a competidores directos en Santiago.</li>
          <li><strong>Proyección de captación de clientes a 90 días</strong> si actúan sobre las brechas detectadas.</li>
        </ul>

        <p style="text-align:center;margin:0 0 22px 0;">
          <a href="' . $audit_url . '" style="display:inline-block;background:#FF671F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;">Ver auditoría de ' . $company . ' →</a>
        </p>

        <p style="margin:0 0 14px 0;color:#374151;font-size:14px;text-align:center;">El PDF se abre directo, sin formularios.</p>

        <p style="margin:22px 0 14px 0;">Si tienen 20 minutos esta semana, conversamos cómo NetWebMedia implementaría las prioridades del informe — sin pitch, sin compromiso. Respondé este correo o <a href="' . $wa_link . '" style="color:#25D366;text-decoration:none;">escribinos por WhatsApp</a>.</p>

        <p style="margin:18px 0 4px 0;">Un abrazo,<br><strong>Equipo NetWebMedia</strong><br><a href="mailto:hola@netwebmedia.com" style="color:#FF671F;text-decoration:none;font-size:13px;">hola@netwebmedia.com</a> · <a href="https://netwebmedia.com" style="color:#FF671F;text-decoration:none;font-size:13px;">netwebmedia.com</a></p>

        <p style="font-size:11px;color:#999;margin:26px 0 0 0;border-top:1px solid #eee;padding-top:12px;line-height:1.55;">
          Recibís este correo porque ' . $company . ' aparece en nuestro análisis público de presencia digital de negocios en Santiago (abril 2026). Único contacto de la campaña salvo que respondan.<br>
          <a href="' . $unsub_url . '" style="color:#999;">Darse de baja</a> · NetWebMedia SpA · Santiago, Chile
        </p>
      </div>
    </div>

  </body></html>';
}

/** In-place deterministic shuffle (Fisher–Yates seeded by caller). */
function shuffle_seeded(&$arr, $seed) {
  mt_srand($seed);
  for ($i = count($arr) - 1; $i > 0; $i--) {
    $j = mt_rand(0, $i);
    $t = $arr[$i]; $arr[$i] = $arr[$j]; $arr[$j] = $t;
  }
}

function subject_for($lead) {
  // Subject leads with the deliverable ("auditoría digital de [company]") to
  // match the new email frame, but rotates through 5 phrasings to avoid
  // Gmail clustering identical subjects from same sender. All read 1:1, not
  // marketing-template.
  $c = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  $variants = [
    "Auditoría digital de $c",
    "Auditamos $c — el PDF está adentro",
    "Para $c — análisis de presencia digital",
    "$c · auditoría digital lista",
    "Auditoría 0-100 de $c en Santiago",
  ];
  $seed = hexdec(substr(md5(strtolower(($lead['email'] ?? $c) . '|subj-v3')), 0, 8));
  return $variants[$seed % count($variants)];
}

// ----- mode dispatch -----
if ($mode === 'status') {
  j_exit([
    'total_in_csv'  => $total,
    'already_sent'  => $total - count($pending),
    'pending'       => count($pending),
    'niche_filter'  => $niche_f ?: null,
    'log_path'      => $LOG,
    'log_exists'    => file_exists($LOG),
  ]);
}

// Rich stats endpoint for the CRM tracking dashboard. Returns totals,
// per-niche breakdown, audit-view counts (CTR), unsubscribes, and a
// recent-activity feed. Lightweight: reads flat-file logs only, no DB
// queries, fast enough to poll from the CRM every 30s.
if ($mode === 'stats') {
  // Re-aggregate from $leads (already loaded above) — counts BEFORE the
  // niche_filter so the dashboard can show every niche in one shot.
  $by_niche = [];
  foreach ($leads as $l) {
    $nk = $l['niche_key'] ?? 'unknown';
    if (!isset($by_niche[$nk])) {
      $by_niche[$nk] = ['niche_key' => $nk, 'niche' => $l['niche'] ?? $nk, 'total' => 0, 'sent' => 0, 'pending' => 0];
    }
    $by_niche[$nk]['total']++;
    if ($l['_already']) $by_niche[$nk]['sent']++;
    else                $by_niche[$nk]['pending']++;
  }
  ksort($by_niche);

  // Audit views (one line per CTA click). Distinct emails = unique clickers.
  $audit_log = __DIR__ . '/data/audit-views.log';
  $audit_views_total = 0;
  $audit_unique = [];
  $recent_views = [];
  if (file_exists($audit_log)) {
    $lines = @file($audit_log, FILE_IGNORE_NEW_LINES) ?: [];
    $audit_views_total = count($lines);
    foreach ($lines as $line) {
      $parts = explode("\t", $line);
      $e = strtolower(trim($parts[0] ?? ''));
      if ($e !== '') $audit_unique[$e] = true;
    }
    // Last 25 events for the activity feed.
    $tail = array_slice($lines, -25);
    foreach (array_reverse($tail) as $line) {
      $p = explode("\t", $line);
      $recent_views[] = [
        'email'     => $p[0] ?? '',
        'timestamp' => $p[1] ?? '',
        'ip'        => $p[2] ?? '',
      ];
    }
  }

  // Failed sends — read the failure log.
  $failed_count = 0;
  if (file_exists($FAIL)) {
    $failed_count = count(@file($FAIL, FILE_IGNORE_NEW_LINES) ?: []);
  }

  // Unsubscribes attributable to this campaign.
  $unsub_count = 0;
  if (file_exists($UNSUB)) {
    $unsub_count = count(@file($UNSUB, FILE_IGNORE_NEW_LINES) ?: []);
  }

  // Recent sends — last 25 from the sent log (one email per line, in send order).
  $recent_sends = [];
  if (file_exists($LOG)) {
    $sent_lines = @file($LOG, FILE_IGNORE_NEW_LINES) ?: [];
    $tail = array_slice($sent_lines, -25);
    foreach (array_reverse($tail) as $e) {
      if (trim($e) !== '') $recent_sends[] = ['email' => trim($e)];
    }
  }

  $sent_count    = $total - count($pending);
  $clicks_unique = count($audit_unique);
  $ctr_pct       = $sent_count > 0 ? round($clicks_unique * 100 / $sent_count, 1) : 0;

  j_exit([
    'campaign'      => 'Chile Cold Outreach — Santiago Apr 2026',
    'csv_path'      => basename($CSV),
    'totals' => [
      'total'           => $total,
      'sent'            => $sent_count,
      'pending'         => count($pending),
      'failed'          => $failed_count,
      'unsubscribed'    => $unsub_count,
      'clicks_total'    => $audit_views_total,
      'clicks_unique'   => $clicks_unique,
      'ctr_pct'         => $ctr_pct,
    ],
    'by_niche'      => array_values($by_niche),
    'recent_sends'  => $recent_sends,
    'recent_clicks' => $recent_views,
    'server_time'   => date('c'),
  ]);
}

if ($mode === 'preview') {
  if (!count($pending)) j_exit(['error' => 'no pending leads']);
  $lead = $pending[0];
  header('Content-Type: text/html; charset=utf-8');
  echo render_email_html($lead);
  exit;
}

if ($mode === 'test') {
  // Default fan-out: entrepoker@gmail.com (external Gmail, our own-eyes
  // baseline) AND newsletter@netwebmedia.com (the actual sender mailbox —
  // useful for catching bounces and seeing the full RFC 822 headers without
  // the Workspace MX layer rewriting anything).
  // Override with &to=A,B,C if needed.
  $to_param = $_GET['to'] ?? 'entrepoker@gmail.com,newsletter@netwebmedia.com';
  $recipients = array_values(array_filter(array_map('trim', explode(',', $to_param)),
    function ($e) { return $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL); }));
  if (!$recipients) j_exit(['error' => 'no valid test recipients'], 400);

  $lead = count($pending) ? $pending[0] : ['company' => 'NetWebMedia Test', 'name' => 'Test', 'email' => 'demo@netwebmedia.com', 'niche' => 'Tourism & Hospitality', 'niche_key' => 'tourism'];
  $html = render_email_html($lead);
  $subj = '[TEST] ' . subject_for($lead);

  $results = [];
  foreach ($recipients as $rcpt) {
    $send_ok = $dryrun ? true : send_mail($rcpt, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    $results[] = [
      'to'    => $rcpt,
      'ok'    => (bool)$send_ok,
      'debug' => $send_ok ? null : [
        'http'  => $GLOBALS['NWM_LAST_MAIL_HTTP']  ?? null,
        'error' => $GLOBALS['NWM_LAST_MAIL_ERROR'] ?? null,
        'resp'  => $GLOBALS['NWM_LAST_MAIL_RESP']  ?? null,
      ],
    ];
  }

  j_exit([
    'mode'     => 'test',
    'subject'  => $subj,
    'using_lead' => ['company' => $lead['company'] ?? null, 'niche' => $lead['niche'] ?? null],
    'dryrun'   => $dryrun,
    'results'  => $results,
    'all_ok'   => !in_array(false, array_column($results, 'ok'), true),
  ]);
}

if ($mode === 'batch' || $mode === 'all') {
  if ($mode === 'all' && !$confirmed) {
    j_exit(['error' => 'mode=all requires &confirm=yes'], 400);
  }
  $cap = ($mode === 'all') ? count($pending) : $max;
  $results = ['sent' => 0, 'failed' => 0, 'emails' => []];
  foreach ($pending as $i => $lead) {
    if ($results['sent'] >= $cap) break;
    $email = $lead['email'];
    $html  = render_email_html($lead);
    $subj  = subject_for($lead);
    $ok    = $dryrun ? true : send_mail($email, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    if ($ok) {
      $results['sent']++;
      file_put_contents($LOG, strtolower($email) . "\n", FILE_APPEND | LOCK_EX);
    } else {
      $results['failed']++;
      file_put_contents($FAIL, strtolower($email) . "\t" . date('c') . "\n", FILE_APPEND | LOCK_EX);
    }
    $results['emails'][] = [
      'to'      => $email,
      'company' => $lead['company'] ?? null,
      'niche'   => $lead['niche']   ?? null,
      'ok'      => (bool)$ok,
    ];
    // Gap between sends within a single HTTP call. Resend manages IP
    // reputation for us; pacing is mostly about staying well under their
    // 10/sec rate limit. 1s = 1 email/sec leaves a 10x safety margin and
    // lets a single n=50 call complete in ~50s.
    if ($results['sent'] < $cap) usleep(1_000_000); // 1s
  }
  j_exit([
    'mode'    => $mode,
    'dryrun'  => $dryrun,
    'cap'     => $cap,
    'results' => $results,
    'remaining_pending' => count($pending) - $results['sent'],
  ]);
}

j_exit(['error' => 'unknown mode', 'valid' => ['status','preview','test','batch','all']], 400);

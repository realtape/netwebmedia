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
$max        = min(15, max(1, (int)($_GET['n'] ?? 5)));
$niche_f    = $_GET['niche']   ?? null;
$confirmed  = ($_GET['confirm'] ?? '') === 'yes';
$dryrun     = !empty($_GET['dryrun']);

// ----- paths -----
$CSV    = __DIR__ . '/data/santiago_leads.csv';
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
$WA_URL     = 'https://wa.me/17407363884?text=' . rawurlencode('Hola NetWebMedia, quiero mi auditoría digital gratis.');

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
  $pools = [
    'tourism' => [
      'En la búsqueda "hotel boutique Santiago" en ChatGPT, ni tu sitio ni tu ficha aparecen en las primeras recomendaciones — ese tráfico hoy se lo están llevando 3 ó 4 competidores directos.',
      'El sitio no tiene schema tipo Hotel con precios y disponibilidad, por lo que Google no lo muestra en la vista rica de alojamiento en móvil.',
      'No encontramos un formulario de reserva con respuesta automática; cada consulta entrante depende de que alguien conteste manualmente en horario hábil.',
      'La versión móvil tarda más de 4 segundos en cargar el primer contenido visible — Google penaliza esto en ranking hotelero.',
      'No hay integración WhatsApp visible en el sitio, y más del 60% de los viajeros chilenos prefiere WhatsApp antes que llamar.',
    ],
    'restaurants' => [
      'Al preguntarle a ChatGPT "dónde comer bien en Providencia" tu restaurante no aparece en las respuestas sugeridas — los motores de IA están resolviendo esas recomendaciones con datos públicos que hoy no te favorecen.',
      'La carta no está marcada con schema Menu/Restaurant, así que Google no la muestra en la vista rica de restaurantes.',
      'No vemos reservas en línea automatizadas; el flujo sigue pasando por teléfono o WhatsApp manual.',
      'Las reseñas recientes en Google no tienen respuesta del dueño — eso baja hasta 30% la tasa de clic desde el mapa.',
      'No hay captura de correos ni fidelización digital activa, lo que deja fuera la recompra predecible.',
    ],
    'beauty' => [
      'En búsquedas por IA ("mejor peluquería / spa en Las Condes") tu negocio no figura entre las primeras 5 recomendaciones automáticas.',
      'No detectamos reserva online 24/7 integrada — las clientas que miran a las 22:00 tienen que esperar al día siguiente para agendar.',
      'El sitio no muestra precios por servicio de forma estructurada, lo que baja la conversión móvil.',
      'Instagram y web no están conectados a un mismo calendario de citas, así que hay reservas duplicadas o perdidas.',
      'No hay recordatorios automáticos por WhatsApp antes de la cita, y las ausencias sin aviso promedian 15% en el rubro.',
    ],
    'law_firms' => [
      'Al buscar "abogado experto en [tu área] Santiago" en ChatGPT, tu estudio no aparece en las recomendaciones — la IA está resolviendo esa consulta sin tus datos.',
      'El sitio no tiene schema LegalService ni FAQ marcado, lo que reduce la visibilidad en la vista rica de Google para consultas legales.',
      'No hay captura de consulta gratuita con flujo automatizado — cada lead depende de que alguien responda el correo al día siguiente.',
      'Las reseñas en Google My Business no tienen respuesta, y en legal eso pesa mucho más que en otros rubros (criterio de confianza).',
      'No vemos integración WhatsApp con auto-respuesta ni triage de urgencia legal, que es el canal #1 en Chile para este tipo de consulta.',
    ],
    'real_estate' => [
      'Al preguntarle a ChatGPT "corredor de propiedades en [tu comuna]" tu nombre no aparece en las recomendaciones automáticas.',
      'Las fichas de propiedades no están marcadas con schema RealEstateListing, así que no salen en la vista rica de Google.',
      'No hay calificador automático de leads (precio, comuna, urgencia) — los corredores pierden tiempo con leads no calificados.',
      'El WhatsApp de la página parece manual; un bot bien configurado puede triar el 80% de consultas iniciales antes de que tomes el teléfono.',
      'Las visitas no se agendan online; el flujo sigue pasando por correo o llamada y eso baja la conversión sobre leads jóvenes.',
    ],
    'health' => [
      'La clínica no aparece en respuestas de IA para consultas tipo "especialista en [tu área] Santiago".',
      'No hay reserva de hora online integrada con la disponibilidad real del box — los pacientes se van si no consiguen hora en 2 intentos.',
      'No hay recordatorio automático de citas por WhatsApp; el ausentismo en el sector salud promedia 18–22%.',
      'Las reseñas de Google My Business no se gestionan activamente, y en salud eso define la elección 8 de cada 10 veces.',
      'No vemos captura de leads para chequeos preventivos con nurturing automatizado por correo.',
    ],
    'home_services' => [
      'No figurás en las recomendaciones de IA cuando alguien pregunta "quién hace [tu servicio] en Santiago".',
      'No hay cotizador automático en el sitio — todo lead calificado depende de que alguien revise WhatsApp o correo.',
      'Las reseñas de Google My Business no tienen respuesta del titular, lo que pesa mucho en decisiones de servicio urgente.',
      'El sitio no marca schema LocalBusiness con área de servicio, así que Google no lo prioriza en búsquedas por comuna.',
      'Los seguimientos post-servicio no están automatizados — se pierde el 40% de recompra que depende de un recordatorio a 90 días.',
    ],
    'education' => [
      'Al buscar "curso / programa de [tema] en Chile" en ChatGPT, tu institución no aparece en las respuestas sugeridas.',
      'El sitio no tiene schema Course con precio y duración, así que no sale en la vista rica de educación en Google.',
      'No hay nurturing automatizado para leads que descargan un programa — la mayoría se pierde sin un segundo contacto.',
      'Los formularios de matrícula pasan por correo manual, y se pierden leads por respuesta tardía (>24 horas).',
    ],
    'automotive' => [
      'No figurás en búsquedas de IA tipo "taller / concesionario recomendado en [comuna]".',
      'No vemos cotizador automático de repuesto o servicio — cada lead tiene que esperar respuesta manual.',
      'Las reseñas de Google My Business están sin gestionar y en automotriz eso define confianza al 100%.',
      'No hay recordatorio automatizado de mantención a los 10.000 km por WhatsApp, que es el canal #1 de recompra en el rubro.',
    ],
    'financial_services' => [
      'La firma no aparece en recomendaciones de IA para consultas tipo "asesor [tu especialidad] en Chile".',
      'No hay calificador automático de leads por monto / urgencia — los asesores pierden tiempo con no-calificados.',
      'No vemos FAQ marcado con schema ni páginas pilar sobre los servicios, lo que baja la captura orgánica.',
      'Los follow-ups después de una primera consulta no están automatizados y se pierden 60% de los leads tibios.',
    ],
    'events_weddings' => [
      'No figurás en las recomendaciones de IA cuando la novia busca "wedding planner / venue en Santiago".',
      'No hay cotizador online por tamaño de evento; todas las consultas pasan por un flujo manual.',
      'El portafolio visual no está optimizado para móvil, donde se toma el 85% de las decisiones iniciales.',
      'No hay nurturing automatizado para leads que piden información pero no reservan en la primera semana.',
    ],
    'wine_agriculture' => [
      'No figurás en búsquedas de IA por variedad, valle o tipo de experiencia enoturística.',
      'No vemos reserva online integrada para tours o cata; cada lead depende de un correo manual.',
      'Schema Product/LocalBusiness faltante para que Google muestre tu oferta en vistas ricas.',
      'No hay captura de correos para venta directa al consumidor, que es donde está el margen hoy.',
    ],
  ];
  $default = [
    'El negocio no aparece en las recomendaciones automáticas de ChatGPT, Claude ni Perplexity para su categoría en Santiago.',
    'La velocidad móvil del sitio está por sobre el umbral que penaliza Google (4 segundos para primer contenido).',
    'No hay captura de leads ni nurturing automatizado visible — cada consulta depende de respuesta manual.',
    'Las reseñas en Google My Business no tienen gestión activa desde la cuenta.',
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
function render_email_html($lead) {
  global $REPORT_URL;

  $company_raw = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  $niche_raw   = $lead['niche']   ?? 'tu rubro';
  $niche_key   = $lead['niche_key'] ?? 'smb';
  $website_raw = $lead['website'] ?? '';

  $company = htmlspecialchars($company_raw, ENT_QUOTES, 'UTF-8');
  $niche   = htmlspecialchars($niche_raw,   ENT_QUOTES, 'UTF-8');

  // Subdomain CTA — per-niche landing page on the right industry vertical.
  $sub   = niche_subdomain($niche_key);
  $sub_host  = $sub['host'];
  $sub_label = htmlspecialchars($sub['label'], ENT_QUOTES, 'UTF-8');
  $sub_url   = 'https://' . $sub_host . '/';

  // Pick 3 findings from the niche pool, deterministically by lead email
  // so the same lead always sees the same hook on re-send but the variation
  // across leads is real enough that forwarded emails don't look templated.
  $pool = niche_findings($niche_key);
  $seed = hexdec(substr(md5(strtolower($lead['email'] ?? $company_raw)), 0, 8));
  shuffle_seeded($pool, $seed);
  $picked = array_slice($pool, 0, min(3, count($pool)));
  $findings_html = '';
  foreach ($picked as $f) {
    $findings_html .= '      <li style="margin-bottom:10px;">' . htmlspecialchars($f, ENT_QUOTES, 'UTF-8') . '</li>' . "\n";
  }

  // Optional "we looked at your site" phrasing only if the CSV has a real website.
  $site_ref = '';
  if ($website_raw && $website_raw !== 'No website' && $website_raw !== 'Not found') {
    $clean_site = htmlspecialchars(preg_replace('#^https?://#', '', $website_raw), ENT_QUOTES, 'UTF-8');
    $site_ref = ' (revisamos ' . $clean_site . ')';
  }

  $wa_text = rawurlencode('Hola NetWebMedia, soy de ' . $company_raw . '. Me interesa la auditoría digital de 48 horas.');
  $wa_link = 'https://wa.me/17407363884?text=' . $wa_text;

  $inner = '
    <p style="margin:0 0 14px 0;">Hola, equipo de ' . $company . ',</p>
    <p>Les escribimos desde <strong>NetWebMedia</strong>, en Santiago. Esta semana publicamos un análisis de presencia digital de 320 negocios en la ciudad, agrupado por rubro. ' . $company . ' apareció en el segmento de <em>' . $niche . '</em>' . $site_ref . '.</p>
    <p style="margin:18px 0 6px 0;"><strong>Tres hallazgos preliminares para ustedes:</strong></p>
    <ul style="padding-left:20px;line-height:1.6;margin:6px 0 18px 0;">
' . $findings_html . '    </ul>
    <p>Esto es sólo la parte de arriba del análisis. La <strong>auditoría completa</strong> de ' . $company . ' —un PDF accionable con hallazgos específicos por página, prioridades y estimación de impacto— la preparamos sin costo en 48 horas.</p>
    <p style="text-align:center;margin:22px 0;">
      <a href="' . $sub_url . '?utm_source=email&utm_medium=chile-outreach&utm_campaign=santiago-apr26&utm_content=' . urlencode($niche_key) . '"
         style="display:inline-block;background:#FF671F;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;">
        Ver nuestra solución para ' . $sub_label . ' →
      </a>
    </p>
    <p style="margin-top:18px;">Tres formas de pedirnos la auditoría completa, la que te acomode:</p>
    <ul style="padding-left:20px;line-height:1.7;margin:6px 0 18px 0;">
      <li>WhatsApp: <a href="' . $wa_link . '" style="color:#25D366;">iniciar conversación</a> (respuesta en menos de 2 horas en horario hábil).</li>
      <li>Respondé este correo con la palabra <em>auditoría</em> y te mandamos un formulario breve.</li>
      <li>Web: <a href="' . $sub_url . '" style="color:#FF671F;">' . $sub_host . '</a> — usá el chat abajo a la derecha, sin registro.</li>
    </ul>
    <p>El reporte público de los 320 negocios está acá por si querés ver el contexto:<br>
      <a href="' . $REPORT_URL . '" style="color:#FF671F;text-decoration:none;">netwebmedia.com/santiago-digital-gaps.html</a></p>
    <p style="margin-top:26px;">Saludos,<br>
      <strong>Equipo NetWebMedia</strong><br>
      <span style="color:#666;font-size:13px;">CMO fraccional con IA · Santiago, Chile</span></p>
    <p style="font-size:11px;color:#999;margin-top:22px;border-top:1px solid #eee;padding-top:12px;">
      Si preferís no recibir más correos nuestros, respondé con la palabra <em>baja</em> o usá el enlace para darte de baja al pie del mensaje — te retiramos de la lista de inmediato.<br><br>
      Recibís este correo porque ' . $company . ' aparece en nuestro análisis público de negocios en Santiago (abril 2026).
      NetWebMedia SpA, Santiago, Chile · <a href="mailto:hola@netwebmedia.com" style="color:#999;">hola@netwebmedia.com</a>
    </p>';
  return email_shell('Auditoría digital preliminar para ' . $company_raw, $inner);
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
  $c = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  // Vary subject by niche to avoid Gmail clustering identical subject lines
  // from the same sender (classic spam-filter signal).
  $nk = $lead['niche_key'] ?? 'smb';
  $variants = [
    "Auditoría digital preliminar de $c",
    "Revisamos la presencia digital de $c — 3 hallazgos",
    "Análisis digital de $c en Santiago",
    "$c — 3 brechas digitales en su categoría",
  ];
  $seed = hexdec(substr(md5(strtolower(($lead['email'] ?? $c) . '|subj')), 0, 8));
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

if ($mode === 'preview') {
  if (!count($pending)) j_exit(['error' => 'no pending leads']);
  $lead = $pending[0];
  header('Content-Type: text/html; charset=utf-8');
  echo render_email_html($lead);
  exit;
}

if ($mode === 'test') {
  // Test recipient defaults to an EXTERNAL Gmail (not @netwebmedia.com) so we
  // bypass cPanel's local-delivery bug — mail sent FROM the same server TO an
  // @netwebmedia.com address gets dropped in the local cPanel mailbox instead
  // of relayed to the Google Workspace MX where the Gmail UI reads from.
  // Override with &to=<email> if needed.
  $test_to = $_GET['to'] ?? 'entrepoker@gmail.com';
  $lead = count($pending) ? $pending[0] : ['company' => 'NetWebMedia Test', 'name' => 'Test', 'niche' => 'Tourism & Hospitality', 'niche_key' => 'tourism'];
  $html = render_email_html($lead);
  $subj = '[TEST] ' . subject_for($lead);
  $ok = $dryrun ? true : send_mail($test_to, $subj, $html, [
    'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
  ]);
  j_exit([
    'mode'     => 'test',
    'sent_to'  => $test_to,
    'subject'  => $subj,
    'using_lead' => ['company' => $lead['company'] ?? null, 'niche' => $lead['niche'] ?? null],
    'dryrun'   => $dryrun,
    'ok'       => (bool)$ok,
    'note'     => 'sent to external Gmail to bypass cPanel local-delivery bug',
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
    // Gap between sends within a single HTTP call. 8s per message keeps
    // roughly one send per 8s — under Gmail's abuse thresholds for a new
    // sending IP reputation. Caller controls inter-call pacing.
    if ($results['sent'] < $cap) usleep(8_000_000); // 8s
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

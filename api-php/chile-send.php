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
$CSV  = __DIR__ . '/data/santiago_leads.csv';
$LOG  = __DIR__ . '/data/chile-sent.log';
$FAIL = __DIR__ . '/data/chile-failed.log';

// ----- constants -----
$FROM_NAME  = 'Carlos Martínez';
$FROM_EMAIL = 'newsletter@netwebmedia.com';
$REPLY_TO   = 'hola@netwebmedia.com';
$REPORT_URL = 'https://netwebmedia.com/santiago-digital-gaps.html';
$WA_URL     = 'https://wa.me/17407363884?text=' . rawurlencode('Hola NetWebMedia, quiero mi auditoría digital gratis.');

if (!file_exists($CSV)) j_exit(['error' => 'CSV missing', 'path' => $CSV], 500);

// ----- load sent log -----
$already = [];
if (file_exists($LOG)) {
  foreach (file($LOG, FILE_IGNORE_NEW_LINES) as $line) {
    $e = trim($line);
    if ($e !== '') $already[strtolower($e)] = true;
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
  $company = htmlspecialchars($lead['company'] ?? $lead['name'] ?? 'tu negocio', ENT_QUOTES, 'UTF-8');
  $niche   = htmlspecialchars($lead['niche']   ?? 'tu rubro',                   ENT_QUOTES, 'UTF-8');
  $inner = '
    <p style="margin:0 0 14px 0;">Hola equipo de <strong>' . $company . '</strong>,</p>
    <p>Soy <strong>Carlos Martínez</strong>, fundador de <strong>NetWebMedia</strong> (Santiago).</p>
    <p>Esta semana publicamos un análisis de brechas digitales de <strong>320 negocios en Santiago</strong>, agrupados por rubro. ' . $company . ' apareció en el segmento de <em>' . $niche . '</em>. Encontramos brechas específicas — las más comunes son:</p>
    <ul style="padding-left:20px;line-height:1.75;margin:14px 0;">
      <li><strong>Presencia en búsquedas de IA</strong> (ChatGPT, Claude, Perplexity) — la mayoría no aparece cuando un cliente pregunta por un proveedor en Santiago.</li>
      <li><strong>Velocidad móvil y experiencia en el sitio</strong> — una de cada dos páginas tarda más de 4 segundos, lo que desecha hasta 40% del tráfico.</li>
      <li><strong>Captura de leads y automatización WhatsApp</strong> — muchos negocios siguen respondiendo manualmente consultas que se podrían triar 24/7.</li>
    </ul>
    <p>El reporte público está acá:<br>
      <a href="' . $REPORT_URL . '" style="color:#FF671F;font-weight:600;text-decoration:none;">netwebmedia.com/santiago-digital-gaps.html</a></p>
    <p><strong>¿Querés la auditoría personalizada de ' . $company . '?</strong> Gratis. En 48 horas. Un PDF accionable — <u>sin llamadas, sin Zoom, sin pitch</u>. Lo lees cuando puedas.</p>
    <p>Tres formas de pedirla (elegí la que te acomode):</p>
    <ul style="padding-left:20px;line-height:1.8;margin:10px 0;">
      <li>💬 <strong>WhatsApp:</strong> <a href="https://wa.me/17407363884?text=Hola%20NetWebMedia%2C%20quiero%20mi%20auditor%C3%ADa%20digital%20gratis." style="color:#25D366;font-weight:600;">escribirnos acá</a></li>
      <li>✉️ <strong>Respondé este correo</strong> con la palabra <em>AUDITORÍA</em> y te mandamos un formulario de 30 segundos.</li>
      <li>🌐 <strong>Web:</strong> <a href="https://netwebmedia.com" style="color:#FF671F;">netwebmedia.com</a> → el chat naranja abajo a la derecha.</li>
    </ul>
    <p style="margin-top:28px;">Un abrazo,<br>
      <strong>Carlos Martínez</strong><br>
      <span style="color:#666;font-size:13px;">Fundador · NetWebMedia</span><br>
      <span style="color:#999;font-size:12px;">CMO fraccional con IA — sin llamadas, sin agencias, sin mínimos.</span></p>
    <p style="font-size:11px;color:#999;margin-top:22px;border-top:1px solid #eee;padding-top:12px;">
      P.D. Si no es el momento, respondé <strong>STOP</strong> y te quito de la lista al toque.<br><br>
      Recibís este correo porque ' . $company . ' apareció en nuestro análisis público de 320 negocios en Santiago (abril 2026).
      Para cancelar: respondé "STOP" o escribí a hola@netwebmedia.com. NetWebMedia SpA · Santiago, Chile.
    </p>';
  return email_shell('Auditoría digital gratis — 48h, sin llamadas', $inner);
}
function subject_for($lead) {
  $c = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  return "Revisé la presencia digital de $c — 3 brechas en 2 minutos";
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
  // Send one email to Carlos, using first pending lead's personalization
  $lead = count($pending) ? $pending[0] : ['company' => 'NetWebMedia Test', 'name' => 'Test', 'niche' => 'Tourism & Hospitality', 'niche_key' => 'tourism'];
  $html = render_email_html($lead);
  $subj = '[TEST] ' . subject_for($lead);
  $ok = $dryrun ? true : send_mail('carlos@netwebmedia.com', $subj, $html, [
    'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
  ]);
  j_exit([
    'mode'     => 'test',
    'sent_to'  => 'carlos@netwebmedia.com',
    'subject'  => $subj,
    'using_lead' => ['company' => $lead['company'] ?? null, 'niche' => $lead['niche'] ?? null],
    'dryrun'   => $dryrun,
    'ok'       => (bool)$ok,
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
    // Small gap between sends within a single HTTP call.
    if ($results['sent'] < $cap) usleep(2_000_000); // 2s
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

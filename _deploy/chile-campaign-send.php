<?php
/* Chile cold outreach campaign sender.
   Reads santiago_leads.csv, queues sends via existing mailer.php,
   respects throttle, logs every send to email_log table.

   USAGE (from cPanel Terminal, in /home/webmed6/public_html/):
     php _deploy/chile-campaign-send.php --test                # sends only to carlos@netwebmedia.com
     php _deploy/chile-campaign-send.php --batch=10 --niche=tourism
     php _deploy/chile-campaign-send.php --batch=50            # no niche filter
     php _deploy/chile-campaign-send.php --all --confirm       # send to ALL, requires --confirm

   Throttle: 90s between sends by default.
   Stop: Ctrl+C. Every send is logged in email_log so we can resume.

   Re-launch safety: keeps a file `_deploy/chile-sent.log` with one email per line.
   Re-running skips any address already in chile-sent.log.
*/

require_once __DIR__ . '/../api-php/lib/db.php';
require_once __DIR__ . '/../api-php/lib/mailer.php';

// ----- config -----
$CSV_PATH         = __DIR__ . '/santiago_leads.csv';
$SENT_LOG         = __DIR__ . '/chile-sent.log';
$THROTTLE_SECONDS = 90;
$FROM_NAME        = 'Carlos Martínez';
$FROM_EMAIL       = 'newsletter@netwebmedia.com';
$REPLY_TO         = 'hola@netwebmedia.com';
$WA_URL           = 'https://wa.me/17407363884';  // REPLACE BEFORE SEND
$REPORT_URL       = 'https://netwebmedia.com/santiago-digital-gaps.html';

// ----- args -----
$args = [];
foreach ($argv ?? [] as $a) {
  if (strpos($a, '--') === 0) {
    $parts = explode('=', substr($a, 2), 2);
    $args[$parts[0]] = $parts[1] ?? true;
  }
}
$mode = isset($args['test']) ? 'test' : (isset($args['all']) ? 'all' : 'batch');
$batch_size = isset($args['batch']) ? (int)$args['batch'] : 1;
$niche_filter = $args['niche'] ?? null;
$confirmed = isset($args['confirm']);

if ($mode === 'all' && !$confirmed) {
  echo "ERROR: --all requires --confirm flag to prevent accidental mass-send.\n";
  exit(1);
}

// ----- load sent log -----
$already_sent = [];
if (file_exists($SENT_LOG)) {
  foreach (file($SENT_LOG, FILE_IGNORE_NEW_LINES) as $line) {
    $already_sent[trim($line)] = true;
  }
}

// ----- load CSV -----
if (!file_exists($CSV_PATH)) { echo "CSV not found: $CSV_PATH\n"; exit(1); }
$fp = fopen($CSV_PATH, 'r');
$headers = fgetcsv($fp);
$leads = [];
while ($row = fgetcsv($fp)) {
  $lead = array_combine($headers, $row);
  if (empty($lead['email']) || strpos($lead['email'], '@') === false) continue;
  if ($niche_filter && stripos($lead['niche_key'] ?? '', $niche_filter) === false) continue;
  if (isset($already_sent[strtolower($lead['email'])])) continue;
  $leads[] = $lead;
}
fclose($fp);

echo "Loaded " . count($leads) . " eligible leads (niche filter: " . ($niche_filter ?: 'none') . ")\n";
echo "Already-sent skipped: " . count($already_sent) . "\n";

// ----- email body template -----
function render_email($lead) {
  global $WA_URL, $REPORT_URL;
  $company = htmlspecialchars($lead['company'] ?? $lead['name'] ?? 'su negocio', ENT_QUOTES, 'UTF-8');
  $niche   = htmlspecialchars($lead['niche'] ?? 'su rubro', ENT_QUOTES, 'UTF-8');
  $inner = '
    <p>Hola equipo de <strong>' . $company . '</strong>,</p>
    <p>Soy Carlos Martínez, fundador de NetWebMedia (Santiago).</p>
    <p>Esta semana publicamos un análisis de la brecha digital de 320 negocios en Santiago. <strong>' . $company . '</strong> apareció en el reporte — encontramos brechas específicas que están bloqueando ventas que ya están demandando tu servicio.</p>
    <p>El reporte público está acá:<br>
       <a href="' . $REPORT_URL . '" style="color:#FF671F;font-weight:600;">santiago-digital-gaps.html</a></p>
    <p><strong>¿Querés la auditoría completa de ' . $company . '?</strong> Respondemos en 48 horas con un PDF accionable — sin llamadas, sin Zoom, sin pitch. Lo lees cuando puedas.</p>
    <p>Tres formas de pedirla:</p>
    <ul style="padding-left:20px;line-height:1.8;">
      <li>💬 <strong>WhatsApp:</strong> <a href="' . $WA_URL . '" style="color:#FF671F;">escribirnos acá</a></li>
      <li>✉️ <strong>Email:</strong> responder a este correo con la palabra "AUDITORÍA"</li>
      <li>🌐 <strong>Web:</strong> <a href="https://netwebmedia.com" style="color:#FF671F;">netwebmedia.com</a> → el chat naranja abajo a la derecha</li>
    </ul>
    <p style="margin-top:28px;">Carlos<br>
       <span style="color:#666;font-size:13px;">Fundador, NetWebMedia · "CMO fraccional con IA — sin llamadas, sin agencias"</span></p>
    <p style="font-size:12px;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:14px;">
      P.D. Si no es el momento, respondé "STOP" y te quito de la lista. Cero dramas.<br><br>
      Recibís este correo porque ' . $company . ' apareció en nuestro análisis público de 320 negocios en Santiago (abril 2026). Unsubscribe: responder con "STOP" o escribir a hola@netwebmedia.com. NetWebMedia SpA · Santiago, Chile.
    </p>';
  return email_shell('Auditoría gratis — 48h, sin llamadas', $inner);
}

function subject_for($lead) {
  $company = $lead['company'] ?? $lead['name'] ?? 'tu negocio';
  return "Revisé tu presencia digital, $company (3 brechas que cuestan ventas)";
}

// ----- send loop -----
$limit = $mode === 'test' ? 1 : ($mode === 'all' ? count($leads) : $batch_size);
$sent = 0;
$failed = 0;

foreach ($leads as $i => $lead) {
  if ($sent >= $limit) break;

  $to = $mode === 'test' ? 'carlos@netwebmedia.com' : $lead['email'];
  $subject = subject_for($lead);
  $body = render_email($lead);

  echo "[" . date('H:i:s') . "] Sending to $to ({$lead['company']})... ";
  $ok = send_mail($to, $subject, $body, [
    'from_name'  => $FROM_NAME,
    'from_email' => $FROM_EMAIL,
    'reply_to'   => $REPLY_TO,
  ]);

  if ($ok) {
    $sent++;
    file_put_contents($SENT_LOG, strtolower($lead['email']) . "\n", FILE_APPEND);
    echo "OK\n";
  } else {
    $failed++;
    echo "FAILED\n";
  }

  if ($sent < $limit && $i < count($leads) - 1) {
    echo "  sleeping {$THROTTLE_SECONDS}s...\n";
    sleep($THROTTLE_SECONDS);
  }

  if ($mode === 'test') break;
}

echo "\n===========================================\n";
echo "DONE. Sent: $sent · Failed: $failed · Log: $SENT_LOG\n";
echo "===========================================\n";

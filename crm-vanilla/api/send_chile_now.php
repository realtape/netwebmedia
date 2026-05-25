<?php
/**
 * send_chile_now.php
 *
 * One-time runner: creates the "Hazlo Crecer" Chile campaign if it doesn't
 * exist, then sends the next 100 unsent Chilean contacts.
 *
 * Run from cPanel Terminal (SSH):
 *   php /home/webmed6/public_html/companies/crm-vanilla/api/send_chile_now.php [--dry-run]
 *
 * Run daily for subsequent batches (same command — it always picks unsent contacts):
 *   php /home/webmed6/public_html/companies/crm-vanilla/api/send_chile_now.php
 */

define('CAMPAIGN_NAME', 'CHL-2026-05 Hazlo Crecer Email 1');
define('BATCH_SIZE', 100);

$dryRun = in_array('--dry-run', $argv ?? []);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/email_sender.php';

$db      = getDB();
$siteBase = 'https://netwebmedia.com';

// ── 1. Get or create campaign ─────────────────────────────────────────────────
$stmt = $db->prepare("SELECT id FROM email_campaigns WHERE name = ? LIMIT 1");
$stmt->execute([CAMPAIGN_NAME]);
$existing = $stmt->fetchColumn();

if ($existing) {
    $campaignId = (int)$existing;
    echo "Using existing campaign #$campaignId\n";
} else {
    $subject  = 'Hazlo Crecer llegó a Chile — y esto cambia todo para tu pyme';
    $bodyHtml = <<<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hazlo Crecer llegó a Chile</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">

      <!-- Header -->
      <tr>
        <td style="background:#010F3B;padding:28px 40px">
          <span style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;color:#FF671F;letter-spacing:-0.5px">Netwebmedia</span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;color:#1a1a1a;font-size:16px;line-height:1.7">

          <p style="margin:0 0 20px">Hola,</p>

          <p style="margin:0 0 20px">Seré directo: la mayoría de las pymes en Chile tienen el mismo problema.</p>

          <p style="margin:0 0 20px">Saben que necesitan marketing. No tienen tiempo para hacerlo bien. Contratan a alguien barato, los resultados son mediocres, y terminan pagando dos veces — en plata y en oportunidad perdida.</p>

          <p style="margin:0 0 28px"><strong>Eso termina hoy.</strong></p>

          <p style="margin:0 0 20px">Lanzamos <strong>Hazlo Crecer</strong> — el primer programa de CMO fraccional con IA diseñado específicamente para pymes chilenas.</p>

          <p style="margin:0 0 16px"><strong>¿Qué significa eso en términos concretos?</strong></p>

          <ul style="margin:0 0 24px;padding-left:24px">
            <li style="margin-bottom:10px">Estrategia de marketing al nivel de una gran empresa.</li>
            <li style="margin-bottom:10px">Agentes de IA ejecutan el 80% del trabajo operacional.</li>
            <li style="margin-bottom:10px">Todo en <strong>una sola boleta</strong>: estrategia + software + ejecución.</li>
            <li style="margin-bottom:10px">Desde <strong>$249 dólares al mes</strong> — menos que un community manager a tiempo parcial.</li>
          </ul>

          <p style="margin:0 0 20px">Nuestros clientes promedian <strong>4,2 veces más menciones en motores de IA</strong> (ChatGPT, Claude, Perplexity) a los 90 días.</p>

          <p style="margin:0 0 28px">Pero si ya quieres arrancar, el primer paso es gratis.</p>

          <!-- Stat callout -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td style="background:#FFF4EF;border-left:4px solid #FF671F;padding:20px 24px;border-radius:4px;font-size:15px;color:#1a1a1a">
                Hacemos un <strong>Diagnóstico de Marketing sin costo</strong> — te decimos en concreto qué está fallando y qué haría un CMO profesional en tu lugar. Sin llamadas. Sin pitch. Lo lees cuando puedas.
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td style="background:#FF671F;border-radius:6px">
                <a href="https://netwebmedia.com/chile?utm_source=email&utm_medium=newsletter&utm_campaign=hazlo-crecer&utm_content=email1"
                   style="display:inline-block;padding:16px 32px;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;font-family:'Poppins',Arial,sans-serif">
                  Quiero mi Diagnóstico gratuito →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 4px;color:#555;font-size:14px">Netwebmedia</p>
          <p style="margin:0 0 20px;color:#888;font-size:13px;font-style:italic">"CMO fraccional con IA — una boleta, resultados reales."</p>

          <p style="margin:0;color:#aaa;font-size:12px">Si no es para ti, responde "STOP" y te quitamos de la lista de inmediato. Sin drama.</p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#010F3B;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#8899bb;font-size:12px">
            Netwebmedia · Santiago, Chile<br>
            newsletter@netwebmedia.com
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
HTML;

    $ins = $db->prepare("
        INSERT INTO email_campaigns (name, subject, body_html, from_name, from_email, status, created_at)
        VALUES (?, ?, ?, 'Netwebmedia', 'newsletter@netwebmedia.com', 'sending', NOW())
    ");
    $ins->execute([CAMPAIGN_NAME, $subject, $bodyHtml]);
    $campaignId = (int)$db->lastInsertId();
    echo "Created campaign #$campaignId\n";
}

// ── 2. Fetch next unsent Chilean contacts ─────────────────────────────────────
$chileanCities = ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Temuco',
                  'Viña del Mar', 'Rancagua', 'Talca', 'Arica', 'Iquique',
                  'Puerto Montt', 'La Serena', 'Coquimbo', 'Calama'];

$cityPlaceholders = implode(',', array_fill(0, count($chileanCities), '?'));

$sql = "
    SELECT c.*
    FROM contacts c
    WHERE c.email IS NOT NULL
      AND c.email <> ''
      AND NOT EXISTS (
          SELECT 1 FROM unsubscribes u WHERE u.email = c.email
      )
      AND NOT EXISTS (
          SELECT 1 FROM campaign_sends cs
          WHERE cs.campaign_id = ? AND cs.contact_id = c.id
      )
      AND (
          JSON_UNQUOTE(JSON_EXTRACT(c.notes, '$.country')) = 'CL'
          OR JSON_UNQUOTE(JSON_EXTRACT(c.notes, '$.city')) IN ($cityPlaceholders)
      )
    ORDER BY c.id ASC
    LIMIT " . BATCH_SIZE;

$params = array_merge([$campaignId], $chileanCities);
$stmt   = $db->prepare($sql);
$stmt->execute($params);
$contacts = $stmt->fetchAll();

$total = count($contacts);
$date  = date('Y-m-d H:i:s');

if ($total === 0) {
    echo "[$date] No more unsent Chilean contacts. Campaign complete.\n";
    $db->prepare("UPDATE email_campaigns SET status='sent', sent_at=COALESCE(sent_at,NOW()) WHERE id=?")->execute([$campaignId]);
    exit(0);
}

if ($dryRun) {
    echo "[$date] DRY RUN — Would send to $total contacts:\n";
    foreach ($contacts as $c) {
        echo "  · [{$c['id']}] {$c['name']} <{$c['email']}>\n";
    }
    exit(0);
}

// ── 3. Load campaign body (in case it was pre-existing with a template) ───────
$camp = $db->prepare('SELECT * FROM email_campaigns WHERE id = ?');
$camp->execute([$campaignId]);
$camp = $camp->fetch();
$subject = $camp['subject'];
$html    = $camp['body_html'];
if ($camp['template_id']) {
    $t = $db->prepare('SELECT subject, body_html FROM email_templates WHERE id = ?');
    $t->execute([$camp['template_id']]);
    $tpl = $t->fetch();
    if ($tpl) { $subject = $subject ?: $tpl['subject']; $html = $html ?: $tpl['body_html']; }
}

// ── 4. Send ───────────────────────────────────────────────────────────────────
$ok = 0; $fail = 0; $errors = [];

foreach ($contacts as $c) {
    $token      = bin2hex(random_bytes(16));
    $vars       = buildContactVars($c, $siteBase, $token);
    $mergedSub  = mergeTags($subject, $vars);
    $mergedHtml = instrumentTracking(mergeTags($html, $vars), $siteBase, $token);

    $db->prepare('INSERT INTO campaign_sends (campaign_id, contact_id, email, token, status) VALUES (?, ?, ?, ?, ?)')
       ->execute([$campaignId, $c['id'], $c['email'], $token, 'queued']);
    $sendId = (int)$db->lastInsertId();

    try {
        $res = resendSend([
            'to'         => $c['email'],
            'subject'    => $mergedSub,
            'html'       => $mergedHtml,
            'from_name'  => 'Netwebmedia',
            'from_email' => 'newsletter@netwebmedia.com',
            'reply_to'   => 'hola@netwebmedia.com',
        ]);
        $db->prepare("UPDATE campaign_sends SET status='sent', sent_at=NOW(), provider_id=? WHERE id=?")
           ->execute([$res['id'] ?? null, $sendId]);
        echo "  ✓ {$c['email']}\n";
        $ok++;
    } catch (Throwable $e) {
        $db->prepare("UPDATE campaign_sends SET status='failed', error=? WHERE id=?")
           ->execute([substr($e->getMessage(), 0, 500), $sendId]);
        echo "  ✗ {$c['email']}: {$e->getMessage()}\n";
        $errors[] = $c['email'];
        $fail++;
    }

    usleep(120000); // 120ms — stay under Resend's 10 req/sec limit
}

$db->prepare("UPDATE email_campaigns SET sent_count = sent_count + ? WHERE id = ?")
   ->execute([$ok, $campaignId]);

echo "\n[$date] Done — Sent: $ok | Failed: $fail\n";
echo "Run again tomorrow for the next batch of 100.\n";
exit($fail > 0 ? 1 : 0);

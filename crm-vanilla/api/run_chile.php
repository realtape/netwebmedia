<?php
// One-time trigger — deleted after first use
if (($_GET['token'] ?? '') !== 'nwm-chile-2026') { http_response_code(403); exit; }
header('Content-Type: text/plain; charset=utf-8');
// Capture output of the send script
ob_start();
$argv = ['run_chile.php'];
$_SERVER['argv'] = $argv;
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/email_sender.php';

define('CAMPAIGN_NAME', 'CHL-2026-05 Hazlo Crecer Email 1');
define('BATCH_SIZE', 100);
$dryRun = isset($_GET['dry']);
$db = getDB();
$siteBase = 'https://netwebmedia.com';

// Get or create campaign
$stmt = $db->prepare("SELECT id FROM email_campaigns WHERE name = ? LIMIT 1");
$stmt->execute([CAMPAIGN_NAME]);
$existing = $stmt->fetchColumn();

if ($existing) {
    $campaignId = (int)$existing;
    echo "Using existing campaign #$campaignId\n";
} else {
    $subject = 'Hazlo Crecer llegó a Chile — y esto cambia todo para tu pyme';
    $bodyHtml = file_get_contents(__DIR__ . '/chile_email1.html') ?: '<p>Email body missing</p>';
    $ins = $db->prepare("INSERT INTO email_campaigns (name, subject, body_html, from_name, from_email, status, created_at) VALUES (?, ?, ?, 'Netwebmedia', 'newsletter@netwebmedia.com', 'sending', NOW())");
    $ins->execute([CAMPAIGN_NAME, $subject, $bodyHtml]);
    $campaignId = (int)$db->lastInsertId();
    echo "Created campaign #$campaignId\n";
}

// Build Email 1 HTML inline if file missing
$camp = $db->prepare('SELECT * FROM email_campaigns WHERE id = ?');
$camp->execute([$campaignId]);
$camp = $camp->fetch();
if (!$camp['body_html']) {
    $db->prepare("UPDATE email_campaigns SET body_html=? WHERE id=?")->execute([getEmail1Html(), $campaignId]);
    $camp['body_html'] = getEmail1Html();
}
$subject = $camp['subject'];
$html = $camp['body_html'];

// Fetch next 100 unsent Chilean contacts
$cities = ['Santiago','Valparaíso','Concepción','Antofagasta','Temuco','Viña del Mar','Rancagua','Talca','Arica','Iquique','Puerto Montt','La Serena','Coquimbo','Calama'];
$ph = implode(',', array_fill(0, count($cities), '?'));
$sql = "SELECT c.* FROM contacts c WHERE c.email IS NOT NULL AND c.email <> '' AND NOT EXISTS (SELECT 1 FROM unsubscribes u WHERE u.email=c.email) AND NOT EXISTS (SELECT 1 FROM campaign_sends cs WHERE cs.campaign_id=? AND cs.contact_id=c.id) AND (JSON_UNQUOTE(JSON_EXTRACT(c.notes,'$.country'))='CL' OR JSON_UNQUOTE(JSON_EXTRACT(c.notes,'$.city')) IN ($ph)) ORDER BY c.id ASC LIMIT 100";
$params = array_merge([$campaignId], $cities);
$stmt = $db->prepare($sql); $stmt->execute($params);
$contacts = $stmt->fetchAll();
$total = count($contacts);
echo "Found $total unsent Chilean contacts\n";
if ($total === 0) { echo "All done — campaign complete.\n"; exit; }
if ($dryRun) { foreach($contacts as $c) echo "  · [{$c['id']}] {$c['email']}\n"; exit; }

// Send
$ok=0; $fail=0;
foreach ($contacts as $c) {
    $token = bin2hex(random_bytes(16));
    $vars = buildContactVars($c, $siteBase, $token);
    $mergedSub = mergeTags($subject, $vars);
    $mergedHtml = instrumentTracking(mergeTags($html, $vars), $siteBase, $token);
    $db->prepare('INSERT INTO campaign_sends (campaign_id,contact_id,email,token,status) VALUES (?,?,?,?,?)')->execute([$campaignId,$c['id'],$c['email'],$token,'queued']);
    $sendId = (int)$db->lastInsertId();
    try {
        $res = resendSend(['to'=>$c['email'],'subject'=>$mergedSub,'html'=>$mergedHtml,'from_name'=>'Netwebmedia','from_email'=>'newsletter@netwebmedia.com','reply_to'=>'hola@netwebmedia.com']);
        $db->prepare("UPDATE campaign_sends SET status='sent',sent_at=NOW(),provider_id=? WHERE id=?")->execute([$res['id']??null,$sendId]);
        echo "  ✓ {$c['email']}\n"; $ok++;
    } catch (Throwable $e) {
        $db->prepare("UPDATE campaign_sends SET status='failed',error=? WHERE id=?")->execute([substr($e->getMessage(),0,500),$sendId]);
        echo "  ✗ {$c['email']}: {$e->getMessage()}\n"; $fail++;
    }
    usleep(120000);
}
$db->prepare("UPDATE email_campaigns SET sent_count=sent_count+? WHERE id=?")->execute([$ok,$campaignId]);
echo "\nDone — Sent: $ok | Failed: $fail\n";
// Self-delete after successful run
if ($fail === 0) @unlink(__FILE__);

function getEmail1Html(): string { return <<<'HTML'
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hazlo Crecer llegó a Chile</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
<tr><td style="background:#010F3B;padding:28px 40px"><span style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;color:#FF671F">Netwebmedia</span></td></tr>
<tr><td style="padding:40px 40px 32px;color:#1a1a1a;font-size:16px;line-height:1.7">
<p style="margin:0 0 20px">Hola,</p>
<p style="margin:0 0 20px">Seré directo: la mayoría de las pymes en Chile tienen el mismo problema.</p>
<p style="margin:0 0 20px">Saben que necesitan marketing. No tienen tiempo para hacerlo bien. Contratan a alguien barato, los resultados son mediocres, y terminan pagando dos veces — en plata y en oportunidad perdida.</p>
<p style="margin:0 0 28px"><strong>Eso termina hoy.</strong></p>
<p style="margin:0 0 20px">Lanzamos <strong>Hazlo Crecer</strong> — el primer programa de CMO fraccional con IA diseñado específicamente para pymes chilenas.</p>
<ul style="margin:0 0 24px;padding-left:24px">
<li style="margin-bottom:10px">Estrategia de marketing al nivel de una gran empresa.</li>
<li style="margin-bottom:10px">Agentes de IA ejecutan el 80% del trabajo operacional.</li>
<li style="margin-bottom:10px">Todo en <strong>una sola boleta</strong>: estrategia + software + ejecución.</li>
<li style="margin-bottom:10px">Desde <strong>$249 dólares al mes</strong> — menos que un community manager a tiempo parcial.</li>
</ul>
<p style="margin:0 0 20px">Nuestros clientes promedian <strong>4,2 veces más menciones en motores de IA</strong> (ChatGPT, Claude, Perplexity) a los 90 días.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px"><tr><td style="background:#FFF4EF;border-left:4px solid #FF671F;padding:20px 24px;border-radius:4px;font-size:15px;color:#1a1a1a">Hacemos un <strong>Diagnóstico de Marketing sin costo</strong> — te decimos en concreto qué está fallando. Sin llamadas. Sin pitch.</td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin-bottom:32px"><tr><td style="background:#FF671F;border-radius:6px"><a href="https://netwebmedia.com/chile?utm_source=email&utm_medium=newsletter&utm_campaign=hazlo-crecer&utm_content=email1" style="display:inline-block;padding:16px 32px;color:#fff;font-weight:700;font-size:16px;text-decoration:none;font-family:'Poppins',Arial,sans-serif">Quiero mi Diagnóstico gratuito →</a></td></tr></table>
<p style="margin:0;color:#aaa;font-size:12px">Si no es para ti, responde "STOP" y te quitamos de la lista de inmediato.</p>
</td></tr>
<tr><td style="background:#010F3B;padding:20px 40px;text-align:center"><p style="margin:0;color:#8899bb;font-size:12px">Netwebmedia · Santiago, Chile · newsletter@netwebmedia.com</p></td></tr>
</table></td></tr></table></body></html>
HTML; }

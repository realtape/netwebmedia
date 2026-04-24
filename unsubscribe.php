<?php
/* One-click unsubscribe endpoint for RFC 8058 (Gmail/Yahoo).
   Honors both:
     - GET  /unsubscribe?e=<email>&t=<token>   → user-facing confirmation page
     - POST /unsubscribe?e=<email>&t=<token>   → Gmail one-click (returns 200)
   Appends to api-php/data/unsubscribes.log. The Chile-send script reads this
   list and skips any email found there on the next batch.
*/

$email = trim((string)($_GET['e'] ?? $_POST['e'] ?? ''));
$token = trim((string)($_GET['t'] ?? $_POST['t'] ?? ''));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Basic email sanity — reject anything clearly malformed without leaking details.
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Email parameter missing or invalid.";
  exit;
}

// Persist the unsubscribe. The file lives under api-php/data which is Apache-blocked.
$logDir  = __DIR__ . '/api-php/data';
$logFile = $logDir . '/unsubscribes.log';
if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }

$line = strtolower($email) . "\t" . date('c') . "\t" . substr($token, 0, 24) . "\t" . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n";
@file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

// Gmail/Yahoo one-click POST — reply fast, no page body required.
if ($method === 'POST') {
  http_response_code(200);
  header('Content-Type: text/plain; charset=utf-8');
  echo "unsubscribed";
  exit;
}

// GET → confirmation page
http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
$esc = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
?><!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Suscripción cancelada — NetWebMedia</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="/css/styles.css">
<style>
  body{font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f4f7;color:#010F3B;margin:0;padding:0;}
  .wrap{max-width:560px;margin:80px auto;background:#fff;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;}
  .head{background:linear-gradient(135deg,#010F3B,#FF671F);color:#fff;padding:22px 28px;}
  .head h1{margin:0;font-size:22px;font-weight:700;}
  .body{padding:28px;line-height:1.6;font-size:15px;}
  .email{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f4f4f7;padding:2px 8px;border-radius:6px;}
  .foot{padding:18px 28px;background:#fafafa;font-size:12px;color:#8a8a9a;border-top:1px solid #eee;}
  a{color:#FF671F;text-decoration:none;}
</style>
</head><body>
<div class="wrap">
  <div class="head"><h1>Suscripción cancelada</h1></div>
  <div class="body">
    <p>Hemos retirado la dirección <span class="email"><?= $esc ?></span> de nuestra lista de contacto.</p>
    <p>No recibirás más correos de parte de NetWebMedia. Si fue un error, podés escribirnos a <a href="mailto:hola@netwebmedia.com">hola@netwebmedia.com</a> y lo revertimos.</p>
    <p style="margin-top:24px;"><a href="https://netwebmedia.com">Volver a netwebmedia.com</a></p>
  </div>
  <div class="foot">NetWebMedia SpA · Santiago, Chile</div>
</div>
</body></html>

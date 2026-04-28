<?php
// DEBUG BLOCK — remove after diagnosing 500
error_reporting(E_ALL);
ini_set('display_errors', '1');
register_shutdown_function(function() {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) { http_response_code(500); header('Content-Type: application/json'); }
        echo json_encode(['FATAL' => $e]);
    }
});
// END DEBUG BLOCK
/**
 * NWM Landing Page Form Handler
 * Receives POST from all /industries/{slug}/ and root landing pages.
 * Deployed to: https://netwebmedia.com/submit.php
 *
 * Flow:
 *   form submit → (1) notify hello@netwebmedia.com
 *              → (2) auto-reply to lead within seconds (async SLA)
 *              → (3) log with full UTM attribution for CRM handoff
 *
 * Phone/WhatsApp is optional for US email-sourced leads.
 * UTM params (utm_source, utm_campaign, utm_content=token) are captured
 * from form hidden fields to close the email→lead attribution loop.
 */

declare(strict_types=1);

// ── CONFIG ─────────────────────────────────────────────────────────────────
$NOTIFY_TO       = 'hello@netwebmedia.com';
$NOTIFY_FROM     = 'noreply@netwebmedia.com';
$LOG_FILE        = __DIR__ . '/submit-leads.log'; // webroot — protected by .htaccess FilesMatch deny

// ── HELPERS ────────────────────────────────────────────────────────────────
function clean(?string $v): string {
    if ($v === null) return '';
    return trim(strip_tags($v));
}
function fail(int $code, string $msg): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

// ── GUARD ──────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'POST only.');
}

// Honeypot: if bots fill hidden website_url, silently 200.
if (!empty($_POST['website_url'])) {
    http_response_code(200);
    exit;
}

$origin = $_SERVER['HTTP_REFERER'] ?? '';
if ($origin && !preg_match('#^https?://[a-z0-9\-]+\.netwebmedia\.com#i', $origin) &&
    !preg_match('#^https?://netwebmedia\.com#i', $origin)) {
    fail(403, 'Cross-origin submissions not allowed.');
}

// ── COLLECT ────────────────────────────────────────────────────────────────
$name    = clean($_POST['name']    ?? '');
$email   = clean($_POST['email']   ?? '');
$phone   = clean($_POST['phone']   ?? '');   // Optional for email-sourced (US) leads
$company = clean($_POST['company'] ?? '');
$web     = clean($_POST['website'] ?? '');
$msg     = clean($_POST['message'] ?? '');
$source  = clean($_POST['source']  ?? 'unknown');

// UTM attribution — captured from hidden form fields populated via JS
$utm_source   = clean($_POST['utm_source']   ?? '');
$utm_campaign = clean($_POST['utm_campaign'] ?? '');
$utm_content  = clean($_POST['utm_content']  ?? '');  // = campaign_sends.token

if ($name === '' || $email === '' || $company === '') {
    fail(422, 'Required fields missing (name, email, company).');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Invalid email.');
}

// ── NORMALIZE SOURCE ───────────────────────────────────────────────────────
// Accept both new "-lp" suffix and legacy "-audit-lp" for backward compat.
$source_clean = str_replace('-audit-lp', '', $source);
$source_clean = str_replace('-lp', '', $source_clean);
$source_slug  = preg_replace('/[^a-z0-9\-]/i', '', $source_clean);
if ($source_slug === '') { $source_slug = 'unknown'; }

$ip = $_SERVER['REMOTE_ADDR'] ?? '-';
$ua = clean($_SERVER['HTTP_USER_AGENT'] ?? '-');
$ts = gmdate('Y-m-d H:i:s') . ' UTC';

// ── COMPOSE EMAIL ──────────────────────────────────────────────────────────
$subject = "[NWM Lead] {$source_slug} — {$name} / {$company}";

$attribution = $utm_content
    ? "Campaign token : {$utm_content}\nUTM campaign   : {$utm_campaign}\nUTM source     : {$utm_source}"
    : "UTM source     : {$utm_source ?: 'direct'}\nUTM campaign   : {$utm_campaign ?: '-'}";

$body = <<<BODY
New lead from landing page.
{$attribution}

──────────────────────────────────────────
Source  : {$source_slug}
Time    : {$ts}
Referer : {$origin}
IP / UA : {$ip} | {$ua}
──────────────────────────────────────────
Name     : {$name}
Email    : {$email}
WhatsApp : {$phone ?: '—'}
Company  : {$company}
Website  : {$web}
──────────────────────────────────────────
Message:
{$msg}
──────────────────────────────────────────
Reply-to: {$email}
BODY;

$headers  = "From: NetWebMedia <{$NOTIFY_FROM}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: NWM-Submit-Handler/1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

@mail($NOTIFY_TO, $subject, $body, $headers);

// ── AUTO-REPLY to lead — instant async SLA ────────────────────────────────
$first = strtok($name, ' ');
$autoSubject = "Got it, {$first} — here's what happens next";
$autoBody = <<<HTML
<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f6f7fb; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 40px; }
  h2 { color: #010F3B; margin-top: 0; }
  p { color: #444; line-height: 1.7; }
  .cta { display: inline-block; margin-top: 20px; background: #FF671F; color: #fff;
         text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;
            font-size: 12px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <h2>Hi {$first}, we received your request.</h2>
  <p>
    Thanks for reaching out to <strong>NetWebMedia</strong>. We're reviewing your info for
    <strong>{$company}</strong> and will send you a personalized growth plan within
    <strong>24 hours</strong>.
  </p>
  <p>In the meantime, explore what we build for businesses like yours:</p>
  <a class="cta" href="https://netwebmedia.com/services.html">See our services →</a>
  <p style="margin-top:28px; color:#666; font-size:14px;">
    Questions? Just reply to this email — it goes straight to our team.
  </p>
  <div class="footer">
    NetWebMedia · Santiago, Chile ·
    <a href="https://netwebmedia.com" style="color:#aaa">netwebmedia.com</a>
  </div>
</div>
</body>
</html>
HTML;

$autoHeaders  = "From: NetWebMedia <hello@netwebmedia.com>\r\n";
$autoHeaders .= "Reply-To: hello@netwebmedia.com\r\n";
$autoHeaders .= "MIME-Version: 1.0\r\n";
$autoHeaders .= "Content-Type: text/html; charset=utf-8\r\n";
$autoHeaders .= "X-Mailer: NWM-Submit-Handler/1.0\r\n";

@mail($email, $autoSubject, $autoBody, $autoHeaders);

// ── APPEND LOG (capture the lead no matter what) ───────────────────────────
$log_line = sprintf(
    "[%s] %s | %s | %s | %s | %s | %s | utm_source=%s | utm_medium=form | utm_campaign=%s | utm_content=%s | %s\n",
    $ts, $source_slug, $name, $email, $phone ?: '-', $company, $web,
    $utm_source ?: 'direct', $utm_campaign ?: '-', $utm_content ?: '-',
    str_replace(["\r","\n"], ' ', $msg)
);
@file_put_contents($LOG_FILE, $log_line, FILE_APPEND | LOCK_EX);

// ── REDIRECT TO PER-SUBDOMAIN THANKS ───────────────────────────────────────
$redirect = "https://{$source_slug}.netwebmedia.com/thanks.html";
if (preg_match('#^https?://netwebmedia\.com#i', $origin)) {
    $redirect = "https://netwebmedia.com/audit-thanks.html";
}

if (!headers_sent()) {
    header("Location: {$redirect}", true, 303);
}
echo 'ok';

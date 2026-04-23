<?php
/**
 * NWM Landing Page Form Handler (WhatsApp-first)
 * Receives POST from all 39 /industries/{slug}/ subdomain landing pages.
 * Deployed to: https://netwebmedia.com/submit.php
 * All LP forms post to this endpoint.
 *
 * No phone/video calls — the flow is:
 *   form submit → email to hello@netwebmedia.com → NWM replies on WhatsApp
 *   with the free AI growth plan.
 */

declare(strict_types=1);

// ── CONFIG ─────────────────────────────────────────────────────────────────
$NOTIFY_TO       = 'hello@netwebmedia.com';
$NOTIFY_FROM     = 'noreply@netwebmedia.com';
$LOG_FILE        = __DIR__ . '/submit-leads.log';

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
$phone   = clean($_POST['phone']   ?? '');   // WhatsApp number — required
$company = clean($_POST['company'] ?? '');
$web     = clean($_POST['website'] ?? '');
$msg     = clean($_POST['message'] ?? '');
$source  = clean($_POST['source']  ?? 'unknown');

if ($name === '' || $email === '' || $phone === '' || $company === '') {
    fail(422, 'Required fields missing (name, email, WhatsApp, company).');
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
$subject = "[NWM Plan] {$source_slug} — {$name} / {$company}";

$body = <<<BODY
New free growth-plan request from a subdomain landing page.
→ Reply on WhatsApp: {$phone}

──────────────────────────────────────────
Source subdomain : {$source_slug}.netwebmedia.com
Submitted (UTC)  : {$ts}
Referer          : {$origin}
IP / UA          : {$ip} | {$ua}
──────────────────────────────────────────
Name     : {$name}
Email    : {$email}
WhatsApp : {$phone}
Company  : {$company}
Website  : {$web}
──────────────────────────────────────────
Biggest marketing challenge:
{$msg}
──────────────────────────────────────────
Reply-to: {$email}

— NWM submit handler
BODY;

$headers  = "From: NetWebMedia <{$NOTIFY_FROM}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: NWM-Submit-Handler/1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

@mail($NOTIFY_TO, $subject, $body, $headers);

// ── APPEND LOG (capture the lead no matter what) ───────────────────────────
$log_line = sprintf(
    "[%s] %s | %s | %s | %s | %s | %s | %s\n",
    $ts, $source_slug, $name, $email, $phone, $company, $web,
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

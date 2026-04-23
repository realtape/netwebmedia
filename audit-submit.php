<?php
/**
 * NWM Audit Form Handler
 * Receives POST from all 39 /audit/ subdomain landing pages.
 * Deployed to: https://netwebmedia.com/audit-submit.php
 * All LP forms post to this endpoint.
 *
 * Sends notification email to hello@netwebmedia.com with lead details
 * and source subdomain for campaign attribution.
 */

declare(strict_types=1);

// ── CONFIG ─────────────────────────────────────────────────────────────────
$NOTIFY_TO       = 'hello@netwebmedia.com';
$NOTIFY_FROM     = 'noreply@netwebmedia.com';
$THANKS_URL_BASE = '/audit/thanks.html'; // relative, appended to the source subdomain
$LOG_FILE        = __DIR__ . '/audit-leads.log'; // simple append-only log

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

// Basic honeypot + origin check
if (!empty($_POST['website_url'])) {
    // honeypot field tripped — silently 200 to avoid giving bots a signal
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
$phone   = clean($_POST['phone']   ?? '');
$company = clean($_POST['company'] ?? '');
$web     = clean($_POST['website'] ?? '');
$msg     = clean($_POST['message'] ?? '');
$source  = clean($_POST['source']  ?? 'unknown');

if ($name === '' || $email === '' || $company === '') {
    fail(422, 'Required fields missing.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Invalid email.');
}

// ── COMPOSE EMAIL ──────────────────────────────────────────────────────────
$source_slug = preg_replace('/[^a-z0-9\-]/i', '', str_replace('-audit-lp', '', $source));
$ip          = $_SERVER['REMOTE_ADDR'] ?? '-';
$ua          = clean($_SERVER['HTTP_USER_AGENT'] ?? '-');
$ts          = gmdate('Y-m-d H:i:s') . ' UTC';

$subject = "[NWM Audit] {$source_slug} — {$name} / {$company}";

$body = <<<BODY
New free-audit request from a subdomain landing page.

──────────────────────────────────────────
Source subdomain : {$source_slug}.netwebmedia.com
Submitted (UTC)  : {$ts}
Referer          : {$origin}
IP / UA          : {$ip} | {$ua}
──────────────────────────────────────────
Name     : {$name}
Email    : {$email}
Phone    : {$phone}
Company  : {$company}
Website  : {$web}
──────────────────────────────────────────
Biggest marketing challenge:
{$msg}
──────────────────────────────────────────
Reply-to: {$email}

— NWM audit form handler
BODY;

$headers  = "From: NetWebMedia Audits <{$NOTIFY_FROM}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: NWM-Audit-Handler/1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

$sent = @mail($NOTIFY_TO, $subject, $body, $headers);

// ── APPEND LOG (even if mail fails — capture the lead no matter what) ──────
$log_line = sprintf(
    "[%s] %s | %s | %s | %s | %s | %s\n",
    $ts, $source_slug, $name, $email, $phone, $company, str_replace(["\r","\n"], ' ', $msg)
);
@file_put_contents($LOG_FILE, $log_line, FILE_APPEND | LOCK_EX);

// ── RESPONSE ───────────────────────────────────────────────────────────────
// Redirect to the per-subdomain thank-you page. Source tracks UTM-equivalent.
$redirect = "https://{$source_slug}.netwebmedia.com/audit/thanks.html";
// If referrer was the plain main domain (pre-subdomain), redirect back to it.
if (preg_match('#^https?://netwebmedia\.com#i', $origin)) {
    $redirect = "https://netwebmedia.com/audit-thanks.html";
}

if (!headers_sent()) {
    header("Location: {$redirect}", true, 303);
}
echo 'ok';

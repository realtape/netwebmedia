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
$sep         = str_repeat('-', 42);

$subject = "[NWM Audit] {$source_slug} - {$name} / {$company}";

$body  = "New free-audit request from a subdomain landing page.\n\n";
$body .= $sep . "\n";
$body .= "Source subdomain : {$source_slug}.netwebmedia.com\n";
$body .= "Submitted (UTC)  : {$ts}\n";
$body .= "Referer          : {$origin}\n";
$body .= "IP / UA          : {$ip} | {$ua}\n";
$body .= $sep . "\n";
$body .= "Name     : {$name}\n";
$body .= "Email    : {$email}\n";
$body .= "Phone    : {$phone}\n";
$body .= "Company  : {$company}\n";
$body .= "Website  : {$web}\n";
$body .= $sep . "\n";
$body .= "Biggest marketing challenge:\n{$msg}\n";
$body .= $sep . "\n";
$body .= "Reply-to: {$email}\n";
$body .= "-- NWM audit form handler";

$headers  = "From: NetWebMedia Audits <{$NOTIFY_FROM}>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: NWM-Audit-Handler/1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

@mail($NOTIFY_TO, $subject, $body, $headers);

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

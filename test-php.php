<?php
/**
 * NWM submit.php step-by-step diagnostic
 * Run: POST /test-php.php with same fields as submit.php
 * Remove after debugging.
 */
declare(strict_types=1);

header('Content-Type: application/json');

$steps = [];
$error = null;

try {
    // Step 1: Basic PHP info
    $steps['1_php'] = PHP_VERSION;
    $steps['1_dir'] = __DIR__;
    $steps['1_method'] = $_SERVER['REQUEST_METHOD'] ?? '-';

    // Step 2: helper functions (same as submit.php)
    function clean(?string $v): string {
        if ($v === null) return '';
        return trim(strip_tags($v));
    }
    $steps['2_helpers'] = 'ok';

    // Step 3: collect POST (same as submit.php)
    $name    = clean($_POST['name']    ?? '');
    $email   = clean($_POST['email']   ?? '');
    $phone   = clean($_POST['phone']   ?? '');
    $company = clean($_POST['company'] ?? '');
    $web     = clean($_POST['website'] ?? '');
    $msg     = clean($_POST['message'] ?? '');
    $source  = clean($_POST['source']  ?? 'unknown');
    $utm_source   = clean($_POST['utm_source']   ?? '');
    $utm_campaign = clean($_POST['utm_campaign'] ?? '');
    $utm_content  = clean($_POST['utm_content']  ?? '');
    $steps['3_collect'] = compact('name','email','company','source');

    // Step 4: validation
    if ($name === '' || $email === '' || $company === '') {
        $steps['4_validation'] = 'FAIL: required fields missing';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $steps['4_validation'] = 'FAIL: invalid email';
    } else {
        $steps['4_validation'] = 'ok';
    }

    // Step 5: source slug
    $source_clean = str_replace('-audit-lp', '', $source);
    $source_clean = str_replace('-lp', '', $source_clean);
    $source_slug  = preg_replace('/[^a-z0-9\-]/i', '', $source_clean);
    if ($source_slug === '') { $source_slug = 'unknown'; }
    $steps['5_slug'] = $source_slug;

    // Step 6: metadata
    $ip = $_SERVER['REMOTE_ADDR'] ?? '-';
    $ua = clean($_SERVER['HTTP_USER_AGENT'] ?? '-');
    $ts = gmdate('Y-m-d H:i:s') . ' UTC';
    $origin = $_SERVER['HTTP_REFERER'] ?? '';
    $steps['6_meta'] = compact('ip','ts','origin');

    // Step 7: compose email subject + attribution (same as submit.php)
    $subject = "[NWM Lead] {$source_slug} — {$name} / {$company}";
    $attribution = $utm_content
        ? "Campaign token : {$utm_content}\nUTM campaign   : {$utm_campaign}\nUTM source     : {$utm_source}"
        : "UTM source     : {$utm_source ?: 'direct'}\nUTM campaign   : {$utm_campaign ?: '-'}";
    $steps['7_email_subject'] = $subject;
    $steps['7_attribution'] = substr($attribution, 0, 50);

    // Step 8: heredoc body (same as submit.php — this is the most likely crash point)
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
    $steps['8_heredoc_body'] = 'ok (' . strlen($body) . ' chars)';

    // Step 9: mail headers
    $NOTIFY_FROM = 'noreply@netwebmedia.com';
    $headers  = "From: NetWebMedia <{$NOTIFY_FROM}>\r\n";
    $headers .= "Reply-To: {$name} <{$email}>\r\n";
    $headers .= "X-Mailer: NWM-Submit-Handler/1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    $steps['9_mail_headers'] = 'ok';

    // Step 10: strtok (same as submit.php)
    $first = strtok($name, ' ');
    $steps['10_strtok'] = $first;

    // Step 11: HTML heredoc (auto-reply body — same as submit.php)
    $autoSubject = "Got it, {$first} — here's what happens next";
    $autoBody = <<<HTML
<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  h2 { color: #010F3B; }
</style>
</head>
<body>
<div>
  <h2>Hi {$first}, we received your request.</h2>
  <p>Thanks for reaching out to <strong>NetWebMedia</strong>.</p>
</div>
</body>
</html>
HTML;
    $steps['11_html_heredoc'] = 'ok (' . strlen($autoBody) . ' chars)';

    // Step 12: log line sprintf (same as submit.php)
    $LOG_FILE = __DIR__ . '/submit-leads.log';
    $log_line = sprintf(
        "[%s] %s | %s | %s | %s | %s | %s | utm_source=%s | utm_medium=form | utm_campaign=%s | utm_content=%s | %s\n",
        $ts, $source_slug, $name, $email, $phone ?: '-', $company, $web,
        $utm_source ?: 'direct', $utm_campaign ?: '-', $utm_content ?: '-',
        str_replace(["\r","\n"], ' ', $msg)
    );
    $steps['12_log_line'] = 'ok (' . strlen($log_line) . ' chars)';

    // Step 13: actually write the log
    $write_result = @file_put_contents($LOG_FILE, $log_line, FILE_APPEND | LOCK_EX);
    $steps['13_log_write'] = $write_result !== false ? "ok ($write_result bytes)" : 'FAILED';

    // Step 14: redirect logic
    $redirect = "https://{$source_slug}.netwebmedia.com/thanks.html";
    if (preg_match('#^https?://netwebmedia\.com#i', $origin)) {
        $redirect = "https://netwebmedia.com/audit-thanks.html";
    }
    $steps['14_redirect'] = $redirect;

    $steps['RESULT'] = 'ALL STEPS PASSED';

} catch (\Throwable $e) {
    $error = [
        'type'    => get_class($e),
        'message' => $e->getMessage(),
        'file'    => $e->getFile(),
        'line'    => $e->getLine(),
    ];
    $steps['RESULT'] = 'EXCEPTION';
}

echo json_encode(['steps' => $steps, 'error' => $error], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

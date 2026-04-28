<?php
/**
 * Multi-provider email sender + merge-tag engine.
 *
 * Provider selection (in priority order):
 *   1. MAIL_PROVIDER constant  — 'resend' | 'smtp' | 'ses'
 *   2. Falls back to 'resend' if unset
 *
 * Config constants (set in config.local.php, never commit):
 *   RESEND_API_KEY          — Resend.com API key
 *   SMTP_HOST               — e.g. mail.netwebmedia.com (InMotion)
 *   SMTP_PORT               — 587 (STARTTLS) or 465 (SSL)
 *   SMTP_USER               — newsletter@netwebmedia.com
 *   SMTP_PASS               — cPanel email password
 *   SMTP_ENCRYPTION         — 'tls' | 'ssl' | ''
 *   AWS_SES_KEY             — AWS Access Key ID
 *   AWS_SES_SECRET          — AWS Secret Access Key
 *   AWS_SES_REGION          — e.g. us-east-1
 *   MAIL_PROVIDER           — 'resend' | 'smtp' | 'ses'
 */

// ── Merge tags ────────────────────────────────────────────────────────────────

function mergeTags(string $template, array $vars): string {
    foreach ($vars as $k => $v) {
        $template = str_replace('{{' . $k . '}}', (string)$v, $template);
    }
    return $template;
}

function buildContactVars(array $contact, string $siteBase, string $token): array {
    $meta = [];
    if (!empty($contact['notes'])) {
        $decoded = json_decode($contact['notes'], true);
        if (is_array($decoded)) $meta = $decoded;
    }
    $city    = $meta['city']    ?? '';
    $niche   = $meta['niche']   ?? $contact['role'] ?? '';
    $slug    = $meta['page']    ?? '';
    $pageUrl = $slug ? ($siteBase . '/' . ltrim($slug, '/')) : $siteBase;
    $unsubBase = $siteBase . '/crm-vanilla/api/?r=track&a=unsub&t=';
    return [
        'name'            => $contact['name'] ?? '',
        'first_name'      => strtok($contact['name'] ?? 'there', ' '),
        'company'         => $contact['company'] ?? $contact['name'] ?? '',
        'email'           => $contact['email'] ?? '',
        'city'            => $city,
        'niche'           => $niche,
        'page_url'        => $pageUrl,
        'website'         => $meta['website'] ?? '',
        'unsubscribe_url' => $unsubBase . $token,
    ];
}

// ── Provider router ───────────────────────────────────────────────────────────

/**
 * Send one email. Provider selected by MAIL_PROVIDER constant.
 * $opts keys: to, subject, html, from_name, from_email, reply_to, text, headers
 */
function mailSend(array $opts): array {
    $provider = defined('MAIL_PROVIDER') ? MAIL_PROVIDER : 'resend';
    switch ($provider) {
        case 'smtp': return smtpSend($opts);
        case 'ses':  return sesSend($opts);
        default:     return resendSend($opts);
    }
}

// ── Resend ────────────────────────────────────────────────────────────────────

function resendSend(array $opts): array {
    $apiKey = defined('RESEND_API_KEY') ? RESEND_API_KEY : '';
    if (!$apiKey) throw new RuntimeException('RESEND_API_KEY not configured');

    $payload = [
        'from'    => ($opts['from_name'] ?? 'Netwebmedia') . ' <' . ($opts['from_email'] ?? 'newsletter@netwebmedia.com') . '>',
        'to'      => [$opts['to']],
        'subject' => $opts['subject'],
        'html'    => $opts['html'],
    ];
    if (!empty($opts['text']))     $payload['text']     = $opts['text'];
    if (!empty($opts['reply_to'])) $payload['reply_to'] = $opts['reply_to'];
    if (!empty($opts['headers']))  $payload['headers']  = $opts['headers'];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $apiKey, 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($err) throw new RuntimeException("Resend cURL error: $err");
    $data = json_decode($resp, true);
    if ($code >= 400) throw new RuntimeException("Resend API ($code): " . ($data['message'] ?? $resp));
    return $data ?: ['id' => null];
}

// ── SMTP (InMotion cPanel or any SMTP relay) ──────────────────────────────────

/**
 * Pure-PHP SMTP sender — no PHPMailer dependency.
 * Supports STARTTLS (port 587) and SSL (port 465).
 * Uses AUTH LOGIN (base64 credentials) — standard for cPanel.
 */
function smtpSend(array $opts): array {
    $host       = defined('SMTP_HOST')       ? SMTP_HOST       : 'mail.netwebmedia.com';
    $port       = defined('SMTP_PORT')       ? (int)SMTP_PORT  : 587;
    $user       = defined('SMTP_USER')       ? SMTP_USER       : '';
    $pass       = defined('SMTP_PASS')       ? SMTP_PASS       : '';
    $encryption = defined('SMTP_ENCRYPTION') ? SMTP_ENCRYPTION : 'tls';

    if (!$user || !$pass) throw new RuntimeException('SMTP_USER / SMTP_PASS not configured');

    $fromEmail = $opts['from_email'] ?? 'newsletter@netwebmedia.com';
    $fromName  = $opts['from_name']  ?? 'Netwebmedia';
    $to        = $opts['to'];
    $subject   = $opts['subject'];
    $html      = $opts['html'];
    $text      = $opts['text'] ?? strip_tags($html);
    $replyTo   = $opts['reply_to'] ?? '';
    $msgId     = '<' . bin2hex(random_bytes(12)) . '@netwebmedia.com>';

    // Build MIME
    $boundary = '=_Part_' . md5(uniqid('', true));
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\r\n";
    $headers .= "To: {$to}\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "Message-ID: {$msgId}\r\n";
    $headers .= "Date: " . date('r') . "\r\n";
    if ($replyTo) $headers .= "Reply-To: {$replyTo}\r\n";
    $headers .= "X-Mailer: NetWebMedia-CRM/1.0\r\n";

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($text)) . "\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($html)) . "\r\n";
    $body .= "--{$boundary}--\r\n";

    // Open socket
    $scheme = ($encryption === 'ssl') ? 'ssl' : 'tcp';
    $errno  = 0; $errstr = '';
    $ctx    = stream_context_create(['ssl' => [
        'verify_peer'       => false, // cPanel self-signed certs are common
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ]]);
    $sock = stream_socket_client("{$scheme}://{$host}:{$port}", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if (!$sock) throw new RuntimeException("SMTP connect failed: {$errstr} ({$errno})");

    $read = fn() => fgets($sock, 512);
    $send = function(string $cmd) use ($sock, $read) {
        fwrite($sock, $cmd . "\r\n");
        return $read();
    };

    $read(); // banner
    $send("EHLO netwebmedia.com");
    $read(); // rest of EHLO lines
    // Drain multi-line EHLO
    stream_set_timeout($sock, 1);
    while (!feof($sock)) { $line = $read(); if (!$line || !preg_match('/^250-/', $line)) break; }
    stream_set_timeout($sock, 10);

    if ($encryption === 'tls') {
        $send("STARTTLS");
        $read();
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $send("EHLO netwebmedia.com");
        // Drain
        stream_set_timeout($sock, 1);
        while (!feof($sock)) { $line = $read(); if (!$line || !preg_match('/^250-/', $line)) break; }
        stream_set_timeout($sock, 10);
    }

    // AUTH LOGIN — use raw fwrite so we control exactly one read per step
    fwrite($sock, "AUTH LOGIN\r\n");
    $read();                                          // 334 Username:
    fwrite($sock, base64_encode($user) . "\r\n");
    $read();                                          // 334 Password:
    fwrite($sock, base64_encode($pass) . "\r\n");
    $authResp = $read();                              // 235 or error
    if (strpos($authResp, '235') !== 0) {
        fwrite($sock, "QUIT\r\n");
        fclose($sock);
        throw new RuntimeException("SMTP AUTH failed: " . trim($authResp));
    }

    fwrite($sock, "MAIL FROM:<{$fromEmail}>\r\n");
    $read();                                          // 250 OK
    fwrite($sock, "RCPT TO:<{$to}>\r\n");
    $rcptResp = $read();                              // 250 OK or error
    if (strpos($rcptResp, '250') !== 0) {
        fwrite($sock, "QUIT\r\n"); fclose($sock);
        throw new RuntimeException("SMTP RCPT failed: " . trim($rcptResp));
    }

    fwrite($sock, "DATA\r\n");
    $read();                                          // 354 Start input
    fwrite($sock, $headers . "\r\n" . $body . "\r\n.\r\n");
    $dataResp = $read();                              // 250 OK queued
    fwrite($sock, "QUIT\r\n"); fclose($sock);

    if (strpos($dataResp, '250') !== 0) {
        throw new RuntimeException("SMTP DATA failed: " . trim($dataResp));
    }
    return ['id' => $msgId, 'provider' => 'smtp'];
}

// ── Amazon SES (v4 signature, no SDK required) ────────────────────────────────

function sesSend(array $opts): array {
    $key    = defined('AWS_SES_KEY')    ? AWS_SES_KEY    : '';
    $secret = defined('AWS_SES_SECRET') ? AWS_SES_SECRET : '';
    $region = defined('AWS_SES_REGION') ? AWS_SES_REGION : 'us-east-1';
    if (!$key || !$secret) throw new RuntimeException('AWS_SES_KEY / AWS_SES_SECRET not configured');

    $fromEmail = $opts['from_email'] ?? 'newsletter@netwebmedia.com';
    $fromName  = $opts['from_name']  ?? 'Netwebmedia';
    $replyTo   = $opts['reply_to']   ?? '';

    $payload = [
        'FromEmailAddress' => "\"{$fromName}\" <{$fromEmail}>",
        'Destination'      => ['ToAddresses' => [$opts['to']]],
        'Content'          => [
            'Simple' => [
                'Subject' => ['Data' => $opts['subject'], 'Charset' => 'UTF-8'],
                'Body'    => [
                    'Html' => ['Data' => $opts['html'],                     'Charset' => 'UTF-8'],
                    'Text' => ['Data' => $opts['text'] ?? strip_tags($opts['html']), 'Charset' => 'UTF-8'],
                ],
            ],
        ],
    ];
    if ($replyTo) $payload['ReplyToAddresses'] = [$replyTo];

    $body       = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $service    = 'ses';
    $endpoint   = "https://email.{$region}.amazonaws.com/v2/email/outbound-emails";
    $amzDate    = gmdate('Ymd\THis\Z');
    $dateStamp  = gmdate('Ymd');
    $host       = "email.{$region}.amazonaws.com";
    $uri        = '/v2/email/outbound-emails';
    $contentHash = hash('sha256', $body);
    $canonHeaders = "content-type:application/json\nhost:{$host}\nx-amz-date:{$amzDate}\n";
    $signedHeaders = 'content-type;host;x-amz-date';
    $canonRequest = "POST\n{$uri}\n\n{$canonHeaders}\n{$signedHeaders}\n{$contentHash}";
    $credScope    = "{$dateStamp}/{$region}/{$service}/aws4_request";
    $stringToSign = "AWS4-HMAC-SHA256\n{$amzDate}\n{$credScope}\n" . hash('sha256', $canonRequest);
    $sigKey = hash_hmac('sha256', 'aws4_request',
                hash_hmac('sha256', $service,
                    hash_hmac('sha256', $region,
                        hash_hmac('sha256', $dateStamp, 'AWS4' . $secret, true), true), true), true);
    $signature = hash_hmac('sha256', $stringToSign, $sigKey);
    $authHeader = "AWS4-HMAC-SHA256 Credential={$key}/{$credScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "Host: {$host}",
            "X-Amz-Date: {$amzDate}",
            "Authorization: {$authHeader}",
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($err) throw new RuntimeException("SES cURL error: $err");
    $data = json_decode($resp, true);
    if ($code >= 400) throw new RuntimeException("SES API ({$code}): " . ($data['message'] ?? $resp));
    return ['id' => $data['MessageId'] ?? null, 'provider' => 'ses'];
}

// ── Tracking instrumentation ──────────────────────────────────────────────────

function instrumentTracking(string $html, string $siteBase, string $token): string {
    $base = $siteBase . '/crm-vanilla/api/?r=track';
    // Rewrite links for click tracking
    $html = preg_replace_callback(
        '#<a\s+([^>]*?)href=(["\'])([^"\']+)\2([^>]*)>#i',
        function ($m) use ($base, $token) {
            $url = $m[3];
            if (preg_match('#^(mailto:|tel:|#|javascript:)#i', $url)) return $m[0];
            if (strpos($url, 'r=track') !== false) return $m[0];
            $tracked = $base . '&a=click&t=' . $token . '&u=' . urlencode($url);
            return '<a ' . $m[1] . 'href="' . $tracked . '"' . $m[4] . '>';
        },
        $html
    );
    // Open pixel
    $pixel = '<img src="' . $base . '&a=open&t=' . $token . '" width="1" height="1" style="display:none" alt="">';
    $html  = stripos($html, '</body>') !== false
        ? str_ireplace('</body>', $pixel . '</body>', $html)
        : $html . $pixel;
    // Auto-unsubscribe footer if missing
    if (stripos($html, 'unsubscribe') === false) {
        $unsubUrl = $base . '&a=unsub&t=' . $token;
        $html .= '<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center;font-family:sans-serif">'
              . 'NetWebMedia &middot; Santiago, Chile &middot; <a href="' . $unsubUrl . '" style="color:#888">Unsubscribe / Darse de baja</a></div>';
    }
    return $html;
}

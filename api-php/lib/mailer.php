<?php
/* Mailer wrapper v3.0 (2026-05-02).
   Primary sender: AWS SES v2 API (when AWS_SES_KEY + AWS_SES_SECRET are set).
   Fallback:       Resend HTTPS API (when RESEND_API_KEY is set).
   Both use direct cURL — no Composer dependency.
   Preserves existing function signatures: send_mail(), send_to_admin(),
   html_to_plain(), render_template(), email_shell().
*/

/* ── HTML → plain-text ─────────────────────────────────────────── */
function html_to_plain($html) {
  if ($html === null || $html === '') return '';
  $html = preg_replace('#<a[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>#si', '$2 ($1)', $html);
  $html = preg_replace('#<(br|/p|/div|/tr|/li|/h[1-6])[^>]*>#i', "\n", $html);
  $html = preg_replace('#<(p|div|tr|li|h[1-6])[^>]*>#i', "\n", $html);
  $text = strip_tags($html);
  $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
  $text = preg_replace("/[ \t]+/", ' ', $text);
  $text = preg_replace("/\n[ \t]+/", "\n", $text);
  $text = preg_replace("/\n{3,}/", "\n\n", $text);
  return trim($text);
}

/* ── AWS Signature V4 helper ───────────────────────────────────── */
function _nwm_aws_sig4($secret, $datestamp, $region, $service, $string_to_sign) {
  $k_date    = hash_hmac('sha256', $datestamp, 'AWS4' . $secret, true);
  $k_region  = hash_hmac('sha256', $region,    $k_date,          true);
  $k_service = hash_hmac('sha256', $service,   $k_region,        true);
  $k_signing = hash_hmac('sha256', 'aws4_request', $k_service,   true);
  return hash_hmac('sha256', $string_to_sign, $k_signing);
}

/* ── AWS SES v2 send ───────────────────────────────────────────── */
function _nwm_send_ses($to, $subject, $html_body, $plain_body,
                       $from_name, $from_email, $reply_to, $extra_headers = []) {
  $cfg    = function_exists('config') ? config() : [];
  $key    = $cfg['aws_ses_key']    ?? getenv('AWS_SES_KEY')    ?: '';
  $secret = $cfg['aws_ses_secret'] ?? getenv('AWS_SES_SECRET') ?: '';
  $region = $cfg['aws_ses_region'] ?? getenv('AWS_SES_REGION') ?: 'us-east-1';

  if ($key === '' || $secret === '') return null; // not configured — signal to try next provider

  $host     = "email.{$region}.amazonaws.com";
  $endpoint = "https://{$host}/v2/email/outbound-emails";

  // Build SES v2 JSON payload
  $ses_headers = [];
  foreach ($extra_headers as $hk => $hv) {
    $ses_headers[] = ['Name' => $hk, 'Value' => $hv];
  }
  $payload = json_encode([
    'FromEmailAddress' => "{$from_name} <{$from_email}>",
    'Destination'      => ['ToAddresses' => [$to]],
    'ReplyToAddresses' => [$reply_to],
    'Content'          => [
      'Simple' => [
        'Subject' => ['Data' => $subject, 'Charset' => 'UTF-8'],
        'Body'    => [
          'Html' => ['Data' => $html_body,  'Charset' => 'UTF-8'],
          'Text' => ['Data' => $plain_body, 'Charset' => 'UTF-8'],
        ],
        'Headers' => $ses_headers,
      ],
    ],
  ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

  // AWS Signature V4
  $now          = new DateTime('UTC');
  $amzdate      = $now->format('Ymd\THis\Z');
  $datestamp    = $now->format('Ymd');
  $payload_hash = hash('sha256', $payload);

  $canonical_headers = "content-type:application/json\nhost:{$host}\nx-amz-date:{$amzdate}\n";
  $signed_headers    = 'content-type;host;x-amz-date';
  $canonical_request = implode("\n", [
    'POST',
    '/v2/email/outbound-emails',
    '',
    $canonical_headers,
    $signed_headers,
    $payload_hash,
  ]);

  $credential_scope = "{$datestamp}/{$region}/ses/aws4_request";
  $string_to_sign   = implode("\n", [
    'AWS4-HMAC-SHA256',
    $amzdate,
    $credential_scope,
    hash('sha256', $canonical_request),
  ]);

  $signature = _nwm_aws_sig4($secret, $datestamp, $region, 'ses', $string_to_sign);
  $auth = "AWS4-HMAC-SHA256 Credential={$key}/{$credential_scope},"
        . " SignedHeaders={$signed_headers}, Signature={$signature}";

  $ch = curl_init($endpoint);
  curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
      'Content-Type: application/json',
      "Host: {$host}",
      "X-Amz-Date: {$amzdate}",
      "Authorization: {$auth}",
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);

  $ok = ($code >= 200 && $code < 300);
  $GLOBALS['NWM_LAST_MAIL_HTTP']  = $code;
  $GLOBALS['NWM_LAST_MAIL_ERROR'] = $ok ? null : ($err ?: ('SES HTTP ' . $code . ' — ' . substr((string)$resp, 0, 480)));
  $GLOBALS['NWM_LAST_MAIL_RESP']  = is_string($resp) ? substr($resp, 0, 600) : null;
  if (!$ok) error_log('[nwm mailer] SES send failed: ' . $GLOBALS['NWM_LAST_MAIL_ERROR']);
  return $ok;
}

/* ── Resend send ───────────────────────────────────────────────── */
function _nwm_send_resend($to, $subject, $html_body, $plain_body,
                          $from_name, $from_email, $reply_to, $extra_headers = []) {
  $cfg     = function_exists('config') ? config() : [];
  $api_key = getenv('RESEND_API_KEY') ?: ($cfg['resend_api_key'] ?? '');

  if ($api_key === '') return null; // not configured

  $payload = [
    'from'     => $from_name . ' <' . $from_email . '>',
    'to'       => [$to],
    'subject'  => $subject,
    'html'     => $html_body,
    'text'     => $plain_body,
    'reply_to' => $reply_to,
    'headers'  => $extra_headers,
  ];

  $ch = curl_init('https://api.resend.com/emails');
  curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => [
      'Authorization: Bearer ' . $api_key,
      'Content-Type: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);

  $ok = ($code >= 200 && $code < 300);
  $GLOBALS['NWM_LAST_MAIL_HTTP']  = $code;
  $GLOBALS['NWM_LAST_MAIL_ERROR'] = $ok ? null : ($err ?: ('Resend HTTP ' . $code . ' — ' . substr((string)$resp, 0, 480)));
  $GLOBALS['NWM_LAST_MAIL_RESP']  = is_string($resp) ? substr($resp, 0, 600) : null;
  if (!$ok) error_log('[nwm mailer] Resend send failed: ' . $GLOBALS['NWM_LAST_MAIL_ERROR']);
  return $ok;
}

/* ── Public API ─────────────────────────────────────────────────── */
function send_mail($to, $subject, $html_body, $opts = []) {
  $cfg  = function_exists('config') ? config() : [];
  $host = parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST);

  $from_name  = $opts['from_name']  ?? ($cfg['from_name']  ?? 'NetWebMedia');
  $from_email = $opts['from_email'] ?? ($cfg['from_email'] ?? ($cfg['resend_from'] ?? ('admin@' . $host)));
  $reply_to   = $opts['reply_to']   ?? $from_email;

  $from_email = preg_replace('/[\r\n\t]/', '', $from_email);
  $from_name  = preg_replace('/[\r\n\t]/', '', $from_name);

  // Per-recipient unsubscribe links (CAN-SPAM / GDPR / Gmail bulk-sender)
  $msg_id       = bin2hex(random_bytes(12)) . '@' . $host;
  $unsub_token  = substr(hash('sha256', $to . '|' . $msg_id), 0, 24);
  $unsub_mailto = 'unsubscribe@' . $host . '?subject=unsubscribe+' . rawurlencode($to);
  $unsub_url    = 'https://' . $host . '/unsubscribe?e=' . rawurlencode($to) . '&t=' . $unsub_token;

  $html_body = str_replace(
    ['{{UNSUB_URL}}', '{{UNSUB_MAILTO}}', '{{TO_EMAIL}}'],
    [$unsub_url, 'mailto:' . $unsub_mailto, htmlspecialchars($to, ENT_QUOTES, 'UTF-8')],
    $html_body
  );
  $plain_body = $opts['plain_body'] ?? html_to_plain($html_body);

  $is_bulk = !empty($opts['bulk']);
  $headers = [
    'List-Unsubscribe'         => '<' . $unsub_url . '>, <mailto:' . $unsub_mailto . '>',
    'List-Unsubscribe-Post'    => 'List-Unsubscribe=One-Click',
    'X-Auto-Response-Suppress' => 'OOF, AutoReply',
    'X-Mailer'                 => 'NetWebMedia-Mailer/3.0-SES',
  ];
  if ($is_bulk) {
    $headers['List-Id']        = 'NetWebMedia Newsletter <news.' . $host . '>';
    $headers['Feedback-ID']    = 'newsletter:nwm:' . date('Ymd') . ':mailer';
    $headers['Auto-Submitted'] = 'auto-generated';
    $headers['Precedence']     = 'bulk';
  }

  // Provider routing: SES first (if configured), Resend fallback.
  // null return = credentials absent (skip, try next). false = credentials present but send failed.
  $ok = _nwm_send_ses($to, $subject, $html_body, $plain_body, $from_name, $from_email, $reply_to, $headers);
  if ($ok === null) {
    $ok = _nwm_send_resend($to, $subject, $html_body, $plain_body, $from_name, $from_email, $reply_to, $headers);
  }
  if ($ok === null) {
    error_log('[nwm mailer] No sending provider configured (AWS_SES_KEY and RESEND_API_KEY both absent)');
    $ok = false;
  }

  try {
    if (function_exists('qExec')) {
      qExec(
        'INSERT INTO email_log (to_addr, subject, status, error, created_at) VALUES (?, ?, ?, ?, NOW())',
        [$to, $subject, $ok ? 'sent' : 'failed', $GLOBALS['NWM_LAST_MAIL_ERROR'] ?? null]
      );
    }
  } catch (Throwable $_) {}

  return $ok;
}

function send_to_admin($subject, $html_body, $opts = []) {
  $cfg   = function_exists('config') ? config() : [];
  $admin = $cfg['admin_email'] ?? ('admin@' . parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST));
  return send_mail($admin, $subject, $html_body, $opts);
}

function render_template($template, $vars = []) {
  return preg_replace_callback('/\{\{\s*([a-z0-9_.]+)\s*\}\}/i', function ($m) use ($vars) {
    $key = $m[1];
    if (strpos($key, '.') !== false) {
      $parts = explode('.', $key);
      $cur = $vars;
      foreach ($parts as $p) {
        if (is_array($cur) && array_key_exists($p, $cur)) $cur = $cur[$p];
        else return '';
      }
      return is_scalar($cur) ? htmlspecialchars((string)$cur, ENT_QUOTES, 'UTF-8') : '';
    }
    return isset($vars[$key]) && is_scalar($vars[$key]) ? htmlspecialchars((string)$vars[$key], ENT_QUOTES, 'UTF-8') : '';
  }, $template);
}

function email_shell($title, $inner) {
  return '<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a2e;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr><td style="background:linear-gradient(135deg,#010F3B,#0a1f5c);padding:20px 28px;color:#fff;">
            <div style="font-size:13px;opacity:0.9;letter-spacing:0.5px;text-transform:uppercase;">NetWebMedia</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</div>
          </td></tr>
          <tr><td style="padding:28px;font-size:15px;line-height:1.55;">' . $inner . '</td></tr>
          <tr><td style="padding:18px 28px;background:#fafafa;font-size:12px;color:#8a8a9a;border-top:1px solid #eee;">
            <a href="https://netwebmedia.com" style="color:#FF671F;text-decoration:none;">netwebmedia.com</a> · Automated message — do not reply to this address.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>';
}

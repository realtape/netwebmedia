<?php
/* Mailer wrapper v2.0 (2026-04-24). Uses Resend HTTPS API via cURL.
   - No Composer dependency (cURL is bundled on every cPanel PHP).
   - Reads RESEND_API_KEY + RESEND_FROM from env (loaded by lib/env.php).
   - Fail-closed when key unset: logs + returns false, does NOT fall back to mail().
   - Preserves existing signatures: send_mail(), send_to_admin(), html_to_plain(),
     render_template(), email_shell(). Same {{UNSUB_URL}} / {{UNSUB_MAILTO}} substitution.
   - Writes to email_log table (same schema as v1.x) — status: sent|failed, error: provider msg.
*/

/** Convert HTML body to a readable plain-text alternative.
 *  Preserves anchor URLs as "text (url)". Called by send_mail() when no
 *  explicit plain_body is supplied. Keeps spam score down — an HTML-only
 *  mail without a text/plain alternative is a major spam signal.
 */
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

function send_mail($to, $subject, $html_body, $opts = []) {
  $cfg  = function_exists('config') ? config() : [];
  $host = parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST);

  $api_key = getenv('RESEND_API_KEY') ?: '';
  $env_from = getenv('RESEND_FROM') ?: '';

  // Prefer opts → config → env → sensible fallback.
  $from_name  = $opts['from_name']  ?? ($cfg['from_name']  ?? 'NetWebMedia');
  $from_email = $opts['from_email'] ?? ($cfg['from_email'] ?? ($env_from ?: ('admin@' . $host)));
  $reply_to   = $opts['reply_to']   ?? $from_email;

  // Sanitise — strip CRLF (header-injection guard).
  $from_email = preg_replace('/[\r\n\t]/', '', $from_email);
  $from_name  = preg_replace('/[\r\n\t]/', '', $from_name);

  // Fail-closed if API key missing. Do NOT fall back to mail() — the whole
  // point of this migration is deliverability, and mail() blows that up.
  if ($api_key === '') {
    error_log('[nwm mailer] RESEND_API_KEY unset — refusing to send to ' . $to);
    try {
      if (function_exists('qExec')) {
        qExec(
          'INSERT INTO email_log (to_addr, subject, status, error, created_at) VALUES (?, ?, ?, ?, NOW())',
          [$to, $subject, 'failed', 'RESEND_API_KEY unset']
        );
      }
    } catch (Throwable $_) {}
    return false;
  }

  // Per-recipient unsubscribe links (CAN-SPAM / GDPR / Gmail bulk-sender).
  $msg_id = bin2hex(random_bytes(12)) . '@' . $host;
  $unsub_token  = substr(hash('sha256', $to . '|' . $msg_id), 0, 24);
  $unsub_mailto = 'unsubscribe@' . $host . '?subject=unsubscribe+' . rawurlencode($to);
  $unsub_url    = 'https://' . $host . '/unsubscribe?e=' . rawurlencode($to) . '&t=' . $unsub_token;

  $html_body = str_replace(
    ['{{UNSUB_URL}}', '{{UNSUB_MAILTO}}', '{{TO_EMAIL}}'],
    [$unsub_url, 'mailto:' . $unsub_mailto, htmlspecialchars($to, ENT_QUOTES, 'UTF-8')],
    $html_body
  );
  $plain_body = $opts['plain_body'] ?? html_to_plain($html_body);

  // Resend payload. Resend handles MIME + DKIM signing internally.
  $payload = [
    'from'     => $from_name . ' <' . $from_email . '>',
    'to'       => [$to],
    'subject'  => $subject,
    'html'     => $html_body,
    'text'     => $plain_body,
    'reply_to' => $reply_to,
    'headers'  => [
      'List-Unsubscribe'        => '<' . $unsub_url . '>, <mailto:' . $unsub_mailto . '>',
      'List-Unsubscribe-Post'   => 'List-Unsubscribe=One-Click',
      'List-Id'                 => 'NetWebMedia Outreach <outreach.' . $host . '>',
      'Feedback-ID'             => 'outreach:nwm:' . date('Ymd') . ':mailer',
      'X-Auto-Response-Suppress'=> 'OOF, AutoReply',
      'Auto-Submitted'          => 'auto-generated',
      'Precedence'              => 'bulk',
      'X-Mailer'                => 'NetWebMedia-Mailer/2.0-Resend',
    ],
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
  $error_msg = null;
  if (!$ok) {
    $error_msg = $err ?: ('HTTP ' . $code . ' — ' . substr((string)$resp, 0, 240));
    error_log('[nwm mailer] resend send failed: ' . $error_msg);
  }

  try {
    if (function_exists('qExec')) {
      qExec(
        'INSERT INTO email_log (to_addr, subject, status, error, created_at) VALUES (?, ?, ?, ?, NOW())',
        [$to, $subject, $ok ? 'sent' : 'failed', $error_msg]
      );
    }
  } catch (Throwable $_) { /* email_log may not exist yet during first boot */ }

  return $ok;
}

/** Convenience helper — send to the configured admin notification address. */
function send_to_admin($subject, $html_body, $opts = []) {
  $cfg = function_exists('config') ? config() : [];
  $admin = $cfg['admin_email'] ?? ('admin@' . parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST));
  return send_mail($admin, $subject, $html_body, $opts);
}

function render_template($template, $vars = []) {
  /* Very small {{var}} templater. */
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
          <tr><td style="background:linear-gradient(135deg,#6c5ce7,#00b894);padding:20px 28px;color:#fff;">
            <div style="font-size:13px;opacity:0.9;letter-spacing:0.5px;text-transform:uppercase;">NetWebMedia</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</div>
          </td></tr>
          <tr><td style="padding:28px;font-size:15px;line-height:1.55;">' . $inner . '</td></tr>
          <tr><td style="padding:18px 28px;background:#fafafa;font-size:12px;color:#8a8a9a;border-top:1px solid #eee;">
            <a href="https://netwebmedia.com" style="color:#6c5ce7;text-decoration:none;">netwebmedia.com</a> · Automated message — do not reply to this address.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>';
}

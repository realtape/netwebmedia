<?php
/* Mailer wrapper v1.2 (2026-04-20). Uses PHP mail() backed by cPanel sendmail.
   Configured for Gmail-friendly deliverability:
     - From address matches a real mailbox at the domain (admin@netwebmedia.com)
     - Adds Message-ID, Date, List-Unsubscribe headers (Gmail spam-score requirements)
     - The shellarg escape on the -f arg was breaking on some PHP versions; we
       now pass the sender as a contiguous "-f<email>" arg with no escaping.
   Logs every send to email_log table.
*/

function send_mail($to, $subject, $html_body, $opts = []) {
  $cfg  = config();
  $host = parse_url($cfg['base_url'] ?? 'https://netwebmedia.com', PHP_URL_HOST);

  // Prefer config-set from address; fall back to admin@<host> (matches MX domain).
  $from_name  = $opts['from_name']  ?? ($cfg['from_name']  ?? 'NetWebMedia');
  $from_email = $opts['from_email'] ?? ($cfg['from_email'] ?? ('admin@' . $host));
  $reply_to   = $opts['reply_to']   ?? $from_email;

  // Sanitise — strip CRLF (header-injection guard).
  $from_email = preg_replace('/[\r\n\t]/', '', $from_email);
  $from_name  = preg_replace('/[\r\n\t]/', '', $from_name);

  $msg_id = '<' . bin2hex(random_bytes(12)) . '@' . $host . '>';

  // Encode From-name per RFC 2047 if it contains non-ASCII (e.g. "Carlos Martínez").
  $from_name_encoded = preg_match('/[^\x20-\x7e]/', $from_name)
    ? '=?UTF-8?B?' . base64_encode($from_name) . '?='
    : $from_name;

  // Per-recipient unsubscribe token. mailto + https variants both present —
  // Gmail/Yahoo use one-click POST, enterprise MTAs use mailto.
  $unsub_token = substr(hash('sha256', $to . '|' . $msg_id), 0, 24);
  $unsub_mailto = 'unsubscribe@' . $host . '?subject=unsubscribe+' . rawurlencode($to);
  $unsub_url    = 'https://' . $host . '/unsubscribe?e=' . rawurlencode($to) . '&t=' . $unsub_token;

  // Build plain-text alternative from HTML. Preserves links as "text (url)".
  $plain_body = $opts['plain_body'] ?? html_to_plain($html_body);

  // Multipart/alternative boundary
  $boundary = '=_nwm_' . bin2hex(random_bytes(8)) . '_=';

  // Precedence: bulk tells many spam filters this is intentional list mail,
  // not a 1:1 personal send being disguised — counterintuitively IMPROVES
  // placement by matching the sender's actual pattern.
  $headers = [
    'From: ' . $from_name_encoded . ' <' . $from_email . '>',
    'Reply-To: ' . $reply_to,
    'Return-Path: ' . $from_email,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    'Message-ID: ' . $msg_id,
    'Date: ' . date('r'),
    'X-Mailer: NetWebMedia-Mailer/1.2',
    'Precedence: bulk',
    'List-Unsubscribe: <' . $unsub_url . '>, <mailto:' . $unsub_mailto . '>',
    'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    'List-Id: NetWebMedia Outreach <outreach.' . $host . '>',
    'Feedback-ID: outreach:nwm:' . date('Ymd') . ':mailer',
    'X-Auto-Response-Suppress: OOF, AutoReply',
    'Auto-Submitted: auto-generated',
  ];

  // Build multipart body
  $body  = "This is a multipart message in MIME format.\r\n\r\n";
  $body .= "--" . $boundary . "\r\n";
  $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
  $body .= $plain_body . "\r\n\r\n";
  $body .= "--" . $boundary . "\r\n";
  $body .= "Content-Type: text/html; charset=UTF-8\r\n";
  $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
  $body .= $html_body . "\r\n\r\n";
  $body .= "--" . $boundary . "--\r\n";

  // Encode non-ASCII in subject per RFC 2047.
  $subject_encoded = preg_match('/[^\x20-\x7e]/', $subject)
    ? '=?UTF-8?B?' . base64_encode($subject) . '?='
    : $subject;

  // Use static "-f<email>" sender arg — no shellarg escaping (which produces
  // quoted strings that some sendmail versions reject and cause mail() => false).
  $sender_arg = '-f' . $from_email;

  $ok = @mail($to, $subject_encoded, $body, implode("\r\n", $headers), $sender_arg);

  try {
    qExec(
      'INSERT INTO email_log (to_addr, subject, status, error, created_at) VALUES (?, ?, ?, ?, NOW())',
      [$to, $subject, $ok ? 'sent' : 'failed', $ok ? null : 'mail() returned false']
    );
  } catch (Throwable $_) { /* email_log may not exist yet during first boot */ }

  return $ok;
}

/** Convenience helper — send to the configured admin notification address. */
function send_to_admin($subject, $html_body, $opts = []) {
  $cfg = config();
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

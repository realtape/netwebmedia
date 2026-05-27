<?php
/**
 * Password reset (forgot-password) flow for the CRM.
 *
 * Public route (the user is, by definition, locked out) — registered in
 * index.php $public_routes so it bypasses the write-session guard. Abuse is
 * controlled by: a same-origin Origin/Referer check, a per-email throttle,
 * single-use + 1-hour-expiry tokens, and hashed-at-rest tokens.
 *
 * Actions:
 *   POST ?r=password_reset&action=request   body {email}
 *        → if a CRM user has that email, emails a reset link. ALWAYS returns a
 *          generic success (never leaks whether the address exists).
 *   GET  ?r=password_reset&action=validate&t=TOKEN
 *        → { valid: bool } so the reset page can show/hide the form.
 *   POST ?r=password_reset&action=confirm   body {token, password}
 *        → validates the token, sets the new password_hash, burns the token.
 *
 * The raw token is only ever in the emailed URL; we persist sha256(token).
 */

require_once __DIR__ . '/../lib/email_sender.php';

$db     = getDB();
$action = $_GET['action'] ?? '';

// Lazy schema (mirrors schema_password_resets.sql so the route works on a
// fresh DB before the deploy-time migrate has run).
$db->exec("CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY ix_token (token_hash),
  KEY ix_email (email),
  KEY ix_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$TTL_MINUTES = 60;

/* Same-origin guard. Legit calls originate from /crm-vanilla/login.html and
   /crm-vanilla/reset-password.html (both ALLOWED_ORIGIN). GET validate is exempt
   (it's a harmless read hit directly from the emailed link's landing page). */
function pr_same_origin_or_fail(): void {
    $expected = strtolower(rtrim(ALLOWED_ORIGIN, '/'));
    $origin_of = static function (string $url): string {
        $p = parse_url($url);
        if (empty($p['scheme']) || empty($p['host'])) return '';
        $o = strtolower($p['scheme']) . '://' . strtolower($p['host']);
        if (isset($p['port'])) $o .= ':' . $p['port'];
        return $o;
    };
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $ok = ($origin  && $origin_of($origin)  === $expected)
       || ($referer && $origin_of($referer) === $expected);
    if (!$ok) jsonError('Cross-origin request blocked', 403);
}

function pr_client_ip(): string {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
}

function pr_reset_email_html(string $name, string $resetUrl, int $ttlMin): string {
    $n   = htmlspecialchars($name !== '' ? $name : 'there', ENT_QUOTES, 'UTF-8');
    $url = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;color:#1a1a2e">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:28px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%">
  <tr><td style="background:#010F3B;padding:18px 32px">
    <span style="font-family:Poppins,Arial,sans-serif;font-size:18px;font-weight:800;color:#FF671F;letter-spacing:.3px">NetWeb CRM</span>
  </td></tr>
  <tr><td style="padding:30px 32px 8px;font-size:15px;line-height:1.6">
    <p style="margin:0 0 14px">Hola ' . $n . ',</p>
    <p style="margin:0 0 14px">Recibimos una solicitud para restablecer la contrase&ntilde;a de tu cuenta en NetWeb CRM. Haz clic en el bot&oacute;n para crear una nueva contrase&ntilde;a (el enlace vence en ' . $ttlMin . ' minutos):</p>
    <table cellpadding="0" cellspacing="0" style="margin:18px auto"><tr><td style="background:#FF671F;border-radius:8px">
      <a href="' . $url . '" style="display:inline-block;padding:14px 30px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;font-family:Poppins,Arial,sans-serif">Restablecer contrase&ntilde;a &rarr;</a>
    </td></tr></table>
    <p style="margin:0 0 16px;color:#555;font-size:13px">Si el bot&oacute;n no funciona, copia este enlace en tu navegador:<br><span style="color:#0a4;word-break:break-all">' . $url . '</span></p>
    <hr style="border:none;border-top:1px solid #eee;margin:22px 0">
    <p style="margin:0 0 14px;color:#555;font-size:13px"><strong>English:</strong> We received a request to reset your NetWeb CRM password. Use the button above to set a new one &mdash; the link expires in ' . $ttlMin . ' minutes.</p>
    <p style="margin:0;color:#888;font-size:12px">Si no solicitaste esto, ignora este correo &mdash; tu contrase&ntilde;a no cambiar&aacute;. / If you didn\'t request this, just ignore this email.</p>
  </td></tr>
  <tr><td style="background:#010F3B;padding:16px 32px;text-align:center">
    <p style="margin:0;color:#8899bb;font-size:11px">NetWebMedia &middot; Santiago, Chile &middot; <a href="https://netwebmedia.com" style="color:#8899bb">netwebmedia.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>';
}

/* ── request ───────────────────────────────────────────────────────────── */
if ($action === 'request' && $method === 'POST') {
    pr_same_origin_or_fail();
    $d     = getInput();
    $email = strtolower(trim($d['email'] ?? ''));

    // Generic response used for every request outcome so existence never leaks.
    $generic = ['ok' => true, 'message' => 'If an account exists for that email, a reset link has been sent.'];

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse($generic);
    }

    // Throttle: at most 5 requests/hour per email, and one per 60s.
    $c = $db->prepare("SELECT COUNT(*) FROM password_resets WHERE email = ? AND created_at > (NOW() - INTERVAL 1 HOUR)");
    $c->execute([$email]);
    $recentCount = (int)$c->fetchColumn();

    $l = $db->prepare("SELECT created_at FROM password_resets WHERE email = ? ORDER BY id DESC LIMIT 1");
    $l->execute([$email]);
    $lastAt = $l->fetchColumn();
    $tooSoon = $lastAt && (strtotime($lastAt) > (time() - 60));

    if ($recentCount >= 5 || $tooSoon) {
        jsonResponse($generic); // silently drop — looks identical to the caller
    }

    // Look up the user (CRM users table). Only registered account emails ever
    // receive mail, so this can't be used to send to arbitrary addresses.
    $u = $db->prepare("SELECT id, name, email, status FROM users WHERE email = ? LIMIT 1");
    $u->execute([$email]);
    $user = $u->fetch();

    if ($user && !in_array(($user['status'] ?? ''), ['suspended', 'cancelled'], true)) {
        $rawToken  = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $ttl = (int)$TTL_MINUTES; // trusted constant, safe to inline (avoids placeholder in INTERVAL)
        $ins = $db->prepare("INSERT INTO password_resets (user_id, email, token_hash, expires_at, ip) VALUES (?, ?, ?, (NOW() + INTERVAL $ttl MINUTE), ?)");
        $ins->execute([(int)$user['id'], $user['email'], $tokenHash, pr_client_ip()]);

        $resetUrl = rtrim(ALLOWED_ORIGIN, '/') . '/crm-vanilla/reset-password.html?token=' . $rawToken;
        try {
            mailSend([
                'to'         => $user['email'],
                'subject'    => 'Restablece tu contraseña — NetWeb CRM',
                'html'       => pr_reset_email_html($user['name'] ?? '', $resetUrl, $TTL_MINUTES),
                'from_name'  => 'NetWeb CRM',
                'from_email' => 'newsletter@netwebmedia.com',
                'reply_to'   => 'hola@netwebmedia.com',
            ]);
        } catch (Throwable $e) {
            error_log('[password_reset] send failed for ' . $user['email'] . ': ' . $e->getMessage());
            // Still return generic success — never expose send/account state.
        }
    }

    jsonResponse($generic);
}

/* ── validate ──────────────────────────────────────────────────────────── */
if ($action === 'validate' && $method === 'GET') {
    $raw = (string)($_GET['t'] ?? $_GET['token'] ?? '');
    if ($raw === '') jsonResponse(['valid' => false]);
    $hash = hash('sha256', $raw);
    $s = $db->prepare("SELECT id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1");
    $s->execute([$hash]);
    jsonResponse(['valid' => (bool)$s->fetch()]);
}

/* ── confirm ───────────────────────────────────────────────────────────── */
if ($action === 'confirm' && $method === 'POST') {
    pr_same_origin_or_fail();
    $d        = getInput();
    $raw      = (string)($d['token'] ?? '');
    $password = (string)($d['password'] ?? '');

    if ($raw === '')               jsonError('Reset token required', 400);
    if (strlen($password) < 8)     jsonError('La contraseña debe tener al menos 8 caracteres. / Password must be at least 8 characters.', 400);

    $hash = hash('sha256', $raw);
    $s = $db->prepare("SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1");
    $s->execute([$hash]);
    $row = $s->fetch();
    if (!$row) jsonError('Este enlace es inválido o expiró. Solicita uno nuevo. / This link is invalid or expired — request a new one.', 400);

    $newHash = password_hash($password, PASSWORD_DEFAULT);
    $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$newHash, (int)$row['user_id']]);

    // Burn this token and any other outstanding tokens for the user.
    $db->prepare("UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL")->execute([(int)$row['user_id']]);

    jsonResponse(['ok' => true, 'message' => 'Password updated. You can now sign in.']);
}

jsonError('Unknown action. Use action=request|validate|confirm', 400);

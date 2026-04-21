<?php
function route_auth($path, $method) {
  // /api/auth/register
  if ($path === 'register' && $method === 'POST') {
    $b = required(['email', 'password', 'name']);
    $email = strtolower(trim($b['email']));
    $name  = trim($b['name']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email');
    if (strlen($b['password']) < 8) err('Password must be at least 8 characters');

    // Honeypot: bots fill hidden fields that humans never see. Silently succeed.
    if (!empty($b['nwm_website'])) {
      json_out(['user' => null, 'token' => bin2hex(random_bytes(16)), 'requires_payment' => true], 201);
      return;
    }

    // Reject names that look like random strings: single word over 20 chars has no legitimate use.
    if (!str_contains($name, ' ') && strlen($name) > 20) {
      err('Please enter your full name (first and last).', 422);
    }

    $existing = qOne("SELECT id FROM users WHERE email = ?", [$email]);
    if ($existing) err('Email already registered', 409);

    $hash = password_hash($b['password'], PASSWORD_BCRYPT);
    // New signups start as pending_payment — flipped to active on MP webhook.
    // Superadmin stays on a manually-seeded row; it's never touched here.
    qExec(
      "INSERT INTO users (email, password_hash, name, role, status, org_id) VALUES (?, ?, ?, 'user', 'pending_payment', 1)",
      [$email, $hash, $name]
    );
    $uid = lastId();
    $token = createSession($uid);
    $user = qOne("SELECT * FROM users WHERE id = ?", [$uid]);
    log_activity('user.register', 'user', $uid);

    // ── Welcome email + admin notification ─────────────────────────
    // Wrapped in try/catch — never block signup on mail issues.
    try {
      require_once __DIR__ . '/../lib/mailer.php';
      $first = strtok($name, ' ') ?: 'there';

      // 1. Welcome email to the new signup
      $welcome_inner = '
        <p>Hi <strong>' . htmlspecialchars($first, ENT_QUOTES, 'UTF-8') . '</strong>,</p>
        <p>Welcome to <strong>NetWebMedia</strong> — your account is created.</p>
        <p>Here&rsquo;s what to do next:</p>
        <ol style="padding-left:20px">
          <li><strong>Pick your plan</strong> — Launch / Grow / Scale at <a href="https://netwebmedia.com/pricing.html">netwebmedia.com/pricing</a></li>
          <li><strong>Log in to your CRM</strong> at <a href="https://netwebmedia.com/app/">netwebmedia.com/app</a></li>
          <li><strong>Browse 33 industry templates</strong> at <a href="https://netwebmedia.com/industries/">netwebmedia.com/industries</a></li>
        </ol>
        <p>Need help? Reply to this email or message us on WhatsApp:
          <a href="https://api.whatsapp.com/send/?phone=56965322427">+56 9 6532 2427</a>.
        </p>
        <p style="margin-top:24px">— Carlos &amp; the NetWebMedia team</p>
      ';
      send_mail($email, 'Welcome to NetWebMedia, ' . $first, email_shell('Welcome aboard', $welcome_inner));

      // 2. Admin notification — to entrepoker@gmail.com (config: admin_email)
      $admin_inner = '
        <p>A new user just signed up:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px">
          <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666;width:120px">Name</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee"><strong>' . htmlspecialchars($name,  ENT_QUOTES, 'UTF-8') . '</strong></td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">Email</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">User ID</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee">#' . (int)$uid . '</td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">Status</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee">pending_payment</td></tr>
          <tr><td style="padding:6px 10px;color:#666">When</td>
              <td style="padding:6px 10px">' . date('Y-m-d H:i:s') . ' UTC</td></tr>
        </table>
        <p style="margin-top:20px">
          <a href="https://netwebmedia.com/app/sub-accounts" style="background:#6c5ce7;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View user in CRM</a>
        </p>
      ';
      send_to_admin('New signup: ' . $name . ' (' . $email . ')', email_shell('New signup', $admin_inner));
    } catch (Throwable $_) { /* never block signup on mail issues */ }

    // requires_payment flag tells the client to route new signups to /cart.html before app access.
    json_out([
      'user'             => sanitizeUser($user),
      'token'            => $token,
      'requires_payment' => true,
    ], 201);
  }

  // /api/auth/login
  if ($path === 'login' && $method === 'POST') {
    $b = required(['email', 'password']);
    $email = strtolower(trim($b['email']));
    $user = qOne("SELECT * FROM users WHERE email = ?", [$email]);
    if (!$user) err('Invalid credentials', 401);
    if (!password_verify($b['password'], $user['password_hash'])) err('Invalid credentials', 401);
    qExec("UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']]);
    $token = createSession($user['id']);
    log_activity('user.login', 'user', $user['id']);
    $status = $user['status'] ?? 'active';
    json_out([
      'user'             => sanitizeUser($user),
      'token'            => $token,
      'requires_payment' => ($status === 'pending_payment'),
      'status'           => $status,
    ]);
  }

  // /api/auth/logout
  if ($path === 'logout' && $method === 'POST') {
    $token = getToken();
    if ($token) qExec("DELETE FROM sessions WHERE token = ?", [$token]);
    clearSessionCookie();
    json_out(['ok' => true]);
  }

  // /api/auth/me
  if ($path === 'me' && $method === 'GET') {
    $u = requireAuth();
    json_out(['user' => sanitizeUser($u)]);
  }

  err('Auth route not found', 404);
}

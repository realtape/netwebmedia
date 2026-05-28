<?php
function pwreset_ensure_table() {
  static $done = false;
  if ($done) return;
  qExec("CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_token (token_hash),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

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
    if (strpos($name, ' ') === false && strlen($name) > 20) {
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

  // /api/auth/forgot — request a password-reset email
  if ($path === 'forgot' && $method === 'POST') {
    $b = required(['email']);
    $email = strtolower(trim($b['email']));

    // Always return the same response whether or not the account exists —
    // prevents account-enumeration via this endpoint.
    $generic = ['ok' => true, 'message' => 'If an account exists for that email, a reset link is on its way.'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out($generic);

    pwreset_ensure_table();

    $user = qOne("SELECT id, email, name FROM users WHERE email = ?", [$email]);
    if (!$user) json_out($generic);

    // Throttle: if an unused token was issued in the last 60s, don't send again.
    $recent = qOne(
      "SELECT id FROM password_resets WHERE user_id = ? AND used_at IS NULL AND created_at > (NOW() - INTERVAL 60 SECOND) LIMIT 1",
      [$user['id']]
    );
    if ($recent) json_out($generic);

    // Invalidate any prior outstanding tokens for this user.
    qExec("UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL", [$user['id']]);

    $token     = bin2hex(random_bytes(32));      // raw token — goes in the email link only
    $tokenHash = hash('sha256', $token);          // only the hash is stored
    $expires   = date('Y-m-d H:i:s', time() + 3600); // 1 hour
    qExec(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [$user['id'], $tokenHash, $expires]
    );

    try {
      require_once __DIR__ . '/../lib/mailer.php';
      $cfg      = config();
      $base     = rtrim($cfg['base_url'] ?? 'https://netwebmedia.com', '/');
      $link     = $base . '/reset-password.html?token=' . $token;
      $safeLink = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');
      $first    = strtok((string)($user['name'] ?? ''), ' ') ?: 'there';
      $inner = '
        <p>Hi <strong>' . htmlspecialchars($first, ENT_QUOTES, 'UTF-8') . '</strong>,</p>
        <p>We received a request to reset the password for your <strong>NetWebMedia</strong> account.</p>
        <p style="margin:24px 0">
          <a href="' . $safeLink . '" style="background:#6c5ce7;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset your password</a>
        </p>
        <p style="font-size:13px;color:#666">This link expires in 1 hour and can only be used once. If the button doesn&rsquo;t work, copy and paste this URL into your browser:<br><span style="word-break:break-all">' . $safeLink . '</span></p>
        <p style="font-size:13px;color:#666">If you didn&rsquo;t request this, you can safely ignore this email — your password won&rsquo;t change.</p>
      ';
      send_mail($user['email'], 'Reset your NetWebMedia password', email_shell('Password reset', $inner));
    } catch (Throwable $_) { /* never leak mail errors to the client */ }

    json_out($generic);
  }

  // /api/auth/reset — set a new password using the token from the email link
  if ($path === 'reset' && $method === 'POST') {
    $b        = required(['token', 'password']);
    $token    = trim($b['token']);
    $password = $b['password'];
    if (strlen($password) < 8) err('Password must be at least 8 characters', 422);
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) err('Invalid or expired reset link', 400);

    pwreset_ensure_table();

    $tokenHash = hash('sha256', $token);
    $row = qOne(
      "SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
      [$tokenHash]
    );
    if (!$row) err('Invalid or expired reset link', 400);

    $hash = password_hash($password, PASSWORD_BCRYPT);
    qExec("UPDATE users SET password_hash = ? WHERE id = ?", [$hash, $row['user_id']]);
    qExec("UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL", [$row['user_id']]);
    // Security: revoke all existing sessions so any old logins can't continue.
    qExec("DELETE FROM sessions WHERE user_id = ?", [$row['user_id']]);
    log_activity('user.password_reset', 'user', $row['user_id']);

    json_out(['ok' => true, 'message' => 'Your password has been updated. You can now sign in.']);
  }

  /* POST /api/auth/ensure-admins?token=<first-16-chars-of-jwt_secret>
     Idempotent maintenance endpoint — ensures the rows in $extra_admins exist
     in the users table and have role=admin. Called from CI after each deploy
     (deploy-site-root.yml). Never overwrites an existing password; new rows
     get a random unguessable bcrypt hash so the holder must use the
     forgot-password flow to set their own.

     Gated by the same token scheme as api-php/migrate.php (first 16 chars of
     jwt_secret) since the api-php config exposes jwt_secret but not the
     MIGRATE_TOKEN constant the CRM uses.

     This duplicates the equivalent block in api-php/migrate.php because
     migrate.php sits behind the /api/ bridge router and is not callable as
     a URL — only routes/*.php is reachable. Both blocks must stay in sync. */
  if ($path === 'ensure-admins' && $method === 'POST') {
    $cfg = config();
    $expected = substr($cfg['jwt_secret'] ?? '', 0, 16);
    $token = (string)($_GET['token'] ?? '');
    if ($expected === '' || !hash_equals($expected, $token)) {
      err('Forbidden', 403);
    }

    // Use the same table-ensure as forgot/reset (CREATE TABLE IF NOT EXISTS users).
    qExec("CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $extras = [
      ['email' => 'carlos@netwebmedia.com', 'name' => 'Carlos Martinez'],
    ];
    $log = [];
    foreach ($extras as $a) {
      $row = qOne("SELECT id, role, status FROM users WHERE email = ?", [$a['email']]);
      if ($row) {
        $updates = [];
        $params  = [];
        if (($row['role'] ?? '') !== 'admin') {
          $updates[] = "role = 'admin'"; // safe — literal, no user input
        }
        // status DEFAULT is 'pending_payment' — admins skip the paywall.
        if (($row['status'] ?? '') !== 'active') {
          $updates[] = "status = 'active'";
        }
        if (!empty($updates)) {
          qExec("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?", [$row['id']]);
          $log[] = "updated {$a['email']} (" . implode(', ', $updates) . ")";
        } else {
          $log[] = "skip {$a['email']} (already admin + active)";
        }
      } else {
        $randomPass = bin2hex(random_bytes(16));
        $hash = password_hash($randomPass, PASSWORD_BCRYPT);
        qExec(
          "INSERT INTO users (email, password_hash, name, role, status, org_id) VALUES (?, ?, ?, 'admin', 'active', 1)",
          [$a['email'], $hash, $a['name']]
        );
        $log[] = "inserted {$a['email']} (admin + active; use Forgot password? to set your own)";
      }
    }
    json_out(['ok' => true, 'ensured' => $log]);
  }

  err('Auth route not found', 404);
}

<?php
/* Passwordless admin/superadmin login via one-time magic link.
 *
 * URL: /magic-login.php?key=<MAGIC_KEY>&email=<email>
 *
 * Why this exists:
 *   - The CRM at app.netwebmedia.com requires a password login. Recovery
 *     paths (Forgot password) aren't built. When the password is unknown
 *     or the user wants to bootstrap a session via an admin-controlled
 *     one-time URL, this endpoint sets the session for an existing user
 *     in the users table without requiring the password to be entered.
 *   - Maps to passwordless-auth-with-explicit-permission flows. NOT a
 *     bypass for normal user login — only the holder of MAGIC_KEY (the
 *     CRM admin) can call it.
 *
 * What it does:
 *   1. Validate the key against the constant below (rotate after use).
 *   2. Look up the email in users table (must already exist; this is NOT
 *      a sign-up endpoint).
 *   3. Set $_SESSION['nwm_uid'] = $user['id'] (server-side session).
 *   4. Render an HTML page that sets localStorage.nwm_user / nwm_token
 *      and crm_demo_user (legacy), then JS-redirects to /index.html.
 *
 * Rotation: change MAGIC_KEY here and re-deploy after use. Or delete
 * this file entirely once the password-reset flow is properly built
 * (POST /api/setup with action=create_admin already supports rotation).
 */

require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/lib/guard.php';
_guard_session_start();

const MAGIC_KEY = 'bhaFksK-01CK4G1ifNFUPTejn_7SCSQb';

$key   = (string)($_GET['key']   ?? '');
$email = strtolower(trim((string)($_GET['email'] ?? '')));

function fail($msg, $code = 403) {
  http_response_code($code);
  header('Content-Type: text/plain; charset=utf-8');
  echo $msg;
  exit;
}

if (!hash_equals(MAGIC_KEY, $key))                              fail('Invalid key', 403);
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Bad email', 400);

// Look up user.
$db = getDB();
$stmt = $db->prepare('SELECT id, name, email, company, role, status FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user)                                                    fail('User not found', 404);
if (in_array($user['status'], ['suspended', 'cancelled'], true)) fail('Account suspended', 403);

// Server-side session.
$_SESSION['nwm_uid'] = (int)$user['id'];
$db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

// Token for client-side localStorage. Not security-critical — the CRM API
// gates on $_SESSION; the client token only unblocks app.js's auth gate.
$client_token = bin2hex(random_bytes(16));

// Render the bridge page.
$payload = [
  'id'      => (int)$user['id'],
  'name'    => $user['name'],
  'email'   => $user['email'],
  'company' => $user['company'] ?? '',
  'type'    => $user['role'] ?? 'user',
  'role'    => $user['role'] ?? 'user',
];
$payload_json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?><!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Signing in… NetWeb CRM</title>
<style>
  body { background:#010F3B; color:#fff; font-family:-apple-system,Inter,sans-serif;
         display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .box { text-align:center; }
  .spinner { width:40px; height:40px; border:3px solid rgba(255,255,255,0.15);
             border-top-color:#FF671F; border-radius:50%; animation:spin 0.8s linear infinite;
             margin:0 auto 18px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  h1 { font-size:18px; font-weight:600; margin:0 0 4px; }
  p  { font-size:13px; opacity:0.65; margin:0; }
</style>
</head><body>
<div class="box">
  <div class="spinner"></div>
  <h1>Signing you in…</h1>
  <p>Welcome, <?= htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') ?></p>
</div>
<script>
  // Set canonical (nwm_*) + legacy (crm_demo_user) for app.js's auth gate.
  localStorage.setItem('nwm_token', '<?= $client_token ?>');
  localStorage.setItem('nwm_user',  '<?= addslashes($payload_json) ?>');
  localStorage.setItem('crm_demo_user', '<?= addslashes($payload_json) ?>');
  document.cookie = 'crm_demo=1; path=/; max-age=604800; SameSite=Lax';

  // Land on dashboard.
  setTimeout(function() { window.location.replace('/index.html'); }, 250);
</script>
</body></html>

<?php
/**
 * One-time superadmin account setup.
 * DELETE THIS FILE after use.
 *
 * Access: admin.netwebmedia.com/setup.php?token=<MIGRATE_TOKEN>
 */
require_once __DIR__ . '/api/lib/db.php';

$token    = $_GET['token'] ?? '';
$expected = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : (getenv('MIGRATE_TOKEN') ?: 'NWM_MIGRATE_2026');

if (!hash_equals($expected, $token)) {
    http_response_code(403);
    die('Forbidden — pass ?token=<MIGRATE_TOKEN>');
}

$db  = getDB();
$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $name     = trim($_POST['name'] ?? '');

    if (!$email || !$password || strlen($password) < 8) {
        $msg = 'ERROR: email and password (min 8 chars) required';
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT);

        // Upsert: update if exists, insert if not
        $existing = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $existing->execute([$email]);
        $user = $existing->fetch();

        if ($user) {
            $db->prepare('UPDATE users SET role = ?, password_hash = ?, status = ?, name = COALESCE(NULLIF(?, ""), name) WHERE email = ?')
               ->execute(['superadmin', $hash, 'active', $name, $email]);
            $msg = 'OK: updated ' . htmlspecialchars($email) . ' → role=superadmin, password reset';
        } else {
            $db->prepare('INSERT INTO users (name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())')
               ->execute([$name ?: $email, $email, $hash, 'superadmin', 'active']);
            $msg = 'OK: created superadmin account for ' . htmlspecialchars($email);
        }
    }
}

// List current superadmins
$admins = $db->query("SELECT id, name, email, status, created_at FROM users WHERE role = 'superadmin' ORDER BY id")->fetchAll();
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Superadmin Setup</title>
<style>
body { font-family: monospace; background:#010F3B; color:#fff; padding:2rem; }
h1 { color:#FF671F; }
form { background:rgba(255,255,255,.08); padding:1.5rem; border-radius:8px; max-width:440px; margin:1.5rem 0; }
label { display:block; margin:.75rem 0 .25rem; font-size:.85rem; }
input { width:100%; padding:.5rem; border-radius:4px; border:none; font-size:1rem; }
button { margin-top:1rem; background:#FF671F; color:#fff; border:none; padding:.6rem 1.4rem; border-radius:4px; cursor:pointer; font-weight:700; }
.msg { padding:.75rem; border-radius:4px; margin:1rem 0; background:rgba(255,255,255,.1); font-size:.9rem; }
.ok  { color:#4ade80; } .err { color:#f87171; }
table { border-collapse:collapse; margin-top:1rem; }
td,th { padding:.4rem .9rem; border:1px solid rgba(255,255,255,.15); font-size:.85rem; }
th { color:#FF671F; }
.warn { color:#fbbf24; margin-top:2rem; font-size:.8rem; }
</style>
</head>
<body>
<h1>Superadmin Setup</h1>
<p>Create or update a superadmin account. <strong>Delete this file after use.</strong></p>

<?php if ($msg): ?>
<div class="msg <?= str_starts_with($msg, 'OK') ? 'ok' : 'err' ?>"><?= $msg ?></div>
<?php endif; ?>

<form method="POST" action="?token=<?= htmlspecialchars($token) ?>">
  <label>Email</label>
  <input type="email" name="email" value="carlos@netwebmedia.com" required>
  <label>Name (optional if user exists)</label>
  <input type="text" name="name" value="Carlos Martinez">
  <label>New password (min 8 chars)</label>
  <input type="password" name="password" required minlength="8">
  <button type="submit">Create / Update Superadmin</button>
</form>

<h2>Current superadmins</h2>
<?php if ($admins): ?>
<table>
<tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Created</th></tr>
<?php foreach ($admins as $a): ?>
<tr>
  <td><?= $a['id'] ?></td>
  <td><?= htmlspecialchars($a['name']) ?></td>
  <td><?= htmlspecialchars($a['email']) ?></td>
  <td><?= htmlspecialchars($a['status']) ?></td>
  <td><?= $a['created_at'] ?></td>
</tr>
<?php endforeach; ?>
</table>
<?php else: ?>
<p>No superadmin accounts yet.</p>
<?php endif; ?>

<p class="warn">⚠ DELETE superadmin/setup.php after you're done.</p>
</body>
</html>

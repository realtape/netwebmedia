<?php
require_once __DIR__ . '/api/lib/session.php';
sa_start();
if (sa_user()) { header('Location: /dashboard.php'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NWM Superadmin — Sign In</title>
<meta name="robots" content="noindex,nofollow">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Inter, system-ui, sans-serif;
  background: #010F3B;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  background: #fff;
  border-radius: 8px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
.logo {
  text-align: center;
  margin-bottom: 1.75rem;
}
.logo span {
  font-size: 1.4rem;
  font-weight: 800;
  color: #010F3B;
  letter-spacing: -0.5px;
}
.logo span em {
  color: #FF671F;
  font-style: normal;
}
.logo small {
  display: block;
  font-size: .75rem;
  color: #6b7280;
  margin-top: 2px;
  letter-spacing: .05em;
  text-transform: uppercase;
}
label {
  display: block;
  font-size: .8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: .35rem;
}
input[type=email], input[type=password] {
  width: 100%;
  padding: .6rem .85rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: .95rem;
  outline: none;
  transition: border-color .15s;
  margin-bottom: 1rem;
}
input:focus { border-color: #010F3B; }
button[type=submit] {
  width: 100%;
  padding: .75rem;
  background: #FF671F;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .15s;
  margin-top: .25rem;
}
button[type=submit]:hover { background: #e55a15; }
button:disabled { opacity: .55; cursor: not-allowed; }
.err {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  border-radius: 6px;
  padding: .6rem .85rem;
  font-size: .875rem;
  margin-bottom: 1rem;
  display: none;
}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <span>NetWeb<em>Media</em></span>
    <small>Superadmin Portal</small>
  </div>
  <div class="err" id="err"></div>
  <form id="form">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" autocomplete="username" required>
    <label for="password">Password</label>
    <input type="password" id="password" name="password" autocomplete="current-password" required>
    <button type="submit" id="btn">Sign in</button>
  </form>
</div>
<script>
document.getElementById('form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('btn');
  var err = document.getElementById('err');
  err.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    var res = await fetch('/api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    var data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || 'Sign-in failed';
      err.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Sign in';
      return;
    }
    window.location.href = '/dashboard.php';
  } catch (ex) {
    err.textContent = 'Network error — please try again';
    err.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});
</script>
</body>
</html>

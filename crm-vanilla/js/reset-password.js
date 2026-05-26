'use strict';
/* CRM reset-password page. Reads ?token= from the emailed link, validates it,
   then POSTs the new password to api/?r=password_reset&action=confirm. */
(function () {
  var form    = document.getElementById('resetForm');
  var pw1      = document.getElementById('newPassword');
  var pw2      = document.getElementById('confirmPassword');
  var errEl   = document.getElementById('resetError');
  var btn     = document.getElementById('resetBtn');

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]+)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  var token = getParam('token') || getParam('t');

  function showError(msg) {
    errEl.style.color = '';
    errEl.textContent = msg;
  }
  function showOk(msg) {
    errEl.style.color = '#7fe3a3';
    errEl.textContent = msg;
  }

  if (!token) {
    showError('Enlace inválido: falta el token. · Invalid link: missing token.');
    if (btn) btn.disabled = true;
    return;
  }

  // Validate token up-front so an expired link fails fast.
  fetch('api/?r=password_reset&action=validate&t=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.valid) {
        showError('Este enlace es inválido o expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?". · This link is invalid or expired.');
        if (btn) btn.disabled = true;
      }
    })
    .catch(function () { /* network hiccup — let the submit attempt surface it */ });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var p1 = pw1.value, p2 = pw2.value;
    if (p1.length < 8) { showError('La contraseña debe tener al menos 8 caracteres. · At least 8 characters.'); return; }
    if (p1 !== p2)     { showError('Las contraseñas no coinciden. · Passwords do not match.'); return; }

    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = 'Guardando... · Saving...';
    errEl.textContent = '';

    fetch('api/?r=password_reset&action=confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, password: p1 })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.error) {
          showError(d.error);
          btn.disabled = false;
          btn.textContent = original;
          return;
        }
        form.style.display = 'none';
        showOk('Contraseña actualizada. Redirigiendo al inicio de sesión... · Password updated. Redirecting to sign in...');
        setTimeout(function () { window.location.href = 'login.html'; }, 2200);
      })
      .catch(function () {
        showError('Error de conexión. Intenta de nuevo. · Connection error. Try again.');
        btn.disabled = false;
        btn.textContent = original;
      });
  });
})();

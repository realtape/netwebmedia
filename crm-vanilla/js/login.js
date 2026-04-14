'use strict';
(function() {
  var form = document.getElementById('loginForm');
  var nameInput = document.getElementById('inputName');
  var emailInput = document.getElementById('inputEmail');
  var errorEl = document.getElementById('loginError');
  var submitBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();

    if (!name || !email) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    // Basic email validation
    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      errorEl.textContent = 'Please enter a valid email';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    errorEl.textContent = '';

    // Save lead to API
    fetch('api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      // Store demo session in localStorage
      localStorage.setItem('crm_demo_user', JSON.stringify({
        name: name,
        email: email,
        type: 'demo',
        loginAt: new Date().toISOString()
      }));
      // Set cookie too for PHP to read
      document.cookie = 'crm_demo=1; path=/app/; max-age=86400; SameSite=Lax';
      // Redirect to dashboard
      window.location.href = 'index.html';
    })
    .catch(function() {
      // Even if API fails, let them in (capture can retry)
      localStorage.setItem('crm_demo_user', JSON.stringify({
        name: name,
        email: email,
        type: 'demo',
        loginAt: new Date().toISOString()
      }));
      document.cookie = 'crm_demo=1; path=/app/; max-age=86400; SameSite=Lax';
      window.location.href = 'index.html';
    });
  });
})();

(function() {
  'use strict';

  var loginGate = document.getElementById('login-gate');
  var dashboardLayout = document.getElementById('dashboard-layout');
  var loginForm = document.getElementById('login-form');
  var loginEmail = document.getElementById('login-email');
  var loginError = document.getElementById('login-error');

  // Check if already logged in
  var session = JSON.parse(localStorage.getItem('nwm_dashboard_session') || 'null');
  if (session && session.email) {
    showDashboard(session);
    return;
  }

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = loginEmail.value.trim().toLowerCase();
    if (!email) return;

    // Check if this email has used the analytics tool
    var leads = JSON.parse(localStorage.getItem('nwm_analytics_leads') || '[]');
    var found = null;
    for (var i = 0; i < leads.length; i++) {
      if (leads[i].email.toLowerCase() === email) {
        found = leads[i];
        break;
      }
    }

    if (!found) {
      loginError.textContent = 'No account found. Please analyze your website first.';
      return;
    }

    // Create session
    var sessionData = {
      email: found.email,
      name: found.name,
      url: found.url,
      loginDate: new Date().toISOString()
    };
    localStorage.setItem('nwm_dashboard_session', JSON.stringify(sessionData));
    showDashboard(sessionData);
  });

  function showDashboard(sessionData) {
    loginGate.style.display = 'none';
    dashboardLayout.style.display = 'flex';

    // Update sidebar user info
    var userEl = document.querySelector('.sidebar-user');
    if (userEl) {
      var initials = sessionData.name ? sessionData.name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase() : 'U';
      userEl.innerHTML =
        '<div class="sidebar-avatar">' + initials + '</div>' +
        '<div><div style="font-weight:600;color:var(--text)">' + escHtml(sessionData.name || 'User') + '</div>' +
        '<div style="font-size:0.7rem">' + escHtml(sessionData.email) + '</div></div>';
    }
  }

  // Logout
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('nwm_dashboard_session');
      location.reload();
    });
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();

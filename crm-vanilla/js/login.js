'use strict';
(function() {
  var T = (window.CRM_APP && CRM_APP.t) ? CRM_APP.t : function(k){ return k; };
  var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
  var L = isEs ? {
    title: "Comienza tu Demo Gratis",
    subtitle: "Ingresa tus datos para explorar la plataforma",
    welcomeBack: "Bienvenido de Vuelta",
    signinSubtitle: "Inicia sesión en tu cuenta",
    nameEmailReq: "Nombre y correo son requeridos",
    validEmail: "Por favor ingresa un correo válido",
    creating: "Creando tu cuenta...",
    signingIn: "Iniciando sesión...",
    fillFields: "Por favor completa todos los campos",
    connErr: "Error de conexión. Intenta de nuevo.",
    signIn: "Iniciar Sesión"
  } : {
    title: "Start Your Free Demo",
    subtitle: "Enter your details to explore the platform",
    welcomeBack: "Welcome Back",
    signinSubtitle: "Sign in to your account",
    nameEmailReq: "Name and email are required",
    validEmail: "Please enter a valid email",
    creating: "Creating your account...",
    signingIn: "Signing in...",
    fillFields: "Please fill in all fields",
    connErr: "Connection error. Please try again.",
    signIn: "Sign In"
  };

  /* ── Tab switching ── */
  var tabs = document.querySelectorAll('.login-tab');
  var signupForm = document.getElementById('signupForm');
  var signinForm = document.getElementById('signinForm');
  var title = document.querySelector('.login-title');
  var subtitle = document.querySelector('.login-subtitle');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      if (tab.dataset.tab === 'signup') {
        signupForm.classList.remove('login-form-hidden');
        signinForm.classList.add('login-form-hidden');
        title.textContent = L.title;
        subtitle.textContent = L.subtitle;
      } else {
        signinForm.classList.remove('login-form-hidden');
        signupForm.classList.add('login-form-hidden');
        title.textContent = L.welcomeBack;
        subtitle.textContent = L.signinSubtitle;
      }
    });
  });

  /* ── Signup (Demo) flow ── */
  var nameInput = document.getElementById('inputName');
  var emailInput = document.getElementById('inputEmail');
  var companyInput = document.getElementById('inputCompany');
  var phoneInput = document.getElementById('inputPhone');
  var signupError = document.getElementById('signupError');
  var signupBtn = document.getElementById('signupBtn');
  var signupOriginal = signupBtn ? signupBtn.textContent : 'Launch Demo';

  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var company = companyInput.value.trim();
    var phone = phoneInput.value.trim();

    if (!name || !email) {
      signupError.textContent = L.nameEmailReq;
      return;
    }
    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      signupError.textContent = L.validEmail;
      return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = L.creating;
    signupError.textContent = '';

    // POST to leads API (saves to DB + pushes to HubSpot)
    fetch('api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        company: company,
        phone: phone,
        source: 'demo_signup'
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      setSession(name, email, company, 'demo');
      window.location.href = 'index.html';
    })
    .catch(function() {
      // Even if API fails, let them in
      setSession(name, email, company, 'demo');
      window.location.href = 'index.html';
    });
  });

  /* ── Sign-in flow ── */
  var signinEmail = document.getElementById('signinEmail');
  var signinPassword = document.getElementById('signinPassword');
  var signinError = document.getElementById('signinError');
  var signinBtn = document.getElementById('signinBtn');

  signinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = signinEmail.value.trim();
    var password = signinPassword.value;

    if (!email || !password) {
      signinError.textContent = L.fillFields;
      return;
    }

    signinBtn.disabled = true;
    signinBtn.textContent = L.signingIn;
    signinError.textContent = '';

    fetch('api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        signinError.textContent = data.error;
        signinBtn.disabled = false;
        signinBtn.textContent = L.signIn;
        return;
      }
      setSession(data.name, data.email, data.company || '', data.type || 'user');
      window.location.href = 'index.html';
    })
    .catch(function() {
      signinError.textContent = L.connErr;
      signinBtn.disabled = false;
      signinBtn.textContent = L.signIn;
    });
  });

  /* ── Session helper ── */
  function setSession(name, email, company, type) {
    localStorage.setItem('crm_demo_user', JSON.stringify({
      name: name,
      email: email,
      company: company,
      type: type,
      loginAt: new Date().toISOString()
    }));
    document.cookie = 'crm_demo=1; path=/app/; max-age=604800; SameSite=Lax';
  }
})();

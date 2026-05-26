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
    signIn: "Iniciar Sesión",
    rememberMe: "Recordarme"
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
    signIn: "Sign In",
    rememberMe: "Remember me"
  };

  var REMEMBER_KEY = 'crm_remember_email';

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
  var rememberMe = document.getElementById('rememberMe');

  /* ── Remember me ──
     We persist the email only and let the browser's own password manager
     handle the password — storing a plaintext password in localStorage
     would be an XSS exfiltration risk. */
  var rememberLabel = rememberMe && rememberMe.parentElement
    ? rememberMe.parentElement.querySelector('span') : null;
  if (rememberLabel) rememberLabel.textContent = L.rememberMe;

  var rememberedEmail = '';
  try { rememberedEmail = localStorage.getItem(REMEMBER_KEY) || ''; } catch (e) {}
  if (rememberedEmail) {
    signinEmail.value = rememberedEmail;
    if (rememberMe) rememberMe.checked = true;
    // Returning user — surface the Sign In tab instead of the demo signup.
    var signinTab = document.getElementById('tabSignin');
    if (signinTab) signinTab.click();
  }

  function persistRemember(email) {
    try {
      if (rememberMe && rememberMe.checked) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (e) {}
  }

  /* ── Forgot password ──
     Sends a reset link to the email in the Sign-In email field via
     api/?r=password_reset&action=request. Response is always generic
     (never reveals whether the account exists). */
  var forgotLink = document.querySelector('.login-forgot a');
  if (forgotLink) {
    forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      var email = (signinEmail.value || '').trim();
      if (!email || email.indexOf('@') === -1) {
        signinError.style.color = '';
        signinError.textContent = isEs
          ? 'Ingresa tu correo arriba y vuelve a tocar “¿Olvidaste tu contraseña?”.'
          : 'Enter your email above, then tap “Forgot password?” again.';
        return;
      }
      forgotLink.style.pointerEvents = 'none';
      fetch('api/?r=password_reset&action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function(r) { return r.json(); })
      .then(function() {
        signinError.style.color = '#7fe3a3';
        signinError.textContent = isEs
          ? 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña (válido 1 hora). Revisa tu bandeja.'
          : 'If an account exists for that email, we sent a reset link (valid 1 hour). Check your inbox.';
      })
      .catch(function() {
        signinError.style.color = '';
        signinError.textContent = L.connErr;
      })
      .finally(function() {
        setTimeout(function() { forgotLink.style.pointerEvents = ''; }, 3000);
      });
    });
  }

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

    fetch('api/?r=auth', {
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
      if (data.requires_payment) {
        window.location.href = '/pricing.html?reason=signup';
        return;
      }
      persistRemember(email);
      setSession(data.name, data.email, data.company || '', data.type || 'user', {
        id: data.id, plan: data.plan, niche: data.niche
      });
      window.location.href = 'index.html';
    })
    .catch(function() {
      signinError.textContent = L.connErr;
      signinBtn.disabled = false;
      signinBtn.textContent = L.signIn;
    });
  });

  /* ── Session helper ── */
  function setSession(name, email, company, type, extra) {
    var u = {
      name: name,
      email: email,
      company: company,
      type: type,
      loginAt: new Date().toISOString()
    };
    if (extra) {
      if (extra.id    !== undefined) u.id    = extra.id;
      if (extra.plan  !== undefined) u.plan  = extra.plan;
      if (extra.niche !== undefined) u.niche = extra.niche;
    }
    // Real (non-demo) users write to nwm_user; demo stays in crm_demo_user
    var storageKey = (type === 'demo') ? 'crm_demo_user' : 'nwm_user';
    localStorage.setItem(storageKey, JSON.stringify(u));
    // Keep crm_demo_user cleared for real users so getLoggedInUser() hits nwm_user first
    if (type !== 'demo') localStorage.removeItem('crm_demo_user');
    document.cookie = 'crm_demo=1; path=/; max-age=604800; SameSite=Lax';
  }
})();

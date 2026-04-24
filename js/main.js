/* ============================================================
   NetWebMedia — Main JavaScript
   ============================================================ */

// ── Geo-IP Language Auto-Detection ─────────────────────────
// Order of precedence:
//   1. User's manual choice (localStorage 'nwm_lang')
//   2. Geo-IP country (cached 30 days in 'nwm_lang_geo')
//   3. Browser language (navigator.language)
//   4. Default English
//
// Spanish-speaking countries trigger 'es'. Everything else: 'en'.
(function nwmGeoLang(){
  if (window.__nwmGeoLangLoaded) return;
  window.__nwmGeoLangLoaded = true;

  var SPANISH_COUNTRIES = ['CL','MX','AR','PE','CO','VE','EC','UY','PY','BO','ES','GT','CR','CU','DO','HN','NI','PA','SV','PR'];
  var GEO_CACHE_KEY = 'nwm_lang_geo';
  var GEO_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  function getStored(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function setStored(key, val) {
    try { localStorage.setItem(key, val); } catch(e){}
  }

  function pickLangFromCountry(cc) {
    if (!cc) return null;
    return SPANISH_COUNTRIES.indexOf(cc.toUpperCase()) !== -1 ? 'es' : 'en';
  }

  function pickLangFromBrowser() {
    var nl = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nl.indexOf('es') === 0 ? 'es' : 'en';
  }

  // 1. Already set by user? Don't override.
  var userChoice = getStored('nwm_lang');
  if (userChoice === 'es' || userChoice === 'en') {
    document.documentElement.setAttribute('lang', userChoice);
    return;
  }

  // 2. Cached geo result still valid?
  var cached = getStored(GEO_CACHE_KEY);
  if (cached) {
    try {
      var c = JSON.parse(cached);
      if (c.ts && (Date.now() - c.ts) < GEO_CACHE_TTL && c.lang) {
        setStored('nwm_lang', c.lang);
        document.documentElement.setAttribute('lang', c.lang);
        return;
      }
    } catch(e){}
  }

  // 3. Try geo-IP lookup (fail-safe to browser language)
  var fallback = pickLangFromBrowser();
  setStored('nwm_lang', fallback);
  document.documentElement.setAttribute('lang', fallback);

  // Async lookup — won't block render. Updates lang if different.
  function tryGeoLookup() {
    if (!window.fetch) return;
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 2500);
    var opts = ctrl ? { signal: ctrl.signal } : {};
    fetch('https://ipapi.co/json/', opts).then(function(r){
      clearTimeout(timer);
      if (!r.ok) throw new Error('geo http ' + r.status);
      return r.json();
    }).then(function(d){
      var cc = d && (d.country_code || d.country);
      var lang = pickLangFromCountry(cc);
      if (!lang) return;
      setStored(GEO_CACHE_KEY, JSON.stringify({ts: Date.now(), lang: lang, country: cc}));
      // If detected lang differs from what's already applied, update
      if (lang !== getStored('nwm_lang')) {
        setStored('nwm_lang', lang);
        document.documentElement.setAttribute('lang', lang);
        // Notify other widgets (chat, cookie banner) to re-init
        try {
          window.dispatchEvent(new CustomEvent('nwm-lang-change', { detail: { lang: lang, country: cc, source: 'geo' }}));
        } catch(e){}
        // If the i18n script defined applyTranslations, call it
        if (typeof applyTranslations === 'function') applyTranslations(lang);
      }
    }).catch(function(){
      clearTimeout(timer);
      // Silent fail — fallback already applied
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryGeoLookup);
  } else {
    tryGeoLookup();
  }
})();

// ── Language Translations ──────────────────────────────────
const translations = {
  en: {
    nav_services: "Services",
    nav_about: "About",
    nav_results: "Results",
    nav_blog: "Blog",
    nav_contact: "Contact",
    nav_cta: "Book a Call",
    nav_signin: "Client Login",
    hero_badge: "",
    hero_title_1: "The AI-Native Fractional CMO",
    hero_title_2: "AI-Powered",
    hero_title_3: "Growth",
    hero_desc: "Get cited by ChatGPT, Perplexity & Google. Close more deals. One retainer covers strategy, software, and full execution — starting at $1,997/mo.",
    hero_cta1: "Book Your Free Strategy Call",
    hero_cta2: "See Pricing & Packages →",
    hero_stat1_num: "1",
    hero_stat1_label: "Senior operator",
    hero_stat2_num: "7",
    hero_stat2_label: "AI agents on staff",
    hero_stat3_num: "2026",
    hero_stat3_label: "Founding cohort open",
    clients_label: "Trusted by innovative brands worldwide",
    services_label: "What We Do",
    services_title: "Full-Stack AI Marketing Services",
    services_subtitle: "From AI-powered SEO to autonomous ad campaigns — we run it all on autopilot while you focus on building your business.",
    results_label: "Proven Results",
    results_title: "Numbers That Speak",
    results_subtitle: "Real results for real businesses. Here's what AI-powered marketing delivers.",
    cta_title: "Ready to Dominate Your Market?",
    cta_subtitle: "Get a free AI marketing audit and discover exactly where your competitors are beating you.",
    cta_btn: "Book Your Free Strategy Call",
    footer_tagline: "The world's most advanced AI marketing agency. We combine human creativity with machine intelligence to deliver unprecedented growth.",
  },
  es: {
    nav_services: "Servicios",
    nav_about: "Nosotros",
    nav_results: "Resultados",
    nav_blog: "Blog",
    nav_contact: "Contacto",
    nav_cta: "Auditoría Gratis",
    nav_signin: "Acceso Cliente",
    hero_badge: "🏆 Mejor Agencia de Marketing AI 2025",
    hero_title_1: "Tu Marca Merece",
    hero_title_2: "Crecimiento",
    hero_title_3: "con Inteligencia Artificial",
    hero_desc: "NetWebMedia es la agencia de marketing AI que combina inteligencia de datos, agentes autónomos y estrategias probadas de crecimiento para multiplicar por 10 el rendimiento de tu marca.",
    hero_cta1: "Llamada Estratégica Gratis",
    hero_cta2: "Ver Nuestros Resultados",
    hero_stat1_num: "500+",
    hero_stat1_label: "Marcas Impulsadas",
    hero_stat2_num: "340%",
    hero_stat2_label: "Aumento Promedio de ROI",
    hero_stat3_num: "4.9★",
    hero_stat3_label: "Satisfacción del Cliente",
    clients_label: "Confiado por marcas innovadoras en todo el mundo",
    services_label: "Qué Hacemos",
    services_title: "Servicios de Marketing AI Completos",
    services_subtitle: "Desde SEO impulsado por IA hasta campañas publicitarias autónomas — lo gestionamos todo en piloto automático mientras tú te enfocas en hacer crecer tu negocio.",
    results_label: "Resultados Probados",
    results_title: "Números que Hablan",
    results_subtitle: "Resultados reales para negocios reales. Esto es lo que entrega el marketing potenciado por IA.",
    cta_title: "¿Listo para Dominar tu Mercado?",
    cta_subtitle: "Obtén una auditoría de marketing AI gratuita y descubre exactamente dónde te están superando tus competidores.",
    cta_btn: "Reserva tu Llamada Estratégica Gratis",
    footer_tagline: "La agencia de marketing AI más avanzada del mundo. Combinamos creatividad humana con inteligencia artificial para entregar un crecimiento sin precedentes.",
  }
};

let currentLang = localStorage.getItem('nwm-lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('nwm-lang', lang);

  // 1. Update all [data-i18n] elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // 2. Update all [data-en] / [data-es] elements (service cards, steps, etc.)
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'es' ? el.getAttribute('data-es') : el.getAttribute('data-en');
    if (text) el.textContent = text;
  });

  // 3. Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // 4. Toggle active state on lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // 5. Update HTML lang attribute
  document.documentElement.lang = lang;
}

// ── Navbar Scroll Effect ───────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Click-toggle for nav dropdowns (works alongside :hover)
  document.querySelectorAll('.nav-item > a').forEach(anchor => {
    const parent = anchor.parentElement;
    const dropdown = parent.querySelector('.nav-dropdown');
    if (!dropdown) return;
    anchor.addEventListener('click', (e) => {
      // Only intercept if dropdown is not currently open via hover
      if (window.matchMedia('(hover: none)').matches || e.shiftKey) {
        e.preventDefault();
        document.querySelectorAll('.nav-item.open').forEach(i => { if (i !== parent) i.classList.remove('open'); });
        parent.classList.toggle('open');
      }
    });
  });
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
    }
  });
}

// ── Mobile Menu ────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const navbar = document.getElementById('navbar');
  if (!hamburger || !mobileMenu) return;

  // Position the menu just below the navbar (accounts for lang-bar height)
  function positionMenu() {
    const navBottom = navbar ? navbar.getBoundingClientRect().bottom : 70;
    mobileMenu.style.top = Math.max(navBottom, 60) + 'px';
  }

  hamburger.addEventListener('click', () => {
    positionMenu();
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── Floating Squares (Hero Visual) ────────────────────────
function initFloatingSquares() {
  const container = document.querySelector('.squares-container');
  if (!container) return;

  // Gulf Oil colors for floating squares
  const colors = ['#FF671F','#FF8C42','#012169','#004B87','#FF9A6C','#FFB347','#0047AB'];

  function createSquare() {
    const sq = document.createElement('div');
    sq.className = 'sq';
    const size = Math.random() * 30 + 10;
    const x = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    sq.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -50px;
      border-color: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(sq);
    setTimeout(() => sq.remove(), (duration + delay) * 1000);
  }

  // Create initial batch
  for (let i = 0; i < 20; i++) {
    setTimeout(createSquare, i * 200);
  }
  // Keep creating
  setInterval(createSquare, 400);
}

// ── Scroll Reveal ──────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

// ── Counter Animation ──────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  const isDecimal = target.toString().includes('.');

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * parseFloat(target);
    el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.dataset.counter;
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── Tabs ──────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('[data-tabs]') || btn.parentElement;
      const targetId = btn.dataset.tab;

      // Update buttons
      (btn.closest('.features-tabs') || btn.parentElement).querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content
      const section = btn.closest('section') || document;
      section.querySelectorAll('.features-content').forEach(c => c.classList.remove('active'));
      const target = section.querySelector(`#${targetId}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── Active nav on scroll ───────────────────────────────────
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${sec.id}`);
        });
      }
    });
  });
}

// ── Particle network canvas (optional background) ──────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const count = 60;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,103,31,0.4)';   /* Gulf orange particles */
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255,103,31,${0.15 * (1 - dist / 120)})`; /* Gulf orange lines */
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ── Typewriter Effect ──────────────────────────────────────
function initTypewriter() {
  const el = document.querySelector('.typewriter');
  if (!el) return;

  const words = el.dataset.words ? JSON.parse(el.dataset.words) : [];
  const esWords = el.dataset.wordsEs ? JSON.parse(el.dataset.wordsEs) : words;
  let wordIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const word = currentLang === 'es' ? esWords[wordIdx % esWords.length] : words[wordIdx % words.length];
    if (deleting) {
      el.textContent = word.substring(0, --charIdx);
    } else {
      el.textContent = word.substring(0, ++charIdx);
    }

    let delay = deleting ? 50 : 100;
    if (!deleting && charIdx === word.length) {
      delay = 2000;
      deleting = true;
    } else if (deleting && charIdx === 0) {
      deleting = false;
      wordIdx++;
      delay = 500;
    }
    setTimeout(type, delay);
  }
  type();
}

// ── Form Submit ────────────────────────────────────────────
function initForm() {
  const form = document.querySelector('.contact-form-el');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = currentLang === 'es' ? 'Analizando con IA…' : 'AI analyzing…';

    const payload = {
      first_name: document.getElementById('first-name')?.value || '',
      last_name:  document.getElementById('last-name')?.value  || '',
      email:      document.getElementById('email')?.value      || '',
      company:    document.getElementById('company')?.value    || '',
      budget:     document.getElementById('budget')?.value     || '',
      service_interest: document.getElementById('services')?.value || '',
      message:    document.getElementById('message')?.value    || '',
      source:     'contact_form',
    };

    try {
      const res = await fetch('/app/api/?r=intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      // Build the inline AI reply card
      let card = document.getElementById('ai-reply-card');
      if (!card) {
        card = document.createElement('div');
        card.id = 'ai-reply-card';
        card.style.cssText = 'margin-top:24px;padding:28px;background:linear-gradient(135deg,rgba(255,103,31,0.12),rgba(1,33,105,0.3));border:1px solid rgba(255,103,31,0.35);border-radius:16px;';
        form.appendChild(card);
      }
      const fitLabels = {
        'ai-automations':'AI Automations','ai-agents':'AI Agents','crm':'CRM',
        'ai-websites':'CMS / AI Websites','paid-ads':'Paid Ads',
        'ai-seo':'AI SEO & Content','social':'Social Media'
      };
      const fit = fitLabels[data.service_fit] || data.service_fit || '—';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:22px;">✨</span>
          <strong style="font-family:'Poppins',sans-serif;font-size:18px;">AI Analysis Complete</strong>
          <span style="margin-left:auto;padding:4px 12px;background:rgba(255,103,31,0.2);border-radius:999px;font-size:13px;font-weight:600;color:#FF8A00;">Lead score: ${data.score}/100</span>
        </div>
        <div style="font-size:14px;color:#C8D4E6;margin-bottom:14px;"><strong style="color:#fff;">Recommended service:</strong> ${fit}</div>
        <p style="color:#C8D4E6;line-height:1.6;margin:0;">${(data.reply||'').replace(/\n/g,'<br>')}</p>
      `;
      btn.textContent = currentLang === 'es' ? '¡Enviado! ✓' : 'Sent! ✓';
      btn.style.background = '#10B981';
    } catch (err) {
      btn.textContent = currentLang === 'es' ? 'Error — intenta de nuevo' : 'Error — try again';
      btn.style.background = '#EF4444';
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
      }, 6000);
    }
  });
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Apply saved language
  setLanguage(currentLang);

  initNavbar();
  initMobileMenu();
  initFloatingSquares();
  initScrollReveal();
  initCounters();
  initTabs();
  initActiveNav();
  initParticles();
  initTypewriter();
  initForm();

  // Stagger scroll reveal items
  document.querySelectorAll('.services-grid .glass-card, .testimonials-grid .glass-card, .blog-grid .glass-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
    el.classList.add('scroll-reveal');
  });
});


// ── Welcome Chatbot (auto-loads /js/nwm-chat.js) ──────────────────────────
(function loadNwmChat(){
  if (window.__nwmChatLoaded) return;
  // Load chat script asynchronously so it doesn't block rendering
  function inject(){
    if (document.getElementById('nwm-chat-script')) return;
    const s = document.createElement('script');
    s.id = 'nwm-chat-script';
    s.src = '/js/nwm-chat.js?v=3';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }
  // Wait until after DOM is interactive to avoid competing with critical path
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    setTimeout(inject, 300);
  }
})();

// ── Cookie Consent Banner (GDPR / CCPA / Ley 19.628) ──────────────────────
(function initCookieBanner(){
  if (window.__nwmCookieLoaded) return;
  window.__nwmCookieLoaded = true;

  const COOKIE_NAME = 'nwm_consent';

  function getConsent(){
    const m = document.cookie.match(/(^|;\s*)nwm_consent=([^;]+)/);
    return m ? decodeURIComponent(m[2]) : null;
  }
  function setConsent(value){
    const d = new Date();
    d.setTime(d.getTime() + 365*24*60*60*1000);
    document.cookie = COOKIE_NAME + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    try {
      window.dispatchEvent(new CustomEvent('nwm-consent-change', { detail: { value: value }}));
      if (window.gtag) {
        const grant = (value === 'all');
        gtag('consent', 'update', {
          ad_storage: grant ? 'granted' : 'denied',
          ad_user_data: grant ? 'granted' : 'denied',
          ad_personalization: grant ? 'granted' : 'denied',
          analytics_storage: grant ? 'granted' : 'denied'
        });
      }
    } catch(e){}
  }

  const LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  const T = LANG === 'es' ? {
    title: '🍪 Usamos cookies',
    body: 'Usamos cookies para mejorar tu experiencia, analizar tráfico y mostrar contenido relevante. Cumplimos con GDPR, CCPA y Ley 19.628.',
    accept: 'Aceptar todas',
    essential: 'Solo esenciales',
    learn: 'Más información'
  } : {
    title: '🍪 We use cookies',
    body: 'We use cookies to enhance your experience, analyze traffic, and serve relevant content. We comply with GDPR, CCPA, and Chile\'s Ley 19.628.',
    accept: 'Accept all',
    essential: 'Essential only',
    learn: 'Learn more'
  };

  function mount(){
    if (getConsent()) return; // Already decided
    if (document.getElementById('nwm-cookie-banner')) return;

    const css = `
      #nwm-cookie-banner{position:fixed;left:14px;right:14px;bottom:14px;z-index:9997;max-width:560px;margin:0 auto;background:#0a0e27;border:1px solid rgba(255,107,0,.3);border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.5);padding:18px 20px;color:#fff;font-family:inherit;animation:nwmCookieSlide .35s cubic-bezier(.2,.8,.2,1)}
      @keyframes nwmCookieSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      #nwm-cookie-banner .nwm-c-title{font-weight:700;font-size:14px;margin-bottom:6px}
      #nwm-cookie-banner .nwm-c-body{font-size:13px;color:#b8c4d9;line-height:1.5;margin-bottom:14px}
      #nwm-cookie-banner .nwm-c-body a{color:#FF6B00;text-decoration:none}
      #nwm-cookie-banner .nwm-c-actions{display:flex;flex-wrap:wrap;gap:8px}
      #nwm-cookie-banner button{flex:1;min-width:130px;padding:10px 14px;border-radius:8px;border:0;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:transform .15s,box-shadow .15s}
      #nwm-cookie-banner button:hover{transform:translateY(-1px)}
      #nwm-cookie-banner .nwm-c-accept{background:linear-gradient(135deg,#FF6B00,#ff3d00);color:#fff;box-shadow:0 4px 14px rgba(255,107,0,.3)}
      #nwm-cookie-banner .nwm-c-essential{background:rgba(255,255,255,.06);color:#dde3ee;border:1px solid rgba(255,255,255,.12)}
      @media (max-width:640px){#nwm-cookie-banner{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom, 0px));padding:14px 16px;border-radius:12px}#nwm-cookie-banner .nwm-c-actions{flex-direction:column}#nwm-cookie-banner button{flex:none;width:100%}}
    `;
    const style = document.createElement('style');
    style.id = 'nwm-cookie-style';
    style.textContent = css;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'nwm-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', T.title);
    wrap.innerHTML =
      '<div class="nwm-c-title">' + T.title + '</div>' +
      '<div class="nwm-c-body">' + T.body + ' <a href="/privacy.html#cookies">' + T.learn + ' →</a></div>' +
      '<div class="nwm-c-actions">' +
        '<button class="nwm-c-essential" type="button">' + T.essential + '</button>' +
        '<button class="nwm-c-accept" type="button">' + T.accept + '</button>' +
      '</div>';
    document.body.appendChild(wrap);

    function close(value){
      setConsent(value);
      wrap.style.transition = 'transform .25s, opacity .25s';
      wrap.style.transform = 'translateY(20px)';
      wrap.style.opacity = '0';
      setTimeout(function(){ wrap.remove(); }, 280);
      if (window.gtag) gtag('event', 'cookie_consent', { value: value });
    }
    wrap.querySelector('.nwm-c-accept').addEventListener('click', function(){ close('all'); });
    wrap.querySelector('.nwm-c-essential').addEventListener('click', function(){ close('essential'); });
  }

  // Initialize Google Consent Mode v2 default
  try {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    if (!getConsent()) {
      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500
      });
    }
  } catch(e){}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(mount, 1500); });
  } else {
    setTimeout(mount, 1500);
  }
})();

// ── WhatsApp Floating Chat Button ──────────────────────────
(function nwmWhatsApp(){
  if (window.__nwmWaLoaded) return;
  window.__nwmWaLoaded = true;

  var PHONE = '17407363884';
  var MSG   = encodeURIComponent('Hi! I\u2019d like to learn more about NetWebMedia\u2019s services.');
  var HREF  = 'https://wa.me/' + PHONE + '?text=' + MSG;

  function mount() {
    if (document.getElementById('nwm-wa-btn')) return;

    var style = document.createElement('style');
    style.textContent = [
      '#nwm-wa-btn{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;}',
      '#nwm-wa-bubble{width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.45);transition:transform .2s,box-shadow .2s;}',
      '#nwm-wa-btn:hover #nwm-wa-bubble{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,.6);}',
      '#nwm-wa-label{background:#fff;color:#111;font-size:13px;font-weight:600;padding:6px 12px;border-radius:20px;box-shadow:0 2px 10px rgba(0,0,0,.15);white-space:nowrap;opacity:0;transform:translateX(8px);transition:opacity .2s,transform .2s;}',
      '#nwm-wa-btn:hover #nwm-wa-label{opacity:1;transform:translateX(0);}',
      '@media(max-width:480px){#nwm-wa-label{display:none;}#nwm-wa-btn{bottom:16px;right:16px;}}'
    ].join('');
    document.head.appendChild(style);

    var btn = document.createElement('a');
    btn.id   = 'nwm-wa-btn';
    btn.href = HREF;
    btn.target = '_blank';
    btn.rel    = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Chat with NetWebMedia on WhatsApp');

    btn.innerHTML =
      '<span id="nwm-wa-label">Chat on WhatsApp</span>' +
      '<span id="nwm-wa-bubble">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">' +
          '<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.003 18a7.97 7.97 0 01-4.07-1.113l-.292-.173-3.03.863.875-2.96-.19-.302A7.964 7.964 0 014 12c0-4.411 3.589-8 8.003-8C16.41 4 20 7.589 20 12s-3.589 8-7.997 8zm4.404-5.956c-.242-.121-1.43-.705-1.651-.786-.222-.08-.383-.12-.545.121-.161.242-.625.786-.766.947-.14.162-.282.182-.524.061-.242-.121-1.022-.376-1.947-1.2-.72-.641-1.206-1.432-1.348-1.674-.14-.242-.015-.372.106-.493.109-.108.242-.282.363-.423.12-.14.161-.242.242-.403.08-.162.04-.303-.02-.424-.061-.12-.545-1.313-.747-1.798-.196-.472-.396-.408-.544-.415l-.464-.008a.891.891 0 00-.645.303c-.222.242-.847.828-.847 2.02 0 1.192.868 2.344.988 2.505.121.162 1.707 2.607 4.136 3.655.578.25 1.028.398 1.38.51.58.184 1.108.158 1.525.096.465-.07 1.43-.585 1.632-1.15.2-.564.2-1.048.14-1.149-.06-.1-.222-.16-.464-.282z"/>' +
        '</svg>' +
      '</span>';

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

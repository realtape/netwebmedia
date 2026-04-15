/* ============================================================
   NetWebMedia — Main JavaScript
   ============================================================ */

// ── Language Translations ──────────────────────────────────
const translations = {
  en: {
    nav_services: "Services",
    nav_about: "About",
    nav_results: "Results",
    nav_blog: "Blog",
    nav_contact: "Contact",
    nav_cta: "Get a Free Audit",
    nav_signin: "Client Login",
    hero_badge: "🏆 Top AI Marketing Agency 2025",
    hero_title_1: "Your Brand Deserves",
    hero_title_2: "AI-Powered",
    hero_title_3: "Growth",
    hero_desc: "NetWebMedia is the AI marketing agency that combines data intelligence, autonomous agents, and proven growth strategies to 10x your brand's performance.",
    hero_cta1: "Get Free Strategy Call",
    hero_cta2: "See Our Results",
    hero_stat1_num: "500+",
    hero_stat1_label: "Brands Grown",
    hero_stat2_num: "340%",
    hero_stat2_label: "Avg. ROI Increase",
    hero_stat3_num: "4.9★",
    hero_stat3_label: "Client Satisfaction",
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
    footer_tagline: "La agencia de marketing AI más avanzada del mundo. Combinamos creatividad humana con inteligencia machine para entregar un crecimiento sin precedentes.",
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
}

// ── Mobile Menu ────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
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

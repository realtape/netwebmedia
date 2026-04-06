/* ============================================================
   NetWebMedia - Main JavaScript
   ============================================================ */

// -- Language Translations ----------------------------------
const translations = {
  en: {
    // Navigation
    nav_services: "Services",
    nav_about: "About",
    nav_results: "Results",
    nav_blog: "Blog",
    nav_contact: "Contact",
    nav_cta: "Get a Free Audit",
    nav_signin: "Client Login",
    nav_client_login: "Client Login",
    nav_free_audit: "Get a Free Audit",
    
    // Hero
    hero_badge: "Top AI Marketing Agency 2025",
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
    
    // Services Section
    services_label: "What We Do",
    services_title: "Full-Stack AI Marketing Services",
    services_subtitle: "From AI-powered SEO to autonomous ad campaigns - we run it all on autopilot while you focus on building your business.",
    services_more: "Learn More →",
    services_title_hero: "AI Marketing Services Built for 10x Growth",
    services_explore: "Explore Services ↓",
    
    // Process
    process_label: "Our Process",
    process_title: "From Strategy to Revenue",
    process_subtitle: "Four steps from audit to accelerated growth",
    step1_title: "Deep AI Audit",
    step1_desc: "We analyze your entire digital footprint using AI to uncover hidden opportunities and competitive gaps.",
    step2_title: "Custom Strategy",
    step2_desc: "We build a bespoke, data-driven growth plan tailored to your industry, audience, and business goals with clear KPIs.",
    step3_title: "Execute & Optimize",
    step3_desc: "Our AI agents deploy campaigns simultaneously, running continuous experiments and optimizations in real-time.",
    step4_title: "Scale & Dominate",
    step4_desc: "We systematically scale what works, doubling down on winning channels while identifying new growth vectors.",
    
    // Results
    results_label: "Proven Results",
    results_title: "Numbers That Speak",
    results_subtitle: "Real results for real businesses. Here's what AI-powered marketing delivers.",
    results_title_hero: "Success Stories Powered by AI",
    res_roi_label: "Average ROI Increase",
    res_roi_sub: "across all client campaigns",
    res_brands_label: "Brands Grown",
    res_brands_sub: "across 40+ industries worldwide",
    res_conv_label: "Higher Conversion Rate",
    res_conv_sub: "vs. traditional digital agencies",
    res_cac_label: "Lower Customer Acquisition Cost",
    res_cac_sub: "with active AI visibility strategy",
    
    // Testimonials
    testimonials_label: "Client Success Stories",
    testimonials_title: "What Our Clients Say",
    
    // AI Tools
    tools_label: "Powered by AI",
    tools_title: "Your Marketing on Autopilot",
    tools_subtitle: "Our proprietary AI stack runs your campaigns, creates content, analyzes data, and identifies opportunities - 24/7.",
    tool1_title: "AI Campaign Lab",
    tool1_desc: "Generates, tests, and optimizes ad creative across all channels simultaneously.",
    tool2_title: "Content Factory AI",
    tool2_desc: "Produces high-volume, brand-aligned content at scale.",
    tool5_title: "AI Experience Agents",
    tool5_desc: "24/7 intelligent agents embedded in your website that engage visitors.",
    
    // Comparison
    comp_label: "vs. The Competition",
    comp_title: "The Best of the Top 10 AI Agencies - Combined",
    comp_subtitle: "We studied what every top AI agency does best. Then we built one that does all of it - better.",
    
    // CTA
    cta_label: "Limited Spots Available",
    cta_title: "Ready to Dominate Your Market?",
    cta_subtitle: "Get a free AI marketing audit and discover exactly where your competitors are beating you.",
    cta_btn: "Book Your Free Strategy Call",
    cta_secondary: "Explore Services",
    
    // Footer
    footer_tagline: "The world's most advanced AI marketing agency combining human creativity with machine intelligence to deliver unprecedented growth.",
    footer_addr: "Miami, FL - New York, NY - Mexico City, MX",
    footer_rights: "- 2025 NetWebMedia. All rights reserved.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    
    // Forms
    form_fname: "First Name",
    form_lname: "Last Name",
    form_email: "Business Email",
    form_company: "Company / Website",
    form_budget: "Monthly Marketing Budget",
    form_interest: "Services You're Interested In",
    form_message: "Tell Us About Your Goals",
    form_submit: "Send Message & Get Free Audit →",
    form_success: "Sent! ✓",
    form_sending: "Sending...",
    form_first_name: "First Name",
    form_first_name_placeholder: "e.g. John",
    form_last_name: "Last Name",
    form_last_name_placeholder: "e.g. Doe",
    form_email_placeholder: "john@company.com",
    form_company_placeholder: "company.com",
    form_budget_select: "Select a range...",
    form_budget_5k: "$1,000 - $5,000/mo",
    form_budget_10k: "$5,000 - $10,000/mo",
    form_budget_25k: "$10,000 - $25,000/mo",
    form_budget_50k: "$25,000 - $50,000/mo",
    form_budget_50k_plus: "$50,000+/mo",
    form_services_select: "Select service...",
    form_services_seo: "AI-Powered SEO",
    form_services_aeo: "Answer Engine Optimization (AEO)",
    form_services_ppc: "Paid Search & PPC",
    form_services_social: "Social Media Advertising",
    form_services_content: "AI Content Marketing",
    form_services_cro: "Conversion Rate Optimization",
    form_services_analytics: "Marketing Analytics",
    form_services_agents: "AI Experience Agents",
    form_services_cmo: "Fractional CMO",
    form_services_full: "Full-Service Package",
    form_message_placeholder: "What are your top growth goals?",
    form_submit_btn: "Send Message & Get Free Audit →",
    form_privacy_note: "100% confidential. We never share your information.",
    
    // Footer Links
    foot_seo: "AI-Powered SEO",
    foot_aeo: "Answer Engine Optimization",
    foot_ppc: "AI Paid Search",
    foot_social: "Social Media Ads",
    foot_content: "AI Content Marketing",
    foot_cro: "CRO",
    foot_analytics: "Marketing Analytics",
    foot_cmo: "Fractional CMO",
    foot_team: "Team",
    foot_careers: "Careers",

    // Page Specific
    page_title: "NetWebMedia - #1 AI Marketing Agency | 10x Your Growth",
    page_title_about: "About Us - NetWebMedia AI Marketing Agency",
    page_title_services: "Services - NetWebMedia AI Marketing Agency",
    page_title_results: "Our Results - NetWebMedia AI Marketing Agency",
    page_title_blog: "Blog - Insights on AI Marketing | NetWebMedia",
    page_title_contact: "Contact Us - NetWebMedia AI Marketing Agency",
    
    contact_title_hero: "Build Your AI Advantage",
    contact_subtitle: "Ready to dominate your market with autonomous marketing? Book your free audit today.",
    contact_form_title: "Send Us a Message",
    contact_form_subtitle: "Fill out the form below and we'll get back to you within 24 hours.",
    
    blog_title_hero: "AI Insights & Growth Strategies",
    blog_subtitle: "The latest engineering-led insights on how AI is reshaping the marketing landscape.",
    
    contact_info_title: "Talk to a Human",
    contact_info_email_label: "Email",
    contact_info_phone_label: "Phone (US)",
    contact_info_offices_label: "Offices",
    contact_info_offices_value: "Miami - New York - Mexico City",
    contact_info_response_label: "Response Time",
    contact_info_response_value: "Within 24 hours (usually faster)",
    
    what_next_title: "What Happens Next?",
    what_next_step1_title: "We Review Your Submission",
    what_next_step1_desc: "Our team analyzes your needs within 24 hours.",
    what_next_step2_title: "Free AI Audit",
    what_next_step2_desc: "We identify your biggest growth opportunities.",
     what_next_step3_title: "Strategy Call",
    what_next_step3_desc: "30-min call with our growth experts to present findings.",
    what_next_step4_title: "Custom Growth Plan",
    what_next_step4_desc: "Tailored proposal with clear ROI projections.",
    
    // Metadata
    meta_desc: "NetWebMedia helps growth-focused teams connect SEO, paid media, and AI automation into one clear marketing system.",
    meta_desc_about: "Learn about NetWebMedia, the agency built on AI and data science to drive 10x growth for innovative brands.",
    meta_desc_services: "Explore our AI marketing services: SEO, AEO, Paid Media, Content AI, and autonomous growth agents.",
    meta_desc_results: "See the data and case studies of how we've scaled brands with AI-powered marketing.",
    meta_desc_blog: "Stay ahead of the curve with insights on AI marketing and autonomous growth strategies.",
    meta_desc_contact: "Ready to 10x your growth? Contact our AI marketing experts today.",
  },
  es: {
    // Navigation
    nav_services: "Servicios",
    nav_about: "Nosotros",
    nav_results: "Resultados",
    nav_blog: "Blog",
    nav_contact: "Contacto",
    nav_cta: "Auditor-a Gratis",
    nav_signin: "Acceso Cliente",
    nav_client_login: "Acceso Cliente",
    nav_free_audit: "Auditor-a Gratis",
    
    // Hero
    hero_badge: "?? Mejor Agencia de Marketing IA 2025",
    hero_title_1: "Tu Marca Merece",
    hero_title_2: "Crecimiento",
    hero_title_3: "con IA",
    hero_desc: "NetWebMedia es la agencia de marketing IA que combina inteligencia de datos, agentes aut-nomos y estrategias probadas para multiplicar por 10 el rendimiento de tu marca.",
    hero_cta1: "Llamada Estrat-gica Gratis",
    hero_cta2: "Ver Nuestros Resultados",
    hero_stat1_num: "500+",
    hero_stat1_label: "Marcas Impulsadas",
    hero_stat2_num: "340%",
    hero_stat2_label: "Aumento Promedio ROI",
    hero_stat3_num: "4.9★",
    hero_stat3_label: "Satisfacci-n del Cliente",
    
    clients_label: "Confiado por marcas innovadoras en todo el mundo",
    
    services_label: "Qu- Hacemos",
    services_title: "Servicios de Marketing IA Completos",
    services_subtitle: "Desde SEO impulsado por IA hasta campa-as aut-nomas - lo gestionamos todo en piloto autom-tico.",
    services_more: "Saber M-s ?",
    services_title_hero: "Servicios de Marketing IA para un Crecimiento 10x",
    services_explore: "Explorar Servicios ?",
    
    // Process
    process_label: "Nuestro Proceso",
    process_title: "De la Estrategia a los Ingresos",
    process_subtitle: "Cuatro pasos desde la auditor-a hasta el crecimiento",
    step1_title: "Auditor-a IA Profunda",
    step1_desc: "Analizamos tu huella digital completa para descubrir oportunidades.",
    step2_title: "Estrategia Personalizada",
    step2_desc: "Creamos un plan de crecimiento a medida basado en datos.",
    step3_title: "Ejecutar y Optimizar",
    step3_desc: "Nuestros agentes IA despliegan campa-as y optimizan en tiempo real.",
    step4_title: "Escalar y Dominar",
    step4_desc: "Escalamos lo que funciona e identificamos nuevos vectores.",
    
    // Results
    results_label: "Resultados Probados",
    results_title: "N-meros que Hablan",
    results_subtitle: "Resultados reales para negocios reales.",
    results_title_hero: "Historias de -xito Potenciadas por IA",
    res_roi_label: "Aumento Promedio ROI",
    res_roi_sub: "en todas las campa-as de clientes",
    res_brands_label: "Marcas Impulsadas",
    res_brands_sub: "en m-s de 40 industrias",
    res_conv_label: "Tasa de Conversi-n Mayor",
    res_conv_sub: "vs. agencias tradicionales",
    res_cac_label: "Menor Costo de Adquisici-n",
    res_cac_sub: "con estrategia activa IA",
    
    // Testimonials
    testimonials_label: "Historias de -xito",
    testimonials_title: "Lo Que Dicen Nuestros Clientes",
    
    // AI Tools
    tools_label: "Potenciado por IA",
    tools_title: "Tu Marketing en Piloto Autom-tico",
    tools_subtitle: "Nuestro stack de IA propio gestiona tus campa-as 24/7.",
    tool1_title: "Lab de Campa-as IA",
    tool1_desc: "Prueba y optimiza creatividades autom-ticamente.",
    tool2_title: "F-brica de Contenido IA",
    tool2_desc: "Produce contenido alineado con la marca a escala.",
    tool5_title: "Agentes de Experiencia IA",
    tool5_desc: "Agentes inteligentes que interact-an con visitas 24/7.",
    
    // Comparison
    comp_label: "vs. La Competencia",
    comp_title: "Lo mejor de las 10 mejores agencias - Combinado",
    comp_subtitle: "Estudiamos a los mejores y lo hicimos a-n mejor.",
    
    // CTA
    cta_label: "Cupos Limitados",
    cta_title: "-Listo para Dominar tu Mercado?",
    cta_subtitle: "Obt-n una auditor-a de marketing IA gratis.",
    cta_btn: "Reserva tu Llamada Gratis",
    cta_secondary: "Explorar Servicios",
    
    // Footer
    footer_tagline: "La agencia de marketing IA m-s avanzada del mundo combinando creatividad humana e inteligencia artificial.",
    footer_addr: "Miami - New York - Ciudad de M-xico",
    footer_rights: "- 2025 NetWebMedia. Todos los derechos reservados.",
    footer_privacy: "Privacidad",
    footer_terms: "T-rminos",
    
    // Forms
    form_fname: "Nombre",
    form_lname: "Apellido",
    form_email: "Email de Negocios",
    form_company: "Empresa / Web",
    form_budget: "Presupuesto Mensual",
    form_interest: "Intereses",
    form_message: "Tus Objetivos",
    form_submit: "Enviar y Obtener Auditor-a Gratis ?",
    form_success: "-Enviado! ?",
    form_sending: "Enviando...",
    form_first_name: "Nombre",
    form_first_name_placeholder: "ej. Juan",
    form_last_name: "Apellido",
    form_last_name_placeholder: "ej. P-rez",
    form_email_placeholder: "juan@empresa.com",
    form_company_placeholder: "empresa.com",
    form_budget_select: "Seleccionar rango...",
    form_budget_5k: "$1,000 - $5,000/mes",
    form_budget_10k: "$5,000 - $10,000/mes",
    form_budget_25k: "$10,000 - $25,000/mes",
    form_budget_50k: "$25,000 - $50,000/mes",
    form_budget_50k_plus: "$50,000+/mes",
    form_services_select: "Seleccionar servicio...",
    form_services_seo: "SEO Potenciado por IA",
    form_services_aeo: "Optimizaci-n de Motores de Respuesta (AEO)",
    form_services_ppc: "B-squeda Pagada y PPC",
    form_services_social: "Publicidad en Redes Sociales",
    form_services_content: "Marketing de Contenidos IA",
    form_services_cro: "Optimizaci-n de Conversi-n",
    form_services_analytics: "Anal-tica de Marketing",
    form_services_agents: "Agentes de Experiencia IA",
    form_services_cmo: "CMO Fraccionado",
    form_services_full: "Paquete de Servicio Completo",
    form_message_placeholder: "-Cu-les son tus objetivos de crecimiento?",
    form_submit_btn: "Enviar Mensaje y Obtener Auditor-a Gratis ?",
    form_privacy_note: "?? 100% confidencial. No compartimos tu informaci-n.",
    
    // Footer Links
    foot_seo: "SEO con IA",
    foot_aeo: "AEO",
    foot_ppc: "B-squeda Pagada",
    foot_social: "Ads en Redes",
    foot_content: "Contenido IA",
    foot_cro: "CRO",
    foot_analytics: "Anal-tica IA",
    foot_cmo: "CMO Fraccionado",
    foot_team: "Equipo",
    foot_careers: "Carreras",

    // Page Specific
    page_title: "NetWebMedia - Agencia #1 de Marketing IA",
    page_title_about: "Nosotros - Agencia de Marketing IA NetWebMedia",
    page_title_services: "Servicios - Agencia de Marketing IA NetWebMedia",
    page_title_results: "Resultados - Agencia de Marketing IA NetWebMedia",
    page_title_blog: "Blog - Insights de Marketing IA | NetWebMedia",
    page_title_contact: "Contacto - Agencia de Marketing IA NetWebMedia",
    
    contact_title_hero: "Construye tu Ventaja Competitiva con IA",
    contact_subtitle: "-Listo para dominar tu mercado? Reserva tu auditor-a gratuita hoy.",
    contact_form_title: "Env-anos un Mensaje",
    contact_form_subtitle: "Completa el formulario y te contactaremos en menos de 24 horas.",
    
    blog_title_hero: "Insights de IA y Estrategias de Crecimiento",
    blog_subtitle: "Los -ltimos an-lisis sobre c-mo la IA est- transformando el marketing.",
    
    contact_info_title: "Habla con un Humano",
    contact_info_email_label: "Email",
    contact_info_phone_label: "Tel-fono (US)",
    contact_info_offices_label: "Oficinas",
    contact_info_offices_value: "Miami - New York - CDMX",
    contact_info_response_label: "Tiempo de Respuesta",
    contact_info_response_value: "Menos de 24 horas (usualmente m-s r-pido)",
    
    what_next_title: "-Qu- Sigue Ahora?",
    what_next_step1_title: "Revisamos tu Solicitud",
    what_next_step1_desc: "Nuestro equipo analiza tus necesidades en 24 horas.",
    what_next_step2_title: "Auditor-a IA Gratuita",
    what_next_step2_desc: "Identificamos tus mayores oportunidades de crecimiento.",
    what_next_step3_title: "Llamada Estrat-gica",
    what_next_step3_desc: "Llamada de 30 min para presentar hallazgos.",
    what_next_step4_title: "Plan de Crecimiento Personalizado",
    what_next_step4_desc: "Propuesta a medida con proyecciones de ROI.",
    
    social_proof_rating: "4.9/5 de 200+ rese-as de clientes",
    social_proof_quote: "\"Respondieron el mismo d-a con una auditor-a detallada. Tres meses despu-s, nuestro tr-fico se triplic-.\"",
    social_proof_author: "- James Martinez, CEO en TechVentures",
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
      if (el.tagName === 'TITLE') {
        document.title = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  // 1b. Update meta tags with [data-i18n-met]
  document.querySelectorAll('[data-i18n-met]').forEach(el => {
    const key = el.getAttribute('data-i18n-met');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('content', translations[lang][key]);
    }
  });

  // 2. Update all [data-en] / [data-es] elements
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'es' ? el.getAttribute('data-es') : el.getAttribute('data-en');
    if (text) el.textContent = text;
  });

  // 3. Update placeholder attributes
  document.querySelectorAll('[data-i18n-p]').forEach(el => {
    const key = el.getAttribute('data-i18n-p');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // 4. Update titles (Aria-labels or title attributes)
  document.querySelectorAll('[data-i18n-t]').forEach(el => {
    const key = el.getAttribute('data-i18n-t');
    if (translations[lang] && translations[lang][key]) {
      el.title = translations[lang][key];
    }
  });

  // 5. Toggle active state on lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // 6. Update HTML lang attribute
  document.documentElement.lang = lang;
}

// -- Shared Component Sync -------------------------------
function syncComponents() {
  const footerTagline = document.querySelector('footer .footer-brand p');
  if (footerTagline && !footerTagline.hasAttribute('data-i18n')) {
    footerTagline.setAttribute('data-i18n', 'footer_tagline');
  }
}

// -- Navbar Scroll Effect -----------------------------------
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// -- Mobile Menu --------------------------------------------
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

// -- Floating Squares --------------------------------------
function initFloatingSquares() {
  const container = document.querySelector('.squares-container');
  if (!container) return;
  const colors = ['#FF671F','#FF8C42','#012169','#004B87','#FF9A6C','#FFB347','#0047AB'];

  function createSquare() {
    const sq = document.createElement('div');
    sq.className = 'sq';
    const size = Math.random() * 30 + 10;
    const x = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    sq.style.cssText = `width:${size}px;height:${size}px;left:${x}%;bottom:-50px;border-color:${color};animation-duration:${duration}s;animation-delay:${delay}s;`;
    container.appendChild(sq);
    setTimeout(() => sq.remove(), (duration + delay) * 1000);
  }
  for(let i=0;i<20;i++) setTimeout(createSquare, i*200);
  setInterval(createSquare, 400);
}

// -- Scroll Reveal ------------------------------------------
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

// -- Counter Animation --------------------------------------
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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, el.dataset.counter, el.dataset.suffix || '');
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
}

// -- Tabs --------------------------------------------------
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      const section = btn.closest('section') || document;
      section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      section.querySelectorAll('.features-content').forEach(c => c.classList.remove('active'));
      const target = section.querySelector(`#${targetId}`);
      if (target) target.classList.add('active');
    });
  });
}

// -- Particle Network --------------------------------------
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  for (let i = 0; i < 60; i++) {
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
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,103,31,0.4)'; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255,103,31,${0.15 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

// -- Typewriter --------------------------------------------
function initTypewriter() {
  const el = document.querySelector('.typewriter');
  if (!el) return;
  const words = el.dataset.words ? JSON.parse(el.dataset.words) : [];
  let wordIdx = 0, charIdx = 0, deleting = false;
  function type() {
    const word = words[wordIdx % words.length];
    el.textContent = deleting ? word.substring(0, --charIdx) : word.substring(0, ++charIdx);
    let delay = deleting ? 50 : 100;
    if (!deleting && charIdx === word.length) { delay = 2000; deleting = true; }
    else if (deleting && charIdx === 0) { deleting = false; wordIdx++; delay = 500; }
    setTimeout(type, delay);
  }
  type();
}

// -- Contact Form -------------------------------------------
function initForm() {
  const form = document.querySelector('.contact-form-el');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang].form_sending;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = translations[currentLang].form_success;
      btn.style.background = '#10B981';
      form.reset();
      setTimeout(() => { btn.textContent = originalText; btn.style.background = ''; btn.disabled = false; }, 3000);
    }, 1500);
  });
}

// -- Init ---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
  setLanguage(currentLang);
  syncComponents();
  initNavbar();
  initMobileMenu();
  initFloatingSquares();
  initScrollReveal();
  initCounters();
  initTabs();
  initParticles();
  initTypewriter();
  initForm();
  document.querySelectorAll('.services-grid .glass-card, .testimonials-grid .glass-card, .blog-grid .glass-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
    el.classList.add('scroll-reveal');
  });
});

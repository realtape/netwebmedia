/* ==========================================================================
   NWM Prospect Welcome Chatbot
   Version: 1.0.0 (2026-04-20)

   Floating chat bubble (bottom-left) that welcomes visitors, qualifies
   intent, answers common questions, captures leads, and hands off to
   WhatsApp / Calendly / Sales.

   Bilingual (EN / ES) — language detected from <html lang> or localStorage.
   Auto-mounts on all pages that load /js/main.js (via nwm-chat.js include).

   Design goals:
   - Zero external dependencies
   - Works without the API (intent + content routing is client-side)
   - Hands off to WhatsApp once a conversation gets complex
   - Analytics events fire on every intent + outcome
   - Cookie-based dismissal + re-open logic
   ========================================================================== */

(function NWMChat(){
  'use strict';

  if (window.__nwmChatLoaded) return;
  window.__nwmChatLoaded = true;

  // ── Configuration ────────────────────────────────────────────────────────
  const NWM_BASE = window.NWM_API_BASE || '';
  const CONFIG = {

    seenCookie:      'nwm_chat_seen',
    dismissCookie:   'nwm_chat_dismissed',
    sessionKey:      'nwm_chat_session_v1',
    tooltipDelayMs:  4000,
    openAutoDelayMs: 0,               // 0 = never auto-open; set >0 to auto-open
    emailEndpoint:   NWM_BASE + '/api/public/newsletter/subscribe',
    leadEndpoint:    NWM_BASE + '/api/public/forms/submit',
    chatEndpoint:    NWM_BASE + '/api/public/chat'
  };

  // ── Language detection ───────────────────────────────────────────────────
  const LANG = (function(){
    try {
      const saved = localStorage.getItem('nwm_lang');
      if (saved === 'es' || saved === 'en') return saved;
    } catch(e){}
    const htmlLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return htmlLang.startsWith('es') ? 'es' : 'en';
  })();

  // ── Nurture content library (bilingual) ──────────────────────────────────
  const CONTENT = {
    en: {
      buttonAria: 'Open NetWebMedia chat',
      tooltip: '👋 Need help? Chat with us',
      botName: 'NWM Assistant',
      botTagline: 'AI-powered · Replies instantly',
      greeting: "👋 Hi! I'm NWM — your AI marketing guide. Our star products are the **Fractional CMO packages**: strategy + software + full execution starting at $249/mo. I can help you find the right tier, get a quote, or run a free audit.",
      greeting2: 'What would you like to do?',
      thinking: 'typing…',
      youLabel: 'You',
      inputPlaceholder: 'Type a message…',
      inputSend: 'Send',
      footerPoweredBy: 'Powered by NetWebMedia AI',
      menuIntents: [
        { id: 'pricing',  label: '⭐ CMO packages & pricing' },
        { id: 'audit',    label: '🎯 Get a free audit' },
        { id: 'services', label: '🚀 What do you offer?' },
        { id: 'industry', label: '🏢 Help for my industry' },
        { id: 'partner',  label: '💼 I\'m an agency (white-label)' },
        { id: 'human',    label: '💬 Talk to a human' }
      ],
      intents: {
        services: {
          reply: "We're a full-stack AI marketing agency — built for the AEO era.\n\n• **Answer Engine Optimization (AEO)** — Get cited by ChatGPT, Perplexity & Google AI Overviews where buyers already search\n• **NWM CRM** — AI CRM with pipelines, email, SMS, AI SDR on WhatsApp\n• **NWM CMS** — Bilingual websites in under 60s\n• **Email Marketing** — AI-written campaigns, full automation\n• **Video Factory** — AI-produced Reels/TikToks (16 Reels/mo on Scale)\n• **AI Fractional CMO** — 24/7 strategy agent + human accountability\n\nOne retainer replaces 4–6 vendors. Which one interests you most?",
          replies: [
            { id: 'services-aeo',    label: '🔍 AEO',     href: '/aeo-agency.html' },
            { id: 'services-crm',    label: '📊 CRM',     href: '/nwm-crm.html' },
            { id: 'services-cms',    label: '🌐 CMS',     href: '/nwm-cms.html' },
            { id: 'services-email',  label: '✉️ Email',   href: '/email-marketing.html' },
            { id: 'services-video',  label: '🎬 Video',   href: '/services.html#video' },
            { id: 'services-cmo',    label: '🧠 AI CMO',  href: '/services.html#fractional-cmo' },
            { id: 'back',            label: '← Back',     action: 'menu' }
          ]
        },
        pricing: {
          reply: "**Fractional CMO Packages** ⭐ (our star products):\n\n🚀 **CMO Lite — $249/mo** · no setup\n AEO + SEO + content calendar, NWM CRM included, monthly strategy note\n\n📈 **CMO Growth — $999/mo** + $499 setup *(most popular)*\n Everything in Lite + Google/Meta ads, social content, email automation, AI SDR + lead qualification\n Ad spend billed at cost + 12% (min $300/mo)\n\n⭐ **CMO Scale — $2,499/mo** + $999 setup\n Everything in Growth + Video Factory (16 Reels/mo), custom AI agents + voice AI, dedicated strategist, daily Slack access\n\nPay annually and save **15%** · Lite $2,540/yr · Growth $10,190/yr · Scale $25,490/yr\n90-day minimum, then month-to-month.\n\n**Platform only (DIY):** CRM Starter $49 · Pro $249 · Agency $449/mo\n\nWhich tier fits your budget?",
          replies: [
            { id: 'pricing-page',   label: '💳 See full pricing',   href: '/pricing.html' },
            { id: 'pricing-quote',  label: '📝 Get custom quote',   action: 'audit' },
            { id: 'pricing-bundle', label: '📦 Which bundle is best?', action: 'bundle' },
            { id: 'back',           label: '← Back',                action: 'menu' }
          ]
        },
        bundle: {
          reply: "Tell me about your business in one line and I'll recommend the best bundle:",
          replies: [
            { id: 'bundle-real-estate',    label: '🏠 Real Estate',        action: 'rec-real-estate' },
            { id: 'bundle-health',         label: '🏥 Healthcare',         action: 'rec-health' },
            { id: 'bundle-home-services',  label: '🔨 Home Services',      action: 'rec-home-services' },
            { id: 'bundle-ecom',           label: '🛒 E-commerce',         action: 'rec-ecom' },
            { id: 'bundle-local',          label: '📍 Local service biz',  action: 'rec-local' },
            { id: 'bundle-hospitality',    label: '🍽️ Hospitality',        action: 'rec-hospitality' },
            { id: 'bundle-b2b',            label: '💼 B2B / SaaS',         action: 'rec-b2b' },
            { id: 'bundle-finance',        label: '💰 Finance',            action: 'rec-finance' },
            { id: 'bundle-agency',         label: '🏢 Marketing agency',   action: 'partner' },
            { id: 'back',                  label: '← Back',                action: 'menu' }
          ]
        },
        'rec-home-services': {
          reply: "For contractors, plumbers, electricians, HVAC & landscaping we recommend **Growth Stack**: CRM job pipeline + Website + Google/Meta Ads + AI SDR on WhatsApp 24/7. Starts at $997/mo.\n\nExpected: 50-90% more booked jobs in 90 days. The AI handles all initial inquiries on WhatsApp so you close jobs, not messages. 40% fewer no-shows with automated reminders.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',         action: 'audit' },
            { id: 'async-audit', label: '💬 WhatsApp us', href: 'https://wa.me/17407363884?text=Hi%20NetWebMedia%2C%20I%20need%20help%20with%20home%20services.' },
            { id: 'back',        label: '← Back',                action: 'menu' }
          ]
        },
        'rec-real-estate': {
          reply: "For real estate we recommend the **Grow bundle**: NWM CRM + IDX-connected CMS + Email + WhatsApp automation + AI lead qualification. Starts at $2,997/mo.\n\nExpected: 60-120% more qualified inquiries by month 3, 18-day avg DOM, full agent pipeline visibility.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'see-template', label: '🏠 See real estate templates', href: '/industries/real-estate/template-1.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-health': {
          reply: "For healthcare/wellness we recommend **Grow bundle** with HIPAA-aware setup: NWM CRM (patient pipeline) + Wellness CMS + Email + Appointment automation. Starts at $2,997/mo.\n\nExpected: 40-70% more booked appointments, 30%+ no-show reduction with WhatsApp reminders.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'see-template', label: '🏥 See healthcare templates', href: '/industries/healthcare/template-1.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-hospitality': {
          reply: "For restaurants/hotels/cafes we recommend **Launch bundle**: CMS site + Reservations + Email/SMS + Reviews automation. Starts at $1,295/mo.\n\nExpected: 25-50% more direct bookings (skip the OTA fees), automated review requests, table management.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'see-template', label: '🍽️ See hospitality templates', href: '/industries/hospitality/template-1.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-finance': {
          reply: "For finance/insurance we recommend **Scale bundle**: AI CMO + CRM (compliance-aware) + Content + Lead nurture. Starts at $4,497/mo.\n\nExpected: 50-100% AUM pipeline growth, automated client comms, full audit trail for FINRA/insurance regs.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'see-template', label: '💰 See finance templates', href: '/industries/finance/template-1.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-ecom': {
          reply: "For e-commerce we recommend the **Lead Machine bundle**: NWM CRM + Email Marketing + Paid Ads. Starts around $497/mo with bundle discount.\n\nExpected: 3-5x ROAS on ads + 25-35% email revenue share by month 3.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-local': {
          reply: "For local service businesses we recommend **Growth Stack**: CRM + Website + SEO + Google Business. Starts at $997/mo with bundle discount.\n\nExpected: 40-80% more inbound leads by month 3, local top-3 rankings by month 6.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        'rec-b2b': {
          reply: "For B2B / SaaS we recommend **Full CMO**: AI Fractional CMO + Content + LinkedIn Ads + CRM. Starts at $1,999/mo.\n\nExpected: 50-120% pipeline growth by month 3, senior strategy 24/7 via Claude-powered AI CMO.",
          replies: [
            { id: 'audit-start', label: '🎯 Run free audit',  action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'back',        label: '← Back',             action: 'menu' }
          ]
        },
        audit: {
          reply: "Drop your website URL and email — I'll send you a **free 90-day growth roadmap within 48 hours**. No sales pressure.",
          mode: 'form',
          fields: [
            { name: 'website', label: 'Your website', type: 'url',   required: true, placeholder: 'https://yoursite.com' },
            { name: 'email',   label: 'Your email',   type: 'email', required: true, placeholder: 'you@company.com' },
            { name: 'name',    label: 'Your name',    type: 'text',  required: false, placeholder: 'Optional' }
          ],
          submitLabel: 'Send my free audit',
          success: "🎉 Got it! We'll email your 90-day growth roadmap within 48 hours. In the meantime, is there anything else I can help with?",
          replies: [
            { id: 'services-intent', label: '🚀 Services',    action: 'services' },
            { id: 'pricing-intent',  label: '💰 Pricing',     action: 'pricing' },
            { id: 'human',           label: '💬 Talk to human', action: 'human' }
          ]
        },
        partner: {
          reply: "Partner program: white-label our CRM, CMS, Email, Video, and AI CMO from **$249/mo**. Keep **50-70%** of client revenue. Unlimited client sub-accounts.\n\nWhich are you interested in?",
          replies: [
            { id: 'partner-tiers',  label: '💼 See all tiers',       href: '/partners.html#tiers' },
            { id: 'partner-calc',   label: '🧮 Margin calculator',   href: '/partners.html#calculator' },
            { id: 'partner-apply',  label: '📝 Apply to program',    href: '/partners.html#partner-signup' },
            { id: 'partner-faq',    label: '❓ Partner FAQs',        href: '/faq.html#cat-partners' },
            { id: 'back',           label: '← Back',                 action: 'menu' }
          ]
        },
        industry: {
          reply: "Which industry are you in?",
          replies: [
            { id: 'ind-real-estate',    label: '🏠 Real Estate',        action: 'ind-gen-real-estate' },
            { id: 'ind-health',         label: '🏥 Healthcare',         action: 'ind-gen-health' },
            { id: 'ind-home-services',  label: '🔨 Home Services',      action: 'ind-gen-home-services' },
            { id: 'ind-ecom',           label: '🛍️ E-commerce',         action: 'ind-gen-ecom' },
            { id: 'ind-services',       label: '💼 Professional services', action: 'ind-gen-services' },
            { id: 'ind-saas',           label: '⚙️ SaaS',               action: 'ind-gen-saas' },
            { id: 'ind-food',           label: '🍽️ Restaurants',        action: 'ind-gen-food' },
            { id: 'ind-other',          label: '🏢 Other',              action: 'ind-gen-other' }
          ]
        },
        'ind-gen-home-services': {
          reply: "For contractors, plumbers, electricians, HVAC & landscaping: CRM for job pipelines + Google/Meta ads + Local SEO + AI SDR on WhatsApp to handle initial inquiries 24/7.\n\nAvg: 50-90% more booked jobs in 90 days. The AI qualifies every lead and sends automated reminders — 40% fewer no-shows.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',         action: 'audit' },
            { id: 'async-audit', label: '📝 Free async audit',   href: '/contact.html' },
            { id: 'back',        label: '← Back',               action: 'industry' }
          ]
        },
        'ind-gen-real-estate': {
          reply: "Real estate clients typically start with: AI lead qualification chatbot, IDX-connected CRM, neighborhood landing pages, and paid ads. Avg result: 60-120% more qualified inquiries within 90 days.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',    action: 'audit' },
            { id: 'case-study',  label: '📈 See case studies', href: '/results.html' },
            { id: 'back',        label: '← Back',           action: 'industry' }
          ]
        },
        'ind-gen-health': {
          reply: "Healthcare clients get: HIPAA-compliant CRM tier (with BAA), patient acquisition campaigns, local SEO, and AI receptionist for scheduling. Avg: 40-90% more booked appointments in 90 days.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',    action: 'audit' },
            { id: 'hipaa-faq',   label: '🔒 HIPAA details', href: '/faq.html#hipaa' },
            { id: 'back',        label: '← Back',           action: 'industry' }
          ]
        },
        'ind-gen-ecom': {
          reply: "E-commerce playbook: Shopify/Woo sync, abandoned cart automations, Klaviyo-grade email + SMS, ROAS-focused ads, AI-written product descriptions. Avg: 3-6x ROAS + 25-35% email revenue share.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',    action: 'audit' },
            { id: 'email-page',  label: '✉️ Email features', href: '/email-marketing.html' },
            { id: 'back',        label: '← Back',           action: 'industry' }
          ]
        },
        'ind-gen-services': {
          reply: "For law firms, accountants, consultants: content-led SEO, LinkedIn ads, AI SDR for outbound, CRM with pipeline automation. Avg: 50-100% pipeline growth in 120 days.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',      action: 'audit' },
            { id: 'services',    label: '🚀 See all services', action: 'services' },
            { id: 'back',        label: '← Back',             action: 'industry' }
          ]
        },
        'ind-gen-saas': {
          reply: "SaaS playbook: content-led growth, lifecycle email, free-trial → paid automations, retention campaigns, AI Fractional CMO for strategy. Avg: 30-70% trial-to-paid lift.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',    action: 'audit' },
            { id: 'cmo-page',    label: '🧠 AI CMO details', href: '/services.html#fractional-cmo' },
            { id: 'back',        label: '← Back',           action: 'industry' }
          ]
        },
        'ind-gen-food': {
          reply: "Restaurants: Google Business profile, local SEO, social + video content, loyalty email/SMS, booking widget. Avg: 35-75% more reservations from organic in 90 days.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',    action: 'audit' },
            { id: 'services',    label: '🚀 See services',   action: 'services' },
            { id: 'back',        label: '← Back',           action: 'industry' }
          ]
        },
        'ind-gen-other': {
          reply: "Tell me more about your business and I'll point you to the best playbook — or I can connect you with a human strategist.",
          replies: [
            { id: 'audit-start', label: '🎯 Free audit',       action: 'audit' },
            { id: 'human',       label: '💬 Talk to human',    action: 'human' },
            { id: 'back',        label: '← Back',              action: 'menu' }
          ]
        },
        human: {
          reply: "Sure! How would you like to connect?",
          replies: [
            { id: 'human-wa',    label: '💬 WhatsApp',          href: 'https://wa.me/17407363884?text=Hi%20NetWebMedia%2C%20I%20came%20from%20your%20website.' },
            { id: 'human-email', label: '✉️ Email the team',    href: 'mailto:hello@netwebmedia.com?subject=Chat%20handoff%20from%20website' },
            { id: 'human-email', label: '✉️ Email us',          href: 'mailto:hello@netwebmedia.com?subject=Chat%20handoff%20from%20website' },
            { id: 'back',        label: '← Back',               action: 'menu' }
          ]
        },
        menu: {
          reply: 'What else can I help you with?'
          // menuIntents re-used
        }
      }
    },

    es: {
      buttonAria: 'Abrir chat de NetWebMedia',
      tooltip: '👋 ¿Necesitas ayuda? Habla con nosotros',
      botName: 'Asistente NWM',
      botTagline: 'Con IA · Responde al instante',
      greeting: "👋 ¡Hola! Soy NWM, tu guía de marketing con IA. Nuestros productos estrella son los **paquetes Fractional CMO**: estrategia + software + ejecución completa desde $249/mes. Puedo ayudarte a elegir el plan correcto, cotizar o solicitar una auditoría gratis.",
      greeting2: '¿Qué te gustaría hacer?',
      thinking: 'escribiendo…',
      youLabel: 'Tú',
      inputPlaceholder: 'Escribe un mensaje…',
      inputSend: 'Enviar',
      footerPoweredBy: 'Con tecnología de NetWebMedia AI',
      menuIntents: [
        { id: 'pricing',  label: '⭐ Paquetes CMO y precios' },
        { id: 'audit',    label: '🎯 Auditoría gratis' },
        { id: 'services', label: '🚀 ¿Qué ofrecen?' },
        { id: 'industry', label: '🏢 Ayuda para mi industria' },
        { id: 'partner',  label: '💼 Soy agencia (white-label)' },
        { id: 'human',    label: '💬 Hablar con una persona' }
      ],
      intents: {
        services: {
          reply: "Somos una agencia de marketing con IA — construida para la era AEO.\n\n• **Optimización para IA (AEO)** — Aparece en ChatGPT, Perplexity y Google AI cuando los compradores buscan\n• **NWM CRM** — CRM con IA: pipelines, email, SMS, AI SDR en WhatsApp\n• **NWM CMS** — Webs bilingües en menos de 60s\n• **Email Marketing** — Campañas escritas por IA, automatizaciones\n• **Video Factory** — Reels/TikToks producidos por IA (16 Reels/mes en Scale)\n• **AI Fractional CMO** — Agente estratégico 24/7 con responsabilidad humana\n\nUn retainer reemplaza 4–6 proveedores. ¿Cuál te interesa más?",
          replies: [
            { id: 'services-aeo',    label: '🔍 AEO',     href: '/aeo-agency.html' },
            { id: 'services-crm',    label: '📊 CRM',     href: '/nwm-crm.html' },
            { id: 'services-cms',    label: '🌐 CMS',     href: '/nwm-cms.html' },
            { id: 'services-email',  label: '✉️ Email',   href: '/email-marketing.html' },
            { id: 'services-video',  label: '🎬 Video',   href: '/services.html#video' },
            { id: 'services-cmo',    label: '🧠 AI CMO',  href: '/services.html#fractional-cmo' },
            { id: 'back',            label: '← Volver',   action: 'menu' }
          ]
        },
        pricing: {
          reply: "**Paquetes Fractional CMO** ⭐ (nuestros productos estrella):\n\n🚀 **CMO Lite — $249/mes** · sin setup\n AEO + SEO + calendario de contenido, NWM CRM incluido, nota estratégica mensual\n\n📈 **CMO Growth — $999/mes** + $499 setup *(más popular)*\n Todo en Lite + anuncios Google/Meta, contenido social, email automation, AI SDR + calificación de leads\n Pauta al costo + 12% (mín $300/mes)\n\n⭐ **CMO Scale — $2,499/mes** + $999 setup\n Todo en Growth + Video Factory (16 Reels/mes), agentes IA personalizados + voz IA, estratega dedicado, acceso diario por Slack\n\nPago anual ahorra **15%** · Lite $2,540 · Growth $10,190 · Scale $25,490/año\nMínimo 90 días, después mes a mes.\n\n**Solo Plataforma (DIY):** CRM Starter $49 · Pro $249 · Agency $449/mes\n\n¿Cuál se ajusta a tu presupuesto?",
          replies: [
            { id: 'pricing-page',   label: '💳 Ver precios completos', href: '/pricing.html' },
            { id: 'pricing-quote',  label: '📝 Cotización personal',   action: 'audit' },
            { id: 'pricing-bundle', label: '📦 ¿Qué paquete me sirve?', action: 'bundle' },
            { id: 'back',           label: '← Volver',                 action: 'menu' }
          ]
        },
        bundle: {
          reply: "Cuéntame sobre tu negocio en una línea y te recomiendo el mejor paquete:",
          replies: [
            { id: 'bundle-home-services', label: '🔨 Hogar / Contratistas', action: 'rec-home-services' },
            { id: 'bundle-ecom',          label: '🛒 E-commerce',           action: 'rec-ecom' },
            { id: 'bundle-local',         label: '📍 Negocio local',        action: 'rec-local' },
            { id: 'bundle-b2b',           label: '💼 B2B / SaaS',           action: 'rec-b2b' },
            { id: 'bundle-agency',        label: '🏢 Agencia de marketing',  action: 'partner' },
            { id: 'back',                 label: '← Volver',                action: 'menu' }
          ]
        },
        'rec-ecom': {
          reply: "Para e-commerce recomendamos el **paquete Lead Machine**: NWM CRM + Email Marketing + Ads. Desde ~$497/mes con descuento de paquete.\n\nResultado esperado: 3-5x ROAS en ads + 25-35% de ingresos por email al mes 3.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'async-audit', label: '📝 Auditoría async',    href: '/contact.html' },
            { id: 'back',        label: '← Volver',             action: 'menu' }
          ]
        },
        'rec-local': {
          reply: "Para negocios locales recomendamos **Growth Stack**: CRM + Web + SEO + Google Business. Desde $997/mes con descuento.\n\nResultado: 40-80% más leads en 90 días, top-3 local al mes 6.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'async-audit', label: '📝 Auditoría async',    href: '/contact.html' },
            { id: 'back',        label: '← Volver',             action: 'menu' }
          ]
        },
        'rec-b2b': {
          reply: "Para B2B / SaaS recomendamos **Full CMO**: AI Fractional CMO + Contenido + LinkedIn Ads + CRM. Desde $1,999/mes.\n\nResultado: 50-120% crecimiento de pipeline al mes 3, estrategia senior 24/7 con AI CMO.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'async-audit', label: '📝 Auditoría async',    href: '/contact.html' },
            { id: 'back',        label: '← Volver',             action: 'menu' }
          ]
        },
        audit: {
          reply: "Comparte tu URL de sitio web y email — te enviaré un **roadmap de 90 días gratis en 48 horas**. Sin presión comercial.",
          mode: 'form',
          fields: [
            { name: 'website', label: 'Tu sitio web', type: 'url',   required: true, placeholder: 'https://tusitio.com' },
            { name: 'email',   label: 'Tu email',     type: 'email', required: true, placeholder: 'tu@empresa.com' },
            { name: 'name',    label: 'Tu nombre',    type: 'text',  required: false, placeholder: 'Opcional' }
          ],
          submitLabel: 'Enviar mi auditoría gratis',
          success: "🎉 ¡Listo! Te enviaremos tu roadmap de 90 días en las próximas 48 horas. ¿Algo más en lo que pueda ayudarte?",
          replies: [
            { id: 'services-intent', label: '🚀 Servicios',       action: 'services' },
            { id: 'pricing-intent',  label: '💰 Precios',         action: 'pricing' },
            { id: 'human',           label: '💬 Hablar con alguien', action: 'human' }
          ]
        },
        partner: {
          reply: "Programa de partners: white-label de nuestro CRM, CMS, Email, Video y AI CMO desde **$249/mes**. Conserva **50-70%** de los ingresos del cliente. Sub-cuentas ilimitadas.\n\n¿Qué te interesa?",
          replies: [
            { id: 'partner-tiers',  label: '💼 Ver todos los planes', href: '/partners.html#tiers' },
            { id: 'partner-calc',   label: '🧮 Calculadora de margen', href: '/partners.html#calculator' },
            { id: 'partner-apply',  label: '📝 Postular al programa',  href: '/partners.html#partner-signup' },
            { id: 'partner-faq',    label: '❓ FAQs de partner',       href: '/faq.html#cat-partners' },
            { id: 'back',           label: '← Volver',                 action: 'menu' }
          ]
        },
        industry: {
          reply: "¿En qué industria estás?",
          replies: [
            { id: 'ind-real-estate',   label: '🏠 Real Estate',            action: 'ind-gen-real-estate' },
            { id: 'ind-health',        label: '🏥 Salud',                  action: 'ind-gen-health' },
            { id: 'ind-home-services', label: '🔨 Hogar / Contratistas',   action: 'ind-gen-home-services' },
            { id: 'ind-ecom',          label: '🛍️ E-commerce',             action: 'ind-gen-ecom' },
            { id: 'ind-services',      label: '💼 Servicios profesionales', action: 'ind-gen-services' },
            { id: 'ind-saas',          label: '⚙️ SaaS',                   action: 'ind-gen-saas' },
            { id: 'ind-food',          label: '🍽️ Restaurantes',           action: 'ind-gen-food' },
            { id: 'ind-other',         label: '🏢 Otra',                   action: 'ind-gen-other' }
          ]
        },
        'ind-gen-home-services': {
          reply: "Para contratistas, plomeros, electricistas, HVAC y paisajismo: CRM para pipeline de trabajos + anuncios Google/Meta + SEO local + AI SDR en WhatsApp para atender consultas 24/7.\n\nResultado: 50-90% más trabajos agendados en 90 días. La IA califica cada lead y envía recordatorios automáticos — 40% menos cancelaciones.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis', action: 'audit' },
            { id: 'async-audit', label: '📝 Auditoría async',   href: '/contact.html' },
            { id: 'back',        label: '← Volver',            action: 'industry' }
          ]
        },
        'rec-home-services': {
          reply: "Para contratistas y servicios del hogar recomendamos **Growth Stack**: CRM para pipeline de trabajos + Web + Anuncios Google/Meta + AI SDR en WhatsApp 24/7. Desde $997/mes.\n\nResultado: 50-90% más trabajos agendados en 90 días. La IA atiende cada consulta para que tú cierres contratos, no mensajes. 40% menos cancelaciones con recordatorios automáticos.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'async-audit', label: '📝 Auditoría async',     href: '/contact.html' },
            { id: 'back',        label: '← Volver',              action: 'menu' }
          ]
        },
        'ind-gen-real-estate': {
          reply: "Para real estate empezamos con: chatbot de calificación con IA, CRM con IDX, landing pages por barrio, y anuncios. Resultado: 60-120% más consultas calificadas en 90 días.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis', action: 'audit' },
            { id: 'case-study',  label: '📈 Ver casos',        href: '/results.html' },
            { id: 'back',        label: '← Volver',            action: 'industry' }
          ]
        },
        'ind-gen-health': {
          reply: "Clínicas reciben: tier HIPAA (con BAA), campañas de captación de pacientes, SEO local, y recepcionista con IA para agendar. Resultado: 40-90% más citas agendadas en 90 días.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis', action: 'audit' },
            { id: 'hipaa-faq',   label: '🔒 Detalles HIPAA',   href: '/faq.html#hipaa' },
            { id: 'back',        label: '← Volver',            action: 'industry' }
          ]
        },
        'ind-gen-ecom': {
          reply: "Playbook e-commerce: sync Shopify/Woo, automatizaciones de carrito abandonado, email + SMS tipo Klaviyo, ads con foco en ROAS, descripciones de producto con IA. Resultado: 3-6x ROAS + 25-35% de ingresos por email.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'email-page',  label: '✉️ Detalles de email',  href: '/email-marketing.html' },
            { id: 'back',        label: '← Volver',              action: 'industry' }
          ]
        },
        'ind-gen-services': {
          reply: "Para abogados, contadores, consultores: SEO con contenido, LinkedIn Ads, AI SDR outbound, CRM con pipeline. Resultado: 50-100% crecimiento de pipeline en 120 días.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'services',    label: '🚀 Ver servicios',     action: 'services' },
            { id: 'back',        label: '← Volver',             action: 'industry' }
          ]
        },
        'ind-gen-saas': {
          reply: "SaaS: growth con contenido, lifecycle email, automatizaciones free-trial → pago, retención, AI Fractional CMO estrategia. Resultado: 30-70% mejora de trial-to-paid.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'cmo-page',    label: '🧠 Detalles AI CMO',    href: '/services.html#fractional-cmo' },
            { id: 'back',        label: '← Volver',              action: 'industry' }
          ]
        },
        'ind-gen-food': {
          reply: "Restaurantes: Google Business, SEO local, contenido social + video, email/SMS de lealtad, widget de reservas. Resultado: 35-75% más reservas desde orgánico en 90 días.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',  action: 'audit' },
            { id: 'services',    label: '🚀 Ver servicios',     action: 'services' },
            { id: 'back',        label: '← Volver',             action: 'industry' }
          ]
        },
        'ind-gen-other': {
          reply: "Cuéntame más sobre tu negocio y te indico el mejor playbook — o te conecto con un estratega humano.",
          replies: [
            { id: 'audit-start', label: '🎯 Auditoría gratis',   action: 'audit' },
            { id: 'human',       label: '💬 Hablar con humano',   action: 'human' },
            { id: 'back',        label: '← Volver',               action: 'menu' }
          ]
        },
        human: {
          reply: "¡Claro! ¿Cómo prefieres conectar?",
          replies: [
            { id: 'human-wa',    label: '💬 WhatsApp',         href: 'https://wa.me/17407363884?text=Hola%20NetWebMedia%2C%20vine%20desde%20su%20sitio%20web.' },
            { id: 'human-email', label: '✉️ Email al equipo',  href: 'mailto:hello@netwebmedia.com?subject=Consulta%20desde%20el%20chat' },
            { id: 'human-email', label: '✉️ Escríbenos',      href: 'mailto:hello@netwebmedia.com?subject=Handoff%20desde%20chat' },
            { id: 'back',        label: '← Volver',            action: 'menu' }
          ]
        },
        menu: {
          reply: '¿En qué más puedo ayudarte?'
        }
      }
    }
  };

  const T = CONTENT[LANG];

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getCookie(name){
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function setCookie(name, value, days){
    const d = new Date();
    d.setTime(d.getTime() + (days || 30) * 24*60*60*1000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function trackEvent(event, data){
    try {
      if (window.gtag) window.gtag('event', event, Object.assign({ event_category: 'chat_widget' }, data || {}));
    } catch(e){}
  }
  function formatMessage(text){
    // Simple markdown-ish: **bold** and newlines to <br>
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Widget DOM construction ──────────────────────────────────────────────
  function injectStyles(){
    if (document.getElementById('nwm-chat-style')) return;
    const css = `
      #nwm-chat-launcher{position:fixed;left:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:10px;flex-direction:row;}
      #nwm-chat-launcher .nwm-chat-btn{position:relative;display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#FF6B00,#ff3d00);color:#fff;box-shadow:0 8px 24px rgba(255,107,0,.45),0 2px 6px rgba(0,0,0,.25);border:none;outline:none;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;font-size:0;padding:0}
      #nwm-chat-launcher .nwm-chat-btn:hover{transform:scale(1.08);box-shadow:0 10px 28px rgba(255,107,0,.6),0 2px 6px rgba(0,0,0,.3);}
      #nwm-chat-launcher .nwm-chat-btn svg{width:30px;height:30px;fill:#fff}
      #nwm-chat-launcher .nwm-chat-tip{background:#0a1033;color:#fff;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.3);white-space:nowrap;opacity:0;transform:translateX(-8px);transition:opacity .25s ease,transform .25s ease;pointer-events:none;border:1px solid rgba(255,255,255,.1);max-width:240px}
      #nwm-chat-launcher.tip-show .nwm-chat-tip,#nwm-chat-launcher:hover .nwm-chat-tip{opacity:1;transform:translateX(0)}
      #nwm-chat-launcher .nwm-chat-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#25D366;border:2px solid #fff;box-shadow:0 0 0 0 rgba(37,211,102,.7);animation:nwmChatDot 2s infinite}
      @keyframes nwmChatDot{0%{box-shadow:0 0 0 0 rgba(37,211,102,.7)}70%{box-shadow:0 0 0 10px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}
      #nwm-chat-launcher.open{display:none}

      #nwm-chat-panel{position:fixed;left:20px;bottom:20px;z-index:9998;width:380px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 40px);background:#0a0e27;border:1px solid rgba(255,107,0,.2);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04);display:none;flex-direction:column;overflow:hidden;font-family:inherit;color:#fff}
      #nwm-chat-panel.open{display:flex;animation:nwmChatSlide .3s cubic-bezier(.2,.8,.2,1)}
      @keyframes nwmChatSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

      .nwm-chat-header{display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(135deg,#FF6B00,#ff3d00);flex-shrink:0}
      .nwm-chat-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:14px}
      .nwm-chat-hdr-txt{flex:1;min-width:0}
      .nwm-chat-name{font-weight:700;font-size:15px;line-height:1.2;color:#fff}
      .nwm-chat-tagline{font-size:12px;opacity:.9;color:#fff;display:flex;align-items:center;gap:5px}
      .nwm-chat-tagline::before{content:"";width:8px;height:8px;border-radius:50%;background:#7fe3a3;box-shadow:0 0 6px #7fe3a3}
      .nwm-chat-close{background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s}
      .nwm-chat-close:hover{background:rgba(255,255,255,.3)}

      .nwm-chat-body{flex:1;overflow-y:auto;padding:18px;background:#0a0e27;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
      .nwm-chat-body::-webkit-scrollbar{width:6px}
      .nwm-chat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
      .nwm-chat-body::-webkit-scrollbar-track{background:transparent}

      .nwm-msg{display:flex;gap:8px;max-width:88%;animation:nwmMsgIn .25s ease-out}
      @keyframes nwmMsgIn{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}}
      .nwm-msg-bot{align-self:flex-start}
      .nwm-msg-user{align-self:flex-end;flex-direction:row-reverse}
      .nwm-msg-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#FF6B00,#ff3d00);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0}
      .nwm-msg-user .nwm-msg-avatar{background:#3a4a6a}
      .nwm-msg-bubble{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px 14px;font-size:14px;line-height:1.55;color:#dde3ee;max-width:100%;word-wrap:break-word}
      .nwm-msg-user .nwm-msg-bubble{background:linear-gradient(135deg,rgba(255,107,0,.15),rgba(255,61,0,.08));border-color:rgba(255,107,0,.3)}
      .nwm-msg-bubble strong{color:#fff}

      .nwm-typing{display:flex;align-items:center;gap:4px;padding:14px 14px}
      .nwm-typing span{width:7px;height:7px;border-radius:50%;background:#9aa;display:inline-block;animation:nwmType 1.2s infinite ease-in-out}
      .nwm-typing span:nth-child(2){animation-delay:.15s}
      .nwm-typing span:nth-child(3){animation-delay:.3s}
      @keyframes nwmType{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-3px);opacity:1}}

      .nwm-replies{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;margin-top:2px}
      .nwm-reply{background:rgba(255,107,0,.08);border:1px solid rgba(255,107,0,.3);color:#FF6B00;padding:8px 13px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s;font-family:inherit;text-decoration:none;display:inline-block}
      .nwm-reply:hover{background:rgba(255,107,0,.2);transform:translateY(-1px)}
      .nwm-reply:active{transform:translateY(0)}

      .nwm-chat-form{display:flex;flex-direction:column;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;margin-top:4px}
      .nwm-chat-form label{font-size:12px;color:#9aa;font-weight:600}
      .nwm-chat-form input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:9px 11px;color:#fff;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s}
      .nwm-chat-form input:focus{border-color:#FF6B00;background:rgba(255,107,0,.06)}
      .nwm-chat-form button{background:linear-gradient(135deg,#FF6B00,#ff3d00);color:#fff;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;margin-top:4px;font-size:13px;font-family:inherit;transition:transform .15s}
      .nwm-chat-form button:hover:not(:disabled){transform:translateY(-1px)}
      .nwm-chat-form button:disabled{opacity:.6;cursor:not-allowed}
      .nwm-form-err{color:#f88;font-size:12px}

      .nwm-chat-input-wrap{display:flex;gap:8px;padding:12px 14px 8px;background:#0d1340;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;align-items:center}
      .nwm-chat-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s, background .15s;min-width:0}
      .nwm-chat-input::placeholder{color:rgba(255,255,255,.4)}
      .nwm-chat-input:focus{border-color:#FF6B00;background:rgba(255,107,0,.07)}
      .nwm-chat-send{background:linear-gradient(135deg,#FF6B00,#ff3d00);color:#fff;border:none;width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s, opacity .15s;line-height:1}
      .nwm-chat-send:hover{transform:translateY(-1px);opacity:.92}
      .nwm-chat-send:active{transform:translateY(0)}
      .nwm-chat-clear{background:transparent;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.7);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s, border-color .2s;margin-right:6px}
      .nwm-chat-clear:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.4);color:#fff}

      .nwm-chat-footer{padding:8px 16px;border-top:1px solid rgba(255,255,255,.06);background:#0a0e27;text-align:center;flex-shrink:0}
      .nwm-chat-footer small{color:#6b7280;font-size:11px;letter-spacing:.02em}

      .nwm-chat-intro-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}

      /* Mobile */
      @media (max-width:640px){
        #nwm-chat-launcher{left:14px;bottom:calc(90px + env(safe-area-inset-bottom, 0px))}
        #nwm-chat-launcher .nwm-chat-btn{width:54px;height:54px}
        #nwm-chat-launcher .nwm-chat-btn svg{width:26px;height:26px}
        #nwm-chat-launcher .nwm-chat-tip{display:none}
        #nwm-chat-panel{left:10px;right:10px;bottom:10px;width:auto;max-width:none;height:calc(100vh - 20px);max-height:calc(100vh - 20px);border-radius:16px}
      }
    `;
    const style = document.createElement('style');
    style.id = 'nwm-chat-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createLauncher(){
    const wrap = document.createElement('div');
    wrap.id = 'nwm-chat-launcher';
    wrap.innerHTML =
      '<button class="nwm-chat-btn" type="button" aria-label="' + T.buttonAria + '">' +
        '<span class="nwm-chat-dot" aria-hidden="true"></span>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.67 1.34 5.06 3.47 6.73L4 22l4.6-1.55A11 11 0 0 0 12 21c5.52 0 10-4.03 10-9s-4.48-10-10-10zm-1 13H7v-2h4v2zm5 0h-3v-2h3v2zm0-4H7V9h9v2z"/></svg>' +
      '</button>' +
      '<span class="nwm-chat-tip">' + T.tooltip + '</span>';
    document.body.appendChild(wrap);

    wrap.querySelector('.nwm-chat-btn').addEventListener('click', openPanel);

    // Auto-show tooltip after delay (only if not dismissed)
    if (!getCookie(CONFIG.dismissCookie) && CONFIG.tooltipDelayMs > 0) {
      setTimeout(function(){
        wrap.classList.add('tip-show');
        setTimeout(function(){ wrap.classList.remove('tip-show'); }, 4500);
      }, CONFIG.tooltipDelayMs);
    }

    // Optional auto-open
    if (!getCookie(CONFIG.seenCookie) && CONFIG.openAutoDelayMs > 0) {
      setTimeout(function(){
        if (!document.getElementById('nwm-chat-panel')) openPanel();
      }, CONFIG.openAutoDelayMs);
    }
  }

  let panel = null;
  let bodyEl = null;

  function createPanel(){
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'nwm-chat-panel';
    panel.innerHTML =
      '<div class="nwm-chat-header">' +
        '<div class="nwm-chat-avatar">NWM</div>' +
        '<div class="nwm-chat-hdr-txt">' +
          '<div class="nwm-chat-name">' + T.botName + '</div>' +
          '<div class="nwm-chat-tagline">' + T.botTagline + '</div>' +
        '</div>' +
        '<button class="nwm-chat-clear" aria-label="Reset conversation" type="button" title="Reset chat">&#8634;</button>' +
        '<button class="nwm-chat-close" aria-label="Close chat" type="button">&times;</button>' +
      '</div>' +
      '<div class="nwm-chat-body" id="nwm-chat-body"></div>' +
      '<form class="nwm-chat-input-wrap" id="nwm-chat-input-form" autocomplete="off">' +
        '<input type="text" class="nwm-chat-input" id="nwm-chat-input" ' +
        'placeholder="' + T.inputPlaceholder + '" autocomplete="off" />' +
        '<button type="submit" class="nwm-chat-send" aria-label="' + T.inputSend + '">&#10148;</button>' +
      '</form>' +
      '<div class="nwm-chat-footer"><small>' + T.footerPoweredBy + '</small></div>';
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('#nwm-chat-body');
    panel.querySelector('.nwm-chat-close').addEventListener('click', closePanel);
    panel.querySelector('.nwm-chat-clear').addEventListener('click', resetChat);

    // Wire free-text input
    var form = panel.querySelector('#nwm-chat-input-form');
    var input = panel.querySelector('#nwm-chat-input');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var txt = input.value.trim();
      if (!txt) return;
      input.value = '';
      handleFreeText(txt);
    });
  }

  // ── Persist conversation across page navigations ──────────
  var STATE_KEY = 'nwm_chat_state_v2';
  function saveState(){
    if (!bodyEl) return;
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({
        html: bodyEl.innerHTML,
        greeted: bodyEl.dataset.greeted || '',
        ts: Date.now()
      }));
    } catch(_) {}
  }
  function restoreState(){
    try {
      var raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return false;
      var s = JSON.parse(raw);
      // Expire after 30 minutes of inactivity
      if (!s || (Date.now() - (s.ts || 0)) > 30 * 60 * 1000) {
        sessionStorage.removeItem(STATE_KEY);
        return false;
      }
      if (s.html) {
        bodyEl.innerHTML = s.html;
        bodyEl.dataset.greeted = s.greeted || '1';
        // Re-bind reply button clicks (innerHTML re-injection wipes listeners)
        rebindReplies();
        scrollToBottom();
        return true;
      }
    } catch(_) {}
    return false;
  }
  function resetChat(){
    try { sessionStorage.removeItem(STATE_KEY); } catch(_) {}
    if (bodyEl) {
      bodyEl.innerHTML = '';
      delete bodyEl.dataset.greeted;
    }
    // Re-greet
    if (panel && panel.classList.contains('open')) {
      bodyEl.dataset.greeted = '1';
      setTimeout(function(){ addBotMessage(T.greeting); }, 200);
      setTimeout(function(){ addBotMessage(T.greeting2, T.menuIntents.map(toReply)); }, 1100);
    }
  }
  function rebindReplies(){
    // Restored HTML has buttons with no event listeners — replays them.
    // We use action data attributes that were originally inline; rebind by reading text + finding intent.
    var btns = bodyEl.querySelectorAll('.nwm-reply');
    btns.forEach(function(btn){
      // skip <a> links — those navigate naturally
      if (btn.tagName !== 'BUTTON') return;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        // Parse label and route via free text matcher
        handleFreeText(btn.textContent.replace(/[^\w\s\u00C0-\u017F&áéíóúüñÁÉÍÓÚÜÑ?']/g, '').trim());
      });
    });
  }

  // ── Chat API session (open-ended fallback) ───────────────
  function getChatSessionId(){
    try {
      var s = localStorage.getItem(CONFIG.sessionKey);
      if (s && /^[a-z0-9_\-]{6,64}$/i.test(s)) return s;
    } catch(_) {}
    var fresh = 'pub_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    try { localStorage.setItem(CONFIG.sessionKey, fresh); } catch(_) {}
    return fresh;
  }

  function askChatAPI(text, onReply, onError){
    var payload = {
      message:    text,
      language:   LANG,
      session_id: getChatSessionId(),
      page:       location.pathname
    };
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timeout = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 25000);
    fetch(CONFIG.chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function(res){ return res.json().then(function(j){ return { ok: res.ok, status: res.status, json: j }; }); })
      .then(function(out){
        clearTimeout(timeout);
        if (out.json && out.json.reply) {
          onReply(out.json.reply, out.json.suggested_actions || [], out.status === 429);
        } else {
          onError();
        }
      })
      .catch(function(){ clearTimeout(timeout); onError(); });
  }

  // ── Free-text smart router ────────────────────────────────
  // Fast path: keyword matcher routes common intents client-side.
  // Slow path: anything unmatched goes to /api/public/chat (unified KB + Claude).
  function handleFreeText(text){
    addUserMessage(text);
    trackEvent('chat_freetext', { text: text.slice(0, 200), page: location.pathname });
    var intentId = matchIntent(text);
    if (intentId) {
      // Route directly — do NOT call handleReply() here because that would
      // call addUserMessage() a second time, causing the double-message bug.
      routeIntent(intentId);
      return;
    }
    // No local intent match → ask the unified-KB chat API.
    var typing = addTyping();
    askChatAPI(text,
      function onReply(reply, actions, rateLimited){
        if (typing) typing.remove();
        var replies = (actions || []).map(function(a){ return { id: 'api-' + encodeURIComponent(a.href||a.label), label: a.label, href: a.href }; });
        // Always offer a "back to menu" escape hatch when we came from the free-text path
        if (!rateLimited) {
          replies.push({ id: 'back', label: LANG === 'es' ? '← Menú' : '← Menu', action: 'menu' });
        }
        addBotMessage(reply, replies);
      },
      function onError(){
        if (typing) typing.remove();
        var fallback = LANG === 'es'
          ? "Buena pregunta — me cuesta conectarme en este momento. Escríbenos a *hello@netwebmedia.com* o agenda 30 min en /contact.html y te respondemos en pocas horas."
          : "Good question — I'm having trouble connecting right now. Email *hello@netwebmedia.com* or book 30 min at /contact.html and we'll reply within a few business hours.";
        addBotMessage(fallback, [
          { id: 'async-audit', label: LANG === 'es' ? '📝 Auditoría async' : '📝 Free async audit', href: '/contact.html' },
          { id: 'human-email', label: '✉️ Email', href: 'mailto:hello@netwebmedia.com?subject=Chat%20handoff' },
          { id: 'back', label: LANG === 'es' ? '← Menú' : '← Menu', action: 'menu' }
        ]);
      }
    );
  }

  // Routes to an intent without adding a user message bubble (used by handleFreeText).
  function routeIntent(intentId){
    trackEvent('chat_intent', { intent: intentId, page: location.pathname });
    if (intentId === 'menu') {
      // On the first message a bare greeting like "hi" should get the welcome
      // prompt, not "What ELSE can I help you with?" which implies history.
      var isFirstExchange = bodyEl && bodyEl.querySelectorAll('.nwm-msg-user').length <= 1;
      if (isFirstExchange) {
        addBotMessage(T.greeting2, T.menuIntents.map(toReply));
      } else {
        addBotMessage(T.intents.menu.reply, T.menuIntents.map(toReply));
      }
      return;
    }
    var intent = T.intents[intentId];
    if (!intent) {
      addBotMessage(T.intents.menu.reply, T.menuIntents.map(toReply));
      return;
    }
    if (intent.mode === 'form') {
      addBotMessage(intent.reply);
      setTimeout(function(){ renderForm(intent); }, 900);
      return;
    }
    addBotMessage(intent.reply, intent.replies || []);
  }

  function matchIntent(text){
    var t = text.toLowerCase();
    // Prefer the AI endpoint (unified KB) for anything that looks like a real
    // question — comparison, upgrade, annual/phone/refund specifics, anything
    // containing "?" on a message longer than ~25 chars, etc. Keyword routing
    // is ONLY for short intent tokens (e.g. "pricing", "services").
    var looksLikeQuestion = /\?|\bdifferen|\bvs\b|\bcompar|upgrade|annual|yearly|phone|refund|cancel|contract|diferenc|anual|telefono|teléfono|reembols|contrat|compar(a|ar)/.test(t);
    if (looksLikeQuestion && t.length > 25) return null;
    // Real estate / properties / house / agent / mls
    if (/real\s*estate|propert|house|home\s*selling|listing|mls|realtor|agent|broker|inmobil|propied|casa|venta de cas/.test(t)) return 'rec-real-estate';
    // Healthcare / medical / clinic / patient / spa
    if (/health|medical|clinic|patient|wellness|spa|dental|salud|m[eé]dic|cl[ií]nica|spa|paciente/.test(t)) return 'rec-health';
    // Hospitality / restaurant / hotel / cafe / bar
    if (/restaurant|hotel|cafe|bar|hospital|reservation|food|dining|restaurante|hotel|cafeter[ií]a|reserva|comida/.test(t)) return 'rec-hospitality';
    // E-commerce / shop / store / DTC
    if (/ecomm|e-comm|shop|store|product|retail|tienda|comercio|venta online|dtc/.test(t)) return 'rec-ecom';
    // Local services / contractor / plumber / auto
    if (/plumb|hvac|electric|locksmith|auto|repair|cleaning|home\s*service|servicio\s*local|fontaner|electricist|cerrajer/.test(t)) return 'rec-local';
    // Finance / insurance / wealth / advisor
    if (/financ|insurance|wealth|advisor|invest|finanz|asesor|seguro|inversi/.test(t)) return 'rec-finance';
    // B2B / SaaS / software / startup
    if (/saas|b2b|software|startup|tech|api|platform|emprendi/.test(t)) return 'rec-b2b';
    // Pricing / cost / how much / price
    if (/price|cost|pricing|how much|fee|charge|plan|bundle|paquete|precio|cu[aá]nto|cuesta/.test(t)) return 'pricing';
    // Services / what do you do / offer / marketing help
    if (/service|offer|what do you|what does|what can you|marketing help|product|capability|servicio|qu[eé] ofrec|qu[eé] hace|capacidad/.test(t)) return 'services';
    // Audit / free / report / analysis
    if (/audit|free|trial|report|analysis|review|auditor|gratis|prueba|reporte|an[aá]lisis/.test(t)) return 'audit';
    // Industry general
    if (/industry|vertical|niche|industria|nicho/.test(t)) return 'industry';
    // Bundle / recommend
    if (/bundle|recommend|which.*plan|best.*for|paquete|recomien|cu[aá]l.*plan/.test(t)) return 'bundle';
    // Partner / white label / agency / reseller
    if (/partner|reseller|white.?label|agency|afiliad|asociar|agencia|reventa/.test(t)) return 'partner';
    // Talk to human / agent / call / contact
    if (/human|agent|person|call me|talk to|sales|contact|humano|persona|llamar|hablar/.test(t)) return 'human';
    // Demo / show me
    if (/demo|show me|tour|demostr|mostrar/.test(t)) return 'services';
    // Hi / hello / hey — only when the greeting IS the entire message (not "Hi, I have a question about…")
    if (/^(hi|hello|hey|hola|buenas|buen d|saludos)[\s!.,]*$/i.test(t)) return 'menu';
    return null;
  }

  function openPanel(){
    createPanel();
    panel.classList.add('open');
    const launcher = document.getElementById('nwm-chat-launcher');
    if (launcher) launcher.classList.add('open');
    setCookie(CONFIG.seenCookie, '1', 30);
    trackEvent('chat_open', { page: location.pathname });

    // Try to restore previous conversation (page navigation, refresh, etc.)
    if (!bodyEl.dataset.greeted) {
      var restored = restoreState();
      if (restored) {
        // Conversation restored — focus input
        setTimeout(function(){
          var inp = panel.querySelector('#nwm-chat-input');
          if (inp) inp.focus();
        }, 200);
        return;
      }
      bodyEl.dataset.greeted = '1';
      setTimeout(function(){ addBotMessage(T.greeting); }, 350);
      const pageHint = detectPageContext();
      if (pageHint) {
        setTimeout(function(){
          addBotMessage(pageHint.greeting, pageHint.replies);
        }, 1400);
      } else {
        setTimeout(function(){ addBotMessage(T.greeting2, T.menuIntents.map(toReply)); }, 1400);
      }
    }
    // Focus input after open
    setTimeout(function(){
      var inp = panel.querySelector('#nwm-chat-input');
      if (inp) inp.focus();
    }, 400);
  }

  function detectPageContext(){
    const path = location.pathname.toLowerCase();
    const hint = {
      en: {
        '/partners.html':         { greeting: "I see you're checking our **Partner Program** — want to dive in?", replies: [{id:'p-tiers',label:'💼 See tiers',action:'partner'},{id:'p-calc',label:'🧮 Margin calc',href:'/partners.html#calculator'},{id:'p-back',label:'← Other topics',action:'menu'}] },
        '/email-marketing.html':  { greeting: "Browsing our **Email Marketing platform** — how can I help?", replies: [{id:'e-feat',label:'✉️ Features',action:'services'},{id:'e-price',label:'💰 Pricing',action:'pricing'},{id:'e-trial',label:'🎯 Free first month',action:'audit'},{id:'e-back',label:'← Other topics',action:'menu'}] },
        '/nwm-crm.html':          { greeting: "Looking at the **NWM CRM** — what would you like to know?", replies: [{id:'c-feat',label:'📊 Features',action:'services'},{id:'c-vs',label:'⚖️ vs GoHighLevel',href:'/faq.html#crm-vs-ghl'},{id:'c-trial',label:'🎯 Free audit',action:'audit'},{id:'c-back',label:'← Other topics',action:'menu'}] },
        '/nwm-cms.html':          { greeting: "Exploring our **AI CMS** — want a demo or comparison?", replies: [{id:'cm-feat',label:'🌐 Features',action:'services'},{id:'cm-vs',label:'⚖️ vs WordPress',href:'/faq.html#wordpress-shopify'},{id:'cm-audit',label:'🎯 Free audit',action:'audit'},{id:'cm-back',label:'← Other topics',action:'menu'}] },
        '/pricing.html':          { greeting: "On our **Pricing page** — let me help you pick the right plan.", replies: [{id:'pr-bundle',label:'📦 Find best bundle',action:'bundle'},{id:'pr-quote',label:'📝 Custom quote',action:'audit'},{id:'pr-back',label:'← Other topics',action:'menu'}] },
        '/faq.html':              { greeting: "Reading our **FAQ** — anything I can answer directly?", replies: [{id:'f-services',label:'🚀 Services',action:'services'},{id:'f-pricing',label:'💰 Pricing',action:'pricing'},{id:'f-human',label:'💬 Talk to human',action:'human'}] },
        '/contact.html':          { greeting: "Want a faster way than the form? I can route you instantly:", replies: [{id:'co-wa',label:'💬 WhatsApp now',action:'wa-handoff'},{id:'co-audit',label:'🎯 Free audit',action:'audit'},{id:'co-back',label:'← Other topics',action:'menu'}] },
        '/services.html':         { greeting: "Browsing our **services** — which area interests you most?", replies: [{id:'s-services',label:'🚀 Pick a service',action:'services'},{id:'s-bundle',label:'📦 Best bundle for me',action:'bundle'},{id:'s-back',label:'← Other topics',action:'menu'}] },
        '/analytics.html':        { greeting: "After your free site audit? Drop your URL in the form above — or I can fast-track it:", replies: [{id:'a-audit',label:'🎯 Submit via chat',action:'audit'},{id:'a-back',label:'← Other topics',action:'menu'}] },
        '/results.html':          { greeting: "Looking at **client results** — want a similar outcome for your business?", replies: [{id:'r-audit',label:'🎯 Free audit',action:'audit'},{id:'r-chat',label:'💬 Talk to the team',action:'human'},{id:'r-back',label:'← Other topics',action:'menu'}] },
        '/about.html':            { greeting: "Glad you're learning about us. How can I help today?", replies: [{id:'ab-services',label:'🚀 Services',action:'services'},{id:'ab-audit',label:'🎯 Free audit',action:'audit'},{id:'ab-human',label:'💬 Talk to founder',action:'human'}] },
        '/blog.html':             { greeting: "Reading our blog? I can suggest the next read or help you implement:", replies: [{id:'bl-services',label:'🚀 Implementation help',action:'services'},{id:'bl-audit',label:'🎯 Free audit',action:'audit'},{id:'bl-back',label:'← Other topics',action:'menu'}] }
      },
      es: {
        '/partners.html':         { greeting: "Veo que estás viendo nuestro **Programa de Partners** — ¿profundizamos?", replies: [{id:'p-tiers',label:'💼 Ver planes',action:'partner'},{id:'p-calc',label:'🧮 Calc. de margen',href:'/partners.html#calculator'},{id:'p-back',label:'← Otros temas',action:'menu'}] },
        '/email-marketing.html':  { greeting: "Explorando nuestra **plataforma de Email** — ¿en qué te ayudo?", replies: [{id:'e-feat',label:'✉️ Características',action:'services'},{id:'e-price',label:'💰 Precios',action:'pricing'},{id:'e-trial',label:'🎯 Mes gratis',action:'audit'},{id:'e-back',label:'← Otros temas',action:'menu'}] },
        '/nwm-crm.html':          { greeting: "Mirando el **NWM CRM** — ¿qué te gustaría saber?", replies: [{id:'c-feat',label:'📊 Características',action:'services'},{id:'c-vs',label:'⚖️ vs GoHighLevel',href:'/faq.html#crm-vs-ghl'},{id:'c-trial',label:'🎯 Auditoría gratis',action:'audit'},{id:'c-back',label:'← Otros temas',action:'menu'}] },
        '/nwm-cms.html':          { greeting: "Explorando nuestro **CMS con IA** — ¿demo o comparación?", replies: [{id:'cm-feat',label:'🌐 Características',action:'services'},{id:'cm-vs',label:'⚖️ vs WordPress',href:'/faq.html#wordpress-shopify'},{id:'cm-audit',label:'🎯 Auditoría',action:'audit'},{id:'cm-back',label:'← Otros temas',action:'menu'}] },
        '/pricing.html':          { greeting: "En nuestra **página de Precios** — te ayudo a elegir el mejor plan.", replies: [{id:'pr-bundle',label:'📦 Encontrar paquete',action:'bundle'},{id:'pr-quote',label:'📝 Cotización',action:'audit'},{id:'pr-back',label:'← Otros temas',action:'menu'}] },
        '/faq.html':              { greeting: "Leyendo nuestro **FAQ** — ¿algo que pueda responder directo?", replies: [{id:'f-services',label:'🚀 Servicios',action:'services'},{id:'f-pricing',label:'💰 Precios',action:'pricing'},{id:'f-human',label:'💬 Hablar con humano',action:'human'}] },
        '/contact.html':          { greeting: "¿Más rápido que el formulario? Te puedo rutear al instante:", replies: [{id:'co-wa',label:'💬 WhatsApp ya',action:'wa-handoff'},{id:'co-audit',label:'🎯 Auditoría gratis',action:'audit'},{id:'co-back',label:'← Otros temas',action:'menu'}] },
        '/services.html':         { greeting: "Explorando nuestros **servicios** — ¿qué área te interesa?", replies: [{id:'s-services',label:'🚀 Elegir servicio',action:'services'},{id:'s-bundle',label:'📦 Mejor paquete',action:'bundle'},{id:'s-back',label:'← Otros temas',action:'menu'}] },
        '/analytics.html':        { greeting: "¿Buscas tu auditoría gratis? Comparte tu URL — o te llevo directo:", replies: [{id:'a-audit',label:'🎯 Enviar por chat',action:'audit'},{id:'a-back',label:'← Otros temas',action:'menu'}] },
        '/results.html':          { greeting: "Mirando **resultados de clientes** — ¿quieres similar resultado?", replies: [{id:'r-audit',label:'🎯 Auditoría gratis',action:'audit'},{id:'r-chat',label:'💬 Hablar con el equipo',action:'human'},{id:'r-back',label:'← Otros temas',action:'menu'}] },
        '/about.html':            { greeting: "Qué bien que conoces más de nosotros. ¿Cómo te ayudo hoy?", replies: [{id:'ab-services',label:'🚀 Servicios',action:'services'},{id:'ab-audit',label:'🎯 Auditoría gratis',action:'audit'},{id:'ab-human',label:'💬 Hablar con fundador',action:'human'}] },
        '/blog.html':             { greeting: "¿Leyendo nuestro blog? Puedo sugerir la próxima lectura o ayudarte a implementar:", replies: [{id:'bl-services',label:'🚀 Ayuda con implementación',action:'services'},{id:'bl-audit',label:'🎯 Auditoría gratis',action:'audit'},{id:'bl-back',label:'← Otros temas',action:'menu'}] }
      }
    };
    // Try exact match
    const lookup = hint[LANG] || hint.en;
    if (lookup[path]) return lookup[path];
    // Try partial match (e.g. /faq.html?v=2 or /services.html#anchor)
    for (const key in lookup) {
      if (path.indexOf(key) === 0 || path.startsWith(key.replace('.html', ''))) return lookup[key];
    }
    return null;
  }
  function closePanel(){
    if (panel) panel.classList.remove('open');
    const launcher = document.getElementById('nwm-chat-launcher');
    if (launcher) launcher.classList.remove('open');
    trackEvent('chat_close', { page: location.pathname });
  }

  function toReply(item){
    return { id: item.id, label: item.label, action: item.id };
  }

  function scrollToBottom(){
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function addTyping(){
    const el = document.createElement('div');
    el.className = 'nwm-msg nwm-msg-bot nwm-msg-typing';
    el.innerHTML =
      '<div class="nwm-msg-avatar">N</div>' +
      '<div class="nwm-msg-bubble"><div class="nwm-typing"><span></span><span></span><span></span></div></div>';
    bodyEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function addBotMessage(text, replies){
    const typing = addTyping();
    setTimeout(function(){
      typing.remove();
      const el = document.createElement('div');
      el.className = 'nwm-msg nwm-msg-bot';
      el.innerHTML =
        '<div class="nwm-msg-avatar">N</div>' +
        '<div class="nwm-msg-bubble">' + formatMessage(text) + '</div>';
      bodyEl.appendChild(el);

      if (replies && replies.length) {
        const wrap = document.createElement('div');
        wrap.className = 'nwm-replies';
        wrap.style.alignSelf = 'flex-start';
        wrap.style.marginLeft = '36px';
        replies.forEach(function(r){
          let btn;
          if (r.href) {
            btn = document.createElement('a');
            btn.href = (r.href.charAt(0) === '/' ? NWM_BASE : '') + r.href;
            if (r.href.indexOf('mailto:') !== 0) btn.target = '_self';
          } else {
            btn = document.createElement('button');
            btn.type = 'button';
          }
          btn.className = 'nwm-reply';
          btn.textContent = r.label;
          btn.addEventListener('click', function(e){
            if (r.href) {
              trackEvent('chat_link', { link: r.href, intent: r.id });
              return; // follow link
            }
            e.preventDefault();
            handleReply(r);
          });
          wrap.appendChild(btn);
        });
        bodyEl.appendChild(wrap);
      }
      scrollToBottom();
      saveState();
    }, Math.min(700 + Math.random()*400, 1100));
  }

  function addUserMessage(text){
    const el = document.createElement('div');
    el.className = 'nwm-msg nwm-msg-user';
    el.innerHTML =
      '<div class="nwm-msg-avatar">' + (T.youLabel[0] || 'Y') + '</div>' +
      '<div class="nwm-msg-bubble">' + formatMessage(text) + '</div>';
    bodyEl.appendChild(el);
    scrollToBottom();
    saveState();
  }

  function handleReply(r){
    addUserMessage(r.label);
    trackEvent('chat_intent', { intent: r.action || r.id, page: location.pathname });
    const intentId = r.action || r.id;
    if (intentId === 'menu') {
      addBotMessage(T.intents.menu.reply, T.menuIntents.map(toReply));
      return;
    }
    const intent = T.intents[intentId];
    if (!intent) {
      addBotMessage(T.intents.menu.reply, T.menuIntents.map(toReply));
      return;
    }
    if (intent.mode === 'external' && intent.url) {
      addBotMessage(intent.reply);
      setTimeout(function(){ window.open(intent.url, '_blank', 'noopener'); }, 600);
      return;
    }
    if (intent.mode === 'form') {
      addBotMessage(intent.reply);
      setTimeout(function(){ renderForm(intent); }, 900);
      return;
    }
    addBotMessage(intent.reply, intent.replies || []);
  }

  function renderForm(intent){
    const form = document.createElement('form');
    form.className = 'nwm-chat-form';
    form.setAttribute('novalidate', '');
    intent.fields.forEach(function(f){
      const lbl = document.createElement('label');
      lbl.textContent = f.label + (f.required ? ' *' : '');
      lbl.setAttribute('for', 'nwm-f-' + f.name);
      const inp = document.createElement('input');
      inp.type = f.type;
      inp.name = f.name;
      inp.id = 'nwm-f-' + f.name;
      inp.placeholder = f.placeholder || '';
      if (f.required) inp.required = true;
      form.appendChild(lbl);
      form.appendChild(inp);
    });
    const err = document.createElement('div');
    err.className = 'nwm-form-err';
    err.style.display = 'none';
    form.appendChild(err);
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.textContent = intent.submitLabel || (LANG === 'es' ? 'Enviar' : 'Send');
    form.appendChild(btn);
    bodyEl.appendChild(form);
    scrollToBottom();
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = {};
      let hasErr = false;
      intent.fields.forEach(function(f){
        const v = form.querySelector('[name="' + f.name + '"]').value.trim();
        if (f.required && !v) hasErr = true;
        data[f.name] = v;
      });
      if (hasErr) {
        err.textContent = LANG === 'es' ? 'Completa los campos requeridos.' : 'Please complete the required fields.';
        err.style.display = 'block';
        return;
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        err.textContent = LANG === 'es' ? 'Revisa tu email.' : 'Please check your email.';
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = LANG === 'es' ? 'Enviando…' : 'Sending…';

      // Fire-and-forget to both leads endpoint and newsletter
      const payload = {
        source: 'chat-widget',
        page: location.pathname,
        language: LANG,
        intent_id: 'audit',
        data: data
      };
      const fetches = [
        fetch(CONFIG.leadEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){}),
        fetch(CONFIG.emailEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email: data.email, source: 'chat-audit', name: data.name || null, website: data.website || null})}).catch(function(){})
      ];
      Promise.all(fetches).then(function(){
        trackEvent('chat_lead_submit', { intent: 'audit', page: location.pathname });
        form.remove();
        addUserMessage(data.email);
        addBotMessage(intent.success, intent.replies || []);
      });
    });
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mount(){
    if (document.getElementById('nwm-chat-launcher')) return;
    injectStyles();
    createLauncher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Expose API for external triggers (optional)
  window.NWMChat = {
    open: openPanel,
    close: closePanel,
    version: '1.0.0',
    lang: LANG
  };
})();

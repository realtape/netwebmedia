/* NetWebMedia shared i18n — used by CMS, CRM, and public pages. Single source of truth for localStorage key "nwm-lang". */
(function(w){
  'use strict';
  var KEY = 'nwm-lang';
  var DICT = {
    en: {
      // Public site nav & content
      nav_services:'Services', nav_about:'About', nav_results:'Results', nav_blog:'Blog',
      nav_contact:'Contact', nav_cta:'Get a Free Audit', nav_dashboard:'🔐 Client Login',
      hero_badge:'🏆 Top AI Marketing Agency 2025', hero_title_1:'Your Brand Deserves',
      hero_title_2:'AI-Powered', hero_title_3:'Growth',
      hero_desc:'NetWebMedia is the AI marketing agency that combines data intelligence, autonomous agents, and proven growth strategies to 10x your brand\'s performance.',
      hero_cta1:'Get Free Strategy Call', hero_cta2:'See Our Results →',
      hero_stat1_num:'500+', hero_stat1_label:'Brands Grown',
      hero_stat2_num:'340%', hero_stat2_label:'Avg. ROI Increase',
      hero_stat3_num:'4.9★', hero_stat3_label:'Client Satisfaction',
      clients_label:'Trusted by innovative brands worldwide',
      services_label:'What We Do', services_title:'Full-Stack AI Marketing Services',
      services_subtitle:'From AI-powered SEO to autonomous ad campaigns — we run it all on autopilot while you focus on building your business.',
      results_label:'Proven Results', results_title:'Numbers That Speak',
      results_subtitle:'Real results for real businesses. Here\'s what AI-powered marketing delivers.',
      cta_title:'Ready to Dominate Your Market?',
      cta_subtitle:'Get a free AI marketing audit and discover exactly where your competitors are beating you.',
      cta_btn:'Book Your Free Strategy Call',
      footer_tagline:'The world\'s most advanced AI marketing agency. We combine human creativity with machine intelligence to deliver unprecedented growth.',
      // Nav (CMS sidebar)
      nav_pages:'Pages', nav_landing:'Landing Pages',
      nav_forms:'Forms', nav_templates:'Templates', nav_media:'Media Library', nav_seo:'SEO',
      nav_workflows:'Workflows', nav_campaigns:'Campaigns', nav_content_writer:'Content Writer',
      nav_knowledge:'Knowledge Base', nav_agents:'AI Agents', nav_ads:'Paid Ads',
      nav_seo_planner:'AI SEO', nav_social:'Social Media', nav_analytics:'Analytics',
      nav_ab:'A/B Tests', nav_memberships:'Memberships', nav_settings:'Settings',
      // CRM sidebar
      crm_dashboard:'Dashboard', crm_conversations:'Conversations', crm_calendars:'Calendars',
      crm_contacts:'Contacts', crm_sales_pipeline:'Sales Pipeline', crm_opportunities:'Opportunities',
      crm_payments:'Payments', crm_marketing_pipeline:'Marketing Pipeline',
      crm_marketing:'Marketing', crm_automation:'Automation', crm_sites:'Sites',
      crm_reputation:'Reputation', crm_reporting:'Reporting', crm_documents:'Documents',
      crm_courses:'Courses', crm_social_planner:'Social Planner', crm_settings:'Settings',
      switch_to:'Switch to', switch_crm:'NetWeb CRM', switch_cms:'NetWeb CMS',
      // Public actions
      action_save:'Save', action_cancel:'Cancel', action_delete:'Delete', action_edit:'Edit',
      action_new:'New', action_send:'Send', action_preview:'Preview', action_publish:'Publish',
      lang_switch:'ES', lang_switch_title:'Cambiar a español',
    },
    es: {
      // Public site nav & content
      nav_services:'Servicios', nav_about:'Nosotros', nav_results:'Resultados', nav_blog:'Blog',
      nav_contact:'Contacto', nav_cta:'Auditoría Gratis', nav_dashboard:'🔐 Acceso Cliente',
      hero_badge:'🏆 Mejor Agencia de Marketing AI 2025', hero_title_1:'Tu Marca Merece',
      hero_title_2:'Crecimiento', hero_title_3:'con Inteligencia Artificial',
      hero_desc:'NetWebMedia es la agencia de marketing AI que combina inteligencia de datos, agentes autónomos y estrategias probadas de crecimiento para multiplicar por 10 el rendimiento de tu marca.',
      hero_cta1:'Llamada Estratégica Gratis', hero_cta2:'Ver Nuestros Resultados →',
      hero_stat1_num:'500+', hero_stat1_label:'Marcas Impulsadas',
      hero_stat2_num:'340%', hero_stat2_label:'Aumento Promedio de ROI',
      hero_stat3_num:'4.9★', hero_stat3_label:'Satisfacción del Cliente',
      clients_label:'Confiado por marcas innovadoras en todo el mundo',
      services_label:'Qué Hacemos', services_title:'Servicios de Marketing AI Completos',
      services_subtitle:'Desde SEO impulsado por IA hasta campañas publicitarias autónomas — lo gestionamos todo en piloto automático mientras tú te enfocas en hacer crecer tu negocio.',
      results_label:'Resultados Probados', results_title:'Números que Hablan',
      results_subtitle:'Resultados reales para negocios reales. Esto es lo que entrega el marketing potenciado por IA.',
      cta_title:'¿Listo para Dominar tu Mercado?',
      cta_subtitle:'Obtén una auditoría de marketing AI gratuita y descubre exactamente dónde te están superando tus competidores.',
      cta_btn:'Reserva tu Llamada Estratégica Gratis',
      footer_tagline:'La agencia de marketing AI más avanzada del mundo. Combinamos creatividad humana con inteligencia machine para entregar un crecimiento sin precedentes.',
      // Nav (CMS sidebar)
      nav_pages:'Páginas', nav_landing:'Landing Pages',
      nav_forms:'Formularios', nav_templates:'Plantillas', nav_media:'Biblioteca', nav_seo:'SEO',
      nav_workflows:'Automatizaciones', nav_campaigns:'Campañas', nav_content_writer:'Redactor IA',
      nav_knowledge:'Base de Conocimiento', nav_agents:'Agentes IA', nav_ads:'Publicidad',
      nav_seo_planner:'SEO con IA', nav_social:'Redes Sociales', nav_analytics:'Analíticas',
      nav_ab:'Pruebas A/B', nav_memberships:'Membresías', nav_settings:'Ajustes',
      crm_dashboard:'Panel', crm_conversations:'Conversaciones', crm_calendars:'Calendarios',
      crm_contacts:'Contactos', crm_sales_pipeline:'Pipeline de Ventas', crm_opportunities:'Oportunidades',
      crm_payments:'Pagos', crm_marketing_pipeline:'Pipeline de Marketing',
      crm_marketing:'Marketing', crm_automation:'Automatización', crm_sites:'Sitios',
      crm_reputation:'Reputación', crm_reporting:'Reportes', crm_documents:'Documentos',
      crm_courses:'Cursos', crm_social_planner:'Planificador Social', crm_settings:'Ajustes',
      switch_to:'Cambiar a', switch_crm:'NetWeb CRM', switch_cms:'NetWeb CMS',
      action_save:'Guardar', action_cancel:'Cancelar', action_delete:'Eliminar', action_edit:'Editar',
      action_new:'Nuevo', action_send:'Enviar', action_preview:'Vista previa', action_publish:'Publicar',
      lang_switch:'EN', lang_switch_title:'Switch to English',
    }
  };

  function current(){ try { return localStorage.getItem(KEY) || 'en'; } catch(_) { return 'en'; } }
  function t(k){ var l = current(); return (DICT[l] && DICT[l][k]) || (DICT.en && DICT.en[k]) || k; }
  function setLang(l){
    try { localStorage.setItem(KEY, l); } catch(_) {}
    document.documentElement.lang = (l === 'es') ? 'es-CL' : 'en';
    apply();
    try { window.dispatchEvent(new CustomEvent('nwm:lang', { detail: { lang: l } })); } catch(_) {}
  }
  function toggle(){ setLang(current() === 'en' ? 'es' : 'en'); }

  function apply(root){
    var scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n');
      var v = t(k);
      if (v) el.textContent = v;
    });
    scope.querySelectorAll('[data-i18n-attr]').forEach(function(el){
      // data-i18n-attr="title:foo; placeholder:bar"
      var spec = el.getAttribute('data-i18n-attr');
      spec.split(';').forEach(function(pair){
        var kv = pair.split(':'); if (kv.length !== 2) return;
        el.setAttribute(kv[0].trim(), t(kv[1].trim()));
      });
    });
  }

  function injectToggle(container, compact) {
    if (!container) return;
    if (container.querySelector('.nwm-lang-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nwm-lang-toggle';
    btn.setAttribute('title', t('lang_switch_title'));
    btn.textContent = t('lang_switch');
    btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:28px;padding:0 10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:inherit;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.05em;';
    btn.addEventListener('click', function(){ toggle(); btn.textContent = t('lang_switch'); btn.setAttribute('title', t('lang_switch_title')); });
    container.appendChild(btn);
  }

  w.NWMi18n = { t: t, current: current, setLang: setLang, toggle: toggle, apply: apply, injectToggle: injectToggle, DICT: DICT };
  // Auto-apply on load
  document.addEventListener('DOMContentLoaded', function(){ apply(); });
})(window);

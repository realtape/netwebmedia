/* Sites Page Logic */
(function () {
  "use strict";

  var FUNNELS = [
    { name: "Lead Capture Funnel", pages: 3, visits: 12480, conversions: 1872, status: "published" },
    { name: "Webinar Registration", pages: 2, visits: 8340, conversions: 2085, status: "published" },
    { name: "Free Audit Funnel", pages: 4, visits: 6120, conversions: 918, status: "published" },
    { name: "Service Booking", pages: 2, visits: 4560, conversions: 1140, status: "published" },
    { name: "Course Launch", pages: 5, visits: 3200, conversions: 384, status: "draft" },
    { name: "E-commerce Store", pages: 8, visits: 15600, conversions: 1248, status: "draft" }
  ];

  var WEBSITES = [
    { name: "NetWeb Media Main Site", pages: 12, visits: 45200, status: "published" },
    { name: "Client Portal", pages: 6, visits: 8900, status: "published" },
    { name: "Blog & Resources", pages: 24, visits: 18700, status: "published" }
  ];

  var FORMS = [
    { name: "Contact Us Form", submissions: 342, conversionRate: "4.2%", status: "active" },
    { name: "Free Audit Request", submissions: 156, conversionRate: "8.1%", status: "active" },
    { name: "Newsletter Signup", submissions: 891, conversionRate: "12.3%", status: "active" },
    { name: "Webinar Registration", submissions: 234, conversionRate: "6.7%", status: "active" },
    { name: "Feedback Survey", submissions: 78, conversionRate: "3.2%", status: "inactive" }
  ];

  var activeTab = 0;
  var L, TABS;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      newSite: "Nuevo Sitio",
      pages: "Páginas", visits: "Visitas", conv: "Conv.",
      funnelPreview: "Vista previa del embudo", websitePreview: "Vista previa del sitio",
      formName: "Nombre del formulario", submissions: "Envíos",
      conversionRate: "Tasa de Conversión", status: "Estado", actions: "Acciones",
      surveyName: "Nombre de Encuesta", responses: "Respuestas", avgScore: "Puntaje Prom.",
      edit: "Editar", share: "Compartir"
    } : {
      newSite: "New Site",
      pages: "Pages", visits: "Visits", conv: "Conv",
      funnelPreview: "Funnel Preview", websitePreview: "Website Preview",
      formName: "Form Name", submissions: "Submissions",
      conversionRate: "Conversion Rate", status: "Status", actions: "Actions",
      surveyName: "Survey Name", responses: "Responses", avgScore: "Avg Score",
      edit: "Edit", share: "Share"
    };
    TABS = isEs ? ["Embudos", "Sitios Web", "Formularios", "Encuestas"] : ["Funnels", "Websites", "Forms", "Surveys"];
    CRM_APP.buildHeader(CRM_APP.t('nav.sites'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newSite + '</button>');
    renderTabs();
    renderContent();
  });

  function renderTabs() {
    var bar = document.getElementById("tabBar");
    if (!bar) return;
    var html = "";
    for (var i = 0; i < TABS.length; i++) {
      html += '<button class="tab-btn' + (i === activeTab ? " active" : "") + '" data-tab="' + i + '">' + TABS[i] + '</button>';
    }
    bar.innerHTML = html;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activeTab = parseInt(btn.getAttribute("data-tab"), 10);
      renderTabs();
      renderContent();
    });
  }

  function renderContent() {
    var body = document.getElementById("sitesBody");
    if (!body) return;
    var html = "";

    if (activeTab === 0) html = renderFunnels();
    else if (activeTab === 1) html = renderWebsites();
    else if (activeTab === 2) html = renderFormsTable();
    else html = renderSurveys();

    body.innerHTML = html;
  }

  function renderFunnels() {
    var html = '<div class="site-grid">';
    for (var i = 0; i < FUNNELS.length; i++) {
      var f = FUNNELS[i];
      var convRate = f.visits > 0 ? ((f.conversions / f.visits) * 100).toFixed(1) + "%" : "0%";
      html += '<div class="site-card">';
      html += '<div class="site-card-thumb">' + CRM_ICONS.sites + ' ' + L.funnelPreview + '</div>';
      html += '<div class="site-card-body">';
      html += '<div class="site-card-title">' + f.name + '</div>';
      html += '<div class="site-card-stats">';
      html += '<div>' + L.pages + ': <span>' + f.pages + '</span></div>';
      html += '<div>' + L.visits + ': <span>' + f.visits.toLocaleString() + '</span></div>';
      html += '<div>' + L.conv + ': <span>' + convRate + '</span></div>';
      html += '</div>';
      html += '<div class="site-card-footer">';
      html += CRM_APP.statusBadge(f.status);
      html += '<button class="action-link">' + L.edit + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderWebsites() {
    var html = '<div class="site-grid">';
    for (var i = 0; i < WEBSITES.length; i++) {
      var w = WEBSITES[i];
      html += '<div class="site-card">';
      html += '<div class="site-card-thumb">' + CRM_ICONS.sites + ' ' + L.websitePreview + '</div>';
      html += '<div class="site-card-body">';
      html += '<div class="site-card-title">' + w.name + '</div>';
      html += '<div class="site-card-stats">';
      html += '<div>' + L.pages + ': <span>' + w.pages + '</span></div>';
      html += '<div>' + L.visits + ': <span>' + w.visits.toLocaleString() + '</span></div>';
      html += '</div>';
      html += '<div class="site-card-footer">';
      html += CRM_APP.statusBadge(w.status);
      html += '<button class="action-link">' + L.edit + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderFormsTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.formName + '</th><th>' + L.submissions + '</th><th>' + L.conversionRate + '</th><th>' + L.status + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < FORMS.length; i++) {
      var f = FORMS[i];
      html += '<tr>';
      html += '<td><strong>' + f.name + '</strong></td>';
      html += '<td>' + f.submissions + '</td>';
      html += '<td>' + f.conversionRate + '</td>';
      html += '<td>' + CRM_APP.statusBadge(f.status) + '</td>';
      html += '<td><button class="action-link">' + L.edit + '</button> <button class="action-link">' + L.share + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderSurveys() {
    var surveys = [
      { name: "Customer Satisfaction", responses: 234, avgScore: "4.2/5", status: "active" },
      { name: "NPS Survey", responses: 178, avgScore: "72 NPS", status: "active" },
      { name: "Onboarding Feedback", responses: 89, avgScore: "4.5/5", status: "active" },
      { name: "Feature Request Poll", responses: 56, avgScore: "N/A", status: "draft" }
    ];
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.surveyName + '</th><th>' + L.responses + '</th><th>' + L.avgScore + '</th><th>' + L.status + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < surveys.length; i++) {
      var s = surveys[i];
      html += '<tr>';
      html += '<td><strong>' + s.name + '</strong></td>';
      html += '<td>' + s.responses + '</td>';
      html += '<td>' + s.avgScore + '</td>';
      html += '<td>' + CRM_APP.statusBadge(s.status) + '</td>';
      html += '<td><button class="action-link">' + L.edit + '</button> <button class="action-link">' + L.share + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

})();

/* Documents Page Logic */
(function () {
  "use strict";

  function betaBannerHTML(isEs) {
    var title = isEs
      ? 'Beta — En Desarrollo Activo'
      : 'Beta — In Active Development';
    var copy = isEs
      ? 'Este módulo está en desarrollo activo. Los datos mostrados son de ejemplo. La funcionalidad completa se lanza en Q3 2026.'
      : 'This module is in active development. The data shown below is sample data. Full functionality ships in Q3 2026.';
    var cta = isEs ? 'Avísame cuando esté listo →' : 'Get notified when this ships →';
    return '<div class="nwm-beta-banner" role="status" style="background:linear-gradient(135deg,#010F3B,#0d1f5c);border:1px solid rgba(255,103,31,0.45);border-left:4px solid #FF671F;border-radius:12px;padding:14px 18px;margin:0 0 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:240px;">'
      + '<div style="color:#FF671F;font-weight:700;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">' + title + '</div>'
      + '<div style="color:#cdd3e3;font-size:13px;margin-top:4px;line-height:1.5;">' + copy + '</div>'
      + '</div>'
      + '<a href="/contact.html?topic=documents-beta" style="color:#FF671F;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;">' + cta + '</a>'
      + '</div>';
  }

  var DOCUMENTS = [
    { name: "TechCorp Enterprise Proposal", type: "Proposal", recipient: "Sarah Chen", status: "signed", created: "Apr 10, 2026" },
    { name: "Innovate Co Service Agreement", type: "Contract", recipient: "Marcus Johnson", status: "sent", created: "Apr 8, 2026" },
    { name: "GlobalFin Renewal Contract", type: "Contract", recipient: "David Kim", status: "viewed", created: "Apr 5, 2026" },
    { name: "DesignHub Web Dev Proposal", type: "Proposal", recipient: "Rachel Foster", status: "draft", created: "Apr 12, 2026" },
    { name: "EuroTech Enterprise SOW", type: "Proposal", recipient: "Nina Volkov", status: "sent", created: "Apr 7, 2026" },
    { name: "Nexus Group NDA", type: "Contract", recipient: "Aisha Patel", status: "signed", created: "Apr 1, 2026" },
    { name: "LATAM Retail Invoice Q1", type: "Invoice", recipient: "Carlos Mendez", status: "signed", created: "Mar 31, 2026" },
    { name: "CloudNine Starter Proposal", type: "Proposal", recipient: "Lisa Wang", status: "draft", created: "Apr 13, 2026" }
  ];

  var activeTab = 0;
  var L, TABS;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      newDoc: "Nuevo Documento",
      name: "Nombre", type: "Tipo", recipient: "Destinatario",
      status: "Estado", created: "Creado", actions: "Acciones",
      view: "Ver", send: "Enviar"
    } : {
      newDoc: "New Document",
      name: "Name", type: "Type", recipient: "Recipient",
      status: "Status", created: "Created", actions: "Actions",
      view: "View", send: "Send"
    };
    TABS = isEs ? ["Todos", "Propuestas", "Contratos", "Facturas"] : ["All", "Proposals", "Contracts", "Invoices"];
    CRM_APP.buildHeader(CRM_APP.t('nav.documents'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newDoc + '</button>');
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
    var body = document.getElementById("documentsBody");
    if (!body) return;

    var filtered = DOCUMENTS;
    if (activeTab === 1) filtered = DOCUMENTS.filter(function (d) { return d.type === "Proposal"; });
    else if (activeTab === 2) filtered = DOCUMENTS.filter(function (d) { return d.type === "Contract"; });
    else if (activeTab === 3) filtered = DOCUMENTS.filter(function (d) { return d.type === "Invoice"; });

    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var html = betaBannerHTML(isEs);
    html += '<table class="data-table"><thead><tr>';
    html += '<th>' + L.name + '</th><th>' + L.type + '</th><th>' + L.recipient + '</th><th>' + L.status + '</th><th>' + L.created + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < filtered.length; i++) {
      var d = filtered[i];
      html += '<tr>';
      html += '<td><div style="display:flex;align-items:center;gap:8px">' + CRM_APP.ICONS.documents + ' <strong>' + d.name + '</strong></div></td>';
      html += '<td>' + d.type + '</td>';
      html += '<td>' + d.recipient + '</td>';
      html += '<td>' + CRM_APP.statusBadge(d.status) + '</td>';
      html += '<td>' + d.created + '</td>';
      html += '<td><button class="action-link">' + L.view + '</button> <button class="action-link">' + L.send + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';

    body.innerHTML = html;
  }

})();

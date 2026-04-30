/* Automation Page Logic */
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
      + '<a href="/contact.html?topic=automation-beta" style="color:#FF671F;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;">' + cta + '</a>'
      + '</div>';
  }

  var WORKFLOWS = [
    { id: 1, name: "New Lead Welcome", trigger: "Trigger: New contact created with status 'Lead'", active: true, lastRun: "2 hours ago", runs: 1247 },
    { id: 2, name: "Missed Call Text-Back", trigger: "Trigger: Missed inbound call detected", active: true, lastRun: "35 min ago", runs: 856 },
    { id: 3, name: "Review Request After Service", trigger: "Trigger: Deal moved to 'Closed Won' stage", active: true, lastRun: "1 day ago", runs: 432 },
    { id: 4, name: "Appointment Reminder 24h", trigger: "Trigger: 24 hours before scheduled appointment", active: true, lastRun: "6 hours ago", runs: 2104 },
    { id: 5, name: "Lead Nurture Sequence", trigger: "Trigger: Contact tag 'nurture' added, 5-email drip over 14 days", active: true, lastRun: "3 hours ago", runs: 689 },
    { id: 6, name: "Invoice Follow-Up", trigger: "Trigger: Invoice unpaid after 7 days, sends reminder email", active: false, lastRun: "3 days ago", runs: 156 },
    { id: 7, name: "Birthday Campaign", trigger: "Trigger: Contact birthday field matches today's date", active: true, lastRun: "1 day ago", runs: 378 },
    { id: 8, name: "Re-engagement 30 Days", trigger: "Trigger: No contact activity for 30 days, sends win-back email", active: false, lastRun: "5 days ago", runs: 245 },
    { id: 9, name: "New Deal Notification", trigger: "Trigger: New deal created, notifies sales team via email + SMS", active: true, lastRun: "4 hours ago", runs: 1893 },
    { id: 10, name: "Onboarding Sequence", trigger: "Trigger: Contact status changed to 'Customer', 7-step onboarding flow", active: true, lastRun: "1 day ago", runs: 521 }
  ];

  var activeFilter = "all";
  var L;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      newWorkflow: "Nuevo Flujo", all: "Todos", active: "Activos", inactive: "Inactivos",
      runs: "Ejecuciones", last: "Última", edit: "Editar"
    } : {
      newWorkflow: "New Workflow", all: "All", active: "Active", inactive: "Inactive",
      runs: "Runs", last: "Last", edit: "Edit"
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.automation'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newWorkflow + '</button>');
    render();
  });

  function render() {
    var body = document.getElementById("automationBody");
    if (!body) return;

    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var html = betaBannerHTML(isEs);
    html += '<div class="filter-group" style="margin-bottom:20px">';
    html += filterBtn("all", L.all);
    html += filterBtn("active", L.active);
    html += filterBtn("inactive", L.inactive);
    html += '</div>';

    var filtered = WORKFLOWS;
    if (activeFilter === "active") {
      filtered = WORKFLOWS.filter(function (w) { return w.active; });
    } else if (activeFilter === "inactive") {
      filtered = WORKFLOWS.filter(function (w) { return !w.active; });
    }

    html += '<div class="workflow-grid">';
    for (var i = 0; i < filtered.length; i++) {
      var w = filtered[i];
      html += '<div class="workflow-card">';
      html += '<div class="workflow-card-header">';
      html += '<div class="workflow-card-title">' + w.name + '</div>';
      html += '<label class="status-toggle">';
      html += '<input type="checkbox"' + (w.active ? " checked" : "") + ' data-id="' + w.id + '">';
      html += '<span class="toggle-track"></span>';
      html += '</label>';
      html += '</div>';
      html += '<div class="workflow-card-trigger">' + w.trigger + '</div>';
      html += '<div class="workflow-card-footer">';
      html += '<div class="workflow-card-stats">';
      html += '<div class="workflow-stat">' + L.runs + ': <span>' + w.runs.toLocaleString() + '</span></div>';
      html += '<div class="workflow-stat">' + L.last + ': <span>' + w.lastRun + '</span></div>';
      html += '</div>';
      html += '<button class="action-link">' + L.edit + '</button>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    body.innerHTML = html;

    var filterBtns = body.querySelectorAll(".filter-btn");
    for (var j = 0; j < filterBtns.length; j++) {
      filterBtns[j].addEventListener("click", function () {
        activeFilter = this.getAttribute("data-filter");
        render();
      });
    }

    var toggles = body.querySelectorAll(".status-toggle input");
    for (var k = 0; k < toggles.length; k++) {
      toggles[k].addEventListener("change", function () {
        var id = parseInt(this.getAttribute("data-id"), 10);
        for (var m = 0; m < WORKFLOWS.length; m++) {
          if (WORKFLOWS[m].id === id) {
            WORKFLOWS[m].active = this.checked;
            break;
          }
        }
      });
    }
  }

  function filterBtn(value, label) {
    var cls = value === activeFilter ? " active" : "";
    return '<button class="filter-btn' + cls + '" data-filter="' + value + '">' + label + '</button>';
  }

})();

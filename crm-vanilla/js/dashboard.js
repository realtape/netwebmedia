/* Dashboard Page Logic */
(function () {
  "use strict";

  var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function monthAbbr(yyyymm) {
    /* "2026-01" → "Jan" */
    var parts = yyyymm ? yyyymm.split('-') : [];
    if (parts.length === 2) {
      var idx = parseInt(parts[1], 10) - 1;
      if (idx >= 0 && idx < 12) return MONTH_ABBR[idx];
    }
    return yyyymm || '';
  }

  function formatRevenue(val) {
    var n = parseFloat(val) || 0;
    return '$' + (n / 1000).toFixed(1) + 'k';
  }

  function formatMoney(val) {
    var n = parseFloat(val) || 0;
    return '$' + Math.round(n).toLocaleString();
  }

  function formatDate(s) {
    if (!s) return '';
    var d = new Date((s.indexOf('T') === -1 ? s.replace(' ', 'T') : s) + 'Z');
    if (isNaN(d.getTime())) return s;
    var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return M[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function formatHour(h) {
    var hour = parseInt(h, 10) || 0;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    var h12 = hour % 12 || 12;
    return h12 + ':00 ' + ampm;
  }

  function formatDealValue(val) {
    var n = parseInt(val, 10) || 0;
    return '$' + n.toLocaleString();
  }

  function showSectionSpinner(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:2rem;">' +
      '<div style="border:3px solid #e0e0e0;border-top-color:#FF671F;border-radius:50%;width:28px;height:28px;animation:spin 0.8s linear infinite;"></div>' +
      '</div>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      newDeal: "Nueva Oportunidad", revenueOverview: "Resumen de Ingresos",
      vsLastQuarter: "+24% vs. trimestre anterior", activeDeals: "Oportunidades Activas",
      viewAll: "Ver Todo", todaySchedule: "Agenda de Hoy", recentContacts: "Contactos Recientes",
      totalContacts: "Contactos Totales", newLeads: "Leads Nuevos",
      revenue: "Ingresos", conversion: "Conversión", avgDeal: "Oportunidad Prom.",
      vsLastMonth: "vs. mes anterior", noRevenueData: "Sin datos de ingresos aún",
      loading: "Cargando…", errorLoading: "Error al cargar datos."
    } : {
      newDeal: "New Deal", revenueOverview: "Revenue Overview",
      vsLastQuarter: "+24% vs last quarter", activeDeals: "Active Deals",
      viewAll: "View All", todaySchedule: "Today's Schedule", recentContacts: "Recent Contacts",
      totalContacts: "Total Contacts", newLeads: "New Leads",
      revenue: "Revenue", conversion: "Conversion", avgDeal: "Avg Deal",
      vsLastMonth: "vs last month", noRevenueData: "No revenue data yet",
      loading: "Loading…", errorLoading: "Error loading data."
    };
    window.__dashL = L;

    CRM_APP.buildHeader(CRM_APP.t('nav.dashboard'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newDeal + '</button>');

    updateStaticCardTitles(L);

    /* Show spinners in every section while fetching */
    showSectionSpinner('statsGrid');
    showSectionSpinner('revenueChart');
    showSectionSpinner('todaySchedule');
    showSectionSpinner('activeDeals');
    showSectionSpinner('recentContacts');

    /* Single fetch for all dashboard data.
       Relative URL ('api/?r=stats') resolves to /crm/api/?r=stats → crm-vanilla
       handler. Absolute '/api/?r=stats' would hit api-php (path-routed) and
       return the API index JSON instead of stats — was the cause of the
       all-zeros dashboard before 2026-05-28. */
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=stats', true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var stats;
        try { stats = JSON.parse(xhr.responseText); } catch (err) { stats = null; }
        if (stats) {
          var isAdmin = (stats.mrr !== undefined || stats.totalUsers !== undefined);
          if (isAdmin) {
            renderAdminStats(L, stats);
            renderDistributions(stats);
            renderRecentSignups(stats.recentUsers || []);
          } else {
            renderStats(L, stats);
            renderRecentContacts(stats.recentContacts || []);
          }
          renderRevenueChart(stats.revenueData || [], L);
          renderSchedule(stats.scheduleToday || []);
          renderActiveDeals(stats.activeDealsTop || []);
        } else {
          showError(L.errorLoading);
        }
      } else {
        showError(L.errorLoading);
      }
    };
    xhr.send();
  });

  function showError(msg) {
    var ids = ['statsGrid', 'revenueChart', 'todaySchedule', 'activeDeals', 'recentContacts'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) el.innerHTML = '<p style="color:red;padding:1rem;">' + msg + '</p>';
    }
  }

  function updateStaticCardTitles(L) {
    var titles = document.querySelectorAll('.card-title');
    for (var i = 0; i < titles.length; i++) {
      var t = titles[i];
      var tx = t.textContent.trim();
      if (tx === 'Revenue Overview') t.textContent = L.revenueOverview;
      else if (tx === 'Active Deals') t.textContent = L.activeDeals;
      else if (tx === "Today's Schedule") t.textContent = L.todaySchedule;
      else if (tx === 'Recent Contacts') t.textContent = L.recentContacts;
    }
    var changeSpan = document.querySelector('.stat-change.positive');
    if (changeSpan && changeSpan.textContent.trim() === '+24% vs last quarter') {
      changeSpan.textContent = L.vsLastQuarter;
    }
    var viewAllBtns = document.querySelectorAll('.btn.btn-secondary.btn-sm');
    for (var j = 0; j < viewAllBtns.length; j++) {
      if (viewAllBtns[j].textContent.trim() === 'View All') viewAllBtns[j].textContent = L.viewAll;
    }
  }

  function renderStats(L, s) {
    var container = document.getElementById("statsGrid");
    if (!container) return;

    var cards = [
      { label: L.totalContacts, value: (s.totalContacts || 0).toLocaleString(), change: "+12%", icon: "contacts", positive: true, href: "contacts.html" },
      { label: L.newLeads, value: s.newLeads || 0, change: "+8%", icon: "contacts", positive: true, href: "new-leads.html" },
      { label: L.activeDeals, value: s.activeDeals || 0, change: "+3", icon: "pipeline", positive: true, href: "pipeline.html" },
      { label: L.revenue, value: formatRevenue(s.revenue || 0), change: "+24%", icon: "dashboard", positive: true, href: "reporting.html" },
      { label: L.conversion, value: (s.conversion || 0) + "%", change: "+5%", icon: "pipeline", positive: true, href: "reporting.html" },
      { label: L.avgDeal, value: formatRevenue(s.avgDeal || 0), change: "-2%", icon: "dashboard", positive: false, href: "pipeline.html" }
    ];

    var html = "";
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<a class="stat-card stat-card-link" href="' + c.href + '">';
      html += '<div class="stat-header">';
      html += '<span class="stat-label">' + c.label + '</span>';
      html += '<span class="stat-icon">' + CRM_APP.ICONS[c.icon] + '</span>';
      html += '</div>';
      html += '<div class="stat-value">' + c.value + '</div>';
      html += '<div class="stat-change ' + (c.positive ? "positive" : "negative") + '">' + c.change + ' ' + L.vsLastMonth + '</div>';
      html += '</a>';
    }
    container.innerHTML = html;
  }

  function renderRevenueChart(data, L) {
    var container = document.getElementById("revenueChart");
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">' + L.noRevenueData + '</p>';
      return;
    }

    var maxVal = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].value > maxVal) maxVal = data[i].value;
    }
    if (maxVal === 0) maxVal = 1; /* avoid divide-by-zero */

    var html = '<div class="chart-bars">';
    for (var j = 0; j < data.length; j++) {
      var pct = (data[j].value / maxVal) * 100;
      var isLast = j === data.length - 1;
      html += '<div class="chart-bar-group">';
      html += '<div class="chart-bar-wrapper">';
      html += '<div class="chart-bar' + (isLast ? " accent" : "") + '" style="height:' + pct + '%"></div>';
      html += '</div>';
      html += '<div class="chart-label">' + monthAbbr(data[j].month) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderSchedule(items) {
    var container = document.getElementById("todaySchedule");
    if (!container) return;

    var html = "";
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html += '<a class="schedule-item dash-row-link" href="calendar.html">';
      html += '<div class="schedule-time">' + formatHour(item.start_hour) + '</div>';
      html += '<div class="schedule-content">';
      html += '<div class="schedule-title">' + item.title + '</div>';
      html += '<span class="schedule-type type-' + item.type + '">' + item.type + '</span>';
      html += '</div>';
      html += '</a>';
    }
    container.innerHTML = html;
  }

  function renderActiveDeals(deals) {
    var container = document.getElementById("activeDeals");
    if (!container) return;

    var html = "";
    for (var i = 0; i < deals.length; i++) {
      var d = deals[i];
      html += '<a class="deal-row dash-row-link" href="pipeline.html">';
      html += '<div class="deal-info">';
      html += '<div class="deal-title">' + d.title + '</div>';
      html += '<div class="deal-company">' + (d.company || '') + '</div>';
      html += '</div>';
      html += '<div class="deal-meta">';
      html += '<div class="deal-value">' + formatDealValue(d.value) + '</div>';
      html += '<span class="deal-stage">' + (d.stage || '') + '</span>';
      html += '</div>';
      html += '</a>';
    }
    container.innerHTML = html;
  }

  function renderRecentContacts(contacts) {
    var container = document.getElementById("recentContacts");
    if (!container) return;

    var html = "";
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      html += '<a class="contact-row dash-row-link" href="contacts.html">';
      html += '<div class="contact-avatar">' + esc(c.avatar || '') + '</div>';
      html += '<div class="contact-info">';
      html += '<div class="contact-name">' + esc(c.name) + '</div>';
      html += '<div class="contact-company">' + esc(c.company || '') + '</div>';
      html += '</div>';
      html += CRM_APP.statusBadge(c.status);
      html += '</a>';
    }
    container.innerHTML = html;
  }

  /* ───── Admin / Superadmin overview (mirrors admin.netwebmedia.com) ───── */

  function renderAdminStats(L, s) {
    var container = document.getElementById('statsGrid');
    if (!container) return;

    var cards = [
      { label: 'MRR',             value: formatMoney(s.mrr),            icon: 'dashboard', href: 'reporting.html' },
      { label: 'ARR',             value: formatMoney(s.arr),            icon: 'dashboard', href: 'reporting.html' },
      { label: 'Total Users',     value: (s.totalUsers || 0).toLocaleString(), icon: 'contacts', href: 'subaccounts.html' },
      { label: 'New This Month',  value: (s.newUsersMonth || 0).toLocaleString(), icon: 'contacts', href: 'subaccounts.html' },
      { label: 'Contacts',        value: (s.totalContacts || 0).toLocaleString(), icon: 'contacts', href: 'contacts.html' },
      { label: 'Deals',           value: (s.totalDeals || 0).toLocaleString(), icon: 'pipeline', href: 'pipeline.html' }
    ];

    var html = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<a class="stat-card stat-card-link" href="' + c.href + '">';
      html += '<div class="stat-header">';
      html += '<span class="stat-label">' + esc(c.label) + '</span>';
      html += '<span class="stat-icon">' + CRM_APP.ICONS[c.icon] + '</span>';
      html += '</div>';
      html += '<div class="stat-value">' + c.value + '</div>';
      html += '</a>';
    }
    container.innerHTML = html;
  }

  function renderDistributions(s) {
    var row = document.getElementById('distributionRow');
    if (!row) return;
    var statusObj = s.byStatus || {};
    var planArr   = s.byPlan   || [];
    var statusKeys = Object.keys(statusObj);
    if (statusKeys.length === 0 && planArr.length === 0) {
      row.style.display = 'none';
      return;
    }
    row.style.display = '';

    /* By Status — bar list */
    var maxStatus = 1;
    for (var i = 0; i < statusKeys.length; i++) {
      if (+statusObj[statusKeys[i]] > maxStatus) maxStatus = +statusObj[statusKeys[i]];
    }
    var sHtml = '';
    for (var j = 0; j < statusKeys.length; j++) {
      var k = statusKeys[j];
      var cnt = +statusObj[k] || 0;
      var pct = Math.round((cnt / maxStatus) * 100);
      sHtml += '<div class="dist-row">';
      sHtml += '<div class="dist-label">' + esc(k) + '</div>';
      sHtml += '<div class="dist-bar-wrap"><div class="dist-bar" style="width:' + pct + '%"></div></div>';
      sHtml += '<div class="dist-count">' + cnt + '</div>';
      sHtml += '</div>';
    }
    var statusEl = document.getElementById('distStatus');
    if (statusEl) statusEl.innerHTML = sHtml || '<p style="color:#888;padding:1rem">No data.</p>';

    /* By Plan — bar list */
    var maxPlan = 1;
    for (var p = 0; p < planArr.length; p++) {
      if (+planArr[p].cnt > maxPlan) maxPlan = +planArr[p].cnt;
    }
    var pHtml = '';
    for (var q = 0; q < planArr.length; q++) {
      var plan = planArr[q];
      var pcnt = +plan.cnt || 0;
      var ppct = Math.round((pcnt / maxPlan) * 100);
      pHtml += '<div class="dist-row">';
      pHtml += '<div class="dist-label">' + esc(plan.plan || '—') + '</div>';
      pHtml += '<div class="dist-bar-wrap"><div class="dist-bar" style="width:' + ppct + '%"></div></div>';
      pHtml += '<div class="dist-count">' + pcnt + '</div>';
      pHtml += '</div>';
    }
    var planEl = document.getElementById('distPlan');
    if (planEl) planEl.innerHTML = pHtml || '<p style="color:#888;padding:1rem">No data.</p>';
  }

  function renderRecentSignups(users) {
    var container = document.getElementById('recentContacts');
    if (!container) return;

    /* Repurpose the Recent Contacts panel into Recent Signups for admins. */
    var title = document.getElementById('recentPanelTitle');
    if (title) title.textContent = 'Recent Signups';
    var link = document.getElementById('recentPanelLink');
    if (link) { link.textContent = 'View All Users'; link.href = 'subaccounts.html'; }

    if (!users.length) {
      container.innerHTML = '<p style="color:#888;padding:1rem">No signups yet.</p>';
      return;
    }

    var rows = users.slice(0, 8);
    var html = '<div class="signup-list">';
    for (var i = 0; i < rows.length; i++) {
      var u = rows[i];
      var initials = (u.name || u.email || '?').trim().charAt(0).toUpperCase();
      html += '<a class="contact-row dash-row-link" href="subaccounts.html">';
      html += '<div class="contact-avatar">' + esc(initials) + '</div>';
      html += '<div class="contact-info">';
      html += '<div class="contact-name">' + esc(u.name || '—') + '</div>';
      html += '<div class="contact-company">' + esc(u.email) + (u.company ? ' · ' + esc(u.company) : '') + '</div>';
      html += '</div>';
      html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">';
      html += '<span class="badge badge-' + esc(u.plan || 'starter') + '" style="text-transform:uppercase;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:#fff3eb;color:#FF671F;">' + esc(u.plan || '—') + '</span>';
      html += '<span style="font-size:11px;color:#888">' + esc(formatDate(u.created_at)) + '</span>';
      html += '</div>';
      html += '</a>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

})();

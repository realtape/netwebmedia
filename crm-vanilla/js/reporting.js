/* Reporting Page Logic — live data from /api/?r=reporting */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      title: "Reportes",
      totalContacts: "Contactos Totales",
      totalDeals: "Negocios Totales",
      totalValue: "Valor Total",
      wonThisMonth: "Ganados Este Mes",
      totalCampaigns: "Campañas",
      avgOpen: "Apertura Promedio",
      avgClick: "Clics Promedio",
      byStatus: "Contactos por Estado",
      monthlyGrowth: "Crecimiento Mensual",
      dealFunnel: "Embudo de Negocios",
      recentCampaigns: "Campañas Recientes",
      campaign: "Campaña",
      sent: "Enviados",
      opened: "Abiertos",
      clicked: "Clics",
      openRate: "Apertura",
      clickRate: "Clics %",
      loading: "Cargando reportes…",
      noData: "Sin datos aún — agrega contactos y negocios para ver reportes.",
      lead: "Lead", customer: "Cliente", prospect: "Prospecto"
    } : {
      title: "Reporting",
      totalContacts: "Total Contacts",
      totalDeals: "Total Deals",
      totalValue: "Total Value",
      wonThisMonth: "Won This Month",
      totalCampaigns: "Campaigns",
      avgOpen: "Avg Open Rate",
      avgClick: "Avg Click Rate",
      byStatus: "Contacts by Status",
      monthlyGrowth: "Monthly Growth",
      dealFunnel: "Deal Funnel by Stage",
      recentCampaigns: "Recent Campaigns",
      campaign: "Campaign",
      sent: "Sent",
      opened: "Opened",
      clicked: "Clicked",
      openRate: "Open %",
      clickRate: "Click %",
      loading: "Loading reporting data…",
      noData: "No data yet — add contacts and deals to see reporting.",
      lead: "Lead", customer: "Customer", prospect: "Prospect"
    };

    CRM_APP.buildHeader(CRM_APP.t('nav.reporting'));
    renderLoading(L);
    fetchData(L);
  });

  /* ── loading state ──────────────────────────────────────────────── */
  function renderLoading(L) {
    var body = document.getElementById("reportingBody");
    if (!body) return;
    body.innerHTML =
      '<div style="padding:48px;text-align:center;color:var(--text-dim)">' +
      '<div style="font-size:32px;margin-bottom:12px">⏳</div>' +
      '<div>' + L.loading + '</div>' +
      '</div>';
  }

  /* ── fetch ──────────────────────────────────────────────────────── */
  function fetchData(L) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=reporting', true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        if (data) {
          render(data, L);
        } else {
          renderError(L);
        }
      } else {
        renderError(L);
      }
    };
    xhr.send();
  }

  function renderError(L) {
    var body = document.getElementById("reportingBody");
    if (!body) return;
    body.innerHTML =
      '<div style="padding:48px;text-align:center;color:var(--text-dim)">' +
      '<div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
      '<div>Could not load reporting data. Check API connection.</div>' +
      '</div>';
  }

  /* ── main render ────────────────────────────────────────────────── */
  function render(data, L) {
    var body = document.getElementById("reportingBody");
    if (!body) return;

    var contacts  = data.contacts  || {};
    var deals     = data.deals     || {};
    var campaigns = data.campaigns || {};

    var html = '';

    /* ── summary cards ── */
    html += '<div class="summary-cards">';
    html += summaryCard(L.totalContacts, contacts.total || 0, '');
    html += summaryCard(L.totalDeals,    deals.total    || 0, '');
    html += summaryCard(L.totalValue,    formatCurrency(deals.total_value || 0), '');
    html += summaryCard(L.wonThisMonth,  deals.won_this_month || 0, 'green');
    html += '</div>';

    /* ── two-column charts row ── */
    html += '<div class="charts-row">';

    /* left: contacts by status */
    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">' + L.byStatus + '</div>';
    html += '<div class="chart-placeholder-area">';
    var byStatus = contacts.by_status || {};
    var statusKeys = ['lead', 'customer', 'prospect'];
    var maxStatus = 1;
    for (var si = 0; si < statusKeys.length; si++) {
      var sv = byStatus[statusKeys[si]] || 0;
      if (sv > maxStatus) maxStatus = sv;
    }
    var statusLabels = { lead: L.lead, customer: L.customer, prospect: L.prospect };
    var statusColors = { lead: '#FF671F', customer: '#00b894', prospect: '#a29bfe' };
    var hasStatusData = false;
    for (var sk = 0; sk < statusKeys.length; sk++) {
      if ((byStatus[statusKeys[sk]] || 0) > 0) { hasStatusData = true; break; }
    }
    if (!hasStatusData) {
      html += '<div class="empty-state">' + L.noData + '</div>';
    } else {
      html += '<div style="padding:8px 0">';
      for (var si2 = 0; si2 < statusKeys.length; si2++) {
        var key   = statusKeys[si2];
        var count = byStatus[key] || 0;
        var pct   = Math.round((count / maxStatus) * 100);
        html += '<div style="margin-bottom:14px">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">';
        html += '<span style="color:var(--text-dim)">' + (statusLabels[key] || key) + '</span>';
        html += '<span style="font-weight:600">' + count + '</span>';
        html += '</div>';
        html += '<div style="height:8px;background:var(--bg-card);border-radius:4px;overflow:hidden">';
        html += '<div style="height:8px;width:' + pct + '%;background:' + (statusColors[key] || '#6c5ce7') + ';border-radius:4px;transition:width .4s"></div>';
        html += '</div>';
        html += '</div>';
      }
      /* extra statuses not in the default three */
      for (var xk in byStatus) {
        if (!byStatus.hasOwnProperty(xk)) continue;
        if (statusKeys.indexOf(xk) !== -1) continue;
        var xcount = byStatus[xk] || 0;
        var xpct   = Math.round((xcount / maxStatus) * 100);
        html += '<div style="margin-bottom:14px">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">';
        html += '<span style="color:var(--text-dim)">' + xk + '</span>';
        html += '<span style="font-weight:600">' + xcount + '</span>';
        html += '</div>';
        html += '<div style="height:8px;background:var(--bg-card);border-radius:4px;overflow:hidden">';
        html += '<div style="height:8px;width:' + xpct + '%;background:#fdcb6e;border-radius:4px;transition:width .4s"></div>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    /* right: monthly contact growth */
    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">' + L.monthlyGrowth + '</div>';
    html += '<div class="chart-placeholder-area">';
    var byMonth = contacts.by_month || [];
    if (!byMonth.length) {
      html += '<div class="empty-state">' + L.noData + '</div>';
    } else {
      var maxMonth = 1;
      for (var mi = 0; mi < byMonth.length; mi++) {
        if (byMonth[mi].count > maxMonth) maxMonth = byMonth[mi].count;
      }
      html += '<div style="display:flex;align-items:flex-end;gap:8px;height:100px;padding-top:8px">';
      for (var mi2 = 0; mi2 < byMonth.length; mi2++) {
        var m    = byMonth[mi2];
        var mPct = Math.round((m.count / maxMonth) * 100);
        html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">';
        html += '<div style="font-size:11px;color:var(--text-dim);font-weight:600">' + m.count + '</div>';
        html += '<div style="width:100%;height:' + mPct + 'px;min-height:4px;background:#FF671F;border-radius:3px 3px 0 0;transition:height .4s"></div>';
        html += '<div style="font-size:10px;color:var(--text-dim);white-space:nowrap">' + m.month.slice(5) + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>'; /* end charts-row */

    /* ── campaign summary cards ── */
    html += '<div class="summary-cards" style="margin-top:24px">';
    html += summaryCard(L.totalCampaigns, campaigns.total || 0, '');
    html += summaryCard(L.avgOpen,  (campaigns.avg_open_rate  || 0) + '%', '');
    html += summaryCard(L.avgClick, (campaigns.avg_click_rate || 0) + '%', '');
    html += '</div>';

    /* ── deal funnel ── */
    var stageData = deals.by_stage || [];
    html += '<div class="card" style="margin-top:24px">';
    html += '<div class="card-header"><h2 class="card-title">' + L.dealFunnel + '</h2></div>';
    if (!stageData.length) {
      html += '<div class="empty-state" style="padding:24px">' + L.noData + '</div>';
    } else {
      var maxStage = 1;
      for (var di = 0; di < stageData.length; di++) {
        if (stageData[di].count > maxStage) maxStage = stageData[di].count;
      }
      html += '<div style="padding:16px 20px">';
      for (var di2 = 0; di2 < stageData.length; di2++) {
        var stage  = stageData[di2];
        var sPct   = Math.round((stage.count / maxStage) * 100);
        html += '<div style="margin-bottom:14px">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">';
        html += '<span style="color:var(--text-dim)">' + escHtml(stage.stage) + '</span>';
        html += '<span><strong>' + stage.count + '</strong> <span style="color:var(--text-dim);font-size:11px">(' + formatCurrency(stage.value) + ')</span></span>';
        html += '</div>';
        html += '<div style="height:8px;background:var(--bg-card);border-radius:4px;overflow:hidden">';
        html += '<div style="height:8px;width:' + sPct + '%;background:linear-gradient(90deg,#010F3B,#FF671F);border-radius:4px;transition:width .4s"></div>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    /* ── recent campaigns table ── */
    var recent = campaigns.recent || [];
    html += '<div class="card" style="margin-top:24px">';
    html += '<div class="card-header"><h2 class="card-title">' + L.recentCampaigns + '</h2></div>';
    if (!recent.length) {
      html += '<div class="empty-state" style="padding:24px">' + L.noData + '</div>';
    } else {
      html += '<table class="data-table"><thead><tr>';
      html += '<th>' + L.campaign + '</th>';
      html += '<th>' + L.sent + '</th>';
      html += '<th>' + L.opened + '</th>';
      html += '<th>' + L.clicked + '</th>';
      html += '<th>' + L.openRate + '</th>';
      html += '<th>' + L.clickRate + '</th>';
      html += '</tr></thead><tbody>';
      for (var ci = 0; ci < recent.length; ci++) {
        var camp      = recent[ci];
        var openPct   = camp.sent > 0 ? ((camp.opened  / camp.sent) * 100).toFixed(1) : '0.0';
        var clickPct  = camp.sent > 0 ? ((camp.clicked / camp.sent) * 100).toFixed(1) : '0.0';
        html += '<tr>';
        html += '<td><strong>' + escHtml(camp.name) + '</strong></td>';
        html += '<td>' + camp.sent.toLocaleString() + '</td>';
        html += '<td>' + camp.opened.toLocaleString() + '</td>';
        html += '<td>' + camp.clicked.toLocaleString() + '</td>';
        html += '<td style="color:var(--green)">' + openPct  + '%</td>';
        html += '<td style="color:var(--accent)">' + clickPct + '%</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
    }
    html += '</div>';

    body.innerHTML = html;

    // Load niche benchmarks section asynchronously after main render
    loadNicheBenchmarks(body, isEs);
  }

  /* ── Niche benchmarks ───────────────────────────────────────────── */
  function loadNicheBenchmarks(body, isEs) {
    var userNiche = window.CRM_APP ? CRM_APP.getUserNiche() : null;
    if (!userNiche) return;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=niche_config&niche=' + encodeURIComponent(userNiche), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4 || xhr.status !== 200) return;
      var nd;
      try { nd = JSON.parse(xhr.responseText); } catch(e) { return; }
      var kpis = nd.kpis || [];
      if (!kpis.length) return;

      var unitLabel = { percent: '%', currency_clp: ' CLP', count: '', days: ' días', hours: ' hrs', rating: '/5' };
      var section = document.createElement('div');
      section.className = 'card';
      section.style.marginTop = '24px';

      var title = isEs
        ? ('📊 Benchmarks de tu industria — ' + (nd.label || userNiche))
        : ('📊 Industry Benchmarks — ' + (nd.label || userNiche));
      section.innerHTML = '<div class="card-header"><h2 class="card-title">' + title + '</h2></div>';

      var grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:16px 20px';

      for (var i = 0; i < kpis.length; i++) {
        var kpi = kpis[i];
        var suffix = unitLabel[kpi.unit] || '';
        var card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-card,#1a1d2e);border-radius:10px;padding:14px 16px;border-left:3px solid #FF671F';
        card.innerHTML =
          '<div style="font-size:11px;color:var(--text-dim,#8b8fa3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">' + escHtml(kpi.label) + '</div>' +
          '<div style="font-size:1.4rem;font-weight:700;color:#FF671F">' + (kpi.benchmark || '—') + suffix + '</div>' +
          '<div style="font-size:11px;color:var(--text-dim,#8b8fa3);margin-top:4px">' + escHtml(kpi.description || '') + '</div>';
        grid.appendChild(card);
      }
      section.appendChild(grid);
      body.appendChild(section);
    };
    xhr.send();
  }

  /* ── helpers ────────────────────────────────────────────────────── */
  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card">' +
      '<div class="card-label">' + label + '</div>' +
      '<div class="card-value ' + colorClass + '">' + value + '</div>' +
      '</div>';
  }

  function formatCurrency(n) {
    var num = parseFloat(n) || 0;
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000)    return '$' + (num / 1000).toFixed(1) + 'k';
    return '$' + Math.round(num).toLocaleString();
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]);
    });
  }

})();

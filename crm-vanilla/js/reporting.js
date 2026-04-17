/* Reporting Page Logic */
(function () {
  "use strict";

  var TOP_CAMPAIGNS = [
    { name: "Spring Promo Launch", leads: 142, conversions: 38, revenue: "$45,600", roi: "312%" },
    { name: "Google Ads - Brand", leads: 98, conversions: 27, revenue: "$32,400", roi: "245%" },
    { name: "Facebook Lead Gen", leads: 87, conversions: 19, revenue: "$22,800", roi: "189%" },
    { name: "Webinar Invitation", leads: 76, conversions: 22, revenue: "$26,400", roi: "210%" },
    { name: "SEO Organic", leads: 234, conversions: 45, revenue: "$54,000", roi: "890%" },
    { name: "Referral Program", leads: 56, conversions: 31, revenue: "$37,200", roi: "425%" }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      leadsThisMonth: "Leads Este Mes", conversionRate: "Tasa de Conversión",
      revenueMTD: "Ingresos del Mes", appointmentsBooked: "Citas Agendadas",
      leadSources: "Fuentes de Leads", pieChart: "Gráfico Circular",
      revenueTrend: "Tendencia de Ingresos", lineChart: "Gráfico de Líneas",
      topCampaigns: "Campañas con Mejor Desempeño",
      campaign: "Campaña", leads: "Leads", conversions: "Conversiones",
      revenue: "Ingresos", roi: "ROI",
      googleAds: "Google Ads", organic: "Orgánico", socialMedia: "Redes Sociales",
      referral: "Referido", direct: "Directo",
      proj: "(proy)"
    } : {
      leadsThisMonth: "Leads This Month", conversionRate: "Conversion Rate",
      revenueMTD: "Revenue MTD", appointmentsBooked: "Appointments Booked",
      leadSources: "Lead Sources", pieChart: "Pie Chart Visualization",
      revenueTrend: "Revenue Trend", lineChart: "Line Chart Visualization",
      topCampaigns: "Top Performing Campaigns",
      campaign: "Campaign", leads: "Leads", conversions: "Conversions",
      revenue: "Revenue", roi: "ROI",
      googleAds: "Google Ads", organic: "Organic", socialMedia: "Social Media",
      referral: "Referral", direct: "Direct",
      proj: "(proj)"
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.reporting'));
    render(L);
  });

  function render(L) {
    var body = document.getElementById("reportingBody");
    if (!body) return;

    var html = '<div class="summary-cards">';
    html += summaryCard(L.leadsThisMonth, "347", "");
    html += summaryCard(L.conversionRate, "28.4%", "green");
    html += summaryCard(L.revenueMTD, "$142.5k", "");
    html += summaryCard(L.appointmentsBooked, "89", "");
    html += '</div>';

    html += '<div class="charts-row">';
    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">' + L.leadSources + '</div>';
    html += '<div class="chart-placeholder-area">';
    html += '<div style="text-align:center">';
    html += '<div style="margin-bottom:12px">' + CRM_APP.ICONS.reporting + '</div>';
    html += '<div style="margin-bottom:16px">' + L.pieChart + '</div>';
    html += '<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">';
    html += legendItem("#6c5ce7", L.googleAds, "34%");
    html += legendItem("#00b894", L.organic, "28%");
    html += legendItem("#fdcb6e", L.socialMedia, "18%");
    html += legendItem("#e17055", L.referral, "12%");
    html += legendItem("#00cec9", L.direct, "8%");
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">' + L.revenueTrend + '</div>';
    html += '<div class="chart-placeholder-area">';
    html += '<div style="text-align:center">';
    html += '<div style="margin-bottom:12px">' + CRM_APP.ICONS.reporting + '</div>';
    html += '<div style="margin-bottom:16px">' + L.lineChart + '</div>';
    html += '<div style="display:flex;gap:24px;justify-content:center;font-size:12px">';
    html += '<div>Jan: $105k</div><div>Feb: $118k</div><div>Mar: $142k</div><div>Apr: $156k ' + L.proj + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="card" style="margin-top:24px">';
    html += '<div class="card-header"><h2 class="card-title">' + L.topCampaigns + '</h2></div>';
    html += '<table class="data-table"><thead><tr>';
    html += '<th>' + L.campaign + '</th><th>' + L.leads + '</th><th>' + L.conversions + '</th><th>' + L.revenue + '</th><th>' + L.roi + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < TOP_CAMPAIGNS.length; i++) {
      var c = TOP_CAMPAIGNS[i];
      html += '<tr>';
      html += '<td><strong>' + c.name + '</strong></td>';
      html += '<td>' + c.leads + '</td>';
      html += '<td>' + c.conversions + '</td>';
      html += '<td>' + c.revenue + '</td>';
      html += '<td style="color:var(--green);font-weight:600">' + c.roi + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '</div>';

    body.innerHTML = html;
  }

  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + colorClass + '">' + value + '</div></div>';
  }

  function legendItem(color, label, pct) {
    return '<div style="display:flex;align-items:center;gap:6px;font-size:12px"><span style="width:10px;height:10px;border-radius:50%;background:' + color + ';display:inline-block"></span>' + label + ' (' + pct + ')</div>';
  }

})();

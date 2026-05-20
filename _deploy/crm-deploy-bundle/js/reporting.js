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
    CRM_APP.buildHeader("Reporting");
    render();
  });

  function render() {
    var body = document.getElementById("reportingBody");
    if (!body) return;

    var html = '<div class="summary-cards">';
    html += summaryCard("Leads This Month", "347", "");
    html += summaryCard("Conversion Rate", "28.4%", "green");
    html += summaryCard("Revenue MTD", "$142.5k", "");
    html += summaryCard("Appointments Booked", "89", "");
    html += '</div>';

    html += '<div class="charts-row">';
    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">Lead Sources</div>';
    html += '<div class="chart-placeholder-area">';
    html += '<div style="text-align:center">';
    html += '<div style="margin-bottom:12px">' + CRM_APP.ICONS.reporting + '</div>';
    html += '<div style="margin-bottom:16px">Pie Chart Visualization</div>';
    html += '<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">';
    html += legendItem("#6c5ce7", "Google Ads", "34%");
    html += legendItem("#00b894", "Organic", "28%");
    html += legendItem("#fdcb6e", "Social Media", "18%");
    html += legendItem("#e17055", "Referral", "12%");
    html += legendItem("#00cec9", "Direct", "8%");
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="chart-placeholder">';
    html += '<div class="chart-placeholder-title">Revenue Trend</div>';
    html += '<div class="chart-placeholder-area">';
    html += '<div style="text-align:center">';
    html += '<div style="margin-bottom:12px">' + CRM_APP.ICONS.reporting + '</div>';
    html += '<div style="margin-bottom:16px">Line Chart Visualization</div>';
    html += '<div style="display:flex;gap:24px;justify-content:center;font-size:12px">';
    html += '<div>Jan: $105k</div><div>Feb: $118k</div><div>Mar: $142k</div><div>Apr: $156k (proj)</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="card" style="margin-top:24px">';
    html += '<div class="card-header"><h2 class="card-title">Top Performing Campaigns</h2></div>';
    html += '<table class="data-table"><thead><tr>';
    html += '<th>Campaign</th><th>Leads</th><th>Conversions</th><th>Revenue</th><th>ROI</th>';
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

/* Landing Pages */
(function () {
  "use strict";

  function summary(list) {
    var active = 0, v = 0, s = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].status === "active") active++;
      v += list[i].visitors;
      s += list[i].submissions;
    }
    var cr = v > 0 ? ((s / v) * 100).toFixed(1) : "0";
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Active LPs</div><div class="sc-value">' + active + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Visitors 30d</div><div class="sc-value">' + CMS_APP.fmtN(v) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Submissions</div><div class="sc-value">' + CMS_APP.fmtN(s) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Avg CR</div><div class="sc-value">' + cr + '%</div><div class="sc-sub">Weighted</div></div>';
    return html;
  }

  function grid(list) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">All Landing Pages</div></div>';
    html += '<table class="data-table"><thead><tr><th>Title</th><th>Status</th><th>Funnel</th><th>Visitors</th><th>Submissions</th><th>CR</th><th>Actions</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var lp = list[i];
      html += '<tr>';
      html += '<td><strong>' + lp.title + '</strong><div class="muted small">/' + lp.slug + '</div></td>';
      html += '<td>' + CMS_APP.statusBadge(lp.status) + '</td>';
      html += '<td>' + lp.funnel + '</td>';
      html += '<td>' + CMS_APP.fmtN(lp.visitors) + '</td>';
      html += '<td>' + CMS_APP.fmtN(lp.submissions) + '</td>';
      html += '<td><strong>' + lp.cr + '%</strong></td>';
      html += '<td class="actions-cell">';
      html += '<button class="icon-btn" data-slug="' + lp.slug + '" data-act="edit">' + CMS_APP.ICONS.edit + '</button>';
      html += '<button class="icon-btn" data-slug="' + lp.slug + '" data-act="open">' + CMS_APP.ICONS.external + '</button>';
      html += '<button class="icon-btn danger" data-slug="' + lp.slug + '" data-act="del">' + CMS_APP.ICONS.trash + '</button>';
      html += '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function funnel(list) {
    // Use top performer as showcase
    var top = list.slice().sort(function (a, b) { return b.submissions - a.submissions; })[0];
    var v = top.visitors, s = top.submissions;
    var stages = [
      { label: "Visitors", n: v, pct: 100 },
      { label: "Engaged", n: Math.round(v * 0.62), pct: 62 },
      { label: "Form Started", n: Math.round(v * 0.18), pct: 18 },
      { label: "Submitted", n: s, pct: Math.round((s / v) * 100) }
    ];
    var html = '<div class="card"><div class="card-header"><div class="card-title">Funnel — ' + top.title + '</div><span class="muted">' + top.funnel + '</span></div>';
    html += '<div class="lp-funnel">';
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i];
      html += '<div class="lp-funnel-row" style="width:' + Math.max(20, st.pct) + '%">';
      html += '<span class="lpf-label">' + st.label + '</span>';
      html += '<span class="lpf-value">' + CMS_APP.fmtN(st.n) + ' &middot; ' + st.pct + '%</span>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Landing Pages", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' New Landing Page</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.landingPages);
    document.getElementById("lpGrid").innerHTML = grid(CMS_DATA.landingPages);
    document.getElementById("funnelMount").innerHTML = funnel(CMS_DATA.landingPages);
  });
})();

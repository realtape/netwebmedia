/* Forms */
(function () {
  "use strict";

  function summary(list) {
    var subs = 0, totalCr = 0;
    for (var i = 0; i < list.length; i++) { subs += list[i].submissions30d; totalCr += list[i].convRate; }
    var avg = (totalCr / list.length).toFixed(1);
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Total forms</div><div class="sc-value">' + list.length + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Submissions 30d</div><div class="sc-value">' + CMS_APP.fmtN(subs) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Avg Conv Rate</div><div class="sc-value">' + avg + '%</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Connected systems</div><div class="sc-value">4</div><div class="sc-sub">Hubspot, GHL, Email, Calendar</div></div>';
    return html;
  }

  function table(list) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">All Forms</div></div>';
    html += '<table class="data-table"><thead><tr><th>Name</th><th>Submissions 30d</th><th>Conv Rate</th><th>Fields</th><th>Connected To</th><th>Last Edit</th><th>Actions</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      html += '<tr>';
      html += '<td><strong>' + f.name + '</strong><div class="muted small">' + f.id + '</div></td>';
      html += '<td>' + CMS_APP.fmtN(f.submissions30d) + '</td>';
      html += '<td><strong>' + f.convRate + '%</strong></td>';
      html += '<td>' + f.fields + '</td>';
      html += '<td>' + f.connectedTo + '</td>';
      html += '<td>' + f.lastEdit + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="icon-btn" data-id="' + f.id + '" data-act="edit">' + CMS_APP.ICONS.edit + '</button>';
      html += '<button class="icon-btn" data-id="' + f.id + '" data-act="open">' + CMS_APP.ICONS.external + '</button>';
      html += '<button class="icon-btn danger" data-id="' + f.id + '" data-act="del">' + CMS_APP.ICONS.trash + '</button>';
      html += '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Forms", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' New Form</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.forms);
    document.getElementById("formsTable").innerHTML = table(CMS_DATA.forms);
  });
})();

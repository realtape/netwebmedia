/* Memberships */
(function () {
  "use strict";

  function summary(list) {
    var members = 0, mrr = 0, paid = 0, content = 0;
    for (var i = 0; i < list.length; i++) {
      members += list[i].members;
      mrr += list[i].mrr;
      content += list[i].content;
      if (list[i].tier !== "Free") paid += list[i].members;
    }
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Total Members</div><div class="sc-value">' + CMS_APP.fmtN(members) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Total MRR</div><div class="sc-value">$' + CMS_APP.fmtN(mrr) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Paid Members</div><div class="sc-value">' + CMS_APP.fmtN(paid) + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Content Pieces</div><div class="sc-value">' + content + '</div></div>';
    return html;
  }

  function tierBadgeCls(tier) {
    if (tier === "Enterprise") return "badge-green";
    if (tier === "Premium") return "badge-blue";
    if (tier === "Pro") return "badge-yellow";
    return "badge-gray";
  }

  function grid(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      html += '<div class="mem-card">';
      html += '<div class="mem-head"><div class="mem-name">' + m.name + '</div><span class="status-badge ' + tierBadgeCls(m.tier) + '">' + m.tier + '</span></div>';
      html += '<div class="mem-stats">';
      html += '<div><div class="ms-value">' + CMS_APP.fmtN(m.members) + '</div><div class="ms-label">Members</div></div>';
      html += '<div><div class="ms-value">$' + CMS_APP.fmtN(m.mrr) + '<span class="ms-per">/mo</span></div><div class="ms-label">MRR</div></div>';
      html += '<div><div class="ms-value">' + m.content + '</div><div class="ms-label">Content</div></div>';
      html += '</div>';
      html += '<div class="mem-actions"><button class="btn btn-secondary" data-id="' + m.id + '">Manage</button></div>';
      html += '</div>';
    }
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Memberships", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' New Tier</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.memberships);
    document.getElementById("membershipGrid").innerHTML = grid(CMS_DATA.memberships);
  });
})();

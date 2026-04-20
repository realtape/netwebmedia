/* A/B Tests */
(function () {
  "use strict";

  function summary(list) {
    var running = 0, winners = 0, completed = 0, liftSum = 0, liftN = 0;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.status === "running") running++;
      if (t.status === "winner") winners++;
      if (t.status === "completed" || t.status === "winner") {
        completed++;
        if (t.crA > 0) { liftSum += ((t.crB - t.crA) / t.crA) * 100; liftN++; }
      }
    }
    var avg = liftN > 0 ? (liftSum / liftN).toFixed(1) : "0";
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Running</div><div class="sc-value">' + running + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Winners</div><div class="sc-value">' + winners + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Completed</div><div class="sc-value">' + completed + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Avg Lift</div><div class="sc-value">' + avg + '%</div></div>';
    return html;
  }

  function variant(label, visitors, cr, isWinner) {
    var cls = "ab-variant" + (isWinner ? " winner" : "");
    var html = '<div class="' + cls + '">';
    html += '<div class="abv-label">Variant ' + label + (isWinner ? ' <span class="win-badge">WIN</span>' : '') + '</div>';
    html += '<div class="abv-stats">';
    html += '<div><div class="abv-value">' + CMS_APP.fmtN(visitors) + '</div><div class="abv-sub">Visitors</div></div>';
    html += '<div><div class="abv-value">' + cr + '%</div><div class="abv-sub">Conv</div></div>';
    html += '</div></div>';
    return html;
  }

  function grid(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      var winA = t.winner && t.winner.charAt(0) === "A";
      var winB = t.winner && t.winner.charAt(0) === "B";
      html += '<div class="ab-card">';
      html += '<div class="ab-head"><div class="ab-name">' + t.name + '</div>' + CMS_APP.statusBadge(t.status) + '</div>';
      html += '<div class="ab-page muted small"><code class="url-code">' + t.page + '</code></div>';
      html += '<div class="ab-variants">';
      html += variant("A", t.visitorsA, t.crA, winA);
      html += '<div class="ab-vs">vs</div>';
      html += variant("B", t.visitorsB, t.crB, winB);
      html += '</div>';
      html += '<div class="ab-conf">Confidence: <strong>' + t.confidence + '%</strong>';
      if (t.winner && t.winner !== "-") html += ' &middot; Winner: <strong>' + t.winner + '</strong>';
      html += '</div>';
      html += '</div>';
    }
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("A/B Tests", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' New Test</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.abTests);
    document.getElementById("abGrid").innerHTML = grid(CMS_DATA.abTests);
  });
})();

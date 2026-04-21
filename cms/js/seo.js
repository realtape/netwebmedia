/* SEO */
(function () {
  "use strict";

  function summary(audit, kws) {
    var scoreSum = 0, issues = 0, traffic = 0;
    for (var i = 0; i < audit.length; i++) { scoreSum += audit[i].score; issues += audit[i].issues; }
    var avg = Math.round(scoreSum / audit.length);
    for (var j = 0; j < kws.length; j++) traffic += kws[j].traffic;
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Avg Audit Score</div><div class="sc-value">' + avg + '</div><div class="sc-sub">/ 100</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Tracked Keywords</div><div class="sc-value">' + kws.length + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Organic Traffic</div><div class="sc-value">' + CMS_APP.fmtN(traffic) + '</div><div class="sc-sub">Monthly est.</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Issues to Fix</div><div class="sc-value">' + issues + '</div></div>';
    return html;
  }

  function auditGrid(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      html += '<div class="seo-card">';
      html += '<div class="seo-card-head"><div class="seo-cat">' + a.category + '</div><span class="seo-impact ' + a.impact + '">' + a.impact + '</span></div>';
      html += '<div class="seo-score">' + a.score + '<span class="seo-score-max">/100</span></div>';
      html += '<div class="seo-issues">' + a.issues + ' issue' + (a.issues === 1 ? "" : "s") + '</div>';
      html += '<ul class="seo-items">';
      for (var k = 0; k < a.items.length; k++) html += '<li>' + a.items[k] + '</li>';
      html += '</ul>';
      html += '</div>';
    }
    return html;
  }

  function kwTable(list) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">Keyword Rankings</div></div>';
    html += '<table class="data-table"><thead><tr><th>Keyword</th><th>Pos</th><th>Change</th><th>Volume</th><th>Diff.</th><th>Intent</th><th>Page</th><th>Traffic</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var k = list[i];
      var posCls = "rank-pos";
      if (k.position === 1) posCls += " r1";
      else if (k.position === 2) posCls += " r2";
      else if (k.position === 3) posCls += " r3";
      var delta = k.prev - k.position;
      var deltaHtml = delta > 0 ? '<span class="delta up">&#9650; ' + delta + '</span>' : (delta < 0 ? '<span class="delta down">&#9660; ' + Math.abs(delta) + '</span>' : '<span class="delta flat">&#8211;</span>');
      html += '<tr>';
      html += '<td><strong>' + k.keyword + '</strong></td>';
      html += '<td><span class="' + posCls + '">' + k.position + '</span></td>';
      html += '<td>' + deltaHtml + ' <span class="muted small">was ' + k.prev + '</span></td>';
      html += '<td>' + CMS_APP.fmtN(k.volume) + '</td>';
      html += '<td>' + k.difficulty + '</td>';
      html += '<td><span class="tag-pill">' + k.intent + '</span></td>';
      html += '<td><code class="url-code">' + k.page + '</code></td>';
      html += '<td>' + CMS_APP.fmtN(k.traffic) + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("SEO", '<button class="btn btn-secondary">Run Audit</button>', "AEO, on-page, technical and backlink health");
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.seoAudit, CMS_DATA.seoKeywords);
    document.getElementById("auditGrid").innerHTML = auditGrid(CMS_DATA.seoAudit);
    document.getElementById("keywordsMount").innerHTML = kwTable(CMS_DATA.seoKeywords);
  });
})();

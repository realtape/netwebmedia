/* Blog page */
(function () {
  "use strict";

  function summary(s, q) {
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Published Posts</div><div class="sc-value">' + s.publishedPosts + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">In Queue</div><div class="sc-value">' + q.totalInQueue + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Days Runway</div><div class="sc-value">' + q.daysOfRunway + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Cadence</div><div class="sc-value">20/day</div><div class="sc-sub">' + q.cadence + '</div></div>';
    return html;
  }

  function queueBig(q) {
    var pct = Math.min(100, Math.round((q.daysOfRunway / 30) * 100));
    var html = '<div class="card queue-card big">';
    html += '<div class="card-header"><div class="card-title">Blog Automation Queue</div><span class="status-badge badge-green">Active</span></div>';
    html += '<div class="queue-body">';
    html += '<div class="queue-progress-wrap"><div class="queue-progress"><div class="queue-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="queue-progress-meta"><span>' + q.daysOfRunway + ' days runway</span><span>target 30 days</span></div></div>';
    html += '<div class="queue-stats">';
    html += '<div><div class="qs-value">' + q.totalInQueue + '</div><div class="qs-label">In queue</div></div>';
    html += '<div><div class="qs-value">' + q.nextPublish + '</div><div class="qs-label">Next publish</div></div>';
    html += '<div><div class="qs-value">' + q.cadence.split(" at ")[0] + '</div><div class="qs-label">Cadence</div></div>';
    html += '</div></div></div>';
    return html;
  }

  function recentTable(list) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">Recent Published</div><a class="card-link" href="#">View all</a></div>';
    html += '<table class="data-table"><thead><tr><th>Title</th><th>Tag</th><th>Published</th><th>Views</th><th>Author</th><th>Read time</th><th>Actions</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      html += '<tr>';
      html += '<td><strong>' + p.title + '</strong></td>';
      html += '<td><span class="tag-pill">' + p.tag + '</span></td>';
      html += '<td>' + p.published + '</td>';
      html += '<td>' + CMS_APP.fmtN(p.views) + '</td>';
      html += '<td>' + p.author + '</td>';
      html += '<td>' + p.readTime + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="icon-btn" data-slug="' + p.slug + '" data-act="edit">' + CMS_APP.ICONS.edit + '</button>';
      html += '<button class="icon-btn" data-slug="' + p.slug + '" data-act="open">' + CMS_APP.ICONS.external + '</button>';
      html += '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function nextBatch(q) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">Next to publish (sample)</div></div>';
    html += '<ul class="qc-sample big">';
    for (var i = 0; i < q.nextBatchSample.length; i++) {
      html += '<li><span class="nb-idx">' + (i + 1) + '</span><span class="nb-slug">' + q.nextBatchSample[i] + '</span></li>';
    }
    html += '</ul>';
    html += '<div class="card-footer muted">Published daily at 9:00 AM America/New_York</div></div>';
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var actions = '<button class="btn btn-secondary">Manage Queue</button>';
    actions += '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' New Post</button>';
    CMS_APP.buildHeader("Blog", actions, "87 live posts, 20/day cadence on autopilot");
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.stats, CMS_DATA.blogQueue);
    document.getElementById("queueCardMount").innerHTML = queueBig(CMS_DATA.blogQueue);
    document.getElementById("blogGrid").innerHTML = recentTable(CMS_DATA.blogRecent) + nextBatch(CMS_DATA.blogQueue);
  });
})();

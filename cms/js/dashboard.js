/* Dashboard page */
(function () {
  "use strict";

  function summary(s) {
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Published Pages</div><div class="sc-value">' + s.publishedPages + '</div><div class="sc-sub">Across the marketing site</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Blog Posts Live</div><div class="sc-value">' + s.publishedPosts + '</div><div class="sc-sub">Indexed + live</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Queued Posts</div><div class="sc-value">' + s.queuedPosts + '</div><div class="sc-sub">14 days runway</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Monthly Visitors</div><div class="sc-value">' + CMS_APP.fmtN(s.monthlyVisitors) + '</div><div class="sc-sub">Conv ' + s.conversionRate + '%</div></div>';
    return html;
  }

  function spark(days) {
    var max = 0;
    for (var i = 0; i < days.length; i++) if (days[i].visits > max) max = days[i].visits;
    var html = '<div class="spark-chart">';
    for (var j = 0; j < days.length; j++) {
      var h = Math.round((days[j].visits / max) * 100);
      html += '<div class="spark-col">';
      html += '<div class="spark-bar" style="height:' + h + '%" title="' + days[j].visits + '"></div>';
      html += '<div class="spark-label">' + days[j].day + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function queueCard(q) {
    var pct = Math.min(100, Math.round((q.daysOfRunway / 30) * 100));
    var html = '<div class="card queue-card">';
    html += '<div class="card-header"><div class="card-title">Blog Automation Queue</div><span class="status-badge badge-green">On track</span></div>';
    html += '<div class="queue-stats">';
    html += '<div><div class="qs-value">' + q.totalInQueue + '</div><div class="qs-label">In queue</div></div>';
    html += '<div><div class="qs-value">' + q.daysOfRunway + 'd</div><div class="qs-label">Runway</div></div>';
    html += '<div><div class="qs-value">' + q.cadence.split(" ")[0] + '/day</div><div class="qs-label">Cadence</div></div>';
    html += '</div>';
    html += '<div class="queue-progress"><div class="queue-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="qc-next">Next publish: <strong>' + q.nextPublish + '</strong></div>';
    html += '<div class="qc-sample-label">Next batch sample</div><ul class="qc-sample">';
    for (var i = 0; i < q.nextBatchSample.length; i++) {
      html += '<li>' + q.nextBatchSample[i] + '</li>';
    }
    html += '</ul></div>';
    return html;
  }

  function recentPosts(posts) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">Recent Blog Posts</div><a class="card-link" href="blog.html">View all</a></div>';
    html += '<div class="rp-list">';
    var top = posts.slice(0, 4);
    for (var i = 0; i < top.length; i++) {
      var p = top[i];
      html += '<div class="rp-item">';
      html += '<div class="rp-main"><div class="rp-title">' + p.title + '</div><div class="rp-meta"><span class="tag-pill">' + p.tag + '</span> &middot; ' + p.published + '</div></div>';
      html += '<div class="rp-views">' + CMS_APP.fmtN(p.views) + ' views</div>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function activity(items) {
    var html = '<div class="card"><div class="card-header"><div class="card-title">Recent Activity</div></div>';
    html += '<ul class="activity-list">';
    for (var i = 0; i < items.length; i++) {
      var a = items[i];
      html += '<li class="activity-item"><span class="activity-dot ' + a.type + '"></span>';
      html += '<div class="act-body"><div class="act-text">' + a.action + '</div><div class="act-meta">' + a.user + ' &middot; ' + a.time + '</div></div></li>';
    }
    html += '</ul></div>';
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Dashboard", '<button class="btn btn-primary" data-action="new">' + CMS_APP.ICONS.plus + ' Quick Create</button>', "Thursday, April 16, 2026 - overview of the day");
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.stats);

    var topHtml = '<div class="card"><div class="card-header"><div class="card-title">Traffic (last 8 days)</div><span class="muted">' + CMS_APP.fmtN(CMS_DATA.stats.monthlyVisitors) + '/mo</span></div>' + spark(CMS_DATA.trafficDaily) + '</div>';
    topHtml += queueCard(CMS_DATA.blogQueue);
    document.getElementById("dashGridTop").innerHTML = topHtml;

    document.getElementById("dashGridBottom").innerHTML = recentPosts(CMS_DATA.blogRecent) + activity(CMS_DATA.recentActivity);
  });
})();

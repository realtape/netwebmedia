/* Dashboard page */
(function () {
  "use strict";

  function summary(m) {
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Pages</div><div class="sc-value">' + CMS_APP.fmtN(m.pages) + '</div><div class="sc-sub">Page resources</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Blog Posts</div><div class="sc-value">' + CMS_APP.fmtN(m.posts) + '</div><div class="sc-sub">In the CMS</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Landing Pages</div><div class="sc-value">' + CMS_APP.fmtN(m.landing) + '</div><div class="sc-sub">Campaign LPs</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Form Submissions</div><div class="sc-value">' + CMS_APP.fmtN(m.submissions) + '</div><div class="sc-sub">Last 30 days</div></div>';
    return html;
  }

  function todayLabel() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' — overview of the day';
  }

  function quickCreateHtml() {
    return '<div class="qc-wrap" style="position:relative;display:inline-block;">' +
      '<button class="btn btn-primary" id="qcBtn">' + CMS_APP.ICONS.plus + ' Quick Create</button>' +
      '<div id="qcMenu" class="qc-menu" style="display:none;position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.14);min-width:190px;z-index:60;overflow:hidden;">' +
        '<a href="pages.html#new" class="qc-item">New Page</a>' +
        '<a href="blog.html#new" class="qc-item">New Blog Post</a>' +
        '<a href="landing-pages.html#new" class="qc-item">New Landing Page</a>' +
        '<a href="forms.html#new" class="qc-item">New Form</a>' +
      '</div></div>';
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

  function mockSummary() {
    var s = CMS_DATA.stats || {};
    return { pages: s.publishedPages || 0, posts: s.publishedPosts || 0, landing: (CMS_DATA.landingPages || []).length, submissions: 0 };
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Dashboard", quickCreateHtml(), todayLabel());

    // Real top-line counts from /api/public/stats, with mock fallback.
    document.getElementById("summaryCards").innerHTML = summary(mockSummary());
    if (window.NWMApi && NWMApi.publicStats) {
      NWMApi.publicStats().then(function (r) {
        var c = (r && r.counts) || {};
        document.getElementById("summaryCards").innerHTML = summary({
          pages: c.page || 0, posts: c.blog_post || 0, landing: c.landing_page || 0,
          submissions: (r && r.form_submissions_30d) || 0
        });
      }).catch(function () { /* keep mock fallback */ });
    }

    var topHtml = '<div class="card"><div class="card-header"><div class="card-title">Traffic (last 8 days)</div><span class="muted">' + CMS_APP.fmtN(CMS_DATA.stats.monthlyVisitors) + '/mo</span></div>' + spark(CMS_DATA.trafficDaily) + '</div>';
    topHtml += queueCard(CMS_DATA.blogQueue);
    document.getElementById("dashGridTop").innerHTML = topHtml;

    document.getElementById("dashGridBottom").innerHTML = recentPosts(CMS_DATA.blogRecent) + activity(CMS_DATA.recentActivity);

    // Quick Create dropdown toggle.
    document.addEventListener("click", function (e) {
      var menu = document.getElementById("qcMenu");
      if (!menu) return;
      if (e.target.closest("#qcBtn")) { menu.style.display = menu.style.display === "none" ? "block" : "none"; e.preventDefault(); return; }
      if (!e.target.closest("#qcMenu")) menu.style.display = "none";
    });
  });
})();

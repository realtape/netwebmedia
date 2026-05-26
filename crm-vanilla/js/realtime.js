/* NetWeb CRM — Realtime Dashboard v2 */
(function () {
  'use strict';

  var REFRESH_INTERVAL = 30;
  var countdown = REFRESH_INTERVAL;
  var timer = null;

  var PLATFORM_COLORS = {
    facebook:  { bg: 'rgba(24,119,242,0.2)',  fg: '#1877f2', abbr: 'FB' },
    instagram: { bg: 'rgba(225,48,108,0.2)',  fg: '#e1306c', abbr: 'IG' },
    linkedin:  { bg: 'rgba(10,102,194,0.2)',  fg: '#0a66c2', abbr: 'LI' },
    youtube:   { bg: 'rgba(255,0,0,0.2)',     fg: '#ff0000', abbr: 'YT' },
    tiktok:    { bg: 'rgba(255,255,255,0.1)', fg: '#fff',    abbr: 'TK' },
  };

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof CRM_APP !== 'undefined') {
      CRM_APP.init({ page: 'realtime', title: 'Realtime' });
    }
    // Run once now, once after app.js finishes any async sidebar/header work
    injectTrialBanner();
    setTimeout(injectTrialBanner, 300);
    bindControls();
    fetchData();
  });

  function injectTrialBanner() {
    if (document.querySelector('.rt-trial-banner')) return; // already injected
    var user = null;
    try { user = JSON.parse(localStorage.getItem('crm_demo_user') || localStorage.getItem('nwm_user') || 'null'); } catch(_) {}
    var isDemo = user && (user.type === 'demo' || user.role === 'demo');
    if (!isDemo) return;

    var banner = document.createElement('div');
    banner.className = 'rt-trial-banner';
    banner.innerHTML =
      '<div class="rt-trial-left">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' +
        '<span>You\'re on a <strong>Free Trial</strong> — this is your live data. Upgrade to unlock all 15 modules.</span>' +
      '</div>' +
      '<a href="/pricing.html" class="rt-trial-cta">Upgrade Now →</a>';

    var body = document.getElementById('realtimeBody');
    if (body) body.insertBefore(banner, body.firstChild);
  }

  function bindControls() {
    document.getElementById('rtRefreshBtn').addEventListener('click', fetchData);
    document.getElementById('rtAutoRefresh').addEventListener('change', function () {
      if (this.checked) { startTimer(); } else { stopTimer(); }
    });
  }

  /* ── Fetch ── */
  function fetchData() {
    var btn = document.getElementById('rtRefreshBtn');
    if (btn) btn.classList.add('spinning');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=realtime', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (btn) btn.classList.remove('spinning');
      if (xhr.status === 200) {
        try {
          render(JSON.parse(xhr.responseText));
          updateTimestamp();
          resetCountdown();
        } catch (e) { console.warn('Realtime parse error', e); }
      }
    };
    xhr.send();
  }

  /* ── Timer ── */
  function startTimer() {
    stopTimer();
    timer = setInterval(function () {
      countdown--;
      updateCountdownLabel();
      if (countdown <= 0) fetchData();
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function resetCountdown() {
    countdown = REFRESH_INTERVAL;
    updateCountdownLabel();
    if (document.getElementById('rtAutoRefresh').checked) startTimer();
  }
  function updateCountdownLabel() {
    var el = document.getElementById('rtCountdown');
    if (!el) return;
    el.textContent = document.getElementById('rtAutoRefresh').checked
      ? 'Refreshing in ' + countdown + 's'
      : 'Auto-refresh off';
  }
  function updateTimestamp() {
    var el = document.getElementById('rtUpdated');
    if (el) el.textContent = 'Last updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  function render(d) {
    renderCrmKPIs(d);
    renderFeed(d.feed || []);
    renderSparkline('rtSparkLine', 'rtSparkFill', 'rtSparkLabels', buildHourlyPoints(d.hourlyContacts || []), '#6c5ce7', 'sparkGrad');
    renderDistribution('rtByStatus',  d.byStatus  || [], 'status',  'status');
    renderDistribution('rtBySegment', d.bySegment || [], 'segment', 'seg');
    renderPipeline(d.byStage     || []);
    renderCampaigns(d.campaigns  || []);
    renderSocialKPIs(d);
    renderPlatforms(d.socialByPlatform || [], d.socialConnected || []);
    renderSocialSparkline(d.socialDailyPosts || []);
    renderTopPosts(d.socialTopPosts || []);
    renderScheduled(d.socialScheduled || [], d.socialScheduledCounts || {});
  }

  /* ── CRM KPIs ── */
  function renderCrmKPIs(d) {
    animateCount('kpiTotalContacts', d.totalContacts   || 0);
    animateCount('kpiActiveDeals',   d.dealsActive     || 0);
    animateCount('kpiConvos',        d.totalConversations || 0);
    animateCount('kpiEmailsSent',    d.emailsSentToday || 0);
    animateCount('kpiThisMonth',     d.contactsThisMonth || 0);
    animateCount('kpiEvents',        d.eventsToday     || 0);

    setEl('kpiContactsSub',  (d.contactsToday || 0) + ' new today');
    setEl('kpiPipelineSub',  '$' + fmtMoney(d.pipelineValue || 0) + ' in pipeline');
    setEl('kpiRevenue',      '$' + fmtMoney(d.revenueWon || 0));
    setEl('kpiRevenueSub',   (d.dealsToday || 0) + ' deals today');
    setEl('kpiConvosSub',    (d.openConversations || 0) + ' unread');
    setEl('kpiEmailsSub',    (d.emailsOpenedToday || 0) + ' opened · ' + (d.emailsClickedToday || 0) + ' clicked');

    var growth = d.contactsLastMonth > 0
      ? Math.round(((d.contactsThisMonth - d.contactsLastMonth) / d.contactsLastMonth) * 100) : 0;
    setEl('kpiGrowthSub', (growth >= 0 ? '+' : '') + growth + '% vs last month');

    // Open rate
    var openRate  = d.emailTotalSent > 0 ? Math.round((d.emailTotalOpened  / d.emailTotalSent) * 100) : 0;
    var clickRate = d.emailTotalSent > 0 ? Math.round((d.emailTotalClicked / d.emailTotalSent) * 100) : 0;
    setEl('kpiOpenRate',    openRate + '%');
    setEl('kpiOpenRateSub', 'open rate · ' + clickRate + '% CTR');

    // Events list
    var evList = (d.eventsTodayList || []).map(function (e) {
      var h = Math.floor(e.start_hour || 0);
      var m = Math.round(((e.start_hour || 0) - h) * 60);
      var ampm = h >= 12 ? 'pm' : 'am';
      var h12 = h % 12 || 12;
      return h12 + (m > 0 ? ':' + String(m).padStart(2,'0') : '') + ampm + ' ' + e.title;
    }).join(' · ');
    setEl('kpiEventsList', evList || (d.eventsToday > 0 ? d.eventsToday + ' events' : 'None today'));
  }

  /* ── Social KPIs ── */
  function renderSocialKPIs(d) {
    animateCount('kpiSocialPosts',  d.socialTotalPosts      || 0);
    animateCount('kpiSocialLikes',  d.socialTotalLikes      || 0);
    animateCount('kpiSocialEngage', d.socialTotalEngagement || 0);
    animateCount('kpiSocialViews',  d.socialTotalViews      || 0);

    var platforms = (d.socialByPlatform || []).length;
    setEl('kpiSocialPostsSub', platforms + ' platform' + (platforms !== 1 ? 's' : '') + ' synced');
    setEl('kpiSocialLikesSub', fmtNumber(d.socialTotalComments || 0) + ' comments');
    setEl('kpiSocialEngageSub','likes + comments + shares');
    setEl('kpiSocialViewsSub', fmtNumber(d.socialTotalShares || 0) + ' shares');
  }

  /* ── Platform breakdown ── */
  function renderPlatforms(platforms, connected) {
    var el = document.getElementById('rtPlatforms');
    if (!el) return;

    // Build a map of connected info
    var connMap = {};
    (connected || []).forEach(function (c) { connMap[c.provider] = c; });

    if (!platforms.length && !connected.length) {
      el.innerHTML = '<div class="rt-no-data">No platforms connected yet.<br>Go to Social Planner to connect accounts.</div>';
      return;
    }

    // Merge: show all connected platforms, use post data if available
    var allProviders = ['facebook','instagram','linkedin','youtube','tiktok'];
    var dataMap = {};
    platforms.forEach(function (p) { dataMap[p.provider] = p; });

    var shown = connected.length > 0
      ? connected.map(function (c) { return c.provider; })
      : platforms.map(function (p) { return p.provider; });

    if (!shown.length) shown = allProviders.filter(function (p) { return dataMap[p]; });

    var html = '';
    shown.forEach(function (provider) {
      var p   = dataMap[provider] || {};
      var col = PLATFORM_COLORS[provider] || { bg: 'rgba(255,255,255,0.1)', fg: '#fff', abbr: provider.slice(0,2).toUpperCase() };
      var posts    = parseInt(p.post_count  || connMap[provider]?.post_count || 0);
      var likes    = parseInt(p.likes    || 0);
      var comments = parseInt(p.comments || 0);
      var shares   = parseInt(p.shares   || 0);
      var views    = parseInt(p.views    || 0);
      var lastPost = p.last_post || connMap[provider]?.last_sync_at || null;

      html += '<div class="rt-platform-card">';
      html += '<div class="rt-platform-header">';
      html += '<div class="rt-platform-icon rt-platform-' + provider + '">' + col.abbr + '</div>';
      html += '<span class="rt-platform-name">' + provider + '</span>';
      html += '<span class="rt-platform-posts">' + posts + ' posts</span>';
      html += '</div>';
      html += '<div class="rt-platform-stats">';
      html += pstat(fmtNumber(likes),    '❤ Likes');
      html += pstat(fmtNumber(comments), '💬 Comments');
      html += pstat(fmtNumber(shares),   '🔁 Shares');
      if (views > 0) html += pstat(fmtNumber(views), '👁 Views');
      html += '</div>';
      if (lastPost) html += '<div class="rt-platform-last">Last post ' + timeAgo(lastPost) + '</div>';
      html += '</div>';
    });
    el.innerHTML = html || '<div class="rt-no-data">No post data. Sync platforms first.</div>';
  }

  function pstat(val, lbl) {
    return '<div class="rt-pstat"><span class="rt-pstat-val">' + val + '</span><span class="rt-pstat-lbl">' + lbl + '</span></div>';
  }

  /* ── Social sparkline (7 days) ── */
  function renderSocialSparkline(dailyData) {
    var W = 400, H = 80, PAD = 6;
    // Build last 7 days
    var byDay = {};
    dailyData.forEach(function (r) { byDay[r.day] = parseInt(r.cnt); });

    var points = [];
    var maxVal = 1;
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0,10);
      var v   = byDay[key] || 0;
      if (v > maxVal) maxVal = v;
      points.push({ key: key, v: v });
    }

    var xs = points.map(function (_, i) { return PAD + (i / 6) * (W - PAD * 2); });
    var ys = points.map(function (p) { return H - PAD - (p.v / maxVal) * (H - PAD * 2); });

    var polyPts = xs.map(function (x, i) { return x + ',' + ys[i]; }).join(' ');
    var fillPath = 'M' + xs[0] + ',' + H + ' L' + xs[0] + ',' + ys[0]
      + ' ' + xs.map(function (x, i) { return 'L' + x + ',' + ys[i]; }).join(' ')
      + ' L' + xs[xs.length-1] + ',' + H + ' Z';

    var lineEl = document.getElementById('rtSocialSparkLine');
    var fillEl = document.getElementById('rtSocialSparkFill');
    if (lineEl) lineEl.setAttribute('points', polyPts);
    if (fillEl) fillEl.setAttribute('d', fillPath);

    var labelsEl = document.getElementById('rtSocialSparkLabels');
    if (labelsEl) {
      var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      labelsEl.innerHTML = points.map(function (p) {
        var d = new Date(p.key + 'T12:00:00');
        return '<span>' + days[d.getDay()] + '</span>';
      }).join('');
    }
  }

  /* ── Top posts ── */
  function renderTopPosts(posts) {
    var el = document.getElementById('rtTopPosts');
    if (!el) return;
    if (!posts.length) { el.innerHTML = '<div class="rt-no-data">No posts synced yet.<br>Go to Social Planner → Sync.</div>'; return; }

    var html = '';
    posts.forEach(function (p) {
      var col    = PLATFORM_COLORS[p.provider] || { bg:'rgba(255,255,255,0.1)', fg:'#fff', abbr: p.provider.slice(0,2).toUpperCase() };
      var engage = parseInt(p.engagement || 0);
      var caption = p.caption ? p.caption.slice(0, 80) + (p.caption.length > 80 ? '…' : '') : '(no caption)';
      html += '<div class="rt-top-post">';
      html += '<div class="rt-top-post-provider rt-platform-' + p.provider + '">' + col.abbr + '</div>';
      html += '<div class="rt-top-post-body">';
      html += '<div class="rt-top-post-caption">' + esc(caption) + '</div>';
      html += '<div class="rt-top-post-stats">';
      html += '<span class="rt-top-post-stat"><span>' + fmtNumber(parseInt(p.likes_count||0)) + '</span>❤</span>';
      html += '<span class="rt-top-post-stat"><span>' + fmtNumber(parseInt(p.comments_count||0)) + '</span>💬</span>';
      html += '<span class="rt-top-post-stat"><span>' + fmtNumber(parseInt(p.shares_count||0)) + '</span>🔁</span>';
      if (parseInt(p.views_count||0) > 0) html += '<span class="rt-top-post-stat"><span>' + fmtNumber(parseInt(p.views_count||0)) + '</span>👁</span>';
      html += '<span class="rt-top-post-engage">' + fmtNumber(engage) + ' eng</span>';
      if (p.permalink) html += '<a class="rt-top-post-link" href="' + esc(p.permalink) + '" target="_blank" rel="noopener">View ↗</a>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  /* ── Scheduled queue ── */
  function renderScheduled(items, counts) {
    var el        = document.getElementById('rtScheduledList');
    var countEl   = document.getElementById('rtScheduledCount');
    if (!el) return;

    var total = Object.values ? Object.values(counts).reduce(function (s,v){ return s+(v||0); },0)
      : (counts.scheduled||0)+(counts.publishing||0)+(counts.published||0)+(counts.failed||0);
    if (countEl) countEl.textContent = total;

    if (!items.length) { el.innerHTML = '<div class="rt-no-data">No scheduled posts</div>'; return; }

    var html = '';
    items.forEach(function (item) {
      var providers = (item.providers || '').split(',').filter(Boolean);
      var caption   = item.caption || '(no caption)';
      var dt        = item.status === 'published' ? item.published_at : item.scheduled_at;
      html += '<div class="rt-sched-row">';
      html += '<div class="rt-sched-header">';
      html += '<span class="rt-sched-status rt-sched-' + item.status + '">' + item.status + '</span>';
      html += '<div class="rt-sched-providers">';
      providers.forEach(function (p) {
        var col = PLATFORM_COLORS[p] || { bg:'rgba(255,255,255,0.1)', fg:'#fff' };
        html += '<span class="rt-sched-provider-tag" style="background:' + col.bg + ';color:' + col.fg + '">' + p.slice(0,2).toUpperCase() + '</span>';
      });
      html += '</div>';
      html += '</div>';
      html += '<div class="rt-sched-caption">' + esc(caption.slice(0,100)) + '</div>';
      html += '<div class="rt-sched-time">' + (dt ? timeAgo(dt) : '—') + '</div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  /* ── Activity Feed ── */
  function renderFeed(feed) {
    var container = document.getElementById('rtFeed');
    var countEl   = document.getElementById('rtFeedCount');
    if (!container) return;
    if (!feed.length) { container.innerHTML = '<div class="rt-feed-empty">No recent activity</div>'; if (countEl) countEl.textContent = '0'; return; }
    if (countEl) countEl.textContent = feed.length;
    var html = '';
    feed.forEach(function (item) {
      html += '<div class="rt-feed-item">';
      html += '<div class="rt-feed-dot rt-dot-' + item.type + '">' + feedIcon(item.type) + '</div>';
      html += '<div class="rt-feed-info">';
      html += '<div class="rt-feed-title">' + esc(item.title) + '</div>';
      html += '<div class="rt-feed-meta">';
      if (item.sub)   html += '<span class="rt-feed-sub">'   + esc(item.sub)   + '</span>';
      if (item.extra) html += '<span class="rt-feed-extra">' + esc(item.extra) + '</span>';
      html += '</div></div>';
      html += '<div class="rt-feed-time">' + timeAgo(item.time) + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  /* ── CRM Sparkline (24h) ── */
  function buildHourlyPoints(hourlyData) {
    var byHour = {};
    hourlyData.forEach(function (r) { byHour[parseInt(r.hr)] = parseInt(r.cnt); });
    var now = new Date();
    var currentHour = now.getHours();
    var points = [];
    var maxVal = 1;
    for (var i = 0; i < 24; i++) {
      var h = (currentHour - 23 + i + 24) % 24;
      var v = byHour[h] || 0;
      if (v > maxVal) maxVal = v;
      points.push({ h: h, v: v, maxVal: maxVal });
    }
    return { points: points, maxVal: maxVal };
  }

  function renderSparkline(lineId, fillId, labelsId, data, color, gradId) {
    var W = 400, H = 80, PAD = 6;
    var points = data.points;
    var maxVal = data.maxVal;
    var xs = points.map(function (_, i) { return PAD + (i / (points.length-1)) * (W - PAD*2); });
    var ys = points.map(function (p) { return H - PAD - (p.v / maxVal) * (H - PAD*2); });
    var polyPts  = xs.map(function (x, i) { return x + ',' + ys[i]; }).join(' ');
    var fillPath = 'M' + xs[0] + ',' + H + ' L' + xs[0] + ',' + ys[0]
      + ' ' + xs.map(function (x, i) { return 'L' + x + ',' + ys[i]; }).join(' ')
      + ' L' + xs[xs.length-1] + ',' + H + ' Z';
    var lineEl = document.getElementById(lineId);
    var fillEl = document.getElementById(fillId);
    if (lineEl) lineEl.setAttribute('points', polyPts);
    if (fillEl) fillEl.setAttribute('d', fillPath);

    var labelsEl = document.getElementById(labelsId);
    if (labelsEl) {
      var lblHtml = '';
      [0, 6, 12, 18, 23].forEach(function (idx) {
        var h = points[idx].h;
        var label = h === 0 ? '12a' : (h < 12 ? h + 'a' : (h === 12 ? '12p' : (h-12) + 'p'));
        lblHtml += '<span>' + label + '</span>';
      });
      labelsEl.innerHTML = lblHtml;
    }
  }

  /* ── Distribution bars ── */
  function renderDistribution(containerId, rows, labelKey, colorPrefix) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!rows.length) { el.innerHTML = '<div class="rt-no-data">No data</div>'; return; }
    var total = rows.reduce(function (s, r) { return s + parseInt(r.cnt); }, 0) || 1;
    var html = '';
    rows.forEach(function (r, i) {
      var lbl = r[labelKey] || 'other';
      var cnt = parseInt(r.cnt);
      var pct = Math.round((cnt / total) * 100);
      var colorClass = colorPrefix === 'status' ? 'rt-dist-status-' + lbl : 'rt-seg-' + (i % 8);
      html += '<div class="rt-dist-row"><div class="rt-dist-row-header">';
      html += '<span class="rt-dist-label">' + esc(lbl) + '</span>';
      html += '<span class="rt-dist-count">' + cnt + ' (' + pct + '%)</span>';
      html += '</div><div class="rt-dist-bar-track"><div class="rt-dist-bar-fill ' + colorClass + '" style="width:' + pct + '%"></div></div></div>';
    });
    el.innerHTML = html;
  }

  /* ── Pipeline ── */
  function renderPipeline(stages) {
    var el = document.getElementById('rtByStage');
    if (!el) return;
    if (!stages.length) { el.innerHTML = '<div class="rt-no-data">No pipeline data</div>'; return; }
    var maxCnt = Math.max.apply(null, stages.map(function (s) { return parseInt(s.cnt)||0; })) || 1;
    var html = '';
    stages.forEach(function (s) {
      var cnt   = parseInt(s.cnt) || 0;
      var total = parseFloat(s.total) || 0;
      var pct   = Math.round((cnt / maxCnt) * 100);
      var color = s.color || '#6c5ce7';
      html += '<div class="rt-stage-row"><div class="rt-stage-header">';
      html += '<span class="rt-stage-dot" style="background:' + color + '"></span>';
      html += '<span class="rt-stage-name">' + esc(s.name) + '</span>';
      html += '<span class="rt-stage-meta"><span class="rt-stage-cnt">' + cnt + '</span>';
      if (total > 0) html += '<span class="rt-stage-val">$' + fmtMoney(total) + '</span>';
      html += '</span></div>';
      html += '<div class="rt-stage-bar-track"><div class="rt-stage-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  /* ── Email Campaigns ── */
  function renderCampaigns(campaigns) {
    var el = document.getElementById('rtCampaigns');
    if (!el) return;
    if (!campaigns.length) { el.innerHTML = '<div class="rt-no-data">No sent campaigns yet</div>'; return; }
    var html = '';
    campaigns.forEach(function (c) {
      var sent   = parseInt(c.sent)  || 0;
      var opens  = parseInt(c.opens) || 0;
      var clicks = parseInt(c.clicks)|| 0;
      var openRate  = sent > 0 ? Math.round((opens  / sent) * 100) : 0;
      var clickRate = sent > 0 ? Math.round((clicks / sent) * 100) : 0;
      html += '<div class="rt-campaign-row"><div class="rt-campaign-name">' + esc(c.subject) + '</div>';
      html += '<div class="rt-campaign-stats">';
      html += cstat(sent,           'Sent');
      html += cstat(opens,          'Opens');
      html += cstat(openRate + '%', 'Open %',  true);
      html += cstat(clicks,         'Clicks');
      html += cstat(clickRate + '%','CTR',     true);
      html += '</div></div>';
    });
    el.innerHTML = html;
  }

  /* ── Helpers ── */
  function feedIcon(type) {
    if (type === 'contact') return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    if (type === 'deal')    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>';
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  }
  function cstat(val, lbl, isRate) {
    return '<div class="rt-cstat"><span class="rt-cstat-val' + (isRate ? ' rt-cstat-rate' : '') + '">' + val + '</span><span class="rt-cstat-lbl">' + lbl + '</span></div>';
  }
  function animateCount(id, target) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
    if (start === target) return;
    var diff = target - start, steps = 20, step = 0;
    el.classList.add('updated');
    var iv = setInterval(function () {
      step++;
      el.textContent = fmtNumber(Math.round(start + diff * step / steps));
      if (step >= steps) {
        clearInterval(iv);
        el.textContent = fmtNumber(target);
        setTimeout(function () { el.classList.remove('updated'); }, 600);
      }
    }, 16);
  }
  function timeAgo(ts) {
    if (!ts) return '';
    var then = new Date(ts.replace(' ', 'T'));
    var diff = Math.floor((Date.now() - then.getTime()) / 1000);
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }
  function fmtNumber(n) { return (n || 0).toLocaleString(); }
  function fmtMoney(n) {
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n/1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }
  function setEl(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

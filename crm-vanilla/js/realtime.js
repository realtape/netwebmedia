/* NetWeb CRM — Realtime Dashboard */
(function () {
  'use strict';

  var REFRESH_INTERVAL = 30; // seconds
  var countdown = REFRESH_INTERVAL;
  var timer = null;
  var lastData = null;

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof CRM_APP !== 'undefined') {
      CRM_APP.init({ page: 'realtime', title: 'Realtime' });
    }
    bindControls();
    fetchData();
  });

  function bindControls() {
    document.getElementById('rtRefreshBtn').addEventListener('click', function () {
      fetchData();
    });
    document.getElementById('rtAutoRefresh').addEventListener('change', function () {
      if (this.checked) { startTimer(); } else { stopTimer(); }
    });
  }

  /* ── Fetch ── */
  function fetchData() {
    var btn = document.getElementById('rtRefreshBtn');
    btn.classList.add('spinning');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=realtime', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      btn.classList.remove('spinning');
      if (xhr.status === 200) {
        try {
          var d = JSON.parse(xhr.responseText);
          render(d);
          lastData = d;
          updateTimestamp();
          resetCountdown();
        } catch (e) {
          console.warn('Realtime parse error', e);
        }
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

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function resetCountdown() {
    countdown = REFRESH_INTERVAL;
    updateCountdownLabel();
    if (document.getElementById('rtAutoRefresh').checked) startTimer();
  }

  function updateCountdownLabel() {
    var el = document.getElementById('rtCountdown');
    if (!el) return;
    if (!document.getElementById('rtAutoRefresh').checked) {
      el.textContent = 'Auto-refresh off';
      return;
    }
    el.textContent = 'Refreshing in ' + countdown + 's';
  }

  function updateTimestamp() {
    var el = document.getElementById('rtUpdated');
    if (!el) return;
    var now = new Date();
    el.textContent = 'Last updated ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  function render(d) {
    renderKPIs(d);
    renderFeed(d.feed || []);
    renderSparkline(d.hourlyContacts || []);
    renderDistribution('rtByStatus', d.byStatus || [], 'status', 'status');
    renderDistribution('rtBySegment', d.bySegment || [], 'segment', 'seg');
    renderPipeline(d.byStage || []);
    renderCampaigns(d.campaigns || []);
  }

  /* ── KPIs ── */
  function renderKPIs(d) {
    animateCount('kpiTotalContacts', d.totalContacts || 0);
    animateCount('kpiActiveDeals',   d.dealsActive   || 0);
    animateCount('kpiEmailsSent',    d.emailsSentToday || 0);
    animateCount('kpiThisMonth',     d.contactsThisMonth || 0);

    setEl('kpiContactsSub', (d.contactsToday || 0) + ' new today');
    setEl('kpiPipelineSub', '$' + fmtMoney(d.pipelineValue || 0) + ' in pipeline');
    setEl('kpiEmailsSub',   (d.emailsOpenedToday || 0) + ' opened');

    var growth = d.contactsLastMonth > 0
      ? Math.round(((d.contactsThisMonth - d.contactsLastMonth) / d.contactsLastMonth) * 100)
      : 0;
    var sign = growth >= 0 ? '+' : '';
    setEl('kpiGrowthSub', sign + growth + '% vs last month');
  }

  function animateCount(id, target) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
    var diff  = target - start;
    if (diff === 0) return;
    var steps = 20;
    var step  = 0;
    el.classList.add('updated');
    var iv = setInterval(function () {
      step++;
      var val = Math.round(start + (diff * step / steps));
      el.textContent = fmtNumber(val);
      if (step >= steps) {
        clearInterval(iv);
        el.textContent = fmtNumber(target);
        setTimeout(function () { el.classList.remove('updated'); }, 600);
      }
    }, 16);
  }

  /* ── Activity Feed ── */
  var knownFeedIds = {};

  function renderFeed(feed) {
    var container = document.getElementById('rtFeed');
    var countEl   = document.getElementById('rtFeedCount');
    if (!container) return;

    if (!feed.length) {
      container.innerHTML = '<div class="rt-feed-empty">No recent activity</div>';
      if (countEl) countEl.textContent = '0';
      return;
    }

    if (countEl) countEl.textContent = feed.length;

    var html = '';
    feed.forEach(function (item) {
      var icon = feedIcon(item.type);
      var dotClass = 'rt-dot-' + item.type;
      var ago = timeAgo(item.time);
      html += '<div class="rt-feed-item">';
      html += '<div class="rt-feed-dot ' + dotClass + '">' + icon + '</div>';
      html += '<div class="rt-feed-info">';
      html += '<div class="rt-feed-title">' + esc(item.title) + '</div>';
      html += '<div class="rt-feed-meta">';
      if (item.sub) html += '<span class="rt-feed-sub">' + esc(item.sub) + '</span>';
      if (item.extra) html += '<span class="rt-feed-extra">' + esc(item.extra) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<div class="rt-feed-time">' + ago + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function feedIcon(type) {
    if (type === 'contact') return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    if (type === 'deal')    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>';
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  }

  /* ── Sparkline ── */
  function renderSparkline(hourlyData) {
    var W = 400, H = 80, PAD = 6;
    var byHour = {};
    hourlyData.forEach(function (r) { byHour[parseInt(r.hr)] = parseInt(r.cnt); });

    // Build 24 points
    var now = new Date();
    var currentHour = now.getHours();
    var points = [];
    var maxVal = 1;
    for (var i = 0; i < 24; i++) {
      var h = (currentHour - 23 + i + 24) % 24;
      var v = byHour[h] || 0;
      if (v > maxVal) maxVal = v;
      points.push({ h: h, v: v });
    }

    var xs = points.map(function (_, i) { return PAD + (i / 23) * (W - PAD * 2); });
    var ys = points.map(function (p) { return H - PAD - (p.v / maxVal) * (H - PAD * 2); });

    // Polyline
    var polyPts = xs.map(function (x, i) { return x + ',' + ys[i]; }).join(' ');

    // Fill path (close bottom)
    var fillPath = 'M' + xs[0] + ',' + H
      + ' L' + xs[0] + ',' + ys[0]
      + ' ' + xs.map(function (x, i) { return 'L' + x + ',' + ys[i]; }).join(' ')
      + ' L' + xs[xs.length - 1] + ',' + H + ' Z';

    var lineEl = document.getElementById('rtSparkLine');
    var fillEl = document.getElementById('rtSparkFill');
    if (lineEl) lineEl.setAttribute('points', polyPts);
    if (fillEl) fillEl.setAttribute('d', fillPath);

    // Hour labels (every 4h)
    var labelsEl = document.getElementById('rtSparkLabels');
    if (labelsEl) {
      var lblHtml = '';
      [0, 6, 12, 18, 23].forEach(function (idx) {
        var h = points[idx].h;
        var label = h === 0 ? '12a' : (h < 12 ? h + 'a' : (h === 12 ? '12p' : (h - 12) + 'p'));
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

    var total = rows.reduce(function (s, r) { return s + parseInt(r.cnt); }, 0);
    if (!total) total = 1;

    var html = '';
    rows.forEach(function (r, i) {
      var lbl = r[labelKey] || 'other';
      var cnt = parseInt(r.cnt);
      var pct = Math.round((cnt / total) * 100);
      var colorClass = colorPrefix === 'status'
        ? 'rt-dist-status-' + lbl
        : 'rt-seg-' + (i % 8);
      html += '<div class="rt-dist-row">';
      html += '<div class="rt-dist-row-header">';
      html += '<span class="rt-dist-label">' + esc(lbl) + '</span>';
      html += '<span class="rt-dist-count">' + cnt + ' (' + pct + '%)</span>';
      html += '</div>';
      html += '<div class="rt-dist-bar-track"><div class="rt-dist-bar-fill ' + colorClass + '" style="width:' + pct + '%"></div></div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  /* ── Pipeline ── */
  function renderPipeline(stages) {
    var el = document.getElementById('rtByStage');
    if (!el) return;
    if (!stages.length) { el.innerHTML = '<div class="rt-no-data">No pipeline data</div>'; return; }

    var maxCnt = Math.max.apply(null, stages.map(function (s) { return parseInt(s.cnt) || 0; }));
    if (!maxCnt) maxCnt = 1;

    var html = '';
    stages.forEach(function (s) {
      var cnt   = parseInt(s.cnt) || 0;
      var total = parseFloat(s.total) || 0;
      var pct   = Math.round((cnt / maxCnt) * 100);
      var color = s.color || '#6c5ce7';
      html += '<div class="rt-stage-row">';
      html += '<div class="rt-stage-header">';
      html += '<span class="rt-stage-dot" style="background:' + color + '"></span>';
      html += '<span class="rt-stage-name">' + esc(s.name) + '</span>';
      html += '<span class="rt-stage-meta">';
      html += '<span class="rt-stage-cnt">' + cnt + '</span>';
      if (total > 0) html += '<span class="rt-stage-val">$' + fmtMoney(total) + '</span>';
      html += '</span>';
      html += '</div>';
      html += '<div class="rt-stage-bar-track"><div class="rt-stage-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  /* ── Campaigns ── */
  function renderCampaigns(campaigns) {
    var el = document.getElementById('rtCampaigns');
    if (!el) return;
    if (!campaigns.length) {
      el.innerHTML = '<div class="rt-no-data">No sent campaigns yet</div>';
      return;
    }
    var html = '';
    campaigns.forEach(function (c) {
      var sent   = parseInt(c.sent)   || 0;
      var opens  = parseInt(c.opens)  || 0;
      var clicks = parseInt(c.clicks) || 0;
      var openRate  = sent > 0 ? Math.round((opens  / sent) * 100) : 0;
      var clickRate = sent > 0 ? Math.round((clicks / sent) * 100) : 0;
      html += '<div class="rt-campaign-row">';
      html += '<div class="rt-campaign-name">' + esc(c.subject) + '</div>';
      html += '<div class="rt-campaign-stats">';
      html += cstat(sent,      'Sent');
      html += cstat(opens,     'Opens');
      html += cstat(openRate  + '%', 'Open %',  true);
      html += cstat(clicks,    'Clicks');
      html += cstat(clickRate + '%', 'CTR',     true);
      html += '</div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function cstat(val, lbl, isRate) {
    return '<div class="rt-cstat"><span class="rt-cstat-val' + (isRate ? ' rt-cstat-rate' : '') + '">' + val + '</span><span class="rt-cstat-lbl">' + lbl + '</span></div>';
  }

  /* ── Helpers ── */
  function timeAgo(ts) {
    if (!ts) return '';
    var then = new Date(ts.replace(' ', 'T'));
    var diff = Math.floor((Date.now() - then.getTime()) / 1000);
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function fmtNumber(n) {
    return n.toLocaleString();
  }

  function fmtMoney(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }

  function setEl(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();

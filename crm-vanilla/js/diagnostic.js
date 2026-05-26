/* Diagnostic Tool — CRM wrapper for /api/?r=analyze */
(function () {
  'use strict';

  var currentUrl = '';
  var scanning   = false;

  document.addEventListener('DOMContentLoaded', function () {
    CRM_APP.buildHeader('Diagnostic',
      '<a href="https://netwebmedia.com/diagnostic.html" target="_blank" class="btn btn-outline" style="font-size:13px">&#8599; Share Public Tool</a>'
    );
    render();
  });

  /* ── Main render ──────────────────────────────────────────────────────── */
  function render() {
    var body = document.getElementById('diagnosticBody');
    if (!body) return;

    body.innerHTML =
      '<div style="max-width:900px;margin:0 auto;padding:0 4px">' +

      /* Scanner card */
      '<div class="summary-card" style="margin-bottom:24px;padding:28px">' +
        '<h2 style="font-size:18px;font-weight:700;margin:0 0 6px">Website Diagnostic</h2>' +
        '<p style="color:var(--text-dim);font-size:13px;margin:0 0 20px">' +
          'Run a live SEO, performance, and accessibility audit on any URL.' +
        '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<input id="diagUrl" class="form-input" type="url" placeholder="https://example.com" ' +
            'style="flex:1;min-width:240px" value="' + escHtml(currentUrl) + '">' +
          '<button id="diagRunBtn" class="btn btn-primary" style="white-space:nowrap">Run Audit</button>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--text-muted);margin:10px 0 0">' +
          'Powered by the NetWebMedia Analyzer — the same engine behind the public tool.' +
        '</p>' +
      '</div>' +

      /* Results area */
      '<div id="diagResults"></div>' +

      /* Share section */
      '<div class="summary-card" style="padding:20px;text-align:center;margin-top:24px">' +
        '<p style="font-size:14px;font-weight:600;margin:0 0 8px">Share the free diagnostic with prospects</p>' +
        '<p style="font-size:13px;color:var(--text-dim);margin:0 0 14px">' +
          'Send them the public tool — every submission comes back as a CRM lead.' +
        '</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<a href="https://netwebmedia.com/diagnostic.html" target="_blank" class="btn btn-primary">Open Public Tool</a>' +
          '<button class="btn btn-outline" onclick="copyDiagLink()">Copy Link</button>' +
        '</div>' +
      '</div>' +

      '</div>';

    document.getElementById('diagRunBtn').addEventListener('click', runAudit);
    document.getElementById('diagUrl').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runAudit();
    });
  }

  /* ── Run audit via /api/?r=analyze ───────────────────────────────────── */
  function runAudit() {
    if (scanning) return;
    var input = document.getElementById('diagUrl');
    var url   = (input ? input.value.trim() : '') || currentUrl;
    if (!url) { alert('Enter a URL first.'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    currentUrl = url;

    var btn = document.getElementById('diagRunBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Scanning…'; }
    scanning = true;

    var results = document.getElementById('diagResults');
    if (results) results.innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-dim)">Fetching and analyzing ' +
      escHtml(url) + '…</div>';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=analyze&url=' + encodeURIComponent(url), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      scanning = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Run Audit'; }
      if (xhr.status >= 200 && xhr.status < 300) {
        try { renderResults(JSON.parse(xhr.responseText), url); }
        catch (e) { showError('Could not parse response.'); }
      } else {
        try {
          var err = JSON.parse(xhr.responseText);
          showError(err.error || 'Audit failed (' + xhr.status + ')');
        } catch (e) { showError('Audit failed (' + xhr.status + ')'); }
      }
    };
    xhr.send();
  }

  /* ── Render results ───────────────────────────────────────────────────── */
  function renderResults(data, url) {
    var results = document.getElementById('diagResults');
    if (!results) return;

    var scores = data.scores || {};
    var checks = data.checks || {};

    /* Score cards */
    var scoreCategories = [
      { key: 'seo',  label: 'SEO' },
      { key: 'perf', label: 'Performance' },
      { key: 'a11y', label: 'Accessibility' },
      { key: 'bp',   label: 'Best Practices' }
    ];

    var scoreHtml = '<div class="summary-cards" style="margin-bottom:20px">';
    for (var i = 0; i < scoreCategories.length; i++) {
      var cat   = scoreCategories[i];
      var score = typeof scores[cat.key] === 'number' ? Math.round(scores[cat.key]) : '—';
      var color = score >= 80 ? 'var(--green,#10B981)' : score >= 60 ? 'var(--accent,#FF671F)' : 'var(--red,#EF4444)';
      scoreHtml +=
        '<div class="summary-card" style="text-align:center">' +
          '<div style="font-size:36px;font-weight:800;color:' + color + '">' + score + '</div>' +
          '<div class="card-label" style="margin-top:4px">' + cat.label + '</div>' +
        '</div>';
    }
    scoreHtml += '</div>';

    /* Meta info */
    scoreHtml +=
      '<p style="font-size:12px;color:var(--text-muted);margin:0 0 20px">' +
      'Analyzed: <strong>' + escHtml(url) + '</strong> &nbsp;·&nbsp; ' +
      (data.fetched_ms ? data.fetched_ms + 'ms' : '') +
      (data.size_kb    ? ' &nbsp;·&nbsp; ' + data.size_kb + ' KB' : '') +
      '</p>';

    /* Check lists */
    var checkOrder = ['seo', 'perf', 'a11y', 'bp'];
    var checkLabels = { seo: 'SEO', perf: 'Performance', a11y: 'Accessibility', bp: 'Best Practices' };

    var checksHtml = '';
    for (var c = 0; c < checkOrder.length; c++) {
      var key  = checkOrder[c];
      var list = checks[key];
      if (!list || !list.length) continue;
      checksHtml += '<div class="summary-card" style="padding:20px;margin-bottom:16px">';
      checksHtml += '<h3 style="font-size:14px;font-weight:700;margin:0 0 14px">' + checkLabels[key] + '</h3>';
      checksHtml += '<div style="display:flex;flex-direction:column;gap:8px">';
      for (var j = 0; j < list.length; j++) {
        var item   = list[j];
        var passed = item.pass !== false;
        var dot    = passed
          ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--green,#10B981);flex-shrink:0;margin-top:3px"></span>'
          : '<span style="width:8px;height:8px;border-radius:50%;background:var(--red,#EF4444);flex-shrink:0;margin-top:3px"></span>';
        checksHtml +=
          '<div style="display:flex;gap:10px;align-items:flex-start">' +
            dot +
            '<div>' +
              '<div style="font-size:13px;font-weight:500">' + escHtml(item.label || '') + '</div>' +
              (item.detail ? '<div style="font-size:12px;color:var(--text-dim);margin-top:2px">' + escHtml(item.detail) + '</div>' : '') +
            '</div>' +
          '</div>';
      }
      checksHtml += '</div></div>';
    }

    results.innerHTML = scoreHtml + checksHtml;
  }

  function showError(msg) {
    var results = document.getElementById('diagResults');
    if (results) results.innerHTML =
      '<div class="summary-card" style="padding:20px;color:var(--red,#EF4444);text-align:center">' +
      escHtml(msg) + '</div>';
  }

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.copyDiagLink = function () {
    var link = 'https://netwebmedia.com/diagnostic.html';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () { alert('Link copied!'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Link copied!');
    }
  };

})();

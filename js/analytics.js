/* NetWebMedia Deep Audit — calls /api/public/audit and renders results. */
(function () {
  'use strict';

  var form = document.getElementById('analytics-form');
  var btn  = document.getElementById('analyze-btn');
  var bar  = document.getElementById('loading-bar');
  var fill = document.getElementById('loading-fill');
  var loadingText = document.getElementById('analyzing-text');
  var results = document.getElementById('results');
  var resultsUrl = document.getElementById('results-url');
  var resultsDate = document.getElementById('results-date');

  // HTML-escape any value going into innerHTML. Consistent with the helper in
  // js/crm-dashboard.js. EVERY interpolation of audit response data must go
  // through this — the audit endpoint accepts user-supplied URLs and returns
  // parsed page titles, social handles, and Claude-generated narrative; any
  // of those can contain attacker-controlled HTML.
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // Backwards-compatible short name.
  var esc = escapeHtml;
  function safeNum(n) { var v = Number(n); return Number.isFinite(v) ? v : 0; }

  function scoreColor(n) {
    if (n >= 85) return '#00b894';
    if (n >= 65) return '#fdcb6e';
    if (n >= 40) return '#e17055';
    return '#d63031';
  }
  function scoreLabel(n) {
    if (n >= 85) return 'Excellent';
    if (n >= 65) return 'Good';
    if (n >= 40) return 'Needs work';
    return 'Critical';
  }

  function renderScores(scores) {
    var cards = [
      ['Overall',     scores.overall,     '🎯'],
      ['SEO',         scores.seo,         '🔍'],
      ['Performance', scores.performance, '⚡'],
      ['Mobile',      scores.mobile,      '📱'],
      ['Content',     scores.content,     '📝'],
      ['Technical',   scores.technical,   '🔒'],
    ];
    var overview = document.getElementById('score-overview');
    if (!overview) return;
    overview.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    overview.innerHTML = cards.map(function (c) {
      // c[1] is a numeric score from the audit JSON. Coerce to a number BEFORE
      // it's interpolated into HTML — defends against the API ever returning
      // a non-numeric score (e.g. an object that stringifies into HTML).
      var score = safeNum(c[1]);
      var color = scoreColor(score); // returns one of 4 hardcoded hex strings — safe
      var label = c[0];               // hardcoded English string from `cards` array — safe
      var icon  = c[2];               // hardcoded emoji from `cards` array — safe
      return '<div class="score-card">' +
        '<div style="font-size:32px;">' + escapeHtml(icon) + '</div>' +
        '<div class="score-value" style="color:' + color + ';font-size:40px;font-weight:800;margin:8px 0 4px;">' + score + '</div>' +
        '<div class="score-label" style="font-size:12px;color:#9aa3b4;text-transform:uppercase;letter-spacing:.08em;">' + escapeHtml(label) + '</div>' +
        '<div style="font-size:11px;color:' + color + ';margin-top:4px;">' + escapeHtml(scoreLabel(score)) + '</div>' +
        '</div>';
    }).join('');
  }

  function checkRow(label, value, ok, hint) {
    var dot = '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + (ok ? '#00b894' : '#e17055') + ';margin-right:10px;vertical-align:middle;"></span>';
    var v = value == null ? '' : '<strong style="color:#fff;">' + esc(value) + '</strong>';
    return '<div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.08);">' +
      dot + esc(label) + (v ? ' — ' + v : '') +
      (hint ? '<div style="font-size:12px;color:#7B8FAD;margin-left:22px;margin-top:4px;">' + esc(hint) + '</div>' : '') +
      '</div>';
  }

  function renderSEO(p) {
    var c = '';
    c += checkRow('Page title',          p.title || '(missing)',                           !!p.title, p.title ? (p.title_len + ' chars · ideal 50-60') : null);
    c += checkRow('Meta description',    p.meta_description || '(missing)',                !!p.meta_description, p.meta_description ? (p.meta_desc_len + ' chars · ideal 120-155') : null);
    c += checkRow('H1 headings',         p.h1.length + ' found',                           p.h1.length === 1, p.h1.length === 0 ? 'Add exactly one H1' : (p.h1.length > 1 ? 'Use only one H1 per page' : null));
    c += checkRow('H2 structure',        p.h2_count + ' H2s',                              p.h2_count >= 2);
    c += checkRow('Language attribute',  p.lang || '(missing)',                            !!p.lang);
    c += checkRow('Canonical URL',       p.canonical || '(missing)',                       !!p.canonical);
    c += checkRow('Structured data (schema.org)', p.has_schema ? 'detected' : 'missing',   p.has_schema, !p.has_schema ? 'Add JSON-LD for huge SEO lift' : null);
    c += checkRow('Open Graph tags',     p.has_og ? 'detected' : 'missing',                p.has_og);
    c += checkRow('Twitter Card tags',   p.has_twitter ? 'detected' : 'missing',           p.has_twitter);
    document.getElementById('seo-checks').innerHTML = c;
  }

  function renderPerf(perf, security) {
    var c = '';
    c += checkRow('Load time',           perf.t_ms + ' ms',                                perf.t_ms <= 1500, perf.t_ms > 3000 ? 'Very slow — optimize images + enable CDN' : null);
    c += checkRow('Page weight',         perf.size_kb + ' KB',                             perf.size_kb < 1500);
    c += checkRow('GZIP / Brotli',       perf.gzip ? 'enabled' : 'not enabled',            !!perf.gzip, !perf.gzip ? 'Enable in .htaccess' : null);
    c += checkRow('Browser caching',     perf.cache ? 'headers present' : 'missing',       !!perf.cache);
    c += checkRow('HTTPS',               security.https ? 'yes' : 'no',                    !!security.https);
    c += checkRow('SSL valid',           security.ssl_ok ? 'valid' : 'issue',              !!security.ssl_ok);
    c += checkRow('HSTS enabled',        security.hsts ? 'yes' : 'no',                     !!security.hsts);
    document.getElementById('perf-checks').innerHTML = c;
  }

  function renderA11yContent(p) {
    var c = '';
    var altPct = p.images_total ? Math.round((1 - p.images_no_alt / p.images_total) * 100) : 100;
    c += checkRow('Images with alt text', altPct + '% (' + (p.images_total - p.images_no_alt) + '/' + p.images_total + ')', altPct >= 90);
    c += checkRow('Viewport meta tag',   p.viewport || '(missing)',                         !!p.viewport);
    c += checkRow('Favicon',             p.has_favicon ? 'present' : 'missing',             !!p.has_favicon);
    c += checkRow('Total links on page', p.links_total + ' links',                          p.links_total >= 10);
    c += checkRow('External links',      p.links_external + ' to other domains',            p.links_external >= 2);
    document.getElementById('a11y-checks').innerHTML = c;
  }

  function renderBP(p) {
    var c = '';
    c += checkRow('Google Analytics / GA4', p.has_gtag ? 'detected' : 'missing',           p.has_gtag);
    c += checkRow('Google Tag Manager',     p.has_gtm ? 'detected' : 'missing',            p.has_gtm);
    c += checkRow('Meta (Facebook) Pixel',  p.has_meta_pixel ? 'detected' : 'missing',     p.has_meta_pixel);
    c += checkRow('Hotjar / session replay', p.has_hotjar ? 'detected' : 'missing',        p.has_hotjar);
    c += checkRow('Service Worker (PWA)',   p.has_service_worker ? 'yes' : 'no',           p.has_service_worker);
    document.getElementById('bp-checks').innerHTML = c;
  }

  function renderSocial(socials) {
    var anchor = document.getElementById('bp-details');
    if (!anchor) return;
    var existing = document.getElementById('social-details');
    if (existing) existing.remove();
    var section = document.createElement('div');
    section.className = 'detail-section';
    section.id = 'social-details';
    section.style.marginTop = '24px';
    var rows = Object.keys(socials || {}).map(function (p) {
      var s = socials[p]; if (!s) return '';
      return checkRow(p.charAt(0).toUpperCase() + p.slice(1) + ': @' + s.handle, s.url, s.reachable, s.reachable ? 'Profile reachable' : 'Not reachable (HTTP ' + s.status + ')');
    }).join('');
    section.innerHTML = '<h3>📲 Social Media Presence</h3><div class="check-list">' + (rows || '<p style="color:#7B8FAD;padding:16px;">No social handles were provided for this audit.</p>') + '</div>';
    anchor.after(section);
  }

  function renderRecs(recs, narrative) {
    var anchor = document.getElementById('social-details') || document.getElementById('bp-details');
    if (!anchor) return;
    var existing = document.getElementById('recs-details');
    if (existing) existing.remove();
    var section = document.createElement('div');
    section.className = 'detail-section';
    section.id = 'recs-details';
    section.style.marginTop = '24px';

    var severityColor = { high: '#d63031', medium: '#fdcb6e', low: '#74b9ff' };
    var recsHtml = (recs || []).map(function (r) {
      // hasOwnProperty check — guards against prototype-key lookups
      // (e.g. severity:'__proto__') and ensures clr is always one of our
      // four hardcoded hex strings (never attacker-controlled).
      var clr = Object.prototype.hasOwnProperty.call(severityColor, r.severity)
        ? severityColor[r.severity]
        : '#aaa';
      return '<div style="padding:14px;border-left:4px solid ' + clr + ';background:rgba(255,255,255,0.04);margin-bottom:10px;border-radius:6px;">' +
        '<div style="font-size:11px;color:' + clr + ';font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px;">' + esc(r.severity) + '</div>' +
        '<div style="font-weight:600;color:#fff;margin-bottom:4px;">' + esc(r.issue) + '</div>' +
        (r.fix ? '<div style="font-size:13px;color:#b0bbce;">' + esc(r.fix) + '</div>' : '') +
        '</div>';
    }).join('');
    var nar = narrative ? '<div style="background:linear-gradient(135deg,rgba(108,92,231,0.15),rgba(0,184,148,0.1));padding:20px;border-radius:12px;margin-bottom:24px;line-height:1.6;white-space:pre-wrap;color:#e0e6f0;">' + esc(narrative) + '</div>' : '';

    section.innerHTML = '<h3>💡 Recommendations & Action Plan</h3>' + nar + '<div>' + (recsHtml || '<p style="color:#00b894;padding:20px;">Great job! No critical issues detected.</p>') + '</div>' +
      '<div style="margin-top:30px;text-align:center;"><a href="/pricing.html" class="btn-primary" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF671F,#FF8A00);color:#fff;border-radius:9999px;text-decoration:none;font-weight:700;">See plans to fix these →</a></div>';
    anchor.after(section);
  }

  function simulateLoading() {
    var pct = 0;
    if (bar) bar.style.display = 'block';
    if (loadingText) loadingText.style.display = 'block';
    var interval = setInterval(function () {
      pct += Math.random() * 8;
      if (pct > 90) pct = 90;
      if (fill) fill.style.width = pct + '%';
    }, 400);
    return function stop() {
      clearInterval(interval);
      if (fill) fill.style.width = '100%';
      setTimeout(function () {
        if (bar) bar.style.display = 'none';
        if (loadingText) loadingText.style.display = 'none';
        if (fill) fill.style.width = '0%';
      }, 500);
    };
  }

  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var payload = {
      url:       fd.get('website'),
      email:     fd.get('email'),
      name:      fd.get('name'),
      company:   fd.get('company'),
      instagram: fd.get('instagram'),
      facebook:  fd.get('facebook'),
      linkedin:  fd.get('linkedin'),
      tiktok:    fd.get('tiktok'),
      youtube:   fd.get('youtube'),
      x:         fd.get('x'),
    };
    btn.disabled = true; btn.textContent = 'Analyzing…';
    var stop = simulateLoading();
    if (results) results.classList.remove('visible');

    fetch('/api/public/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json(); }).then(function (data) {
      stop();
      btn.disabled = false; btn.textContent = 'Run Deep Audit (Free)';
      if (!data.ok) {
        alert(data.error || 'Audit failed. Please check the URL and try again.');
        return;
      }
      if (resultsUrl)  resultsUrl.textContent = 'Audit for ' + data.final_url;
      if (resultsDate) resultsDate.textContent = new Date().toLocaleString() + ' · ' + data.timing_ms + 'ms · ' + data.size_kb + ' KB';
      renderScores(data.scores);
      renderSEO(data.parsed);
      renderPerf(data.performance, data.security);
      renderA11yContent(data.parsed);
      renderBP(data.parsed);
      renderSocial(data.socials);
      renderRecs(data.recommendations, data.narrative);
      if (results) { results.classList.add('visible'); results.scrollIntoView({ behavior: 'smooth' }); }
    }).catch(function (err) {
      stop();
      btn.disabled = false; btn.textContent = 'Run Deep Audit (Free)';
      alert('Network error: ' + err.message);
    });
  });
})();

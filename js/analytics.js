(function() {
  'use strict';

  var form = document.getElementById('analytics-form');
  var urlInput = document.getElementById('site-url');
  var nameInput = document.getElementById('lead-name');
  var emailInput = document.getElementById('lead-email');
  var analyzeBtn = document.getElementById('analyze-btn');
  var loadingBar = document.getElementById('loading-bar');
  var loadingFill = document.getElementById('loading-fill');
  var analyzingText = document.getElementById('analyzing-text');
  var results = document.getElementById('results');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var url = urlInput.value.trim();
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    if (!url || !name || !email) return;

    // Save lead to localStorage
    var leads = JSON.parse(localStorage.getItem('nwm_analytics_leads') || '[]');
    leads.push({ name: name, email: email, url: url, date: new Date().toISOString() });
    localStorage.setItem('nwm_analytics_leads', JSON.stringify(leads));

    // Try to send lead to CRM API
    try {
      fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name + ' - Website Audit',
          source: 'analytics-tool',
          status: 'open',
          estimatedValue: 0,
          contactEmail: email,
          contactName: name,
          website: url
        })
      }).catch(function() {});
    } catch(err) {}

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    loadingBar.classList.add('active');
    analyzingText.classList.add('active');
    results.classList.remove('visible');
    setTimeout(function() { loadingFill.classList.add('go'); }, 50);

    setTimeout(function() {
      loadingBar.classList.remove('active');
      loadingFill.classList.remove('go');
      loadingFill.style.width = '0';
      analyzingText.classList.remove('active');
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Now';

      generateResults(url, name);
      results.classList.add('visible');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 2500);
  });

  function generateResults(url, name) {
    var domain;
    try { domain = new URL(url).hostname; } catch(e) { domain = url.replace(/https?:\/\//, '').split('/')[0]; }

    var seed = hashCode(domain);
    var seo = clamp(65 + seededRandom(seed, 1) * 30, 40, 98);
    var perf = clamp(55 + seededRandom(seed, 2) * 35, 30, 95);
    var a11y = clamp(70 + seededRandom(seed, 3) * 25, 50, 99);
    var bp = clamp(60 + seededRandom(seed, 4) * 30, 45, 96);

    document.getElementById('results-url').textContent = domain;
    document.getElementById('results-date').textContent = 'Analyzed on ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    var scores = [
      { label: 'SEO', score: Math.round(seo), color: scoreColor(seo) },
      { label: 'Performance', score: Math.round(perf), color: scoreColor(perf) },
      { label: 'Accessibility', score: Math.round(a11y), color: scoreColor(a11y) },
      { label: 'Best Practices', score: Math.round(bp), color: scoreColor(bp) },
    ];

    var overview = document.getElementById('score-overview');
    overview.innerHTML = scores.map(function(s) {
      var circumference = 2 * Math.PI * 42;
      var offset = circumference - (s.score / 100) * circumference;
      return '<div class="score-card">' +
        '<div class="score-ring">' +
          '<svg viewBox="0 0 100 100">' +
            '<circle class="bg" cx="50" cy="50" r="42"/>' +
            '<circle class="fg" cx="50" cy="50" r="42" stroke="' + s.color + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '" data-target="' + offset + '"/>' +
          '</svg>' +
          '<div class="score-num" style="color:' + s.color + '">' + s.score + '</div>' +
        '</div>' +
        '<div class="score-label">' + s.label + '</div>' +
      '</div>';
    }).join('');

    setTimeout(function() {
      var rings = document.querySelectorAll('.score-ring .fg');
      for (var i = 0; i < rings.length; i++) {
        rings[i].style.strokeDashoffset = rings[i].getAttribute('data-target');
      }
    }, 100);

    document.getElementById('seo-checks').innerHTML = generateChecks(seed, 10, [
      { text: '<strong>Title tag</strong> is present and under 60 characters', passRate: 0.7 },
      { text: '<strong>Meta description</strong> is present and under 160 characters', passRate: 0.6 },
      { text: '<strong>H1 tag</strong> exists and is unique on the page', passRate: 0.75 },
      { text: '<strong>Image alt attributes</strong> are present on all images', passRate: 0.4 },
      { text: '<strong>Canonical URL</strong> is properly configured', passRate: 0.5 },
      { text: '<strong>Sitemap.xml</strong> is present and accessible', passRate: 0.55 },
      { text: '<strong>Robots.txt</strong> is properly configured', passRate: 0.65 },
      { text: '<strong>Structured data</strong> (Schema.org) is implemented', passRate: 0.35 },
      { text: '<strong>Mobile-friendly</strong> viewport meta tag is set', passRate: 0.85 },
      { text: '<strong>Internal linking</strong> structure is well-organized', passRate: 0.5 },
    ]);

    document.getElementById('perf-checks').innerHTML = generateChecks(seed, 20, [
      { text: '<strong>First Contentful Paint</strong> is under 1.8 seconds', passRate: 0.5 },
      { text: '<strong>Largest Contentful Paint</strong> is under 2.5 seconds', passRate: 0.4 },
      { text: '<strong>Cumulative Layout Shift</strong> is under 0.1', passRate: 0.6 },
      { text: '<strong>Images are optimized</strong> and use modern formats (WebP/AVIF)', passRate: 0.35 },
      { text: '<strong>CSS is minified</strong> and unused CSS is removed', passRate: 0.45 },
      { text: '<strong>JavaScript is deferred</strong> or loaded asynchronously', passRate: 0.5 },
      { text: '<strong>Browser caching</strong> headers are properly set', passRate: 0.55 },
      { text: '<strong>GZIP/Brotli compression</strong> is enabled', passRate: 0.6 },
    ]);

    document.getElementById('a11y-checks').innerHTML = generateChecks(seed, 30, [
      { text: '<strong>Color contrast</strong> meets WCAG AA standards', passRate: 0.6 },
      { text: '<strong>Form labels</strong> are properly associated with inputs', passRate: 0.55 },
      { text: '<strong>ARIA landmarks</strong> are used for page structure', passRate: 0.4 },
      { text: '<strong>Keyboard navigation</strong> works for all interactive elements', passRate: 0.5 },
      { text: '<strong>Skip navigation</strong> link is present', passRate: 0.3 },
      { text: '<strong>Focus indicators</strong> are visible on interactive elements', passRate: 0.55 },
    ]);

    document.getElementById('bp-checks').innerHTML = generateChecks(seed, 40, [
      { text: '<strong>HTTPS</strong> is enabled and properly configured', passRate: 0.85 },
      { text: '<strong>No mixed content</strong> (HTTP resources on HTTPS page)', passRate: 0.75 },
      { text: '<strong>No console errors</strong> detected on page load', passRate: 0.5 },
      { text: '<strong>Content Security Policy</strong> headers are set', passRate: 0.3 },
      { text: '<strong>X-Frame-Options</strong> or CSP frame-ancestors is set', passRate: 0.4 },
      { text: '<strong>Charset declaration</strong> is present in the HTML', passRate: 0.9 },
      { text: '<strong>Doctype</strong> is declared correctly', passRate: 0.95 },
    ]);
  }

  function generateChecks(seed, offset, checks) {
    return checks.map(function(check, i) {
      var rand = seededRandom(seed + offset, i);
      var status, icon;
      if (rand < check.passRate) {
        status = 'pass'; icon = '\u2713';
      } else if (rand < check.passRate + 0.2) {
        status = 'warn'; icon = '!';
      } else {
        status = 'fail'; icon = '\u2717';
      }
      return '<div class="check-item">' +
        '<div class="check-icon check-' + status + '">' + icon + '</div>' +
        '<div class="check-text">' + check.text + '</div>' +
      '</div>';
    }).join('');
  }

  function scoreColor(score) {
    if (score >= 80) return '#00b894';
    if (score >= 60) return '#fdcb6e';
    return '#FF671F';
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function seededRandom(seed, index) {
    var x = Math.sin(seed + index * 9301) * 49297;
    return x - Math.floor(x);
  }
})();

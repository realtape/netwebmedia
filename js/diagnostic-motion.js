/* ──────────────────────────────────────────────────────────────
   Diagnostic Motion — shared behavior across *-digital-gaps.html
   NetWebMedia 2026-04-24
   - Count-up animation for mega-stat numbers (diagnostic "computation" feel)
   - IntersectionObserver scroll-reveal for gap-card, market-card, loss-line
   - Injects scan-grid + scan-line into .report-header
   - Respects prefers-reduced-motion
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Inject radar scan grid + sweeping scan line into report header. */
  function injectHeaderMotion() {
    var header = document.querySelector('.report-header');
    if (!header) return;
    if (!header.querySelector('.scan-grid')) {
      var grid = document.createElement('div');
      grid.className = 'scan-grid';
      header.appendChild(grid);
    }
    if (!reduced && !header.querySelector('.scan-line')) {
      var line = document.createElement('div');
      line.className = 'scan-line';
      header.appendChild(line);
    }
  }

  /* Parse a mega-stat number string into {prefix, value, suffix} so we can
     count the numeric portion while preserving "$", "%", "M", "K" decorations. */
  function parseNumber(txt) {
    var m = txt.match(/^([^\d\-]*?)(-?[\d,\.]+)(.*?)$/);
    if (!m) return null;
    var raw = m[2].replace(/,/g, '');
    var val = parseFloat(raw);
    if (isNaN(val)) return null;
    var decimals = (raw.split('.')[1] || '').length;
    return { prefix: m[1], value: val, suffix: m[3], decimals: decimals, hasComma: m[2].indexOf(',') !== -1 };
  }

  function formatNumber(n, decimals, hasComma) {
    var fixed = n.toFixed(decimals);
    if (hasComma) {
      var parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return fixed;
  }

  /* Count up mega-stat numbers on first reveal. Keeps final text identical
     to original so SEO/accessibility snapshots are unchanged. */
  function countUp(el) {
    var original = el.textContent.trim();
    var parsed = parseNumber(original);
    if (!parsed) return;
    el.setAttribute('data-countup', '1');
    if (reduced) return;

    var duration = 1100;
    var start = null;
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); }; /* cubic-out */

    el.textContent = parsed.prefix + formatNumber(0, parsed.decimals, parsed.hasComma) + parsed.suffix;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var current = parsed.value * ease(p);
      el.textContent = parsed.prefix + formatNumber(current, parsed.decimals, parsed.hasComma) + parsed.suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = original; /* snap to exact final */
    }
    requestAnimationFrame(step);
  }

  /* Reveal .gap-card / .market-card / .loss-line as they enter viewport.
     Single observer keeps cost trivial even at 50+ items. */
  function setupScrollReveal() {
    var targets = document.querySelectorAll('.gap-card, .market-card, .loss-line');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('nwm-in-view'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('nwm-in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* Run count-up on mega-stats when each enters viewport (usually on load). */
  function setupCountUp() {
    var nums = document.querySelectorAll('.mega-stat .num');
    if (!nums.length) return;

    if (!('IntersectionObserver' in window)) {
      nums.forEach(countUp);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          countUp(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* Inject a LIVE "scanning" badge next to the first h1 in the report header
     — makes the motion purposeful (it's a live diagnostic, not decoration). */
  function injectLiveBadge() {
    var header = document.querySelector('.report-header');
    if (!header) return;
    if (header.querySelector('.nwm-diag-badge')) return;
    var meta = header.querySelector('.meta');
    if (!meta) return;
    var badge = document.createElement('span');
    badge.className = 'nwm-diag-badge';
    badge.textContent = 'Live diagnostic';
    meta.insertBefore(badge, meta.firstChild);
  }

  function init() {
    injectHeaderMotion();
    injectLiveBadge();
    setupCountUp();
    setupScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

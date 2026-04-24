/* ──────────────────────────────────────────────────────────────
   Diagnostic Infograms — auto-generated animated infographics
   NetWebMedia 2026-04-24
   Works off existing markup (.gap-right .loss-line, .mega-stat)
   - Animated loss bars behind each .loss-line (width ∝ % of total)
   - Animated ring chart around each .mega-stat .num ending in "%"
   - Animated bar-race stack on .mega-stats section (city comparison)
   Respects prefers-reduced-motion.
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Parse a $-amount string like "-$25,000" → 25000. Returns NaN on fail. */
  function parseAmount(txt) {
    var m = txt.replace(/[,\s]/g, '').match(/(-?[\d.]+)/);
    return m ? Math.abs(parseFloat(m[1])) : NaN;
  }

  /* ── Infogram 1: Animated loss bars ──────────────────────────
     For each .gap-right block, compute each .loss-line amount as % of total
     and animate a horizontal bar behind it. Reveals on scroll. */
  function enhanceLossLines() {
    var rights = document.querySelectorAll('.gap-right');
    rights.forEach(function (right) {
      var lines = right.querySelectorAll('.loss-line');
      if (!lines.length) return;
      var amounts = [];
      var maxAmt = 0;
      lines.forEach(function (line) {
        var amtEl = line.querySelector('.amount');
        if (!amtEl) { amounts.push(0); return; }
        var v = parseAmount(amtEl.textContent);
        amounts.push(isNaN(v) ? 0 : v);
        if (v > maxAmt) maxAmt = v;
      });
      if (maxAmt === 0) return;

      lines.forEach(function (line, i) {
        if (line.querySelector('.nwm-loss-bar')) return;
        var pct = Math.max(6, Math.round((amounts[i] / maxAmt) * 100));
        var bar = document.createElement('div');
        bar.className = 'nwm-loss-bar';
        bar.style.cssText =
          'position:absolute;left:0;top:0;bottom:0;width:0%;' +
          'background:linear-gradient(90deg,rgba(248,81,73,0.22),rgba(248,81,73,0.06));' +
          'border-radius:4px;transition:width 1.1s cubic-bezier(0.2,0.8,0.2,1);' +
          'pointer-events:none;z-index:0;';
        bar.setAttribute('data-target-pct', pct);
        /* loss-line is flex already; need position:relative + z-index on children */
        var cs = window.getComputedStyle(line);
        if (cs.position === 'static') line.style.position = 'relative';
        line.style.overflow = 'hidden';
        /* make children float above bar */
        Array.prototype.forEach.call(line.children, function (c) {
          if (c !== bar) c.style.position = 'relative';
        });
        line.insertBefore(bar, line.firstChild);
      });
    });
  }

  /* Animate each loss bar to its target width when scrolled into view. */
  function animateLossBars() {
    var bars = document.querySelectorAll('.nwm-loss-bar');
    if (!bars.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      bars.forEach(function (b) { b.style.width = b.getAttribute('data-target-pct') + '%'; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var bar = e.target;
        setTimeout(function () {
          bar.style.width = bar.getAttribute('data-target-pct') + '%';
        }, 120);
        io.unobserve(bar);
      });
    }, { threshold: 0.3 });
    bars.forEach(function (b) { io.observe(b); });
  }

  /* ── Infogram 2: Mega-stat progress rings ─────────────────────
     For any .mega-stat .num that ends in "%", wrap a circular SVG ring that
     animates from 0 → value. Non-% mega-stats get a horizontal under-bar. */
  function enhanceMegaStats() {
    var stats = document.querySelectorAll('.mega-stat');
    if (!stats.length) return;

    /* Compute max amount across $-denominated stats for relative bars. */
    var maxDollar = 0;
    stats.forEach(function (s) {
      var num = s.querySelector('.num');
      if (!num) return;
      var t = num.textContent.trim();
      if (t.indexOf('$') === 0) {
        var v = parseAmount(t);
        var mult = /[Mm]$/.test(t) ? 1e6 : /[Kk]$/.test(t) ? 1e3 : 1;
        v = v * mult;
        if (!isNaN(v) && v > maxDollar) maxDollar = v;
      }
    });

    stats.forEach(function (stat) {
      if (stat.querySelector('.nwm-stat-track')) return;
      var num = stat.querySelector('.num');
      if (!num) return;
      var txt = num.textContent.trim();
      var track = document.createElement('div');
      track.className = 'nwm-stat-track';
      track.style.cssText =
        'position:relative;height:3px;margin-top:16px;border-radius:2px;' +
        'background:rgba(255,255,255,0.05);overflow:hidden;';
      var fill = document.createElement('div');
      fill.className = 'nwm-stat-fill';
      fill.style.cssText =
        'position:absolute;left:0;top:0;bottom:0;width:0%;' +
        'transition:width 1.4s cubic-bezier(0.2,0.8,0.2,1);border-radius:2px;';
      var pctMatch = txt.match(/(-?[\d.]+)\s*%/);
      var targetPct;
      if (pctMatch) {
        targetPct = Math.min(100, Math.abs(parseFloat(pctMatch[1])));
        fill.style.background = 'linear-gradient(90deg,#ff6b00,#f85149)';
      } else if (txt.indexOf('$') === 0 && maxDollar > 0) {
        var v = parseAmount(txt);
        var mult = /[Mm]$/.test(txt) ? 1e6 : /[Kk]$/.test(txt) ? 1e3 : 1;
        v = v * mult;
        targetPct = Math.max(4, Math.round((v / maxDollar) * 100));
        fill.style.background = 'linear-gradient(90deg,#f85149,#bc8cff)';
      } else {
        targetPct = 60; /* fallback */
        fill.style.background = 'linear-gradient(90deg,#58a6ff,#3fb950)';
      }
      fill.setAttribute('data-target-pct', targetPct);
      track.appendChild(fill);
      stat.appendChild(track);
    });
  }

  function animateStatFills() {
    var fills = document.querySelectorAll('.nwm-stat-fill');
    if (!fills.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      fills.forEach(function (f) { f.style.width = f.getAttribute('data-target-pct') + '%'; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var f = e.target;
        setTimeout(function () {
          f.style.width = f.getAttribute('data-target-pct') + '%';
        }, 180);
        io.unobserve(f);
      });
    }, { threshold: 0.4 });
    fills.forEach(function (f) { io.observe(f); });
  }

  /* ── Infogram 3: Section-level "severity footprint" ring ─────
     One compact SVG placed after the first section-sub element, showing the
     distribution of CRITICAL / HIGH / MEDIUM severity badges across the page
     as an animated donut. Makes the "this is bad" story visible at a glance. */
  function renderSeverityFootprint() {
    var slot = document.querySelector('.section .section-sub');
    if (!slot) return;
    if (document.querySelector('.nwm-sev-donut')) return;

    var counts = {
      critical: document.querySelectorAll('.severity-critical').length,
      high:     document.querySelectorAll('.severity-high').length,
      medium:   document.querySelectorAll('.severity-medium').length
    };
    var total = counts.critical + counts.high + counts.medium;
    if (total === 0) return;

    var colors = { critical: '#f85149', high: '#d29922', medium: '#58a6ff' };
    var labels = { critical: 'Critical', high: 'High', medium: 'Medium' };
    var circ = 2 * Math.PI * 42; /* r=42 */

    var wrap = document.createElement('div');
    wrap.className = 'nwm-sev-donut';
    wrap.style.cssText =
      'display:flex;align-items:center;gap:28px;padding:22px 24px;margin:16px 0 0;' +
      'background:rgba(255,255,255,0.02);border:1px solid rgba(255,107,0,0.18);border-radius:14px;' +
      'flex-wrap:wrap;';

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '110');
    svg.setAttribute('height', '110');
    svg.setAttribute('viewBox', '0 0 110 110');
    svg.style.flex = '0 0 auto';

    /* background track */
    var track = document.createElementNS(svgNS, 'circle');
    track.setAttribute('cx', '55'); track.setAttribute('cy', '55'); track.setAttribute('r', '42');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    track.setAttribute('stroke-width', '10');
    svg.appendChild(track);

    /* animated arcs — draw in order critical → high → medium */
    var offset = 0;
    var order = ['critical', 'high', 'medium'];
    order.forEach(function (k) {
      var frac = counts[k] / total;
      if (frac <= 0) return;
      var arc = document.createElementNS(svgNS, 'circle');
      arc.setAttribute('cx', '55'); arc.setAttribute('cy', '55'); arc.setAttribute('r', '42');
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', colors[k]);
      arc.setAttribute('stroke-width', '10');
      arc.setAttribute('stroke-linecap', 'butt');
      arc.setAttribute('stroke-dasharray', '0 ' + circ);
      arc.setAttribute('transform', 'rotate(' + (-90 + offset * 360) + ' 55 55)');
      arc.style.transition = 'stroke-dasharray 1.3s cubic-bezier(0.2,0.8,0.2,1)';
      arc.setAttribute('data-target-dash', (frac * circ) + ' ' + circ);
      svg.appendChild(arc);
      offset += frac;
    });

    /* center label */
    var centerLabel = document.createElementNS(svgNS, 'text');
    centerLabel.setAttribute('x', '55'); centerLabel.setAttribute('y', '52');
    centerLabel.setAttribute('text-anchor', 'middle');
    centerLabel.setAttribute('fill', '#e6edf3');
    centerLabel.setAttribute('font-size', '20');
    centerLabel.setAttribute('font-weight', '800');
    centerLabel.textContent = total;
    svg.appendChild(centerLabel);

    var centerSub = document.createElementNS(svgNS, 'text');
    centerSub.setAttribute('x', '55'); centerSub.setAttribute('y', '68');
    centerSub.setAttribute('text-anchor', 'middle');
    centerSub.setAttribute('fill', '#8b949e');
    centerSub.setAttribute('font-size', '9');
    centerSub.setAttribute('font-weight', '600');
    centerSub.setAttribute('letter-spacing', '1');
    centerSub.textContent = 'GAPS';
    svg.appendChild(centerSub);

    wrap.appendChild(svg);

    /* legend */
    var legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;color:#8b949e;font-size:0.88rem;';
    order.forEach(function (k) {
      if (counts[k] === 0) return;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';
      row.innerHTML =
        '<span style="width:10px;height:10px;border-radius:50%;background:' + colors[k] + ';box-shadow:0 0 8px ' + colors[k] + '66;"></span>' +
        '<span style="color:#e6edf3;font-weight:700;">' + counts[k] + '</span>' +
        '<span>' + labels[k] + '</span>';
      legend.appendChild(row);
    });
    var heading = document.createElement('div');
    heading.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    heading.innerHTML =
      '<span style="color:#e6edf3;font-weight:700;font-size:1rem;">Severity footprint</span>' +
      '<span style="color:#8b949e;font-size:0.85rem;max-width:360px;">' +
      'Distribution of critical vs. high vs. medium severity gaps detected across this diagnostic.' +
      '</span>';
    var right = document.createElement('div');
    right.style.cssText = 'flex:1;min-width:200px;display:flex;flex-direction:column;gap:10px;';
    right.appendChild(heading);
    right.appendChild(legend);
    wrap.appendChild(right);

    slot.parentNode.insertBefore(wrap, slot.nextSibling);

    /* animate arcs on reveal */
    var arcs = svg.querySelectorAll('circle[data-target-dash]');
    function fire() {
      arcs.forEach(function (a, i) {
        setTimeout(function () {
          a.setAttribute('stroke-dasharray', a.getAttribute('data-target-dash'));
        }, 200 + i * 180);
      });
    }
    if (reduced || !('IntersectionObserver' in window)) { fire(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { fire(); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    io.observe(wrap);
  }

  function init() {
    enhanceLossLines();
    animateLossBars();
    enhanceMegaStats();
    animateStatFills();
    renderSeverityFootprint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

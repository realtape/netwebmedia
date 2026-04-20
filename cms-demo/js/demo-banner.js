/* NWM CRM Demo Banner — loaded first on every demo page.
   Renders a sticky top banner, badges the browser tab, and prevents real email sends. */
(function () {
  'use strict';

  // Tag window so handlers / api-client can detect demo mode
  try { window.NWM_IS_DEMO = true; } catch (_) {}

  function inject() {
    if (document.getElementById('nwm-demo-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'nwm-demo-banner';
    bar.innerHTML =
      '<span class="nwm-demo-dot"></span>' +
      '<strong>Demo environment</strong>' +
      '<span class="nwm-demo-sep">—</span>' +
      '<span>Sample data only. Resets nightly. Emails &amp; SMS are <em>not</em> sent.</span>' +
      '<a href="https://netwebmedia.com/nwm-crm.html" class="nwm-demo-cta">Start my real CRM →</a>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('nwm-demo-active');
  }

  function style() {
    if (document.getElementById('nwm-demo-style')) return;
    var css = ''
      + '#nwm-demo-banner{position:sticky;top:0;z-index:9999;background:linear-gradient(90deg,#ff6b00,#ffb347);color:#111;padding:8px 16px;font:600 13px/1.3 system-ui,sans-serif;display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}'
      + '#nwm-demo-banner em{font-style:normal;text-decoration:underline}'
      + '#nwm-demo-banner .nwm-demo-dot{width:8px;height:8px;border-radius:50%;background:#111;animation:nwmPulse 1.8s infinite}'
      + '#nwm-demo-banner .nwm-demo-sep{opacity:.6}'
      + '#nwm-demo-banner .nwm-demo-cta{margin-left:auto;background:#111;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-weight:700;white-space:nowrap}'
      + '#nwm-demo-banner .nwm-demo-cta:hover{background:#333}'
      + '@keyframes nwmPulse{0%,100%{opacity:1}50%{opacity:.3}}'
      + 'body.nwm-demo-active .sidebar,body.nwm-demo-active aside{top:36px}';
    var tag = document.createElement('style');
    tag.id = 'nwm-demo-style';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function badgeTitle() {
    if (!/^\[DEMO\]/.test(document.title)) document.title = '[DEMO] ' + document.title;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { style(); inject(); badgeTitle(); });
  } else {
    style(); inject(); badgeTitle();
  }
})();

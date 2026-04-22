/* NetWebMedia — Mobile-to-App floating CTA
 * Shows a small bottom-right pill on mobile viewports only.
 * - Hidden on desktop (>= 900px wide)
 * - Hidden when already on /app.html
 * - Dismissable for 30 days via localStorage
 * - Fires GA4 + Meta Pixel events
 */
(function () {
  'use strict';

  try {
    if (window.__nwmAppCtaLoaded) return;
    window.__nwmAppCtaLoaded = true;

    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('/app.html') === 0 || path === '/app' || path === '/app/') return;

    if (window.innerWidth >= 900) return;

    var DISMISS_KEY = 'nwm_app_cta_dismissed_at';
    var DISMISS_DAYS = 30;
    try {
      var ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      if (ts && (Date.now() - ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    } catch (e) {}

    var style = document.createElement('style');
    style.textContent =
      '.nwm-app-cta{position:fixed;bottom:14px;right:14px;z-index:9998;display:flex;align-items:center;gap:10px;' +
      'padding:12px 14px 12px 16px;border-radius:999px;background:#010F3B;color:#fff;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.28),0 2px 6px rgba(0,0,0,.18);' +
      'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;font-weight:600;' +
      'text-decoration:none;line-height:1;transform:translateY(120%);opacity:0;transition:transform .3s ease,opacity .3s ease}' +
      '.nwm-app-cta.show{transform:translateY(0);opacity:1}' +
      '.nwm-app-cta-icon{width:26px;height:26px;border-radius:6px;background:#FF671F;color:#fff;display:flex;' +
      'align-items:center;justify-content:center;font-size:14px}' +
      '.nwm-app-cta-txt small{display:block;font-size:10px;opacity:.75;font-weight:500;letter-spacing:.04em;text-transform:uppercase}' +
      '.nwm-app-cta-close{margin-left:6px;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.12);' +
      'border:0;color:#fff;font-size:14px;line-height:1;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}' +
      '.nwm-app-cta-close:hover{background:rgba(255,255,255,.22)}' +
      '@media (min-width:900px){.nwm-app-cta{display:none!important}}';
    document.head.appendChild(style);

    var a = document.createElement('a');
    a.className = 'nwm-app-cta';
    a.href = '/app.html';
    a.setAttribute('aria-label', 'Get the NetWebMedia mobile app');
    a.innerHTML =
      '<span class="nwm-app-cta-icon" aria-hidden="true">&#9733;</span>' +
      '<span class="nwm-app-cta-txt">Get the app<small>iOS &amp; Android</small></span>' +
      '<button type="button" class="nwm-app-cta-close" aria-label="Dismiss">&times;</button>';

    a.addEventListener('click', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('nwm-app-cta-close')) {
        e.preventDefault();
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (err) {}
        a.classList.remove('show');
        setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 300);
        if (window.gtag) gtag('event', 'app_cta_dismiss', { page: path });
        return;
      }
      if (window.gtag) gtag('event', 'app_cta_click', { page: path });
      if (window.fbq)  fbq('track', 'ViewContent', { content_name: 'app_cta', content_category: 'mobile_app' });
    });

    function mount() {
      document.body.appendChild(a);
      setTimeout(function () { a.classList.add('show'); }, 600);
      if (window.gtag) gtag('event', 'app_cta_impression', { page: path });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  } catch (e) {
    /* never break host page */
  }
})();

/* NWM Cookie Consent — GDPR / CCPA / CPRA compliant
 * Delays GA4 and Meta Pixel until explicit user consent.
 * Preference stored in localStorage as 'nwm_cookie_consent': 'all' | 'essential'
 */
(function () {
  var KEY = 'nwm_cookie_consent';
  var GA_ID = 'G-V71R6PD7C0';

  function loadGA() {
    if (window._nwm_ga) return;
    window._nwm_ga = 1;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function loadPixel() {
    if (!window.NWM_META_PIXEL_ID || window._nwm_px) return;
    window._nwm_px = 1;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', window.NWM_META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  function dismiss(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
    var b = document.getElementById('nwm-cb');
    if (b) {
      b.style.transform = 'translateY(110%)';
      setTimeout(function () { try { b.parentNode.removeChild(b); } catch (e) {} }, 400);
    }
  }

  function showBanner() {
    if (document.getElementById('nwm-cb')) return;
    var b = document.createElement('div');
    b.id = 'nwm-cb';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie and analytics consent');
    b.style.cssText = [
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;',
      'background:#0a1529;border-top:2px solid rgba(255,103,31,.45);',
      'padding:16px 20px;box-shadow:0 -6px 32px rgba(0,0,0,.55);',
      'transition:transform .35s ease;font-family:Inter,system-ui,sans-serif;'
    ].join('');
    b.innerHTML = [
      '<div style="max-width:980px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:14px;">',
        '<div style="flex:1;min-width:220px;font-size:13.5px;color:#cbd5e1;line-height:1.55;">',
          '<strong style="color:#fff;">We use cookies &amp; analytics.</strong> ',
          'Essential cookies keep the site working. Analytics cookies (Google Analytics, Meta Pixel) help us improve — ',
          'loaded only with your consent. ',
          'California residents: <a href="/privacy.html#ccpa" style="color:#FF671F;text-decoration:underline;">CCPA rights &amp; Do Not Sell/Share</a>. ',
          '<a href="/privacy.html" style="color:#93c5fd;text-decoration:none;">Privacy Policy</a>',
        '</div>',
        '<div style="display:flex;gap:10px;flex-shrink:0;">',
          '<button id="nwm-cb-ess" style="padding:9px 16px;border-radius:8px;border:1px solid rgba(255,255,255,.2);',
            'background:transparent;color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">',
            'Essential Only</button>',
          '<button id="nwm-cb-all" style="padding:9px 18px;border-radius:8px;border:0;',
            'background:#FF671F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">',
            'Accept All</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(b);
    document.getElementById('nwm-cb-all').onclick = function () {
      dismiss('all'); loadGA(); loadPixel();
    };
    document.getElementById('nwm-cb-ess').onclick = function () {
      dismiss('essential');
    };
  }

  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  if (stored === 'all') {
    loadGA();
    loadPixel();
  } else if (!stored) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }

  window.NWM = window.NWM || {};
  window.NWM.cookieConsent = {
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      showBanner();
    },
    get: function () {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
  };
})();

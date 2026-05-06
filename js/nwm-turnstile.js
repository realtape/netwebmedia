/**
 * NetWebMedia Turnstile loader.
 *
 * Renders Cloudflare Turnstile in any element with id="nwm-turnstile" and exposes
 * window.NWM_TURNSTILE.getToken() for form submit handlers to attach to payloads.
 *
 * Activation:
 *   - Page must contain <meta name="nwm-turnstile-sitekey" content="…"> (auto-injected
 *     at deploy time via config.local.php once TURNSTILE_SITE_KEY is set), OR
 *   - window.NWM_TURNSTILE_SITE_KEY set inline before this script.
 *
 * If neither is present, the loader is a no-op — forms continue working unprotected.
 * The server-side handler (turnstile.php) also no-ops in that state, so behavior
 * stays consistent end-to-end.
 */
(function () {
  'use strict';

  function getSiteKey() {
    if (window.NWM_TURNSTILE_SITE_KEY) return String(window.NWM_TURNSTILE_SITE_KEY);
    var meta = document.querySelector('meta[name="nwm-turnstile-sitekey"]');
    if (meta && meta.content) return meta.content.trim();
    var holder = document.getElementById('nwm-turnstile');
    if (holder && holder.dataset && holder.dataset.sitekey) return holder.dataset.sitekey.trim();
    return '';
  }

  function loadScriptOnce() {
    if (document.getElementById('cf-turnstile-script')) return;
    var s = document.createElement('script');
    s.id = 'cf-turnstile-script';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__nwmTurnstileReady&render=explicit';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  var widgetId = null;
  var lastToken = '';

  window.__nwmTurnstileReady = function () {
    var key = getSiteKey();
    var holder = document.getElementById('nwm-turnstile');
    if (!key || !holder || !window.turnstile) return;
    try {
      widgetId = window.turnstile.render(holder, {
        sitekey: key,
        size: 'flexible',
        theme: 'auto',
        callback: function (tok) { lastToken = tok || ''; },
        'expired-callback': function () { lastToken = ''; },
        'error-callback': function () { lastToken = ''; }
      });
    } catch (e) {
      console.warn('[NWM_TURNSTILE] render failed:', e);
    }
  };

  window.NWM_TURNSTILE = {
    getToken: function () { return lastToken; },
    reset: function () {
      if (widgetId !== null && window.turnstile) {
        try { window.turnstile.reset(widgetId); } catch (e) {}
        lastToken = '';
      }
    },
    isActive: function () { return Boolean(getSiteKey()); }
  };

  if (getSiteKey()) loadScriptOnce();
})();

/* ════════════════════════════════════════════════════════════════════════════
   NetWeb CRM — Per-tenant branding render path
   ────────────────────────────────────────────────────────────────────────────
   Loads the active organization on every CRM page boot and applies its
   white-label branding (logo, colors, display name) to the DOM.

   Boot sequence:
     1. Read cached branding from sessionStorage (5-minute TTL) if present.
        Apply it synchronously so the page paints with the right colors.
     2. Fire the API call in the background to refresh.
     3. On API success, re-apply and update the cache.

   Fail-safe: any error path leaves NWM defaults intact. We never throw.

   Public API on window.nwmBranding:
     org             — the cached/applied org object, or null
     refresh()       — force-reload from API (bypasses cache)
     apply(branding) — apply a branding object directly (used by org-settings)
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CACHE_KEY  = 'nwm_branding';
  var CACHE_TTL  = 5 * 60 * 1000; // 5 minutes
  var API_URL    = '/api/?r=organizations&sub=current';
  var DEFAULT_LOGO = '/assets/img/nwm-logo.svg'; // fallback NWM mark

  // ── tiny helpers ──────────────────────────────────────────────────────────
  function safe(fn) { try { return fn(); } catch (_) { return null; } }

  function readCache() {
    return safe(function () {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.t || !parsed.org) return null;
      if (Date.now() - parsed.t > CACHE_TTL) return null;
      return parsed.org;
    });
  }

  function writeCache(org) {
    safe(function () {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), org: org }));
    });
  }

  function clearCache() {
    safe(function () { sessionStorage.removeItem(CACHE_KEY); });
  }

  // ── Apply branding to the DOM ─────────────────────────────────────────────
  function apply(org) {
    if (!org || typeof org !== 'object') return;

    var root = document.documentElement;
    if (!root || !root.style) return;

    // 1. CSS custom properties
    if (org.branding_primary_color) {
      root.style.setProperty('--brand-primary', org.branding_primary_color);
    }
    if (org.branding_secondary_color) {
      root.style.setProperty('--brand-secondary', org.branding_secondary_color);
    }
    var logoUrl = org.branding_logo_url || '';
    if (logoUrl) {
      // CSS url() value — wrap in quotes and escape the inner string.
      var safeUrl = String(logoUrl).replace(/["\\]/g, '\\$&');
      root.style.setProperty('--brand-logo-url', 'url("' + safeUrl + '")');
    }

    // 2. Replace every <img data-nwm-logo> with the org's logo.
    safe(function () {
      var imgs = document.querySelectorAll('img[data-nwm-logo]');
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var src = logoUrl || img.getAttribute('data-nwm-logo-default') || DEFAULT_LOGO;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        if (org.display_name) img.setAttribute('alt', org.display_name + ' logo');
      }
    });

    // 3. Brand icon swap — sidebar-brand uses a CSS letter "N" by default.
    //    If the org has a logo, switch the brand-icon to background-image mode.
    safe(function () {
      var icons = document.querySelectorAll('.brand-icon');
      for (var j = 0; j < icons.length; j++) {
        if (logoUrl) {
          icons[j].setAttribute('data-nwm-logo-icon', 'custom');
        } else {
          icons[j].removeAttribute('data-nwm-logo-icon');
        }
      }
      // Brand text label
      if (org.display_name) {
        var labels = document.querySelectorAll('.brand-text');
        for (var k = 0; k < labels.length; k++) {
          // Only overwrite when not in the master org (display_name === "NetWebMedia")
          // — the master org should keep its CRM-specific brand label "NetWeb CRM".
          if (!labels[k].hasAttribute('data-nwm-locked')) {
            labels[k].textContent = org.display_name;
          }
        }
      }
    });

    // 4. document.title
    safe(function () {
      var name = org.display_name || 'NetWebMedia';
      // Preserve the per-page prefix (e.g. "Dashboard - ") — replace only the
      // suffix after the last " - ".
      var current = document.title || '';
      var idx = current.lastIndexOf(' - ');
      if (idx > 0) {
        document.title = current.slice(0, idx) + ' - ' + name + ' CRM';
      } else {
        document.title = name + ' CRM';
      }
    });

    // 5. (Skipped: per-tenant favicon — column not in schema yet. Flagged in branding.md.)

    window.nwmBranding.org = org;

    // Notify listeners (org switcher, settings form, etc.)
    safe(function () {
      document.dispatchEvent(new CustomEvent('nwm:branding-applied', { detail: org }));
    });
  }

  // ── Fetch from API ────────────────────────────────────────────────────────
  function fetchOrg() {
    return fetch(API_URL, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('branding API ' + r.status);
      return r.json();
    });
  }

  function refresh() {
    clearCache();
    return fetchOrg().then(function (org) {
      writeCache(org);
      apply(org);
      return org;
    }).catch(function (err) {
      // Silent — never break the page on a branding-fetch failure.
      if (window.console && console.warn) console.warn('[branding] refresh failed:', err);
      return null;
    });
  }

  // ── Boot sequence ─────────────────────────────────────────────────────────
  // 1. Apply cached branding immediately (synchronous, paints fast).
  var cached = readCache();

  // Expose API before async work so other scripts can call into us.
  window.nwmBranding = {
    org: cached || null,
    apply: function (org) { apply(org); writeCache(org); },
    refresh: refresh,
    _clearCache: clearCache
  };

  if (cached) apply(cached);

  // 2. Optional SSR hint: <meta name="nwm-org-slug" content="acme">
  //    If present, we still hit the API but the slug acts as a routing hint
  //    for future per-subdomain SSR. Currently informational only.
  safe(function () {
    var meta = document.querySelector('meta[name="nwm-org-slug"]');
    if (meta && meta.content) window.nwmBranding._slugHint = meta.content;
  });

  // 3. Fire the live fetch in the background.
  function start() {
    fetchOrg().then(function (org) {
      writeCache(org);
      apply(org);
    }).catch(function (err) {
      if (window.console && console.warn) console.warn('[branding] boot fetch failed:', err);
      // Leave cached/default branding in place. Never break.
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

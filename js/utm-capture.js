/**
 * utm-capture.js
 * Reads UTM parameters from the current page URL and populates
 * hidden form fields so submit.php can log full attribution.
 *
 * Supports: utm_source, utm_campaign, utm_content (= campaign token)
 * Falls back to sessionStorage so UTMs survive same-session navigation.
 *
 * Deployed to: https://netwebmedia.com/js/utm-capture.js
 */
(function () {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_campaign', 'utm_content'];
  var SS_PREFIX = 'nwm_';

  // Parse current URL params
  var params = new URLSearchParams(window.location.search);

  // Store any UTMs present on landing to sessionStorage (survive soft nav)
  UTM_KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) {
      try { sessionStorage.setItem(SS_PREFIX + k, v); } catch (e) {}
    }
  });

  // Read final values: URL param → sessionStorage → ''
  function getUtm(k) {
    var v = params.get(k);
    if (!v) {
      try { v = sessionStorage.getItem(SS_PREFIX + k); } catch (e) {}
    }
    return v || '';
  }

  // Populate all matching hidden inputs on the page
  function populate() {
    UTM_KEYS.forEach(function (k) {
      var val = getUtm(k);
      if (!val) return;
      var inputs = document.querySelectorAll('input[name="' + k + '"]');
      inputs.forEach(function (el) {
        el.value = val;
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populate);
  } else {
    populate();
  }
})();

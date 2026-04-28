/* form-tracking.js — fires GA4 + Meta Pixel events for legacy industry LP forms
   that POST directly to /submit.php or /audit-submit.php (no JS handler).

   We attach a single submit listener per form, fire-and-forget tracking, then
   let the form's native submit continue. Guarded so missing GA4/Pixel never
   blocks the form from submitting. */
(function () {
  'use strict';

  function getSource(form) {
    var sourceInput = form.querySelector('[name=source]');
    if (sourceInput && sourceInput.value) return sourceInput.value;
    return 'unknown';
  }

  function fireTracking(form) {
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lp_form_submit', { source: getSource(form) });
      }
    } catch (e) {}
    try {
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead');
      }
    } catch (e) {}
  }

  function wire() {
    var selector = 'form[action*="submit.php"], form[action*="audit-submit.php"]';
    var forms = document.querySelectorAll(selector);
    forms.forEach(function (form) {
      if (form.__nwmTrackWired) return;
      form.__nwmTrackWired = true;
      // Capture phase + fire-and-forget so the native submit still happens.
      form.addEventListener('submit', function () {
        fireTracking(form);
        // Return true / no preventDefault — let the form continue to /submit.php.
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

/* form-tracking.js — fires GA4 + Meta Pixel events for site forms.

   Two form classes are tracked:
   1. Legacy industry LPs: forms posting natively to /submit.php or
      /audit-submit.php — fire `Lead` (Pixel) + `lp_form_submit` (GA4).
   2. Newsletter capture: any form whose id contains "newsletter" or
      "subscribe" (e.g. #blog-top-newsletter on /blog.html) — fire
      `Subscribe` (Pixel) + `newsletter_subscribe` (GA4). These forms
      typically call preventDefault() and submit via fetch, but the
      'submit' event still fires and bubbles before the JS handler runs,
      so this listener captures them cleanly.

   Both paths are fire-and-forget and guarded so missing GA4/Pixel
   never blocks form submission. */
(function () {
  'use strict';

  function getSource(form) {
    var sourceInput = form.querySelector('[name=source]');
    if (sourceInput && sourceInput.value) return sourceInput.value;
    // Fall back to form id (e.g. "blog-top-newsletter" → "blog-top")
    if (form.id) return form.id.replace(/-?(newsletter|subscribe).*$/, '') || form.id;
    return 'unknown';
  }

  function isNewsletterForm(form) {
    if (!form.id) return false;
    var id = form.id.toLowerCase();
    return id.indexOf('newsletter') !== -1 || id.indexOf('subscribe') !== -1;
  }

  function fireLeadTracking(form) {
    var source = getSource(form);
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lp_form_submit', { source: source });
      }
    } catch (e) {}
    try {
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', { source: source });
      }
    } catch (e) {}
  }

  function fireNewsletterTracking(form) {
    var source = getSource(form);
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_subscribe', { source: source });
      }
    } catch (e) {}
    try {
      if (typeof fbq !== 'undefined') {
        // Standard event — Meta Ads Manager recognizes 'Subscribe'.
        fbq('track', 'Subscribe', { source: source, content_name: 'AEO Brief weekly' });
        // Also fire a custom event so we can build precise audiences.
        fbq('trackCustom', 'NewsletterSubscribe', { source: source });
      }
    } catch (e) {}
  }

  function wire() {
    // Legacy LP forms — fire Lead.
    var lpForms = document.querySelectorAll('form[action*="submit.php"], form[action*="audit-submit.php"]');
    lpForms.forEach(function (form) {
      if (form.__nwmTrackWired) return;
      form.__nwmTrackWired = true;
      form.addEventListener('submit', function () { fireLeadTracking(form); }, true);
    });

    // Newsletter forms — fire Subscribe + NewsletterSubscribe.
    var newsletterForms = document.querySelectorAll('form[id*="newsletter"], form[id*="subscribe"]');
    newsletterForms.forEach(function (form) {
      if (form.__nwmTrackWired) return;
      if (!isNewsletterForm(form)) return;
      form.__nwmTrackWired = true;
      form.addEventListener('submit', function () { fireNewsletterTracking(form); }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

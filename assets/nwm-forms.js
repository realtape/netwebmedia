/* nwm-forms.js — universal form handler
   Drop this script on any page. Any <form> with data-nwm-form="<form-id>"
   auto-submits to /api/public/forms/submit and shows inline success/error.

   Options via data-* attributes:
     data-nwm-form="12"              (required) numeric form id or slug
     data-nwm-redirect="/thanks.html"  optional redirect on success
     data-nwm-success="Thanks!..."   optional inline success message
     data-nwm-silent="1"             fire-and-forget (no preventDefault)

   GA4 + Meta CAPI deduplication:
   - Each submit generates a single event_id (uuid).
   - That event_id is sent to (a) Meta Pixel client-side as eventID, AND
     (b) /api/public/track/lead which forwards it to Meta CAPI server-side.
   - Meta matches the two on event_id + same FBP/FBC and counts ONCE.
*/
(function () {
  'use strict';

  var API_BASE = (window.NWM_API_BASE) || '/api';

  function uuid() {
    // RFC4122 v4-ish — good enough for event dedup, no crypto required.
    if (window.crypto && crypto.randomUUID) { try { return crypto.randomUUID(); } catch (e) {} }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  // GA4 client_id lives in the _ga cookie as "GA1.1.<cid>". Strip the prefix.
  function gaClientId() {
    var ga = getCookie('_ga');
    if (!ga) return '';
    var parts = ga.split('.');
    return parts.length >= 4 ? parts.slice(-2).join('.') : '';
  }

  // Capture UTMs from the URL on first page load; persist for the session so
  // attribution survives navigation. We also read landing_page + referrer.
  function getAttribution() {
    var attr = {};
    try {
      var stored = sessionStorage.getItem('nwm_attr');
      if (stored) attr = JSON.parse(stored) || {};
    } catch (e) {}
    var params = new URLSearchParams(location.search);
    ['utm_source','utm_campaign','utm_medium','utm_content','utm_term','gclid','fbclid'].forEach(function (k) {
      var v = params.get(k);
      if (v && !attr[k]) attr[k] = v;
    });
    if (!attr.landing_page) attr.landing_page = location.pathname + location.search;
    if (!attr.referrer)     attr.referrer     = document.referrer || '';
    try { sessionStorage.setItem('nwm_attr', JSON.stringify(attr)); } catch (e) {}
    return attr;
  }

  function serialize(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (value, key) {
      if (data[key] !== undefined) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    // Inject attribution + tracking IDs so the CRM contact and CAPI event
    // both have the same context.
    var attr = getAttribution();
    Object.keys(attr).forEach(function (k) { if (!data[k]) data[k] = attr[k]; });
    data.ga_client_id = data.ga_client_id || gaClientId();
    data.fbp          = data.fbp          || getCookie('_fbp');
    data.fbc          = data.fbc          || getCookie('_fbc');
    return data;
  }

  function showMessage(form, text, kind) {
    var box = form.querySelector('.nwm-form-msg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'nwm-form-msg';
      box.style.marginTop = '12px';
      box.style.padding = '10px 14px';
      box.style.borderRadius = '8px';
      box.style.fontSize = '14px';
      form.appendChild(box);
    }
    box.textContent = text;
    box.style.background = kind === 'error' ? '#ffe5e5' : '#e8f7ef';
    box.style.color     = kind === 'error' ? '#a00'    : '#146c43';
    box.style.border    = '1px solid ' + (kind === 'error' ? '#f3b0b0' : '#a3dcb8');
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (btn) {
      btn.disabled = !!busy;
      if (busy) {
        btn.dataset._label = btn.textContent || btn.value;
        if (btn.tagName === 'BUTTON') btn.textContent = 'Sending…';
        else btn.value = 'Sending…';
      } else if (btn.dataset._label) {
        if (btn.tagName === 'BUTTON') btn.textContent = btn.dataset._label;
        else btn.value = btn.dataset._label;
      }
    }
  }

  // Fire-and-forget server-side CAPI ping. Always uses the same event_id as the
  // client-side Pixel Lead so Meta dedupes them. Failures are silent — the form
  // submission has already succeeded by the time this is called.
  function fireServerCAPI(eventId, formId, data) {
    try {
      fetch(API_BASE + '/public/track/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:   eventId,
          form_id:    formId,
          email:      data.email || '',
          phone:      data.phone || data.whatsapp || '',
          first_name: data.first_name || '',
          last_name:  data.last_name  || '',
          fbp:        data.fbp || '',
          fbc:        data.fbc || '',
          ga_client_id: data.ga_client_id || '',
          source_url: location.href
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  async function submitForm(form) {
    var formId = form.getAttribute('data-nwm-form');
    if (!formId) return;
    var data = serialize(form);

    // Honeypot: bots fill hidden fields; humans don't see them. If nwm_website
    // is non-empty we silently pretend success and skip the API call entirely.
    if (data.nwm_website) {
      showMessage(form,
        form.getAttribute('data-nwm-success') ||
        'Thanks! Your message has been received — we\'ll be in touch shortly.',
        'success');
      form.reset();
      return;
    }

    // One event_id per submission — shared between client Pixel and server CAPI.
    var eventId = uuid();
    data.event_id = eventId;

    setBusy(form, true);
    // Analytics: form_submit_attempt + Meta Pixel Lead. Pixel gets the eventID so
    // CAPI can dedupe the same event reported from both sides. Guarded.
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit_attempt', { form_id: formId, event_id: eventId });
      }
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', { content_name: formId }, { eventID: eventId });
      }
    } catch (e) { /* never block submission on analytics errors */ }

    try {
      var res = await fetch(API_BASE + '/public/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: /^\d+$/.test(formId) ? Number(formId) : formId, data: data })
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(body.error || ('HTTP ' + res.status));
      // CRM contact created. Now mirror the Lead event to Meta CAPI server-side.
      fireServerCAPI(eventId, formId, data);
      var successMsg = form.getAttribute('data-nwm-success') ||
        'Thanks! Your message has been received — we\'ll be in touch shortly.';
      showMessage(form, successMsg, 'success');
      try {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'generate_lead', { form_id: formId, event_id: eventId, value: 1, currency: 'USD' });
        }
      } catch (e) {}
      form.reset();
      var redirect = form.getAttribute('data-nwm-redirect');
      if (redirect) setTimeout(function () { window.location.href = redirect; }, 1200);
    } catch (err) {
      try {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'form_submit_error', { form_id: formId, error: String(err).slice(0, 100) });
        }
      } catch (e) {}
      showMessage(form, 'Sorry, something went wrong: ' + err.message, 'error');
    } finally {
      setBusy(form, false);
    }
  }

  function wire(form) {
    if (form.__nwmWired) return;
    form.__nwmWired = true;
    var silent = form.getAttribute('data-nwm-silent') === '1';
    if (silent) {
      // Fire-and-forget capture; let native submit / other handlers proceed
      form.addEventListener('submit', function () {
        try {
          var formId = form.getAttribute('data-nwm-form');
          var data = serialize(form);
          fetch(API_BASE + '/public/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ form_id: /^\d+$/.test(formId) ? Number(formId) : formId, data: data })
          }).catch(function () {});
        } catch (e) {}
      }, true); // capture phase so we run before other preventDefaults
    } else {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitForm(form);
      });
    }
  }

  function wireAll() {
    document.querySelectorAll('form[data-nwm-form]').forEach(wire);
  }

  // Expose as global helper
  window.NWMApi = window.NWMApi || {};
  window.NWMApi.submitForm = function (formIdOrEl, dataObj) {
    if (typeof formIdOrEl === 'number' || typeof formIdOrEl === 'string') {
      return fetch(API_BASE + '/public/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: Number(formIdOrEl), data: dataObj || {} })
      }).then(function (r) { return r.json(); });
    }
    return submitForm(formIdOrEl);
  };
  window.NWMApi.wireForms = wireAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})();

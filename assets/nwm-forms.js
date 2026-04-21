/* nwm-forms.js — universal form handler
   Drop this script on any page. Any <form> with data-nwm-form="<form-id>"
   auto-submits to /api/public/forms/submit and shows inline success/error.

   Options via data-* attributes:
     data-nwm-form="12"              (required) numeric form id
     data-nwm-redirect="/thanks.html"  optional redirect on success
     data-nwm-success="Thanks!..."   optional inline success message
*/
(function () {
  'use strict';

  var API_BASE = (window.NWM_API_BASE) || '/api';

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

  async function submitForm(form) {
    var formId = form.getAttribute('data-nwm-form');
    if (!formId) return;
    var data = serialize(form);
    setBusy(form, true);
    try {
      var res = await fetch(API_BASE + '/public/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: /^\d+$/.test(formId) ? Number(formId) : formId, data: data })
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(body.error || ('HTTP ' + res.status));
      var successMsg = form.getAttribute('data-nwm-success') ||
        'Thanks! Your message has been received — we\'ll be in touch shortly.';
      showMessage(form, successMsg, 'success');
      form.reset();
      var redirect = form.getAttribute('data-nwm-redirect');
      if (redirect) setTimeout(function () { window.location.href = redirect; }, 1200);
    } catch (err) {
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

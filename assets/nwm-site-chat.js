/* NetWebMedia site-wide floating WhatsApp button.
   Appears on every public page. No backend required.
   - Green WhatsApp FAB links to wa.me/<WA_NUMBER>
   Companion chatbot (bottom-left) lives in /js/nwm-chat.js.
*/
(function () {
  'use strict';

  // Skip if main.js already mounted its WhatsApp button
  if (window.__nwmWaLoaded) return;
  window.__nwmWaLoaded = true;

  // Skip on CRM, CMS app, login, and admin pages
  var path = location.pathname.toLowerCase();
  var SKIP = ['/crm/', '/cms/', '/app/', '/login', '/dashboard', '/admin', '/desktop-login'];
  for (var i = 0; i < SKIP.length; i++) {
    if (path.indexOf(SKIP[i]) === 0) return;
  }

  var WA_NUMBER = (window.NWM_WA_NUMBER && /^[0-9]{8,15}$/.test(window.NWM_WA_NUMBER))
    ? window.NWM_WA_NUMBER
    : '17407363884';

  function t(en, es) {
    try {
      var lang = (window.NWMi18n && window.NWMi18n.current && window.NWMi18n.current()) || 'en';
      return lang === 'es' ? es : en;
    } catch (_) { return en; }
  }

  var WA_PREFILL = encodeURIComponent(
    t('Hi NetWebMedia 👋 I\'d like to learn more about your AI marketing services.',
      'Hola NetWebMedia 👋 Me gustaría saber más de sus servicios de marketing con IA.')
  );

  var css =
    '.nwm-fab-wa-wrap{position:fixed;right:20px;bottom:20px;z-index:999990;font-family:Inter,system-ui,-apple-system,sans-serif}' +
    '.nwm-fab{width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .18s ease,box-shadow .18s ease;position:relative;text-decoration:none}' +
    '.nwm-fab:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.35)}' +
    '.nwm-fab-wa{background:#25D366}' +
    '.nwm-fab-tooltip{position:absolute;right:70px;top:50%;transform:translateY(-50%);background:#010F3B;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .18s;box-shadow:0 4px 12px rgba(0,0,0,.2)}' +
    '.nwm-fab:hover .nwm-fab-tooltip{opacity:1}' +
    '.nwm-fab-tooltip::after{content:"";position:absolute;right:-5px;top:50%;margin-top:-5px;border:5px solid transparent;border-left-color:#010F3B}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var waSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  var wrap = document.createElement('div');
  wrap.className = 'nwm-fab-wa-wrap';
  wrap.innerHTML =
    '<a href="https://wa.me/' + WA_NUMBER + '?text=' + WA_PREFILL + '" class="nwm-fab nwm-fab-wa" target="_blank" rel="noopener" aria-label="WhatsApp">' +
      waSvg +
      '<span class="nwm-fab-tooltip">' + t('Chat on WhatsApp', 'Chatea por WhatsApp') + '</span>' +
    '</a>';
  document.body.appendChild(wrap);

  try {
    window.addEventListener('nwm:lang', function () {
      var tip = wrap.querySelector('.nwm-fab-tooltip');
      if (tip) tip.textContent = t('Chat on WhatsApp', 'Chatea por WhatsApp');
    });
  } catch (_) {}
})();

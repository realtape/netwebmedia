/* NetWebMedia site-wide floating WhatsApp + Chat widget.
   Appears on every public page. No backend required.
   - Green WhatsApp FAB links to wa.me/<WA_NUMBER>
   - Orange Chat FAB opens a contact form → mailto: hello@netwebmedia.com
   - Uses NetWebMedia brand (Gulf orange #FF671F + green #25D366)
*/
(function () {
  'use strict';

  // Skip on CRM, CMS app, login, and admin pages (they have their own UI)
  var path = location.pathname.toLowerCase();
  var SKIP = ['/crm/', '/cms/', '/app/', '/login', '/dashboard', '/admin', '/desktop-login'];
  for (var i = 0; i < SKIP.length; i++) {
    if (path.indexOf(SKIP[i]) === 0) return;
  }

  // Config — window.NWM_WA_NUMBER lets us override per-page / via CMS.
  // When WA_NUMBER is the placeholder, the WhatsApp FAB is replaced by a mailto FAB.
  var WA_NUMBER = (window.NWM_WA_NUMBER && /^[0-9]{8,15}$/.test(window.NWM_WA_NUMBER))
    ? window.NWM_WA_NUMBER
    : '56999999999'; // placeholder sentinel
  var WA_IS_PLACEHOLDER = (WA_NUMBER === '56999999999');
  var EMAIL = 'hola@netwebmedia.com';

  // i18n helper (falls back to EN if NWMi18n not loaded)
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
    '.nwm-fab-stack{position:fixed;right:20px;bottom:20px;display:flex;flex-direction:column;gap:12px;z-index:999990;font-family:Inter,system-ui,-apple-system,sans-serif}' +
    '.nwm-fab{width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .18s ease, box-shadow .18s ease;position:relative}' +
    '.nwm-fab:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.35)}' +
    '.nwm-fab-wa{background:#25D366}' +
    '.nwm-fab-chat{background:linear-gradient(135deg,#FF671F,#FF8A00)}' +
    '.nwm-fab-tooltip{position:absolute;right:70px;top:50%;transform:translateY(-50%);background:#010F3B;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .18s;box-shadow:0 4px 12px rgba(0,0,0,.2)}' +
    '.nwm-fab:hover .nwm-fab-tooltip{opacity:1}' +
    '.nwm-fab-tooltip::after{content:"";position:absolute;right:-5px;top:50%;margin-top:-5px;border:5px solid transparent;border-left-color:#010F3B}' +
    '.nwm-chat-pulse::before{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #FF671F;animation:nwm-pulse 2s infinite;pointer-events:none}' +
    '@keyframes nwm-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.4);opacity:0}}' +
    '.nwm-chat-panel{position:fixed;right:20px;bottom:92px;width:340px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;display:none;flex-direction:column;z-index:999991;font-family:Inter,system-ui,-apple-system,sans-serif}' +
    '.nwm-chat-panel.open{display:flex;animation:nwm-slide-up .22s ease}' +
    '@keyframes nwm-slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '.nwm-chat-head{padding:18px 20px;background:linear-gradient(135deg,#010F3B,#012169);color:#fff}' +
    '.nwm-chat-head h4{margin:0;font-size:16px;font-weight:700}' +
    '.nwm-chat-head p{margin:4px 0 0;font-size:12px;opacity:.85}' +
    '.nwm-chat-close{position:absolute;top:14px;right:14px;background:transparent;border:0;color:#fff;font-size:20px;cursor:pointer;opacity:.8}' +
    '.nwm-chat-close:hover{opacity:1}' +
    '.nwm-chat-body{padding:18px 20px;background:#F7F8FC;flex:1;overflow-y:auto}' +
    '.nwm-chat-body .hint{font-size:13px;color:#4a5568;margin:0 0 12px;line-height:1.5}' +
    '.nwm-chat-body label{display:block;font-size:12px;font-weight:600;color:#2d3748;margin:10px 0 4px}' +
    '.nwm-chat-body input,.nwm-chat-body textarea{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none;transition:border-color .15s}' +
    '.nwm-chat-body input:focus,.nwm-chat-body textarea:focus{border-color:#FF671F}' +
    '.nwm-chat-body textarea{min-height:80px;resize:vertical}' +
    '.nwm-chat-submit{margin-top:14px;width:100%;padding:12px;background:linear-gradient(135deg,#FF671F,#FF8A00);color:#fff;border:0;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}' +
    '.nwm-chat-submit:hover{box-shadow:0 4px 12px rgba(255,103,31,.4)}' +
    '.nwm-chat-or{text-align:center;font-size:11px;color:#718096;margin:14px 0 10px;text-transform:uppercase;letter-spacing:.08em}' +
    '.nwm-chat-wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;background:#25D366;color:#fff;border:0;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none}' +
    '.nwm-chat-foot{padding:10px 20px;background:#fff;border-top:1px solid #e2e8f0;font-size:11px;color:#718096;text-align:center}' +
    '@media (max-width: 480px){.nwm-chat-panel{right:12px;bottom:88px;width:calc(100vw - 24px)}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Floating stack
  var stack = document.createElement('div');
  stack.className = 'nwm-fab-stack';
  // WhatsApp FAB — shown only when a real number is configured. Otherwise email FAB.
  var waSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  var topFab = WA_IS_PLACEHOLDER
    ? ('<a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent(t('Free AI audit request','Solicito auditoría IA gratis')) + '" class="nwm-fab nwm-fab-wa" style="background:#4A90D9" aria-label="Email">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
        '<span class="nwm-fab-tooltip">' + t('Email us', 'Escríbenos') + '</span>' +
      '</a>')
    : ('<a href="https://wa.me/' + WA_NUMBER + '?text=' + WA_PREFILL + '" class="nwm-fab nwm-fab-wa" target="_blank" rel="noopener" aria-label="WhatsApp">' +
        waSvg +
        '<span class="nwm-fab-tooltip">' + t('Chat on WhatsApp', 'Chatea por WhatsApp') + '</span>' +
      '</a>');
  stack.innerHTML = topFab +
    '<button type="button" class="nwm-fab nwm-fab-chat nwm-chat-pulse" id="nwm-chat-open" aria-label="' + t('Open chat', 'Abrir chat') + '">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span class="nwm-fab-tooltip">' + t('Request free audit', 'Auditoría gratis') + '</span>' +
    '</button>';
  document.body.appendChild(stack);

  // Chat panel
  var panel = document.createElement('div');
  panel.className = 'nwm-chat-panel';
  panel.innerHTML =
    '<div class="nwm-chat-head">' +
      '<h4>' + t('Get your free AI audit', 'Tu auditoría IA gratis') + '</h4>' +
      '<p>' + t('Written report in 48 hours — no calls, no Zoom.', 'Informe escrito en 48h — sin llamadas, sin Zoom.') + '</p>' +
      '<button class="nwm-chat-close" type="button" id="nwm-chat-close" aria-label="' + t('Close', 'Cerrar') + '">×</button>' +
    '</div>' +
    '<div class="nwm-chat-body">' +
      '<p class="hint">' + t('Tell us about your business. We\'ll reply via email or WhatsApp within a few hours.', 'Cuéntanos de tu negocio. Te respondemos por email o WhatsApp en pocas horas.') + '</p>' +
      '<form id="nwm-chat-form">' +
        '<label for="nwm-chat-name">' + t('Your name', 'Tu nombre') + '</label>' +
        '<input id="nwm-chat-name" name="name" required autocomplete="name">' +
        '<label for="nwm-chat-email">' + t('Email', 'Email') + '</label>' +
        '<input id="nwm-chat-email" name="email" type="email" required autocomplete="email">' +
        '<label for="nwm-chat-msg">' + t('What would you like to know?', '¿Qué te gustaría saber?') + '</label>' +
        '<textarea id="nwm-chat-msg" name="message" required></textarea>' +
        '<button type="submit" class="nwm-chat-submit">' + t('Send message →', 'Enviar mensaje →') + '</button>' +
      '</form>' +
      (WA_IS_PLACEHOLDER ? '' :
      '<div class="nwm-chat-or">' + t('or', 'o') + '</div>' +
      '<a href="https://wa.me/' + WA_NUMBER + '?text=' + WA_PREFILL + '" class="nwm-chat-wa-btn" target="_blank" rel="noopener">' +
        waSvg.replace(/width="26"/,'width="18"').replace(/height="26"/,'height="18"') +
        t('Chat on WhatsApp', 'Chatea por WhatsApp') +
      '</a>'
    ) +
    '</div>' +
    '<div class="nwm-chat-foot">' + t('We only reply async — no calls, no Zoom.', 'Solo async — sin llamadas, sin Zoom.') + '</div>';
  document.body.appendChild(panel);

  // Interactions
  var openBtn = document.getElementById('nwm-chat-open');
  var closeBtn = document.getElementById('nwm-chat-close');
  var form = document.getElementById('nwm-chat-form');

  openBtn.addEventListener('click', function () {
    panel.classList.add('open');
    openBtn.classList.remove('nwm-chat-pulse');
    try { document.getElementById('nwm-chat-name').focus(); } catch (_) {}
  });
  closeBtn.addEventListener('click', function () {
    panel.classList.remove('open');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('nwm-chat-name').value.trim();
    var email = document.getElementById('nwm-chat-email').value.trim();
    var msg = document.getElementById('nwm-chat-msg').value.trim();
    var subject = encodeURIComponent('Audit request — ' + name);
    var body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Page: ' + location.href + '\n\n' +
      'Message:\n' + msg
    );
    // POST to audit-submit.php if available, else fall back to mailto
    try {
      fetch('/audit-submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&message=' + encodeURIComponent(msg) + '&source=' + encodeURIComponent(location.href)
      }).then(function (r) {
        if (r.ok) {
          form.innerHTML = '<p style="text-align:center;padding:20px 0;color:#059669;font-weight:600">' + t('Message received! We\'ll reply within a few hours.', 'Mensaje recibido. Te respondemos en pocas horas.') + '</p>';
        } else {
          window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
        }
      }).catch(function () {
        window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
      });
    } catch (_) {
      window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
    }
  });

  // Re-render tooltips on language change
  try {
    window.addEventListener('nwm:lang', function () {
      var waTip = stack.querySelector('.nwm-fab-wa .nwm-fab-tooltip');
      var chatTip = stack.querySelector('.nwm-fab-chat .nwm-fab-tooltip');
      if (waTip) waTip.textContent = t('Chat on WhatsApp', 'Chatea por WhatsApp');
      if (chatTip) chatTip.textContent = t('Request free audit', 'Auditoría gratis');
    });
  } catch (_) {}
})();

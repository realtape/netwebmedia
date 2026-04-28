/* NetWebMedia — WhatsApp FAB + AI Chat Widget
   Mounts two elements on every public page:
     1. Green WhatsApp FAB (bottom-right) — direct wa.me link
     2. Blue Chat FAB (bottom-left)       — AI chat widget backed by /crm-vanilla/api/webhook_chat.php
*/
(function () {
  'use strict';

  if (window.__nwmChatLoaded) return;
  window.__nwmChatLoaded = true;

  var path = location.pathname.toLowerCase();
  var SKIP = ['/crm/', '/cms/', '/app/', '/login', '/dashboard', '/admin', '/desktop-login'];
  for (var i = 0; i < SKIP.length; i++) {
    if (path.indexOf(SKIP[i]) === 0) return;
  }

  // ── Config ────────────────────────────────────────────────────────────────
  var WA_NUMBER = (window.NWM_WA_NUMBER && /^[0-9]{8,15}$/.test(window.NWM_WA_NUMBER))
    ? window.NWM_WA_NUMBER : '14155238886';
  var CHAT_ENDPOINT = (window.NWM_CHAT_ENDPOINT) || '/crm-vanilla/api/webhook_chat.php';

  function t(en, es) {
    try {
      var lang = (window.NWMi18n && window.NWMi18n.current && window.NWMi18n.current()) || 'en';
      return lang === 'es' ? es : en;
    } catch (_) { return en; }
  }

  // ── Session ID (persists per browser tab) ─────────────────────────────────
  var SESSION_ID = (function () {
    try {
      var k = 'nwm_chat_sid';
      var existing = sessionStorage.getItem(k);
      if (existing) return existing;
      var id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(k, id);
      return id;
    } catch (_) { return 'chat_' + Date.now(); }
  })();

  // ── Styles ────────────────────────────────────────────────────────────────
  var css = [
    /* FAB base */
    '.nwm-fab-wa-wrap{position:fixed;right:20px;bottom:20px;z-index:999990;font-family:Inter,system-ui,-apple-system,sans-serif}',
    '.nwm-fab{width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .18s,box-shadow .18s;position:relative;text-decoration:none}',
    '.nwm-fab:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.35)}',
    '.nwm-fab-wa{background:#25D366}',
    '.nwm-fab-tooltip{position:absolute;right:70px;top:50%;transform:translateY(-50%);background:#010F3B;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .18s;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
    '.nwm-fab:hover .nwm-fab-tooltip{opacity:1}',
    '.nwm-fab-tooltip::after{content:"";position:absolute;right:-5px;top:50%;margin-top:-5px;border:5px solid transparent;border-left-color:#010F3B}',
    /* Chat FAB */
    '.nwm-chat-wrap{position:fixed;left:20px;bottom:20px;z-index:999990;font-family:Inter,system-ui,-apple-system,sans-serif}',
    '.nwm-chat-fab{width:56px;height:56px;border-radius:50%;background:#010F3B;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .18s,box-shadow .18s}',
    '.nwm-chat-fab:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.35)}',
    '.nwm-chat-fab-tooltip{position:absolute;left:70px;top:50%;transform:translateY(-50%);background:#010F3B;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .18s;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
    '.nwm-chat-fab:hover + .nwm-chat-fab-tooltip,.nwm-chat-fab:hover~.nwm-chat-fab-tooltip{opacity:1}',
    '.nwm-chat-fab-tooltip::before{content:"";position:absolute;left:-5px;top:50%;margin-top:-5px;border:5px solid transparent;border-right-color:#010F3B}',
    /* Chat window */
    '.nwm-chat-win{position:absolute;bottom:70px;left:0;width:340px;background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;max-height:480px}',
    '.nwm-chat-win.open{display:flex}',
    '.nwm-chat-head{background:#010F3B;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}',
    '.nwm-chat-head-avatar{width:36px;height:36px;border-radius:50%;background:#FF671F;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}',
    '.nwm-chat-head-info{flex:1}',
    '.nwm-chat-head-name{font-weight:700;font-size:14px}',
    '.nwm-chat-head-sub{font-size:12px;opacity:.75}',
    '.nwm-chat-head-close{background:none;border:0;color:#fff;cursor:pointer;padding:4px;border-radius:4px;line-height:1;font-size:18px;opacity:.8}',
    '.nwm-chat-head-close:hover{opacity:1}',
    '.nwm-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f8f9fc}',
    '.nwm-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word}',
    '.nwm-msg.bot{background:#fff;color:#010F3B;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.1)}',
    '.nwm-msg.user{background:#010F3B;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
    '.nwm-chat-typing{display:none;align-items:center;gap:4px;padding:8px 12px;background:#fff;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.1)}',
    '.nwm-chat-typing.show{display:flex}',
    '.nwm-dot{width:7px;height:7px;border-radius:50%;background:#aab;animation:nwmBounce 1.2s infinite}',
    '.nwm-dot:nth-child(2){animation-delay:.2s}.nwm-dot:nth-child(3){animation-delay:.4s}',
    '@keyframes nwmBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '.nwm-chat-footer{padding:10px 12px;border-top:1px solid #eee;display:flex;gap:8px;background:#fff}',
    '.nwm-chat-input{flex:1;border:1px solid #dde;border-radius:20px;padding:9px 14px;font-size:13px;outline:none;font-family:inherit;resize:none;line-height:1.4;max-height:80px;overflow-y:auto}',
    '.nwm-chat-input:focus{border-color:#010F3B}',
    '.nwm-chat-send{width:36px;height:36px;border-radius:50%;background:#FF671F;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;transition:background .15s;align-self:flex-end}',
    '.nwm-chat-send:hover{background:#e55a10}',
    '.nwm-chat-send:disabled{background:#ccc;cursor:not-allowed}',
    '.nwm-chat-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#FF671F;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center}',
    '.nwm-chat-badge.show{display:flex}',
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── WhatsApp FAB (right) ──────────────────────────────────────────────────
  var waSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  var WA_PREFILL = encodeURIComponent(t(
    'Hi NetWebMedia 👋 I\'d like to learn more about your AI marketing services.',
    'Hola NetWebMedia 👋 Me gustaría saber más de sus servicios de marketing con IA.'
  ));

  var waWrap = document.createElement('div');
  waWrap.className = 'nwm-fab-wa-wrap';
  waWrap.innerHTML =
    '<a href="https://wa.me/' + WA_NUMBER + '?text=' + WA_PREFILL + '" class="nwm-fab nwm-fab-wa" target="_blank" rel="noopener" aria-label="WhatsApp">' +
      waSvg +
      '<span class="nwm-fab-tooltip">' + t('Chat on WhatsApp', 'Chatea por WhatsApp') + '</span>' +
    '</a>';
  document.body.appendChild(waWrap);

  // ── Chat FAB + Window (left) ──────────────────────────────────────────────
  var chatSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var sendSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  var chatWrap = document.createElement('div');
  chatWrap.className = 'nwm-chat-wrap';
  chatWrap.innerHTML =
    '<div class="nwm-chat-win" id="nwmChatWin">' +
      '<div class="nwm-chat-head">' +
        '<div class="nwm-chat-head-avatar">🤖</div>' +
        '<div class="nwm-chat-head-info">' +
          '<div class="nwm-chat-head-name">NetWebMedia AI</div>' +
          '<div class="nwm-chat-head-sub">' + t('Typically replies instantly', 'Responde al instante') + '</div>' +
        '</div>' +
        '<button class="nwm-chat-head-close" id="nwmChatClose" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="nwm-chat-msgs" id="nwmChatMsgs">' +
        '<div class="nwm-msg bot">' + t(
          'Hi! 👋 I\'m the NetWebMedia AI. How can I help you grow your business today?',
          '¡Hola! 👋 Soy el AI de NetWebMedia. ¿Cómo puedo ayudarte a crecer hoy?'
        ) + '</div>' +
      '</div>' +
      '<div class="nwm-chat-typing" id="nwmTyping"><span class="nwm-dot"></span><span class="nwm-dot"></span><span class="nwm-dot"></span></div>' +
      '<div class="nwm-chat-footer">' +
        '<textarea class="nwm-chat-input" id="nwmChatInput" rows="1" placeholder="' + t('Type a message…', 'Escribe un mensaje…') + '"></textarea>' +
        '<button class="nwm-chat-send" id="nwmChatSend" aria-label="Send">' + sendSvg + '</button>' +
      '</div>' +
    '</div>' +
    '<button class="nwm-chat-fab" id="nwmChatFab" aria-label="' + t('Chat with us', 'Chatea con nosotros') + '">' +
      chatSvg +
      '<span class="nwm-chat-badge" id="nwmChatBadge">1</span>' +
    '</button>' +
    '<span class="nwm-chat-fab-tooltip">' + t('Chat with AI', 'Habla con el AI') + '</span>';

  document.body.appendChild(chatWrap);

  // ── Wire events ───────────────────────────────────────────────────────────
  var win    = document.getElementById('nwmChatWin');
  var fab    = document.getElementById('nwmChatFab');
  var close  = document.getElementById('nwmChatClose');
  var msgs   = document.getElementById('nwmChatMsgs');
  var typing = document.getElementById('nwmTyping');
  var input  = document.getElementById('nwmChatInput');
  var send   = document.getElementById('nwmChatSend');
  var badge  = document.getElementById('nwmChatBadge');

  badge.classList.add('show');

  fab.addEventListener('click', function () {
    var isOpen = win.classList.toggle('open');
    if (isOpen) { badge.classList.remove('show'); input.focus(); }
  });

  close.addEventListener('click', function () { win.classList.remove('open'); });

  send.addEventListener('click', sendMsg);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });

  /* Auto-grow textarea */
  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  function sendMsg() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    appendMsg(text, 'user');
    send.disabled = true;
    typing.classList.add('show');
    msgs.scrollTop = msgs.scrollHeight;

    var payload = { session_id: SESSION_ID, message: text };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', CHAT_ENDPOINT);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      typing.classList.remove('show');
      send.disabled = false;
      var reply = t(
        'Our team will be in touch shortly!',
        'Nuestro equipo se pondrá en contacto pronto.'
      );
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.reply) reply = data.reply;
      } catch (_) {}
      appendMsg(reply, 'bot');
      msgs.scrollTop = msgs.scrollHeight;
    };
    xhr.onerror = function () {
      typing.classList.remove('show');
      send.disabled = false;
      appendMsg(t('Something went wrong. Please try again.', 'Algo salió mal. Por favor intenta de nuevo.'), 'bot');
    };
    xhr.send(JSON.stringify(payload));
  }

  function appendMsg(text, role) {
    var div = document.createElement('div');
    div.className = 'nwm-msg ' + role;
    div.textContent = text;
    msgs.insertBefore(div, typing);
    msgs.scrollTop = msgs.scrollHeight;
  }

  try {
    window.addEventListener('nwm:lang', function () {
      var tip = waWrap.querySelector('.nwm-fab-tooltip');
      if (tip) tip.textContent = t('Chat on WhatsApp', 'Chatea por WhatsApp');
    });
  } catch (_) {}
})();

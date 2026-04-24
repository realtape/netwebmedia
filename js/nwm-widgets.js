/* NetWebMedia cross-domain widget bundle.
   Adds WhatsApp button + NWM chatbot to any subdomain page.
   Usage: <script src="https://netwebmedia.com/js/nwm-widgets.js" defer></script>
*/
(function () {
  'use strict';

  // Tell nwm-chat.js to use absolute API/link paths
  window.NWM_API_BASE = 'https://netwebmedia.com';

  // ── WhatsApp floating button ────────────────────────────────
  if (!window.__nwmWaLoaded) {
    window.__nwmWaLoaded = true;

    var PHONE = '17407363884';
    var MSG   = encodeURIComponent('Hi! I\u2019d like to learn more about NetWebMedia\u2019s services.');
    var HREF  = 'https://wa.me/' + PHONE + '?text=' + MSG;

    function mountWA() {
      if (document.getElementById('nwm-wa-btn')) return;

      var style = document.createElement('style');
      style.textContent = [
        '#nwm-wa-btn{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;}',
        '#nwm-wa-bubble{width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.45);transition:transform .2s,box-shadow .2s;}',
        '#nwm-wa-btn:hover #nwm-wa-bubble{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,.6);}',
        '#nwm-wa-label{background:#fff;color:#111;font-size:13px;font-weight:600;padding:6px 12px;border-radius:20px;box-shadow:0 2px 10px rgba(0,0,0,.15);white-space:nowrap;opacity:0;transform:translateX(8px);transition:opacity .2s,transform .2s;}',
        '#nwm-wa-btn:hover #nwm-wa-label{opacity:1;transform:translateX(0);}',
        '@media(max-width:480px){#nwm-wa-label{display:none;}#nwm-wa-btn{bottom:16px;right:16px;}}'
      ].join('');
      document.head.appendChild(style);

      var btn = document.createElement('a');
      btn.id      = 'nwm-wa-btn';
      btn.href    = HREF;
      btn.target  = '_blank';
      btn.rel     = 'noopener noreferrer';
      btn.setAttribute('aria-label', 'Chat with NetWebMedia on WhatsApp');
      btn.innerHTML =
        '<span id="nwm-wa-label">Chat on WhatsApp</span>' +
        '<span id="nwm-wa-bubble">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">' +
            '<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.003 18a7.97 7.97 0 01-4.07-1.113l-.292-.173-3.03.863.875-2.96-.19-.302A7.964 7.964 0 014 12c0-4.411 3.589-8 8.003-8C16.41 4 20 7.589 20 12s-3.589 8-7.997 8zm4.404-5.956c-.242-.121-1.43-.705-1.651-.786-.222-.08-.383-.12-.545.121-.161.242-.625.786-.766.947-.14.162-.282.182-.524.061-.242-.121-1.022-.376-1.947-1.2-.72-.641-1.206-1.432-1.348-1.674-.14-.242-.015-.372.106-.493.109-.108.242-.282.363-.423.12-.14.161-.242.242-.403.08-.162.04-.303-.02-.424-.061-.12-.545-1.313-.747-1.798-.196-.472-.396-.408-.544-.415l-.464-.008a.891.891 0 00-.645.303c-.222.242-.847.828-.847 2.02 0 1.192.868 2.344.988 2.505.121.162 1.707 2.607 4.136 3.655.578.25 1.028.398 1.38.51.58.184 1.108.158 1.525.096.465-.07 1.43-.585 1.632-1.15.2-.564.2-1.048.14-1.149-.06-.1-.222-.16-.464-.282z"/>' +
          '</svg>' +
        '</span>';
      document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountWA);
    } else {
      mountWA();
    }
  }

  // ── NWM chatbot ─────────────────────────────────────────────
  if (!window.__nwmChatLoaded) {
    function injectChat() {
      if (document.getElementById('nwm-chat-script')) return;
      var s = document.createElement('script');
      s.id    = 'nwm-chat-script';
      s.src   = 'https://netwebmedia.com/js/nwm-chat.js?v=3';
      s.async = true;
      document.head.appendChild(s);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectChat);
    } else {
      setTimeout(injectChat, 300);
    }
  }
})();

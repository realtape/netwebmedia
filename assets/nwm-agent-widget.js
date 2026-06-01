/* NetWebMedia AI Agent chat widget.
   Embed: <script src="https://netwebmedia.com/assets/nwm-agent-widget.js" data-agent-token="XXX"></script>
*/
(function () {
  var script = document.currentScript || (function(){var a=document.getElementsByTagName('script');return a[a.length-1]})();
  var token = script.getAttribute('data-agent-token');
  if (!token) return console.warn('NWM agent widget: data-agent-token missing');
  var color = script.getAttribute('data-color') || '#8b5cf6';
  var label = script.getAttribute('data-label') || 'Chat with us';
  var welcome = script.getAttribute('data-welcome') || 'Hi! How can I help?';
  var sessionId = null;

  var css = '.nwm-chat-btn{position:fixed;bottom:24px;right:24px;background:' + color + ';color:#fff;border:0;border-radius:9999px;padding:14px 22px;font-size:15px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.2);cursor:pointer;z-index:999998;font-family:system-ui,sans-serif}' +
            '.nwm-chat-win{position:fixed;bottom:90px;right:24px;width:360px;max-width:calc(100vw - 48px);height:520px;max-height:70vh;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:999999;font-family:system-ui,sans-serif}' +
            '.nwm-chat-win.open{display:flex}' +
            '.nwm-chat-hd{padding:16px;background:' + color + ';color:#fff;font-weight:600}' +
            '.nwm-chat-msgs{flex:1;overflow-y:auto;padding:14px;background:#f7f7fb}' +
            '.nwm-msg{margin:6px 0;padding:10px 14px;border-radius:14px;max-width:80%;font-size:14px;line-height:1.4;white-space:pre-wrap}' +
            '.nwm-msg.user{background:' + color + ';color:#fff;margin-left:auto;border-bottom-right-radius:4px}' +
            '.nwm-msg.bot{background:#fff;color:#222;border:1px solid #eee;border-bottom-left-radius:4px}' +
            '.nwm-chat-form{display:flex;border-top:1px solid #eee;padding:10px;background:#fff}' +
            '.nwm-chat-form input{flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:14px;outline:none}' +
            '.nwm-chat-form button{margin-left:8px;padding:10px 16px;background:' + color + ';color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:600}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

  var btn = document.createElement('button');
  btn.className = 'nwm-chat-btn'; btn.textContent = '💬 ' + label;
  var win = document.createElement('div');
  win.className = 'nwm-chat-win';
  win.innerHTML = '<div class="nwm-chat-hd">' + label + '</div>' +
                  '<div class="nwm-chat-msgs" id="nwm-msgs"></div>' +
                  '<form class="nwm-chat-form" id="nwm-form"><input type="text" id="nwm-in" placeholder="Type a message…" required><button>→</button></form>';
  document.body.appendChild(btn); document.body.appendChild(win);

  function addMsg(role, text) {
    var m = document.createElement('div');
    m.className = 'nwm-msg ' + role;
    m.textContent = text;
    var msgs = document.getElementById('nwm-msgs');
    msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight;
  }
  addMsg('bot', welcome);

  btn.addEventListener('click', function () { win.classList.toggle('open'); });
  document.getElementById('nwm-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('nwm-in');
    var text = input.value.trim(); if (!text) return;
    addMsg('user', text); input.value = '';
    addMsg('bot', '…');
    var thinking = document.getElementById('nwm-msgs').lastChild;
    fetch('https://netwebmedia.com/api/public/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token: token, message: text, session_id: sessionId })
    }).then(function (r) { return r.json(); }).then(function (r) {
      thinking.remove();
      if (r.session_id) sessionId = r.session_id;
      addMsg('bot', r.reply || r.error || 'Sorry, something went wrong.');
    }).catch(function () {
      thinking.remove(); addMsg('bot', 'Network error.');
    });
  });
})();

import { api } from '../api.js';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

let sessionId = 'app_' + Math.random().toString(36).slice(2, 12);
const history = [];

export function renderChat(root) {
  root.innerHTML = `
    <div class="topbar">
      <div class="title">AI Assistant</div>
      <div style="font-size:13px;opacity:0.8">Always on</div>
    </div>
    <div class="chat">
      <div class="chat-log" id="log"></div>
      <div class="typing" id="typing" style="display:none">AI is thinking…</div>
      <form class="chat-input" id="chat-form">
        <input class="input" id="msg" placeholder="Ask anything…" autocomplete="off" />
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  `;

  const log = root.querySelector('#log');
  const form = root.querySelector('#chat-form');
  const input = root.querySelector('#msg');
  const typing = root.querySelector('#typing');

  if (history.length === 0) {
    pushBot("Hi! I'm your NetWebMedia AI assistant. Ask me anything — plans, tutorials, audits, strategy.");
  } else {
    history.forEach(({ role, text }) => append(role, text));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    pushUser(text);
    if (Capacitor.isNativePlatform()) {
      try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (_) {}
    }

    typing.style.display = 'block';
    try {
      const res = await api.chat(text, sessionId);
      if (res.session_id) sessionId = res.session_id;
      pushBot(res.reply || '(no response)');
    } catch (err) {
      pushBot(`Sorry — ${err.message}. Please try again.`);
    } finally {
      typing.style.display = 'none';
      log.scrollTop = log.scrollHeight;
    }
  });

  function pushUser(text) { history.push({ role: 'user', text }); append('user', text); }
  function pushBot(text)  { history.push({ role: 'bot',  text }); append('bot',  text); }
  function append(role, text) {
    const b = document.createElement('div');
    b.className = `bubble ${role}`;
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }
}

import { api, setToken, getToken } from '../api.js';
import { navigate } from '../router.js';
import { Browser } from '@capacitor/browser';

export async function renderAccount(root) {
  root.innerHTML = `
    <div class="topbar">
      <div class="title">Account</div>
    </div>
    <div class="screen-body">
      <div class="card" id="user-card">
        <div class="card-title">Signed in as</div>
        <div style="font-size:17px;font-weight:600" id="user-email">—</div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <button class="row-link" data-url="https://netwebmedia.com/pricing.html">Manage plan</button>
        <button class="row-link" data-url="https://netwebmedia.com/contact.html">Request free AI audit</button>
        <button class="row-link" data-url="https://netwebmedia.com/faq.html">FAQ</button>
        <button class="row-link" data-url="mailto:hello@netwebmedia.com">Email support</button>
      </div>

      <button class="btn btn-ghost" id="logout" style="margin-top:24px;color:#c42a2a">Sign out</button>
      <div style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:20px">v0.1.0</div>
    </div>
    <style>
      .row-link {
        display: block; width: 100%; text-align: left;
        padding: 14px 16px; background: #fff; border: none; border-bottom: 1px solid var(--border);
        font-size: 15px; font-family: inherit; cursor: pointer; color: var(--text);
      }
      .row-link:last-child { border-bottom: none; }
      .row-link:active { background: #f3f5f9; }
    </style>
  `;

  const emailEl = root.querySelector('#user-email');
  const logout = root.querySelector('#logout');

  try {
    const token = await getToken();
    if (token) {
      const me = await api.me();
      emailEl.textContent = me.email || me.user?.email || 'authenticated';
    } else {
      emailEl.textContent = 'Not signed in';
    }
  } catch (_) {
    emailEl.textContent = 'Session expired';
  }

  root.querySelectorAll('.row-link').forEach(b => {
    b.addEventListener('click', async () => {
      const url = b.dataset.url;
      if (url.startsWith('mailto:')) { window.location.href = url; return; }
      try { await Browser.open({ url }); } catch (_) { window.open(url, '_blank'); }
    });
  });

  logout.addEventListener('click', async () => {
    try { await api.logout(); } catch (_) {}
    await setToken(null);
    await navigate('login');
  });
}

import { api, setToken } from '../api.js';
import { navigate } from '../router.js';

export function renderLogin(root) {
  root.innerHTML = `
    <div class="login">
      <div class="logo">Net<span>Web</span>Media</div>
      <div class="tagline">AI-native fractional CMO. Log in to your workspace.</div>

      <form id="login-form">
        <div class="field">
          <label for="email">Email</label>
          <input class="input" type="email" id="email" autocomplete="email" required autocapitalize="off" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input class="input" type="password" id="password" autocomplete="current-password" required />
        </div>
        <div class="err" id="login-err"></div>
        <button class="btn btn-primary" type="submit" id="submit-btn">Sign in</button>
      </form>

      <div style="margin-top:18px;text-align:center;font-size:14px;color:var(--text-muted)">
        Don't have an account? Visit <strong>netwebmedia.com/pricing.html</strong> to start.
      </div>
    </div>
  `;

  const form = root.querySelector('#login-form');
  const err = root.querySelector('#login-err');
  const btn = root.querySelector('#submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const email = root.querySelector('#email').value.trim();
    const password = root.querySelector('#password').value;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
      const res = await api.login(email, password);
      if (!res.token) throw new Error('No token in response');
      await setToken(res.token);
      await navigate('shell');
    } catch (e) {
      err.textContent = e.message || 'Login failed';
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}

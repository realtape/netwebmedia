import { Preferences } from '@capacitor/preferences';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://netwebmedia.com/api';
const TOKEN_KEY = 'nwm_token';

export async function getToken() {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value || null;
}

export async function setToken(token) {
  if (token) await Preferences.set({ key: TOKEN_KEY, value: token });
  else await Preferences.remove({ key: TOKEN_KEY });
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  chat: (message, sessionId, language = 'en') =>
    request('/public/chat', {
      method: 'POST',
      body: { message, session_id: sessionId, language },
      auth: false
    }),

  leads: () => request('/resources/contacts?limit=50'),
  stats: () => request('/public/stats', { auth: false })
};

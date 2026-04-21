/* NetWebMedia API Client — shared by CMS and CRM
   Exposes `window.NWMApi`. Stores session token in localStorage under "nwm_token".
   Auto-redirects to /login.html on 401 unless options.noRedirectOn401 is true.
*/
(function (w) {
  'use strict';

  var BASE = (w.NWM_API_BASE || '/api').replace(/\/+$/, '');
  var TOKEN_KEY = 'nwm_token';
  var USER_KEY = 'nwm_user';

  function getToken()   { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } }
  function setToken(t)  { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (_) {} }
  function getUser()    { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; } }
  function setUser(u)   { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch (_) {} try { if (u) localStorage.removeItem('crm_demo_user'); } catch (_) {} }
  function clear()      { setToken(''); setUser(null); }

  function qs(params) {
    if (!params) return '';
    var keys = Object.keys(params).filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; });
    if (!keys.length) return '';
    return '?' + keys.map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
  }

  function request(method, path, body, opts) {
    opts = opts || {};
    var headers = { 'Accept': 'application/json' };
    if (body !== undefined && body !== null) headers['Content-Type'] = 'application/json';
    var tok = getToken();
    if (tok) headers['X-Auth-Token'] = tok;

    return fetch(BASE + path, {
      method: method,
      headers: headers,
      credentials: 'include',
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      var ct = res.headers.get('content-type') || '';
      var parse = ct.indexOf('application/json') !== -1 ? res.json() : res.text();
      return parse.then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || ('HTTP ' + res.status));
          err.status = res.status;
          err.data = data;
          if (res.status === 401 && !opts.noRedirectOn401) {
            clear();
            if (!/login\.html|register\.html/.test(location.pathname)) {
              // Remember where user wanted to go.
              var next = encodeURIComponent(location.pathname + location.search);
              location.href = '/login.html?next=' + next;
            }
          }
          throw err;
        }
        return data;
      });
    });
  }

  var api = {
    // -- auth
    register: function (email, password, name, honeypot) {
      return request('POST', '/auth/register', { email: email, password: password, name: name, nwm_website: honeypot || '' })
        .then(function (r) { setToken(r.token); setUser(r.user); return r; });
    },
    login: function (email, password) {
      return request('POST', '/auth/login', { email: email, password: password })
        .then(function (r) { setToken(r.token); setUser(r.user); return r; });
    },
    logout: function () {
      return request('POST', '/auth/logout', {}, { noRedirectOn401: true })
        .catch(function () {})
        .then(function () { clear(); });
    },
    me: function () {
      return request('GET', '/auth/me').then(function (r) { setUser(r.user); return r.user; });
    },

    // -- generic resources
    list: function (type, params) { return request('GET', '/resources/' + encodeURIComponent(type) + qs(params)); },
    get:  function (type, id)     { return request('GET', '/resources/' + encodeURIComponent(type) + '/' + id); },
    create: function (type, payload) { return request('POST', '/resources/' + encodeURIComponent(type), payload); },
    update: function (type, id, payload) { return request('PUT', '/resources/' + encodeURIComponent(type) + '/' + id, payload); },
    remove: function (type, id) { return request('DELETE', '/resources/' + encodeURIComponent(type) + '/' + id); },

    // -- singletons / settings (stored as type=setting)
    getSetting: function (slug) {
      return request('GET', '/resources/setting' + qs({ q: slug, limit: 1 })).then(function (r) {
        var hit = (r.items || []).find(function (x) { return x.slug === slug; });
        return hit ? hit.data : null;
      });
    },

    // -- public
    publicStats: function () { return request('GET', '/public/stats', null, { noRedirectOn401: true }); },
    publicBlog:  function (params) { return request('GET', '/public/blog' + qs(params), null, { noRedirectOn401: true }); },
    publicBlogPost: function (slug) { return request('GET', '/public/blog/' + encodeURIComponent(slug), null, { noRedirectOn401: true }); },
    submitForm: function (formId, data) { return request('POST', '/public/forms/submit', { form_id: formId, data: data }, { noRedirectOn401: true }); },

    // -- helpers
    token: getToken,
    user: getUser,
    isAuthed: function () { return !!getToken(); },
    clear: clear,

    // -- login gate for pages
    requireAuth: function (opts) {
      opts = opts || {};
      if (!getToken()) {
        if (opts.demo) {
          // Demo-mode auto-login
          return api.login('demo@netwebmedia.com', 'demo1234');
        }
        var next = encodeURIComponent(location.pathname + location.search);
        location.href = '/login.html?next=' + next;
        return Promise.reject(new Error('not authenticated'));
      }
      // Fire-and-forget: revalidate in background
      return api.me().catch(function () { /* redirect handled by request() */ });
    },
  };

  w.NWMApi = api;

  /* --- Auto auth-gate ----------------------------------------------------
     When this script loads, inspect the URL and decide:
       • login.html / register.html           → do nothing
       • /cms-demo/ or /app-demo/             → auto-login as demo user if needed
       • everything else                      → require a valid token, else redirect
     Pages that want to opt out can set `window.NWM_NO_GATE = true` before this file loads.
  */
  (function autoGate() {
    if (w.NWM_NO_GATE) return;
    var p = (location.pathname || '').toLowerCase();
    if (/\/(login|register)\.html$/.test(p)) return;
    var isDemo = /^\/(demo\/(crm|cms)|cms-demo|app-demo)(\/|$)/.test(p);

    function reqAuth() {
      if (!getToken()) {
        var next = encodeURIComponent(location.pathname + location.search);
        location.href = '/login.html?next=' + next;
        return;
      }
      // Background revalidation — 401 handler will redirect.
      api.me().catch(function () {});
    }

    if (isDemo) {
      if (!getToken()) {
        api.login('demo@netwebmedia.com', 'demo1234').catch(function () {});
      }
      return;
    }
    reqAuth();
  })();
})(window);

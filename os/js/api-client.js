/* =============================================================================
   NetWebMedia OS — API client  (Phase 1 Foundation)
   Thin wrapper over the existing CRM query-string API at /crm/api/. Reuses the
   crm-vanilla PHP session cookie (credentials:'include') and the nwm_token
   header if present, so the OS shell rides the same auth as the CRM.
   ============================================================================= */
(function (global) {
  'use strict';

  var BASE = '/crm/api/';

  function token() {
    try { return localStorage.getItem('nwm_token') || ''; } catch (e) { return ''; }
  }

  function request(resource, opts) {
    opts = opts || {};
    var url = BASE + '?r=' + encodeURIComponent(resource);
    if (opts.id) url += '&id=' + encodeURIComponent(opts.id);

    var headers = { 'Accept': 'application/json' };
    var tok = token();
    if (tok) headers['X-Auth-Token'] = tok;

    var init = {
      method: opts.method || 'GET',
      headers: headers,
      credentials: 'include'
    };
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }

    return fetch(url, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || ('HTTP ' + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  global.NWMOS = {
    base: BASE,
    request: request,
    whoami: function () { return request('whoami'); }
  };
})(window);

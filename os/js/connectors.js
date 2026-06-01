/* =============================================================================
   NetWebMedia OS — connectors page (Phase 1 secondary page)
   Lists connectors with status badges, Connect (OAuth start link) and Disconnect.
   Vanilla JS, CSP-safe. Themes from whoami; friendly empty state if API is down.
   ============================================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function esc(s) { return s == null ? '' : String(s); }

  // Known providers we surface even when the API returns nothing for them yet.
  // The OAuth start URLs are full-page links (provider-side redirect).
  var DEFS = [
    { provider: 'google', label: 'Google (Gmail + Calendar)', icon: 'G',
      blurb: 'Sync mail and calendar so agents can read threads and book meetings.',
      start: '/crm/api/?r=oauth_google&action=start' },
    { provider: 'slack',  label: 'Slack', icon: 'S',
      blurb: 'Post notifications to your team channel on key events.',
      start: '/crm/api/?r=oauth_slack&action=start' }
  ];

  var state = { org: null, connected: false, connectors: [] };

  function applyBranding(b) {
    if (!b) return;
    var root = document.documentElement.style;
    if (b.primary_color)   root.setProperty('--nwm-primary', b.primary_color);
    if (b.secondary_color) root.setProperty('--nwm-secondary', b.secondary_color);
    if (b.logo_url) {
      var logo = $('osLogo');
      logo.src = b.logo_url; logo.hidden = false;
      logo.onerror = function () { logo.hidden = true; };
    }
  }

  function byProvider(p) {
    for (var i = 0; i < state.connectors.length; i++) {
      if (state.connectors[i].provider === p) return state.connectors[i];
    }
    return null;
  }

  function badge(status) {
    var map = { connected: 'Connected', disconnected: 'Not connected', error: 'Error', pending: 'Pending' };
    return el('span', 'os-status os-status--' + (status || 'disconnected'), map[status] || status || 'Not connected');
  }

  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return esc(s);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render() {
    var host = $('osConnectors');
    host.textContent = '';

    if (!state.connected) {
      host.appendChild(banner('Preview mode — the OS API isn’t reachable from here, so live connection status is blank. On production this reads /crm/api/?r=os_connectors.'));
    }

    var list = el('div', 'os-list');
    DEFS.forEach(function (d) {
      var found = byProvider(d.provider) || {};
      var status = found.status || 'disconnected';
      var connected = status === 'connected';

      var item = el('div', 'os-item');
      var ico = el('div', 'os-item__ico'); ico.appendChild(el('span', null, d.icon));
      item.appendChild(ico);

      var body = el('div', 'os-item__body');
      body.appendChild(el('p', 'os-item__title', d.label));
      if (connected) {
        var meta = 'Connected';
        if (found.account_label) meta += ' · ' + esc(found.account_label);
        if (found.connected_at) meta += ' · since ' + fmtDate(found.connected_at);
        body.appendChild(el('p', 'os-item__meta', meta));
      } else {
        body.appendChild(el('p', 'os-item__meta', d.blurb));
      }
      item.appendChild(body);

      var aside = el('div', 'os-item__aside');
      aside.appendChild(badge(status));
      if (connected) {
        var dc = el('button', 'os-btn os-btn--danger os-btn--sm', 'Disconnect');
        dc.type = 'button';
        dc.addEventListener('click', function () { disconnect(d.provider, dc); });
        aside.appendChild(dc);
      } else {
        var a = el('a', 'os-btn os-btn--sm', 'Connect');
        a.href = d.start;       // full-page navigation to OAuth start
        aside.appendChild(a);
      }
      item.appendChild(aside);
      list.appendChild(item);
    });
    host.appendChild(list);

    // Surface any extra providers the API returns that we don't have a def for.
    state.connectors.forEach(function (c) {
      if (DEFS.some(function (d) { return d.provider === c.provider; })) return;
      var item = el('div', 'os-item');
      var ico = el('div', 'os-item__ico'); ico.appendChild(el('span', null, '⚇'));
      item.appendChild(ico);
      var body = el('div', 'os-item__body');
      body.appendChild(el('p', 'os-item__title', esc(c.provider)));
      body.appendChild(el('p', 'os-item__meta', c.account_label ? esc(c.account_label) : ''));
      item.appendChild(body);
      var aside = el('div', 'os-item__aside');
      aside.appendChild(badge(c.status));
      if (c.status === 'connected') {
        var dc = el('button', 'os-btn os-btn--danger os-btn--sm', 'Disconnect');
        dc.type = 'button';
        dc.addEventListener('click', function () { disconnect(c.provider, dc); });
        aside.appendChild(dc);
      }
      item.appendChild(aside);
      list.appendChild(item);
    });

    var msg = el('p', 'os-note'); msg.id = 'osMsg'; msg.style.display = 'none';
    host.appendChild(msg);
  }

  function note(text, kind) {
    var m = $('osMsg');
    if (!m) return;
    m.textContent = text;
    m.className = 'os-note os-note--' + (kind || 'ok');
    m.style.display = 'block';
  }

  function disconnect(provider, btn) {
    btn.disabled = true;
    NWMOS.request('os_connectors', { method: 'POST', body: { action: 'disconnect', provider: provider } })
      .then(function () { return reload(); })
      .then(function () { note('Disconnected ' + provider + '.', 'ok'); })
      .catch(function (err) {
        btn.disabled = false;
        note('Could not disconnect (' + esc(err && err.message) + ').', 'err');
      });
  }

  function reload() {
    return NWMOS.request('os_connectors').then(function (d) {
      state.connectors = (d && d.connectors) || [];
      render();
    });
  }

  function boot() {
    NWMOS.whoami().then(function (data) {
      state.org = data.org || null;
      state.connected = true;          // whoami answered -> we're live
      if (state.org) {
        applyBranding(state.org.branding);
        $('osBrandName').textContent = state.org.display_name || 'NetWebMedia OS';
      }
      // os_connectors may 404 before the backend ships it — tolerate it without
      // flipping back to "preview mode" (whoami already proved we're connected).
      return NWMOS.request('os_connectors')
        .then(function (d) { state.connectors = (d && d.connectors) || []; })
        .catch(function () { state.connectors = []; })
        .then(render);
    }).catch(function () {
      // whoami itself unreachable — true preview mode.
      state.connected = false;
      render();
    });
  }

  function banner(text) { return el('div', 'os-banner', text); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();

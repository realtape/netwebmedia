/* =============================================================================
   NetWebMedia OS — shell boot + router  (Phase 1 Foundation skeleton)
   Vanilla JS, no framework, no build step (same discipline as crm-vanilla/).
   Boots by asking /crm/api/?r=whoami who the caller is, themes from the org's
   branding, and renders the shell. Degrades gracefully if the API is
   unreachable (e.g. a local static preview where PHP doesn't run).
   ============================================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // Build an element with optional class/text — keeps us off innerHTML for
  // any value that could ever carry tenant data.
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var NAV = [
    { key: 'dashboard',  label: 'Dashboard',  ico: '◧', feature: null },
    { key: 'inbox',      label: 'Inbox',      ico: '✉', feature: 'crm' },
    { key: 'pipeline',   label: 'Pipeline',   ico: '▤', feature: 'crm' },
    { key: 'calendar',   label: 'Calendar',   ico: '◷', feature: 'crm' },
    { sep: true },
    { key: 'agents',     label: 'Agents',     ico: '✦', feature: 'agents' },
    { key: 'workflows',  label: 'Workflows',  ico: '⇄', feature: 'workflows' },
    { key: 'connectors', label: 'Connectors', ico: '⚇', feature: 'connectors' },
    { sep: true },
    { key: 'settings',   label: 'Settings',   ico: '⚙', feature: null }
  ];

  var PHASE = {
    inbox: 'Unified inbox (Gmail + WhatsApp) lands in Phase 3.',
    pipeline: 'Your sales pipeline reuses the existing CRM kanban — wired in Phase 2.',
    calendar: 'Calendar view is a Phase 2 re-skin of the CRM calendar.',
    agents: 'The agent launcher + command bar go live in Phase 4.',
    workflows: 'Read-only workflow run history wires up in Phase 2.',
    connectors: 'Gmail / Calendar / Slack OAuth connectors arrive in Phase 3.',
    settings: 'Branding, members, and billing settings build out across Phases 2 & 5.'
  };

  var state = { org: null, user: null, features: [], connected: false };

  // ---- theming -------------------------------------------------------------
  function applyBranding(b) {
    if (!b) return;
    var root = document.documentElement.style;
    if (b.primary_color)   root.setProperty('--nwm-primary', b.primary_color);
    if (b.secondary_color) root.setProperty('--nwm-secondary', b.secondary_color);
    if (b.logo_url) {
      var logo = $('osLogo');
      logo.src = b.logo_url;
      logo.hidden = false;
      logo.onerror = function () { logo.hidden = true; };
    }
  }

  // ---- sidebar -------------------------------------------------------------
  function renderSidebar() {
    var nav = $('osSidebar');
    nav.textContent = '';
    NAV.forEach(function (item) {
      if (item.sep) { nav.appendChild(el('div', 'os-nav__sep')); return; }
      var b = el('button', 'os-nav__item');
      b.type = 'button';
      b.dataset.view = item.key;
      var ico = el('span', 'os-nav__ico', item.ico);
      var lbl = el('span', null, item.label);
      b.appendChild(ico); b.appendChild(lbl);
      // Dim features this tenant hasn't unlocked yet, but keep them visible.
      if (item.feature && state.features.indexOf(item.feature) === -1) {
        b.style.opacity = '.45';
      }
      b.addEventListener('click', function () { route(item.key); });
      nav.appendChild(b);
    });
  }

  function setActiveNav(key) {
    var items = document.querySelectorAll('.os-nav__item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-active', items[i].dataset.view === key);
    }
  }

  // ---- views ---------------------------------------------------------------
  function route(key) {
    setActiveNav(key);
    if (key === 'dashboard') return renderDashboard();
    return renderStub(key);
  }

  function renderDashboard() {
    var view = $('osView');
    view.textContent = '';

    var name = (state.org && state.org.display_name) || 'your workspace';
    view.appendChild(el('h1', 'os-view__head', 'Welcome to ' + name));
    view.appendChild(el('p', 'os-view__sub',
      'NetWebMedia OS — the AI Agency OS. This is the Phase 1 foundation shell.'));

    if (!state.connected) {
      view.appendChild(el('div', 'os-banner',
        'Preview mode — the OS API isn’t reachable from here, so live numbers are blank. ' +
        'On production this dashboard reads from /crm/api/?r=whoami and the tenant’s data.'));
    } else if (state.org && !state.org.os_enabled) {
      view.appendChild(el('div', 'os-banner',
        'This workspace is provisioned but not yet enabled. Billing flips it on (Phase 5).'));
    }

    var grid = el('div', 'os-grid');
    [
      { label: 'New leads · this week', value: '—', hint: 'CRM wires up Phase 2' },
      { label: 'Deals moved stage', value: '—', hint: 'CRM wires up Phase 2' },
      { label: 'Agent runs · this month', value: '—', hint: 'Agents go live Phase 4' },
      { label: 'Emails sent by agents', value: '—', hint: 'Agents go live Phase 4' }
    ].forEach(function (c) {
      var card = el('div', 'os-card');
      card.appendChild(el('p', 'os-card__label', c.label));
      card.appendChild(el('p', 'os-card__value', c.value));
      card.appendChild(el('p', 'os-card__hint', c.hint));
      grid.appendChild(card);
    });
    view.appendChild(grid);
  }

  function renderStub(key) {
    var view = $('osView');
    view.textContent = '';
    var label = (NAV.filter(function (n) { return n.key === key; })[0] || {}).label || key;
    view.appendChild(el('h1', 'os-view__head', label));
    view.appendChild(el('p', 'os-view__sub', PHASE[key] || 'Coming soon.'));
    var card = el('div', 'os-card');
    card.appendChild(el('p', 'os-card__hint', PHASE[key] || ''));
    view.appendChild(card);
  }

  function renderSignedOut() {
    $('osShell').hidden = false;
    $('osBoot').hidden = true;
    var view = $('osView');
    $('osSidebar').textContent = '';
    view.textContent = '';
    var wrap = el('div', 'os-signin');
    wrap.appendChild(el('h1', null, 'NetWebMedia OS'));
    wrap.appendChild(el('p', null, 'Sign in to your agency workspace to continue.'));
    var a = el('a', 'os-btn', 'Sign in');
    a.href = '/crm/login.html';
    wrap.appendChild(a);
    view.appendChild(wrap);
  }

  // ---- topbar --------------------------------------------------------------
  function renderTopbar() {
    if (state.org) $('osBrandName').textContent = state.org.display_name || 'NetWebMedia OS';
    if (state.user) $('osUser').textContent = state.user.name || state.user.email || '';
    if (state.org && state.org.os_plan) {
      var badge = $('osPlanBadge');
      badge.textContent = state.org.os_plan;
      badge.hidden = false;
    }
    var form = $('osCmdForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('osCmd').value.trim();
      if (!q) return;
      route('agents');
      var view = $('osView');
      var note = el('div', 'os-banner',
        'Command received: “' + q + '”. Agent orchestration ships in Phase 4 — ' +
        'this will dispatch to /crm/api/?r=agent_run and stream the result here.');
      view.insertBefore(note, view.firstChild ? view.firstChild.nextSibling : null);
      $('osCmd').value = '';
    });
  }

  // ---- boot ----------------------------------------------------------------
  function showShell() {
    $('osBoot').hidden = true;
    $('osShell').hidden = false;
    renderTopbar();
    renderSidebar();
    route('dashboard');
  }

  function bootError(msg) {
    // API unreachable (local preview / PHP not running). Render the shell with
    // brand defaults so the skeleton is still inspectable.
    state.connected = false;
    state.features = ['crm'];
    showShell();
    if (msg) { /* swallow — banner already explains preview mode */ }
  }

  function boot() {
    $('osBootMsg').textContent = 'Starting your workspace…';
    NWMOS.whoami().then(function (data) {
      state.org = data.org || null;
      state.user = data.user || null;
      state.features = data.features || [];
      state.connected = true;
      if (state.org) applyBranding(state.org.branding);
      if (!state.org && !state.user) { renderSignedOut(); return; }
      showShell();
    }).catch(function (err) {
      bootError(err && err.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

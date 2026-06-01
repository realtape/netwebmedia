/* =============================================================================
   NetWebMedia OS — onboarding wizard (Phase 1 secondary page)
   4 steps: (1) branding kit, (2) custom domain, (3) connectors, (4) agents.
   Vanilla JS, CSP-safe (external only, no inline handlers). Themes from whoami
   and degrades to a friendly empty state if the API isn't reachable.
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

  var STEPS = [
    { key: 'branding',   label: 'Branding' },
    { key: 'domain',     label: 'Domain' },
    { key: 'connectors', label: 'Connectors' },
    { key: 'agents',     label: 'Agents' }
  ];

  var state = {
    org: null,
    user: null,
    connected: false,
    current: 0,
    branding: { primary: '#010F3B', secondary: '#FF671F', display_name: '', logo_url: '' },
    domain: '',
    connectors: [],
    agents: [],            // catalog
    agentsOn: {}           // slug -> bool
  };

  // ---- theming -------------------------------------------------------------
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
  function liveTheme() {
    var root = document.documentElement.style;
    if (state.branding.primary)   root.setProperty('--nwm-primary', state.branding.primary);
    if (state.branding.secondary) root.setProperty('--nwm-secondary', state.branding.secondary);
  }

  // ---- stepper -------------------------------------------------------------
  function renderSteps() {
    var ol = el('ol', 'os-steps');
    STEPS.forEach(function (s, i) {
      var li = el('li', 'os-step');
      if (i === state.current) li.classList.add('is-active');
      if (i < state.current) li.classList.add('is-done');
      li.appendChild(el('span', 'os-step__dot', String(i + 1)));
      li.appendChild(el('span', 'os-step__label', s.label));
      if (i < STEPS.length - 1) li.appendChild(el('span', 'os-step__bar'));
      ol.appendChild(li);
    });
    return ol;
  }

  // ---- step bodies ---------------------------------------------------------
  function stepBranding() {
    var panel = el('div', 'os-wizard__panel is-active');
    panel.appendChild(el('h2', 'os-section__title', 'Brand your workspace'));
    panel.appendChild(el('p', 'os-section__sub', 'Your logo and colors apply across the OS, agent emails, and client-facing views.'));

    // Display name
    var f1 = el('div', 'os-field');
    f1.appendChild(labelFor('Display name', 'obName'));
    var name = el('input', 'os-input'); name.id = 'obName'; name.type = 'text';
    name.placeholder = 'Acme Growth Studio';
    name.value = state.branding.display_name || '';
    name.addEventListener('input', function () { state.branding.display_name = name.value; });
    f1.appendChild(name);
    panel.appendChild(f1);

    // Logo upload
    var f2 = el('div', 'os-field');
    f2.appendChild(el('label', 'os-field__label', 'Logo'));
    var pick = el('div', 'os-logo-pick');
    var prev = el('div', 'os-logo-preview');
    prev.id = 'obLogoPrev';
    paintLogoPreview(prev);
    pick.appendChild(prev);

    var pickRight = el('div');
    var file = el('input'); file.type = 'file'; file.id = 'obLogo';
    file.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
    file.style.display = 'none';
    var btn = el('button', 'os-btn os-btn--ghost os-btn--sm', 'Upload logo');
    btn.type = 'button';
    btn.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () { uploadLogo(file, prev); });
    pickRight.appendChild(btn);
    pickRight.appendChild(file);
    var hint = el('p', 'os-field__hint', 'PNG, SVG, JPG or WebP. A dark-on-light mark works best.');
    pickRight.appendChild(hint);
    var up = el('p', 'os-field__hint'); up.id = 'obLogoMsg';
    pickRight.appendChild(up);
    pick.appendChild(pickRight);
    f2.appendChild(pick);
    panel.appendChild(f2);

    // Colors
    var row = el('div', 'os-row');
    row.appendChild(colorField('Primary color', 'obPrimary', state.branding.primary, function (v) {
      state.branding.primary = v; liveTheme();
    }));
    row.appendChild(colorField('Accent color', 'obSecondary', state.branding.secondary, function (v) {
      state.branding.secondary = v; liveTheme();
    }));
    panel.appendChild(row);

    return panel;
  }

  function paintLogoPreview(prev) {
    prev.textContent = '';
    if (state.branding.logo_url) {
      var img = el('img'); img.alt = 'Logo preview';
      img.src = state.branding.logo_url;
      img.onerror = function () { prev.textContent = ''; prev.appendChild(el('span', 'os-logo-preview__ph', 'Logo')); };
      prev.appendChild(img);
    } else {
      prev.appendChild(el('span', 'os-logo-preview__ph', 'No logo yet'));
    }
  }

  function uploadLogo(fileInput, prev) {
    var f = fileInput.files && fileInput.files[0];
    var msg = $('obLogoMsg');
    if (!f) return;
    msg.textContent = 'Uploading…'; msg.className = 'os-field__hint';
    var fd = new FormData();
    fd.append('file', f);
    fd.append('kind', 'logo_dark');
    fetch('/crm/api/?r=branding_asset', { method: 'POST', body: fd, credentials: 'include' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
          return data;
        });
      })
      .then(function (data) {
        var url = data && data.asset && data.asset.url;
        if (url) {
          state.branding.logo_url = url;
          paintLogoPreview(prev);
          // Reflect in the top bar immediately.
          var logo = $('osLogo'); logo.src = url; logo.hidden = false;
          msg.textContent = 'Logo uploaded.';
        } else {
          msg.textContent = 'Upload finished but no URL was returned.';
        }
      })
      .catch(function (err) {
        msg.className = 'os-field__hint';
        msg.textContent = 'Upload unavailable right now (' + esc(err && err.message) + '). You can add a logo later in Settings.';
      });
  }

  function stepDomain() {
    var panel = el('div', 'os-wizard__panel is-active');
    panel.appendChild(el('h2', 'os-section__title', 'Custom domain (optional)'));
    panel.appendChild(el('p', 'os-section__sub', 'Use your own domain for the client-facing workspace. You can skip this and use your free subdomain.'));

    var sub = (state.org && state.org.branding && state.org.branding.subdomain) || 'your-agency';
    var note = el('div', 'os-banner');
    note.appendChild(document.createTextNode('Your workspace is already live at '));
    var strong = el('strong', null, sub + '.netwebmedia.com');
    note.appendChild(strong);
    note.appendChild(document.createTextNode('. Adding a custom domain is optional.'));
    panel.appendChild(note);

    var f = el('div', 'os-field');
    f.appendChild(labelFor('Your domain', 'obDomain'));
    var inp = el('input', 'os-input'); inp.id = 'obDomain'; inp.type = 'text';
    inp.placeholder = 'app.youragency.com';
    inp.value = state.domain || '';
    inp.addEventListener('input', function () { state.domain = inp.value.trim(); renderDns(); });
    f.appendChild(inp);
    f.appendChild(el('p', 'os-field__hint', 'Enter a subdomain you control (e.g. app.youragency.com), then add the DNS record below.'));
    panel.appendChild(f);

    var dnsWrap = el('div', 'os-section');
    dnsWrap.id = 'obDns';
    panel.appendChild(dnsWrap);
    // initial render
    setTimeout(renderDns, 0);
    return panel;

    function renderDns() {
      var host = state.domain || 'app.youragency.com';
      var label = host.split('.')[0] || 'app';
      var box = $('obDns');
      if (!box) return;
      box.textContent = '';
      box.appendChild(el('h3', 'os-section__title', 'DNS instructions'));
      box.appendChild(el('p', 'os-section__sub', 'Add this CNAME at your DNS provider, then we verify automatically.'));
      var code = el('pre', 'os-code',
        'Type    Name                 Value\n' +
        'CNAME   ' + pad(label, 18) + '   ' + sub + '.netwebmedia.com');
      box.appendChild(code);
      box.appendChild(el('p', 'os-field__hint', 'DNS changes can take up to 24 hours to propagate. SSL is issued automatically once the record resolves.'));
    }
  }

  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

  function stepConnectors() {
    var panel = el('div', 'os-wizard__panel is-active');
    panel.appendChild(el('h2', 'os-section__title', 'Connect your tools'));
    panel.appendChild(el('p', 'os-section__sub', 'Link the accounts your agents will work from. You can connect more later.'));

    var defs = connectorDefs();
    var list = el('div', 'os-list');
    defs.forEach(function (d) {
      var found = firstByProvider(state.connectors, d.provider);
      var connected = found && found.status === 'connected';
      var item = el('div', 'os-item');
      item.appendChild(iconBox(d.icon));
      var body = el('div', 'os-item__body');
      body.appendChild(el('p', 'os-item__title', d.label));
      body.appendChild(el('p', 'os-item__meta', connected
        ? ('Connected' + (found.account_label ? ' · ' + esc(found.account_label) : ''))
        : d.blurb));
      item.appendChild(body);
      var aside = el('div', 'os-item__aside');
      if (connected) {
        aside.appendChild(statusBadge('connected', 'Connected'));
      } else if (d.start) {
        var a = el('a', 'os-btn os-btn--sm', 'Connect');
        a.href = d.start;
        aside.appendChild(a);
      } else {
        aside.appendChild(statusBadge('pending', 'Soon'));
      }
      item.appendChild(aside);
      list.appendChild(item);
    });
    panel.appendChild(list);
    panel.appendChild(el('p', 'os-field__hint', 'Connectors open a secure OAuth flow in this tab. This step is optional.'));
    return panel;
  }

  function stepAgents() {
    var panel = el('div', 'os-wizard__panel is-active');
    panel.appendChild(el('h2', 'os-section__title', 'Activate your agents'));
    panel.appendChild(el('p', 'os-section__sub', 'Choose which AI roles are on for your workspace. You can change this anytime under Agents.'));

    if (!state.agents.length) {
      panel.appendChild(emptyState('Your agent roster will appear here once the workspace finishes provisioning.'));
      return panel;
    }

    var list = el('div', 'os-list');
    state.agents.forEach(function (a) {
      var on = !!state.agentsOn[a.slug];
      var item = el('div', 'os-item');
      item.appendChild(iconBox('✦'));
      var body = el('div', 'os-item__body');
      body.appendChild(el('p', 'os-item__title', a.label || a.slug));
      body.appendChild(el('p', 'os-item__meta', a.model ? ('Model: ' + esc(a.model)) : 'AI agent'));
      item.appendChild(body);
      var aside = el('div', 'os-item__aside');
      aside.appendChild(toggle(on, function (next) { state.agentsOn[a.slug] = next; }));
      item.appendChild(aside);
      list.appendChild(item);
    });
    panel.appendChild(list);
    return panel;
  }

  // ---- shared bits ---------------------------------------------------------
  function labelFor(text, forId) {
    var l = el('label', 'os-field__label', text);
    l.htmlFor = forId;
    return l;
  }
  function colorField(text, id, value, onChange) {
    var f = el('div', 'os-field');
    f.appendChild(labelFor(text, id));
    var wrap = el('div', 'os-color');
    var sw = el('input', 'os-color__swatch'); sw.type = 'color'; sw.value = value;
    var hex = el('input', 'os-input os-color__hex'); hex.id = id; hex.type = 'text'; hex.value = value;
    sw.addEventListener('input', function () { hex.value = sw.value.toUpperCase(); onChange(sw.value); });
    hex.addEventListener('input', function () {
      var v = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { sw.value = v; onChange(v); }
    });
    wrap.appendChild(sw); wrap.appendChild(hex);
    f.appendChild(wrap);
    return f;
  }
  function iconBox(ch) { var b = el('div', 'os-item__ico'); b.appendChild(el('span', null, ch)); return b; }
  function statusBadge(status, text) {
    return el('span', 'os-status os-status--' + status, text);
  }
  function emptyState(text) { return el('div', 'os-empty', text); }
  function toggle(checked, onChange) {
    var label = el('label', 'os-toggle');
    var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!checked;
    cb.addEventListener('change', function () { onChange(cb.checked); });
    label.appendChild(cb);
    label.appendChild(el('span', 'os-toggle__track'));
    return label;
  }
  function firstByProvider(arr, p) {
    for (var i = 0; i < (arr || []).length; i++) if (arr[i].provider === p) return arr[i];
    return null;
  }
  function connectorDefs() {
    return [
      { provider: 'google', label: 'Google (Gmail + Calendar)', icon: 'G', blurb: 'Sync mail and calendar for your agents.', start: '/crm/api/?r=oauth_google&action=start' },
      { provider: 'slack',  label: 'Slack',                     icon: 'S', blurb: 'Notify your team channel on key events.',  start: '/crm/api/?r=oauth_slack&action=start' }
    ];
  }

  // ---- wizard frame --------------------------------------------------------
  function render() {
    var host = $('osWizard');
    host.textContent = '';
    host.appendChild(renderSteps());

    var body;
    switch (STEPS[state.current].key) {
      case 'branding':   body = stepBranding(); break;
      case 'domain':     body = stepDomain(); break;
      case 'connectors': body = stepConnectors(); break;
      case 'agents':     body = stepAgents(); break;
    }
    host.appendChild(body);

    // nav
    var nav = el('div', 'os-wizard__nav');
    if (state.current > 0) {
      var back = el('button', 'os-btn os-btn--ghost', 'Back');
      back.type = 'button';
      back.addEventListener('click', function () { state.current--; render(); window.scrollTo(0, 0); });
      nav.appendChild(back);
    }
    nav.appendChild(el('div', 'os-spacer'));

    var msg = el('span', 'os-field__hint'); msg.id = 'obNavMsg';
    nav.appendChild(msg);

    var last = state.current === STEPS.length - 1;
    var next = el('button', 'os-btn', last ? 'Finish setup' : 'Continue');
    next.type = 'button';
    next.addEventListener('click', function () { advance(next); });
    nav.appendChild(next);
    host.appendChild(nav);
  }

  function advance(btn) {
    var last = state.current === STEPS.length - 1;
    if (state.current === 0) saveBranding();      // fire-and-forget persist of colors/name
    if (!last) { state.current++; render(); window.scrollTo(0, 0); return; }
    finish(btn);
  }

  function saveBranding() {
    if (!state.connected) return;
    NWMOS.request('os_branding', {
      method: 'POST',
      body: {
        display_name: state.branding.display_name,
        primary_color: state.branding.primary,
        secondary_color: state.branding.secondary
      }
    }).catch(function () { /* endpoint may not exist yet — colors still applied locally */ });
  }

  function finish(btn) {
    btn.disabled = true;
    var msg = $('obNavMsg');
    msg.textContent = 'Saving your agent selections…';
    var toggles = Object.keys(state.agentsOn).map(function (slug) {
      return NWMOS.request('os_agents', {
        method: 'POST',
        body: { action: 'toggle', slug: slug, on: !!state.agentsOn[slug] }
      }).catch(function () { return null; });
    });
    Promise.all(toggles).then(function () {
      window.location.href = '/os/';
    }).catch(function () {
      window.location.href = '/os/';
    });
  }

  // ---- boot ----------------------------------------------------------------
  function applyCatalog(cat) {
    state.agents = (cat && cat.agents) || [];
    state.agents.forEach(function (a) {
      if (!(a.slug in state.agentsOn)) state.agentsOn[a.slug] = !!a.default_on;
    });
  }

  function boot() {
    NWMOS.whoami().then(function (data) {
      state.org = data.org || null;
      state.user = data.user || null;
      state.connected = true;
      if (state.org && state.org.branding) {
        applyBranding(state.org.branding);
        if (state.org.branding.primary_color)   state.branding.primary   = state.org.branding.primary_color;
        if (state.org.branding.secondary_color) state.branding.secondary = state.org.branding.secondary_color;
        if (state.org.branding.logo_url)         state.branding.logo_url  = state.org.branding.logo_url;
        if (state.org.branding.custom_domain)    state.domain             = state.org.branding.custom_domain;
      }
      if (state.org) {
        state.branding.display_name = state.org.display_name || state.branding.display_name;
        $('osBrandName').textContent = state.org.display_name || 'NetWebMedia OS';
      }
      // Pull catalog + connectors in parallel; tolerate either 404'ing.
      return Promise.all([loadCatalog(), loadConnectors()]);
    }).then(function () {
      render();
    }).catch(function () {
      // API unreachable — still render the wizard so it's inspectable/usable offline.
      state.connected = false;
      render();
    });
  }

  function loadCatalog() {
    return fetchJson('/crm/api/?r=agent_run&action=catalog')
      .then(function (cat) { applyCatalog(cat); })
      .catch(function () { /* leave agents empty -> friendly step */ });
  }
  function loadConnectors() {
    return NWMOS.request('os_connectors')
      .then(function (d) { state.connectors = (d && d.connectors) || []; })
      .catch(function () { state.connectors = []; });
  }
  // action-bearing GETs aren't expressible via NWMOS.request(resource,{id}) cleanly,
  // so use a small direct helper that keeps the same auth contract.
  function fetchJson(url) {
    var headers = { 'Accept': 'application/json' };
    try { var t = localStorage.getItem('nwm_token'); if (t) headers['X-Auth-Token'] = t; } catch (e) {}
    return fetch(url, { headers: headers, credentials: 'include' }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
        return data;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();

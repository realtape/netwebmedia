/* =============================================================================
   NetWebMedia OS — settings page (Phase 1 secondary page)
   Org settings: display name, branding colors, subdomain (read-only), members
   (read-only placeholder). Saves branding via POST ?r=os_branding (tolerant if
   the endpoint isn't shipped yet — colors still apply locally). CSP-safe.
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

  var state = {
    org: null, user: null, connected: false,
    form: { display_name: '', primary: '#010F3B', secondary: '#FF671F' }
  };

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
    if (state.form.primary)   root.setProperty('--nwm-primary', state.form.primary);
    if (state.form.secondary) root.setProperty('--nwm-secondary', state.form.secondary);
  }

  function labelFor(text, forId) { var l = el('label', 'os-field__label', text); l.htmlFor = forId; return l; }

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

  function render() {
    var host = $('osSettings');
    host.textContent = '';

    if (!state.connected) {
      host.appendChild(el('div', 'os-banner', 'Preview mode — settings are blank because the OS API isn’t reachable from here. On production this reads /crm/api/?r=whoami.'));
    }

    var branding = (state.org && state.org.branding) || {};

    // ---- Organization section ----
    var orgSec = el('div', 'os-card');
    orgSec.appendChild(el('h2', 'os-section__title', 'Organization'));
    orgSec.appendChild(el('p', 'os-section__sub', 'Branding here flows to the OS shell, agent emails and client-facing views.'));

    // display name
    var f1 = el('div', 'os-field');
    f1.appendChild(labelFor('Display name', 'setName'));
    var name = el('input', 'os-input'); name.id = 'setName'; name.type = 'text';
    name.placeholder = 'Your agency name';
    name.value = state.form.display_name || '';
    name.addEventListener('input', function () {
      state.form.display_name = name.value;
      $('osBrandName').textContent = name.value || 'NetWebMedia OS';
    });
    f1.appendChild(name);
    orgSec.appendChild(f1);

    // colors
    var row = el('div', 'os-row');
    row.appendChild(colorField('Primary color', 'setPrimary', state.form.primary, function (v) {
      state.form.primary = v; liveTheme();
    }));
    row.appendChild(colorField('Accent color', 'setSecondary', state.form.secondary, function (v) {
      state.form.secondary = v; liveTheme();
    }));
    orgSec.appendChild(row);

    // subdomain (read-only)
    var f2 = el('div', 'os-field');
    f2.appendChild(labelFor('Workspace subdomain', 'setSub'));
    var sub = el('input', 'os-input'); sub.id = 'setSub'; sub.type = 'text'; sub.readOnly = true;
    var subVal = branding.subdomain ? (branding.subdomain + '.netwebmedia.com') : '';
    sub.value = subVal;
    sub.placeholder = 'your-agency.netwebmedia.com';
    f2.appendChild(sub);
    f2.appendChild(el('p', 'os-field__hint', 'Your subdomain is set at provisioning. To use a custom domain, see Onboarding → Domain.'));
    orgSec.appendChild(f2);

    // custom domain (read-only display of current value, if any)
    if (branding.custom_domain) {
      var f3 = el('div', 'os-field');
      f3.appendChild(labelFor('Custom domain', 'setDomain'));
      var dom = el('input', 'os-input'); dom.id = 'setDomain'; dom.type = 'text'; dom.readOnly = true;
      dom.value = branding.custom_domain;
      f3.appendChild(dom);
      orgSec.appendChild(f3);
    }

    // save
    var actions = el('div', 'os-row');
    var save = el('button', 'os-btn', 'Save changes');
    save.type = 'button';
    save.addEventListener('click', function () { saveSettings(save); });
    actions.appendChild(save);
    var msg = el('span', 'os-note'); msg.id = 'osMsg'; msg.style.display = 'none';
    orgSec.appendChild(actions);
    orgSec.appendChild(msg);
    host.appendChild(orgSec);

    // ---- Plan summary (read-only) ----
    var planSec = el('div', 'os-card os-section');
    planSec.appendChild(el('h2', 'os-section__title', 'Plan'));
    var planRow = el('div', 'os-row');
    planRow.appendChild(el('p', 'os-muted',
      (state.org && state.org.os_plan)
        ? ('Current plan: ' + esc(state.org.os_plan))
        : 'No active OS plan.'));
    planRow.appendChild(el('div', 'os-spacer'));
    var billLink = el('a', 'os-btn os-btn--ghost os-btn--sm', 'Manage billing');
    billLink.href = '/os/billing.html';
    planRow.appendChild(billLink);
    planSec.appendChild(planRow);
    host.appendChild(planSec);

    // ---- Members (read-only placeholder) ----
    var memSec = el('div', 'os-section');
    memSec.appendChild(el('h2', 'os-section__title', 'Members'));
    memSec.appendChild(el('p', 'os-section__sub', 'People with access to this workspace. Inviting teammates ships in a later phase.'));
    host.appendChild(memSec);
    host.appendChild(membersTable());
  }

  function membersTable() {
    var wrap = el('div', 'os-table-wrap');
    var table = el('table', 'os-table');
    var thead = el('thead');
    var hr = el('tr');
    ['Name', 'Email', 'Role'].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    // Contract returns a single user on whoami; show that as the seed member.
    if (state.user) {
      var tr = el('tr');
      tr.appendChild(el('td', null, state.user.name || '—'));
      tr.appendChild(el('td', null, state.user.email || '—'));
      var roleTd = el('td');
      var role = state.user.role || (state.org && state.org.role) || 'member';
      roleTd.appendChild(el('span', 'os-status os-status--active', titleize(role)));
      tr.appendChild(roleTd);
      tbody.appendChild(tr);
    } else {
      var tr0 = el('tr');
      var td0 = el('td', null, 'Members load from the OS API on production.');
      td0.colSpan = 3; td0.className = 'os-muted';
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function titleize(s) {
    s = esc(s).replace(/[_-]+/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function note(text, kind) {
    var m = $('osMsg');
    if (!m) return;
    m.textContent = text;
    m.className = 'os-note os-note--' + (kind || 'ok');
    m.style.display = 'block';
  }

  function saveSettings(btn) {
    btn.disabled = true;
    note('Saving…', 'ok');
    NWMOS.request('os_branding', {
      method: 'POST',
      body: {
        display_name: state.form.display_name,
        primary_color: state.form.primary,
        secondary_color: state.form.secondary
      }
    }).then(function () {
      btn.disabled = false;
      note('Settings saved.', 'ok');
    }).catch(function (err) {
      btn.disabled = false;
      // Colors/name already applied to the live shell; persistence just isn't wired.
      note('Saved locally — server save unavailable right now (' + esc(err && err.message) + ').', 'err');
    });
  }

  function boot() {
    NWMOS.whoami().then(function (data) {
      state.org = data.org || null;
      state.user = data.user || null;
      state.connected = true;
      if (state.org) {
        applyBranding(state.org.branding);
        $('osBrandName').textContent = state.org.display_name || 'NetWebMedia OS';
        state.form.display_name = state.org.display_name || '';
        var b = state.org.branding || {};
        if (b.primary_color)   state.form.primary   = b.primary_color;
        if (b.secondary_color) state.form.secondary = b.secondary_color;
      }
      render();
    }).catch(function () {
      state.connected = false;
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();

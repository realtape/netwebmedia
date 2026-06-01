/* =============================================================================
   NetWebMedia OS — agents page (Phase 1 secondary page)
   Grid of the agent roster with on/off toggles + a monthly token-budget bar.
   Catalog + budget: GET ?r=agent_run&action=catalog
   Toggle:           POST ?r=os_agents {action:'toggle',slug,on}
   Enabled set comes from whoami.org / os_agents toggle response. CSP-safe.
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
    org: null, connected: false,
    agents: [],
    budget: null,
    enabled: {}     // slug -> bool
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

  // ---- budget meter --------------------------------------------------------
  function renderBudget() {
    var host = $('osBudget');
    host.textContent = '';
    var b = state.budget;
    if (!b) {
      if (!state.connected) {
        host.appendChild(el('div', 'os-banner', 'Preview mode — token usage is blank because the OS API isn’t reachable from here.'));
      }
      return;
    }
    var monthly = Number(b.monthly_tokens) || 0;
    var used = Number(b.used_tokens) || 0;
    var pct = monthly > 0 ? Math.min(100, Math.round((used / monthly) * 100)) : 0;

    var card = el('div', 'os-card');
    card.appendChild(el('p', 'os-card__label', 'Agent token budget · this month'));

    var meter = el('div', 'os-meter');
    var bar = el('div', 'os-meter__bar');
    var fill = el('div', 'os-meter__fill');
    fill.style.width = pct + '%';
    if (pct >= 100) fill.classList.add('is-over');
    else if (pct >= 80) fill.classList.add('is-warn');
    bar.appendChild(fill);
    meter.appendChild(bar);

    var lbl = el('div', 'os-meter__label');
    lbl.appendChild(el('span', null, fmtTokens(used) + ' of ' + (monthly ? fmtTokens(monthly) : '∞') + ' tokens'));
    var right = pct + '% used';
    if (b.used_usd_cents != null) right += ' · ' + fmtUsd(b.used_usd_cents);
    lbl.appendChild(el('span', null, right));
    meter.appendChild(lbl);

    card.appendChild(meter);
    host.appendChild(card);
  }

  function fmtTokens(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function fmtUsd(cents) {
    var v = (Number(cents) || 0) / 100;
    return '$' + v.toFixed(2);
  }

  // ---- agent grid ----------------------------------------------------------
  function renderAgents() {
    var host = $('osAgents');
    host.textContent = '';

    var sec = el('div', 'os-section');
    sec.appendChild(el('h2', 'os-section__title', 'Your roster'));
    sec.appendChild(el('p', 'os-section__sub', 'Active agents can be summoned from the command bar and run automations.'));
    host.appendChild(sec);

    if (!state.agents.length) {
      host.appendChild(el('div', 'os-empty', state.connected
        ? 'No agents are available on this plan yet.'
        : 'Your agent roster loads from the OS API. It will appear here on production.'));
      return;
    }

    var grid = el('div', 'os-agent-grid');
    state.agents.forEach(function (a) {
      var on = state.enabled[a.slug] != null ? state.enabled[a.slug] : !!a.default_on;
      var card = el('div', 'os-agent');

      var head = el('div', 'os-agent__head');
      var ico = el('div', 'os-item__ico'); ico.appendChild(el('span', null, '✦'));
      head.appendChild(ico);
      var titles = el('div'); titles.style.flex = '1 1 auto';
      titles.appendChild(el('p', 'os-agent__name', a.label || a.slug));
      titles.appendChild(el('p', 'os-agent__model', a.model ? ('Model: ' + esc(a.model)) : 'AI agent'));
      head.appendChild(titles);
      head.appendChild(toggle(on, a.slug));
      card.appendChild(head);

      if (a.skills && a.skills.length) {
        var skills = el('div', 'os-agent__skills');
        a.skills.slice(0, 6).forEach(function (s) {
          skills.appendChild(el('span', 'os-chip', s.label || s.slug));
        });
        if (a.skills.length > 6) skills.appendChild(el('span', 'os-chip', '+' + (a.skills.length - 6)));
        card.appendChild(skills);
      }
      grid.appendChild(card);
    });
    host.appendChild(grid);

    var msg = el('p', 'os-note'); msg.id = 'osMsg'; msg.style.display = 'none';
    host.appendChild(msg);
  }

  function toggle(checked, slug) {
    var label = el('label', 'os-toggle');
    var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!checked;
    cb.addEventListener('change', function () { onToggle(slug, cb); });
    label.appendChild(cb);
    label.appendChild(el('span', 'os-toggle__track'));
    return label;
  }

  function onToggle(slug, cb) {
    var want = cb.checked;
    cb.disabled = true;
    NWMOS.request('os_agents', { method: 'POST', body: { action: 'toggle', slug: slug, on: want } })
      .then(function (res) {
        // Authoritative enabled set comes back from the server when present.
        if (res && Array.isArray(res.enabled)) {
          state.enabled = {};
          res.enabled.forEach(function (s) { state.enabled[s] = true; });
        } else {
          state.enabled[slug] = want;
        }
        cb.disabled = false;
        note((want ? 'Enabled ' : 'Disabled ') + slug + '.', 'ok');
      })
      .catch(function (err) {
        cb.checked = !want;       // revert
        cb.disabled = false;
        note('Could not update ' + slug + ' (' + esc(err && err.message) + ').', 'err');
      });
  }

  function note(text, kind) {
    var m = $('osMsg');
    if (!m) return;
    m.textContent = text;
    m.className = 'os-note os-note--' + (kind || 'ok');
    m.style.display = 'block';
  }

  // ---- boot ----------------------------------------------------------------
  function seedEnabledFromOrg() {
    // whoami doesn't return the enabled agent list directly in the contract,
    // so we lean on each agent's default_on until a toggle response refines it.
    state.agents.forEach(function (a) {
      if (!(a.slug in state.enabled)) state.enabled[a.slug] = !!a.default_on;
    });
  }

  function boot() {
    NWMOS.whoami().then(function (data) {
      state.org = data.org || null;
      state.connected = true;
      if (state.org) {
        applyBranding(state.org.branding);
        $('osBrandName').textContent = state.org.display_name || 'NetWebMedia OS';
      }
      return fetchJson('/crm/api/?r=agent_run&action=catalog')
        .then(function (cat) {
          state.agents = (cat && cat.agents) || [];
          state.budget = (cat && cat.budget) || null;
          seedEnabledFromOrg();
        })
        .catch(function () { state.agents = []; state.budget = null; })
        .then(function () { renderBudget(); renderAgents(); });
    }).catch(function () {
      state.connected = false;
      renderBudget(); renderAgents();
    });
  }

  // Action-bearing GET: ?r=agent_run&action=catalog. NWMOS.request only appends
  // &id=, so use a direct fetch that preserves the same auth contract.
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

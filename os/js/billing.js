/* =============================================================================
   NetWebMedia OS — billing page (Phase 1 secondary page)
   Plan card, token budget, invoice table, "Manage payment" (portal_url) and
   "Subscribe / Checkout" (POST ?r=os_billing {action:'checkout'} -> checkout_url).
   GET ?r=os_billing -> {plan, billing_status, agent_token_budget_monthly,
                         price_monthly_usd, invoices:[...], portal_url}
   CSP-safe; friendly empty state when the API is unreachable.
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

  var state = { org: null, connected: false, billing: null };

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

  function money(usd) {
    var n = Number(usd);
    if (!isFinite(n)) return esc(usd);
    return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtTokens(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return esc(s);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function titleize(s) {
    s = esc(s).replace(/[_-]+/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function render() {
    var host = $('osBilling');
    host.textContent = '';

    if (!state.connected) {
      host.appendChild(el('div', 'os-banner', 'Preview mode — billing details are blank because the OS API isn’t reachable from here. On production this reads /crm/api/?r=os_billing.'));
    }

    var b = state.billing || {};
    var grid = el('div', 'os-billing-grid');

    // ---- plan card ----
    var plan = el('div', 'os-plan');
    plan.appendChild(el('p', 'os-plan__name', titleize(b.plan) || 'CMO Premium'));
    var price = el('p', 'os-plan__price');
    var amt = (b.price_monthly_usd != null) ? b.price_monthly_usd : 2490;
    price.appendChild(document.createTextNode(money(amt)));
    var per = el('small', null, ' / month');
    price.appendChild(per);
    plan.appendChild(price);
    if (b.billing_status) {
      plan.appendChild(el('span', 'os-plan__status', titleize(b.billing_status)));
    }

    var actions = el('div', 'os-plan__actions');
    var status = (b.billing_status || '').toLowerCase();
    var active = status === 'active' || status === 'paid' || status === 'trialing';
    if (active && b.portal_url) {
      var manage = el('a', 'os-btn os-btn--ghost', 'Manage payment');
      manage.href = b.portal_url; manage.rel = 'noopener';
      actions.appendChild(manage);
    } else {
      var sub = el('button', 'os-btn', active ? 'Update subscription' : 'Subscribe');
      sub.type = 'button';
      sub.addEventListener('click', function () { checkout(sub); });
      actions.appendChild(sub);
      if (b.portal_url) {
        var m2 = el('a', 'os-btn os-btn--ghost', 'Manage payment');
        m2.href = b.portal_url; m2.rel = 'noopener';
        actions.appendChild(m2);
      }
    }
    plan.appendChild(actions);
    grid.appendChild(plan);

    // ---- token budget card ----
    var budget = el('div', 'os-card');
    budget.appendChild(el('p', 'os-card__label', 'Monthly agent token budget'));
    var monthly = Number(b.agent_token_budget_monthly) || 0;
    budget.appendChild(el('p', 'os-card__value', monthly ? fmtTokens(monthly) : '—'));
    budget.appendChild(el('p', 'os-card__hint', monthly
      ? 'Resets at the start of each billing cycle. Track live usage on the Agents page.'
      : 'Your token budget appears once billing is active.'));
    grid.appendChild(budget);

    host.appendChild(grid);

    // ---- invoices ----
    var sec = el('div', 'os-section');
    sec.appendChild(el('h2', 'os-section__title', 'Invoices'));
    host.appendChild(sec);

    var invoices = (b.invoices || []);
    if (!invoices.length) {
      host.appendChild(el('div', 'os-empty', state.connected
        ? 'No invoices yet. They’ll show here after your first billing cycle.'
        : 'Invoice history loads from the OS API on production.'));
    } else {
      host.appendChild(invoiceTable(invoices));
    }

    var msg = el('p', 'os-note'); msg.id = 'osMsg'; msg.style.display = 'none';
    host.appendChild(msg);
  }

  function invoiceTable(invoices) {
    var wrap = el('div', 'os-table-wrap');
    var table = el('table', 'os-table');
    var thead = el('thead');
    var hr = el('tr');
    ['Date', 'Amount', 'Status', ''].forEach(function (h, i) {
      var th = el('th', i === 1 ? 'os-table__num' : (i === 3 ? 'os-table__actions' : null), h);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    invoices.forEach(function (inv) {
      var tr = el('tr');
      tr.appendChild(el('td', null, fmtDate(inv.date)));
      tr.appendChild(el('td', 'os-table__num', money(inv.amount_usd)));
      var st = el('td');
      st.appendChild(el('span', 'os-status os-status--' + (inv.status || 'open'), titleize(inv.status) || 'Open'));
      tr.appendChild(st);
      var act = el('td', 'os-table__actions');
      if (inv.url) {
        var a = el('a', 'os-btn--link', 'View');
        a.href = inv.url; a.rel = 'noopener'; a.target = '_blank';
        act.appendChild(a);
      }
      tr.appendChild(act);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function note(text, kind) {
    var m = $('osMsg');
    if (!m) return;
    m.textContent = text;
    m.className = 'os-note os-note--' + (kind || 'ok');
    m.style.display = 'block';
  }

  function checkout(btn) {
    btn.disabled = true;
    note('Opening secure checkout…', 'ok');
    NWMOS.request('os_billing', { method: 'POST', body: { action: 'checkout' } })
      .then(function (res) {
        var url = res && res.checkout_url;
        if (url) { window.location.href = url; }
        else { btn.disabled = false; note('Checkout did not return a URL.', 'err'); }
      })
      .catch(function (err) {
        btn.disabled = false;
        note('Could not start checkout (' + esc(err && err.message) + ').', 'err');
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
      return NWMOS.request('os_billing')
        .then(function (d) { state.billing = d || null; })
        .catch(function () { state.billing = null; })
        .then(render);
    }).catch(function () {
      state.connected = false;
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();

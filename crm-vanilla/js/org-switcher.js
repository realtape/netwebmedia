/* NetWebMedia CRM — Org Switcher
 * Renders a small dropdown into a host element (typically the page-header
 * .header-right area). Fetches the orgs the current user is a member of,
 * highlights the currently-active org, switches context on click, and
 * surfaces a "Manage sub-accounts" link for master-org owners.
 *
 * Public API: window.nwmOrgSwitcher = { mount, refresh, open, close, getCurrent }
 *
 * Defensive: every fetch is try/catch'd. If the API is unreachable, the
 * dropdown gracefully hides itself instead of breaking the page.
 */
(function () {
  "use strict";

  var CACHE_KEY = "nwm_orgs";
  var CACHE_TTL_MS = 60 * 1000;
  var state = {
    host: null,        // element we render into
    orgs: [],          // list of orgs
    current: null,     // active org (best-effort)
    isMasterOwner: false,
    open: false,
    rendered: false
  };

  // ── utilities ────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || (Date.now() - parsed.ts) > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (_) { return null; }
  }
  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); }
    catch (_) {}
  }
  function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  }

  // ── data ─────────────────────────────────────────────────────────────────
  function fetchOrgs(forceFresh) {
    if (!forceFresh) {
      var cached = readCache();
      if (cached) return Promise.resolve(cached);
    }
    return fetch("/api/?r=organizations", { credentials: "include" })
      .then(function (r) {
        if (!r.ok) throw new Error("orgs HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        var orgs = (json && json.organizations) || [];
        writeCache(orgs);
        return orgs;
      });
  }

  function detectMasterOwner(orgs) {
    // The API returns ALL orgs (unfiltered) for master owners — those rows
    // include member_count and exclude my_role. Non-masters get my_role.
    // We treat presence of member_count on any row as the signal.
    if (!orgs || !orgs.length) return false;
    for (var i = 0; i < orgs.length; i++) {
      if (typeof orgs[i].member_count !== "undefined") return true;
      if (Number(orgs[i].id) === 1 && orgs[i].my_role === "owner") return true;
    }
    return false;
  }

  function detectCurrent(orgs) {
    // Heuristic: prefer ?org=<slug> URL hint, then is_primary, then first.
    var qs = (typeof URLSearchParams === "function") ? new URLSearchParams(location.search) : null;
    var slug = qs ? qs.get("org") : null;
    if (slug) {
      for (var i = 0; i < orgs.length; i++) if (orgs[i].slug === slug) return orgs[i];
    }
    for (var j = 0; j < orgs.length; j++) {
      if (orgs[j].is_primary == 1 || orgs[j].is_primary === true) return orgs[j];
    }
    return orgs[0] || null;
  }

  // ── rendering ────────────────────────────────────────────────────────────
  function injectStylesOnce() {
    if (document.getElementById("nwm-org-switcher-styles")) return;
    var css = document.createElement("style");
    css.id = "nwm-org-switcher-styles";
    css.textContent = [
      ".nwm-org-switcher{position:relative;display:inline-block;}",
      ".nwm-org-trigger{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 12px;background:transparent;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font:600 12px Inter,sans-serif;cursor:pointer;max-width:220px;}",
      ".nwm-org-trigger:hover{border-color:var(--border-light);}",
      ".nwm-org-trigger .label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".nwm-org-trigger .caret{opacity:.7;font-size:10px;}",
      ".nwm-org-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:280px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 12px 32px rgba(0,0,0,.35);z-index:200;padding:6px;display:none;}",
      ".nwm-org-menu.open{display:block;}",
      ".nwm-org-menu .head{padding:8px 10px;font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;}",
      ".nwm-org-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;color:var(--text);}",
      ".nwm-org-item:hover{background:var(--bg-card-hover);}",
      ".nwm-org-item.active{background:var(--accent-dim);color:var(--accent);}",
      ".nwm-org-item .badge{margin-left:auto;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-dim);}",
      ".nwm-org-item .swatch{width:18px;height:18px;border-radius:4px;background:var(--accent);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;}",
      ".nwm-org-item .meta{display:flex;flex-direction:column;gap:1px;min-width:0;}",
      ".nwm-org-item .meta .name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;}",
      ".nwm-org-item .meta .slug{font-size:11px;color:var(--text-dim);}",
      ".nwm-org-divider{height:1px;background:var(--border);margin:6px 0;}",
      ".nwm-org-foot{padding:6px;}",
      ".nwm-org-foot a{display:block;padding:8px 10px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;color:var(--accent);}",
      ".nwm-org-foot a:hover{background:var(--accent-dim);}"
    ].join("");
    document.head.appendChild(css);
  }

  function initials(name) {
    return String(name || "?").split(/\s+/).map(function (w) { return w.charAt(0).toUpperCase(); })
      .join("").substring(0, 2);
  }

  function render() {
    if (!state.host) return;
    injectStylesOnce();

    var current = state.current;
    var label = current ? (current.display_name || current.slug || "Org") : "Switch org";
    var swatch = current && current.branding_primary_color ? current.branding_primary_color : null;

    var html = '<div class="nwm-org-switcher" id="nwmOrgSwitcherRoot">';
    html += '<button type="button" class="nwm-org-trigger" id="nwmOrgTrigger" aria-haspopup="listbox" aria-expanded="' + (state.open ? "true" : "false") + '">';
    html += '<span class="swatch" style="width:16px;height:16px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;background:' + (swatch || "var(--accent)") + ';">' + esc(initials(label)) + '</span>';
    html += '<span class="label">' + esc(label) + '</span>';
    html += '<span class="caret">▾</span>';
    html += '</button>';
    html += '<div class="nwm-org-menu' + (state.open ? " open" : "") + '" id="nwmOrgMenu" role="listbox">';
    html += '<div class="head">Your organizations</div>';

    if (!state.orgs.length) {
      html += '<div class="nwm-org-item" style="opacity:.6;cursor:default;">No organizations</div>';
    } else {
      for (var i = 0; i < state.orgs.length; i++) {
        var o = state.orgs[i];
        var isActive = current && current.id === o.id;
        var color = o.branding_primary_color || "var(--accent)";
        var planLabel = (o.plan || "").charAt(0).toUpperCase() + (o.plan || "").slice(1);
        html += '<div class="nwm-org-item' + (isActive ? " active" : "") + '" data-id="' + esc(o.id) + '" data-slug="' + esc(o.slug) + '" role="option">';
        html += '<span class="swatch" style="background:' + esc(color) + ';">' + esc(initials(o.display_name || o.slug)) + '</span>';
        html += '<span class="meta"><span class="name">' + esc(o.display_name || o.slug) + '</span>';
        html += '<span class="slug">' + esc(o.slug) + '</span></span>';
        html += '<span class="badge">' + esc(planLabel) + '</span>';
        html += '</div>';
      }
    }

    if (state.isMasterOwner) {
      html += '<div class="nwm-org-divider"></div>';
      html += '<div class="nwm-org-foot"><a href="/crm-vanilla/subaccounts.html">Manage sub-accounts →</a></div>';
    }
    html += '</div></div>';

    state.host.innerHTML = html;
    state.rendered = true;

    var trigger = document.getElementById("nwmOrgTrigger");
    if (trigger) trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    var menu = document.getElementById("nwmOrgMenu");
    if (menu) {
      menu.addEventListener("click", function (e) {
        var item = e.target.closest(".nwm-org-item");
        if (!item || !item.getAttribute("data-id")) return;
        var id = parseInt(item.getAttribute("data-id"), 10);
        if (!id) return;
        switchOrg(id);
      });
    }
  }

  function toggleMenu() { state.open ? close() : open(); }

  function open() {
    state.open = true;
    var menu = document.getElementById("nwmOrgMenu");
    var trig = document.getElementById("nwmOrgTrigger");
    if (menu) menu.classList.add("open");
    if (trig) trig.setAttribute("aria-expanded", "true");
  }
  function close() {
    state.open = false;
    var menu = document.getElementById("nwmOrgMenu");
    var trig = document.getElementById("nwmOrgTrigger");
    if (menu) menu.classList.remove("open");
    if (trig) trig.setAttribute("aria-expanded", "false");
  }

  // ── actions ──────────────────────────────────────────────────────────────
  function switchOrg(orgId) {
    var trig = document.getElementById("nwmOrgTrigger");
    if (trig) trig.disabled = true;
    fetch("/api/?r=organizations&sub=switch", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: orgId })
    }).then(function (r) {
      if (!r.ok) throw new Error("switch HTTP " + r.status);
      clearCache();
      // Drop ?org= hint from URL so the server-set session controls scope.
      try {
        var url = new URL(location.href);
        url.searchParams.delete("org");
        history.replaceState({}, "", url.toString());
      } catch (_) {}
      location.reload();
    }).catch(function (err) {
      if (trig) trig.disabled = false;
      console.error("[org-switcher] switch failed", err);
      alert("Could not switch organization. Please try again.");
    });
  }

  function load(forceFresh) {
    return fetchOrgs(!!forceFresh).then(function (orgs) {
      state.orgs = orgs || [];
      state.isMasterOwner = detectMasterOwner(state.orgs);
      state.current = detectCurrent(state.orgs);
      // Hide entirely if user has 0 or 1 orgs AND is not master owner.
      if (!state.orgs.length || (state.orgs.length === 1 && !state.isMasterOwner)) {
        if (state.host) state.host.innerHTML = "";
        return;
      }
      render();
    }).catch(function (err) {
      console.warn("[org-switcher] hidden — orgs API unavailable", err);
      if (state.host) state.host.innerHTML = "";
    });
  }

  function mount(host) {
    if (!host) return;
    state.host = host;
    // Outside-click handler (registered once)
    if (!mount._wired) {
      document.addEventListener("click", function (e) {
        if (!state.open) return;
        var root = document.getElementById("nwmOrgSwitcherRoot");
        if (root && !root.contains(e.target)) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && state.open) close();
      });
      mount._wired = true;
    }
    return load(false);
  }

  window.nwmOrgSwitcher = {
    mount: mount,
    refresh: function () { return load(true); },
    open: open,
    close: close,
    getCurrent: function () { return state.current; },
    isMasterOwner: function () { return state.isMasterOwner; }
  };
})();

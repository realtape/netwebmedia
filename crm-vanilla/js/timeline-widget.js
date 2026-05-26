/* Activity Timeline widget — reusable mountable feed.
   Backed by /api/timeline (api-php/routes/timeline.php).

   Usage:
     NWMTimeline.mount('#myContainer', { contactId: 42 });
     NWMTimeline.mount('#dealPanel',  { dealId: 17, types: ['task','email','deal'] });

   Renders a vertical activity feed with kind icons and natural-language summaries.
*/
(function (w) {
  "use strict";

  function api(url) {
    var headers = { "Accept": "application/json" };
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(url, { headers: headers, credentials: "include" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  function relTime(iso) {
    if (!iso) return "";
    var d = new Date(iso.replace(" ", "T"));
    if (isNaN(d.getTime())) return iso;
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return Math.max(1, Math.floor(diff)) + "s ago";
    if (diff < 3600)      return Math.floor(diff / 60) + "m ago";
    if (diff < 86400)     return Math.floor(diff / 3600) + "h ago";
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }

  var KIND_COLOR = {
    task:    "#0d9488",
    email:   "#2563eb",
    deal:    "#9333ea",
    contact: "#0369a1",
    note:    "#64748b",
    wa:      "#22c55e",
    call:    "#ea580c",
    sync:    "#a16207",
    lead:    "#FF671F",
    auth:    "#94a3b8",
    other:   "#64748b",
  };

  function ensureCss() {
    if (document.getElementById("nwm-timeline-css")) return;
    var s = document.createElement("style");
    s.id = "nwm-timeline-css";
    s.textContent = [
      ".nwm-tl{font:500 13px Inter,system-ui,sans-serif;color:#1a1a2e}",
      ".nwm-tl-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}",
      ".nwm-tl-head h4{margin:0;font:700 14px Inter;color:#010F3B;letter-spacing:.3px}",
      ".nwm-tl-filter{display:flex;gap:4px;flex-wrap:wrap}",
      ".nwm-tl-filter button{font:600 11px Inter;background:#f2f3f8;border:1px solid #e3e5ee;color:#1a1a2e;padding:4px 9px;border-radius:999px;cursor:pointer}",
      ".nwm-tl-filter button.on{background:#010F3B;color:#fff;border-color:#010F3B}",
      ".nwm-tl-list{position:relative;padding-left:18px}",
      ".nwm-tl-list:before{content:'';position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:#e3e5ee;border-radius:1px}",
      ".nwm-tl-evt{position:relative;padding:6px 0 12px;line-height:1.45}",
      ".nwm-tl-dot{position:absolute;left:-18px;top:9px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #FF671F;box-sizing:border-box}",
      ".nwm-tl-time{color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-left:6px}",
      ".nwm-tl-meta{color:#64748b;font-size:12px;margin-top:1px}",
      ".nwm-tl-kind{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:1px 6px;border-radius:4px;color:#fff;margin-right:6px}",
      ".nwm-tl-empty{color:#94a3b8;text-align:center;padding:18px 8px;font-size:12px}",
      ".nwm-tl-loading{color:#94a3b8;font-size:12px;padding:8px 0}",
      ".nwm-tl-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:12px}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function evtHtml(e) {
    var c = KIND_COLOR[e.kind] || KIND_COLOR.other;
    var summary = e.summary || e.action || "(no description)";
    return '<div class="nwm-tl-evt">' +
             '<div class="nwm-tl-dot" style="border-color:' + c + '"></div>' +
             '<div>' +
               '<span class="nwm-tl-kind" style="background:' + c + '">' + esc(e.kind) + '</span>' +
               esc(summary) +
               '<span class="nwm-tl-time">' + esc(relTime(e.ts)) + '</span>' +
             '</div>' +
           '</div>';
  }

  function mount(containerSelector, opts) {
    ensureCss();
    var el = typeof containerSelector === "string"
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!el) return null;
    opts = opts || {};

    var state = {
      events: [],
      activeKind: "",
      limit: opts.limit || 50,
    };

    el.classList.add("nwm-tl");
    el.innerHTML =
      '<div class="nwm-tl-head">' +
        '<h4>' + (opts.title || "Activity") + '</h4>' +
        '<div class="nwm-tl-filter" data-tl-filter></div>' +
      '</div>' +
      '<div class="nwm-tl-list" data-tl-list>' +
        '<div class="nwm-tl-loading">Loading activity…</div>' +
      '</div>';

    var filterBox = el.querySelector("[data-tl-filter]");
    var listBox   = el.querySelector("[data-tl-list]");

    function buildUrl() {
      var qs = [];
      if (opts.contactId) qs.push("contact_id=" + encodeURIComponent(opts.contactId));
      if (opts.dealId)    qs.push("deal_id="    + encodeURIComponent(opts.dealId));
      if (opts.userId)    qs.push("user_id="    + encodeURIComponent(opts.userId));
      qs.push("limit=" + state.limit);
      if (state.activeKind) qs.push("types=" + encodeURIComponent(state.activeKind));
      return "/api/timeline?" + qs.join("&");
    }

    function renderFilters() {
      var kinds = {};
      state.events.forEach(function (e) { kinds[e.kind] = (kinds[e.kind] || 0) + 1; });
      var ordered = Object.keys(kinds).sort(function (a, b) { return kinds[b] - kinds[a]; });
      var html = '<button class="' + (state.activeKind === "" ? "on" : "") + '" data-tl-kind="">All</button>';
      ordered.forEach(function (k) {
        html += '<button class="' + (state.activeKind === k ? "on" : "") + '" data-tl-kind="' + esc(k) + '">' +
                  esc(k) + ' (' + kinds[k] + ')</button>';
      });
      filterBox.innerHTML = html;
    }

    function renderList() {
      var visible = state.activeKind
        ? state.events.filter(function (e) { return e.kind === state.activeKind; })
        : state.events;
      if (!visible.length) {
        listBox.innerHTML = '<div class="nwm-tl-empty">No activity yet.</div>';
        return;
      }
      listBox.innerHTML = visible.map(evtHtml).join("");
    }

    function load() {
      api(buildUrl()).then(function (r) {
        state.events = r.events || [];
        renderFilters();
        renderList();
      }).catch(function (e) {
        listBox.innerHTML = '<div class="nwm-tl-error">Could not load activity.<br>' +
                            '<small>' + esc(e && e.statusText ? e.statusText : "API error") + ' — backend at /api/timeline must be deployed.</small></div>';
      });
    }

    filterBox.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-tl-kind]");
      if (!b) return;
      state.activeKind = b.getAttribute("data-tl-kind");
      renderFilters();
      renderList();
    });

    load();

    return { reload: load, element: el };
  }

  w.NWMTimeline = { mount: mount };
})(window);

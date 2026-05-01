/* WhatsApp Subscribers admin module — uses /api/?r=wa_flush handler.
 *
 * Three views in one page:
 *   1. Counts row — pending / confirmed / opted_out / total
 *   2. Filterable subscriber table (paginated by 50)
 *   3. Flush controls — dry run + live, with per-batch results
 *
 * Auth: relies on the shared API client at /app/js/api-client.js (same X-Auth-Token
 * cookie as every other CRM module). Admin role check is enforced server-side.
 */
(function () {
  "use strict";

  var API_BASE = "/crm-vanilla/api";
  var R = "?r=wa_flush";
  var TOKEN_KEY = "nwm_token";

  /* ── Auth header helper — matches the CRM convention ── */
  function authHeaders(extra) {
    var token = "";
    try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}
    var h = { "Content-Type": "application/json" };
    if (token) h["X-Auth-Token"] = token;
    if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }

  function api(path, opts) {
    opts = opts || {};
    return fetch(API_BASE + path, {
      method: opts.method || "GET",
      headers: authHeaders(opts.headers),
      credentials: "same-origin",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
    });
  }

  /* ── Escape (XSS hygiene — same convention as crm-vanilla/js/app.js esc) ── */
  function esc(s) {
    if (s === null || s === undefined) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(s)));
    return div.innerHTML;
  }

  function fmtPhone(p) {
    if (!p) return "—";
    var d = p.replace(/[^\d+]/g, "");
    if (d.length > 4) return d.slice(0, -4) + "••" + d.slice(-2);
    return d;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  /* ── State ── */
  var state = {
    status: "pending_double_opt_in",
    offset: 0,
    limit: 50,
    items: [],
    counts: { pending_double_opt_in: 0, confirmed: 0, opted_out: 0, total: 0 },
    hasMore: false,
    busy: false,
  };

  /* ── DOM refs ── */
  var $ = function (id) { return document.getElementById(id); };

  function showMsg(kind, text) {
    var el = $("waMsg");
    if (!el) return;
    if (!text) { el.innerHTML = ""; return; }
    el.innerHTML = '<div class="wa-msg ' + kind + '">' + esc(text) + '</div>';
  }

  function renderCounts() {
    var c = state.counts;
    $("waCountsRow").innerHTML = [
      ['pending', 'Pending', c.pending_double_opt_in || 0],
      ['confirmed', 'Confirmed', c.confirmed || 0],
      ['opted_out', 'Opted out', c.opted_out || 0],
      ['total', 'Total', c.total || 0],
    ].map(function (row) {
      return '<div class="wa-count-card ' + row[0] + '"><div class="lbl">' + esc(row[1]) + '</div><div class="val">' + esc(row[2]) + '</div></div>';
    }).join("");
  }

  function renderTable() {
    var wrap = $("waTableWrap");
    if (!state.items.length) {
      wrap.innerHTML = '<div class="wa-empty">No subscribers in this status. Try switching the filter or check the <a href="/whatsapp-updates.html" target="_blank" style="color:#FF671F;">opt-in form</a> is being shared.</div>';
      $("waPager").innerHTML = "";
      return;
    }
    var headers = ["Name", "Phone", "Email", "Niche", "Lang", "Source", "Status", "Created", "Actions"];
    var rows = state.items.map(function (it) {
      return "<tr>" +
        "<td>" + esc(it.name || "—") + "</td>" +
        "<td><code>" + esc(fmtPhone(it.phone)) + "</code></td>" +
        "<td>" + esc(it.email || "—") + "</td>" +
        "<td>" + esc(it.niche || "—") + "</td>" +
        "<td>" + esc(it.lang || "en") + "</td>" +
        "<td>" + esc(it.source || "—") + "</td>" +
        "<td><span class=\"status-pill status-" + esc(it.wa_optin_status) + "\">" + esc(it.wa_optin_status) + "</span></td>" +
        "<td>" + esc(fmtDate(it.created_at)) + "</td>" +
        "<td class=\"row-actions\">" +
          (it.wa_optin_status !== 'confirmed' ? '<button data-mark="confirmed" data-id="' + it.id + '">Confirm</button>' : '') +
          (it.wa_optin_status !== 'opted_out' ? '<button data-mark="opted_out" data-id="' + it.id + '">Opt out</button>' : '') +
        "</td>" +
        "</tr>";
    }).join("");
    wrap.innerHTML = '<table class="wa-table"><thead><tr>' +
      headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
      '</tr></thead><tbody>' + rows + '</tbody></table>';

    // Pager
    var pager = '';
    if (state.offset > 0) {
      pager += '<button id="waPrevBtn">← Previous</button>';
    }
    pager += '<span style="padding:8px 14px;color:var(--muted,#8892b0);font-size:13px;">Showing ' + (state.offset + 1) + '–' + (state.offset + state.items.length) + '</span>';
    if (state.hasMore) {
      pager += '<button id="waNextBtn">Next →</button>';
    }
    $("waPager").innerHTML = pager;
    var prev = $("waPrevBtn"); if (prev) prev.onclick = function () { state.offset = Math.max(0, state.offset - state.limit); loadList(); };
    var next = $("waNextBtn"); if (next) next.onclick = function () { state.offset += state.limit; loadList(); };

    // Wire row-action buttons
    Array.prototype.forEach.call(wrap.querySelectorAll("button[data-mark]"), function (btn) {
      btn.onclick = function () { onMark(btn.getAttribute("data-id"), btn.getAttribute("data-mark")); };
    });
  }

  /* ── API calls ── */
  function loadCounts() {
    return api(R + "&action=count").then(function (res) {
      if (!res.ok) { showMsg("err", "Failed to load counts: " + (res.body.error || res.status)); return; }
      state.counts = res.body || state.counts;
      renderCounts();
    });
  }

  function loadList() {
    if (state.busy) return;
    state.busy = true;
    showMsg("");
    return api(R + "&action=list&status=" + encodeURIComponent(state.status) + "&limit=" + state.limit + "&offset=" + state.offset)
      .then(function (res) {
        state.busy = false;
        if (!res.ok) {
          showMsg("err", "Failed to load subscribers: " + (res.body.error || res.status));
          return;
        }
        state.items = (res.body && res.body.items) || [];
        state.hasMore = !!(res.body && res.body.has_more);
        renderTable();
      })
      .catch(function (err) { state.busy = false; showMsg("err", "Network error: " + err.message); });
  }

  function onMark(id, status) {
    if (!id) return;
    var label = status === "confirmed" ? "confirm" : "opt out";
    if (!confirm("Mark subscriber #" + id + " as " + label + "? This is reversible — you can mark them again later.")) return;
    api(R + "&action=mark", { method: "POST", body: { contact_id: parseInt(id, 10), status: status } })
      .then(function (res) {
        if (!res.ok) { showMsg("err", "Mark failed: " + (res.body.error || res.status)); return; }
        showMsg("ok", "Subscriber #" + id + " marked as " + status + ".");
        return Promise.all([loadCounts(), loadList()]);
      })
      .catch(function (err) { showMsg("err", "Network error: " + err.message); });
  }

  function onFlush(dryRun) {
    var label = dryRun ? "DRY RUN (no real sends)" : "LIVE FLUSH (real WABA sends)";
    var msg = "About to run " + label + " against " + (state.counts.pending_double_opt_in || 0) + " pending subscriber(s). Continue?";
    if (!confirm(msg)) return;
    showMsg("warn", "Flushing… (this calls Meta's Cloud API and may take 5–30 seconds depending on batch size)");
    var btn = dryRun ? $("waDryFlushBtn") : $("waLiveFlushBtn");
    if (btn) btn.disabled = true;

    api(R + "&action=send", { method: "POST", body: { dry_run: !!dryRun, limit: 100 } })
      .then(function (res) {
        if (btn) btn.disabled = false;
        if (res.status === 503) {
          showMsg("warn", "WABA not configured yet: " + (res.body && res.body.detail ? res.body.detail : "WA_PHONE_ID and WA_META_TOKEN must be set in deploy secrets first."));
          renderFlushResults({ note: "WABA env not configured — flush is intentionally blocked until verification completes." });
          return;
        }
        if (!res.ok) { showMsg("err", "Flush failed: " + (res.body.error || res.status)); return; }
        showMsg("ok", "Flush complete. " + (res.body && res.body.results ? res.body.results.sent + " sent, " + res.body.results.failed + " failed." : ""));
        renderFlushResults(res.body);
        return Promise.all([loadCounts(), loadList()]);
      })
      .catch(function (err) {
        if (btn) btn.disabled = false;
        showMsg("err", "Network error: " + err.message);
      });
  }

  function renderFlushResults(body) {
    var el = $("waFlushResults");
    if (!body) { el.innerHTML = ""; return; }
    if (body.note) {
      el.innerHTML = '<div class="flush-results"><h3>Flush blocked</h3><p style="margin:0;color:var(--muted,#8892b0);font-size:13px;">' + esc(body.note) + '</p></div>';
      return;
    }
    var r = body.results || {};
    var html = '<div class="flush-results">' +
      '<h3>Flush results' + (body.dry_run ? ' (dry run)' : '') + ' · template: <code>' + esc(body.template) + '</code></h3>' +
      '<div class="stat"><strong>' + esc(r.attempted || 0) + '</strong>attempted</div>' +
      '<div class="stat"><strong>' + esc(r.sent || 0) + '</strong>sent</div>' +
      '<div class="stat"><strong>' + esc(r.failed || 0) + '</strong>failed</div>' +
      '<div class="stat"><strong>' + esc(r.skipped || 0) + '</strong>skipped</div>';
    if (r.errors && r.errors.length) {
      html += '<pre>' + esc(JSON.stringify(r.errors, null, 2)) + '</pre>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  /* ── WABA status pill — derive from counts + endpoint behavior ── */
  function updateWabaStatusPill() {
    // Probe with a dry_run send: returns 503 if env unconfigured, 200 otherwise.
    // We don't actually send (dry run + 0 records is harmless either way).
    var pill = $("wabaStatusPill");
    if (!pill) return;
    api(R + "&action=send", { method: "POST", body: { dry_run: true, limit: 0 } })
      .then(function (res) {
        if (res.status === 503) {
          pill.textContent = "WABA env: not configured";
          pill.style.background = "rgba(245,158,11,0.12)"; pill.style.color = "#f59e0b";
          pill.style.border = "1px solid rgba(245,158,11,0.3)";
        } else if (res.ok) {
          pill.textContent = "WABA env: configured ✓";
          pill.style.background = "rgba(34,197,94,0.12)"; pill.style.color = "#22C55E";
          pill.style.border = "1px solid rgba(34,197,94,0.3)";
        } else {
          pill.textContent = "WABA env: error " + res.status;
          pill.style.background = "rgba(239,68,68,0.12)"; pill.style.color = "#ef4444";
          pill.style.border = "1px solid rgba(239,68,68,0.3)";
        }
      })
      .catch(function () {
        pill.textContent = "WABA env: offline";
        pill.style.background = "rgba(239,68,68,0.12)"; pill.style.color = "#ef4444";
      });
  }

  /* ── Boot ── */
  function init() {
    $("waFilterStatus").addEventListener("change", function (e) {
      state.status = e.target.value;
      state.offset = 0;
      loadList();
    });
    $("waRefreshBtn").addEventListener("click", function () { loadCounts(); loadList(); updateWabaStatusPill(); });
    $("waDryFlushBtn").addEventListener("click", function () { onFlush(true); });
    $("waLiveFlushBtn").addEventListener("click", function () { onFlush(false); });

    Promise.all([loadCounts(), loadList()]).then(updateWabaStatusPill);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

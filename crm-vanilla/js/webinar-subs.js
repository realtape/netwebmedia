/* Webinar Registrations admin — sprint tracking
 * Backed by /api/sprint/webinar-subs (api-php route).
 * Auth: nwm_token via X-Auth-Token header (shared with api-php).
 */
(function () {
  "use strict";

  var API_LIST  = "/api/sprint/webinar-subs";
  var API_STATS = "/api/sprint/webinar-subs/stats";

  var state = { rows: [], stats: null, filterNiche: "", search: "" };

  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader("Webinar Registrations");
    }
    bind();
    loadAll();
  });

  function bind() {
    document.getElementById("refreshBtn").addEventListener("click", loadAll);
    document.getElementById("exportBtn").addEventListener("click", exportCSV);
    document.getElementById("filterNiche").addEventListener("change", function (e) {
      state.filterNiche = e.target.value;
      renderTable();
    });
    document.getElementById("searchBox").addEventListener("input", function (e) {
      state.search = (e.target.value || "").toLowerCase();
      renderTable();
    });
  }

  function authHeaders() {
    var h = { "Accept": "application/json" };
    var tok = localStorage.getItem("nwm_token");
    if (tok) h["X-Auth-Token"] = tok;
    return h;
  }

  function loadAll() {
    setMsg("Loading…", "ok");
    Promise.all([
      fetch(API_LIST,  { headers: authHeaders() }).then(handleResp),
      fetch(API_STATS, { headers: authHeaders() }).then(handleResp)
    ]).then(function (results) {
      state.rows  = (results[0] && results[0].submissions) || [];
      state.stats = results[1] || null;
      clearMsg();
      renderCards();
      renderBreakdown();
      renderTable();
    }).catch(function (e) {
      var m = (e && e.message) || "Failed to load";
      if (m.indexOf("401") !== -1 || m.indexOf("Unauthorized") !== -1) {
        setMsg("Not signed in. <a href='login.html'>Log in</a> as admin to view registrations.", "err");
      } else {
        setMsg("Could not load registrations: " + m, "err");
      }
      renderCards();
      renderBreakdown();
      renderTable();
    });
  }

  function handleResp(r) {
    if (r.status === 401) throw new Error("401 Unauthorized");
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  /* ── Cards ── */
  function renderCards() {
    var s = state.stats || {};
    var total = s.total || 0;
    var targets = s.targets || { bear: 20, base: 50, bull: 100 };

    function card(lbl, val, sub, pct) {
      var p = pct == null ? "" :
        '<div class="progress"><div style="width:' + Math.min(100, pct) + '%"></div></div>';
      return '<div class="sp-card"><div class="lbl">' + esc(lbl) + '</div>' +
             '<div class="val">' + val + '</div>' +
             (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + p + '</div>';
    }
    var pctBase = targets.base ? Math.round((total / targets.base) * 100) : 0;
    var html = "";
    html += card("Total Registrations", total, "Sprint window", pctBase);
    html += card("vs. Base Target", targets.base, total + " of " + targets.base + " (" + pctBase + "%)", pctBase);
    html += card("Bear Target", targets.bear, "Pivot trigger if below", null);
    html += card("Bull Target", targets.bull, "Stretch goal", null);
    document.getElementById("sprintCards").innerHTML = html;
  }

  /* ── Breakdown bars ── */
  function renderBreakdown() {
    var s = state.stats || {};
    var byNiche  = s.by_niche  || {};
    var bySource = s.by_source || {};

    var nicheColors = {
      healthcare:  "#00b894",
      real_estate: "#74b9ff",
      saas:        "#a29bfe",
      hospitality: "#fd79a8",
      other:       "#fdcb6e",
      unspecified: "#636e72"
    };
    var srcColors = ["#FF671F", "#74b9ff", "#a29bfe", "#00b894", "#fdcb6e", "#fd79a8", "#636e72"];

    function buildBars(obj, colorFn) {
      var keys = Object.keys(obj);
      if (!keys.length) return '<div class="sp-empty" style="padding:20px;font-size:12px">No data yet</div>';
      var max = 1;
      keys.forEach(function (k) { if (obj[k] > max) max = obj[k]; });
      keys.sort(function (a, b) { return obj[b] - obj[a]; });
      var h = "";
      keys.forEach(function (k, i) {
        var pct = Math.round((obj[k] / max) * 100);
        var col = colorFn(k, i);
        h += '<div class="sp-bar-row">' +
             '<div class="lbl-row"><span>' + esc(k.replace(/_/g, " ")) + '</span><span>' + obj[k] + '</span></div>' +
             '<div class="sp-bar"><div style="width:' + pct + '%;background:' + col + '"></div></div>' +
             '</div>';
      });
      return h;
    }

    var html = "";
    html += '<div class="sp-breakdown-card"><h3>By Niche</h3>' +
            buildBars(byNiche, function (k) { return nicheColors[k] || "#fdcb6e"; }) +
            '</div>';
    html += '<div class="sp-breakdown-card"><h3>By UTM Source</h3>' +
            buildBars(bySource, function (k, i) { return srcColors[i % srcColors.length]; }) +
            '</div>';
    document.getElementById("sprintBreakdown").innerHTML = html;
  }

  /* ── Table ── */
  function renderTable() {
    var rows = filteredRows();
    var wrap = document.getElementById("spTableWrap");
    if (!rows.length) {
      wrap.innerHTML = '<div class="sp-empty">No registrations match your filters yet.<br><small style="margin-top:8px;display:block">Share <code>/lp/webinar-ai-marketing-system.html</code> across the 4 niche pages and email sequences to drive sign-ups.</small></div>';
      return;
    }
    var h = '<table class="sp-table"><thead><tr>';
    h += '<th>Registered</th><th>Name</th><th>Email</th><th>Company</th>';
    h += '<th>Niche</th><th>UTM Source</th><th>Campaign</th>';
    h += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var n = r.niche || "unspecified";
      var nicheClass = "niche-" + n.replace(/[^a-z0-9_]/gi, "_");
      h += '<tr>';
      h += '<td>' + esc(formatDate(r.created_at)) + '</td>';
      h += '<td><strong>' + esc(r.name || "—") + '</strong></td>';
      h += '<td><a href="mailto:' + esc(r.email) + '" style="color:#FF671F">' + esc(r.email) + '</a></td>';
      h += '<td>' + esc(r.company || "—") + '</td>';
      h += '<td><span class="niche-pill ' + nicheClass + '">' + esc(n.replace(/_/g, " ")) + '</span></td>';
      h += '<td>' + esc(r.utm_source || "direct") + '</td>';
      h += '<td>' + esc(r.utm_campaign || "—") + '</td>';
      h += '</tr>';
    });
    h += '</tbody></table>';
    wrap.innerHTML = h;
  }

  function filteredRows() {
    return state.rows.filter(function (r) {
      if (state.filterNiche && r.niche !== state.filterNiche) return false;
      if (state.search) {
        var s = state.search;
        var hay = ((r.name || "") + " " + (r.email || "") + " " + (r.company || "")).toLowerCase();
        if (hay.indexOf(s) === -1) return false;
      }
      return true;
    });
  }

  /* ── CSV export ── */
  function exportCSV() {
    var rows = filteredRows();
    if (!rows.length) { setMsg("No rows to export.", "err"); return; }
    var headers = ["Registered", "Name", "Email", "Company", "Niche", "UTM Source", "UTM Campaign", "UTM Medium", "UTM Content", "Referrer"];
    var lines = [headers.join(",")];
    rows.forEach(function (r) {
      lines.push([
        r.created_at,
        csv(r.name), csv(r.email), csv(r.company),
        csv(r.niche), csv(r.utm_source), csv(r.utm_campaign),
        csv(r.utm_medium), csv(r.utm_content), csv(r.referrer)
      ].join(","));
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "webinar-registrations-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg("Exported " + rows.length + " row" + (rows.length === 1 ? "" : "s") + " to CSV.", "ok");
    setTimeout(clearMsg, 4000);
  }

  function csv(v) {
    if (v == null) return "";
    var s = String(v);
    if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  /* ── Helpers ── */
  function setMsg(html, kind) {
    var el = document.getElementById("spMsg");
    el.innerHTML = '<div class="sp-msg ' + (kind || "ok") + '">' + html + '</div>';
  }
  function clearMsg() { document.getElementById("spMsg").innerHTML = ""; }

  function formatDate(s) {
    if (!s) return "—";
    var d = new Date(s.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function esc(s) {
    if (window.CRM_APP && CRM_APP.esc) return CRM_APP.esc(s);
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]);
    });
  }
})();

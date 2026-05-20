/* A/B Tests admin — backed by /api/abtests (api-php/routes/abtests.php).
   Test config (variants, traffic split, status) + lift reporting from ab_events.
*/
(function () {
  "use strict";
  var API = "/api/abtests";

  var state = { tests: [] };

  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, {
      method: method, headers: headers, credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      var p = ct.indexOf("application/json") !== -1 ? r.json() : r.text();
      return p.then(function (d) {
        if (!r.ok) { var e = new Error((d && d.error) || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function toast(msg, isError) {
    var el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  function loadTests() {
    return api("GET", API).then(function (r) {
      state.tests = r.items || [];
      renderTests();
    }).catch(function (e) {
      var l = document.getElementById("testsList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load tests: ' + esc(e.message) +
        '<br><small>Make sure /api/abtests is deployed and you are signed in.</small></div>';
    });
  }

  function renderTests() {
    var l = document.getElementById("testsList");
    if (!state.tests.length) {
      l.innerHTML = '<div class="empty-state">No A/B tests yet.<br>Click <strong>+ New Test</strong> to launch your first experiment.</div>';
      return;
    }
    l.innerHTML = state.tests.map(testCardHtml).join("");
  }

  function testCardHtml(t) {
    var stats = collectStats(t.stats || []);
    var totalAssigns = Object.keys(stats).reduce(function (s, v) { return s + (stats[v].assign || 0); }, 0);
    var totalConv    = Object.keys(stats).reduce(function (s, v) { return s + (stats[v].convert || 0); }, 0);
    var ctrlName = pickControl(t.variants);
    var ctrlRate = ctrlName && stats[ctrlName] && stats[ctrlName].assign > 0
      ? (stats[ctrlName].convert / stats[ctrlName].assign) : 0;

    var variants = (t.variants || []).map(function (v) {
      var name = v.name || v;
      var payload = (v && typeof v === 'object' && v.payload) ? JSON.stringify(v.payload) : (v.value || v.copy || '');
      var s = stats[name] || { assign: 0, convert: 0 };
      var rate = s.assign > 0 ? (s.convert / s.assign) : 0;
      var rateStr = (rate * 100).toFixed(1) + '%';
      var liftHtml = '';
      if (ctrlName && name !== ctrlName && ctrlRate > 0) {
        var liftPct = ((rate - ctrlRate) / ctrlRate) * 100;
        var cls = liftPct >= 0 ? '' : ' neg';
        liftHtml = '<span class="lift' + cls + '">' + (liftPct >= 0 ? '+' : '') + liftPct.toFixed(1) + '%</span>';
      }
      var winner = ctrlName && name !== ctrlName && rate > ctrlRate && s.convert >= 30; // statistical-ish
      return '<div class="variant' + (winner ? ' winner' : '') + '">' +
               '<div class="v-name">' + esc(name) + (winner ? ' 🏆' : '') + (name === ctrlName ? ' (control)' : '') + '</div>' +
               (payload ? '<div class="v-payload">' + esc(payload) + '</div>' : '') +
               '<div class="v-stats">' +
                 '<span>' + s.convert + ' / ' + s.assign + '</span>' +
                 '<span><strong>' + rateStr + '</strong> ' + liftHtml + '</span>' +
               '</div>' +
             '</div>';
    }).join("");

    return '<div class="test-card">' +
             '<div class="test-head">' +
               '<div style="flex:1;min-width:0">' +
                 '<div class="title">' + esc(t.name) + '</div>' +
                 '<div class="slug">/api/public/ab/assign?test=' + esc(t.slug) + '</div>' +
                 (t.hypothesis ? '<div class="hypothesis">' + esc(t.hypothesis) + '</div>' : '') +
               '</div>' +
               '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
                 '<span class="badge ' + esc(t.status) + '">' + esc(t.status) + '</span>' +
                 '<span style="color:#64748b;font:600 11px Inter">' + totalAssigns + ' assigns · ' + totalConv + ' conversions</span>' +
                 '<button class="btn btn-secondary" data-test-edit="' + t.id + '">Edit</button>' +
               '</div>' +
             '</div>' +
             '<div class="variants-grid">' + variants + '</div>' +
           '</div>';
  }

  function collectStats(rows) {
    var out = {};
    rows.forEach(function (r) {
      var v = r.variant || 'unknown';
      out[v] = out[v] || { assign: 0, convert: 0 };
      if (r.event === 'assign')  out[v].assign  = parseInt(r.n, 10) || 0;
      if (r.event === 'convert') out[v].convert = parseInt(r.n, 10) || 0;
    });
    return out;
  }

  function pickControl(variants) {
    if (!variants || !variants.length) return null;
    var first = variants[0];
    return (first && first.name) ? first.name : (typeof first === 'string' ? first : null);
  }

  /* ── modal ── */
  var variantRows = [];
  function openTestModal(t) {
    document.getElementById("testModalTitle").textContent = t ? "Edit A/B Test" : "New A/B Test";
    document.getElementById("testId").value         = t ? t.id : "";
    document.getElementById("testSlug").value       = t ? t.slug : "";
    document.getElementById("testName").value       = t ? t.name : "";
    document.getElementById("testHypothesis").value = t ? (t.hypothesis || "") : "";
    document.getElementById("testStatus").value     = t ? t.status : "running";
    document.getElementById("testDelete").style.display = t ? "inline-flex" : "none";

    variantRows = t && Array.isArray(t.variants) && t.variants.length
      ? t.variants.map(toVariantRow)
      : [{ name: "A", payload: "" }, { name: "B", payload: "" }];
    renderVariantRows();
    document.getElementById("testModal").classList.add("open");
  }
  function closeTestModal() { document.getElementById("testModal").classList.remove("open"); }

  function toVariantRow(v) {
    if (typeof v === 'string') return { name: v, payload: "" };
    var name = v.name || "";
    var payload = "";
    if (v.payload) payload = typeof v.payload === 'string' ? v.payload : JSON.stringify(v.payload);
    else if (v.copy) payload = v.copy;
    else if (v.value) payload = v.value;
    return { name: name, payload: payload };
  }

  function renderVariantRows() {
    var box = document.getElementById("variantsBox");
    box.innerHTML = variantRows.map(function (v, i) {
      return '<div class="v-row">' +
               '<input data-vname="' + i + '" placeholder="Name (A/B/C…)" value="' + esc(v.name) + '">' +
               '<input data-vpayload="' + i + '" placeholder="Payload (text or JSON)" value="' + esc(v.payload) + '">' +
               '<button type="button" data-vrm="' + i + '" title="Remove">✕</button>' +
             '</div>';
    }).join("");
    box.querySelectorAll("[data-vrm]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-vrm"), 10);
        if (variantRows.length <= 2) { toast("Need at least 2 variants.", true); return; }
        variantRows.splice(i, 1);
        renderVariantRows();
      });
    });
    box.querySelectorAll("[data-vname]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        variantRows[parseInt(inp.getAttribute("data-vname"), 10)].name = inp.value;
      });
    });
    box.querySelectorAll("[data-vpayload]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        variantRows[parseInt(inp.getAttribute("data-vpayload"), 10)].payload = inp.value;
      });
    });
  }

  function saveTest() {
    var id   = document.getElementById("testId").value;
    var slug = document.getElementById("testSlug").value.trim().replace(/[^a-z0-9\-]/g, '');
    var name = document.getElementById("testName").value.trim();
    var hyp  = document.getElementById("testHypothesis").value.trim();
    var status = document.getElementById("testStatus").value;
    if (!slug) { toast("Slug required.", true); return; }
    if (!name) { toast("Name required.", true); return; }
    if (variantRows.length < 2) { toast("At least 2 variants required.", true); return; }

    var variants = variantRows.map(function (r) {
      var out = { name: r.name || "" };
      if (!out.name) return null;
      if (r.payload) {
        try { out.payload = JSON.parse(r.payload); }
        catch (e) { out.payload = r.payload; }
      }
      return out;
    }).filter(Boolean);
    if (variants.length < 2) { toast("Variants need names.", true); return; }

    var data = { slug: slug, name: name, hypothesis: hyp, variants: variants, status: status };
    var p = id ? api("PUT", API + "/" + id, data) : api("POST", API, data);
    p.then(function () { toast(id ? "Updated." : "Test created."); closeTestModal(); loadTests(); })
     .catch(function (e) { toast("Save failed: " + e.message, true); });
  }

  function deleteTest() {
    var id = document.getElementById("testId").value;
    if (!id) return;
    if (!confirm("Delete this test? Events will be wiped too.")) return;
    api("DELETE", API + "/" + id)
      .then(function () { toast("Deleted."); closeTestModal(); loadTests(); })
      .catch(function (e) { toast("Delete failed: " + e.message, true); });
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) CRM_APP.buildHeader("A/B Tests", '');

    document.getElementById("newTestBtn").addEventListener("click", function () { openTestModal(null); });
    document.getElementById("testCancel").addEventListener("click", closeTestModal);
    document.getElementById("testSave").addEventListener("click", saveTest);
    document.getElementById("testDelete").addEventListener("click", deleteTest);
    document.getElementById("addVariantBtn").addEventListener("click", function () {
      var nextLetter = String.fromCharCode(65 + variantRows.length); // A, B, C...
      variantRows.push({ name: nextLetter, payload: "" });
      renderVariantRows();
    });
    document.getElementById("testModal").addEventListener("click", function (e) {
      if (e.target.id === "testModal") closeTestModal();
    });
    document.getElementById("testsList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-test-edit]"); if (!btn) return;
      var id = parseInt(btn.getAttribute("data-test-edit"), 10);
      var t = state.tests.find(function (x) { return x.id === id; });
      if (t) openTestModal(t);
    });

    loadTests();
  });
})();

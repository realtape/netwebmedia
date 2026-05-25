/* Lead Scoring rule admin — Settings → Lead Scoring tab.
   Backed by /api/leads/scoring-rules and /api/leads/score-preview.
*/
(function () {
  "use strict";

  var API_RULES   = "/api/leads/scoring-rules";
  var API_PREVIEW = "/api/leads/score-preview";

  var rules = [];
  var threshold = 30;
  var usingDefaults = false;

  function api(method, url, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(url, {
      method: method,
      headers: headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      var p = ct.indexOf("application/json") !== -1 ? r.json() : r.text();
      return p.then(function (data) {
        if (!r.ok) {
          var e = new Error((data && data.error) || ("HTTP " + r.status));
          e.status = r.status;
          throw e;
        }
        return data;
      });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  function load() {
    return api("GET", API_RULES).then(function (r) {
      rules = r.rules || [];
      threshold = r.threshold || 30;
      usingDefaults = !!r.using_defaults;
      // If using defaults, show them in the table as a preview (read-only suggestion)
      if (usingDefaults && r.defaults) {
        rules = r.defaults.map(function (d, i) {
          return Object.assign({}, d, { id: null, enabled: 1, sort_order: i, _isDefault: true });
        });
      }
      render();
    }).catch(function (e) {
      var body = document.getElementById("scoringRulesBody");
      if (body) body.innerHTML = '<tr><td colspan="7" style="color:#b91c1c;padding:14px">Could not load scoring rules: ' + esc(e.message) + '</td></tr>';
    });
  }

  function render() {
    document.getElementById("scoringDefaultsBanner").style.display = usingDefaults ? "block" : "none";
    document.getElementById("scoringThreshold").value = threshold;

    var body = document.getElementById("scoringRulesBody");
    if (!body) return;
    if (!rules.length) {
      body.innerHTML = '<tr><td colspan="7" style="color:#94a3b8;padding:14px;text-align:center">No rules. Click <strong>+ New Rule</strong> to add one.</td></tr>';
      return;
    }
    body.innerHTML = rules.map(function (r, i) {
      var on = r.enabled ? "On" : "Off";
      var dot = r.enabled ? "#10b981" : "#94a3b8";
      var disabled = r._isDefault ? ' disabled title="Default rule — create a new rule to override"' : '';
      return '<tr>' +
               '<td>' + esc(r.name) + (r._isDefault ? ' <span style="color:#94a3b8;font-size:11px">(default)</span>' : '') + '</td>' +
               '<td><code>' + esc(r.field) + '</code></td>' +
               '<td>' + esc(r.operator) + '</td>' +
               '<td style="color:#64748b">' + esc(r.value || "—") + '</td>' +
               '<td><strong>' + (r.points >= 0 ? "+" : "") + r.points + '</strong></td>' +
               '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + dot + ';margin-right:5px"></span>' + on + '</td>' +
               '<td style="text-align:right">' +
                 '<button class="btn btn-secondary" data-action="edit" data-idx="' + i + '"' + disabled + '>Edit</button>' +
               '</td>' +
             '</tr>';
    }).join("");
  }

  /* ── modal ── */
  function openModal(rule) {
    document.getElementById("scoringModalTitle").textContent = rule ? "Edit Rule" : "New Rule";
    document.getElementById("ruleId").value       = rule && rule.id ? rule.id : "";
    document.getElementById("ruleName").value     = rule ? (rule.name || "") : "";
    document.getElementById("ruleField").value    = rule ? (rule.field || "") : "";
    document.getElementById("ruleOperator").value = rule ? (rule.operator || "present") : "present";
    document.getElementById("ruleValue").value    = rule ? (rule.value || "") : "";
    document.getElementById("rulePoints").value   = rule ? (rule.points || 10) : 10;
    document.getElementById("ruleEnabled").checked = rule ? !!rule.enabled : true;
    document.getElementById("ruleDelete").style.display = (rule && rule.id) ? "inline-flex" : "none";
    document.getElementById("scoringModal").style.display = "flex";
  }
  function closeModal() {
    document.getElementById("scoringModal").style.display = "none";
  }

  function saveRule() {
    var id = document.getElementById("ruleId").value;
    var payload = {
      name:     document.getElementById("ruleName").value.trim(),
      field:    document.getElementById("ruleField").value.trim(),
      operator: document.getElementById("ruleOperator").value,
      value:    document.getElementById("ruleValue").value || null,
      points:   parseInt(document.getElementById("rulePoints").value, 10) || 0,
      enabled:  document.getElementById("ruleEnabled").checked ? 1 : 0,
    };
    if (!payload.name)  { alert("Name is required."); return; }
    if (!payload.field) { alert("Field is required."); return; }

    var p = id
      ? api("PUT",  API_RULES + "/" + id, payload)
      : api("POST", API_RULES,            payload);

    p.then(function () { closeModal(); return load(); })
     .catch(function (e) { alert("Save failed: " + e.message); });
  }

  function deleteRule() {
    var id = document.getElementById("ruleId").value;
    if (!id) return;
    if (!confirm("Delete this rule?")) return;
    api("DELETE", API_RULES + "/" + id)
      .then(function () { closeModal(); return load(); })
      .catch(function (e) { alert("Delete failed: " + e.message); });
  }

  function saveThreshold() {
    var t = parseInt(document.getElementById("scoringThreshold").value, 10);
    if (isNaN(t) || t < 0) return;
    // Sent via the new-rule POST as a side-channel update — backend supports `threshold`
    // on POST/PUT. We piggy-back by updating the first rule's row when one exists,
    // otherwise issuing a no-op rule create with just threshold.
    if (rules.length && rules[0].id) {
      api("PUT", API_RULES + "/" + rules[0].id, { threshold: t })
        .then(function () { threshold = t; flash("Threshold saved."); })
        .catch(function (e) { alert("Threshold save failed: " + e.message); });
    } else {
      // No rules yet — create a placeholder no-effect rule that carries the threshold.
      api("POST", API_RULES, {
        name: "Threshold setting", field: "_threshold", operator: "absent",
        value: null, points: 0, enabled: 0, threshold: t
      }).then(function () { threshold = t; flash("Threshold saved."); return load(); })
        .catch(function (e) { alert("Threshold save failed: " + e.message); });
    }
  }

  function flash(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;bottom:24px;right:24px;background:#10b981;color:#fff;padding:10px 16px;border-radius:8px;font:600 13px Inter;z-index:1100;box-shadow:0 4px 14px rgba(0,0,0,.15)";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  /* ── score preview ── */
  function runPreview() {
    var contact = {
      email:     document.getElementById("prevEmail").value.trim(),
      phone:     document.getElementById("prevPhone").value.trim(),
      website:   document.getElementById("prevWebsite").value.trim(),
      niche_key: document.getElementById("prevNiche").value.trim(),
    };
    api("POST", API_PREVIEW, { contact: contact }).then(function (r) {
      var resultEl = document.getElementById("scoringPreviewResult");
      var verdictColor = r.verdict === "qualified" ? "#10b981" : "#FF671F";
      var bd = (r.breakdown || []).map(function (m) {
        return '<li><strong>' + esc(m.rule) + '</strong> <span style="color:#64748b">[' + esc(m.field) + ' ' + esc(m.op) + ']</span> → +' + m.points + '</li>';
      }).join("");
      resultEl.innerHTML =
        '<div style="background:#f8fafc;border:1px solid #e3e5ee;border-radius:10px;padding:14px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
            '<div><span style="font-size:24px;font-weight:700;color:#010F3B">' + r.score + '</span> <span style="color:#94a3b8">/ ' + r.threshold + '</span></div>' +
            '<span style="background:' + verdictColor + ';color:#fff;padding:5px 12px;border-radius:999px;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.5px">' + esc(r.verdict) + '</span>' +
          '</div>' +
          (bd ? '<ul style="margin:6px 0 0;padding-left:20px;color:#1a1a2e;font-size:13px">' + bd + '</ul>'
              : '<div style="color:#94a3b8;font-size:13px">No rules matched.</div>') +
        '</div>';
    }).catch(function (e) {
      document.getElementById("scoringPreviewResult").innerHTML =
        '<div style="color:#b91c1c;font-size:13px">Preview failed: ' + esc(e.message) + '</div>';
    });
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("scoringNewRule")?.addEventListener("click", function () { openModal(null); });
    document.getElementById("scoringRefresh")?.addEventListener("click", load);
    document.getElementById("ruleCancel")?.addEventListener("click", closeModal);
    document.getElementById("ruleSave")?.addEventListener("click", saveRule);
    document.getElementById("ruleDelete")?.addEventListener("click", deleteRule);
    document.getElementById("scoringPreviewBtn")?.addEventListener("click", runPreview);

    var thr = document.getElementById("scoringThreshold");
    if (thr) {
      var t;
      thr.addEventListener("change", function () {
        clearTimeout(t);
        t = setTimeout(saveThreshold, 250);
      });
    }

    document.getElementById("scoringModal")?.addEventListener("click", function (e) {
      if (e.target.id === "scoringModal") closeModal();
    });

    document.getElementById("scoringRulesBody")?.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]"); if (!btn) return;
      var idx = parseInt(btn.getAttribute("data-idx"), 10);
      var rule = rules[idx];
      if (btn.getAttribute("data-action") === "edit" && rule && !rule._isDefault) {
        openModal(rule);
      }
    });

    // Lazy-load rules only when the user actually clicks the Lead Scoring tab.
    var tab = document.querySelector('.settings-tab[data-tab="scoring"]');
    if (tab) {
      tab.addEventListener("click", function () {
        if (!window._scoringLoaded) { load(); window._scoringLoaded = true; }
      });
    }
  });
})();

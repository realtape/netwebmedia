/* settings-pro.js — drives the Lifecycle / Segments / Forecast / Snapshots tabs.
   Backed by /api/lifecycle, /api/segments, /api/forecast, /api/snapshots.
*/
(function () {
  "use strict";

  var SECTIONS = ['lead_scoring_rules', 'pipeline_stages', 'booking_links', 'sms_campaigns', 'segments', 'email_templates'];

  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, {
      method: method,
      headers: headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      var p = ct.indexOf("application/json") !== -1 ? r.json() : r.text();
      return p.then(function (d) {
        if (!r.ok) {
          var e = new Error((d && d.error) || ("HTTP " + r.status));
          e.status = r.status; throw e;
        }
        return d;
      });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function fmtMoney(v) {
    if (v === null || v === undefined) return "$0";
    var n = Number(v);
    if (isNaN(n)) return "$0";
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function toast(msg, isError) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;bottom:24px;right:24px;background:" + (isError ? "#b91c1c" : "#10b981") +
      ";color:#fff;padding:10px 16px;border-radius:8px;font:600 13px Inter;z-index:1100;box-shadow:0 4px 14px rgba(0,0,0,.15)";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  /* ═════════════════  LIFECYCLE  ═════════════════ */
  var STAGE_COLORS = {
    subscriber:'#94a3b8', lead:'#0369a1', mql:'#0d9488',
    sql:'#9333ea', opportunity:'#FF671F', customer:'#10b981', churned:'#b91c1c',
  };

  function loadLifecycle() {
    var f = document.getElementById("lifecycleFunnel");
    f.innerHTML = '<div style="color:#94a3b8;font:500 13px Inter">Loading…</div>';
    api("GET", "/api/lifecycle/stages").then(function (r) {
      var stages = r.stages || [];
      if (!stages.length) {
        f.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:30px">No data yet.</div>';
        return;
      }
      var max = Math.max.apply(null, stages.map(function (s) { return s.count; }));
      var html = '<div style="background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:14px">';
      html += '<div style="color:#64748b;font:600 11px Inter;text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">Total contacts: ' + r.total + '</div>';
      stages.forEach(function (s) {
        var w = max > 0 ? Math.round((s.count / max) * 100) : 0;
        var color = STAGE_COLORS[s.stage] || '#64748b';
        html += '<div style="display:grid;grid-template-columns:120px 1fr 80px;gap:10px;align-items:center;margin-bottom:6px">';
        html += '<span style="font:700 12px Inter;color:#010F3B;text-transform:uppercase;letter-spacing:.3px">' + esc(s.stage) + '</span>';
        html += '<div style="background:#f2f3f8;border-radius:6px;height:22px;overflow:hidden"><div style="height:100%;background:' + color + ';width:' + w + '%"></div></div>';
        html += '<span style="font:600 12px Inter;color:#1a1a2e;text-align:right">' + s.count + ' <span style="color:#94a3b8">(' + s.pct + '%)</span></span>';
        html += '</div>';
      });
      if (r.unstaged) {
        html += '<div style="color:#94a3b8;font:500 11px Inter;margin-top:10px">' + r.unstaged + ' contacts have no lifecycle stage assigned (run Recompute to fix).</div>';
      }
      html += '</div>';
      f.innerHTML = html;
    }).catch(function (e) {
      f.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:13px">Could not load funnel: ' + esc(e.message) + '</div>';
    });
  }

  function recomputeLifecycle() {
    if (!confirm("Recompute lifecycle stage from score for all non-manually-staged contacts?")) return;
    api("POST", "/api/lifecycle/recompute").then(function (r) {
      toast("Updated " + r.updated + " contacts (" + r.skipped_manual + " manual skipped).");
      loadLifecycle();
    }).catch(function (e) { toast("Failed: " + e.message, true); });
  }

  /* ═════════════════  SEGMENTS  ═════════════════ */
  var segState = { segments: [], loaded: false };

  function loadSegments() {
    var l = document.getElementById("segmentsList");
    api("GET", "/api/segments").then(function (r) {
      segState.segments = r.segments || [];
      segState.loaded = true;
      renderSegments();
    }).catch(function (e) {
      l.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:13px">Could not load segments: ' + esc(e.message) + '</div>';
    });
  }

  function renderSegments() {
    var l = document.getElementById("segmentsList");
    if (!segState.segments.length) {
      l.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:30px">No segments yet. Click <strong>+ New Segment</strong> to create your first one.</div>';
      return;
    }
    l.innerHTML = segState.segments.map(function (s) {
      var f = s.filter || {};
      var chips = Object.keys(f).map(function (k) { return k + ': ' + esc(String(f[k])); }).join(' · ');
      return '<div style="background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:14px;margin-bottom:8px;display:flex;gap:14px;align-items:flex-start">' +
               '<div style="flex:1;min-width:0">' +
                 '<div style="font:700 14px Inter;color:#010F3B;margin-bottom:2px">' + esc(s.name) + '</div>' +
                 (s.description ? '<div style="color:#64748b;font:500 12px Inter">' + esc(s.description) + '</div>' : '') +
                 '<div style="color:#94a3b8;font:600 11px Inter;margin-top:6px">' + (chips || 'No filters — matches all contacts') + '</div>' +
               '</div>' +
               '<div style="display:flex;gap:6px">' +
                 '<button class="btn btn-secondary" data-seg-edit="' + s.id + '">Edit</button>' +
               '</div>' +
             '</div>';
    }).join("");
  }

  function openSegmentModal(s) {
    document.getElementById("segmentModalTitle").textContent = s ? "Edit Segment" : "New Segment";
    document.getElementById("segmentId").value = s ? s.id : "";
    document.getElementById("segName").value = s ? (s.name || "") : "";
    document.getElementById("segDesc").value = s ? (s.description || "") : "";
    var f = (s && s.filter) || {};
    document.getElementById("segSegment").value   = f.segment   || "";
    document.getElementById("segNiche").value     = f.niche_key || "";
    document.getElementById("segStatus").value    = f.status    || "";
    document.getElementById("segLifecycle").value = f.lifecycle_stage || "";
    document.getElementById("segScoreGte").value  = (typeof f.score_gte !== 'undefined') ? f.score_gte : "";
    document.getElementById("segScoreLte").value  = (typeof f.score_lte !== 'undefined') ? f.score_lte : "";
    document.getElementById("segHasPhone").checked   = !!f.has_phone;
    document.getElementById("segHasEmail").checked   = !!f.has_email;
    document.getElementById("segHasWebsite").checked = !!f.has_website;
    document.getElementById("segDelete").style.display = s ? "inline-flex" : "none";
    document.getElementById("segPreviewResult").innerHTML = "";
    document.getElementById("segmentModal").style.display = "flex";
  }
  function closeSegmentModal() { document.getElementById("segmentModal").style.display = "none"; }

  function readSegmentForm() {
    var f = {};
    var add = function (k, v) { if (v !== "" && v !== false && v !== null) f[k] = v; };
    add("segment",         document.getElementById("segSegment").value);
    add("niche_key",       document.getElementById("segNiche").value);
    add("status",          document.getElementById("segStatus").value);
    add("lifecycle_stage", document.getElementById("segLifecycle").value);
    var sgte = document.getElementById("segScoreGte").value;
    var slte = document.getElementById("segScoreLte").value;
    if (sgte !== "") f.score_gte = parseInt(sgte, 10);
    if (slte !== "") f.score_lte = parseInt(slte, 10);
    if (document.getElementById("segHasPhone").checked)   f.has_phone = true;
    if (document.getElementById("segHasEmail").checked)   f.has_email = true;
    if (document.getElementById("segHasWebsite").checked) f.has_website = true;
    return {
      name: document.getElementById("segName").value.trim(),
      description: document.getElementById("segDesc").value.trim(),
      filter: f,
    };
  }

  function previewSegment() {
    var data = readSegmentForm();
    api("POST", "/api/segments/preview", { filter: data.filter }).then(function (r) {
      var box = document.getElementById("segPreviewResult");
      box.innerHTML = '<div style="background:#f8fafc;border:1px solid #e3e5ee;border-radius:8px;padding:10px;margin-top:6px">' +
        '<strong style="color:#010F3B">' + r.count + '</strong> contacts match.' +
        (r.sample && r.sample.length ?
          '<div style="margin-top:6px;color:#64748b;font:500 12px Inter">Sample: ' +
            r.sample.slice(0,3).map(function(c){ return esc((c.name||c.email||'?')); }).join(', ') +
          '</div>' : '') +
        '</div>';
    }).catch(function (e) { toast("Preview failed: " + e.message, true); });
  }

  function saveSegment() {
    var id = document.getElementById("segmentId").value;
    var data = readSegmentForm();
    if (!data.name) { toast("Name is required.", true); return; }
    var p = id ? api("PUT", "/api/segments/" + id, data) : api("POST", "/api/segments", data);
    p.then(function () { toast(id ? "Updated." : "Saved."); closeSegmentModal(); loadSegments(); })
     .catch(function (e) { toast("Save failed: " + e.message, true); });
  }

  function deleteSegment() {
    var id = document.getElementById("segmentId").value;
    if (!id) return;
    if (!confirm("Delete this segment?")) return;
    api("DELETE", "/api/segments/" + id).then(function () {
      toast("Deleted."); closeSegmentModal(); loadSegments();
    }).catch(function (e) { toast(e.message, true); });
  }

  /* ═════════════════  FORECAST  ═════════════════ */
  function loadForecast() {
    var s = document.getElementById("forecastSummary");
    var o = document.getElementById("forecastByOwner");
    var m = document.getElementById("forecastByMonth");
    [s,o,m].forEach(function(e){ e.innerHTML = '<div style="color:#94a3b8;font:500 13px Inter">Loading…</div>'; });

    Promise.all([
      api("GET","/api/forecast"),
      api("GET","/api/forecast/by-owner"),
      api("GET","/api/forecast/by-month"),
    ]).then(function (results) {
      var sum = results[0], byO = results[1], byM = results[2];

      // Summary tiles + per-stage table
      var tiles =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px">' +
          tile("Open Deals",       sum.deal_count) +
          tile("Total Pipeline",   fmtMoney(sum.total_value)) +
          tile("Weighted Value",   fmtMoney(sum.weighted_value), "#FF671F") +
          tile("Avg Probability",  sum.avg_probability + "%") +
        '</div>';
      var rows = (sum.by_stage || []).map(function (st) {
        return '<tr><td>' + esc(st.stage) + '</td><td>' + st.count + '</td><td style="text-align:right">' + fmtMoney(st.value) + '</td><td style="text-align:right;color:#FF671F;font-weight:700">' + fmtMoney(st.weighted_value) + '</td></tr>';
      }).join("") || '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:14px">No open deals.</td></tr>';
      s.innerHTML = tiles + '<table class="data-table" style="width:100%"><thead><tr><th>Stage</th><th>Deals</th><th style="text-align:right">Value</th><th style="text-align:right">Weighted</th></tr></thead><tbody>' + rows + '</tbody></table>';

      // By owner
      var orows = (byO.by_owner || []).map(function (r) {
        return '<tr><td>' + esc(r.owner_name) + '</td><td>' + r.count + '</td><td style="text-align:right">' + fmtMoney(r.value) + '</td><td style="text-align:right;color:#FF671F;font-weight:700">' + fmtMoney(r.weighted_value) + '</td></tr>';
      }).join("") || '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:14px">No deals assigned.</td></tr>';
      o.innerHTML = '<table class="data-table" style="width:100%"><thead><tr><th>Owner</th><th>Deals</th><th style="text-align:right">Value</th><th style="text-align:right">Weighted</th></tr></thead><tbody>' + orows + '</tbody></table>';

      // By month
      var mrows = (byM.by_month || []).map(function (r) {
        var label = r.month === 'no_close' ? 'No close date' : r.month === 'later' ? 'Later (>6 mo)' : r.month;
        return '<tr><td>' + esc(label) + '</td><td>' + r.count + '</td><td style="text-align:right">' + fmtMoney(r.value) + '</td><td style="text-align:right;color:#FF671F;font-weight:700">' + fmtMoney(r.weighted_value) + '</td></tr>';
      }).join("") || '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:14px">—</td></tr>';
      m.innerHTML = '<table class="data-table" style="width:100%"><thead><tr><th>Month</th><th>Deals</th><th style="text-align:right">Value</th><th style="text-align:right">Weighted</th></tr></thead><tbody>' + mrows + '</tbody></table>';
    }).catch(function (e) {
      s.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:13px">Could not load forecast: ' + esc(e.message) + '</div>';
      o.innerHTML = ''; m.innerHTML = '';
    });
  }
  function tile(label, value, color) {
    return '<div style="background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:12px">' +
             '<div style="color:#64748b;font:600 11px Inter;text-transform:uppercase;letter-spacing:.4px">' + esc(label) + '</div>' +
             '<div style="color:' + (color || '#010F3B') + ';font:700 22px Inter;margin-top:4px">' + esc(String(value)) + '</div>' +
           '</div>';
  }

  /* ═════════════════  SNAPSHOTS  ═════════════════ */
  var snapState = { snapshots: [] };

  function loadSnapshots() {
    var l = document.getElementById("snapshotsList");
    api("GET", "/api/snapshots").then(function (r) {
      snapState.snapshots = r.snapshots || [];
      renderSnapshots();
    }).catch(function (e) {
      l.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:13px">Could not load snapshots: ' + esc(e.message) + '</div>';
    });
  }

  function renderSnapshots() {
    var l = document.getElementById("snapshotsList");
    if (!snapState.snapshots.length) {
      l.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:30px">No snapshots yet. Create one to capture your current scoring rules, pipeline, booking links, and more.</div>';
      return;
    }
    l.innerHTML = snapState.snapshots.map(function (s) {
      var sections = Array.isArray(s.sections) ? s.sections : [];
      return '<div style="background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:14px;margin-bottom:8px;display:flex;gap:14px;align-items:flex-start">' +
               '<div style="flex:1;min-width:0">' +
                 '<div style="font:700 14px Inter;color:#010F3B">' + esc(s.name) + '</div>' +
                 (s.description ? '<div style="color:#64748b;font:500 12px Inter;margin-top:2px">' + esc(s.description) + '</div>' : '') +
                 '<div style="color:#94a3b8;font:600 11px Inter;margin-top:6px">' +
                   sections.length + ' sections: ' + sections.join(', ') +
                 '</div>' +
                 '<div style="color:#94a3b8;font:500 11px Inter;margin-top:2px">Created ' + esc(s.created_at) + '</div>' +
               '</div>' +
               '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                 '<button class="btn btn-secondary" data-snap-export="' + s.id + '">Export</button>' +
                 '<button class="btn btn-primary"   data-snap-apply="'  + s.id + '">Apply</button>' +
                 '<button class="btn btn-danger"    data-snap-delete="' + s.id + '">Delete</button>' +
               '</div>' +
             '</div>';
    }).join("");
  }

  function openSnapModal() {
    document.getElementById("snapName").value = "";
    document.getElementById("snapDesc").value = "";
    var box = document.getElementById("snapSections");
    box.innerHTML = SECTIONS.map(function (s) {
      return '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-snap-section="' + s + '" checked> ' + s.replace(/_/g,' ') + '</label>';
    }).join("");
    document.getElementById("snapModal").style.display = "flex";
  }
  function closeSnapModal() { document.getElementById("snapModal").style.display = "none"; }

  function saveSnapshot() {
    var name = document.getElementById("snapName").value.trim();
    if (!name) { toast("Name is required.", true); return; }
    var includes = Array.prototype.slice.call(document.querySelectorAll('#snapSections input:checked')).map(function (c) { return c.getAttribute("data-snap-section"); });
    if (!includes.length) { toast("Pick at least one section.", true); return; }
    api("POST", "/api/snapshots", {
      name: name,
      description: document.getElementById("snapDesc").value.trim(),
      includes: includes,
    }).then(function () { toast("Snapshot created."); closeSnapModal(); loadSnapshots(); })
      .catch(function (e) { toast("Failed: " + e.message, true); });
  }

  function openSnapApplyModal(id) {
    document.getElementById("snapApplyId").value = id;
    var box = document.getElementById("snapApplySections");
    var snap = snapState.snapshots.find(function (s) { return String(s.id) === String(id); });
    var available = (snap && Array.isArray(snap.sections)) ? snap.sections : SECTIONS;
    box.innerHTML = available.map(function (s) {
      return '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-apply-section="' + s + '" checked> ' + s.replace(/_/g,' ') + '</label>';
    }).join("");
    document.getElementById("snapOverwrite").checked = false;
    document.getElementById("snapApplyModal").style.display = "flex";
  }
  function closeSnapApplyModal() { document.getElementById("snapApplyModal").style.display = "none"; }

  function applySnapshot() {
    var id = document.getElementById("snapApplyId").value;
    var sections = Array.prototype.slice.call(document.querySelectorAll('#snapApplySections input:checked')).map(function (c) { return c.getAttribute("data-apply-section"); });
    var overwrite = document.getElementById("snapOverwrite").checked;
    if (!sections.length) { toast("Pick at least one section.", true); return; }
    if (overwrite && !confirm("Overwrite is destructive — existing scoring rules and pipeline stages will be replaced. Continue?")) return;
    api("POST", "/api/snapshots/" + id + "/apply", { sections: sections, overwrite: overwrite })
      .then(function (r) {
        var counts = Object.keys(r.inserted || {}).map(function (k) { return k + ': ' + r.inserted[k]; }).join(', ');
        toast("Applied. " + (counts || ""));
        closeSnapApplyModal();
      })
      .catch(function (e) { toast("Apply failed: " + e.message, true); });
  }

  function exportSnapshot(id) {
    var token = '';
    try { token = localStorage.getItem("nwm_token") || ''; } catch (_) {}
    // Browser download — open the export URL with token in fetch then trigger download
    fetch("/api/snapshots/" + id + "/export", {
      headers: token ? { "X-Auth-Token": token } : {},
      credentials: "include",
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.blob().then(function (b) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = "snapshot-" + id + ".json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      });
    }).catch(function (e) { toast("Export failed: " + e.message, true); });
  }

  function deleteSnapshot(id) {
    if (!confirm("Delete this snapshot?")) return;
    api("DELETE", "/api/snapshots/" + id).then(function () {
      toast("Deleted."); loadSnapshots();
    }).catch(function (e) { toast(e.message, true); });
  }

  function importSnapshotFile(file) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var bundle = JSON.parse(rd.result);
        api("POST", "/api/snapshots/import", { snapshot: bundle }).then(function (r) {
          toast('Imported "' + (r.name || 'snapshot') + '"');
          loadSnapshots();
        }).catch(function (e) { toast("Import failed: " + e.message, true); });
      } catch (e) {
        toast("Invalid JSON file.", true);
      }
    };
    rd.readAsText(file);
  }

  /* ═════════════════  WIRING  ═════════════════ */
  document.addEventListener("DOMContentLoaded", function () {
    // Lazy-load each tab on first click
    document.querySelectorAll('.settings-tab').forEach(function (t) {
      t.addEventListener("click", function () {
        var tab = t.getAttribute("data-tab");
        if (tab === "lifecycle" && !window._lcLoaded) { loadLifecycle(); window._lcLoaded = true; }
        if (tab === "segments"  && !segState.loaded) { loadSegments(); }
        if (tab === "forecast"  && !window._fcLoaded) { loadForecast(); window._fcLoaded = true; }
        if (tab === "snapshots" && !window._snapLoaded) { loadSnapshots(); window._snapLoaded = true; }
      });
    });

    // Lifecycle
    var lcReload = document.getElementById("lifecycleReload"); if (lcReload) lcReload.addEventListener("click", loadLifecycle);
    var lcRecomp = document.getElementById("lifecycleRecompute"); if (lcRecomp) lcRecomp.addEventListener("click", recomputeLifecycle);

    // Segments
    var segNew = document.getElementById("segmentNew"); if (segNew) segNew.addEventListener("click", function () { openSegmentModal(null); });
    document.getElementById("segCancel")?.addEventListener("click", closeSegmentModal);
    document.getElementById("segSave")?.addEventListener("click", saveSegment);
    document.getElementById("segDelete")?.addEventListener("click", deleteSegment);
    document.getElementById("segPreview")?.addEventListener("click", previewSegment);
    document.getElementById("segmentModal")?.addEventListener("click", function (e) { if (e.target.id === "segmentModal") closeSegmentModal(); });
    document.getElementById("segmentsList")?.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-seg-edit]"); if (!btn) return;
      var id = btn.getAttribute("data-seg-edit");
      var s = segState.segments.find(function (x) { return String(x.id) === String(id); });
      if (s) openSegmentModal(s);
    });

    // Forecast
    var fcReload = document.getElementById("forecastReload"); if (fcReload) fcReload.addEventListener("click", loadForecast);

    // Snapshots
    var snapNew = document.getElementById("snapNew"); if (snapNew) snapNew.addEventListener("click", openSnapModal);
    document.getElementById("snapCancel")?.addEventListener("click", closeSnapModal);
    document.getElementById("snapSave")?.addEventListener("click", saveSnapshot);
    document.getElementById("snapModal")?.addEventListener("click", function (e) { if (e.target.id === "snapModal") closeSnapModal(); });
    document.getElementById("snapApplyCancel")?.addEventListener("click", closeSnapApplyModal);
    document.getElementById("snapApplyConfirm")?.addEventListener("click", applySnapshot);
    document.getElementById("snapApplyModal")?.addEventListener("click", function (e) { if (e.target.id === "snapApplyModal") closeSnapApplyModal(); });
    var snapImport = document.getElementById("snapImport");
    var snapFile = document.getElementById("snapImportFile");
    if (snapImport && snapFile) {
      snapImport.addEventListener("click", function () { snapFile.click(); });
      snapFile.addEventListener("change", function () {
        if (snapFile.files && snapFile.files[0]) importSnapshotFile(snapFile.files[0]);
        snapFile.value = "";
      });
    }
    document.getElementById("snapshotsList")?.addEventListener("click", function (e) {
      var apply = e.target.closest("[data-snap-apply]");
      var del   = e.target.closest("[data-snap-delete]");
      var exp   = e.target.closest("[data-snap-export]");
      if (apply) openSnapApplyModal(apply.getAttribute("data-snap-apply"));
      if (del)   deleteSnapshot(del.getAttribute("data-snap-delete"));
      if (exp)   exportSnapshot(exp.getAttribute("data-snap-export"));
    });
  });
})();

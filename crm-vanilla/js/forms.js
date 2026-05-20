/* Forms admin — list + drag-drop builder + submissions viewer.
   Backed by /api/forms (api-php/routes/forms.php).
*/
(function () {
  "use strict";
  var API = "/api/forms";

  var FIELD_TYPES = [
    { v: 'text',     label: '📝 Single line' },
    { v: 'email',    label: '✉️ Email' },
    { v: 'phone',    label: '📞 Phone' },
    { v: 'number',   label: '#️⃣ Number' },
    { v: 'textarea', label: '📄 Paragraph' },
    { v: 'select',   label: '⬇ Dropdown' },
    { v: 'checkbox', label: '☑ Checkbox' },
    { v: 'consent',  label: '⚖ Consent (GDPR)' },
    { v: 'hidden',   label: '🕶 Hidden' },
  ];

  var state = {
    forms: [],
    current: null,
    selectedIdx: -1,
    submissionForms: [],
    submissions: [],
  };

  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, { method: method, headers: headers, credentials: "include",
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

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ── tabs ── */
  function bindTabs() {
    var tabs = document.querySelectorAll(".forms-tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.querySelectorAll(".forms-panel").forEach(function (p) { p.classList.remove("active"); });
        var key = t.getAttribute("data-tab");
        document.getElementById("forms-" + key).classList.add("active");
        if (key === 'submissions') loadSubmissionForms();
      });
    });
  }

  function showTab(key) {
    document.querySelectorAll(".forms-tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === key);
    });
    document.querySelectorAll(".forms-panel").forEach(function (p) { p.classList.remove("active"); });
    document.getElementById("forms-" + key).classList.add("active");
  }

  /* ── LIST ── */
  function loadList() {
    return api("GET", API).then(function (r) {
      state.forms = r.forms || [];
      renderList();
    }).catch(function (e) {
      var l = document.getElementById("formsList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load forms: ' + esc(e.message) +
        '<br><small>Make sure /api/forms is deployed and you are signed in.</small></div>';
    });
  }

  function renderList() {
    var l = document.getElementById("formsList");
    if (!state.forms.length) {
      l.innerHTML = '<div class="empty-state">No forms yet. Click <strong>+ New Form</strong> to build one.</div>';
      return;
    }
    var origin = location.origin;
    l.innerHTML = state.forms.map(function (f) {
      var url = origin + "/form.html?slug=" + encodeURIComponent(f.slug);
      return '<div class="form-row' + (f.is_active ? '' : ' disabled') + '">' +
               '<div class="info">' +
                 '<h4>' + esc(f.name) + (f.is_active ? '' : ' <span style="font-size:10px;background:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:4px;font-weight:600">PAUSED</span>') + '</h4>' +
                 (f.description ? '<div class="desc">' + esc(f.description) + '</div>' : '') +
                 '<a href="' + esc(url) + '" target="_blank" style="color:#FF671F;font:500 12px Inter;text-decoration:none;display:block;margin-top:4px;word-break:break-all">' + esc(url) + '</a>' +
                 '<div class="meta">' +
                   '<span>📋 ' + (f.fields ? f.fields.length : 0) + ' fields</span>' +
                   '<span>📥 ' + f.submission_count + ' submissions</span>' +
                 '</div>' +
               '</div>' +
               '<div class="actions">' +
                 '<button class="btn btn-secondary" data-action="edit"   data-id="' + f.id + '">Edit</button>' +
                 '<button class="btn btn-secondary" data-action="embed"  data-id="' + f.id + '">Embed</button>' +
                 '<button class="btn btn-danger"    data-action="delete" data-id="' + f.id + '">Delete</button>' +
               '</div>' +
             '</div>';
    }).join("");
  }

  /* ── BUILDER ── */
  function renderPalette() {
    var box = document.getElementById("ftypeBox");
    box.innerHTML = FIELD_TYPES.map(function (t) {
      return '<div class="ftype-source" draggable="true" data-ftype="' + t.v + '">' + t.label + '</div>';
    }).join("");
    box.querySelectorAll(".ftype-source").forEach(function (el) {
      el.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/x-form-type", el.getAttribute("data-ftype"));
        e.dataTransfer.effectAllowed = "copy";
      });
    });
  }

  function emptyForm() {
    return {
      id: null,
      name: 'Untitled form',
      slug: '',
      description: '',
      fields: [],
      success_msg: 'Thanks — your submission has been received.',
      redirect_url: '',
      notify_email: '',
      is_active: 1,
    };
  }

  function loadFormForEdit(id) {
    api("GET", API + "/" + id).then(function (r) {
      state.current = r.form;
      state.selectedIdx = -1;
      reflectForm();
      renderStage();
      renderInspector();
      showTab('builder');
    }).catch(function (e) { toast("Load failed: " + e.message, true); });
  }

  function reflectForm() {
    var f = state.current;
    document.getElementById("bName").value = f.name || '';
    document.getElementById("bSlug").value = f.slug || '';
    document.getElementById("bDescription").value = f.description || '';
    document.getElementById("bSuccess").value = f.success_msg || '';
    document.getElementById("bRedirect").value = f.redirect_url || '';
    document.getElementById("bNotify").value = f.notify_email || '';
    document.getElementById("bActive").checked = !!f.is_active;
  }

  function renderStage() {
    var stage = document.getElementById("ffStage");
    var fs = state.current && state.current.fields ? state.current.fields : [];
    if (!fs.length) {
      stage.innerHTML = '<div class="ff-empty" data-form-drop-root>Drag a field type from the left to start.</div>';
      attachRootDrop();
      return;
    }
    var html = '<div class="ff-drop-target" data-drop-idx="0"></div>';
    fs.forEach(function (f, i) {
      var meta = (f.type || 'text') + (f.required ? ' · required' : '') + (f.always_show ? ' · always shown' : '') + ' · queue ' + (f.queue || 0);
      html += '<div class="ff-row' + (i === state.selectedIdx ? ' selected' : '') + '" data-idx="' + i + '" draggable="true">' +
                '<span class="grip">⠿</span>' +
                '<div style="flex:1;min-width:0">' +
                  '<div class="label">' + esc(f.label || f.name) + (f.required ? ' <span class="req">*</span>' : '') + '</div>' +
                  '<div class="meta">' + esc(meta) + '</div>' +
                '</div>' +
                '<div class="actions">' +
                  '<button data-up>▲</button><button data-down>▼</button><button data-rm>✕</button>' +
                '</div>' +
              '</div>';
      html += '<div class="ff-drop-target" data-drop-idx="' + (i + 1) + '"></div>';
    });
    stage.innerHTML = html;
    attachStageEvents();
  }

  function attachRootDrop() {
    var root = document.querySelector("[data-form-drop-root]");
    if (!root) return;
    root.addEventListener("dragover", function (e) { e.preventDefault(); });
    root.addEventListener("drop", function (e) {
      e.preventDefault();
      var t = e.dataTransfer.getData("text/x-form-type");
      if (t) addFieldAt(0, t);
    });
  }

  function attachStageEvents() {
    document.querySelectorAll(".ff-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest(".actions")) return;
        var idx = parseInt(row.getAttribute("data-idx"), 10);
        state.selectedIdx = idx;
        renderStage();
        renderInspector();
      });
      row.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/x-form-move", row.getAttribute("data-idx"));
        e.dataTransfer.effectAllowed = "move";
      });
      row.querySelector("[data-up]").addEventListener("click", function (e) { e.stopPropagation(); moveField(parseInt(row.getAttribute("data-idx"), 10), -1); });
      row.querySelector("[data-down]").addEventListener("click", function (e) { e.stopPropagation(); moveField(parseInt(row.getAttribute("data-idx"), 10),  1); });
      row.querySelector("[data-rm]").addEventListener("click", function (e) { e.stopPropagation(); removeField(parseInt(row.getAttribute("data-idx"), 10)); });
    });

    document.querySelectorAll(".ff-drop-target").forEach(function (dt) {
      dt.addEventListener("dragover", function (e) { e.preventDefault(); dt.classList.add("over"); });
      dt.addEventListener("dragleave", function () { dt.classList.remove("over"); });
      dt.addEventListener("drop", function (e) {
        e.preventDefault(); dt.classList.remove("over");
        var idx = parseInt(dt.getAttribute("data-drop-idx"), 10);
        var srcType = e.dataTransfer.getData("text/x-form-type");
        if (srcType) { addFieldAt(idx, srcType); return; }
        var move = e.dataTransfer.getData("text/x-form-move");
        if (move !== '') {
          var from = parseInt(move, 10);
          if (from === idx || from + 1 === idx) return;
          var f = state.current.fields.splice(from, 1)[0];
          var insertAt = idx > from ? idx - 1 : idx;
          state.current.fields.splice(insertAt, 0, f);
          state.selectedIdx = insertAt;
          state.current.fields.forEach(function (x, i) { x.queue = i + 1; });
          renderStage(); renderInspector();
        }
      });
    });
  }

  function addFieldAt(idx, type) {
    if (!state.current) state.current = emptyForm();
    var nameSeed = ({ email:'email', phone:'phone', text:'field', textarea:'message', select:'choice',
      checkbox:'agree', consent:'consent', hidden:'hidden_field', number:'amount' }[type] || 'field');
    var existing = state.current.fields.filter(function (f) { return (f.name || '').indexOf(nameSeed) === 0; }).length;
    var name = nameSeed + (existing > 0 ? '_' + (existing + 1) : '');
    var label = ({ email:'Email', phone:'Phone', text:'Field', textarea:'Message', select:'Choose one',
      checkbox:'I agree', consent:'I consent to receive communications', hidden:'Hidden value', number:'Number' }[type] || 'Field');
    state.current.fields.splice(idx, 0, {
      name: name, label: label, type: type,
      required: (type === 'email' || type === 'consent'),
      placeholder: '',
      queue: idx + 1,
      always_show: 0,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    });
    state.current.fields.forEach(function (f, i) { f.queue = i + 1; });
    state.selectedIdx = idx;
    renderStage();
    renderInspector();
  }

  function moveField(idx, dir) {
    var to = idx + dir;
    if (to < 0 || to >= state.current.fields.length) return;
    var f = state.current.fields;
    var t = f[idx]; f[idx] = f[to]; f[to] = t;
    f.forEach(function (x, i) { x.queue = i + 1; });
    state.selectedIdx = to;
    renderStage(); renderInspector();
  }

  function removeField(idx) {
    state.current.fields.splice(idx, 1);
    state.current.fields.forEach(function (f, i) { f.queue = i + 1; });
    if (state.selectedIdx === idx) state.selectedIdx = -1;
    else if (state.selectedIdx > idx) state.selectedIdx -= 1;
    renderStage(); renderInspector();
  }

  function renderInspector() {
    var body = document.getElementById("builderInspectorBody");
    if (!state.current || state.selectedIdx < 0) {
      body.innerHTML = '<div style="color:#94a3b8;font-size:12px">Select a field to edit.</div>';
      return;
    }
    var f = state.current.fields[state.selectedIdx];
    body.innerHTML =
      '<label>Field name (saved as)</label><input data-edit="name" value="' + esc(f.name) + '">' +
      '<label>Label</label><input data-edit="label" value="' + esc(f.label || '') + '">' +
      '<label>Placeholder</label><input data-edit="placeholder" value="' + esc(f.placeholder || '') + '">' +
      '<label>Help text</label><input data-edit="help" value="' + esc(f.help || '') + '">' +
      ((f.type === 'select') ? ('<label>Options (one per line)</label><textarea data-edit-list="options" rows="4">' + esc(((f.options || []).join("\n"))) + '</textarea>') : '') +
      '<label class="check"><input type="checkbox" data-edit-bool="required"' + (f.required ? ' checked' : '') + '> Required</label>' +
      '<label class="check"><input type="checkbox" data-edit-bool="always_show"' + (f.always_show ? ' checked' : '') + '> Always show (skip progressive profiling)</label>';

    body.querySelectorAll("[data-edit]").forEach(function (el) {
      el.addEventListener("input", function () {
        var k = el.getAttribute("data-edit");
        f[k] = el.value;
        if (k === 'label' || k === 'name') renderStage();
      });
    });
    body.querySelectorAll("[data-edit-list]").forEach(function (el) {
      el.addEventListener("change", function () {
        var k = el.getAttribute("data-edit-list");
        f[k] = el.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
      });
    });
    body.querySelectorAll("[data-edit-bool]").forEach(function (el) {
      el.addEventListener("change", function () {
        var k = el.getAttribute("data-edit-bool");
        f[k] = el.checked ? 1 : 0;
        renderStage();
      });
    });
  }

  function readForm() {
    if (!state.current) state.current = emptyForm();
    state.current.name        = document.getElementById("bName").value.trim();
    state.current.slug        = document.getElementById("bSlug").value.trim().replace(/[^a-z0-9\-]/g, '');
    state.current.description = document.getElementById("bDescription").value.trim();
    state.current.success_msg = document.getElementById("bSuccess").value.trim();
    state.current.redirect_url= document.getElementById("bRedirect").value.trim();
    state.current.notify_email= document.getElementById("bNotify").value.trim();
    state.current.is_active   = document.getElementById("bActive").checked ? 1 : 0;
    return state.current;
  }

  function saveForm() {
    var f = readForm();
    if (!f.name) { toast("Name is required.", true); return; }
    if (!f.fields.length) { toast("Add at least one field.", true); return; }

    var payload = {
      name: f.name, slug: f.slug || undefined,
      description: f.description, fields: f.fields,
      success_msg: f.success_msg, redirect_url: f.redirect_url,
      notify_email: f.notify_email, is_active: f.is_active,
    };
    var p = f.id
      ? api("PUT",  API + "/" + f.id, payload)
      : api("POST", API,             payload).then(function (r) { state.current.id = r.id; state.current.slug = r.slug; reflectForm(); return r; });
    p.then(function () { toast(f.id ? "Form updated." : "Form created."); loadList(); })
     .catch(function (e) { toast("Save failed: " + e.message, true); });
  }

  function deleteForm(id) {
    if (!confirm("Delete this form? Submissions will also be removed.")) return;
    api("DELETE", API + "/" + id).then(function () { toast("Deleted."); loadList(); })
      .catch(function (e) { toast("Delete failed: " + e.message, true); });
  }

  /* ── EMBED ── */
  function showEmbed(id) {
    api("GET", API + "/" + id + "/embed").then(function (r) {
      document.getElementById("embedIframe").textContent = r.iframe_html || '';
      document.getElementById("embedDirect").textContent = r.direct_url || '';
      document.getElementById("embedModal").classList.add("open");
    }).catch(function (e) { toast("Embed failed: " + e.message, true); });
  }

  /* ── SUBMISSIONS ── */
  function loadSubmissionForms() {
    var sel = document.getElementById("subFormSelect");
    sel.innerHTML = '<option value="">Select a form…</option>' +
      state.forms.map(function (f) { return '<option value="' + f.id + '">' + esc(f.name) + '</option>'; }).join("");
  }
  function loadSubmissions(id) {
    if (!id) { document.getElementById("submissionsList").innerHTML = '<div class="empty-state">Pick a form to view submissions.</div>'; return; }
    api("GET", API + "/" + id + "/submissions").then(function (r) {
      state.submissions = r.submissions || [];
      renderSubmissions();
    }).catch(function (e) {
      document.getElementById("submissionsList").innerHTML = '<div class="empty-state">Could not load: ' + esc(e.message) + '</div>';
    });
  }
  function renderSubmissions() {
    var l = document.getElementById("submissionsList");
    if (!state.submissions.length) {
      l.innerHTML = '<div class="empty-state">No submissions yet.</div>';
      return;
    }
    l.innerHTML = state.submissions.map(function (s) {
      var rows = Object.keys(s.payload || {}).map(function (k) {
        return '<tr><td style="color:#64748b;font:600 11px Inter;text-transform:uppercase;letter-spacing:.4px;padding:4px 8px;width:140px">' + esc(k) + '</td>' +
               '<td style="padding:4px 8px">' + esc(typeof s.payload[k] === 'string' ? s.payload[k] : JSON.stringify(s.payload[k])) + '</td></tr>';
      }).join("");
      return '<div style="background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:12px;margin-bottom:8px">' +
               '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                 '<strong style="color:#010F3B">Submission #' + s.id + '</strong>' +
                 '<span style="color:#94a3b8;font:600 11px Inter">' + esc(s.created_at) + (s.contact_id ? ' · contact #' + s.contact_id : '') + '</span>' +
               '</div>' +
               '<table style="width:100%;font-size:13px;color:#1a1a2e">' + rows + '</table>' +
             '</div>';
    }).join("");
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) CRM_APP.buildHeader("Forms", '');

    bindTabs();
    renderPalette();

    document.getElementById("newFormBtn").addEventListener("click", function () {
      state.current = emptyForm(); state.selectedIdx = -1;
      reflectForm(); renderStage(); renderInspector();
      showTab('builder');
    });

    document.getElementById("bSave").addEventListener("click", saveForm);
    document.getElementById("bSettings").addEventListener("click", function () { document.getElementById("settingsModal").classList.add("open"); });
    document.getElementById("settingsClose").addEventListener("click", function () { document.getElementById("settingsModal").classList.remove("open"); });
    document.getElementById("bEmbed").addEventListener("click", function () {
      if (!state.current || !state.current.id) { toast("Save the form first.", true); return; }
      showEmbed(state.current.id);
    });
    document.getElementById("embedClose").addEventListener("click", function () { document.getElementById("embedModal").classList.remove("open"); });

    document.getElementById("settingsModal").addEventListener("click", function (e) {
      if (e.target.id === "settingsModal") e.currentTarget.classList.remove("open");
    });
    document.getElementById("embedModal").addEventListener("click", function (e) {
      if (e.target.id === "embedModal") e.currentTarget.classList.remove("open");
    });

    document.getElementById("formsList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]"); if (!btn) return;
      var id = parseInt(btn.getAttribute("data-id"), 10);
      var action = btn.getAttribute("data-action");
      if (action === "edit")   loadFormForEdit(id);
      if (action === "delete") deleteForm(id);
      if (action === "embed")  showEmbed(id);
    });

    document.getElementById("subFormSelect").addEventListener("change", function () {
      loadSubmissions(this.value);
    });
    document.getElementById("subReload").addEventListener("click", function () {
      var id = document.getElementById("subFormSelect").value;
      if (id) loadSubmissions(id);
    });

    // Initial empty state for builder
    state.current = emptyForm(); reflectForm(); renderStage();

    loadList();
  });
})();

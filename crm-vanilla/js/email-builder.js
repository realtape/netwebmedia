/* Email Builder — drag-drop block editor.
   Backed by /api/email-builder (api-php/routes/email_builder.php).
*/
(function () {
  "use strict";
  var API = "/api/email-builder";

  var BLOCK_TYPES = [
    { type: 'heading',   label: '📰 Heading',   defaults: { text: 'Big headline goes here', level: 'h1', align: 'left' } },
    { type: 'paragraph', label: '📝 Paragraph', defaults: { text: 'Tell your story here. Mention {{first_name}} or {{company}} for personalization.', align: 'left' } },
    { type: 'button',    label: '👆 Button',    defaults: { text: 'Get Started', url: 'https://netwebmedia.com', align: 'center', color: '#FF671F' } },
    { type: 'image',     label: '🖼️ Image',     defaults: { src: 'https://netwebmedia.com/img/og-image.jpg', alt: '', width: 560 } },
    { type: 'divider',   label: '— Divider',    defaults: {} },
    { type: 'spacer',    label: '↕ Spacer',     defaults: { height: 24 } },
    { type: 'columns',   label: '🟰 Two Columns', defaults: { left: [{ type: 'paragraph', text: 'Left column' }], right: [{ type: 'paragraph', text: 'Right column' }] } },
  ];

  var state = {
    id: null,
    name: '',
    subject: '',
    preheader: '',
    blocks: [],          // tree
    selectedIdx: -1,     // top-level index for now
    settings: {},
    saved: false,
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
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
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

  /* ── palette ── */
  function renderPalette() {
    var pal = document.getElementById("ebPalette");
    pal.innerHTML = BLOCK_TYPES.map(function (b) {
      return '<div class="eb-block-source" draggable="true" data-block-type="' + b.type + '">' + b.label + '</div>';
    }).join("");
    pal.querySelectorAll(".eb-block-source").forEach(function (el) {
      el.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/x-eb-source", el.getAttribute("data-block-type"));
        e.dataTransfer.effectAllowed = "copy";
      });
    });
  }

  /* ── canvas / stage ── */
  function renderStage() {
    var stage = document.getElementById("ebStage");
    stage.classList.remove("empty");
    if (!state.blocks.length) {
      stage.classList.add("empty");
      stage.innerHTML = '<div class="eb-stage empty" data-eb-drop-root>Drag blocks from the left panel to start.</div>';
      attachRootDrop();
      return;
    }
    var html = '';
    html += '<div class="eb-drop-target" data-drop-idx="0"></div>';
    state.blocks.forEach(function (blk, i) {
      html += '<div class="eb-block-host" data-idx="' + i + '" draggable="true">' +
                '<div class="controls">' +
                  '<button data-up>▲</button><button data-down>▼</button><button data-rm>✕</button>' +
                '</div>' +
                blockPreviewHtml(blk) +
              '</div>';
      html += '<div class="eb-drop-target" data-drop-idx="' + (i + 1) + '"></div>';
    });
    stage.innerHTML = html;
    attachStageEvents();
  }

  function blockPreviewHtml(blk) {
    switch (blk.type) {
      case 'heading':
        var t = ['', 'h1','h2','h3'].indexOf(blk.level) > 0 ? blk.level : 'h1';
        var size = { h1: '26px', h2: '20px', h3: '17px' }[t];
        return '<div style="padding:18px 24px 6px;text-align:' + esc(blk.align || 'left') + '"><' + t + ' style="margin:0;font:700 ' + size + '/1.2 Inter;color:#1a1a2e">' + esc(blk.text || '') + '</' + t + '></div>';
      case 'paragraph':
        return '<div style="padding:6px 24px;text-align:' + esc(blk.align || 'left') + '"><p style="margin:0;font:400 14px/1.55 Inter;color:#1a1a2e;white-space:pre-wrap">' + esc(blk.text || '') + '</p></div>';
      case 'button':
        var bg = esc(blk.color || '#FF671F');
        return '<div style="padding:14px 24px;text-align:' + esc(blk.align || 'center') + '">' +
                 '<span style="display:inline-block;background:' + bg + ';color:#fff;font:700 13px Inter;padding:10px 18px;border-radius:8px">' + esc(blk.text || 'Click here') + '</span>' +
               '</div>';
      case 'image':
        var src = esc(blk.src || '');
        return '<div style="padding:8px 24px;text-align:center"><img src="' + src + '" alt="" style="max-width:100%;display:block;margin:0 auto;border-radius:4px" onerror="this.style.opacity=.4"></div>';
      case 'divider':
        return '<div style="padding:8px 24px"><hr style="border:none;border-top:1px solid #e3e5ee;margin:0"></div>';
      case 'spacer':
        var h = parseInt(blk.height, 10) || 24;
        return '<div style="height:' + h + 'px;background:repeating-linear-gradient(45deg,transparent 0 4px,#f2f3f8 4px 8px)"></div>';
      case 'columns':
        var l = (blk.left || []).map(blockPreviewHtml).join("");
        var r = (blk.right || []).map(blockPreviewHtml).join("");
        return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 24px"><div style="border:1px dashed #e3e5ee;border-radius:4px">' + l + '</div><div style="border:1px dashed #e3e5ee;border-radius:4px">' + r + '</div></div>';
    }
    return '<div>?</div>';
  }

  function attachRootDrop() {
    var root = document.querySelector("[data-eb-drop-root]");
    if (!root) return;
    root.addEventListener("dragover", function (e) { e.preventDefault(); });
    root.addEventListener("drop", function (e) {
      e.preventDefault();
      var t = e.dataTransfer.getData("text/x-eb-source");
      if (!t) return;
      addBlockAt(0, t);
    });
  }

  function attachStageEvents() {
    document.querySelectorAll(".eb-block-host").forEach(function (host) {
      host.addEventListener("click", function (e) {
        if (e.target.closest(".controls")) return;
        var idx = parseInt(host.getAttribute("data-idx"), 10);
        selectBlock(idx);
      });

      // Drag a host to reorder
      host.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/x-eb-move", host.getAttribute("data-idx"));
        e.dataTransfer.effectAllowed = "move";
      });

      host.querySelector("[data-up]").addEventListener("click", function (e) { e.stopPropagation(); moveBlock(parseInt(host.getAttribute("data-idx"), 10), -1); });
      host.querySelector("[data-down]").addEventListener("click", function (e) { e.stopPropagation(); moveBlock(parseInt(host.getAttribute("data-idx"), 10),  1); });
      host.querySelector("[data-rm]").addEventListener("click", function (e) { e.stopPropagation(); removeBlock(parseInt(host.getAttribute("data-idx"), 10)); });
    });

    document.querySelectorAll(".eb-drop-target").forEach(function (dt) {
      dt.addEventListener("dragover", function (e) { e.preventDefault(); dt.classList.add("over"); });
      dt.addEventListener("dragleave", function () { dt.classList.remove("over"); });
      dt.addEventListener("drop", function (e) {
        e.preventDefault();
        dt.classList.remove("over");
        var idx = parseInt(dt.getAttribute("data-drop-idx"), 10);
        var srcType = e.dataTransfer.getData("text/x-eb-source");
        if (srcType) { addBlockAt(idx, srcType); return; }
        var moveFrom = e.dataTransfer.getData("text/x-eb-move");
        if (moveFrom !== '') {
          var from = parseInt(moveFrom, 10);
          if (from === idx || from + 1 === idx) return;
          var blk = state.blocks.splice(from, 1)[0];
          var insertAt = idx > from ? idx - 1 : idx;
          state.blocks.splice(insertAt, 0, blk);
          renderStage();
          markDirty();
        }
      });
    });
  }

  function addBlockAt(idx, type) {
    var def = BLOCK_TYPES.find(function (b) { return b.type === type; });
    if (!def) return;
    var blk = Object.assign({ type: type }, clone(def.defaults));
    state.blocks.splice(idx, 0, blk);
    state.selectedIdx = idx;
    renderStage();
    renderInspector();
    markDirty();
  }

  function moveBlock(idx, dir) {
    var to = idx + dir;
    if (to < 0 || to >= state.blocks.length) return;
    var b = state.blocks[idx]; state.blocks[idx] = state.blocks[to]; state.blocks[to] = b;
    state.selectedIdx = to;
    renderStage(); renderInspector(); markDirty();
  }

  function removeBlock(idx) {
    state.blocks.splice(idx, 1);
    if (state.selectedIdx === idx) state.selectedIdx = -1;
    else if (state.selectedIdx > idx) state.selectedIdx -= 1;
    renderStage(); renderInspector(); markDirty();
  }

  function selectBlock(idx) {
    state.selectedIdx = idx;
    document.querySelectorAll(".eb-block-host").forEach(function (h) { h.classList.toggle("selected", parseInt(h.getAttribute("data-idx"), 10) === idx); });
    renderInspector();
  }

  /* ── inspector ── */
  function renderInspector() {
    var insp = document.getElementById("ebInspectorBody");
    if (state.selectedIdx < 0 || state.selectedIdx >= state.blocks.length) {
      insp.innerHTML = '<div style="color:#94a3b8;font-size:12px">Select a block to edit.</div>';
      return;
    }
    var b = state.blocks[state.selectedIdx];
    var f = '';
    switch (b.type) {
      case 'heading':
        f = field('Text', '<input data-edit="text" value="' + esc(b.text || '') + '">') +
            row(
              field('Level', '<select data-edit="level"><option ' + sel(b.level === 'h1') + '>h1</option><option ' + sel(b.level === 'h2') + '>h2</option><option ' + sel(b.level === 'h3') + '>h3</option></select>'),
              field('Align', alignSelect(b.align))
            );
        break;
      case 'paragraph':
        f = field('Text', '<textarea data-edit="text">' + esc(b.text || '') + '</textarea>') +
            field('Align', alignSelect(b.align));
        break;
      case 'button':
        f = field('Text', '<input data-edit="text" value="' + esc(b.text || '') + '">') +
            field('URL',  '<input data-edit="url" value="' + esc(b.url || '') + '">') +
            row(
              field('Align', alignSelect(b.align, 'center')),
              field('Color', '<input type="color" data-edit="color" value="' + esc(b.color || '#FF671F') + '">')
            );
        break;
      case 'image':
        f = field('Image URL', '<input data-edit="src" value="' + esc(b.src || '') + '">') +
            field('Alt text',  '<input data-edit="alt" value="' + esc(b.alt || '') + '">') +
            row(
              field('Width',  '<input type="number" data-edit="width" value="' + esc(b.width || 560) + '">'),
              field('Link URL', '<input data-edit="link" value="' + esc(b.link || '') + '">')
            );
        break;
      case 'spacer':
        f = field('Height (px)', '<input type="number" data-edit="height" value="' + esc(b.height || 24) + '">');
        break;
      case 'columns':
        f = '<div style="color:#64748b;font-size:12px">Columns are nested. To edit cells, future versions will let you click into them. For now, edit JSON below:</div>' +
            field('Left blocks (JSON)',  '<textarea data-edit-json="left">'  + esc(JSON.stringify(b.left  || [], null, 2)) + '</textarea>') +
            field('Right blocks (JSON)', '<textarea data-edit-json="right">' + esc(JSON.stringify(b.right || [], null, 2)) + '</textarea>');
        break;
      default:
        f = '<div style="color:#94a3b8;font-size:12px">No editable fields for this block.</div>';
    }
    insp.innerHTML = f;
    insp.querySelectorAll("[data-edit]").forEach(function (el) {
      el.addEventListener("input", function () {
        var k = el.getAttribute("data-edit");
        var v = el.type === 'number' ? (parseInt(el.value, 10) || 0) : el.value;
        state.blocks[state.selectedIdx][k] = v;
        renderStage();
        // Re-select the same block to reapply the highlight after stage rerender
        var hosts = document.querySelectorAll(".eb-block-host");
        if (hosts[state.selectedIdx]) hosts[state.selectedIdx].classList.add("selected");
        markDirty();
      });
    });
    insp.querySelectorAll("[data-edit-json]").forEach(function (el) {
      el.addEventListener("change", function () {
        try {
          var k = el.getAttribute("data-edit-json");
          state.blocks[state.selectedIdx][k] = JSON.parse(el.value);
          renderStage();
          markDirty();
        } catch (e) { toast("Invalid JSON", true); }
      });
    });
  }

  function field(label, inputHtml) {
    return '<label>' + esc(label) + '</label>' + inputHtml;
  }
  function row(a, b) { return '<div class="row">' + a + '<div></div>' + b + '</div>'; }
  function sel(cond) { return cond ? 'selected' : ''; }
  function alignSelect(v, def) {
    var d = v || def || 'left';
    return '<select data-edit="align"><option ' + sel(d === 'left') + '>left</option><option ' + sel(d === 'center') + '>center</option><option ' + sel(d === 'right') + '>right</option></select>';
  }

  /* ── persistence ── */
  function loadList() {
    api("GET", API + "/templates").then(function (r) {
      var sel = document.getElementById("ebTplSelect");
      sel.innerHTML = '<option value="">— New template —</option>' +
        (r.templates || []).map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join("");
    }).catch(function () { /* silent */ });
  }

  function loadTemplate(id) {
    if (!id) {
      state.id = null; state.name = ''; state.subject = ''; state.preheader = '';
      state.blocks = []; state.selectedIdx = -1; state.settings = {};
      reflectInputs(); renderStage(); renderInspector();
      return;
    }
    api("GET", API + "/templates/" + id).then(function (r) {
      var t = r.template;
      state.id = t.id; state.name = t.name || '';
      state.subject = t.subject || ''; state.preheader = t.preheader || '';
      state.blocks = Array.isArray(t.blocks) ? t.blocks : [];
      state.settings = t.settings || {};
      state.selectedIdx = -1;
      reflectInputs(); renderStage(); renderInspector();
    }).catch(function (e) { toast("Could not load: " + (e.statusText || 'API error'), true); });
  }

  function reflectInputs() {
    document.getElementById("ebName").value      = state.name;
    document.getElementById("ebSubject").value   = state.subject;
    document.getElementById("ebPreheader").value = state.preheader;
    var sel = document.getElementById("ebTplSelect");
    if (sel) sel.value = state.id ? String(state.id) : '';
  }

  function readInputs() {
    state.name      = document.getElementById("ebName").value.trim();
    state.subject   = document.getElementById("ebSubject").value.trim();
    state.preheader = document.getElementById("ebPreheader").value.trim();
  }

  function save(asCopy) {
    readInputs();
    if (!state.name) { toast("Template name is required.", true); return; }
    var data = {
      name: state.name, subject: state.subject, preheader: state.preheader,
      blocks: state.blocks, settings: state.settings,
    };
    var p = (asCopy || !state.id)
      ? api("POST", API + "/templates", data).then(function (r) { state.id = r.id; })
      : api("PUT",  API + "/templates/" + state.id, data);
    p.then(function () { toast(asCopy ? "Saved as new copy." : "Saved."); state.saved = true; loadList(); reflectInputs(); })
     .catch(function (e) { toast("Save failed: " + (e.statusText || 'API error'), true); });
  }

  function testSend() {
    readInputs();
    var to = prompt("Send test email to:");
    if (!to) return;
    api("POST", API + "/test-send", {
      to: to, subject: state.subject || state.name || '(no subject)',
      blocks: state.blocks, preheader: state.preheader, settings: state.settings,
      vars: { first_name: 'Friend', name: 'Friend', company: 'Acme', email: to },
    }).then(function (r) {
      if (r.sent) toast("Sent test to " + to);
      else toast("Render OK but mail send is unavailable on the local server.", true);
    }).catch(function (e) { toast("Test failed: " + (e.statusText || 'API error'), true); });
  }

  function markDirty() { state.saved = false; }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) CRM_APP.buildHeader("Email Builder", '');
    renderPalette();
    renderStage();
    loadList();

    document.getElementById("ebTplSelect").addEventListener("change", function () { loadTemplate(this.value); });
    document.getElementById("ebSave").addEventListener("click", function () { save(false); });
    document.getElementById("ebSaveAs").addEventListener("click", function () { save(true); });
    document.getElementById("ebTestSend").addEventListener("click", testSend);

    ["ebName","ebSubject","ebPreheader"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", markDirty);
    });

    window.addEventListener("beforeunload", function (e) {
      if (!state.saved && (state.blocks.length || state.name)) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  });
})();

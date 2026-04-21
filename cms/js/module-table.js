/* Generic module table + modal editor.
   window.NWM.mount({ type, title, listEl, subtitle, columns: [{label, key, fmt}], fields: [{name,label,type,placeholder,required,options,rows}], onRow })
*/
(function () {
  window.NWM = window.NWM || {};
  var API = window.NWMApi;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function getByPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null) ? null : o[k]; }, obj);
  }

  function setByPath(obj, path, val) {
    var keys = path.split('.');
    var k = keys.pop();
    var cur = keys.reduce(function (o, kk) { if (o[kk] == null) o[kk] = {}; return o[kk]; }, obj);
    cur[k] = val;
  }

  function modalHtml(cfg, item) {
    var fieldsHtml = cfg.fields.map(function (f) {
      var val = item ? (f.name === 'title' ? item.title : (f.name === 'status' ? item.status : getByPath(item.data || {}, f.name))) : (f.default || '');
      if (f.type === 'select') {
        var opts = (f.options || []).map(function (o) {
          return '<option value="' + esc(o.value) + '"' + (String(val) === String(o.value) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('');
        return '<label class="lbl">' + esc(f.label) + '<select class="inp" data-field="' + f.name + '">' + opts + '</select></label>';
      }
      if (f.type === 'textarea') {
        return '<label class="lbl">' + esc(f.label) + '<textarea class="inp" data-field="' + f.name + '" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val || '') + '</textarea></label>';
      }
      return '<label class="lbl">' + esc(f.label) + '<input class="inp" data-field="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(val || '') + '" placeholder="' + esc(f.placeholder || '') + '"></label>';
    }).join('');
    return fieldsHtml +
           '<div class="nwm-modal-foot"><button class="btn btn-primary" id="nwmSave">Save</button> <button class="btn" id="nwmCancel">Cancel</button></div>';
  }

  function buildModal(title, html, onOpen) {
    var m = document.createElement('div');
    m.className = 'nwm-modal-backdrop';
    m.innerHTML = '<div class="nwm-modal">' +
      '<div class="nwm-modal-head"><h3>' + esc(title) + '</h3><button class="nwm-modal-close">×</button></div>' +
      '<div class="nwm-modal-body">' + html + '</div></div>';
    document.body.appendChild(m);
    m.querySelector('.nwm-modal-close').onclick = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    if (onOpen) onOpen(m);
    return m;
  }

  NWM.mount = function (cfg) {
    var state = { items: [] };
    var mountEl = typeof cfg.listEl === 'string' ? document.getElementById(cfg.listEl) : cfg.listEl;

    function render() {
      var cols = cfg.columns;
      var thead = '<tr>' + cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '<th style="width:1%"></th></tr>';
      var rows = state.items.map(function (it) {
        var tds = cols.map(function (c) {
          var v;
          if (c.key === 'title') v = it.title;
          else if (c.key === 'status') v = it.status;
          else if (c.key === 'updated_at') v = it.updated_at;
          else v = getByPath(it.data || {}, c.key);
          return '<td>' + (c.fmt ? c.fmt(v, it) : esc(v || '')) + '</td>';
        }).join('');
        return '<tr>' + tds + '<td style="white-space:nowrap;">' +
          (cfg.rowActions || []).map(function (a) {
            return '<button class="btn btn-sm" data-act="' + a.act + '" data-id="' + it.id + '">' + esc(a.label) + '</button> ';
          }).join('') +
          '<button class="btn btn-sm" data-act="edit" data-id="' + it.id + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger" data-act="del" data-id="' + it.id + '">Delete</button>' +
          '</td></tr>';
      }).join('');
      mountEl.innerHTML = '<table class="mod-table" style="width:100%;border-collapse:collapse;">' +
        '<thead>' + thead + '</thead>' +
        '<tbody>' + (rows || '<tr><td colspan="' + (cols.length + 1) + '" style="text-align:center;padding:30px;color:#888;">No items yet. Click "New".</td></tr>') +
        '</tbody></table>';
    }

    function load() {
      API.list(cfg.type).then(function (r) { state.items = r.items || []; render(); })
        .catch(function (e) { mountEl.innerHTML = '<div class="empty">Failed: ' + esc(e.message) + '</div>'; });
    }

    function openEditor(item) {
      var m = buildModal(item ? ('Edit: ' + (item.title || '#' + item.id)) : ('New ' + cfg.title.replace(/s$/, '')),
        modalHtml(cfg, item), function (m) {
          m.querySelector('#nwmCancel').onclick = function () { m.remove(); };
          m.querySelector('#nwmSave').onclick = function () {
            var payload = { data: {} };
            cfg.fields.forEach(function (f) {
              var el = m.querySelector('[data-field="' + f.name + '"]');
              var v = el.value;
              if (f.type === 'number') v = Number(v) || 0;
              if (f.name === 'title') payload.title = v;
              else if (f.name === 'status') payload.status = v;
              else setByPath(payload.data, f.name, v);
            });
            if (!payload.title) payload.title = payload.data.name || ('Untitled ' + cfg.title);
            var p = item ? API.update(cfg.type, item.id, payload) : API.create(cfg.type, payload);
            p.then(function () { m.remove(); load(); })
              .catch(function (e) { alert('Save failed: ' + e.message); });
          };
        });
    }

    // Header
    if (window.CMS_APP) {
      CMS_APP.buildHeader(cfg.title,
        '<button class="btn btn-primary" id="nwmNew">' + (CMS_APP.ICONS && CMS_APP.ICONS.plus || '+') + ' New</button>',
        cfg.subtitle || '');
    }
    document.addEventListener('click', function (e) {
      var newBtn = e.target.closest('#nwmNew');
      if (newBtn) { openEditor(null); return; }
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var id = +t.dataset.id;
      var it = state.items.find(function (x) { return x.id === id; });
      if (!it) return;
      if (t.dataset.act === 'edit') openEditor(it);
      else if (t.dataset.act === 'del') {
        if (confirm('Delete "' + (it.title || '#' + id) + '"?')) API.remove(cfg.type, id).then(load);
      }
      else if (cfg.onRow) cfg.onRow(t.dataset.act, it, load);
    });

    load();
  };
})();

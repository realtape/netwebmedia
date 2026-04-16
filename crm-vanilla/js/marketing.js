/* Marketing Page - Real email campaigns via Resend */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var TABS = ["Campaigns", "Templates"];
  var activeTab = 0;
  var campaigns = [];
  var templates = [];

  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader("Email Marketing",
        '<button class="btn btn-primary" id="newBtn">+ New ' + (activeTab === 0 ? 'Campaign' : 'Template') + '</button>');
    }
    renderTabs();
    loadData();
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === 'newBtn') {
        activeTab === 0 ? openCampaignModal() : openTemplateModal();
      }
    });
  });

  function api(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function loadData() {
    Promise.all([api('campaigns'), api('templates')]).then(function (res) {
      campaigns = res[0] || [];
      templates = res[1] || [];
      renderContent();
    }).catch(function (e) {
      document.getElementById('marketingBody').innerHTML =
        '<div style="padding:40px;text-align:center;color:#c0392b">Error loading data: ' + e.message +
        '<br><br><small>If this is your first time: POST to /api/?r=migrate&token=NWM_MIGRATE_2026 to create tables.</small></div>';
    });
  }

  function renderTabs() {
    var bar = document.getElementById("tabBar");
    if (!bar) return;
    var html = '';
    for (var i = 0; i < TABS.length; i++) {
      html += '<button class="tab-btn' + (i === activeTab ? ' active' : '') + '" data-tab="' + i + '">' + TABS[i] + '</button>';
    }
    bar.innerHTML = html;
    bar.onclick = function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      activeTab = parseInt(btn.getAttribute('data-tab'), 10);
      renderTabs();
      renderContent();
      var nb = document.getElementById('newBtn');
      if (nb) nb.textContent = '+ New ' + (activeTab === 0 ? 'Campaign' : 'Template');
    };
  }

  function renderContent() {
    var body = document.getElementById('marketingBody');
    if (!body) return;

    var totalSent = 0, totalOpen = 0, totalClick = 0, active = 0;
    campaigns.forEach(function (c) {
      totalSent  += parseInt(c.sent_count || 0, 10);
      totalOpen  += parseInt(c.opened_count || 0, 10);
      totalClick += parseInt(c.clicked_count || 0, 10);
      if (c.status === 'sending' || c.status === 'scheduled') active++;
    });
    var pct = function (n, d) { return d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—'; };

    var html = '<div class="summary-cards">';
    html += card('Total Sent', totalSent.toLocaleString());
    html += card('Open Rate', pct(totalOpen, totalSent), 'green');
    html += card('Click Rate', pct(totalClick, totalSent));
    html += card('In Progress', String(active));
    html += '</div>';

    html += activeTab === 0 ? renderCampaignsTable() : renderTemplatesTable();
    body.innerHTML = html;

    body.addEventListener('click', onAction);
  }

  function card(label, val, cls) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + (cls || '') + '">' + val + '</div></div>';
  }

  function renderCampaignsTable() {
    if (!campaigns.length) return emptyState('No campaigns yet. Click "+ New Campaign" to start.');
    var html = '<table class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Sent</th><th>Opens</th><th>Clicks</th><th>Created</th><th>Actions</th></tr></thead><tbody>';
    campaigns.forEach(function (c) {
      var s = parseInt(c.sent_count || 0, 10);
      var o = parseInt(c.opened_count || 0, 10);
      var cl = parseInt(c.clicked_count || 0, 10);
      html += '<tr>';
      html += '<td><strong>' + esc(c.name) + '</strong><br><small style="color:#888">' + esc(c.subject || '') + '</small></td>';
      html += '<td>' + badge(c.status) + '</td>';
      html += '<td>' + (s || '—') + '</td>';
      html += '<td>' + (s ? o + ' <small>(' + ((o/s)*100).toFixed(0) + '%)</small>' : '—') + '</td>';
      html += '<td>' + (s ? cl + ' <small>(' + ((cl/s)*100).toFixed(0) + '%)</small>' : '—') + '</td>';
      html += '<td>' + fmtDate(c.created_at) + '</td>';
      html += '<td>'
           + '<button class="action-link" data-a="edit" data-id="' + c.id + '">Edit</button> '
           + '<button class="action-link" data-a="preview" data-id="' + c.id + '">Preview</button> '
           + '<button class="action-link" data-a="test" data-id="' + c.id + '">Test</button> '
           + '<button class="action-link" data-a="send" data-id="' + c.id + '" style="color:#FF6B00;font-weight:600">Send</button> '
           + '<button class="action-link" data-a="delete" data-id="' + c.id + '" style="color:#c0392b">✕</button>'
           + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function renderTemplatesTable() {
    if (!templates.length) return emptyState('No templates yet. Click "+ New Template" to create reusable emails with merge tags like {{name}}, {{company}}, {{city}}, {{page_url}}.');
    var html = '<table class="data-table"><thead><tr><th>Name</th><th>Subject</th><th>Niche</th><th>Updated</th><th>Actions</th></tr></thead><tbody>';
    templates.forEach(function (t) {
      html += '<tr>';
      html += '<td><strong>' + esc(t.name) + '</strong></td>';
      html += '<td>' + esc(t.subject) + '</td>';
      html += '<td>' + esc(t.niche || '—') + '</td>';
      html += '<td>' + fmtDate(t.updated_at) + '</td>';
      html += '<td>'
           + '<button class="action-link" data-a="tedit" data-id="' + t.id + '">Edit</button> '
           + '<button class="action-link" data-a="tuse" data-id="' + t.id + '">Use</button> '
           + '<button class="action-link" data-a="tdel" data-id="' + t.id + '" style="color:#c0392b">✕</button>'
           + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function onAction(e) {
    var btn = e.target.closest('.action-link');
    if (!btn) return;
    var a = btn.getAttribute('data-a');
    var id = btn.getAttribute('data-id');
    if (a === 'edit')    openCampaignModal(campaigns.find(function (c) { return String(c.id) === id; }));
    if (a === 'preview') previewCampaign(id);
    if (a === 'test')    testCampaign(id);
    if (a === 'send')    sendCampaign(id);
    if (a === 'delete')  deleteCampaign(id);
    if (a === 'tedit')   openTemplateModal(templates.find(function (t) { return String(t.id) === id; }));
    if (a === 'tuse')    openCampaignModal({ template_id: id });
    if (a === 'tdel')    deleteTemplate(id);
  }

  // ---------- Modals ----------
  function modal(title, bodyHtml, onSave, saveLabel) {
    var existing = document.getElementById('mktModal');
    if (existing) existing.remove();
    var m = document.createElement('div');
    m.id = 'mktModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
    m.innerHTML = '<div style="background:#fff;border-radius:10px;max-width:720px;width:100%;max-height:90vh;overflow:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
                + '<h2 style="margin:0 0 16px;color:#1a1a2e">' + title + '</h2>'
                + bodyHtml
                + '<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">'
                + '<button class="btn" id="mCancel" style="background:#eee;border:0;padding:10px 20px;border-radius:6px;cursor:pointer">Cancel</button>'
                + '<button class="btn btn-primary" id="mSave" style="background:#FF6B00;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600">' + (saveLabel || 'Save') + '</button>'
                + '</div></div>';
    document.body.appendChild(m);
    m.querySelector('#mCancel').onclick = function () { m.remove(); };
    m.querySelector('#mSave').onclick = function () { onSave(m); };
  }

  function openTemplateModal(t) {
    t = t || {};
    var body = ''
      + row('Name',       '<input id="tName" style="'+inp+'" value="' + esc(t.name || '') + '">')
      + row('Subject',    '<input id="tSubject" style="'+inp+'" value="' + esc(t.subject || '') + '" placeholder="{{company}} — Free Digital Audit">')
      + row('Niche',      '<input id="tNiche" style="'+inp+'" value="' + esc(t.niche || '') + '" placeholder="tourism, restaurants, health, beauty, ...">')
      + row('From name',  '<input id="tFromName" style="'+inp+'" value="' + esc(t.from_name || 'NetWebMedia') + '">')
      + row('From email', '<input id="tFromEmail" style="'+inp+'" value="' + esc(t.from_email || 'carlos@netwebmedia.com') + '">')
      + row('HTML body',  '<textarea id="tBody" style="'+inp+';min-height:280px;font-family:monospace;font-size:13px" placeholder="Hi {{first_name}},&#10;&#10;I built a free digital audit for {{company}} ({{city}}):&#10;{{page_url}}&#10;&#10;— Carlos">' + esc(t.body_html || '') + '</textarea>')
      + '<p style="font-size:12px;color:#888;margin-top:8px">Merge tags: <code>{{name}}</code> <code>{{first_name}}</code> <code>{{company}}</code> <code>{{city}}</code> <code>{{niche}}</code> <code>{{page_url}}</code> <code>{{email}}</code> <code>{{unsubscribe_url}}</code></p>';
    modal(t.id ? 'Edit template' : 'New template', body, function (m) {
      var payload = {
        name: m.querySelector('#tName').value.trim(),
        subject: m.querySelector('#tSubject').value.trim(),
        niche: m.querySelector('#tNiche').value.trim(),
        from_name: m.querySelector('#tFromName').value.trim(),
        from_email: m.querySelector('#tFromEmail').value.trim(),
        body_html: m.querySelector('#tBody').value,
      };
      if (!payload.name || !payload.subject || !payload.body_html) return alert('Name, subject, body required');
      var p = t.id
        ? api('templates&id=' + t.id, { method: 'PUT', body: payload })
        : api('templates',            { method: 'POST', body: payload });
      p.then(function () { m.remove(); loadData(); }).catch(function (e) { alert(e.message); });
    });
  }

  function openCampaignModal(c) {
    c = c || {};
    var af = {};
    try { af = c.audience_filter ? (typeof c.audience_filter === 'string' ? JSON.parse(c.audience_filter) : c.audience_filter) : {}; } catch (e) {}

    var tplOpts = '<option value="">— inline —</option>' + templates.map(function (t) {
      return '<option value="' + t.id + '"' + (String(c.template_id) === String(t.id) ? ' selected' : '') + '>' + esc(t.name) + '</option>';
    }).join('');

    var body = ''
      + row('Name',        '<input id="cName" style="'+inp+'" value="' + esc(c.name || '') + '" placeholder="Tourism — Day 0 welcome">')
      + row('Template',    '<select id="cTpl" style="'+inp+'">' + tplOpts + '</select>')
      + row('Subject',     '<input id="cSubject" style="'+inp+'" value="' + esc(c.subject || '') + '" placeholder="(leave blank to use template)">')
      + row('HTML body',   '<textarea id="cBody" style="'+inp+';min-height:200px;font-family:monospace;font-size:13px" placeholder="(leave blank to use template)">' + esc(c.body_html || '') + '</textarea>')
      + '<h3 style="margin:20px 0 10px;color:#1a1a2e;font-size:15px">Audience filter</h3>'
      + row('Niche',  '<input id="cNiche" style="'+inp+'" value="' + esc(af.niche || '') + '" placeholder="tourism / restaurants / health / ...">')
      + row('City',   '<input id="cCity"  style="'+inp+'" value="' + esc(af.city || '')  + '" placeholder="santiago / valparaiso / ...">')
      + row('Status', '<select id="cStatus" style="'+inp+'"><option value="">any</option>'
          + ['lead','prospect','customer','churned'].map(function (s) {
              return '<option value="' + s + '"' + (af.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('')
          + '</select>');

    modal(c.id ? 'Edit campaign' : 'New campaign', body, function (m) {
      var payload = {
        name: m.querySelector('#cName').value.trim(),
        template_id: m.querySelector('#cTpl').value || null,
        subject: m.querySelector('#cSubject').value.trim() || null,
        body_html: m.querySelector('#cBody').value || null,
        audience_filter: {
          niche: m.querySelector('#cNiche').value.trim() || undefined,
          city: m.querySelector('#cCity').value.trim() || undefined,
          status: m.querySelector('#cStatus').value || undefined,
        },
      };
      if (!payload.name) return alert('Name required');
      var p = c.id
        ? api('campaigns&id=' + c.id, { method: 'PUT', body: payload })
        : api('campaigns',            { method: 'POST', body: payload });
      p.then(function () { m.remove(); loadData(); }).catch(function (e) { alert(e.message); });
    });
  }

  function previewCampaign(id) {
    api('campaigns&id=' + id + '&action=preview', { method: 'POST', body: {} }).then(function (r) {
      var m = document.createElement('div');
      m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
      m.innerHTML = '<div style="background:#fff;border-radius:10px;max-width:800px;width:100%;max-height:90vh;overflow:auto">'
        + '<div style="padding:20px;border-bottom:1px solid #eee;background:#f6f7fb">'
        + '<div style="font-size:12px;color:#888">To: ' + esc(r.to) + '</div>'
        + '<div style="font-size:16px;font-weight:600;margin-top:4px">Subject: ' + esc(r.subject) + '</div>'
        + '</div>'
        + '<iframe srcdoc="' + r.html.replace(/"/g, '&quot;') + '" style="width:100%;height:500px;border:0"></iframe>'
        + '<div style="padding:14px;text-align:right;border-top:1px solid #eee"><button id="pClose" style="background:#FF6B00;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer">Close</button></div>'
        + '</div>';
      document.body.appendChild(m);
      m.querySelector('#pClose').onclick = function () { m.remove(); };
    }).catch(function (e) { alert('Preview failed: ' + e.message); });
  }

  function testCampaign(id) {
    var to = prompt('Send test email to:');
    if (!to) return;
    api('campaigns&id=' + id + '&action=test', { method: 'POST', body: { to: to } })
      .then(function (r) { alert('Test sent! Resend id: ' + (r.id || 'ok')); })
      .catch(function (e) { alert('Test failed: ' + e.message); });
  }

  function sendCampaign(id) {
    api('campaigns&id=' + id + '&action=send', { method: 'POST', body: { dry_run: true } }).then(function (r) {
      if (!confirm('This will send ' + r.would_send + ' real emails via Resend. Proceed?')) return;
      var limit = prompt('Limit recipients (blank = all ' + r.would_send + '):');
      var body = {};
      if (limit && parseInt(limit, 10) > 0) body.limit = parseInt(limit, 10);
      api('campaigns&id=' + id + '&action=send', { method: 'POST', body: body }).then(function (res) {
        alert('Sent: ' + res.sent + ' / Failed: ' + res.failed + (res.errors && res.errors.length ? '\n\nFirst errors:\n' + res.errors.join('\n') : ''));
        loadData();
      }).catch(function (e) { alert('Send failed: ' + e.message); });
    });
  }

  function deleteCampaign(id) {
    if (!confirm('Delete this campaign? (sends history preserved)')) return;
    api('campaigns&id=' + id, { method: 'DELETE' }).then(loadData);
  }

  function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    api('templates&id=' + id, { method: 'DELETE' }).then(loadData);
  }

  // ---------- helpers ----------
  var inp = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:inherit';
  function row(label, ctrl) {
    return '<div style="margin-bottom:12px"><label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#555">' + label + '</label>' + ctrl + '</div>';
  }
  function emptyState(msg) { return '<div style="padding:60px;text-align:center;color:#888;background:#fafbff;border-radius:8px;border:2px dashed #ddd">' + msg + '</div>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  function fmtDate(d) { if (!d) return '—'; var x = new Date(d.replace(' ', 'T')); return isNaN(x) ? d : x.toLocaleDateString(); }
  function badge(s) {
    var colors = { draft: '#888', scheduled: '#0984e3', sending: '#fdcb6e', sent: '#00b894', paused: '#aaa', failed: '#c0392b' };
    var c = colors[s] || '#888';
    return '<span style="background:' + c + ';color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600">' + (s || '—').toUpperCase() + '</span>';
  }
})();

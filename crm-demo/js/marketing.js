/* Marketing Page - Real email campaigns via Resend */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var TABS;
  var activeTab = 0;
  var campaigns = [];
  var templates = [];
  var L;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      emailMarketing: "Marketing por Correo",
      newCampaign: "Nueva Campaña", newTemplate: "Nueva Plantilla",
      totalSent: "Total Enviados", openRate: "Tasa de Apertura",
      clickRate: "Tasa de Clics", inProgress: "En Progreso",
      name: "Nombre", status: "Estado", sent: "Enviados",
      opens: "Aperturas", clicks: "Clics", created: "Creado",
      actions: "Acciones", subject: "Asunto", niche: "Nicho",
      updated: "Actualizado",
      edit: "Editar", preview: "Vista Previa", test: "Prueba",
      sendBtn: "Enviar", use: "Usar",
      noCampaigns: 'No hay campañas. Haz clic en "+ Nueva Campaña" para comenzar.',
      noTemplates: 'No hay plantillas. Haz clic en "+ Nueva Plantilla" para crear correos reutilizables con etiquetas como {{name}}, {{company}}, {{city}}, {{page_url}}.',
      editCampaign: "Editar campaña", newCampaignTitle: "Nueva campaña",
      editTemplate: "Editar plantilla", newTemplateTitle: "Nueva plantilla",
      audienceFilter: "Filtro de Audiencia",
      nameReq: "Nombre requerido",
      fieldsReq: "Nombre, asunto y cuerpo son requeridos",
      confirmDelCampaign: "¿Eliminar esta campaña? (historial de envíos se conserva)",
      confirmDelTemplate: "¿Eliminar esta plantilla?",
      testPrompt: "Enviar correo de prueba a:",
      fromName: "Nombre remitente", fromEmail: "Correo remitente", htmlBody: "Cuerpo HTML",
      template: "Plantilla", city: "Ciudad",
      mergeTags: "Etiquetas:",
      loadErr: "Error al cargar datos: ",
      firstTimeHint: "Si es tu primera vez: POST a /api/?r=migrate&token=NWM_MIGRATE_2026 para crear las tablas.",
      save: "Guardar", cancel: "Cancelar",
      close: "Cerrar",
      testSent: "¡Prueba enviada! ID Resend: ",
      testFailed: "Prueba fallida: ",
      previewFailed: "Vista previa fallida: ",
      sendConfirm1: "Se enviarán ",
      sendConfirm2: " correos reales vía Resend. ¿Continuar?",
      limitPrompt: "Límite de destinatarios (vacío = todos ",
      sentLabel: "Enviados: ", failedLabel: " / Fallidos: ",
      firstErrors: "\n\nPrimeros errores:\n",
      sendFailed: "Envío fallido: ",
      any: "cualquiera",
      to: "Para: ", subjectLbl: "Asunto: "
    } : {
      emailMarketing: "Email Marketing",
      newCampaign: "New Campaign", newTemplate: "New Template",
      totalSent: "Total Sent", openRate: "Open Rate",
      clickRate: "Click Rate", inProgress: "In Progress",
      name: "Name", status: "Status", sent: "Sent",
      opens: "Opens", clicks: "Clicks", created: "Created",
      actions: "Actions", subject: "Subject", niche: "Niche",
      updated: "Updated",
      edit: "Edit", preview: "Preview", test: "Test",
      sendBtn: "Send", use: "Use",
      noCampaigns: 'No campaigns yet. Click "+ New Campaign" to start.',
      noTemplates: 'No templates yet. Click "+ New Template" to create reusable emails with merge tags like {{name}}, {{company}}, {{city}}, {{page_url}}.',
      editCampaign: "Edit campaign", newCampaignTitle: "New campaign",
      editTemplate: "Edit template", newTemplateTitle: "New template",
      audienceFilter: "Audience filter",
      nameReq: "Name required",
      fieldsReq: "Name, subject, body required",
      confirmDelCampaign: "Delete this campaign? (sends history preserved)",
      confirmDelTemplate: "Delete this template?",
      testPrompt: "Send test email to:",
      fromName: "From name", fromEmail: "From email", htmlBody: "HTML body",
      template: "Template", city: "City",
      mergeTags: "Merge tags:",
      loadErr: "Error loading data: ",
      firstTimeHint: "If this is your first time: POST to /api/?r=migrate&token=NWM_MIGRATE_2026 to create tables.",
      save: "Save", cancel: "Cancel",
      close: "Close",
      testSent: "Test sent! Resend id: ",
      testFailed: "Test failed: ",
      previewFailed: "Preview failed: ",
      sendConfirm1: "This will send ",
      sendConfirm2: " real emails via Resend. Proceed?",
      limitPrompt: "Limit recipients (blank = all ",
      sentLabel: "Sent: ", failedLabel: " / Failed: ",
      firstErrors: "\n\nFirst errors:\n",
      sendFailed: "Send failed: ",
      any: "any",
      to: "To: ", subjectLbl: "Subject: "
    };
    TABS = [isEs ? "Campañas" : "Campaigns", isEs ? "Plantillas" : "Templates"];

    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader(L.emailMarketing,
        '<button class="btn btn-primary" id="newBtn">+ ' + (activeTab === 0 ? L.newCampaign : L.newTemplate) + '</button>');
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
        '<div style="padding:40px;text-align:center;color:#c0392b">' + L.loadErr + e.message +
        '<br><br><small>' + L.firstTimeHint + '</small></div>';
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
      if (nb) nb.textContent = '+ ' + (activeTab === 0 ? L.newCampaign : L.newTemplate);
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
    html += card(L.totalSent, totalSent.toLocaleString());
    html += card(L.openRate, pct(totalOpen, totalSent), 'green');
    html += card(L.clickRate, pct(totalClick, totalSent));
    html += card(L.inProgress, String(active));
    html += '</div>';

    html += activeTab === 0 ? renderCampaignsTable() : renderTemplatesTable();
    body.innerHTML = html;

    body.addEventListener('click', onAction);
  }

  function card(label, val, cls) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + (cls || '') + '">' + val + '</div></div>';
  }

  function renderCampaignsTable() {
    if (!campaigns.length) return emptyState(L.noCampaigns);
    var html = '<table class="data-table"><thead><tr><th>' + L.name + '</th><th>' + L.status + '</th><th>' + L.sent + '</th><th>' + L.opens + '</th><th>' + L.clicks + '</th><th>' + L.created + '</th><th>' + L.actions + '</th></tr></thead><tbody>';
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
           + '<button class="action-link" data-a="edit" data-id="' + c.id + '">' + L.edit + '</button> '
           + '<button class="action-link" data-a="preview" data-id="' + c.id + '">' + L.preview + '</button> '
           + '<button class="action-link" data-a="test" data-id="' + c.id + '">' + L.test + '</button> '
           + '<button class="action-link" data-a="send" data-id="' + c.id + '" style="color:#FF6B00;font-weight:600">' + L.sendBtn + '</button> '
           + '<button class="action-link" data-a="delete" data-id="' + c.id + '" style="color:#c0392b">✕</button>'
           + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function renderTemplatesTable() {
    if (!templates.length) return emptyState(L.noTemplates);
    var html = '<table class="data-table"><thead><tr><th>' + L.name + '</th><th>' + L.subject + '</th><th>' + L.niche + '</th><th>' + L.updated + '</th><th>' + L.actions + '</th></tr></thead><tbody>';
    templates.forEach(function (t) {
      html += '<tr>';
      html += '<td><strong>' + esc(t.name) + '</strong></td>';
      html += '<td>' + esc(t.subject) + '</td>';
      html += '<td>' + esc(t.niche || '—') + '</td>';
      html += '<td>' + fmtDate(t.updated_at) + '</td>';
      html += '<td>'
           + '<button class="action-link" data-a="tedit" data-id="' + t.id + '">' + L.edit + '</button> '
           + '<button class="action-link" data-a="tuse" data-id="' + t.id + '">' + L.use + '</button> '
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
                + '<button class="btn" id="mCancel" style="background:#eee;border:0;padding:10px 20px;border-radius:6px;cursor:pointer">' + L.cancel + '</button>'
                + '<button class="btn btn-primary" id="mSave" style="background:#FF6B00;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600">' + (saveLabel || L.save) + '</button>'
                + '</div></div>';
    document.body.appendChild(m);
    m.querySelector('#mCancel').onclick = function () { m.remove(); };
    m.querySelector('#mSave').onclick = function () { onSave(m); };
  }

  function openTemplateModal(t) {
    t = t || {};
    var body = ''
      + row(L.name,       '<input id="tName" style="'+inp+'" value="' + esc(t.name || '') + '">')
      + row(L.subject,    '<input id="tSubject" style="'+inp+'" value="' + esc(t.subject || '') + '" placeholder="{{company}} — Free Digital Audit">')
      + row(L.niche,      '<input id="tNiche" style="'+inp+'" value="' + esc(t.niche || '') + '" placeholder="tourism, restaurants, health, beauty, ...">')
      + row(L.fromName,   '<input id="tFromName" style="'+inp+'" value="' + esc(t.from_name || 'NetWebMedia') + '">')
      + row(L.fromEmail,  '<input id="tFromEmail" style="'+inp+'" value="' + esc(t.from_email || 'carlos@netwebmedia.com') + '">')
      + row(L.htmlBody,   '<textarea id="tBody" style="'+inp+';min-height:280px;font-family:monospace;font-size:13px" placeholder="Hi {{first_name}},&#10;&#10;I built a free digital audit for {{company}} ({{city}}):&#10;{{page_url}}&#10;&#10;— Carlos">' + esc(t.body_html || '') + '</textarea>')
      + '<p style="font-size:12px;color:#888;margin-top:8px">' + L.mergeTags + ' <code>{{name}}</code> <code>{{first_name}}</code> <code>{{company}}</code> <code>{{city}}</code> <code>{{niche}}</code> <code>{{page_url}}</code> <code>{{email}}</code> <code>{{unsubscribe_url}}</code></p>';
    modal(t.id ? L.editTemplate : L.newTemplateTitle, body, function (m) {
      var payload = {
        name: m.querySelector('#tName').value.trim(),
        subject: m.querySelector('#tSubject').value.trim(),
        niche: m.querySelector('#tNiche').value.trim(),
        from_name: m.querySelector('#tFromName').value.trim(),
        from_email: m.querySelector('#tFromEmail').value.trim(),
        body_html: m.querySelector('#tBody').value,
      };
      if (!payload.name || !payload.subject || !payload.body_html) return alert(L.fieldsReq);
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
      + row(L.name,        '<input id="cName" style="'+inp+'" value="' + esc(c.name || '') + '" placeholder="Tourism — Day 0 welcome">')
      + row(L.template,    '<select id="cTpl" style="'+inp+'">' + tplOpts + '</select>')
      + row(L.subject,     '<input id="cSubject" style="'+inp+'" value="' + esc(c.subject || '') + '" placeholder="(leave blank to use template)">')
      + row(L.htmlBody,    '<textarea id="cBody" style="'+inp+';min-height:200px;font-family:monospace;font-size:13px" placeholder="(leave blank to use template)">' + esc(c.body_html || '') + '</textarea>')
      + '<h3 style="margin:20px 0 10px;color:#1a1a2e;font-size:15px">' + L.audienceFilter + '</h3>'
      + row(L.niche,  '<input id="cNiche" style="'+inp+'" value="' + esc(af.niche || '') + '" placeholder="tourism / restaurants / health / ...">')
      + row(L.city,   '<input id="cCity"  style="'+inp+'" value="' + esc(af.city || '')  + '" placeholder="santiago / valparaiso / ...">')
      + row(L.status, '<select id="cStatus" style="'+inp+'"><option value="">' + L.any + '</option>'
          + ['lead','prospect','customer','churned'].map(function (s) {
              return '<option value="' + s + '"' + (af.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('')
          + '</select>');

    modal(c.id ? L.editCampaign : L.newCampaignTitle, body, function (m) {
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
      if (!payload.name) return alert(L.nameReq);
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
        + '<div style="font-size:12px;color:#888">' + L.to + esc(r.to) + '</div>'
        + '<div style="font-size:16px;font-weight:600;margin-top:4px">' + L.subjectLbl + esc(r.subject) + '</div>'
        + '</div>'
        + '<iframe srcdoc="' + r.html.replace(/"/g, '&quot;') + '" style="width:100%;height:500px;border:0"></iframe>'
        + '<div style="padding:14px;text-align:right;border-top:1px solid #eee"><button id="pClose" style="background:#FF6B00;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer">' + L.close + '</button></div>'
        + '</div>';
      document.body.appendChild(m);
      m.querySelector('#pClose').onclick = function () { m.remove(); };
    }).catch(function (e) { alert(L.previewFailed + e.message); });
  }

  function testCampaign(id) {
    var to = prompt(L.testPrompt);
    if (!to) return;
    api('campaigns&id=' + id + '&action=test', { method: 'POST', body: { to: to } })
      .then(function (r) { alert(L.testSent + (r.id || 'ok')); })
      .catch(function (e) { alert(L.testFailed + e.message); });
  }

  function sendCampaign(id) {
    api('campaigns&id=' + id + '&action=send', { method: 'POST', body: { dry_run: true } }).then(function (r) {
      if (!confirm(L.sendConfirm1 + r.would_send + L.sendConfirm2)) return;
      var limit = prompt(L.limitPrompt + r.would_send + '):');
      var body = {};
      if (limit && parseInt(limit, 10) > 0) body.limit = parseInt(limit, 10);
      api('campaigns&id=' + id + '&action=send', { method: 'POST', body: body }).then(function (res) {
        alert(L.sentLabel + res.sent + L.failedLabel + res.failed + (res.errors && res.errors.length ? L.firstErrors + res.errors.join('\n') : ''));
        loadData();
      }).catch(function (e) { alert(L.sendFailed + e.message); });
    });
  }

  function deleteCampaign(id) {
    if (!confirm(L.confirmDelCampaign)) return;
    api('campaigns&id=' + id, { method: 'DELETE' }).then(loadData);
  }

  function deleteTemplate(id) {
    if (!confirm(L.confirmDelTemplate)) return;
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

/* Marketing Page - Real email campaigns via Resend + Social Media tab */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var TABS;
  var activeTab = 0;
  var campaigns = [];
  var templates = [];
  var L;

  /* ── Social tab state ── */
  var socialProviders  = [];
  var socialPosts      = null;
  var socialFilter     = "all";
  var connectingKey    = null;

  var SOCIAL_NAMES   = { fb:"Facebook", ig:"Instagram", li:"LinkedIn", yt:"YouTube", tk:"TikTok" };
  var SOCIAL_IDS     = { fb:"facebook", ig:"instagram", li:"linkedin", yt:"youtube",  tk:"tiktok"  };
  var SOCIAL_CLASSES = { fb:"platform-fb", ig:"platform-ig", li:"platform-li", yt:"platform-yt", tk:"platform-tk" };
  var SOCIAL_FIELDS  = {
    fb:[{key:"fb_page_id",label:"Page ID",placeholder:"123456789010",secret:false},{key:"fb_page_token",label:"Page Access Token",placeholder:"EAAxxxxxxxxx\u2026",secret:true}],
    ig:[{key:"ig_user_id",label:"Instagram User ID",placeholder:"17841400008460056",secret:false},{key:"ig_access_token",label:"Access Token",placeholder:"EAAxxxxxxxxx\u2026",secret:true}],
    li:[{key:"li_access_token",label:"OAuth Access Token",placeholder:"AQVxxxxxxxxx\u2026",secret:true},{key:"li_urn",label:"Company URN",placeholder:"urn:li:organization:12345",secret:false}],
    yt:[{key:"yt_channel_id",label:"Channel ID",placeholder:"UCxxxxxxxxxx\u2026",secret:false},{key:"yt_client_id",label:"OAuth Client ID",placeholder:"xxxx.apps.googleusercontent.com",secret:false},{key:"yt_client_secret",label:"OAuth Client Secret",placeholder:"GOCSPX-xxxxx\u2026",secret:true},{key:"yt_access_token",label:"Access Token",placeholder:"ya29.xxxxxxxx\u2026",secret:true},{key:"yt_refresh_token",label:"Refresh Token",placeholder:"1//xxxxxxxxx\u2026",secret:true}],
    tk:[{key:"tt_access_token",label:"Access Token",placeholder:"att.xxxxxxxxxx\u2026",secret:true}]
  };
  var SOCIAL_INSTRUCTIONS = {
    fb:"<b>Meta for Developers</b> &rarr; create an App &rarr; Facebook Login &rarr; generate a long-lived <b>Page Access Token</b> for your Business Page.",
    ig:"Requires an <b>Instagram Business</b> account linked to a Facebook Page. Use the <b>Meta Graph API Explorer</b> (scopes: <code>instagram_basic</code> + <code>instagram_content_publish</code>) to generate a long-lived token.",
    li:"<b>LinkedIn Developer Portal</b> &rarr; create an app &rarr; request <code>r_organization_social</code> + <code>w_organization_social</code> scopes &rarr; find your Company URN via <code>GET /v2/organizationalEntityAcls</code>.",
    yt:"<b>Google Cloud Console</b> &rarr; enable <b>YouTube Data API v3</b> &rarr; create <b>OAuth 2.0 credentials</b> &rarr; run the consent flow to get access &amp; refresh tokens.",
    tk:"<b>developers.tiktok.com</b> &rarr; create an app &rarr; request Content Posting API access &rarr; complete sandbox approval &rarr; run the OAuth flow."
  };
  var SOCIAL_DEMO = [
    {day:0,platform:"fb",time:"9:00 AM",title:"New blog post: 5 SEO Tips"},
    {day:0,platform:"ig",time:"12:00 PM",title:"Behind the scenes at the office"},
    {day:0,platform:"li",time:"2:00 PM",title:"Case study: 300% lead increase"},
    {day:1,platform:"fb",time:"10:00 AM",title:"Client testimonial video"},
    {day:1,platform:"tk",time:"3:00 PM",title:"Quick tip: Email subject lines"},
    {day:2,platform:"yt",time:"12:00 PM",title:"Agency explainer video"},
    {day:2,platform:"li",time:"8:00 AM",title:"Industry report highlights"},
    {day:3,platform:"ig",time:"11:00 AM",title:"Product feature carousel"},
    {day:4,platform:"fb",time:"9:00 AM",title:"Friday motivation quote"},
    {day:4,platform:"yt",time:"11:00 AM",title:"Client results breakdown"},
    {day:5,platform:"ig",time:"2:00 PM",title:"User-generated content"},
    {day:6,platform:"li",time:"7:00 PM",title:"Monday motivation prep"}
  ];

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
      to: "Para: ", subjectLbl: "Asunto: ",
      newPost: "Nueva Publicaci\u00f3n"
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
      to: "To: ", subjectLbl: "Subject: ",
      newPost: "New Post"
    };
    TABS = [
      isEs ? "Campañas" : "Campaigns",
      isEs ? "Plantillas" : "Templates",
      isEs ? "Redes Sociales" : "Social Media"
    ];

    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader(L.emailMarketing,
        '<button class="btn btn-primary" id="newBtn">+ ' + headerBtnLabel() + '</button>');
    }
    renderTabs();
    loadData();
    buildSocialModal();
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === 'newBtn') {
        if (activeTab === 0) openCampaignModal();
        else if (activeTab === 1) openTemplateModal();
        else openNewPostModal();
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

  function headerBtnLabel() {
    if (activeTab === 0) return L.newCampaign;
    if (activeTab === 1) return L.newTemplate;
    return L.newPost || "New Post";
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
      if (nb) nb.textContent = '+ ' + headerBtnLabel();
    };
  }

  function renderContent() {
    var body = document.getElementById('marketingBody');
    if (!body) return;

    if (activeTab === 2) {
      renderSocialTab(body);
      return;
    }

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

  // ---------- Social Media Tab ----------
  function renderSocialTab(body) {
    var isEs = L.newPost === "Nueva Publicación" || L.newPost === "Nueva Publicaci\u00f3n";
    var connCount = socialProviders.filter(function (p) { return p.connected; }).length;
    var total = socialProviders.length || 5;

    var html = '<div class="summary-cards">';
    html += card(isEs ? "Cuentas Conectadas" : "Connected Accounts", connCount + " / " + total);
    html += card(isEs ? "Publicaciones (semana)" : "Posts This Week", (socialPosts || SOCIAL_DEMO).length.toString());
    html += card(isEs ? "Plataformas" : "Platforms", "5");
    html += card(isEs ? "Estado" : "Status", connCount > 0 ? (isEs ? "Activo" : "Active") : (isEs ? "Configura" : "Setup Needed"), connCount > 0 ? "green" : "");
    html += '</div>';

    // Connected accounts panel
    html += '<div class="social-accounts-wrap" style="margin-bottom:24px">';
    html += '<div class="social-accounts-header">';
    html += '<span class="social-accounts-title">' + (isEs ? "Cuentas Conectadas" : "Connected Accounts") + '</span>';
    html += '<span class="social-accounts-badge">' + connCount + '\u202f/\u202f' + total + (isEs ? ' conectadas' : ' connected') + '</span>';
    html += '</div><div class="social-accounts-grid">';

    ["ig","fb","yt","li","tk"].forEach(function (key) {
      var apiId = SOCIAL_IDS[key];
      var prov = socialProviders.find(function (p) { return p.id === apiId; }) || { connected: false };
      var connected = !!prov.connected;
      var abbr = SOCIAL_NAMES[key].slice(0, 2).toUpperCase();
      html += '<div class="social-connect-card">';
      html += '<div class="social-connect-card-top">';
      html += '<div class="social-post-platform ' + SOCIAL_CLASSES[key] + ' scc-icon">' + abbr + '</div>';
      html += '<div class="social-connect-info">';
      html += '<div class="social-connect-name">' + SOCIAL_NAMES[key] + '</div>';
      html += '<div class="social-connect-status ' + (connected ? "status-connected" : "status-disconnected") + '">';
      html += '<span class="status-dot"></span>' + (connected ? (isEs ? "Conectado" : "Connected") : (isEs ? "No conectado" : "Not connected"));
      html += '</div></div>';
      html += '<button class="btn btn-sm ' + (connected ? "btn-outline" : "btn-primary") + '" data-social-connect="' + key + '">';
      html += connected ? (isEs ? "Actualizar" : "Update") : (isEs ? "Conectar" : "Connect");
      html += '</button></div></div>';
    });

    html += '</div></div>';

    // Filter bar
    html += '<div class="filter-group" style="margin:0 0 16px">';
    var filterLabels = { all: isEs ? "Todas" : "All Platforms", ig:"Instagram", fb:"Facebook", yt:"YouTube", li:"LinkedIn", tk:"TikTok" };
    ["all","ig","fb","yt","li","tk"].forEach(function (v) {
      html += '<button class="filter-btn' + (socialFilter === v ? " active" : "") + '" data-social-filter="' + v + '">' + filterLabels[v] + '</button>';
    });
    html += '</div>';

    // Week calendar
    html += renderSocialCalendar(isEs);

    if (socialPosts === null) {
      html += '<p style="margin-top:10px;font-size:11px;color:var(--text-muted);text-align:center">Demo data — connect accounts to see live scheduled posts</p>';
    }

    body.innerHTML = html;

    // Wire connect buttons
    body.querySelectorAll("[data-social-connect]").forEach(function (btn) {
      btn.addEventListener("click", function () { openSocialConnect(this.getAttribute("data-social-connect")); });
    });

    // Wire filter buttons
    body.querySelectorAll("[data-social-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        socialFilter = this.getAttribute("data-social-filter");
        renderContent();
      });
    });
  }

  function renderSocialCalendar(isEs) {
    var DAY_NAMES = isEs
      ? ["Lun","Mar","Mi\u00e9","Jue","Vie","S\u00e1b","Dom"]
      : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    var posts = socialPosts !== null ? socialPosts : SOCIAL_DEMO;
    var today = new Date();
    var monday = getSocialMonday(today);
    var html = '<div class="social-calendar">';
    for (var d = 0; d < 7; d++) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + d);
      var isToday = date.toDateString() === today.toDateString();
      html += '<div class="social-day' + (isToday ? " social-day-today" : "") + '">';
      html += '<div class="social-day-header"><span>' + DAY_NAMES[d] + "</span>" + date.getDate() + "</div>";
      html += '<div class="social-day-body">';
      var dayPosts = posts.filter(function (p) {
        return p.day === d && (socialFilter === "all" || p.platform === socialFilter);
      });
      dayPosts.forEach(function (post) {
        var abbr = SOCIAL_NAMES[post.platform].slice(0, 2).toUpperCase();
        html += '<div class="social-post">';
        html += '<div class="social-post-platform ' + SOCIAL_CLASSES[post.platform] + '">' + abbr + '</div>';
        html += '<div style="flex:1;min-width:0"><div class="social-post-title">' + esc(post.title) + '</div>';
        html += '<div class="social-post-time">' + post.time + '</div></div></div>';
      });
      if (!dayPosts.length) {
        html += '<div style="padding:8px;font-size:11px;color:var(--text-muted);text-align:center">' + (isEs ? "Sin publicaciones" : "No posts") + '</div>';
      }
      html += '</div></div>';
    }
    return html + '</div>';
  }

  function getSocialMonday(d) {
    var c = new Date(d), dow = c.getDay();
    c.setDate(c.getDate() + (dow === 0 ? -6 : 1 - dow));
    c.setHours(0, 0, 0, 0);
    return c;
  }

  // Social connect modal
  function buildSocialModal() {
    if (document.getElementById("socialConnectOverlay")) return;
    var wrap = document.createElement("div");
    wrap.id = "socialConnectOverlay";
    wrap.className = "upgrade-overlay";
    wrap.style.display = "none";
    wrap.innerHTML =
      '<div class="upgrade-modal" style="max-width:520px" onclick="event.stopPropagation()">' +
      '<button class="upgrade-close" onclick="document.getElementById(\'socialConnectOverlay\').style.display=\'none\'">&#215;</button>' +
      '<div id="socialModalBody"></div>' +
      '</div>';
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) wrap.style.display = "none";
    });
    document.body.appendChild(wrap);
  }

  function openSocialConnect(key) {
    connectingKey = key;
    var name = SOCIAL_NAMES[key];
    var fields = SOCIAL_FIELDS[key] || [];
    var abbr = name.slice(0, 2).toUpperCase();
    var isEs = L.newPost === "Nueva Publicación" || L.newPost === "Nueva Publicaci\u00f3n";

    var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">';
    html += '<div class="social-post-platform ' + SOCIAL_CLASSES[key] + '" style="width:44px;height:44px;font-size:13px;font-weight:700;flex-shrink:0">' + abbr + '</div>';
    html += '<div><h2 style="font-size:18px;font-weight:700;margin:0">' + (isEs ? "Conectar " : "Connect ") + name + '</h2>';
    html += '<p style="font-size:12px;color:var(--text-dim);margin:4px 0 0">' + (isEs ? "Ingresa tus credenciales API" : "Enter your API credentials below") + '</p></div></div>';

    var instr = SOCIAL_INSTRUCTIONS[key];
    if (instr) html += '<div class="social-modal-instructions">' + instr + '</div>';

    html += '<form id="socialCredForm">';
    fields.forEach(function (f) {
      html += '<div style="margin-bottom:14px">';
      html += '<label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-dim)">' + f.label + '</label>';
      html += '<input class="form-input" type="' + (f.secret ? "password" : "text") + '" name="' + f.key + '" placeholder="' + f.placeholder + '" autocomplete="off" style="width:100%">';
      html += '</div>';
    });
    html += '<div style="display:flex;gap:10px;margin-top:22px">';
    html += '<button type="submit" class="btn btn-primary" id="socialSaveBtn">' + (isEs ? "Guardar credenciales" : "Save Credentials") + '</button>';
    html += '<button type="button" class="btn btn-outline" onclick="document.getElementById(\'socialConnectOverlay\').style.display=\'none\'">' + L.cancel + '</button>';
    html += '</div></form>';

    document.getElementById("socialModalBody").innerHTML = html;
    var overlay = document.getElementById("socialConnectOverlay");
    overlay.style.display = "flex";

    document.getElementById("socialCredForm").onsubmit = function (e) {
      e.preventDefault();
      var inputs = this.querySelectorAll("input");
      var fields = {}, hasValue = false;
      inputs.forEach(function (inp) {
        var v = inp.value.trim();
        if (v) { fields[inp.name] = v; hasValue = true; }
      });
      if (!hasValue) return;
      var btn = document.getElementById("socialSaveBtn");
      btn.disabled = true;
      btn.textContent = isEs ? "Guardando\u2026" : "Saving\u2026";
      fetch("/api/social/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: SOCIAL_IDS[connectingKey], fields: fields })
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () {
          btn.textContent = isEs ? "\u00a1Guardado!" : "Saved!";
          setTimeout(function () {
            overlay.style.display = "none";
            loadSocialProviders();
          }, 900);
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = isEs ? "Guardar credenciales" : "Save Credentials";
          alert("Error saving credentials (" + err + "). Make sure you are logged in as admin.");
        });
    };
  }

  function loadSocialProviders() {
    fetch("/api/social/providers")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { socialProviders = d.items || []; if (activeTab === 2) renderContent(); })
      .catch(function () { socialProviders = []; if (activeTab === 2) renderContent(); });
  }

  function openNewPostModal() {
    var isEs = L.newPost === "Nueva Publicación" || L.newPost === "Nueva Publicaci\u00f3n";
    var platformOpts = Object.keys(SOCIAL_NAMES).map(function (k) {
      return '<option value="' + k + '">' + SOCIAL_NAMES[k] + '</option>';
    }).join('');

    var body = ''
      + row(isEs ? "Plataformas" : "Platforms",
          '<div style="display:flex;gap:8px;flex-wrap:wrap" id="platformPicker">'
          + Object.keys(SOCIAL_NAMES).map(function (k) {
              return '<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">'
                + '<input type="checkbox" name="platform" value="' + k + '"> ' + SOCIAL_NAMES[k] + '</label>';
            }).join('')
          + '</div>')
      + row(isEs ? "Contenido" : "Caption / Content",
          '<textarea id="npCaption" style="' + inp + ';min-height:120px" placeholder="' + (isEs ? "Escribe tu publicación aquí…" : "Write your post content here…") + '"></textarea>')
      + row(isEs ? "Fecha y hora" : "Schedule Date & Time",
          '<input id="npDate" type="datetime-local" style="' + inp + '">');

    modal(isEs ? "Nueva Publicación" : "New Post", body, function (m) {
      var caption = m.querySelector('#npCaption').value.trim();
      var date = m.querySelector('#npDate').value;
      var platforms = Array.from(m.querySelectorAll('input[name="platform"]:checked')).map(function (i) { return SOCIAL_IDS[i.value]; });
      if (!caption) return alert(isEs ? "El contenido es requerido." : "Content is required.");
      if (!platforms.length) return alert(isEs ? "Selecciona al menos una plataforma." : "Select at least one platform.");
      fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: caption, scheduled_at: date || null, providers: JSON.stringify(platforms) })
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () { m.remove(); socialPosts = null; renderContent(); })
        .catch(function () {
          /* API not available — add as demo post so user sees feedback */
          var dow = date ? (new Date(date).getDay() + 6) % 7 : new Date().getDay();
          var fmtT = date ? (function () { var d = new Date(date); var h = d.getHours(), mn = d.getMinutes(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + (mn < 10 ? "0" + mn : mn) + " " + ap; })() : "12:00 PM";
          platforms.forEach(function (pid) {
            var key = Object.keys(SOCIAL_IDS).find(function (k) { return SOCIAL_IDS[k] === pid; }) || "fb";
            SOCIAL_DEMO.push({ day: dow, platform: key, time: fmtT, title: caption.slice(0, 52) });
          });
          m.remove();
          renderContent();
        });
    }, isEs ? "Programar" : "Schedule Post");
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

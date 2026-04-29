/* Pipeline Page Logic — HubSpot + GHL hybrid
 *  Sales Pipeline:    7 deal stages, weighted forecasting, quick actions, list/kanban toggle
 *  Marketing Pipeline: 7-stage lifecycle (Subscriber→Evangelist) derived client-side from
 *                      contact.status + deal presence — no schema change required.
 */
(function () {
  "use strict";

  var draggedCard = null;
  var L;
  var stagesData = [];
  var dealsData = [];
  var contactsData = [];
  var activeTab = 'sales';
  var activeView = 'kanban';   /* 'kanban' | 'list' */
  var statsData = null;
  var filters = { search: '', source: '', owner: '', status: 'open' };

  /* ── Stage SLAs (HubSpot best-practice: flag stale deals) ──────── */
  var STAGE_SLA = {
    "New Lead": 2, "Contacted": 3, "Qualified": 5,
    "Proposal Sent": 7, "Negotiation": 10
  };

  var STAGE_TX = {
    "New Lead":      { es: "Nuevo Lead",        en: "New Lead",      hint_en: "Captured. No contact attempt yet.",       hint_es: "Capturado. Sin contacto aún." },
    "Contacted":     { es: "Contactado",        en: "Contacted",     hint_en: "First touch made. Awaiting reply.",        hint_es: "Primer contacto hecho." },
    "Qualified":     { es: "Calificado",        en: "Qualified",     hint_en: "BANT confirmed. Real opportunity.",        hint_es: "BANT confirmado." },
    "Proposal Sent": { es: "Propuesta Enviada", en: "Proposal Sent", hint_en: "Proposal/quote delivered.",                hint_es: "Propuesta enviada." },
    "Negotiation":   { es: "Negociación",       en: "Negotiation",   hint_en: "Terms, price, scope being negotiated.",    hint_es: "Negociando términos." },
    "Closed Won":    { es: "Ganado",            en: "Closed Won",    hint_en: "Signed. Hand off to delivery.",            hint_es: "Cerrado." },
    "Closed Lost":   { es: "Perdido",           en: "Closed Lost",   hint_en: "Lost. Log reason for analysis.",           hint_es: "Perdido. Registrar motivo." }
  };

  function stageLabel(stage) {
    var lang = (window.CRM_APP && CRM_APP.getLang) ? CRM_APP.getLang() : 'en';
    return (STAGE_TX[stage] && STAGE_TX[stage][lang]) || stage;
  }
  function stageHint(stage) {
    var lang = (window.CRM_APP && CRM_APP.getLang) ? CRM_APP.getLang() : 'en';
    var k = 'hint_' + lang;
    return (STAGE_TX[stage] && STAGE_TX[stage][k]) || '';
  }
  function stageIdByName(name) {
    for (var i = 0; i < stagesData.length; i++) {
      if (stagesData[i].name === name) return stagesData[i].id;
    }
    return null;
  }
  function stageProbByName(name) {
    for (var i = 0; i < stagesData.length; i++) {
      if (stagesData[i].name === name && stagesData[i].probability != null) return stagesData[i].probability;
    }
    /* fallback to convention-based prob */
    var def = { "New Lead":10, "Contacted":20, "Qualified":40, "Proposal Sent":60, "Negotiation":80, "Closed Won":100, "Closed Lost":0 };
    return def[name] != null ? def[name] : 25;
  }

  /* ── New Deal Modal ─────────────────────────────────────────────── */

  function injectModal() {
    if (document.getElementById('dealModal')) return;
    var div = document.createElement('div');
    div.innerHTML = '<div id="dealModal" class="crm-modal" style="display:none">' +
      '<div class="crm-modal-backdrop"></div>' +
      '<div class="crm-modal-box">' +
        '<h3 id="dealModalTitle">New Deal</h3>' +
        '<form id="dealForm">' +
          '<label>Title *<input name="title" required placeholder="Website Redesign"></label>' +
          '<label>Email * <small style="color:#94a3b8;font-weight:400">(required)</small><input name="email" type="email" required placeholder="contact@company.com"></label>' +
          '<label>Phone <small style="color:#94a3b8;font-weight:400">(recommended for WhatsApp)</small><input name="phone" type="tel" placeholder="+56 9 1234 5678"></label>' +
          '<label>Company<input name="company" placeholder="Acme Corp"></label>' +
          '<label>Value ($)<input name="value" type="number" min="0" placeholder="5000"></label>' +
          '<label>Stage<select name="stage_id" id="dealStageSelect"></select></label>' +
          '<label>Probability (%)<input name="probability" type="number" min="0" max="100" value="25"></label>' +
          '<label>Source<select name="source">' +
            '<option value="">— select source —</option>' +
            '<option value="cold_email_chile">Cold Email — Chile Campaign</option>' +
            '<option value="cold_email_usa">Cold Email — USA Campaign</option>' +
            '<option value="whatsapp">WhatsApp</option>' +
            '<option value="referral">Referral</option>' +
            '<option value="inbound_website">Inbound — Website</option>' +
            '<option value="inbound_call">Inbound — Call</option>' +
            '<option value="social_media">Social Media</option>' +
            '<option value="event">Event / Trade Show</option>' +
            '<option value="manual">Manual / Other</option>' +
          '</select></label>' +
          '<div class="modal-actions">' +
            '<button type="button" id="dealModalCancel" class="btn btn-secondary">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">Save Deal</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';
    document.body.appendChild(div.firstChild);

    document.getElementById('dealModalCancel').addEventListener('click', closeModal);
    document.querySelector('#dealModal .crm-modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('dealForm').addEventListener('submit', handleDealFormSubmit);
  }

  function openModal() {
    populateStageSelect();
    document.getElementById('dealForm').reset();
    document.getElementById('dealModal').style.display = '';
  }
  function closeModal() { document.getElementById('dealModal').style.display = 'none'; }

  function populateStageSelect() {
    var sel = document.getElementById('dealStageSelect');
    sel.innerHTML = '';
    for (var i = 0; i < stagesData.length; i++) {
      var opt = document.createElement('option');
      opt.value = stagesData[i].id;
      opt.textContent = stagesData[i].name;
      sel.appendChild(opt);
    }
  }

  function handleDealFormSubmit(e) {
    e.preventDefault();
    var form = document.getElementById('dealForm');
    var title = form.title.value.trim();
    if (!title) return;

    var body = JSON.stringify({
      title: title,
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || null,
      company: form.company.value.trim(),
      value: parseInt(form.value.value, 10) || 0,
      stage_id: parseInt(form.stage_id.value, 10),
      probability: parseInt(form.probability.value, 10) || 25,
      source: form.source.value || null
    });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/?r=deals', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var newDeal;
        try { newDeal = JSON.parse(xhr.responseText); } catch (err) { newDeal = null; }
        if (newDeal && newDeal.id) {
          dealsData.push(newDeal);
          renderPipeline();
          renderKpiBar();
        }
        closeModal();
      } else {
        alert('Error saving deal. Please try again.');
      }
    };
    xhr.send(body);
  }

  /* ── Deal Detail Drawer ─────────────────────────────────────────── */

  function injectDrawer() {
    if (document.getElementById('dealDrawer')) return;
    var el = document.createElement('div');
    el.id = 'dealDrawer';
    el.style.cssText = 'position:fixed;top:0;right:-440px;width:420px;height:100vh;background:#1a1d27;border-left:1px solid #2a2d3a;z-index:9999;display:flex;flex-direction:column;transition:right 0.28s ease;box-shadow:-6px 0 32px rgba(0,0,0,0.5);overflow:hidden';
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #2a2d3a;flex-shrink:0;gap:12px">' +
        '<h3 id="drawerDealTitle" style="margin:0;font-size:15px;font-weight:600;color:#e4e7ec;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1"></h3>' +
        '<button id="drawerClose" style="background:none;border:none;color:#5a5e70;font-size:18px;cursor:pointer;padding:4px;line-height:1;flex-shrink:0" title="Close">&#10005;</button>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:20px 22px">' +
        '<form id="drawerForm">' +
          '<input type="hidden" name="deal_id">' +

          '<div style="margin-bottom:14px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Title</label>' +
            '<input name="title" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box" required>' +
          '</div>' +

          '<div style="margin-bottom:14px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Company</label>' +
            '<input name="company" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box">' +
          '</div>' +

          '<div style="margin-bottom:14px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Source</label>' +
            '<select name="source" id="drawerSourceSelect" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box">' +
              '<option value="">— unknown —</option>' +
              '<option value="cold_email_chile">Cold Email — Chile Campaign</option>' +
              '<option value="cold_email_usa">Cold Email — USA Campaign</option>' +
              '<option value="whatsapp">WhatsApp</option>' +
              '<option value="referral">Referral</option>' +
              '<option value="inbound_website">Inbound — Website</option>' +
              '<option value="inbound_call">Inbound — Call</option>' +
              '<option value="social_media">Social Media</option>' +
              '<option value="event">Event / Trade Show</option>' +
              '<option value="manual">Manual / Other</option>' +
            '</select>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">' +
            '<div>' +
              '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Value ($)</label>' +
              '<input name="value" type="number" min="0" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box">' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Probability (%)</label>' +
              '<input name="probability" type="number" min="0" max="100" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box">' +
            '</div>' +
          '</div>' +

          '<div style="margin-bottom:14px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Stage</label>' +
            '<select name="stage_id" id="drawerStageSelect" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box"></select>' +
          '</div>' +

          '<div style="margin-bottom:14px;padding:14px;background:#0f1117;border:1px solid #2a2d3a;border-radius:8px">' +
            '<div style="font-size:11px;color:#FF671F;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px">&#128204; Next Follow-up</div>' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;font-weight:600">Action</label>' +
            '<input name="next_action" placeholder="e.g. Send proposal, Schedule demo..." style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:13px;box-sizing:border-box;margin-bottom:10px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;font-weight:600">Date</label>' +
            '<input name="next_followup_date" type="date" style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:14px;box-sizing:border-box">' +
          '</div>' +

          '<div style="margin-bottom:18px">' +
            '<label style="display:block;font-size:11px;color:#8b8fa3;margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">Notes</label>' +
            '<textarea name="notes" rows="5" placeholder="Why is this deal here? Context, objections, history..." style="width:100%;background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:9px 12px;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.5"></textarea>' +
          '</div>' +

          '<div id="drawerMeta" style="font-size:12px;color:#5a5e70;margin-bottom:16px;line-height:1.6"></div>' +

          '<div style="display:flex;gap:8px">' +
            '<button type="submit" style="flex:1;background:#FF671F;color:#fff;border:none;padding:11px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;transition:.2s">Save</button>' +
            '<button type="button" id="drawerDelete" style="background:#1a1d27;color:#e17055;border:1px solid #2a2d3a;padding:11px 14px;border-radius:6px;font-size:14px;cursor:pointer;transition:.2s" title="Delete deal">&#128465;</button>' +
          '</div>' +
          '<div id="drawerSaveMsg" style="margin-top:10px;font-size:13px;text-align:center;min-height:18px"></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(el);

    document.getElementById('drawerClose').addEventListener('click', closeDrawer);
    document.getElementById('drawerForm').addEventListener('submit', handleDrawerSave);
    document.getElementById('drawerDelete').addEventListener('click', handleDrawerDelete);

    document.addEventListener('click', function (e) {
      var drawer = document.getElementById('dealDrawer');
      if (!drawer || drawer.style.right === '-440px') return;
      if (!drawer.contains(e.target) && !e.target.closest('.deal-card') && !e.target.closest('.pipe-quick-action')) {
        closeDrawer();
      }
    });
  }

  function openDrawer(dealId) {
    var drawer = document.getElementById('dealDrawer');
    if (!drawer) return;
    var sel = document.getElementById('drawerStageSelect');
    sel.innerHTML = '';
    for (var i = 0; i < stagesData.length; i++) {
      var opt = document.createElement('option');
      opt.value = stagesData[i].id;
      opt.textContent = stagesData[i].name;
      sel.appendChild(opt);
    }
    document.getElementById('drawerDealTitle').textContent = 'Loading…';
    document.getElementById('drawerSaveMsg').textContent = '';
    document.getElementById('drawerMeta').textContent = '';
    drawer.style.right = '0';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=deals&id=' + dealId, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var deal;
        try { deal = JSON.parse(xhr.responseText); } catch (er) { deal = null; }
        if (deal) fillDrawer(deal);
      }
    };
    xhr.send();
  }

  function fillDrawer(deal) {
    var form = document.getElementById('drawerForm');
    document.getElementById('drawerDealTitle').textContent = deal.title;
    form.deal_id.value = deal.id;
    form.title.value = deal.title || '';
    form.company.value = deal.company || '';
    form.value.value = deal.value || 0;
    form.probability.value = deal.probability || 0;
    form.source.value = deal.source || '';
    form.next_action.value = deal.next_action || '';
    form.next_followup_date.value = deal.next_followup_date || '';
    form.notes.value = deal.notes || '';

    var sel = document.getElementById('drawerStageSelect');
    if (deal.stage_id) sel.value = deal.stage_id;

    var meta = [];
    if (deal.contact_name) meta.push('Contact: ' + deal.contact_name);
    if (deal.contact_email) meta.push(deal.contact_email);
    if (deal.contact_phone) meta.push(deal.contact_phone);
    if (deal.created_at) {
      var d = (deal.created_at || '').split('T')[0].split(' ')[0];
      if (d) meta.push('Created: ' + d);
    }
    if (deal.days_in_stage !== undefined) meta.push(deal.days_in_stage + ' days in stage');
    document.getElementById('drawerMeta').innerHTML = meta.join(' &nbsp;·&nbsp; ');
    document.getElementById('drawerSaveMsg').textContent = '';
  }

  function closeDrawer() {
    var drawer = document.getElementById('dealDrawer');
    if (drawer) drawer.style.right = '-440px';
  }

  function handleDrawerSave(e) {
    e.preventDefault();
    var form = document.getElementById('drawerForm');
    var dealId = form.deal_id.value;
    var msg = document.getElementById('drawerSaveMsg');
    msg.style.color = '#8b8fa3';
    msg.textContent = 'Saving…';

    var body = JSON.stringify({
      title: form.title.value.trim(),
      company: form.company.value.trim(),
      value: parseInt(form.value.value, 10) || 0,
      probability: parseInt(form.probability.value, 10) || 0,
      stage_id: parseInt(form.stage_id.value, 10),
      source: form.source.value || null,
      notes: form.notes.value,
      next_action: form.next_action.value.trim(),
      next_followup_date: form.next_followup_date.value || null
    });

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/?r=deals&id=' + dealId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var updated;
        try { updated = JSON.parse(xhr.responseText); } catch (er) { updated = null; }
        if (updated) {
          for (var i = 0; i < dealsData.length; i++) {
            if (String(dealsData[i].id) === String(dealId)) { dealsData[i] = updated; break; }
          }
          renderPipeline();
          renderKpiBar();
          document.getElementById('drawerDealTitle').textContent = updated.title;
        }
        msg.style.color = '#00b894';
        msg.textContent = 'Saved';
        setTimeout(function () { msg.textContent = ''; }, 2000);
      } else {
        msg.style.color = '#e17055';
        msg.textContent = 'Error saving. Try again.';
      }
    };
    xhr.send(body);
  }

  function handleDrawerDelete() {
    var form = document.getElementById('drawerForm');
    var dealId = form.deal_id.value;
    var title = form.title.value || 'this deal';
    if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;

    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/api/?r=deals&id=' + dealId, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        dealsData = dealsData.filter(function (d) { return String(d.id) !== String(dealId); });
        renderPipeline();
        renderKpiBar();
        closeDrawer();
      }
    };
    xhr.send();
  }

  /* ── Bootstrap ──────────────────────────────────────────────────── */

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs
      ? { newDeal: "Nueva Oportunidad", daysInStage: "d en etapa", stale: "Atrasado" }
      : { newDeal: "New Deal",          daysInStage: "d in stage", stale: "Stale" };

    CRM_APP.buildHeader(
      CRM_APP.t('nav.pipeline'),
      '<button class="btn btn-primary" id="newDealBtn">' + CRM_APP.ICONS.plus + ' ' + L.newDeal + '</button>'
    );

    document.addEventListener('click', function (e) {
      if (e.target && (e.target.id === 'newDealBtn' || e.target.closest && e.target.closest('#newDealBtn'))) {
        openModal();
      }
    });

    injectStyles();
    injectModal();
    injectDrawer();
    injectTopBar();
    loadStats();
    loadPipelineData();
  });

  /* ── Inline styles (extends css/app.css without editing it) ─────── */

  function injectStyles() {
    if (document.getElementById('pipeUpgradeStyles')) return;
    var s = document.createElement('style');
    s.id = 'pipeUpgradeStyles';
    s.textContent = [
      '.pipe-tabbar{display:flex;gap:4px;background:#141620;border-radius:10px;padding:4px;width:fit-content}',
      '.pipe-tab{padding:8px 18px;border:none;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;background:transparent;color:#8b8fa3;transition:.15s}',
      '.pipe-tab.active{background:#FF671F;color:#fff}',
      '.pipe-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:4px}',
      '.pipe-toolbar input,.pipe-toolbar select{background:#141620;border:1px solid #2a2d3a;color:#e4e7ec;padding:7px 10px;border-radius:6px;font-size:13px;font-family:inherit}',
      '.pipe-toolbar input:focus,.pipe-toolbar select:focus{outline:none;border-color:#FF671F}',
      '.pipe-view-toggle{display:flex;gap:0;background:#141620;border:1px solid #2a2d3a;border-radius:6px;overflow:hidden}',
      '.pipe-view-toggle button{background:transparent;border:none;color:#8b8fa3;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer}',
      '.pipe-view-toggle button.active{background:#FF671F;color:#fff}',
      '.pipe-stage-hint{font-size:10px;color:#5a5e70;margin-top:4px;line-height:1.3}',
      '.pipe-stage-prob{font-size:10px;font-weight:700;color:#6366f1;background:rgba(99,102,241,.12);padding:1px 6px;border-radius:8px;margin-left:6px}',
      '.deal-card{position:relative}',
      '.deal-card.stale{border-left:3px solid #e17055}',
      '.deal-card-quick{position:absolute;top:8px;right:8px;display:none;gap:4px}',
      '.deal-card:hover .deal-card-quick{display:flex}',
      '.pipe-quick-action{background:#1a1d27;border:1px solid #2a2d3a;color:#8b8fa3;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;text-decoration:none;transition:.15s}',
      '.pipe-quick-action:hover{background:#FF671F;color:#fff;border-color:#FF671F}',
      '.deal-card-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}',
      '.deal-card-tag{font-size:9px;font-weight:600;padding:2px 6px;border-radius:8px;background:rgba(99,102,241,.15);color:#a3a8ff;text-transform:uppercase;letter-spacing:.4px}',
      '.deal-card-score{position:absolute;top:8px;left:8px;background:#0f1117;border:1px solid #2a2d3a;color:#fdcb6e;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px}',
      '.pipe-list-table{width:100%;border-collapse:collapse;background:#1a1d27;border:1px solid #2a2d3a;border-radius:10px;overflow:hidden;font-size:13px}',
      '.pipe-list-table th{background:#0f1117;color:#8b8fa3;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;border-bottom:1px solid #2a2d3a}',
      '.pipe-list-table td{padding:10px 12px;border-bottom:1px solid #20232f;color:#e4e7ec}',
      '.pipe-list-table tr{cursor:pointer;transition:.1s}',
      '.pipe-list-table tr:hover td{background:#20232f}',
      '.pipe-source-mix{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.pipe-source-pill{background:#1a1d27;border:1px solid #2a2d3a;border-radius:14px;padding:4px 10px;font-size:11px;color:#8b8fa3}',
      '.pipe-source-pill b{color:#FF671F;margin-right:4px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Top bar: tabs + KPIs + filters + view toggle ───────────────── */

  function injectTopBar() {
    var body = document.querySelector('.pipeline-body');
    if (!body || document.getElementById('pipelineTopBar')) return;
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');

    var wrap = document.createElement('div');
    wrap.id = 'pipelineTopBar';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-bottom:16px;';

    /* Row 1 — tabs + view toggle */
    var row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap';

    var tabRow = document.createElement('div');
    tabRow.className = 'pipe-tabbar';
    [['sales',     isEs ? 'Pipeline de Ventas'    : 'Sales Pipeline'],
     ['marketing', isEs ? 'Pipeline de Marketing' : 'Marketing Pipeline']
    ].forEach(function(pair) {
      var btn = document.createElement('button');
      btn.id = 'tab-' + pair[0];
      btn.className = 'pipe-tab' + (pair[0] === 'sales' ? ' active' : '');
      btn.textContent = pair[1];
      btn.addEventListener('click', function() { switchTab(pair[0]); });
      tabRow.appendChild(btn);
    });
    row1.appendChild(tabRow);

    var viewToggle = document.createElement('div');
    viewToggle.className = 'pipe-view-toggle';
    viewToggle.innerHTML =
      '<button id="viewKanban" class="active">' + (isEs ? 'Kanban' : 'Kanban') + '</button>' +
      '<button id="viewList">' + (isEs ? 'Lista' : 'List') + '</button>';
    viewToggle.querySelector('#viewKanban').addEventListener('click', function(){ setView('kanban'); });
    viewToggle.querySelector('#viewList').addEventListener('click', function(){ setView('list'); });
    row1.appendChild(viewToggle);

    wrap.appendChild(row1);

    /* Row 2 — KPI cards */
    var statsRow = document.createElement('div');
    statsRow.id = 'pipelineStatsBar';
    statsRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap';
    wrap.appendChild(statsRow);

    /* Row 3 — filter toolbar */
    var toolbar = document.createElement('div');
    toolbar.className = 'pipe-toolbar';
    toolbar.id = 'pipeToolbar';
    toolbar.innerHTML =
      '<input type="search" id="filterSearch" placeholder="' + (isEs ? 'Buscar deal, empresa, contacto…' : 'Search deal, company, contact…') + '" style="min-width:240px">' +
      '<select id="filterSource">' +
        '<option value="">' + (isEs ? 'Todas las fuentes' : 'All sources') + '</option>' +
        '<option value="cold_email_chile">Cold Email — Chile</option>' +
        '<option value="cold_email_usa">Cold Email — USA</option>' +
        '<option value="whatsapp">WhatsApp</option>' +
        '<option value="referral">Referral</option>' +
        '<option value="inbound_website">Inbound — Website</option>' +
        '<option value="inbound_call">Inbound — Call</option>' +
        '<option value="social_media">Social Media</option>' +
        '<option value="event">Event</option>' +
        '<option value="manual">Manual</option>' +
      '</select>' +
      '<select id="filterStatus">' +
        '<option value="open">' + (isEs ? 'Abiertos' : 'Open only') + '</option>' +
        '<option value="all">' + (isEs ? 'Todos' : 'All') + '</option>' +
        '<option value="won">' + (isEs ? 'Ganados' : 'Won') + '</option>' +
        '<option value="lost">' + (isEs ? 'Perdidos' : 'Lost') + '</option>' +
      '</select>' +
      '<button id="filterReset" class="btn btn-secondary" style="padding:7px 12px;font-size:12px">' + (isEs ? 'Reset' : 'Reset') + '</button>';
    wrap.appendChild(toolbar);

    body.insertBefore(wrap, body.firstChild);

    document.getElementById('filterSearch').addEventListener('input', function(e){ filters.search = e.target.value.toLowerCase(); renderPipeline(); renderKpiBar(); });
    document.getElementById('filterSource').addEventListener('change', function(e){ filters.source = e.target.value; renderPipeline(); renderKpiBar(); });
    document.getElementById('filterStatus').addEventListener('change', function(e){ filters.status = e.target.value; renderPipeline(); renderKpiBar(); });
    document.getElementById('filterReset').addEventListener('click', function(){
      filters = { search:'', source:'', owner:'', status:'open' };
      document.getElementById('filterSearch').value = '';
      document.getElementById('filterSource').value = '';
      document.getElementById('filterStatus').value = 'open';
      renderPipeline(); renderKpiBar();
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    var ts = document.getElementById('tab-sales');
    var tm = document.getElementById('tab-marketing');
    if (ts && tm) {
      ts.classList.toggle('active', tab === 'sales');
      tm.classList.toggle('active', tab === 'marketing');
    }
    var newDealBtn = document.getElementById('newDealBtn');
    if (newDealBtn) newDealBtn.style.display = tab === 'sales' ? '' : 'none';

    /* hide source/status filters in marketing (different semantics) */
    var fSrc = document.getElementById('filterSource');
    var fSt  = document.getElementById('filterStatus');
    if (fSrc) fSrc.style.display = tab === 'sales' ? '' : 'none';
    if (fSt)  fSt.style.display  = tab === 'sales' ? '' : 'none';

    if (tab === 'sales') {
      loadPipelineData();
    } else {
      loadMarketingPipeline();
    }
    renderKpiBar();
  }

  function setView(v) {
    activeView = v;
    document.getElementById('viewKanban').classList.toggle('active', v === 'kanban');
    document.getElementById('viewList').classList.toggle('active', v === 'list');
    renderPipeline();
  }

  /* ── Filtered deal accessor ─────────────────────────────────────── */

  function visibleDeals() {
    return dealsData.filter(function (d) {
      if (filters.status === 'open' && (d.stage === 'Closed Won' || d.stage === 'Closed Lost')) return false;
      if (filters.status === 'won'  && d.stage !== 'Closed Won')  return false;
      if (filters.status === 'lost' && d.stage !== 'Closed Lost') return false;
      if (filters.source && d.source !== filters.source) return false;
      if (filters.search) {
        var hay = ((d.title || '') + ' ' + (d.company || '') + ' ' + (d.contact_name || '') + ' ' + (d.contact_email || '')).toLowerCase();
        if (hay.indexOf(filters.search) === -1) return false;
      }
      return true;
    });
  }

  /* ── KPI bar ────────────────────────────────────────────────────── */

  function loadStats() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=stats', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { statsData = JSON.parse(xhr.responseText); } catch (e) {}
      }
      if (!statsData && window.CRM_DATA && CRM_DATA.stats) statsData = CRM_DATA.stats;
      statsData = statsData || {};
      renderKpiBar();
    };
    xhr.send();
  }

  function renderKpiBar() {
    var bar = document.getElementById('pipelineStatsBar');
    if (!bar) return;
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var items;

    if (activeTab === 'sales') {
      var open = dealsData.filter(function(d){ return d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'; });
      var totalValue = 0, weightedValue = 0;
      for (var i = 0; i < open.length; i++) {
        var v = parseInt(open[i].value, 10) || 0;
        var p = parseInt(open[i].probability, 10) || 0;
        totalValue += v;
        weightedValue += v * (p / 100);
      }
      var now = new Date(), m = now.getMonth(), y = now.getFullYear();
      var wonMtd = dealsData.filter(function(d){
        if (d.stage !== 'Closed Won') return false;
        var dt = new Date((d.updated_at || d.created_at || '').replace(' ', 'T'));
        return dt.getMonth() === m && dt.getFullYear() === y;
      });
      var wonMtdValue = wonMtd.reduce(function(s,d){ return s + (parseInt(d.value,10)||0); }, 0);
      var won = dealsData.filter(function(d){ return d.stage === 'Closed Won'; }).length;
      var lost = dealsData.filter(function(d){ return d.stage === 'Closed Lost'; }).length;
      var conv = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;

      items = [
        { label: isEs ? 'Pipeline Abierto'  : 'Open Pipeline',    value: '$' + fmtK(totalValue),     color: '#e4e7ec' },
        { label: isEs ? 'Valor Ponderado'   : 'Weighted Value',   value: '$' + fmtK(weightedValue),  color: '#FF671F', sub: isEs ? 'Σ valor × prob.' : 'Σ value × prob.' },
        { label: isEs ? 'Ganado MTD'        : 'Won MTD',          value: '$' + fmtK(wonMtdValue),    color: '#00b894', sub: wonMtd.length + ' ' + (isEs ? 'oportunidades' : 'deals') },
        { label: isEs ? 'Conversión'        : 'Win Rate',         value: conv + '%',                 color: '#6366f1', sub: won + 'W / ' + lost + 'L' },
        { label: isEs ? 'Oportunidades'     : 'Active Deals',     value: open.length,                 color: '#fdcb6e' }
      ];
    } else {
      var lc = computeLifecycle();
      var mqlToSql = lc.mql > 0 ? Math.round((lc.sql / lc.mql) * 100) : 0;
      var sqlToCust = lc.sql > 0 ? Math.round((lc.customer / lc.sql) * 100) : 0;
      items = [
        { label: isEs ? 'Contactos Totales' : 'Total Contacts', value: (lc.total || 0).toLocaleString(), color: '#e4e7ec' },
        { label: 'MQL',                                          value: lc.mql,        color: '#FF671F' },
        { label: 'SQL',                                          value: lc.sql,        color: '#fdcb6e' },
        { label: isEs ? 'Clientes' : 'Customers',                value: lc.customer,   color: '#00b894' },
        { label: 'MQL → SQL',                                    value: mqlToSql + '%', color: '#6366f1' },
        { label: 'SQL → ' + (isEs ? 'Cliente' : 'Customer'),     value: sqlToCust + '%', color: '#a3a8ff' }
      ];
    }

    bar.innerHTML = items.map(function (s) {
      return '<div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:10px;padding:12px 18px;min-width:130px">' +
        '<div style="font-size:10px;color:#8b8fa3;text-transform:uppercase;letter-spacing:.7px;font-weight:600;margin-bottom:4px">' + s.label + '</div>' +
        '<div style="font-size:22px;font-weight:700;color:' + s.color + '">' + s.value + '</div>' +
        (s.sub ? '<div style="font-size:10px;color:#5a5e70;margin-top:2px">' + s.sub + '</div>' : '') +
        '</div>';
    }).join('');

    /* Source mix in marketing tab */
    if (activeTab === 'marketing') renderSourceMix();
  }

  function fmtK(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(Math.round(n));
  }

  function renderSourceMix() {
    var bar = document.getElementById('pipelineStatsBar');
    if (!bar) return;
    var counts = {};
    contactsData.forEach(function(c){
      var c2 = c.data && typeof c.data === 'object' ? c.data : c;
      var src = c2.source || 'unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    var labels = { cold_email_chile:'Chile Email', cold_email_usa:'USA Email', whatsapp:'WhatsApp', referral:'Referral', inbound_website:'Website', inbound_call:'Call', social_media:'Social', event:'Event', manual:'Manual', unknown:'Unknown' };
    var pills = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; }).slice(0,6).map(function(k){
      return '<span class="pipe-source-pill"><b>' + counts[k] + '</b>' + (labels[k] || k) + '</span>';
    }).join('');
    if (pills) {
      var mix = document.createElement('div');
      mix.className = 'pipe-source-mix';
      mix.style.flexBasis = '100%';
      mix.innerHTML = pills;
      bar.appendChild(mix);
    }
  }

  /* ── Marketing lifecycle (HubSpot-style) ────────────────────────── */

  var LIFECYCLE = [
    { key:'subscriber',  en:'Subscriber',  es:'Suscriptor',  color:'#8b8fa3', hint_en:'Opted in but no qualifying activity yet.', hint_es:'Suscrito sin actividad calificada.' },
    { key:'lead',        en:'Lead',        es:'Lead',        color:'#6366f1', hint_en:'Captured contact. Not engaged yet.',        hint_es:'Capturado. Sin engagement.' },
    { key:'mql',         en:'MQL',         es:'MQL',         color:'#FF671F', hint_en:'Marketing Qualified — meets ICP + intent.', hint_es:'Calificado por marketing.' },
    { key:'sql',         en:'SQL',         es:'SQL',         color:'#fdcb6e', hint_en:'Sales Qualified — has open deal.',          hint_es:'Calificado por ventas.' },
    { key:'opportunity', en:'Opportunity', es:'Oportunidad', color:'#a855f7', hint_en:'Active deal in negotiation.',               hint_es:'Negociación activa.' },
    { key:'customer',    en:'Customer',    es:'Cliente',     color:'#00b894', hint_en:'Closed Won. Onboarded.',                    hint_es:'Cerrado, ganado.' },
    { key:'evangelist',  en:'Evangelist',  es:'Evangelista', color:'#10b981', hint_en:'Customer who refers / advocates.',          hint_es:'Cliente que refiere.' },
    { key:'disqualified',en:'Disqualified',es:'Descalificado',color:'#636e72',hint_en:'Out of ICP / churned / unsubscribed.',     hint_es:'Fuera de ICP / baja.' }
  ];

  /* derive lifecycle stage from contact + their deals */
  function lifecycleStageFor(contact) {
    var c = contact.data && typeof contact.data === 'object' ? Object.assign({}, contact.data, { id: contact.id }) : contact;
    var status = (c.status || '').toLowerCase();

    if (status === 'churned') return 'disqualified';
    if (status === 'customer') {
      /* Evangelist if has referrals tag/source, otherwise customer */
      var tags = (c.tags || '').toString().toLowerCase();
      if (tags.indexOf('evangelist') >= 0 || tags.indexOf('referrer') >= 0) return 'evangelist';
      return 'customer';
    }

    /* Find this contact's deals */
    var myDeals = dealsData.filter(function(d){
      return (d.contact_id && String(d.contact_id) === String(c.id)) ||
             (c.email && d.contact_email === c.email);
    });
    if (myDeals.length) {
      var hasNegotiation = myDeals.some(function(d){ return d.stage === 'Negotiation' || d.stage === 'Proposal Sent'; });
      var hasOpen = myDeals.some(function(d){ return d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'; });
      if (hasNegotiation) return 'opportunity';
      if (hasOpen) return 'sql';
    }

    if (status === 'prospect') return 'mql';
    if (status === 'lead') {
      /* Subscriber if no source/no engagement; else Lead */
      if (!c.source && !c.last_contact) return 'subscriber';
      return 'lead';
    }
    return 'subscriber';
  }

  function computeLifecycle() {
    var counts = { subscriber:0, lead:0, mql:0, sql:0, opportunity:0, customer:0, evangelist:0, disqualified:0, total: contactsData.length };
    contactsData.forEach(function(c){ counts[lifecycleStageFor(c)]++; });
    return counts;
  }

  function loadMarketingPipeline() {
    showSpinner();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=contacts&segment=all', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var contacts = [];
      if (xhr.status >= 200 && xhr.status < 300) {
        try { contacts = JSON.parse(xhr.responseText); } catch (e) {}
      }
      if ((!contacts || !contacts.length) && window.CRM_DATA && CRM_DATA.contacts) {
        contacts = CRM_DATA.contacts;
      }
      contactsData = contacts || [];
      /* if deals not yet loaded, load them silently for SQL/Opportunity derivation */
      if (!dealsData.length) {
        var xd = new XMLHttpRequest();
        xd.open('GET', '/api/?r=deals', true);
        xd.onreadystatechange = function () {
          if (xd.readyState !== 4) return;
          if (xd.status >= 200 && xd.status < 300) {
            try { dealsData = JSON.parse(xd.responseText); } catch (e) {}
          }
          renderMarketingPipeline();
          renderKpiBar();
        };
        xd.send();
      } else {
        renderMarketingPipeline();
        renderKpiBar();
      }
    };
    xhr.send();
  }

  function renderMarketingPipeline() {
    var board = document.getElementById('pipelineBoard');
    if (!board) return;
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');

    /* group contacts by lifecycle stage, apply search filter */
    var groups = {};
    LIFECYCLE.forEach(function(s){ groups[s.key] = []; });
    contactsData.forEach(function(c){
      var c2 = c.data && typeof c.data === 'object' ? Object.assign({}, c.data, { id: c.id }) : c;
      if (filters.search) {
        var hay = ((c2.name || '') + ' ' + (c2.company || '') + ' ' + (c2.email || '')).toLowerCase();
        if (hay.indexOf(filters.search) === -1) return;
      }
      groups[lifecycleStageFor(c)].push(c2);
    });

    if (activeView === 'list') return renderMarketingList(groups);

    var html = '';
    LIFECYCLE.forEach(function(s){
      var list = groups[s.key];
      var label = isEs ? s.es : s.en;
      var hint  = isEs ? s.hint_es : s.hint_en;
      html += '<div class="pipeline-column">';
      html += '<div class="column-header">';
      html +=   '<div class="column-title">';
      html +=     '<span class="column-name" style="color:' + s.color + '">' + label + '</span>';
      html +=     '<span class="column-count">' + list.length + '</span>';
      html +=   '</div>';
      html +=   '<div class="pipe-stage-hint">' + hint + '</div>';
      html += '</div>';
      html += '<div class="column-cards" data-stage="' + s.key + '">';
      list.forEach(function(c){ html += renderContactCard(c); });
      html += '</div></div>';
    });
    board.innerHTML = html;
  }

  function renderContactCard(c) {
    var name = c.name || c.first_name || c.email || '—';
    var html = '<div class="deal-card" data-contact-id="' + (c.id || '') + '" style="cursor:default">';
    html += '<div class="deal-card-title">' + escapeHtml(name) + '</div>';
    if (c.company) html += '<div class="deal-card-company">' + escapeHtml(c.company) + '</div>';
    if (c.email)   html += '<div class="deal-card-contact">' + escapeHtml(c.email) + '</div>';
    if (c.source) {
      var srcLabels = { cold_email_chile:'Chile Email', cold_email_usa:'USA Email', whatsapp:'WhatsApp', referral:'Referral', inbound_website:'Website', inbound_call:'Call', social_media:'Social', event:'Event', manual:'Manual' };
      html += '<div class="deal-card-tags"><span class="deal-card-tag">' + (srcLabels[c.source] || c.source) + '</span></div>';
    }
    /* quick actions */
    var qa = '';
    if (c.email)   qa += '<a class="pipe-quick-action" href="mailto:' + encodeURIComponent(c.email) + '" title="Email">&#9993;</a>';
    if (c.phone)   qa += '<a class="pipe-quick-action" href="tel:' + encodeURIComponent(c.phone) + '" title="Call">&#9742;</a>';
    if (c.phone)   qa += '<a class="pipe-quick-action" href="https://wa.me/' + encodeURIComponent(String(c.phone).replace(/[^0-9]/g,'')) + '" target="_blank" title="WhatsApp">&#128172;</a>';
    if (qa) html += '<div class="deal-card-quick">' + qa + '</div>';
    html += '</div>';
    return html;
  }

  function renderMarketingList(groups) {
    var board = document.getElementById('pipelineBoard');
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var rows = '';
    LIFECYCLE.forEach(function(s){
      groups[s.key].forEach(function(c){
        rows += '<tr>' +
          '<td><span class="deal-card-tag" style="background:' + hexAlpha(s.color, .15) + ';color:' + s.color + '">' + (isEs ? s.es : s.en) + '</span></td>' +
          '<td>' + escapeHtml(c.name || c.email || '—') + '</td>' +
          '<td>' + escapeHtml(c.company || '') + '</td>' +
          '<td>' + escapeHtml(c.email || '') + '</td>' +
          '<td>' + escapeHtml(c.phone || '') + '</td>' +
          '<td>' + escapeHtml(c.source || '') + '</td>' +
        '</tr>';
      });
    });
    board.style.flexDirection = 'column';
    board.innerHTML = '<table class="pipe-list-table">' +
      '<thead><tr>' +
        '<th>' + (isEs ? 'Etapa' : 'Stage') + '</th>' +
        '<th>' + (isEs ? 'Nombre' : 'Name') + '</th>' +
        '<th>' + (isEs ? 'Empresa' : 'Company') + '</th>' +
        '<th>Email</th>' +
        '<th>' + (isEs ? 'Teléfono' : 'Phone') + '</th>' +
        '<th>' + (isEs ? 'Fuente' : 'Source') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function hexAlpha(hex, a) {
    var h = hex.replace('#','');
    var r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function showSpinner() {
    var c = document.getElementById("pipelineBoard");
    if (!c) return;
    c.style.flexDirection = '';
    c.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;width:100%">' +
      '<div style="border:4px solid #e0e0e0;border-top-color:#FF671F;border-radius:50%;width:40px;height:40px;animation:spin 0.8s linear infinite;"></div>' +
      '</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  }

  /* ── Sales pipeline data load ───────────────────────────────────── */

  function loadPipelineData() {
    showSpinner();
    var userNiche = window.CRM_APP ? CRM_APP.getUserNiche() : null;
    if (userNiche) {
      loadNicheStages(userNiche);
    } else {
      loadOrgStages();
    }
  }

  function loadNicheStages(niche) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=niche_config&niche=' + encodeURIComponent(niche), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        try {
          var nd = JSON.parse(xhr.responseText);
          var ns = nd.pipeline_stages || [];
          if (ns.length) {
            stagesData = ns.map(function (s, idx) {
              return { id: idx + 1, name: s.name, sort_order: s.sort_order, color: s.color || '#6366f1', probability: s.probability };
            });
            stagesData.sort(function (a, b) { return a.sort_order - b.sort_order; });
            loadDeals();
            return;
          }
        } catch (e) {}
      }
      loadOrgStages();
    };
    xhr.send();
  }

  function loadOrgStages() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=stages', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { stagesData = JSON.parse(xhr.responseText); } catch (err) { stagesData = []; }
        stagesData.sort(function (a, b) { return a.sort_order - b.sort_order; });
        loadDeals();
      } else {
        var c = document.getElementById("pipelineBoard");
        if (c) c.innerHTML = '<p style="color:red;padding:1rem;">Error loading stages.</p>';
      }
    };
    xhr.send();
  }

  function loadDeals() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/?r=deals', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { dealsData = JSON.parse(xhr.responseText); } catch (err) { dealsData = []; }
        renderPipeline();
        renderKpiBar();
      } else {
        var c = document.getElementById("pipelineBoard");
        if (c) c.innerHTML = '<p style="color:red;padding:1rem;">Error loading deals.</p>';
      }
    };
    xhr.send();
  }

  /* ── Sales render: kanban + list ────────────────────────────────── */

  function renderPipeline() {
    if (activeTab === 'marketing') return renderMarketingPipeline();
    var c = document.getElementById("pipelineBoard");
    if (!c) return;
    c.style.flexDirection = '';

    if (activeView === 'list') return renderSalesList();

    var deals = visibleDeals();
    var html = '';

    for (var i = 0; i < stagesData.length; i++) {
      var stage = stagesData[i];
      var stageDeals = deals.filter(function(d){ return d.stage === stage.name; });
      var totalValue = stageDeals.reduce(function(s,d){ return s + (parseInt(d.value,10)||0); }, 0);
      var weighted   = stageDeals.reduce(function(s,d){ return s + (parseInt(d.value,10)||0) * ((parseInt(d.probability,10)||0)/100); }, 0);
      var prob = stageProbByName(stage.name);

      html += '<div class="pipeline-column" data-stage="' + stage.name + '">';
      html +=   '<div class="column-header">';
      html +=     '<div class="column-title">';
      html +=       '<span class="column-name" style="color:' + (stage.color || '#e4e7ec') + '">' + stageLabel(stage.name) + '</span>';
      html +=       '<span class="pipe-stage-prob">' + prob + '%</span>';
      html +=       '<span class="column-count">' + stageDeals.length + '</span>';
      html +=     '</div>';
      html +=     '<div class="column-value">$' + fmtK(totalValue) + ' · <span title="Weighted">$' + fmtK(weighted) + 'w</span></div>';
      html +=     '<div class="pipe-stage-hint">' + stageHint(stage.name) + '</div>';
      html +=   '</div>';

      html +=   '<div class="column-cards" data-stage="' + stage.name + '">';
      stageDeals.forEach(function(d){ html += renderDealCard(d); });
      html +=   '</div>';
      html += '</div>';
    }

    c.innerHTML = html;
    initDragDrop();
  }

  function renderDealCard(deal) {
    var prob = parseInt(deal.probability, 10) || 0;
    var probColor = prob >= 70 ? "#00b894" : prob >= 40 ? "#fdcb6e" : "#e17055";
    var valueFormatted = '$' + (parseInt(deal.value, 10) || 0).toLocaleString();
    var contactName = deal.contact_name || deal.contact || '';
    var days = deal.days_in_stage !== undefined ? deal.days_in_stage : (deal.daysInStage || 0);
    var sla = STAGE_SLA[deal.stage];
    var stale = sla && days > sla;

    var sourceLabel = {
      cold_email_chile: 'Chile Email', cold_email_usa: 'USA Email',
      whatsapp: 'WhatsApp', referral: 'Referral',
      inbound_website: 'Website', inbound_call: 'Call',
      social_media: 'Social', event: 'Event', manual: 'Manual'
    };
    var src = deal.source ? (sourceLabel[deal.source] || deal.source) : '';

    /* simple lead score: probability + (value bracket) + has phone/email */
    var score = Math.min(100, prob + Math.min(20, Math.floor((parseInt(deal.value,10)||0) / 1000)) + (deal.contact_phone ? 5 : 0) + (deal.contact_email ? 5 : 0));

    var html = '<div class="deal-card' + (stale ? ' stale' : '') + '" draggable="true" data-deal-id="' + deal.id + '" style="cursor:pointer">';
    html += '<div class="deal-card-score" title="Lead score">' + score + '</div>';

    /* quick actions */
    var qa = '';
    if (deal.contact_email) qa += '<a class="pipe-quick-action" href="mailto:' + encodeURIComponent(deal.contact_email) + '" title="Email" onclick="event.stopPropagation()">&#9993;</a>';
    if (deal.contact_phone) qa += '<a class="pipe-quick-action" href="tel:' + encodeURIComponent(deal.contact_phone) + '" title="Call" onclick="event.stopPropagation()">&#9742;</a>';
    if (deal.contact_phone) qa += '<a class="pipe-quick-action" href="https://wa.me/' + encodeURIComponent(String(deal.contact_phone).replace(/[^0-9]/g,'')) + '" target="_blank" title="WhatsApp" onclick="event.stopPropagation()">&#128172;</a>';
    if (qa) html += '<div class="deal-card-quick">' + qa + '</div>';

    if (src) html += '<div class="deal-card-source">' + src + '</div>';
    html += '<div class="deal-card-title" style="margin-top:' + (src ? '0' : '14px') + '">' + escapeHtml(deal.title) + '</div>';
    html += '<div class="deal-card-company">' + escapeHtml(deal.company || '') + '</div>';
    html += '<div class="deal-card-footer">';
    html += '<span class="deal-card-value">' + valueFormatted + '</span>';
    html += '<span class="deal-card-prob" style="color:' + probColor + '">' + prob + '%</span>';
    html += '</div>';
    html += '<div class="deal-card-contact">' + escapeHtml(contactName) + '</div>';
    if (deal.next_followup_date) {
      var actionText = deal.next_action ? ' — ' + escapeHtml(deal.next_action) : '';
      html += '<div class="deal-card-followup">📅 ' + deal.next_followup_date + actionText + '</div>';
    }
    html += '<div class="deal-card-days"' + (stale ? ' style="color:#e17055;font-weight:600"' : '') + '>' +
            days + L.daysInStage + (stale ? ' · ' + L.stale : '') + '</div>';
    html += '</div>';
    return html;
  }

  function renderSalesList() {
    var c = document.getElementById('pipelineBoard');
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var deals = visibleDeals().slice().sort(function(a,b){
      return ((parseInt(b.value,10)||0) * ((parseInt(b.probability,10)||0)/100))
           - ((parseInt(a.value,10)||0) * ((parseInt(a.probability,10)||0)/100));
    });
    var rows = deals.map(function(d){
      var weighted = (parseInt(d.value,10)||0) * ((parseInt(d.probability,10)||0)/100);
      var sla = STAGE_SLA[d.stage], stale = sla && (d.days_in_stage||0) > sla;
      return '<tr data-deal-id="' + d.id + '">' +
        '<td>' + escapeHtml(d.title) + '</td>' +
        '<td>' + escapeHtml(d.company || '') + '</td>' +
        '<td><span class="deal-card-tag">' + escapeHtml(stageLabel(d.stage)) + '</span></td>' +
        '<td style="font-weight:700">$' + (parseInt(d.value,10)||0).toLocaleString() + '</td>' +
        '<td>' + (parseInt(d.probability,10)||0) + '%</td>' +
        '<td>$' + Math.round(weighted).toLocaleString() + '</td>' +
        '<td' + (stale ? ' style="color:#e17055;font-weight:600"' : '') + '>' + (d.days_in_stage||0) + 'd' + (stale ? ' ⚠' : '') + '</td>' +
        '<td>' + escapeHtml(d.next_action || '') + (d.next_followup_date ? ' <span style="color:#FF671F">(' + d.next_followup_date + ')</span>' : '') + '</td>' +
      '</tr>';
    }).join('');
    c.style.flexDirection = 'column';
    c.innerHTML = '<table class="pipe-list-table">' +
      '<thead><tr>' +
        '<th>' + (isEs ? 'Deal' : 'Deal') + '</th>' +
        '<th>' + (isEs ? 'Empresa' : 'Company') + '</th>' +
        '<th>' + (isEs ? 'Etapa' : 'Stage') + '</th>' +
        '<th>' + (isEs ? 'Valor' : 'Value') + '</th>' +
        '<th>' + (isEs ? 'Prob.' : 'Prob.') + '</th>' +
        '<th>' + (isEs ? 'Ponderado' : 'Weighted') + '</th>' +
        '<th>' + (isEs ? 'Antigüedad' : 'Stage Age') + '</th>' +
        '<th>' + (isEs ? 'Próxima Acción' : 'Next Action') + '</th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="8" style="padding:20px;text-align:center;color:#5a5e70">No deals match your filters.</td></tr>') + '</tbody></table>';

    var trs = c.querySelectorAll('tr[data-deal-id]');
    for (var i = 0; i < trs.length; i++) {
      trs[i].addEventListener('click', function(){ openDrawer(this.getAttribute('data-deal-id')); });
    }
  }

  /* ── Drag & Drop ────────────────────────────────────────────────── */

  function wireCard(card) {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    card.addEventListener("click", handleCardClick);
  }

  function initDragDrop() {
    var cards = document.querySelectorAll(".deal-card[data-deal-id]");
    var columns = document.querySelectorAll(".column-cards");
    for (var i = 0; i < cards.length; i++) wireCard(cards[i]);
    for (var j = 0; j < columns.length; j++) {
      columns[j].addEventListener("dragover", handleDragOver);
      columns[j].addEventListener("dragenter", handleDragEnter);
      columns[j].addEventListener("dragleave", handleDragLeave);
      columns[j].addEventListener("drop", handleDrop);
    }
  }

  function handleCardClick(e) {
    if (draggedCard) return;
    if (e.target && e.target.closest && e.target.closest('.pipe-quick-action')) return;
    var dealId = this.getAttribute("data-deal-id");
    if (dealId) openDrawer(dealId);
  }

  function handleDragStart(e) {
    draggedCard = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.getAttribute("data-deal-id"));
  }

  function handleDragEnd() {
    this.classList.remove("dragging");
    var cols = document.querySelectorAll(".column-cards");
    for (var i = 0; i < cols.length; i++) cols[i].classList.remove("drag-over");
    draggedCard = null;
  }

  function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function handleDragEnter(e) { e.preventDefault(); this.classList.add("drag-over"); }
  function handleDragLeave() { this.classList.remove("drag-over"); }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    if (!draggedCard) return;

    var newStageName = this.getAttribute("data-stage");
    var dealId = parseInt(draggedCard.getAttribute("data-deal-id"), 10);
    var newStageId = stageIdByName(newStageName);
    var newProb = stageProbByName(newStageName);

    this.appendChild(draggedCard);

    for (var i = 0; i < dealsData.length; i++) {
      if (dealsData[i].id === dealId) {
        dealsData[i].stage = newStageName;
        dealsData[i].stage_id = newStageId;
        dealsData[i].probability = newProb;
        dealsData[i].days_in_stage = 0;
        break;
      }
    }

    var col = this.closest('.pipeline-column');
    var nameEl = col ? col.querySelector('.column-name') : null;
    var originalText = nameEl ? nameEl.textContent : '';
    if (nameEl) nameEl.textContent = 'Saving…';

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/?r=deals&id=' + dealId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (nameEl) nameEl.textContent = originalText;
      renderKpiBar();
    };
    xhr.send(JSON.stringify({ stage_id: newStageId, probability: newProb }));
  }

  /* ── Helpers ────────────────────────────────────────────────────── */

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function(m){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[m];
    });
  }

})();

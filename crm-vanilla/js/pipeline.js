/* Pipeline Page Logic - Kanban with Drag & Drop */
(function () {
  "use strict";

  var draggedCard = null;
  var L;
  var stagesData = [];   /* [{id, name, sort_order}] loaded from API */
  var dealsData = [];    /* [{id, title, company, value, stage, stage_id, ...}] */

  var STAGE_TX = {
    "New Lead": { es: "Nuevo Lead", en: "New Lead" },
    "Contacted": { es: "Contactado", en: "Contacted" },
    "Qualified": { es: "Calificado", en: "Qualified" },
    "Proposal Sent": { es: "Propuesta Enviada", en: "Proposal Sent" },
    "Negotiation": { es: "Negociación", en: "Negotiation" },
    "Closed Won": { es: "Ganado", en: "Closed Won" },
    "Closed Lost": { es: "Perdido", en: "Closed Lost" }
  };

  function stageLabel(stage) {
    var lang = (window.CRM_APP && CRM_APP.getLang) ? CRM_APP.getLang() : 'en';
    return (STAGE_TX[stage] && STAGE_TX[stage][lang]) || stage;
  }

  function stageIdByName(name) {
    for (var i = 0; i < stagesData.length; i++) {
      if (stagesData[i].name === name) return stagesData[i].id;
    }
    return null;
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

  function closeModal() {
    document.getElementById('dealModal').style.display = 'none';
  }

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
          appendCardToColumn(newDeal);
          updateColumnCounts();
        }
        closeModal();
      } else {
        alert('Error saving deal. Please try again.');
      }
    };
    xhr.send(body);
  }

  function appendCardToColumn(deal) {
    var stageName = deal.stage || '';
    var columns = document.querySelectorAll('.column-cards');
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].getAttribute('data-stage') === stageName) {
        var tmp = document.createElement('div');
        tmp.innerHTML = renderDealCard(deal);
        var card = tmp.firstChild;
        wireCard(card);
        columns[i].appendChild(card);
        return;
      }
    }
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

    /* close drawer when clicking outside (on the board) */
    document.addEventListener('click', function (e) {
      var drawer = document.getElementById('dealDrawer');
      if (!drawer || drawer.style.right === '-440px') return;
      if (!drawer.contains(e.target) && !e.target.closest('.deal-card')) {
        closeDrawer();
      }
    });
  }

  function openDrawer(dealId) {
    var drawer = document.getElementById('dealDrawer');
    if (!drawer) return;

    /* populate stage select */
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
          var card = document.querySelector('.deal-card[data-deal-id="' + dealId + '"]');
          if (card) {
            var tmp = document.createElement('div');
            tmp.innerHTML = renderDealCard(updated);
            var newCard = tmp.firstChild;
            wireCard(newCard);
            card.parentNode.replaceChild(newCard, card);
          }
          document.getElementById('drawerDealTitle').textContent = updated.title;
          updateColumnCounts();
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
        var card = document.querySelector('.deal-card[data-deal-id="' + dealId + '"]');
        if (card) card.parentNode.removeChild(card);
        dealsData = dealsData.filter(function (d) { return String(d.id) !== String(dealId); });
        updateColumnCounts();
        closeDrawer();
      }
    };
    xhr.send();
  }

  /* ── Data loading ───────────────────────────────────────────────── */

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs
      ? { newDeal: "Nueva Oportunidad", daysInStage: "d en etapa" }
      : { newDeal: "New Deal", daysInStage: "d in stage" };

    CRM_APP.buildHeader(
      CRM_APP.t('nav.pipeline'),
      '<button class="btn btn-primary" id="newDealBtn">' + CRM_APP.ICONS.plus + ' ' + L.newDeal + '</button>'
    );

    document.addEventListener('click', function (e) {
      if (e.target && (e.target.id === 'newDealBtn' || e.target.closest && e.target.closest('#newDealBtn'))) {
        openModal();
      }
    });

    injectModal();
    injectDrawer();
    loadPipelineData();
  });

  function showSpinner() {
    var container = document.getElementById("pipelineBoard");
    if (!container) return;
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;">' +
      '<div style="border:4px solid #e0e0e0;border-top-color:#FF671F;border-radius:50%;width:40px;height:40px;animation:spin 0.8s linear infinite;"></div>' +
      '</div>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  }

  function loadPipelineData() {
    showSpinner();

    var xhrStages = new XMLHttpRequest();
    xhrStages.open('GET', '/api/?r=stages', true);
    xhrStages.onreadystatechange = function () {
      if (xhrStages.readyState !== 4) return;
      if (xhrStages.status >= 200 && xhrStages.status < 300) {
        try { stagesData = JSON.parse(xhrStages.responseText); } catch (err) { stagesData = []; }
        stagesData.sort(function (a, b) { return a.sort_order - b.sort_order; });
        loadDeals();
      } else {
        var container = document.getElementById("pipelineBoard");
        if (container) container.innerHTML = '<p style="color:red;padding:1rem;">Error loading stages.</p>';
      }
    };
    xhrStages.send();
  }

  function loadDeals() {
    var xhrDeals = new XMLHttpRequest();
    xhrDeals.open('GET', '/api/?r=deals', true);
    xhrDeals.onreadystatechange = function () {
      if (xhrDeals.readyState !== 4) return;
      if (xhrDeals.status >= 200 && xhrDeals.status < 300) {
        try { dealsData = JSON.parse(xhrDeals.responseText); } catch (err) { dealsData = []; }
        renderPipeline();
      } else {
        var container = document.getElementById("pipelineBoard");
        if (container) container.innerHTML = '<p style="color:red;padding:1rem;">Error loading deals.</p>';
      }
    };
    xhrDeals.send();
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  function renderPipeline() {
    var container = document.getElementById("pipelineBoard");
    if (!container) return;

    var html = "";

    for (var i = 0; i < stagesData.length; i++) {
      var stage = stagesData[i];
      var stageName = stage.name;
      var stageDeals = [];
      for (var d = 0; d < dealsData.length; d++) {
        if (dealsData[d].stage === stageName) stageDeals.push(dealsData[d]);
      }

      var totalValue = 0;
      for (var j = 0; j < stageDeals.length; j++) {
        totalValue += parseInt(stageDeals[j].value, 10) || 0;
      }

      html += '<div class="pipeline-column" data-stage="' + stageName + '">';
      html += '<div class="column-header">';
      html += '<div class="column-title">';
      html += '<span class="column-name">' + stageLabel(stageName) + '</span>';
      html += '<span class="column-count">' + stageDeals.length + '</span>';
      html += '</div>';
      html += '<div class="column-value">$' + (totalValue / 1000).toFixed(1) + 'k</div>';
      html += '</div>';

      html += '<div class="column-cards" data-stage="' + stageName + '">';
      for (var k = 0; k < stageDeals.length; k++) {
        html += renderDealCard(stageDeals[k]);
      }
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
    initDragDrop();
  }

  function renderDealCard(deal) {
    var prob = parseInt(deal.probability, 10) || 0;
    var probColor = prob >= 70 ? "#00b894" : prob >= 40 ? "#fdcb6e" : "#e17055";
    var valueFormatted = '$' + (parseInt(deal.value, 10) || 0).toLocaleString();
    var contactName = deal.contact_name || deal.contact || '';
    var days = deal.days_in_stage !== undefined ? deal.days_in_stage : (deal.daysInStage || 0);

    var sourceLabel = {
      cold_email_chile: 'Chile Email', cold_email_usa: 'USA Email',
      whatsapp: 'WhatsApp', referral: 'Referral',
      inbound_website: 'Website', inbound_call: 'Call',
      social_media: 'Social', event: 'Event', manual: 'Manual'
    };
    var src = deal.source ? (sourceLabel[deal.source] || deal.source) : '';

    var html = '<div class="deal-card" draggable="true" data-deal-id="' + deal.id + '" style="cursor:pointer">';
    if (src) {
      html += '<div class="deal-card-source">' + src + '</div>';
    }
    html += '<div class="deal-card-title">' + deal.title + '</div>';
    html += '<div class="deal-card-company">' + (deal.company || '') + '</div>';
    html += '<div class="deal-card-footer">';
    html += '<span class="deal-card-value">' + valueFormatted + '</span>';
    html += '<span class="deal-card-prob" style="color:' + probColor + '">' + prob + '%</span>';
    html += '</div>';
    html += '<div class="deal-card-contact">' + contactName + '</div>';
    if (deal.next_followup_date) {
      var actionText = deal.next_action ? ' — ' + deal.next_action : '';
      html += '<div class="deal-card-followup">📅 ' + deal.next_followup_date + actionText + '</div>';
    }
    html += '<div class="deal-card-days">' + days + L.daysInStage + '</div>';
    html += '</div>';
    return html;
  }

  /* ── Drag & Drop ────────────────────────────────────────────────── */

  function wireCard(card) {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    card.addEventListener("click", handleCardClick);
  }

  function initDragDrop() {
    var cards = document.querySelectorAll(".deal-card");
    var columns = document.querySelectorAll(".column-cards");

    for (var i = 0; i < cards.length; i++) {
      wireCard(cards[i]);
    }

    for (var j = 0; j < columns.length; j++) {
      columns[j].addEventListener("dragover", handleDragOver);
      columns[j].addEventListener("dragenter", handleDragEnter);
      columns[j].addEventListener("dragleave", handleDragLeave);
      columns[j].addEventListener("drop", handleDrop);
    }
  }

  function handleCardClick(e) {
    if (draggedCard) return;
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
    for (var i = 0; i < cols.length; i++) {
      cols[i].classList.remove("drag-over");
    }
    draggedCard = null;
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add("drag-over");
  }

  function handleDragLeave() {
    this.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    if (!draggedCard) return;

    var newStageName = this.getAttribute("data-stage");
    var dealId = parseInt(draggedCard.getAttribute("data-deal-id"), 10);
    var newStageId = stageIdByName(newStageName);

    this.appendChild(draggedCard);

    for (var i = 0; i < dealsData.length; i++) {
      if (dealsData[i].id === dealId) {
        dealsData[i].stage = newStageName;
        dealsData[i].stage_id = newStageId;
        dealsData[i].days_in_stage = 0;
        break;
      }
    }

    updateColumnCounts();

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
    };
    xhr.send(JSON.stringify({ stage_id: newStageId }));
  }

  /* ── Column count/value update ──────────────────────────────────── */

  function updateColumnCounts() {
    var columns = document.querySelectorAll(".pipeline-column");
    for (var i = 0; i < columns.length; i++) {
      var cards = columns[i].querySelectorAll(".deal-card");
      var count = cards.length;
      var totalValue = 0;

      for (var j = 0; j < cards.length; j++) {
        var dealId = parseInt(cards[j].getAttribute("data-deal-id"), 10);
        for (var k = 0; k < dealsData.length; k++) {
          if (dealsData[k].id === dealId) {
            totalValue += parseInt(dealsData[k].value, 10) || 0;
            break;
          }
        }
      }

      var countEl = columns[i].querySelector(".column-count");
      var valueEl = columns[i].querySelector(".column-value");
      if (countEl) countEl.textContent = count;
      if (valueEl) valueEl.textContent = "$" + (totalValue / 1000).toFixed(1) + "k";
    }
  }

})();

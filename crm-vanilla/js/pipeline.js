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

  /* ── Modal helpers ─────────────────────────────────────────────── */

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
      probability: parseInt(form.probability.value, 10) || 25
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
    /* Find column by stage name */
    var columns = document.querySelectorAll('.column-cards');
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].getAttribute('data-stage') === stageName) {
        var tmp = document.createElement('div');
        tmp.innerHTML = renderDealCard(deal);
        var card = tmp.firstChild;
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        columns[i].appendChild(card);
        return;
      }
    }
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

    /* Attach New Deal button after header is injected */
    document.addEventListener('click', function (e) {
      if (e.target && (e.target.id === 'newDealBtn' || e.target.closest && e.target.closest('#newDealBtn'))) {
        openModal();
      }
    });

    injectModal();
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
        /* Sort by sort_order */
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

    var html = '<div class="deal-card" draggable="true" data-deal-id="' + deal.id + '">';
    html += '<div class="deal-card-title">' + deal.title + '</div>';
    html += '<div class="deal-card-company">' + (deal.company || '') + '</div>';
    html += '<div class="deal-card-footer">';
    html += '<span class="deal-card-value">' + valueFormatted + '</span>';
    html += '<span class="deal-card-prob" style="color:' + probColor + '">' + prob + '%</span>';
    html += '</div>';
    html += '<div class="deal-card-contact">' + contactName + '</div>';
    html += '<div class="deal-card-days">' + days + L.daysInStage + '</div>';
    html += '</div>';
    return html;
  }

  /* ── Drag & Drop ────────────────────────────────────────────────── */

  function initDragDrop() {
    var cards = document.querySelectorAll(".deal-card");
    var columns = document.querySelectorAll(".column-cards");

    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("dragstart", handleDragStart);
      cards[i].addEventListener("dragend", handleDragEnd);
    }

    for (var j = 0; j < columns.length; j++) {
      columns[j].addEventListener("dragover", handleDragOver);
      columns[j].addEventListener("dragenter", handleDragEnter);
      columns[j].addEventListener("dragleave", handleDragLeave);
      columns[j].addEventListener("drop", handleDrop);
    }
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

    /* Move the card in DOM */
    this.appendChild(draggedCard);

    /* Update local dealsData */
    for (var i = 0; i < dealsData.length; i++) {
      if (dealsData[i].id === dealId) {
        dealsData[i].stage = newStageName;
        dealsData[i].stage_id = newStageId;
        dealsData[i].days_in_stage = 0;
        break;
      }
    }

    updateColumnCounts();

    /* Show "Saving…" on the column header */
    var col = this.closest('.pipeline-column');
    var nameEl = col ? col.querySelector('.column-name') : null;
    var originalText = nameEl ? nameEl.textContent : '';
    if (nameEl) nameEl.textContent = 'Saving…';

    /* Persist to API */
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

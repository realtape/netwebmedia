/* Pipeline Page Logic - Kanban with Drag & Drop */
(function () {
  "use strict";

  var draggedCard = null;

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Pipeline", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Deal</button>');
    renderPipeline();
  });

  function renderPipeline() {
    var container = document.getElementById("pipelineBoard");
    if (!container) return;

    var stages = CRM_DATA.pipelineStages;
    var html = "";

    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var stageDeals = CRM_DATA.deals.filter(function (d) { return d.stage === stage; });
      var totalValue = 0;
      for (var j = 0; j < stageDeals.length; j++) {
        totalValue += parseInt(stageDeals[j].value.replace(/[$,]/g, ""), 10);
      }

      html += '<div class="pipeline-column" data-stage="' + stage + '">';
      html += '<div class="column-header">';
      html += '<div class="column-title">';
      html += '<span class="column-name">' + stage + '</span>';
      html += '<span class="column-count">' + stageDeals.length + '</span>';
      html += '</div>';
      html += '<div class="column-value">$' + (totalValue / 1000).toFixed(1) + 'k</div>';
      html += '</div>';

      html += '<div class="column-cards" data-stage="' + stage + '">';
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
    var probColor = deal.probability >= 70 ? "#00b894" : deal.probability >= 40 ? "#fdcb6e" : "#e17055";
    var html = '<div class="deal-card" draggable="true" data-deal-id="' + deal.id + '">';
    html += '<div class="deal-card-title">' + deal.title + '</div>';
    html += '<div class="deal-card-company">' + deal.company + '</div>';
    html += '<div class="deal-card-footer">';
    html += '<span class="deal-card-value">' + deal.value + '</span>';
    html += '<span class="deal-card-prob" style="color:' + probColor + '">' + deal.probability + '%</span>';
    html += '</div>';
    html += '<div class="deal-card-contact">' + deal.contact + '</div>';
    html += '<div class="deal-card-days">' + deal.daysInStage + 'd in stage</div>';
    html += '</div>';
    return html;
  }

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

    if (draggedCard) {
      var newStage = this.getAttribute("data-stage");
      var dealId = parseInt(draggedCard.getAttribute("data-deal-id"), 10);

      /* Update data */
      for (var i = 0; i < CRM_DATA.deals.length; i++) {
        if (CRM_DATA.deals[i].id === dealId) {
          CRM_DATA.deals[i].stage = newStage;
          CRM_DATA.deals[i].daysInStage = 0;
          break;
        }
      }

      /* Move the card in DOM */
      this.appendChild(draggedCard);

      /* Update column counts */
      updateColumnCounts();
    }
  }

  function updateColumnCounts() {
    var columns = document.querySelectorAll(".pipeline-column");
    for (var i = 0; i < columns.length; i++) {
      var stage = columns[i].getAttribute("data-stage");
      var cards = columns[i].querySelectorAll(".deal-card");
      var count = cards.length;
      var totalValue = 0;

      for (var j = 0; j < cards.length; j++) {
        var dealId = parseInt(cards[j].getAttribute("data-deal-id"), 10);
        for (var k = 0; k < CRM_DATA.deals.length; k++) {
          if (CRM_DATA.deals[k].id === dealId) {
            totalValue += parseInt(CRM_DATA.deals[k].value.replace(/[$,]/g, ""), 10);
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

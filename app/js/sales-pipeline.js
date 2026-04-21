/* Sales Pipeline — weighted forecast + kanban + filters */
(function () {
  "use strict";

  var OWNERS = ["Alex Rivera", "Jordan Lee", "Sam Taylor", "Morgan Blake"];
  var filters = { owner: "", stage: "" };
  var draggedCard = null;

  // Enrich deals with owner + expectedClose (deterministic from id)
  function enrichedDeals() {
    return CRM_DATA.deals.map(function (d, i) {
      var closeDays = ((d.id * 13) % 45) + 3; // 3-47 days out
      return {
        id: d.id, title: d.title, company: d.company, value: d.value,
        contact: d.contact, stage: d.stage, probability: d.probability,
        daysInStage: d.daysInStage,
        owner: OWNERS[d.id % OWNERS.length],
        expectedClose: closeDays
      };
    });
  }

  function parseVal(v) { return parseInt(String(v).replace(/[$,]/g, ""), 10) || 0; }
  function fmt(n) { return "$" + (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString()); }

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Sales Pipeline",
      '<button class="btn btn-secondary btn-sm">' + CRM_APP.ICONS.filter + ' Export</button>' +
      '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Deal</button>'
    );

    buildFilterOptions();
    renderAll();

    document.getElementById("ownerFilter").addEventListener("change", function (e) {
      filters.owner = e.target.value; renderAll();
    });
    document.getElementById("stageFilter").addEventListener("change", function (e) {
      filters.stage = e.target.value; renderAll();
    });
  });

  function buildFilterOptions() {
    var oSel = document.getElementById("ownerFilter");
    for (var i = 0; i < OWNERS.length; i++) {
      var opt = document.createElement("option");
      opt.value = OWNERS[i]; opt.textContent = OWNERS[i];
      oSel.appendChild(opt);
    }
    var sSel = document.getElementById("stageFilter");
    for (var j = 0; j < CRM_DATA.pipelineStages.length; j++) {
      var s = CRM_DATA.pipelineStages[j];
      var o = document.createElement("option");
      o.value = s; o.textContent = s;
      sSel.appendChild(o);
    }
  }

  function filtered() {
    return enrichedDeals().filter(function (d) {
      if (filters.owner && d.owner !== filters.owner) return false;
      if (filters.stage && d.stage !== filters.stage) return false;
      return true;
    });
  }

  function renderAll() {
    renderSummary();
    renderForecast();
    renderBoard();
  }

  function renderSummary() {
    var deals = filtered();
    var total = 0, weighted = 0, won = 0, avgDays = 0, openCount = 0;
    for (var i = 0; i < deals.length; i++) {
      var v = parseVal(deals[i].value);
      if (deals[i].stage === "Closed Won") won += v;
      if (deals[i].stage !== "Closed Won" && deals[i].stage !== "Closed Lost") {
        total += v;
        weighted += v * (deals[i].probability / 100);
        avgDays += deals[i].daysInStage;
        openCount++;
      }
    }
    var avg = openCount > 0 ? Math.round(avgDays / openCount) : 0;

    var html = "";
    html += summaryCard("Open Pipeline", fmt(total), openCount + " deals", "");
    html += summaryCard("Weighted Forecast", fmt(Math.round(weighted)), "probability-adjusted", "green");
    html += summaryCard("Closed Won (period)", fmt(won), "", "green");
    html += summaryCard("Avg Days in Stage", avg + "d", "across open deals", avg > 10 ? "" : "green");
    document.getElementById("salesSummary").innerHTML = html;
  }

  function summaryCard(label, value, sub, color) {
    var html = '<div class="summary-card">';
    html += '<div class="card-label">' + label + '</div>';
    html += '<div class="card-value ' + (color || "") + '">' + value + '</div>';
    if (sub) html += '<div class="card-sub">' + sub + '</div>';
    html += '</div>';
    return html;
  }

  function renderForecast() {
    var deals = filtered();
    var byStage = {};
    for (var i = 0; i < CRM_DATA.pipelineStages.length; i++) {
      byStage[CRM_DATA.pipelineStages[i]] = { total: 0, weighted: 0, count: 0 };
    }
    var maxTotal = 1;
    for (var j = 0; j < deals.length; j++) {
      var d = deals[j]; var v = parseVal(d.value);
      if (!byStage[d.stage]) continue;
      byStage[d.stage].total += v;
      byStage[d.stage].weighted += v * (d.probability / 100);
      byStage[d.stage].count += 1;
      if (byStage[d.stage].total > maxTotal) maxTotal = byStage[d.stage].total;
    }

    var html = '<div class="forecast-bars">';
    for (var k = 0; k < CRM_DATA.pipelineStages.length; k++) {
      var st = CRM_DATA.pipelineStages[k];
      var row = byStage[st];
      var pctTotal = (row.total / maxTotal) * 100;
      var pctWeighted = (row.weighted / maxTotal) * 100;
      html += '<div class="fc-row">';
      html += '<div class="fc-label">' + st + ' <span class="fc-count">(' + row.count + ')</span></div>';
      html += '<div class="fc-bar-wrap">';
      html += '<div class="fc-bar-total" style="width:' + pctTotal.toFixed(1) + '%"></div>';
      html += '<div class="fc-bar-weighted" style="width:' + pctWeighted.toFixed(1) + '%"></div>';
      html += '</div>';
      html += '<div class="fc-values">';
      html += '<span class="fc-total">' + fmt(row.total) + '</span>';
      html += '<span class="fc-weighted">~ ' + fmt(Math.round(row.weighted)) + '</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="fc-legend"><span class="sw sw-total"></span> Pipeline value <span class="sw sw-weighted"></span> Weighted forecast</div>';
    document.getElementById("forecastBars").innerHTML = html;
  }

  function renderBoard() {
    var container = document.getElementById("salesPipelineBoard");
    var stages = CRM_DATA.pipelineStages;
    var deals = filtered();
    var html = "";
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var stageDeals = deals.filter(function (d) { return d.stage === stage; });
      var total = 0;
      for (var j = 0; j < stageDeals.length; j++) total += parseVal(stageDeals[j].value);

      html += '<div class="pipeline-column" data-stage="' + stage + '">';
      html += '<div class="column-header">';
      html += '<div class="column-title"><span class="column-name">' + stage + '</span><span class="column-count">' + stageDeals.length + '</span></div>';
      html += '<div class="column-value">' + fmt(total) + '</div>';
      html += '</div>';
      html += '<div class="column-cards" data-stage="' + stage + '">';
      for (var k = 0; k < stageDeals.length; k++) html += renderCard(stageDeals[k]);
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
    wireDrag();
  }

  function renderCard(d) {
    var color = d.probability >= 70 ? "#00b894" : d.probability >= 40 ? "#fdcb6e" : "#e17055";
    var weighted = Math.round(parseVal(d.value) * (d.probability / 100));
    var ownerInit = d.owner.split(" ").map(function (w) { return w.charAt(0); }).join("");
    var html = '<div class="deal-card" draggable="true" data-deal-id="' + d.id + '">';
    html += '<div class="deal-card-title">' + d.title + '</div>';
    html += '<div class="deal-card-company">' + d.company + '</div>';
    html += '<div class="deal-card-footer">';
    html += '<span class="deal-card-value">' + d.value + '</span>';
    html += '<span class="deal-card-prob" style="color:' + color + '">' + d.probability + '%</span>';
    html += '</div>';
    html += '<div class="deal-card-meta">';
    html += '<span class="deal-owner" title="' + d.owner + '">' + ownerInit + '</span>';
    html += '<span class="deal-weighted">~' + fmt(weighted) + '</span>';
    html += '<span class="deal-close">' + d.expectedClose + 'd</span>';
    html += '</div>';
    html += '<div class="deal-card-days">' + d.daysInStage + 'd in stage</div>';
    html += '</div>';
    return html;
  }

  function wireDrag() {
    var cards = document.querySelectorAll("#salesPipelineBoard .deal-card");
    var cols = document.querySelectorAll("#salesPipelineBoard .column-cards");
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("dragstart", dragStart);
      cards[i].addEventListener("dragend", dragEnd);
    }
    for (var j = 0; j < cols.length; j++) {
      cols[j].addEventListener("dragover", function (e) { e.preventDefault(); });
      cols[j].addEventListener("dragenter", function () { this.classList.add("drag-over"); });
      cols[j].addEventListener("dragleave", function () { this.classList.remove("drag-over"); });
      cols[j].addEventListener("drop", drop);
    }
  }
  function dragStart() { draggedCard = this; this.classList.add("dragging"); }
  function dragEnd() { this.classList.remove("dragging"); var cs = document.querySelectorAll(".column-cards"); for (var i = 0; i < cs.length; i++) cs[i].classList.remove("drag-over"); draggedCard = null; }
  function drop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    if (!draggedCard) return;
    var id = parseInt(draggedCard.getAttribute("data-deal-id"), 10);
    var newStage = this.getAttribute("data-stage");
    for (var i = 0; i < CRM_DATA.deals.length; i++) {
      if (CRM_DATA.deals[i].id === id) {
        CRM_DATA.deals[i].stage = newStage;
        CRM_DATA.deals[i].daysInStage = 0;
        break;
      }
    }
    renderAll();
  }
})();

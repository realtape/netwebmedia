/* Marketing Pipeline — lead funnel + source attribution + campaign contribution */
(function () {
  "use strict";

  var FUNNEL = CRM_DATA.marketingFunnel || [
    { stage: "Awareness",  label: "Site Visitors",   count: 48200, value: 0 },
    { stage: "Interest",   label: "Engaged Visitors", count: 12300, value: 0 },
    { stage: "Lead",       label: "Leads Captured",   count: 3840,  value: 38400 },
    { stage: "MQL",        label: "Marketing Qualified", count: 1620, value: 48600 },
    { stage: "SQL",        label: "Sales Qualified",  count: 640,  value: 96000 },
    { stage: "Opportunity",label: "Handoff → Sales",  count: 240,  value: 168000 },
    { stage: "Customer",   label: "Closed / Won",     count: 74,   value: 142500 }
  ];

  var SOURCES = CRM_DATA.marketingSources || [
    { source: "Paid Search",     leads: 982, mql: 421, sql: 168, customers: 22, spend: 28400 },
    { source: "Organic Search",  leads: 1240, mql: 498, sql: 184, customers: 19, spend: 0 },
    { source: "Paid Social",     leads: 684, mql: 244, sql: 92,  customers: 11, spend: 18200 },
    { source: "Email Nurture",   leads: 412, mql: 210, sql: 102, customers: 14, spend: 0 },
    { source: "Referral",        leads: 288, mql: 148, sql: 68,  customers: 6,  spend: 0 },
    { source: "Events / Webinar",leads: 234, mql: 99,  sql: 26,  customers: 2,  spend: 9800 }
  ];

  var MKT_CAMPAIGNS = CRM_DATA.marketingCampaigns || [
    { name: "Spring Promo Launch",   source: "Paid Search", leadsGen: 312, mqls: 124, sqls: 44, status: "active" },
    { name: "AEO Research Newsletter",source:"Email Nurture", leadsGen: 180, mqls: 108, sqls: 52, status: "active" },
    { name: "LinkedIn ABM Q2",        source: "Paid Social", leadsGen: 248, mqls: 92,  sqls: 31, status: "active" },
    { name: "Product Update Announce",source: "Email Nurture", leadsGen: 92, mqls: 46,  sqls: 18, status: "active" },
    { name: "AI Marketing Webinar",   source: "Events / Webinar", leadsGen: 134, mqls: 62, sqls: 22, status: "completed" },
    { name: "Organic AEO Hub",        source: "Organic Search", leadsGen: 640, mqls: 248, sqls: 94, status: "active" }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Marketing Pipeline",
      '<button class="btn btn-secondary btn-sm">' + CRM_APP.ICONS.filter + ' Filters</button>' +
      '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Campaign</button>'
    );
    renderSummary();
    renderFunnel();
    renderSources();
    renderConversion();
    renderCampaigns();
  });

  function parseVal(v) { return typeof v === "number" ? v : parseInt(String(v).replace(/[$,]/g, ""), 10) || 0; }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString(); }
  function fmtMoney(n) { return "$" + fmt(n); }

  function renderSummary() {
    var lead = pick("Lead").count, mql = pick("MQL").count, sql = pick("SQL").count, cust = pick("Customer").count;
    var overallConv = lead > 0 ? ((cust / lead) * 100).toFixed(1) + "%" : "0%";
    var mqlRate = lead > 0 ? ((mql / lead) * 100).toFixed(1) + "%" : "0%";
    var sqlRate = mql > 0 ? ((sql / mql) * 100).toFixed(1) + "%" : "0%";

    var spend = 0, custs = 0;
    for (var i = 0; i < SOURCES.length; i++) { spend += SOURCES[i].spend; custs += SOURCES[i].customers; }
    var cac = custs > 0 ? "$" + Math.round(spend / custs).toLocaleString() : "—";

    var html = "";
    html += summaryCard("Leads (30d)", fmt(lead), "captured", "");
    html += summaryCard("MQL Rate", mqlRate, "lead → MQL", "green");
    html += summaryCard("SQL Rate", sqlRate, "MQL → SQL", "");
    html += summaryCard("Blended CAC", cac, "across paid + earned", "");
    document.getElementById("mktSummary").innerHTML = html;

    var el = document.getElementById("mktOverallConv");
    if (el) el.textContent = "Lead → Customer " + overallConv;
  }

  function pick(stage) {
    for (var i = 0; i < FUNNEL.length; i++) if (FUNNEL[i].stage === stage) return FUNNEL[i];
    return { count: 0, value: 0 };
  }

  function summaryCard(label, value, sub, color) {
    var html = '<div class="summary-card">';
    html += '<div class="card-label">' + label + '</div>';
    html += '<div class="card-value ' + (color || "") + '">' + value + '</div>';
    if (sub) html += '<div class="card-sub">' + sub + '</div>';
    html += '</div>';
    return html;
  }

  function renderFunnel() {
    var maxCount = FUNNEL[0].count;
    var html = '<div class="mkt-funnel">';
    for (var i = 0; i < FUNNEL.length; i++) {
      var f = FUNNEL[i];
      var width = Math.max(18, (f.count / maxCount) * 100);
      var dropOff = i > 0 ? ((f.count / FUNNEL[i - 1].count) * 100).toFixed(1) + "%" : "100%";
      html += '<div class="funnel-step">';
      html += '<div class="funnel-bar" style="width:' + width + '%"></div>';
      html += '<div class="funnel-meta">';
      html += '<div class="funnel-stage">' + f.stage + '</div>';
      html += '<div class="funnel-label">' + f.label + '</div>';
      html += '</div>';
      html += '<div class="funnel-numbers">';
      html += '<div class="funnel-count">' + f.count.toLocaleString() + '</div>';
      html += '<div class="funnel-conv">' + dropOff + (i > 0 ? ' of prior' : '') + '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    document.getElementById("mktFunnel").innerHTML = html;
  }

  function renderSources() {
    var maxLeads = 0;
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].leads > maxLeads) maxLeads = SOURCES[i].leads;
    var html = '<div class="mkt-sources">';
    for (var j = 0; j < SOURCES.length; j++) {
      var s = SOURCES[j];
      var mqlRate = s.leads > 0 ? ((s.mql / s.leads) * 100).toFixed(1) + "%" : "—";
      var cac = s.customers > 0 && s.spend > 0 ? "$" + Math.round(s.spend / s.customers).toLocaleString() : (s.spend === 0 ? "organic" : "—");
      var w = Math.max(4, (s.leads / maxLeads) * 100);
      html += '<div class="src-row">';
      html += '<div class="src-name">' + s.source + '</div>';
      html += '<div class="src-bar-wrap"><div class="src-bar" style="width:' + w + '%"></div></div>';
      html += '<div class="src-stats">';
      html += '<span class="src-leads">' + s.leads.toLocaleString() + ' leads</span>';
      html += '<span class="src-mql">' + mqlRate + ' MQL</span>';
      html += '<span class="src-customers">' + s.customers + ' cust</span>';
      html += '<span class="src-cac">' + cac + '</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    document.getElementById("mktSources").innerHTML = html;
  }

  function renderConversion() {
    var html = '<div class="conv-grid">';
    for (var i = 1; i < FUNNEL.length; i++) {
      var prev = FUNNEL[i - 1], cur = FUNNEL[i];
      var rate = prev.count > 0 ? ((cur.count / prev.count) * 100) : 0;
      var benchmark = benchmarkFor(prev.stage, cur.stage);
      var delta = rate - benchmark;
      var deltaStr = (delta >= 0 ? "+" : "") + delta.toFixed(1) + " pp";
      var cls = delta >= 0 ? "up" : "down";
      html += '<div class="conv-card">';
      html += '<div class="conv-pair">' + prev.stage + ' → ' + cur.stage + '</div>';
      html += '<div class="conv-rate">' + rate.toFixed(1) + '%</div>';
      html += '<div class="conv-bench">Benchmark ' + benchmark.toFixed(1) + '% <span class="conv-delta ' + cls + '">' + deltaStr + '</span></div>';
      html += '</div>';
    }
    html += '</div>';
    document.getElementById("mktConversion").innerHTML = html;
  }

  function benchmarkFor(from, to) {
    var key = from + ">" + to;
    var table = {
      "Awareness>Interest": 25,
      "Interest>Lead": 30,
      "Lead>MQL": 40,
      "MQL>SQL": 38,
      "SQL>Opportunity": 42,
      "Opportunity>Customer": 28
    };
    return table[key] || 25;
  }

  function renderCampaigns() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Campaign</th><th>Source</th><th>Status</th><th>Leads</th><th>MQLs</th><th>SQLs</th><th>Lead→SQL</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < MKT_CAMPAIGNS.length; i++) {
      var c = MKT_CAMPAIGNS[i];
      var conv = c.leadsGen > 0 ? ((c.sqls / c.leadsGen) * 100).toFixed(1) + "%" : "—";
      html += '<tr>';
      html += '<td><strong>' + c.name + '</strong></td>';
      html += '<td>' + c.source + '</td>';
      html += '<td>' + CRM_APP.statusBadge(c.status) + '</td>';
      html += '<td>' + c.leadsGen.toLocaleString() + '</td>';
      html += '<td>' + c.mqls.toLocaleString() + '</td>';
      html += '<td>' + c.sqls.toLocaleString() + '</td>';
      html += '<td>' + conv + '</td>';
      html += '<td><button class="action-link">View</button> <button class="action-link">Clone</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById("mktCampaignTable").innerHTML = html;
  }
})();

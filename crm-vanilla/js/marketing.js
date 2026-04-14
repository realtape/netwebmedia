/* Marketing Page Logic */
(function () {
  "use strict";

  var EMAIL_CAMPAIGNS = [
    { name: "Spring Promo Launch", status: "active", sent: 4250, opens: 1870, clicks: 425, date: "Apr 8, 2026" },
    { name: "Newsletter - April", status: "completed", sent: 3800, opens: 1520, clicks: 342, date: "Apr 1, 2026" },
    { name: "Product Update Announce", status: "active", sent: 2100, opens: 987, clicks: 198, date: "Apr 10, 2026" },
    { name: "Customer Win-Back", status: "draft", sent: 0, opens: 0, clicks: 0, date: "Apr 12, 2026" },
    { name: "Webinar Invitation", status: "completed", sent: 5600, opens: 2688, clicks: 784, date: "Mar 25, 2026" },
    { name: "Case Study Blast", status: "draft", sent: 0, opens: 0, clicks: 0, date: "Apr 14, 2026" }
  ];

  var SMS_CAMPAIGNS = [
    { name: "Flash Sale Alert", status: "completed", sent: 1200, replies: 89, optOuts: 3, date: "Apr 5, 2026" },
    { name: "Appointment Reminders", status: "active", sent: 340, replies: 156, optOuts: 0, date: "Apr 12, 2026" },
    { name: "Review Request", status: "active", sent: 780, replies: 234, optOuts: 2, date: "Apr 9, 2026" }
  ];

  var TABS = ["Email Campaigns", "SMS Campaigns", "Templates"];
  var activeTab = 0;

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Marketing", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Campaign</button>');
    renderTabs();
    renderContent();
  });

  function renderTabs() {
    var bar = document.getElementById("tabBar");
    if (!bar) return;
    var html = "";
    for (var i = 0; i < TABS.length; i++) {
      html += '<button class="tab-btn' + (i === activeTab ? " active" : "") + '" data-tab="' + i + '">' + TABS[i] + '</button>';
    }
    bar.innerHTML = html;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activeTab = parseInt(btn.getAttribute("data-tab"), 10);
      renderTabs();
      renderContent();
    });
  }

  function renderContent() {
    var body = document.getElementById("marketingBody");
    if (!body) return;

    var totalSent = 0, totalOpens = 0, totalClicks = 0, activeCampaigns = 0;
    for (var i = 0; i < EMAIL_CAMPAIGNS.length; i++) {
      var c = EMAIL_CAMPAIGNS[i];
      totalSent += c.sent;
      totalOpens += c.opens;
      totalClicks += c.clicks;
      if (c.status === "active") activeCampaigns++;
    }
    var avgOpen = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) + "%" : "0%";
    var avgClick = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) + "%" : "0%";

    var html = '<div class="summary-cards">';
    html += summaryCard("Total Sent", totalSent.toLocaleString(), "");
    html += summaryCard("Avg Open Rate", avgOpen, "green");
    html += summaryCard("Avg Click Rate", avgClick, "");
    html += summaryCard("Active Campaigns", activeCampaigns.toString(), "");
    html += '</div>';

    if (activeTab === 0) {
      html += renderEmailTable();
    } else if (activeTab === 1) {
      html += renderSmsTable();
    } else {
      html += renderTemplates();
    }

    body.innerHTML = html;
  }

  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + colorClass + '">' + value + '</div></div>';
  }

  function renderEmailTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Campaign</th><th>Status</th><th>Sent</th><th>Opens</th><th>Clicks</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < EMAIL_CAMPAIGNS.length; i++) {
      var c = EMAIL_CAMPAIGNS[i];
      var openRate = c.sent > 0 ? ((c.opens / c.sent) * 100).toFixed(1) + "%" : "-";
      var clickRate = c.sent > 0 ? ((c.clicks / c.sent) * 100).toFixed(1) + "%" : "-";
      html += '<tr>';
      html += '<td><strong>' + c.name + '</strong></td>';
      html += '<td>' + CRM_APP.statusBadge(c.status) + '</td>';
      html += '<td>' + (c.sent > 0 ? c.sent.toLocaleString() : "-") + '</td>';
      html += '<td>' + (c.sent > 0 ? c.opens.toLocaleString() + ' <span style="color:var(--text-dim);font-size:11px">(' + openRate + ')</span>' : "-") + '</td>';
      html += '<td>' + (c.sent > 0 ? c.clicks.toLocaleString() + ' <span style="color:var(--text-dim);font-size:11px">(' + clickRate + ')</span>' : "-") + '</td>';
      html += '<td>' + c.date + '</td>';
      html += '<td><button class="action-link">Edit</button> <button class="action-link">Clone</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderSmsTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Campaign</th><th>Status</th><th>Sent</th><th>Replies</th><th>Opt-Outs</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < SMS_CAMPAIGNS.length; i++) {
      var c = SMS_CAMPAIGNS[i];
      html += '<tr>';
      html += '<td><strong>' + c.name + '</strong></td>';
      html += '<td>' + CRM_APP.statusBadge(c.status) + '</td>';
      html += '<td>' + c.sent.toLocaleString() + '</td>';
      html += '<td>' + c.replies + '</td>';
      html += '<td>' + c.optOuts + '</td>';
      html += '<td>' + c.date + '</td>';
      html += '<td><button class="action-link">Edit</button> <button class="action-link">Clone</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderTemplates() {
    var templates = [
      { name: "Welcome Email", type: "Email", category: "Onboarding", lastModified: "Apr 10, 2026" },
      { name: "Monthly Newsletter", type: "Email", category: "Newsletter", lastModified: "Apr 1, 2026" },
      { name: "Promo Blast", type: "Email", category: "Promotion", lastModified: "Mar 28, 2026" },
      { name: "Appointment Reminder", type: "SMS", category: "Reminder", lastModified: "Mar 20, 2026" },
      { name: "Review Request", type: "SMS", category: "Follow-up", lastModified: "Mar 15, 2026" },
      { name: "Abandoned Cart", type: "Email", category: "Recovery", lastModified: "Mar 10, 2026" }
    ];
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Template Name</th><th>Type</th><th>Category</th><th>Last Modified</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i];
      html += '<tr>';
      html += '<td><strong>' + t.name + '</strong></td>';
      html += '<td>' + t.type + '</td>';
      html += '<td>' + t.category + '</td>';
      html += '<td>' + t.lastModified + '</td>';
      html += '<td><button class="action-link">Edit</button> <button class="action-link">Use</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

})();

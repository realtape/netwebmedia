/* Dashboard Page Logic */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Dashboard", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Deal</button>');
    renderStats();
    renderRevenueChart();
    renderSchedule();
    renderActiveDeals();
    renderRecentContacts();
  });

  function renderStats() {
    var container = document.getElementById("statsGrid");
    if (!container) return;

    var s = CRM_DATA.stats;
    var cards = [
      { label: "Total Contacts", value: s.totalContacts.toLocaleString(), change: "+12%", icon: "contacts", positive: true },
      { label: "New Leads", value: s.newLeads, change: "+8%", icon: "contacts", positive: true },
      { label: "Active Deals", value: s.activeDeals, change: "+3", icon: "pipeline", positive: true },
      { label: "Revenue", value: "$142.5k", change: "+24%", icon: "dashboard", positive: true },
      { label: "Conversion", value: s.conversion + "%", change: "+5%", icon: "pipeline", positive: true },
      { label: "Avg Deal", value: "$11.4k", change: "-2%", icon: "dashboard", positive: false }
    ];

    var html = "";
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="stat-card">';
      html += '<div class="stat-header">';
      html += '<span class="stat-label">' + c.label + '</span>';
      html += '<span class="stat-icon">' + CRM_APP.ICONS[c.icon] + '</span>';
      html += '</div>';
      html += '<div class="stat-value">' + c.value + '</div>';
      html += '<div class="stat-change ' + (c.positive ? "positive" : "negative") + '">' + c.change + ' vs last month</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderRevenueChart() {
    var container = document.getElementById("revenueChart");
    if (!container) return;

    var data = CRM_DATA.revenueData;
    var maxVal = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].value > maxVal) maxVal = data[i].value;
    }

    var html = '<div class="chart-bars">';
    for (var j = 0; j < data.length; j++) {
      var pct = (data[j].value / maxVal) * 100;
      var isLast = j === data.length - 1;
      html += '<div class="chart-bar-group">';
      html += '<div class="chart-bar-wrapper">';
      html += '<div class="chart-bar' + (isLast ? " accent" : "") + '" style="height:' + pct + '%"></div>';
      html += '</div>';
      html += '<div class="chart-label">' + data[j].month + '</div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderSchedule() {
    var container = document.getElementById("todaySchedule");
    if (!container) return;

    var items = CRM_DATA.scheduleToday;
    var html = "";
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html += '<div class="schedule-item">';
      html += '<div class="schedule-time">' + item.time + '</div>';
      html += '<div class="schedule-content">';
      html += '<div class="schedule-title">' + item.title + '</div>';
      html += '<span class="schedule-type type-' + item.type + '">' + item.type + '</span>';
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderActiveDeals() {
    var container = document.getElementById("activeDeals");
    if (!container) return;

    var deals = CRM_DATA.deals.filter(function (d) {
      return d.stage !== "Closed Won" && d.stage !== "Closed Lost";
    }).slice(0, 5);

    var html = "";
    for (var i = 0; i < deals.length; i++) {
      var d = deals[i];
      html += '<div class="deal-row">';
      html += '<div class="deal-info">';
      html += '<div class="deal-title">' + d.title + '</div>';
      html += '<div class="deal-company">' + d.company + '</div>';
      html += '</div>';
      html += '<div class="deal-meta">';
      html += '<div class="deal-value">' + d.value + '</div>';
      html += '<span class="deal-stage">' + d.stage + '</span>';
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderRecentContacts() {
    var container = document.getElementById("recentContacts");
    if (!container) return;

    var contacts = CRM_DATA.contacts.slice(0, 5);
    var html = "";
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      html += '<div class="contact-row">';
      html += '<div class="contact-avatar">' + c.avatar + '</div>';
      html += '<div class="contact-info">';
      html += '<div class="contact-name">' + c.name + '</div>';
      html += '<div class="contact-company">' + c.company + '</div>';
      html += '</div>';
      html += CRM_APP.statusBadge(c.status);
      html += '</div>';
    }
    container.innerHTML = html;
  }

})();

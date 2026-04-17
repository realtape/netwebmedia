/* Payments Page Logic */
(function () {
  "use strict";

  var INVOICES = [
    { id: "INV-001", client: "Sarah Chen", company: "TechCorp", amount: 24500, status: "paid", date: "Apr 10, 2026" },
    { id: "INV-002", client: "Marcus Johnson", company: "Innovate Co", amount: 18000, status: "pending", date: "Apr 8, 2026" },
    { id: "INV-003", client: "Elena Rodriguez", company: "StartupXYZ", amount: 12000, status: "overdue", date: "Mar 15, 2026" },
    { id: "INV-004", client: "David Kim", company: "GlobalFin", amount: 45000, status: "paid", date: "Apr 5, 2026" },
    { id: "INV-005", client: "Rachel Foster", company: "DesignHub", amount: 8500, status: "pending", date: "Apr 12, 2026" },
    { id: "INV-006", client: "Aisha Patel", company: "Nexus Group", amount: 31200, status: "paid", date: "Apr 1, 2026" },
    { id: "INV-007", client: "Nina Volkov", company: "EuroTech GmbH", amount: 52000, status: "overdue", date: "Mar 20, 2026" },
    { id: "INV-008", client: "Carlos Mendez", company: "LATAM Retail", amount: 28750, status: "paid", date: "Apr 3, 2026" }
  ];

  var SUBSCRIPTIONS = [
    { client: "TechCorp", plan: "Enterprise", amount: 2450, interval: "Monthly", status: "active", nextBill: "May 1, 2026" },
    { client: "GlobalFin", plan: "Enterprise", amount: 3750, interval: "Monthly", status: "active", nextBill: "May 5, 2026" },
    { client: "Nexus Group", plan: "Pro", amount: 1200, interval: "Monthly", status: "active", nextBill: "May 1, 2026" },
    { client: "LATAM Retail", plan: "Pro", amount: 1200, interval: "Monthly", status: "active", nextBill: "May 3, 2026" },
    { client: "DesignHub", plan: "Starter", amount: 490, interval: "Monthly", status: "past_due", nextBill: "Apr 12, 2026" }
  ];

  var activeTab = 0;
  var L, TABS;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      createInvoice: "Crear Factura",
      totalRevenue: "Ingresos Totales", outstanding: "Pendiente", overdue: "Atrasado", thisMonth: "Este Mes",
      invoiceNum: "Factura #", client: "Cliente", amount: "Monto",
      status: "Estado", date: "Fecha", actions: "Acciones",
      plan: "Plan", interval: "Intervalo", nextBill: "Próximo Cobro",
      link: "Enlace", clicks: "Clics", conversions: "Conversiones",
      txnId: "ID Transacción", type: "Tipo", method: "Método",
      name: "Nombre",
      view: "Ver", send: "Enviar", copy: "Copiar", edit: "Editar",
      monthly: "Mensual"
    } : {
      createInvoice: "Create Invoice",
      totalRevenue: "Total Revenue", outstanding: "Outstanding", overdue: "Overdue", thisMonth: "This Month",
      invoiceNum: "Invoice #", client: "Client", amount: "Amount",
      status: "Status", date: "Date", actions: "Actions",
      plan: "Plan", interval: "Interval", nextBill: "Next Bill",
      link: "Link", clicks: "Clicks", conversions: "Conversions",
      txnId: "Transaction ID", type: "Type", method: "Method",
      name: "Name",
      view: "View", send: "Send", copy: "Copy", edit: "Edit",
      monthly: "Monthly"
    };
    TABS = isEs ? ["Facturas", "Suscripciones", "Enlaces de Pago", "Transacciones"] : ["Invoices", "Subscriptions", "Payment Links", "Transactions"];
    CRM_APP.buildHeader(CRM_APP.t('nav.payments'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.createInvoice + '</button>');
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
    var body = document.getElementById("paymentsBody");
    if (!body) return;

    var totalRevenue = 0, outstanding = 0, overdue = 0, thisMonth = 0;
    for (var i = 0; i < INVOICES.length; i++) {
      var inv = INVOICES[i];
      if (inv.status === "paid") { totalRevenue += inv.amount; thisMonth += inv.amount; }
      if (inv.status === "pending") outstanding += inv.amount;
      if (inv.status === "overdue") overdue += inv.amount;
    }

    var html = '<div class="summary-cards">';
    html += summaryCard(L.totalRevenue, "$" + (totalRevenue / 1000).toFixed(1) + "k", "");
    html += summaryCard(L.outstanding, "$" + (outstanding / 1000).toFixed(1) + "k", "orange");
    html += summaryCard(L.overdue, "$" + (overdue / 1000).toFixed(1) + "k", "red");
    html += summaryCard(L.thisMonth, "$" + (thisMonth / 1000).toFixed(1) + "k", "green");
    html += '</div>';

    if (activeTab === 0) html += renderInvoicesTable();
    else if (activeTab === 1) html += renderSubscriptionsTable();
    else if (activeTab === 2) html += renderPaymentLinks();
    else html += renderTransactions();

    body.innerHTML = html;
  }

  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + colorClass + '">' + value + '</div></div>';
  }

  function renderInvoicesTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.invoiceNum + '</th><th>' + L.client + '</th><th>' + L.amount + '</th><th>' + L.status + '</th><th>' + L.date + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < INVOICES.length; i++) {
      var inv = INVOICES[i];
      html += '<tr>';
      html += '<td><strong>' + inv.id + '</strong></td>';
      html += '<td>' + inv.client + '<br><span style="font-size:11px;color:var(--text-dim)">' + inv.company + '</span></td>';
      html += '<td>$' + inv.amount.toLocaleString() + '</td>';
      html += '<td>' + CRM_APP.statusBadge(inv.status) + '</td>';
      html += '<td>' + inv.date + '</td>';
      html += '<td><button class="action-link">' + L.view + '</button> <button class="action-link">' + L.send + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderSubscriptionsTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.client + '</th><th>' + L.plan + '</th><th>' + L.amount + '</th><th>' + L.interval + '</th><th>' + L.status + '</th><th>' + L.nextBill + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < SUBSCRIPTIONS.length; i++) {
      var sub = SUBSCRIPTIONS[i];
      var intervalTx = sub.interval === "Monthly" ? L.monthly : sub.interval;
      html += '<tr>';
      html += '<td>' + sub.client + '</td>';
      html += '<td>' + sub.plan + '</td>';
      html += '<td>$' + sub.amount.toLocaleString() + '</td>';
      html += '<td>' + intervalTx + '</td>';
      html += '<td>' + CRM_APP.statusBadge(sub.status === "past_due" ? "overdue" : sub.status) + '</td>';
      html += '<td>' + sub.nextBill + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderPaymentLinks() {
    var links = [
      { name: "Premium Onboarding", url: "pay.netweb.com/premium", amount: "$2,500", clicks: 45, conversions: 12 },
      { name: "Monthly Retainer", url: "pay.netweb.com/retainer", amount: "$1,200/mo", clicks: 128, conversions: 34 },
      { name: "One-Time Setup", url: "pay.netweb.com/setup", amount: "$500", clicks: 67, conversions: 21 }
    ];
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.name + '</th><th>' + L.link + '</th><th>' + L.amount + '</th><th>' + L.clicks + '</th><th>' + L.conversions + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      html += '<tr>';
      html += '<td><strong>' + l.name + '</strong></td>';
      html += '<td style="color:var(--accent)">' + l.url + '</td>';
      html += '<td>' + l.amount + '</td>';
      html += '<td>' + l.clicks + '</td>';
      html += '<td>' + l.conversions + '</td>';
      html += '<td><button class="action-link">' + L.copy + '</button> <button class="action-link">' + L.edit + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderTransactions() {
    var txns = [
      { id: "TXN-4821", client: "Sarah Chen", amount: "$24,500", type: "Invoice", method: "Credit Card", date: "Apr 10, 2026" },
      { id: "TXN-4820", client: "David Kim", amount: "$45,000", type: "Invoice", method: "Bank Transfer", date: "Apr 5, 2026" },
      { id: "TXN-4819", client: "Carlos Mendez", amount: "$28,750", type: "Invoice", method: "Credit Card", date: "Apr 3, 2026" },
      { id: "TXN-4818", client: "Aisha Patel", amount: "$31,200", type: "Invoice", method: "Credit Card", date: "Apr 1, 2026" },
      { id: "TXN-4817", client: "Nexus Group", amount: "$1,200", type: "Subscription", method: "Credit Card", date: "Apr 1, 2026" },
      { id: "TXN-4816", client: "TechCorp", amount: "$2,450", type: "Subscription", method: "Credit Card", date: "Apr 1, 2026" }
    ];
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.txnId + '</th><th>' + L.client + '</th><th>' + L.amount + '</th><th>' + L.type + '</th><th>' + L.method + '</th><th>' + L.date + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < txns.length; i++) {
      var t = txns[i];
      html += '<tr>';
      html += '<td><strong>' + t.id + '</strong></td>';
      html += '<td>' + t.client + '</td>';
      html += '<td>' + t.amount + '</td>';
      html += '<td>' + t.type + '</td>';
      html += '<td>' + t.method + '</td>';
      html += '<td>' + t.date + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

})();

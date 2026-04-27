/* Payments Page Logic */
(function () {
  "use strict";

  // API-backed data (populated on load)
  var INVOICES      = [];
  var SUBSCRIPTIONS = [];
  var SUMMARY       = { total_revenue: 0, outstanding: 0, overdue: 0, this_month: 0 };

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
      monthly: "Mensual", loading: "Cargando...", noData: "Sin datos"
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
      monthly: "Monthly", loading: "Loading...", noData: "No data yet"
    };
    TABS = isEs ? ["Facturas", "Suscripciones", "Enlaces de Pago", "Transacciones"] : ["Invoices", "Subscriptions", "Payment Links", "Transactions"];
    CRM_APP.buildHeader(CRM_APP.t('nav.payments'), '<button class="btn btn-primary" onclick="window.openNewInvoice && window.openNewInvoice()">' + CRM_APP.ICONS.plus + ' ' + L.createInvoice + '</button>');
    renderTabs();
    loadData();
  });

  function loadData() {
    var body = document.getElementById("paymentsBody");
    if (body) body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-dim)">' + (L ? L.loading : 'Loading...') + '</div>';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/?r=payments");
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var d = JSON.parse(xhr.responseText);
          if (d.summary)       SUMMARY       = d.summary;
          if (d.invoices)      INVOICES      = d.invoices;
          if (d.subscriptions) SUBSCRIPTIONS = d.subscriptions;
        } catch (e) { /* keep defaults */ }
      }
      renderContent();
    };
    xhr.onerror = function () { renderContent(); };
    xhr.send();
  }

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

  function fmt(val) {
    var n = parseFloat(val) || 0;
    return n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0);
  }

  function renderContent() {
    var body = document.getElementById("paymentsBody");
    if (!body) return;

    var html = '<div class="summary-cards">';
    html += summaryCard(L.totalRevenue, fmt(SUMMARY.total_revenue), "");
    html += summaryCard(L.outstanding,  fmt(SUMMARY.outstanding),   "orange");
    html += summaryCard(L.overdue,      fmt(SUMMARY.overdue),       "red");
    html += summaryCard(L.thisMonth,    fmt(SUMMARY.this_month),    "green");
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
    if (INVOICES.length === 0) {
      return '<div style="padding:32px;text-align:center;color:var(--text-dim)">' + L.noData + '</div>';
    }
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.invoiceNum + '</th><th>' + L.client + '</th><th>' + L.amount + '</th><th>' + L.status + '</th><th>' + L.date + '</th><th>' + L.actions + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < INVOICES.length; i++) {
      var inv = INVOICES[i];
      /* Support both API (snake_case) and legacy (camelCase) field names */
      var num     = inv.invoice_num || inv.id || '';
      var client  = inv.client_name || inv.client || inv.contact_name || '';
      var company = inv.company || '';
      var amount  = parseFloat(inv.amount) || 0;
      var date    = (inv.invoice_date || inv.date || '').replace(/T.*/, '');
      html += '<tr>';
      html += '<td><strong>' + num + '</strong></td>';
      html += '<td>' + client + (company ? '<br><span style="font-size:11px;color:var(--text-dim)">' + company + '</span>' : '') + '</td>';
      html += '<td>$' + amount.toLocaleString() + '</td>';
      html += '<td>' + CRM_APP.statusBadge(inv.status) + '</td>';
      html += '<td>' + date + '</td>';
      html += '<td><button class="action-link">' + L.view + '</button> <button class="action-link">' + L.send + '</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderSubscriptionsTable() {
    if (SUBSCRIPTIONS.length === 0) {
      return '<div style="padding:32px;text-align:center;color:var(--text-dim)">' + L.noData + '</div>';
    }
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>' + L.client + '</th><th>' + L.plan + '</th><th>' + L.amount + '</th><th>' + L.interval + '</th><th>' + L.status + '</th><th>' + L.nextBill + '</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < SUBSCRIPTIONS.length; i++) {
      var sub = SUBSCRIPTIONS[i];
      var clientName  = sub.client_name || sub.contact_name || sub.client || '';
      var interval    = sub.interval_type || sub.interval || 'monthly';
      var intervalTx  = (interval === 'monthly' || interval === 'Monthly') ? L.monthly : interval;
      var nextBill    = (sub.next_bill_date || sub.nextBill || '').replace(/T.*/, '');
      var subStatus   = sub.status === "past_due" ? "overdue" : sub.status;
      html += '<tr>';
      html += '<td>' + clientName + '</td>';
      html += '<td>' + sub.plan + '</td>';
      html += '<td>$' + (parseFloat(sub.amount) || 0).toLocaleString() + '</td>';
      html += '<td>' + intervalTx + '</td>';
      html += '<td>' + CRM_APP.statusBadge(subStatus) + '</td>';
      html += '<td>' + nextBill + '</td>';
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

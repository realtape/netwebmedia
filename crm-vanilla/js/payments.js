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
    injectInvoiceModal();
  });

  /* ── New Invoice Modal ──────────────────────────────────────────────── */
  function injectInvoiceModal() {
    if (document.getElementById('invoiceModal')) return;
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var T = isEs ? {
      title: 'Nueva Factura', client: 'Cliente', company: 'Empresa', amount: 'Monto ($)',
      due: 'Fecha de Vencimiento', notes: 'Notas', cancel: 'Cancelar', save: 'Guardar Factura',
      err: 'Error al guardar la factura. Inténtalo de nuevo.'
    } : {
      title: 'New Invoice', client: 'Client', company: 'Company', amount: 'Amount ($)',
      due: 'Due Date', notes: 'Notes', cancel: 'Cancel', save: 'Save Invoice',
      err: 'Error saving invoice. Please try again.'
    };
    var div = document.createElement('div');
    div.innerHTML = '<div id="invoiceModal" class="crm-modal" style="display:none">' +
      '<div class="crm-modal-backdrop"></div>' +
      '<div class="crm-modal-box">' +
        '<h3>' + T.title + '</h3>' +
        '<form id="invoiceForm">' +
          '<label>' + T.client + ' *<input name="client_name" required placeholder="Acme Corp"></label>' +
          '<label>' + T.company + '<input name="company" placeholder="Acme Inc."></label>' +
          '<label>' + T.amount + ' *<input name="amount" type="number" min="0" step="0.01" required placeholder="1500"></label>' +
          '<label>' + T.due + '<input name="due_date" type="date"></label>' +
          '<label>' + T.notes + '<textarea name="notes" rows="3" placeholder="—"></textarea></label>' +
          '<div class="modal-actions">' +
            '<button type="button" id="invoiceModalCancel" class="btn btn-secondary">' + T.cancel + '</button>' +
            '<button type="submit" class="btn btn-primary">' + T.save + '</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';
    document.body.appendChild(div.firstChild);
    document.getElementById('invoiceModalCancel').addEventListener('click', closeInvoiceModal);
    document.querySelector('#invoiceModal .crm-modal-backdrop').addEventListener('click', closeInvoiceModal);
    document.getElementById('invoiceForm').addEventListener('submit', handleInvoiceSubmit);
  }

  function closeInvoiceModal() {
    var m = document.getElementById('invoiceModal');
    if (m) m.style.display = 'none';
  }

  window.openNewInvoice = function () {
    injectInvoiceModal();
    var f = document.getElementById('invoiceForm');
    if (f) f.reset();
    document.getElementById('invoiceModal').style.display = '';
  };

  function handleInvoiceSubmit(e) {
    e.preventDefault();
    var form = document.getElementById('invoiceForm');
    var payload = {
      client_name: form.client_name.value.trim(),
      company:     form.company.value.trim(),
      amount:      parseFloat(form.amount.value) || 0,
      due_date:    form.due_date.value || null,
      notes:       form.notes.value.trim(),
      status:      'pending'
    };
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/?r=payments', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        closeInvoiceModal();
        loadData();
      } else {
        var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
        alert(isEs ? 'Error al guardar la factura. Inténtalo de nuevo.' : 'Error saving invoice. Please try again.');
      }
    };
    xhr.send(JSON.stringify(payload));
  }

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
    else if (activeTab === 2) { html += betaBannerHTML(); html += renderPaymentLinks(); }
    else { html += betaBannerHTML(); html += renderTransactions(); }

    body.innerHTML = html;
  }

  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + colorClass + '">' + value + '</div></div>';
  }

  function betaBannerHTML() {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var title = isEs
      ? 'Beta — En Desarrollo Activo'
      : 'Beta — In Active Development';
    var copy = isEs
      ? 'Esta pestaña está en desarrollo activo. Los datos mostrados son de ejemplo. La funcionalidad completa se lanza en Q3 2026.'
      : 'This tab is in active development. The data shown below is sample data. Full functionality ships in Q3 2026.';
    var cta = isEs ? 'Avísame cuando esté listo →' : 'Get notified when this ships →';
    return '<div class="nwm-beta-banner" role="status" style="background:linear-gradient(135deg,#010F3B,#0d1f5c);border:1px solid rgba(255,103,31,0.45);border-left:4px solid #FF671F;border-radius:12px;padding:14px 18px;margin:0 0 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:240px;">'
      + '<div style="color:#FF671F;font-weight:700;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">' + title + '</div>'
      + '<div style="color:#cdd3e3;font-size:13px;margin-top:4px;line-height:1.5;">' + copy + '</div>'
      + '</div>'
      + '<a href="/contact.html?topic=payments-beta" style="color:#FF671F;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;">' + cta + '</a>'
      + '</div>';
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
    var links = [];
    if (links.length === 0) {
      return '<div style="padding:32px;text-align:center;color:var(--text-dim)">' + L.noData + '</div>';
    }
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
    var txns = [];
    if (txns.length === 0) {
      return '<div style="padding:32px;text-align:center;color:var(--text-dim)">' + L.noData + '</div>';
    }
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

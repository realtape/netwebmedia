/* Contacts Page Logic */
(function () {
  "use strict";

  var currentFilter = "all";
  var searchTerm = "";
  var selectedContact = null;

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Contacts", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' Add Contact</button>');
    bindEvents();
    renderContacts();
  });

  function bindEvents() {
    var searchInput = document.getElementById("contactSearch");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchTerm = this.value.toLowerCase();
        renderContacts();
      });
    }

    var filterBtns = document.querySelectorAll(".filter-btn");
    for (var i = 0; i < filterBtns.length; i++) {
      filterBtns[i].addEventListener("click", function () {
        var active = document.querySelector(".filter-btn.active");
        if (active) active.classList.remove("active");
        this.classList.add("active");
        currentFilter = this.getAttribute("data-filter");
        renderContacts();
      });
    }
  }

  function getFilteredContacts() {
    return CRM_DATA.contacts.filter(function (c) {
      var matchFilter = currentFilter === "all" || c.status === currentFilter;
      var matchSearch = !searchTerm ||
        c.name.toLowerCase().indexOf(searchTerm) !== -1 ||
        c.company.toLowerCase().indexOf(searchTerm) !== -1 ||
        c.email.toLowerCase().indexOf(searchTerm) !== -1;
      return matchFilter && matchSearch;
    });
  }

  function renderContacts() {
    var tbody = document.getElementById("contactsTableBody");
    if (!tbody) return;

    var contacts = getFilteredContacts();
    var html = "";

    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      html += '<tr class="contact-table-row" data-id="' + c.id + '">';
      html += '<td><div class="td-flex"><div class="contact-avatar small">' + c.avatar + '</div><div><div class="td-name">' + c.name + '</div><div class="td-email">' + c.email + '</div></div></div></td>';
      html += '<td>' + c.company + '</td>';
      html += '<td>' + CRM_APP.statusBadge(c.status) + '</td>';
      html += '<td>' + c.value + '</td>';
      html += '<td>' + c.lastContact + '</td>';
      html += '</tr>';
    }

    if (contacts.length === 0) {
      html = '<tr><td colspan="5" class="empty-state">No contacts found</td></tr>';
    }

    tbody.innerHTML = html;

    /* Bind row click */
    var rows = tbody.querySelectorAll(".contact-table-row");
    for (var j = 0; j < rows.length; j++) {
      rows[j].addEventListener("click", function () {
        var id = parseInt(this.getAttribute("data-id"), 10);
        showContactDetail(id);
      });
    }
  }

  function showContactDetail(id) {
    var panel = document.getElementById("contactDetail");
    if (!panel) return;

    var contact = null;
    for (var i = 0; i < CRM_DATA.contacts.length; i++) {
      if (CRM_DATA.contacts[i].id === id) {
        contact = CRM_DATA.contacts[i];
        break;
      }
    }
    if (!contact) return;

    selectedContact = contact;
    panel.classList.add("open");

    var html = '<div class="detail-header">';
    html += '<button class="detail-close" id="detailClose">&times;</button>';
    html += '<div class="detail-avatar">' + contact.avatar + '</div>';
    html += '<h2 class="detail-name">' + contact.name + '</h2>';
    html += '<p class="detail-role">' + contact.role + ' at ' + contact.company + '</p>';
    html += CRM_APP.statusBadge(contact.status);
    html += '</div>';

    html += '<div class="detail-section">';
    html += '<h3>Contact Information</h3>';
    html += '<div class="detail-field"><span class="field-label">Email</span><span class="field-value">' + contact.email + '</span></div>';
    html += '<div class="detail-field"><span class="field-label">Phone</span><span class="field-value">' + contact.phone + '</span></div>';
    html += '<div class="detail-field"><span class="field-label">Company</span><span class="field-value">' + contact.company + '</span></div>';
    html += '<div class="detail-field"><span class="field-label">Deal Value</span><span class="field-value">' + contact.value + '</span></div>';
    html += '<div class="detail-field"><span class="field-label">Last Contact</span><span class="field-value">' + contact.lastContact + '</span></div>';
    html += '</div>';

    html += '<div class="detail-section">';
    html += '<h3>Notes</h3>';
    html += '<p class="detail-notes">' + contact.notes + '</p>';
    html += '</div>';

    html += '<div class="detail-actions">';
    html += '<button class="btn btn-primary btn-sm">' + CRM_APP.ICONS.email + ' Email</button>';
    html += '<button class="btn btn-secondary btn-sm">' + CRM_APP.ICONS.phone + ' Call</button>';
    html += '</div>';

    panel.innerHTML = html;

    document.getElementById("detailClose").addEventListener("click", function () {
      panel.classList.remove("open");
    });
  }

})();

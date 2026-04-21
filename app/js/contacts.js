/* Contacts Page — now fetches live from /api/resources/contact */
(function () {
  "use strict";

  var currentFilter = "all";
  var searchTerm = "";
  var contactsCache = [];  // normalized contacts from API
  var currentPage = 1;
  var pageSize = 50;

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Contacts", '<button class="btn btn-primary" id="addContactBtn">' + CRM_APP.ICONS.plus + ' Add Contact</button>');
    bindEvents();
    loadAndRender();
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

  function initials(name) {
    if (!name) return "?";
    return name.split(" ").map(function(w){ return (w[0] || '').toUpperCase(); }).join('').slice(0, 2);
  }

  function normalize(row) {
    var d = row.data || {};
    // notes may be a JSON string or an already-parsed object
    var notes = d.notes;
    if (typeof notes === 'string') {
      try { notes = JSON.parse(notes); } catch (_) { notes = null; }
    }
    // notes.page may be like "companies/santiago/klaudia-spa.html"
    var rawPage = (notes && notes.page) ? String(notes.page).trim() : '';
    var auditPage = '';
    if (rawPage && !/\/{2,}/.test(rawPage) && rawPage.indexOf('companies/') === 0 && /\.html?$/i.test(rawPage)) {
      auditPage = '/' + rawPage;
    }
    return {
      id:          row.id,
      name:        d.name || row.title || d.email || 'Unnamed',
      email:       d.email || '',
      phone:       d.phone || '',
      company:     d.company || '',
      city:        d.city || '',
      region:      d.region || '',
      niche:       d.niche || '',
      status:      row.status || 'lead',
      value:       d.value || 0,
      lastContact: row.updated_at ? row.updated_at.split(' ')[0] : '',
      avatar:      initials(d.name || row.title || d.email),
      website:     d.website || '',
      source:      d.source || '',
      auditPage:   auditPage,
      auditScore:  d.audit_score || (d.nwm_score || null),
    };
  }

  function loadAndRender() {
    var tbody = document.getElementById("contactsTableBody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading contacts…</td></tr>';
    if (!window.NWMApi) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state">API client not loaded.</td></tr>';
      return;
    }
    // Pull with a large limit; server caps at 500
    NWMApi.list('contact', { limit: 500 }).then(function (r) {
      contactsCache = (r.items || []).map(normalize);
      // Also mirror into CRM_DATA for legacy code (detail pane, counts)
      if (window.CRM_DATA) window.CRM_DATA.contacts = contactsCache;
      renderContacts();
    }).catch(function (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load: ' + (e.message || 'error') + '</td></tr>';
    });
  }

  function getFilteredContacts() {
    return contactsCache.filter(function (c) {
      var matchFilter = currentFilter === "all" || c.status === currentFilter;
      var matchSearch = !searchTerm ||
        (c.name    || '').toLowerCase().indexOf(searchTerm) !== -1 ||
        (c.company || '').toLowerCase().indexOf(searchTerm) !== -1 ||
        (c.email   || '').toLowerCase().indexOf(searchTerm) !== -1 ||
        (c.region  || '').toLowerCase().indexOf(searchTerm) !== -1 ||
        (c.city    || '').toLowerCase().indexOf(searchTerm) !== -1;
      return matchFilter && matchSearch;
    });
  }

  function statusBadge(s) {
    if (window.CRM_APP && CRM_APP.statusBadge) return CRM_APP.statusBadge(s);
    return '<span class="status-badge status-' + s + '">' + s + '</span>';
  }

  function renderContacts() {
    var tbody = document.getElementById("contactsTableBody");
    if (!tbody) return;
    var contacts = getFilteredContacts();
    var html = "";
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      var valueStr = c.value ? ('$' + Number(c.value).toLocaleString()) : '—';
      // Audit column — show score badge if audited, otherwise button
      var auditLink;
      var liveUrl = c.website ? ('/analytics.html?website=' + encodeURIComponent(c.website)) : '';
      if (c.auditScore != null && c.auditScore > 0) {
        var score = parseInt(c.auditScore, 10);
        var color = score >= 85 ? '#00b894' : score >= 65 ? '#fdcb6e' : score >= 40 ? '#e17055' : '#d63031';
        var badgeStyle = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:9999px;background:rgba(255,255,255,0.04);border:1px solid ' + color + '66;font-size:12px;font-weight:700;color:' + color + ';';
        var btnStyle = 'padding:3px 10px;border-radius:6px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;text-decoration:none;font-size:11px;font-weight:600;border:0;cursor:pointer;margin-left:6px;';
        auditLink = '<span style="' + badgeStyle + '">' + score + '/100</span>' +
          '<button class="audit-btn" data-audit="' + (c.auditPage || liveUrl) + '" data-fallback="' + liveUrl + '" style="' + btnStyle + '">View</button>';
      } else if (c.auditPage) {
        var btnStyle2 = 'display:inline-block;padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;font-size:12px;font-weight:600;border:0;cursor:pointer;';
        auditLink = '<button class="audit-btn" data-audit="' + c.auditPage + '" data-fallback="' + liveUrl + '" style="' + btnStyle2 + '">View audit</button>';
      } else if (liveUrl) {
        var btnStyle3 = 'display:inline-block;padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;text-decoration:none;font-size:12px;font-weight:600;border:0;';
        auditLink = '<a class="audit-btn" href="' + liveUrl + '" target="_blank" rel="noopener" style="' + btnStyle3 + '">Run audit</a>';
      } else {
        auditLink = '<span class="muted">—</span>';
      }
      html += '<tr class="contact-table-row" data-id="' + c.id + '">' +
        '<td><div class="td-flex"><div class="contact-avatar small">' + c.avatar + '</div>' +
            '<div><div class="td-name">' + c.name + '</div><div class="td-email">' + c.email + '</div></div></div></td>' +
        '<td>' + (c.company || '<span class="muted">—</span>') + '</td>' +
        '<td>' + (c.region  || '<span class="muted">—</span>') + '</td>' +
        '<td>' + statusBadge(c.status) + '</td>' +
        '<td>' + valueStr + '</td>' +
        '<td>' + (c.lastContact || '<span class="muted">—</span>') + '</td>' +
        '<td>' + auditLink + '</td>' +
        '</tr>';
    }
    // Pagination
    var total = contacts.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * pageSize;
    var pageContacts = contacts.slice(start, start + pageSize);
    html = '';
    for (var pi = 0; pi < pageContacts.length; pi++) {
      var cc = pageContacts[pi];
      var valueStr2 = cc.value ? ('$' + Number(cc.value).toLocaleString()) : '—';
      var liveUrl2 = cc.website ? ('/analytics.html?website=' + encodeURIComponent(cc.website)) : '';
      var auditLink2;
      if (cc.auditScore != null && cc.auditScore > 0) {
        var sc = parseInt(cc.auditScore, 10);
        var col = sc >= 85 ? '#00b894' : sc >= 65 ? '#fdcb6e' : sc >= 40 ? '#e17055' : '#d63031';
        auditLink2 = '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:9999px;background:rgba(255,255,255,0.04);border:1px solid ' + col + '66;font-size:12px;font-weight:700;color:' + col + ';">' + sc + '/100</span>' +
          '<button class="audit-btn" data-audit="' + (cc.auditPage || liveUrl2) + '" data-fallback="' + liveUrl2 + '" style="padding:3px 10px;border-radius:6px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;font-size:11px;font-weight:600;border:0;cursor:pointer;margin-left:6px;">View</button>';
      } else if (cc.auditPage) {
        auditLink2 = '<button class="audit-btn" data-audit="' + cc.auditPage + '" data-fallback="' + liveUrl2 + '" style="padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;font-size:12px;font-weight:600;border:0;cursor:pointer;">View audit</button>';
      } else if (liveUrl2) {
        auditLink2 = '<a class="audit-btn" href="' + liveUrl2 + '" target="_blank" rel="noopener" style="display:inline-block;padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);color:#fff;text-decoration:none;font-size:12px;font-weight:600;">Run audit</a>';
      } else {
        auditLink2 = '<span class="muted">—</span>';
      }
      html += '<tr class="contact-table-row" data-id="' + cc.id + '">' +
        '<td><div class="td-flex"><div class="contact-avatar small">' + cc.avatar + '</div>' +
        '<div><div class="td-name">' + cc.name + '</div><div class="td-email">' + cc.email + '</div></div></div></td>' +
        '<td>' + (cc.company || '<span class="muted">—</span>') + '</td>' +
        '<td>' + (cc.region || '<span class="muted">—</span>') + '</td>' +
        '<td>' + statusBadge(cc.status) + '</td>' +
        '<td>' + valueStr2 + '</td>' +
        '<td>' + (cc.lastContact || '<span class="muted">—</span>') + '</td>' +
        '<td>' + auditLink2 + '</td></tr>';
    }
    if (total === 0) html = '<tr><td colspan="7" class="empty-state">No contacts found</td></tr>';
    tbody.innerHTML = html;

    // Pagination footer
    var pager = document.getElementById('contactsPager');
    if (!pager) {
      var tableWrap = tbody.parentElement && tbody.parentElement.parentElement;
      if (tableWrap) {
        pager = document.createElement('div');
        pager.id = 'contactsPager';
        pager.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 12px;color:#8a97ae;font-size:13px;gap:12px;flex-wrap:wrap;';
        tableWrap.parentElement.insertBefore(pager, tableWrap.nextSibling);
      }
    }
    if (pager) {
      var endIdx = Math.min(start + pageSize, total);
      pager.innerHTML = '<span>Showing <strong style="color:#fff">' + (total === 0 ? 0 : start + 1) + '–' + endIdx + '</strong> of <strong style="color:#fff">' + total + '</strong> contacts</span>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
        '<button id="pgPrev" ' + (currentPage <= 1 ? 'disabled' : '') + ' style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:inherit;cursor:pointer;opacity:' + (currentPage <= 1 ? '0.4' : '1') + ';">← Prev</button>' +
        '<span style="padding:0 8px;">Page <strong style="color:#fff">' + currentPage + '</strong> / ' + totalPages + '</span>' +
        '<button id="pgNext" ' + (currentPage >= totalPages ? 'disabled' : '') + ' style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:inherit;cursor:pointer;opacity:' + (currentPage >= totalPages ? '0.4' : '1') + ';">Next →</button>' +
        '</div>';
      var prev = document.getElementById('pgPrev');
      var next = document.getElementById('pgNext');
      if (prev) prev.onclick = function(){ if (currentPage > 1) { currentPage--; renderContacts(); window.scrollTo({top:0,behavior:'smooth'}); } };
      if (next) next.onclick = function(){ if (currentPage < totalPages) { currentPage++; renderContacts(); window.scrollTo({top:0,behavior:'smooth'}); } };
    }

    // Row click → show detail
    var rows2 = tbody.querySelectorAll(".contact-table-row");
    for (var jj = 0; jj < rows2.length; jj++) {
      rows2[jj].addEventListener("click", function (e) {
        if (e.target.classList && e.target.classList.contains('audit-btn')) return;
        var id = parseInt(this.getAttribute("data-id"), 10);
        showContactDetail(id);
      });
    }
    // Audit button click — HEAD probe, fall back to live audit on 404
    tbody.querySelectorAll('button.audit-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var url = btn.getAttribute('data-audit');
        var fb  = btn.getAttribute('data-fallback');
        var origText = btn.textContent;
        btn.disabled = true; btn.textContent = 'Checking…';
        fetch(url, { method: 'HEAD' }).then(function(r) {
          if (r.ok) { window.open(url, '_blank', 'noopener'); }
          else if (fb) { window.open(fb, '_blank', 'noopener'); }
          else { alert('Audit not available for this contact yet.'); }
        }).catch(function() {
          if (fb) window.open(fb, '_blank', 'noopener');
        }).finally(function() {
          btn.disabled = false; btn.textContent = origText;
        });
      });
    });
    var countEl = document.getElementById("contactsCount");
    if (countEl) countEl.textContent = contactsCache.length + ' total';
    return;
  }

  function showContactDetail(id) {
    var panel = document.getElementById("contactDetail");
    if (!panel) return;
    var contact = null;
    for (var i = 0; i < contactsCache.length; i++) {
      if (contactsCache[i].id === id) { contact = contactsCache[i]; break; }
    }
    if (!contact) return;
    panel.classList.add("open");
    var body = panel.querySelector(".detail-body") || panel;
    body.innerHTML =
      '<h3 style="margin:0 0 8px;">' + contact.name + '</h3>' +
      '<p class="muted" style="margin:0 0 14px">' + contact.company + ' · ' + (contact.region || '—') + '</p>' +
      '<div><strong>Email:</strong> ' + (contact.email || '—') + '</div>' +
      '<div><strong>Phone:</strong> ' + (contact.phone || '—') + '</div>' +
      '<div><strong>Website:</strong> ' + (contact.website ? '<a href="//'+contact.website+'" target="_blank" rel="noopener">'+contact.website+'</a>' : '—') + '</div>' +
      '<div><strong>Niche:</strong> ' + (contact.niche || '—') + '</div>' +
      '<div><strong>City:</strong> ' + (contact.city || '—') + '</div>' +
      '<div><strong>Status:</strong> ' + statusBadge(contact.status) + '</div>' +
      '<div><strong>Source:</strong> ' + (contact.source || '—') + '</div>';
  }
})();

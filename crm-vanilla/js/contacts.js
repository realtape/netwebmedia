/* Contacts Page — loads real data from /api/?r=contacts */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var contacts = [];
  var currentFilter = 'all';
  var searchTerm = '';
  var selected = null;
  var page = 0;
  var PAGE_SIZE = 100;

  document.addEventListener('DOMContentLoaded', function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader('Contacts', '<button class="btn btn-primary" id="addBtn">+ Add Contact</button>');
    }
    bindEvents();
    loadContacts();
  });

  window.loadContacts = loadContacts;

  function loadContacts() {
    var tbody = document.getElementById('contactsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">Loading…</td></tr>';
    fetch(API + 'contacts').then(function (r) { return r.json(); }).then(function (data) {
      contacts = Array.isArray(data) ? data : [];
      render();
    }).catch(function (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#c0392b">Error loading contacts: ' + e.message + '</td></tr>';
    });
  }

  function bindEvents() {
    var si = document.getElementById('contactSearch');
    if (si) si.addEventListener('input', function () { searchTerm = this.value.toLowerCase(); page = 0; render(); });

    var btns = document.querySelectorAll('.filter-btn[data-filter]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var a = document.querySelector('.filter-btn.active');
        if (a) a.classList.remove('active');
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        page = 0;
        render();
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'addBtn') addContact();
    });
  }

  function filtered() {
    return contacts.filter(function (c) {
      var mf = currentFilter === 'all' || c.status === currentFilter;
      var s = searchTerm;
      var ms = !s
        || (c.name    && c.name.toLowerCase().indexOf(s) !== -1)
        || (c.company && c.company.toLowerCase().indexOf(s) !== -1)
        || (c.email   && c.email.toLowerCase().indexOf(s) !== -1)
        || (c.role    && c.role.toLowerCase().indexOf(s) !== -1);
      return mf && ms;
    });
  }

  function render() {
    var tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;
    var list = filtered();
    var total = list.length;
    var start = page * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, total);
    var slice = list.slice(start, end);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="text-align:center;padding:40px;color:#888">No contacts match.</td></tr>';
      updateCount(0, 0, 0);
      return;
    }

    var html = '';
    for (var i = 0; i < slice.length; i++) {
      var c = slice[i];
      var initials = (c.name || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
      html += '<tr class="contact-table-row" data-id="' + c.id + '">';
      html += '<td><div class="td-flex"><div class="contact-avatar small">' + esc(initials) + '</div>'
           +  '<div><div class="td-name">' + esc(c.name || '') + '</div>'
           +  '<div class="td-email">' + esc(c.email || '') + '</div></div></div></td>';
      html += '<td>' + esc(c.company || '—') + '</td>';
      html += '<td>' + (CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status || 'lead') : esc(c.status || '')) + '</td>';
      html += '<td>' + (c.value ? '$' + Number(c.value).toLocaleString() : '—') + '</td>';
      html += '<td>' + (c.last_contact || fmtAgo(c.created_at)) + '</td>';
      html += '</tr>';
    }
    // Pagination row
    if (total > PAGE_SIZE) {
      var pages = Math.ceil(total / PAGE_SIZE);
      html += '<tr><td colspan="5" style="padding:14px;text-align:center;background:#fafbff">'
           + '<button class="filter-btn" id="prevPg"' + (page === 0 ? ' disabled' : '') + '>← Prev</button> '
           + '<span style="margin:0 12px;color:#555">Page ' + (page + 1) + ' of ' + pages + ' — showing ' + (start + 1) + '–' + end + ' of ' + total + '</span> '
           + '<button class="filter-btn" id="nextPg"' + (page >= pages - 1 ? ' disabled' : '') + '>Next →</button>'
           + '</td></tr>';
    }

    tbody.innerHTML = html;
    updateCount(total, start + 1, end);

    var prev = document.getElementById('prevPg');
    var next = document.getElementById('nextPg');
    if (prev) prev.addEventListener('click', function () { if (page > 0) { page--; render(); } });
    if (next) next.addEventListener('click', function () { page++; render(); });

    var rows = tbody.querySelectorAll('.contact-table-row');
    for (var j = 0; j < rows.length; j++) {
      rows[j].addEventListener('click', function () {
        showDetail(parseInt(this.getAttribute('data-id'), 10));
      });
    }
  }

  function updateCount(total, from, to) {
    var hdr = document.querySelector('.page-header h1, .page-header-title');
    if (hdr && !hdr.dataset.orig) hdr.dataset.orig = hdr.textContent;
    if (hdr && total) hdr.textContent = (hdr.dataset.orig || 'Contacts') + ' (' + total + ')';
  }

  function showDetail(id) {
    var panel = document.getElementById('contactDetail');
    if (!panel) return;
    var c = contacts.find(function (x) { return Number(x.id) === id; });
    if (!c) return;
    selected = c;

    // Parse notes JSON for niche/city/website
    var meta = {};
    if (c.notes) {
      try { meta = JSON.parse(c.notes); } catch (e) {}
    }

    panel.classList.add('open');
    var initials = (c.name || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
    var pageUrl = meta.page ? ('https://netwebmedia.com/' + meta.page) : null;

    var html = '<div class="detail-header">'
      + '<button class="detail-close" id="detailClose">&times;</button>'
      + '<div class="detail-avatar">' + esc(initials) + '</div>'
      + '<h2 class="detail-name">' + esc(c.name || '') + '</h2>'
      + '<p class="detail-role">' + esc(c.role || '') + '</p>'
      + (CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status || 'lead') : '')
      + '</div>'
      + '<div class="detail-section"><h3>Contact</h3>'
      +   field('Email',   c.email)
      +   field('Phone',   c.phone)
      +   field('Company', c.company)
      +   field('Niche',   meta.niche || meta.vertical)
      +   field('City',    meta.city)
      +   field('Website', meta.website ? '<a href="http://' + esc(meta.website) + '" target="_blank" style="color:#FF6B00">' + esc(meta.website) + '</a>' : null, true)
      +   field('Audit',   pageUrl ? '<a href="' + esc(pageUrl) + '" target="_blank" style="color:#FF6B00">View audit →</a>' : null, true)
      + '</div>'
      + '<div class="detail-actions" style="display:flex;gap:8px;margin-top:16px">'
      + '<a href="mailto:' + esc(c.email || '') + '" class="btn btn-primary btn-sm">Email</a>'
      + (c.phone ? '<a href="tel:' + esc(c.phone) + '" class="btn btn-secondary btn-sm">Call</a>' : '')
      + '<button class="btn btn-secondary btn-sm" id="delBtn" style="margin-left:auto;color:#c0392b">Delete</button>'
      + '</div>';

    panel.innerHTML = html;
    document.getElementById('detailClose').onclick = function () { panel.classList.remove('open'); };
    var db = document.getElementById('delBtn');
    if (db) db.onclick = function () {
      if (!confirm('Delete ' + (c.name || 'this contact') + '?')) return;
      fetch(API + 'contacts&id=' + c.id, { method: 'DELETE' }).then(function () {
        panel.classList.remove('open');
        loadContacts();
      });
    };
  }

  function field(label, val, isHtml) {
    if (!val) return '';
    return '<div class="detail-field"><span class="field-label">' + label + '</span><span class="field-value">' + (isHtml ? val : esc(val)) + '</span></div>';
  }

  function addContact() {
    var name = prompt('Contact name:');
    if (!name) return;
    var email = prompt('Email:');
    var company = prompt('Company:');
    fetch(API + 'contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, company: company, status: 'lead' }),
    }).then(function (r) { return r.json(); }).then(function () { loadContacts(); });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  function fmtAgo(d) {
    if (!d) return '—';
    var then = new Date(d.replace(' ', 'T'));
    if (isNaN(then)) return d;
    var days = Math.floor((Date.now() - then.getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 30) return days + ' days ago';
    return then.toLocaleDateString();
  }
})();

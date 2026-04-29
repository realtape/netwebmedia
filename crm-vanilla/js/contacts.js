/* Contacts Page — loads real data from /api/?r=contacts */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var contacts = [];
  var currentFilter = 'all';
  var currentSegment = 'all';
  var currentQuality = 'all';
  var searchTerm = '';

  var FREE_EMAIL_DOMAINS = {
    'gmail.com':1,'yahoo.com':1,'hotmail.com':1,'outlook.com':1,'aol.com':1,
    'icloud.com':1,'live.com':1,'msn.com':1,'ymail.com':1,'yahoo.com.mx':1,
    'yahoo.com.ar':1,'hotmail.es':1,'hotmail.cl':1,'googlemail.com':1
  };
  function isIdentifiableBusiness(c) {
    if (!c.company || c.company.trim().length < 2) return false;
    var email = (c.email || '').toLowerCase().trim();
    if (!email || email.indexOf('@') === -1) return false;
    var domain = email.split('@').pop();
    return !FREE_EMAIL_DOMAINS[domain];
  }
  function isEmailReady(c) {
    if (!isIdentifiableBusiness(c)) return false;
    var name = (c.name || '').trim();
    if (!name) return false;
    var first = name.split(/\s+/)[0];
    return first && first.length >= 2;
  }
  function isWhatsAppReady(c) {
    if (!isIdentifiableBusiness(c)) return false;
    var digits = (c.phone || '').replace(/\D/g, '');
    if (digits.length < 8) return false;
    var seg = (c.segment || '').toLowerCase();
    if (seg.indexOf('usa') === 0) return digits.length === 10 || digits.length === 11;
    if (seg.indexOf('chile') === 0) return digits.length >= 8;
    return digits.length >= 8;
  }
  var selected = null;
  var page = 0;
  var PAGE_SIZE = 100;
  var sortKey = 'name';
  var sortDir = 1; // 1 asc, -1 desc

  // City (lowercase, slug-form) -> Chilean region display name
  var CITY_TO_REGION = {
    'arica': 'Arica y Parinacota',
    'iquique': 'Tarapacá',
    'antofagasta': 'Antofagasta',
    'copiapo': 'Atacama', 'copiapó': 'Atacama',
    'la-serena': 'Coquimbo', 'la serena': 'Coquimbo',
    'valparaiso': 'Valparaíso', 'valparaíso': 'Valparaíso',
    'santiago': 'Metropolitana',
    'rancagua': "O'Higgins",
    'talca': 'Maule',
    'chillan': 'Ñuble', 'chillán': 'Ñuble',
    'concepcion': 'Biobío', 'concepción': 'Biobío',
    'temuco': 'La Araucanía',
    'valdivia': 'Los Ríos',
    'puerto-montt': 'Los Lagos', 'puerto montt': 'Los Lagos',
    'osorno': 'Los Lagos',
    'coyhaique': 'Aysén',
    'punta-arenas': 'Magallanes', 'punta arenas': 'Magallanes'
  };

  function regionOf(c) {
    var meta = {};
    if (c && c.notes) { try { meta = JSON.parse(c.notes); } catch (e) {} }
    if (meta.region) return meta.region;
    // USA contacts: use state name
    if ((meta.segment || c.segment) === 'usa' && meta.state) return meta.state;
    var city = (meta.city || '').toLowerCase().trim();
    return CITY_TO_REGION[city] || '—';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      var T = (CRM_APP.t || function(k){return k;});
      var title = T('nav.contacts') === 'nav.contacts' ? 'Contacts' : T('nav.contacts');
      var addLabel = CRM_APP.getLang && CRM_APP.getLang() === 'es' ? '+ Agregar Contacto' : '+ Add Contact';
      CRM_APP.buildHeader(title, '<button class="btn btn-primary" id="addBtn">' + addLabel + '</button>');
    }
    injectSortCSS();
    bindEvents();
    loadContacts();
  });

  window.loadContacts = loadContacts;

  function injectSortCSS() {
    if (document.getElementById('contactsSortCSS')) return;
    var s = document.createElement('style'); s.id = 'contactsSortCSS';
    s.textContent =
      '.contacts-table th.sortable{cursor:pointer;user-select:none}' +
      '.contacts-table th.sortable:hover{color:#FF6B00}' +
      '.contacts-table th .sort-ind{display:inline-block;margin-left:6px;color:#FF6B00;font-size:11px;font-weight:700;min-width:10px}';
    document.head.appendChild(s);
  }

  function loadContacts() {
    var tbody = document.getElementById('contactsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#888">Loading…</td></tr>';
    var url = API + 'contacts';
    if (currentSegment && currentSegment !== 'all') url += '&segment=' + encodeURIComponent(currentSegment);
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      contacts = Array.isArray(data) ? data : [];
      // Pre-compute region on each contact for sort speed
      for (var i = 0; i < contacts.length; i++) contacts[i].__region = regionOf(contacts[i]);
      render();
    }).catch(function (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#c0392b">Error loading contacts: ' + e.message + '</td></tr>';
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

    // Segment filter buttons (🌎 All / 🇺🇸 USA / 🇨🇱 Chile)
    var segBtns = document.querySelectorAll('.filter-btn[data-segment]');
    for (var s = 0; s < segBtns.length; s++) {
      segBtns[s].addEventListener('click', function () {
        var activeSeg = document.querySelector('.filter-btn[data-segment].active');
        if (activeSeg) activeSeg.classList.remove('active');
        this.classList.add('active');
        currentSegment = this.getAttribute('data-segment');
        page = 0;
        loadContacts(); // re-fetch from API with segment param
      });
    }

    // Quality filter buttons (All / 🏢 Identifiable Biz)
    var qualBtns = document.querySelectorAll('.filter-btn[data-quality]');
    for (var q = 0; q < qualBtns.length; q++) {
      qualBtns[q].addEventListener('click', function () {
        var activeQual = document.querySelector('.filter-btn[data-quality].active');
        if (activeQual) activeQual.classList.remove('active');
        this.classList.add('active');
        currentQuality = this.getAttribute('data-quality');
        page = 0;
        render();
      });
    }

    // Sort header clicks
    var heads = document.querySelectorAll('.contacts-table th.sortable');
    for (var k = 0; k < heads.length; k++) {
      heads[k].addEventListener('click', function () {
        var key = this.getAttribute('data-sort');
        if (sortKey === key) sortDir = -sortDir;
        else { sortKey = key; sortDir = 1; }
        page = 0;
        render();
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'addBtn') addContact();
    });
  }

  function updateSortIndicators() {
    var heads = document.querySelectorAll('.contacts-table th.sortable');
    for (var i = 0; i < heads.length; i++) {
      var ind = heads[i].querySelector('.sort-ind');
      if (!ind) continue;
      ind.textContent = (heads[i].getAttribute('data-sort') === sortKey) ? (sortDir === 1 ? '▲' : '▼') : '';
    }
  }

  function compareVal(a, b, key) {
    var va, vb;
    if (key === 'region') { va = a.__region || ''; vb = b.__region || ''; }
    else if (key === 'value') { va = Number(a.value || 0); vb = Number(b.value || 0); }
    else if (key === 'last_contact') {
      va = a.last_contact || a.updated_at || a.created_at || '';
      vb = b.last_contact || b.updated_at || b.created_at || '';
    }
    else { va = (a[key] || '').toString(); vb = (b[key] || '').toString(); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return -1 * sortDir;
    if (va > vb) return  1 * sortDir;
    return 0;
  }

  function filtered() {
    var list = contacts.filter(function (c) {
      var mf = currentFilter === 'all' || c.status === currentFilter;
      var mq = currentQuality === 'all'
        || (currentQuality === 'identifiable' && isIdentifiableBusiness(c))
        || (currentQuality === 'email_ready' && isEmailReady(c))
        || (currentQuality === 'whatsapp_ready' && isWhatsAppReady(c));
      var s = searchTerm;
      var ms = !s
        || (c.name    && c.name.toLowerCase().indexOf(s) !== -1)
        || (c.company && c.company.toLowerCase().indexOf(s) !== -1)
        || (c.email   && c.email.toLowerCase().indexOf(s) !== -1)
        || (c.role    && c.role.toLowerCase().indexOf(s) !== -1)
        || (c.__region && c.__region.toLowerCase().indexOf(s) !== -1);
      return mf && mq && ms;
    });
    list.sort(function (a, b) { return compareVal(a, b, sortKey); });
    return list;
  }

  function render() {
    var tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;
    updateSortIndicators();
    var list = filtered();
    var total = list.length;
    var start = page * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, total);
    var slice = list.slice(start, end);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="text-align:center;padding:40px;color:#888">No contacts match.</td></tr>';
      renderPager(0, 0, 0, 0);
      return;
    }

    var html = '';
    for (var i = 0; i < slice.length; i++) {
      var c = slice[i];
      var initials = (c.name || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
      var meta = {};
      if (c.notes) { try { meta = JSON.parse(c.notes); } catch (e) {} }
      var auditUrl = meta.page ? (/^https?:/i.test(meta.page) ? meta.page : ('https://netwebmedia.com/' + meta.page.replace(/^\/+/, ''))) : null;

      html += '<tr class="contact-table-row" data-id="' + c.id + '">';
      html += '<td><div class="td-flex"><div class="contact-avatar small">' + esc(initials) + '</div>'
           +  '<div><div class="td-name">' + esc(c.name || '') + '</div>'
           +  '<div class="td-email">' + esc(c.email || '') + '</div></div></div></td>';
      html += '<td>' + esc(c.company || '—') + '</td>';
      html += '<td>' + esc(c.__region || '—') + '</td>';
      html += '<td>' + (CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status || 'lead') : esc(c.status || '')) + '</td>';
      html += '<td>' + (c.value && Number(c.value) > 0 ? '$' + Number(c.value).toLocaleString() : '—') + '</td>';
      html += '<td>' + (c.last_contact || fmtAgo(c.created_at)) + '</td>';
      html += '<td>' + (auditUrl
          ? '<a href="' + esc(auditUrl) + '" target="_blank" onclick="event.stopPropagation()" style="color:#FF6B00;font-weight:600;text-decoration:none;padding:6px 10px;border:1px solid #FF6B00;border-radius:6px;font-size:12px">View ↗</a>'
          : '<span style="color:#bbb;font-size:12px">—</span>') + '</td>';
      html += '</tr>';
    }

    var pages = Math.ceil(total / PAGE_SIZE);
    renderPager(total, pages, start + 1, end);

    tbody.innerHTML = html;
    updateCount(total, start + 1, end);

    var rows = tbody.querySelectorAll('.contact-table-row');
    for (var j = 0; j < rows.length; j++) {
      rows[j].addEventListener('click', function () {
        showDetail(parseInt(this.getAttribute('data-id'), 10));
      });
    }
  }

  function updateCount(total, from, to) {
    var hdr = document.querySelector('.page-title, .page-header h1, .page-header-title');
    if (hdr && !hdr.dataset.orig) hdr.dataset.orig = hdr.textContent;
    if (hdr) hdr.textContent = (hdr.dataset.orig || 'Contacts') + ' (' + total.toLocaleString() + ')';
  }

  function renderPager(total, pages, from, to) {
    var existing = document.getElementById('pager');
    if (existing) existing.remove();
    if (total <= PAGE_SIZE) return;
    var wrap = document.querySelector('.contacts-table-wrap');
    if (!wrap) return;
    var div = document.createElement('div');
    div.id = 'pager';
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,107,0,.08);border:1px solid rgba(255,107,0,.25);border-radius:8px;margin-bottom:12px;font-size:14px;color:inherit';
    div.innerHTML =
      '<div>Showing <strong>' + from + '–' + to + '</strong> of <strong>' + total.toLocaleString() + '</strong></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<button id="pgPrev"' + (page === 0 ? ' disabled' : '') + ' style="padding:6px 14px;border:1px solid #FF6B00;background:#FF6B00;color:#fff;border-radius:6px;cursor:pointer;font-weight:600' + (page === 0 ? ';opacity:.4;cursor:not-allowed' : '') + '">← Prev</button>' +
        '<span>Page <strong>' + (page + 1) + '</strong> / ' + pages + '</span>' +
        '<button id="pgNext"' + (page >= pages - 1 ? ' disabled' : '') + ' style="padding:6px 14px;border:1px solid #FF6B00;background:#FF6B00;color:#fff;border-radius:6px;cursor:pointer;font-weight:600' + (page >= pages - 1 ? ';opacity:.4;cursor:not-allowed' : '') + '">Next →</button>' +
      '</div>';
    wrap.parentNode.insertBefore(div, wrap);
    var prev = document.getElementById('pgPrev');
    var next = document.getElementById('pgNext');
    if (prev) prev.onclick = function () { if (page > 0) { page--; render(); window.scrollTo(0, 0); } };
    if (next) next.onclick = function () { if (page < pages - 1) { page++; render(); window.scrollTo(0, 0); } };
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
    var pageUrl = meta.page ? (/^https?:/i.test(meta.page) ? meta.page : ('https://netwebmedia.com/' + meta.page.replace(/^\/+/, ''))) : null;

    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs
      ? { contact: 'Contacto', email: 'Email', phone: 'Teléfono', company: 'Empresa', region: 'Región', niche: 'Rubro', city: 'Ciudad', website: 'Sitio Web', audit: 'Auditoría', viewAudit: 'Ver auditoría', emailBtn: 'Email', callBtn: 'Llamar', deleteBtn: 'Eliminar', country: 'País' }
      : { contact: 'Contact', email: 'Email', phone: 'Phone', company: 'Company', region: 'Region', niche: 'Niche', city: 'City', website: 'Website', audit: 'Audit', viewAudit: 'View audit', emailBtn: 'Email', callBtn: 'Call', deleteBtn: 'Delete', country: 'Country' };
    var seg = c.segment || meta.segment;
    var countryDisplay = seg === 'usa' ? '🇺🇸 United States' : seg === 'chile' ? '🇨🇱 Chile' : seg || null;
    var lifecycleBadge = '';
    var lcStage = (c.lifecycle_stage) || (function () {
      try { var nb = (typeof meta === 'object' ? meta : {}); return nb.lifecycle_stage; } catch (e) { return null; }
    })();
    if (lcStage) {
      var lcColors = { subscriber:'#94a3b8', lead:'#0369a1', mql:'#0d9488', sql:'#9333ea', opportunity:'#FF671F', customer:'#10b981', churned:'#b91c1c' };
      var lcColor = lcColors[lcStage] || '#64748b';
      lifecycleBadge = '<span class="lifecycle-badge" style="display:inline-block;margin-top:6px;background:' + lcColor + ';color:#fff;padding:3px 10px;border-radius:999px;font:700 11px Inter;text-transform:uppercase;letter-spacing:.5px">' + esc(lcStage) + '</span>';
    }
    var html = '<div class="detail-header">'
      + '<button class="detail-close" id="detailClose">&times;</button>'
      + '<div class="detail-avatar">' + esc(initials) + '</div>'
      + '<h2 class="detail-name">' + esc(c.name || '') + '</h2>'
      + '<p class="detail-role">' + esc(c.role || '') + '</p>'
      + (CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status || 'lead') : '')
      + lifecycleBadge
      + '</div>'
      + '<div class="detail-section"><h3>' + L.contact + '</h3>'
      +   field(L.email,    c.email)
      +   field(L.phone,    c.phone)
      +   field(L.company,  c.company)
      +   field(L.country,  countryDisplay)
      +   field(L.region,   c.__region)
      +   field(L.niche,    meta.niche || meta.vertical)
      +   field(L.city,     meta.city)
      +   field(L.website,  meta.website ? '<a href="http://' + esc(meta.website) + '" target="_blank" style="color:#FF6B00">' + esc(meta.website) + '</a>' : null, true)
      +   field(L.audit,    pageUrl ? '<a href="' + esc(pageUrl) + '" target="_blank" style="color:#FF6B00">' + L.viewAudit + ' →</a>' : null, true)
      + '</div>'
      + '<div class="detail-actions" style="display:flex;gap:8px;margin-top:16px">'
      + '<a href="mailto:' + esc(c.email || '') + '" class="btn btn-primary btn-sm">' + L.emailBtn + '</a>'
      + (c.phone ? '<a href="tel:' + esc(c.phone) + '" class="btn btn-secondary btn-sm">' + L.callBtn + '</a>' : '')
      + '<a href="tasks.html?contact_id=' + c.id + '" class="btn btn-secondary btn-sm">' + (isEs ? 'Tareas' : 'Tasks') + '</a>'
      + '<button class="btn btn-secondary btn-sm" id="delBtn" style="margin-left:auto;color:#c0392b">' + L.deleteBtn + '</button>'
      + '</div>'
      + '<div class="detail-section" id="contactNotesSection" style="margin-top:18px">'
      +   '<div id="contactNotes"></div>'
      + '</div>'
      + '<div class="detail-section" id="contactTimelineSection" style="margin-top:18px">'
      +   '<div id="contactTimeline"></div>'
      + '</div>';

    panel.innerHTML = html;
    document.getElementById('detailClose').onclick = function () { panel.classList.remove('open'); };
    if (window.NWMNotes) {
      NWMNotes.mount('#contactNotes', { contactId: c.id, title: isEs ? 'Notas' : 'Notes' });
    }
    if (window.NWMTimeline) {
      NWMTimeline.mount('#contactTimeline', { contactId: c.id, title: isEs ? 'Actividad' : 'Activity', limit: 30 });
    }
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

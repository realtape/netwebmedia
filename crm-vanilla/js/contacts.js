/* Contacts Page — loads real data from /api/?r=contacts */
(function () {
  "use strict";

  var API = 'api/index.php?r=';
  var contacts = [];
  var currentFilter = 'all';
  var currentSegment = 'all';
  var currentQuality = 'named'; // default hides chain-import junk (name === company, no email)
  var currentNiche = 'all';
  var currentState = 'all';
  var searchTerm = '';

  // 14-niche taxonomy — hard constraint, never extend
  var NICHE_LABELS = {
    tourism: 'Tourism / Hospitality',
    restaurants: 'Restaurants',
    health: 'Health',
    beauty: 'Beauty',
    smb: 'SMB',
    law_firms: 'Law Firms',
    real_estate: 'Real Estate',
    local_specialist: 'Local Specialist',
    automotive: 'Automotive',
    education: 'Education',
    events_weddings: 'Events & Weddings',
    financial_services: 'Financial Services',
    home_services: 'Home Services',
    wine_agriculture: 'Wine & Agriculture'
  };

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
  // Real person + email — hides chain-import rows where name === company (e.g. "7-Eleven / 7-Eleven")
  function isNamed(c) {
    var name = (c.name || '').trim();
    var email = (c.email || '').trim();
    var company = (c.company || '').trim();
    if (name.length < 2) return false;
    if (!email || email.indexOf('@') === -1) return false;
    if (name.toLowerCase() === company.toLowerCase()) return false;
    if (!/\s/.test(name)) return false; // require firstname + lastname
    return true;
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
  var serverTotal = 0;   // total contacts matching current filter (server-reported)
  var apiLimit = 5000;   // rows loaded per fetch; raise after dedupe

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

  function nicheOf(c) {
    var meta = {};
    if (c && c.notes) { try { meta = JSON.parse(c.notes); } catch (e) {} }
    return (meta.niche || meta.vertical || '').toString().toLowerCase().trim();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      var T = (CRM_APP.t || function(k){return k;});
      var title = T('nav.contacts') === 'nav.contacts' ? 'Contacts' : T('nav.contacts');
      var addLabel = CRM_APP.getLang && CRM_APP.getLang() === 'es' ? '+ Agregar Contacto' : '+ Add Contact';
      CRM_APP.buildHeader(title, '<button class="btn btn-primary" id="addBtn">' + addLabel + '</button>');
    }
    injectSortCSS();
    injectFilterCSS();
    bindEvents();
    loadContacts();
    // Auto-refresh every 15 min — matches the import sync cycle
    setInterval(function () { if (!document.hidden) loadContacts(); }, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) loadContacts();
    });
  });

  window.loadContacts = loadContacts;

  function injectSortCSS() {
    if (document.getElementById('contactsSortCSS')) return;
    var s = document.createElement('style'); s.id = 'contactsSortCSS';
    s.textContent =
      '.contacts-table th.sortable{cursor:pointer;user-select:none}' +
      '.contacts-table th.sortable:hover{color:#FF671F}' +
      '.contacts-table th .sort-ind{display:inline-block;margin-left:6px;color:#FF671F;font-size:11px;font-weight:700;min-width:10px}';
    document.head.appendChild(s);
  }

  function injectFilterCSS() {
    if (document.getElementById('contactsFilterCSS')) return;
    var s = document.createElement('style'); s.id = 'contactsFilterCSS';
    s.textContent =
      ".filter-select{background:rgba(255,255,255,.06);color:inherit;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 28px 6px 12px;font:inherit;font-size:13px;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FF671F' stroke-width='3'><polyline points='6 9 12 15 18 9'/></svg>\");background-repeat:no-repeat;background-position:right 8px center;max-width:200px}" +
      ".filter-select:hover{border-color:#FF671F}" +
      ".filter-select:focus{outline:none;border-color:#FF671F;box-shadow:0 0 0 2px rgba(255,103,31,.25)}" +
      ".filter-select option{background:#010F3B;color:#fff}" +
      ".active-filter-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,103,31,.12);border:1px solid rgba(255,103,31,.35);color:#FF671F;padding:4px 10px;border-radius:999px;font:600 12px Inter,system-ui,sans-serif}" +
      ".active-filter-pill .pill-x{background:transparent;border:0;color:#FF671F;cursor:pointer;font-size:16px;line-height:1;padding:0 0 0 2px;font-weight:700}" +
      ".active-filter-pill .pill-x:hover{color:#fff}" +
      ".active-filter-pills .clear-all-link{background:transparent;border:0;color:#FF671F;font:600 12px Inter,system-ui,sans-serif;cursor:pointer;padding:4px 8px;text-decoration:underline;margin-left:auto}" +
      ".active-filter-pills .clear-all-link:hover{color:#fff}";
    document.head.appendChild(s);
  }

  function loadContacts() {
    var tbody = document.getElementById('contactsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#888">Loading…</td></tr>';
    var url = API + 'contacts&limit=' + apiLimit + '&offset=0';
    if (currentSegment && currentSegment !== 'all') url += '&segment=' + encodeURIComponent(currentSegment);
    fetch(url).then(function (r) { return r.json(); }).then(function (resp) {
      // API returns {data:[], total:N} — fall back to flat array for compat
      var rows = Array.isArray(resp) ? resp : (resp.data || []);
      serverTotal = (resp.total != null) ? resp.total : rows.length;
      contacts = rows;
      // Pre-compute region + niche on each contact for sort/filter speed
      for (var i = 0; i < contacts.length; i++) {
        contacts[i].__region = regionOf(contacts[i]);
        contacts[i].__niche = nicheOf(contacts[i]);
      }
      populateStateFilter();
      page = 0;
      render();
    }).catch(function (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#c0392b">Error loading contacts: ' + esc(e && e.message) + '</td></tr>';
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

    // Initialize default filter buttons as active (quality default is 'named' — set in HTML)
    var defaultSegment = document.querySelector('.filter-btn[data-segment="all"]');
    if (defaultSegment) defaultSegment.classList.add('active');
    setActiveChip('quality', currentQuality);

    // Niche + State dropdowns
    var nicheSel = document.getElementById('nicheFilter');
    if (nicheSel) nicheSel.addEventListener('change', function () {
      currentNiche = this.value;
      page = 0;
      render();
    });

    var stateSel = document.getElementById('stateFilter');
    if (stateSel) stateSel.addEventListener('change', function () {
      currentState = this.value;
      page = 0;
      render();
    });

    // Clear-all button
    var clearBtn = document.getElementById('clearFilters');
    if (clearBtn) clearBtn.addEventListener('click', resetAllFilters);
  }

  function populateStateFilter() {
    var sel = document.getElementById('stateFilter');
    if (!sel) return;
    var prior = sel.value;
    var seen = {};
    var regions = [];
    for (var i = 0; i < contacts.length; i++) {
      var r = contacts[i].__region;
      if (r && r !== '—' && !seen[r]) { seen[r] = 1; regions.push(r); }
    }
    regions.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
    var html = '<option value="all">📍 All regions</option>';
    for (var j = 0; j < regions.length; j++) html += '<option value="' + esc(regions[j]) + '">' + esc(regions[j]) + '</option>';
    sel.innerHTML = html;
    if (prior && (prior === 'all' || seen[prior])) sel.value = prior;
    else { sel.value = 'all'; currentState = 'all'; }
  }

  function renderActiveFilters() {
    var wrap = document.getElementById('activeFilterPills');
    if (!wrap) return;
    var pills = [];
    if (currentFilter !== 'all') {
      var fLabels = { customer: 'Customers', prospect: 'Prospects', lead: 'Leads', churned: 'Churned' };
      pills.push({ key: 'status', label: 'Status: ' + (fLabels[currentFilter] || currentFilter) });
    }
    if (currentSegment !== 'all') {
      var segLabels = { usa: '🇺🇸 USA', chile: '🇨🇱 Chile', usa_best_30k: '⭐ Best 30k' };
      pills.push({ key: 'segment', label: segLabels[currentSegment] || currentSegment });
    }
    if (currentQuality !== 'all') {
      var qLabels = { named: '👤 Named', identifiable: '🏢 Identifiable Biz', email_ready: '✉️ Email-Ready', whatsapp_ready: '💬 WhatsApp-Ready' };
      pills.push({ key: 'quality', label: qLabels[currentQuality] || currentQuality });
    }
    if (currentNiche !== 'all') pills.push({ key: 'niche', label: '🎯 ' + (NICHE_LABELS[currentNiche] || currentNiche) });
    if (currentState !== 'all') pills.push({ key: 'state', label: '📍 ' + currentState });
    if (searchTerm) pills.push({ key: 'search', label: '🔍 ' + searchTerm });

    if (!pills.length) { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
    wrap.style.display = 'flex';
    var html = '';
    for (var i = 0; i < pills.length; i++) {
      html += '<span class="active-filter-pill" data-key="' + esc(pills[i].key) + '">' + esc(pills[i].label)
           +  ' <button class="pill-x" data-key="' + esc(pills[i].key) + '" title="Remove">×</button></span>';
    }
    html += '<button class="clear-all-link" id="pillsClearAll" title="Clear all filters">Clear all</button>';
    wrap.innerHTML = html;

    var xs = wrap.querySelectorAll('.pill-x');
    for (var k = 0; k < xs.length; k++) {
      xs[k].addEventListener('click', function () { clearOneFilter(this.getAttribute('data-key')); });
    }
    var ca = document.getElementById('pillsClearAll');
    if (ca) ca.addEventListener('click', resetAllFilters);
  }

  function clearOneFilter(key) {
    if (key === 'status') {
      currentFilter = 'all';
      setActiveChip('filter', 'all');
      page = 0; render();
    } else if (key === 'segment') {
      currentSegment = 'all';
      setActiveChip('segment', 'all');
      page = 0; loadContacts();
    } else if (key === 'quality') {
      currentQuality = 'all';
      setActiveChip('quality', 'all');
      page = 0; render();
    } else if (key === 'niche') {
      currentNiche = 'all';
      var ns = document.getElementById('nicheFilter'); if (ns) ns.value = 'all';
      page = 0; render();
    } else if (key === 'state') {
      currentState = 'all';
      var ss = document.getElementById('stateFilter'); if (ss) ss.value = 'all';
      page = 0; render();
    } else if (key === 'search') {
      searchTerm = '';
      var si = document.getElementById('contactSearch'); if (si) si.value = '';
      page = 0; render();
    }
  }

  function setActiveChip(group, value) {
    var btns = document.querySelectorAll('.filter-btn[data-' + group + ']');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-' + group) === value);
    }
  }

  function resetAllFilters() {
    var segmentChanged = currentSegment !== 'all';
    currentFilter = 'all';
    currentSegment = 'all';
    currentQuality = 'all';
    currentNiche = 'all';
    currentState = 'all';
    searchTerm = '';
    var si = document.getElementById('contactSearch'); if (si) si.value = '';
    setActiveChip('filter', 'all');
    setActiveChip('segment', 'all');
    setActiveChip('quality', 'all');
    var ns = document.getElementById('nicheFilter'); if (ns) ns.value = 'all';
    var ss = document.getElementById('stateFilter'); if (ss) ss.value = 'all';
    page = 0;
    if (segmentChanged) loadContacts(); else render();
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
        || (currentQuality === 'named' && isNamed(c))
        || (currentQuality === 'identifiable' && isIdentifiableBusiness(c))
        || (currentQuality === 'email_ready' && isEmailReady(c))
        || (currentQuality === 'whatsapp_ready' && isWhatsAppReady(c));
      var mn = currentNiche === 'all' || (c.__niche === currentNiche);
      var mr = currentState === 'all' || (c.__region === currentState);
      var s = searchTerm;
      var ms = !s
        || (c.name    && c.name.toLowerCase().indexOf(s) !== -1)
        || (c.company && c.company.toLowerCase().indexOf(s) !== -1)
        || (c.email   && c.email.toLowerCase().indexOf(s) !== -1)
        || (c.role    && c.role.toLowerCase().indexOf(s) !== -1)
        || (c.__region && c.__region.toLowerCase().indexOf(s) !== -1);
      return mf && mq && mn && mr && ms;
    });
    list.sort(function (a, b) { return compareVal(a, b, sortKey); });
    return list;
  }

  function render() {
    var tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;
    updateSortIndicators();
    renderActiveFilters();
    var list = filtered();
    var total = list.length;
    var start = page * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, total);
    var slice = list.slice(start, end);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state" style="text-align:center;padding:40px;color:#888">No contacts match.</td></tr>';
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
           +  '<div><div class="td-name">' + esc(c.name || '') + '</div></div></div></td>';
      html += '<td>' + (c.email ? '<a href="mailto:' + esc(c.email) + '" onclick="event.stopPropagation()" style="color:#FF671F;text-decoration:none">' + esc(c.email) + '</a>' : '<span style="color:#bbb">—</span>') + '</td>';
      html += '<td>' + (c.phone ? '<a href="tel:' + esc((c.phone||'').replace(/[^0-9+]/g,'')) + '" onclick="event.stopPropagation()" style="color:#C8D4E6;text-decoration:none;font-variant-numeric:tabular-nums">' + esc(c.phone) + '</a>' : '<span style="color:#bbb">—</span>') + '</td>';
      html += '<td>' + esc(c.company || '—') + '</td>';
      html += '<td>' + esc(c.__region || '—') + '</td>';
      html += '<td>' + (CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status || 'lead') : esc(c.status || '')) + '</td>';
      html += '<td>' + (c.value && Number(c.value) > 0 ? '$' + Number(c.value).toLocaleString() : '—') + '</td>';
      html += '<td>' + (c.last_contact || fmtAgo(c.created_at)) + '</td>';
      html += '<td>' + (auditUrl
          ? '<a href="' + esc(auditUrl) + '" target="_blank" onclick="event.stopPropagation()" style="color:#FF671F;font-weight:600;text-decoration:none;padding:6px 10px;border:1px solid #FF671F;border-radius:6px;font-size:12px">View ↗</a>'
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
    var label = serverTotal > contacts.length
      ? total.toLocaleString() + ' shown / ' + serverTotal.toLocaleString() + ' total'
      : total.toLocaleString();
    if (hdr) hdr.textContent = (hdr.dataset.orig || 'Contacts') + ' (' + label + ')';
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
        '<button id="pgPrev"' + (page === 0 ? ' disabled' : '') + ' style="padding:6px 14px;border:1px solid #FF671F;background:#FF671F;color:#fff;border-radius:6px;cursor:pointer;font-weight:600' + (page === 0 ? ';opacity:.4;cursor:not-allowed' : '') + '">← Prev</button>' +
        '<span>Page <strong>' + (page + 1) + '</strong> / ' + pages + '</span>' +
        '<button id="pgNext"' + (page >= pages - 1 ? ' disabled' : '') + ' style="padding:6px 14px;border:1px solid #FF671F;background:#FF671F;color:#fff;border-radius:6px;cursor:pointer;font-weight:600' + (page >= pages - 1 ? ';opacity:.4;cursor:not-allowed' : '') + '">Next →</button>' +
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
      +   field(L.website,  meta.website ? '<a href="http://' + esc(meta.website) + '" target="_blank" style="color:#FF671F">' + esc(meta.website) + '</a>' : null, true)
      +   field(L.audit,    pageUrl ? '<a href="' + esc(pageUrl) + '" target="_blank" style="color:#FF671F">' + L.viewAudit + ' →</a>' : null, true)
      + '</div>'
      + '<div class="detail-actions" id="contactActions" style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">'
      + '<a href="mailto:' + esc(c.email || '') + '" class="btn btn-primary btn-sm">' + L.emailBtn + '</a>'
      + '<span id="contactDialerSlot"></span>'
      + '<a href="tasks.html?contact_id=' + c.id + '" class="btn btn-secondary btn-sm">' + (isEs ? 'Tareas' : 'Tasks') + '</a>'
      + '<button class="btn btn-secondary btn-sm" id="delBtn" style="margin-left:auto;color:#c0392b">' + L.deleteBtn + '</button>'
      + '</div>'
      + '<div class="detail-section" id="contactPredSection" style="margin-top:18px">'
      +   '<div id="contactPred"></div>'
      + '</div>'
      + '<div class="detail-section" id="contactNotesSection" style="margin-top:18px">'
      +   '<div id="contactNotes"></div>'
      + '</div>'
      + '<div class="detail-section" id="contactTimelineSection" style="margin-top:18px">'
      +   '<div id="contactTimeline"></div>'
      + '</div>';

    panel.innerHTML = html;
    document.getElementById('detailClose').onclick = function () { panel.classList.remove('open'); };

    // Mount click-to-dial button if phone present
    if (window.NWMDialer && c.phone) {
      var slot = document.getElementById('contactDialerSlot');
      if (slot) {
        var btn = NWMDialer.buildButton(c, {
          onLogged: function () {
            if (window.NWMTimeline) {
              try { NWMTimeline.mount('#contactTimeline', { contactId: c.id, title: isEs ? 'Actividad' : 'Activity', limit: 30 }); } catch (e) {}
            }
          }
        });
        slot.replaceWith(btn);
      }
    }

    if (window.NWMPredictions) {
      NWMPredictions.mount('#contactPred', { contactId: c.id, title: isEs ? 'Probabilidad de cierre' : 'Predicted close probability' });
    }
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

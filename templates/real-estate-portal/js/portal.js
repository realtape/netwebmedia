/* =============================================================================
 * NWM Real-Estate Portal Template — application logic (vanilla JS, no build)
 * Renders listings, wires search + filters + sort, opens a detail modal.
 * Data: window.NWM_PORTAL_LISTINGS / FACETS / CONFIG (js/data.js).
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = window.NWM_PORTAL_CONFIG;
  var FACETS = window.NWM_PORTAL_FACETS;
  var LISTINGS = window.NWM_PORTAL_LISTINGS;

  /* ---- i18n (chrome only; listing content stays in Spanish / es-CL) -------- */
  var I18N = {
    es: {
      nav_buy: 'Comprar', nav_rent: 'Arrendar', nav_sell: 'Vender', nav_contact: 'Contacto',
      publish: 'Publicar propiedad',
      hero_h1: 'Encuentra tu próxima propiedad en ' + CFG.city,
      hero_p: 'Casas y departamentos en venta en los mejores sectores de ' + CFG.region + '. Filtra, compara y contacta directo.',
      f_op: 'Operación', f_type: 'Tipo', f_loc: 'Ubicación / sector', search: 'Buscar',
      stat_props: 'propiedades', stat_sectors: 'sectores', stat_uf: 'desde',
      filters: 'Filtros', clear: 'Limpiar', price: 'Precio (UF)', beds: 'Dormitorios', baths: 'Baños', ptype: 'Tipo de propiedad', sector: 'Sector',
      results_of: 'propiedades en', sort: 'Ordenar por',
      sort_rel: 'Relevancia', sort_lo: 'Menor precio', sort_hi: 'Mayor precio', sort_area: 'Mayor superficie',
      any: 'Cualquiera', keyword: 'Buscar por palabra clave (sector, condominio…)',
      empty_h: 'Sin resultados', empty_p: 'Ajusta los filtros para ver más propiedades.',
      detail_features: 'Características', detail_about: 'Descripción', detail_loc: 'Ubicación referencial',
      wa: 'Contactar por WhatsApp', call: 'Llamar', ref_photo: 'Foto referencial',
      built: 'construidos', lot: 'terreno', bed: 'Dorm.', bath: 'Baños', m2: 'm²',
      foot_explore: 'Explorar', foot_company: 'Empresa', foot_legal: 'Legal',
    },
    en: {
      nav_buy: 'Buy', nav_rent: 'Rent', nav_sell: 'Sell', nav_contact: 'Contact',
      publish: 'List a property',
      hero_h1: 'Find your next property in ' + CFG.city,
      hero_p: 'Houses and apartments for sale in the best areas of ' + CFG.region + '. Filter, compare and contact directly.',
      f_op: 'Operation', f_type: 'Type', f_loc: 'Location / area', search: 'Search',
      stat_props: 'properties', stat_sectors: 'areas', stat_uf: 'from',
      filters: 'Filters', clear: 'Clear', price: 'Price (UF)', beds: 'Bedrooms', baths: 'Bathrooms', ptype: 'Property type', sector: 'Area',
      results_of: 'properties in', sort: 'Sort by',
      sort_rel: 'Relevance', sort_lo: 'Lowest price', sort_hi: 'Highest price', sort_area: 'Largest area',
      any: 'Any', keyword: 'Search by keyword (area, complex…)',
      empty_h: 'No results', empty_p: 'Adjust the filters to see more properties.',
      detail_features: 'Features', detail_about: 'Description', detail_loc: 'Approximate location',
      wa: 'Contact via WhatsApp', call: 'Call', ref_photo: 'Reference photo',
      built: 'built', lot: 'lot', bed: 'Bed', bath: 'Bath', m2: 'm²',
      foot_explore: 'Explore', foot_company: 'Company', foot_legal: 'Legal',
    }
  };
  var lang = 'es';
  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.es[k] || k; }

  /* ---- State --------------------------------------------------------------- */
  var state = {
    q: '', operacion: '', tipo: '', precio: '', dorm: '', banos: '', sector: '', sort: 'rel'
  };

  /* ---- Helpers ------------------------------------------------------------- */
  function fmtUF(n) { return 'UF ' + n.toLocaleString('es-CL'); }
  function clpOf(l) { return l.priceClpOverride || Math.round(l.priceUF * CFG.ufToClp); }
  function fmtCLP(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 0 }) + ' millones';
    return '$' + n.toLocaleString('es-CL');
  }
  function sectorLabel(key) {
    var s = FACETS.sector.find(function (x) { return x.key === key; });
    return s ? s.label : key;
  }
  // Brand-styled placeholder backgrounds keyed by sector (no third-party photos).
  var GRADIENTS = {
    'avenida-del-mar': 'linear-gradient(135deg,#0a4d8c,#0792c9)',
    'laguna-del-mar': 'linear-gradient(135deg,#0b6e8c,#16a6b8)',
    'san-joaquin': 'linear-gradient(135deg,#14306b,#2a5fa8)',
    'el-milagro': 'linear-gradient(135deg,#243b73,#3a63b0)',
    'serena-golf': 'linear-gradient(135deg,#1d6b3f,#3a9d63)',
    'cerro-grande': 'linear-gradient(135deg,#5a3a1f,#a06a36)',
    'la-pampa': 'linear-gradient(135deg,#7a5a2a,#b8893f)',
    'la-antena': 'linear-gradient(135deg,#3a4a6b,#5a72a8)',
    'centro': 'linear-gradient(135deg,#5a2a4a,#a0466f)',
    'valle-elqui': 'linear-gradient(135deg,#3a6b2a,#7ba046)',
    'otros': 'linear-gradient(135deg,#14306b,#2a5fa8)'
  };
  function glyph(tipo) { return tipo === 'casa' ? '🏡' : '🏢'; }
  function bg(l) { return GRADIENTS[l.sector] || GRADIENTS.otros; }

  /* ---- Filtering + sorting ------------------------------------------------- */
  function precioRange() {
    if (!state.precio) return null;
    return FACETS.precioUF.find(function (p) { return p.key === state.precio; });
  }
  function matches(l) {
    if (state.operacion && l.operacion !== state.operacion) return false;
    if (state.tipo && l.tipo !== state.tipo) return false;
    if (state.sector && l.sector !== state.sector) return false;
    if (state.dorm) { var d = parseInt(state.dorm, 10); if (state.dorm === '4' ? l.beds < 4 : l.beds !== d) return false; }
    if (state.banos) { var b = parseInt(state.banos, 10); if (state.banos === '3' ? l.baths < 3 : l.baths !== b) return false; }
    var pr = precioRange();
    if (pr && (l.priceUF < pr.min || l.priceUF >= pr.max)) return false;
    if (state.q) {
      var hay = (l.title + ' ' + l.address + ' ' + sectorLabel(l.sector) + ' ' + (l.tags || []).join(' ')).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }
  function sortFn(a, b) {
    if (state.sort === 'lo') return a.priceUF - b.priceUF;
    if (state.sort === 'hi') return b.priceUF - a.priceUF;
    if (state.sort === 'area') return (b.builtM2 || 0) - (a.builtM2 || 0);
    // relevance: featured first, then larger
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.builtM2 || 0) - (a.builtM2 || 0);
  }
  function current() { return LISTINGS.filter(matches).sort(sortFn); }

  /* ---- Render: cards ------------------------------------------------------- */
  function cardHTML(l) {
    var typeLabel = l.tipo === 'casa' ? (lang === 'en' ? 'House' : 'Casa') : (lang === 'en' ? 'Apt' : 'Depto');
    return '' +
      '<article class="card" data-id="' + l.id + '" tabindex="0">' +
        '<div class="photo" style="background:' + bg(l) + '">' +
          '<span class="badge-type">' + typeLabel + '</span>' +
          (l.featured ? '<span class="badge-featured">★ Destacada</span>' : '') +
          '<span class="glyph">' + glyph(l.tipo) + '</span>' +
          '<span class="ref">' + t('ref_photo') + '</span>' +
        '</div>' +
        '<div class="body">' +
          '<div class="price">' + fmtUF(l.priceUF) + '<span class="clp">≈ ' + fmtCLP(clpOf(l)) + '</span></div>' +
          '<div class="title">' + esc(l.title) + '</div>' +
          '<div class="loc">📍 ' + esc(sectorLabel(l.sector)) + ' · ' + CFG.city + '</div>' +
          '<div class="specs">' +
            '<span><i>🛏</i> ' + l.beds + ' ' + t('bed') + '</span>' +
            '<span><i>🛁</i> ' + l.baths + ' ' + t('bath') + '</span>' +
            '<span><i>📐</i> ' + l.builtM2 + ' ' + t('m2') + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }
  function render() {
    var list = current();
    var grid = document.getElementById('grid');
    var head = document.getElementById('count');
    head.innerHTML = '<b>' + list.length + '</b> ' + t('results_of') + ' ' + CFG.city;
    if (!list.length) {
      grid.style.display = 'block';
      grid.innerHTML = '<div class="empty"><div class="big">🔍</div><h3>' + t('empty_h') + '</h3><p>' + t('empty_p') + '</p></div>';
      return;
    }
    grid.style.display = 'grid';
    grid.innerHTML = list.map(cardHTML).join('');
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  /* ---- Render: detail modal ------------------------------------------------ */
  function openDetail(id) {
    var l = LISTINGS.find(function (x) { return x.id === id; });
    if (!l) return;
    var wa = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent('Hola, me interesa la propiedad: ' + l.title + ' (' + fmtUF(l.priceUF) + ')');
    var specs = '' +
      '<div class="m-spec"><b>' + l.beds + '</b><span>' + (lang === 'en' ? 'Bedrooms' : 'Dormitorios') + '</span></div>' +
      '<div class="m-spec"><b>' + l.baths + '</b><span>' + (lang === 'en' ? 'Bathrooms' : 'Baños') + '</span></div>' +
      '<div class="m-spec"><b>' + l.builtM2 + '</b><span>' + t('m2') + ' ' + t('built') + '</span></div>' +
      (l.lotM2 ? '<div class="m-spec"><b>' + l.lotM2.toLocaleString('es-CL') + '</b><span>' + t('m2') + ' ' + t('lot') + '</span></div>' : '');
    var tags = (l.tags || []).map(function (x) { return '<span class="m-tag">' + esc(x) + '</span>'; }).join('');
    document.getElementById('modal').innerHTML = '' +
      '<div class="hero-img" style="background:' + bg(l) + '">' +
        '<button class="modal-close" id="mClose" aria-label="cerrar">×</button>' +
        '<span class="glyph">' + glyph(l.tipo) + '</span>' +
        '<span class="ref">' + t('ref_photo') + '</span>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="m-price">' + fmtUF(l.priceUF) + '<span class="clp">≈ ' + fmtCLP(clpOf(l)) + '</span></div>' +
        '<h2 class="m-title">' + esc(l.title) + '</h2>' +
        '<div class="m-loc">📍 ' + esc(l.address) + ' · ' + esc(sectorLabel(l.sector)) + '</div>' +
        '<div class="m-specs">' + specs + '</div>' +
        '<h3 class="m-section-title">' + t('detail_about') + '</h3>' +
        '<p class="m-desc">' + esc(l.desc) + '</p>' +
        (tags ? '<h3 class="m-section-title">' + t('detail_features') + '</h3><div class="m-tags">' + tags + '</div>' : '') +
        '<h3 class="m-section-title">' + t('detail_loc') + '</h3>' +
        '<div class="map-stub">🗺️ ' + esc(sectorLabel(l.sector)) + ', ' + CFG.city + ' — ' + (lang === 'en' ? 'map placeholder' : 'mapa referencial') + '</div>' +
        '<div class="m-cta">' +
          '<a class="btn btn-wa" href="' + wa + '" target="_blank" rel="noopener">🟢 ' + t('wa') + '</a>' +
          '<a class="btn btn-call" href="tel:' + CFG.phone.replace(/\s/g, '') + '">📞 ' + t('call') + '</a>' +
        '</div>' +
      '</div>';
    document.getElementById('overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('mClose').addEventListener('click', closeDetail);
  }
  function closeDetail() {
    document.getElementById('overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---- Build filter UI ----------------------------------------------------- */
  function chipRow(facetKey, items, stateKey) {
    return '<div class="chip-row">' + items.map(function (it) {
      var label = it.label || it[stateKey] || it.label_es;
      return '<button class="chip" data-facet="' + stateKey + '" data-val="' + it.key + '">' + label + '</button>';
    }).join('') + '</div>';
  }
  function buildFilters() {
    var el = document.getElementById('filters');
    var priceOpts = FACETS.precioUF.map(function (p) {
      return '<label class="opt"><input type="radio" name="precio" value="' + p.key + '">' +
        '<span>' + (lang === 'en' ? p.label_en : p.label_es) + '</span></label>';
    }).join('');
    var sectorOpts = FACETS.sector.map(function (s) {
      var n = LISTINGS.filter(function (l) { return l.sector === s.key; }).length;
      if (!n) return '';
      return '<label class="opt"><input type="radio" name="sector" value="' + s.key + '"><span>' + s.label + '</span><span class="count">' + n + '</span></label>';
    }).join('');
    el.innerHTML = '' +
      '<h3>' + t('filters') + '<button class="clear" id="clearAll">' + t('clear') + '</button></h3>' +
      '<div class="filter-group"><h4>' + t('ptype') + '</h4>' + chipRow('tipo', FACETS.tipo.map(function (x) { return { key: x.key, label: lang === 'en' ? x.label_en : x.label_es }; }), 'tipo') + '</div>' +
      '<div class="filter-group"><h4>' + t('beds') + '</h4>' + chipRow('dorm', FACETS.dormitorios, 'dorm') + '</div>' +
      '<div class="filter-group"><h4>' + t('baths') + '</h4>' + chipRow('banos', FACETS.banos, 'banos') + '</div>' +
      '<div class="filter-group"><h4>' + t('price') + '</h4><div class="opt-list">' + priceOpts + '</div></div>' +
      '<div class="filter-group"><h4>' + t('sector') + '</h4><div class="opt-list">' + sectorOpts + '</div></div>';

    // wire chips
    el.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-facet'), v = c.getAttribute('data-val');
        if (state[f] === v) { state[f] = ''; c.classList.remove('active'); }
        else {
          el.querySelectorAll('.chip[data-facet="' + f + '"]').forEach(function (x) { x.classList.remove('active'); });
          state[f] = v; c.classList.add('active');
        }
        render();
      });
    });
    // wire radios (price + sector)
    el.querySelectorAll('input[name="precio"]').forEach(function (r) {
      r.addEventListener('change', function () { state.precio = r.value; render(); });
    });
    el.querySelectorAll('input[name="sector"]').forEach(function (r) {
      r.addEventListener('change', function () { state.sector = r.value; render(); });
    });
    document.getElementById('clearAll').addEventListener('click', function () {
      state = { q: '', operacion: '', tipo: '', precio: '', dorm: '', banos: '', sector: '', sort: state.sort };
      document.getElementById('q').value = '';
      document.getElementById('heroType').value = '';
      document.getElementById('heroSector').value = '';
      buildFilters(); render();
    });
  }

  /* ---- Static chrome (labels, hero, footer) -------------------------------- */
  function applyChrome() {
    document.documentElement.lang = lang;
    document.title = CFG.brandName + ' — ' + CFG.tagline;
    set('brandName', CFG.brandName);
    set('navBuy', t('nav_buy')); set('navRent', t('nav_rent')); set('navSell', t('nav_sell')); set('navContact', t('nav_contact'));
    set('btnPublish', t('publish'));
    set('heroH1', t('hero_h1')); set('heroP', t('hero_p'));
    set('lblType', t('f_type')); set('lblSector', t('f_loc')); set('lblKeyword', t('f_op'));
    set('btnSearchTxt', t('search'));
    set('sortLbl', t('sort'));
    // hero stats
    set('statProps', LISTINGS.length); set('statPropsLbl', t('stat_props'));
    var sectors = FACETS.sector.filter(function (s) { return LISTINGS.some(function (l) { return l.sector === s.key; }); }).length;
    set('statSectors', sectors); set('statSectorsLbl', t('stat_sectors'));
    var minUF = Math.min.apply(null, LISTINGS.map(function (l) { return l.priceUF; }));
    set('statUFLbl', t('stat_uf')); set('statUF', fmtUF(minUF));
    // sort options
    var ss = document.getElementById('sortSel');
    ss.innerHTML = '<option value="rel">' + t('sort_rel') + '</option><option value="lo">' + t('sort_lo') + '</option>' +
      '<option value="hi">' + t('sort_hi') + '</option><option value="area">' + t('sort_area') + '</option>';
    ss.value = state.sort;
    // hero type select
    var ht = document.getElementById('heroType');
    ht.innerHTML = '<option value="">' + t('any') + '</option>' + FACETS.tipo.map(function (x) {
      return '<option value="' + x.key + '">' + (lang === 'en' ? x.label_en : x.label_es) + '</option>';
    }).join('');
    // hero sector select
    var hs = document.getElementById('heroSector');
    hs.innerHTML = '<option value="">' + t('any') + '</option>' + FACETS.sector.filter(function (s) {
      return LISTINGS.some(function (l) { return l.sector === s.key; });
    }).map(function (s) { return '<option value="' + s.key + '">' + s.label + '</option>'; }).join('');
    document.getElementById('q').placeholder = t('keyword');
    // footer
    set('footExplore', t('foot_explore')); set('footCompany', t('foot_company')); set('footLegal', t('foot_legal'));
    set('footBrand', CFG.brandName); set('poweredBrand', CFG.poweredBy);
    set('yearNow', '2026');
  }
  function set(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }

  /* ---- Init ---------------------------------------------------------------- */
  function init() {
    applyChrome();
    buildFilters();
    render();

    // search bar
    document.getElementById('btnSearch').addEventListener('click', function () {
      state.q = document.getElementById('q').value.trim();
      state.tipo = document.getElementById('heroType').value;
      state.sector = document.getElementById('heroSector').value;
      // reflect into sidebar chips/radios
      buildFilters();
      document.querySelectorAll('.chip[data-facet="tipo"]').forEach(function (c) {
        c.classList.toggle('active', c.getAttribute('data-val') === state.tipo);
      });
      var sr = document.querySelector('input[name="sector"][value="' + state.sector + '"]');
      if (sr) sr.checked = true;
      render();
      document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('q').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btnSearch').click();
    });

    // sort
    document.getElementById('sortSel').addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    // card click (delegated) -> open detail
    document.getElementById('grid').addEventListener('click', function (e) {
      var card = e.target.closest('.card'); if (card) openDetail(card.getAttribute('data-id'));
    });
    document.getElementById('grid').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var card = e.target.closest('.card'); if (card) openDetail(card.getAttribute('data-id')); }
    });

    // modal close on overlay / esc
    document.getElementById('overlay').addEventListener('click', function (e) { if (e.target.id === 'overlay') closeDetail(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDetail(); });

    // lang toggle
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        lang = b.getAttribute('data-lang');
        document.querySelectorAll('.lang-toggle button').forEach(function (x) { x.classList.toggle('active', x === b); });
        applyChrome(); buildFilters(); render();
      });
    });

    // mobile filter toggle
    var ft = document.getElementById('filterToggle');
    if (ft) ft.addEventListener('click', function () { document.getElementById('filters').classList.toggle('open'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

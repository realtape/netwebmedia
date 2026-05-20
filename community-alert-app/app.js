/* ============================================
   Alerta Comunidad - Community Safety Alert App
   Main Application Logic
   ============================================ */

(function () {
  'use strict';

  // ---- Configuration ----
  const CONFIG = {
    REPORT_EXPIRY_HOURS: 4,
    DEFAULT_ZOOM: 13,
    POLL_INTERVAL: 15000,
    API_BASE: '/api',
    DEFAULT_CENTER: [34.0522, -118.2437], // Los Angeles
    ALERT_SOUND_FREQ: 880,
  };

  // ---- i18n ----
  const LANG = {
    en: {
      my_location: 'My Location',
      report: 'Report',
      feed: 'Feed',
      report_title: 'Report Activity',
      report_type_label: 'Type of Activity',
      type_checkpoint: 'Checkpoint',
      type_patrol: 'Patrol',
      type_raid: 'Raid',
      type_agents: 'Agents on Foot',
      type_vehicles: 'Unmarked Vehicles',
      type_other: 'Other',
      description_label: 'Description (optional)',
      location_label: 'Location',
      use_current: 'Use My Location',
      pick_on_map: 'Pick on Map',
      getting_location: 'Getting your location...',
      severity_label: 'How many agents/vehicles?',
      unknown: 'Unknown',
      submit_report: '🚨 Submit Report',
      recent_reports: 'Recent Reports',
      all: 'All',
      last_hour: 'Last Hour',
      today: 'Today',
      no_reports: 'No reports yet. Stay safe!',
      settings: 'Settings',
      alert_radius: 'Alert Radius',
      notifications: 'Push Notifications',
      sound_alerts: 'Sound Alerts',
      know_rights: '📋 Know Your Rights',
      right_1: 'You have the right to remain silent.',
      right_2: 'You do not have to open your door to ICE without a judicial warrant signed by a judge.',
      right_3: 'You have the right to speak with a lawyer.',
      right_4: 'Do not sign anything you do not understand.',
      right_5: 'You can record interactions in public spaces.',
      still_there: 'Is this still active?',
      location_set: '📍 Location set',
      tap_map: 'Tap the map to set location',
      report_submitted: 'Report submitted! Thank you.',
      confirmed: 'Confirmed still active',
      denied: 'Marked as no longer active',
      new_nearby: 'New report nearby!',
      ago_minutes: 'm ago',
      ago_hours: 'h ago',
      just_now: 'Just now',
      confirmations: 'confirmations',
    },
    es: {
      my_location: 'Mi Ubicación',
      report: 'Reportar',
      feed: 'Reportes',
      report_title: 'Reportar Actividad',
      report_type_label: 'Tipo de Actividad',
      type_checkpoint: 'Retén',
      type_patrol: 'Patrulla',
      type_raid: 'Redada',
      type_agents: 'Agentes a Pie',
      type_vehicles: 'Vehículos sin Marcar',
      type_other: 'Otro',
      description_label: 'Descripción (opcional)',
      location_label: 'Ubicación',
      use_current: 'Mi Ubicación',
      pick_on_map: 'Elegir en Mapa',
      getting_location: 'Obteniendo ubicación...',
      severity_label: '¿Cuántos agentes/vehículos?',
      unknown: 'No sé',
      submit_report: '🚨 Enviar Reporte',
      recent_reports: 'Reportes Recientes',
      all: 'Todos',
      last_hour: 'Última Hora',
      today: 'Hoy',
      no_reports: 'No hay reportes. ¡Mantente seguro/a!',
      settings: 'Configuración',
      alert_radius: 'Radio de Alerta',
      notifications: 'Notificaciones',
      sound_alerts: 'Sonido de Alertas',
      know_rights: '📋 Conoce Tus Derechos',
      right_1: 'Tienes derecho a guardar silencio.',
      right_2: 'No tienes que abrir la puerta a ICE sin una orden judicial firmada por un juez.',
      right_3: 'Tienes derecho a hablar con un abogado.',
      right_4: 'No firmes nada que no entiendas.',
      right_5: 'Puedes grabar interacciones en espacios públicos.',
      still_there: '¿Sigue activo?',
      location_set: '📍 Ubicación establecida',
      tap_map: 'Toca el mapa para establecer ubicación',
      report_submitted: '¡Reporte enviado! Gracias.',
      confirmed: 'Confirmado como activo',
      denied: 'Marcado como inactivo',
      new_nearby: '¡Nuevo reporte cercano!',
      ago_minutes: 'min',
      ago_hours: 'h',
      just_now: 'Ahora',
      confirmations: 'confirmaciones',
    },
  };

  // ---- State ----
  const state = {
    lang: localStorage.getItem('alerta_lang') || 'en',
    map: null,
    userPos: null,
    userMarker: null,
    reports: [],
    markers: {},
    alertRadius: parseInt(localStorage.getItem('alerta_radius') || '3'),
    soundEnabled: localStorage.getItem('alerta_sound') !== 'false',
    pickingLocation: false,
    pickedLatLng: null,
    selectedReportId: null,
    watchId: null,
  };

  // ---- Type Config ----
  const TYPES = {
    checkpoint: { icon: '🚧', color: '#e63946', label: 'type_checkpoint' },
    patrol: { icon: '🚔', color: '#457b9d', label: 'type_patrol' },
    raid: { icon: '🚨', color: '#c1121f', label: 'type_raid' },
    agents: { icon: '👤', color: '#f4a261', label: 'type_agents' },
    vehicles: { icon: '🚐', color: '#6c757d', label: 'type_vehicles' },
    other: { icon: '❓', color: '#2a9d8f', label: 'type_other' },
  };

  // ---- Utility Functions ----
  function t(key) {
    return LANG[state.lang][key] || LANG.en[key] || key;
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('just_now');
    if (mins < 60) return mins + t('ago_minutes');
    const hours = Math.floor(mins / 60);
    return hours + t('ago_hours');
  }

  function distanceMiles(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function isExpired(report) {
    return (Date.now() - report.timestamp) > CONFIG.REPORT_EXPIRY_HOURS * 3600000;
  }

  function playAlertSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = CONFIG.ALERT_SOUND_FREQ;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
  }

  // ---- Local Storage Persistence ----
  function saveReports() {
    localStorage.setItem('alerta_reports', JSON.stringify(state.reports));
  }

  function loadReports() {
    try {
      const stored = JSON.parse(localStorage.getItem('alerta_reports') || '[]');
      state.reports = stored.filter(r => !isExpired(r));
      saveReports();
    } catch (e) {
      state.reports = [];
    }
  }

  // ---- API Functions ----
  async function fetchReports() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/reports`);
      if (res.ok) {
        const serverReports = await res.json();
        // Merge with local
        const localIds = new Set(state.reports.map(r => r.id));
        for (const sr of serverReports) {
          if (!localIds.has(sr.id) && !isExpired(sr)) {
            state.reports.push(sr);
            checkProximityAlert(sr);
          }
        }
        saveReports();
        renderMarkers();
        updateActiveCount();
      }
    } catch (e) {
      // Offline mode — use local data only
    }
  }

  async function submitReport(report) {
    state.reports.push(report);
    saveReports();
    renderMarkers();
    updateActiveCount();

    try {
      await fetch(`${CONFIG.API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (e) {
      // Saved locally, will sync later
    }
  }

  async function confirmReport(id, confirmed) {
    const report = state.reports.find(r => r.id === id);
    if (!report) return;

    if (confirmed) {
      report.confirmations = (report.confirmations || 0) + 1;
      report.lastConfirmed = Date.now();
    } else {
      report.denials = (report.denials || 0) + 1;
      if (report.denials >= 3) {
        report.expired = true;
      }
    }
    saveReports();
    renderMarkers();

    try {
      await fetch(`${CONFIG.API_BASE}/reports/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed }),
      });
    } catch (e) { /* offline */ }
  }

  // ---- Map Setup ----
  function initMap() {
    state.map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView(CONFIG.DEFAULT_CENTER, CONFIG.DEFAULT_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(state.map);

    // Attribution (required)
    L.control.attribution({
      position: 'bottomleft',
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>')
      .addTo(state.map);

    state.map.on('click', onMapClick);
  }

  function createReportMarker(report) {
    const typeConfig = TYPES[report.type] || TYPES.other;
    const isActive = !isExpired(report) && !report.expired;

    const markerHtml = `
      <div class="custom-marker">
        ${isActive ? '<div class="marker-pulse"></div>' : ''}
        <div class="marker-pin marker-${report.type}" style="opacity: ${isActive ? 1 : 0.5}">
          <span class="marker-icon">${typeConfig.icon}</span>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: markerHtml,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42],
    });

    const marker = L.marker([report.lat, report.lng], { icon }).addTo(state.map);

    const popupHtml = `
      <div class="popup-content">
        <div class="popup-type">
          <span>${typeConfig.icon}</span>
          <span>${t(typeConfig.label)}</span>
        </div>
        <div class="popup-time">${timeAgo(report.timestamp)}</div>
        ${report.description ? `<div class="popup-desc">${escapeHtml(report.description)}</div>` : ''}
        <div class="popup-meta">
          <span>${report.severity || ''}</span>
          <span class="popup-confirms">✅ ${report.confirmations || 0} ${t('confirmations')}</span>
        </div>
        ${isActive ? `
        <div class="popup-actions">
          <button class="popup-action-btn confirm" onclick="window._confirmReport('${report.id}', true)">✅ Still Here</button>
          <button class="popup-action-btn deny" onclick="window._confirmReport('${report.id}', false)">❌ Gone</button>
        </div>
        ` : ''}
      </div>
    `;

    marker.bindPopup(popupHtml, { className: 'report-popup', maxWidth: 280 });
    return marker;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMarkers() {
    // Clear existing
    Object.values(state.markers).forEach(m => state.map.removeLayer(m));
    state.markers = {};

    // Add active reports
    state.reports.forEach(report => {
      if (!report.expired) {
        state.markers[report.id] = createReportMarker(report);
      }
    });
  }

  function updateActiveCount() {
    const active = state.reports.filter(r => !isExpired(r) && !r.expired).length;
    $('#activeCount').textContent = active;
  }

  // ---- Geolocation ----
  function initGeolocation() {
    if (!navigator.geolocation) return;

    state.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        state.userPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        if (!state.userMarker) {
          const icon = L.divIcon({
            html: '<div class="user-marker-pulse"></div><div class="user-marker"></div>',
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          state.userMarker = L.marker([state.userPos.lat, state.userPos.lng], { icon, zIndexOffset: 1000 }).addTo(state.map);
          state.map.setView([state.userPos.lat, state.userPos.lng], CONFIG.DEFAULT_ZOOM);
        } else {
          state.userMarker.setLatLng([state.userPos.lat, state.userPos.lng]);
        }
      },
      (err) => {
        console.log('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }

  // ---- Proximity Alerts ----
  function checkProximityAlert(report) {
    if (!state.userPos) return;
    const dist = distanceMiles(state.userPos.lat, state.userPos.lng, report.lat, report.lng);

    if (dist <= state.alertRadius) {
      showAlertBanner(report, dist);
      playAlertSound();
      sendNotification(report, dist);
    }
  }

  function showAlertBanner(report, dist) {
    const typeConfig = TYPES[report.type] || TYPES.other;
    $('#alertBannerTitle').textContent = `${typeConfig.icon} ${t(typeConfig.label)} - ${dist.toFixed(1)} mi`;
    $('#alertBannerDesc').textContent = report.description || t('new_nearby');
    $('#alertBanner').classList.remove('hidden');

    // Auto-hide after 10s
    setTimeout(() => {
      $('#alertBanner').classList.add('hidden');
    }, 10000);
  }

  function sendNotification(report, dist) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const typeConfig = TYPES[report.type] || TYPES.other;
    new Notification('⚠️ Alerta Comunidad', {
      body: `${t(typeConfig.label)} reported ${dist.toFixed(1)} miles away`,
      icon: '🛡️',
      tag: report.id,
    });
  }

  // ---- Event Handlers ----
  function onMapClick(e) {
    if (!state.pickingLocation) return;
    state.pickedLatLng = e.latlng;
    $('#locationText').textContent = `${t('location_set')} (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`;

    // Show a temporary marker
    if (state.pickMarker) state.map.removeLayer(state.pickMarker);
    state.pickMarker = L.circleMarker(e.latlng, {
      radius: 10,
      color: '#e63946',
      fillColor: '#e63946',
      fillOpacity: 0.5,
    }).addTo(state.map);
  }

  function setupEventListeners() {
    // Report button
    $('#btnReport').addEventListener('click', () => {
      $('#reportModal').classList.remove('hidden');
      if (state.userPos) {
        $('#locationText').textContent = `${t('location_set')} (${state.userPos.lat.toFixed(4)}, ${state.userPos.lng.toFixed(4)})`;
      }
    });

    // Close report modal
    $('#reportModalClose').addEventListener('click', closeReportModal);
    $('#reportModal .modal-overlay').addEventListener('click', closeReportModal);

    // Location toggle
    $('#locCurrent').addEventListener('click', () => {
      $('#locCurrent').classList.add('active');
      $('#locMap').classList.remove('active');
      state.pickingLocation = false;
      if (state.pickMarker) {
        state.map.removeLayer(state.pickMarker);
        state.pickMarker = null;
      }
      state.pickedLatLng = null;
      if (state.userPos) {
        $('#locationText').textContent = `${t('location_set')} (${state.userPos.lat.toFixed(4)}, ${state.userPos.lng.toFixed(4)})`;
      }
    });

    $('#locMap').addEventListener('click', () => {
      $('#locMap').classList.add('active');
      $('#locCurrent').classList.remove('active');
      state.pickingLocation = true;
      $('#locationText').textContent = t('tap_map');
      closeReportModal();
      // Show pick mode overlay
      const overlay = document.createElement('div');
      overlay.className = 'pick-mode-overlay';
      overlay.id = 'pickOverlay';
      overlay.textContent = t('tap_map');
      document.getElementById('app').appendChild(overlay);

      // Listen for map click then reopen modal
      state.map.once('click', (e) => {
        onMapClick(e);
        const ov = document.getElementById('pickOverlay');
        if (ov) ov.remove();
        setTimeout(() => {
          $('#reportModal').classList.remove('hidden');
        }, 300);
      });
    });

    // Severity buttons
    $$('.sev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.sev-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Submit report
    $('#reportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const typeEl = document.querySelector('input[name="reportType"]:checked');
      if (!typeEl) return;

      const lat = state.pickedLatLng ? state.pickedLatLng.lat :
        (state.userPos ? state.userPos.lat : CONFIG.DEFAULT_CENTER[0]);
      const lng = state.pickedLatLng ? state.pickedLatLng.lng :
        (state.userPos ? state.userPos.lng : CONFIG.DEFAULT_CENTER[1]);

      const severity = document.querySelector('.sev-btn.active')?.dataset.severity || 'unknown';

      const report = {
        id: generateId(),
        type: typeEl.value,
        description: $('#reportDesc').value.trim(),
        lat,
        lng,
        severity,
        timestamp: Date.now(),
        confirmations: 0,
        denials: 0,
      };

      submitReport(report);
      closeReportModal();
      showToast(t('report_submitted'));

      // Reset form
      $('#reportForm').reset();
      $$('.sev-btn').forEach(b => b.classList.remove('active'));
      $$('.sev-btn')[0].classList.add('active');

      // Fly to report location
      state.map.flyTo([lat, lng], 15, { duration: 1 });
    });

    // Feed
    $('#btnFeed').addEventListener('click', () => {
      $('#feedPanel').classList.toggle('hidden');
      $('#settingsPanel').classList.add('hidden');
      renderFeed('all');
    });

    $('#feedClose').addEventListener('click', () => {
      $('#feedPanel').classList.add('hidden');
    });

    // Feed filters
    $$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFeed(btn.dataset.filter);
      });
    });

    // Recenter
    $('#btnRecenter').addEventListener('click', () => {
      if (state.userPos) {
        state.map.flyTo([state.userPos.lat, state.userPos.lng], CONFIG.DEFAULT_ZOOM, { duration: 0.8 });
      }
    });

    // Settings
    $('#btnSettings').addEventListener('click', () => {
      $('#settingsPanel').classList.toggle('hidden');
      $('#feedPanel').classList.add('hidden');
    });

    $('#settingsClose').addEventListener('click', () => {
      $('#settingsPanel').classList.add('hidden');
    });

    // Alert radius
    $('#alertRadius').value = state.alertRadius;
    $('#alertRadius').addEventListener('change', (e) => {
      state.alertRadius = parseInt(e.target.value);
      localStorage.setItem('alerta_radius', state.alertRadius);
    });

    // Sound toggle
    const soundBtn = $('#toggleSound');
    soundBtn.textContent = state.soundEnabled ? 'On' : 'Off';
    soundBtn.classList.toggle('active', state.soundEnabled);
    soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('alerta_sound', state.soundEnabled);
      soundBtn.textContent = state.soundEnabled ? 'On' : 'Off';
      soundBtn.classList.toggle('active', state.soundEnabled);
    });

    // Notifications
    $('#toggleNotif').addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          const btn = $('#toggleNotif');
          if (perm === 'granted') {
            btn.textContent = 'Enabled';
            btn.classList.add('active');
          }
        });
      }
    });

    // Alert banner close
    $('#alertBannerClose').addEventListener('click', () => {
      $('#alertBanner').classList.add('hidden');
    });

    // Language toggle
    $('#btnLang').addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'es' : 'en';
      localStorage.setItem('alerta_lang', state.lang);
      applyLanguage();
    });
  }

  function closeReportModal() {
    $('#reportModal').classList.add('hidden');
    if (state.pickMarker) {
      state.map.removeLayer(state.pickMarker);
      state.pickMarker = null;
    }
  }

  // ---- Feed Rendering ----
  function renderFeed(filter) {
    const feedList = $('#feedList');
    let reports = [...state.reports].filter(r => !r.expired).sort((a, b) => b.timestamp - a.timestamp);

    if (filter === '1h') {
      reports = reports.filter(r => (Date.now() - r.timestamp) < 3600000);
    } else if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      reports = reports.filter(r => r.timestamp >= startOfDay.getTime());
    }

    if (reports.length === 0) {
      feedList.innerHTML = `<div class="feed-empty">${t('no_reports')}</div>`;
      return;
    }

    feedList.innerHTML = reports.map(report => {
      const typeConfig = TYPES[report.type] || TYPES.other;
      const active = !isExpired(report);
      const dist = state.userPos ?
        distanceMiles(state.userPos.lat, state.userPos.lng, report.lat, report.lng).toFixed(1) + ' mi' : '';

      return `
        <div class="feed-item" data-id="${report.id}">
          <div class="feed-item-icon" style="background: ${typeConfig.color}20; color: ${typeConfig.color}">
            ${typeConfig.icon}
          </div>
          <div class="feed-item-body">
            <div class="feed-item-title">${t(typeConfig.label)}</div>
            <div class="feed-item-desc">${escapeHtml(report.description || '')}</div>
            <div class="feed-item-time">${timeAgo(report.timestamp)} ${dist ? '• ' + dist : ''}</div>
          </div>
          <span class="feed-item-badge ${active ? 'badge-active' : 'badge-expired'}">
            ${active ? 'ACTIVE' : 'EXPIRED'}
          </span>
        </div>
      `;
    }).join('');

    // Click to fly to location
    feedList.querySelectorAll('.feed-item').forEach(item => {
      item.addEventListener('click', () => {
        const report = state.reports.find(r => r.id === item.dataset.id);
        if (report) {
          state.map.flyTo([report.lat, report.lng], 16, { duration: 1 });
          $('#feedPanel').classList.add('hidden');
          if (state.markers[report.id]) {
            state.markers[report.id].openPopup();
          }
        }
      });
    });
  }

  // ---- Toast ----
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: #1d3557;
      color: white;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 600;
      z-index: 3000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Language ----
  function applyLanguage() {
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (LANG[state.lang][key]) {
        el.textContent = LANG[state.lang][key];
      }
    });
  }

  // ---- Global handlers (for popup buttons) ----
  window._confirmReport = function (id, confirmed) {
    confirmReport(id, confirmed);
    state.map.closePopup();
    showToast(confirmed ? t('confirmed') : t('denied'));
  };

  // ---- Demo Data (for testing) ----
  function addDemoData() {
    if (state.reports.length > 0) return;
    const center = state.userPos || { lat: CONFIG.DEFAULT_CENTER[0], lng: CONFIG.DEFAULT_CENTER[1] };

    const demoReports = [
      {
        id: generateId(),
        type: 'checkpoint',
        description: 'Checkpoint near intersection, 3 vehicles blocking road',
        lat: center.lat + 0.008,
        lng: center.lng - 0.005,
        severity: 'some',
        timestamp: Date.now() - 1800000,
        confirmations: 4,
        denials: 0,
      },
      {
        id: generateId(),
        type: 'patrol',
        description: 'Patrol car circling the neighborhood',
        lat: center.lat - 0.012,
        lng: center.lng + 0.008,
        severity: 'few',
        timestamp: Date.now() - 3600000,
        confirmations: 2,
        denials: 0,
      },
      {
        id: generateId(),
        type: 'agents',
        description: 'Two agents on foot near the grocery store / Dos agentes cerca de la tienda',
        lat: center.lat + 0.004,
        lng: center.lng + 0.012,
        severity: 'few',
        timestamp: Date.now() - 900000,
        confirmations: 6,
        denials: 0,
      },
      {
        id: generateId(),
        type: 'vehicles',
        description: 'Unmarked white van parked outside apartment complex',
        lat: center.lat - 0.006,
        lng: center.lng - 0.015,
        severity: 'few',
        timestamp: Date.now() - 7200000,
        confirmations: 1,
        denials: 0,
      },
    ];

    state.reports = demoReports;
    saveReports();
  }

  // ---- Initialization ----
  function init() {
    // Splash screen
    setTimeout(() => {
      const splash = $('#splash');
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.classList.add('hidden');
        $('#app').classList.remove('hidden');
        initMap();
        initGeolocation();
        loadReports();
        addDemoData();
        renderMarkers();
        updateActiveCount();
        setupEventListeners();
        applyLanguage();

        // Poll for updates
        setInterval(() => {
          fetchReports();
          // Refresh markers to update time displays
          renderMarkers();
          updateActiveCount();
        }, CONFIG.POLL_INTERVAL);
      }, 600);
    }, 1500);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

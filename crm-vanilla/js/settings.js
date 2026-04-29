/* Settings Page Logic */
(function () {
  "use strict";

  var API_BASE = 'api/?r=settings';
  var L;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function apiFetch(url, options) {
    return fetch(url, options).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (body) {
          throw new Error(body.error || ('HTTP ' + res.status));
        });
      }
      return res.json();
    });
  }

  function showSaved(btn) {
    var original = btn.textContent;
    btn.textContent = L.saved;
    btn.classList.add('saved');
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('saved');
      btn.disabled = false;
    }, 2000);
  }

  function showError(btn, msg) {
    var original = btn.textContent;
    btn.textContent = L.error;
    btn.classList.add('btn-danger');
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('btn-danger');
      btn.disabled = false;
    }, 3000);
    if (window.console) console.error('[settings] ' + msg);
  }

  // ─── Field population ───────────────────────────────────────────────────────

  /**
   * Populate a single field. Tries name= first, then id=.
   */
  function setField(nameOrId, value) {
    var el = document.querySelector('[name="' + nameOrId + '"]') ||
             document.getElementById(nameOrId);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = (value === '1' || value === true || value === 1);
    } else {
      el.value = value;
    }
  }

  function populateForm(settings) {
    // General tab — inputs have no name attributes in the current HTML,
    // so we target by panel + position as a fallback.
    var generalInputs = document.querySelectorAll('#tab-general .form-input');
    if (generalInputs.length > 0 && settings.company_name !== undefined) {
      generalInputs[0].value = settings.company_name;
    }

    // Named fields (future-proof: will work once name= attrs are added)
    var namedMap = {
      'company_name'    : settings.company_name,
      'company_email'   : settings.company_email,
      'company_phone'   : settings.company_phone,
      'company_website' : settings.company_website,
      'timezone'        : settings.timezone,
      'language'        : settings.language,
    };
    for (var key in namedMap) {
      if (namedMap.hasOwnProperty(key)) {
        setField(key, namedMap[key]);
      }
    }

    // Niche — read from the logged-in user object (stored on users table, not org_settings)
    var nicheSelect = document.getElementById('nicheSelect');
    if (nicheSelect && window.CRM_APP && CRM_APP.getUser) {
      var u = CRM_APP.getUser();
      if (u && u.niche) nicheSelect.value = u.niche;
    }

    // Notification toggles — ordered as they appear in #tab-notifications
    var toggleOrder = [
      'email_notifications',
      'push_notifications',
      'deal_closed',
      'weekly_digest',
      'new_contact',
      'task_reminders',
    ];
    var notifToggles = document.querySelectorAll('#tab-notifications .toggle-switch input[type="checkbox"]');
    for (var i = 0; i < notifToggles.length; i++) {
      var tKey = toggleOrder[i];
      if (!tKey) break;
      // Try named attribute first; fall back to positional
      var namedToggle = document.querySelector('#tab-notifications [name="' + tKey + '"]');
      if (namedToggle) {
        namedToggle.checked = (settings[tKey] === '1' || settings[tKey] === true);
      } else {
        // Use positional — only for keys we store
        if (tKey === 'email_notifications' && settings.email_notifications !== undefined) {
          notifToggles[i].checked = (settings.email_notifications === '1');
        }
        // push_notifications, deal_closed, weekly_digest, new_contact, task_reminders
        // are not in the API schema yet; leave the HTML defaults intact
      }
    }
  }

  // ─── Team rendering ─────────────────────────────────────────────────────────

  function renderTeamMembers(team) {
    var container = document.getElementById('teamList');
    if (!container) return;

    if (!team || team.length === 0) {
      container.innerHTML = '<p class="section-desc">' + L.noTeam + '</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < team.length; i++) {
      var m = team[i];
      var statusClass = m.status === 'active' ? 'status-customer' : 'status-lead';
      var statusLabel = m.status
        ? m.status.charAt(0).toUpperCase() + m.status.slice(1)
        : '';

      // i18n helpers if available
      var T = (window.CRM_APP && CRM_APP.t) ? CRM_APP.t : function (k) { return k; };
      if (m.status === 'active') {
        var activeLabel = T('common.active');
        if (activeLabel !== 'common.active') statusLabel = activeLabel;
      }
      if (m.status === 'invited') {
        statusLabel = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es')
          ? 'Invitado' : 'Invited';
      }

      // Generate initials avatar from name
      var initials = '';
      if (m.name) {
        var parts = m.name.trim().split(/\s+/);
        initials = parts[0].charAt(0).toUpperCase();
        if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
      }

      html += '<div class="team-member">';
      html += '<div class="team-member-left">';
      html += '<div class="contact-avatar small">' + initials + '</div>';
      html += '<div>';
      html += '<div class="td-name">' + (m.name || '') + '</div>';
      html += '<div class="td-email">' + (m.email || '') + '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="team-member-right">';
      html += '<span class="team-role">' + (m.role || '') + '</span>';
      html += '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span>';
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ─── Collect form data ──────────────────────────────────────────────────────

  /**
   * Gather saveable data from the General panel.
   */
  function collectGeneral() {
    var payload = {};
    var inputs = document.querySelectorAll('#tab-general .form-input');

    // Named fields
    var named = document.querySelector('#tab-general [name="company_name"]') ||
                document.querySelector('#tab-general [name="orgName"]');
    if (named) {
      payload.company_name = named.value;
    } else if (inputs.length > 0) {
      // Positional fallback: first text input = company name
      payload.company_name = inputs[0].value;
    }

    var fields = ['company_email', 'company_phone', 'company_website', 'timezone', 'language'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.querySelector('#tab-general [name="' + fields[i] + '"]');
      if (el) payload[fields[i]] = el.value;
    }

    var nicheEl = document.getElementById('nicheSelect');
    if (nicheEl) payload.niche = nicheEl.value;

    return payload;
  }

  /**
   * Gather saveable data from the Notifications panel.
   */
  function collectNotifications() {
    var payload = {};
    var emailToggle = document.querySelector('#tab-notifications [name="email_notifications"]');
    if (emailToggle) {
      payload.email_notifications = emailToggle.checked ? '1' : '0';
    } else {
      // Positional: first toggle = email notifications
      var firstToggle = document.querySelector('#tab-notifications .toggle-switch input[type="checkbox"]');
      if (firstToggle) payload.email_notifications = firstToggle.checked ? '1' : '0';
    }
    return payload;
  }

  // ─── Save buttons ───────────────────────────────────────────────────────────

  function bindSaveButtons() {
    var saveButtons = document.querySelectorAll('.btn-save');
    for (var j = 0; j < saveButtons.length; j++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();

          // Figure out which panel this button belongs to
          var panel = btn.closest
            ? btn.closest('.settings-panel')
            : (function () {
                var el = btn;
                while (el && !el.classList.contains('settings-panel')) el = el.parentElement;
                return el;
              })();

          var panelId = panel ? panel.id : '';
          var payload = {};

          if (panelId === 'tab-general') {
            payload = collectGeneral();
          } else if (panelId === 'tab-notifications') {
            payload = collectNotifications();
          } else if (panelId === 'tab-whitelabel') {
            // White-label fields not stored server-side yet; still show saved
            showSaved(btn);
            return;
          } else if (panelId === 'tab-security') {
            // Password change handled separately; skip for now
            showSaved(btn);
            return;
          } else {
            payload = collectGeneral();
          }

          apiFetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(function () {
            showSaved(btn);
          }).catch(function (err) {
            showError(btn, err.message);
          });
        });
      })(saveButtons[j]);
    }
  }

  // ─── Toggle switches ────────────────────────────────────────────────────────

  function bindToggles() {
    var toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    for (var i = 0; i < toggles.length; i++) {
      (function (toggle) {
        toggle.addEventListener('change', function () {
          var name = toggle.getAttribute('name');
          if (!name) return; // unnamed toggles (security, push, etc.) not persisted yet

          var payload = {};
          payload[name] = toggle.checked ? '1' : '0';

          apiFetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(function (err) {
            // Revert the toggle visually on failure
            toggle.checked = !toggle.checked;
            if (window.console) console.error('[settings toggle] ' + err.message);
          });
        });
      })(toggles[i]);
    }
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────

  function bindTabs() {
    var tabs = document.querySelectorAll('.settings-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var active = document.querySelector('.settings-tab.active');
        if (active) active.classList.remove('active');
        this.classList.add('active');

        var target = this.getAttribute('data-tab');
        var panels = document.querySelectorAll('.settings-panel');
        for (var j = 0; j < panels.length; j++) {
          panels[j].classList.remove('active');
        }
        var targetPanel = document.getElementById('tab-' + target);
        if (targetPanel) targetPanel.classList.add('active');
      });
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      role: 'Rol',
      saved: '¡Guardado!',
      error: 'Error',
      noTeam: 'No hay miembros del equipo.',
    } : {
      role: 'Role',
      saved: 'Saved!',
      error: 'Error',
      noTeam: 'No team members found.',
    };

    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader(
        (window.CRM_APP && CRM_APP.t) ? CRM_APP.t('nav.settings') : 'Settings'
      );
    }

    bindTabs();
    bindToggles();
    bindSaveButtons();

    // Load settings from API and populate form + team list
    apiFetch(API_BASE)
      .then(function (data) {
        populateForm(data);
        renderTeamMembers(data.team || []);
      })
      .catch(function (err) {
        if (window.console) console.error('[settings] Failed to load settings: ' + err.message);
        // Fall back: render empty team list gracefully
        renderTeamMembers([]);
      });
  });

})();

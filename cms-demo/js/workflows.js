/* Workflows admin — live CRUD against /api/workflows */
(function () {
  "use strict";

  var API = window.NWMApi;
  var root;
  var state = { items: [] };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function fmt(n) { return (n || 0).toLocaleString(); }

  function triggerLabel(t) {
    if (!t || !t.type) return 'manual';
    if (t.type === 'form_submission') return 'Form: ' + (t.form_id || 'any');
    if (t.type === 'cron')            return 'Cron: ' + (t.cron || 'scheduled');
    if (t.type === 'deal_stage')      return 'Deal stage: ' + (t.stage || 'any');
    return t.type;
  }

  function badge(status) {
    var cls = status === 'active' ? 'active' : (status === 'paused' ? 'paused' : 'muted');
    return '<span class="status-badge ' + cls + '">' + esc(status || 'draft') + '</span>';
  }

  function summary(items) {
    var active = 0, paused = 0;
    items.forEach(function (w) { w.status === 'active' ? active++ : paused++; });
    return (
      '<div class="summary-card"><div class="sc-label">Total</div><div class="sc-value">' + items.length + '</div></div>' +
      '<div class="summary-card"><div class="sc-label">Active</div><div class="sc-value">' + active + '</div></div>' +
      '<div class="summary-card"><div class="sc-label">Paused</div><div class="sc-value">' + paused + '</div></div>'
    );
  }

  function render() {
    var html = '';
    state.items.forEach(function (w) {
      var d = w.data || {};
      var steps = Array.isArray(d.steps) ? d.steps : [];
      html += '<div class="wf-row" data-id="' + w.id + '">';
      html += '<div class="wf-main">';
      html += '<div class="wf-name">' + esc(w.title) + '</div>';
      html += '<div class="wf-trigger muted">' + esc(triggerLabel(d.trigger)) + '</div>';
      html += '<div class="wf-steps-preview muted" style="font-size:12px;margin-top:4px;">' +
              steps.map(function (s) { return esc(s.action || '?'); }).join(' → ') + '</div>';
      html += '</div>';
      html += '<div class="wf-stats">';
      html += '<div><div class="wfs-value">' + steps.length + '</div><div class="wfs-label">Steps</div></div>';
      html += '</div>';
      html += '<div class="wf-actions">';
      html += badge(w.status);
      html += ' <button class="btn btn-sm" data-act="runs" data-id="' + w.id + '">Runs</button>';
      html += ' <button class="btn btn-sm" data-act="run" data-id="' + w.id + '">Run now</button>';
      html += ' <button class="btn btn-sm" data-act="toggle" data-id="' + w.id + '">' +
              (w.status === 'active' ? 'Pause' : 'Activate') + '</button>';
      html += ' <button class="btn btn-sm" data-act="edit" data-id="' + w.id + '">Edit</button>';
      html += ' <button class="btn btn-sm btn-danger" data-act="del" data-id="' + w.id + '">Delete</button>';
      html += '</div></div>';
    });
    document.getElementById('wfList').innerHTML = html || '<div class="empty">No workflows yet. Click "New Workflow".</div>';
    document.getElementById('summaryCards').innerHTML = summary(state.items);
  }

  function load() {
    return API.wfList().then(function (r) {
      state.items = r.items || [];
      render();
    }).catch(function (e) {
      document.getElementById('wfList').innerHTML = '<div class="empty">Failed to load: ' + esc(e.message) + '</div>';
    });
  }

  /* -------- Modal editor -------- */
  function modal(title, contentHtml, onOpen) {
    var m = document.createElement('div');
    m.className = 'nwm-modal-backdrop';
    m.innerHTML =
      '<div class="nwm-modal">' +
      '  <div class="nwm-modal-head"><h3>' + esc(title) + '</h3><button class="nwm-modal-close">×</button></div>' +
      '  <div class="nwm-modal-body">' + contentHtml + '</div>' +
      '</div>';
    document.body.appendChild(m);
    m.querySelector('.nwm-modal-close').addEventListener('click', function () { m.remove(); });
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    if (onOpen) onOpen(m);
    return m;
  }

  function defaultSteps() {
    return [
      { action: 'log', message: 'Workflow triggered for {{email}}' },
      { action: 'send_email', to: 'submitter', subject: 'Hello {{name}}',
        body: '<p>Thanks for reaching out — we will be in touch shortly.</p>' }
    ];
  }

  function editorHtml(wf) {
    var d = wf ? (wf.data || {}) : {};
    var trig = d.trigger || { type: 'manual' };
    var steps = Array.isArray(d.steps) ? d.steps : defaultSteps();
    return (
      '<label class="lbl">Name<input id="wf-title" class="inp" value="' + esc(wf ? wf.title : 'New Workflow') + '"></label>' +
      '<label class="lbl">Status' +
        '<select id="wf-status" class="inp">' +
          '<option value="active" ' + (!wf || wf.status === 'active' ? 'selected' : '') + '>Active</option>' +
          '<option value="paused" ' + (wf && wf.status === 'paused' ? 'selected' : '') + '>Paused</option>' +
        '</select>' +
      '</label>' +
      '<label class="lbl">Trigger type' +
        '<select id="wf-trigger-type" class="inp">' +
          ['manual','form_submission','newsletter_subscribe','cron','deal_stage'].map(function (t) {
            return '<option value="' + t + '"' + (trig.type === t ? ' selected' : '') + '>' + t + '</option>';
          }).join('') +
        '</select>' +
      '</label>' +
      '<label class="lbl" id="wf-trigger-extra-wrap">Form slug or id' +
        '<input id="wf-trigger-extra" class="inp" value="' + esc(trig.form_id || trig.stage || trig.cron || '') + '">' +
      '</label>' +
      '<label class="lbl">Steps (JSON array)' +
        '<textarea id="wf-steps" class="inp" rows="14" style="font-family:monospace;font-size:12px;">' +
        esc(JSON.stringify(steps, null, 2)) +
        '</textarea>' +
      '</label>' +
      '<div class="muted" style="font-size:12px;margin-top:4px;">' +
      'Available actions: <code>send_email</code> (to, subject, body) · <code>wait</code> (minutes) · ' +
      '<code>webhook</code> (url, payload) · <code>create_deal</code> (title_tpl, value) · ' +
      '<code>tag</code> (tag) · <code>log</code> (message). Use <code>{{var}}</code> for context.' +
      '</div>' +
      '<div class="nwm-modal-foot">' +
        '<button class="btn btn-primary" id="wf-save">Save</button> ' +
        '<button class="btn" id="wf-cancel">Cancel</button>' +
      '</div>'
    );
  }

  function openEditor(wf) {
    var m = modal(wf ? 'Edit: ' + wf.title : 'New Workflow', editorHtml(wf), function (m) {
      var tt = m.querySelector('#wf-trigger-type');
      var te = m.querySelector('#wf-trigger-extra-wrap');
      function syncExtra() {
        var v = tt.value;
        te.style.display = (v === 'manual') ? 'none' : 'block';
        te.querySelector('#wf-trigger-extra').placeholder =
          v === 'form_submission' ? 'form slug (e.g. contact-main)' :
          v === 'cron'            ? 'cron expression (e.g. 0 9 * * *)' :
          v === 'deal_stage'      ? 'stage name (e.g. New Lead)' : '';
      }
      tt.addEventListener('change', syncExtra); syncExtra();

      m.querySelector('#wf-cancel').addEventListener('click', function () { m.remove(); });
      m.querySelector('#wf-save').addEventListener('click', function () {
        var title = m.querySelector('#wf-title').value.trim();
        var status = m.querySelector('#wf-status').value;
        var tType = m.querySelector('#wf-trigger-type').value;
        var tVal  = m.querySelector('#wf-trigger-extra').value.trim();
        var stepsText = m.querySelector('#wf-steps').value;
        var steps;
        try { steps = JSON.parse(stepsText); if (!Array.isArray(steps)) throw new Error('steps must be an array'); }
        catch (e) { alert('Steps JSON invalid: ' + e.message); return; }

        var trigger = { type: tType };
        if (tType === 'form_submission') trigger.form_id = tVal;
        else if (tType === 'cron')       trigger.cron = tVal;
        else if (tType === 'deal_stage') trigger.stage = tVal;

        var payload = { title: title, status: status, data: { trigger: trigger, steps: steps } };
        var p = wf ? API.wfUpdate(wf.id, payload) : API.wfCreate(payload);
        p.then(function () { m.remove(); load(); })
         .catch(function (e) { alert('Save failed: ' + e.message); });
      });
    });
    return m;
  }

  function openRuns(wf) {
    API.wfRuns(wf.id).then(function (r) {
      var html = '';
      if (!r.items || !r.items.length) html = '<div class="empty">No runs yet.</div>';
      r.items.forEach(function (run) {
        html += '<div class="run-row"><div><strong>Run #' + run.id + '</strong> · ' +
                esc(run.status) + ' · step ' + run.step_index + ' · ' + esc(run.created_at) + '</div>';
        if (run.error) html += '<div class="err">' + esc(run.error) + '</div>';
        if (run.logs && run.logs.length) {
          html += '<ul class="run-logs">';
          run.logs.forEach(function (l) {
            html += '<li><code>' + esc(l.action) + '</code> · ' +
                    esc((l.result_json || '').slice(0, 140)) + '</li>';
          });
          html += '</ul>';
        }
        html += '</div>';
      });
      modal('Runs: ' + wf.title, '<div class="runs-list">' + html + '</div>');
    }).catch(function (e) { alert('Failed: ' + e.message); });
  }

  /* -------- Page boot -------- */
  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader(
      "Workflows",
      '<button class="btn btn-primary" id="wf-new">' + CMS_APP.ICONS.plus + ' New Workflow</button>',
      "Real automations triggered by forms, cron, and CRM events"
    );
    load();

    document.addEventListener('click', function (e) {
      var newBtn = e.target.closest('#wf-new');
      if (newBtn) { openEditor(null); return; }
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var id = +t.dataset.id;
      var wf = state.items.find(function (x) { return x.id === id; });
      if (!wf) return;
      var act = t.dataset.act;
      if (act === 'edit')   openEditor(wf);
      if (act === 'runs')   openRuns(wf);
      if (act === 'run')    API.wfRun(id, {}).then(function (r) { alert('Ran — run #' + r.run_id); load(); });
      if (act === 'toggle') {
        API.wfUpdate(id, { status: wf.status === 'active' ? 'paused' : 'active' }).then(load);
      }
      if (act === 'del') {
        if (confirm('Delete workflow "' + wf.title + '"?')) API.wfDelete(id).then(load);
      }
    });
  });
})();

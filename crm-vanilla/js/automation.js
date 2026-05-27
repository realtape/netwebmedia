/* Automation — Visual Sequence/Workflow Builder.
 * Vanilla JS, no framework. Renders into #automationBody.
 *
 * UX model (intentionally NOT drag-and-drop):
 *   List view: table of saved workflows (name, trigger, step count, status, last run).
 *   Editor view: name + trigger + step-card list with up/down/delete + "Add Step".
 *
 * XSS: every user-controlled string going into innerHTML routes through esc().
 * Auth: X-Auth-Token header from localStorage.nwm_token. credentials: 'include'
 * keeps the session cookie for CSRF same-origin checks (api/index.php enforces).
 */
(function () {
  "use strict";

  var API = 'api/index.php?r=';

  // ─── Config (kept in sync with handlers/workflows.php enums) ─────────
  // Trigger names match exactly what the PHP engine fires from CRM handlers.
  // 'form_submitted' is intentionally absent: no handler currently fires it,
  // and the previous 'deal_stage_changed' value never matched the engine's
  // 'deal_stage' SELECT — workflows on stage change silently never ran.
  var TRIGGERS = ['contact_created', 'tag_added', 'tag_removed', 'deal_stage', 'manual', 'conversation_inbound'];
  var STEP_TYPES = [
    'wait', 'send_email', 'add_tag', 'remove_tag', 'create_task',
    'update_field', 'move_stage', 'send_whatsapp', 'notify_team', 'webhook', 'log'
  ];
  // Whitelist of contact fields that update_field can mutate. Mirrors the
  // engine's allowlist in wf_crm.php (case 'update_field').
  var UPDATE_FIELDS = ['status', 'segment', 'niche', 'source', 'company', 'city', 'country'];

  // i18n — populated from CRM_APP.getLang() at render time
  var L;

  // App state
  var state = {
    view: 'list',           // 'list' | 'editor' | 'runs' | 'runDetail'
    workflows: [],          // list rows from GET ?r=workflows
    templates: [],          // email templates for the send_email step picker
    editing: null,          // workflow object currently being edited (or new)
    loading: false,
    error: null,
    // Runs audit panel state
    runs: [],               // list rows from GET ?r=workflow_runs
    runFilter: { workflow_id: null, status: null }, // current Runs filters
    runDetail: null,        // single run with .steps[] expanded
    runsLoading: false
  };

  // ─── Helpers ─────────────────────────────────────────────────────────
  function esc(s) {
    if (window.CRM_APP && CRM_APP.esc) return CRM_APP.esc(s);
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(method, route, body) {
    var headers = { 'Accept': 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    try {
      var tok = localStorage.getItem('nwm_token');
      if (tok) headers['X-Auth-Token'] = tok;
    } catch (_) {}
    return fetch(API + route, {
      method: method,
      headers: headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      var p = ct.indexOf('application/json') !== -1 ? r.json() : r.text();
      return p.then(function (d) {
        if (!r.ok) {
          var err = new Error((d && d.error) || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        }
        return d;
      });
    });
  }

  function toast(msg, isError) {
    var t = document.createElement('div');
    t.className = 'toast' + (isError ? ' error' : '');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      background: isError ? '#c0392b' : '#010F3B',
      color: '#fff', padding: '12px 18px', borderRadius: '8px',
      fontSize: '13px', fontWeight: '600', zIndex: 9999,
      boxShadow: '0 6px 18px rgba(0,0,0,0.18)'
    });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function fmtAgo(s) {
    if (!s) return L.never;
    var then = new Date(String(s).replace(' ', 'T'));
    if (isNaN(then)) return s;
    var sec = Math.floor((Date.now() - then.getTime()) / 1000);
    if (sec < 60) return L.justNow;
    if (sec < 3600) return Math.floor(sec / 60) + L.minAgo;
    if (sec < 86400) return Math.floor(sec / 3600) + L.hrAgo;
    var days = Math.floor(sec / 86400);
    if (days < 30) return days + L.dayAgo;
    return then.toLocaleDateString();
  }

  function newWorkflow() {
    return {
      id: null,
      name: '',
      trigger_type: 'manual',
      trigger_filter: '',
      status: 'active',
      steps: [{ type: 'wait', config: { delay: 1, unit: 'days' } }]
    };
  }

  function parseSteps(json) {
    try {
      var arr = JSON.parse(json || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  // ─── i18n ────────────────────────────────────────────────────────────
  function loadStrings() {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      newWorkflow: 'Nuevo Flujo', edit: 'Editar', duplicate: 'Duplicar', del: 'Eliminar',
      name: 'Nombre', trigger: 'Disparador', steps: 'Pasos', status: 'Estado',
      lastRun: 'Última ejec.', actions: 'Acciones',
      active: 'Activo', paused: 'Pausado', draft: 'Borrador',
      empty: 'Aún no hay flujos. Crea tu primer flujo de automatización.',
      loading: 'Cargando…',
      save: 'Guardar', cancel: 'Cancelar', back: 'Volver',
      addStep: '+ Añadir paso',
      step: 'Paso',
      stepType: 'Tipo de paso', stepConfig: 'Configuración',
      delay: 'Retraso', minutes: 'minutos', hours: 'horas', days: 'días',
      template: 'Plantilla de email', selectTemplate: '— Selecciona plantilla —',
      tag: 'Etiqueta', taskTitle: 'Título de tarea',
      triggerFilter: 'Filtro (opcional)',
      triggerFilterPh: 'p. ej. slug del formulario o nombre de etiqueta',
      workflowNamePh: 'p. ej. Bienvenida a nuevo lead',
      saved: 'Flujo guardado', deleted: 'Flujo eliminado', duplicated: 'Flujo duplicado',
      saveFailed: 'Error al guardar', loadFailed: 'No se pudieron cargar los flujos',
      confirmDelete: '¿Eliminar este flujo?',
      pause: 'Pausar', resume: 'Activar',
      newWorkflowName: 'Flujo sin título',
      moveUp: 'Subir', moveDown: 'Bajar', removeStep: 'Eliminar',
      never: 'nunca', justNow: 'ahora mismo', minAgo: ' min', hrAgo: ' h', dayAgo: ' d',
      stepTypes: {
        wait: 'Esperar', send_email: 'Enviar email', add_tag: 'Añadir etiqueta',
        remove_tag: 'Quitar etiqueta', create_task: 'Crear tarea',
        update_field: 'Actualizar campo', move_stage: 'Mover a etapa',
        send_whatsapp: 'Enviar WhatsApp', notify_team: 'Notificar al equipo',
        webhook: 'Webhook', log: 'Registrar nota'
      },
      tabWorkflows: 'Flujos', tabRuns: 'Ejecuciones',
      runsEmpty: 'Aún no se han ejecutado flujos.',
      runStatus: { pending: 'Pendiente', running: 'En curso', waiting: 'Esperando', completed: 'Completado', failed: 'Fallido' },
      runId: 'ID', runWorkflow: 'Flujo', runStatusCol: 'Estado',
      runStep: 'Paso', runResult: 'Resultado', runWhen: 'Cuándo',
      runFilterAll: 'Todos los estados', runFilterAny: 'Todos los flujos',
      runDetailTitle: 'Detalle de ejecución', runStepsHeader: 'Pasos ejecutados',
      runContext: 'Contexto', runError: 'Error', runNoSteps: 'Aún no se han registrado pasos.',
      backToRuns: '← Volver a ejecuciones', refresh: 'Actualizar',
      triggers: {
        contact_created: 'Contacto creado', tag_added: 'Etiqueta añadida',
        tag_removed: 'Etiqueta quitada', deal_stage: 'Cambio de etapa',
        manual: 'Manual', conversation_inbound: 'Mensaje entrante'
      },
      field: 'Campo', value: 'Valor', stage: 'Etapa',
      messageBody: 'Mensaje', whatsappBody: 'Mensaje (WhatsApp)',
      teamNotice: 'Aviso al equipo', teamRecipient: 'Email destinatario (opcional)',
      teamRecipientPh: 'Por defecto: email de la organización',
      webhookUrl: 'URL del webhook', logNote: 'Nota interna',
      betaTitle: 'Beta — En Desarrollo Activo',
      betaCopy: 'El motor de ejecución de flujos se está desarrollando. Puedes crear y guardar flujos ahora; comenzarán a ejecutarse cuando se active el motor en Q3 2026.'
    } : {
      newWorkflow: 'New Workflow', edit: 'Edit', duplicate: 'Duplicate', del: 'Delete',
      name: 'Name', trigger: 'Trigger', steps: 'Steps', status: 'Status',
      lastRun: 'Last run', actions: 'Actions',
      active: 'Active', paused: 'Paused', draft: 'Draft',
      empty: 'No workflows yet. Create your first automation.',
      loading: 'Loading…',
      save: 'Save', cancel: 'Cancel', back: 'Back',
      addStep: '+ Add Step',
      step: 'Step',
      stepType: 'Step type', stepConfig: 'Config',
      delay: 'Delay', minutes: 'minutes', hours: 'hours', days: 'days',
      template: 'Email template', selectTemplate: '— Select template —',
      tag: 'Tag', taskTitle: 'Task title',
      triggerFilter: 'Filter (optional)',
      triggerFilterPh: 'e.g. form slug or tag name',
      workflowNamePh: 'e.g. New Lead Welcome',
      saved: 'Workflow saved', deleted: 'Workflow deleted', duplicated: 'Workflow duplicated',
      saveFailed: 'Save failed', loadFailed: 'Could not load workflows',
      confirmDelete: 'Delete this workflow?',
      pause: 'Pause', resume: 'Activate',
      newWorkflowName: 'Untitled workflow',
      moveUp: 'Move up', moveDown: 'Move down', removeStep: 'Remove',
      never: 'never', justNow: 'just now', minAgo: 'm ago', hrAgo: 'h ago', dayAgo: 'd ago',
      stepTypes: {
        wait: 'Wait', send_email: 'Send email', add_tag: 'Add tag',
        remove_tag: 'Remove tag', create_task: 'Create task',
        update_field: 'Update field', move_stage: 'Move to stage',
        send_whatsapp: 'Send WhatsApp', notify_team: 'Notify team',
        webhook: 'Webhook', log: 'Log note'
      },
      tabWorkflows: 'Workflows', tabRuns: 'Runs',
      runsEmpty: 'No workflow runs yet.',
      runStatus: { pending: 'Pending', running: 'Running', waiting: 'Waiting', completed: 'Completed', failed: 'Failed' },
      runId: 'ID', runWorkflow: 'Workflow', runStatusCol: 'Status',
      runStep: 'Step', runResult: 'Result', runWhen: 'When',
      runFilterAll: 'All statuses', runFilterAny: 'All workflows',
      runDetailTitle: 'Run detail', runStepsHeader: 'Executed steps',
      runContext: 'Context', runError: 'Error', runNoSteps: 'No steps recorded yet.',
      backToRuns: '← Back to runs', refresh: 'Refresh',
      triggers: {
        contact_created: 'Contact created', tag_added: 'Tag added',
        tag_removed: 'Tag removed', deal_stage: 'Deal stage changed',
        manual: 'Manual', conversation_inbound: 'Inbound message'
      },
      field: 'Field', value: 'Value', stage: 'Stage',
      messageBody: 'Message', whatsappBody: 'Message (WhatsApp)',
      teamNotice: 'Team notice', teamRecipient: 'Recipient email (optional)',
      teamRecipientPh: 'Defaults to organization email',
      webhookUrl: 'Webhook URL', logNote: 'Internal note',
      betaTitle: 'Beta — In Active Development',
      betaCopy: 'The workflow execution engine is in active development. You can create and save workflows now; they will begin running once the engine ships in Q3 2026.'
    };
  }

  // ─── Header ──────────────────────────────────────────────────────────
  function renderHeader() {
    if (!window.CRM_APP || !CRM_APP.buildHeader) return;
    var actions = '';
    if (state.view === 'list') {
      actions = '<button class="btn btn-primary" id="wfNewBtn">'
        + (CRM_APP.ICONS && CRM_APP.ICONS.plus ? CRM_APP.ICONS.plus + ' ' : '+ ')
        + esc(L.newWorkflow) + '</button>';
    } else {
      actions = '<button class="btn btn-secondary" id="wfBackBtn">&larr; ' + esc(L.back) + '</button>';
    }
    CRM_APP.buildHeader(CRM_APP.t ? CRM_APP.t('nav.automation') : 'Automation', actions);
    var nb = document.getElementById('wfNewBtn');
    if (nb) nb.addEventListener('click', function () { openEditor(newWorkflow()); });
    var bb = document.getElementById('wfBackBtn');
    if (bb) bb.addEventListener('click', function () { state.view = 'list'; render(); });
  }

  // ─── Beta banner ─────────────────────────────────────────────────────
  function betaBannerHTML() {
    return '<div class="nwm-beta-banner" role="status" style="background:linear-gradient(135deg,#010F3B,#0d1f5c);border:1px solid rgba(255,103,31,0.45);border-left:4px solid #FF671F;border-radius:12px;padding:14px 18px;margin:0 0 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:240px;">'
      + '<div style="color:#FF671F;font-weight:700;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">' + esc(L.betaTitle) + '</div>'
      + '<div style="color:#cdd3e3;font-size:13px;margin-top:4px;line-height:1.5;">' + esc(L.betaCopy) + '</div>'
      + '</div>'
      + '</div>';
  }

  // ─── Tab strip (Workflows / Runs) ────────────────────────────────────
  function renderTabs() {
    var isList = state.view === 'list';
    var isRuns = state.view === 'runs' || state.view === 'runDetail';
    function tab(key, label, active) {
      return '<button class="wf-tab' + (active ? ' is-active' : '') + '" data-tab="' + esc(key) + '" '
        + 'style="background:transparent;border:none;border-bottom:2px solid ' + (active ? '#FF671F' : 'transparent') + ';'
        + 'color:' + (active ? '#fff' : '#9aa4bf') + ';font-weight:600;padding:10px 18px;cursor:pointer;font-size:14px;">'
        + esc(label) + '</button>';
    }
    return '<div class="wf-tabs" style="display:flex;gap:4px;border-bottom:1px solid rgba(255,255,255,0.08);margin:0 0 18px;">'
      + tab('list', L.tabWorkflows, isList)
      + tab('runs', L.tabRuns, isRuns)
      + '</div>';
  }

  // ─── Main render dispatcher ──────────────────────────────────────────
  function render() {
    loadStrings();
    renderHeader();
    var body = document.getElementById('automationBody');
    if (!body) return;

    var html = betaBannerHTML();
    // Editor view doesn't show the tab strip — it's a focused mode.
    if (state.view !== 'editor') html += renderTabs();

    if (state.view === 'editor') {
      html += renderEditor();
    } else if (state.view === 'runs') {
      html += renderRunsList();
    } else if (state.view === 'runDetail') {
      html += renderRunDetail();
    } else {
      html += renderList();
    }
    body.innerHTML = html;

    if (state.view === 'editor')      wireEditor();
    else if (state.view === 'runs')   wireRunsList();
    else if (state.view === 'runDetail') wireRunDetail();
    else                              wireList();

    if (state.view !== 'editor') wireTabs();
  }

  function wireTabs() {
    var body = document.getElementById('automationBody');
    if (!body) return;
    body.querySelectorAll('[data-tab]').forEach(function (el) {
      el.addEventListener('click', function () {
        var t = this.getAttribute('data-tab');
        if (t === 'list') {
          state.view = 'list';
          render();
        } else if (t === 'runs') {
          state.view = 'runs';
          render();
          loadRuns();
        }
      });
    });
  }

  // ─── List view ───────────────────────────────────────────────────────
  function renderList() {
    if (state.loading) {
      return '<div class="crm-loading" style="text-align:center;padding:48px;color:#6b7280;">'
        + esc(L.loading) + '</div>';
    }
    if (state.error) {
      return '<div class="empty-state" style="border:1px solid #fee2e2;background:#fef2f2;color:#991b1b;padding:20px;border-radius:8px;">'
        + esc(state.error) + '</div>';
    }
    if (!state.workflows.length) {
      return '<div class="empty-state" style="text-align:center;padding:48px;color:#6b7280;border:1px dashed #e5e7eb;border-radius:12px;">'
        + esc(L.empty) + '</div>';
    }

    var h = '<div class="wf-list-wrap"><table class="wf-list-table"><thead><tr>'
      + '<th>' + esc(L.name) + '</th>'
      + '<th>' + esc(L.trigger) + '</th>'
      + '<th>' + esc(L.steps) + '</th>'
      + '<th>' + esc(L.status) + '</th>'
      + '<th>' + esc(L.lastRun) + '</th>'
      + '<th style="text-align:right;">' + esc(L.actions) + '</th>'
      + '</tr></thead><tbody>';

    for (var i = 0; i < state.workflows.length; i++) {
      var w = state.workflows[i];
      var trigLabel = L.triggers[w.trigger_type] || w.trigger_type;
      var statusKey = w.status === 'paused' ? 'paused' : (w.status === 'draft' ? 'draft' : 'active');
      var statusClass = 'wf-status wf-status-' + esc(statusKey);
      var statusLabel = L[statusKey] || statusKey;
      h += '<tr data-id="' + esc(w.id) + '">'
        + '<td><strong>' + esc(w.name) + '</strong></td>'
        + '<td>' + esc(trigLabel)
        + (w.trigger_filter ? ' <span class="wf-filter-chip">' + esc(w.trigger_filter) + '</span>' : '')
        + '</td>'
        + '<td>' + esc(w.step_count != null ? w.step_count : 0) + '</td>'
        + '<td><span class="' + statusClass + '">' + esc(statusLabel) + '</span></td>'
        + '<td>' + esc(fmtAgo(w.last_run_at)) + '</td>'
        + '<td style="text-align:right;white-space:nowrap;">'
        + '<button class="wf-action" data-act="toggle" data-id="' + esc(w.id) + '">'
        +   esc(w.status === 'active' ? L.pause : L.resume) + '</button>'
        + '<button class="wf-action" data-act="edit" data-id="' + esc(w.id) + '">' + esc(L.edit) + '</button>'
        + '<button class="wf-action" data-act="duplicate" data-id="' + esc(w.id) + '">' + esc(L.duplicate) + '</button>'
        + '<button class="wf-action wf-action-danger" data-act="delete" data-id="' + esc(w.id) + '">' + esc(L.del) + '</button>'
        + '</td></tr>';
    }
    h += '</tbody></table></div>';
    return h;
  }

  function wireList() {
    var body = document.getElementById('automationBody');
    if (!body) return;
    var btns = body.querySelectorAll('[data-act]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        var act = this.getAttribute('data-act');
        if (act === 'edit') return loadAndEdit(id);
        if (act === 'duplicate') return duplicateWorkflow(id);
        if (act === 'delete') return deleteWorkflow(id);
        if (act === 'toggle') return toggleStatus(id);
      });
    }
  }

  // ─── Editor view ─────────────────────────────────────────────────────
  function renderEditor() {
    var w = state.editing || newWorkflow();

    var trigOpts = TRIGGERS.map(function (t) {
      var sel = w.trigger_type === t ? ' selected' : '';
      return '<option value="' + esc(t) + '"' + sel + '>' + esc(L.triggers[t] || t) + '</option>';
    }).join('');

    var statusOpts = ['active', 'paused', 'draft'].map(function (s) {
      var sel = w.status === s ? ' selected' : '';
      return '<option value="' + esc(s) + '"' + sel + '>' + esc(L[s]) + '</option>';
    }).join('');

    var h = '<div class="wf-editor-panel">';
    h += '<div class="wf-editor-grid">';

    h += '<div class="wf-field"><label>' + esc(L.name) + '</label>'
      + '<input type="text" id="wfName" maxlength="200" value="' + esc(w.name) + '" placeholder="' + esc(L.workflowNamePh) + '"></div>';

    h += '<div class="wf-field"><label>' + esc(L.trigger) + '</label>'
      + '<select id="wfTrigger">' + trigOpts + '</select></div>';

    h += '<div class="wf-field"><label>' + esc(L.triggerFilter) + '</label>'
      + '<input type="text" id="wfTriggerFilter" maxlength="200" value="' + esc(w.trigger_filter || '') + '" placeholder="' + esc(L.triggerFilterPh) + '"></div>';

    h += '<div class="wf-field"><label>' + esc(L.status) + '</label>'
      + '<select id="wfStatus">' + statusOpts + '</select></div>';

    h += '</div>';  // /wf-editor-grid

    // Steps list
    h += '<div class="wf-steps-section">';
    h += '<h3 class="wf-steps-heading">' + esc(L.steps) + '</h3>';
    h += '<div id="wfStepsList">';
    for (var i = 0; i < w.steps.length; i++) {
      h += renderStepCard(w.steps[i], i, w.steps.length);
    }
    h += '</div>';
    h += '<button type="button" class="btn btn-secondary wf-add-step" id="wfAddStep">' + esc(L.addStep) + '</button>';
    h += '</div>';

    // Footer
    h += '<div class="wf-editor-footer">';
    h += '<button type="button" class="btn btn-secondary" id="wfCancel">' + esc(L.cancel) + '</button>';
    h += '<button type="button" class="btn btn-primary" id="wfSave">' + esc(L.save) + '</button>';
    h += '</div>';

    h += '</div>'; // /wf-editor-panel
    return h;
  }

  function renderStepCard(step, idx, total) {
    var typeOpts = STEP_TYPES.map(function (t) {
      var sel = step.type === t ? ' selected' : '';
      return '<option value="' + esc(t) + '"' + sel + '>' + esc(L.stepTypes[t] || t) + '</option>';
    }).join('');

    var h = '<div class="wf-step-card" data-idx="' + idx + '">';
    h += '<div class="wf-step-num"><span class="step-type-badge step-type-' + esc(step.type) + '">' + (idx + 1) + '</span></div>';

    h += '<div class="wf-step-main">';
    h += '<div class="wf-step-row">';
    h += '<label class="wf-step-label">' + esc(L.stepType) + '</label>';
    h += '<select class="wf-step-type" data-idx="' + idx + '">' + typeOpts + '</select>';
    h += '</div>';
    h += '<div class="wf-step-config">' + renderStepConfig(step, idx) + '</div>';
    h += '</div>';

    h += '<div class="wf-step-reorder">';
    h += '<button type="button" class="wf-reorder-btn" data-act="up" data-idx="' + idx + '" '
      + (idx === 0 ? 'disabled' : '') + ' title="' + esc(L.moveUp) + '">&#8593;</button>';
    h += '<button type="button" class="wf-reorder-btn" data-act="down" data-idx="' + idx + '" '
      + (idx === total - 1 ? 'disabled' : '') + ' title="' + esc(L.moveDown) + '">&#8595;</button>';
    h += '<button type="button" class="wf-remove-btn" data-act="remove" data-idx="' + idx + '" title="' + esc(L.removeStep) + '">&#10005;</button>';
    h += '</div>';

    h += '</div>';
    return h;
  }

  function renderStepConfig(step, idx) {
    var c = step.config || {};
    if (step.type === 'wait') {
      var unitOpts = ['minutes', 'hours', 'days'].map(function (u) {
        return '<option value="' + esc(u) + '"' + (c.unit === u ? ' selected' : '') + '>' + esc(L[u]) + '</option>';
      }).join('');
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.delay) + '</label>'
        + '<input type="number" min="0" class="wf-step-input wf-step-delay" data-idx="' + idx + '" value="' + esc(c.delay != null ? c.delay : 1) + '" style="max-width:120px;">'
        + '<select class="wf-step-input wf-step-unit" data-idx="' + idx + '" style="max-width:140px;">' + unitOpts + '</select>'
        + '</div>';
    }
    if (step.type === 'send_email') {
      var opts = '<option value="">' + esc(L.selectTemplate) + '</option>';
      for (var i = 0; i < state.templates.length; i++) {
        var tpl = state.templates[i];
        var sel = (c.template_id && Number(c.template_id) === Number(tpl.id)) ? ' selected' : '';
        opts += '<option value="' + esc(tpl.id) + '"' + sel + '>' + esc(tpl.name) + '</option>';
      }
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.template) + '</label>'
        + '<select class="wf-step-input wf-step-template" data-idx="' + idx + '">' + opts + '</select>'
        + '</div>';
    }
    if (step.type === 'add_tag' || step.type === 'remove_tag') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.tag) + '</label>'
        + '<input type="text" maxlength="100" class="wf-step-input wf-step-tag" data-idx="' + idx + '" value="' + esc(c.tag || '') + '">'
        + '</div>';
    }
    if (step.type === 'create_task') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.taskTitle) + '</label>'
        + '<input type="text" maxlength="200" class="wf-step-input wf-step-task" data-idx="' + idx + '" value="' + esc(c.title || '') + '">'
        + '</div>';
    }
    if (step.type === 'update_field') {
      var fieldOpts = UPDATE_FIELDS.map(function (f) {
        return '<option value="' + esc(f) + '"' + ((c.field === f) ? ' selected' : '') + '>' + esc(f) + '</option>';
      }).join('');
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.field) + '</label>'
        + '<select class="wf-step-input wf-step-uf-field" data-idx="' + idx + '" style="max-width:180px;">' + fieldOpts + '</select>'
        + '<label class="wf-step-label" style="margin-left:12px;">' + esc(L.value) + '</label>'
        + '<input type="text" maxlength="200" class="wf-step-input wf-step-uf-value" data-idx="' + idx + '" value="' + esc(c.value || '') + '">'
        + '</div>';
    }
    if (step.type === 'move_stage') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.stage) + '</label>'
        + '<input type="text" maxlength="100" class="wf-step-input wf-step-stage" data-idx="' + idx + '" value="' + esc(c.stage || '') + '" placeholder="e.g. Won">'
        + '</div>';
    }
    if (step.type === 'send_whatsapp') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.whatsappBody) + '</label>'
        + '<textarea class="wf-step-input wf-step-wabody" data-idx="' + idx + '" rows="3" maxlength="4000">' + esc(c.body || '') + '</textarea>'
        + '</div>';
    }
    if (step.type === 'notify_team') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.messageBody) + '</label>'
        + '<input type="text" maxlength="500" class="wf-step-input wf-step-nt-msg" data-idx="' + idx + '" value="' + esc(c.message || '') + '">'
        + '<label class="wf-step-label" style="margin-left:12px;">' + esc(L.teamRecipient) + '</label>'
        + '<input type="email" class="wf-step-input wf-step-nt-to" data-idx="' + idx + '" value="' + esc(c.to || '') + '" placeholder="' + esc(L.teamRecipientPh) + '">'
        + '</div>';
    }
    if (step.type === 'webhook') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.webhookUrl) + '</label>'
        + '<input type="url" class="wf-step-input wf-step-webhook" data-idx="' + idx + '" value="' + esc(c.url || '') + '" placeholder="https://...">'
        + '</div>';
    }
    if (step.type === 'log') {
      return '<div class="wf-step-row">'
        + '<label class="wf-step-label">' + esc(L.logNote) + '</label>'
        + '<input type="text" maxlength="500" class="wf-step-input wf-step-log" data-idx="' + idx + '" value="' + esc(c.message || '') + '">'
        + '</div>';
    }
    return '';
  }

  function wireEditor() {
    var body = document.getElementById('automationBody');
    if (!body) return;

    // Field-level wiring
    var nameEl = document.getElementById('wfName');
    if (nameEl) nameEl.addEventListener('input', function () { state.editing.name = this.value; });

    var trigEl = document.getElementById('wfTrigger');
    if (trigEl) trigEl.addEventListener('change', function () { state.editing.trigger_type = this.value; });

    var filterEl = document.getElementById('wfTriggerFilter');
    if (filterEl) filterEl.addEventListener('input', function () { state.editing.trigger_filter = this.value; });

    var statusEl = document.getElementById('wfStatus');
    if (statusEl) statusEl.addEventListener('change', function () { state.editing.status = this.value; });

    // Step type changes — re-render the list (config inputs differ per type)
    var typeSelects = body.querySelectorAll('.wf-step-type');
    for (var i = 0; i < typeSelects.length; i++) {
      typeSelects[i].addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var newType = this.value;
        state.editing.steps[idx] = { type: newType, config: defaultConfigFor(newType) };
        renderStepsOnly();
      });
    }

    // Step config field bindings
    body.querySelectorAll('.wf-step-delay').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        state.editing.steps[idx].config.delay = Math.max(0, parseInt(this.value, 10) || 0);
      });
    });
    body.querySelectorAll('.wf-step-unit').forEach(function (el) {
      el.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        state.editing.steps[idx].config.unit = this.value;
      });
    });
    body.querySelectorAll('.wf-step-template').forEach(function (el) {
      el.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var id = this.value ? parseInt(this.value, 10) : null;
        var tpl = null;
        for (var k = 0; k < state.templates.length; k++) {
          if (Number(state.templates[k].id) === Number(id)) { tpl = state.templates[k]; break; }
        }
        state.editing.steps[idx].config.template_id = id;
        state.editing.steps[idx].config.template_name = tpl ? tpl.name : null;
      });
    });
    body.querySelectorAll('.wf-step-tag').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        state.editing.steps[idx].config.tag = this.value;
      });
    });
    body.querySelectorAll('.wf-step-task').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        state.editing.steps[idx].config.title = this.value;
      });
    });

    // New step-type field bindings (update_field, move_stage, send_whatsapp,
    // notify_team, webhook, log). Each writes into config[<key>] for its idx.
    function bindText(selector, key) {
      body.querySelectorAll(selector).forEach(function (el) {
        el.addEventListener('input', function () {
          var idx = parseInt(this.getAttribute('data-idx'), 10);
          state.editing.steps[idx].config[key] = this.value;
        });
      });
    }
    function bindSelect(selector, key) {
      body.querySelectorAll(selector).forEach(function (el) {
        el.addEventListener('change', function () {
          var idx = parseInt(this.getAttribute('data-idx'), 10);
          state.editing.steps[idx].config[key] = this.value;
        });
      });
    }
    bindSelect('.wf-step-uf-field', 'field');
    bindText('.wf-step-uf-value',   'value');
    bindText('.wf-step-stage',      'stage');
    bindText('.wf-step-wabody',     'body');
    bindText('.wf-step-nt-msg',     'message');
    bindText('.wf-step-nt-to',      'to');
    bindText('.wf-step-webhook',    'url');
    bindText('.wf-step-log',        'message');

    // Reorder + remove
    body.querySelectorAll('.wf-reorder-btn, .wf-remove-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var act = this.getAttribute('data-act');
        var steps = state.editing.steps;
        if (act === 'up' && idx > 0) {
          var tmp = steps[idx - 1]; steps[idx - 1] = steps[idx]; steps[idx] = tmp;
        } else if (act === 'down' && idx < steps.length - 1) {
          var tmp2 = steps[idx + 1]; steps[idx + 1] = steps[idx]; steps[idx] = tmp2;
        } else if (act === 'remove') {
          steps.splice(idx, 1);
          if (steps.length === 0) steps.push({ type: 'wait', config: { delay: 1, unit: 'days' } });
        }
        renderStepsOnly();
      });
    });

    var addBtn = document.getElementById('wfAddStep');
    if (addBtn) addBtn.addEventListener('click', function () {
      state.editing.steps.push({ type: 'wait', config: { delay: 1, unit: 'days' } });
      renderStepsOnly();
    });

    var cancelBtn = document.getElementById('wfCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function () {
      state.view = 'list'; state.editing = null; render();
    });

    var saveBtn = document.getElementById('wfSave');
    if (saveBtn) saveBtn.addEventListener('click', saveWorkflow);
  }

  function renderStepsOnly() {
    var list = document.getElementById('wfStepsList');
    if (!list) return render();
    var w = state.editing;
    var h = '';
    for (var i = 0; i < w.steps.length; i++) h += renderStepCard(w.steps[i], i, w.steps.length);
    list.innerHTML = h;
    wireEditor();  // re-bind handlers (cheap; small DOM)
  }

  function defaultConfigFor(type) {
    switch (type) {
      case 'wait':         return { delay: 1, unit: 'days' };
      case 'send_email':   return { template_id: null, template_name: null };
      case 'add_tag':      return { tag: '' };
      case 'remove_tag':   return { tag: '' };
      case 'create_task':  return { title: '' };
      case 'update_field': return { field: 'status', value: '' };
      case 'move_stage':   return { stage: '' };
      case 'send_whatsapp':return { body: '' };
      case 'notify_team':  return { message: '', to: '' };
      case 'webhook':      return { url: '' };
      case 'log':          return { message: '' };
    }
    return {};
  }

  // ─── Actions ─────────────────────────────────────────────────────────
  function loadList() {
    state.loading = true;
    state.error = null;
    render();
    return api('GET', 'workflows').then(function (rows) {
      state.workflows = Array.isArray(rows) ? rows : [];
      state.loading = false;
      render();
    }).catch(function (e) {
      state.loading = false;
      state.error = L.loadFailed + ': ' + e.message;
      render();
    });
  }

  function loadTemplates() {
    return api('GET', 'templates').then(function (rows) {
      state.templates = Array.isArray(rows) ? rows : [];
    }).catch(function () {
      state.templates = []; // non-fatal: send_email picker just shows empty
    });
  }

  function openEditor(workflow) {
    state.editing = workflow;
    state.view = 'editor';
    render();
  }

  function loadAndEdit(id) {
    api('GET', 'workflows&id=' + id).then(function (row) {
      var steps = parseSteps(row.steps_json);
      if (!steps.length) steps = [{ type: 'wait', config: { delay: 1, unit: 'days' } }];
      openEditor({
        id: row.id,
        name: row.name,
        trigger_type: row.trigger_type || 'manual',
        trigger_filter: row.trigger_filter || '',
        status: row.status || 'active',
        steps: steps
      });
    }).catch(function (e) { toast(e.message, true); });
  }

  function saveWorkflow() {
    var w = state.editing;
    if (!w) return;
    if (!w.name || !w.name.trim()) {
      toast(L.name + ' *', true);
      var n = document.getElementById('wfName'); if (n) n.focus();
      return;
    }
    var payload = {
      name: w.name.trim(),
      trigger_type: w.trigger_type,
      trigger_filter: w.trigger_filter || null,
      status: w.status,
      steps_json: w.steps
    };
    var p = w.id
      ? api('PUT', 'workflows&id=' + w.id, payload)
      : api('POST', 'workflows', payload);

    p.then(function () {
      toast(L.saved);
      state.view = 'list';
      state.editing = null;
      loadList();
    }).catch(function (e) {
      toast(L.saveFailed + ': ' + e.message, true);
    });
  }

  function deleteWorkflow(id) {
    if (!confirm(L.confirmDelete)) return;
    api('DELETE', 'workflows&id=' + id).then(function () {
      toast(L.deleted);
      loadList();
    }).catch(function (e) { toast(e.message, true); });
  }

  function duplicateWorkflow(id) {
    api('GET', 'workflows&id=' + id).then(function (row) {
      var steps = parseSteps(row.steps_json);
      return api('POST', 'workflows', {
        name: row.name + ' (copy)',
        trigger_type: row.trigger_type,
        trigger_filter: row.trigger_filter,
        status: 'paused',
        steps_json: steps
      });
    }).then(function () {
      toast(L.duplicated);
      loadList();
    }).catch(function (e) { toast(e.message, true); });
  }

  // ─── Runs view ───────────────────────────────────────────────────────
  function runStatusBadge(status) {
    var label = (L.runStatus && L.runStatus[status]) || status || '';
    var bg = '#374151';
    if (status === 'completed') bg = '#10b981';
    else if (status === 'failed') bg = '#ef4444';
    else if (status === 'running') bg = '#3b82f6';
    else if (status === 'waiting') bg = '#f59e0b';
    else if (status === 'pending') bg = '#6b7280';
    return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:' + bg + ';color:#fff;">' + esc(label) + '</span>';
  }

  function renderRunsList() {
    var statusOpts = ['', 'pending', 'running', 'waiting', 'completed', 'failed'].map(function (s) {
      var lbl = s === '' ? L.runFilterAll : (L.runStatus[s] || s);
      var sel = (state.runFilter.status || '') === s ? ' selected' : '';
      return '<option value="' + esc(s) + '"' + sel + '>' + esc(lbl) + '</option>';
    }).join('');

    var wfOpts = '<option value="">' + esc(L.runFilterAny) + '</option>'
      + state.workflows.map(function (w) {
          var sel = Number(state.runFilter.workflow_id) === Number(w.id) ? ' selected' : '';
          return '<option value="' + esc(w.id) + '"' + sel + '>' + esc(w.name) + '</option>';
        }).join('');

    var h = '<div class="wf-runs-controls" style="display:flex;gap:12px;margin:0 0 16px;align-items:center;flex-wrap:wrap;">'
      + '<select id="wfRunsWfFilter" style="background:#0d1f5c;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;">' + wfOpts + '</select>'
      + '<select id="wfRunsStatusFilter" style="background:#0d1f5c;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;">' + statusOpts + '</select>'
      + '<button id="wfRunsRefresh" class="btn btn-secondary" style="font-size:13px;">' + esc(L.refresh) + '</button>'
      + '</div>';

    if (state.runsLoading) {
      return h + '<div class="crm-loading" style="text-align:center;padding:48px;color:#6b7280;">' + esc(L.loading) + '</div>';
    }
    if (!state.runs.length) {
      return h + '<div class="empty-state" style="text-align:center;padding:48px;color:#6b7280;border:1px dashed rgba(255,255,255,0.15);border-radius:12px;">'
        + esc(L.runsEmpty) + '</div>';
    }

    h += '<div class="wf-list-wrap"><table class="wf-list-table"><thead><tr>'
      + '<th>' + esc(L.runId) + '</th>'
      + '<th>' + esc(L.runWorkflow) + '</th>'
      + '<th>' + esc(L.trigger) + '</th>'
      + '<th>' + esc(L.runStatusCol) + '</th>'
      + '<th>' + esc(L.runStep) + '</th>'
      + '<th>' + esc(L.runResult) + '</th>'
      + '<th>' + esc(L.runWhen) + '</th>'
      + '</tr></thead><tbody>';

    for (var i = 0; i < state.runs.length; i++) {
      var r = state.runs[i];
      var trigLabel = (L.triggers && L.triggers[r.trigger_type]) || r.trigger_type || '';
      var lastResult = r.last_result || (r.error ? r.error.slice(0, 80) : '—');
      h += '<tr class="wf-run-row" data-run="' + esc(r.id) + '" style="cursor:pointer;">'
        + '<td><strong>#' + esc(r.id) + '</strong></td>'
        + '<td>' + esc(r.workflow_name || '') + '</td>'
        + '<td>' + esc(trigLabel) + '</td>'
        + '<td>' + runStatusBadge(r.status) + '</td>'
        + '<td>' + esc(r.step_index) + '/' + esc(r.step_count) + '</td>'
        + '<td><code style="font-size:12px;color:#cdd3e3;">' + esc(lastResult) + '</code></td>'
        + '<td>' + esc(fmtAgo(r.updated_at || r.created_at)) + '</td>'
        + '</tr>';
    }
    h += '</tbody></table></div>';
    return h;
  }

  function wireRunsList() {
    var body = document.getElementById('automationBody');
    if (!body) return;
    var wfSel = document.getElementById('wfRunsWfFilter');
    if (wfSel) wfSel.addEventListener('change', function () {
      state.runFilter.workflow_id = this.value ? parseInt(this.value, 10) : null;
      loadRuns();
    });
    var stSel = document.getElementById('wfRunsStatusFilter');
    if (stSel) stSel.addEventListener('change', function () {
      state.runFilter.status = this.value || null;
      loadRuns();
    });
    var rb = document.getElementById('wfRunsRefresh');
    if (rb) rb.addEventListener('click', loadRuns);
    body.querySelectorAll('.wf-run-row').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-run'), 10);
        loadRunDetail(id);
      });
    });
  }

  function renderRunDetail() {
    var d = state.runDetail;
    if (!d) {
      return '<div class="crm-loading" style="text-align:center;padding:48px;color:#6b7280;">' + esc(L.loading) + '</div>';
    }
    var trigLabel = (L.triggers && L.triggers[d.trigger_type]) || d.trigger_type || '';
    var h = '<button id="wfBackToRuns" class="btn btn-secondary" style="margin:0 0 16px;">' + esc(L.backToRuns) + '</button>';
    h += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;margin:0 0 16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">'
      + '<div>'
      + '<div style="font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:#9aa4bf;">' + esc(L.runDetailTitle) + ' #' + esc(d.id) + '</div>'
      + '<div style="font-size:18px;font-weight:700;color:#fff;margin-top:4px;">' + esc(d.workflow_name || '') + '</div>'
      + '<div style="font-size:13px;color:#cdd3e3;margin-top:4px;">' + esc(trigLabel)
      + (d.trigger_filter ? ' · <span class="wf-filter-chip">' + esc(d.trigger_filter) + '</span>' : '')
      + '</div>'
      + '</div>'
      + '<div>' + runStatusBadge(d.status) + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:14px;font-size:13px;color:#cdd3e3;">'
      + '<div><div style="color:#9aa4bf;font-size:11px;text-transform:uppercase;">Created</div>' + esc(d.created_at || '') + '</div>'
      + '<div><div style="color:#9aa4bf;font-size:11px;text-transform:uppercase;">Updated</div>' + esc(d.updated_at || '') + '</div>'
      + '<div><div style="color:#9aa4bf;font-size:11px;text-transform:uppercase;">' + esc(L.runStep) + '</div>' + esc(d.step_index) + '</div>'
      + (d.next_run_at ? '<div><div style="color:#9aa4bf;font-size:11px;text-transform:uppercase;">Next run</div>' + esc(d.next_run_at) + '</div>' : '')
      + '</div>'
      + (d.error ? '<div style="margin-top:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px;color:#fca5a5;font-size:13px;font-family:monospace;"><strong>' + esc(L.runError) + ':</strong> ' + esc(d.error) + '</div>' : '')
      + '</div>';

    // Steps
    h += '<div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase;margin:0 0 8px;">' + esc(L.runStepsHeader) + '</div>';
    if (!d.steps || !d.steps.length) {
      h += '<div class="empty-state" style="text-align:center;padding:24px;color:#6b7280;border:1px dashed rgba(255,255,255,0.15);border-radius:12px;">' + esc(L.runNoSteps) + '</div>';
    } else {
      h += '<div class="wf-list-wrap"><table class="wf-list-table"><thead><tr>'
        + '<th style="width:60px;">#</th>'
        + '<th>' + esc(L.stepType) + '</th>'
        + '<th>' + esc(L.runResult) + '</th>'
        + '<th style="width:160px;">' + esc(L.runWhen) + '</th>'
        + '</tr></thead><tbody>';
      for (var i = 0; i < d.steps.length; i++) {
        var s = d.steps[i];
        var typeLabel = (L.stepTypes && L.stepTypes[s.step_type]) || s.step_type;
        var isError = /^(email_failed|email_skipped|template_not_found|template_load_failed|wa_failed|wa_error|webhook_blocked|task_failed|holding_send_failed|auto_send_failed|draft_failed|router_exception)/.test(s.result || '');
        var resultColor = isError ? '#fca5a5' : '#cdd3e3';
        h += '<tr>'
          + '<td>' + esc(s.step_index) + '</td>'
          + '<td>' + esc(typeLabel) + '</td>'
          + '<td><code style="font-size:12px;color:' + resultColor + ';">' + esc(s.result) + '</code></td>'
          + '<td>' + esc(fmtAgo(s.created_at)) + '</td>'
          + '</tr>';
      }
      h += '</tbody></table></div>';
    }

    // Context dump (collapsible)
    if (d.context) {
      h += '<details style="margin-top:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 18px;">'
        + '<summary style="cursor:pointer;color:#9aa4bf;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">' + esc(L.runContext) + '</summary>'
        + '<pre style="margin:10px 0 0;color:#cdd3e3;font-size:12px;white-space:pre-wrap;word-break:break-word;">' + esc(JSON.stringify(d.context, null, 2)) + '</pre>'
        + '</details>';
    }

    return h;
  }

  function wireRunDetail() {
    var b = document.getElementById('wfBackToRuns');
    if (b) b.addEventListener('click', function () {
      state.runDetail = null;
      state.view = 'runs';
      render();
    });
  }

  function loadRuns() {
    state.runsLoading = true;
    render();
    var qs = '';
    if (state.runFilter.workflow_id) qs += '&workflow_id=' + state.runFilter.workflow_id;
    if (state.runFilter.status)      qs += '&status=' + encodeURIComponent(state.runFilter.status);
    api('GET', 'workflow_runs' + qs).then(function (rows) {
      state.runs = Array.isArray(rows) ? rows : [];
      state.runsLoading = false;
      render();
    }).catch(function (e) {
      state.runs = [];
      state.runsLoading = false;
      state.error = e.message;
      render();
    });
  }

  function loadRunDetail(id) {
    state.view = 'runDetail';
    state.runDetail = null;
    render();
    api('GET', 'workflow_runs&id=' + id).then(function (run) {
      state.runDetail = run;
      render();
    }).catch(function (e) {
      toast(e.message, true);
      state.view = 'runs';
      render();
    });
  }

  function toggleStatus(id) {
    var w = null;
    for (var i = 0; i < state.workflows.length; i++) {
      if (Number(state.workflows[i].id) === Number(id)) { w = state.workflows[i]; break; }
    }
    if (!w) return;
    var next = w.status === 'active' ? 'paused' : 'active';
    api('PUT', 'workflows&id=' + id, { status: next }).then(function () {
      w.status = next;
      render();
    }).catch(function (e) { toast(e.message, true); });
  }

  // ─── Boot ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    loadStrings();
    // Templates load in parallel — if it fails, send_email picker is just empty.
    loadTemplates();
    loadList();
  });
})();

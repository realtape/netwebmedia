/* ============================================
   NetWebMedia CRM Dashboard - Frontend Logic
   Connects to /api/crm/* serverless endpoints
   Falls back to demo data when API unavailable
   ============================================ */

(function () {
  'use strict';

  const API = '/api/crm';

  // ---- Cached data ----
  let data = {
    stats: {},
    contacts: [],
    companies: [],
    deals: [],
    leads: [],
    tasks: [],
    pipelines: [],
    activities: [],
  };

  // ---- Demo fallback data ----
  const DEMO = {
    companies: [
      { id: 'comp_1', name: 'Acme Corp', website: 'https://acme.com', industry: 'Technology', companySize: '50-200', status: 'customer' },
      { id: 'comp_2', name: 'BlueSky Media', website: 'https://blueskymedia.io', industry: 'Marketing', companySize: '10-50', status: 'prospect' },
      { id: 'comp_3', name: 'GreenLeaf Health', website: 'https://greenleafhealth.com', industry: 'Healthcare', companySize: '200-500', status: 'active' },
      { id: 'comp_4', name: 'Nova Legal Partners', website: 'https://novalegal.com', industry: 'Legal', companySize: '10-50', status: 'customer' },
      { id: 'comp_5', name: 'Pinnacle Realty', website: 'https://pinnaclerealty.com', industry: 'Real Estate', companySize: '10-50', status: 'prospect' },
    ],
    contacts: [
      { id: 'cont_1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@acme.com', phone: '+1-555-0101', jobTitle: 'VP Marketing', lifecycleStage: 'customer', companyId: 'comp_1' },
      { id: 'cont_2', firstName: 'Marcus', lastName: 'Williams', email: 'marcus@blueskymedia.io', phone: '+1-555-0102', jobTitle: 'CEO', lifecycleStage: 'mql', companyId: 'comp_2' },
      { id: 'cont_3', firstName: 'Elena', lastName: 'Rodriguez', email: 'elena@greenleafhealth.com', phone: '+1-555-0103', jobTitle: 'Director of Digital', lifecycleStage: 'sql', companyId: 'comp_3' },
      { id: 'cont_4', firstName: 'James', lastName: 'Park', email: 'james@novalegal.com', phone: '+1-555-0104', jobTitle: 'Managing Partner', lifecycleStage: 'customer', companyId: 'comp_4' },
      { id: 'cont_5', firstName: 'Priya', lastName: 'Sharma', email: 'priya@pinnaclerealty.com', phone: '+1-555-0105', jobTitle: 'Marketing Manager', lifecycleStage: 'lead', companyId: 'comp_5' },
      { id: 'cont_6', firstName: 'David', lastName: 'Kim', email: 'david@acme.com', phone: '+1-555-0106', jobTitle: 'CTO', lifecycleStage: 'customer', companyId: 'comp_1' },
    ],
    deals: [
      { id: 'deal_1', name: 'Acme Corp - Annual Retainer', status: 'open', value: 48000, expectedCloseDate: '2026-05-01', companyId: 'comp_1', stageId: 'stage_3', pipelineId: 'pipe_1', description: 'Annual marketing retainer renewal' },
      { id: 'deal_2', name: 'Nova Legal - Website + SEO', status: 'open', value: 25000, expectedCloseDate: '2026-04-30', companyId: 'comp_4', stageId: 'stage_2', pipelineId: 'pipe_1', description: 'Complete website redesign with SEO' },
      { id: 'deal_3', name: 'GreenLeaf - Content Strategy', status: 'open', value: 18000, expectedCloseDate: '2026-05-15', companyId: 'comp_3', stageId: 'stage_1', pipelineId: 'pipe_1', description: 'Content marketing strategy and execution' },
    ],
    leads: [
      { id: 'lead_1', title: 'BlueSky Media - SEO Audit', status: 'open', source: 'website', score: 72, estimatedValue: 5000, companyId: 'comp_2', stageId: 'stage_7', pipelineId: 'pipe_2' },
      { id: 'lead_2', title: 'GreenLeaf Health - Digital Overhaul', status: 'qualified', source: 'referral', score: 88, estimatedValue: 15000, companyId: 'comp_3', stageId: 'stage_8', pipelineId: 'pipe_2' },
      { id: 'lead_3', title: 'Pinnacle Realty - Social Media', status: 'open', source: 'linkedin', score: 45, estimatedValue: 3000, companyId: 'comp_5', stageId: 'stage_6', pipelineId: 'pipe_2' },
    ],
    tasks: [
      { id: 'task_1', title: 'Send proposal to Nova Legal', status: 'todo', priority: 'high', dueAt: '2026-04-15T17:00:00Z', companyId: 'comp_4' },
      { id: 'task_2', title: 'Schedule discovery call with Pinnacle', status: 'todo', priority: 'medium', dueAt: '2026-04-16T14:00:00Z', companyId: 'comp_5' },
      { id: 'task_3', title: 'Prepare GreenLeaf audit report', status: 'in_progress', priority: 'high', dueAt: '2026-04-14T17:00:00Z', companyId: 'comp_3' },
      { id: 'task_4', title: 'Follow up with Acme on retainer terms', status: 'done', priority: 'medium', dueAt: '2026-04-12T12:00:00Z', companyId: 'comp_1' },
      { id: 'task_5', title: 'Update BlueSky SEO proposal pricing', status: 'todo', priority: 'low', dueAt: '2026-04-18T17:00:00Z', companyId: 'comp_2' },
    ],
    pipelines: [
      {
        id: 'pipe_1', name: 'Sales Pipeline', entityType: 'deal',
        stages: [
          { id: 'stage_1', name: 'Discovery', order: 0, probability: 10 },
          { id: 'stage_2', name: 'Proposal', order: 1, probability: 30 },
          { id: 'stage_3', name: 'Negotiation', order: 2, probability: 60 },
          { id: 'stage_4', name: 'Closed Won', order: 3, probability: 100 },
          { id: 'stage_5', name: 'Closed Lost', order: 4, probability: 0 },
        ],
      },
      {
        id: 'pipe_2', name: 'Lead Qualification', entityType: 'lead',
        stages: [
          { id: 'stage_6', name: 'New', order: 0, probability: 5 },
          { id: 'stage_7', name: 'Contacted', order: 1, probability: 20 },
          { id: 'stage_8', name: 'Qualified', order: 2, probability: 50 },
          { id: 'stage_9', name: 'Converted', order: 3, probability: 100 },
        ],
      },
    ],
    activities: [
      { id: 'act_1', kind: 'call', summary: 'Discovery call with GreenLeaf Health', occurredAt: '2026-04-12T15:00:00Z' },
      { id: 'act_2', kind: 'email', summary: 'Sent proposal to Acme Corp', occurredAt: '2026-04-10T08:00:00Z' },
      { id: 'act_3', kind: 'meeting', summary: 'Strategy meeting with Nova Legal', occurredAt: '2026-04-11T09:00:00Z' },
      { id: 'act_4', kind: 'status_change', summary: 'Lead qualified: GreenLeaf Health', occurredAt: '2026-04-12T16:00:00Z' },
      { id: 'act_5', kind: 'email', summary: 'Follow-up with BlueSky Media', occurredAt: '2026-04-08T12:00:00Z' },
    ],
  };

  // ---- API Helpers ----
  async function apiFetch(endpoint, opts) {
    try {
      const res = await fetch(`${API}/${endpoint}`, opts);
      if (res.ok) return res.json();
      return null;
    } catch {
      return null;
    }
  }

  async function apiPost(endpoint, body) {
    return apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // ---- Data Loading ----
  async function loadAllData() {
    const [stats, contacts, companies, deals, leads, tasks, pipelines, activities] = await Promise.all([
      apiFetch('stats'),
      apiFetch('contacts'),
      apiFetch('companies'),
      apiFetch('deals'),
      apiFetch('leads'),
      apiFetch('tasks'),
      apiFetch('pipelines'),
      apiFetch('activities'),
    ]);

    data.stats = stats || buildLocalStats();
    data.contacts = contacts || DEMO.contacts;
    data.companies = companies || DEMO.companies;
    data.deals = deals || DEMO.deals;
    data.leads = leads || DEMO.leads;
    data.tasks = tasks || DEMO.tasks;
    data.pipelines = pipelines || DEMO.pipelines;
    data.activities = activities || DEMO.activities;
  }

  function buildLocalStats() {
    const openDeals = DEMO.deals.filter(d => d.status === 'open');
    return {
      totalContacts: DEMO.contacts.length,
      totalCompanies: DEMO.companies.length,
      openLeads: DEMO.leads.length,
      totalLeadValue: DEMO.leads.reduce((s, l) => s + (l.estimatedValue || 0), 0),
      openDeals: openDeals.length,
      totalPipelineValue: openDeals.reduce((s, d) => s + (d.value || 0), 0),
      tasksDueThisWeek: DEMO.tasks.filter(t => t.status !== 'done').length,
      tasksOverdue: 1,
      contactsByStage: {},
      dealsByStage: {},
      recentActivities: DEMO.activities.slice(0, 5),
    };
  }

  // ---- Helpers ----
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function companyName(id) {
    const c = data.companies.find(co => co.id === id);
    return c ? c.name : '—';
  }

  function stageName(stageId) {
    for (const p of data.pipelines) {
      const s = p.stages.find(st => st.id === stageId);
      if (s) return s.name;
    }
    return stageId || '—';
  }

  function formatMoney(val) {
    return '$' + (val || 0).toLocaleString();
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  function stageBadge(stage) {
    const map = {
      lead: 'badge-cyan', mql: 'badge-accent', sql: 'badge-orange',
      customer: 'badge-green', evangelist: 'badge-green',
      open: 'badge-cyan', qualified: 'badge-accent', won: 'badge-green', lost: 'badge-red',
    };
    return `<span class="badge ${map[stage] || 'badge-dim'}">${esc(stage)}</span>`;
  }

  function statusBadge(status) {
    const map = {
      prospect: 'badge-cyan', active: 'badge-green', customer: 'badge-green',
      partner: 'badge-accent', inactive: 'badge-dim',
      open: 'badge-cyan', won: 'badge-green', lost: 'badge-red', stalled: 'badge-orange',
    };
    return `<span class="badge ${map[status] || 'badge-dim'}">${esc(status)}</span>`;
  }

  const ACTIVITY_ICONS = {
    call: '📞', email: '📧', meeting: '🤝', status_change: '🔄', system: '⚙️', comment: '💬',
  };

  // ---- Render: Dashboard ----
  function renderDashboard() {
    const s = data.stats;
    const statsEl = $('#stats-row');
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Contacts</div>
        <div class="stat-value stat-cyan">${s.totalContacts || data.contacts.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Companies</div>
        <div class="stat-value stat-accent">${s.totalCompanies || data.companies.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Open Leads</div>
        <div class="stat-value stat-orange">${s.openLeads || data.leads.length}</div>
        <div class="stat-sub">${formatMoney(s.totalLeadValue)} est. value</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Open Deals</div>
        <div class="stat-value stat-green">${s.openDeals || data.deals.length}</div>
        <div class="stat-sub">${formatMoney(s.totalPipelineValue)} pipeline</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tasks Due</div>
        <div class="stat-value ${(s.tasksOverdue > 0) ? 'stat-red' : 'stat-cyan'}">${s.tasksDueThisWeek || 0}</div>
        <div class="stat-sub">${s.tasksOverdue || 0} overdue</div>
      </div>
    `;

    renderDashboardPipeline();
    renderDashboardTasks();
    renderDashboardActivity();
    renderDashboardLeads();
  }

  function renderDashboardPipeline() {
    const pipeline = data.pipelines.find(p => p.entityType === 'deal');
    if (!pipeline) return;

    const el = $('#dashboard-pipeline');
    el.innerHTML = pipeline.stages.map(stage => {
      const stageDeals = data.deals.filter(d => d.stageId === stage.id && d.status === 'open');
      return `
        <div class="pipeline-col">
          <div class="pipeline-col-header">
            <span class="pipeline-col-title">${esc(stage.name)}</span>
            <span class="pipeline-col-count">${stageDeals.length}</span>
          </div>
          ${stageDeals.map(d => `
            <div class="pipeline-card">
              <div class="pipeline-card-title">${esc(d.name)}</div>
              <div class="pipeline-card-company">${companyName(d.companyId)}</div>
              <div class="pipeline-card-value">${formatMoney(d.value)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }

  function renderDashboardTasks() {
    const pending = data.tasks.filter(t => t.status !== 'done').sort((a, b) => {
      const pa = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (pa[a.priority] || 2) - (pa[b.priority] || 2);
    }).slice(0, 5);

    $('#dashboard-tasks').innerHTML = pending.length === 0
      ? '<p style="color:var(--text-dim);font-size:0.85rem">No pending tasks</p>'
      : pending.map(t => renderTaskItem(t)).join('');
  }

  function renderDashboardActivity() {
    const acts = (data.stats.recentActivities || data.activities || []).slice(0, 5);
    $('#dashboard-activity').innerHTML = acts.map(a => `
      <div class="activity-item">
        <div class="activity-icon ${a.kind}">${ACTIVITY_ICONS[a.kind] || '📌'}</div>
        <div class="activity-body">
          <div class="activity-summary">${esc(a.summary)}</div>
          <div class="activity-time">${timeAgo(a.occurredAt)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderDashboardLeads() {
    const el = $('#dashboard-leads');
    el.innerHTML = data.leads.slice(0, 5).map(l => `
      <div class="activity-item">
        <div class="activity-icon" style="background:rgba(253,203,110,0.15)">🎯</div>
        <div class="activity-body">
          <div class="activity-summary">${esc(l.title)}</div>
          <div class="activity-time">${companyName(l.companyId)} · Score: ${l.score || 0} · ${formatMoney(l.estimatedValue)}</div>
        </div>
        ${stageBadge(l.status)}
      </div>
    `).join('');
  }

  // ---- Render: Contacts ----
  function renderContacts(filter) {
    let list = data.contacts;
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
      );
    }

    const tbody = $('#contacts-table tbody');
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><strong>${esc(c.firstName)} ${esc(c.lastName)}</strong></td>
        <td>${esc(c.email)}</td>
        <td>${companyName(c.companyId)}</td>
        <td>${esc(c.jobTitle || '—')}</td>
        <td>${stageBadge(c.lifecycleStage)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteRecord('contacts','${c.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // ---- Render: Companies ----
  function renderCompanies(filter) {
    let list = data.companies;
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || (c.industry && c.industry.toLowerCase().includes(q)));
    }

    const tbody = $('#companies-table tbody');
    tbody.innerHTML = list.map(c => {
      const contacts = data.contacts.filter(co => co.companyId === c.id).length;
      const deals = data.deals.filter(d => d.companyId === c.id).length;
      return `
        <tr>
          <td><strong>${esc(c.name)}</strong><br><span style="font-size:0.72rem;color:var(--text-dim)">${esc(c.website || '')}</span></td>
          <td>${esc(c.industry || '—')}</td>
          <td>${esc(c.companySize || '—')}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${contacts}</td>
          <td>${deals}</td>
        </tr>
      `;
    }).join('');
  }

  // ---- Render: Deals ----
  function renderDeals() {
    const tbody = $('#deals-table tbody');
    tbody.innerHTML = data.deals.map(d => `
      <tr>
        <td><strong>${esc(d.name)}</strong></td>
        <td>${companyName(d.companyId)}</td>
        <td style="font-weight:700;color:var(--green)">${formatMoney(d.value)}</td>
        <td><span class="badge badge-accent">${stageName(d.stageId)}</span></td>
        <td>${formatDate(d.expectedCloseDate)}</td>
        <td>${statusBadge(d.status)}</td>
      </tr>
    `).join('');
  }

  // ---- Render: Leads ----
  function renderLeads() {
    const tbody = $('#leads-table tbody');
    tbody.innerHTML = data.leads.map(l => `
      <tr>
        <td><strong>${esc(l.title)}</strong></td>
        <td>${companyName(l.companyId)}</td>
        <td>${esc(l.source || '—')}</td>
        <td><strong style="color:${l.score >= 70 ? 'var(--green)' : l.score >= 40 ? 'var(--orange)' : 'var(--red)'}">${l.score}</strong></td>
        <td>${formatMoney(l.estimatedValue)}</td>
        <td><span class="badge badge-accent">${stageName(l.stageId)}</span></td>
        <td>${statusBadge(l.status)}</td>
      </tr>
    `).join('');
  }

  // ---- Render: Tasks ----
  function renderTaskItem(t) {
    const isDone = t.status === 'done';
    const isOverdue = !isDone && t.dueAt && new Date(t.dueAt) < new Date();
    return `
      <div class="task-item">
        <div class="task-check ${isDone ? 'done' : ''}" onclick="toggleTask('${t.id}')"></div>
        <div class="task-body">
          <div class="task-title ${isDone ? 'done' : ''}">${esc(t.title)}</div>
          <div class="task-meta">
            <span class="priority-dot priority-${t.priority}"></span>${t.priority}
            ${t.dueAt ? ` · Due ${formatDate(t.dueAt)}` : ''}
            ${isOverdue ? ' · <span style="color:var(--red);font-weight:600">OVERDUE</span>' : ''}
            ${t.companyId ? ` · ${companyName(t.companyId)}` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderTasks() {
    const el = $('#tasks-list');
    const sorted = [...data.tasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      const pa = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (pa[a.priority] || 2) - (pa[b.priority] || 2);
    });
    el.innerHTML = sorted.map(t => renderTaskItem(t)).join('');
  }

  // ---- Render: Pipeline Board ----
  function renderPipeline() {
    const tabsEl = $('#pipeline-tabs');
    tabsEl.innerHTML = data.pipelines.map((p, i) =>
      `<button class="tab ${i === 0 ? 'active' : ''}" data-pipe="${p.id}">${esc(p.name)}</button>`
    ).join('');

    tabsEl.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPipelineBoard(btn.dataset.pipe);
      });
    });

    if (data.pipelines.length > 0) renderPipelineBoard(data.pipelines[0].id);
  }

  function renderPipelineBoard(pipelineId) {
    const pipeline = data.pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;

    const items = pipeline.entityType === 'deal' ? data.deals : data.leads;
    const el = $('#pipeline-board');

    el.innerHTML = pipeline.stages.map(stage => {
      const stageItems = items.filter(item => item.stageId === stage.id);
      return `
        <div class="pipeline-col">
          <div class="pipeline-col-header">
            <span class="pipeline-col-title">${esc(stage.name)}</span>
            <span class="pipeline-col-count">${stageItems.length}</span>
          </div>
          ${stageItems.map(item => `
            <div class="pipeline-card">
              <div class="pipeline-card-title">${esc(item.name || item.title)}</div>
              <div class="pipeline-card-company">${companyName(item.companyId)}</div>
              <div class="pipeline-card-value">${formatMoney(item.value || item.estimatedValue)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }

  // ---- Render: Activity ----
  function renderActivityLog() {
    const el = $('#activity-list');
    el.innerHTML = data.activities.map(a => `
      <div class="activity-item">
        <div class="activity-icon ${a.kind}">${ACTIVITY_ICONS[a.kind] || '📌'}</div>
        <div class="activity-body">
          <div class="activity-summary">${esc(a.summary)}</div>
          <div class="activity-time">${timeAgo(a.occurredAt)}${a.details ? ' · ' + esc(a.details) : ''}</div>
        </div>
      </div>
    `).join('');
  }

  // ---- Navigation ----
  window.showView = function (view) {
    $$('.section-view').forEach(el => el.classList.remove('active'));
    const viewEl = $(`#view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    $$('.sidebar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.view === view);
    });

    // Re-render on view switch
    switch (view) {
      case 'dashboard': renderDashboard(); break;
      case 'contacts': renderContacts(); break;
      case 'companies': renderCompanies(); break;
      case 'deals': renderDeals(); break;
      case 'leads': renderLeads(); break;
      case 'tasks': renderTasks(); break;
      case 'pipeline': renderPipeline(); break;
      case 'activity': renderActivityLog(); break;
    }
  };

  // ---- Modals ----
  window.closeModal = function (id) {
    $(`#${id}`).classList.add('hidden');
  };

  function openModal(id) {
    $(`#${id}`).classList.remove('hidden');
  }

  function populateCompanySelects() {
    const options = '<option value="">None</option>' +
      data.companies.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    const selects = ['#contact-company-select', '#deal-company-select'];
    selects.forEach(sel => {
      const el = $(sel);
      if (el) el.innerHTML = options;
    });
  }

  // ---- Actions ----
  window.deleteRecord = async function (type, id) {
    if (!confirm('Delete this record?')) return;
    data[type] = data[type].filter(r => r.id !== id);
    await apiFetch(`${type}?id=${id}`, { method: 'DELETE' });
    showView(getCurrentView());
  };

  window.toggleTask = async function (id) {
    const task = data.tasks.find(t => t.id === id);
    if (!task) return;
    task.status = task.status === 'done' ? 'todo' : 'done';
    await apiFetch(`tasks?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: task.status }),
    });
    showView(getCurrentView());
  };

  function getCurrentView() {
    const active = $('.section-view.active');
    return active ? active.id.replace('view-', '') : 'dashboard';
  }

  // ---- Event Listeners ----
  function setupEvents() {
    // Sidebar nav
    $$('.sidebar-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showView(a.dataset.view);
      });
    });

    // Search
    $('#contacts-search').addEventListener('input', (e) => renderContacts(e.target.value));
    $('#companies-search').addEventListener('input', (e) => renderCompanies(e.target.value));

    // Add Contact
    $('#btn-add-contact').addEventListener('click', () => {
      populateCompanySelects();
      openModal('modal-contact');
    });

    $('#form-contact').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const contact = Object.fromEntries(fd);
      const result = await apiPost('contacts', contact);
      if (result) {
        data.contacts.push(result);
      } else {
        contact.id = 'cont_' + Date.now().toString(36);
        data.contacts.push(contact);
      }
      closeModal('modal-contact');
      e.target.reset();
      showView('contacts');
    });

    // Add Company
    $('#btn-add-company').addEventListener('click', () => openModal('modal-company'));
    $('#form-company').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const company = Object.fromEntries(fd);
      const result = await apiPost('companies', company);
      if (result) {
        data.companies.push(result);
      } else {
        company.id = 'comp_' + Date.now().toString(36);
        data.companies.push(company);
      }
      closeModal('modal-company');
      e.target.reset();
      showView('companies');
    });

    // Add Deal
    $('#btn-add-deal').addEventListener('click', () => {
      populateCompanySelects();
      openModal('modal-deal');
    });
    $('#form-deal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const deal = Object.fromEntries(fd);
      deal.value = parseInt(deal.value) || 0;
      const result = await apiPost('deals', deal);
      if (result) {
        data.deals.push(result);
      } else {
        deal.id = 'deal_' + Date.now().toString(36);
        data.deals.push(deal);
      }
      closeModal('modal-deal');
      e.target.reset();
      showView('deals');
    });
  }

  // ---- Init ----
  async function init() {
    await loadAllData();
    renderDashboard();
    setupEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

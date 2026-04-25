/* Superadmin Dashboard */
(function () {
  'use strict';

  var PLAN_LABELS = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };
  var PLAN_MRR   = { starter: 29, professional: 79, enterprise: 199 };
  var PLAN_COLOR  = { starter: '#6366f1', professional: '#FF6B00', enterprise: '#10b981' };

  var STATUS_LABELS = {
    active: 'Active', pending_payment: 'Pending Payment',
    suspended: 'Suspended', cancelled: 'Cancelled'
  };
  var STATUS_COLOR = {
    active: 'positive', pending_payment: 'warning',
    suspended: 'negative', cancelled: 'negative'
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Superadmin gate — redirect if not superadmin
    var user = CRM_APP.getUser ? CRM_APP.getUser() : null;
    try {
      if (!user) {
        var raw = localStorage.getItem('nwm_user') || localStorage.getItem('crm_demo_user');
        user = raw ? JSON.parse(raw) : null;
      }
    } catch (_) {}

    if (!user || (user.type !== 'superadmin' && user.role !== 'superadmin')) {
      location.replace('index.html');
      return;
    }

    CRM_APP.buildHeader('Admin Dashboard', '');

    loadAdminData();
  });

  function loadAdminData() {
    fetch('/api/?r=admin', { credentials: 'include' })
      .then(function (r) {
        if (r.status === 403) { location.replace('index.html'); return null; }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        renderStats(data);
        renderPlanBreakdown(data.byPlan || []);
        renderStatusBreakdown(data.byStatus || {});
        renderRecentUsers(data.recentUsers || []);
        renderRecentLeads(data.recentLeads || []);
        var el = document.getElementById('userCount');
        if (el) el.textContent = '+' + (data.newUsersMonth || 0) + ' this month';
      })
      .catch(function (err) {
        console.error('Admin data load failed:', err);
      });
  }

  function renderStats(d) {
    var container = document.getElementById('adminStatsGrid');
    if (!container) return;

    var active = (d.byStatus && d.byStatus.active) ? parseInt(d.byStatus.active, 10) : 0;

    var cards = [
      { label: 'MRR',           value: '$' + (d.mrr || 0).toLocaleString(),   change: 'monthly recurring',  positive: true  },
      { label: 'ARR',           value: '$' + (d.arr || 0).toLocaleString(),   change: 'annualized',          positive: true  },
      { label: 'Total Users',   value: (d.totalUsers || 0).toLocaleString(),  change: '+' + (d.newUsersMonth || 0) + ' this month', positive: true },
      { label: 'Active',        value: active.toLocaleString(),               change: 'paying accounts',     positive: true  },
      { label: 'Total Contacts',value: (d.totalContacts || 0).toLocaleString(), change: 'platform-wide',     positive: true  },
      { label: 'Total Deals',   value: (d.totalDeals || 0).toLocaleString(),  change: 'pipeline records',    positive: true  },
    ];

    var html = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="stat-card">';
      html += '<div class="stat-header">';
      html += '<span class="stat-label">' + c.label + '</span>';
      html += '<span class="stat-icon">' + CRM_APP.ICONS.dashboard + '</span>';
      html += '</div>';
      html += '<div class="stat-value">' + c.value + '</div>';
      html += '<div class="stat-change ' + (c.positive ? 'positive' : 'negative') + '">' + c.change + '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderPlanBreakdown(plans) {
    var container = document.getElementById('planBreakdown');
    if (!container) return;

    if (!plans.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);padding:16px 0;">No paid users yet.</p>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:14px;padding:4px 0;">';
    for (var i = 0; i < plans.length; i++) {
      var p = plans[i];
      var label  = PLAN_LABELS[p.plan]  || p.plan;
      var color  = PLAN_COLOR[p.plan]   || '#6366f1';
      var price  = PLAN_MRR[p.plan]     || 0;
      var count  = parseInt(p.cnt, 10)  || 0;
      var planMrr = price * count;
      html += '<div style="display:flex;align-items:center;gap:12px;">';
      html += '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;"></div>';
      html += '<div style="flex:1;">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">';
      html += '<span style="font-size:14px;font-weight:600;color:var(--text-primary);">' + label + '</span>';
      html += '<span style="font-size:13px;color:var(--text-secondary);">' + count + ' users · $' + planMrr.toLocaleString() + '/mo</span>';
      html += '</div>';
      html += '<div style="height:6px;background:var(--border-color);border-radius:3px;">';
      html += '<div style="height:6px;border-radius:3px;background:' + color + ';width:' + Math.min(count * 20, 100) + '%;transition:width .4s;"></div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderStatusBreakdown(byStatus) {
    var container = document.getElementById('statusBreakdown');
    if (!container) return;

    var order = ['active', 'pending_payment', 'suspended', 'cancelled'];
    var html = '<div style="display:flex;flex-direction:column;gap:12px;padding:4px 0;">';
    for (var i = 0; i < order.length; i++) {
      var key   = order[i];
      var count = parseInt(byStatus[key] || 0, 10);
      var label = STATUS_LABELS[key] || key;
      var cls   = STATUS_COLOR[key]  || 'positive';
      html += '<div class="deal-row">';
      html += '<div class="deal-info"><div class="deal-title">' + label + '</div></div>';
      html += '<div class="deal-meta">';
      html += '<div class="deal-value">' + count + '</div>';
      html += '<span class="stat-change ' + cls + '" style="font-size:11px;">' + (count === 1 ? 'user' : 'users') + '</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderRecentUsers(users) {
    var container = document.getElementById('recentUsers');
    if (!container) return;

    if (!users.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);padding:16px 0;">No users yet.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var initials = (u.name || 'U').split(' ').map(function (w) { return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
      var planLabel  = PLAN_LABELS[u.plan]    || u.plan    || '—';
      var statusCls  = STATUS_COLOR[u.status] || 'positive';
      var statusLbl  = STATUS_LABELS[u.status] || u.status || '—';
      var joined = u.created_at ? u.created_at.slice(0, 10) : '—';

      html += '<div class="contact-row">';
      html += '<div class="contact-avatar">' + initials + '</div>';
      html += '<div class="contact-info">';
      html += '<div class="contact-name">' + esc(u.name || '—') + '</div>';
      html += '<div class="contact-company">' + esc(u.email || '—') + ' · ' + joined + '</div>';
      html += '</div>';
      html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">';
      html += '<span class="stat-change positive" style="font-size:11px;">' + planLabel + '</span>';
      html += '<span class="stat-change ' + statusCls + '" style="font-size:11px;">' + statusLbl + '</span>';
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderRecentLeads(leads) {
    var container = document.getElementById('recentLeads');
    if (!container) return;

    if (!leads.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);padding:16px 0;">No demo leads yet.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < leads.length; i++) {
      var l = leads[i];
      var initials = (l.name || 'L').split(' ').map(function (w) { return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
      var joined = l.created_at ? l.created_at.slice(0, 10) : '—';
      var logins = parseInt(l.login_count || 0, 10);

      html += '<div class="contact-row">';
      html += '<div class="contact-avatar" style="background:var(--primary-light);color:var(--primary);">' + initials + '</div>';
      html += '<div class="contact-info">';
      html += '<div class="contact-name">' + esc(l.name || '—') + '</div>';
      html += '<div class="contact-company">' + esc(l.company || l.email || '—') + ' · ' + joined + '</div>';
      html += '</div>';
      html += '<span class="stat-change ' + (logins >= 3 ? 'positive' : 'negative') + '" style="font-size:11px;white-space:nowrap;">' + logins + ' login' + (logins !== 1 ? 's' : '') + '</span>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();

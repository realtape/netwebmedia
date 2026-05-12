'use strict';

/* ── Helpers ── */
function esc(s) {
  var d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function fmtMoney(n) { return '$' + fmt(n); }
function fmtDate(s) {
  if (!s) return '—';
  var d = new Date(s.replace(' ', 'T') + 'Z');
  return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function pill(val, prefix) {
  if (!val) return '<span class="pill">—</span>';
  var cls = 'pill pill-' + (prefix ? prefix + val : val).replace(/[^a-z0-9_-]/gi, '');
  return '<span class="' + cls + '">' + esc(val) + '</span>';
}

/* ── Tab switching ── */
document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    var panel = document.getElementById('tab-' + btn.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

/* ── Logout ── */
document.getElementById('logoutBtn').addEventListener('click', async function() {
  await fetch('/api/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' })
  }).catch(function() {});
  window.location.href = '/login.php';
});

/* ── Stats / Overview ── */
async function loadStats() {
  try {
    var res  = await fetch('/api/stats.php');
    var data = await res.json();
    if (!res.ok) return;

    setText('s-mrr',      fmtMoney(data.mrr));
    setText('s-arr',      fmtMoney(data.arr));
    setText('s-users',    fmt(data.totalUsers));
    setText('s-new',      fmt(data.newUsersMonth));
    setText('s-contacts', fmt(data.totalContacts));
    setText('s-deals',    fmt(data.totalDeals));

    document.querySelectorAll('.stat-card').forEach(function(c) { c.classList.remove('loading'); });

    renderDist('distStatus', data.byStatus, '#010F3B');
    renderPlanDist('distPlan', data.byPlan);
    renderRecentUsers(data.recentUsers || []);
    renderLeads(data.recentLeads || []);
  } catch (e) {
    console.error('loadStats', e);
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderDist(elId, obj, barColor) {
  var el = document.getElementById(elId);
  if (!el) return;
  var total = Object.values(obj).reduce(function(a, b) { return +a + +b; }, 0) || 1;
  el.innerHTML = Object.entries(obj).sort(function(a, b) { return b[1] - a[1]; }).map(function(pair) {
    var pct = Math.round((pair[1] / total) * 100);
    return '<div class="dist-row-item">' +
      '<span class="key">' + esc(pair[0]) + '</span>' +
      '<span class="bar-wrap"><span class="bar" style="width:' + pct + '%;background:' + barColor + '"></span></span>' +
      '<span class="count">' + fmt(pair[1]) + '</span>' +
    '</div>';
  }).join('');
}

function renderPlanDist(elId, rows) {
  var el = document.getElementById(elId);
  if (!el) return;
  var total = rows.reduce(function(a, r) { return a + +r.cnt; }, 0) || 1;
  var colors = { starter: '#1d4ed8', professional: '#7e22ce', enterprise: '#c2410c' };
  el.innerHTML = rows.map(function(r) {
    var pct = Math.round((r.cnt / total) * 100);
    return '<div class="dist-row-item">' +
      '<span class="key">' + esc(r.plan || '(none)') + '</span>' +
      '<span class="bar-wrap"><span class="bar" style="width:' + pct + '%;background:' + (colors[r.plan] || '#6b7280') + '"></span></span>' +
      '<span class="count">' + fmt(r.cnt) + '</span>' +
    '</div>';
  }).join('');
}

function renderRecentUsers(users) {
  var tbody = document.getElementById('recentUsersBody');
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No users yet</td></tr>'; return; }
  tbody.innerHTML = users.map(function(u) {
    return '<tr>' +
      '<td>' + esc(u.name) + '</td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td>' + esc(u.company || '—') + '</td>' +
      '<td>' + pill(u.role) + '</td>' +
      '<td>' + pill(u.plan) + '</td>' +
      '<td>' + pill(u.status) + '</td>' +
      '<td>' + fmtDate(u.created_at) + '</td>' +
    '</tr>';
  }).join('');
}

function renderLeads(leads) {
  var tbody = document.getElementById('leadsBody');
  if (!tbody) return;
  if (!leads.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No leads yet</td></tr>'; return; }
  tbody.innerHTML = leads.map(function(l) {
    return '<tr>' +
      '<td>' + esc(l.name) + '</td>' +
      '<td>' + esc(l.email) + '</td>' +
      '<td>' + esc(l.company || '—') + '</td>' +
      '<td>' + esc(l.phone || '—') + '</td>' +
      '<td>' + esc(l.source || '—') + '</td>' +
      '<td>' + fmt(l.login_count || 0) + '</td>' +
      '<td>' + fmtDate(l.created_at) + '</td>' +
    '</tr>';
  }).join('');
}

/* ── Users tab ── */
var ALLOWED_STATUSES = ['active', 'pending_payment', 'suspended', 'cancelled'];
var ALLOWED_PLANS    = ['starter', 'professional', 'enterprise'];
var ALLOWED_ROLES    = ['user', 'superadmin'];

async function loadUsers(q, status) {
  var tbody = document.getElementById('usersBody');
  tbody.innerHTML = '<tr><td colspan="9" class="empty">Loading…</td></tr>';
  var url = '/api/users.php?q=' + encodeURIComponent(q || '') + '&status=' + encodeURIComponent(status || '');
  try {
    var res  = await fetch(url);
    var data = await res.json();
    renderUsers(data.users || []);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">Failed to load users</td></tr>';
  }
}

function renderUsers(users) {
  var tbody = document.getElementById('usersBody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty">No users found</td></tr>'; return; }
  tbody.innerHTML = users.map(function(u) {
    var statusOpts = ALLOWED_STATUSES.map(function(s) {
      return '<option value="' + s + '"' + (u.status === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
    var planOpts = ALLOWED_PLANS.map(function(p) {
      return '<option value="' + p + '"' + (u.plan === p ? ' selected' : '') + '>' + p + '</option>';
    }).join('');
    var roleOpts = ALLOWED_ROLES.map(function(r) {
      return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
    return '<tr data-uid="' + esc(u.id) + '">' +
      '<td>' + esc(u.name) + '</td>' +
      '<td title="' + esc(u.email) + '">' + esc(u.email) + '</td>' +
      '<td>' + esc(u.company || '—') + '</td>' +
      '<td><select class="action-select role-sel">' + roleOpts + '</select></td>' +
      '<td><select class="action-select plan-sel">' + planOpts + '</select></td>' +
      '<td><select class="action-select status-sel">' + statusOpts + '</select></td>' +
      '<td>' + fmtDate(u.created_at) + '</td>' +
      '<td>' + fmtDate(u.last_login) + '</td>' +
      '<td><div class="action-row"><button class="btn-save save-btn">Save</button><span class="action-msg"></span></div></td>' +
    '</tr>';
  }).join('');

  // Bind save buttons
  tbody.querySelectorAll('.save-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var row = btn.closest('tr');
      var uid = +row.dataset.uid;
      var msg = row.querySelector('.action-msg');
      btn.disabled = true;
      msg.textContent = '';
      try {
        var res = await fetch('/api/users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id:     uid,
            role:   row.querySelector('.role-sel').value,
            plan:   row.querySelector('.plan-sel').value,
            status: row.querySelector('.status-sel').value,
          })
        });
        var data = await res.json();
        if (res.ok) {
          msg.textContent = 'Saved';
          msg.style.color = '#15803d';
        } else {
          msg.textContent = data.error || 'Error';
          msg.style.color = '#b91c1c';
        }
      } catch (e) {
        msg.textContent = 'Network error';
        msg.style.color = '#b91c1c';
      }
      btn.disabled = false;
      setTimeout(function() { msg.textContent = ''; }, 3000);
    });
  });
}

document.getElementById('userSearchBtn').addEventListener('click', function() {
  loadUsers(
    document.getElementById('userSearch').value,
    document.getElementById('userStatusFilter').value
  );
});
document.getElementById('userSearch').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('userSearchBtn').click();
});

// Load users when tab is first clicked
var usersLoaded = false;
document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.dataset.tab === 'users' && !usersLoaded) {
      usersLoaded = true;
      loadUsers('', '');
    }
  });
});

/* ── Boot ── */
loadStats();

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

function renderLeads(contacts) {
  var tbody = document.getElementById('leadsBody');
  if (!tbody) return;
  if (!contacts.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty">No contacts found</td></tr>'; return; }
  tbody.innerHTML = contacts.map(function(c) {
    var val = c.value && +c.value > 0 ? fmtMoney(+c.value) : '—';
    return '<tr>' +
      '<td>' + esc(c.name) + '</td>' +
      '<td>' + esc(c.email || '—') + '</td>' +
      '<td>' + esc(c.company || '—') + '</td>' +
      '<td>' + esc(c.phone || '—') + '</td>' +
      '<td>' + esc(c.role || '—') + '</td>' +
      '<td>' + pill(c.status) + '</td>' +
      '<td>' + val + '</td>' +
      '<td>' + fmtDate(c.created_at) + '</td>' +
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

/* ── Contacts / Leads tab ── */
async function loadContacts(q, status) {
  var tbody = document.getElementById('leadsBody');
  tbody.innerHTML = '<tr><td colspan="8" class="empty">Loading…</td></tr>';
  var url = '/api/contacts.php?q=' + encodeURIComponent(q || '') + '&status=' + encodeURIComponent(status || '');
  try {
    var res  = await fetch(url);
    var data = await res.json();
    renderLeads(data.contacts || []);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Failed to load contacts</td></tr>';
  }
}

document.getElementById('leadSearchBtn').addEventListener('click', function() {
  loadContacts(
    document.getElementById('leadSearch').value,
    document.getElementById('leadStatusFilter').value
  );
});
document.getElementById('leadSearch').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('leadSearchBtn').click();
});

/* ── Deals tab ── */
var dealsStagesLoaded = false;

async function loadDealStages() {
  if (dealsStagesLoaded) return;
  dealsStagesLoaded = true;
  try {
    var res  = await fetch('/api/deals.php?r=stages');
    var data = await res.json();
    var sel  = document.getElementById('dealStageFilter');
    if (!sel) return;
    (data.stages || []).forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  } catch (e) { /* non-fatal */ }
}

async function loadDeals(q, stageId) {
  var tbody = document.getElementById('dealsBody');
  tbody.innerHTML = '<tr><td colspan="9" class="empty">Loading…</td></tr>';
  var url = '/api/deals.php?q=' + encodeURIComponent(q || '') + '&stage=' + encodeURIComponent(stageId || '');
  try {
    var res  = await fetch(url);
    var data = await res.json();
    renderDeals(data.deals || []);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">Failed to load deals</td></tr>';
  }
}

function renderDeals(deals) {
  var tbody = document.getElementById('dealsBody');
  if (!deals.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty">No deals found</td></tr>'; return; }
  tbody.innerHTML = deals.map(function(d) {
    var stageColor = d.stage_color || '#6b7280';
    var stagePill  = d.stage_name
      ? '<span class="pill" style="background:' + stageColor + '20;color:' + stageColor + ';border:1px solid ' + stageColor + '40">' + esc(d.stage_name) + '</span>'
      : '<span class="pill">—</span>';
    var prob = d.probability != null ? d.probability + '%' : '—';
    var val  = d.value && +d.value > 0 ? fmtMoney(+d.value) : '—';
    var contact = d.contact_name ? esc(d.contact_name) + (d.contact_email ? '<br><small style="color:#6b7280">' + esc(d.contact_email) + '</small>' : '') : '—';
    return '<tr>' +
      '<td>' + esc(d.title) + '</td>' +
      '<td>' + esc(d.company || '—') + '</td>' +
      '<td>' + contact + '</td>' +
      '<td>' + stagePill + '</td>' +
      '<td>' + val + '</td>' +
      '<td>' + prob + '</td>' +
      '<td style="max-width:200px;white-space:normal">' + esc(d.next_action || '—') + '</td>' +
      '<td>' + fmtDate(d.next_followup_date) + '</td>' +
      '<td>' + fmtDate(d.updated_at) + '</td>' +
    '</tr>';
  }).join('');
}

document.getElementById('dealSearchBtn').addEventListener('click', function() {
  loadDeals(
    document.getElementById('dealSearch').value,
    document.getElementById('dealStageFilter').value
  );
});
document.getElementById('dealSearch').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('dealSearchBtn').click();
});

/* ── Conversations tab ── */
async function loadConversations(q, channel) {
  var tbody = document.getElementById('convBody');
  tbody.innerHTML = '<tr><td colspan="6" class="empty">Loading…</td></tr>';
  var url = '/api/conversations.php?q=' + encodeURIComponent(q || '') + '&channel=' + encodeURIComponent(channel || '');
  try {
    var res  = await fetch(url);
    var data = await res.json();
    renderConversations(data.conversations || []);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Failed to load conversations</td></tr>';
  }
}

var CHANNEL_ICON = { email: '✉', sms: '📱', whatsapp: '💬' };

function renderConversations(convs) {
  var tbody = document.getElementById('convBody');
  if (!convs.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No conversations found</td></tr>'; return; }
  tbody.innerHTML = convs.map(function(c) {
    var icon = CHANNEL_ICON[c.channel] || '💬';
    var preview = c.last_msg ? esc(String(c.last_msg).slice(0, 80)) + (c.last_msg.length > 80 ? '…' : '') : '—';
    var unread = c.unread > 0 ? ' <span class="pill pill-lead" style="font-size:0.65rem;padding:1px 5px">' + c.unread + '</span>' : '';
    return '<tr class="conv-row" data-convid="' + esc(c.id) + '" data-subject="' + esc(c.subject || '(no subject)') + '" style="cursor:pointer">' +
      '<td>' + icon + ' ' + pill(c.channel, 'ch-') + '</td>' +
      '<td>' + esc(c.contact_name || '—') + (c.contact_email ? '<br><small style="color:#6b7280">' + esc(c.contact_email) + '</small>' : '') + '</td>' +
      '<td>' + esc(c.subject || '(no subject)') + unread + '</td>' +
      '<td style="text-align:center">' + fmt(c.msg_count || 0) + '</td>' +
      '<td style="max-width:220px;white-space:normal;color:#6b7280;font-size:0.82rem">' + preview + '</td>' +
      '<td>' + fmtDate(c.updated_at) + '</td>' +
    '</tr>';
  }).join('');

  tbody.querySelectorAll('.conv-row').forEach(function(row) {
    row.addEventListener('click', function() {
      openThread(+row.dataset.convid, row.dataset.subject);
    });
  });
}

async function openThread(convId, subject) {
  var panel = document.getElementById('threadPanel');
  var title = document.getElementById('threadTitle');
  var msgs  = document.getElementById('threadMessages');
  panel.style.display = 'block';
  title.textContent = subject;
  msgs.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280">Loading…</div>';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    var res  = await fetch('/api/conversations.php?conv=' + convId);
    var data = await res.json();
    var list = data.messages || [];
    if (!list.length) { msgs.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280">No messages</div>'; return; }
    msgs.innerHTML = list.map(function(m) {
      var isAgent = m.sender === 'agent';
      var bg  = isAgent ? '#010F3B' : '#f3f4f6';
      var clr = isAgent ? '#ffffff' : '#1f2937';
      var align = isAgent ? 'flex-end' : 'flex-start';
      return '<div style="display:flex;justify-content:' + align + '">' +
        '<div style="max-width:70%;background:' + bg + ';color:' + clr + ';padding:0.6rem 0.9rem;border-radius:0.75rem;font-size:0.85rem">' +
          '<div style="font-size:0.7rem;opacity:0.65;margin-bottom:0.3rem">' + esc(m.sender) + ' · ' + fmtDate(m.sent_at) + '</div>' +
          '<div>' + esc(m.body) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    msgs.innerHTML = '<div style="text-align:center;padding:2rem;color:#b91c1c">Failed to load messages</div>';
  }
}

document.getElementById('threadCloseBtn').addEventListener('click', function() {
  document.getElementById('threadPanel').style.display = 'none';
});

document.getElementById('convSearchBtn').addEventListener('click', function() {
  loadConversations(
    document.getElementById('convSearch').value,
    document.getElementById('convChannelFilter').value
  );
});
document.getElementById('convSearch').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('convSearchBtn').click();
});

/* ── Lazy-load tabs on first click ── */
var usersLoaded         = false;
var contactsLoaded      = false;
var dealsLoaded         = false;
var conversationsLoaded = false;
document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.dataset.tab === 'users' && !usersLoaded) {
      usersLoaded = true;
      loadUsers('', '');
    }
    if (btn.dataset.tab === 'leads' && !contactsLoaded) {
      contactsLoaded = true;
      loadContacts('', '');
    }
    if (btn.dataset.tab === 'deals' && !dealsLoaded) {
      dealsLoaded = true;
      loadDealStages().then(function() { loadDeals('', ''); });
    }
    if (btn.dataset.tab === 'conversations' && !conversationsLoaded) {
      conversationsLoaded = true;
      loadConversations('', '');
    }
  });
});

/* ── Boot ── */
loadStats();

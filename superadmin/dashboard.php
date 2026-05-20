<?php
require_once __DIR__ . '/api/lib/session.php';
$admin = sa_require();
$adminName = htmlspecialchars($admin['name'], ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NWM Superadmin</title>
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="/css/admin.css">
</head>
<body>
<!-- Header -->
<header class="top-bar">
  <div class="top-bar-inner">
    <span class="brand">NetWeb<em>Media</em> <span class="badge">Superadmin</span></span>
    <nav class="tabs">
      <button class="tab active" data-tab="overview">Overview</button>
      <button class="tab" data-tab="users">Users</button>
      <button class="tab" data-tab="leads">Contacts</button>
      <button class="tab" data-tab="deals">Deals</button>
      <button class="tab" data-tab="conversations">Conversations</button>
    </nav>
    <div class="top-bar-right">
      <span class="admin-name"><?= $adminName ?></span>
      <button class="btn-logout" id="logoutBtn">Log out</button>
    </div>
  </div>
</header>

<!-- Content -->
<main class="main">

  <!-- Overview tab -->
  <section id="tab-overview" class="tab-panel active">
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card loading"><div class="stat-label">MRR</div><div class="stat-val" id="s-mrr">—</div></div>
      <div class="stat-card loading"><div class="stat-label">ARR</div><div class="stat-val" id="s-arr">—</div></div>
      <div class="stat-card loading"><div class="stat-label">Total Users</div><div class="stat-val" id="s-users">—</div></div>
      <div class="stat-card loading"><div class="stat-label">New This Month</div><div class="stat-val" id="s-new">—</div></div>
      <div class="stat-card loading"><div class="stat-label">Contacts</div><div class="stat-val" id="s-contacts">—</div></div>
      <div class="stat-card loading"><div class="stat-label">Deals</div><div class="stat-val" id="s-deals">—</div></div>
    </div>

    <div class="dist-row">
      <div class="dist-card">
        <h3 class="dist-title">By Status</h3>
        <div id="distStatus" class="dist-list"></div>
      </div>
      <div class="dist-card">
        <h3 class="dist-title">By Plan (active users)</h3>
        <div id="distPlan" class="dist-list"></div>
      </div>
    </div>

    <div class="section-card">
      <h3 class="section-title">Recent Signups</h3>
      <div class="table-wrap" id="recentUsersWrap">
        <table class="data-table" id="recentUsersTable">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Company</th>
            <th>Role</th><th>Plan</th><th>Status</th><th>Joined</th>
          </tr></thead>
          <tbody id="recentUsersBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Users tab -->
  <section id="tab-users" class="tab-panel">
    <div class="toolbar">
      <input class="search-input" id="userSearch" type="search" placeholder="Search name, email, company…">
      <select class="filter-select" id="userStatusFilter">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="pending_payment">Pending payment</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button class="btn-primary" id="userSearchBtn">Search</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="usersTable">
        <thead><tr>
          <th>Name</th><th>Email</th><th>Company</th>
          <th>Role</th><th>Plan</th><th>Status</th>
          <th>Joined</th><th>Last login</th><th>Actions</th>
        </tr></thead>
        <tbody id="usersBody"><tr><td colspan="9" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>

  <!-- Leads tab -->
  <section id="tab-leads" class="tab-panel">
    <div class="toolbar">
      <input class="search-input" id="leadSearch" type="search" placeholder="Search name, email, company, phone…">
      <select class="filter-select" id="leadStatusFilter">
        <option value="">All statuses</option>
        <option value="lead">Lead</option>
        <option value="prospect">Prospect</option>
        <option value="customer">Customer</option>
        <option value="churned">Churned</option>
      </select>
      <button class="btn-primary" id="leadSearchBtn">Search</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="leadsTable">
        <thead><tr>
          <th>Name</th><th>Email</th><th>Company</th>
          <th>Phone</th><th>Role</th><th>Status</th><th>Value</th><th>Created</th>
        </tr></thead>
        <tbody id="leadsBody"><tr><td colspan="8" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>


  <!-- Deals tab -->
  <section id="tab-deals" class="tab-panel">
    <div class="toolbar">
      <input class="search-input" id="dealSearch" type="search" placeholder="Search title, company…">
      <select class="filter-select" id="dealStageFilter">
        <option value="">All stages</option>
      </select>
      <button class="btn-primary" id="dealSearchBtn">Search</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="dealsTable">
        <thead><tr>
          <th>Title</th><th>Company</th><th>Contact</th><th>Stage</th>
          <th>Value</th><th>Prob.</th><th>Next Action</th><th>Follow-up</th><th>Updated</th>
        </tr></thead>
        <tbody id="dealsBody"><tr><td colspan="9" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>

  <!-- Conversations tab -->
  <section id="tab-conversations" class="tab-panel">
    <div class="toolbar">
      <input class="search-input" id="convSearch" type="search" placeholder="Search subject, contact…">
      <select class="filter-select" id="convChannelFilter">
        <option value="">All channels</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <button class="btn-primary" id="convSearchBtn">Search</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="convTable">
        <thead><tr>
          <th>Channel</th><th>Contact</th><th>Subject</th>
          <th>Messages</th><th>Last Message</th><th>Updated</th>
        </tr></thead>
        <tbody id="convBody"><tr><td colspan="6" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>

    <!-- Message thread panel -->
    <div id="threadPanel" style="display:none;margin-top:1.5rem;" class="section-card">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
        <button class="btn-primary" id="threadCloseBtn" style="padding:0.25rem 0.75rem;font-size:0.8rem;">← Back</button>
        <h3 class="section-title" id="threadTitle" style="margin:0"></h3>
      </div>
      <div id="threadMessages" style="display:flex;flex-direction:column;gap:0.75rem;max-height:500px;overflow-y:auto;padding:0.5rem 0;"></div>
    </div>
  </section>

</main>

<script>
window.SA_ADMIN = <?= json_encode(['name' => $admin['name'], 'email' => $admin['email']]) ?>;
</script>
<script src="/js/dashboard.js"></script>
</body>
</html>

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
      <button class="tab" data-tab="leads">Leads</button>
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
    <div class="section-card" style="margin-top:0">
      <h3 class="section-title">Recent Demo Leads</h3>
      <div class="table-wrap">
        <table class="data-table" id="leadsTable">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Company</th>
            <th>Phone</th><th>Source</th><th>Logins</th><th>Date</th>
          </tr></thead>
          <tbody id="leadsBody"><tr><td colspan="7" class="empty">Loading…</td></tr></tbody>
        </table>
      </div>
    </div>
  </section>

</main>

<script>
window.SA_ADMIN = <?= json_encode(['name' => $admin['name'], 'email' => $admin['email']]) ?>;
</script>
<script src="/js/dashboard.js"></script>
</body>
</html>

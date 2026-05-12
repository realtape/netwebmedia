<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_require();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sa_error('Method not allowed', 405);

try {
    $db = getDB();

    $plan_mrr = ['starter' => 29, 'professional' => 79, 'enterprise' => 199];

    $byStatus = $db->query(
        'SELECT status, COUNT(*) AS cnt FROM users GROUP BY status'
    )->fetchAll(PDO::FETCH_KEY_PAIR);

    $byPlan = $db->query(
        "SELECT plan, COUNT(*) AS cnt FROM users WHERE status = 'active' GROUP BY plan"
    )->fetchAll();

    $mrr = 0;
    foreach ($byPlan as $row) {
        $mrr += ($plan_mrr[$row['plan']] ?? 0) * (int)$row['cnt'];
    }

    $totalUsers    = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $totalContacts = (int)$db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();
    $totalDeals    = (int)$db->query('SELECT COUNT(*) FROM deals')->fetchColumn();
    $newUsersMonth = (int)$db->query(
        "SELECT COUNT(*) FROM users WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
    )->fetchColumn();

    $recentUsers = $db->query(
        'SELECT id, name, email, company, role, plan, status, niche, created_at, last_login
         FROM users ORDER BY created_at DESC LIMIT 20'
    )->fetchAll();

    $recentLeads = $db->query(
        'SELECT id, name, email, company, phone, source, created_at, login_count
         FROM leads ORDER BY created_at DESC LIMIT 10'
    )->fetchAll();

    sa_json([
        'mrr'           => $mrr,
        'arr'           => $mrr * 12,
        'totalUsers'    => $totalUsers,
        'newUsersMonth' => $newUsersMonth,
        'totalContacts' => $totalContacts,
        'totalDeals'    => $totalDeals,
        'byStatus'      => $byStatus,
        'byPlan'        => $byPlan,
        'recentUsers'   => $recentUsers,
        'recentLeads'   => $recentLeads,
    ]);
} catch (Exception $e) {
    error_log('[superadmin/stats] ' . $e->getMessage());
    sa_error('Database error', 500);
}

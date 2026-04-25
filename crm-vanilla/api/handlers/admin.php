<?php
require_once __DIR__ . '/../lib/guard.php';
$user = require_guard();

if (($user['role'] ?? '') !== 'superadmin') {
    jsonError('Forbidden', 403);
}

if ($method !== 'GET') jsonError('Method not allowed', 405);

$db = getDB();

$plan_mrr = ['starter' => 29, 'professional' => 79, 'enterprise' => 199];

// --- User counts by status ---
$byStatus = $db->query("
    SELECT status, COUNT(*) as cnt
    FROM users
    GROUP BY status
")->fetchAll(PDO::FETCH_KEY_PAIR);

// --- User counts + MRR by plan (active only) ---
$byPlan = $db->query("
    SELECT plan, COUNT(*) as cnt
    FROM users
    WHERE status = 'active'
    GROUP BY plan
")->fetchAll();

$mrr = 0;
foreach ($byPlan as $row) {
    $mrr += ($plan_mrr[$row['plan']] ?? 0) * (int)$row['cnt'];
}

// --- Platform totals ---
$totalUsers    = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
$totalContacts = (int)$db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();
$totalDeals    = (int)$db->query('SELECT COUNT(*) FROM deals')->fetchColumn();

// New signups this month
$newUsersMonth = (int)$db->query("
    SELECT COUNT(*) FROM users
    WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
")->fetchColumn();

// --- Recent users (last 15) ---
$recentUsers = $db->query("
    SELECT id, name, email, company, role, plan, status, created_at, last_login
    FROM users
    ORDER BY created_at DESC
    LIMIT 15
")->fetchAll();

// --- Recent leads (demo signups, last 10) ---
$recentLeads = $db->query("
    SELECT id, name, email, company, phone, source, created_at, login_count
    FROM leads
    ORDER BY created_at DESC
    LIMIT 10
")->fetchAll();

jsonResponse([
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

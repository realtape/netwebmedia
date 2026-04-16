<?php
$db = getDB();

if ($method !== 'GET') jsonError('Method not allowed', 405);

$stats = [];

// Total contacts
$stats['totalContacts'] = (int)$db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();

// New leads (created this month)
$stats['newLeads'] = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE status = 'lead' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')")->fetchColumn();

// Active deals (not closed)
$stats['activeDeals'] = (int)$db->query("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')")->fetchColumn();

// Revenue (sum of closed-won deals)
$stats['revenue'] = (float)$db->query("SELECT COALESCE(SUM(d.value), 0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'")->fetchColumn();

// Conversion rate
$totalDeals = (int)$db->query('SELECT COUNT(*) FROM deals')->fetchColumn();
$wonDeals = (int)$db->query("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'")->fetchColumn();
$stats['conversion'] = $totalDeals > 0 ? round(($wonDeals / $totalDeals) * 100, 1) : 0;

// Average deal value
$stats['avgDeal'] = (float)$db->query("SELECT COALESCE(AVG(d.value), 0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'")->fetchColumn();

// Revenue by month (last 7 months)
$revenueData = $db->query("
    SELECT DATE_FORMAT(d.created_at, '%Y-%m') as month,
           COALESCE(SUM(d.value), 0) as value
    FROM deals d
    JOIN pipeline_stages ps ON d.stage_id = ps.id
    WHERE ps.name = 'Closed Won'
      AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
    GROUP BY DATE_FORMAT(d.created_at, '%Y-%m')
    ORDER BY month
")->fetchAll();
$stats['revenueData'] = $revenueData;

// Today's schedule
$today = date('Y-m-d');
$stmt = $db->prepare("SELECT * FROM events WHERE event_date = ? ORDER BY start_hour");
$stmt->execute([$today]);
$stats['scheduleToday'] = $stmt->fetchAll();

// Recent contacts (5)
$stats['recentContacts'] = $db->query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5')->fetchAll();

// Top active deals (5)
$stats['activeDealsTop'] = $db->query("SELECT d.*, ps.name as stage FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost') ORDER BY d.value DESC LIMIT 5")->fetchAll();

jsonResponse($stats);

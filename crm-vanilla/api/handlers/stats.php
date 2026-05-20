<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();

if ($method !== 'GET') jsonError('Method not allowed', 405);

// Org-scope every aggregate. Pre-migration: $orgWhere is empty (no clause), preserving
// the legacy global aggregates. Post-migration: each query gets a per-org filter and
// the master org keeps its aggregate-everything view via org_where()'s '1=1'.
$orgWhere = '';
$orgParams = [];
$orgWhereD = '';
$orgParamsD = [];
$orgWhereE = '';
$orgParamsE = [];
if (is_org_schema_applied()) {
    [$orgWhere, $orgParams]   = org_where();      // for contacts (no alias)
    [$orgWhereD, $orgParamsD] = org_where('d');   // for deals d
    [$orgWhereE, $orgParamsE] = org_where();      // for events / contacts (no alias)
}

$stats = [];

$run = function(string $sql, array $params = []) use ($db) {
    $st = $db->prepare($sql);
    $st->execute($params);
    return $st;
};

// Total contacts
$stats['totalContacts'] = (int)$run('SELECT COUNT(*) FROM contacts' . ($orgWhere ? ' WHERE ' . $orgWhere : ''), $orgParams)->fetchColumn();

// New leads (created this month)
$stats['newLeads'] = (int)$run("SELECT COUNT(*) FROM contacts WHERE status = 'lead' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')" . ($orgWhere ? ' AND ' . $orgWhere : ''), $orgParams)->fetchColumn();

// Active deals (not closed)
$stats['activeDeals'] = (int)$run("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')" . ($orgWhereD ? ' AND ' . $orgWhereD : ''), $orgParamsD)->fetchColumn();

// Revenue (sum of closed-won deals)
$stats['revenue'] = (float)$run("SELECT COALESCE(SUM(d.value), 0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'" . ($orgWhereD ? ' AND ' . $orgWhereD : ''), $orgParamsD)->fetchColumn();

// Conversion rate
$totalDeals = (int)$run('SELECT COUNT(*) FROM deals' . ($orgWhere ? ' WHERE ' . $orgWhere : ''), $orgParams)->fetchColumn();
$wonDeals = (int)$run("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'" . ($orgWhereD ? ' AND ' . $orgWhereD : ''), $orgParamsD)->fetchColumn();
$stats['conversion'] = $totalDeals > 0 ? round(($wonDeals / $totalDeals) * 100, 1) : 0;

// Average deal value
$stats['avgDeal'] = (float)$run("SELECT COALESCE(AVG(d.value), 0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won'" . ($orgWhereD ? ' AND ' . $orgWhereD : ''), $orgParamsD)->fetchColumn();

// Revenue by month (last 7 months)
$revSql = "
    SELECT DATE_FORMAT(d.created_at, '%Y-%m') as month,
           COALESCE(SUM(d.value), 0) as value
    FROM deals d
    JOIN pipeline_stages ps ON d.stage_id = ps.id
    WHERE ps.name = 'Closed Won'
      AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)";
if ($orgWhereD) $revSql .= ' AND ' . $orgWhereD;
$revSql .= " GROUP BY DATE_FORMAT(d.created_at, '%Y-%m') ORDER BY month";
$stats['revenueData'] = $run($revSql, $orgParamsD)->fetchAll();

// Today's schedule
$today = date('Y-m-d');
$evSql = "SELECT * FROM events WHERE event_date = ?";
$evParams = [$today];
if ($orgWhereE) { $evSql .= ' AND ' . $orgWhereE; $evParams = array_merge($evParams, $orgParamsE); }
$evSql .= " ORDER BY start_hour";
$stats['scheduleToday'] = $run($evSql, $evParams)->fetchAll();

// Recent contacts (5)
$rcSql = 'SELECT * FROM contacts';
if ($orgWhere) $rcSql .= ' WHERE ' . $orgWhere;
$rcSql .= ' ORDER BY created_at DESC LIMIT 5';
$stats['recentContacts'] = $run($rcSql, $orgParams)->fetchAll();

// Top active deals (5)
$tdSql = "SELECT d.*, ps.name as stage FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')";
if ($orgWhereD) $tdSql .= ' AND ' . $orgWhereD;
$tdSql .= " ORDER BY d.value DESC LIMIT 5";
$stats['activeDealsTop'] = $run($tdSql, $orgParamsD)->fetchAll();

jsonResponse($stats);

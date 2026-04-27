<?php
// reporting.php — GET /api/?r=reporting
// Returns live counts from contacts, deals/pipeline, and campaigns.
// All queries are wrapped in try/catch so missing tables return zeros.

if ($method !== 'GET') {
    jsonError('Method not allowed', 405);
}

$db = getDB();

// Ensure org_settings table exists (non-fatal if it fails)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS org_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {
    // ignore
}

/* ── CONTACTS ─────────────────────────────────────────────────────────── */

$contactsTotal = 0;
try {
    $row = $db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();
    $contactsTotal = (int)$row;
} catch (Exception $e) {}

$byStatus = ['lead' => 0, 'customer' => 0, 'prospect' => 0];
try {
    $stmt = $db->query('SELECT status, COUNT(*) as cnt FROM contacts GROUP BY status');
    foreach ($stmt->fetchAll() as $r) {
        $byStatus[$r['status']] = (int)$r['cnt'];
    }
} catch (Exception $e) {}

$byMonth = [];
try {
    $stmt = $db->query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
         FROM contacts
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month"
    );
    foreach ($stmt->fetchAll() as $r) {
        $byMonth[] = ['month' => $r['month'], 'count' => (int)$r['count']];
    }
} catch (Exception $e) {}

/* ── DEALS ────────────────────────────────────────────────────────────── */

$dealsTotal      = 0;
$dealsTotalValue = 0;
$byStage         = [];
$wonThisMonth    = 0;
$wonValueMonth   = 0;

try {
    $row = $db->query('SELECT COUNT(*), COALESCE(SUM(value),0) FROM deals')->fetch(\PDO::FETCH_NUM);
    $dealsTotal      = (int)$row[0];
    $dealsTotalValue = (float)$row[1];
} catch (Exception $e) {}

try {
    $stmt = $db->query(
        "SELECT ps.name as stage, COUNT(d.id) as count, COALESCE(SUM(d.value),0) as value
         FROM pipeline_stages ps
         LEFT JOIN deals d ON d.stage_id = ps.id
         GROUP BY ps.id, ps.name
         ORDER BY ps.sort_order"
    );
    foreach ($stmt->fetchAll() as $r) {
        $byStage[] = [
            'stage' => $r['stage'],
            'count' => (int)$r['count'],
            'value' => (float)$r['value']
        ];
    }
} catch (Exception $e) {}

try {
    $firstOfMonth = date('Y-m-01');
    $stmt = $db->prepare(
        "SELECT COUNT(*), COALESCE(SUM(d.value),0)
         FROM deals d
         JOIN pipeline_stages ps ON d.stage_id = ps.id
         WHERE ps.name = 'Closed Won'
           AND d.updated_at >= ?"
    );
    $stmt->execute([$firstOfMonth]);
    $row = $stmt->fetch(\PDO::FETCH_NUM);
    $wonThisMonth  = (int)$row[0];
    $wonValueMonth = (float)$row[1];
} catch (Exception $e) {}

/* ── CAMPAIGNS ────────────────────────────────────────────────────────── */

$campaignsTotal   = 0;
$avgOpenRate      = 0;
$avgClickRate     = 0;
$recentCampaigns  = [];

try {
    $campaignsTotal = (int)$db->query('SELECT COUNT(*) FROM campaigns')->fetchColumn();
} catch (Exception $e) {}

try {
    $stmt = $db->query(
        'SELECT name, sent_count, open_count, click_count
         FROM campaigns
         ORDER BY created_at DESC
         LIMIT 10'
    );
    $rows = $stmt->fetchAll();

    $totalOpen  = 0;
    $totalClick = 0;
    $counted    = 0;

    foreach ($rows as $r) {
        $sent    = (int)$r['sent_count'];
        $opened  = (int)$r['open_count'];
        $clicked = (int)$r['click_count'];

        $recentCampaigns[] = [
            'name'    => $r['name'],
            'sent'    => $sent,
            'opened'  => $opened,
            'clicked' => $clicked
        ];

        if ($sent > 0) {
            $totalOpen  += ($opened  / $sent) * 100;
            $totalClick += ($clicked / $sent) * 100;
            $counted++;
        }
    }

    if ($counted > 0) {
        $avgOpenRate  = round($totalOpen  / $counted, 1);
        $avgClickRate = round($totalClick / $counted, 1);
    }
} catch (Exception $e) {}

/* ── RESPONSE ─────────────────────────────────────────────────────────── */

jsonResponse([
    'contacts' => [
        'total'    => $contactsTotal,
        'by_status' => $byStatus,
        'by_month' => $byMonth
    ],
    'deals' => [
        'total'               => $dealsTotal,
        'total_value'         => $dealsTotalValue,
        'by_stage'            => $byStage,
        'won_this_month'      => $wonThisMonth,
        'won_value_this_month'=> $wonValueMonth
    ],
    'campaigns' => [
        'total'          => $campaignsTotal,
        'avg_open_rate'  => $avgOpenRate,
        'avg_click_rate' => $avgClickRate,
        'recent'         => $recentCampaigns
    ]
]);

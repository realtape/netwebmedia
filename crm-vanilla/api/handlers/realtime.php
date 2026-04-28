<?php
$db = getDB();

if ($method !== 'GET') jsonError('Method not allowed', 405);

$today = date('Y-m-d');
$data  = [];

/* ── Live KPIs ── */
$data['contactsToday']  = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE DATE(created_at) = '$today'")->fetchColumn();
$data['dealsActive']    = (int)$db->query("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')")->fetchColumn();
$data['pipelineValue']  = (float)$db->query("SELECT COALESCE(SUM(d.value),0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')")->fetchColumn();
$data['totalContacts']  = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

/* ── Email campaign stats today ── */
$emailsToday = $db->query("
    SELECT
        COUNT(*) as sent,
        SUM(opened_at IS NOT NULL) as opened,
        SUM(clicked_at IS NOT NULL) as clicked
    FROM campaign_sends
    WHERE DATE(sent_at) = '$today'
")->fetch();
$data['emailsSentToday']   = (int)($emailsToday['sent']    ?? 0);
$data['emailsOpenedToday'] = (int)($emailsToday['opened']  ?? 0);
$data['emailsClickedToday']= (int)($emailsToday['clicked'] ?? 0);

/* ── Growth: this month vs last month ── */
$data['contactsThisMonth'] = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();
$data['contactsLastMonth'] = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 MONTH),'%Y-%m-01') AND created_at < DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();

/* ── Contacts by status ── */
$data['byStatus'] = $db->query("
    SELECT status, COUNT(*) as cnt
    FROM contacts
    GROUP BY status
    ORDER BY cnt DESC
")->fetchAll();

/* ── Contacts by segment (top 8) ── */
$data['bySegment'] = $db->query("
    SELECT COALESCE(NULLIF(segment,''), 'other') as segment, COUNT(*) as cnt
    FROM contacts
    GROUP BY segment
    ORDER BY cnt DESC
    LIMIT 8
")->fetchAll();

/* ── Pipeline by stage ── */
$data['byStage'] = $db->query("
    SELECT ps.name, ps.color, ps.sort_order,
           COUNT(d.id) as cnt,
           COALESCE(SUM(d.value),0) as total
    FROM pipeline_stages ps
    LEFT JOIN deals d ON d.stage_id = ps.id
    GROUP BY ps.id
    ORDER BY ps.sort_order
")->fetchAll();

/* ── Hourly contact creation (last 24 h) ── */
$data['hourlyContacts'] = $db->query("
    SELECT HOUR(created_at) as hr, COUNT(*) as cnt
    FROM contacts
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
    GROUP BY HOUR(created_at)
    ORDER BY hr
")->fetchAll();

/* ── Activity feed (last 20 across contacts + deals + events) ── */
$feed = [];

$rows = $db->query("SELECT 'contact' as type, id, name as title, status as sub, '' as extra, created_at FROM contacts ORDER BY created_at DESC LIMIT 10")->fetchAll();
foreach ($rows as $r) {
    $feed[] = ['type' => 'contact', 'id' => (int)$r['id'], 'title' => $r['title'], 'sub' => $r['sub'], 'extra' => '', 'time' => $r['created_at']];
}

$rows = $db->query("SELECT d.id, d.title, d.value, ps.name as stage, d.created_at FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id ORDER BY d.created_at DESC LIMIT 10")->fetchAll();
foreach ($rows as $r) {
    $feed[] = ['type' => 'deal', 'id' => (int)$r['id'], 'title' => $r['title'], 'sub' => $r['stage'], 'extra' => '$' . number_format((float)$r['value'], 0), 'time' => $r['created_at']];
}

$rows = $db->query("SELECT id, title, type as sub, created_at FROM events ORDER BY created_at DESC LIMIT 6")->fetchAll();
foreach ($rows as $r) {
    $feed[] = ['type' => 'event', 'id' => (int)$r['id'], 'title' => $r['title'], 'sub' => $r['sub'], 'extra' => '', 'time' => $r['created_at']];
}

usort($feed, function ($a, $b) { return strcmp($b['time'], $a['time']); });
$data['feed'] = array_slice($feed, 0, 20);

/* ── Recent sent campaigns (last 5) ── */
$data['campaigns'] = $db->query("
    SELECT c.id, c.subject, c.sent_at,
           COUNT(cs.id) as sent,
           SUM(cs.opened_at IS NOT NULL) as opens,
           SUM(cs.clicked_at IS NOT NULL) as clicks
    FROM email_campaigns c
    LEFT JOIN campaign_sends cs ON cs.campaign_id = c.id
    WHERE c.status = 'sent'
    GROUP BY c.id
    ORDER BY c.sent_at DESC
    LIMIT 5
")->fetchAll();

$data['serverTime'] = date('Y-m-d H:i:s');

jsonResponse($data);

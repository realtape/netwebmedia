<?php
$db = getDB();

if ($method !== 'GET') jsonError('Method not allowed', 405);

$today = date('Y-m-d');
$data  = [];

/* ════════════════════════════════════════
   CRM — Live KPIs
════════════════════════════════════════ */

$q = function (string $sql, array $params = []) use ($db) {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt;
};

$data['contactsToday']  = (int)$q("SELECT COUNT(*) FROM contacts WHERE DATE(created_at) = ?", [$today])->fetchColumn();
$data['dealsActive']    = (int)$db->query("SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')")->fetchColumn();
$data['pipelineValue']  = (float)$db->query("SELECT COALESCE(SUM(d.value),0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name NOT IN ('Closed Won','Closed Lost')")->fetchColumn();
$data['totalContacts']  = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();
$data['dealsToday']     = (int)$q("SELECT COUNT(*) FROM deals WHERE DATE(created_at) = ?", [$today])->fetchColumn();
$data['revenueWon']     = (float)$db->query("SELECT COALESCE(SUM(d.value),0) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE ps.name = 'Closed Won' AND DATE(d.created_at) >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();

/* ── Conversations ── */
$data['openConversations'] = (int)$db->query("SELECT COUNT(*) FROM conversations WHERE unread = 1")->fetchColumn();
$data['totalConversations']= (int)$db->query("SELECT COUNT(*) FROM conversations")->fetchColumn();

/* ── Events today ── */
$data['eventsToday'] = (int)$q("SELECT COUNT(*) FROM events WHERE event_date = ?", [$today])->fetchColumn();
$stmt = $db->prepare("SELECT title, start_hour, type FROM events WHERE event_date = ? ORDER BY start_hour LIMIT 5");
$stmt->execute([$today]);
$data['eventsTodayList'] = $stmt->fetchAll();

/* ── Email campaign stats today ── */
$emailsToday = $q("
    SELECT COUNT(*) as sent,
           SUM(opened_at IS NOT NULL) as opened,
           SUM(clicked_at IS NOT NULL) as clicked
    FROM campaign_sends WHERE DATE(sent_at) = ?
", [$today])->fetch();
$data['emailsSentToday']    = (int)($emailsToday['sent']   ?? 0);
$data['emailsOpenedToday']  = (int)($emailsToday['opened'] ?? 0);
$data['emailsClickedToday'] = (int)($emailsToday['clicked']?? 0);

/* ── Email all-time stats ── */
$emailAll = $db->query("
    SELECT COUNT(*) as total,
           SUM(opened_at IS NOT NULL) as opened,
           SUM(clicked_at IS NOT NULL) as clicked,
           SUM(status = 'bounced') as bounced,
           SUM(status = 'unsubscribed') as unsubs
    FROM campaign_sends
")->fetch();
$data['emailTotalSent']  = (int)($emailAll['total']   ?? 0);
$data['emailTotalOpened']= (int)($emailAll['opened']  ?? 0);
$data['emailTotalClicked']=(int)($emailAll['clicked'] ?? 0);
$data['emailTotalBounced']=(int)($emailAll['bounced'] ?? 0);
$data['emailTotalUnsubs']= (int)($emailAll['unsubs']  ?? 0);

/* ── Growth: this month vs last month ── */
$data['contactsThisMonth'] = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();
$data['contactsLastMonth'] = (int)$db->query("SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 MONTH),'%Y-%m-01') AND created_at < DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();

/* ── Contacts by status ── */
$data['byStatus'] = $db->query("SELECT status, COUNT(*) as cnt FROM contacts GROUP BY status ORDER BY cnt DESC")->fetchAll();

/* ── Contacts by segment (top 8) ── */
$data['bySegment'] = $db->query("
    SELECT COALESCE(NULLIF(segment,''), 'other') as segment, COUNT(*) as cnt
    FROM contacts GROUP BY segment ORDER BY cnt DESC LIMIT 8
")->fetchAll();

/* ── Pipeline by stage ── */
$data['byStage'] = $db->query("
    SELECT ps.name, ps.color, ps.sort_order,
           COUNT(d.id) as cnt, COALESCE(SUM(d.value),0) as total
    FROM pipeline_stages ps
    LEFT JOIN deals d ON d.stage_id = ps.id
    GROUP BY ps.id ORDER BY ps.sort_order
")->fetchAll();

/* ── Hourly contact creation (last 24 h) ── */
$data['hourlyContacts'] = $db->query("
    SELECT HOUR(created_at) as hr, COUNT(*) as cnt
    FROM contacts WHERE created_at >= NOW() - INTERVAL 24 HOUR
    GROUP BY HOUR(created_at) ORDER BY hr
")->fetchAll();

/* ── Activity feed (last 20 across contacts + deals + events) ── */
$feed = [];
$rows = $db->query("SELECT 'contact' as type, id, name as title, status as sub, '' as extra, created_at FROM contacts ORDER BY created_at DESC LIMIT 10")->fetchAll();
foreach ($rows as $r) $feed[] = ['type'=>'contact','id'=>(int)$r['id'],'title'=>$r['title'],'sub'=>$r['sub'],'extra'=>'','time'=>$r['created_at']];

$rows = $db->query("SELECT d.id, d.title, d.value, ps.name as stage, d.created_at FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id ORDER BY d.created_at DESC LIMIT 10")->fetchAll();
foreach ($rows as $r) $feed[] = ['type'=>'deal','id'=>(int)$r['id'],'title'=>$r['title'],'sub'=>$r['stage'],'extra'=>'$'.number_format((float)$r['value'],0),'time'=>$r['created_at']];

$rows = $db->query("SELECT id, title, type as sub, created_at FROM events ORDER BY created_at DESC LIMIT 6")->fetchAll();
foreach ($rows as $r) $feed[] = ['type'=>'event','id'=>(int)$r['id'],'title'=>$r['title'],'sub'=>$r['sub'],'extra'=>'','time'=>$r['created_at']];

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
    GROUP BY c.id ORDER BY c.sent_at DESC LIMIT 5
")->fetchAll();

/* ════════════════════════════════════════
   SOCIAL MEDIA — read-only (DDL moved to schema_segment.sql / migrate)
════════════════════════════════════════ */
try {
    /* ── Social: per-platform totals ── */
    $data['socialByPlatform'] = $db->query("
        SELECT provider,
               COUNT(*) as post_count,
               COALESCE(SUM(likes_count),0) as likes,
               COALESCE(SUM(comments_count),0) as comments,
               COALESCE(SUM(shares_count),0) as shares,
               COALESCE(SUM(views_count),0) as views,
               COALESCE(SUM(reach_count),0) as reach,
               MAX(published_at) as last_post
        FROM social_posts
        GROUP BY provider
        ORDER BY post_count DESC
    ")->fetchAll();

    /* ── Social: total engagement KPIs ── */
    $socialKpi = $db->query("
        SELECT COUNT(*) as total_posts,
               COALESCE(SUM(likes_count),0) as total_likes,
               COALESCE(SUM(comments_count),0) as total_comments,
               COALESCE(SUM(shares_count),0) as total_shares,
               COALESCE(SUM(views_count),0) as total_views
        FROM social_posts
    ")->fetch();
    $data['socialTotalPosts']    = (int)($socialKpi['total_posts']    ?? 0);
    $data['socialTotalLikes']    = (int)($socialKpi['total_likes']    ?? 0);
    $data['socialTotalComments'] = (int)($socialKpi['total_comments'] ?? 0);
    $data['socialTotalShares']   = (int)($socialKpi['total_shares']   ?? 0);
    $data['socialTotalViews']    = (int)($socialKpi['total_views']    ?? 0);

    /* ── Social: total engagement = likes + comments + shares ── */
    $data['socialTotalEngagement'] = $data['socialTotalLikes'] + $data['socialTotalComments'] + $data['socialTotalShares'];

    /* ── Social: top 5 posts by engagement ── */
    $data['socialTopPosts'] = $db->query("
        SELECT provider, caption, media_url, thumbnail_url, permalink,
               likes_count, comments_count, shares_count, views_count, reach_count,
               (likes_count + comments_count + shares_count) as engagement,
               published_at
        FROM social_posts
        ORDER BY engagement DESC
        LIMIT 5
    ")->fetchAll();

    /* ── Social: posts published last 7 days (by day) ── */
    $data['socialDailyPosts'] = $db->query("
        SELECT DATE(published_at) as day, COUNT(*) as cnt
        FROM social_posts
        WHERE published_at >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(published_at)
        ORDER BY day
    ")->fetchAll();

    /* ── Social: scheduled queue (next 10 upcoming) ── */
    $data['socialScheduled'] = $db->query("
        SELECT id, providers, LEFT(caption,120) as caption, status, scheduled_at, published_at
        FROM social_scheduled
        ORDER BY FIELD(status,'scheduled','publishing','published','failed'), scheduled_at DESC
        LIMIT 10
    ")->fetchAll();

    /* ── Social: scheduled counts by status ── */
    $schCounts = $db->query("SELECT status, COUNT(*) as cnt FROM social_scheduled GROUP BY status")->fetchAll();
    $schMap = [];
    foreach ($schCounts as $r) $schMap[$r['status']] = (int)$r['cnt'];
    $data['socialScheduledCounts'] = $schMap;

    /* ── Social: connected platforms ── */
    $data['socialConnected'] = $db->query("
        SELECT provider, last_sync_at, post_count FROM social_credentials ORDER BY provider
    ")->fetchAll();

} catch (\Exception $e) {
    // Social tables may not exist yet — return empty gracefully
    $data['socialByPlatform']      = [];
    $data['socialTotalPosts']      = 0;
    $data['socialTotalLikes']      = 0;
    $data['socialTotalComments']   = 0;
    $data['socialTotalShares']     = 0;
    $data['socialTotalViews']      = 0;
    $data['socialTotalEngagement'] = 0;
    $data['socialTopPosts']        = [];
    $data['socialDailyPosts']      = [];
    $data['socialScheduled']       = [];
    $data['socialScheduledCounts'] = [];
    $data['socialConnected']       = [];
}

$data['serverTime'] = date('Y-m-d H:i:s');

jsonResponse($data);

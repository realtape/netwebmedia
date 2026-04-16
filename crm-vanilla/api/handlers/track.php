<?php
/**
 * Tracking endpoint — open pixel, click redirect, unsubscribe.
 *
 * GET  /api/?r=track&a=open&t=TOKEN        → 1x1 pixel
 * GET  /api/?r=track&a=click&t=TOKEN&u=URL → 302 redirect
 * GET  /api/?r=track&a=unsub&t=TOKEN       → unsubscribe confirmation page
 * POST /api/?r=track&a=unsub               → honor list-unsubscribe header (body.email)
 */

$db = getDB();
$a = $_GET['a'] ?? '';
$t = $_GET['t'] ?? '';

if ($a === 'open' && $t) {
    $db->prepare("UPDATE campaign_sends SET status='opened', opened_at=COALESCE(opened_at, NOW()) WHERE token=? AND status IN ('sent','queued')")
        ->execute([$t]);
    // Bump campaign counter (only once per send via status check above)
    $db->prepare("UPDATE email_campaigns c JOIN campaign_sends s ON s.campaign_id=c.id SET c.opened_count=c.opened_count+1 WHERE s.token=? AND s.status='opened' AND s.opened_at > NOW() - INTERVAL 5 SECOND")
        ->execute([$t]);
    header('Content-Type: image/gif');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    // 1x1 transparent GIF
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit;
}

if ($a === 'click' && $t) {
    $u = $_GET['u'] ?? '';
    if (!$u || !filter_var($u, FILTER_VALIDATE_URL)) {
        http_response_code(400); echo 'Invalid URL'; exit;
    }
    $db->prepare("UPDATE campaign_sends SET status=CASE WHEN status='clicked' THEN 'clicked' ELSE 'clicked' END, clicked_at=COALESCE(clicked_at, NOW()), opened_at=COALESCE(opened_at, NOW()) WHERE token=?")
        ->execute([$t]);
    $db->prepare("UPDATE email_campaigns c JOIN campaign_sends s ON s.campaign_id=c.id SET c.clicked_count=c.clicked_count+1 WHERE s.token=? AND s.clicked_at > NOW() - INTERVAL 5 SECOND")
        ->execute([$t]);
    header('Location: ' . $u, true, 302);
    exit;
}

if ($a === 'unsub') {
    if ($method === 'POST') {
        $d = getInput();
        $email = strtolower(trim($d['email'] ?? ''));
        if ($email) {
            $db->prepare('INSERT IGNORE INTO unsubscribes (email, reason) VALUES (?, ?)')->execute([$email, 'api']);
            jsonResponse(['unsubscribed' => true]);
        }
        jsonError('email required');
    }
    // GET: find email from token, show confirmation page
    $email = '';
    if ($t) {
        $s = $db->prepare('SELECT email FROM campaign_sends WHERE token = ? LIMIT 1');
        $s->execute([$t]);
        $row = $s->fetch();
        $email = $row['email'] ?? '';
    }
    if ($email) {
        $db->prepare('INSERT IGNORE INTO unsubscribes (email, reason) VALUES (?, ?)')->execute([$email, 'one-click']);
        $db->prepare("UPDATE campaign_sends SET status='unsubscribed' WHERE email=?")->execute([$email]);
    }
    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($email);
    echo '<!doctype html><html><head><title>Unsubscribed</title>'
       . '<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:80px auto;padding:40px;text-align:center;background:#f6f7fb;color:#1a1a2e}'
       . 'h1{color:#FF6B00;margin-bottom:12px}p{color:#555;line-height:1.6}</style></head><body>'
       . '<h1>Unsubscribed</h1>'
       . ($email ? "<p><strong>$safe</strong> will no longer receive emails from NetWebMedia.</p>" : '<p>You have been unsubscribed.</p>')
       . '<p style="font-size:13px;color:#999;margin-top:30px">If this was a mistake, reply to any previous email to be re-added.</p>'
       . '</body></html>';
    exit;
}

jsonError('Unknown tracking action');

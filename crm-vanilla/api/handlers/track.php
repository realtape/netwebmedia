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

/* Advance the most recent open deal for a contact to a target stage,
   but only if the deal is currently at a lower sort_order (never go back). */
function advanceDealStage($db, $token, $toStageName) {
    $s = $db->prepare('SELECT contact_id FROM campaign_sends WHERE token = ? LIMIT 1');
    $s->execute([$token]);
    $row = $s->fetch();
    if (!$row || !$row['contact_id']) return;
    $contactId = (int) $row['contact_id'];

    $s = $db->prepare('SELECT id, sort_order FROM pipeline_stages WHERE name = ? LIMIT 1');
    $s->execute([$toStageName]);
    $target = $s->fetch();
    if (!$target) return;

    /* Update only if the deal's current stage is behind the target stage */
    $db->prepare('
        UPDATE deals SET stage_id = ?, days_in_stage = 0
        WHERE id = (
            SELECT id FROM (
                SELECT d.id FROM deals d
                JOIN pipeline_stages ps ON d.stage_id = ps.id
                WHERE d.contact_id = ? AND ps.sort_order < ?
                ORDER BY d.created_at DESC LIMIT 1
            ) AS sub
        )
    ')->execute([$target['id'], $contactId, $target['sort_order']]);
}

if ($a === 'open' && $t) {
    $db->prepare("UPDATE campaign_sends SET status='opened', opened_at=COALESCE(opened_at, NOW()) WHERE token=? AND status IN ('sent','queued')")
        ->execute([$t]);
    // Bump campaign counter (only once per send via status check above)
    $db->prepare("UPDATE email_campaigns c JOIN campaign_sends s ON s.campaign_id=c.id SET c.opened_count=c.opened_count+1 WHERE s.token=? AND s.status='opened' AND s.opened_at > NOW() - INTERVAL 5 SECOND")
        ->execute([$t]);
    advanceDealStage($db, $t, 'Contacted');
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

    // ── Record click ──────────────────────────────────────────────────────
    $db->prepare("UPDATE campaign_sends SET status='clicked', clicked_at=COALESCE(clicked_at, NOW()), opened_at=COALESCE(opened_at, NOW()) WHERE token=?")
        ->execute([$t]);
    $db->prepare("UPDATE email_campaigns c JOIN campaign_sends s ON s.campaign_id=c.id SET c.clicked_count=c.clicked_count+1 WHERE s.token=? AND s.clicked_at > NOW() - INTERVAL 5 SECOND")
        ->execute([$t]);
    advanceDealStage($db, $t, 'Qualified');

    // ── Append UTMs for GA4 attribution ──────────────────────────────────
    // Look up campaign name + id so GA4 reports show meaningful labels
    $row = null;
    if ($t) {
        $s = $db->prepare('SELECT cs.campaign_id, ec.name FROM campaign_sends cs LEFT JOIN email_campaigns ec ON ec.id = cs.campaign_id WHERE cs.token = ? LIMIT 1');
        $s->execute([$t]);
        $row = $s->fetch();
    }
    $campaignSlug = $row
        ? strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($row['name'] ?? ''))) . '-' . $row['campaign_id']
        : 'email';

    $utms = http_build_query([
        'utm_source'   => 'email',
        'utm_medium'   => 'cold-outreach',
        'utm_campaign' => $campaignSlug,
        'utm_content'  => $t,   // token = unique per send → per-contact attribution
    ]);
    $sep = (strpos($u, '?') !== false) ? '&' : '?';
    $dest = $u . $sep . $utms;

    header('Location: ' . $dest, true, 302);
    exit;
}

if ($a === 'unsub') {
    if ($method === 'POST') {
        // Require a valid send-token to unsub by email — prevents mass-unsubscribe abuse.
        require_once __DIR__ . '/../lib/rate_limit.php';
        rate_limit('track_unsub', 20, 300);

        $d = getInput();
        $token = trim($d['token'] ?? ($_GET['t'] ?? ''));
        if (!$token) jsonError('token required', 400);

        // Look up the send by token; the email comes from the DB record, not the request body.
        $s = $db->prepare('SELECT email FROM campaign_sends WHERE token = ? LIMIT 1');
        $s->execute([$token]);
        $row = $s->fetch();
        if (!$row || empty($row['email'])) jsonError('Invalid token', 404);

        $email = strtolower(trim($row['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Invalid email on send record', 422);

        $db->prepare('INSERT IGNORE INTO unsubscribes (email, reason) VALUES (?, ?)')->execute([$email, 'list-unsub']);
        $db->prepare("UPDATE campaign_sends SET status='unsubscribed' WHERE email = ?")->execute([$email]);
        jsonResponse(['unsubscribed' => true]);
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
    $safe = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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

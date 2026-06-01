<?php
/**
 * Reputation — track reviews from any platform + send review requests + manage connectors.
 *
 * What's in scope right now:
 *   - First-class storage for reviews (manual entry today, API import tomorrow)
 *   - Review-request flow: send a templated SMS or email to a contact with a unique
 *     tracking link → /review.html?token=X. Tracks open + submission.
 *   - Public review submission endpoint (used by review.html)
 *   - Admin dashboard endpoint with aggregated stats
 *   - Connector stubs (Google / Facebook / Trustpilot / Yelp) — store connection
 *     metadata; actual OAuth flow is documented but real API import is left for
 *     follow-up. Each connector has a clear "needs auth" status.
 *
 * Routes (all admin endpoints require auth; public ones don't):
 *
 *   GET    /api/reputation/stats                      — dashboard summary
 *   GET    /api/reputation/reviews                    — list reviews (filters: platform, stars, responded)
 *   POST   /api/reputation/reviews                    — log a review manually
 *   PUT    /api/reputation/reviews/{id}               — edit (status, response, tags)
 *   DELETE /api/reputation/reviews/{id}               — delete
 *   POST   /api/reputation/reviews/{id}/respond       — record / publish a response
 *
 *   POST   /api/reputation/requests                   — send review request to a contact
 *                                                       { contact_id, channel: 'email'|'sms', template? }
 *   GET    /api/reputation/requests                   — list requests + outcomes
 *
 *   GET    /api/reputation/connectors                 — list configured platforms
 *   POST   /api/reputation/connectors                 — register/update one
 *                                                       { platform: 'google', config: {...} }
 *   DELETE /api/reputation/connectors/{id}            — disconnect
 *   POST   /api/reputation/connectors/{id}/sync       — trigger sync (no-op stub today)
 *
 *   GET    /api/reputation/public/request/{token}     — fetch review request context
 *   POST   /api/reputation/public/request/{token}     — submit the review (public)
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

const REP_PLATFORMS = ['google','facebook','trustpilot','yelp','website','manual','tripadvisor','g2','capterra'];

function reputation_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS reviews (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    org_id       INT NOT NULL DEFAULT 1,
    platform     VARCHAR(40) NOT NULL DEFAULT 'manual',
    external_id  VARCHAR(120) DEFAULT NULL,
    contact_id   INT DEFAULT NULL,
    reviewer_name  VARCHAR(150) DEFAULT NULL,
    reviewer_email VARCHAR(200) DEFAULT NULL,
    stars        TINYINT NOT NULL DEFAULT 5,
    title        VARCHAR(255) DEFAULT NULL,
    body         TEXT DEFAULT NULL,
    response     TEXT DEFAULT NULL,
    responded_at DATETIME DEFAULT NULL,
    responded_by INT DEFAULT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'new',
    posted_at    DATETIME DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_external (platform, external_id),
    KEY ix_org_platform (org_id, platform),
    KEY ix_stars        (stars),
    KEY ix_contact      (contact_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS review_requests (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    org_id        INT NOT NULL DEFAULT 1,
    user_id       INT DEFAULT NULL,
    contact_id    INT NOT NULL,
    contact_email VARCHAR(200) DEFAULT NULL,
    contact_phone VARCHAR(50)  DEFAULT NULL,
    channel       VARCHAR(20) NOT NULL DEFAULT 'email',
    token         VARCHAR(64) NOT NULL UNIQUE,
    status        VARCHAR(20) NOT NULL DEFAULT 'sent',
    sent_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    opened_at     DATETIME DEFAULT NULL,
    submitted_at  DATETIME DEFAULT NULL,
    review_id     INT DEFAULT NULL,
    KEY ix_token   (token),
    KEY ix_status  (status),
    KEY ix_contact (contact_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS reputation_connectors (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    platform    VARCHAR(40) NOT NULL,
    config      JSON DEFAULT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    last_sync   DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_org_platform (org_id, platform)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_reputation($parts, $method) {
  reputation_ensure_schema();
  $sub = $parts[0] ?? null;

  // ── PUBLIC ──
  if ($sub === 'public' && ($parts[1] ?? null) === 'request' && isset($parts[2])) {
    $token = $parts[2];
    if ($method === 'GET')  return reputation_public_request_get($token);
    if ($method === 'POST') return reputation_public_request_submit($token);
    err('Method not allowed', 405);
  }

  $user = requireAuth();

  if ($sub === 'stats' && $method === 'GET') return reputation_stats($user);

  if ($sub === 'reviews') {
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    $action = $parts[2] ?? null;
    if ($id && $action === 'respond' && $method === 'POST') return reputation_respond($id, $user);
    if ($id) {
      if ($method === 'PUT')    return reputation_review_update($id, $user);
      if ($method === 'DELETE') return reputation_review_delete($id, $user);
      err('Method not allowed', 405);
    }
    if ($method === 'GET')  return reputation_reviews_list($user);
    if ($method === 'POST') return reputation_review_create($user);
    err('Method not allowed', 405);
  }

  if ($sub === 'requests') {
    if ($method === 'GET')  return reputation_requests_list($user);
    if ($method === 'POST') return reputation_request_create($user);
    err('Method not allowed', 405);
  }

  if ($sub === 'connectors') {
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    $action = $parts[2] ?? null;
    if ($id && $action === 'sync' && $method === 'POST') return reputation_connector_sync($id, $user);
    if ($id && $method === 'DELETE') return reputation_connector_delete($id, $user);
    if ($method === 'GET')  return reputation_connectors_list($user);
    if ($method === 'POST') return reputation_connector_upsert($user);
    err('Method not allowed', 405);
  }

  err('Reputation route not found', 404);
}

/* ─────────────────────  STATS / REVIEWS  ───────────────────── */

function reputation_stats($user) {
  $org = (int)($user['org_id'] ?? 1);
  $total = (int)(qOne("SELECT COUNT(*) c FROM reviews WHERE org_id = ?", [$org])['c'] ?? 0);
  $avg = (float)(qOne("SELECT COALESCE(AVG(stars), 0) a FROM reviews WHERE org_id = ?", [$org])['a'] ?? 0);
  $thisMonth = (int)(qOne("SELECT COUNT(*) c FROM reviews WHERE org_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')", [$org])['c'] ?? 0);
  $responded = (int)(qOne("SELECT COUNT(*) c FROM reviews WHERE org_id = ? AND response IS NOT NULL", [$org])['c'] ?? 0);
  $byPlatform = qAll("SELECT platform, COUNT(*) n, ROUND(AVG(stars),2) avg_stars FROM reviews WHERE org_id = ? GROUP BY platform", [$org]);
  $byStars    = qAll("SELECT stars, COUNT(*) n FROM reviews WHERE org_id = ? GROUP BY stars ORDER BY stars DESC", [$org]);
  $reqsSent   = (int)(qOne("SELECT COUNT(*) c FROM review_requests WHERE org_id = ?", [$org])['c'] ?? 0);
  $reqsConv   = (int)(qOne("SELECT COUNT(*) c FROM review_requests WHERE org_id = ? AND submitted_at IS NOT NULL", [$org])['c'] ?? 0);

  json_out([
    'ok'                => true,
    'total'             => $total,
    'avg_stars'         => round($avg, 2),
    'this_month'        => $thisMonth,
    'response_rate'     => $total > 0 ? round($responded * 100 / $total, 1) : 0,
    'responded'         => $responded,
    'by_platform'       => $byPlatform,
    'by_stars'          => $byStars,
    'requests_sent'     => $reqsSent,
    'requests_converted'=> $reqsConv,
    'request_conv_rate' => $reqsSent > 0 ? round($reqsConv * 100 / $reqsSent, 1) : 0,
  ]);
}

function reputation_reviews_list($user) {
  $org = (int)($user['org_id'] ?? 1);
  $where = ['org_id = ?']; $params = [$org];
  if ($p = qparam('platform')) { $where[] = 'platform = ?'; $params[] = $p; }
  if ($s = qparam('stars'))    { $where[] = 'stars = ?';    $params[] = (int)$s; }
  if (qparam('responded') === '1') $where[] = 'response IS NOT NULL';
  if (qparam('responded') === '0') $where[] = 'response IS NULL';
  $limit = max(1, min(500, (int)qparam('limit', 100)));
  $rows = qAll(
    "SELECT * FROM reviews WHERE " . implode(' AND ', $where) . " ORDER BY COALESCE(posted_at, created_at) DESC LIMIT $limit",
    $params
  );
  json_out(['reviews' => $rows]);
}

function reputation_review_create($user) {
  $b = body();
  $stars = max(1, min(5, (int)($b['stars'] ?? 5)));
  $platform = in_array(($b['platform'] ?? 'manual'), REP_PLATFORMS, true) ? $b['platform'] : 'manual';
  qExec(
    "INSERT INTO reviews (org_id, platform, external_id, contact_id, reviewer_name, reviewer_email, stars, title, body, posted_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      $platform,
      $b['external_id'] ?? null,
      isset($b['contact_id']) ? (int)$b['contact_id'] : null,
      $b['reviewer_name']  ?? null,
      $b['reviewer_email'] ?? null,
      $stars,
      $b['title'] ?? null,
      $b['body']  ?? null,
      isset($b['posted_at']) ? (date('Y-m-d H:i:s', strtotime($b['posted_at'])) ?: null) : date('Y-m-d H:i:s'),
    ]
  );
  $id = lastId();
  if (function_exists('log_activity')) {
    log_activity('review.added', 'review', $id, ['platform' => $platform, 'stars' => $stars, 'contact_id' => $b['contact_id'] ?? null]);
  }
  json_out(['ok' => true, 'id' => $id], 201);
}

function reputation_review_update($id, $user) {
  $row = qOne("SELECT id FROM reviews WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Review not found', 404);
  $b = body();
  $sets = []; $params = [];
  foreach (['stars','title','body','status','reviewer_name','reviewer_email','platform','posted_at'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'stars') $v = max(1, min(5, (int)$v));
    if ($k === 'posted_at' && $v) { $ts = strtotime((string)$v); $v = $ts ? date('Y-m-d H:i:s', $ts) : null; }
    $sets[] = "$k = ?"; $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE reviews SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function reputation_review_delete($id, $user) {
  $row = qOne("SELECT id FROM reviews WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Review not found', 404);
  qExec("DELETE FROM reviews WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function reputation_respond($id, $user) {
  $row = qOne("SELECT * FROM reviews WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Review not found', 404);
  $b = body();
  $resp = trim((string)($b['response'] ?? ''));
  if (!$resp) err('response is required');
  qExec(
    "UPDATE reviews SET response = ?, responded_at = NOW(), responded_by = ? WHERE id = ?",
    [$resp, (int)$user['id'], $id]
  );
  if (function_exists('log_activity')) {
    log_activity('review.responded', 'review', $id, ['platform' => $row['platform'], 'stars' => (int)$row['stars']]);
  }
  json_out(['ok' => true]);
}

/* ─────────────────────  REQUESTS  ───────────────────── */

function reputation_requests_list($user) {
  $rows = qAll(
    "SELECT r.*, u.name AS sender_name FROM review_requests r
       LEFT JOIN users u ON u.id = r.user_id
      WHERE r.org_id = ? ORDER BY r.id DESC LIMIT 200",
    [(int)($user['org_id'] ?? 1)]
  );
  foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['contact_id'] = (int)$r['contact_id']; }
  json_out(['requests' => $rows]);
}

function reputation_request_create($user) {
  $b = body();
  $contactId = (int)($b['contact_id'] ?? 0);
  if (!$contactId) err('contact_id required');
  $channel = ($b['channel'] ?? 'email') === 'sms' ? 'sms' : 'email';

  // Resolve contact
  $row = qOne("SELECT data FROM resources WHERE id = ? AND type = 'contact'", [$contactId]);
  if (!$row) err('Contact not found', 404);
  $d = json_decode($row['data'] ?? '{}', true) ?: [];
  $email = $d['email'] ?? '';
  $phone = $d['phone'] ?? '';
  $name  = $d['name']  ?? 'there';

  if ($channel === 'email' && !filter_var($email, FILTER_VALIDATE_EMAIL)) err('Contact has no valid email', 400);
  if ($channel === 'sms'   && !$phone) err('Contact has no phone number', 400);

  $token = bin2hex(random_bytes(20));
  qExec(
    "INSERT INTO review_requests (org_id, user_id, contact_id, contact_email, contact_phone, channel, token)
     VALUES (?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1), (int)$user['id'],
      $contactId, $email ?: null, $phone ?: null, $channel, $token,
    ]
  );
  $rid = lastId();
  $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'netwebmedia.com');
  $reviewLink = $base . '/review.html?token=' . $token;

  $tplOverride = trim((string)($b['template'] ?? ''));
  $delivery = ['ok' => false, 'reason' => 'no_delivery'];

  if ($channel === 'email' && function_exists('send_mail')) {
    $first = explode(' ', $name)[0] ?: 'there';
    $subject = "How's your experience with us, {$first}?";
    $bodyHtml = $tplOverride ? str_replace(['{{first_name}}','{{review_link}}'], [$first, $reviewLink], $tplOverride) : (
      '<p>Hi ' . htmlspecialchars($first, ENT_QUOTES) . ',</p>' .
      '<p>Thanks for working with us — we hope it has been a great experience. ' .
      'Would you take 30 seconds to leave a quick review? It helps other businesses make a confident choice.</p>' .
      '<p><a href="' . htmlspecialchars($reviewLink, ENT_QUOTES) . '" style="background:#FF671F;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Leave a review</a></p>' .
      '<p>Thanks again,<br>The team at NetWebMedia</p>'
    );
    try { @send_mail($email, $subject, $bodyHtml); $delivery = ['ok' => true, 'channel' => 'email']; }
    catch (Exception $e) { $delivery = ['ok' => false, 'reason' => $e->getMessage()]; }
  } elseif ($channel === 'sms') {
    $cfg = config();
    if (!empty($cfg['twilio_sid']) && !empty($cfg['twilio_token']) && !empty($cfg['twilio_from'])) {
      $first = explode(' ', $name)[0] ?: 'there';
      $smsBody = $tplOverride
        ? str_replace(['{{first_name}}','{{review_link}}'], [$first, $reviewLink], $tplOverride)
        : "Hi {$first}, would you mind taking 30s to leave a quick review? It really helps. Thanks! → {$reviewLink}\nReply STOP to opt out.";
      $ch = curl_init('https://api.twilio.com/2010-04-01/Accounts/' . $cfg['twilio_sid'] . '/Messages.json');
      curl_setopt_array($ch, [
        CURLOPT_USERPWD => $cfg['twilio_sid'] . ':' . $cfg['twilio_token'],
        CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 10,
        CURLOPT_POSTFIELDS => http_build_query(['To' => $phone, 'From' => $cfg['twilio_from'], 'Body' => $smsBody]),
      ]);
      $resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
      $delivery = ['ok' => $code >= 200 && $code < 300, 'channel' => 'sms', 'http' => $code];
    } else {
      $delivery = ['ok' => false, 'reason' => 'twilio_not_configured'];
    }
  }

  if (function_exists('log_activity')) {
    log_activity('review.requested', 'contact', $contactId, [
      'request_id' => $rid, 'channel' => $channel, 'delivery' => $delivery,
    ]);
  }
  json_out(['ok' => true, 'id' => $rid, 'token' => $token, 'review_link' => $reviewLink, 'delivery' => $delivery]);
}

function reputation_public_request_get($token) {
  $row = qOne(
    "SELECT * FROM review_requests WHERE token = ?",
    [$token]
  );
  if (!$row) err('Invalid review link', 404);
  if (!$row['opened_at']) qExec("UPDATE review_requests SET opened_at = NOW(), status = 'opened' WHERE id = ?", [(int)$row['id']]);
  $contact = qOne("SELECT data FROM resources WHERE id = ? AND type = 'contact'", [(int)$row['contact_id']]);
  $name = '';
  if ($contact) { $d = json_decode($contact['data'] ?? '{}', true); $name = $d['name'] ?? ''; }
  json_out([
    'ok'           => true,
    'reviewer_name'=> $name,
    'submitted'    => !!$row['submitted_at'],
  ]);
}

function reputation_public_request_submit($token) {
  $row = qOne("SELECT * FROM review_requests WHERE token = ?", [$token]);
  if (!$row) err('Invalid review link', 404);
  if ($row['submitted_at']) err('A review has already been submitted for this link', 409);

  $b = body();
  // Honeypot
  if (!empty($b['website']) || !empty($b['hp_field'])) { json_out(['ok' => true, 'review_id' => 0]); }

  $stars = max(1, min(5, (int)($b['stars'] ?? 0)));
  if (!$stars) err('stars required (1–5)');
  $title = trim((string)($b['title'] ?? ''));
  $bodyText = trim((string)($b['body']  ?? ''));

  // Resolve reviewer info from contact
  $contact = qOne("SELECT data FROM resources WHERE id = ?", [(int)$row['contact_id']]);
  $rname = ''; $remail = '';
  if ($contact) {
    $d = json_decode($contact['data'] ?? '{}', true) ?: [];
    $rname  = $d['name']  ?? '';
    $remail = $d['email'] ?? '';
  }

  qExec(
    "INSERT INTO reviews (org_id, platform, contact_id, reviewer_name, reviewer_email, stars, title, body, posted_at, status)
     VALUES (?, 'website', ?, ?, ?, ?, ?, ?, NOW(), 'new')",
    [
      (int)$row['org_id'], (int)$row['contact_id'],
      $rname ?: null, $remail ?: null,
      $stars, $title ?: null, $bodyText ?: null,
    ]
  );
  $reviewId = lastId();
  qExec(
    "UPDATE review_requests SET submitted_at = NOW(), status = 'submitted', review_id = ? WHERE id = ?",
    [$reviewId, (int)$row['id']]
  );

  if (function_exists('log_activity')) {
    log_activity('review.submitted_via_request', 'review', $reviewId, [
      'request_id' => (int)$row['id'], 'stars' => $stars, 'contact_id' => (int)$row['contact_id'],
    ]);
  }
  json_out(['ok' => true, 'review_id' => $reviewId, 'thanks_msg' => 'Thank you for your review!']);
}

/* ─────────────────────  CONNECTORS (stubs)  ───────────────────── */

function reputation_connectors_list($user) {
  $rows = qAll("SELECT * FROM reputation_connectors WHERE org_id = ? ORDER BY platform", [(int)($user['org_id'] ?? 1)]);
  foreach ($rows as &$r) {
    $r['id']     = (int)$r['id'];
    $r['config'] = $r['config'] ? json_decode($r['config'], true) : null;
    // Mask sensitive fields
    if (is_array($r['config'])) {
      foreach (['api_key','access_token','refresh_token','client_secret'] as $k) {
        if (isset($r['config'][$k])) $r['config'][$k] = '••••' . substr((string)$r['config'][$k], -4);
      }
    }
  }
  json_out([
    'ok'         => true,
    'connectors' => $rows,
    'available'  => REP_PLATFORMS,
    'docs'       => [
      'google'     => 'OAuth: https://developers.google.com/my-business/reference/businessinformation/rest — scope: business.manage. Store refresh_token in config.',
      'facebook'   => 'OAuth: https://developers.facebook.com/docs/pages-api — pages_read_user_content scope. Store page_id + page_access_token.',
      'trustpilot' => 'API: https://developers.trustpilot.com/business-units-api — store business_unit_id + api_key.',
      'yelp'       => 'API: https://www.yelp.com/developers — store business_id + api_key.',
    ],
  ]);
}

function reputation_connector_upsert($user) {
  $b = body();
  $platform = (string)($b['platform'] ?? '');
  if (!in_array($platform, REP_PLATFORMS, true)) err('Unknown platform');
  $cfg = isset($b['config']) ? $b['config'] : [];
  qExec(
    "INSERT INTO reputation_connectors (org_id, platform, config, status)
     VALUES (?,?,?, 'configured')
     ON DUPLICATE KEY UPDATE config = VALUES(config), status = VALUES(status)",
    [(int)($user['org_id'] ?? 1), $platform, json_encode($cfg)]
  );
  json_out(['ok' => true, 'platform' => $platform]);
}

function reputation_connector_delete($id, $user) {
  $row = qOne("SELECT id FROM reputation_connectors WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Connector not found', 404);
  qExec("DELETE FROM reputation_connectors WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function reputation_connector_sync($id, $user) {
  $row = qOne("SELECT * FROM reputation_connectors WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Connector not found', 404);
  // Stub: real sync would call the platform's API and INSERT IGNORE rows by (platform, external_id).
  qExec("UPDATE reputation_connectors SET last_sync = NOW() WHERE id = ?", [$id]);
  json_out([
    'ok'      => true,
    'synced'  => 0,
    'note'    => 'Sync stub — wire platform-specific API client to actually pull reviews. The storage layer is ready: INSERT IGNORE INTO reviews (platform, external_id, …) VALUES (…) is the upsert path.',
    'platform'=> $row['platform'],
  ]);
}

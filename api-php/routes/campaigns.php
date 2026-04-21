<?php
/* Email campaign engine — draft, test-send, schedule, and batch-send with open/click tracking.
   Routes (all auth-required):
     GET    /api/campaigns                 list org's campaigns
     GET    /api/campaigns/{id}            fetch one (with stats)
     POST   /api/campaigns                 create draft
     PUT    /api/campaigns/{id}            edit draft
     DELETE /api/campaigns/{id}            delete draft (if not sent)
     POST   /api/campaigns/{id}/audience   {region?, niche?, status?} → preview count + sample
     POST   /api/campaigns/{id}/test       {to} → send 1 preview email with first matching contact's personalization
     POST   /api/campaigns/{id}/send       start real batch send (ALL audience, throttled)
     POST   /api/campaigns/{id}/tick       internal: send next batch (called by cron)
   Public tracking:
     GET    /api/campaigns/track/open/{hash}     1x1 pixel (increments open)
     GET    /api/campaigns/track/click/{hash}    redirect wrapper (increments click)
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/mailer.php';

function cmp_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL, user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL, subject VARCHAR(300) NOT NULL,
    from_name VARCHAR(100) DEFAULT 'NetWebMedia',
    from_email VARCHAR(150) DEFAULT 'newsletter@netwebmedia.com',
    reply_to VARCHAR(150) DEFAULT NULL,
    html_body MEDIUMTEXT, plain_body MEDIUMTEXT,
    audience JSON,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    total_recipients INT DEFAULT 0, sent INT DEFAULT 0, opened INT DEFAULT 0, clicked INT DEFAULT 0, bounced INT DEFAULT 0, failed INT DEFAULT 0,
    throttle_seconds INT DEFAULT 2,
    scheduled_at DATETIME DEFAULT NULL,
    started_at DATETIME DEFAULT NULL, completed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id), KEY ix_status (status)
  )");
  db()->exec("CREATE TABLE IF NOT EXISTS campaign_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL, contact_id INT NOT NULL,
    email VARCHAR(200) NOT NULL, name VARCHAR(200),
    track_hash VARCHAR(40) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    opened_at DATETIME DEFAULT NULL, clicked_at DATETIME DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL, error VARCHAR(400) DEFAULT NULL,
    KEY ix_campaign (campaign_id), KEY ix_status (status), KEY ix_hash (track_hash)
  )");
}

function cmp_audience_query($org_id, $audience) {
  $where = ['org_id = ?', "type = 'contact'"];
  $params = [$org_id];
  if (!empty($audience['region'])) {
    $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.region')) = ?";
    $params[] = $audience['region'];
  }
  if (!empty($audience['niche'])) {
    $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.niche')) = ?";
    $params[] = $audience['niche'];
  }
  if (!empty($audience['status'])) {
    $where[] = "status = ?";
    $params[] = $audience['status'];
  }
  // Require valid email
  $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) LIKE '%@%'";
  return ['where' => implode(' AND ', $where), 'params' => $params];
}

function cmp_resolve_audience($org_id, $audience, $limit = null) {
  $q = cmp_audience_query($org_id, $audience);
  $sql = "SELECT id, title, data FROM resources WHERE {$q['where']} ORDER BY id ASC";
  if ($limit !== null) $sql .= " LIMIT " . (int)$limit;
  $rows = qAll($sql, $q['params']);
  $out = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'], true) ?: [];
    if (empty($d['email'])) continue;
    $out[] = [
      'id' => (int)$r['id'],
      'email' => $d['email'],
      'name'  => $d['name'] ?? $r['title'],
      'company' => $d['company'] ?? null,
      'city'    => $d['city']    ?? null,
      'region'  => $d['region']  ?? null,
      'niche'   => $d['niche']   ?? null,
      'pain_points' => $d['pain_points'] ?? [],
      'fit_services' => $d['fit_services'] ?? [],
    ];
  }
  return $out;
}

function cmp_personalize($html, $contact) {
  return preg_replace_callback('/\{\{\s*([a-z0-9_.]+)\s*\}\}/i', function($m) use ($contact) {
    $k = strtolower($m[1]);
    $v = $contact[$k] ?? '';
    if (is_array($v)) $v = implode(', ', $v);
    return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
  }, $html);
}

function cmp_wrap_tracking($html, $hash, $base_url) {
  // Rewrite links to track clicks
  $html = preg_replace_callback('/<a\b([^>]*)href=["\']([^"\']+)["\']/i', function($m) use ($hash, $base_url) {
    $url = $m[2];
    if (strpos($url, 'mailto:') === 0 || strpos($url, '#') === 0) return $m[0];
    $tracked = $base_url . '/api/campaigns/track/click/' . $hash . '?u=' . urlencode($url);
    return '<a' . $m[1] . 'href="' . $tracked . '"';
  }, $html);
  // Append open tracking pixel before </body> or at end
  $pixel = '<img src="' . $base_url . '/api/campaigns/track/open/' . $hash . '" width="1" height="1" style="display:none" alt="">';
  if (stripos($html, '</body>') !== false) {
    $html = preg_replace('#</body>#i', $pixel . '</body>', $html, 1);
  } else {
    $html .= $pixel;
  }
  // Unsubscribe footer (static — no real db-backed unsubscribe yet)
  $footer = '<p style="font-size:11px;color:#999;margin-top:24px;text-align:center;">Recibiste este correo de <strong>NetWebMedia</strong>. Si no deseas recibir más, respóndenos con "baja".</p>';
  return $html . $footer;
}

function route_campaigns($parts, $method) {
  cmp_ensure_schema();
  $u = requirePaidAccess();
  $org = (int)$u['org_id'];

  // Public tracking bypass
  if (($parts[0] ?? '') === 'track') {
    // Not auth — route_public handles re-entry
    err('Use /api/public/campaigns/track/...', 404);
  }

  // LIST
  if (empty($parts) && $method === 'GET') {
    $rows = qAll("SELECT * FROM campaigns WHERE org_id = ? ORDER BY id DESC", [$org]);
    foreach ($rows as &$r) $r['audience'] = json_decode($r['audience'], true);
    json_out(['items' => $rows]);
  }

  // CREATE
  if (empty($parts) && $method === 'POST') {
    $b = required(['name', 'subject', 'html_body']);
    qExec("INSERT INTO campaigns (org_id, user_id, name, subject, from_name, from_email, reply_to, html_body, plain_body, audience, status, throttle_seconds, scheduled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)",
      [$org, $u['id'], $b['name'], $b['subject'],
       $b['from_name'] ?? 'NetWebMedia',
       $b['from_email'] ?? 'newsletter@netwebmedia.com',
       $b['reply_to'] ?? null,
       $b['html_body'], $b['plain_body'] ?? null,
       json_encode($b['audience'] ?? new stdClass()),
       (int)($b['throttle_seconds'] ?? 2),
       $b['scheduled_at'] ?? null]);
    json_out(['id' => lastId()], 201);
  }

  // Route by id
  $id = (int)($parts[0] ?? 0);
  $camp = qOne("SELECT * FROM campaigns WHERE id = ? AND org_id = ?", [$id, $org]);
  if (!$camp) err('Not found', 404);

  // GET one (with stats)
  if (count($parts) === 1 && $method === 'GET') {
    $camp['audience'] = json_decode($camp['audience'], true);
    $sample = qAll("SELECT email, name, status, opened_at, clicked_at, sent_at, error FROM campaign_recipients WHERE campaign_id = ? ORDER BY id DESC LIMIT 20", [$id]);
    json_out(['campaign' => $camp, 'recent' => $sample]);
  }

  // PUT update
  if (count($parts) === 1 && $method === 'PUT') {
    if ($camp['status'] !== 'draft') err('Cannot edit a sent/sending campaign', 400);
    $b = body();
    $fields = [];
    $params = [];
    foreach (['name','subject','from_name','from_email','reply_to','html_body','plain_body','throttle_seconds','scheduled_at'] as $f) {
      if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if (array_key_exists('audience', $b)) { $fields[] = "audience = ?"; $params[] = json_encode($b['audience']); }
    if (!$fields) err('No fields to update', 400);
    $params[] = $id;
    qExec("UPDATE campaigns SET " . implode(', ', $fields) . " WHERE id = ?", $params);
    json_out(['ok' => true]);
  }

  // DELETE
  if (count($parts) === 1 && $method === 'DELETE') {
    if (in_array($camp['status'], ['sending','completed'])) err('Cannot delete a sent campaign', 400);
    qExec("DELETE FROM campaign_recipients WHERE campaign_id = ?", [$id]);
    qExec("DELETE FROM campaigns WHERE id = ?", [$id]);
    json_out(['ok' => true]);
  }

  $action = $parts[1] ?? null;

  // AUDIENCE preview
  if ($action === 'audience' && $method === 'POST') {
    $b = body();
    $aud = !empty($b) ? $b : (json_decode($camp['audience'], true) ?: []);
    $all = cmp_resolve_audience($org, $aud);
    json_out(['count' => count($all), 'sample' => array_slice($all, 0, 5)]);
  }

  // TEST send
  if ($action === 'test' && $method === 'POST') {
    $b = required(['to']);
    $aud = json_decode($camp['audience'], true) ?: [];
    $sample = cmp_resolve_audience($org, $aud, 1);
    $ctx = $sample ? $sample[0] : ['name'=>'Test','company'=>'Test Co','email'=>$b['to'],'niche'=>'Test','city'=>'Santiago','region'=>'Metropolitana'];
    $html = cmp_personalize($camp['html_body'], $ctx);
    $hash = bin2hex(random_bytes(10));
    $cfg = config();
    $base = $cfg['site_url'] ?? 'https://netwebmedia.com';
    $html = cmp_wrap_tracking($html, $hash, $base);
    $subject = cmp_personalize($camp['subject'], $ctx);
    $ok = send_mail($b['to'], '[TEST] ' . $subject, $html, [
      'from_name' => $camp['from_name'],
      'from_email' => $camp['from_email'],
      'reply_to' => $camp['reply_to'],
    ]);
    json_out(['ok' => $ok, 'preview_personalized_for' => $ctx['company'] ?? $ctx['name']]);
  }

  // SEND (start batch)
  if ($action === 'send' && $method === 'POST') {
    if ($camp['status'] !== 'draft') err('Campaign not in draft state', 400);
    $aud = json_decode($camp['audience'], true) ?: [];
    $recipients = cmp_resolve_audience($org, $aud);
    if (!$recipients) err('Audience is empty', 400);

    // Create recipient rows
    db()->beginTransaction();
    try {
      $stmt = db()->prepare("INSERT IGNORE INTO campaign_recipients (campaign_id, contact_id, email, name, track_hash) VALUES (?, ?, ?, ?, ?)");
      foreach ($recipients as $r) {
        $stmt->execute([$id, $r['id'], $r['email'], $r['name'], bin2hex(random_bytes(10))]);
      }
      qExec("UPDATE campaigns SET status='sending', total_recipients=?, started_at=NOW() WHERE id=?", [count($recipients), $id]);
      db()->commit();
    } catch (Throwable $e) {
      db()->rollBack();
      err('Failed to queue: ' . $e->getMessage(), 500);
    }
    json_out(['ok' => true, 'queued' => count($recipients), 'note' => 'Batches will send every tick; call POST /api/campaigns/'.$id.'/tick from cron, or /api/cron/campaigns']);
  }

  // TICK — send next batch
  if ($action === 'tick' && $method === 'POST') {
    if ($camp['status'] !== 'sending') json_out(['ok' => true, 'status' => $camp['status']]);
    $batchSize = 20;
    $rows = qAll("SELECT * FROM campaign_recipients WHERE campaign_id = ? AND status='pending' LIMIT $batchSize", [$id]);
    if (!$rows) {
      qExec("UPDATE campaigns SET status='completed', completed_at=NOW() WHERE id = ?", [$id]);
      json_out(['ok' => true, 'done' => true]);
    }
    $cfg = config();
    $base = $cfg['site_url'] ?? 'https://netwebmedia.com';
    $sent = $failed = 0;
    foreach ($rows as $rec) {
      $contact = qOne("SELECT data FROM resources WHERE id = ?", [$rec['contact_id']]);
      $ctx = json_decode($contact['data'] ?? '{}', true) ?: [];
      $ctx['email'] = $rec['email']; $ctx['name'] = $rec['name'];
      $html = cmp_personalize($camp['html_body'], $ctx);
      $html = cmp_wrap_tracking($html, $rec['track_hash'], $base);
      $subject = cmp_personalize($camp['subject'], $ctx);
      $ok = send_mail($rec['email'], $subject, $html, [
        'from_name' => $camp['from_name'],
        'from_email' => $camp['from_email'],
        'reply_to' => $camp['reply_to'],
      ]);
      if ($ok) {
        qExec("UPDATE campaign_recipients SET status='sent', sent_at=NOW() WHERE id=?", [$rec['id']]);
        $sent++;
      } else {
        qExec("UPDATE campaign_recipients SET status='failed', error='mail() returned false' WHERE id=?", [$rec['id']]);
        $failed++;
      }
    }
    qExec("UPDATE campaigns SET sent = sent + ?, failed = failed + ? WHERE id = ?", [$sent, $failed, $id]);
    // Check if done
    $pending = qOne("SELECT COUNT(*) AS n FROM campaign_recipients WHERE campaign_id = ? AND status='pending'", [$id]);
    if ((int)$pending['n'] === 0) qExec("UPDATE campaigns SET status='completed', completed_at=NOW() WHERE id = ?", [$id]);
    json_out(['ok' => true, 'sent_this_tick' => $sent, 'failed_this_tick' => $failed, 'pending_remaining' => (int)$pending['n']]);
  }

  err('Not found', 404);
}

/* Public tracking — called without auth */
function route_public_campaign_track($parts, $method) {
  cmp_ensure_schema();
  $action = $parts[0] ?? '';
  $hash = $parts[1] ?? '';
  if (!preg_match('/^[a-f0-9]{20}$/', $hash)) { http_response_code(404); exit; }

  if ($action === 'open') {
    qExec("UPDATE campaign_recipients SET opened_at = COALESCE(opened_at, NOW()) WHERE track_hash = ?", [$hash]);
    qExec("UPDATE campaigns c JOIN campaign_recipients cr ON cr.campaign_id = c.id SET c.opened = c.opened + 1 WHERE cr.track_hash = ? AND cr.opened_at = NOW()", [$hash]);
    // Serve 1x1 gif
    header('Content-Type: image/gif');
    header('Cache-Control: no-store');
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit;
  }

  if ($action === 'click') {
    $target = $_GET['u'] ?? '/';
    qExec("UPDATE campaign_recipients SET clicked_at = COALESCE(clicked_at, NOW()) WHERE track_hash = ?", [$hash]);
    qExec("UPDATE campaigns c JOIN campaign_recipients cr ON cr.campaign_id = c.id SET c.clicked = c.clicked + 1 WHERE cr.track_hash = ? AND cr.clicked_at = NOW()", [$hash]);
    header('Location: ' . $target, true, 302);
    exit;
  }
  http_response_code(404); exit;
}

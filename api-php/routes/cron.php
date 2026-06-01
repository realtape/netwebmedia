<?php
/* Cron endpoints. Protected by a token shared with the server's cPanel cron jobs.
   Token = first 16 chars of jwt_secret (same rule as migrate.php).
   Call via: GET /api/cron/automation?token=...
*/

require_once __DIR__ . '/../lib/workflows.php';

function route_cron($parts, $method) {
  $cfg = config();
  $expected = substr($cfg['jwt_secret'], 0, 16);
  if (($_GET['token'] ?? '') !== $expected) err('Forbidden', 403);

  $sub = $parts[0] ?? null;

  // /cron/automation — advance pending workflow runs + fire due cron-triggered workflows
  if ($sub === 'automation') {
    $advanced = wf_run_pending();
    $fired    = wf_run_cron_due();
    // Also clean old sessions as a bonus
    try { qExec('DELETE FROM sessions WHERE expires_at < NOW()'); } catch (Throwable $_) {}
    json_out(['ok' => true, 'advanced' => $advanced, 'cron_fired' => $fired, 'ran_at' => date('c')]);
  }

  // /cron/health — quick ping
  if ($sub === 'health') {
    $pending = (int) qOne('SELECT COUNT(*) AS c FROM workflow_runs WHERE status="pending"')['c'];
    $sent24h = (int) qOne('SELECT COUNT(*) AS c FROM email_log WHERE status="sent" AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)')['c'];
    $subs24h = (int) qOne('SELECT COUNT(*) AS c FROM form_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)')['c'];
    json_out([
      'ok' => true,
      'pending_workflow_runs' => $pending,
      'emails_sent_24h' => $sent24h,
      'submissions_24h' => $subs24h,
      'time' => date('c'),
    ]);
  }

  // /cron/campaigns — tick all campaigns in 'sending' state
  if ($sub === 'campaigns') {
    require_once __DIR__ . '/campaigns.php';
    cmp_ensure_schema();
    $sending = qAll("SELECT id FROM campaigns WHERE status='sending'");
    $results = [];
    require_once __DIR__ . '/../lib/mailer.php';
    $cfg = config();
    $base = $cfg['site_url'] ?? 'https://netwebmedia.com';
    foreach ($sending as $s) {
      $cid = (int)$s['id'];
      $camp = qOne("SELECT * FROM campaigns WHERE id = ?", [$cid]);
      if (!$camp || $camp['status'] !== 'sending') continue;
      $rows = qAll("SELECT * FROM campaign_recipients WHERE campaign_id = ? AND status='pending' LIMIT 20", [$cid]);
      if (!$rows) {
        qExec("UPDATE campaigns SET status='completed', completed_at=NOW() WHERE id = ?", [$cid]);
        $results[] = ['id' => $cid, 'done' => true];
        continue;
      }
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
      qExec("UPDATE campaigns SET sent = sent + ?, failed = failed + ? WHERE id = ?", [$sent, $failed, $cid]);
      $results[] = ['id' => $cid, 'sent' => $sent, 'failed' => $failed];
    }
    json_out(['ok' => true, 'ticked' => count($sending), 'results' => $results]);
  }

  // /cron/sequences — process due email nurture sequences
  if ($sub === 'sequences') {
    require_once __DIR__ . '/../lib/email-sequences.php';
    $batch = max(1, min(100, (int)($_GET['batch'] ?? 25)));
    $result = seq_process_pending($batch);
    json_out(['ok' => true] + $result);
  }

  // /cron/seed-pipeline-automations — load api-php/data/pipeline-automations.json
  // into resources(type=workflow). Idempotent — upserts by slug.
  // Accepts: &dry=1 for preview, &org_id=N (default 1).
  if ($sub === 'seed-pipeline-automations') {
    $jsonPath = __DIR__ . '/../data/pipeline-automations.json';
    if (!is_file($jsonPath)) {
      json_out(['ok' => false, 'reason' => 'json_missing', 'path' => $jsonPath], 500);
    }
    $src = json_decode(file_get_contents($jsonPath), true);
    if (!$src || empty($src['workflows'])) {
      json_out(['ok' => false, 'reason' => 'invalid_json'], 500);
    }
    $orgId = max(1, (int)($_GET['org_id'] ?? 1));
    $dry   = !empty($_GET['dry']);
    $inserted = $updated = $skipped = 0;
    $log = [];
    foreach ($src['workflows'] as $wf) {
      $slug   = $wf['slug']   ?? null;
      $title  = $wf['title']  ?? null;
      $status = $wf['status'] ?? 'active';
      $data   = $wf['data']   ?? null;
      if (!$slug || !$title || !$data) { $skipped++; $log[] = ['skip' => $slug]; continue; }
      $existing = qOne("SELECT id FROM resources WHERE type='workflow' AND org_id=? AND slug=? LIMIT 1", [$orgId, $slug]);
      $dataJson = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
      if ($existing) {
        if (!$dry) qExec("UPDATE resources SET title=?, status=?, data=?, updated_at=NOW() WHERE id=?", [$title, $status, $dataJson, $existing['id']]);
        $updated++;
        $log[] = ['update' => $slug, 'id' => (int)$existing['id']];
      } else {
        if (!$dry) qExec("INSERT INTO resources (org_id, type, slug, title, status, data, owner_id, created_at, updated_at) VALUES (?, 'workflow', ?, ?, ?, ?, NULL, NOW(), NOW())", [$orgId, $slug, $title, $status, $dataJson]);
        $inserted++;
        $log[] = ['insert' => $slug];
      }
    }
    json_out([
      'ok'       => true,
      'mode'     => $dry ? 'dry_run' : 'apply',
      'org_id'   => $orgId,
      'version'  => $src['version'] ?? null,
      'expected' => count($src['workflows']),
      'inserted' => $inserted,
      'updated'  => $updated,
      'skipped'  => $skipped,
      'details'  => $log,
    ]);
  }

  err('Cron route not found', 404);
}

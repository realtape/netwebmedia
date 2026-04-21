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

  // /cron/automation — advance pending workflow runs
  if ($sub === 'automation') {
    $n = wf_run_pending();
    // Also clean old sessions as a bonus
    try { qExec('DELETE FROM sessions WHERE expires_at < NOW()'); } catch (Throwable $_) {}
    json_out(['ok' => true, 'advanced' => $n, 'ran_at' => date('c')]);
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

  err('Cron route not found', 404);
}

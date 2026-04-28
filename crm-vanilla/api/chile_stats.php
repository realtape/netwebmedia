<?php
/* CRM-side stats endpoint for the Chile cold-outreach campaign.
 *
 * Reads the flat-file logs that api-php/chile-send.php writes:
 *   - santiago_leads.csv     → totals + niche map
 *   - chile-sent.log         → who got emailed
 *   - chile-failed.log       → who failed (rejected by Resend)
 *   - audit-views.log        → who clicked the email CTA → audit page
 *   - unsubscribes.log       → who opted out
 *
 * Returns aggregate stats as JSON. No DB queries — the api-php campaign
 * doesn't write to the CRM's webmed6_crm database, so we read the same
 * files it writes to. Fast (under 50ms even with thousands of log lines)
 * and safe to poll from the dashboard every 30 seconds.
 *
 * Auth: this endpoint sits inside crm-vanilla/api/, which is served from
 * /home/webmed6/public_html/crm-vanilla/. Direct access is open in this
 * deployment (the CRM SPA is itself public). Caller is expected to be
 * the CRM dashboard.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Path back to the public_html root, where api-php/data lives.
$ROOT     = realpath(__DIR__ . '/../..');
$DATA_DIR = $ROOT . '/api-php/data';

$paths = [
  'csv'        => file_exists($DATA_DIR . '/all_leads_5x.csv')
                  ? $DATA_DIR . '/all_leads_5x.csv'
                  : $DATA_DIR . '/santiago_leads.csv',
  'sent_log'   => $DATA_DIR . '/chile-sent.log',
  'failed_log' => $DATA_DIR . '/chile-failed.log',
  'audit_log'  => $DATA_DIR . '/audit-views.log',
  'unsub_log'  => $DATA_DIR . '/unsubscribes.log',
];

// ── 1. Load CSV ────────────────────────────────────────────────────
$leads = [];
$by_niche = [];
if (file_exists($paths['csv'])) {
  $fp = fopen($paths['csv'], 'r');
  $headers = fgetcsv($fp);
  $seen = [];
  while ($row = fgetcsv($fp)) {
    if (count($row) !== count($headers)) continue;
    $r = array_combine($headers, $row);
    if (empty($r['email']) || strpos($r['email'], '@') === false) continue;
    $e = strtolower(trim($r['email']));
    if (isset($seen[$e])) continue;
    $seen[$e] = true;
    $leads[$e] = [
      'company'   => $r['company']   ?? '',
      'name'      => $r['name']      ?? '',
      'niche_key' => $r['niche_key'] ?? 'unknown',
      'niche'     => $r['niche']     ?? '',
      'city'      => $r['city']      ?? '',
      'website'   => $r['website']   ?? '',
    ];
  }
  fclose($fp);
}
$total = count($leads);

// ── 2. Load sent + failed + unsub + clicks logs ────────────────────
$loadEmails = function ($path) {
  if (!file_exists($path)) return [];
  $set = [];
  foreach (@file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    $first = explode("\t", $line)[0] ?? '';
    $e = strtolower(trim($first));
    if ($e !== '' && strpos($e, '@') !== false) $set[$e] = true;
  }
  return $set;
};

$sent_set   = $loadEmails($paths['sent_log']);
$unsub_set  = $loadEmails($paths['unsub_log']);

// failed log format is "email\ttimestamp" (per chile-send.php). Read as set.
$failed_set = $loadEmails($paths['failed_log']);

// audit-views.log is one line per click — keep both per-click events and
// the unique-clicker set. Email is column 0, timestamp column 1.
$click_events = [];
$click_set    = [];
if (file_exists($paths['audit_log'])) {
  foreach (@file($paths['audit_log'], FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    $p = explode("\t", $line);
    $e = strtolower(trim($p[0] ?? ''));
    if ($e === '' || strpos($e, '@') === false) continue;
    $click_set[$e] = true;
    $click_events[] = [
      'email'     => $e,
      'timestamp' => $p[1] ?? '',
      'ip'        => $p[2] ?? '',
    ];
  }
}

// ── 3. Aggregate by niche + city ──────────────────────────────────
$by_city = [];
foreach ($leads as $email => $L) {
  $nk = $L['niche_key'] ?: 'unknown';
  $ct = $L['city']      ?: 'unknown';

  // By niche
  if (!isset($by_niche[$nk])) {
    $by_niche[$nk] = [
      'niche_key' => $nk,
      'niche'     => $L['niche'] ?: $nk,
      'total'     => 0, 'sent' => 0, 'pending' => 0, 'clicks' => 0, 'unsub' => 0,
    ];
  }
  $by_niche[$nk]['total']++;
  if (isset($sent_set[$email]))  $by_niche[$nk]['sent']++;
  else                            $by_niche[$nk]['pending']++;
  if (isset($click_set[$email])) $by_niche[$nk]['clicks']++;
  if (isset($unsub_set[$email])) $by_niche[$nk]['unsub']++;

  // By city
  if (!isset($by_city[$ct])) {
    $by_city[$ct] = [
      'city' => $ct, 'total' => 0, 'sent' => 0, 'pending' => 0, 'clicks' => 0, 'unsub' => 0,
    ];
  }
  $by_city[$ct]['total']++;
  if (isset($sent_set[$email]))  $by_city[$ct]['sent']++;
  else                            $by_city[$ct]['pending']++;
  if (isset($click_set[$email])) $by_city[$ct]['clicks']++;
  if (isset($unsub_set[$email])) $by_city[$ct]['unsub']++;
}
ksort($by_niche);
ksort($by_city);

// CTR per niche + city
foreach ($by_niche as &$row) {
  $row['ctr_pct'] = $row['sent'] > 0 ? round($row['clicks'] * 100 / $row['sent'], 1) : 0;
}
unset($row);
foreach ($by_city as &$row) {
  $row['ctr_pct'] = $row['sent'] > 0 ? round($row['clicks'] * 100 / $row['sent'], 1) : 0;
}
unset($row);

// ── 4. Recent activity feeds ───────────────────────────────────────
// Recent sends (order = chronological in chile-sent.log; tail = newest).
$recent_sends = [];
if (file_exists($paths['sent_log'])) {
  $sent_lines = @file($paths['sent_log'], FILE_IGNORE_NEW_LINES) ?: [];
  $tail = array_slice($sent_lines, -25);
  foreach (array_reverse($tail) as $e) {
    $e = strtolower(trim($e));
    if ($e === '') continue;
    $recent_sends[] = [
      'email'   => $e,
      'company' => $leads[$e]['company']   ?? '',
      'niche'   => $leads[$e]['niche']     ?? '',
    ];
  }
}

// Recent clicks (newest first).
$recent_clicks_view = [];
$tail = array_slice($click_events, -25);
foreach (array_reverse($tail) as $ev) {
  $recent_clicks_view[] = [
    'email'     => $ev['email'],
    'company'   => $leads[$ev['email']]['company'] ?? '',
    'niche'     => $leads[$ev['email']]['niche']   ?? '',
    'timestamp' => $ev['timestamp'],
  ];
}

// ── 5. Top-line totals ─────────────────────────────────────────────
$sent          = count($sent_set);
$pending       = $total - $sent;
$failed        = count($failed_set);
$unsub         = count($unsub_set);
$clicks_total  = count($click_events);
$clicks_unique = count($click_set);
$ctr_pct       = $sent > 0 ? round($clicks_unique * 100 / $sent, 1) : 0;

echo json_encode([
  'campaign'      => 'Chile Cold Outreach — Nacional 2026',
  'totals' => [
    'total'         => $total,
    'sent'          => $sent,
    'pending'       => $pending,
    'failed'        => $failed,
    'unsubscribed'  => $unsub,
    'clicks_total'  => $clicks_total,
    'clicks_unique' => $clicks_unique,
    'ctr_pct'       => $ctr_pct,
  ],
  'by_niche'      => array_values($by_niche),
  'by_city'       => array_values($by_city),
  'recent_sends'  => $recent_sends,
  'recent_clicks' => $recent_clicks_view,
  'server_time'   => date('c'),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

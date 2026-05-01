<?php
/* CRM-side stats endpoint for the USA cold-outreach campaign.
 *
 * Queries the CRM `contacts` table (webmed6_crm) for the USA universe,
 * then cross-references the flat-file logs that api-php/usa-send.php writes:
 *   - api-php/data/us-sent.log    → who got emailed
 *   - api-php/data/us-failed.log  → who failed (rejected by Resend)
 *   - api-php/data/audit-views.log → click log (filtered to US emails only)
 *   - api-php/data/unsubscribes.log → who opted out
 *
 * Returns aggregate stats as JSON. Suitable for polling every 30s from
 * the USA campaign dashboard.
 *
 * Auth: open inside crm-vanilla/api/ — same policy as chile_stats.php.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ROOT     = realpath(__DIR__ . '/../..');
$DATA_DIR = $ROOT . '/api-php/data';

$paths = [
  'sent_log'   => $DATA_DIR . '/us-sent.log',
  'failed_log' => $DATA_DIR . '/us-failed.log',
  'audit_log'  => $DATA_DIR . '/audit-views.log',
  'unsub_log'  => $DATA_DIR . '/unsubscribes.log',
];

// ── Shared config / DB ────────────────────────────────────────────────
$crmConfigFile = __DIR__ . '/config.local.php';
if (file_exists($crmConfigFile)) { require_once $crmConfigFile; }
$crmPass = defined('DB_PASS') ? DB_PASS : '';

// ── 1. Load USA universe from CRM DB ─────────────────────────────────
$CAP_TOTAL = 30000;
$FREE_DOMAINS = [
  'gmail.com','googlemail.com',
  'yahoo.com','yahoo.com.mx','yahoo.com.ar','yahoo.es','ymail.com',
  'hotmail.com','hotmail.es','hotmail.cl','hotmail.co.uk',
  'outlook.com','outlook.es',
  'live.com','live.cl','live.com.ar',
  'icloud.com','me.com','mac.com',
  'aol.com','msn.com',
];

// Niche priority (mirrors usa-send.php)
function usa_stat_priority($niche_key) {
  static $map = [
    'financial_services' => 1, 'events_weddings'   => 1,
    'health'             => 2, 'real_estate'       => 2,
    'restaurants'        => 2, 'law_firms'         => 2, 'smb' => 2,
    'local_specialist'   => 3, 'tourism'           => 3, 'beauty' => 3,
    'automotive'         => 4, 'education'         => 4,
  ];
  return $map[strtolower($niche_key ?? '')] ?? 5;
}

$leads = []; // email_lc => [niche_key, niche, state, company, name, website]
$universe_all = [];

try {
  $placeholders = implode(',', array_fill(0, count($FREE_DOMAINS), '?'));
  $pdo = new PDO(
    'mysql:host=localhost;dbname=webmed6_crm;charset=utf8mb4',
    'webmed6_crm',
    $crmPass,
    [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
    ]
  );
  $sql = "
    SELECT id, email, name, company,
           JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche_key')) AS niche_key,
           JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche'))     AS niche,
           JSON_UNQUOTE(JSON_EXTRACT(notes, '$.city'))      AS city,
           JSON_UNQUOTE(JSON_EXTRACT(notes, '$.state'))     AS state,
           JSON_UNQUOTE(JSON_EXTRACT(notes, '$.website'))   AS website
    FROM contacts
    WHERE segment LIKE 'usa%'
      AND email IS NOT NULL AND TRIM(email) <> '' AND email LIKE '%@%.%'
      AND email NOT LIKE '% %'
      AND company IS NOT NULL AND TRIM(company) <> ''
      AND LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) NOT IN ($placeholders)
    ORDER BY id ASC
  ";
  $st = $pdo->prepare($sql);
  $st->execute($FREE_DOMAINS);

  $seen = [];
  while ($r = $st->fetch()) {
    $e = strtolower(trim($r['email']));
    if (isset($seen[$e])) continue;
    $seen[$e] = true;
    $r['_priority'] = usa_stat_priority($r['niche_key'] ?? '');
    $universe_all[] = $r;
  }

  // Sort by priority then id — mirrors usa-send.php deterministic ordering
  usort($universe_all, function ($a, $b) {
    if ($a['_priority'] !== $b['_priority']) return $a['_priority'] <=> $b['_priority'];
    return ((int)$a['id']) <=> ((int)$b['id']);
  });
  // Lock universe to top CAP_TOTAL
  if (count($universe_all) > $CAP_TOTAL) $universe_all = array_slice($universe_all, 0, $CAP_TOTAL);

  foreach ($universe_all as $r) {
    $e = strtolower(trim($r['email']));
    $leads[$e] = [
      'name'      => $r['name']      ?? '',
      'company'   => $r['company']   ?? '',
      'niche_key' => $r['niche_key'] ?? 'unknown',
      'niche'     => $r['niche']     ?? '',
      'state'     => $r['state']     ?? '',
      'city'      => $r['city']      ?? '',
      'website'   => $r['website']   ?? '',
    ];
  }
  $db_error = null;
} catch (Exception $ex) {
  $db_error = $ex->getMessage();
}

$total = count($leads);

// ── 2. Load flat-file logs ────────────────────────────────────────────
$loadEmailSet = function ($path) {
  if (!file_exists($path)) return [];
  $set = [];
  foreach (@file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    $first = explode("\t", $line)[0] ?? '';
    $e = strtolower(trim($first));
    if ($e !== '' && strpos($e, '@') !== false) $set[$e] = true;
  }
  return $set;
};

$sent_set   = $loadEmailSet($paths['sent_log']);
$failed_set = $loadEmailSet($paths['failed_log']);
$unsub_set  = $loadEmailSet($paths['unsub_log']);

// Clicks — filter to US emails only (audit-views.log is shared with Chile).
$click_events = [];
$click_set    = [];
if (file_exists($paths['audit_log'])) {
  foreach (@file($paths['audit_log'], FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    $p = explode("\t", $line);
    $e = strtolower(trim($p[0] ?? ''));
    if ($e === '' || strpos($e, '@') === false) continue;
    if (!isset($leads[$e])) continue; // not a US contact — skip (Chile, etc.)
    $click_set[$e] = true;
    $click_events[] = [
      'email'     => $e,
      'timestamp' => $p[1] ?? '',
      'ip'        => $p[2] ?? '',
    ];
  }
}

// ── 3. Aggregate by niche + state ──────────────────────────────────────
$by_niche = [];
$by_state = [];

foreach ($leads as $email => $L) {
  $nk = $L['niche_key'] ?: 'unknown';
  $st = $L['state'] ?: 'unknown';

  // By niche
  if (!isset($by_niche[$nk])) {
    $by_niche[$nk] = [
      'niche_key' => $nk,
      'niche'     => $L['niche'] ?: $nk,
      'total' => 0, 'sent' => 0, 'pending' => 0, 'clicks' => 0, 'unsub' => 0,
    ];
  }
  $is_done = isset($sent_set[$email]) || isset($failed_set[$email]);
  $by_niche[$nk]['total']++;
  if (isset($sent_set[$email]))  $by_niche[$nk]['sent']++;
  if (!$is_done)                 $by_niche[$nk]['pending']++;
  if (isset($click_set[$email])) $by_niche[$nk]['clicks']++;
  if (isset($unsub_set[$email])) $by_niche[$nk]['unsub']++;

  // By state
  if (!isset($by_state[$st])) {
    $by_state[$st] = [
      'state' => $st, 'total' => 0, 'sent' => 0, 'pending' => 0, 'clicks' => 0, 'unsub' => 0,
    ];
  }
  $by_state[$st]['total']++;
  if (isset($sent_set[$email]))  $by_state[$st]['sent']++;
  if (!$is_done)                 $by_state[$st]['pending']++;
  if (isset($click_set[$email])) $by_state[$st]['clicks']++;
  if (isset($unsub_set[$email])) $by_state[$st]['unsub']++;
}

// Sort niches by priority, then name; sort states by name
uksort($by_niche, function ($a, $b) {
  $pa = usa_stat_priority($a);
  $pb = usa_stat_priority($b);
  return ($pa !== $pb) ? $pa <=> $pb : strcmp($a, $b);
});
ksort($by_state);

// CTR
foreach ($by_niche as &$row) {
  $row['ctr_pct'] = $row['sent'] > 0 ? round($row['clicks'] * 100 / $row['sent'], 1) : 0;
}
unset($row);
foreach ($by_state as &$row) {
  $row['ctr_pct'] = $row['sent'] > 0 ? round($row['clicks'] * 100 / $row['sent'], 1) : 0;
}
unset($row);

// ── 4. Recent activity feeds ───────────────────────────────────────────
$recent_sends = [];
if (file_exists($paths['sent_log'])) {
  $sent_lines = @file($paths['sent_log'], FILE_IGNORE_NEW_LINES) ?: [];
  $tail = array_slice($sent_lines, -25);
  foreach (array_reverse($tail) as $line) {
    $e = strtolower(trim($line));
    if ($e === '' || !isset($leads[$e])) continue;
    $recent_sends[] = [
      'email'   => $e,
      'company' => $leads[$e]['company'] ?? '',
      'niche'   => $leads[$e]['niche']   ?? '',
      'state'   => $leads[$e]['state']   ?? '',
    ];
  }
}

// Clicks list with modes (recent / all / unique)
$clicks_mode = $_GET['clicks'] ?? 'recent';
if ($clicks_mode === 'all') {
  $source = $click_events;
} elseif ($clicks_mode === 'unique') {
  $byEmail = [];
  foreach ($click_events as $ev) { $byEmail[$ev['email']] = $ev; }
  $source = array_values($byEmail);
} else {
  $source = array_slice($click_events, -25);
}
$recent_clicks_view = [];
foreach (array_reverse($source) as $ev) {
  $L = $leads[$ev['email']] ?? [];
  $recent_clicks_view[] = [
    'email'     => $ev['email'],
    'name'      => $L['name']      ?? '',
    'company'   => $L['company']   ?? '',
    'niche_key' => $L['niche_key'] ?? '',
    'niche'     => $L['niche']     ?? '',
    'state'     => $L['state']     ?? '',
    'city'      => $L['city']      ?? '',
    'website'   => $L['website']   ?? '',
    'timestamp' => $ev['timestamp'],
    'ip'        => $ev['ip']       ?? '',
  ];
}

// ── 5. Top-line totals ─────────────────────────────────────────────────
$sent          = count($sent_set);
$failed        = count($failed_set);
$done_set      = $sent_set + $failed_set;
$pending       = max(0, $total - count($done_set));
$unsub         = count($unsub_set);
$clicks_total  = count($click_events);
$clicks_unique = count($click_set);
$ctr_pct       = $sent > 0 ? round($clicks_unique * 100 / $sent, 1) : 0;

echo json_encode([
  'campaign'      => 'USA Cold Outreach — Identifiable Business 2026',
  'db_error'      => $db_error,
  'totals' => [
    'total'         => $total,
    'cap'           => $CAP_TOTAL,
    'sent'          => $sent,
    'pending'       => $pending,
    'failed'        => $failed,
    'unsubscribed'  => $unsub,
    'clicks_total'  => $clicks_total,
    'clicks_unique' => $clicks_unique,
    'ctr_pct'       => $ctr_pct,
  ],
  'by_niche'      => array_values($by_niche),
  'by_state'      => array_values($by_state),
  'recent_sends'  => $recent_sends,
  'recent_clicks' => $recent_clicks_view,
  'clicks_mode'   => $clicks_mode,
  'server_time'   => date('c'),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

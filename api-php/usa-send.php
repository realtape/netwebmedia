<?php
/* USA cold-outreach HTTP trigger.
   Mirrors api-php/chile-send.php but pulls audience from the CRM `contacts`
   table (segment LIKE 'usa%') and filters for "Identifiable Business":
     - email valid, has @
     - company non-empty
     - email domain not in free-consumer-provider list
   Targets the best 30,000 ordered by niche-priority tier:
     Tier 1 (highest):  financial_services, events_weddings
     Tier 2 (high):     health, real_estate, restaurants, law_firms, smb
     Tier 3 (good):     local_specialist, tourism, beauty
     Tier 4 (fill):     automotive, education
   The audience is materialized once per HTTP call from the DB, then sends
   are deduped against api-php/data/us-sent.log (same flat-file pattern
   chile-send.php uses).

   URL:  https://netwebmedia.com/api-php/usa-send.php?token=XXX&mode=test
   (canonical entry: https://netwebmedia.com/api/usa-send?...)

   Modes:
     - status   → JSON counters (audience size, already-sent, pending)
     - preview  → render the first pending lead's email as HTML (no send)
     - test     → send 1 to entrepoker@gmail.com + newsletter@netwebmedia.com
     - batch    → send next N (default 5; capped at 50) emails, 1s gap each
     - all      → no per-call cap; requires &confirm=yes (dangerous)

   Idempotency: keeps api-php/data/us-sent.log with one email per line.
   Re-hitting the URL auto-skips already-sent addresses.
*/

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/mailer.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function ju_exit($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  exit;
}

// ----- auth -----
$EMBEDDED_TOKEN = 'NWM_USA_SEND_2026_d3f7e2c9a1b48560';
$cfg = config();
$expected = $cfg['usa_send_token'] ?? $EMBEDDED_TOKEN;
if (!hash_equals($expected, (string)($_GET['token'] ?? ''))) {
  ju_exit(['error' => 'unauthorized'], 401);
}

$mode       = $_GET['mode']    ?? 'status';
$max        = min(50, max(1, (int)($_GET['n'] ?? 5)));
$niche_f    = $_GET['niche']   ?? null;
$confirmed  = ($_GET['confirm'] ?? '') === 'yes';
$dryrun     = !empty($_GET['dryrun']);
$cap_total  = (int)($_GET['cap_total'] ?? 30000); // hard cap on total audience

// ----- paths -----
$LOG    = __DIR__ . '/data/us-sent.log';
$FAIL   = __DIR__ . '/data/us-failed.log';
$UNSUB  = __DIR__ . '/data/unsubscribes.log';

// ----- constants -----
$FROM_NAME  = 'NetWebMedia';
$FROM_EMAIL = 'newsletter@netwebmedia.com';
$REPLY_TO   = 'hola@netwebmedia.com';

// Free consumer email domains — exclude (matches filter_identifiable.php).
$FREE_DOMAINS = [
  'gmail.com','googlemail.com',
  'yahoo.com','yahoo.com.mx','yahoo.com.ar','yahoo.es','ymail.com',
  'hotmail.com','hotmail.es','hotmail.cl','hotmail.co.uk',
  'outlook.com','outlook.es',
  'live.com','live.cl','live.com.ar',
  'icloud.com','me.com','mac.com',
  'aol.com','msn.com',
];

// Niche priority — lower number = higher priority (sent first).
function usa_niche_priority($niche_key) {
  static $map = [
    'financial_services' => 1, 'events_weddings'   => 1,
    'health'             => 2, 'real_estate'       => 2,
    'restaurants'        => 2, 'law_firms'         => 2, 'smb' => 2,
    'local_specialist'   => 3, 'tourism'           => 3, 'beauty' => 3,
    'automotive'         => 4, 'education'         => 4,
  ];
  return $map[strtolower($niche_key ?? '')] ?? 5;
}

function niche_subdomain($niche_key) {
  $map = [
    'tourism'            => ['host' => 'hotels.netwebmedia.com',       'label' => 'Hotels & Lodging'],
    'restaurants'        => ['host' => 'restaurants.netwebmedia.com',  'label' => 'Restaurants & Hospitality'],
    'beauty'             => ['host' => 'salons.netwebmedia.com',       'label' => 'Beauty & Spa'],
    'law_firms'          => ['host' => 'legal.netwebmedia.com',        'label' => 'Law Firms'],
    'real_estate'        => ['host' => 'realestate.netwebmedia.com',   'label' => 'Real Estate'],
    'health'             => ['host' => 'healthcare.netwebmedia.com',   'label' => 'Healthcare'],
    'home_services'      => ['host' => 'home.netwebmedia.com',         'label' => 'Home Services'],
    'education'          => ['host' => 'netwebmedia.com',              'label' => 'Education'],
    'automotive'         => ['host' => 'netwebmedia.com',              'label' => 'Automotive'],
    'financial_services' => ['host' => 'pro.netwebmedia.com',          'label' => 'Financial Services'],
    'events_weddings'    => ['host' => 'hospitality.netwebmedia.com',  'label' => 'Events & Weddings'],
    'wine_agriculture'   => ['host' => 'netwebmedia.com',              'label' => 'Wine & Agriculture'],
    'local_specialist'   => ['host' => 'netwebmedia.com',              'label' => 'Local Specialists'],
    'smb'                => ['host' => 'netwebmedia.com',              'label' => 'SMB'],
  ];
  return $map[$niche_key] ?? ['host' => 'netwebmedia.com', 'label' => 'NetWebMedia'];
}

/**
 * Per-niche findings, English. Each ~22-30 words, leads with concrete
 * observation, ends with implication. No emoji, no bold.
 */
function usa_niche_findings($niche_key) {
  $pools = [
    'financial_services' => [
      'When prospects ask ChatGPT for an advisor in your specialty, your firm doesn\'t come up — that lead is being routed to 3-4 competitors with cleaner AI footprints.',
      'There\'s no automated qualifier on inbound consultations by asset size or product — your advisors are spending billable time on leads that won\'t close while better-fit ones go cold.',
      'The site has no pillar pages with FAQ schema for your service lines, which costs an estimated 60% of long-tail organic capture in your category.',
      'Follow-ups after the first consult aren\'t automated — industry data says you lose ~60% of warm leads who would close with 2-3 more touches.',
    ],
    'events_weddings' => [
      'Searching "wedding planner [your city]" on ChatGPT returns 3 fixed names — yours isn\'t one of them, even though the AI is now influencing 80% of first-pass vendor research.',
      'There\'s no online quote tool by event type or guest count — every inquiry hits the manual funnel and weekend leads are lost to faster-responding competitors.',
      'The portfolio takes 4+ seconds to load on mobile and renders fragmented — 85% of brides decide from their phone, not desktop.',
      'No automated nurture for prospects who requested a quote and didn\'t reply — a single follow-up email recovers 25-35% of those leads.',
    ],
    'health' => [
      'Your clinic doesn\'t show up in AI answers when someone asks for a "[specialty] near me" — and that\'s where the high-intent first search now happens.',
      'There\'s no online booking integrated with real chair/exam-room availability — patients drop off after 2 attempts and book wherever responds first.',
      'Google Business reviews aren\'t getting active replies from the practice — in healthcare, that single signal drives 8 out of 10 selection decisions.',
      'No SMS or WhatsApp appointment reminders — no-show rates in healthcare average 18-22% without them, and that\'s direct lost revenue.',
    ],
    'real_estate' => [
      'When buyers ask ChatGPT for a "best agent in [your area]," you\'re not in the recommendation set — that pre-Google search now starts most luxury and relocation inquiries.',
      'Property listings on the site don\'t carry RealEstateListing schema, so Google isn\'t showing them in the rich result with price, sqft, and gallery.',
      'There\'s no automated lead qualifier (budget, area, urgency, financing) — agents are burning time on tire-kickers while serious buyers move on.',
      'Showings can\'t be self-scheduled online — the email-or-phone funnel underperforms with younger buyers who expect calendar self-service.',
    ],
    'restaurants' => [
      'When ChatGPT is asked "best [cuisine] in [city]," your restaurant doesn\'t make the answer — the AI is settling that question without your data.',
      'The menu isn\'t marked up with Restaurant/Menu schema, so Google isn\'t showing it in the rich card with price ranges, hours, and reviews.',
      'Online reservations aren\'t automated — late-night and out-of-state inquiries fall through because the host can\'t pick up after hours.',
      'Recent Google reviews don\'t have owner replies — that drops click-through from the local map by up to 30%.',
    ],
    'law_firms' => [
      'Searching "[practice area] attorney [your city]" on ChatGPT, your firm doesn\'t appear in the recommendation — that initial research now happens before Google.',
      'The site doesn\'t capture initial consultations automatically — every inbound waits for a paralegal to check email next business day, and urgent matters go to whoever responds first.',
      'Google Business reviews are unanswered by the firm — in legal services, that silence has 8/10 weight on selection because it reads as inattentive.',
      'No WhatsApp or SMS triage for urgent legal questions — that\'s the channel where the first meeting actually gets booked in 2026.',
    ],
    'smb' => [
      'When prospects ask ChatGPT for a recommendation in your category, your business isn\'t there — and that\'s the new top of the funnel for B2B research.',
      'The site has no automated lead capture — every inquiry waits for someone to manually triage email, and the first responder usually wins.',
      'Google Business reviews go unanswered from the owner account — that single signal accounts for a meaningful share of consideration in local search.',
      'No abandoned-form recovery sequence — visitors who start filling out a contact form but bail aren\'t getting any follow-up, which is industry-standard now.',
    ],
    'local_specialist' => [
      'Searching for "[your specialty] in [your city]" on ChatGPT doesn\'t surface your business — the AI is resolving that with 3 fixed names.',
      'The site lacks LocalBusiness schema with hours, service area, and service types — Google isn\'t prioritizing it in the local rich result.',
      'Mobile time-to-first-paint is over 4 seconds, which Google explicitly penalizes in local rankings.',
      'Google Business reviews aren\'t actively managed from the owner\'s account — in local-service categories, that signal outweighs SEO.',
    ],
    'tourism' => [
      'When someone asks ChatGPT for boutique stays or aparthotels in your area, you\'re not in the answer — 3-4 direct competitors are absorbing those recommendations.',
      'The site isn\'t marked up with Hotel schema with prices and availability, so Google isn\'t surfacing it in the rich lodging card on mobile.',
      'Mobile load time exceeds 4 seconds to first content — Google penalizes that in hotel local rankings.',
      'There\'s no auto-response on booking inquiries — leads expect a same-hour reply, not next-business-day, and they\'re booking elsewhere.',
    ],
    'beauty' => [
      'You\'re not in AI recommendations when someone asks for "best salon" or "best spa" near them — that\'s the moment of decision.',
      'There\'s no 24/7 online booking integrated — clients browsing at 10pm have to wait until tomorrow to book, and they often won\'t.',
      'Service prices aren\'t shown in a structured way on the site — that drops mobile conversion noticeably in the category.',
      'No automated SMS/WhatsApp reminders before appointments — no-shows in this industry average 15% without them.',
    ],
    'automotive' => [
      'When someone asks ChatGPT for a trusted dealer or shop in your area, you\'re not in the answer — those high-intent calls go to the 3 names the AI recommends.',
      'There\'s no automated quote tool for service or trade-in — every customer waiting for a price after-hours is a likely lost sale to a faster-responding shop.',
      'Google reviews have gone 90+ days without a reply from the owner account — in automotive, that silence costs 2 of every 3 new prospects.',
      'No automated 10,000-mile service reminder via SMS — that single message recovers 30-40% of customers who would otherwise drift to a competitor.',
    ],
    'education' => [
      'Asked ChatGPT "where to study [your program] in the US" — your institution doesn\'t come up, and the AI is routing those prospects to 3 fixed competitors.',
      'There\'s no automated nurture sequence for someone who downloads a program brochure but doesn\'t enroll — you lose 50-70% of warm leads without it.',
      'Admissions inquiries are manually triaged via email — a Friday-afternoon prospect gets a Monday reply and has already started a competitor\'s application.',
      'The site doesn\'t expose pricing, dates, or Course schema — Google isn\'t showing the offer in the education rich result, which drops click-through ~40%.',
    ],
  ];
  $default = [
    'You don\'t appear in ChatGPT, Claude, or Perplexity answers for your category — and that\'s where the first 20% of buyers now start.',
    'Mobile site speed is over 4 seconds to first paint, which Google explicitly penalizes.',
    'There\'s no automated lead capture — every inquiry waits for someone to check email manually.',
    'Google Business reviews aren\'t actively managed from the owner account.',
  ];
  return $pools[$niche_key] ?? $default;
}

// ── Audience load (DB query) ─────────────────────────────────────────
function load_pending_usa_audience(array $free_domains, int $cap_total, ?string $niche_filter, array $already, array $unsub) {
  $pdo = db();

  // Build the IN(...) clause for free domains.
  $placeholders = implode(',', array_fill(0, count($free_domains), '?'));

  $sql = "
    SELECT id, email, name, company, segment, niche, niche_key, city, state, website
    FROM contacts
    WHERE segment LIKE 'usa%'
      AND email IS NOT NULL AND TRIM(email) <> '' AND email LIKE '%@%.%'
      AND email NOT LIKE '% %'
      AND company IS NOT NULL AND TRIM(company) <> ''
      AND LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) NOT IN ($placeholders)
    ORDER BY id ASC
  ";
  $st = $pdo->prepare($sql);
  $st->execute($free_domains);

  $rows = [];
  $seen = [];
  while ($r = $st->fetch()) {
    $email_lc = strtolower(trim($r['email']));
    if (isset($seen[$email_lc]))      continue; // de-dup CSV-internal duplicates
    if (isset($already[$email_lc]))   continue; // already sent in past run
    if (isset($unsub[$email_lc]))     continue; // opted out
    $seen[$email_lc] = true;

    $r['_email_lc'] = $email_lc;
    $r['_priority'] = usa_niche_priority($r['niche_key'] ?? '');
    if ($niche_filter && stripos($r['niche_key'] ?? '', $niche_filter) === false) continue;
    $rows[] = $r;
  }

  // Order by niche priority, then id ASC for determinism.
  usort($rows, function ($a, $b) {
    if ($a['_priority'] !== $b['_priority']) return $a['_priority'] <=> $b['_priority'];
    return ((int)$a['id']) <=> ((int)$b['id']);
  });

  // Cap to best N.
  if (count($rows) > $cap_total) $rows = array_slice($rows, 0, $cap_total);
  return $rows;
}

// ----- load sent + unsubscribed logs -----
$already = [];
if (file_exists($LOG)) {
  foreach (file($LOG, FILE_IGNORE_NEW_LINES) as $line) {
    $e = strtolower(trim($line));
    if ($e !== '') $already[$e] = true;
  }
}
$unsub = [];
if (file_exists($UNSUB)) {
  foreach (file($UNSUB, FILE_IGNORE_NEW_LINES) as $line) {
    $parts = explode("\t", $line);
    $e = strtolower(trim($parts[0] ?? ''));
    if ($e !== '' && strpos($e, '@') !== false) $unsub[$e] = true;
  }
}

// Audience build is the same for every mode — gives consistent counts.
$pending = load_pending_usa_audience($FREE_DOMAINS, $cap_total, $niche_f, $already, $unsub);

// ── render_email_html — English version of the chile cold-outreach pitch ──
function render_email_html_usa($lead) {
  $company_raw = $lead['company'] ?? $lead['name'] ?? 'your business';
  $niche_key   = $lead['niche_key'] ?? 'smb';
  $niche_raw   = $lead['niche']     ?? 'your industry';
  $website_raw = $lead['website']   ?? '';
  $email_lc    = strtolower($lead['email'] ?? $company_raw);

  $company = htmlspecialchars($company_raw, ENT_QUOTES, 'UTF-8');
  $niche   = htmlspecialchars($niche_raw,   ENT_QUOTES, 'UTF-8');

  $sub = niche_subdomain($niche_key);
  $sub_label = htmlspecialchars($sub['label'], ENT_QUOTES, 'UTF-8');

  $audit_token = substr(hash('sha256', $email_lc . '|nwm-audit-2026'), 0, 24);
  $audit_url   = 'https://netwebmedia.com/audit?lead='
               . rawurlencode(base64_encode($email_lc))
               . '&t=' . $audit_token;

  $pool = usa_niche_findings($niche_key);
  $seed = hexdec(substr(md5($email_lc), 0, 8));
  mt_srand($seed);
  for ($i = count($pool) - 1; $i > 0; $i--) {
    $j = mt_rand(0, $i);
    $t = $pool[$i]; $pool[$i] = $pool[$j]; $pool[$j] = $t;
  }
  $hook_line = htmlspecialchars($pool[0] ?? '', ENT_QUOTES, 'UTF-8');

  $site_phrase = '';
  if ($website_raw && $website_raw !== 'No website' && $website_raw !== 'Not found') {
    $clean_site = htmlspecialchars(preg_replace('#^https?://#', '', rtrim($website_raw, '/')), ENT_QUOTES, 'UTF-8');
    $site_phrase = ' (we reviewed ' . $clean_site . ')';
  }

  $unsub_url = '{{UNSUB_URL}}';

  return '<!doctype html><html><body style="margin:0;padding:0;background:#fff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;">

    <div style="max-width:600px;margin:0 auto;background:#fff;">

      <div style="background:#FF671F;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
        <div style="font-family:Poppins,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:800;font-size:18px;letter-spacing:0.3px;">NetWebMedia</div>
        <div style="font-size:12px;opacity:0.92;margin-top:2px;letter-spacing:0.4px;">USA · Digital Growth Partners</div>
      </div>

      <div style="padding:28px 24px;font-size:15px;line-height:1.6;color:#1a1a2e;">
        <p style="margin:0 0 14px 0;">Hi team at <strong>' . $company . '</strong>,</p>

        <p style="margin:0 0 14px 0;">We\'re auditing the digital presence of leading ' . $sub_label . ' businesses in the US. <strong>' . $company . '</strong> came up in the <em>' . $niche . '</em> segment' . $site_phrase . '.</p>

        <p style="margin:0 0 18px 0;color:#374151;font-style:italic;">What we found: ' . $hook_line . '</p>

        <p style="margin:0 0 18px 0;">We put together a <strong>free digital audit for ' . $company . '</strong> — including:</p>

        <ul style="padding-left:20px;margin:0 0 22px 0;line-height:1.7;">
          <li><strong>Score 0-100</strong> across 12 dimensions of digital presence (AI visibility, mobile, schema, lead capture, reviews, automation).</li>
          <li><strong>Online credibility analysis</strong> of ' . $company . ' versus your direct competitors.</li>
          <li><strong>90-day customer-acquisition projection</strong> if you act on the gaps we found.</li>
        </ul>

        <p style="text-align:center;margin:0 0 22px 0;">
          <a href="' . $audit_url . '" style="display:inline-block;background:#FF671F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;">View ' . $company . '\'s audit →</a>
        </p>

        <p style="margin:0 0 14px 0;color:#374151;font-size:14px;text-align:center;">Opens directly — no form, no signup.</p>

        <p style="margin:22px 0 14px 0;">If you have 20 minutes this week, happy to walk through how NetWebMedia would implement the report\'s priorities — no pitch, no commitment. Just hit reply.</p>

        <p style="margin:18px 0 4px 0;">Best,<br><strong>The NetWebMedia Team</strong><br><a href="mailto:hola@netwebmedia.com" style="color:#FF671F;text-decoration:none;font-size:13px;">hola@netwebmedia.com</a> · <a href="https://netwebmedia.com" style="color:#FF671F;text-decoration:none;font-size:13px;">netwebmedia.com</a></p>

        <p style="font-size:11px;color:#999;margin:26px 0 0 0;border-top:1px solid #eee;padding-top:12px;line-height:1.55;">
          You\'re receiving this because ' . $company . ' appeared in our public US digital-presence analysis (April 2026). One-time outreach unless you reply.<br>
          <a href="' . $unsub_url . '" style="color:#999;">Unsubscribe</a> · NetWebMedia · USA outreach
        </p>
      </div>
    </div>

  </body></html>';
}

function subject_for_usa($lead) {
  $c = $lead['company'] ?? $lead['name'] ?? 'your business';
  $variants = [
    "Digital audit for $c",
    "$c — we ran the numbers, the PDF is inside",
    "For $c — digital presence analysis",
    "$c · digital audit ready",
    "AI-visibility audit of $c (free PDF)",
  ];
  $seed = hexdec(substr(md5(strtolower(($lead['email'] ?? $c) . '|usa-subj-v1')), 0, 8));
  return $variants[$seed % count($variants)];
}

// ── mode dispatch ──
if ($mode === 'status') {
  ju_exit([
    'audience_total_in_db' => count($pending) + count($already), // approx
    'already_sent'         => count($already),
    'pending'              => count($pending),
    'cap_total'            => $cap_total,
    'niche_filter'         => $niche_f ?: null,
    'log_path'             => $LOG,
    'log_exists'           => file_exists($LOG),
  ]);
}

if ($mode === 'preview') {
  if (!count($pending)) ju_exit(['error' => 'no pending leads']);
  $lead = $pending[0];
  header('Content-Type: text/html; charset=utf-8');
  echo render_email_html_usa($lead);
  exit;
}

if ($mode === 'test') {
  $to_param = $_GET['to'] ?? 'entrepoker@gmail.com,newsletter@netwebmedia.com';
  $recipients = array_values(array_filter(array_map('trim', explode(',', $to_param)),
    function ($e) { return $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL); }));
  if (!$recipients) ju_exit(['error' => 'no valid test recipients'], 400);

  $lead = count($pending) ? $pending[0] : ['company' => 'NetWebMedia Test', 'name' => 'Test', 'email' => 'demo@netwebmedia.com', 'niche' => 'Health & Medical', 'niche_key' => 'health'];
  $html = render_email_html_usa($lead);
  $subj = '[TEST] ' . subject_for_usa($lead);

  $results = [];
  foreach ($recipients as $rcpt) {
    $send_ok = $dryrun ? true : send_mail($rcpt, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    $results[] = [
      'to'    => $rcpt,
      'ok'    => (bool)$send_ok,
      'debug' => $send_ok ? null : [
        'http'  => $GLOBALS['NWM_LAST_MAIL_HTTP']  ?? null,
        'error' => $GLOBALS['NWM_LAST_MAIL_ERROR'] ?? null,
        'resp'  => $GLOBALS['NWM_LAST_MAIL_RESP']  ?? null,
      ],
    ];
  }

  ju_exit([
    'mode'       => 'test',
    'subject'    => $subj,
    'using_lead' => ['company' => $lead['company'] ?? null, 'niche' => $lead['niche'] ?? null],
    'dryrun'     => $dryrun,
    'results'    => $results,
    'all_ok'     => !in_array(false, array_column($results, 'ok'), true),
  ]);
}

if ($mode === 'batch' || $mode === 'all') {
  if ($mode === 'all' && !$confirmed) {
    ju_exit(['error' => 'mode=all requires &confirm=yes'], 400);
  }
  $cap = ($mode === 'all') ? count($pending) : $max;
  $results = ['sent' => 0, 'failed' => 0, 'emails' => []];
  foreach ($pending as $i => $lead) {
    if ($results['sent'] >= $cap) break;
    $email = $lead['email'];
    $html  = render_email_html_usa($lead);
    $subj  = subject_for_usa($lead);
    $ok    = $dryrun ? true : send_mail($email, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    if ($ok) {
      $results['sent']++;
      file_put_contents($LOG, strtolower($email) . "\n", FILE_APPEND | LOCK_EX);
    } else {
      $results['failed']++;
      file_put_contents($FAIL, strtolower($email) . "\t" . date('c') . "\n", FILE_APPEND | LOCK_EX);
    }
    $results['emails'][] = [
      'to'      => $email,
      'company' => $lead['company'] ?? null,
      'niche'   => $lead['niche']   ?? null,
      'ok'      => (bool)$ok,
    ];
    if ($results['sent'] < $cap) usleep(1_000_000); // 1s — same throttle as chile-send.php
  }
  ju_exit([
    'mode'    => $mode,
    'dryrun'  => $dryrun,
    'cap'     => $cap,
    'results' => $results,
    'remaining_pending' => count($pending) - $results['sent'],
  ]);
}

ju_exit(['error' => 'unknown mode', 'valid' => ['status','preview','test','batch','all']], 400);

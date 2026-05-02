<?php
/* USA cold-outreach wave 3 — CSV-based sender.
 *
 * Reads api-php/data/usa_5x_full.csv (~263k unique emails across 5 inbox
 * variants per business: info@, contact@, sales@, admin@, etc.).
 *
 * Dedupes against us-sent.log so waves 1 & 2 (CRM-based, 60,818 sent)
 * are automatically skipped. Also skips us-failed.log and unsubscribes.log.
 *
 * Same niche-specific copy engine as usa-send.php (shared functions).
 *
 * URL:  https://netwebmedia.com/api/usa-send-w3
 * Modes: status | preview | test | batch
 */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/mailer.php';

set_time_limit(600);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function w3_exit($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  exit;
}

// ----- auth -----
$EMBEDDED_TOKEN = 'NWM_USA_W3_2026_f8a3c1e9b2d47056';
$cfg      = config();
$expected = $cfg['usa_w3_token'] ?? $EMBEDDED_TOKEN;
$presented = (string)($_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '');
if (!hash_equals($expected, $presented)) {
  w3_exit(['error' => 'unauthorized'], 401);
}

$mode    = $_GET['mode']    ?? 'status';
$max     = min(3000, max(1, (int)($_GET['n'] ?? 3000)));
$niche_f = $_GET['niche']   ?? null;
$dryrun  = !empty($_GET['dryrun']);

// ----- paths -----
$CSV   = __DIR__ . '/data/usa_5x_full.csv';
$LOG   = __DIR__ . '/data/us-sent.log';     // shared with waves 1 & 2
$FAIL  = __DIR__ . '/data/us-failed.log';   // shared
$UNSUB = __DIR__ . '/data/unsubscribes.log';
$W3LOG = __DIR__ . '/data/us-w3-sent.log';  // wave-3-only count log (mirrors LOG entries)

// ----- constants -----
$FROM_NAME  = 'NetWebMedia';
$FROM_EMAIL = 'newsletter@netwebmedia.com';
$REPLY_TO   = 'hola@netwebmedia.com';

$FREE_DOMAINS = [
  'gmail.com','googlemail.com',
  'yahoo.com','yahoo.com.mx','yahoo.com.ar','yahoo.es','ymail.com',
  'hotmail.com','hotmail.es','hotmail.cl','hotmail.co.uk',
  'outlook.com','outlook.es',
  'live.com','live.cl','live.com.ar',
  'icloud.com','me.com','mac.com',
  'aol.com','msn.com',
];
$free_domain_set = array_flip($FREE_DOMAINS);

// ----- load skip sets -----
$already = [];
foreach ([$LOG, $W3LOG] as $logfile) {
  if (file_exists($logfile)) {
    foreach (file($logfile, FILE_IGNORE_NEW_LINES) as $line) {
      $e = strtolower(trim($line));
      if ($e !== '') $already[$e] = true;
    }
  }
}
if (file_exists($FAIL)) {
  foreach (file($FAIL, FILE_IGNORE_NEW_LINES) as $line) {
    $parts = explode("\t", $line);
    $e = strtolower(trim($parts[0] ?? ''));
    if ($e !== '' && strpos($e, '@') !== false) $already[$e] = true;
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

// ----- shared copy functions (same as usa-send.php) -----

function w3_niche_priority($niche_key) {
  static $map = [
    'financial_services' => 1, 'events_weddings'   => 1,
    'health'             => 2, 'real_estate'       => 2,
    'restaurants'        => 2, 'law_firms'         => 2, 'smb' => 2,
    'local_specialist'   => 3, 'tourism'           => 3, 'beauty' => 3,
    'automotive'         => 4, 'education'         => 4,
    'home_services'      => 3, 'wine_agriculture'  => 4,
  ];
  return $map[strtolower($niche_key ?? '')] ?? 5;
}

function w3_niche_subdomain($niche_key) {
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

function w3_niche_findings($niche_key) {
  // Identical pools to usa-send.php — same copy engine, same quality
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
    'home_services' => [
      'When someone searches ChatGPT for "[your service] in [your city]," your business isn\'t in the recommendation — those high-intent jobs go to whoever the AI surfaces.',
      'There\'s no online quote or booking tool — every after-hours inquiry waits until morning and books with the first company that replies.',
      'Google Business reviews aren\'t getting owner responses — in home services, that response rate is the top pre-hire trust signal.',
      'No automated follow-up for estimates that go cold — a single reminder 24-48 hours after a quote recovers 20-30% of those jobs.',
    ],
    'wine_agriculture' => [
      'Direct-to-consumer wine searches on ChatGPT don\'t surface your label — the AI is routing club memberships and tasting-room visits to the same 3-4 names.',
      'There\'s no wine-club renewal automation — lapsed members aren\'t getting a reactivation sequence, and that\'s your highest-margin revenue walking out.',
      'The tasting room and events calendar can\'t be self-booked online — weekend visits and corporate events are lost to whoever responds first.',
      'No post-visit email to convert visitors to club members — that single automation lifts club conversion by 20-35% in the DTC wine category.',
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

function w3_subject($lead) {
  $c  = $lead['company'] ?? $lead['name'] ?? 'your business';
  $nk = strtolower($lead['niche_key'] ?? '');
  $pools = [
    'financial_services' => ["$c — financial advisor visibility audit (free)","AI doesn't recommend $c yet — here's the gap","$c · digital presence vs 3 competitors","Advisor lead capture audit for $c"],
    'events_weddings'    => ["$c — wedding & events visibility audit","ChatGPT isn't recommending $c for events (yet)","$c · venue inquiry audit — free report","AI search gap: $c in your events market"],
    'health'             => ["$c — new patient acquisition audit (free)","AI isn't surfacing $c for patient searches","$c · digital health presence vs competitors","Patient booking audit for $c — free report inside"],
    'real_estate'        => ["$c — buyer lead audit is ready","AI visibility for real estate — $c report","$c · digital presence vs top local agents","Listing & lead capture audit for $c"],
    'restaurants'        => ["$c — restaurant visibility audit (free)","ChatGPT isn't recommending $c for dining","$c · menu & reservation audit ready","Digital dining audit for $c — free report"],
    'law_firms'          => ["$c — attorney intake audit (free report)","Case leads going cold: $c digital gap","ChatGPT doesn't recommend $c yet — here's why","$c · legal visibility vs 3 competitors"],
    'smb'                => ["$c — digital presence audit (free)","AI isn't routing prospects to $c yet","$c · local visibility vs competitors","Lead capture audit for $c — free report inside"],
    'local_specialist'   => ["$c — local search visibility audit (free)","AI search gap: $c isn't in the recommendation set","$c · digital presence vs top local results","Local authority audit for $c — free report"],
    'tourism'            => ["$c — travel & lodging visibility audit","AI travel search isn't surfacing $c yet","$c · booking inquiry audit — free report","Hospitality digital audit for $c"],
    'beauty'             => ["$c — salon & spa visibility audit (free)","AI beauty search gap: $c isn't showing up","$c · booking & review audit — free report","Beauty & spa digital audit for $c"],
    'automotive'         => ["$c — dealership visibility audit (free)","AI auto search isn't recommending $c yet","$c · service booking & review audit","Automotive digital presence audit for $c"],
    'education'          => ["$c — student enrollment audit (free)","AI education search gap: $c isn't visible","$c · program discovery & inquiry audit","Enrollment funnel audit for $c — free report"],
    'home_services'      => ["$c — home services visibility audit (free)","AI service search isn't surfacing $c yet","$c · booking & review audit — free report","Home services digital audit for $c"],
    'wine_agriculture'   => ["$c — wine & ag digital presence audit","Direct-to-consumer gap: $c visibility audit","$c · tasting room & e-commerce audit","Wine & agriculture digital audit for $c"],
  ];
  $default = ["Digital audit for $c","$c — we ran the numbers, the report is inside","For $c — digital presence analysis","$c · AI-visibility audit ready"];
  $variants = $pools[$nk] ?? $default;
  $seed = hexdec(substr(md5(strtolower(($lead['email'] ?? $c) . '|usa-w3-subj-v1')), 0, 8));
  return $variants[$seed % count($variants)];
}

function w3_audit_dimensions($niche_key) {
  $map = [
    'financial_services' => ['<strong>AI/ChatGPT visibility</strong> for your practice area and service lines — are prospects finding you before your competitors?','<strong>Lead qualification automation</strong> by asset size, product fit, and urgency — so advisors spend time on closeable deals.','<strong>Online credibility score</strong> vs 3-4 direct competitors in your market (site authority, reviews, schema, trust signals).'],
    'events_weddings'    => ['<strong>AI/ChatGPT visibility</strong> when couples and planners search for venues and coordinators in your area.','<strong>Mobile portfolio performance</strong> — load time, gallery rendering, and quote-request conversion on phones.','<strong>After-hours inquiry capture</strong> — how many weekend and evening leads are you losing to faster-responding competitors?'],
    'health'             => ['<strong>AI/ChatGPT visibility</strong> for new-patient searches in your specialty and zip code.','<strong>Online booking integration</strong> with real-time chair and exam-room availability.','<strong>Review response rate</strong> on Google, Healthgrades, and Zocdoc — the #1 selection signal for new patients.'],
    'real_estate'        => ['<strong>AI/ChatGPT visibility</strong> when buyers and sellers search for agents in your market.','<strong>Listing schema coverage</strong> — are your properties showing in Google\'s rich result with price, sqft, and gallery?','<strong>Lead qualification and self-scheduling</strong> for showings — how many serious buyers are you losing to email lag?'],
    'restaurants'        => ['<strong>AI/ChatGPT visibility</strong> when locals and visitors search for your cuisine type in your city.','<strong>Menu and reservation schema</strong> — is Google surfacing your rich card with hours, prices, and booking?','<strong>After-hours reservation capture</strong> and Google review response rate (direct driver of map click-through).'],
    'law_firms'          => ['<strong>ChatGPT/AI visibility</strong> for your practice areas — are opposing counsel\'s clients finding your firm first?','<strong>Intake automation</strong> — consultation self-scheduling and same-day triage for urgent inquiries.','<strong>Google Business review management</strong> — response rate and recency, the two signals clients weight most.'],
    'smb'                => ['<strong>AI/ChatGPT visibility</strong> in your product or service category — are B2B prospects finding you before they Google you?','<strong>Lead capture and automated follow-up</strong> — what percentage of inbound inquiries convert without a manual reply?','<strong>Local credibility score</strong> vs 3 direct competitors (reviews, schema, site authority, map ranking).'],
    'local_specialist'   => ['<strong>AI/ChatGPT visibility</strong> for your specialty searches — are you in the recommendation set or are 3 competitors?','<strong>LocalBusiness schema</strong> coverage — hours, service area, service types, and Google rich result priority.','<strong>Mobile performance and core web vitals</strong> — Google\'s explicit local ranking signal.'],
    'tourism'            => ['<strong>AI/ChatGPT visibility</strong> for travel searches in your destination — boutique stays, tours, and local experiences.','<strong>Hotel/Lodging schema</strong> with prices and availability — are you in Google\'s rich lodging card on mobile?','<strong>Booking inquiry automation</strong> — same-hour response rate vs the industry benchmark (guests book the first to reply).'],
    'beauty'             => ['<strong>AI/ChatGPT visibility</strong> for "best salon/spa near me" — are you in the recommendation set at the moment of decision?','<strong>24/7 online booking</strong> with real-time availability — how many evening and weekend bookings are you losing?','<strong>Appointment reminder automation</strong> via SMS and email — industry no-show rate without reminders: ~15%.'],
    'automotive'         => ['<strong>AI/ChatGPT visibility</strong> for service and sales searches in your area — those high-intent calls go to 3 fixed names.','<strong>Online quote and service booking</strong> — after-hours and weekend leads going to the first shop that responds.','<strong>Google review management</strong> — response recency and owner reply rate, the two signals that drive service calls.'],
    'education'          => ['<strong>AI/ChatGPT visibility</strong> for program and enrollment searches — are you in the recommendation set for your degrees?','<strong>Enrollment inquiry automation</strong> — drip nurture for brochure downloads and open-house registrations.','<strong>Course/Program schema</strong> — is Google showing your offering in the education rich result with dates and pricing?'],
    'home_services'      => ['<strong>AI/ChatGPT visibility</strong> for service searches in your area — HVAC, plumbing, roofing, landscaping, and more.','<strong>Online quote and booking automation</strong> — same-day lead capture for calls that come in after business hours.','<strong>Google Business review management</strong> — response rate and recency are the top two signals homeowners check.'],
    'wine_agriculture'   => ['<strong>AI/ChatGPT visibility</strong> for direct-to-consumer wine and ag searches — club memberships, tasting rooms, and shipments.','<strong>E-commerce and wine club automation</strong> — cart abandonment, renewal reminders, and club acquisition flows.','<strong>Tasting room and events booking</strong> — online self-scheduling and after-hours inquiry capture.'],
  ];
  return $map[$niche_key] ?? ['<strong>Score 0-100</strong> across 12 dimensions of digital presence (AI visibility, mobile, schema, lead capture, reviews, automation).','<strong>Online credibility analysis</strong> vs your direct competitors.','<strong>90-day customer-acquisition projection</strong> if you act on the gaps we found.'];
}

function w3_render_email($lead) {
  $company_raw = $lead['company'] ?? $lead['name'] ?? 'your business';
  $niche_key   = $lead['niche_key'] ?? 'smb';
  $niche_raw   = $lead['niche']     ?? 'your industry';
  $website_raw = $lead['website']   ?? '';
  $email_lc    = strtolower($lead['email'] ?? $company_raw);

  $company   = htmlspecialchars($company_raw, ENT_QUOTES, 'UTF-8');
  $niche     = htmlspecialchars($niche_raw,   ENT_QUOTES, 'UTF-8');
  $sub       = w3_niche_subdomain($niche_key);
  $sub_label = htmlspecialchars($sub['label'], ENT_QUOTES, 'UTF-8');

  $audit_token = substr(hash('sha256', $email_lc . '|nwm-audit-2026'), 0, 24);
  $audit_url   = 'https://netwebmedia.com/audit?lead='
               . rawurlencode(base64_encode($email_lc))
               . '&t=' . $audit_token;

  $pool = w3_niche_findings($niche_key);
  $seed = hexdec(substr(md5($email_lc), 0, 8));
  mt_srand($seed);
  for ($i = count($pool) - 1; $i > 0; $i--) {
    $j = mt_rand(0, $i); $t = $pool[$i]; $pool[$i] = $pool[$j]; $pool[$j] = $t;
  }
  $hook_line = htmlspecialchars($pool[0] ?? '', ENT_QUOTES, 'UTF-8');

  $site_phrase = '';
  if ($website_raw && $website_raw !== 'No website' && $website_raw !== 'Not found') {
    $clean = htmlspecialchars(preg_replace('#^https?://#', '', rtrim($website_raw, '/')), ENT_QUOTES, 'UTF-8');
    $site_phrase = ' (we reviewed ' . $clean . ')';
  }

  $dims = w3_audit_dimensions($niche_key);
  $dim_html = implode('', array_map(fn($d) =>
    '<li style="margin-bottom:6px">' . $d . '</li>', $dims));

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
    <ul style="padding-left:20px;margin:0 0 22px 0;line-height:1.7;">' . $dim_html . '</ul>
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

// ----- load + filter CSV audience -----
$pending = [];
$total_csv = 0;

if (!file_exists($CSV)) {
  w3_exit(['error' => 'CSV not found', 'path' => $CSV], 500);
}

$fp = fopen($CSV, 'r');
$headers = fgetcsv($fp);

// Priority-sort requires loading the whole filtered set first.
// With 387k rows this takes ~1-2s in memory — acceptable.
$universe = [];
$seen     = [];

while ($row = fgetcsv($fp)) {
  if (!$row || count($row) < 2) continue;
  $r = array_combine($headers, array_slice($row, 0, count($headers)));
  $email = strtolower(trim($r['email'] ?? ''));
  if ($email === '' || strpos($email, '@') === false) continue;
  if (isset($seen[$email])) continue; // dedup within CSV
  $domain = strtolower(substr(strrchr($email, '@'), 1));
  if (isset($free_domain_set[$domain])) continue; // skip free
  $company = trim($r['company'] ?? '');
  if ($company === '') continue; // must have company

  $niche_key = trim($r['niche_key'] ?? '');
  if ($niche_f && stripos($niche_key, $niche_f) === false) continue;

  $total_csv++;
  $seen[$email] = true;

  if (isset($already[$email]) || isset($unsub[$email])) continue;

  $universe[] = [
    'email'     => $r['email'],
    'name'      => $r['name']      ?? '',
    'company'   => $company,
    'niche_key' => $niche_key,
    'niche'     => $r['niche']     ?? '',
    'city'      => $r['city']      ?? '',
    'state'     => $r['state']     ?? '',
    'website'   => $r['website']   ?? '',
    '_priority' => w3_niche_priority($niche_key),
    '_email_lc' => $email,
  ];
}
fclose($fp);

// Sort by priority then original CSV order (stable — usort is stable in PHP 8+)
usort($universe, fn($a, $b) => $a['_priority'] <=> $b['_priority']);
$pending = $universe;

// ── mode dispatch ──
if ($mode === 'status') {
  w3_exit([
    'campaign'         => 'USA Wave 3 (CSV)',
    'csv_total_unique' => $total_csv,
    'already_skipped'  => $total_csv - count($pending) - count($unsub),
    'pending'          => count($pending),
    'niche_filter'     => $niche_f ?: null,
    'log_path'         => $W3LOG,
    'log_exists'       => file_exists($W3LOG),
  ]);
}

if ($mode === 'preview') {
  if (!count($pending)) w3_exit(['error' => 'no pending leads']);
  $lead = $pending[0];
  header('Content-Type: text/html; charset=utf-8');
  echo w3_render_email($lead);
  exit;
}

if ($mode === 'test') {
  $to_param = $_GET['to'] ?? 'entrepoker@gmail.com,newsletter@netwebmedia.com';
  $recipients = array_values(array_filter(array_map('trim', explode(',', $to_param)),
    fn($e) => $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)));
  if (!$recipients) w3_exit(['error' => 'no valid test recipients'], 400);

  $lead = count($pending) ? $pending[0]
    : ['company' => 'NetWebMedia Test', 'name' => 'Test', 'email' => 'demo@netwebmedia.com',
       'niche' => 'Health & Medical', 'niche_key' => 'health', 'website' => '', 'city' => '', 'state' => ''];
  $html = w3_render_email($lead);
  $subj = '[TEST-W3] ' . w3_subject($lead);

  $results = [];
  foreach ($recipients as $rcpt) {
    $ok = $dryrun ? true : send_mail($rcpt, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    $results[] = ['to' => $rcpt, 'ok' => (bool)$ok];
  }
  w3_exit(['mode' => 'test', 'subject' => $subj, 'dryrun' => $dryrun, 'results' => $results]);
}

if ($mode === 'batch') {
  $cap = $max;
  $results = ['sent' => 0, 'failed' => 0, 'sample' => []];

  foreach ($pending as $lead) {
    if ($results['sent'] + $results['failed'] >= $cap) break;
    $email = $lead['email'];
    $html  = w3_render_email($lead);
    $subj  = w3_subject($lead);
    $ok    = $dryrun ? true : send_mail($email, $subj, $html, [
      'from_name' => $FROM_NAME, 'from_email' => $FROM_EMAIL, 'reply_to' => $REPLY_TO,
    ]);
    if ($ok) {
      $results['sent']++;
      $lc = strtolower($email);
      file_put_contents($LOG,   $lc . "\n", FILE_APPEND | LOCK_EX); // shared log
      file_put_contents($W3LOG, $lc . "\n", FILE_APPEND | LOCK_EX); // w3-only counter
    } else {
      $results['failed']++;
      file_put_contents($FAIL, strtolower($email) . "\t" . date('c') . "\n", FILE_APPEND | LOCK_EX);
    }
    if (count($results['sample']) < 5) {
      $results['sample'][] = ['to' => $email, 'company' => $lead['company'] ?? null,
                               'niche' => $lead['niche'] ?? null, 'ok' => (bool)$ok];
    }
    if ($results['sent'] + $results['failed'] < $cap) usleep(10_000); // 10ms throttle
  }

  $w3_sent = file_exists($W3LOG) ? count(file($W3LOG, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)) : $results['sent'];
  w3_exit([
    'mode'        => 'batch',
    'dryrun'      => $dryrun,
    'cap'         => $cap,
    'results'     => $results,
    'w3_sent'     => $w3_sent,
    'w3_pending'  => max(0, count($pending) - $results['sent'] - $results['failed']),
  ]);
}

w3_exit(['error' => 'unknown mode', 'valid' => ['status','preview','test','batch']], 400);

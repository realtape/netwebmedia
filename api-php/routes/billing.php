<?php
/* NetWebMedia billing — Mercado Pago (CLP native, USD display).
   Routes:
     GET  /api/billing/plans                    Public. List plans with USD/CLP.
     GET  /api/billing/my-subscription          Auth. Current org's active sub.
     POST /api/billing/checkout                 Auth. {plan_code} → MP preapproval URL.
     POST /api/billing/cancel                   Auth. Cancel current sub.
     POST /api/billing/webhook                  Public (signed). MP notifications.
     GET  /api/billing/return                   Public. Post-checkout redirect handler.
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

/* ---------- Stripe price-ID mapping ----------
   Carlos creates one recurring monthly Price per plan in his Stripe dashboard
   (Products → Add product → Recurring → monthly → USD), then sets the price
   IDs in config.local.php as:
     'stripe_price_cmo_starter' => 'price_xxx',
     'stripe_price_cmo_growth'  => 'price_xxx',
     'stripe_price_cmo_scale'   => 'price_xxx',
     ... (one per plan_code we want to sell via Stripe)
   The constants below are placeholder defaults — they are NOT valid Stripe
   IDs and the handler returns 503 if a real ID hasn't been overridden. */
if (!defined('STRIPE_PRICE_CMO_STARTER')) define('STRIPE_PRICE_CMO_STARTER', 'price_TODO_carlos_create_in_dashboard');
if (!defined('STRIPE_PRICE_CMO_GROWTH'))  define('STRIPE_PRICE_CMO_GROWTH',  'price_TODO_carlos_create_in_dashboard');
if (!defined('STRIPE_PRICE_CMO_SCALE'))   define('STRIPE_PRICE_CMO_SCALE',   'price_TODO_carlos_create_in_dashboard');

/* ---------- FX + rounding helpers ---------- */
function bl_fx_rate() {
  $c = config();
  return (float) ($c['usd_clp_rate'] ?? 950.0);
}

function bl_round_clp($usd) {
  $raw = $usd * bl_fx_rate();
  return (int) (round($raw / 1000.0) * 1000);
}

function bl_plans_seed() {
  // USD only. Anchor: CRM $49/$249/$449 — derived across all SKUs.
  return [
    // ── Standalone CRM (3 tiers) ──
    [
      'code'     => 'crm_starter',
      'name'     => 'CRM Starter',
      'category' => 'crm',
      'usd'      => 49,
      'setup'    => 297,
      'tagline'  => 'Full CRM · 1 user — vs GHL Starter ($97) · save 49%',
      'features' => [
        'Unlimited contacts, deals & pipelines',
        'Email campaigns + workflow automations',
        'AI chat agent + calendar booking',
        '1 user · 500 active contacts',
        'vs. GoHighLevel Starter ($97) — save 49%',
      ],
    ],
    [
      'code'      => 'crm_pro',
      'name'      => 'CRM Pro',
      'category'  => 'crm',
      'usd'       => 249,
      'setup'     => 497,
      'tagline'   => 'Unlimited users + AI — vs GHL Unlimited ($297) · save 16%',
      'features'  => [
        'Everything in Starter',
        'Unlimited users + contacts',
        'Landing pages, memberships, workflows',
        'A/B tests, AI Content Writer, Knowledge Base',
        'vs. GoHighLevel Unlimited ($297) — save 16%',
      ],
      'highlight' => true,
    ],
    [
      'code'          => 'crm_agency',
      'name'          => 'CRM Agency',
      'category'      => 'crm',
      'usd'           => 449,
      'setup'         => 797,
      'needs_contact' => true,
      'tagline'       => 'White-label + sub-accounts — vs GHL SaaS Pro ($497) · save 10%',
      'features'      => [
        'Everything in Pro',
        'White-label (your domain + your logo)',
        'Unlimited client sub-accounts',
        'Resell at your own margin',
        'vs. GoHighLevel SaaS Pro ($497) — save 10%',
      ],
    ],
    // ── Standalone Website SKUs (build + care plan) ──
    [
      'code'     => 'website_basic',
      'name'     => 'Website Basic',
      'category' => 'website',
      'usd'      => 149,
      'setup'    => 1800,
      'tagline'  => '5-page site + Care — vs $3K build at typical agency',
      'features' => [
        '5 pages: Home, Services, About, Blog, Contact',
        'Bilingual EN/ES ready',
        'On-page SEO + AEO + schema.org markup',
        'Forms wired to your CRM',
        'Care Basic: hosting, SSL, backups, monthly edits',
        'vs. typical agency ($3,000 + $200/mo) — save ~50%',
      ],
    ],
    [
      'code'      => 'website_standard',
      'name'      => 'Website Standard',
      'category'  => 'website',
      'usd'       => 349,
      'setup'     => 3500,
      'tagline'   => '10 pages + funnel — vs $6K build at typical agency',
      'features'  => [
        'Everything in Basic',
        '10 pages + 1 conversion funnel',
        'Newsletter, popups, exit intent',
        'Advanced analytics + Meta Pixel + GA4',
        'Care Full: monthly SEO refresh + A/B tests',
        'vs. typical agency ($6,000 + $300/mo) — save ~50%',
      ],
      'highlight' => true,
    ],
    [
      'code'     => 'website_premium',
      'name'     => 'Website Premium',
      'category' => 'website',
      'usd'      => 649,
      'setup'    => 5500,
      'tagline'  => '15+ pages + CRO — vs $12K custom build',
      'features' => [
        'Everything in Standard',
        '15+ pages + 2 conversion funnels',
        'Custom CRO program (A/B tests monthly)',
        'Membership / gated content areas',
        'E-commerce ready (Mercado Pago integrated)',
        'Care Full + priority support',
        'vs. typical custom build ($12,000 + $500/mo) — save ~55%',
      ],
    ],
    // ── AI Agents (chatbots) ──
    [
      'code'    => 'agent_starter',
      'name'    => 'AI Agent Starter',
      'category'=> 'agents',
      'usd'     => 99,
      'setup'   => 297,
      'tagline' => '1 agent — vs Intercom ($74) with more AI power',
      'features'=> ['1 Claude-powered chat agent','Embed on any website','Your knowledge base + FAQ','500 conversations/mo','Email transcripts + CRM capture','vs. Intercom ($74/mo) — comparable price, more AI'],
    ],
    [
      'code'     => 'agent_pro',
      'name'     => 'AI Agent Pro',
      'category' => 'agents',
      'usd'      => 249,
      'setup'    => 497,
      'tagline'  => '3 agents + RAG — vs Intercom Advanced ($169)',
      'features' => ['Everything in Starter','3 agents (sales / support / booking)','RAG knowledge base search','Unlimited conversations','Handoff to human via CRM conversations','vs. Intercom Advanced ($169) — deeper AI, lower cost'],
      'highlight'=> true,
    ],
    [
      'code'          => 'agent_max',
      'name'          => 'AI Agent Max',
      'category'      => 'agents',
      'usd'           => 449,
      'setup'         => 797,
      'needs_contact' => true,
      'tagline'       => 'Unlimited + custom voice — vs Drift ($2,500)',
      'features'      => ['Everything in Pro','Unlimited agents + custom model tuning','Lead scoring + qualification flows','Multi-language (EN/ES native)','Priority SLA + monthly performance review','vs. Drift ($2,500/mo) — save 82%'],
    ],
    // ── AI Automate (workflows + integrations) ──
    [
      'code'    => 'automate_starter',
      'name'    => 'Automate Starter',
      'category'=> 'automate',
      'usd'     => 249,
      'setup'   => 497,
      'tagline' => '3 flows, 5K exec/mo — vs Zapier Pro ($49) + dev time',
      'features'=> ['3 live workflows built for you','5,000 monthly executions','n8n + Make + CRM integrations','Lead capture → CRM routing','Monthly report','3-day setup'],
    ],
    [
      'code'     => 'automate_growth',
      'name'     => 'Automate Growth',
      'category' => 'automate',
      'usd'      => 549,
      'setup'    => 797,
      'tagline'  => '10 flows, 25K exec/mo — most common',
      'features' => ['10 live workflows','25,000 monthly executions','AI-scored lead enrichment + routing','Multi-channel (Email/SMS/WhatsApp hooks)','Weekly dashboards','7-day setup'],
      'highlight'=> true,
    ],
    [
      'code'          => 'automate_scale',
      'name'          => 'Automate Scale',
      'category'      => 'automate',
      'usd'           => 949,
      'setup'         => 1497,
      'needs_contact' => true,
      'tagline'       => 'Unlimited flows + dedicated engineer',
      'features'      => ['Unlimited workflows + executions','Custom integrations included','Dedicated automation engineer','14-day setup + weekly tuning','SLA: 2hr response'],
    ],
    // ── Short-Form Video Factory ──
    [
      'code'    => 'video_starter',
      'name'    => 'Video 2/week',
      'category'=> 'video',
      'usd'     => 497,
      'setup'   => 900,
      'tagline' => '2 Reels/week — vs agency $1,500/mo · save 67%',
      'features'=> ['2 Reels per week (8/mo)','Heygen AI avatar + Higgsfield motion','Seedance I2V pipeline','Cross-posted to IG, TikTok, YT Shorts','Hook A/B tests','Weekly scorecard'],
    ],
    [
      'code'     => 'video_pro',
      'name'     => 'Video 5/week',
      'category' => 'video',
      'usd'      => 997,
      'setup'    => 900,
      'tagline'  => '5 Reels/week — full-steam cadence',
      'features' => ['Everything in 2/week','5 Reels per week (20/mo)','Scripted + UGC-style mix','Bilingual EN/ES content','Monthly performance review'],
      'highlight'=> true,
    ],
    [
      'code'          => 'video_premium',
      'name'          => 'Video Premium',
      'category'      => 'video',
      'usd'           => 1997,
      'setup'         => 900,
      'needs_contact' => true,
      'tagline'       => '5 Reels + 2 YouTube long-form/mo',
      'features'      => ['Everything in 5/week','2 YouTube long-form videos/mo (8-15 min)','Podcast-to-Reel repurposing','Thumbnail design + optimization','Creator manager assigned'],
    ],
    // ── AI SEO & Content ──
    [
      'code'    => 'seo_starter',
      'name'    => 'SEO Starter',
      'category'=> 'seo',
      'usd'     => 497,
      'setup'   => 500,
      'tagline' => '4 articles + keyword tracking — vs agency $1,500/mo',
      'features'=> ['Keyword research + rank tracking','4 AI-written SEO articles/mo (1,500+ words)','On-page optimization','AEO (FAQ + JSON-LD schema)','Monthly rank report'],
    ],
    [
      'code'     => 'seo_pro',
      'name'     => 'SEO Pro',
      'category' => 'seo',
      'usd'      => 997,
      'setup'    => 997,
      'tagline'  => '8 articles + backlink building',
      'features' => ['Everything in Starter','8 articles/mo + human editing','Backlink outreach (3-5 links/mo)','Competitor gap analysis','Quarterly strategy call'],
      'highlight'=> true,
    ],
    [
      'code'          => 'seo_max',
      'name'          => 'SEO Max',
      'category'      => 'seo',
      'usd'           => 1497,
      'setup'         => 1500,
      'needs_contact' => true,
      'tagline'       => '16 articles + full technical SEO',
      'features'      => ['Everything in Pro','16 articles/mo','Full technical SEO audit + fixes','Internal linking strategy','Schema markup for every page','Priority rankings focus'],
    ],
    // ── Paid Ads Management ── (unchanged — market rate)
    [
      'code'    => 'ads_starter',
      'name'    => 'Ads Starter',
      'category'=> 'ads',
      'usd'     => 497,
      'setup'   => 500,
      'tagline' => '1 platform — flat fee, no % skim',
      'features'=> ['1 platform (Google OR Meta)','Up to $5K/mo ad spend managed','Creative testing + ROAS tracking','Weekly optimization','Monthly report','Flat fee — not % of spend'],
    ],
    [
      'code'     => 'ads_pro',
      'name'     => 'Ads Pro',
      'category' => 'ads',
      'usd'      => 997,
      'setup'    => 800,
      'tagline'  => '2 platforms — vs agency 15% of spend',
      'features' => ['2 platforms (Google + Meta)','Up to $20K/mo ad spend managed','Landing page A/B tests','Retargeting + lookalikes','Bi-weekly optimization calls'],
      'highlight'=> true,
    ],
    [
      'code'          => 'ads_max',
      'name'          => 'Ads Max',
      'category'      => 'ads',
      'usd'           => 1997,
      'setup'         => 1500,
      'needs_contact' => true,
      'tagline'       => 'All platforms, unlimited spend',
      'features'      => ['Google, Meta, TikTok, LinkedIn, YouTube','Unlimited ad spend management','Creative production included (video + static)','Dedicated ads strategist','Weekly sync + real-time Slack'],
    ],
    // ── Social Media Management ──
    [
      'code'    => 'social_starter',
      'name'    => 'Social Starter',
      'category'=> 'social',
      'usd'     => 297,
      'setup'   => 500,
      'tagline' => '2 platforms, 12 posts/mo',
      'features'=> ['2 social platforms','12 posts/month','Content calendar planning','Hashtag research','Monthly analytics report'],
    ],
    [
      'code'     => 'social_pro',
      'name'     => 'Social Pro',
      'category' => 'social',
      'usd'      => 597,
      'setup'    => 800,
      'tagline'  => '4 platforms, 20 posts/mo + community',
      'features' => ['4 platforms','20 posts/mo','Community management (reply to DMs/comments)','Story/Reel creation included','Engagement strategy','Bi-weekly review'],
      'highlight'=> true,
    ],
    [
      'code'          => 'social_max',
      'name'          => 'Social Max',
      'category'      => 'social',
      'usd'           => 997,
      'setup'         => 1500,
      'needs_contact' => true,
      'tagline'       => 'All platforms + influencer outreach',
      'features'      => ['All major platforms','30+ posts/mo','Influencer partnership outreach','Live social listening + trend response','Dedicated community manager','Weekly strategy call'],
    ],
    // ── AI Fractional CMO (agent + human review) ── (unchanged)
    [
      'code'    => 'cmo_starter',
      'name'    => 'CMO Starter',
      'category'=> 'cmo',
      'usd'     => 249,
      'setup'   => 249,
      'tagline' => 'AI CMO + human review monthly — vs $5K-10K/mo fractional CMO',
      'features'=> ['24/7 AI Fractional CMO agent (Claude-powered)','Chat anytime about strategy, pricing, positioning','Generate deliverables on demand (8 templates)','Monthly written review by NWM strategist','Metric dashboard + KPI targets','vs. human fractional CMO ($5K-10K/mo) — save 95%'],
    ],
    [
      'code'     => 'cmo_growth',
      'name'     => 'CMO Growth',
      'category' => 'cmo',
      'usd'      => 999,
      'setup'    => 999,
      'highlight'=> true,
      'tagline'  => 'AI CMO + bi-weekly human strategist — most common',
      'features' => ['Everything in Starter','Bi-weekly 45-min strategy calls with senior CMO','90-day marketing plan refreshed quarterly','Competitive analysis + positioning review','Campaign briefs on demand (up to 4/mo)','Priority Slack Connect','vs. $8K-15K/mo fractional CMO — save 87%'],
    ],
    [
      'code'          => 'cmo_scale',
      'name'          => 'CMO Scale',
      'category'      => 'cmo',
      'usd'           => 2499,
      'setup'         => 2499,
      'needs_contact' => true,
      'tagline'       => 'Embedded CMO — weekly calls + board-ready reports',
      'features'      => ['Everything in Growth','Weekly 60-min calls with senior CMO','Board-ready monthly reports','Attends your leadership meetings (remote)','Custom KPI dashboard + anomaly alerts','Unlimited deliverables','Hiring guidance for marketing team'],
    ],
    // ── Full-stack bundles (CRM + Automate + Website + Video) ──
    [
      'code'    => 'launch',
      'name'    => 'Launch',
      'category'=> 'bundle',
      'usd'     => 1295,
      'setup'   => 2970,
      'tagline' => 'For SMBs under $1M — 4 services bundled · save 10%',
      'features'=> [
        'NWM CRM Starter (included)',
        'NWM Automate Starter (3 flows, 5K exec/mo)',
        'Website Basic (5 pages)',
        'Care Basic (hosting + edits)',
        'Short-Form Video — 2 Reels/week',
      ],
    ],
    [
      'code'     => 'grow',
      'name'     => 'Grow',
      'category' => 'bundle',
      'usd'      => 2497,
      'setup'    => 4920,
      'tagline'  => 'For SMBs $1-5M — most common · save 18%',
      'features' => [
        'NWM CRM Pro (unlimited users, included)',
        'NWM Automate Growth (10 flows, 25K exec/mo)',
        'Website Standard + 1 funnel',
        'Care Full (SEO refresh included)',
        'Short-Form Video — 5 Reels/week',
      ],
      'highlight'=> true,
    ],
    [
      'code'          => 'scale',
      'name'          => 'Scale',
      'category'      => 'bundle',
      'usd'           => 3997,
      'setup'         => 8175,
      'needs_contact' => true,
      'tagline'       => 'For SMBs $5-20M — market leaders · save 25%',
      'features'      => [
        'NWM CRM Agency (white-label, included)',
        'NWM Automate Scale (unlimited flows + exec)',
        'Website Premium (15+ pp, 2 funnels, CRO)',
        'Care Full + priority support',
        'Premium Video (5 Reels/wk + 2 YT long-form/mo)',
        'We run all campaigns for you',
      ],
    ],
  ];
}

function bl_plans_with_clp() {
  $out = [];
  foreach (bl_plans_seed() as $p) {
    $p['clp'] = bl_round_clp($p['usd']);
    $out[] = $p;
  }
  return $out;
}

function bl_plan($code) {
  foreach (bl_plans_with_clp() as $p) if ($p['code'] === $code) return $p;
  return null;
}

/* ---------- Mercado Pago helpers ---------- */
function bl_mp_token() {
  $c = config();
  return $c['mp_access_token'] ?? '';
}

function bl_mp_public_key() {
  $c = config();
  return $c['mp_public_key'] ?? '';
}

function bl_mp_webhook_secret() {
  $c = config();
  return $c['mp_webhook_secret'] ?? '';
}

function bl_mp_post($path, $body) {
  $token = bl_mp_token();
  if (!$token) err('MP access token not configured', 500);
  $ch = curl_init('https://api.mercadopago.com' . $path);
  curl_setopt_array($ch, [
    CURLOPT_POST => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $token,
      'Content-Type: application/json',
      'X-Idempotency-Key: ' . bin2hex(random_bytes(16)),
    ],
    CURLOPT_POSTFIELDS => json_encode($body),
    CURLOPT_TIMEOUT => 30,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['code' => $code, 'json' => json_decode($res, true), 'raw' => $res];
}

function bl_mp_get($path) {
  $token = bl_mp_token();
  if (!$token) return ['code' => 500, 'json' => null];
  $ch = curl_init('https://api.mercadopago.com' . $path);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
    CURLOPT_TIMEOUT => 30,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['code' => $code, 'json' => json_decode($res, true)];
}

/* ---------- Schema bootstrap (idempotent) ---------- */
function bl_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    plan_code VARCHAR(40) NOT NULL,
    usd_amount DECIMAL(10,2) NOT NULL,
    clp_amount INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    mp_preapproval_id VARCHAR(100) DEFAULT NULL,
    mp_init_point TEXT,
    promo_code VARCHAR(40) DEFAULT NULL,
    discount_pct TINYINT UNSIGNED DEFAULT 0,
    discount_cycles TINYINT UNSIGNED DEFAULT 0,
    current_period_start DATETIME DEFAULT NULL,
    current_period_end DATETIME DEFAULT NULL,
    canceled_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id), KEY ix_status (status), KEY ix_mp (mp_preapproval_id)
  )");
  db()->exec("CREATE TABLE IF NOT EXISTS billing_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT DEFAULT NULL,
    mp_resource VARCHAR(40),
    mp_id VARCHAR(100),
    topic VARCHAR(40),
    status VARCHAR(40),
    amount_clp INT,
    raw JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_sub (subscription_id), KEY ix_mp (mp_id)
  )");
  db()->exec("CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    discount_pct TINYINT UNSIGNED NOT NULL,
    discount_cycles TINYINT UNSIGNED NOT NULL DEFAULT 1,
    applies_to VARCHAR(255) DEFAULT NULL,
    max_uses INT UNSIGNED DEFAULT NULL,
    uses_count INT UNSIGNED NOT NULL DEFAULT 0,
    valid_until DATETIME DEFAULT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    notes VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_code (code)
  )");
  // Seed launch coupons (idempotent — ON DUPLICATE KEY so re-running is safe)
  db()->exec("INSERT INTO coupons (code, discount_pct, discount_cycles, applies_to, max_uses, valid_until, notes)
    VALUES ('Carlos26', 50, 3, 'cmo_starter,cmo_growth,cmo_scale,crm_starter,crm_pro,crm_agency', 500, '2026-04-21 23:59:59', 'NWM CRM launch week — RETIRED 2026-04-21')
    ON DUPLICATE KEY UPDATE active=0, valid_until='2026-04-21 23:59:59', notes='RETIRED 2026-04-21 per CEO directive'");

  // Access-control lockdown: ensure users.status column exists so the webhook
  // can flip pending_payment → active. Swallow duplicate-column errors so this
  // is safe to run on every billing route hit.
  try {
    db()->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending_payment' AFTER role");
    // Grandfather any pre-lockdown users into active so we don't lock existing customers out.
    db()->exec("UPDATE users SET status='active' WHERE status IS NULL OR status=''");
  } catch (PDOException $e) {
    // Duplicate column / already migrated — ignore.
  }
}

/* ---------- Coupon helpers ---------- */
function bl_coupon_lookup($code) {
  if (!$code) return null;
  $row = qOne("SELECT * FROM coupons WHERE code = ? AND active = 1 LIMIT 1", [trim($code)]);
  if (!$row) return null;
  if (!empty($row['valid_until']) && strtotime($row['valid_until']) < time()) return null;
  if ($row['max_uses'] !== null && (int)$row['uses_count'] >= (int)$row['max_uses']) return null;
  return $row;
}

function bl_coupon_applies($coupon, $plan_code) {
  if (empty($coupon['applies_to'])) return true;
  $allowed = array_map('trim', explode(',', $coupon['applies_to']));
  return in_array($plan_code, $allowed, true);
}

function bl_apply_discount($clp, $pct) {
  $pct = max(0, min(100, (int)$pct));
  if ($pct === 0) return (int)$clp;
  $discounted = (int)$clp * (100 - $pct) / 100;
  return (int)(round($discounted / 1000.0) * 1000); // round to nearest 1K CLP
}

/* ---------- Route entry ---------- */
function route_billing($parts, $method) {
  bl_ensure_schema();
  $sub = $parts[0] ?? '';

  if ($sub === 'plans' && $method === 'GET') {
    json_out(['items' => bl_plans_with_clp(), 'fx_rate' => bl_fx_rate(), 'currency_display' => 'USD', 'currency_charge' => 'CLP']);
  }

  if ($sub === 'validate-coupon' && $method === 'GET') {
    $code = $_GET['code'] ?? '';
    $plan = $_GET['plan'] ?? '';
    $c = bl_coupon_lookup($code);
    if (!$c) json_out(['valid' => false, 'reason' => 'Invalid or expired code']);
    if ($plan && !bl_coupon_applies($c, $plan)) {
      json_out(['valid' => false, 'reason' => 'Code not valid for this plan']);
    }
    json_out([
      'valid'           => true,
      'code'            => $c['code'],
      'discount_pct'    => (int)$c['discount_pct'],
      'discount_cycles' => (int)$c['discount_cycles'],
      'valid_until'     => $c['valid_until'],
    ]);
  }

  if ($sub === 'my-subscription' && $method === 'GET') {
    $u = requireAuth();
    $row = qOne("SELECT * FROM subscriptions WHERE org_id = ? AND status IN ('active','pending') ORDER BY id DESC LIMIT 1", [$u['org_id']]);
    if (!$row) json_out(['subscription' => null]);
    $row['plan'] = bl_plan($row['plan_code']);
    json_out(['subscription' => $row]);
  }

  if ($sub === 'checkout' && $method === 'POST') {
    $u = requireAuth();
    $b = required(['plan_code']);
    $plan = bl_plan($b['plan_code']);
    if (!$plan) err('Unknown plan', 400);
    if (!empty($plan['needs_contact'])) {
      err('This plan requires a quick call — please use Contact Sales instead. /contact.html?plan=' . $plan['code'] . '&intent=sales', 400);
    }

    // Optional coupon
    $promo = trim((string)($b['promo_code'] ?? ''));
    $coupon = $promo ? bl_coupon_lookup($promo) : null;
    if ($coupon && !bl_coupon_applies($coupon, $plan['code'])) $coupon = null;
    $discount_pct    = $coupon ? (int)$coupon['discount_pct']    : 0;
    $discount_cycles = $coupon ? (int)$coupon['discount_cycles'] : 0;
    $plan_clp_charged = $discount_pct ? bl_apply_discount($plan['clp'], $discount_pct) : (int)$plan['clp'];

    $c = config();
    $backUrl = $c['site_url'] ?? 'https://netwebmedia.com';
    $webhookUrl = $backUrl . '/api/billing/webhook';

    $token = bl_mp_token();
    if (!$token) {
      qExec("INSERT INTO subscriptions (org_id, user_id, plan_code, usd_amount, clp_amount, status, mp_init_point) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
        [$u['org_id'], $u['id'], $plan['code'], $plan['usd'], $plan['clp'], $backUrl . '/pricing.html?mock=1&plan=' . $plan['code']]);
      json_out([
        'subscription_id' => lastId(),
        'init_point' => $backUrl . '/pricing.html?mock=1&plan=' . $plan['code'],
        'mock_mode' => true,
        'note' => 'MP_ACCESS_TOKEN not configured — subscription created in mock mode',
      ]);
    }

    // MP Chile TEST-mode preapproval cap is CLP 350,000. For amounts over that, fall back to one-time Checkout Pro Preference.
    $preapprovalCap = 350000;
    $setup = (int)($plan['setup'] ?? 0);
    $setupClp = (int)(round(($setup * bl_fx_rate()) / 1000) * 1000);
    $useOneTime = $plan['clp'] > $preapprovalCap;

    if (!$useOneTime) {
      // Recurring preapproval flow
      $payload = [
        'reason' => 'NetWebMedia ' . $plan['name'] . ' plan',
        'external_reference' => 'org_' . $u['org_id'] . '_' . time(),
        'payer_email' => $u['email'],
        'back_url' => $backUrl . '/crm/?billing=return',
        'auto_recurring' => [
          'frequency' => 1,
          'frequency_type' => 'months',
          'transaction_amount' => $plan_clp_charged,
          'currency_id' => 'CLP',
        ],
        'status' => 'pending',
        'notification_url' => $webhookUrl,
      ];
      if ($coupon) {
        $payload['reason'] .= ' (promo ' . $coupon['code'] . ' -' . $discount_pct . '% x ' . $discount_cycles . ' mo)';
      }
      $r = bl_mp_post('/preapproval', $payload);
      if ($r['code'] >= 300 || empty($r['json']['init_point'])) {
        err('MP error: ' . ($r['json']['message'] ?? 'unknown'), 502, ['mp_response' => $r['json']]);
      }
      qExec("INSERT INTO subscriptions (org_id, user_id, plan_code, usd_amount, clp_amount, status, mp_preapproval_id, mp_init_point, promo_code, discount_pct, discount_cycles) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)",
        [$u['org_id'], $u['id'], $plan['code'], $plan['usd'], $plan_clp_charged, $r['json']['id'], $r['json']['init_point'], $coupon['code'] ?? null, $discount_pct, $discount_cycles]);
      $id = lastId();
      if ($coupon) qExec("UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?", [$coupon['id']]);
    } else {
      // One-time Checkout Pro: setup + first month in a single Preference.
      // Recurring monthly handled out-of-band (workflow emails invoice each month).
      // Launch coupon applies to setup + first month together when discount_cycles >= 1.
      $setupClp_charged = $discount_pct ? bl_apply_discount($setupClp, $discount_pct) : $setupClp;
      $items = [
        [
          'title'       => 'NetWebMedia ' . $plan['name'] . ' - setup' . ($coupon ? ' (promo ' . $coupon['code'] . ')' : ''),
          'quantity'    => 1,
          'unit_price'  => $setupClp_charged,
          'currency_id' => 'CLP',
        ],
        [
          'title'       => 'NetWebMedia ' . $plan['name'] . ' - first month' . ($coupon ? ' (promo ' . $coupon['code'] . ')' : ''),
          'quantity'    => 1,
          'unit_price'  => $plan_clp_charged,
          'currency_id' => 'CLP',
        ],
      ];
      $payload = [
        'items'              => $items,
        'payer'              => ['email' => $u['email']],
        'external_reference' => 'org_' . $u['org_id'] . '_' . $plan['code'] . '_' . time(),
        'statement_descriptor' => 'NETWEBMEDIA',
        'back_urls' => [
          'success' => $backUrl . '/crm/?billing=success&plan=' . $plan['code'],
          'failure' => $backUrl . '/pricing.html?billing=failed',
          'pending' => $backUrl . '/crm/?billing=pending',
        ],
        'auto_return'        => 'approved',
        'notification_url'   => $webhookUrl,
      ];
      $r = bl_mp_post('/checkout/preferences', $payload);
      if ($r['code'] >= 300 || empty($r['json']['init_point'])) {
        err('MP error: ' . ($r['json']['message'] ?? 'unknown'), 502, ['mp_response' => $r['json']]);
      }
      $total_clp = $setupClp_charged + $plan_clp_charged;
      qExec("INSERT INTO subscriptions (org_id, user_id, plan_code, usd_amount, clp_amount, status, mp_preapproval_id, mp_init_point, promo_code, discount_pct, discount_cycles) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)",
        [$u['org_id'], $u['id'], $plan['code'], $plan['usd'], $total_clp, 'pref_' . ($r['json']['id'] ?? ''), $r['json']['init_point'], $coupon['code'] ?? null, $discount_pct, $discount_cycles]);
      $id = lastId();
      if ($coupon) qExec("UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?", [$coupon['id']]);
      // Log event
      qExec("INSERT INTO billing_events (subscription_id, mp_resource, mp_id, topic, raw) VALUES (?, 'preference', ?, 'checkout_one', ?)",
        [$id, $r['json']['id'] ?? '', json_encode($r['json'])]);
    }

    json_out([
      'subscription_id' => $id,
      'flow'            => $useOneTime ? 'one_time_checkout_pro' : 'preapproval',
      'mp_id'           => $r['json']['id'] ?? null,
      'init_point'      => $r['json']['init_point'],
      'note'            => $useOneTime
        ? 'One-time charge covers setup + first month. Monthly invoices for month 2+ sent by email. Upgrade to production MP keys to switch to auto-recurring.'
        : null,
    ]);
  }

  if ($sub === 'cancel' && $method === 'POST') {
    $u = requireAuth();
    $row = qOne("SELECT * FROM subscriptions WHERE org_id = ? AND status IN ('active','pending') ORDER BY id DESC LIMIT 1", [$u['org_id']]);
    if (!$row) err('No active subscription', 404);

    if (!empty($row['mp_preapproval_id']) && bl_mp_token()) {
      $r = bl_mp_post('/preapproval/' . $row['mp_preapproval_id'], ['status' => 'cancelled']);
      // ignore errors — still mark cancelled locally
    }
    qExec("UPDATE subscriptions SET status='cancelled', canceled_at=NOW() WHERE id=?", [$row['id']]);
    json_out(['ok' => true]);
  }

  if ($sub === 'webhook' && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $b = json_decode($raw, true) ?: [];
    $topic = $b['type'] ?? $b['topic'] ?? ($_GET['topic'] ?? '');
    $dataId = $b['data']['id'] ?? ($_GET['id'] ?? '');

    qExec("INSERT INTO billing_events (mp_resource, mp_id, topic, raw) VALUES (?, ?, ?, ?)",
      [$topic, (string)$dataId, $topic, $raw]);

    // Resolve preapproval status if possible
    if ($topic === 'preapproval' && $dataId && bl_mp_token()) {
      $r = bl_mp_get('/preapproval/' . $dataId);
      if ($r['code'] < 300 && !empty($r['json'])) {
        $pa = $r['json'];
        $status = $pa['status'] ?? 'unknown';
        $sub = qOne("SELECT * FROM subscriptions WHERE mp_preapproval_id = ? LIMIT 1", [$dataId]);
        if ($sub) {
          $local = $status === 'authorized' ? 'active' : ($status === 'cancelled' ? 'cancelled' : ($status === 'paused' ? 'paused' : 'pending'));
          qExec("UPDATE subscriptions SET status=?, current_period_start=COALESCE(current_period_start, NOW()) WHERE id=?", [$local, $sub['id']]);
          qExec("UPDATE billing_events SET subscription_id=?, status=? WHERE mp_id=? AND topic='preapproval'", [$sub['id'], $status, $dataId]);

          // Access-control lockdown: flip the owning user from pending_payment → active
          // and promote them to admin of their org when MP confirms authorization.
          // Carlos stays superadmin (never overwritten — we scope by role != 'superadmin').
          if ($status === 'authorized' && !empty($sub['user_id'])) {
            qExec(
              "UPDATE users
                 SET status = 'active',
                     role = CASE WHEN role = 'superadmin' THEN role ELSE 'admin' END
               WHERE id = ?",
              [$sub['user_id']]
            );
          }
          // If MP tells us the subscription was cancelled/paused, suspend app access too.
          if ($status === 'cancelled' && !empty($sub['user_id'])) {
            qExec(
              "UPDATE users SET status = 'suspended'
                 WHERE id = ? AND role != 'superadmin'",
              [$sub['user_id']]
            );
          }
        }
      }
    }
    json_out(['ok' => true]);
  }

  err('Not found', 404);
}

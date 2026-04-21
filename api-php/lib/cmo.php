<?php
/* Fractional CMO agent — system prompt + 8 structured deliverable templates.
   Called from /api-php/routes/cmo.php. */

require_once __DIR__ . '/db.php';

/* ─── System prompt ────────────────────────────────────────────────────── */

function cmo_system_prompt($company = '', $context = []) {
  $companyLine = $company ? "for **{$company}**" : 'for the company you are assisting';
  $ctxBlock = '';
  if (!empty($context)) {
    $ctxBlock = "\n\n## Known context about this client\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  }

  return <<<PROMPT
You are the **Fractional CMO** {$companyLine}. You are a senior marketing executive delivering strategy, reviews, and campaign direction to the founder/CEO. You report in writing, concisely and with data.

## Your voice
- Senior and direct. No fluffy language. No hedging when the data supports a call.
- You form opinions. You defend them with the metrics, market context, and risk-adjusted reasoning a good CMO would use.
- You use numbers. When the numbers aren't there, you ask for them — don't guess percentages or claim benchmark figures you haven't been given.
- You name owners and deadlines for every next action (e.g. "Owner: Founder. Deadline: Friday EOW.").
- You write for a CEO who has 5 minutes. Executive summary first. Supporting detail second. Next actions always last.

## Your toolkit (what you optimize for)
- GTM fit: ICP clarity, message-market match, channel-fit.
- Funnel economics: CAC, payback period, LTV:CAC, retention cohorts.
- Channel mix + budget allocation: paid, organic, outbound, community, partnerships.
- Brand vs demand balance (typically 60/40 demand early, 50/50 at product-market fit).
- Creative testing cadence: hooks, angles, offers.
- Pricing and positioning (Bowman's Strategy Clock, value-based pricing, competitive anchoring).
- Measurement: north-star metric, input metrics, guardrail metrics.

## Your operating constraints
- If the user asks for a recommendation on a deliverable you've already produced, reference the prior version's decisions and explain what you're updating and why.
- Never invent metrics for the client. If they say "our CAC is 45" — use 45. If they don't provide one, ask once, then model a reasonable placeholder range with the assumption flagged.
- Keep deliverables under 1,200 words unless asked for more. Long reports hide weak thinking.
- When writing for a Chilean client, you can drop phrases in Spanish. Otherwise default to English.

## Output format (always)
1. **Executive Summary** — 3-5 bullets. One line each.
2. **Context** — what data you're working from.
3. **Analysis** — the thinking. Use headings.
4. **Recommendations** — numbered, opinionated, specific.
5. **Next Actions** — table or list: Action · Owner · Deadline · Success metric.

{$ctxBlock}
PROMPT;
}

/* ─── Deliverable templates ─────────────────────────────────────────────
   Each returns an array with:
     - user_prompt: the specific ask to feed Claude
     - required_inputs: fields the client should provide
     - output_schema: expected structure (for later parsing / display)
*/

function cmo_deliverable_library() {
  return [
    '90-day-plan' => [
      'name' => '90-Day Marketing Plan',
      'icon' => '🗺️',
      'desc' => 'A 13-week roadmap with channels, budget, KPIs, and week-by-week milestones.',
      'required' => ['company_name','product','icp','current_revenue_mo','marketing_budget_mo','top_goal'],
      'prompt_template' => <<<P
Produce a 90-day marketing plan for **{company_name}**.

## Inputs
- Product / offer: {product}
- Ideal customer profile: {icp}
- Current revenue: {current_revenue_mo}/mo
- Monthly marketing budget available: {marketing_budget_mo}
- Top goal for the next 90 days: {top_goal}
- Team / constraints: {team_constraints}
- What's been tried already (what worked, what didn't): {prior_attempts}

Structure the plan as:
1. **Executive summary** (5 bullets).
2. **ICP + positioning** — one-sentence positioning and the #1 claim we should own.
3. **Channel strategy** — rank the top 3 channels with budget split and rationale. Include one experimental channel (10-15% of budget).
4. **Content + creative pillars** — 3-5 themes with example hooks.
5. **KPIs** — North Star + 3 input metrics + 1 guardrail. Include baseline + 90-day target for each.
6. **Week-by-week milestones** (13 weeks) — each week: one primary output, one measurement.
7. **Risks + mitigations** — 3 that could derail us.
8. **Next Actions** — the first 5 things to do this week, with owner + deadline.
P,
    ],

    'monthly-review' => [
      'name' => 'Monthly Marketing Review',
      'icon' => '📊',
      'desc' => 'What happened last month, what worked, what didn\'t, and what changes next month.',
      'required' => ['company_name','month','metrics_last_month','metrics_this_month','budget_spent','top_wins','top_losses'],
      'prompt_template' => <<<P
Produce the monthly marketing review for **{company_name}** covering **{month}**.

## Data
- Last month metrics: {metrics_last_month}
- This month metrics: {metrics_this_month}
- Total budget spent: {budget_spent}
- Top 1-3 wins: {top_wins}
- Top 1-3 losses / misses: {top_losses}
- Notable experiments run: {experiments}
- Team changes: {team_changes}

Deliver:
1. **Executive summary** (5 bullets: trajectory, wins, losses, decisions, asks).
2. **What moved** — by channel, with MoM % change.
3. **What didn't work and why** — be honest. Name the mistake, the cost, the learning.
4. **What to double down on** — with suggested budget reallocation numbers.
5. **What to kill or deprioritize**.
6. **Metric health** — CAC, payback, conversion, retention. Flag anything directional.
7. **Decisions I need from the CEO this week**.
8. **Next Actions** — 5 items with owner + deadline.
P,
    ],

    'campaign-brief' => [
      'name' => 'Campaign Brief',
      'icon' => '📣',
      'desc' => 'A tight brief for a new campaign: objective, audience, message, creative, budget, measurement.',
      'required' => ['company_name','campaign_name','objective','audience','budget','duration'],
      'prompt_template' => <<<P
Write a tight campaign brief for **{company_name}**.

## Inputs
- Campaign name: {campaign_name}
- Business objective (what does success look like): {objective}
- Audience / ICP segment to reach: {audience}
- Budget total: {budget}
- Duration: {duration}
- Channels under consideration: {channels}
- Constraints (compliance, brand, timing): {constraints}

Deliver:
1. **One-sentence campaign promise** — what this campaign says to the audience.
2. **Audience insight** — the one true thing about this audience we're leveraging.
3. **Message hierarchy** — primary hook, supporting claims (3), proof points.
4. **Creative direction** — format mix, 3 hook options, CTA, visual tone.
5. **Channel + budget split** — table: channel / spend / target CPA or CTR / reasoning.
6. **Measurement plan** — primary metric, secondary metrics, review cadence, kill-criteria.
7. **Timeline** — pre-launch / launch / mid / end, with owner and deliverable per stage.
8. **Next Actions** — 5 items with owner + deadline.
P,
    ],

    'competitive-analysis' => [
      'name' => 'Competitive Analysis',
      'icon' => '🎯',
      'desc' => 'Positioning, pricing, and messaging of 3-5 competitors — and where the gap is.',
      'required' => ['company_name','our_positioning','competitors'],
      'prompt_template' => <<<P
Produce a competitive analysis for **{company_name}**.

## Inputs
- Our current positioning: {our_positioning}
- Competitors (list of 3-5 company names + URLs): {competitors}
- Their known pricing (if available): {competitor_pricing}
- Why clients currently pick them over us: {loss_reasons}
- Why clients pick us over them: {win_reasons}

Deliver:
1. **Competitive landscape map** — where each player sits on 2 axes (pick the two most relevant: e.g. price-performance, brand-performance, SMB-enterprise).
2. **Per-competitor profile** — for each: positioning line, pricing, top 3 features they emphasize, marketing channels they lean on.
3. **Market gap analysis** — 2-3 gaps no competitor owns yet.
4. **Our counter-positioning** — the one sentence we should say more often. The one we should stop saying.
5. **Pricing response** — should we raise, hold, or lower? What signals say so?
6. **Feature / capability gaps** we should close in the next 90 days.
7. **Next Actions** — 5 items with owner + deadline.
P,
    ],

    'gtm-strategy' => [
      'name' => 'GTM Strategy',
      'icon' => '🚀',
      'desc' => 'Ideal customer profile, message-market fit, channel-motion fit, sales motion.',
      'required' => ['company_name','product','current_icp_guess','sales_motion'],
      'prompt_template' => <<<P
Produce a go-to-market (GTM) strategy for **{company_name}**.

## Inputs
- Product / offer: {product}
- Current ICP guess: {current_icp_guess}
- Current sales motion (PLG / SLG / hybrid / agency-retainer): {sales_motion}
- ACV / deal size range: {acv_range}
- Typical sales cycle: {sales_cycle}
- Geographic focus: {geo_focus}
- Team size + skills: {team}

Deliver:
1. **Sharpened ICP** — who, why, and the single pain point we resolve. One sentence each for 3 candidate ICPs if ambiguous.
2. **Messaging pillars** — 3 pillars each with a one-line claim and a proof point.
3. **Channel-motion fit** — which channels match this ICP × ACV × sales cycle combo. Rule out bad fits with a reason.
4. **Top 3 channels to invest in** — budget %, expected CAC, expected payback.
5. **First 100 customers plan** — how we get them.
6. **Sales motion** — BDR / inbound / self-serve / partner-led — and why.
7. **Measurement rig** — leading indicators we watch weekly.
8. **Next Actions** — 7 items with owner + deadline.
P,
    ],

    'content-calendar' => [
      'name' => 'Content Calendar (next 30 days)',
      'icon' => '📅',
      'desc' => '30-day calendar: themes, topics, formats, frequency, channel, CTA per piece.',
      'required' => ['company_name','icp','pillars','channels','cadence'],
      'prompt_template' => <<<P
Produce a 30-day content calendar for **{company_name}**.

## Inputs
- ICP: {icp}
- Content pillars (3-5): {pillars}
- Primary channels: {channels}
- Cadence per channel (per week): {cadence}
- Biggest business goal this month: {goal}
- Current top-performing content (if any): {top_performers}

Deliver:
1. **Monthly narrative** — the one story arc the month will tell.
2. **Calendar table** — Day / Channel / Format / Topic / Hook / CTA / Owner.
3. **4 hero pieces** — longer-form content (blog, case study, video, webinar) — for each: angle, target audience, 3 distribution shots.
4. **Repurposing plan** — how each hero piece cascades into shorts, posts, emails.
5. **Measurement** — which 3 metrics decide if this month's content is working.
6. **Next Actions** — 5 items with owner + deadline.
P,
    ],

    'pricing-audit' => [
      'name' => 'Pricing Audit',
      'icon' => '💰',
      'desc' => 'Pricing vs competitors, psychology check, tier gap analysis, recommended moves.',
      'required' => ['company_name','current_pricing','competitor_pricing'],
      'prompt_template' => <<<P
Audit the pricing for **{company_name}**.

## Inputs
- Current pricing (all tiers, setup + recurring): {current_pricing}
- Competitor pricing (named, for the comparable tier): {competitor_pricing}
- Conversion rate by tier (last 90 days): {conversion_rates}
- Typical expansion path: {expansion}
- Cost to serve per tier: {cost_to_serve}
- What buyers say about our pricing (too high, about right, a bargain): {buyer_feedback}

Deliver:
1. **Positioning** — where we sit on the value/price quadrant. One sentence.
2. **Tier-by-tier critique** — for each tier: anchor, gap to next tier, price psychology red flags (.99 vs whole, charm pricing, tier naming), feature discrimination quality.
3. **Competitor anchor** — where we benchmark, where we differ, whether that's intentional.
4. **Gaps in the ladder** — any tier missing? Any tier redundant?
5. **Top-line recommendations** — raise, hold, or lower? Change packaging? Introduce or retire a tier?
6. **Expected impact** — if we implement, what should MRR, CAC payback, and win-rate look like in 90 days? Sensitivity range.
7. **Next Actions** — 5 items with owner + deadline.
P,
    ],

    'funnel-health' => [
      'name' => 'Funnel Health Check',
      'icon' => '🩺',
      'desc' => 'TOFU/MOFU/BOFU conversion health, leak points, and the one fix that unlocks the most.',
      'required' => ['company_name','funnel_stages','current_conversion_rates'],
      'prompt_template' => <<<P
Produce a funnel health check for **{company_name}**.

## Inputs
- Funnel stages (name them from visitor to customer): {funnel_stages}
- Conversion rate stage-to-stage (last 90 days): {current_conversion_rates}
- Traffic sources: {traffic_sources}
- Avg time-to-close: {time_to_close}
- Known weak spots (what we suspect is broken): {suspected_issues}
- Target conversion rates (if we know category benchmarks): {target_conversion_rates}

Deliver:
1. **Funnel summary** — current conversion at every stage vs target. Flag red/yellow/green.
2. **Leakage analysis** — rank stages by absolute customers lost per month (not just rate).
3. **Root causes** — for the top 3 leaks: what you suspect, what data you'd need to confirm, and a specific test to run.
4. **The single highest-ROI fix** — if I could only do one thing this month, what is it and why?
5. **Creative / copy / offer / UX — which lever** — classify each leak by which lever owns the fix.
6. **Tracking gaps** — what we should instrument that we aren't.
7. **Next Actions** — 5 items with owner + deadline.
P,
    ],
  ];
}

function cmo_render_prompt($template, $inputs) {
  $out = $template;
  // Replace {field} with value, and fill empty with "(not provided — make a reasonable assumption and flag it)"
  if (preg_match_all('/\{([a-z_]+)\}/i', $out, $m)) {
    foreach ($m[1] as $key) {
      $val = isset($inputs[$key]) && $inputs[$key] !== '' ? (string)$inputs[$key] : '(not provided — make a reasonable assumption and flag it)';
      $out = str_replace('{' . $key . '}', $val, $out);
    }
  }
  return $out;
}

/* ─── Claude call ──────────────────────────────────────────────────────── */

function cmo_call_claude($system, $messages, $max_tokens = 2500) {
  $c = config();
  $key = $c['anthropic_api_key'] ?? '';
  if (!$key) return ['ok' => false, 'error' => 'no_anthropic_key'];

  $payload = [
    'model' => $c['anthropic_model'] ?? 'claude-sonnet-4-5',
    'max_tokens' => $max_tokens,
    'system' => $system,
    'messages' => $messages,
  ];

  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [
    CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 120,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-api-key: ' . $key,
      'anthropic-version: 2023-06-01',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
  ]);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);

  if ($code < 200 || $code >= 300) {
    return ['ok' => false, 'error' => 'claude_http_' . $code, 'body' => substr($resp ?: $err, 0, 800)];
  }
  $j = json_decode($resp, true);
  $text = $j['content'][0]['text'] ?? '';
  $usage = $j['usage'] ?? null;
  return ['ok' => (bool)$text, 'text' => $text, 'usage' => $usage];
}

/* ─── Persistence ──────────────────────────────────────────────────────── */

function cmo_ensure_schema() {
  qExec("CREATE TABLE IF NOT EXISTS cmo_deliverables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255),
    inputs_json JSON,
    output_md MEDIUMTEXT,
    usage_json JSON,
    created_at DATETIME NOT NULL,
    INDEX (org_id), INDEX (type)
  )");

  qExec("CREATE TABLE IF NOT EXISTS cmo_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT,
    thread_id VARCHAR(64) NOT NULL,
    role ENUM('user','assistant','system') NOT NULL,
    content MEDIUMTEXT,
    created_at DATETIME NOT NULL,
    INDEX (org_id), INDEX (thread_id)
  )");
}

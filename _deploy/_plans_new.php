<?php
// Drop-in replacement for bl_plans_seed — two product lines now.
function bl_plans_seed() {
  // USD only. CRM-only SKUs benchmarked against GoHighLevel with new-market discount.
  return [
    // ── Standalone CRM (3 tiers) ──
    [
      'code'     => 'crm_starter',
      'name'     => 'CRM Starter',
      'category' => 'crm',
      'usd'      => 67,
      'setup'    => 500,
      'tagline'  => 'CRM only - 1 user - replaces GHL Starter ($97)',
      'features' => [
        'Unlimited contacts, deals & pipelines',
        'Email campaigns + workflow automations',
        'AI chat agent + calendar booking',
        '1 user, 500 active contacts',
        'vs. GoHighLevel Starter ($97) - save 31%',
      ],
    ],
    [
      'code'      => 'crm_pro',
      'name'      => 'CRM Pro',
      'category'  => 'crm',
      'usd'       => 197,
      'setup'     => 750,
      'tagline'   => 'Unlimited users - replaces GHL Unlimited ($297)',
      'features'  => [
        'Everything in Starter',
        'Unlimited users + contacts',
        'Landing pages, memberships, workflows',
        'A/B tests, AI Content Writer, Knowledge Base',
        'vs. GoHighLevel Unlimited ($297) - save 34%',
      ],
      'highlight' => true,
    ],
    [
      'code'     => 'crm_agency',
      'name'     => 'CRM Agency',
      'category' => 'crm',
      'usd'      => 347,
      'setup'    => 1000,
      'tagline'  => 'White-label + sub-accounts - replaces GHL SaaS Pro ($497)',
      'features' => [
        'Everything in Pro',
        'White-label (your domain + your logo)',
        'Unlimited client sub-accounts',
        'Resell at your own margin',
        'vs. GoHighLevel SaaS Pro ($497) - save 30%',
      ],
    ],
    // ── Agency bundles (CRM + Automate + Website + Video) ──
    [
      'code'     => 'launch',
      'name'     => 'Launch',
      'category' => 'bundle',
      'usd'      => 1295,
      'setup'    => 2970,
      'tagline'  => 'For SMBs under $1M - 4 services bundled',
      'features' => [
        'NWM CRM Starter (included)',
        'NWM Automate Starter (3 flows, 5K exec/mo)',
        'Website Basic (5 pages)',
        'Care Basic (hosting + edits)',
        'Short-Form Video - 2 Reels/week',
      ],
    ],
    [
      'code'      => 'grow',
      'name'      => 'Grow',
      'category'  => 'bundle',
      'usd'       => 2997,
      'setup'     => 4920,
      'tagline'   => 'For SMBs $1-5M - most common',
      'features'  => [
        'NWM CRM Pro (unlimited users, included)',
        'NWM Automate Growth (10 flows, 25K exec/mo)',
        'Website Standard + 1 funnel',
        'Care Full (SEO refresh included)',
        'Short-Form Video - 5 Reels/week',
      ],
      'highlight' => true,
    ],
    [
      'code'     => 'scale',
      'name'     => 'Scale',
      'category' => 'bundle',
      'usd'      => 4497,
      'setup'    => 8175,
      'tagline'  => 'For SMBs $5-20M - market leaders',
      'features' => [
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

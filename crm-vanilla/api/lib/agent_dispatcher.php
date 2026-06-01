<?php
/**
 * NetWebMedia OS — Agent dispatcher  (Phase 4)
 * =============================================================================
 * The wedge: turns NWM's org-chart agents into in-app "AI staff". Server-side
 * only — never local Claude Code. Self-contained: the agent system prompts +
 * skill catalog are embedded here (NOT read from .claude/agents/*.md, which is
 * not deployed to the server), so this works on InMotion with no fs dependency.
 *
 * Responsibilities:
 *   - OS_AGENT_CATALOG: the fixed V1 roster + each agent's skills/templates.
 *   - Model selection per agent tier (strategic vs routine).
 *   - Per-org monthly token budget enforcement (R2 cost guardrail).
 *   - Anthropic Messages API call with prompt caching on the static system prompt.
 *   - Cost accounting (cents) per call.
 *
 * Graceful degradation: if ANTHROPIC_API_KEY is unset, dispatch throws
 * AgentDispatchError('not_configured', 503) and the handler returns a clean
 * "agent layer not configured" — nothing crashes.
 */

class AgentDispatchError extends Exception {
    public int $httpCode;
    public string $reason;
    public function __construct(string $reason, int $httpCode = 400, string $msg = '') {
        parent::__construct($msg ?: $reason);
        $this->reason = $reason;
        $this->httpCode = $httpCode;
    }
}

/**
 * The V1 agent roster. 6 default-on (marketed) + the rest wired/off.
 * Each agent: label, tier (strategic|routine), default_on, system (prompt),
 * skills[ slug => [label, template] ]. The template is the USER message; it
 * interpolates {{key}} from the caller's `input` map.
 */
function os_agent_catalog(): array {
    static $cat = null;
    if ($cat !== null) return $cat;

    $brand = "You are an AI staff member inside NetWebMedia OS, a white-label agency operating system. "
           . "You produce concrete, client-ready deliverables for a marketing agency that serves local/SMB "
           . "businesses across 14 niches. Be specific, structured, and immediately usable. Use markdown. "
           . "Never invent client facts you weren't given — ask for them inline as [bracketed placeholders].";

    $cat = [
        'cmo' => [
            'label' => 'CMO', 'tier' => 'strategic', 'default_on' => true,
            'system' => "$brand You are the Chief Marketing Officer — the strategic anchor. You think in "
                . "positioning, demand generation, channel mix, messaging, and 30/60/90-day plans. You are "
                . "decisive and ROI-focused.",
            'skills' => [
                'draft_campaign_brief'    => ['label' => 'Draft a campaign brief', 'template' => "Draft a campaign brief for this client/goal:\n{{input}}"],
                'content_calendar_30d'    => ['label' => '30-day content + campaign plan', 'template' => "Produce a 30-day content + campaign plan for this client niche and goal:\n{{input}}\nInclude weekly themes, channels (no LinkedIn, no X/Twitter — durable exclusions), and CTAs."],
                'review_landing_copy'     => ['label' => 'Review landing page copy', 'template' => "Critique and improve this landing page copy for conversion + AEO:\n{{input}}"],
            ],
        ],
        'content-strategist' => [
            'label' => 'Content Strategist', 'tier' => 'routine', 'default_on' => true,
            'system' => "$brand You are the Content Strategist — the weekly output engine. You write AEO-optimized "
                . "blog posts and social copy that get cited by AI answer engines. You know schema (Article, FAQPage) "
                . "and answer-first structure.",
            'skills' => [
                'weekly_content_pack' => ['label' => "This week's posts", 'template' => "Write this week's content for the client below — 3 short blog outlines + 5 social posts, AEO-optimized:\n{{input}}"],
                'blog_post_aeo'       => ['label' => 'Write an AEO blog post', 'template' => "Write a ~1,200-word AEO-optimized blog post (answer-first, FAQ block) for:\n{{input}}"],
            ],
        ],
        'meta-ops' => [
            'label' => 'Meta Ops', 'tier' => 'routine', 'default_on' => true,
            'system' => "$brand You are Meta Ops — you draft and schedule Instagram/Facebook content. You write "
                . "scroll-stopping captions with the right hooks, hashtags, and posting cadence.",
            'skills' => [
                'weekly_social_schedule' => ['label' => 'Draft this week IG/FB posts', 'template' => "Draft this week's IG + FB posts (captions, hooks, hashtags, suggested times) for:\n{{input}}"],
            ],
        ],
        'sales-director' => [
            'label' => 'Sales Director', 'tier' => 'routine', 'default_on' => true,
            'system' => "$brand You are the Sales Director — you help the agency close NEW clients. You write proposals, "
                . "discovery scripts, and objection handling grounded in a site audit.",
            'skills' => [
                'draft_proposal'     => ['label' => 'Draft a proposal', 'template' => "Draft a proposal for this prospect based on their site/audit:\n{{input}}"],
                'objection_handling' => ['label' => 'Objection handling', 'template' => "Give crisp objection-handling responses for this prospect situation:\n{{input}}"],
            ],
        ],
        'customer-success' => [
            'label' => 'Customer Success', 'tier' => 'routine', 'default_on' => true,
            'system' => "$brand You are Customer Success — the retention engine. You write QBRs and renewal narratives "
                . "from client data that make value undeniable.",
            'skills' => [
                'draft_qbr' => ['label' => 'Draft a monthly QBR', 'template' => "Draft this month's QBR for the client from the data below — wins, metrics, next-month plan:\n{{input}}"],
            ],
        ],
        'data-analyst' => [
            'label' => 'Data Analyst', 'tier' => 'routine', 'default_on' => true,
            'system' => "$brand You are the Data Analyst — the connective tissue. You turn raw GA4/Stripe/CRM numbers "
                . "into a one-page snapshot a busy owner can act on.",
            'skills' => [
                'one_page_snapshot' => ['label' => 'One-page client snapshot', 'template' => "Turn this client's GA4 + Stripe + CRM data into a one-page snapshot with 3 recommended actions:\n{{input}}"],
            ],
        ],
        // ---- wired, default-off (power users toggle on) ----
        'creative-director'  => ['label' => 'Creative Director',  'tier' => 'routine', 'default_on' => false,
            'system' => "$brand You are the Creative Director — visual concepts, ad creative direction, brand application.",
            'skills' => ['creative_concept' => ['label' => 'Creative concept', 'template' => "Give 3 creative/ad concepts for:\n{{input}}"]]],
        'operations-manager' => ['label' => 'Operations Manager', 'tier' => 'routine', 'default_on' => false,
            'system' => "$brand You are the Operations Manager — SOPs, tooling, process docs.",
            'skills' => ['draft_sop' => ['label' => 'Draft an SOP', 'template' => "Draft an SOP for:\n{{input}}"]]],
        'finance-controller' => ['label' => 'Finance Controller', 'tier' => 'routine', 'default_on' => false,
            'system' => "$brand You are the Finance Controller — budgets, P&L reads, pricing, cash.",
            'skills' => ['budget_read' => ['label' => 'Budget / P&L read', 'template' => "Analyze these numbers and flag what matters:\n{{input}}"]]],
        'project-manager'    => ['label' => 'Project Manager',    'tier' => 'routine', 'default_on' => false,
            'system' => "$brand You are the Project Manager — plans, timelines, status, scope.",
            'skills' => ['status_report' => ['label' => 'Status report', 'template' => "Write a status report from:\n{{input}}"]]],
        'engineering-lead'   => ['label' => 'Engineering Lead',   'tier' => 'strategic', 'default_on' => false,
            'system' => "$brand You are the Engineering Lead — architecture, integrations, technical scoping.",
            'skills' => ['tech_scoping' => ['label' => 'Technical scoping', 'template' => "Scope this technically — approach, risks, effort:\n{{input}}"]]],
        'product-manager'    => ['label' => 'Product Manager',    'tier' => 'strategic', 'default_on' => false,
            'system' => "$brand You are the Product Manager — specs, roadmaps, prioritization.",
            'skills' => ['write_spec' => ['label' => 'Write a spec', 'template' => "Write a tight product spec for:\n{{input}}"]]],
    ];
    return $cat;
}

/** Slugs that are on by default for a new tenant. */
function os_default_on_agents(): array {
    $on = [];
    foreach (os_agent_catalog() as $slug => $a) if (!empty($a['default_on'])) $on[] = $slug;
    return $on;
}

/** Model id + token rates ($/Mtok) for a tier. Override model ids in config.local.php. */
function os_model_for_tier(string $tier): array {
    if ($tier === 'strategic') {
        return [
            'model' => defined('ANTHROPIC_MODEL_STRATEGIC') && ANTHROPIC_MODEL_STRATEGIC ? ANTHROPIC_MODEL_STRATEGIC : 'claude-sonnet-4-5',
            'in' => 3.0, 'out' => 15.0,
        ];
    }
    return [
        'model' => defined('ANTHROPIC_MODEL_ROUTINE') && ANTHROPIC_MODEL_ROUTINE ? ANTHROPIC_MODEL_ROUTINE : 'claude-haiku-4-5',
        'in' => 0.80, 'out' => 4.0,
    ];
}

/** Sum this org's token spend for the current calendar month (budget enforcement). */
function os_agent_tokens_used_this_month(PDO $db, int $orgId): int {
    $stmt = $db->prepare(
        "SELECT COALESCE(SUM(input_tokens + output_tokens),0)
           FROM agent_runs
          WHERE organization_id = ?
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
    );
    $stmt->execute([$orgId]);
    return (int)$stmt->fetchColumn();
}

/**
 * Dispatch one agent skill. Returns:
 *   ['output'=>str, 'model'=>str, 'input_tokens'=>int, 'output_tokens'=>int, 'cost_usd_cents'=>int]
 * Throws AgentDispatchError on validation / budget / config / upstream failure.
 */
function os_agent_dispatch(string $agentSlug, string $skillSlug, $input, int $orgId, PDO $db, int $budgetMonthly): array {
    $catalog = os_agent_catalog();
    if (!isset($catalog[$agentSlug]))                         throw new AgentDispatchError('unknown_agent', 404);
    $agent = $catalog[$agentSlug];
    if (!isset($agent['skills'][$skillSlug]))                 throw new AgentDispatchError('unknown_skill', 404);

    $apiKey = defined('ANTHROPIC_API_KEY') ? (string)ANTHROPIC_API_KEY : '';
    if ($apiKey === '') throw new AgentDispatchError('not_configured', 503, 'Agent layer not configured (ANTHROPIC_API_KEY unset)');

    // Budget guardrail (R2). budgetMonthly<=0 means "unlimited" (master/comp).
    if ($budgetMonthly > 0) {
        $used = os_agent_tokens_used_this_month($db, $orgId);
        if ($used >= $budgetMonthly) {
            throw new AgentDispatchError('budget_exhausted', 402,
                "Monthly agent token budget reached ($used / $budgetMonthly).");
        }
    }

    // Render the user message from the skill template.
    $inputStr = is_array($input) ? json_encode($input, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) : (string)$input;
    $inputStr = mb_substr($inputStr, 0, 16000); // bound the prompt
    $userMsg  = str_replace('{{input}}', $inputStr, $agent['skills'][$skillSlug]['template']);

    $tier  = os_model_for_tier($agent['tier']);
    $model = $tier['model'];

    $payload = [
        'model'      => $model,
        'max_tokens' => 1800,
        // cache_control on the static system prompt → ~90% input-cost savings on repeat use.
        'system'     => [[
            'type' => 'text',
            'text' => $agent['system'],
            'cache_control' => ['type' => 'ephemeral'],
        ]],
        'messages'   => [[ 'role' => 'user', 'content' => $userMsg ]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 90,
        CURLOPT_HTTPHEADER     => [
            'content-type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
            'anthropic-beta: prompt-caching-2024-07-31',
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);
    $raw  = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);

    if ($raw === false)             throw new AgentDispatchError('upstream_unreachable', 502, $cerr);
    $resp = json_decode($raw, true);
    if (!is_array($resp))           throw new AgentDispatchError('bad_upstream_response', 502);
    if ($code !== 200) {
        $emsg = $resp['error']['message'] ?? ('HTTP ' . $code);
        throw new AgentDispatchError('upstream_error', 502, $emsg);
    }

    // Extract text + usage.
    $text = '';
    foreach (($resp['content'] ?? []) as $block) {
        if (($block['type'] ?? '') === 'text') $text .= $block['text'];
    }
    $inTok  = (int)($resp['usage']['input_tokens'] ?? 0)
            + (int)($resp['usage']['cache_creation_input_tokens'] ?? 0)
            + (int)($resp['usage']['cache_read_input_tokens'] ?? 0);
    $outTok = (int)($resp['usage']['output_tokens'] ?? 0);
    $costCents = (int)round((($inTok / 1e6) * $tier['in'] + ($outTok / 1e6) * $tier['out']) * 100);

    return [
        'output'         => $text !== '' ? $text : '(empty response)',
        'model'          => $model,
        'input_tokens'   => $inTok,
        'output_tokens'  => $outTok,
        'cost_usd_cents' => $costCents,
    ];
}

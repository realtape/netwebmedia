# NetWebMedia OS — V1 Product Requirements Document

**Status:** Draft v1 — for engineering + GTM review
**Owner:** Marcus (product-manager)
**Date:** 2026-05-28
**Source of truth for foundational decisions:** [`DECISIONS.md`](./DECISIONS.md)
**Companions:** [`GTM.md`](./GTM.md) (Sofia), [`ARCHITECTURE.md`](./ARCHITECTURE.md) (David)

---

## 1. Product Summary

**NetWebMedia OS is an "AI Agency OS" — a white-labellable shell where a small marketing agency runs its 10–30 clients via a roster of AI agents that mirror an agency org chart (CMO, sales director, content strategist, meta-ops, etc.) instead of clicking through a CRM dashboard.** The agency owner brands the OS as their own (logo, palette, subdomain), invites their team and clients, and dispatches work to agents that already know how an agency operates because NetWebMedia itself is the dogfood instance. V1 is sold as a single $1.5K–$3K/mo Premium tier with a high-touch onboarding, alongside (not replacing) the existing GHL White-Label SKU.

**Who this is for:** the owner-operator of a 2–8 person marketing agency who is drowning in production work, runs 10+ clients on a hodgepodge of GHL/HubSpot/Notion/Slack/Zapier, and has already paid for ChatGPT Team or Claude Pro but doesn't know how to operationalize it across a client book.

**Who this is NOT for:** solo freelancers (use GHL or stay manual), Fortune-500 in-house marketing teams (wrong shape, wrong buyer, wrong compliance posture), agencies who want a self-serve $99/mo tool, or anyone shopping for a CRM replacement. NWM OS is an *operating layer over* a CRM, not a CRM upgrade. If they don't already feel the pain of "we have 11 clients and I'm the bottleneck on every deliverable," we cannot sell them this.

---

## 2. Target User Persona — "Owner-Operator Olivia"

| Attribute | Value |
|---|---|
| Title | Founder / Owner-Operator of an agency |
| Team size | 2–8 people (1 owner + 1–3 strategists + 1–4 specialists/contractors) |
| Client count | 10–30 active retainers, $1K–$10K MRR each |
| Annual agency revenue | $300K–$2M |
| Niche | Local/SMB-focused — one of NWM's 14 (legal, real estate, health, hospitality, home services, etc.) OR cross-niche but local-focused |
| Geography | US (primary), LATAM/EU (secondary). English/Spanish both relevant — NWM already runs bilingual. |
| Current tool stack | GHL or HubSpot Starter (CRM), Notion or ClickUp (PM), Slack, Google Workspace, Zapier/Make, Canva, ChatGPT Team or Claude Pro |
| Tools they've already churned | At least one of: Monday.com, Trello, AgencyAnalytics, ReportGarden, Pipedrive |
| Pain that gets them to buy | (a) "I'm the bottleneck on every deliverable." (b) "I'm paying for 6 tools and nothing talks to each other." (c) "My junior strategist costs $4K/mo and produces less than my AI tools could if I had time to set them up." |
| Trigger event | Just lost a client because turnaround was too slow, OR just hired a strategist they can't really afford, OR just had a meltdown reconciling 10 client reports manually |
| Willingness to pay | $1.5K–$3K/mo is *cheaper than half a strategist*. If NWM OS removes the need for one hire, ROI is obvious. They will not pay $5K+/mo without seeing 90 days of value first. |
| Buying authority | Sole decision-maker. No procurement, no committee, no security review beyond "do you store our client data securely." Sales cycle: 14–30 days from demo to first payment. |
| Disqualifiers | "We're a Webflow shop, no clients on retainer" (project-based, wrong model). "We're an in-house team" (wrong buyer). "We need SOC 2 to even talk" (not V1). |

Olivia is the **only** persona V1 optimizes for. Agency-owner-with-150-clients and freelancer-with-3-clients are both v2+ problems.

---

## 3. Design Partner Profile

The first design partner has to satisfy three properties: (1) close enough to Olivia that what we build for them generalizes, (2) tolerant enough of a thin V1 that they won't churn over rough edges, (3) loud enough in their niche to become a reference logo. We want one — not three — partner. Three partners in a 4–6 week build means three sets of contradictory feedback and zero shipped product.

Sofia (CMO) should hunt for ONE partner matching one of these three archetypes (in priority order):

### Archetype A — "The AEO-Curious Local Agency" (preferred)
- 3–6 person agency, US-based, serves one of NWM's 14 niches (legal, real estate, or home services strongest signal — they buy on results)
- 10–20 retainer clients at $1.5K–$5K MRR
- Already publishing content, already heard the term "AEO" but doesn't have a system
- Current stack: GHL + Notion + Canva + ChatGPT
- Why ideal: NWM's own content engine, AEO playbooks, and 14-niche taxonomy are an immediate value drop. They onboard fast because the niche fit is exact.
- Where to find: Indie Hackers, Demand Curve community, Carrd-style agency Twitter (well — Carlos isn't on X — so substitute: agency podcasts, Loom-comment communities, AEO blog comments)

### Archetype B — "The Burned-by-HubSpot Operator"
- 5–8 person agency, US/Canada, niche-agnostic or B2B-services focused
- 15–30 clients, just hit the HubSpot Pro pricing cliff ($890+/mo) or had a Notion-as-CRM disaster
- Already running an SDR or content automation manually and frustrated with the seams
- Current stack: HubSpot + Notion + Slack + Make.com + 2 contractors
- Why useful: they validate the "OS *over* a CRM" framing because they've lived its absence. Highest pricing tolerance.
- Risk: bigger team = more opinions = scope creep risk. Mitigate by contracting them to a single workflow during the 4–6 week build.

### Archetype C — "The Solo-Operator-Scaling-Up" (fallback only)
- 1 owner + 2 contractors, 8–12 clients, ~$25K MRR
- Wants to scale to 20 clients without hiring
- Current stack: GHL + ChatGPT + Zapier
- Why fallback: closest to Carlos himself, so dogfooding maps directly. But the buyer is too close to a freelancer; less generalizable validation. Use ONLY if A and B don't materialize in 2 weeks.

**Sourcing motion (handoff to Sofia):** warm intros from NWM's existing client roster + AEO blog readers + the `carlos@netwebmedia.com` Calendar inbox already produces 1–2 agency-owner conversations a month. Target: 8 first-call conversations → 3 deep demos → 1 signed design-partner agreement within 14 days.

**Design partner commercial terms (proposed):** $750/mo for 6 months (50% of the $1.5K floor), in exchange for: weekly 30-min feedback call, written testimonial at month 3, reference call right at month 6. Not free — paid customers give real feedback; free pilots give polite feedback.

---

## 4. V1 Feature Scope

The V1 brief: ship the *thinnest* product that an Olivia can buy, log into, brand as her own, run real client work through, and get more value out of than she paid. Anything beyond that is v2.

### MUST — without these, V1 is not buyable

| # | Feature | Why it's a must | Build leverages |
|---|---|---|---|
| M1 | **Multi-tenant org model with branding overlay** (logo, primary color, subdomain like `agency.nwmos.com`, support email, company name everywhere) | This IS the product. Without it, we're just selling them access to NWM's CRM. | Already-started org-scoped tenancy in [`crm-vanilla/api/lib/tenancy.php`](../../crm-vanilla/api/lib/tenancy.php) (the (B) layer); [`schema_organizations_migrate.sql`](../../crm-vanilla/api/) |
| M2 | **Tenant-aware CRM** — contacts, deals, pipeline, conversations, all scoped to the agency's org | The substrate every agent and every workflow operates on. | Existing [`crm-vanilla/`](../../crm-vanilla/) handlers; finish migrating any remaining `tenant_where()` legacy SQL to `org_where()` |
| M3 | **Agent Launcher panel** — single screen listing the 6 V1 agents (see §5), one-click "Ask CMO" / "Ask Meta Ops" buttons, each producing an artifact (campaign brief, post draft, audit report) in the org's workspace | The wedge. Without this, we're a CRM. With it, the agency owner sees AI staff. | `.claude/agents/` definitions already exist as Markdown contracts; V1 exposes them via a thin orchestration layer (Anthropic API → return artifact → store in `resources` EAV) |
| M4 | **Skill launcher** — 8–12 high-value "one-shot" skills exposed as buttons (e.g., "Generate this month's content calendar," "Draft a client QBR," "Write a cold email to this lead," "Audit a website URL") | Skills are the unit Olivia understands. "Agents" are intimidating; "Generate QBR" is not. | Reuse existing playbooks in agent definitions, blog generators, audit handler ([`api-php/routes/audit.php`](../../api-php/routes/audit.php)) |
| M5 | **Unified Inbox (email + WhatsApp)** — read-only first if needed | Olivia's #1 daily pain. If the OS doesn't show her client comms, she'll keep her old tool open. | Gmail MCP + existing `crm-vanilla/api/handlers/wa_flush.php`; surface in a single view scoped by org |
| M6 | **Stripe billing for the agency's subscription to NWM OS** ($1.5K–$3K/mo subscription per org, set by Carlos at signup) | We have to get paid. | Stripe MCP already wired; new `billing.php` handler creates a Stripe customer per org, stores `stripe_customer_id` on the `organizations` table |
| M7 | **Onboarding flow** — guided "first 15 minutes": upload logo, pick brand color, set subdomain, connect Gmail, import contacts CSV, run first agent | Activation is the #1 churn driver in B2B SaaS. A blank tenant = certain churn. | New `cms/onboarding.html` wizard backed by `setting` resource type |
| M8 | **Audit log + per-tenant data isolation tests** | Olivia is going to put her clients' data in this. A cross-tenant leak ends the company. | Reuse `tenancy.php` (B) layer; add automated assertion test that listing as Org A never returns Org B rows. |

### SHOULD — present in V1 if they don't extend the 4–6 week timeline

| # | Feature | Why it's a should |
|---|---|---|
| S1 | **Pipeline view (kanban)** for the agency's own sales (selling THEIR services to THEIR prospects) | Olivia already has this somewhere; if we have it natively she stops switching tabs. Existing [`crm-vanilla/pipeline.html`](../../crm-vanilla/pipeline.html). |
| S2 | **Workflow visibility** — read-only view of `workflow_runs` rows (which automations have fired, what's pending) — NOT a builder | Builders are v2. But "did the welcome email actually send?" is a must-answer in V1. Existing [`wf_crm.php`](../../crm-vanilla/api/lib/wf_crm.php). |
| S3 | **Client sub-account provisioning** — each of Olivia's clients gets a (very thin) sub-org so Olivia can scope work, share dashboards | Mirrors GHL White-Label's killer feature. Without it, NWM OS can't be the agency's daily driver — it can only be Olivia's personal tool. |
| S4 | **Branded login page + favicon per tenant** | Cosmetic completeness of the white-label promise. |
| S5 | **One-page tenant dashboard** — "this week: 4 new leads, 2 deals moved stage, 7 emails sent by agents, 1 client report due" | The login-and-see-value moment. |

### NICE — defer unless trivially cheap

| # | Feature | Why it can wait |
|---|---|---|
| N1 | Calendar view (existing `calendar.html`) re-skinned | Olivia uses Google Calendar; we're not replacing it in V1 |
| N2 | Reporting/analytics tab | A static screenshot of GA4/Stripe is "good enough" for design partner |
| N3 | Custom domain per tenant (`olivia-agency.com`) | Subdomain is fine for V1; custom domain is a TLS + cPanel ops nightmare we don't need yet |
| N4 | API access for the agency | No agency owner has asked for this V1 — they want a UI |
| N5 | Mobile-responsive polish beyond "doesn't break" | Native app is v2+; mobile web is a usability nice-to-have |
| N6 | Visual workflow builder | The runtime is there ([`wf_crm.php`](../../crm-vanilla/api/lib/wf_crm.php)); the builder UI is months of work. v2. |

### Cuts — explicitly NOT V1

- **No marketplace** for third-party agents/skills (v3+)
- **No self-serve signup** — every tenant is hand-onboarded by Carlos
- **No multi-tier pricing** — Premium only
- **No agent-to-agent autonomous chains** — every agent invocation is human-triggered in V1
- **No "build your own agent"** — agents are the 6 we ship, fixed
- **No GHL data migration tool** — too much surface area, blocks shipping

---

## 5. The 12 Agents — V1 Roster vs Deferred

The wedge is "AI staff that mirror an agency org chart." But shipping all 12 in V1 dilutes the demo. Olivia needs to feel each agent is genuinely useful within 5 minutes of using it — that means the agents that ship must each have at least one *killer skill* she'd pay for on its own.

### Ships in V1 (6 agents)

| Agent | Killer V1 skill | Why this one |
|---|---|---|
| **cmo** (Sofia) | "Generate a 30-day content + campaign plan for [client niche]" | The strategic anchor. Every agency owner wants a CMO they can afford. Opus-tier. |
| **content-strategist** (Liam) | "Write me this week's 3 blog posts / 5 social posts for [client], optimized for AEO" | The *output* engine that makes Olivia's clients see deliverables. Highest weekly-use frequency. |
| **meta-ops** (Maya) | "Draft + schedule this week's IG/FB posts for [client]" via [`fb_publish.php`](../../crm-vanilla/api/handlers/fb_publish.php) and [`ig_publish.php`](../../crm-vanilla/api/handlers/ig_publish.php) | Visible weekly value. Wires to publishing handlers that already work. |
| **sales-director** (Marcus-SD) | "Draft a proposal for [prospect] based on their site audit" (uses [`proposal.php`](../../crm-vanilla/api/handlers/proposal.php)) | Helps Olivia close NEW clients — the ROI proof. |
| **customer-success** (Rachel) | "Draft this month's QBR for [client] from their data" | The retention skill. The single most valuable agent for keeping Olivia's clients past month 3. |
| **data-analyst** (David-DA) | "Pull this client's GA4 + Stripe + CRM into a one-page snapshot" | The connective tissue under every other agent's work. |

### Deferred to v2 (6 agents)

| Agent | Why deferred |
|---|---|
| **engineering-lead** | Olivia doesn't ship code. Internal-only value. Carlos uses it on the NWM instance; clients don't see it. |
| **product-manager** | Same — internal NWM use. Agencies don't run a product org. |
| **creative-director** | Skills overlap with content-strategist for V1. Distinct value (visual identity, ad creative) requires image gen wiring that adds 1–2 weeks. v2. |
| **operations-manager** | SOPs and tool selection — low-frequency, hard to demo as "wow." |
| **finance-controller** | High value but needs Stripe + accounting integrations beyond V1 scope. v2 paired with reporting. |
| **project-manager** | Premature without a real PM surface (tasks, gantt, dependencies). Calendar covers the gap in V1. |
| **carlos-ceo-assistant** | Bound to Carlos personally — not generalizable to other agency owners without rebuilding it as a "founder assistant" persona. v2+. |

(Note: that's 7 deferred against 12 total = 5 in V1 plus carlos-ceo-assistant deferred. Corrected count: **V1 ships 6 agents, defers 7**. The 13th name above — Marcus's PM agent — collapses with engineering-lead under "internal-only.")

**Justification framing for the cut:** the 6 V1 agents collectively cover **strategy (cmo), production (content + meta-ops), revenue (sales-director), retention (customer-success), and analytics (data-analyst)**. That's the full GTM loop of a small agency. Adding more agents in V1 risks "which one do I click?" decision paralysis on day one.

---

## 6. Out of Scope for V1 — Explicit List

These are real product surfaces with real demand. They are deliberately **not** in V1 because they don't pass the "is this required for the first paying design partner to extract value" test.

- Self-serve signup / credit-card-on-landing-page (every tenant is hand-onboarded)
- Multi-tier pricing (Starter / Pro / Premium ladder) — Premium only
- Marketplace for third-party agents or skills
- Mobile native app (web responsive is the bar; Capacitor work is v2)
- Visual workflow builder UI (runtime ships; builder doesn't)
- Custom-domain-per-tenant (subdomain only in V1)
- API for the agency (no public API surface in V1)
- GHL or HubSpot data import wizard (manual CSV import only)
- White-label of email-sending domain (NWM-owned SMTP in V1; per-tenant SPF/DKIM is v2)
- SOC 2 / HIPAA / SSO / SCIM (v3 — enterprise track)
- Agent-to-agent autonomous chains (every agent call is human-triggered in V1)
- Per-tenant custom agents ("build your own agent") — fixed roster
- Reporting/analytics native dashboards (GA4 + Stripe screenshots are fine for V1)
- Client portal where the agency's *clients* log in directly (sub-org provisioning S3 is internal-facing only)

---

## 7. Success Metrics — V1 Definition of Done

V1 isn't done when the build is shipped. It's done when these signals fire on the design partner instance. Pick 5; ship to win them.

| # | Metric | Target | Measured how |
|---|---|---|---|
| SM1 | **Design partner active usage** | ≥ 5 days/week of login + ≥ 1 agent invocation/day for 4 consecutive weeks | Audit log of sessions + `agent_invocations` table |
| SM2 | **Design partner pays the second invoice** | Month-2 payment clears (the "free month 1, real money month 2" survival test) | Stripe |
| SM3 | **Three "agent moments" caught on a call** | Partner says "this saved me [X hours / $Y]" on a recorded call, three distinct times across the 12 weeks | Recorded weekly calls |
| SM4 | **Cross-tenant data isolation: zero leaks** | Automated tenancy tests pass on every deploy; no incident reports | CI test + manual audit |
| SM5 | **Reference-ability at month 3** | Partner agrees to a public case study + reference call with a second prospect | Direct ask at month 3 |

Stretch (signals we'd love but won't gate V1 on):
- Partner refers a second agency before month 6 — strong PMF signal
- Partner asks to onboard their own clients into the OS — confirms the white-label loop
- Partner asks to pay annually — pricing power signal

**Anti-success signals** that would force a V1 re-think:
- Partner uses NWM OS for setup tasks only, never daily ops → wedge isn't sticky
- Partner asks for HubSpot/GHL import within 30 days → we're not enough of an upgrade to migrate
- Partner uses agents once and never again → "AI staff" wedge is a demo trick, not a real product

---

## 8. Open Questions for Carlos

Marcus needs Carlos to decide these before engineering can start. Several have downstream impacts on the architecture doc.

1. **Single price or range?** DECISIONS says $1.5K–$3K/mo. For V1 with one design partner, do we charge $1.5K for everyone or vary by client-count? Recommendation: **single $1,500/mo flat for first 3 design-era partners, $2,490 standard after PMF**. Aligns with the canonical CMO Premium price already in market.
2. **Subdomain TLD.** Are tenants at `<agency>.nwmos.com`, `<agency>.netwebmedia.com`, or do we register `agencyos.io` / similar? Affects DNS + cert work in week 1.
3. **Does Olivia bring her own Anthropic API key, or does NWM resell?** Reselling is simpler for her, but it puts the LLM bill on NWM. Recommendation: **NWM resell in V1** (caps included in the $1.5K), token caps enforced by org.
4. **Sub-org provisioning depth in V1 (S3).** Are client sub-orgs full CRMs (heavy) or just labels/tags on the parent org (light)? Recommendation: **labels/tags in V1**, real sub-orgs in v2.
5. **Email-sending domain.** Do agent-generated emails send from `noreply@agency.com` (needs per-tenant SPF/DKIM, weeks of work) or `<agency-name>@nwmos.com` (instant, less polished)? Recommendation: **nwmos.com in V1**, branded sending domain is the v2 upsell.
6. **The cut of `carlos-ceo-assistant` from V1.** Confirm Marcus's read: it's Carlos-personal, not a sellable agent. Or do we generalize it to "Owner Assistant" and ship it?
7. **Onboarding white-glove cost.** First design partner gets weekly Carlos calls — that's expensive. At what price does white-glove become economic? Affects pricing floor.

---

## 9. Risks & Assumptions

### Top 3 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R1 — Cross-tenant data leak.** A single bug exposing Org A's contacts to Org B kills the company. The codebase has two tenancy layers ((A) user-scoped, (B) org-scoped) per [`tenancy.php`](../../crm-vanilla/api/lib/tenancy.php); any unmigrated handler is a leak vector. | Medium | Catastrophic | (a) Audit every handler for `org_where()` before V1 launch. (b) Automated CI test: create Org A and Org B, assert no cross-reads in 30+ test queries. (c) Soft launch with one tenant only (design partner) before any second tenant exists. |
| **R2 — Design partner churns at month 2.** If the only paying tenant leaves, GTM has nothing to point at. | Medium | High | (a) Weekly 30-min calls — partner can't churn without us seeing it 3 weeks in advance. (b) Discounted pricing ($750/mo for 6 months) builds switching cost into the relationship. (c) Three "agent moments" target (SM3) makes value visible to the partner, not just to us. |
| **R3 — Scope creep extends 4–6 weeks to 12+.** Every design-partner conversation generates feature requests. If we say yes to half of them, ship date slips and the partner loses faith. | High | High | (a) PRD scope is locked at this doc; new requests go to v2 backlog in [`V1-PLAN.md`](./V1-PLAN.md) with a date. (b) Marcus says no in writing weekly. (c) Engineering ([`ARCHITECTURE.md`](./ARCHITECTURE.md)) sizes every "small" request in days — surfaces the cost. |

### Key Assumptions (call out if any are wrong)

- **A1.** Owner-operator agencies with 10–30 clients exist in enough volume to be a real market. *Evidence:* GHL has ~$50M ARR primarily from this ICP; HubSpot Agency Partner program has 6,000+ agencies. Market is real.
- **A2.** The "AI agents as staff" framing is differentiated enough to command $1.5K+/mo. *Evidence:* needs validation in 8 first-call conversations Sofia is sourcing. If positioning falls flat, we re-frame as "AI-native agency OS" with skills as the unit (not agents).
- **A3.** The existing [`crm-vanilla/`](../../crm-vanilla/) foundation can support multi-tenant white-label without a full rebuild. *Evidence:* the (B) org-scoped tenancy helpers already exist in [`tenancy.php`](../../crm-vanilla/api/lib/tenancy.php); [`schema_organizations_migrate.sql`](../../crm-vanilla/api/) is already in tree. David to confirm in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- **A4.** InMotion shared hosting can serve 10+ tenants without performance issues. *Evidence:* it serves NWM today with 691 contacts + active CRM use. Acknowledged in DECISIONS: "scaling past ~50 client orgs will need replatform later."
- **A5.** Carlos has 8–12 hours/week to white-glove the design partner for 12 weeks. *Evidence:* needs Carlos confirmation. If not, design partner program cannot launch yet.
- **A6.** Anthropic API + the existing 12 agent Markdown contracts in [`.claude/agents/`](../../.claude/agents/) can be exposed via a thin orchestration layer without a months-long agent framework build. *Evidence:* David's call in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 10. Milestones — 4–6 Week Build

(High-level only; full schedule lives in [`V1-PLAN.md`](./V1-PLAN.md) after this PRD + ARCHITECTURE + GTM are merged.)

- **Week 1:** Org-scoped tenancy audit complete; design partner signed; branding system + subdomain routing built.
- **Week 2:** Agent Launcher panel + 3 of 6 agents wired (cmo, content-strategist, meta-ops). First agent invocation by partner.
- **Week 3:** Remaining 3 agents (sales-director, customer-success, data-analyst); Stripe billing; first invoice to design partner.
- **Week 4:** Unified Inbox + onboarding flow; skill launcher with 8 skills.
- **Week 5:** Sub-org provisioning (S3, light version); workflow visibility; partner running daily.
- **Week 6:** Polish, cross-tenant leak audit, GTM-ready demo recording for Sofia.

If we slip beyond Week 6, the first cut is sub-org provisioning (S3) and the second is skill launcher count (M4 down to 4 skills).

---

*End of PRD V1. Returns control to Carlos for review, then to Sofia (GTM) and David (architecture) for parallel workstream kickoff.*

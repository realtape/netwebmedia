# NetWebMedia OS — V1 Executable Plan

**Status:** Synthesis v1 — pending Carlos approval
**Owner:** Carlos (decision); orchestrated by claude
**Date:** 2026-05-28
**Sources merged:** [DECISIONS.md](./DECISIONS.md) · [PRD.md](./PRD.md) (Marcus) · [GTM.md](./GTM.md) (Sofia) · [ARCHITECTURE.md](./ARCHITECTURE.md) (David)

This document is the single source of truth Carlos signs off on before engineering work starts. It reconciles the three workstream docs, resolves their tensions, locks the schedule, and surfaces the remaining decisions that require Carlos's call.

---

## 1. Executive Summary

NetWebMedia is launching **NetWebMedia OS** — a white-label "AI Agency OS" sold at **$2,490/mo** to independent marketing agencies (3–15 staff, 10–40 client retainers). The product is a multi-tenant operating shell on top of the existing [`crm-vanilla/`](../../crm-vanilla/) codebase, layered with per-tenant branding, an OS UI at `/os/`, a server-side agent orchestration layer exposing NWM's existing 12 agents (cmo, sales-director, content-strategist, meta-ops, etc.) as in-app skills, per-tenant connector OAuth (Gmail/Calendar/Slack/HubSpot/Stripe), and Stripe billing for the agencies themselves.

The defensible wedge is that **NetWebMedia itself dogfoods it** — every agent has shipped real work for real clients before any external buyer sees it. GHL ships a dashboard, Vendasta ships a reseller catalog, NWM ships *staff*.

V1 is a **5-week engineering build + 4 weeks of GTM warmup**, signing **one** design partner by **June 12** (Friday) at $1,245/mo (50% off) in exchange for case-study rights, with public launch the week of **August 3, 2026**. Day-90 target is **10 paying customers and $22.5K MRR**.

The build is deliberately thin: 6 of the 12 agents ship as default-on (cmo, content-strategist, meta-ops, sales-director, customer-success, data-analyst) — the others are wired but off-by-default. No self-serve signup, no multi-tier pricing, no marketplace, no mobile app, no annual billing at launch. Every cut is to protect the 5-week window.

---

## 2. Locked Scope — What Ships in V1

The MUST list from the PRD is the contract. Each line below is either in V1 or it is not — no maybes.

### Product surface (the eight MUSTs)

| # | Feature | Status |
|---|---|---|
| M1 | Multi-tenant org model + per-tenant branding (logo, colors, subdomain, sender email, display name) | **IN** |
| M2 | Tenant-aware CRM (contacts, deals, pipeline, conversations) scoped by `organization_id` | **IN** (extends existing) |
| M3 | Agent Launcher panel — 6 agents default-on, 7 wired-but-off | **IN** |
| M4 | Skill launcher — 8 high-value one-shot skills, button-driven | **IN** |
| M5 | Unified Inbox — Gmail + WhatsApp read in V1, send in V1.1 | **IN (read-only)** |
| M6 | Stripe billing for the agency's subscription to NWM OS — Monthly Premium + Partner Comp SKUs only | **IN** |
| M7 | Onboarding flow — 4-step wizard (branding → domain → connectors → agent activation) | **IN** |
| M8 | Audit log + cross-tenant data-isolation test in CI | **IN — non-negotiable** |

### Should-have (in if the schedule holds)

| # | Feature | Cut order |
|---|---|---|
| S1 | Pipeline view (kanban) for the agency's own sales | Keep — already exists in `crm-vanilla` |
| S2 | Workflow visibility — read-only view of `workflow_runs` | Keep — small wire-up |
| S3 | Client sub-account provisioning — **light version (labels/tags)** | First cut if slipping |
| S4 | Branded login page + favicon per tenant | Keep — cheap |
| S5 | One-page tenant dashboard with weekly summary widgets | Keep — high demo value |

### Nice-to-have — defer to V1.1

Calendar view (reskin), native reporting, custom domain per tenant (vanity subdomain only in V1), public API, mobile-responsive polish beyond "doesn't break," visual workflow builder UI.

### Explicit cuts — NOT in V1

Self-serve signup, multi-tier pricing (Starter/Pro), marketplace, mobile native app, annual billing, custom email-sending domain per tenant, "build your own agent," agent-to-agent autonomous chains, GHL/HubSpot data import wizards, SOC 2 / HIPAA / SSO / SCIM.

---

## 3. Agent Roster — V1 vs Wired-but-Deferred

NWM ships **all 12 agents in the orchestration layer** (so the framework is generic), but only **6 are default-on and marketed**. The other 6 are toggleable per tenant for power users who ask. This resolves the tension between Sofia's GTM (12 agents = the wedge) and Marcus's PRD (6 agents = the V1 demo).

| Agent | V1 status | Killer V1 skill |
|---|---|---|
| **cmo** | Default-on, marketed | Generate 30-day content + campaign plan per client niche |
| **content-strategist** | Default-on, marketed | Write the week's blog + social posts, AEO-optimized |
| **meta-ops** | Default-on, marketed | Draft + schedule IG/FB/TikTok via existing `*_publish.php` |
| **sales-director** | Default-on, marketed | Draft proposal from site audit (uses `proposal.php`) |
| **customer-success** | Default-on, marketed | Draft monthly QBR from client data |
| **data-analyst** | Default-on, marketed | Pull GA4 + Stripe + CRM into one-page snapshot |
| **creative-director** | Wired, default-off | Visual concepts (image gen wiring adds ~1 wk — V1.1) |
| **operations-manager** | Wired, default-off | SOPs and tool selection — low frequency |
| **finance-controller** | Wired, default-off | Needs Stripe + accounting integrations beyond V1 scope |
| **project-manager** | Wired, default-off | Needs a real task surface (V1.1) |
| **engineering-lead** | Wired, default-off | Internal NWM only; not generally useful to agencies |
| **product-manager** | Wired, default-off | Same — internal NWM only |

`carlos-ceo-assistant` is **not exposed** to tenants — it's Carlos-personal and not generalizable without rework. **Open question for Carlos in §8.**

**GTM messaging implication:** Sofia's hero copy currently names 12 specific agents (Sofia/Marcus/Priya/Diego/Elena/Isabel/Aria/David/Rachel/Maya/James/Liam). Revise to lead with **the six core roles** (CMO, sales director, content strategist, meta-ops, customer success, data analyst) and refer to "12 named agents" only as the full roster. Sofia to revise GTM.md §1 in W1.

---

## 4. Cross-Doc Reconciliations

Three real tensions between PRD/GTM/ARCH that this plan resolves.

### Tension A — Pricing ($1,500 vs $2,490)
- DECISIONS.md set the band $1,500–$3,000/mo.
- Marcus proposed $1,500 flat for first 3 design-era partners.
- Sofia ratified **$2,490/mo single SKU** with one design partner at **$1,245/mo (50% off, 12 months)**.

**Resolution:** Sofia's number wins. CMO owns pricing. $2,490 single SKU, $1,245 for the one design partner. Annual flip ($24,900) deferred to V1.1.

### Tension B — Timeline (5 weeks engineering vs 12 weeks GTM)
- PRD said 6 weeks.
- ARCH said 5 phases × 1 week = 5 weeks.
- GTM allocates Weeks 3–5 for build (3 sprints), Weeks 6+ for launch.

**Resolution:** 5 engineering phases compressed against Sofia's calendar. Build runs **W2 (architecture starts at partner-sign) through W6 (billing+onboarding polish)**. Soft launch slips one week from Sofia's W6 to **W7** (Jul 13–19) — public launch holds **week of Aug 3** (W9). One-week slip from Sofia's draft is the honest cost of David's 5-phase plan.

### Tension C — Agent count (6 marketed vs 12 in orchestration)
- PRD said 6 ship in V1.
- ARCH said all 13 are wired in the dispatcher.
- GTM hero copy names 12.

**Resolution:** All 12 wired in the orchestration layer (one-time cost to build the dispatcher). Default-on = 6. Marketed = 6 + reference to "12-named roster." Sofia revises GTM.md hero in W1.

### Tension D — Custom email-sender domain
- ARCH §3 claims "custom email-sender domain per client" as a feature.
- PRD Q5 defers per-tenant SPF/DKIM to V1.1.
- Sofia's hero uses it as a positioning point.

**Resolution:** V1 ships per-tenant `sender_email` (already exists in `organizations`), but **the email is sent via NWM's SMTP infrastructure** — the tenant sees "from your-name@nwmos.com" or similar. *True* DKIM-signed per-tenant sending domains move to V1.1. Sofia revises the relevant landing-page claim to "white-labeled email sender" without implying full per-domain DKIM.

### Tension F — White-glove cadence (NEW, resolved 2026-05-28)
- Sofia's GTM.md proposed "weekly 30-min co-build call for 6 weeks" with the design partner.
- Marcus's PRD assumed 8–12 hrs/week of Carlos availability for 12 weeks.
- Carlos's call (2026-05-28): **ONE focused week of white-glove, not stretched out.**

**Resolution:** Compress all white-glove into **W6 (Jul 6–12)** — Carlos blocks the full week for the design partner boot camp (provisioning, branding kit, OAuths, first agent runs, first workflow live, captured pain points). After W6, Isabel (customer-success agent) takes over as primary contact with async support. Carlos returns only for monthly 30-min QBRs. Sofia revises the DPA terms in W1 to remove the "weekly calls" promise and replace with "1 boot-camp week + dedicated CS afterward."

### Tension E — Sub-client portals (Marcus S3 / ARCH §2)
- PRD says "light version (labels/tags)" in V1.
- ARCH includes full `parent_org_id` schema but defers sub-brand at the brand level.

**Resolution:** V1 ships the schema (free — it already exists in `organizations.parent_org_id`) and lets the agency tenant tag/label their own client work, but **the agency's clients do not log in to NWM OS in V1**. Sub-client portals = V2. This matches Marcus's recommendation and David's "agency → end-client at data level only" call.

---

## 5. Master Timeline — Week-by-Week

`T-0 = today, 2026-05-28`. Calendar entries in `carlos@netwebmedia.com`, `America/Santiago`, named `NWM - OS - <milestone>`.

| Week | Dates | GTM (Sofia) | Engineering (David) | Product (Marcus) | Gate at end of week |
|---|---|---|---|---|---|
| **W0** | May 28 – May 30 | Carlos picks 10 warm-list names | — | — | DECISIONS approved; warm-list locked |
| **W1** | Jun 1 – Jun 7 | DPA + one-pager drafted; 10 warm-list outreach; AEO blog "We're building NWM OS"; landing page draft at `/os` (noindex) | Pre-work: Stripe MCP product + price objects created; GitHub Secrets added (`STRIPE_*`, `CONNECTOR_ENC_KEY`, `GOOGLE_OAUTH_*`); CSP draft for new origins | Sofia revises GTM hero (per Tension C/D); FAQ doc started | Partner pipeline of ≥3 active conversations |
| **W2** | Jun 8 – Jun 12 | **Design partner signed by EOD Jun 12** | **Phase 1 — Foundation:** schema_os_*.sql migrations; `os_provision.php`, `whoami.php`; Apache wildcard rewrite to `/os/` | Onboarding flow content drafted | Phase 1 verification: test tenant `tester-acme` provisioned + isolation test passes |
| **W3** | Jun 15 – Jun 21 | Partner kickoff call; demo sandbox built | **Phase 2 — OS Shell + Branding:** `os/index.html`, widget grid, `branding.css` route, branding asset upload | Onboarding wizard wireframes → David | Phase 2 verification: two tenants, two brands, Lighthouse ≥ 90 |
| **W4** | Jun 22 – Jun 28 | Case study template; demo video drafted | **Phase 3 — Connector layer:** Gmail + Calendar OAuth; encrypted token storage; (Slack stretch) | Skill catalog finalized (8 skills) | Phase 3 verification: end-to-end Gmail read + Calendar event create |
| **W5** | Jun 29 – Jul 5 | One-pager final; pricing-page integration drafted | **Phase 4 — Agent orchestration:** `agent_run.php`, dispatcher, command bar, `run_agent` workflow step | Skill prompts authored (the 8) | Phase 4 verification: 3 agent invocations (Sonnet + Haiku + workflow); token cost tracked; budget enforcement works |
| **W6** | Jul 6 – Jul 12 | `/os` landing page goes live indexed; demo CTA live | **Phase 5 — Billing + Onboarding polish:** Stripe webhook, onboarding wizard end-to-end | **Carlos's white-glove BOOT CAMP WEEK** — full availability for the design partner (branding kit, OAuths, first agent runs, first workflow live, captured pain points) | Phase 5 gate + partner completes full onboarding in the week; Isabel (CS) introduced as primary contact for W7+ |
| **W7** | Jul 13 – Jul 19 | **Soft launch:** demo CTA live; case study draft from partner; first cold-outbound wave | Cross-tenant leak audit + integration test hardening | Open-question backlog reviewed | 2nd paying customer in pipeline |
| **W8** | Jul 20 – Jul 26 | Case study published; AEO content cluster begins (3 posts) | V1.1 backlog refined | First PMF read | NPS ≥ 40 from partner; ≥1 paid (non-partner) customer |
| **W9** | Jul 27 – Aug 2 | **Public launch:** email broadcast to ~700 contacts; podcast tour bookings begin | Production monitoring (latency, agent cost) | Stretch metrics tracked | 3 paying customers |
| **W10–12** | Aug 3 – Aug 23 | Annual flip campaign for early customers; second case study production; pricing-page A/B | V1.1 work begins | Day-90 KPI tracking | 10 paying customers, $22.5K MRR by day-90 |

**Honest one-week slip from Sofia's draft GTM:** soft launch moves W6 → W7, public launch W9 → still W9. Day-90 KPIs (set at "from public launch") still measurable Aug–Oct.

---

## 6. Owners & Swimlanes

| Workstream | Lead | Supporting agents | Single point of truth |
|---|---|---|---|
| Product scope + open questions | Marcus (product-manager) | — | [PRD.md](./PRD.md) |
| Positioning, ICP, pricing, demand-gen | Sofia (cmo) | Aria (content), Liam (meta-ops) | [GTM.md](./GTM.md) |
| Architecture, build, deploy | David (engineering-lead) | — | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Design partner relationship | Carlos (CEO) — **boot camp W6 only** | Diego (sales) for qualification; Isabel (CS) is primary contact W7+ with async support | This doc + DPA |
| Sales close (V1 phase) | Carlos (CEO) | Diego for qualification only | — |
| Analytics, KPI dashboards | Maya (data-analyst) | — | TBD — Maya designs in W6 |
| Brand + visual assets | Rachel (creative-director) | — | One-pager owner |

**Rule:** Sofia owns price. Marcus owns scope. David owns build. Carlos owns the design partner and any cross-doc tiebreaker. Nobody else makes scope cuts without Marcus signing.

---

## 7. Verification Gates (Cross-Phase)

Each engineering phase has a gate. No phase starts until the prior gate passes. If a gate slips by >2 days, scope is cut from the **next** phase, not the current one.

| Phase | Gate condition | Owner |
|---|---|---|
| 1 — Foundation | `tester-acme` tenant provisioned; cross-tenant isolation test in CI green | David |
| 2 — Shell + Branding | Two tenants render two brands; login by host works; Lighthouse ≥ 90 | David + Rachel |
| 3 — Connectors | End-to-end Gmail read + Calendar event create through encrypted token; tokens encrypted in DB confirmed by SQL inspection | David |
| 4 — Agent orchestration | 3 successful agent_runs (1 Sonnet, 1 Haiku, 1 workflow-triggered); cost tracked ±2% of Anthropic dashboard; over-budget returns 402 | David |
| 5 — Billing + Onboarding | Stripe test-mode subscription → webhook → `billing_status='active'` flip → tenant uses agents end-to-end | David |
| Soft launch | Partner using NWM OS ≥ 5 days/week and ≥ 1 agent invocation/day for 2 weeks (precursor to SM1) | Carlos + Isabel |
| Public launch | NPS ≥ 40 from partner; ≥1 paying non-partner customer signed | Sofia + Carlos |

---

## 8. Open Questions — RESOLVED 2026-05-28

All five questions answered. Carlos overrode the default on Q3 and Q4; accepted recommendations on Q1, Q2, Q5.

1. **Domain strategy.** ✅ **RESOLVED: skip `agencyos.io` — use `<agency>.netwebmedia.com` vanity subdomains for V1.** Revisit at customer #20.

2. **`carlos-ceo-assistant` agent.** ✅ **RESOLVED: wire as-is, default-off.** Ship "Owner Assistant" generalization in V1.1.

3. **Carlos's white-glove time commitment.** ✅ **RESOLVED (override): ONE focused week of white-glove, not 8–12 hrs × 12 weeks.** Carlos blocks W6 (Jul 6–12) entirely for the design partner boot camp. After W6, Isabel (CS) takes over with async + monthly Carlos QBR. See §4 Tension F. Affects DPA terms (Sofia revises in W1), risk register R3, and §12 next steps.

4. **The 10 warm-list names.** ✅ **RESOLVED (override): Claude finds them.** Carlos delegated the sourcing to Claude via the sales-director agent (Diego). Diego mines the production CRM via Chrome MCP (NWM profile only), cross-references `_deploy/companies/` audit recipients, and enriches via `apollo:prospect` if CRM is thin. Output lands at `plans/nwm-os/warm-list.md`. Tracked as Task #6.

5. **Single-SKU commitment.** ✅ **RESOLVED: hold the line — $2,490 single SKU through customer #10.** Sofia owns the call.

---

## 9. Risk Register (Consolidated)

The five top risks across PRD §9 and ARCH §13. Ranked by expected impact × likelihood.

| # | Risk | L | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Cross-tenant data leak via missing `org_where()` on a new handler | Med | Critical | CI integration test in Phase 1 + PR checklist + `require_org_access_for_write()` hard rule | David |
| R2 | Anthropic cost overrun by one tenant's heavy workflow | High | Med | Per-org `agent_token_budget_monthly` enforced in dispatcher; default ~2M tokens/mo; 402 on overrun | David |
| R3 | Design partner churns post-boot-camp without weekly Carlos cadence | Med-High | High | Onboarding kit bulletproof in Phase 5 so partner is self-sufficient by end-of-W6; Isabel (CS agent) is primary contact W7+ with async support; monthly 30-min Carlos QBR; discounted $1,245/mo locked for 12 mo gives switching cost; capture 3 "agent moments" during W6 boot camp on recorded calls (SM3) | Isabel + Carlos |
| R4 | Scope creep extends 5 weeks to 12+ | High | High | Marcus says no in writing weekly; new requests go to V1.1 backlog only; engineering sizes "small" requests in days | Marcus |
| R5 | Custom-domain SSL + DNS support burden eats Carlos's time | High | Med | V1 defaults to vanity subdomain; custom domain is an explicit opt-in upgrade; document DNS clearly in onboarding | Carlos |

Lower-tier risks (workflow fairness under load, branding storage limits, no automated test suite, agent prompt versioning) are tracked in ARCH.md §13 — not gating.

---

## 10. Definition of "V1 Shipped"

V1 is shipped when ALL of the following are true:

1. Public landing page at `netwebmedia.com/os/` indexed and live
2. Design partner has been actively using NWM OS for **≥ 4 consecutive weeks** (≥ 5 days/week, ≥ 1 agent invocation/day) — meets SM1
3. Design partner has paid the second invoice (`partner_comp = $0` is the second invoice — for them, the test is *renewed engagement* not money cleared; for them we measure: partner explicitly says "I'll continue at month 13 at $2,490" by month 4) — meets SM2 (modified)
4. At least one non-partner paying customer has signed at full price ($2,490/mo)
5. Three "agent moments" recorded on calls with the design partner — meets SM3
6. Cross-tenant isolation test green on every deploy for 30 days — meets SM4
7. Design partner agrees to a public case study + reference call — meets SM5

V1.1 starts the day Definition #7 is achieved or Day-90, whichever comes first.

---

## 11. V1.1 Backlog (Surface Now, Build Later)

These are real product needs that V1 deliberately defers. Keeping them here so we don't lose track and so Sofia can hint at them in sales conversations.

- Annual billing ($24,900) — the primary retention lever
- Per-tenant DKIM-signed sending domain (true email white-label)
- Slack OAuth (stretch in V1, full ship in V1.1)
- HubSpot read-only sync as a one-click setup
- Visual workflow builder UI (runtime exists, builder UI is months)
- Native reporting/analytics dashboard (vs screenshot of GA4)
- Sub-client portals (the agency's clients log in to NWM OS directly)
- Custom-domain self-service automation (cPanel UAPI calls)
- Tenant data export endpoint (GDPR-adjacent)
- Per-tenant API keys for external automation
- Agent A/B prompt versioning per tenant
- "Owner Assistant" generalization of `carlos-ceo-assistant`

---

## 12. Next Steps (Immediate)

**Carlos (resolved 2026-05-28):**
1. ~~Read this V1-PLAN.md + skim DECISIONS.md~~ ✅
2. ~~Answer the 5 open questions in §8~~ ✅ (Q1/Q2/Q5 accepted defaults; Q3/Q4 overridden — see §8)
3. ~~Name ≥3 warm-list agency-owner contacts~~ → **delegated to Diego (sales-director); Task #6**
4. ~~Calendar block 8–12 hrs/week × 12 weeks~~ → **revised: block ONE focused week, W6 (Jul 6–12), for the boot camp** — sync to Google Calendar as `NWM - OS - Design Partner Boot Camp`

**Claude (after Carlos approves):**
1. Build `plans/nwm-os/index.html` navigation hub
2. Spawn Sofia to revise GTM.md per Tension C/D
3. Spawn Marcus to author the FAQ doc (sales enablement)
4. Spawn David to scaffold Phase 1 (W2) — start with the GSD planning workflow (`gsd-plan-phase`)
5. Sync these milestones into Google Calendar (carlos@netwebmedia.com, America/Santiago, "NWM - OS - <milestone>")

**Sofia (W1):**
1. Draft DPA + one-pager
2. Send 10 warm-list outreach by Wed Jun 3
3. Draft AEO blog post #1 ("What is an AI Agency OS?")
4. Wire `/os` landing page (noindex) with W1 hero copy

**David (W1 pre-work, W2 build start):**
1. Create Stripe Product + Price objects via Stripe MCP
2. Add GitHub Secrets (`STRIPE_*`, `CONNECTOR_ENC_KEY`, `GOOGLE_OAUTH_*`)
3. Draft CSP additions for `api.anthropic.com`, `js.stripe.com`, `accounts.google.com`, `slack.com`
4. Phase 1 build starts Mon Jun 8 (W2)

---

*End of V1-PLAN.md. Returns control to Carlos for approval.*

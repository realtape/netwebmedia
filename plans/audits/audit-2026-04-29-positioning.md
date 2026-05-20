# Positioning Audit — "White-Label CRM AI Agency"
**Date:** 2026-04-29
**Auditor:** Head of Product (Claude)
**Question:** Is "white-label CRM AI agency" what NetWebMedia actually is, or is it aspirational?
**Method:** Read canonical strategy docs (`BRAND.md`, `plans/business-plan.html`, `plans/marketing-plan.html`, `plans/execution-90day.html`), the 04-29 web audit, and walked the codebase (`crm-vanilla/`, `backend/`, `api-php/`, `compare.html`, `vs-gohighlevel.html`).

---

## Positioning verdict

**"White-label CRM AI agency" is not what NWM is today, and the plan docs do not actually claim it is.** Every canonical doc — brand book, business plan, marketing plan — names the category as **"AI-native fractional CMO."** White-label is mentioned in three narrow places: (a) a $449/mo "Agency / White-label" SKU in the business plan that contributes ~10% of projected M12 MRR, (b) a `compare.html` page that markets "full white-label + SaaS mode" as a feature, and (c) Section 17 of `BRAND.md` which spells out reseller rules. The codebase backs the fractional-CMO story (services site, 14 industry verticals, AEO/content engine) but has only the **skeleton** of white-label CRM infrastructure. The `compare.html` and "white-label CRM" claim is **marketing ahead of the product** — closer to fraud risk than feature gap if a partner buys it tomorrow.

## What NWM actually is right now

NWM is a **one-operator AI-augmented marketing services boutique** with three motions running in parallel: (1) a productized fractional-CMO retainer ($249/$999/$2,499) sold via a strong public site with deep AEO/schema posture and 14 industry landing pages; (2) an internal CRM (`crm-vanilla` + `api-php`) that NWM uses to run its own pipeline and which has the *beginnings* of a multi-tenant SaaS shape (login, plan tiers, superadmin dashboard, `user_id`-scoped tenancy on 6 tables); and (3) a Chile-specific outbound prospecting layer (680 generated company audits, 14-niche email engine) that is sales infrastructure for NWM, not a delivered product. Compare that to the brand promise — "HubSpot's polish + GoHighLevel's white-label economics, run by AI" — and you can see the gap: the polish is real, the AI is real, the white-label economics are a SQL schema and a marketing page.

## Tech-stack fit table

| Capability | Needed for white-label CRM AI agency | Current state | Gap |
|---|---|---|---|
| **Multi-tenant data isolation** | Hard requirement: each agency's clients live in isolated workspaces | `crm-vanilla/api/schema_tenancy.sql` adds `user_id` column to 6 tables; `tenancy.php` filters by user. Backfilled to user_id=1 (Carlos). | **Single-level tenancy only.** No `organization_id`, no agency→sub-account hierarchy. An agency reseller can't have 5 isolated clients underneath them. This is the white-label deal-breaker. |
| **Custom branding per tenant** | Logo upload, color override, custom-domain login | None. `crm-vanilla` hardcodes "NetWeb CRM" branding, NWM logo, navy/orange palette in `css/app.css`. | Full build. ~3 weeks of work to support theming + asset hosting. |
| **Custom subdomain / domain per tenant** | `client1.partneragency.com` routing to isolated workspace | Not implemented. Apache serves one `crm-vanilla` instance off `/crm-vanilla/`. | Requires DNS automation + multi-domain SSL + tenant resolver in `api-php`. ~2 weeks. |
| **Per-tenant billing** | Stripe subscriptions billed to the AGENCY, with sub-account usage metering | `routes/billing.php` exists; plan tiers `starter/professional/enterprise` ($29/$79/$199 per `admin.js`) are hardcoded and don't match the public $49/$249/$449 SKUs. | Pricing schema fragmented across 3 places (admin.js, business-plan.html, services.html). Reconcile + wire Stripe Connect for resellers. |
| **SSO / user provisioning** | Agency admin creates client logins, SCIM optional | Manual login per `login.html`; no agency-creates-user flow. | Build. |
| **Migration tools** | "Bring your data from HubSpot/GHL/Pipedrive" | None. | Build or partner (Import2, PieSync). |
| **The other CRM (Django `backend/`)** | If used, would provide proper `Organization` model | **Source files are not in the working tree** — only `__pycache__/*.pyc` and `db.sqlite3`. CLAUDE.md says it exists; reality says it isn't checked in or has been removed. **Not deployed via the FTPS workflows** (per CLAUDE.md). | Either resurrect from .pyc + history, or stop referencing it as if it's a real product. |
| **AI SDR** | Productized agent that prospects per-tenant | NWM has the 14-niche email engine running for NWM's own outbound; not exposed as a per-tenant feature. | Productize: tenant-scoped prospect lists, per-tenant sending domain, per-tenant guardrails. |
| **AI content generation** | Self-serve content factory inside the CRM | Not in `crm-vanilla`. NWM produces content for clients via Carlos + agents. | Service today, not a SaaS feature. |
| **AI analytics agent** | Natural-language queries over client CRM data | Not built. | Build. |
| **Anthropic/OpenAI integration in product** | Wired API keys, per-tenant rate limits, prompt library | Internal use only via `.claude/agents/`. Not exposed as product surface. | Build. |
| **Industry verticals as productized offerings** | 14 niches each as a "snapshot" / preset bundle | `industries/` pages = **landing pages**, not delivered offerings. Same for the 39 industry subdomains. | Productize: each niche needs a CRM preset, content kit, ad creative pack. |
| **680 `companies/` audit pages** | — | Sales asset for cold outbound, not product. | Fine as-is. Don't pretend it's product. |

## Three strategic options, ranked

### Option A — Commit to white-label CRM AI agency. Close the gaps.
**Recommend only if** Carlos believes the GoHighLevel-clone-with-AI market is bigger than the fractional-CMO market AND he wants to be a SaaS founder, not an agency operator.

- **Pros:** SaaS multiples (8–12x ARR vs 1–2x for services), reseller leverage, defensible moat if NWM owns the "AI-native CRM for agencies" category before GHL fully retrofits.
- **Cons:** ~6 months of pure engineering before the first reseller can be onboarded credibly. Distracts from the M4 cash-flow target. Puts NWM head-to-head with GoHighLevel (~$2B ARR run-rate, 70k+ resellers) and Vendasta — both have ~10-year head starts.
- **Brutal read:** A solo operator should not pick this fight unless he can hire 2 senior engineers and a head of partner success in Q2.

### Option B — Stay fractional CMO. Drop the white-label framing entirely. (RECOMMENDED)
- **Pros:** Matches what `BRAND.md` says, what `business-plan.html` projects, what the public site sells, and what Carlos can actually deliver next Tuesday. Removes the credibility risk of `compare.html`'s "full white-label" claim. Lets the CRM stay an internal moat (operational leverage) rather than a product to support.
- **Cons:** Forfeits the $449/mo Agency tier (~$8.1k of projected M12 MRR — small). Loses a talking point against GHL.
- **Brutal read:** This is the honest version of the business. The fractional-CMO category is real, growing 38% YoY, and NWM is genuinely differentiated in it (AEO + bilingual + AI-native + sub-$500 entry). White-label is a distraction sold by the part of Carlos that wants every revenue line to convert.

### Option C — Hybrid: "fCMO is the product; white-label is a Tier-3 enterprise add-on, gated."
- **Mechanic:** Public positioning stays "AI-native fractional CMO." White-label is a closed-door $1,500–$3,000/mo add-on for *qualified* agency partners only — manual onboarding, no self-serve, no marketing page promising it. Builds the multi-tenancy work behind a feature flag, in production with one design partner, before opening it up.
- **Pros:** Optionality without commitment. Keeps the cleaner positioning. Lets the product evolve on revenue from real partners, not roadmap fiction.
- **Cons:** Requires saying "no" to white-label inquiries that come in via `compare.html` until the schema is ready. Carlos won't like that.

**Recommendation: B now, with C as a 2027 evolution.** Take down the white-label claim from `compare.html` this week. Park the Agency $449 tier as "coming soon — design partners only." Revisit Q4 2026.

## If A: 6-month roadmap to credible white-label

| Month | Milestone | Owner | Success metric |
|---|---|---|---|
| **M1** | Decide on backbone: resurrect Django `backend/` (proper `Organization` model) OR refactor `crm-vanilla` schema to add `organization_id` + sub-account hierarchy. Spec ADR. | engineering-lead | ADR signed. Source code restored or rewritten. |
| **M1–M2** | Build agency → sub-account hierarchy. Migrate `tenancy.php` to org-scoped. Reconcile pricing (kill the $29/$79/$199 ghost SKUs). | engineering | All CRUD scoped to org. Zero data leakage in pen test. |
| **M2** | Per-tenant theming: logo, primary color, login URL. Asset CDN. | engineering | 1 dogfood reseller (NWM itself) running on white-labeled domain. |
| **M3** | Custom-domain support: tenant CNAME → load balancer → resolver. Wildcard SSL. | engineering | `crm.partner1.com` resolves to isolated workspace. |
| **M3** | Stripe Connect for resellers: agency bills NWM, resells to its clients at its own price. | finance + eng | First Connect transaction processed. |
| **M4** | Migration tools: HubSpot + GHL importers (CSV minimum, OAuth ideal). | engineering | 1 partner imports 500 contacts in <10 min. |
| **M4** | AI SDR exposed as per-tenant feature. Per-tenant sending domain warm-up. | engineering | 1 reseller runs an outbound campaign without NWM touching it. |
| **M5** | Partner program: written agreement, revenue share, support SLA, certification path. | sales-director | 5 design-partner agencies signed. |
| **M5** | Public launch of `agency.netwebmedia.com` — gated waitlist, no self-serve. | marketing | 50 agencies on waitlist. |
| **M6** | First paid reseller live on production (not NWM-as-tenant). Audit logs. SOC 2 readiness assessment. | eng + ops | $449/mo Agency tier finally has a real customer. |

**Cost estimate:** 1.5 engineer-years compressed into 6 months. Realistic only with 2 hires or a serious contractor budget (~$120–180k). Without that hire, Option A is fiction.

## One brutal honest call Carlos needs to make this week

**Take "full white-label + SaaS mode" off `compare.html` and `services.html` until it's real, OR commit by Friday to the engineering hires that make it real in Q3.** Right now NWM is selling against GoHighLevel on a feature it doesn't have. A single agency that signs the $449 tier expecting to resell to 5 sub-accounts will get a single-user CRM with NWM branding hardcoded in the CSS — and they will charge back, leave a review, and the AEO machine will amplify it because that's what AEO does. The cost of fixing a public reputation hit dwarfs the cost of trimming one bullet point on a comparison page today.

The fractional-CMO business is good. It is differentiated. It is winning. Stop diluting it with a white-label claim that the codebase cannot back up. If white-label matters strategically, hire for it. If it doesn't, kill the SKU. The graveyard is healthier than the zombie.

---

**File paths referenced:**
- `C:\Users\Usuario\Desktop\NetWebMedia\BRAND.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\business-plan.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\marketing-plan.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\execution-90day.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audit-2026-04-29.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\compare.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\api\schema_tenancy.sql`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\api\lib\tenancy.php`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\js\admin.js`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\js\data.js` (mock data — Sarah Chen, TechCorp, etc.)
- `C:\Users\Usuario\Desktop\NetWebMedia\backend\` (only `__pycache__` + `db.sqlite3` present; source missing)

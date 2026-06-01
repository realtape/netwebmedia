# NetWebMedia OS — Foundational Decisions

**Status:** Locked 2026-05-28
**Owner:** Carlos Martinez
**Source:** Direct decision via cockpit conversation

---

## Product Identity

**Working name:** NetWebMedia OS (NWM OS)
**Tagline candidate:** *"The AI Agency OS — staffed by AI agents that work the way your agency does."*

**One-line pitch:** The first agency operating system where the work is done by AI agents that mirror an agency org chart (CMO, sales director, meta-ops, content strategist, creative director, etc.), unifying CRM + CMS + workflows + connectors under one white-labellable shell.

**Defensible wedge:** NWM is a working agency dogfooding it. Every agent has shipped real work for real clients. Competitors ship dashboards; NWM ships staff.

---

## Locked Decisions

### 1. Relationship to GHL White-Label
**Decision:** Sits alongside GHL — not replacing.

- NWM OS = the premium "AI Agency OS" tier
- GHL White-Label stays for clients who just want a CRM
- NWM OS is for agencies who want the full agent-staffed OS
- Two SKUs, distinct positioning, no migration pressure on existing GHL clients

### 2. Pricing
**Decision:** Premium agency tier — **$1,500–$3,000/mo**

- Target ICP: agencies running 10+ clients
- High-touch onboarding (white-glove design partner phase)
- High margin, defensible, slow-and-deep sales motion
- Final pricing (single number) to be ratified by Sofia (CMO) in the GTM brief

### 3. V1 Build Shape
**Decision:** Thin V1 with **one design partner** in **4–6 weeks**.

- Pick one external agency as design partner (Sofia to source)
- Build the minimum viable OS around their real workflow
- Iterate weekly with the partner
- First revenue and PMF signal expected by Week 8

### 4. Tech Foundation
**Decision:** Extend `crm-vanilla/` (PHP/MySQL on InMotion).

- Reuse existing CRM engine, workflow runtime, EAV resources store
- Add: multi-tenant branding, OS shell UI, agent orchestration layer, Stripe billing
- Ship in weeks, not months
- Acknowledged trade: scaling past ~50 client orgs will need replatform later

---

## Inputs to Downstream Workstreams

| Workstream | Owner | Output | Lives at |
|---|---|---|---|
| Product Requirements (PRD) | product-manager (Marcus) | V1 feature scope, user stories, success metrics, design-partner profile | `plans/nwm-os/PRD.md` |
| Go-to-market (GTM) | cmo (Sofia) | Positioning, ICP, messaging, sales motion, design-partner sourcing plan | `plans/nwm-os/GTM.md` |
| Technical architecture | engineering-lead (David) | Multi-tenant data model, branding system, agent orchestration, Stripe integration, 4–6 week build roadmap | `plans/nwm-os/ARCHITECTURE.md` |

After all three return, Carlos reviews + synthesis is produced at `plans/nwm-os/V1-PLAN.md` (the executable phase plan).

---

## What This Is NOT

- Not a replacement for `crm-vanilla/` (it's an extension)
- Not a Carlos-only cockpit (that was the previous scope; this is a sellable product)
- Not multi-tier at launch (Premium only — Starter/Pro tiers come after PMF if at all)
- Not built on a new tech stack (Supabase/Next.js deferred to v2 if needed)
- Not a replacement for GHL White-Label (sits alongside)
- Not free (no free tier — design partner gets discounted, not free)

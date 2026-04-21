---
name: NetWebMedia org structure & agents
description: NetWebMedia is Carlos Martinez's AI-native marketing agency; 12 custom agents defined in .claude/agents/ mirror the org chart
type: project
originSessionId: 143a93b4-8705-4d81-b438-9c83becff800
---
NetWebMedia is an AI-native marketing agency founded/run by **Carlos Martinez (CEO)**. Core offerings: fractional CMO packages, NetWebMedia CRM (`crm-vanilla/`), AI automation builds, websites, content/AEO playbooks.

**Why:** User wanted a full agent roster covering every major function of the agency so future sessions can delegate work to the right "persona" without re-explaining the org.

**How to apply:** When the user asks for work that maps to a role below, invoke the matching agent via the Task tool. When saving org/people facts in future, check these agents first — they encode the canonical responsibilities.

Agents live in `.claude/agents/` (project scope):

- `carlos-ceo-assistant` — Carlos's Chief of Staff / EA (opus)
- `cmo` — Chief Marketing Officer, also models the productized fractional CMO offering (opus)
- `project-manager` — Client + internal delivery PM (sonnet)
- `product-manager` — Head of Product; owns CMO packages, CRM, automations, websites (opus)
- `sales-director` — Net-new revenue, pipeline, proposals (sonnet)
- `content-strategist` — Blog, AEO/SEO, editorial (sonnet)
- `creative-director` — Brand, UX/UI, ad creative (sonnet)
- `engineering-lead` — CTO-equivalent; vanilla stack, PHP API, AI integrations (opus)
- `operations-manager` — SOPs, vendors, internal tooling (sonnet)
- `data-analyst` — Analytics, reporting, funnel/attribution (sonnet)
- `customer-success` — Retention, QBRs, expansion (sonnet)
- `finance-controller` — Billing, P&L, cash, collections (sonnet)

Stack facts referenced by the agents: main site is static HTML/CSS/JS; CRM is `crm-vanilla/` (vanilla JS, no framework); API is PHP in `api-php/`; schema at `crm-vanilla/api/schema.sql`; deploy tooling in `_deploy/`. A coupon code `Carlos26` exists in the billing flow.

---
name: project_nwm_os_phase1
description: "NWM OS (the white-label \"AI Agency OS\" productizing crm-vanilla) — Phase 1 Foundation scaffold built 2026-06-01; what's in tree, what's gated on Carlos"
metadata: 
  node_type: memory
  type: project
  originSessionId: a0db3ddf-03e4-4a17-bed1-e096f2622847
---

**NetWebMedia OS** = the sellable white-label "AI Agency OS" that extends `crm-vanilla/` into a multi-tenant SaaS for marketing agencies ($2,490/mo; one design partner at $1,245/mo). NOT a rewrite — it layers a shell + agent orchestration + billing onto the existing org-tenancy layer. Full plans: `plans/nwm-os/` (DECISIONS/PRD/ARCHITECTURE/GTM/V1-PLAN). Timeline anchored at W0=2026-05-28; design partner target sign by 2026-06-12; public launch ~2026-08-03.

On **2026-06-01** Carlos said "move from vanilla to production" and chose **both lanes in parallel**. Delivered:
- **Build (Phase 1 Foundation scaffold, in working tree, NOT committed/deployed):** `crm-vanilla/api/schema_os_orgs_extend.sql` (adds os_*/billing/agent-budget cols to `organizations`, seeds NWM id=1 as partner_comp always-on), handlers `os_provision.php` (master-only, MIGRATE_TOKEN), `whoami.php` (shell boot), `os_selftest.php` (R1 cross-tenant isolation guardrail), registered in `index.php`; `os/` shell skeleton (index.html + css + js, CSP-safe, boots from whoami, themes per-tenant, degrades gracefully); `deploy-site-root.yml` got `os/**` in paths + `os` in staging loop. Verified locally: shell renders, 0 console errors.
- **Sell:** Diego (sales-director) sourced 14 new agencies via Firecrawl → `plans/nwm-os/waves/2026-06-01-wave.md` + merged into `warm-list.md` (now ~24 candidates). Top 3: Stoddard Agency (Jesse Stoddard, fractional CMO/home-services, 94), Sequoia GEO (93), Bullseye Strategy (real estate, 92 — verify team <20). 3-touch outreach drafts in `plans/nwm-os/outreach-drafts-2026-06-01.md` — DRAFTS ONLY, never sent.

**Verified-real foundation:** `crm-vanilla/api/lib/tenancy.php` genuinely has org_where()/org_owns()/require_org_access_for_write()/org_from_request()/pin_org_to_master(), fail-closed at line 254, and `organization_id` shipped across 18 tenant tables. The "70% already exists" claim holds.

**Gated on Carlos (nothing done):** deploy+provision tester-acme; wire os_selftest into CI; create Stripe Product+Prices (real money); add GitHub Secrets (STRIPE_*, CONNECTOR_ENC_KEY, GOOGLE_OAUTH_*); apply the .htaccess wildcard-subdomain→/os/ rule (production routing change — HOLD); CSP additions for Phase 4-5. All detailed in `plans/nwm-os/PHASE-1-FOUNDATION.md`.

⚠️ **Branch/deploy gotcha (2026-06-01):** the repo working tree stays checked out on **`nwm-os-phase1`** (with uncommitted NWM-OS WIP: modified `app.js`, untracked `crm-vanilla/api/handlers/os_*.php`). `nwm-os-phase1` does NOT deploy — only `main` does. So **before committing any CRM fix, run `git branch --show-current`**; if not on `main`, the commit won't deploy. To land a fix on `main` without disturbing the dirty WIP tree: cherry-pick into an isolated `git worktree` started at `origin/main` (e.g. under `AppData/Local/Temp`, which the d-drive hook exempts), push `<tmpbranch>:main`, then `git worktree remove`. Did exactly this for the CRM functional-audit fix `ac44141e2` (2026-06-01).

**Phase 1 build committed** as `f4fa66188` on branch `nwm-os-phase1` (still not deployed; gated items unchanged). The earlier `outreach drafts promise "weekly Carlos calls"` flag is **RESOLVED** (commit `027fb0754`, 2026-06-01): all four weekly-call promises rewritten to "W6 boot-camp week + dedicated CS + monthly QBR" per V1-PLAN Tension F, §3 of PHASE-1-FOUNDATION marked resolved. See [[reference_agent_names]] (Diego=sales-director, Sofia=cmo, Isabel=customer-success). Pricing ladder [[project_cmo_premium_pricing]].

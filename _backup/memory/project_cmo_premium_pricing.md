---
name: cmo-premium-pricing
description: "Canonical CMO ladder: AEO Starter $249 / CMO Growth $999 / CMO Premium $2,499 / Custom-Agency (bespoke). pricing.html is source of truth. Do not flip Premium to $2,990 or resurrect fractional-cmo.html."
metadata: 
  node_type: memory
  type: project
  originSessionId: 73467eb1-9a1b-4e6f-98a0-98cbf5c66ad4
---

**Canonical CMO ladder (pricing.html = source of truth):** AEO Starter $249 · CMO Growth $999 (12% ad fee, min $300) · CMO Premium $2,499 (10% ad fee, min $400, by consultation) · Custom / Agency (bespoke, contact-only). Annuals at 15% off: $2,540 / $10,190 / $25,488. The `$7,500–$22,000` figure on marketing pages is the solo-operator/agency comparison anchor, NOT a NWM price.

**Retired tier names (do NOT reintroduce):** "CMO Scale" ($2,990) → renamed to **CMO Premium $2,499**. "CMO Enterprise" ($5,999) → **retired**, replaced by the bespoke "Custom / Agency" tier. "CMO Lite" / "CMO Starter" → **AEO Starter**. The billing plan *code* is still `cmo_scale` (display name "CMO Premium") — code intentionally kept so existing subscriptions aren't orphaned; do not rename the code.

**Site-wide sweep deployed 2026-05-20** (commits `c40f72807` + `4b9cdc6ff`): the chatbot brain (`api-php/lib/knowledge-base.php` EN+ES) had been quoting the wrong "CMO Scale $2,990" live; fixed + verified. Also swept ~80 customer-facing surfaces (homepage, faq, services, partners, nwm-crm/cms, nwmai, vs-intentmedia, tutorials, llms.txt, audit.php report cards, all 14 industry hubs, billing catalog) to the canonical ladder.

**Second sweep deployed 2026-05-20 (commit `c7383f43e`):** the **4,456** `_deploy/companies/**` audit pages (a third variant: "CMO Starter $249 / CMO Scale **$1,999**/mo + $1,999 setup + prose Scale $2,990/mo") were swept to the canonical ladder, all 4 company-page generators fixed (`generate_company_pages.py`, `generate_deep_audits.py`, `generate_usa_audits.py`, `seed-fb-schedule.py`), and `assets/og-pricing.png` re-rendered from the corrected SVG (now "Starter $249 / Growth $999 / Premium $2,499"). All verified live.

**2026-05-21 audit-fix pass (local commits, NOT yet pushed/deployed):** A GSD verify-work + audit-fix cycle found the 2026-05-20 sweep had MISSED several internal-only surfaces (`docs/` is not in the deploy allowlist, so it never reached prod). Carlos approved fixing F-01..F-03; F-04 + a broader-staleness finding held. Commits on local `main`: `314265c47` (F-01: `compare.html` public fractional-CMO card said "Scale plan" → CMO Premium, EN+ES), `d3dbd89ca` (F-02: 5 clean `docs/**` Premium price refs $2,990→$2,499 — 2 onboarding guides, playbook SKU card, mgmt-sim aside, aeo-audit invoice credit), `99cd52263` (F-03: `coyhaique-digital-gaps.html` "$2,990 (Scale tier)" → "$2,499 (CMO Premium)"). Artifacts: `.planning/phases/01-cmo-pricing-404-cleanup/` (UAT + VERIFICATION). pricing.html confirmed already-canonical; 404 page (commit `50c34e4fc`) verified branded+bilingual+wired.

**HELD for Carlos's decision (derived-math / historical / reprice — NOT mechanical):**
- `docs/sales-simulation-cmo-premium/*` — whole simulation built on $2,990 with derived totals ($2,992 net, $35,880 yr-1, refund clause). Leave as dated record vs re-author to $2,499.
- `docs/sales-playbook-master/index.html:263-276` — 5-col comparison table with same derived dependents; left at $2,990.
- **`docs/**` still uses retired middle tier "CMO Standard $1,490"** (renamed/repriced to CMO Growth $999 on 2026-05-11) — a 34% reprice + rename with unverified setup fees and a dependent CMO-Standard simulation. Same class as F-04.

**Remaining (intentionally untouched / open):**
- Internal docs left as historical: `BUSINESS_PLAN.md`, `EXECUTION_90DAY.md`, `MARKETING_PLAN.md`, `plans/*.html`, `*-prospects-report.html` still show old pricing — not customer-facing. (Note: `coyhaique-digital-gaps.html` was fixed 2026-05-21 per F-03; other `*-digital-gaps.html` may still be stale.)
- **Email end-to-end delivery never verified** — `/api/cron/health` is auth-gated (403) and no admin/mailbox was available. Send path is correct in code (SES primary + Resend fallback, both keyed); enrollment verified live. To confirm delivery: `POST /api/email-builder/test-send` from an admin session, or enroll a checkable mailbox.

**`fractional-cmo.html` was intentionally deleted** (salvage commit `c4fc2f6ff`, 2026-05-19) — it 404s on purpose. `pricing.html` is the single source of the Premium price surface.

**Resurrection + re-kill (2026-05-19):** commit `e27ba5122` (13:18, by `realtape`, message "Add public Fractional CMO Services page, locked to live pricing ladder") deliberately rebuilt the page *38 min after* the $2,499 confirmation and re-wired two `pricing.html` links to it. Carlos re-confirmed "keep it deleted (404)". Page deleted again, both `pricing.html` links reverted (nav → `services.html#fractional-cmo`, promo block removed), and `fractional-cmo` was **added to the `.htaccess` internal-block `FilesMatch` alternation** so any future re-deploy/re-salvage 403s instead of going live. Same session Carlos typed "2490" — confirmed a typo; Premium stays **$2,499**, no pricing edits made.

**Why:** On 2026-05-19 two parallel Claude sessions reached opposite conclusions. One session misread a post-FTP-heal live-site snapshot as evidence that $2,990 was correct. The authoritative session had an explicit Carlos confirmation that **$2,499 is correct** (commit `8abcdac68` "Carlos confirmed $2,499"), which is what shipped. Carlos re-confirmed $2,499 and "leave fractional-cmo.html deleted" when the conflict was surfaced.

**How to apply:** Treat $2,499 as the settled Premium price. Do NOT change it to $2,990, and do NOT recreate `fractional-cmo.html`, without a fresh explicit Carlos go-ahead. If you see a page showing $2,990, it is stale — correct it toward $2,499, not the reverse. See [[parallel-session-and-heal-artifacts]] for the process lesson behind this.

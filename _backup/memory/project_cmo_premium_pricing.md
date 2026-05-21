---
name: cmo-premium-pricing
description: "Canonical CMO ladder: AEO Starter $249 / CMO Growth $999 / CMO Premium $2,490 / Custom-Agency (bespoke). pricing.html is source of truth. Premium is $2,490 (set 2026-05-21, was $2,499). Do NOT flip Premium to $2,990 or $2,499; do NOT resurrect fractional-cmo.html."
metadata: 
  node_type: memory
  type: project
  originSessionId: 73467eb1-9a1b-4e6f-98a0-98cbf5c66ad4
---

**Canonical CMO ladder (pricing.html = source of truth):** AEO Starter $249 · CMO Growth $999 (12% ad fee, min $300) · CMO Premium **$2,490** (10% ad fee, min $400, by consultation) · Custom / Agency (bespoke, contact-only). Premium annual (15% off): annual-monthly $2,117, yearly $25,398. Growth annual: $849 / $10,200. Starter annual: $212 / $2,540. The `$7,500–$22,000` figure on marketing pages is the solo-operator/agency comparison anchor, NOT a NWM price.

**2026-05-21 — Premium repriced $2,499 → $2,490 (Carlos, explicit).** When shown "$2,499 vs $2,490" side by side, Carlos chose **$2,490** and stated the ladder as "$249, $999 and $2,490" (correcting his own $990→$999 typo in the same message). This SUPERSEDES the earlier "$2,499 is settled" decision and the earlier note that "2490 is a typo for 2499." **$2,490 is now correct.** If you see $2,499 OR $2,990 on any surface, it is stale — correct it toward **$2,490**.

**2026-05-21 — Growth strategy: Carlos chose Lever B (mix shift), NOT Lever A.** To restore the ~$85k M12 MRR target after the reprice, the business plan offered Lever A (volume: grow to ~100 retainers via a self-serve Starter funnel) vs Lever B (keep ~45 retainers, weight the mix toward Premium $2,490 + higher-ARPU platform + project work). Carlos picked **Lever B** — grounded in the cohort table (Premium 10.1× LTV:CAC / 1.8mo payback vs Starter 3.1× / 3.6mo). finance-controller rebuilt M12 mix (~18 Premium + 20 Growth + Starter funnel + platform + project ≈ $87k MRR; retainer ACV $1,476), 5-yr ARR ($1.02M→$18.5M), and the Jul-31 90-day gate/bear-pivot thresholds (MRR floor $55k / bear <$45k) across business-plan, execution-90day (.html+.md), marketing-plan, finance-unit-economics. **Open flag for Carlos:** the Jul-31 gate (60 clients/$55k) is front-loaded vs M12 (90 clients/$85k) and aggressive from ~5 clients today — he should sanity-check the gate ambition. Starter ($249) is now positioned as a low-CAC funnel/upsell entry, not the MRR engine.

**Retired tier names (do NOT reintroduce):** "CMO Scale" ($2,990) → renamed to **CMO Premium $2,490**. "CMO Standard" ($1,490) → renamed/repriced to **CMO Growth $999** (2026-05-11). "CMO Enterprise" ($5,999) → **retired**, replaced by the bespoke "Custom / Agency" tier. "CMO Lite" / "CMO Starter" → **AEO Starter**. The billing plan *code* is still `cmo_scale` (display name "CMO Premium") — code intentionally kept so existing subscriptions aren't orphaned; do not rename the code.

**Site-wide $2,490 reprice executed 2026-05-21 (this session).** Surfaces swept $2,499→$2,490 (+ Premium annual $25,488→$25,398, annual-monthly $2,124→$2,117): pricing.html (master + schema), 13 live root pages (index, faq, services, aeo-agency, nwm-crm, nwm-cms, vs-intentmedia, terms, llms.txt, js/nwm-chat.js, audit.php, tutorials/nwm-crm, tutorials/fractional-cmo), 31 `industries/**/index.html` hubs (patched as outputs — build_industry_pages.py NOT run, it strips AEO schema), backend (`api-php/lib/knowledge-base.php` EN+ES, `api-php/routes/billing.php` price field 2499→2490, `assets/billing-plans-fallback.json`), **3,736 `_deploy/companies/**` pages** (byte-level churn-free, 10,596 replacements) + 5 generators, and `docs/**` (held items resolved — see below). The earlier 2026-05-20 sweep had taken everything to $2,499; this corrects it to $2,490.

**Held items RESOLVED 2026-05-21 (Carlos gave the numbers, full site-wide approved):**
- `docs/sales-simulation-cmo-premium/*` re-derived from $2,990 → $2,490 (first invoice $2,992→$2,492, gross $3,989→$3,489, year-1 $35,880→$29,880, refund $2,990→$2,490).
- `docs/sales-playbook-master` comparison table re-derived to $2,490.
- "CMO Standard $1,490" → "CMO Growth $999" across docs (incl. the sales-management-simulation narrative; first invoice $1,989→$1,498, year-1 $17,880→$11,988).

**Earlier history:** 2026-05-20 site-wide sweep to $2,499 (commits `c40f72807`, `4b9cdc6ff`, `c7383f43e`) fixed the chatbot brain (was quoting "CMO Scale $2,990" live) + ~80 customer surfaces + the company pages + og image. 2026-05-21 audit-fix pass (commits `f8fcbddea` F-01 compare.html, `1a1cca80d` F-02 docs, `005f363e0` F-03 coyhaique) caught internal-only surfaces the prod sweep missed (`docs/` is not in the deploy allowlist) — those were at $2,499 and are now $2,490 with the rest.

**Remaining at old pricing (flagged, NOT mechanically safe — financial models with derived projections):**
- `plans/business-plan.html`, `plans/marketing-plan.html`, `plans/execution-90day.html`, `plans/swot.html`, `plans/index.html` — internal noindex strategy docs; changing a unit price without re-deriving the revenue model is worse than leaving it. Needs deliberate re-modeling.
- `*-prospects-report.html` (la-serena, punta-arenas, puerto-montt, talca, valdivia, etc.) — internal `.htaccess`-blocked historical snapshots; some embed $2,499 in derived ARR calcs. Re-derive or leave dated.
- **Email end-to-end delivery never verified** — `/api/cron/health` is auth-gated (403). Send path correct in code (SES primary + Resend fallback); enrollment verified live. To confirm: `POST /api/email-builder/test-send` from an admin session.

**`fractional-cmo.html` is intentionally deleted** (salvage commit `c4fc2f6ff`, 2026-05-19) — it 404s on purpose, and `fractional-cmo` is in the `.htaccess` internal-block `FilesMatch` alternation so any re-deploy 403s. `pricing.html` is the single source of the Premium price surface. Carlos confirmed "keep it deleted (404)" twice.

**Why the price has been contentious:** On 2026-05-19 two parallel Claude sessions reached opposite conclusions; one misread a post-FTP-heal live snapshot as evidence $2,990 was correct. The authoritative answer was $2,499 (commit `8abcdac68`). On 2026-05-21 Carlos deliberately moved it to **$2,490**. See [[parallel-session-and-heal-artifacts]] for the process lesson (git fetch + re-check divergence before pushing to main; never force-push to win a race).

**How to apply:** Treat **$2,490** as the current Premium price. Do NOT change it to $2,990 or $2,499, and do NOT recreate `fractional-cmo.html`, without a fresh explicit Carlos go-ahead. If a page shows $2,990 or $2,499, it is stale — correct it toward $2,490.

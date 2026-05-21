---
status: complete
phase: 01-cmo-pricing-404-cleanup
source: [01-VERIFICATION.md]
started: 2026-05-21T10:00:00-04:00
updated: 2026-05-21T10:00:00-04:00
---

## Current Test

[testing complete]

## Tests

### 1. Pricing page shows canonical ladder
expected: pricing.html shows AEO Starter $249 / CMO Growth $999 / CMO Premium $2,499 / Custom-Agency, with no retired tier names and no $2,990 price.
result: pass

### 2. Retired CMO tier names removed from public copy
expected: No public-facing page markets a retired CMO tier (Scale / Lite / Enterprise) in a fractional-CMO context.
result: issue
reported: "compare.html:426 still markets a fractional-CMO 'Scale plan' — a retired CMO tier name on a public root page."
severity: major

### 3. Retired $2,990 price removed from internal docs
expected: No internal doc quotes the retired $2,990 CMO Premium price as the current price (canonical is $2,499).
result: issue
reported: "$2,990 persists across docs/** price tables, onboarding guides, sales playbook/simulations, and one prospect report. F-04 sweep was incomplete."
severity: major

### 4. Custom 404 renders branded + bilingual
expected: 404.html exists, uses the Gulf Oil palette (#010F3B / #FF671F), is bilingual via data-en/data-es, and reads as netwebmedia-branded.
result: pass

### 5. 404 wired via ErrorDocument
expected: Root .htaccess maps ErrorDocument 404 to /404.html.
result: pass

## Summary

total: 5
passed: 3
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- YAML for /gsd-audit-fix + /gsd-plan-phase --gaps. file_refs are verified file:line locations. -->

- truth: "No public-facing page markets a retired CMO tier (Scale/Lite/Enterprise)"
  status: fixed
  commit: 314265c47
  reason: "compare.html:426 markets a fractional-CMO 'Scale plan' (public root page); retired tier name should be the current ladder (CMO Premium / CMO Growth)."
  severity: major
  test: 2
  file_refs:
    - "compare.html:426"
  root_cause: "F-01/F-02 swept pricing.html copy but missed the fractional-CMO feature card on compare.html."
  artifacts:
    - path: "compare.html"
      issue: "Line 426 — 'Scale plan includes a weekly async strategy report…' uses retired CMO tier name (EN + ES data-lang-block)."
  missing:
    - "Replace 'Scale plan' / 'plan Scale' with the current CMO Premium (or CMO Growth) tier name in BOTH data-lang-block=en and data-lang-block=es."

- truth: "Internal onboarding/playbook docs quote the current CMO Premium price ($2,499)"
  status: fixed_partial
  commit: d3dbd89ca
  note: "5 clean current-price refs fixed; sales-playbook-master comparison table (263-276) held with F-04 (derived math: $2,992 first-invoice, $35,880 yr-1)."
  reason: "CMO Premium is shown as $2,990/mo (retired price) in current-price tables across internal docs."
  severity: major
  test: 3
  file_refs:
    - "docs/client-onboarding-guide/index.html:330"
    - "docs/client-onboarding-guide-law-firms/index.html:324"
    - "docs/sales-playbook-master/index.html:173"
    - "docs/sales-playbook-master/index.html:263"
    - "docs/sales-playbook-master/index.html:276"
    - "docs/sales-management-simulation/index.html:658"
    - "docs/sales-simulation-aeo-audit/artifacts/invoice.html:110"
  root_cause: "F-04 swept top-level/plans docs but did not reach docs/** onboarding guides and playbook price tables."
  artifacts:
    - path: "docs/client-onboarding-guide/index.html"
      issue: "CMO Premium row priced $2,990/mo"
    - path: "docs/client-onboarding-guide-law-firms/index.html"
      issue: "CMO Premium row priced $2,990/mo"
    - path: "docs/sales-playbook-master/index.html"
      issue: "Price card + comparison table rows show $2,990/mo and $2,990 refundable"
    - path: "docs/sales-management-simulation/index.html"
      issue: "References CMO Premium ($2,990/mo) as current"
    - path: "docs/sales-simulation-aeo-audit/artifacts/invoice.html"
      issue: "Upgrade-credit copy quotes CMO Premium ($2,990/mo)"
  missing:
    - "Replace $2,990 → $2,499 in current-price contexts; verify setup fee ($999) and annual ($2,124) are consistent with pricing.html."

- truth: "Internal prospect reports do not quote retired pricing/tier names"
  status: fixed
  commit: 99cd52263
  reason: "coyhaique-digital-gaps.html:652 quotes '$2,990/mo fractional CMO (Scale tier)' — both a retired price and a retired tier name."
  severity: minor
  test: 3
  file_refs:
    - "coyhaique-digital-gaps.html:652"
  root_cause: "Prospect report authored against the old ladder; internal-only (.htaccess-blocked) so it escaped the public sweep."
  artifacts:
    - path: "coyhaique-digital-gaps.html"
      issue: "Line 652 — '$2,990/mo fractional CMO (Scale tier)'"
  missing:
    - "Update to '$2,499/mo fractional CMO (CMO Premium)'. Low priority — internal, not publicly served."

- truth: "Sales-simulation artifacts reflect the canonical pricing"
  status: fixed
  note: "Resolved 2026-05-21: Carlos approved full site-wide reprice to $2,490. Sim + comparison table re-derived $2,990->$2,490 ($2,492 first invoice, $3,489 gross, $29,880 yr-1)."
  reason: "The entire docs/sales-simulation-cmo-premium/* artifact set (sim narrative + proposal + engagement-letter + invoice) is built around $2,990/mo, $2,992 charge, $35,880 year-1."
  severity: minor
  test: 3
  file_refs:
    - "docs/sales-simulation-cmo-premium/index.html:6"
    - "docs/sales-simulation-cmo-premium/index.html:147"
    - "docs/sales-simulation-cmo-premium/index.html:277"
    - "docs/sales-simulation-cmo-premium/artifacts/proposal.html:136"
    - "docs/sales-simulation-cmo-premium/artifacts/engagement-letter.html:64"
    - "docs/sales-simulation-cmo-premium/artifacts/invoice.html:89"
  root_cause: "This is a historical record of a (simulated) closed deal at the then-current $2,990 price, with internally-consistent math (credits, totals, Stripe amounts)."
  artifacts:
    - path: "docs/sales-simulation-cmo-premium/"
      issue: "Whole simulation + 3 artifacts priced at retired $2,990 with derived totals."
  missing:
    - "JUDGMENT CALL: rewriting a historical 'what happened' simulation re-derives every dependent figure ($2,992 net, $35,880 year-1, refund clause). Either (a) leave as a dated historical record, or (b) re-author end-to-end to $2,499. Needs Carlos's call — NOT a mechanical find/replace."

- truth: "Internal docs use the canonical middle tier (CMO Growth $999), not the retired CMO Standard $1,490"
  status: fixed
  note: "Resolved 2026-05-21: CMO Standard $1,490 -> CMO Growth $999 across docs (incl. sales-management-simulation), re-derived ($1,498 first invoice, $11,988 yr-1)."
  reason: "DISCOVERED during F-02 fix. docs/** still uses the OLD ladder middle tier 'CMO Standard $1,490' (renamed/repriced to CMO Growth $999 on 2026-05-11 per pricing.html). Plus the sales-playbook-master comparison table (263-276) carries derived math entangled with this."
  severity: major
  test: 3
  file_refs:
    - "docs/client-onboarding-guide/index.html:329"
    - "docs/client-onboarding-guide-law-firms/index.html:323"
    - "docs/sales-playbook-master/index.html:168,258,263,264,265,276"
    - "docs/sales-management-simulation/index.html (entire sim is a CMO Standard $1,490 deal)"
    - "docs/sales-simulation-aeo-audit/artifacts/invoice.html:110"
  root_cause: "CMO Standard -> CMO Growth rename + $1,490 -> $999 reprice (2026-05-11) never propagated to docs/** sales collateral."
  artifacts:
    - path: "docs/"
      issue: "Whole internal sales-doc ladder still on AEO Starter $249 / CMO Standard $1,490 / CMO Premium $2,990; setup fees ($499/$999) also unverified against current pricing."
  missing:
    - "MANUAL: not mechanically fixable. CMO Standard->CMO Growth is a 34% reprice + rename with unverified setup fees and a dependent CMO-Standard simulation. Needs Carlos's decision (re-author docs ladder vs leave dated). Same class as F-04."

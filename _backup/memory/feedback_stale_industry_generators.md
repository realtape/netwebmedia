---
name: stale-industry-generators
description: "build_industry_pages.py / build_subcategory_pages.py are STALE vs the live industry hubs — running them strips the hand-added AEO FAQPage schema. Patch hub OUTPUTS directly; don't regenerate."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b6c6af8a-2881-4fee-945d-d6167e7e86b7
---

**Do NOT run `build_industry_pages.py` or `build_subcategory_pages.py` to apply a change to the live industry hubs.** Patch the `industries/**/index.html` OUTPUT files directly instead.

**Why:** The committed/live industry hubs are hand-enhanced beyond what the generators produce — most importantly they carry per-niche **AEO content: a Resources section, a 5-question FAQ, and `FAQPage` JSON-LD schema** (the agency's core "get cited by AI" value). The generators are an older/simpler template that does NOT emit those blocks. During the 2026-05-20 pricing sweep, regenerating the 14 hubs deleted ~4,000 lines (the FAQ schema + Resources) — a silent AEO regression caught only by inspecting the diff before commit. The hubs and the generators have diverged; the generators are no longer the source of truth for hub content.

**How to apply:** For a mechanical change across hubs (e.g. a pricing rename), edit the tracked `industries/*/index.html` + `industries/*/*/index.html` files in place (a scoped `sed`/Edit), then verify `grep -c FAQPage` is unchanged per file. Keep generator edits if you want the template eventually-correct, but never commit their regenerated output. Note the generators also emit 4 **non-canonical** niche dirs (`ecommerce`, `fitness`, `professional-services`, `tech-saas`) that are deliberately untracked — never `git add industries/` blindly (use `git add -u`), or you'll commit niches beyond the fixed 14. See [[cmo-premium-pricing]] and [[14-niches]].

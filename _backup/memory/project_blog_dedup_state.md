---
name: project_blog_dedup_state
description: "/blog/ has ~611 files with a PARTIAL canonical-dedup system — some near-dup clusters are noindex+canonical'd to a keeper, others still self-canonical and index (residual cannibalization)"
metadata: 
  node_type: memory
  type: project
  originSessionId: fc56ecde-f921-4b0f-8719-fe48d7858325
---

The `/blog/` directory (~611 HTML files, 2026-05-29) has many near-duplicate clusters (e.g. 7× `car-rental-local-seo-*`, 4× `ai-powered-lead-generation-service-business*`). A canonical/noindex dedup system EXISTS but is **partial**: within the car-rental cluster, `booking.html` / `booking-conversion.html` / `guide.html` correctly carry `noindex,nofollow` + canonical → `car-rental-local-seo-booking-strategy.html` (the keeper), but `booking-dominance.html`, `google-dominance.html`, and `booking-conversion-strategy.html` still **self-canonical and index** — so residual cannibalization remains in some clusters.

**Why:** The 2026-05-29 audit first overstated this ("611 files all cannibalizing"); a follow-up agent then overstated the opposite ("all 71 satellites handled, no action"). Spot-verification showed the truth is in between — partial coverage.

**How to apply:** Do NOT mass-delete or blanket-301 blog posts — picking the right keeper per cluster needs Google Search Console traffic data (which slug actually ranks), and deletion is SEO-destructive. The full 48-cluster map + CSV is at `D:\Documents\nwm-audits\DEDUP_ANALYSIS_BLOG_2026_05_29.md` / `.csv`. The canonical AEO pillars (`<niche>-aeo-strategy-2026.html` + `<niche>-local-seo-vs-aeo.html`) are NOT dups — never touch them. Related: [[reference_14_niches]].

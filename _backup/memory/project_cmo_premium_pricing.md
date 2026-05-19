---
name: cmo-premium-pricing
description: "CMO Premium price is $2,499/mo (Carlos-confirmed 2026-05-19, deployed); fractional-cmo.html intentionally deleted — do not flip back to $2,990 or resurrect the page"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73467eb1-9a1b-4e6f-98a0-98cbf5c66ad4
---

**CMO Premium price = $2,499/month.** AEO Starter $249 · Growth $999 · Premium $2,499. The `$7,500–$22,000` figure on marketing pages is the solo-operator/agency comparison anchor, NOT a NWM price.

**`fractional-cmo.html` was intentionally deleted** (salvage commit `c4fc2f6ff`, 2026-05-19) — it 404s on purpose. `pricing.html` is the single source of the Premium price surface.

**Why:** On 2026-05-19 two parallel Claude sessions reached opposite conclusions. One session misread a post-FTP-heal live-site snapshot as evidence that $2,990 was correct. The authoritative session had an explicit Carlos confirmation that **$2,499 is correct** (commit `8abcdac68` "Carlos confirmed $2,499"), which is what shipped. Carlos re-confirmed $2,499 and "leave fractional-cmo.html deleted" when the conflict was surfaced.

**How to apply:** Treat $2,499 as the settled Premium price. Do NOT change it to $2,990, and do NOT recreate `fractional-cmo.html`, without a fresh explicit Carlos go-ahead. If you see a page showing $2,990, it is stale — correct it toward $2,499, not the reverse. See [[parallel-session-and-heal-artifacts]] for the process lesson behind this.

---
name: fractional-cmo-retirement
description: "Root /fractional-cmo.html is RETIRED (301→pricing.html); /tutorials/fractional-cmo.html is a LIVE tutorial — don't confuse them"
metadata: 
  node_type: memory
  type: reference
  originSessionId: af78c067-f39a-4c86-929b-d7ac7a95ece7
---

Two different pages share the `fractional-cmo` name — keep them straight:

- **`/fractional-cmo.html` (root) — RETIRED 2026-05-19.** The public Premium services page was intentionally retired; **pricing.html is the sole Premium surface**. Do NOT "restore" it (I almost did 2026-05-25 — it looked like a live 404 because the file was missing while links pointed at it, but it's retired by design). `.htaccess` now **301-redirects** `^fractional-cmo(\.html)?$ → /pricing.html` (root-anchored). If you ever re-add the file or its old `$2,499`/`$2,990` pricing, that's wrong — Premium is **$2,490** (see [[project-cmo-premium-pricing]]).

- **`/tutorials/fractional-cmo.html` — LIVE tutorial** (167 lines, "Fractional CMO Tutorial — A Marketing Leader Plus the Team"), linked ~53× across the site. Must stay reachable (200).

**The gotcha (fixed 2026-05-25):** the retirement used an `.htaccess` `<FilesMatch "^(...|fractional-cmo|...)\.html$"> Deny from all`. `<FilesMatch>` matches by **filename at ANY path**, so it also 403'd the tutorial — breaking all 53 links. Fix: removed `fractional-cmo` from that deny block and replaced it with the root-anchored 301 above. **Never put `fractional-cmo` back in a `<FilesMatch>` deny** — it will re-break the tutorial. The `.htaccess` (around the internal-pages block + the rewrite block) carries comments explaining this.

**Also:** `backup/auto` PR→main (e.g. PR #19) must never be merged — it floods main with `backup: auto-save` commits and re-introduces the destructive `salvage` commit + wrong pricing. Close such PRs; cherry-pick only genuinely-missing real work after verifying it isn't retired-by-design.

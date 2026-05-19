---
name: parallel-session-and-heal-artifacts
description: "Don't treat a post-FTP-heal live-site value as proof of intent, and check for parallel-session commits before pushing competing changes to production main"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 73467eb1-9a1b-4e6f-98a0-98cbf5c66ad4
---

Two compounding traps hit on 2026-05-19 during the CMO Premium pricing work. Both produced a confidently-wrong conclusion that nearly shipped a revert of Carlos's actual decision.

**Trap 1 — heal/re-upload artifacts are not evidence of intent.** A forced FTP re-upload (the FTP-Deploy-Action stale-state heal) republishes whatever was in `main` at that instant. Reading the live site right after a heal and treating the value as independent confirmation is circular — you're just seeing main echoed back, not a human decision.

**Trap 2 — parallel Claude sessions on the same repo.** Multiple Claude sessions run against this repo under git user `realtape`. An auto-save daemon also commits/pushes. `origin/main` can move (including deliberate content/price changes and "salvage" cleanups that delete files) between the time you branch and the time you push.

**Why:** Believing Trap 1, I concluded $2,990 was correct; meanwhile another session had an explicit Carlos $2,499 confirmation and shipped it. My push was a fast-forward when I branched but became a force-push-requiring revert minutes later. Pushing would have reverted Carlos's confirmed decision and resurrected a deliberately-deleted page.

**How to apply:**
1. For a pricing/content decision, the authority is an explicit human confirmation, not a post-deploy live-site reading. State which one you're relying on.
2. Before pushing to `origin/main`: `git fetch` and re-check divergence. If new commits landed — especially ones touching the same files or with messages like "Carlos confirmed…" or "salvage…" — STOP and reconcile with Carlos before any push. Never resolve a human-intent conflict by reasoning alone.
3. A push that was a clean fast-forward at branch time can silently become force-push territory. Re-verify FF immediately before pushing; never `--force` to `main` to win a cross-session race. See [[cmo-premium-pricing]] for the specific outcome.

---
name: main-history-rewrite-2026-05-19
description: 2026-05-19 origin/main history rewrite + auto-save daemon redesign; Computer 2 must re-clone before its daemon runs
metadata: 
  node_type: memory
  type: project
  originSessionId: 703152b7-dfa1-4d91-9208-4d76ebb2b305
---

On 2026-05-19 `origin/main` was force-pushed to a rewritten clean history (`384dc33d9`): 11 real commits + a daemon-fix commit over base `f35039455`, all `backup: auto-save`/`salvage` junk dropped, and a live content regression (deleted `fractional-cmo.html` + ~13 blog posts) repaired.

The auto-save daemon (`_backup/backup.sh` Stop hook + `_backup/daily-backup.sh` 11PM task) was redesigned: it now snapshots WIP to `refs/heads/backup/auto` via a separate temp index and **never commits/pushes `main`**. Full contract is documented in `CLAUDE.md` → "Auto-backup commits".

**Why:** the old daemon did `git add -A && commit` on the current branch + hardcoded `git push origin main`, which corrupted `main` repeatedly (also happened 2026-05-18). This is the cause of the "branch name keeps changing" symptom Carlos reported.

**How to apply:**
- ~~Computer 2 re-clone risk~~ **RESOLVED 2026-05-19: Carlos confirmed he is no longer using Computer 2 ([[user_computers]]).** Computer 1 is the only active machine; the re-pollution risk is moot. No cross-machine git coordination needed.
- Recovery safety net (in the repo, not memory): `keep/*` tags = every preserved real commit (incl. a P0 security fix and a `fix(ci)` CRM-auth commit NOT on main); `archive/*` tags = every deleted branch tip.
- Open follow-ups for Carlos: `security/p0-audit-ssrf-token` (P0 — leaked migrate token + SSRF, not on main, urgent), `deploy/seo-indexing-fix`, `feat/home-niche-tiles-14` need merge/drop decisions.
- Never re-enable a daemon that pushes `main`. Force-push `main` only with `--force-with-lease` (GitHub Actions auto-publishes `publish: auto-publish` commits to `main` on a schedule — lease prevents clobber).

# Git History Rewrite — 2026-05-18 (COMPLETE)

**Result:** `.git` 27 GB → **437 MB** (98.4% reduction). origin/main force-pushed.
Every commit SHA changed. The PII `_leads/leads.csv` (128 MB across history)
and all contact/lead dumps are purged — this was also a security remediation.

## What was purged from ALL history

- `*.mp4` (all reels/broll/stock — regenerable; live copies still on InMotion)
- `*.exe`, `*.dll`, `*.node` (binaries incl. the old 193 MB Chrome shell)
- all `node_modules/` (root + `_deploy/`, `video-factory/`, `.tmp_render/`)
- `hyperframes/*/renders/` + `hyperframes/realtape-reels/assets/`
- `campaigns/*/assets/`
- `video-factory/out/`, `.tmp_render/`
- `_leads/` (PII), `_deploy/*contacts*.csv|*leads*.csv`, `live_contacts.json`,
  `contacts_dump.json`, `api-php/data/*.csv|*.json`

Source code, HTML, CSS/JS, PHP handlers, build scripts, runbooks, and the
12 live reels (working tree) were preserved. `.gitignore` hardened so none
of the above can be re-committed.

## Backups (safe to delete once confident)

`D:\Documents\nwm-history-rewrite-2026-05-18\`
- `backup.sh.orig`, `settings.local.json.orig` — daemon originals (already restored)
- `worktree-leads.php.diff` + `.fullcopy` — 42-line uncommitted change from a
  stray Agent worktree (`crm-vanilla/api/handlers/leads.php`). **NOT applied** —
  review separately if it was wanted; it was unrelated to the bloat fix.
- `live-reels-backup/` — the 12 reels (HF remixes + campaign), in case a
  re-deploy to InMotion is ever needed
- `pre-rewrite-state.txt`, `purge-paths.txt`, `filter-repo-analysis-backup/`

## ⚠️ COMPUTER 2 — MANDATORY RE-CLONE

Computer 2's clone has the OLD history. Every SHA changed. If its auto-save
daemon runs, it will try to push 27 GB of old history back and diverge
catastrophically. **Before doing anything else on Computer 2:**

```bash
# 1. Save any uncommitted work on Computer 2 first (copy files out manually)
#    — a re-clone discards everything not pushed.

# 2. Move the old clone aside (don't delete until verified)
cd ~/Desktop          # or wherever NetWebMedia lives on Computer 2
mv NetWebMedia NetWebMedia.OLD-27gb

# 3. Fresh clone (small — ~440 MB)
git clone https://github.com/netwebmedia/netwebmedia.git NetWebMedia

# 4. Re-link the auto-save daemon path if Computer 2 had its own scheduled
#    task / Stop hook pointing at the old dir. Re-copy any local-only files
#    (config.local.php is server-generated; nothing local needed).

# 5. Once the new clone works, delete NetWebMedia.OLD-27gb to reclaim disk.
```

If Computer 2's daemon already pushed old history between the force-push
and the re-clone: origin/main would show a `backup: auto-save` commit on
top of OLD lineage. Check `git ls-remote origin main` — if it's NOT
`ca7c5e5f1...` or a clean descendant, the rewrite was clobbered and must
be re-force-pushed from Computer 1 (which still has the clean 437 MB repo).

## Known follow-up (NOT done — out of authorized scope)

Only `main` was force-pushed (as authorized). These origin branches still
carry the OLD bloated history:

`dependabot/*` (5), `feat/ai-auto-reply-pr2-pr3`, `feat/home-niche-tiles-14`,
`deploy/seo-indexing-fix`, `logo-patch`, `backup-pre-pull-2026-05-11-1143`

Consequences:
- A normal `git clone` (default branch = main) is small ✓
- `git clone --mirror` or fetching all branches still pulls old bloat
- GitHub's server-side repo size won't fully shrink until those refs are
  rewritten/deleted AND GitHub runs gc (or you ask GitHub Support to gc)

filter-repo already rewrote these branches LOCALLY on Computer 1. To finish
the remote cleanup (separate decision — affects open Dependabot PRs):
- Stale branches (`backup-pre-pull-*`, merged `feat/*`, `logo-patch`): delete
  on origin — `git push origin --delete <branch>`
- Keep+rewrite: `git push --force-with-lease origin <branch>` for each
- Then GitHub gc (Settings → or contact Support) to reclaim server storage

## Root-cause note (why the first attempt failed)

The initial `--paths-from-file` spec was written with CRLF line endings.
`git-filter-repo` read every path as `name\r`, matched nothing, and
"succeeded" as a silent no-op. Fixed by passing all path specs as CLI
args (`--path` / `--path-glob`) — no file, no CRLF. Lesson: always
verify a history rewrite by re-measuring `git rev-list --disk-usage`
AND grepping full history per pattern, never trust the exit code or a
single size reading.

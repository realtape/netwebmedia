#!/bin/bash
# Auto-backup (Claude Code Stop hook) — REDESIGNED 2026-05-19.
#
# WHY THIS LOOKS DIFFERENT NOW:
#   The old version did `git add -A && git commit` on WHATEVER branch was
#   checked out, then a hardcoded `git push origin main`. That polluted main
#   with hundreds of "backup: auto-save" commits, diverged local main from
#   origin/main by 48+ commits, and made the checked-out branch name appear
#   to "change" randomly. See CLAUDE.md "Auto-backup commits".
#
# NEW CONTRACT:
#   - NEVER commits to main. NEVER pushes to origin/main.
#   - main only ever receives deliberate, reviewed commits.
#   - WIP is snapshotted onto refs/heads/backup/auto via a TEMP index, so the
#     user's real HEAD, current branch, index and working tree are untouched.
#   - That ref is pushed to origin/backup/auto — fully recoverable, zero noise.
#
# Recover WIP later with:  git log backup/auto   /   git checkout backup/auto -- <path>

set -uo pipefail

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"
STATUS_FILE="$REPO_DIR/crm-vanilla/backup-status.json"
BACKUP_REF="refs/heads/backup/auto"
BACKUP_BRANCH="backup/auto"

COMMITTED=false
PUSHED=false
STATUS="success"

# Sync Claude memory files into the repo (snapshotted with everything else)
[ -d "$MEMORY_SRC" ] && cp -r "$MEMORY_SRC/." "$MEMORY_DST/" 2>/dev/null || true

cd "$REPO_DIR" || exit 0

# Keep main visually clean: the dashboard status file is tracked but rewritten
# every run — tell git to ignore local modifications to it (idempotent).
git update-index --skip-worktree "crm-vanilla/backup-status.json" 2>/dev/null || true

# --- Snapshot into a SEPARATE index so HEAD / branch / index stay untouched ---
export GIT_INDEX_FILE="$REPO_DIR/.git/backup-index"
rm -f "$GIT_INDEX_FILE"
git read-tree HEAD 2>/dev/null || true
git add -A 2>/dev/null || true

# Defense-in-depth: never snapshot junk / oversized blobs.
# (Root cause of the 534MB hyperframes/*.part incident, 2026-05-18.)
git reset -q -- \
  '*.part' '*.tmp' '*.zip' '*.mp4' '*.mov' '*.mkv' '*.webm' '*.avi' \
  '*.exe' '*.dll' '*.iso' '*.bin' \
  'hyperframes/' 'site-upload/' '_backup/logs/' '.claude/worktrees/' \
  '**/node_modules/' 2>/dev/null || true

# Hard size guard: drop any staged blob >= 95 MiB (GitHub rejects >100MB).
git diff --cached --name-only -z 2>/dev/null | while IFS= read -r -d '' f; do
  sz=$(git cat-file -s ":$f" 2>/dev/null || echo 0)
  if [ "$sz" -ge 99614720 ]; then
    echo "[backup] SKIP oversized ($((sz/1048576))MB): $f" >&2
    git reset -q -- "$f" 2>/dev/null || true
  fi
done

if ! git diff --cached --quiet 2>/dev/null; then
  TREE=$(git write-tree 2>/dev/null || echo "")
  if [ -n "$TREE" ]; then
    PARENT=$(git rev-parse --verify -q "$BACKUP_REF" || git rev-parse --verify -q HEAD)
    SRC_BR=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo detached)
    CMT=$(git commit-tree "$TREE" -p "$PARENT" \
          -m "backup: auto-save $(date '+%Y-%m-%d %H:%M') [from ${SRC_BR}]" 2>/dev/null || echo "")
    if [ -n "$CMT" ]; then
      git update-ref "$BACKUP_REF" "$CMT" && COMMITTED=true
    else
      STATUS="error"
    fi
  else
    STATUS="error"
  fi
fi

unset GIT_INDEX_FILE
rm -f "$REPO_DIR/.git/backup-index"
# --- working tree, HEAD, real index are exactly as the user left them ---

write_status() {
cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "session",
  "committed": $COMMITTED,
  "pushed": $1,
  "status": "$STATUS"
}
JSON
}
write_status false

if [ "$COMMITTED" = true ]; then
  if git push origin "$BACKUP_BRANCH" 2>/dev/null; then
    PUSHED=true
    write_status true
  else
    STATUS="push_failed"
    write_status false
  fi
fi

echo "[backup] $(date '+%Y-%m-%d %H:%M') committed=$COMMITTED pushed=$PUSHED status=$STATUS ref=$BACKUP_BRANCH"

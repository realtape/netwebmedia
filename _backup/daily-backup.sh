#!/bin/bash
# Daily scheduled backup — runs via Windows Task Scheduler at 11 PM every day.
# REDESIGNED 2026-05-19 to match _backup/backup.sh: snapshots WIP onto the
# recoverable refs/heads/backup/auto ref. NEVER commits to or pushes main.
# main only ever receives deliberate, reviewed commits. See CLAUDE.md.

set -uo pipefail

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"
LOG_DIR="$REPO_DIR/_backup/logs"
LOG_FILE="$LOG_DIR/backup-$(date '+%Y-%m-%d').log"
STATUS_FILE="$REPO_DIR/crm-vanilla/backup-status.json"
BACKUP_REF="refs/heads/backup/auto"
BACKUP_BRANCH="backup/auto"

COMMITTED=false
PUSHED=false
STATUS="success"

mkdir -p "$LOG_DIR"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Daily backup started ==="

if [ -d "$MEMORY_SRC" ]; then
  cp -r "$MEMORY_SRC/." "$MEMORY_DST/" 2>/dev/null && log "Memory synced"
else
  log "WARNING: Memory source not found — skipping memory sync"
fi

cd "$REPO_DIR" || { log "ERROR: Cannot cd to $REPO_DIR"; exit 1; }

git update-index --skip-worktree "crm-vanilla/backup-status.json" 2>/dev/null || true

# Snapshot into a SEPARATE index — HEAD / branch / index / worktree untouched.
export GIT_INDEX_FILE="$REPO_DIR/.git/backup-index"
rm -f "$GIT_INDEX_FILE"
git read-tree HEAD 2>/dev/null || true
git add -A 2>/dev/null || true

git reset -q -- \
  '*.part' '*.tmp' '*.zip' '*.mp4' '*.mov' '*.mkv' '*.webm' '*.avi' \
  '*.exe' '*.dll' '*.iso' '*.bin' \
  'hyperframes/' 'site-upload/' '_backup/logs/' '.claude/worktrees/' \
  '**/node_modules/' 2>/dev/null || true
git diff --cached --name-only -z 2>/dev/null | while IFS= read -r -d '' f; do
  sz=$(git cat-file -s ":$f" 2>/dev/null || echo 0)
  if [ "$sz" -ge 99614720 ]; then
    log "SKIP oversized ($((sz/1048576))MB): $f"
    git reset -q -- "$f" 2>/dev/null || true
  fi
done

if ! git diff --cached --quiet 2>/dev/null; then
  TREE=$(git write-tree 2>/dev/null || echo "")
  if [ -n "$TREE" ]; then
    PARENT=$(git rev-parse --verify -q "$BACKUP_REF" || git rev-parse --verify -q HEAD)
    SRC_BR=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo detached)
    CMT=$(git commit-tree "$TREE" -p "$PARENT" \
          -m "backup: daily $(date '+%Y-%m-%d %H:%M') [from ${SRC_BR}]" 2>/dev/null || echo "")
    if [ -n "$CMT" ]; then
      git update-ref "$BACKUP_REF" "$CMT" && COMMITTED=true && log "Snapshot committed to $BACKUP_BRANCH ($CMT)"
    else
      STATUS="error"; log "ERROR: commit-tree failed"
    fi
  else
    STATUS="error"; log "ERROR: write-tree failed"
  fi
else
  log "Nothing new to snapshot"
fi

unset GIT_INDEX_FILE
rm -f "$REPO_DIR/.git/backup-index"

write_status() {
cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "daily",
  "committed": $COMMITTED,
  "pushed": $1,
  "status": "$STATUS"
}
JSON
}
write_status false

if [ "$COMMITTED" = true ]; then
  if git push origin "$BACKUP_BRANCH" 2>>"$LOG_FILE"; then
    PUSHED=true; log "Pushed $BACKUP_BRANCH to origin"; write_status true
  else
    STATUS="push_failed"; log "ERROR: push failed — check network/credentials"; write_status false
  fi
fi

find "$LOG_DIR" -name "backup-*.log" -mtime +30 -delete 2>/dev/null || true
log "=== Daily backup complete — committed=$COMMITTED pushed=$PUSHED status=$STATUS ref=$BACKUP_BRANCH ==="

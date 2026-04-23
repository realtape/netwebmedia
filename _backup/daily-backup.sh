#!/bin/bash
# Daily scheduled backup — runs via Windows Task Scheduler at 11 PM every day
# Syncs memory, commits all changes, pushes to GitHub, and rotates logs.

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"
LOG_DIR="$REPO_DIR/_backup/logs"
LOG_FILE="$LOG_DIR/backup-$(date '+%Y-%m-%d').log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Daily backup started ==="

# Sync Claude memory files into the repo
if [ -d "$MEMORY_SRC" ]; then
  cp -r "$MEMORY_SRC/." "$MEMORY_DST/"
  log "Memory synced from $MEMORY_SRC"
else
  log "WARNING: Memory source not found — skipping memory sync"
fi

cd "$REPO_DIR" || { log "ERROR: Cannot cd to $REPO_DIR"; exit 1; }

# Stage all changes
git add -A
log "git add -A done"

# Commit only if there's something staged
if ! git diff --cached --quiet; then
  git commit -m "backup: daily $(date '+%Y-%m-%d')"
  log "Committed daily backup"
else
  log "Nothing new to commit"
fi

# Push to GitHub
if git push origin main 2>>"$LOG_FILE"; then
  log "Pushed to GitHub successfully"
else
  log "ERROR: git push failed — check network/credentials"
fi

# Rotate logs: keep only last 30 days
find "$LOG_DIR" -name "backup-*.log" -mtime +30 -delete
log "Log rotation done (kept last 30 days)"

log "=== Daily backup complete ==="

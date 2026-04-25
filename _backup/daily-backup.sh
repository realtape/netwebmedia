#!/bin/bash
# Daily scheduled backup — runs via Windows Task Scheduler at 11 PM every day
# Syncs memory, commits all changes, pushes to GitHub, and rotates logs.

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"
LOG_DIR="$REPO_DIR/_backup/logs"
LOG_FILE="$LOG_DIR/backup-$(date '+%Y-%m-%d').log"
STATUS_FILE="$REPO_DIR/crm-vanilla/backup-status.json"

COMMITTED=false
PUSHED=false
STATUS="success"

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
  if git commit -m "backup: daily $(date '+%Y-%m-%d')"; then
    COMMITTED=true
    log "Committed daily backup"
  else
    STATUS="error"
    log "ERROR: commit failed"
  fi
else
  log "Nothing new to commit"
fi

# Write status before push so it's included in the commit on next run
cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "daily",
  "committed": $COMMITTED,
  "pushed": false,
  "status": "$STATUS"
}
JSON

# Push to GitHub
if git push origin main 2>>"$LOG_FILE"; then
  PUSHED=true
  log "Pushed to GitHub successfully"
  cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "daily",
  "committed": $COMMITTED,
  "pushed": true,
  "status": "$STATUS"
}
JSON
else
  STATUS="push_failed"
  log "ERROR: git push failed — check network/credentials"
  cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "daily",
  "committed": $COMMITTED,
  "pushed": false,
  "status": "push_failed"
}
JSON
fi

# Rotate logs: keep only last 30 days
find "$LOG_DIR" -name "backup-*.log" -mtime +30 -delete
log "Log rotation done (kept last 30 days)"

log "=== Daily backup complete — committed=$COMMITTED pushed=$PUSHED status=$STATUS ==="

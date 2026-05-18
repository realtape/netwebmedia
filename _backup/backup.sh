#!/bin/bash
# Auto-backup: syncs Claude memory + commits + pushes to GitHub after every session

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"
STATUS_FILE="$REPO_DIR/crm-vanilla/backup-status.json"

COMMITTED=false
PUSHED=false
STATUS="success"

# Sync Claude memory files into the repo
if [ -d "$MEMORY_SRC" ]; then
  cp -r "$MEMORY_SRC/." "$MEMORY_DST/"
fi

cd "$REPO_DIR"

# Stage all changes
git add -A

# Commit only if there's something staged
if ! git diff --cached --quiet; then
  if git commit -m "backup: auto-save $(date '+%Y-%m-%d %H:%M')"; then
    COMMITTED=true
  else
    STATUS="error"
  fi
fi

# Write status before push so it's included in the commit on next run
cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "session",
  "committed": $COMMITTED,
  "pushed": false,
  "status": "$STATUS"
}
JSON

# Push to GitHub
if git push origin main; then
  PUSHED=true
  # Update pushed flag in status file (will be committed on next backup)
  cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "session",
  "committed": $COMMITTED,
  "pushed": true,
  "status": "$STATUS"
}
JSON
else
  STATUS="push_failed"
  cat > "$STATUS_FILE" <<JSON
{
  "last_backup": "$(date '+%Y-%m-%d %H:%M')",
  "type": "session",
  "committed": $COMMITTED,
  "pushed": false,
  "status": "push_failed"
}
JSON
fi

echo "[backup] Done — $(date '+%Y-%m-%d %H:%M') | committed=$COMMITTED pushed=$PUSHED status=$STATUS"

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

# Stage changes (git add -A respects .gitignore for UNtracked files)
git add -A

# Defense-in-depth: forcibly UNSTAGE junk that must never be committed —
# this also catches already-tracked blobs that predate .gitignore coverage
# (root cause of the 534MB hyperframes/*.part incident, 2026-05-18).
git reset -q HEAD -- \
  '*.part' '*.tmp' '*.zip' '*.mp4' '*.mov' '*.mkv' '*.webm' '*.avi' \
  '*.exe' '*.dll' '*.iso' '*.bin' \
  'hyperframes/' 'site-upload/' '_backup/logs/' '.claude/worktrees/' \
  '**/node_modules/' 2>/dev/null || true

# Hard size guard: unstage any staged file >= 95 MiB (GitHub rejects >100MB).
# Keeps the daemon resilient — it still backs up everything else.
git diff --cached --name-only -z 2>/dev/null | while IFS= read -r -d '' f; do
  sz=$(git cat-file -s ":$f" 2>/dev/null || echo 0)
  if [ "$sz" -ge 99614720 ]; then
    echo "[backup] SKIP oversized ($((sz/1048576))MB): $f" >&2
    git reset -q HEAD -- "$f" 2>/dev/null || true
  fi
done

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

#!/bin/bash
# Auto-backup: syncs Claude memory + commits + pushes to GitHub after every session

REPO_DIR="/c/Users/Usuario/Desktop/NetWebMedia"
MEMORY_SRC="/c/Users/Usuario/.claude/projects/C--Users-Usuario-Desktop-NetWebMedia/memory"
MEMORY_DST="$REPO_DIR/_backup/memory"

# Sync Claude memory files into the repo
if [ -d "$MEMORY_SRC" ]; then
  cp -r "$MEMORY_SRC/." "$MEMORY_DST/"
fi

cd "$REPO_DIR"

# Stage all changes
git add -A

# Commit only if there's something staged
if ! git diff --cached --quiet; then
  git commit -m "backup: auto-save $(date '+%Y-%m-%d %H:%M')"
fi

# Push to GitHub
git push origin main

echo "[backup] Done — $(date '+%Y-%m-%d %H:%M')"

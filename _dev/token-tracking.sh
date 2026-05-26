#!/bin/bash
# Token usage tracker — logs agent usage patterns
# Run this as part of your CI/CD or manually to audit token consumption

LOGFILE=".claude/token-usage-log.txt"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Log when an agent is invoked
log_agent_invocation() {
  local agent=$1
  local model=$2
  local tokens=$3
  echo "$DATE | agent=$agent | model=$model | tokens=$tokens" >> "$LOGFILE"
}

# Summary: which agents consumed the most in the last 7 days
token_summary() {
  echo "=== Token Usage Last 7 Days ==="
  grep "$(date -d '7 days ago' '+%Y-%m-%d')" "$LOGFILE" | \
    awk -F'|' '{print $2}' | \
    sort | uniq -c | sort -rn

  echo ""
  echo "=== Model Distribution ==="
  grep "$(date -d '7 days ago' '+%Y-%m-%d')" "$LOGFILE" | \
    awk -F'model=' '{print $2}' | awk '{print $1}' | \
    sort | uniq -c
}

# Monthly burn rate estimate
burn_rate() {
  local tokens_used=$(grep "$(date '+%Y-%m')" "$LOGFILE" | awk -F'tokens=' '{s+=$2} END {print s}')
  local daily_avg=$((tokens_used / $(date +%d)))
  local projected_monthly=$((daily_avg * 30))

  echo "=== Monthly Projection ==="
  echo "Days run so far: $(date +%d)"
  echo "Tokens used: $tokens_used"
  echo "Daily avg: $daily_avg"
  echo "Projected monthly: $projected_monthly"
  echo "Limit: 100% of your weekly quota × 4.3 weeks"
}

case "$1" in
  summary)
    token_summary
    ;;
  burn)
    burn_rate
    ;;
  *)
    echo "Usage: token-tracking.sh {summary|burn}"
    ;;
esac

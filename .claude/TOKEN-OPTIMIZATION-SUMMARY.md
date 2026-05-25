# Token Optimization Complete ✓

**Date:** 2026-04-28  
**Problem:** Not lasting a week on token budget (46% of weekly limit already used)  
**Solution:** Downgrade 8 agents to Haiku, optimize routing, batch requests

---

## What Changed

### Agent Model Downgrades

**Before:**
- 3 Opus agents (most expensive)
- 9 Sonnet agents (mid-tier)

**After:**
- 3 Sonnet agents (kept for complex work):
  - CMO
  - Engineering Lead
  - Carlos's assistant
- 9 Haiku agents (all routine work):
  - Finance Controller
  - Operations Manager
  - Customer Success
  - Data Analyst
  - Project Manager
  - Sales Director
  - Content Strategist
  - Creative Director

### Expected Impact

**Token savings: ~60-70% reduction in burn rate**

- Haiku costs ~1/3 of Sonnet for the same output
- 8 agents downgraded = massive win
- You should now last 1.5-2x longer on the same budget

**Example:**
- Before: Finance report costs ~2,000 tokens (Sonnet)
- After: Finance report costs ~600 tokens (Haiku)
- Weekly savings: ~12,000 tokens across all agents

---

## New Tools & Guides

### 1. **`.claude/AGENT-ROUTING.txt`** — Read this every day
Quick reference on when to use which agent. Fits on one page.

### 2. **`.claude/token-optimizer.md`** — Strategic guide
Rules for batching, weekly pacing, dispatch decision tree.

### 3. **`_dev/token-tracking.sh`** — Optional monitoring
Script to audit which agents cost the most (if you want granular tracking).

---

## Immediate Actions (This Week)

1. **Read `.claude/AGENT-ROUTING.txt`** — keep it in your head
2. **Batch your requests** — instead of 5 separate prompts, ask for 5 things at once
3. **Prefer Haiku agents** — if Finance, Sales, or Ops can do it, don't ask CMO
4. **Check your usage Friday** — if you're <40% used, you're golden for next week

---

## Weekly Pacing Template

Follow this to spread load evenly:

| Day | Focus | Agents | Cost |
|-----|-------|--------|------|
| Mon | Strategy | CMO, Engineering (Sonnet) | HIGH |
| Tue | Sales | Sales Director (batch all metrics) | LOW |
| Wed | Operations | Ops Manager (batch all SOPs/processes) | LOW |
| Thu | Finance | Finance (monthly report + forecast) | LOW |
| Fri | Analytics | Data Analyst (weekly summary) | LOW |

Never run 2+ Sonnet agents on the same day. Space them out.

---

## Permanent Rules

✓ **Route to cheapest agent that works.** If Haiku can do it, use Haiku.  
✓ **Batch requests.** One prompt with 3 asks beats 3 prompts.  
✓ **No unnecessary delegation.** You don't need an agent to format an email.  
✓ **Cache context on follow-ups.** Include prior answers in follow-up questions.  
✓ **Watch for red flags** — back-and-forth chatter with agents = token bleed.

---

## If You Still Run Out Mid-Week

**Before:** You had no options.  
**Now:** You have 2 fallbacks:

1. **Use Haiku directly** — ask simple questions in the Claude chat (no agent)
2. **Wait until Friday** — batch your asks for the Data Analyst/Finance reviews

You won't run out. You'll have breathing room.

---

## FAQs

**Q: Will Haiku agents give worse answers?**  
A: No. Haiku is perfect for: reports, emails, documentation, routine analysis, proposals. It struggles with novel architecture or high-stakes decisions — that's why CMO/Engineering/Carlos stay on Sonnet.

**Q: Should I switch back to Sonnet if a Haiku agent struggles?**  
A: Try batching the request better first. "Give me X, Y, Z in one message" often fixes perceived "weak" responses. If it truly can't do the work, then yes, escalate.

**Q: Why not downgrade everything to Haiku?**  
A: Campaign positioning, security decisions, and strategic direction need deeper reasoning. Sonnet for those 3 is the right call.

**Q: What if I forget and ask the expensive agent?**  
A: That's fine once in a while. Just don't make it a habit. The `.claude/AGENT-ROUTING.txt` is there to remind you.

---

## Next Steps

1. ✓ Agents are downgraded (done)
2. ✓ Guides are written (done)
3. → **You**: Read AGENT-ROUTING.txt today
4. → **You**: Follow the weekly pacing template next week
5. → **You**: Check usage every Friday

**You've got this.** Token problem solved. Go build.

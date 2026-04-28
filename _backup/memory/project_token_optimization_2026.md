---
name: Token optimization — April 2026
description: Downgraded 8 agents to Haiku, kept 3 on Sonnet; expected 60-70% token savings
type: project
originSessionId: dcf209cd-6cd0-48ab-8c16-69991905af3d
---
## Problem & Solution

**Date:** 2026-04-28  
**Issue:** Carlos was burning 46% of weekly token quota in just the first half of the week, no money for extra usage.

**Root cause:** 3 Opus agents + 9 Sonnet agents all running on expensive models for routine work (reports, emails, documentation).

**Solution implemented:**
- Downgraded 8 agents to Haiku (Finance, Operations, Customer Success, Data Analyst, Project Manager, Sales Director, Content Strategist, Creative Director)
- Kept 3 on Sonnet: CMO, Engineering Lead, Carlos's assistant (for strategic decisions only)
- Expected token savings: 60-70% reduction in burn rate

## Files Created

- `.claude/TOKEN-OPTIMIZATION-SUMMARY.md` — full change log and explanation
- `.claude/AGENT-ROUTING.txt` — daily quick reference (Carlos should read this)
- `.claude/token-optimizer.md` — batching rules, weekly pacing template, decision tree
- `_dev/token-tracking.sh` — optional monitoring script

## Why This Works

Haiku is ~1/3 the cost of Sonnet for the same output on routine tasks. Routine = reports, SOPs, proposals, emails, dashboards, timelines. Strategic = campaign positioning, architecture, board-level decisions. The three Sonnet agents handle strategy; the rest handle execution.

## Weekly Pacing Rule

Spread Sonnet work across the week: Mon (strategy), Tue-Fri (Haiku routine work). Never run 2+ Sonnet agents on the same day.

## Batching Rule

Instead of 5 back-and-forth prompts, ask one agent for 5 things in one message. Saves ~50% of tokens on the same work.

## How to Apply

- Carlos reads `.claude/AGENT-ROUTING.txt` (one page, memorize it)
- Follow the weekly pacing template
- Always ask: "Can Haiku do this?" before routing to CMO/Engineering
- Batch requests instead of back-and-forth chatting

If Carlos ever says "I'm running out of tokens again," check if he's:
1. Using expensive agents for routine work
2. Doing unnecessary back-and-forth (not batching)
3. Asking for work that doesn't need an agent

---

**Reference docs**: `.claude/TOKEN-OPTIMIZATION-SUMMARY.md`, `.claude/AGENT-ROUTING.txt`

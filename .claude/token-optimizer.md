# Token Optimizer Guide

## Current Agent Setup (After Optimization)

| Agent | Model | Use When | Typical Cost |
|-------|-------|----------|--------------|
| **carlos-ceo-assistant** | Sonnet | Strategic decisions, executive briefs, delegation | HIGH |
| **cmo** | Sonnet | Campaign strategy, positioning, multi-product decisions | HIGH |
| **engineering-lead** | Sonnet | Architecture, security, complex tech decisions | HIGH |
| **all others (8)** | Haiku | Routine execution, reports, emails, documentation | LOW |

## Token Budget Rules

**Weekly limit: 46% used = ~54% remaining**

To last the full week:
- **Never run 2+ expensive agents in parallel.** Queue requests sequentially.
- **Route routine work to Haiku agents.** Reports, emails, documentation → use the agent for that role, not Carlos/CMO.
- **Batch similar requests.** "Give me 3 weekly reports" (one call) vs. "report on X, now report on Y, now..." (3 calls).
- **Cache context when repeating.** If you're asking the same agent about the same project twice, include the prior response in your follow-up.

## Dispatch Decision Tree

```
┌─ What do you need?
├─ Strategic decision / High stakes?
│  └─ CMO, Engineering Lead, Carlos's assistant (Sonnet)
├─ Customer communication / Status report / Email?
│  └─ Customer Success, Sales Director, Content Strategist (Haiku — it's fine)
├─ Operational work / Process doc / Internal email?
│  └─ Operations Manager, Project Manager, Data Analyst (Haiku — perfect)
└─ Financial / People / Admin?
   └─ Finance, Data Analyst (Haiku)
```

## Weekly Optimization Checklist

Every Friday, before your next week starts:
1. **Check usage** — if you're >50%, throttle agent delegations next week
2. **Batch your requests** — combine "give me the sales report" + "give me the pipeline forecast" into one prompt
3. **Prefer async** — email the agent your questions; wait for batch response vs. 5 back-and-forths
4. **Skip the expensive agent if Haiku works** — CMO doesn't need to write the weekly sales status (Sales Director can)

## Red Flags (Stop & Delegate)

- Running 3+ agents in one conversation = token bleed
- Asking Carlos's assistant to do what a role-specific agent should do (inefficient prompt routing)
- "Just checking in" follow-ups between similar requests (unnecessary context reload)

---

**Last updated:** 2026-04-28

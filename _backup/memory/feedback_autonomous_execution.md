---
name: autonomous-execution
description: Carlos works fast with terse one-word directives and expects full end-to-end execution including production deploys
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 90138561-5266-4968-96a2-1927967dd264
---

Carlos drives with terse, one-word commands ("go", "deploy", "do all yourself", "2", "do it yourself") and expects you to execute the whole arc autonomously: research → fix → commit → merge → deploy → verify live → clean up. Don't stop after staging and ask "want me to deploy?" for routine progression — carry it through.

**Why:** Observed across the 2026-05-19 audit session. He repeatedly answered expansion prompts with a single "go"/"do all yourself" and chose "Full send to main now" over safer options when the risks were laid out. He values momentum and trusts you to own the execution.

**How to apply:**
- Default to acting end-to-end. After a fix is staged, proceed to verify/deploy unless there's a real blocker.
- STILL confirm — once, crisply — only for genuinely irreversible / high-blast-radius / plan-reversing actions (e.g. force-push to main, a production deploy that reverses a plan you both just agreed to, deleting shared data). Lay out the specific risks in 3-5 bullets and offer scoped options via AskUserQuestion; he engages with those. Don't re-confirm routine sub-steps.
- When you hit a hard safety boundary (e.g. won't enter his password to log into cPanel, won't WAF-evade), stop and say so plainly with the safe alternative — he respects that and pivots (he chose the live-probe option when the cPanel login was blocked).
- Verify your own work live (curl with full Chrome UA) rather than trusting CI smoke tests alone, and report what changed + what's left in 1-2 tight sections. See [[respond-in-english]].

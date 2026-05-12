# 6-Day Sales Playbook — May 11-17, 2026
## Goal: Close 1 AEO Audit Customer by Sunday 11:59pm

**Owner:** Carlos
**Product:** AEO Audit $997 one-time (48h delivery, 100% credit to retainer)
**Target:** Law-firm warm leads (15 contacts)
**Channels:** WhatsApp (Tier A, warm) + Email (Tier B/C) + Tuesday AEO Brief broadcast
**Time budget:** ~3 hours/day Mon-Wed, 1 hour Thu-Fri, contingent Sat-Sun

---

## Top 5 Questions — Monday 8am (Answer Each in One Line)

These block everything else until you have them:

1. **Warm-list size:** How many law-firm subscribers / warm prospects do you have that are reachable this week? (Target: 15–20 so we can afford 40% non-response.)
2. **Pipeline state:** Any law firms currently in conversation or replied to anything in the last 30 days? (If yes, name + last touch + context.)
3. **Audit fulfillment time:** Can you block Wed-Fri afternoons 2 hours each day to run 1–2 audits if deals close Tue-Wed? (AI scan 45 min + your 30-min review.)
4. **AEO Brief #002 status:** Is `email-templates/aeo-brief-002-jsonld.html` finalized and queued to send Tuesday 6am PT / 9am ET? (Yes / No / needs X fix.)
5. **Calendly:** Do you have a 30-min discovery-call slot open Wed-Thu this week? (Link to share + your timezone confirmed.)

---

## The 3 Highest-Leverage Actions This Week

### #1: Identify + Tier 15 contacts by Tuesday 8am
**Time:** 90 min Monday morning

1. Run `node docs/this-week-sales-push/pipeline-audit.js` (requires your CRM auth token from DevTools)
   - Output: `warm-leads.csv` ranked by tier (A/B/C) + fit score
2. Pick top 5 from Tier A (replied in last 30 days)
3. Pick 5 from Tier B (recent email opens)
4. Pick 5 from Tier C (older subscribers, but reachable)
5. Add phone numbers + copy their WhatsApp business numbers into a notes doc
6. For Tier A: pre-run a light audit on 2–3 of their sites (15 min each) to get real `{score}` numbers

**Why this is #1:** Everything downstream depends on having the right 15 faces. Wrong list = 0 replies. Right list + cold outreach = 3–4 replies.

### #2: Send Tuesday outreach in 2 waves (9am-12pm Chile time)
**Time:** 75 min Tuesday morning, split into:

**Wave 1 (9am Chile / 6am PT)** — right after AEO Brief #002 hits inboxes:
- 5 WhatsApp DMs to Tier A (hand-personalized with real audit scores — use templates A1, A2, or A3 from `outreach-sequence-law-firms.md`)
- Each message under 80 words, from your personal number (not a chatbot), reference the brief if they opened it

**Wave 2 (10am Chile / 7am PT)**:
- 10 emails to Tier B + C (use email body template from `outreach-sequence-law-firms.md`)
- Subject line A/B test: split 5 with "ChatGPT isn't citing {firmName}" vs 5 with "{firmName} — your AEO citation score"
- Pre-populate placeholders: `{firstName}`, `{firmName}`, `{practiceArea}`, `{city}`, `{score}` (default 14/100 if you didn't pre-audit)

**Why this is #2:** Warm outreach on the day a broadcast hits is 2–3x higher reply rate than solo cold email. Timing is everything.

### #3: Convert 1st reply to closed customer within 48h of contact
**Time:** 30 min per call (discovery) + 15 min (send Stripe link) + 2 hours audit fulfillment

This is the money move. As soon as anyone replies Tue/Wed:
1. **Within 4 hours:** Respond with discovery-call link (Calendly or "what time works Wed-Thu?")
2. **Within 24 hours:** Run the 15-min call (use `discovery-call-cheatsheet.md` — it's a script)
3. **During the call:** Send Stripe checkout link for $997 AEO Audit (don't wait, send while they're warm)
4. **By EOD day 1:** Confirm receipt, confirm final audit deadline (ship Friday 9am)

The audit template is ready. The Stripe link is live at `netwebmedia.com/pricing.html`. Your job is: answer in 4 hours, call in 24 hours, collect payment in 48 hours.

---

## Daily Hour-by-Hour Schedule

### Monday, May 11

**8:00–8:30am:** Answer the 5 questions (above)
**8:30–10:00am:** Run pipeline-audit.js, tier 15 contacts
**10:00–10:30am:** Personalize Tier A audit scores (light site review, record their {score} vs top competitor)
**10:30–12:00pm:** Draft 5 Tier A WhatsApp messages (use your voice, not templates verbatim)
**12:00–1:00pm:** Draft 10 Tier B/C email subjects + body (A/B split, pre-populate variables)
**1:00–2:00pm:** Final check: verify AEO Brief #002 is locked, Stripe checkout live, Calendly slot open
**Rest of day:** Normal CEO work. Playbook ready by EOD.

### Tuesday, May 12

**6:00am PT (9am Chile):** AEO Brief #002 hits inboxes automatically (verify send in email platform)
**9:00–9:45am (Chile):** Send 5 WhatsApp DMs to Tier A — personalized, real audit scores, your name
**10:00–11:00am (Chile):** Send 10 emails to Tier B + C (use templates, variable substitution, soft CTA "reply 'audit' or request a call")
**11:00am–12:00pm:** Check for first replies (expect 0–1 by noon — be patient)
**12:00–5:00pm:** **Response SLA:** Any reply that comes in Tue, you respond with Calendly/call link by 4pm same day
**5:00–6:00pm:** If no replies yet, don't panic. Tier C takes 24–48h. Check email opens in CRM.
**Rest of day:** Normal CEO work.

### Wednesday–Thursday, May 13–14

**Morning check (8am):** Review replies from Tue outreach. Expected by now: 1–3 people asking "tell me more" or booking a call.
**As replies come in:** Send discovery-call link within 4 hours. Schedule for Wed or Thu afternoon.

**Discovery calls (30 min each, use cheat sheet):**
- Listen for pain point (intake latency / AEO citation gap / referral nurture)
- Pitch the $997 audit at 5-min mark (they've told you their pain by then)
- Send Stripe link during the call if they say yes (Outcome A in cheat sheet)
- If "let me think about it" (Outcome B): send email follow-up within 2 hours

**Contingent audit work (if closes Wed/Thu morning):**
- Wed-Thu 2–3pm: Run 1 audit on their site (45 min, AI scan + your 30-min review)
- Deliver Friday 9am sharp

**Rest of day:** CEO work, monitor Slack for questions from prospects

### Friday, May 15

**Morning:** Check for Outcome B converts (people who said "let me think" Wed now ready to buy)
**As they close:** Trigger immediate audit work (deliver Fri by 5pm if Wed close, Sat 9am if Thu close)
**5:00–6:00pm:** If you have 1 closed customer, celebrate. Send audit delivery email (include PDF link + 30-day roadmap kickoff call offer)
**Friday evening:** If 0 closes yet, run the non-responder follow-up Friday sequence (see `outreach-sequence-law-firms.md` § C) — last Hail Mary for low-intent Tier B/C who got the email but didn't engage

### Saturday, May 16

**Morning check:** Verify any Fri-afternoon replies from the follow-up sequence. Any prospects saying "let's talk this weekend?" are Sat-close candidates.
**If 0 closes by Sat 6pm:** See "What if we end at 0" (below)

### Sunday, May 17

**Deadline day.** Any decision that comes in by 11:59pm Sunday counts as this week. After that, it rolls to next week's forecast.

---

## Realistic Forecast

**Baseline assumption:** 15 warm contacts, Tier A = 40% reply rate, Tier B = 15%, Tier C = 5%, replies → audit purchase = 25–30%.

| Scenario | Likelihood | Path |
|---|---|---|
| **1 customer closes** | 60% | Tier A reply (2 expected) → call → 1 buys Tue/Wed → audit delivers Fri |
| **2 customers close** | 20% | 1 from Tier A, 1 from Tier B (strong engagement signal Fri follow-up) |
| **0 customers close** | 20% | All Tier A replies are "let me think," Tier B/C no-shows on follow-up, too much friction |

**Key risk:** If your warm list is <10 law firms (not 15), multiply the likelihood of 0 by 2x. **First action Monday is confirming list size.** If it's <10, add 10–15 more names from Tier C (cold reach).

---

## Trip-Wire Conditions — Change Plan If You See These

### Trip-Wire 1: Zero replies by Wednesday 6pm (72h after outreach)

**Signal:** Tier A (warm) got no responses in 72h — usually signals wrong list or broken WhatsApp number.

**Action:**
- Check: Did AEO Brief #002 actually send Tuesday morning? (Verify email platform logs)
- Check: Did WhatsApp DMs deliver (green checkmark in WhatsApp)? If not, wrong phone numbers.
- If both confirmed: Your Tier A isn't actually warm. Pivot to Tier B/C cold outreach (slower, lower conversion, but still salvageable).
- Extend Friday follow-up to 20 names instead of 10.

### Trip-Wire 2: 2+ replies say "too expensive" or "too fast" before even taking the call

**Signal:** Price or timeline objection without conversation — means your email/WhatsApp framing doesn't match their need.

**Action:**
- Reframe outreach: Lead with "free 15-min call to audit your site" instead of "$997 audit."
- Send to remaining Tier B/C with updated subject line emphasizing the free call.
- Delay the $997 ask until they're on the call and you've mirrored their pain.

### Trip-Wire 3: You get 3+ replies but all want to "schedule a call next week" (not this week)

**Signal:** Interest is there, but timeline doesn't compress to this week's goal.

**Action:**
- Accept it. Convert them to next-week pipeline (CMO retainer prospects).
- Pivot to "let me send you the audit-lite checklist this week, we'll kick off the full audit Monday" — keeps them warm.
- This isn't a failure; it's pipeline for June. But counts against this week's goal.

### Trip-Wire 4: You close 1 customer Wed, but audit delivery Friday looks risky

**Signal:** Prospect bought, but you're overcommitted (other CEO work) and can't deliver Friday.

**Action:**
- Communicate proactively: "Audit ships Saturday 9am instead of Friday. Same 18-page doc, one-day delay." Most won't care.
- Don't promise Fri delivery you can't keep — it's worse than honest "Sat" from the start.

---

## What If We End at 0 Customers by Sunday 6pm

**This is possible.** Here's what happened + what to learn:

### Root-cause analysis (pick 1–2):

1. **Wrong list:** You had <10 law-firm contacts who were actually warm. Next week, run pipeline-audit 3x to find 30+ candidates.
2. **Timing collision:** Your AEO Brief #002 didn't hit the inbox or hit spam. Verify sending configuration.
3. **Outreach fatigue:** 15 messages in one day felt spammy. Next time, stagger Tier A (Mon) / Tier B (Tue) / Tier C (Wed) over 3 days.
4. **Discovery call conversion:** People replied but all chose "let me think" (Outcome B). They need warmer pre-call nurture (e.g., a niche-specific case study before the call).
5. **Stripe friction:** Someone was ready to buy but checkout UX broke or billing failed. Check Sentry logs for 500s.

### Recovery plan for May 19-24 (next week):

- Start with 30 warm contacts instead of 15 (wider net)
- Test a different angle: lead with the niche-specific blog post instead of the audit ($997 immediately)
- Run the discovery-call sequence first, close the audit on the *second* call, not the first
- Stagger outreach over 3 days instead of 2 (less "spammy" feeling)

### What NOT to do:

- Don't discount the $997 to $499 to close faster. You'll train the market on discount-hunting.
- Don't pivot to a different product (CMO retainer). The audit is the fastest-closing thing you have.
- Don't assume the model is broken. One zero week + one close week = you have product-market fit for the audit. Just need more dialing.

---

## Quick Reference — Links & Templates

| Resource | Path |
|---|---|
| WhatsApp + Email templates | `docs/this-week-sales-push/outreach-sequence-law-firms.md` |
| Discovery-call script & objections | `docs/this-week-sales-push/discovery-call-cheatsheet.md` |
| Warm-leads auditor (pull from CRM) | `docs/this-week-sales-push/pipeline-audit.js` |
| AEO Brief #002 (queued Tue 6am PT) | `email-templates/aeo-brief-002-jsonld.html` |
| Stripe checkout | `netwebmedia.com/pricing.html` (AEO Audit section) |
| Calendly link | *Confirm you have this open for Wed-Thu discovery calls* |

---

**Execution starts Monday 8am.** Answer the 5 questions first. Everything else cascades from there.

*Last updated 2026-05-11 by sales-director. Refine based on first week's learning. — Carlos*

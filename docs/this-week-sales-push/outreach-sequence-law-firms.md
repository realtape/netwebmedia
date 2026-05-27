# Law-Firm Outreach Sequence — This-Week Push

**Goal:** 1 paying customer by Sunday May 17.
**Product to push:** AEO Audit $997 (one-time, 48h delivery, 100% credit toward retainer).
**Channels:** WhatsApp + Email. (LinkedIn and X excluded per durable rule.)
**Target:** 15 law-firm contacts — solo to small/mid practices.

---

## How to use this

1. Pick 15 names from your warm list (run `pipeline-audit.js` if you need help — see [`pipeline-audit.js`](./pipeline-audit.js)).
2. Tier them A/B/C:
   - **Tier A (5):** Replied to anything in the last 30 days, or you've spoken to them.
   - **Tier B (5):** Opened recent emails / engaged with content, but no reply.
   - **Tier C (5):** Subscribers who've been on the list 90+ days without much activity.
3. Tuesday morning (after AEO Brief #002 hits): send WhatsApp DM to Tier A first, Email to Tier B + C.
4. Follow-up template fires Friday for any non-responders.

---

## A. WhatsApp DM — Tier A (5 hand-personalized messages)

Use this **only** for people who know you or have replied before. Personalize every line. Aim for under 80 words. Don't send a wall of text in WhatsApp.

### Template A1 · "I ran a thing for your firm"

```
Hi {firstName} — Carlos from NetWebMedia.

Quick one: I ran our AEO audit tool against {firmName} this morning. Your {practiceArea} page scored {score}/100 for ChatGPT citations vs. {topCompetitorName} at {topCompetitorScore}.

Three of the five fixes that close that gap are 20-min jobs (FAQ schema, location-keyed copy, intake response time).

Want the 18-page audit + 90-day action plan? $997, delivered in 48h, full credit toward a retainer if you sign in 90 days.

Or just want me to walk you through the top 3 gaps on a 15-min call? Free either way.
```

**Personalization:** Pre-run a real audit on their site (or eyeball it — 5 minutes per firm) so the {score} and {topCompetitorScore} are real. Without that data the message is generic.

### Template A2 · "Following the AEO Brief"

For people who replied to AEO Brief #001 or #002:

```
Hi {firstName} — saw you opened the FAQPage schema brief.

If you want to skip the DIY: I'll run the same audit on your top 3 practice pages and ship an 18-page action plan in 48h. $997, credits toward retainer.

Or 15 min on Zoom this week and I'll show you exactly what to add and where, free. Your call.
```

### Template A3 · "Specific case"

For someone with a known business challenge (e.g. just opened a new office, just changed practice areas):

```
Hi {firstName} — Carlos at NetWebMedia.

{specificContextSentence: e.g. "Saw you opened the {City} office last month."}

Quick question: are you showing up in ChatGPT yet for "{practiceArea} {city}"? Most firms aren't — we have a $997 audit that maps exactly what's missing and how to fix it in 90 days.

Worth 15 min to walk through?
```

---

## B. Email — Tier B & C (10 emails)

Email allows more length. Use this for people you haven't talked to recently. Personalize the first paragraph, keep the body templatable.

### Subject line options (A/B test 2)

- **Subject A:** "{firmName} — your AEO citation score (under 30/100)"
- **Subject B:** "ChatGPT isn't citing {firmName} for {practiceArea} — here's what to do"

### Body template

```
Hi {firstName},

Quick observation about {firmName}.

I ran our AEO Citation Index against your {practiceArea} page this week. {firmName} scored {score}/100 — the top-cited firm in {city} for the same queries scored {topCompetitorScore}.

That's a {gap}-point gap. Closeable in 60-90 days with three changes:

1. Add FAQPage schema to your top 3 practice pages (technical lift: 30 min)
2. Expand each page to 1,800+ words with question-answer structure (content lift: 4-6 hrs)
3. Add location-keyed copy ("personal-injury attorney in {city}" — not just "personal-injury attorney")

We're booked through Friday on the $997 AEO Audit — 18 pages, delivered in 48 hours, includes the exact schema, content, and structural recommendations you'd need.

The $997 also credits 100% toward any CMO retainer signed in 90 days.

Two ways forward:

→ Want me to run the audit? Reply "audit" and I'll send the checkout link.
→ Want to talk first? Reply with a window and I'll book a 15-min call this week.

Either way, my AEO Brief comes free every Tuesday (you're already on the list). Reply unsubscribe if it's not useful.

— Carlos Martinez
CEO, NetWebMedia
{carlos-cellphone-or-whatsapp}
```

**Required variables to research per prospect (5 min each):**
- `{firstName}` — managing partner or principal attorney
- `{firmName}` — full firm name
- `{practiceArea}` — their #1 anchor practice (personal injury, family law, estate planning, etc.)
- `{city}` — their primary market
- `{score}` — your eyeballed AEO score (or use the 14/100 baseline from the audit report if unknown)
- `{topCompetitorScore}` — eyeball or default to 67/100 (the firm we documented in the audit report)
- `{gap}` — `topCompetitorScore - score`

If you don't have time to run real audits, **default to 14/100 vs 67/100 (53-point gap)** — those are the numbers from the audit template we built. Most firms will land near this range.

---

## C. Friday follow-up — non-responders only

Sent 3 days after the Tuesday outreach. Short, value-add, no second ask.

### WhatsApp follow-up

```
Hi {firstName} — quick add. Just published a 2-min checklist of what answer engines look for on a practice page: {linkToBlogOrLandingPage}

Whether or not you want the audit, that checklist is yours. Reply if you have questions.
```

### Email follow-up

```
Subject: One more — the AEO checklist for {practiceArea} firms

Hi {firstName},

I sent you a note Tuesday about {firmName}'s AEO citation score. No worries if it wasn't the right time.

Quick value-add either way: I put together a 2-min checklist of the structural elements answer engines look for on a law-firm practice page. Schema, content depth, location keywords, intake CTAs — all in one page.

Link: {linkToChecklistPage}

If anything in it surprises you, that's what the audit goes deep on. Reply if you want to chat.

— Carlos
```

---

## D. The pre-flight checklist (do this before sending anything)

- [ ] AEO Brief #002 is rendered and queued (see [`email-templates/aeo-brief-002-jsonld.html`](../../email-templates/aeo-brief-002-jsonld.html))
- [ ] AEO Brief #002 hits Tuesday 9am Chile (= 6am PT / 9am ET)
- [ ] You have the AEO Audit Stripe checkout link ready to paste: `https://netwebmedia.com/pricing.html` (or direct Stripe link if you have one)
- [ ] You have a 30-min Calendly slot open Wed-Thu for discovery calls
- [ ] You have $997 audit fulfillment time blocked Wed-Fri (cmo-agent runs the AI scan, you do 30-min review)
- [ ] WhatsApp business number is the one you'll respond from (consistent across all 15 messages)
- [ ] You re-checked the "no past legal client references" rule — proof points stay anonymized ("a personal-injury firm in the Midwest…")

---

## E. The realistic math

- **15 messages out** Tuesday
- **Tier A reply rate:** ~40% (warm relationship) = 2 replies
- **Tier B reply rate:** ~15% (warm engagement) = ~1 reply
- **Tier C reply rate:** ~5% (cold-ish) = 0–1 replies
- **Total expected replies:** 3–4
- **Replies → audit purchase rate:** ~25–30% on first-touch outreach = **1 paying customer**

This is realistic for a single week with a warm list. If your warm list is thinner or you're starting colder, multiply the volume — 30-40 personalized messages instead of 15.

---

## F. What happens after the audit closes

The conversion from $997 audit buyer → CMO retainer ($999/mo Growth or higher) is the real revenue. Per the audit-buyer simulation:

- **~30% of audit buyers upgrade to retainer within 90 days** (industry-standard hit rate)
- **The $997 credits 100%** to the first retainer invoice
- Sequence: deliver audit Friday → follow-up audit-3 email at Day 5 with retainer-fit hypothesis → discovery call → close in 14-30 days

So a $997 sale this week is actually a **~$11k LTV-blended** outcome.

---

*This document is a starting point. Refine the templates with your specific voice before sending. Don't paste raw — Carlos at his most personal converts 3x what generic templates do.*

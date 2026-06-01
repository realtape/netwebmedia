# Named-Logo Case Study Program — NetWebMedia

> Status: Framework ready. Carlos must drive client outreach — see §3 for the email sequence.
> Target: 3 named case studies live by June 30, 2026.

---

## 1. Program Overview

Right now, case-studies.html references three "design partner" implementations without named clients.
Named-logo case studies are the single highest-trust conversion asset for agency sales — prospects Google
the client name, verify the results are real, and convert at 2–4x the rate of anonymous testimonials.

**Goal:** Convert 3 of our strongest client results into publicly named case studies with:
- Client logo on netwebmedia.com/case-studies.html
- Individual deep-dive page at `/case-studies/<client-slug>.html`
- Client quote and photo
- Permission to use results in paid ads and pitch decks

---

## 2. Eligibility Criteria (internal filter, do not share with clients)

A client qualifies for the named program if ALL of:
1. 90+ days into their engagement (results are real, not honeymoon)
2. At least ONE of: AEO citation appears in ChatGPT/Claude/Perplexity/SGE, organic traffic +20%,
   conversion metric up 15%+, or qualified-lead volume up 25%+
3. NPS ≥ 8 or equivalent "happy client" signal
4. Industry: one of our 14 target niches (preferred: law, hospitality, restaurants, health)
5. No confidentiality clause in their contract blocking testimonials

---

## 3. Client Outreach Sequence (Carlos sends these personally)

### Email 1 — Warm ask (send first)

**Subject:** A quick ask — and something in it for [Client Name]

Hi [First Name],

Working on something I think you'd actually enjoy being part of.

We're publishing a series of deep-dive case studies on how AEO is changing how buyers find service
businesses — and the [Hotel / Law Firm / Restaurant] segment is one I want to anchor with a real story.

Yours is one of the best results we have.

Would you be open to a short 20-min call to walk through the numbers and get your take on what changed?
In exchange, you'd get:
- Your firm featured (with logo and link) on netwebmedia.com/case-studies.html
- A co-branded press release you can share with your own audience
- Permanent backlink from a DA 35+ domain

No ghostwriting, no spin — just your actual story in your own words, reviewed by you before publish.

If yes, just reply and I'll send a time.

Carlos

---

### Email 2 — Follow-up if no reply (send Day 7)

**Subject:** Re: A quick ask

[First Name] — circling back in case this got buried.

The case study series is picking up traction — already have inquiries from law firms in [State] who
found us via the AEO content. If your story is in there, you get that traffic by association.

Zero time investment on your end beyond a 20-min call and a review of the draft.

Worth it?

Carlos

---

### Email 3 — Final nudge (send Day 14, last touch)

**Subject:** Last ask — closing the [Niche] slot this week

[First Name],

Filling the last spot in the case study series this week. After that I'm moving to a different
vertical. [Client Name]'s results are strong enough that I'd hate to publish the niche piece without
your story in it.

If this isn't a fit right now, totally fine — just let me know and I'll close the loop.

Carlos

---

## 4. Case Study Brief Template (20-min call guide)

Run through these during the call. Record with consent.

```
SECTION A — BEFORE
1. What was the biggest challenge before we started working together?
2. What were you trying that wasn't working?
3. Why did you decide to hire an external agency vs. handle it in-house?

SECTION B — DURING
4. What was the first thing you noticed changing?
5. Was there a specific moment where you saw the strategy was working?
6. What surprised you most about how AI citations actually drive inquiries?

SECTION C — RESULTS (fill from our data before the call)
- Before: [organic sessions / AI citations / leads / revenue metric]
- After: [same metrics, 90-day delta]
- Key milestone: [first ChatGPT/Claude citation date]

SECTION D — QUOTE
7. How would you describe the results to a peer in the same industry?
   (This becomes the pull quote — capture verbatim)
8. If a colleague asked "is it worth it?", what would you say?

SECTION E — PERMISSION
9. May we use your name and company name publicly on our website?
10. May we use a headshot or company logo?
11. May we reference these results in paid advertising?
12. Would you like to review the draft before it publishes?
```

---

## 5. Case Study Page Template (HTML)

Save as `/case-studies/<client-slug>.html` when ready to publish.
Copy from the template below and fill in the `[BRACKETED]` fields.

Key sections:
1. Hero — Client name + headline result stat + industry badge
2. Challenge — 2 paragraphs, their words (from brief §A)
3. What We Did — 3-step timeline: Audit → Implementation → Citation tracking
4. Results — 3 key metric cards (before/after) + chart description
5. Pull quote — large blockquote with client photo + name + title
6. CTA — "Get results like [First Name]'s" → /contact.html?topic=case-study-[slug]

Schema to add:
```json
{
  "@type": "Article",
  "headline": "[Headline]",
  "description": "[1-sentence result summary]",
  "author": { "@id": "https://netwebmedia.com/#org" },
  "publisher": { "@id": "https://netwebmedia.com/#org" },
  "datePublished": "[ISO date]",
  "image": "[Client photo or brand image URL]",
  "about": {
    "@type": "Organization",
    "name": "[Client Name]",
    "url": "[Client URL]",
    "industry": "[Industry]"
  }
}
```

Also add a `Review` schema block with the client quote:
```json
{
  "@type": "Review",
  "reviewBody": "[Client pull quote]",
  "author": {
    "@type": "Person",
    "name": "[Client First + Last]",
    "jobTitle": "[Title]"
  },
  "itemReviewed": {
    "@type": "Service",
    "name": "NetWebMedia AEO Retainer",
    "provider": { "@id": "https://netwebmedia.com/#org" }
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  }
}
```

---

## 6. Publishing Checklist

- [ ] Client reviewed and approved draft (get written confirmation via email — reply counts)
- [ ] Client logo obtained in SVG or PNG ≥ 200px wide (white bg version + color version)
- [ ] Client headshot obtained (≥ 400×400px)
- [ ] Individual case study page published at `/case-studies/<slug>.html`
- [ ] case-studies.html updated: anonymous stub → named card with logo
- [ ] Sitemap updated (add new page, bump lastmod on case-studies.html)
- [ ] Schema updated on case-studies.html CollectionPage to reference new Article IDs
- [ ] Client notified of publish date + given their backlink
- [ ] Co-branded press release sent to client

---

## 7. Target Client Pipeline (fill in from CRM)

| Priority | Client | Industry | Engagement Age | Key Result | Outreach Status |
|----------|--------|----------|---------------|------------|-----------------|
| 1 | [Pull from CRM] | | | | Not started |
| 2 | | | | | Not started |
| 3 | | | | | Not started |

**Action for Carlos:** Pull the top 5 clients from CRM sorted by engagement length + result quality.
Filter against eligibility criteria in §2. Target 5 outreach → aim for 3 yeses by June 30.

---

## 8. Incentive Options (use if client hesitates)

| Incentive | Cost to NWM | When to offer |
|-----------|-------------|---------------|
| 1-month retainer credit ($499–$999 off) | Low | First hesitation |
| Co-branded press release + social post by NWM | Zero | Default offer |
| Permanent homepage logo strip placement | Zero | Strong hesitation |
| Free AEO audit for a referral they send | Zero | Network-heavy clients |

**Do NOT offer cash payment** — it creates a disclosure obligation and undercuts the authenticity signal.

---

*Created: 2026-05-01 | Owner: Carlos Martinez | Next review: 2026-06-01*

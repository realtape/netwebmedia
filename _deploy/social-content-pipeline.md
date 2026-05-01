# NWM Social Content Pipeline — Law Firm AEO Cluster

**Version:** 2.0 (channel reality update)
**Created:** May 1, 2026
**Updated:** May 1, 2026
**Cluster:** 3 law firm blog posts → 9 distribution assets
**Timeline:** May 4 – Aug 2, 2026 (rolling publication)
**Owned by:** Content Strategist agent
**Brand voice:** Data-confident, sharp, contrarian. No fluff. No "unlock." No "game-changer."

---

## ⚠️ v2 Channel Reality Update — 2026-05-01

The original v1 of this playbook assumed three live channels: Twitter/X, Instagram, WhatsApp Business. As of 2026-05-01 the actual readiness is:

| Channel | v1 plan | Reality | v2 decision |
|---|---|---|---|
| **Twitter / X** | 3 threads | `@netwebmedia` does not exist on X | **DROPPED PERMANENTLY** (Carlos, 2026-05-01). Threads converted to email broadcasts via the existing `email_sequence_queue` (api-php). The handle stays unclaimed by choice. Do not propose reactivation without explicit go-ahead. |
| **Instagram** | 3 carousels | `@netwebmedia` exists but display name still reads "Carlos Martinez", no indexed posts | **GATED.** Carousels stay as designed but DO NOT publish until IG profile is branded (display name → "NetWebMedia", Navy/Orange avatar, bio link to netwebmedia.com). |
| **WhatsApp Business** | 3 broadcasts | The `wa.me/14155238866` link in the codebase points to Twilio's shared sandbox — no NetWebMedia-owned WABA exists | **REPLACED.** WA broadcasts converted to email follow-ups in the same warm-prospect sequence. Re-introduce WA when Meta WABA verification completes (infra is wired: `WA_META_TOKEN`, `WA_PHONE_ID`, `WA_META_APP_SECRET` in deploy secrets). |
| **LinkedIn** | excluded | Confirmed no company page; matches Carlos's preference | Stays excluded. |

**Net effect:** the May 4–24 cycle ships through email + Instagram (after branding). Twitter and WhatsApp re-enter the playbook only after the prerequisites in §9 are met.

---

## 1. Email Broadcasts (replaces v1 §1 Twitter threads)

Send via the existing `email_sequence_queue` infrastructure (`api-php/lib/email-sequences.php` → `seq_enroll()`). Use `email-templates/_base.html` layout. Segment: warm prospect list filtered to `niche=law_firms` + audit-requesters + free-trial users.

### Email 1: Law Firm AEO Strategy
**Source:** `law-firm-aeo-strategy.html`
**Send date:** May 4, 2026, 10:00 AM PT
**Subject:** The 4 things AI engines look at before citing a law firm
**Preheader:** Schema, content depth, reviews, jurisdiction. The firms doing all four are getting the calls.

> Most law firms are losing inquiries to ChatGPT and Perplexity — not because their content is bad, but because AI engines don't know how to cite them.
>
> The firms winning right now are doing four specific things:
>
> 1. Publishing **jurisdiction-specific process guides** ("What to expect in a [practice area] case in [state]")
> 2. Adding **Attorney schema** — bar membership, practice areas, credentials
> 3. Building **FAQ blocks** with 12+ Q&A items per practice area
> 4. Collecting **reviews at scale** (200+ recent beats 80 reviews 3.2x for AI citation rate)
>
> The fixes aren't hard. FAQPage on 5 pages: 2 hours. Missing schema fields: 1 hour. One jurisdiction guide per quarter: 4–6 hours/month. Firms moving first on these in 2026 will own AI citation by 2027.
>
> Full breakdown: https://netwebmedia.com/blog/law-firm-aeo-strategy.html
>
> What's blocking your firm? Reply and let me know.
>
> — Carlos

---

### Email 2: Law Firm Audit Findings
**Source:** `law-firm-audit-findings-2026.html`
**Send date:** May 11, 2026, 10:00 AM PT
**Subject:** We audited 50 law firms. Here's where they're invisible to AI.
**Preheader:** 78% missing FAQPage. 62% no Attorney schema. The gap is closing fast.

> Real audit data just landed. We reviewed 50 law firm websites for AEO readiness. The gaps:
>
> - **78%** lack FAQPage schema (invisible for common legal questions)
> - **62%** have zero Attorney schema (3.8x fewer citations)
> - **91%** publish only generic practice pages (no jurisdiction content)
> - **68%** have under 100 reviews (3.2x lower conversion vs. 200+)
>
> The fixes are simple. FAQPage on 5 pages takes 2 hours. Schema cleanup is 1 hour. One jurisdiction-specific guide per quarter is 4–6 hours/month.
>
> Firms moving on this in 2026 will own AI visibility by 2027. Full audit data:
>
> https://netwebmedia.com/blog/law-firm-audit-findings-2026.html
>
> Want a free AEO audit on your own site? Reply and we'll run one.
>
> — Carlos

---

### Email 3: Local SEO vs AEO
**Source:** `law-firm-local-seo-vs-aeo.html`
**Send date:** May 18, 2026, 10:00 AM PT
**Subject:** Local SEO or AEO? Here's the answer (and the order)
**Preheader:** Local is 80% of the channel right now. AEO is 18% growing 40% YoY. Here's where to start.

> Quick clarity on the question we get weekly: should we focus on Local SEO or AEO?
>
> Answer: both. But the ranking is clear.
>
> **Local SEO** (Google Maps + local pack) drives **80%** of law firm visibility right now. High intent. 18–35% conversion. Keep building that.
>
> **AEO** (ChatGPT, Perplexity, Gemini) is **18%** of informational search traffic and growing 40% YoY. Less location-dependent. Advantage goes to firms publishing deep, authoritative content first.
>
> One jurisdiction-specific guide ("Divorce in California: 7-step timeline") works for both. But execution differs. Local needs location pages per state. AEO rewards depth.
>
> Decision tree:
> - Single location + walk-in traffic? Local SEO first.
> - Multi-state + referrals? Lead with AEO.
> - 8+ attorneys? Both in parallel.
>
> Full breakdown: https://netwebmedia.com/blog/law-firm-local-seo-vs-aeo.html
>
> — Carlos

---

## 2. Instagram Carousel Scripts

**STATUS: Gated on profile branding — see §9 prerequisite #1.**

The carousels below are publication-ready but MUST NOT post until the Instagram profile is branded. Posting branded content into an unbranded shell tanks engagement and signals amateurism.

### Carousel 1: Law Firm AEO Strategy

**Slide 1: Hook**
Headline: "Why Law Firms Lose in ChatGPT"
Body: AI answer engines are the new client sourcing channel. Firms showing up in those answers get the calls. Most law firms don't.
Visual: Dark navy bg, white text, orange accent line

**Slide 2: The Problem**
Headline: "Legal Content Has a Higher Bar"
Body: Legal queries are high-intent. AI engines cite sources that prove authority. Domain strength + credentials + trust signals = citations.
Visual: Navy bg, 3 credential icons (gavel, checkmark, badge) in orange

**Slide 3: What Wins**
Headline: "4 Content Types Get Cited"
Body: Process guides. Cost explainers. FAQ blocks. Jurisdiction-specific guides. Not generic practice pages.
Visual: Light cards with numbered list on navy bg

**Slide 4: Schema Matters**
Headline: "Attorney Schema = 3.8x More Citations"
Body: Bar membership. Practice areas. Jurisdictions. Author credentials. This signals legitimacy to AI.
Visual: Code bracket visual + orange accent

**Slide 5: Reviews Drive Citations**
Headline: "80 Reviews > 20 Reviews"
Body: 200+ recent reviews = 3.2x citation rate vs. under-100 firms. Review velocity is an AEO signal.
Visual: 5-star icon in orange, simple graph shape

**Slide 6: Quick Wins**
Headline: "2 Hours to Start"
Body: Add FAQPage to 5 pages. Fill missing schema fields. Publish 1 jurisdiction guide. That's the entry.
Visual: Timer icon in orange, checkmarks on navy

**Slide 7: CTA**
Headline: "Read the Full Strategy"
Body: netwebmedia.com/blog/law-firm-aeo-strategy.html. Free playbook inside.
Visual: Navy button, orange text + arrow, clear URL

---

### Carousel 2: Law Firm Audit Findings

**Slide 1: Hook**
Headline: "We Audited 50 Law Firms"
Body: Here's what 50 law firm audits revealed about AEO readiness in 2026.
Visual: Navy bg, white text, "50" in large orange numerals

**Slide 2: The Crisis**
Headline: "78% Missing FAQPage"
Body: 39 out of 50 firms are invisible for common legal questions. FAQPage is the single highest-ROI markup.
Visual: Navy bg, large "78%" in orange, graph shape downward

**Slide 3: Schema Gap**
Headline: "62% No Attorney Schema"
Body: No bar membership listed. No practice areas declared. Result: 3.8x fewer AI citations.
Visual: Orange card, "62%" callout, credentials icon

**Slide 4: Content Problem**
Headline: "91% Are Generic"
Body: Boilerplate practice pages only. No jurisdiction guides. No step-by-step process. No competitive edge.
Visual: Navy bg, 3 document icons in orange, "Generic" label

**Slide 5: Review Weakness**
Headline: "68% Under 100 Reviews"
Body: Under-100 review firms convert at 1/3 the rate of 200+ firms. That's a 3.2x gap.
Visual: Orange stars, declining chart

**Slide 6: The Fix is Simple**
Headline: "3 Moves. Fast Wins."
Body: FAQPage markup: 2 hours. Schema cleanup: 1 hour. 1 jurisdiction guide: 4–6 hours/month. That's it.
Visual: Checkmarks, timer icon in orange, navy bg

**Slide 7: CTA**
Headline: "Get the Full Audit Data"
Body: netwebmedia.com/blog/law-firm-audit-findings-2026.html
Visual: Navy button, orange text + arrow

---

### Carousel 3: Local SEO vs AEO

**Slide 1: Hook**
Headline: "Local SEO or AEO?"
Body: Both. Here's where to start first.
Visual: Navy bg, white text, split orange/blue accent

**Slide 2: Local SEO = 80%**
Headline: "The Dominant Channel (Now)"
Body: Google Maps + local pack still drives 80% of law firm visibility. High intent. 18–35% conversion.
Visual: Google Maps pin in orange, "80%" callout

**Slide 3: AEO = 18% Growing**
Headline: "The Fast-Growing Channel"
Body: ChatGPT, Perplexity, Gemini. 40% YoY growth. Less geography-dependent. Authority-first advantage.
Visual: AI chat bubble icons, "40% YoY" in orange

**Slide 4: The Overlap**
Headline: "Jurisdiction Guides Work for Both"
Body: "Divorce in California: 7-step timeline" ranks locally AND gets cited by AI.
Visual: Orange bracket showing shared territory, navy bg

**Slide 5: Local vs AEO Focus**
Headline: "What Each Cares About"
Body: Local: GMB, reviews, citations. AEO: Schema, credentials, E-E-A-T.
Visual: Two columns, navy bg, checkmarks in orange

**Slide 6: Decision Tree**
Headline: "Where to Start"
Body: Single location? Local first. Multi-state? AEO first. 8+ attorneys? Both in parallel.
Visual: Simple tree diagram, orange accents

**Slide 7: CTA**
Headline: "Read the Full Decision Tree"
Body: netwebmedia.com/blog/law-firm-local-seo-vs-aeo.html
Visual: Navy button, orange arrow

---

## 3. Email Follow-up Broadcasts (replaces v1 §3 WhatsApp)

A second touch on the same warm-prospect list, shorter and more conversational. Send 3 days after the corresponding email in §1. Use the same `seq_enroll()` mechanism.

### Follow-up 1: Law Firm AEO Strategy
**Send date:** May 7, 2026, 10:00 AM PT
**Subject:** Did you catch this? The 4 moves law firms are using to get cited
**Preheader:** Quick recap. 2 hours of work to start. 4 moves total.

> Quick follow-up in case the strategy post got buried earlier this week.
>
> The four AEO moves we shared: jurisdiction process guides, Attorney schema, FAQ blocks, review velocity.
>
> The fastest entry point: add FAQPage schema to your top 5 practice area pages. 2 hours of work, immediate impact on how AI engines parse your content.
>
> Full post: https://netwebmedia.com/blog/law-firm-aeo-strategy.html
>
> Reply if you want us to run a free FAQPage audit on your site.
>
> — Carlos

---

### Follow-up 2: Law Firm Audit Findings
**Send date:** May 14, 2026, 10:00 AM PT
**Subject:** The 4 stats from our 50-firm audit (worth re-reading)
**Preheader:** 78% missing FAQPage. 62% no Attorney schema. 91% generic. 68% under-reviewed.

> If you missed the audit data we published Monday, here are the four numbers worth remembering:
>
> - 78% lack FAQPage schema
> - 62% have no Attorney schema
> - 91% publish only generic practice pages
> - 68% have under 100 reviews
>
> Firms in the top 10% of any one of these metrics are pulling away from the rest. By 2027 the gap will be impossible to close.
>
> Full data: https://netwebmedia.com/blog/law-firm-audit-findings-2026.html
>
> — Carlos

---

### Follow-up 3: Local SEO vs AEO
**Send date:** May 21, 2026, 10:00 AM PT
**Subject:** The decision tree, in 4 lines
**Preheader:** Local first if you're single-location. AEO first if you're multi-state.

> Decision tree from this week's post, distilled:
>
> - Single location + walk-in traffic? **Local SEO first.**
> - Multi-state + referrals? **Lead with AEO.**
> - 8+ attorneys? **Both in parallel.**
> - Solo practitioner? **Local SEO + one AEO pillar piece per quarter.**
>
> Full breakdown: https://netwebmedia.com/blog/law-firm-local-seo-vs-aeo.html
>
> — Carlos

---

## 4. Repurposing Templates (Reusable System)

Use these templates for any future NWM blog post → social/email conversion.

### Email Broadcast Template
**Length:** 130–220 words
**Tone:** Peer-to-peer, direct, signed by Carlos
**Subject line:** Lead with the data point or the contrarian claim. Avoid clickbait.
**Preheader:** One line that earns the open without repeating the subject.
**Body structure:**
1. Hook (1–2 sentences): the framing or contrarian angle
2. Data (3–4 bullets or short paragraphs): the evidence
3. So what (1 sentence): why it matters
4. Action (1 sentence): the next step
5. Link: blog URL, plain (no UTM in body — append at send-time)
6. Soft CTA: "Reply if…" or "Let me know what comes up."

**Copy rules:**
- Contractions encouraged
- No emojis (brand uses text-based directness)
- One clear link near the end
- Sign as "— Carlos" (peer-to-peer, not "The NetWebMedia Team")
- Test rendering in Gmail mobile + Outlook desktop before sending

---

### Instagram Carousel Template

**Slide 1 (Hook):** 8-word headline + 15-word body + visual direction
**Slides 2–6:** Key insights (one per slide), 6-word headline + 20-word body
**Slide 7 (CTA):** URL only + visual call-to-action

**Visuals:**
- Slide 1: Navy dark navy bg (#010F3B), white text, one orange accent element
- Slides 2–6: Data slides use orange (#FF671F) for stats, navy for backgrounds; insight slides use card layout on navy with orange borders
- Slide 7: Navy button visual, orange text, clear URL

**Copy rules:**
- Headline is scannable (headline case)
- Body is 1–2 sentences max
- Every slide should stand alone (muted on scroll)
- Never more than 7 slides
- CTA is always the last slide

---

### Twitter/X Thread Template (DEFERRED)

Held in reserve. If Carlos claims `@netwebmedia` on X (see §9), reactivate using v1 of this doc — the original thread copy is preserved in git history at commit `0211282f4`.

### WhatsApp Broadcast Template (DEFERRED)

Held in reserve. Reactivate when Meta WABA verification completes for a NetWebMedia-owned number (NOT the Twilio sandbox). The original WA copy is preserved in git history at commit `0211282f4`.

---

## 5. Content Calendar: 3-Week Publication Schedule (v2)

### Week 1 (May 4–10, 2026)

| Date | Format | Topic | Asset | Status | Lead |
|------|--------|-------|-------|--------|------|
| May 4 | Email Broadcast | AEO Strategy | Email #1 to warm law-firm segment | Draft | content-strategist |
| May 4 | Instagram Carousel | AEO Strategy | 7-slide deck | **GATED on §9.1** | creative-director |
| May 7 | Email Follow-up | AEO Strategy | Short recap email | Draft | content-strategist |

### Week 2 (May 11–17, 2026)

| Date | Format | Topic | Asset | Status | Lead |
|------|--------|-------|-------|--------|------|
| May 11 | Email Broadcast | Audit Findings | Email #2 to warm law-firm segment | Draft | content-strategist |
| May 11 | Instagram Carousel | Audit Findings | 7-slide data carousel | **GATED on §9.1** | creative-director |
| May 14 | Email Follow-up | Audit Findings | 4-stat recap | Draft | content-strategist |
| May 15 | Instagram Story | Audit Findings | 3-slide stats story | **GATED on §9.1** | creative-director |

### Week 3 (May 18–24, 2026)

| Date | Format | Topic | Asset | Status | Lead |
|------|--------|-------|-------|--------|------|
| May 18 | Email Broadcast | Local SEO vs AEO | Email #3 to warm law-firm segment | Draft | content-strategist |
| May 18 | Instagram Carousel | Local SEO vs AEO | 7-slide comparison deck | **GATED on §9.1** | creative-director |
| May 21 | Email Follow-up | Local SEO vs AEO | Decision tree distilled | Draft | content-strategist |

---

## 6. Distribution & Send Notes

### Email
- Send Tuesday 10 AM PT (highest open rates for SMB legal audience)
- Segment: `niche=law_firms` AND (`audit_requester=true` OR `free_trial_user=true` OR `tag=warm`)
- Use existing `email_sequence_queue` cron — schedule enrolment 30 min before send time
- Resend (the ESP) auto-handles bounces, complaints, unsubscribes
- Monitor: open rate, CTR, unsubscribe rate, reply count
- Pause-trigger: unsubscribe rate >2% on a single send → review subject + segment

### Instagram (when ungated)
- Publish carousel as feed post (Wed 10 AM ET)
- 48-hour story repurpose (same data, vertical format)
- Save carousel for repost every 6 weeks (audience overlap is minimal)
- Include link in bio for first 24 hours, then rotate
- Caption copy is same as slide 1 headline + body + CTA link

### Cross-posting Rules
- Never blast the same payload across email + IG on the same hour (looks automated)
- Repackage, don't republish (different headline, different angle, different data lead)
- Each blog post can drive at most 2 emails + 1 carousel + 1 story over a 2-week window

---

## 7. Success Metrics & Reporting

### Email
- **Minimum threshold:** 35% open rate, 8% CTR on primary link, <1% unsubscribe
- **Target:** 45%+ open, 12%+ CTR, <0.5% unsubscribe
- **Report every Monday:** opens, clicks, replies, unsubscribes (pulled from Resend + CRM)

### Instagram (when ungated)
- **Minimum threshold:** 80 views per slide, 3.5% completion rate (slide 7 views vs slide 1)
- **Target:** 150+ views per slide, 6%+ completion
- **Report every Monday:** reach, engagement rate, CTR from link in bio

### Blog traffic from these channels
- **Minimum:** 15% of blog traffic from email + IG combined
- **Target:** 25%+
- **Report monthly via GA4:** utm_source=email, utm_source=instagram

---

## 8. Voice Guardrails for This Cluster

- **Sharp, not snarky.** "78% of firms are missing this" is fine. "LOL firms be sleeping on schema" is not.
- **Specific data always beats clever wordplay.** A number or stat wins every time.
- **No hedging.** "Most law firms could benefit from..." → "Law firms are losing visibility because..."
- **Active voice mandatory.** "Schema is missing" → "You're missing schema."
- **Citations lead insights.** Start with the stat, then explain why it matters. Reverse order = preaching.

---

## 9. Prerequisites to Reactivate Deferred Channels

### 9.1 Instagram profile branding (BLOCKS §2 carousels)
- Change display name from "Carlos Martinez" to "NetWebMedia"
- Apply Navy/Orange brand avatar (use logo from `/assets/nwm-logo.svg`)
- Set bio link to `https://netwebmedia.com`
- Post 2–3 evergreen brand-intro carousels BEFORE the campaign launch so the May 4 cycle doesn't land on an empty grid
- Owner: creative-director + Carlos. Target: complete by May 3, 2026.

### 9.2 X / Twitter handle decision (BLOCKS reactivating §1 threads)
- Decide whether to claim `@netwebmedia` on X
- If yes: register, brand the profile (same Navy/Orange + bio + link), post 5 evergreen tweets to establish the account, THEN reactivate v1 thread schedule
- If no: this section stays deferred indefinitely; the email lane in §1 covers the same content
- Owner: Carlos. Target decision date: May 8, 2026.

### 9.3 WhatsApp Business verification (BLOCKS reactivating §3 broadcasts)
- Provision a NetWebMedia-owned phone number (not the Twilio sandbox)
- Complete Meta WABA verification (Business Manager + display name approval)
- Build a broadcast list of opted-in recipients (existing audit-requesters can opt in via a simple form)
- Wire the verified `WA_PHONE_ID` to `deploy-site-root.yml` GitHub Secrets
- Owner: engineering-lead + Carlos. Target: June 1, 2026.

---

## Footnotes

**Scheduling tool:** Email sends via the existing `email_sequence_queue` cron (api-php). Instagram uses Buffer when ungated.

**Brand asset library:** All colors (#010F3B navy, #FF671F orange, #4A90D9 blue) pulled from `/plans/brand-book.html`. Font: Poppins (display), Inter (body).

**Approval flow:** Content Strategist drafts, Creative Director approves visuals, CEO approves any claim >5% or comparison to competitors.

**Frequency after Week 3:** Continue this cycle every 2 weeks (one new blog post per cycle), targeting 3 emails + 1 carousel per post. Reduce frequency if open rate drops below 30% or unsubscribe rate exceeds 2%.

---

**Document version:** 2.0 | **Created:** May 1, 2026 | **Owner:** content-strategist agent | **Last updated:** May 1, 2026 (v2 channel reality)

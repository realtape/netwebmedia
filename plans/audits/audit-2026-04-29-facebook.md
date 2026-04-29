# NetWebMedia Facebook Audit — April 29, 2026

**Current state:** NetWebMedia's Facebook page (33 followers, ID: 61573687500626) has zero published posts, no visible cover image, and zero Meta Pixel implementation. It is a dormant asset with foundation built — the page exists but has not been activated. This is recoverable. The five staging posts are ready in `.tmp_social/`.

---

## Current Page Setup vs. What Works

**What's in place:**
- Page exists and is verifiable (33 followers = signal of legitimacy, not liability)
- Staging content (3 posts + 2 about descriptions) written to brand voice and ready to paste
- Logo assets available for profile picture
- No contradictory messaging to clean up

**What's missing — gaps that cost visibility:**

| Gap | Impact | Fix |
|-----|--------|-----|
| **No cover image** | 33 followers see a blank header. Signals abandonment. | Generate from prompt in social-starter-content.md (E.1) or use existing brand asset. 1640×624px. |
| **Category still "Internet company"** | Meta's discovery algorithm doesn't route SMB prospects to "Internet company" pages. | Change to "Marketing Agency" in Page Settings → Edit Page Info → Categories. 5 minutes. |
| **No About fields filled** | The short (255 char) and long (750+ char) descriptions are written and ready but not pasted. | Paste fb_about_short.txt and fb_about_long.txt into About → Short Description and Long Description. 5 minutes. |
| **No services tab** | SMBs looking for "AI marketing" or "CRM services" won't find NWM via Services discovery. | Add Services tab (Page → Edit Page Info → Services) listing 10 service types from social-starter-content.md, Section C. |
| **No CTA button** | Page has no primary action. Visitors can only click Follow. | Set "Send Message" CTA → route to email (hello@netwebmedia.com) or WhatsApp (+1-415-523-8886). |
| **Zero Meta Pixel** | Can't run Facebook ads, retargeting, or conversion tracking. Cannot close the loop from impression to lead. | Install Meta Pixel on netwebmedia.com root (already built in BRAND.md approach: async-first means pixel tracks form submits + contact CTAs). Deployment: 30 minutes. |
| **No engagement ladder** | 3 posts sit in staging; none are live. Algo treats new pages as test content if posting is sporadic. | Publish all 3 posts in bulk (they span AEO education, social proof, case study). Then commit to 1–2 posts per week minimum to signal active channel. |

---

## Content Audit: Staged vs. Industry Standard

The three staged Facebook posts are **strategically sound** but face a **cadence problem**.

**Staged content quality:**
- **Post 1 (relaunch announcement):** Leads with differentiation ("AI citations, not Google ranks"). Niche-specific callout (law firm, restaurant, real estate). CTA is concrete ("Free 48-hour audit"). Matches BRAND.md Voice Principle 1 (outcome-led). ✓
- **Post 2 (value-first education):** Teaches E-E-A-T signals and FAQ schema without requiring a purchase. Generously positions "you can start today even if you don't hire us." High credibility for a new page. ✓
- **Post 3 (case study):** +71% lift in qualified consults is specific and impressive. Names the vertical (law firm, Texas). Shows bilingual edge. Concrete result, not vanity metric. ✓

**Content cadence target vs. reality:**
- **Industry standard (HubSpot data, 2026):** 6–10 posts per week locks in reach; 11+ posts per week generates nearly 3x engagement per post vs. once weekly.
- **NWM current plan:** 0 posts published + 3 staged = will launch at ~1–2 per week if done manually.
- **The gap:** If NetWebMedia posts only once a week after launch, the page will underperform its own content quality. The brand voice is sharp — the distribution rhythm needs to match.

**Recommendation:** Publish all 3 staged posts in the first 5 days (staggered: Day 1, Day 2, Day 4). This creates visible momentum and signals to the algorithm that the page is active. Then establish a **minimum 2 posts per week** rhythm for Q2 (April–June 2026). At 2 posts/week on a fresh 33-follower page, you'll hit 100+ followers by end of Q2 if the content stays strategic.

---

## Ad Strategy Gap: The Pixel Problem

This is the critical blocker for growth past organic reach.

**Current state:** No Meta Pixel deployed. This means:
- Cannot run retargeting campaigns (cold leads from audits cannot be re-engaged on Facebook).
- Cannot optimize for conversions (Meta's algorithm cannot see what action matters to you — form submit vs. visit vs. bounce).
- No audience overlap insights (cannot build lookalike audiences from best customers).
- April 2026 Meta updates (AI-enhanced Pixel + one-click Conversions API) cannot be leveraged.

**What the competitor stack looks like:**
- HubSpot, Zapier, GoHighLevel all run dual-layer tracking: Pixel + Conversions API. This gives the algorithm 17.8% better cost-per-result on average (per 2026 Meta data).
- GoHighLevel's 2026 Social Planner integrates Facebook posting + Pixel tracking + lead routing directly into their white-label platform. That's the competitive bar.
- NetWebMedia's async-first model (no phone calls, email/WhatsApp only) is *ideally suited* to pixel tracking because all conversions happen off-platform (form submit on site → email follow-up → CRM logging). The Pixel sees this.

**Why this matters for SMBs:** Most SMB owners are currently shopping for marketing services on Facebook. They see an ad for "AI marketing audit," click, land on netwebmedia.com, abandon the form, then leave. Without retargeting, they're gone forever. With Pixel + Conversions API, they see a follow-up ad 3 days later ("Still thinking about your audit?") and many re-engage.

**Implementation path:**
1. Place Meta Pixel ID in netwebmedia.com `<head>` (standard GA4-style tag).
2. Configure two conversion events: (a) "Audit Request Form" (form submit), (b) "Contact Inquiry" (WhatsApp/email click).
3. Enable Conversions API via Meta's hosted option (no dev work required — Meta handles server-side after April 2026 update).
4. Test with $50–$100 test spend on a lead-gen campaign targeting US SMBs in targeted verticals (law firms, restaurants).
5. Collect 50+ conversions before scaling; let Meta's algo optimize delivery.

Ownership: This is a product-manager or developer task. Current timeline: blocked.

---

## 30/60/90-Day Plan: Zero to Credible US SMB-Facing Presence

### Days 0–30 (May 1–31, 2026): Foundation & Initial Momentum

| Task | Owner | Effort | Result |
|------|-------|--------|--------|
| Paste About fields (short + long) | Carlos | 5 min | Page About section complete. |
| Change category to "Marketing Agency" | Carlos | 5 min | Discovery algorithm can target SMB prospect keywords. |
| Generate + upload cover image (1640×624) | Designer or Claude | 15 min | Professional visual (dark navy + orange) replaces blank header. |
| Add Services tab with 10 service entries | Carlos | 10 min | SMBs searching "AI marketing" can see what NWM offers. |
| Install Meta Pixel on netwebmedia.com | Engineering/Product | 30 min | All conversions (form submits, contact clicks) tracked. |
| Publish Post 1 (relaunch announcement) | Carlos | 5 min | Live post, pinned to top. Signals page is active. |
| Publish Post 2 (AEO education) + Post 3 (case study) | Carlos | 5 min | 3 posts live within first week. Creates visible momentum. |
| Set up "Send Message" CTA button | Carlos | 5 min | Visitor → email/WhatsApp routing works. |
| **Engagement target end of 30 days** | — | — | 50–75 new followers (organic growth from 3 posts). Zero ads running yet. |

**Messaging focus, days 0–30:** "We exist. We're serious. Here's proof (case study)." This phase builds credibility, not yet demand.

### Days 31–60 (June 1–30, 2026): Paid Activation & Community Building

| Task | Owner | Effort | Result |
|------|--------|--------|--------|
| Launch test Meta ad campaign: "AI Marketing Audit" | Carlos + Designer | 2 hours | $50–$100 spend targeting SMBs in target verticals. Lead-gen form. |
| Publish Post 4 (proof carousel — 5 stats) + Post 5 (BTS) | Carlos | 10 min | Increase organic cadence to 2 posts/week. |
| Engage on 2–3 comments per post per day | Community Manager | 15 min/day | Respond to inquiries within 24 hours (async promise in BRAND.md). |
| Seed 5 Q&A pairs via Facebook's "Q&A" tab | Carlos | 15 min | "What's AEO?" / "What industries do you serve?" answered proactively. |
| Monitor Pixel data: which pages drive audits? | Product/Analytics | 30 min | Inform next ad creative based on what converts. |
| **Engagement target end of 60 days** | — | — | 150–250 followers (organic growth + ad-driven awareness). 5–10 qualified leads from paid spend. Pixel data informs next quarter. |

**Messaging focus, days 31–60:** "We're not generic. We specialize in [your vertical]. Watch what we did for a law firm." This phase tests paid spend and builds repeatable unit economics.

### Days 61–90 (July 1–31, 2026): Retargeting & Scale

| Task | Owner | Effort | Result |
|------|--------|--------|--------|
| Launch retargeting campaign: warm audiences from first 60 days | Carlos + Designer | 2 hours | Re-engage 30–50% of form abandoners at lower CPC. |
| Publish 2 posts/week: mix of education, proof, behind-the-scenes | Carlos | 30 min/week | Sustain 200–300 follower base. Organic reach begins compounding. |
| Introduce "Client Win" posts (anonymized): screenshot of ROI dashboards, stat increases | Designer | 1 hour per post | Builds social proof for followers considering NetWebMedia. |
| Test vertical-specific content (law firm AEO tips → lawyers, restaurant schema → restaurants) | Carlos | 2 hours planning | Segment audience. Increase relevance. Higher engagement. |
| Create "Ask me anything" (AMA) thread or biweekly live Q&A (async: recorded, uploaded as Reel) | Carlos | 1 hour per month | Community building. Demonstrates expertise. Feeds TikTok/YouTube in Phase 2. |
| **Engagement target end of 90 days** | — | — | 400–600 followers. 20–40 qualified leads from combined organic + paid. Pixel tracking shows 1.5–2% form completion rate (industry avg: 1%). |

**Messaging focus, days 61–90:** "We're not a one-hit wonder. We've solved this for [vertical A], [vertical B], [vertical C]." This phase shifts from awareness to authority.

---

## One Critical Risk: The 18-Month Silence Problem

NetWebMedia has a reputation liability that a new Facebook presence exposes: **the page was created and abandoned for 18 months** (late 2024 → April 2026). If Carlos launches the page now with aggressive organic posting, old followers (some of whom may be prospects from 18 months ago) will ask: "Where have you been?"

**How to address this:**
1. **Lean into the comeback narrative.** Post 1 literally says "The page is back, and so is everything we've been quietly shipping for the last 18 months." This frames the absence as intentional preparation, not neglect.
2. **Don't overexplain.** The BRAND.md voice is direct, not apologetic. No "We apologize for the silence" or "We've been super busy." Just: "We were building something worth talking about."
3. **Prove the claim with content.** The three staged posts (case study, E-E-A-T framework, AEO education) must land immediately to show "we ship." The absence credibility window closes after the first 10 posts go live. Miss this and the comeback narrative dies.

**Risk if ignored:** Followers see an inactive page suddenly springing to life, assume it's either automated or a revived shell, and don't engage. Page activity looks inorganic without a strong relaunch signal.

---

## Summary: State → Path → Signal

| Dimension | State (today) | Path (90 days) | Signal |
|-----------|--------------|---------|--------|
| **Followers** | 33 (dormant) | 400–600 (organic + paid) | "This is a real, active marketing channel." |
| **Posts published** | 0 | 20–25 (2/week cadence) | "NetWebMedia posts regularly with sharp, niche-specific content." |
| **Conversion tracking** | None | Pixel + CAPI live, 1.5–2% form completion rate | "Leads can be retargeted and attributed to Facebook spend." |
| **Vertical specificity** | Generic "AI marketing" | Targeted: law firm + restaurant + real estate wins | "If you're a [vertical], this agency knows your problem." |
| **Paid spend** | $0 | $50–$100/month test → $200–$500/month if profitable | "NetWebMedia invests in reaching SMBs where they already are." |

---

## What to Do This Week (Days 1–5)

1. **If not done yet:** Paste fb_about_short.txt and fb_about_long.txt into Facebook Page → About → Short Description / Long Description. (5 min)
2. **Change category** to "Marketing Agency" (Page Settings → Edit Page Info). (5 min)
3. **Generate cover image** from prompt E.1 in social-starter-content.md (1640×624px, navy + orange + abstract circuit design). (15 min or outsource)
4. **Upload cover + set profile picture** to existing NWM logo. (5 min)
5. **Publish Post 1** (relaunch announcement) pinned to top. (5 min)
6. **Queue Posts 2 + 3** for Days 2 and 4. (5 min)
7. **Brief engineering/product owner** on Pixel implementation. ETA: first week of May. (30 min planning)

**Total effort: ~2 hours.** No ads yet. Just activate the foundation and prove the page is alive.

---

## Bottom Line for Carlos

The Facebook page is **not a failure** — it's a **sleeping asset**. The 33 followers are less a liability and more a baseline. The staging content is strong and on-brand. What's missing is rhythm and conversion infrastructure.

The biggest risk is not *being* on Facebook; it's being *invisible on* Facebook. Meta's algorithm is ruthless about inactive pages. If you publish 3 posts and then silence for 6 weeks, the page fades from follower feeds. The plan above fixes this by front-loading momentum (posts 1–3 in week 1) and establishing rhythm (2/week thereafter) and paid activation (test spend in week 5+).

One insight worth noting: NetWebMedia's async-only model is **ideal** for Facebook because Facebook users are typically making buying decisions alone, on their own time, while browsing the feed. They fill out the form when ready. The pixel captures that moment. No phone calls needed. You're selling the exact service model that works on Facebook. Use that advantage.


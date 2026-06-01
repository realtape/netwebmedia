# NetWebMedia — Social Presence + Local SEO Action Plan
**Owner:** Carlos Martinez
**Drafted by:** CMO, NetWebMedia
**Date:** 2026-04-28 (updated post-reality-check 2026-04-28 PM)
**Status:** Superseded by `plans/social-starter-content.md` for execution. This file kept for strategic reasoning + decision history.

> **UPDATE 2026-04-28 PM** — Carlos shared screenshots confirming actual state:
> - **Facebook page IS live** (NetWebmedia, 33 followers, NWM logo, "Internet company" category) → flipping decision from KILL to **KEEP + POST**.
> - **Instagram @netwebmedia IS reserved** (Carlos Martinez account, 0 posts) → CLAIM+POST as planned.
> - **YouTube + TikTok status unverified** → defer Phase 2; do **not** include in `sameAs` until content ships.
> - **Search Console verified on netwebmedia.com** → GMB instant-verify path is open.
>
> The site's Organization `sameAs` array has been re-shipped with **only the two real URLs** (IG + FB). Schema no longer points at ghost handles.
>
> **Ready-to-paste content lives in `plans/social-starter-content.md`.** Use that for execution; this file remains the strategic rationale.

---

## 1. Executive Summary

NetWebMedia's `Organization` JSON-LD declares `sameAs` links to Instagram, YouTube, Facebook, and TikTok handles that **do not exist as live profiles** — every AI engine and crawler that follows those links hits a dead end, which actively degrades trust signals at the exact moment we are asking ChatGPT, Claude, Perplexity, and Google AI Overviews to cite us. On top of that, **zero Google Business Profile** means we are invisible for the local-intent queries that drive 7 of our 14 target niches (restaurants, beauty, health, real_estate, automotive, home_services, local_specialist) — a category of demand we currently forfeit to every competitor. The 30-day fix: claim IG + YT + GMB, kill FB and X from the schema, ship a 5-post baseline on each live channel, verify GMB, and re-deploy a clean `sameAs` array — all in under 18 hours of work or roughly USD 900 outsourced.

---

## 2. Channel-by-Channel Decision Matrix

| Channel | Decision | Rationale | Carlos's exact step |
|---|---|---|---|
| **Instagram** `@netwebmedia` | **CLAIM + POST** | Highest visual ROI for agency portfolio; AEO engines weight IG bio + recent posts as identity confirmation. Required to back the schema claim. | Go to instagram.com/accounts/emailsignup → register `netwebmedia` with hello@netwebmedia.com → set bio per §3 → upload logo + first post within 48h. |
| **YouTube** `@netwebmedia` | **CLAIM + POST (Shorts)** | YouTube is the #2 search engine and a direct AEO citation source for Google AI Overviews. Shorts are cheap to produce and compound. | Go to youtube.com → sign in with Google account tied to hello@netwebmedia.com → Create Channel → claim handle `@netwebmedia` → upload banner + 5 Shorts (§4). |
| **TikTok** `@netwebmedia` | **CLAIM-ONLY** | Defensive claim to prevent squatters; we have no realistic content cadence yet. Empty profile is worse than no profile, so leave it OFF the schema until we ship content. | tiktok.com/signup → claim `@netwebmedia` → set bio + logo → **do not link from schema** until we ship content (Q3 2026 reassessment). |
| **X / Twitter** `@netwebmedia` | **KILL — never was on schema, do not add** | Negative signal-to-noise for B2B agency in 2026; AEO engines deprioritize X content for citations. Not worth the maintenance tax. | No action. Confirm not in `sameAs`. |
| **Facebook** `/netwebmedia` | **KILL + REMOVE FROM SCHEMA** | FB has near-zero weight as an AEO trust signal for B2B agencies; maintaining a ghost page is brand debt. We can spin one up later if a paid-social play demands it. | Remove the FB URL from `index.html` `sameAs` array (see §6). Do not create the page. |
| **Google Business Profile** | **CLAIM + VERIFY (priority 1)** | Unlocks local pack visibility for 7 of 14 niches and is the single highest-leverage move in this plan. Free, takes 20 minutes to set up, 5–14 days to verify. | business.google.com → "Manage now" → enter "NetWebMedia" → service-area business → fill spec in §5 → submit verification. |

---

## 3. Bio Templates (Ready to Paste)

### Instagram — `@netwebmedia`
- **Bio (148 chars):** `AI-native marketing agency. We build AEO-first websites + AI SDR systems for SMBs across 14 industries. Get cited by ChatGPT, Claude, Perplexity.`
- **Link in bio:** `https://netwebmedia.com`
- **Profile image:** NWM monogram on Navy `#010F3B`, 320x320px, centered.
- **Cover/Grid direction:** Alternating Navy and Orange `#FF671F` tiles. First 9 posts form a coherent grid: 3x logo-mark posts, 3x client-result cards, 3x "What is AEO?" educational cards.

### YouTube — `@netwebmedia`
- **Channel description (149 chars):** `AEO-first marketing for SMBs. Short, sharp tactics on getting cited by ChatGPT, Claude, Perplexity, and Google AI Overviews. New Shorts weekly.`
- **Link:** `https://netwebmedia.com`
- **Profile image:** Same monogram as IG (consistency = trust signal).
- **Banner (2560x1440):** Navy background, Orange tagline "Get cited, not just ranked." Right side: rotating logos of 14 niches as small icons.

### TikTok — `@netwebmedia` (claim-only, minimal)
- **Bio (140 chars):** `AI-native marketing. We make small businesses unmissable to ChatGPT and Google AI. Site → netwebmedia.com`
- **Link:** `https://netwebmedia.com`
- **Profile image:** Same monogram.
- **Banner:** N/A (TikTok has no banner).

---

## 4. Baseline 5-Post Pack (Per Channel)

### Instagram — 5 starter posts

| # | Hook (≤8 words) | Caption (≤150 chars) | CTA | Hashtags | Visual treatment |
|---|---|---|---|---|---|
| 1 | "SEO is dead. AEO won." | Google AI Overviews answer 60% of queries without a click. We optimize for the answer, not the link. | Link in bio | #AEO #AImarketing #SMB #marketingagency #ChatGPT | Navy card, Orange headline, white body. Static. |
| 2 | "Your competitor is in ChatGPT." | If ChatGPT can't cite your business by name, you don't exist to 200M weekly users. We fix that. | DM "AUDIT" | #AEO #localSEO #smallbiz #AIsearch #marketing | Split card: ChatGPT screenshot left, NWM brand right. |
| 3 | "14 niches. One playbook." | Tourism. Restaurants. Real estate. Law. Health. Beauty. We've built the AEO playbook for each. | Link in bio | #marketingagency #SMB #AEO #localmarketing #digitalmarketing | Grid of 14 niche icons on Navy, Orange border. |
| 4 | "AI SDRs don't sleep." | Our AI outbound runs 24/7, books meetings while you're at dinner. Real pipeline. Not vapor. | DM "SDR" | #AISDR #salesautomation #leadgen #B2B #marketing | Short looping video: dashboard with meeting count ticking up. |
| 5 | "Built by Claude. Shipped by us." | NetWebMedia runs on Claude Pro Max + 12 custom AI agents. We eat our own dog food. | Link in bio | #ClaudeAI #AImarketing #anthropic #marketingagency #AEO | Behind-the-scenes shot of Claude terminal in NWM brand colors. |

### YouTube Shorts — 5 starter posts

| # | Hook (≤8 words) | Caption (≤150 chars) | CTA | Hashtags | Visual treatment |
|---|---|---|---|---|---|
| 1 | "How to get cited by ChatGPT." | 3 schema fields most sites are missing. Fix these and AI engines will quote you by name. | Subscribe + link | #AEO #ChatGPT #SEO #SMB #marketing | Carlos to camera, Navy backdrop, 45 sec, Orange lower-third. |
| 2 | "SEO vs AEO in 60 seconds." | SEO ranks pages. AEO gets you quoted. Here's the difference and why it matters in 2026. | Link in description | #AEO #SEO #digitalmarketing #AI #2026 | Split-screen text animation, voiceover. |
| 3 | "Why your GMB is invisible." | 4 mistakes that kill local pack ranking. Fix them this weekend. | Subscribe | #localSEO #GMB #SMB #marketing #google | Screen recording of GMB dashboard with annotations. |
| 4 | "Restaurants: get on AI menus." | When someone asks ChatGPT for dinner, do you show up? Here's how to be the answer. | DM "AUDIT" | #restaurantmarketing #AEO #localSEO #foodbiz #SMB | B-roll of restaurant + ChatGPT answer overlay. |
| 5 | "1 prompt to audit your AEO." | Paste this into Claude or ChatGPT and see if your business gets mentioned. Brutal honesty. | Save the video | #AEO #ChatGPT #Claude #AImarketing #SMB | Carlos demoing the prompt live, screen-share. |

### TikTok — 5 starter posts (same as YouTube Shorts, repurposed)

Re-cut the 5 YT Shorts vertically with TikTok-native captions and trending audio. Hooks identical, captions trimmed to 100 chars, hashtags swap `#smallbusiness #marketingtok #AItools #SEOtips #ChatGPT`. Zero net new production.

---

## 5. GMB Profile Spec

**Setup URL:** business.google.com/create

| Field | Value |
|---|---|
| Business name | `NetWebMedia` |
| Primary category | `Marketing agency` |
| Secondary category 1 | `Internet marketing service` |
| Secondary category 2 | `Website designer` |
| Business type | Service-area business (no public storefront) |
| Service area | United States (national) — add all 50 states |
| Phone | `+1-415-523-8886` |
| Website | `https://netwebmedia.com` |
| Hours | Mon–Fri 9:00 AM – 6:00 PM PT |
| Appointment URL | `https://netwebmedia.com/audit` |
| Languages | English, Spanish |

### Description (744 chars)
> NetWebMedia is an AI-native marketing agency that builds Answer Engine Optimization (AEO) websites and AI sales-development systems for small and mid-sized businesses across 14 industries — tourism, restaurants, health, beauty, law, real estate, automotive, education, weddings and events, financial services, home services, wine and agriculture, local specialists, and general SMB. We help business owners get cited by name in ChatGPT, Claude, Perplexity, and Google AI Overviews — the new front page of the internet. Our work combines schema-rich websites, local SEO, AI SDR outbound, and content built for AI citation. Headquartered in the United States, serving clients nationwide. Free AEO audit available.

### Services (10 to list)
1. Answer Engine Optimization (AEO)
2. Local SEO + Google Business Profile Optimization
3. Website Design and Development
4. AI SDR / Outbound Automation
5. Schema and Structured Data Implementation
6. Content Marketing for AI Citation
7. Fractional CMO Services
8. Niche Landing Page Development
9. Marketing Strategy and Planning
10. Conversion Rate Optimization (CRO)

### 5 Starter Q&A Pairs (seed yourself, then mark as helpful)
1. **Q:** What is Answer Engine Optimization (AEO)?
   **A:** AEO is the discipline of optimizing your website and content so AI engines like ChatGPT, Claude, Perplexity, and Google AI Overviews cite your business by name when users ask related questions. NetWebMedia specializes in AEO for SMBs.
2. **Q:** Do you only work with US-based clients?
   **A:** We primarily serve clients across the United States, with bilingual English/Spanish capability for clients in Latin America. All engagements run remotely.
3. **Q:** What industries do you serve?
   **A:** 14 niches: tourism, restaurants, health, beauty, SMB, law firms, real estate, local specialists, automotive, education, events and weddings, financial services, home services, and wine/agriculture.
4. **Q:** How is NetWebMedia different from a traditional agency?
   **A:** We are AI-native. Our team is 12 custom AI agents plus a human CEO and CMO. That collapses delivery cost and time, which we pass on as faster turnarounds and lower retainers.
5. **Q:** Do you offer a free audit?
   **A:** Yes. Request a free AEO + local SEO audit at netwebmedia.com/audit. Turnaround is 48 hours.

### 3 Starter GMB Posts (≤1500 chars each)

**Post 1 — Offer / What's New**
> **Free AEO Audit — 48-hour turnaround.** If your business doesn't show up when someone asks ChatGPT or Google AI for recommendations in your industry, you're already losing pipeline. NetWebMedia will run a free Answer Engine Optimization audit on your site, schema, and content — and tell you the 3 highest-leverage fixes in 48 hours. No sales call required to receive the report. Request yours: netwebmedia.com/audit

**Post 2 — Update**
> **AI search now drives 200M+ weekly queries.** ChatGPT alone hit 200 million weekly active users. Perplexity, Claude, and Google AI Overviews add hundreds of millions more. If your website wasn't built to be cited by these engines, you're invisible to a third of your future customers. We help small businesses across 14 industries become the answer the AI gives. Learn how: netwebmedia.com

**Post 3 — Event / Webinar**
> **Live workshop: "Get Cited by ChatGPT in 30 Days."** Free 45-minute session covering the 5 schema fixes, 3 content patterns, and 1 backlink play that get small businesses quoted by name in AI engines. For owners and marketing leads of restaurants, real estate firms, law practices, and home services. Register: netwebmedia.com/workshop

### Verification Flow
Service-area businesses in 2026 typically get **video verification** (most common) or **instant verification** if the email domain matches the website (we control hello@netwebmedia.com — try this path first).

1. Submit profile → Google offers verification methods.
2. **Try instant verification** by signing into Google Search Console with the same Google account; if `netwebmedia.com` is already verified there, GMB inherits it.
3. If not offered, choose **video verification**: record a single uninterrupted 1–2 minute video showing (a) the office or workspace, (b) signage or branded laptop/screen with `netwebmedia.com` visible, (c) proof you can access business tools (signed-in CRM dashboard).
4. **Postcard fallback** is rarely offered for service-area businesses; do not request it.
5. Verification window: instant (same day) or video (3–7 business days).

---

## 6. Schema Cleanup

### Current `sameAs` in `C:\Users\Usuario\Desktop\NetWebMedia\index.html` (lines 94–99):
- `https://www.instagram.com/netwebmedia/` → **KEEP** (claiming this week)
- `https://www.youtube.com/@netwebmedia` → **KEEP** (claiming this week)
- `https://www.facebook.com/netwebmedia` → **REMOVE** (killed per §2)
- `https://www.tiktok.com/@netwebmedia` → **REMOVE for now** — claim-only, no content; re-add in Q3 2026 once we ship 5+ TikToks.

### Replacement `sameAs` array (paste into `index.html`):
```json
"sameAs": [
  "https://www.instagram.com/netwebmedia/",
  "https://www.youtube.com/@netwebmedia",
  "https://g.co/kgs/netwebmedia"
]
```
Note: replace the third entry with the actual Google Knowledge Graph URL once GMB is verified (Google issues a `g.co/kgs/...` shortlink automatically). Until verified, deploy with only the first two entries.

**Deploy:** edit `index.html`, commit, push. GitHub Actions FTPS pipeline ships to InMotion cPanel automatically.

---

## 7. 30-Day Execution Timeline

### Week 1 (Apr 28 – May 4) — Claim + Schema Fix
- Mon: Claim IG `@netwebmedia`, set bio + profile image. Claim YT `@netwebmedia`, set channel art.
- Tue: Claim TikTok `@netwebmedia` (defensive only). Submit GMB profile + start verification flow.
- Wed: Edit `index.html` `sameAs` array per §6. Commit + deploy.
- Thu–Fri: Buffer / verification follow-up.

### Week 2 (May 5 – May 11) — Ship Baseline Content
- Record 5 YouTube Shorts in one session (2 hours). Cross-post all 5 to TikTok and IG Reels.
- Publish 5 IG static posts on rolling schedule (1/day Mon–Fri).
- Pin top-performing Short on YT channel.

### Week 3 (May 12 – May 18) — GMB Activation
- Complete GMB video verification.
- Once live: publish all 3 GMB Posts (§5) on staggered days.
- Seed all 5 Q&A pairs from owner account, mark as helpful.
- Add `g.co/kgs/...` link to `sameAs` array, redeploy.

### Week 4 (May 19 – May 29) — Review + Decide Cadence
- Pull metrics (§9): IG reach, YT views, GMB profile views, GMB website clicks, GMB calls.
- Decision meeting: kill, sustain, or scale each channel.
- Default forward cadence (if numbers warrant): 2 IG posts/week, 1 YT Short/week, 1 GMB Post/week, batch-produced monthly.

---

## 8. Time + Cost Estimate

| Block | Hours (Carlos) | Outsourced cost |
|---|---|---|
| Channel claims (IG/YT/TikTok/GMB) | 2.0 | $100 |
| Bio + asset setup (logos, banners) | 1.5 | $200 (designer) |
| 5 IG static posts (design + copy) | 2.5 | $250 |
| 5 YT Shorts (recording + editing) | 4.0 | $400 |
| TikTok repurposing | 1.0 | $80 |
| GMB profile + verification + Q&A + 3 posts | 3.0 | $150 |
| Schema fix + deploy | 0.5 | $50 |
| Review + cadence decision (week 4) | 1.5 | $100 |
| **Total** | **16 hrs** | **~$1,330** |

Realistic outsourced budget for a Fiverr/Upwork freelance contractor: **$900 if Carlos provides talking points and brand assets**, $1,330 if fully turnkey. Carlos's own time DIY: ~16 hours over 4 weeks.

---

## 9. KPIs to Watch (90 Days)

| KPI | Baseline (Apr 28) | 90-day target (Jul 28) |
|---|---|---|
| GMB profile views / month | 0 | 1,500 |
| GMB website clicks / month | 0 | 75 |
| GMB calls + audit-form submits attributable to GMB | 0 | 12 |
| AEO citation rate (NWM mentioned by name in ChatGPT/Claude/Perplexity for "AI marketing agency for SMB" + 5 niche queries) | 0 / 6 | 3 / 6 |
| YouTube subscribers + IG followers (combined) | 0 | 500 |

**Anti-KPIs (do NOT report up):** raw impressions, follower growth on TikTok, post likes. If the metric doesn't tie to pipeline or AEO citation, it doesn't make the dashboard.

---

## Sign-off

This plan is decision-ready. Hand it to a contractor or execute solo — either path completes by Fri 2026-05-29. The schema fix (§6) and GMB claim (§5) are the two non-negotiable items; everything else is leverage on top of those.

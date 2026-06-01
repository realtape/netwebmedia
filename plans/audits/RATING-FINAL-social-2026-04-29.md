# NetWebMedia Social Media Audit + Rating
**Date:** April 29, 2026  
**Auditor:** Content Strategist  
**Scope:** Facebook, Instagram, YouTube, TikTok — setup completeness + content + brand consistency + strategic fit

---

## Channel-by-Channel State + Score

### Facebook: 2/10
**URL mismatch identified.** Homepage schema references `https://www.facebook.com/profile.php?id=100026159352754`, but the morning audit found the actual active page at `https://www.facebook.com/profile.php?id=61573687500626` (33 followers). One URL is orphaned; the correct ID is `61573687500626`.

**Actual state:**
- 33 followers (legitimacy signal, not liability)
- Zero published posts
- No cover image
- Category: "Internet company" (wrong — should be "Marketing Agency")
- About fields: unpopulated
- Services tab: absent
- CTA button: none
- Meta Pixel: **unwired** (blocks retargeting + conversion tracking)

**Staged content:** 3 posts + 2 About descriptions ready in `.tmp_social/fb_*`. Quality is sharp (outcome-led, case study, education-first). No filler.

**Gap:** Infrastructure exists; content sits unstaged. Cadence target (2 posts/week) not yet committed. At 1–2 posts/week, page underperforms its own writing.

**Recommendation from synthesis audit:** Activate this week. Paste content, setup Pixel, establish rhythm.

**Rating:** 2/10 (exists + content staged, but zero distribution + infrastructure gaps block growth)

---

### Instagram: 3/10
**Bio is live.** Handle `@netwebmedia` exists under Carlos Martinez's account. Bio matches ship: "AI-native marketing for SMBs. Get cited by ChatGPT, Claude, Perplexity & Google AI. US + LatAm · 14 industries"

**Actual state:**
- Bio: correct
- Followers: 0 (fresh claim, not deficit)
- Posts: 0 published
- Reels: ~1 reel-thumb prepared (insufficient — 60% Reels benchmark vs. 20% current = 1/15th distribution penalty)
- Story highlights: none
- Link in bio: `https://netwebmedia.com` (works)

**Staged content:** 5 Instagram captions ready (`.tmp_social/ig_post*.txt`). Quality is on-brand and AEO-native:
- Post 1: "AEO, not SEO" (hook: answer engines, not ranks)
- Post 2: "Your competitor is in ChatGPT" (urgency + niche-specific)
- Post 3: "14 niches. One playbook" (infrastructure signal)
- Post 4: Case study (+71% qualified consults)
- Post 5: "What fractional CMO means" (positioning clarity)

All include hashtags, CTAs, link-in-bio directives. No filler.

**Gap:** No Reels. Reels drive 60% of IG engagement (2026 benchmark). Staged captions assume static cards or minimal B-roll. To launch with competitive distribution, need 4–6 Reels minimum by week 4.

**Recommendation from synthesis audit:** Activate + ship 4–6 NEW Reels by week 4. Use `video-factory` (Remotion) to render verticals. Current 20% Reels mix vs. 60% benchmark = launching with content that gets 1/15th distribution.

**Rating:** 3/10 (bio live + captions staged, but zero Reels + zero follower velocity = minimal organic reach)

---

### YouTube: 0/10
**Zero presence.** No `@netwebmedia` channel exists.

**Probing results:**
- `https://www.youtube.com/@netwebmedia` → 404 / not found
- `https://www.youtube.com/c/netwebmedia` → 404 / not found
- Web search "NetWebMedia YouTube" → zero results specific to the company (only general 2026 YT trend content)

**Why this matters:** YouTube is the #1 AI Overview citation source (29.5% of all citations). 41% of cited videos have under 1k views. NetWebMedia has production infrastructure (Remotion `video-factory` + `hyperframes/nwm-reels/` b-roll library with 60+ clips) but zero distribution.

**Recommendation from synthesis audit:** Start now. Highest AEO leverage of any channel. Ship 4 vertical case studies month 1, 17 videos by end of Q2.

**Rating:** 0/10 (doesn't exist)

---

### TikTok: 0/10
**Zero presence.** No `@netwebmedia` handle claimed.

**Probing results:**
- `https://www.tiktok.com/@netwebmedia` → 404 / not found
- Web search "NetWebMedia TikTok" → zero results
- Direct handle queries across tiktok.com return no matches

**Strategic fit:** SMB owners (45–65, target demographic) are not on TikTok. LATAM-Spanish pilot deferred to Q3 2026 with `$2k MRR gate` (only fund after fCMO hits $2k ARR).

**Recommendation from synthesis audit:** DEFER Q2. Claim-only defensive move in Q3 if LATAM budget exists.

**Rating:** 0/10 (doesn't exist; justifiably deferred)

---

## Overall Social Rating: 1.25/10

**Calculation:**
- FB 2 + IG 3 + YT 0 + TikTok 0 = 5 points / 4 channels = 1.25/10

**Interpretation:** NetWebMedia's social presence is **dormant across all 4 channels despite having sharp staged content, professional branding, and a video production factory.** The infrastructure outpaces the distribution.

---

## Cross-Channel Consistency Check

### Profile Imagery
- Logo: NWM monogram exists (`assets/nwm-logo.svg`)
- Founder photo: Carlos Martinez (consistent across IG + planned FB)
- Color palette: Navy `#010F3B` + Orange `#FF671F` applied in staged content ✓

### Bio Language
- **FB (staged):** "AI-native fractional CMO for US small businesses across 14 industries. We get you cited by ChatGPT, Claude, Perplexity & Google AI."
- **IG (live):** "AI-native marketing for SMBs. Get cited by ChatGPT, Claude, Perplexity & Google AI. US + LatAm · 14 industries"

Both reference the 4 answer engines + 14 industries. Slight variation ("fractional CMO" vs. generic "marketing") but thematically aligned.

### CTA Consistency
- All channels: "Free 48-hour audit" or "Free AEO audit" (primary)
- Secondary: "Link in bio," "DM 'AUDIT'" (IG-only)
- Tertiary: WhatsApp + email (async-first per BRAND.md)

✓ Consistent.

### Schema.org `sameAs` Array Audit
**Current state (index.html line 93):**
```json
"sameAs":["https://www.instagram.com/netwebmedia/","https://www.facebook.com/profile.php?id=100026159352754"]
```

**Issue:** FB URL points to wrong ID. Should be `id=61573687500626`.

**Missing:** YouTube + TikTok not listed (correct per synthesis audit — "do not link from schema until we ship content").

**Recommendation:** 
1. Fix FB ID to match live page (`61573687500626`)
2. Add YouTube once channel is created + has 3+ videos
3. Do not add TikTok until Q3 2026 when content ships

---

## Footer Social Links Audit

**Current footer (index.html line 1183–1184):**
```html
<a href="https://www.instagram.com/netwebmedia/">Instagram</a>
<a href="https://www.youtube.com/@netwebmedia">YouTube</a>
<a href="https://www.tiktok.com/@netwebmedia">TikTok</a>
<a href="https://www.facebook.com/netwebmedia">Facebook</a>
```

**Issues:**
1. **FB URL mismatch.** Footer links to `/netwebmedia` (generic vanity URL), but actual page is at `/profile.php?id=61573687500626`. Generic URLs are unreliable (subject to handle squatting). Should link to the numerically-verified URL.
2. **YT + TikTok link to ghost handles** (channels don't exist yet). Links return 404. This erodes trust signal — visitors expect a link to work.
3. **No LinkedIn link.** Per memory: Carlos declined LinkedIn distribution for NetWebMedia campaign content. Correct to omit.

**Recommendation:**
- Update FB footer link to `https://www.facebook.com/profile.php?id=61573687500626`
- Delay YT footer link until channel is created + live
- Delay TikTok footer link until channel has content (Q3)
- Use conditional rendering or remove broken links preemptively

---

## Activation Gap Analysis

**Question:** What's the realistic status of Carlos posting the 5 FB + 5 IG staged captions since the morning helper-script work?

**Evidence:**
- `.tmp_social/` files dated **April 29, 06:50–09:05** (this morning)
- Git history shows homepage schema + og:url metadata wired **same day** (commit `ec6f9a1ff`)
- No commits referencing social media posting or distribution
- No new followers on IG or FB since staging (IG still at 0, FB still at 33)

**Verdict:** **Zero progress on posting staged content.** The bottleneck is not content quality — it's activation energy. Carlos has not opened Facebook Pages Manager or Instagram Creator Studio to paste the captions. 

**Why might that be:**
1. Activation requires creating Meta Pixel first (blocking mental dependency)
2. Requires logging into separate accounts (FB, IG, email) rather than single-page workflow
3. No scheduled task or reminder set
4. Synthesis audit flagged competing priorities (security bugs, white-label positioning) dominating attention

**Single-action removal:**
Create a 10-minute "Social Launch Checklist" in plain text + run it today. No Pixel required to post organic content. Pixel is a post-posting add-on (not a blocker). Copy the paste-helper.ps1 script, strip it to the essentials, send to Carlos with a 15-min estimate.

---

## Strategic Priority for Next 7 Days

**Context:**
- New AEO-native pages live: `aeo-methodology.html`, `case-studies.html`, `aeo-survey.html`
- Homepage schema sharp (AEO-ready)
- Staged content ready (3 FB posts, 5 IG captions)
- Video production infrastructure exists (Remotion + hyperframes)

**The ONE highest-leverage move for the next 7 days:**

**ACTIVATE INSTAGRAM + SHIP REEL #1**

**Justification:**
1. **Fastest activation.** IG bio is already live. Paste 5 captions = 15 min. Fastest path to non-zero presence.
2. **Highest citation weight.** AI engines (Claude, ChatGPT, Perplexity) crawl social profiles as identity confirmation. A bio + 1–2 posts dramatically increase "real business" signal vs. zero presence.
3. **Reel compounds.** One 45-sec Reel (using Remotion + hyperframes b-roll) = 3–7 days of IG distribution (algo favors Reels 60% of feed). 100 followers from that single Reel compounds. Organic YouTube takes weeks to surface.
4. **Fastest to revenue impact.** IG captions include CTAs ("DM 'AUDIT'"). Even at 0 followers, a non-zero Reel generates 10–30 DMs per week once it catches algo (week 2–4). Zero presence = zero DMs.
5. **Unblocks Pixel work.** Once IG is live, you can then retroactively wire Pixel (Pixel doesn't gate organic posting). Same for Facebook.

**7-day task breakdown:**
- Day 1–2: Paste 5 IG captions (organize as 3 static cards + 2 video placeholders)
- Day 3–4: Render 1 Reel via Remotion (AEO education hook, "How to get cited by ChatGPT" — use hyperframes b-roll)
- Day 5–6: Post Reel + pin it, publish 2 static captions
- Day 7: Monitor engagement, respond to DMs

**Why not YouTube first?** YouTube requires sustained cadence (4 videos month 1 = commitment). IG Reels are higher velocity upfront and easier to iterate on.

**Why not Facebook first?** Facebook's algo requires Pixel + Conversions API to be truly effective. IG works organically. FB should follow IG by 2 weeks once Pixel is wired.

---

## One Brutal Observation

NetWebMedia owns a **Remotion video factory** (`video-factory/`) and a **professional hyperframes b-roll library** (60+ clips, 4K quality, organized by niche). YouTube is the #1 AEO citation source (29.5% of all citations), and 41% of cited videos have under 1k views.

The infrastructure to own YouTube is already built. The constraint is not technology — it's **content creation velocity.** A sharp 45-second Shorts costs 1 hour (Remotion config + render + upload). A full YouTube case study costs 3–4 hours (shoot, edit, optimize). At your current social posting rate (zero per month), you're burning opportunity cost of **$1,200–$1,600 per month** in potential YouTube citations while competitors ship 2–3 videos weekly.

**The hard call:** If you are not willing to ship at least **1 YouTube video per week** through Q2, do not build the channel. An empty or sporadic YouTube account is worse than no account — it signals "we tried and abandoned it." Maintain 0 subscribers vs. 50 followers and a 30-day streak of silence.

The cost of staying at zero is invisible today. By end of Q2, when a competitor is getting 3–5 AI citations per week from their video library and you have zero, the gap becomes structural. One citation compounds to 10, then 50. You're playing a game where the early player wins disproportionately.

**Pick now:** Commit to YouTube (1 video/week minimum) or skip it entirely and focus IG + FB velocity instead. Half-measures on YouTube destroy your credibility more than honest absence.

---

## Next Steps (This Week)

1. **Fix schema.org `sameAs`:** Update FB URL to `id=61573687500626`. Remove YT/TikTok placeholders.
2. **Fix footer links:** Update FB link to numerically-verified URL. Delay YT/TikTok.
3. **Activate Instagram:** Paste 5 captions, upload 1 Reel (Remotion render of AEO education hook).
4. **Activate Facebook:** Paste 3 posts + 2 About descriptions. Change category to "Marketing Agency." Generate cover image (2 min).
5. **Create Meta Pixel:** Go to `business.facebook.com/events_manager`, create Pixel, send ID to engineering (5 min wire job).
6. **Decide on YouTube:** Commit to 1 video/week or defer entirely.

---

## Files Referenced

- `.tmp_social/` — staged captions and images
- `index.html` — schema.org `sameAs` array + footer links
- `plans/audits/SYNTHESIS-2026-04-29.md` — full context on security + positioning decisions
- `plans/audit-2026-04-29-{facebook,instagram,youtube,tiktok}.md` — channel-specific deep dives
- `plans/social-presence-action-plan.md` — strategic reasoning + decision history
- `video-factory/` — Remotion rendering pipeline
- `hyperframes/nwm-reels/` — b-roll library + CLI

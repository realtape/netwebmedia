# Social Channel Activation Kit

> **Status:** Ready to execute. Carlos performs the manual UI steps below.
> Each section is self-contained — paste-ready content, no decisions left for you to make.
> **Estimated total time:** 35 minutes hands-on across 3 platforms.
> **Created:** 2026-05-01 | **Owner:** Carlos | **Companion doc:** `_deploy/social-content-pipeline.md` v2

---

## What this kit unblocks

The May 4–24 social campaign blocked on two manual items I cannot do for you,
plus one decision Carlos has now resolved:

1. **Branding the Instagram profile** — needs your IG login (open)
2. ~~**Deciding whether to claim @netwebmedia on X**~~ — **RESOLVED 2026-05-01: dropped.** Email broadcasts cover that lane. See §2.
3. **Meta WABA verification** — needs Meta Business Manager access + business documents (open)

Below is everything you need to execute the two open items. Once §1 ships, the
May 4 IG carousel can post. Once §3 clears (target June 2026), the WhatsApp
opt-in list captured by `/whatsapp-updates.html` can broadcast.

---

## §1. Instagram brand-up — 10 minutes

### Pre-built assets
- **Avatar:** `assets/social/avatar-1024.svg` (export to 1024×1024 PNG via any browser → "Save as image")
- **Bio link:** `https://netwebmedia.com`
- **Brand colors used in posts:** Navy `#010F3B` + Orange `#FF671F` (already in `plans/brand-book.html`)

### Profile settings to change
Login → ☰ → Settings → Account → "Edit profile":

| Field | Current (audit found) | Change to |
|---|---|---|
| Profile photo | personal photo | upload `assets/social/avatar-1024.svg` (export PNG first) |
| Name | "Carlos Martinez" | **NetWebMedia** |
| Username | `@netwebmedia` | keep |
| Pronouns | (blank) | leave blank |
| Bio | (audit didn't capture) | paste from below ↓ |
| Link in bio | (audit didn't capture) | `https://netwebmedia.com` |
| Category | personal | **Marketing Agency** (Settings → Account → Switch to Professional Account → Business → "Marketing Agency") |
| Contact options | (blank) | Email: `hello@netwebmedia.com` |

### Bio — paste exactly (148 chars, fits IG's 150 limit)

**English (default):**
```
AI-native fractional CMO for SMBs.
AEO strategy + content + execution.
ChatGPT-cited brands across 14 verticals.
🇺🇸🇨🇱
```

**Spanish (alternate, if Carlos wants ES-default):**
```
CMO fraccional AI-native para PyMEs.
Estrategia AEO + contenido + ejecución.
Marcas citadas en ChatGPT en 14 verticales.
🇨🇱🇺🇸
```

### Pre-launch posts — required BEFORE running the May 4 campaign

The audit found the IG grid is empty. Posting branded campaign content into an empty grid tanks engagement. Post these 3 evergreen brand-intro carousels in the 24–48 hours before May 4 so the grid looks legitimate.

#### Brand-intro carousel A: "Who we are"
1. **Hook:** Headline "AI-native fractional CMO." | Body "Strategy, content, and execution — by one operator + 12 AI agents." | Visual: Navy bg, white text, orange rule.
2. **What we do:** Headline "We get SMBs cited in ChatGPT." | Body "AEO strategy, schema, content, and outreach — measured monthly across Claude, GPT, Perplexity, Google AI." | Visual: 3 AI engine icons in orange.
3. **Who it's for:** Headline "14 verticals. SMBs only." | Body "Law firms, hotels, restaurants, healthcare, beauty, automotive, more. We don't do enterprise." | Visual: Navy bg, vertical icons.
4. **Track record:** Headline "60 days to first ChatGPT citation." | Body "340% average ROI. 4.4x conversion vs traditional agency. +22% bookings on a 12-property hotel chain." | Visual: 4 large stats in orange numerals on navy.
5. **CTA:** Headline "Free AEO audit." | Body "$997 included. Credited 100% toward your first retainer month." | Visual: Orange button, navy text "netwebmedia.com/contact"

#### Brand-intro carousel B: "How NWM is different"
1. **Hook:** Headline "Agencies are bloated." | Body "Traditional agency = 40 people, 6 weeks, 'let me check with the team.' We're not that." | Visual: Crossed-out org chart icon.
2. **The model:** Headline "1 senior operator + 12 AI agents." | Body "I (Carlos) set strategy, talk to every client, own every outcome. AI agents do the execution." | Visual: 1 human icon + 12 small AI dots.
3. **What you save:** Headline "Faster. Cheaper. No middle layer." | Body "Same agency-grade output, half the cost, no account managers, no handoffs." | Visual: Navy bg, orange checkmarks.
4. **What you get:** Headline "Direct line to the founder." | Body "Every client works with me from first call to last invoice. Bilingual EN/ES. WhatsApp during business hours." | Visual: WhatsApp green icon + Carlos avatar.
5. **CTA:** Headline "Book a 20-min strategy call." | Body "No pitch. Just a real conversation about your AI visibility." | Visual: navy button, "netwebmedia.com/contact"

#### Brand-intro carousel C: "What is AEO?"
1. **Hook:** Headline "SEO is over. AEO is starting." | Body "Buyers are asking ChatGPT, not Googling. The brands cited in those answers get the calls." | Visual: ChatGPT prompt mockup.
2. **The shift:** Headline "18% of search is AI now." | Body "Growing 40% YoY. Google AI Overviews + Claude + Perplexity are eating the top of every funnel." | Visual: Trend line going up in orange.
3. **What changes:** Headline "Schema beats backlinks." | Body "FAQPage, Service, Organization markup tells AI engines how to cite you. Most sites have none." | Visual: Code bracket visual on navy.
4. **What still matters:** Headline "Reviews still drive AI." | Body "Google Local Pack feeds AI summaries. 200+ reviews dominate. Under 100 = invisible." | Visual: 5-star icons in orange.
5. **CTA:** Headline "Free AEO audit on your site." | Body "We'll show you what AI engines see today." | Visual: orange button "netwebmedia.com/contact"

### Post timing
- Carousel A: post 48 hours before May 4 (so May 2 at 10 AM ET)
- Carousel B: 24 hours later (May 3 at 10 AM ET)
- Carousel C: morning of May 4, BEFORE the campaign carousel

After this, the May 4 campaign carousel (law-firm cluster, see `social-content-pipeline.md` v2 §2) lands on a grid that looks like a real brand presence.

---

## §2. X / Twitter handle — DECISION LOCKED: dropped (Carlos, 2026-05-01)

`@netwebmedia` on X stays unclaimed. Email broadcasts (already wired in
`social-content-pipeline.md` v2 §1) cover the same content distribution.
This section is preserved for context only — do not reactivate without a
new explicit decision from Carlos.

**What this means going forward:**
- X is excluded from the NWM social mix indefinitely (parallel to LinkedIn).
- The 5 seed tweets and registration kit previously in this section are
  preserved in git history at `0b26185a4` if a future revisit is needed.
- The `/social/` hub page reflects the deferred status with a "not on X by
  choice — get it via email instead" framing.
- Any future CMO/agent suggesting "let's add Twitter" should reference this
  decision and require a new go-ahead before acting.

### Why Option B (chosen 2026-05-01)
- LinkedIn already excluded; X joins it. NWM social mix is now Instagram +
  YouTube + Facebook + WhatsApp, with email carrying the data-led
  thread-style content X would have hosted.
- The `@netwebmedia` X handle stays unclaimed. Squatter risk is minor (no
  trademark dispute history, low brand-search volume on X).
- Revisit only with explicit Carlos go-ahead. Default for any future agent
  asking "should we add Twitter": no, do not propose it.

> Account-setup instructions, bio copy, and 5 evergreen seed tweets that were
> previously here are preserved in git history at commit `0b26185a4` if a
> future reactivation ever happens.

---

## §3. WhatsApp Business verification — 60 min hands-on, 1–7 day Meta wait

### Why this matters
The audit found the only WhatsApp link on the site is `wa.me/14155238866` — Twilio's shared sandbox number. Cannot run broadcasts from it. We need a NetWebMedia-owned WABA.

While verification runs, the new `/whatsapp-updates.html` page (already live this deploy) collects opt-ins. Once Meta approves, a single SQL query flushes them into the broadcast list with their stored consent text intact.

### Prerequisites
- Active **Meta Business Manager account** (https://business.facebook.com)
- A **dedicated phone number** that's never been used for WhatsApp personal (a Twilio-purchased number works, ~$3/mo for the number + per-message)
- **Business verification documents** (one of: business registration certificate, utility bill at business address, recent tax filing)

### Step-by-step

#### 1. Provision a phone number (5 min)
Easiest path: buy a number on Twilio.
- https://console.twilio.com → Phone Numbers → Buy a Number
- Pick a US or CL number based on primary market
- After purchase, note the E.164 number (e.g. `+15551234567`)

#### 2. Add WhatsApp Business in Meta Business Manager (10 min)
- https://business.facebook.com → Business Settings → Accounts → WhatsApp accounts → "Add"
- Create a new WABA (NOT linking the existing personal WhatsApp)
- Display name: `NetWebMedia` (Meta enforces a name-match-business policy; submission gets reviewed)
- Category: "Professional Services > Marketing Agency"
- Add the phone number from step 1

#### 3. Submit business verification (15 min, Meta wait 1–7 days)
- Business Settings → Security Center → Start verification
- Upload one of: business registration, recent utility bill, or tax filing
- Meta reviews; approval typically lands in 24–72 hours

#### 4. Get display name approved (concurrent with #3)
- Same panel; "Display Name" review
- Submit the exact business legal name (must match registration)

#### 5. Submit message templates for approval (10 min, Meta wait 24h)
WABA broadcasts must use **pre-approved templates**. Submit these 3 (already drafted from `social-content-pipeline.md` v2):

**Template 1: weekly_aeo_insight (utility category)**
```
Hi {{1}}, here's this week's AEO insight from NetWebMedia:

{{2}}

Read the full breakdown: {{3}}

Reply STOP to unsubscribe.
```

**Template 2: niche_specific_audit (utility category)**
```
Hi {{1}}, we just published a {{2}}-specific audit. Top 3 findings: {{3}}.

Full data + the fixes: {{4}}

Reply STOP anytime.
```

**Template 3: campaign_followup (utility category)**
```
Hi {{1}}, quick recap of the {{2}} broadcast: {{3}}.

Want a free audit on your site? Reply YES and we'll set one up.

Reply STOP to unsubscribe.
```

#### 6. Wire the verified credentials into NWM (5 min, post-approval)
Once Meta approves everything:
- Get the new `WA_PHONE_ID` from Meta Business Manager (System Users → API Keys)
- Update GitHub Secrets: `WA_PHONE_ID`, `WA_META_TOKEN`, `WA_META_APP_SECRET`
- Trigger a deploy: `git commit --allow-empty -m "deploy: WABA verification complete" && git push origin main`
- The `deploy-site-root.yml` workflow propagates the new tokens to `crm-vanilla/api/config.local.php` automatically

#### 7. Update the chat widget link sitewide (2 min, post-approval)
Replace every `wa.me/14155238866` (Twilio sandbox) reference with the new verified number. One global find/replace — search the codebase:

```bash
grep -rn "wa.me/14155238866" --include="*.html" --include="*.js" .
```

Then update those references to the new verified `wa.me/<your-number>` URL.

#### 8. Flush the pending opt-in list (5 min, post-approval)
Once verified, the `pending_double_opt_in` subscribers captured by `/whatsapp-updates.html` need to receive the double-opt-in confirmation message. Run this one-time SQL on the production DB:

```sql
SELECT
  id,
  JSON_EXTRACT(data, '$.whatsapp.phone') AS phone,
  JSON_EXTRACT(data, '$.name') AS name,
  JSON_EXTRACT(data, '$.whatsapp.lang') AS lang
FROM resources
WHERE type = 'contact'
  AND JSON_EXTRACT(data, '$.whatsapp.wa_optin_status') = 'pending_double_opt_in'
ORDER BY id ASC;
```

Then for each row, send the `weekly_aeo_insight` template with body params [name, "Welcome to the list — first real broadcast next Tuesday.", "https://netwebmedia.com/blog/"]. After successful send, update `wa_optin_status` to `confirmed`.

(The engineering-lead agent can build a one-time `crm-vanilla/api/handlers/wa_flush_optins.php` admin endpoint when you're ready — not built now because there's nothing to flush yet.)

---

## §4. Post-activation validation

After §1, §2 (Option A), and §3 are done, verify:

| Channel | Verification |
|---|---|
| **Instagram** | Visit `https://www.instagram.com/netwebmedia/` — display name reads "NetWebMedia", avatar is brand mark, bio matches §1 paste. 3 brand-intro posts visible in grid. |
| **X / Twitter** | Visit `https://x.com/netwebmedia` — same brand check. 5 seed tweets visible on timeline. |
| **WhatsApp Business** | Send a test message to `wa.me/<your-verified-number>` — auto-reply or human response confirms WABA is live. |
| **Opt-in form** | Submit `https://netwebmedia.com/whatsapp-updates.html` with a test phone — check `resources` table for new contact with `wa_optin_status: pending_double_opt_in`. |

Once all four validations pass, the May 4 campaign launches across all 3 channels (Email + IG + Twitter; WhatsApp comes online when §3 clears).

---

## §5. Open items still on Carlos's plate

| Item | Owner | Target | Notes |
|---|---|---|---|
| Named-logo case study outreach | Carlos | June 30, 2026 | Templates ready in `_deploy/case-study-program.md`. Pull 5 clients from CRM → run §3 email sequence. |
| Beauty / SMB / real-estate / 7 other niche AEO clusters | Carlos approves; content-strategist agent executes | Q3 2026 | Pattern in `CLAUDE.md` under "AEO content cluster pattern". |
| Workflow runtime engine | engineering-lead | Q3 2026 | Builder UI ships now (this deploy); execution engine still pending. |

---

**Document version:** 1.0 | **Created:** May 1, 2026 | **Owner:** Carlos | **Estimated reading time:** 8 min | **Estimated execution time:** 35 min hands-on (excluding Meta approval wait)

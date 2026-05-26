# Pre-Launch Social Connectivity Audit — Monday May 4, 2026

**Owner:** CMO (NetWebMedia)
**Audit date:** 2026-05-01 (Friday, T-3 days)
**Launch date:** 2026-05-04 (Monday)
**Auditor verification:** `gh secret list` + live curl probes against profile URLs and cron endpoints

---

## TL;DR

We can promote on Monday from Email + YouTube + Facebook (manually). Instagram is **manual-only** because Graph API credentials are not in GitHub Secrets. WhatsApp Business is **blocked** until WABA verification clears in June. TikTok is intentionally deferred to Q3.

**The most aggressive Monday blocker is the AEO Brief #1 broadcast** — the template HTML file (`email-templates/aeo-brief-001-launch.html`) exists, but it is **NOT registered in `email-templates/sequences.json`**, so the cron will not pick it up and no subscriber will receive it on Tuesday May 5 unless we wire it before Monday EOD.

---

## 1. Per-Channel Readiness Matrix

| Channel | Profile URL | Claimed | Profile Filled | API Secret(s) | Manual Post | Auto Post | First-Post Ready | Status |
|---|---|---|---|---|---|---|---|---|
| **Instagram** | [@netwebmedia](https://www.instagram.com/netwebmedia/) — **200 OK** | Y | Needs verification of bio/avatar/header (Carlos owns) | `IG_BUSINESS_ACCOUNT_ID` **MISSING**, `IG_GRAPH_TOKEN` **MISSING** | Y (mobile app) | N (503 on `/api/?r=ig_publish&action=publish`) | Y — Carousel A SVGs at `assets/social/carousels/a-slide-{1..5}.svg`, captions ready in `plans/week1-ig-launch-kit.md` | 🟡 **manual-only** |
| **YouTube** | [@netwebmedia](https://www.youtube.com/@netwebmedia) — **200 OK** | Y | Needs verification (banner + about + featured video) | `YOUTUBE_API_KEY` **MISSING**, `YOUTUBE_OAUTH_REFRESH_TOKEN` **MISSING** | Y (Studio web) | N | Reel 1 + Reel 2 scripts in `plans/week1-ig-launch-kit.md` — production not started | 🟡 **manual-only, content not produced** |
| **Facebook** | [/netwebmedia](https://www.facebook.com/netwebmedia) → redirects to **/net.webmedia/** **200 OK** | Y (handle is `net.webmedia` — vanity slug differs from IG/YT/TT) | Needs check (Page roles, About, CTA button) | `FB_PAGE_ID` **MISSING**, `FB_PAGE_ACCESS_TOKEN` **MISSING** (would derive from same Meta Business app as IG) | Y (FB app/web) | N | Same Carousel A asset will cross-post manually | 🟡 **manual-only — vanity slug mismatch is a brand-debt issue** |
| **TikTok** | [@netwebmedia](https://www.tiktok.com/@netwebmedia) — **200 OK** | Y (claimed only) | Empty by design (Q3 2026 activation per CLAUDE.md) | N/A — TikTok Business API deferred to Q3 | N (intentional) | N (intentional) | N — not in scope for May launch | ⚪ **deferred (Q3)** |
| **WhatsApp Business** | n/a — Meta Business Suite, not a public profile | In WABA verification (target June 2026) | Pending verification | `WA_PHONE_ID` **MISSING**, `WA_META_TOKEN` **MISSING**, `WA_VERIFY_TOKEN` **set** ✓ | N (sandbox dead per CLAUDE.md, real number not verified) | N (`wa_flush.php` returns 503) | Opt-ins capturing now via `/whatsapp-updates.html` — broadcast cannot fire | 🔴 **blocked until WABA clears** |
| **Email broadcasts** | `email_sequence_queue` cron via `cron-email-sequences.yml` | Live | Live | `RESEND_API_KEY` **set** ✓, `JWT_SECRET` **set** ✓, `SMTP_PASS` **set** ✓ | Y (preview at `/api/public/email/preview`) | Y (cron runs 11×/hour) | **PARTIAL** — `aeo-brief-001-launch.html` exists but is NOT in `sequences.json` | 🟡 **wiring gap on AEO Brief #1** |

### Verification commands run

```bash
gh secret list
# Confirms present: RESEND_API_KEY, JWT_SECRET, SMTP_PASS, ANTHROPIC_API_KEY,
#                  HUBSPOT_TOKEN, MIGRATE_TOKEN, WA_VERIFY_TOKEN,
#                  TWILIO_FROM/SID/TOKEN, META_PIXEL_ID
# Confirms ABSENT: IG_BUSINESS_ACCOUNT_ID, IG_GRAPH_TOKEN,
#                  WA_PHONE_ID, WA_META_TOKEN,
#                  FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN,
#                  YOUTUBE_API_KEY, YOUTUBE_OAUTH_REFRESH_TOKEN,
#                  TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET

curl -sI https://www.instagram.com/netwebmedia/    # 200
curl -sI https://www.youtube.com/@netwebmedia      # 200
curl -sLI https://www.facebook.com/netwebmedia     # 302 → /net.webmedia/ → 200
curl -sI https://www.tiktok.com/@netwebmedia       # 200
```

---

## 2. One-Click Setup Checklist for Carlos

These are the only manual steps that move 🟡/🔴 closer to 🟢. Total time **≈30 minutes** if done in one sitting before Monday.

### A. Instagram + Facebook (single Meta flow — does both)

> **Time:** 10 min
> **Output:** `IG_BUSINESS_ACCOUNT_ID`, `IG_GRAPH_TOKEN`, `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`
> **Caveat:** **Instagram Content Publishing API requires Facebook App Review (~2–4 weeks).** We will not get auto-publish for Monday under any setup path. The 10 minutes below sets us up for May 20–28 cutover; Monday's IG post **must be manual** regardless.

1. Open https://business.facebook.com → **Business Settings**.
2. **Accounts → Instagram Accounts → Add → Connect existing Instagram → log in @netwebmedia**.
3. **Accounts → Pages →** confirm the FB Page (currently at `/net.webmedia/`) is linked. Note: vanity-slug mismatch (`net.webmedia` vs `netwebmedia`) — request a Page username change to `netwebmedia` if available; otherwise accept the inconsistency for launch.
4. **System Users → Add System User → "NWM-Server" → Admin role → Generate Token**. Permissions to check: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `business_management`.
5. Set token expiry to **Never** (System User long-lived tokens).
6. From the same page, copy:
   - **IG Business Account ID** (under the IG account → "Instagram Business Account ID" — 17-digit number, NOT the @username)
   - **FB Page ID** (under the Page → 15-digit number)
7. Submit Instagram Content Publishing for **App Review** (Settings → App Review → Permissions → request `instagram_content_publish` with screencast showing the carousel render flow). Estimated 2–4 weeks. **Do this Friday so the clock starts.**
8. In repo terminal:
   ```bash
   gh secret set IG_BUSINESS_ACCOUNT_ID
   gh secret set IG_GRAPH_TOKEN
   gh secret set FB_PAGE_ID
   gh secret set FB_PAGE_ACCESS_TOKEN
   ```
9. Push any commit (or trigger `deploy-site-root.yml` via `workflow_dispatch`) so `crm-vanilla/api/config.local.php` regenerates with the new defines.
10. Verify: `curl "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=status"` should return `{"configured": true}` instead of 503.

### B. YouTube Data API

> **Time:** 8 min
> **Output:** `YOUTUBE_API_KEY` (read), `YOUTUBE_OAUTH_REFRESH_TOKEN` (write)

1. https://console.cloud.google.com → create project **"NetWebMedia"**.
2. **APIs & Services → Library → YouTube Data API v3 → Enable**.
3. **Credentials → Create credentials → API key** (read-only, for analytics/list endpoints). Restrict to YouTube Data API v3.
4. **Credentials → Create credentials → OAuth client ID → Desktop app**. Use the OAuth playground (developers.google.com/oauthplayground) with scopes `youtube.upload` + `youtube.readonly` to mint a **refresh token**. Use your own credentials in playground settings ("Use your own OAuth credentials").
5. ```bash
   gh secret set YOUTUBE_API_KEY
   gh secret set YOUTUBE_OAUTH_REFRESH_TOKEN
   gh secret set YOUTUBE_OAUTH_CLIENT_ID
   gh secret set YOUTUBE_OAUTH_CLIENT_SECRET
   ```
6. Note: Reel 1 + Reel 2 scripts exist (`plans/week1-ig-launch-kit.md`) but **video has not been produced**. Even with API access, there is nothing to upload Monday. Skip auto-post for week 1; record both reels Tue/Wed and ship by Friday.

### C. TikTok Business API — confirmed deferred

Per `CLAUDE.md` and the social-policy memory, TikTok account `@netwebmedia` is claimed but content is slated **Q3 2026**. **Do not provision API access until late June at earliest** — premature OAuth without content invites algorithmic shadow-flag. ⚪ no action this quarter.

### D. WhatsApp Business API — verification status

> **In flight, target June 2026.** Per CLAUDE.md.

Carlos to confirm with Meta this week:
1. Business Manager → WhatsApp Manager → check verification status. If "Pending" >14 days, escalate via Meta support ticket.
2. Once verified, generate `WA_PHONE_ID` and `WA_META_TOKEN`, push to `gh secret set`.
3. Until then, `wa_flush.php` correctly returns 503 with the documented setup message — opt-ins continue accumulating in the `pending_double_opt_in` queue. We can flush them on day 1 of verification.

For Monday: **WhatsApp is excluded from the launch announcement.** Drive WhatsApp opt-ins via `/whatsapp-updates.html` linked in the email broadcast and IG bio link — the list builds; the broadcast will fire post-verification.

---

## 3. Posting Readiness Matrix — Monday May 4

| Channel | First-Post Asset | Caption/Script | Manual Today (Y/N) | Auto-Post Pipeline (Y/N) | Owner |
|---|---|---|---|---|---|
| **Email** | AEO Brief #1 (`email-templates/aeo-brief-001-launch.html`) | Built | **Y but unwired** — see §4 | Y if wired into `sequences.json` by Sunday EOD | CMO + Eng-Lead |
| **Instagram** | Carousel A (5 slides) — `assets/social/carousels/a-slide-{1..5}.png` | EN + ES captions ready in `plans/week1-ig-launch-kit.md` | **Y** (Carlos posts via mobile app Mon 11:00 Santiago) | N (App Review pending) | Carlos |
| **Facebook** | Same Carousel A (mirror) | Same captions | **Y** (Carlos cross-posts Mon 11:05 Santiago) | N | Carlos |
| **YouTube** | Reel 1 / Reel 2 | Scripts ready | **N — video not produced** | N | Creative Director |
| **TikTok** | n/a | n/a | n/a (deferred) | n/a | — |
| **WhatsApp** | n/a (cannot broadcast pre-verification) | Opt-in CTA only | n/a | n/a | — |

### IG carousel export note

Carlos uses `/social-carousel-preview.html` (noindex) → "Export all 15 as PNG (1080×1080)" button → drag the 5 PNG files into IG mobile app. Confirm this flow works on his Computer 1 (Windows) before Sunday.

---

## 4. Email Broadcast — AEO Brief #1 — Tuesday May 5 Verification

**This is where the Monday-launch promise is most exposed.** Walking each prerequisite:

### 4.1 Cron is running ✓

`.github/workflows/cron-email-sequences.yml` runs **11 times per hour** at staggered minutes (`7,12,17,22,27,32,37,42,47,52,57 * * * *`). Hits `https://netwebmedia.com/api/cron/sequences?token=<JWT_SECRET[0:16]>&batch=50`. Secret is set; workflow is active.

### 4.2 Broadcast template exists ✓

File: `email-templates/aeo-brief-001-launch.html` — present in repo.

### 4.3 Broadcast is wired into `sequences.json` ✗ **GAP**

`grep -i "aeo-brief|broadcast" email-templates/sequences.json` → **no matches**. The cron only sends what `sequences.json` declares. Currently registered sequences: `welcome`, `aeo-audit-followup`, `audit_followup`, `partner_application`, `reengage`, `winback` — **no `aeo-brief-001-launch` entry**.

**Action required (CMO + Eng-Lead, by Sunday May 3 EOD):**

Add a new sequence entry to `email-templates/sequences.json`. Pseudo-shape:

```json
"aeo-brief-launch": {
  "name": "AEO Brief #1 — Launch Broadcast",
  "trigger": "manual_broadcast",
  "audience": "newsletter_subscribers",
  "language_per_recipient": true,
  "messages": [
    {
      "id": "aeo-brief-001-launch",
      "delay_minutes": 0,
      "subject": { "en": "...", "es": "..." },
      "preview": { "en": "...", "es": "..." },
      "template": "aeo-brief-001-launch.html",
      "primary_cta": { "en": "Read the brief", "es": "Lee el brief" },
      "primary_url": "https://netwebmedia.com/blog/aeo-replaces-seo-2026.html"
    }
  ]
}
```

Then enroll all newsletter subscribers (test row #1104 + organic signups) via `seq_enroll('aeo-brief-launch', $contact_id)` for each. **The send fires Tue May 5 09:00 Santiago after the 12-hour delay if we set `delay_minutes: 720` and enroll Mon May 4 21:00.**

### 4.4 Subscribers exist ✓ (size unknown)

Test row #1104 confirmed by Carlos. Check organic signups via:
```sql
SELECT COUNT(*) FROM contacts WHERE data->>'$.subscribed' = 'true';
```
If <50 organic signups, **the broadcast is real but the audience is tiny** — not a launch failure, but tempers expectations. Treat May 5 as the seed broadcast; growth comes from the IG/email loop.

### 4.5 SMTP/Resend configured ✓

`RESEND_API_KEY` set in `gh secret list` (last rotated 2026-04-17). `SMTP_PASS` also set as fallback.

### 4.6 Bounce handling ⚠️

Resend handles soft/hard bounces via webhook to `/api/public/email/webhook`. **I have not verified the webhook is registered in the Resend dashboard.** Carlos to check Friday: Resend → Webhooks → confirm endpoint set + receiving events. If unset, the queue will keep retrying bouncers and burn sending reputation on day 1.

---

## 5. Risk Register — Top 3 Monday Blockers

### Risk 1: AEO Brief #1 doesn't fire because it's not in `sequences.json` 🔴 HIGH

- **Impact:** Tuesday May 5 broadcast is silently a no-op. Carlos thinks email launched; nothing went out.
- **Likelihood:** **Currently 100%** — the wiring gap is real, verified above.
- **Mitigation:** CMO + Eng-Lead pair Sunday May 3 to add the sequence entry, push, verify cron picks it up. Acceptance test: enroll a single internal address, confirm receipt within one cron tick (≤5 min).
- **Owner:** CMO drives, Eng-Lead executes.

### Risk 2: WABA verification slips past June 🟡 MEDIUM

- **Impact:** WhatsApp broadcast lane stays dark through Q3. Opt-in list grows but cannot be activated. Erodes credibility of the "WhatsApp launching June" promise on `/whatsapp-updates.html`.
- **Likelihood:** Moderate — Meta WABA queues commonly slip 30–60 days.
- **Mitigation:** Update the public page to say "summer 2026" not "June" (less brand debt if it slips). Continue capturing opt-ins. Treat email as the primary broadcast lane until verified.
- **Owner:** Carlos (verification follow-up with Meta).

### Risk 3: IG suppresses new-account posts 🟡 MEDIUM

- **Impact:** Carousel A reaches <50 accounts on day 1. Lookbook for the rest of week 1 collapses.
- **Likelihood:** High for genuinely new accounts; moderate for `@netwebmedia` since the handle was claimed earlier.
- **Mitigation:**
  1. **Warm the account 48 hours before Carousel A** — follow 30 SMB-marketing accounts, save 10 posts, comment on 5. Signals human use.
  2. Post Carousel A at **Mon 11:00 Santiago** (highest US-overlap window per launch kit) — not at 03:00 trying to be globally optimal.
  3. Post the **first 3 comments yourself** (3 different angles asking the audience a question) — boosts comment-density signal in the first hour.
  4. Cross-post to Facebook 5 minutes later (already in launch kit) for engagement diversification.
- **Owner:** Carlos (account warming + posting), CMO (timing oversight).

### Honorable mention: Email deliverability tank on first broadcast 🟡 MEDIUM

If `hello@netwebmedia.com` (the From address per `sequences.json`) hasn't been DKIM/SPF/DMARC-aligned at netwebmedia.com, the AEO Brief lands in Promotions/Spam. **Carlos to verify Friday:** Resend dashboard → Domains → `netwebmedia.com` → all three records green. If yellow/red on any, fix DNS at the registrar today, propagation takes 24h.

---

## Summary line for Carlos

We can launch Monday from **Email + IG (manual) + FB (manual)**. The single most urgent blocker is wiring `aeo-brief-001-launch.html` into `email-templates/sequences.json` before Sunday EOD — without that, there is no Tuesday email broadcast even though every other piece (cron, Resend, template HTML) is live. IG/FB/YT API auto-posting is a 2–4 week App Review process and will not be ready for Monday under any path; we manually post and that is fine. WhatsApp stays dark until Meta verification clears. TikTok is intentionally Q3.

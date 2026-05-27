# Facebook Business Page Conversion Plan
**NetWebMedia @netwebmedia**  
**Date:** 2026-05-27  
**Priority:** P1 (brand equity, social CTA trust signal)  
**Owner:** Meta Operations Specialist  
**Execution:** Carlos Martinez (manual Meta UI steps)

---

## 1. State of Play

The current Facebook presence (`facebook.com/profile.php?id=61573687500626`) is a **numeric Personal Profile ID**, not a branded Business Page with a vanity URL. Public WebFetch cannot penetrate Facebook's login wall to inspect completeness, but the URL structure itself leaks low trust on every footer impression and every `/social/` hub reference. The site currently links to this URL from:

- Homepage footer (`index.html`)
- 18 HTML pages across the site (pricing, about, contact, blog posts, social hub, etc.)
- Schema.org `sameAs` arrays in JSON-LD blocks on 8+ pages

**Blocker assessment:** The login wall prevents confirming profile picture, cover image, About section, or post history. No technical blockers exist for conversion — Meta allows existing Personal Profiles to be converted to Business Pages or replaced entirely. The only constraint is Carlos's manual action in the Meta UI.

---

## 2. Conversion Path Decision

### Recommendation: **Route B — Create a Fresh Business Page** (Preferred)

#### Rationale

1. **Clean institutional structure.** A new Business Page under Meta Business Suite allows proper team roles, ad account linkage, and Instagram Professional Account connection without personal-account entanglement. The old personal profile can be retired.

2. **Unblocks IG linkage.** The current IG `@netwebmedia` is not yet linked to a Business Page (per audit memory). IG Professional Account + Business Page link is a hard requirement for `ig_publish.php` and future API automation — only a Business Page, not a Personal Profile, can be the parent entity.

3. **Cleaner optics.** A founder's personal profile running company assets creates ambiguity. A branded Business Page with the correct category, vanity, and hours signals institutional credibility — exactly what AEO-focused buyers expect.

**Route A (convert in place) has one advantage:** preserves any existing followers (likely minimal on a numeric-ID profile). But the added operational friction is not worth it; Route B is faster and cleaner.

---

## 3. Step-by-Step for Carlos (Manual Meta UI)

### Phase 1: Create the New Business Page

1. **Open Facebook Business Suite:**
   - Go to `https://business.facebook.com/`
   - Log in with Carlos's personal Facebook account
   - Click **"Create account"** if you don't have a Business Manager yet, or select the existing one

2. **Create a new Business Page:**
   - In Business Manager (or directly from `business.facebook.com`), click **"Create"** → **"Page"**
   - **Page name:** `NetWebMedia` (exact match)
   - **Page category:** Select **"Marketing Agency"** as primary
   - **Secondary categories (optional):** "Internet Company" + "Digital Marketing Agency"
   - **Click "Create Page"**

3. **Claim the vanity URL:**
   - Once the page is created, go to **Settings** → **Page Info**
   - Scroll to **"Page address"** / **"Username"**
   - Enter: `netwebmedia` (your preferred vanity)
   - If taken, try fallbacks in this order:
     - `netwebmedia.agency` (requires `.agency` domain; Meta may block it)
     - `netwebmediaco` (common backup)
     - `netwebmedia2026` (if all others taken)
   - Click **"Confirm"** and wait 24 hours for Meta to activate the vanity URL

### Phase 2: Complete Page Information

4. **Add profile picture:**
   - **Settings** → **Brand Assets** → **Page Picture**
   - Upload: `assets/social/avatar-1024.svg` (export to PNG first, see Asset Checklist section 4)
   - Dimensions: Instagram crops circular profiles to ~1024×1024; the SVG is designed with 87.5% safe-area centering
   - Click **"Save"**

5. **Add cover image:**
   - **Settings** → **Brand Assets** → **Cover Photo**
   - Upload: `assets/social/header-1500x500.svg` (export to PNG, see Asset Checklist section 4 for dimension note)
   - **Note:** SVG is 1500×500 (16:5 ratio); Facebook desktop cover is 1640×924. Creative Director should export a 1640×924 PNG variant to avoid letterboxing. For now, use the 1500×500 with mobile-safe centering understood.
   - Click **"Save"**

6. **Fill in Page Details:**
   - **About section** (max 255 characters):  
     > NetWebMedia is an AI-native fractional CMO for US and LATAM SMBs. Strategy, software, and full execution in one retainer — starting at $249/mo.
   
   - **Website URL:** `https://netwebmedia.com`
   
   - **Phone number:** 
     - **Voice line:** +1 (760) 334-8731 (optional; Facebook will use this for calls)
     - **WhatsApp:** Leave blank here — WhatsApp will be configured separately via CTA button below
   
   - **Address:** Leave blank (remote company, not location-specific)

7. **Add CTA Button:**
   - **Settings** → **CTA Button**
   - Select button action: **"Send Message"**
   - Choose message destination: **"WhatsApp Business"** (once you have verified the WABA)
   - **Fallback option (if WhatsApp WABA not ready yet):** 
     - Use **"Contact Us"** button → link to `https://netwebmedia.com/whatsapp.html`
   - **Save**

8. **Set Business Hours (optional but recommended):**
   - **Settings** → **Hours**
   - Select timezone: UTC-3 (Chile, Carlos's base)
   - Set: 9 AM – 6 PM, Monday–Friday
   - This helps Meta determine response-time expectations for message requests
   - Click **"Save"**

---

## 4. Asset Checklist

### Profile Picture
- **File:** `assets/social/avatar-1024.svg` (current source)
- **Export to:** PNG, sRGB, 1024×1024
- **Safe area:** The SVG wordmark + accent ring are designed within the 87.5% center circle; Facebook's auto-crop will preserve them
- **Note:** No export process documented yet — hand off to Creative Director or use a local SVG-to-PNG tool (e.g., Inkscape, online converter)

### Cover Image  
- **File:** `assets/social/header-1500x500.svg` (current source)
- **Current dimensions:** 1500×500 (16:5)
- **Required dimensions:** 1640×924 (16:9, safe for desktop + mobile)
- **Action needed:** Creative Director to export a 1640×924 PNG variant; letterboxing will occur if using the 1500×500 as-is
- **Fallback:** Deploy the 1500×500 PNG for now; schedule Creative Director export for next sprint
- **Content note:** Includes "AI-Native Fractional CMO" tagline + lowercase `netwebmedia` wordmark

### Additional Assets (optional, nice-to-have)
- **Pinned post image:** A branded graphic introducing the service (use 1200×628 for Facebook's OG ratio)
- **Shared image for `/social/` hub:** A post-launch screenshot of the page to link from the social channels hub

---

## 5. Post-Conversion: IG Linkage

Once the Facebook Business Page is live at `facebook.com/netwebmedia`, complete the IG connection:

### Steps for Carlos

1. **Open Instagram app or instagram.com**
   - Log in as `@netwebmedia` (or the account you want to link)
   - Go to **Settings** → **Account** → **Professional Dashboard** (if not already a Professional Account)
   - If the account is still Personal, select **"Switch to Professional Account"** → choose **"Business"** as account type

2. **Link to the Facebook Business Page:**
   - **Settings** → **Account** → **Linked Accounts** (or **Facebook connections** under some language/region combos)
   - Select **"Connect to Facebook"**
   - **Choose the page:** Search for or select `NetWebMedia` (the page you just created at `facebook.com/netwebmedia`)
   - **Grant permissions** when prompted (IG will ask for Page management access)
   - Click **"Done"**
   - Verify the link appears as **"Connected: NetWebMedia"** in the Linked Accounts section

3. **Confirm the link in Business Suite:**
   - Return to `business.facebook.com`
   - Go to your **NetWebMedia** page
   - **Settings** → **Instagram Accounts**
   - You should see `@netwebmedia` listed as linked
   - Click **"Confirm"** if a confirmation prompt appears

### After IG Link Succeeds

Once the link is confirmed, send Slack/email to Engineering Lead with this info:
- Instagram Business Account ID (visible in Business Suite at `Settings → Instagram Accounts`, or via `/ig_business_account` API endpoint)
- IG Graph API token (Engineering Lead will generate this in Meta Developer Console)

These values will be added to GitHub Secrets as `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN`, then deployed via `deploy-site-root.yml` to `crm-vanilla/api/config.local.php`, unblocking `ig_publish.php`.

---

## 6. Repo-Side Changes After Vanity Is Live

### File URLs Requiring Update

Once `facebook.com/netwebmedia` is confirmed live, sweep these 18 files. Replace all instances of:
```
https://www.facebook.com/profile.php?id=61573687500626
```
with:
```
https://www.facebook.com/netwebmedia
```

**Files to update (exact paths):**

| File | Line(s) | Context |
|------|---------|---------|
| `index.html` | TBD | Footer social link + schema.org sameAs |
| `about.html` | 47, 122, 582 | sameAs array + footer link |
| `blog.html` | 44, 119, 7048 | sameAs + footer link (auto-generated, verify generator) |
| `pricing.html` | TBD | Footer link |
| `contact.html` | TBD | Footer link |
| `services.html` | TBD | Footer link |
| `faq.html` | 57 | sameAs |
| `case-studies.html` | 506 | Footer link with bilingual data-en/data-es |
| `aeo-index.html` | 535 | Footer link |
| `aeo-agency.html` | 39 | sameAs |
| `aeo-methodology.html` | 674 | Footer link |
| `analytics.html` | 221, 451 | sameAs + footer link |
| `cart.html` | 201 | Social icon link |
| `results.html` | TBD | Footer link |
| `blog/...` (partial list) | Many | Footer link (auto-generated; verify blog generator template if it exists) |

**Schema.org sameAs arrays:** These blocks appear in the `<head>` of most pages as JSON-LD `Organization` or `WebPage` types. Ensure both the `sameAs` array AND any clickable footer links get updated in the same pass.

**Bilingual pages:** A few pages have `data-en` / `data-es` attributes on links (e.g., `case-studies.html` line 506). Ensure the replacement text is plain (no language-specific variants needed).

### Verification Checklist

After the sweep:
- [ ] `grep -r "profile.php?id=" --include=*.html` returns 0 matches
- [ ] `grep -r "facebook.com/netwebmedia" --include=*.html` returns ≥18 matches
- [ ] Schema.org sameAs arrays on homepage, blog, and industry hubs all point to `facebook.com/netwebmedia`
- [ ] Footer social links on all pages now route to the vanity URL
- [ ] Test `/social/` hub page — ensure Facebook link is clickable and routes to the new vanity

---

## 7. Pre-Publish Checklist

**Before Carlos creates the new Business Page:**
- [ ] Confirm vanity `netwebmedia` is available at Meta (do a quick manual check at `facebook.com/netwebmedia` — should return 404 or "page not found")
- [ ] Backup current page ID (61573687500626) in a private note in case rollback is needed
- [ ] Alert the CMO: new page will have 0 followers initially; IG link will reset follower sync counts

**After the page is live:**
- [ ] Test `facebook.com/netwebmedia` loads with correct name, profile picture, cover, and About blurb
- [ ] Verify CTA button routes correctly (WhatsApp or `/whatsapp.html` fallback)
- [ ] Confirm IG @netwebmedia links successfully to the page (should appear in IG → Settings → Linked Accounts)

**Before deploying repo changes:**
- [ ] Carlos confirms the vanity URL is live and stable (wait 24–48 hours after creation to avoid Meta sync delays)
- [ ] Grep the repo one more time to confirm the old URL is not referenced elsewhere (e.g., in comments, docs, generators)

---

## 8. Risks & Rollback

### What Can Go Wrong

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Vanity `netwebmedia` is taken | Low | Must use fallback vanity (netwebmedia.agency, netwebmediaco, etc.); repo sweep needs adjustment | Pre-check availability; have 2 fallback names ready |
| IG link fails after Business Page creation | Medium | `ig_publish.php` continues to 503; delays IG automation | Confirm IG is a Professional Account BEFORE linking; re-link via Settings if needed |
| Page goes into review/quarantine | Low | Page unavailable for 24–72 hours; business metadata missing | Keep old profile URL in an emergency note; revert repo if needed |
| Facebook rate-limits or blocks the page (due to prior activity) | Low | New page restricted; must appeal to Meta support | Unlikely; happens only if prior profile had violation history |
| Old followers on personal profile don't transfer | High (expected) | Lose any existing IG/FB followers (likely <50) | Acceptable trade-off; original profile ID has minimal engagement |

### Rollback Plan

If the Business Page creation fails or the IG link breaks mid-way:

1. **Pause the repo sweep** — do NOT update HTML files until IG link is confirmed live
2. **Keep the old numeric URL in production** until Carlos confirms new page is stable
3. **Fallback:** Restore the repo to use `facebook.com/netwebmedia` once you're confident the vanity will stick (wait 48 hours post-creation)
4. **If vanity URL reverts to numeric ID:** That means Meta failed the vanity claim; try the next fallback name or contact Meta support

---

## 9. Post-Conversion Success Metrics

Within 48 hours of going live, verify:

- [ ] `facebook.com/netwebmedia` resolves with correct branding (name, avatar, cover, About)
- [ ] All 18 repo files updated with the new vanity URL (no stray profile.php references)
- [ ] IG @netwebmedia shows linked Facebook page in Linked Accounts
- [ ] CTA button on the FB page is clickable and routes to WhatsApp or `/whatsapp.html`
- [ ] Schema.org sameAs arrays on the site reference the new URL
- [ ] Google Search Console does not flag mixed or redirect issues (re-crawl the homepage after 24 hours)
- [ ] No 404s or broken social links in the site footer (smoke test 5 random pages)

---

## Appendix: Brand Copy for the Page

### Page Name
**NetWebMedia**

### Short Description (255 char max)
NetWebMedia is an AI-native fractional CMO for US and LATAM SMBs. Strategy, software, and full execution in one retainer — starting at $249/mo.

### About Section (full)
We are an AI-native fractional CMO agency serving small and mid-size businesses across the US and Latin America. We deliver CMO-level strategy, AI-powered software stacks, and full-execution services — all in one monthly retainer.

What we do: AI automations, CRM implementation, paid advertising, answer-engine optimization (AEO), SEO and content, social media, and video production. We specialize in getting you cited by ChatGPT, Perplexity, and Google AI Overviews — the channels where B2B discovery is already happening.

Our pricing starts at $249/month (Starter tier), scaling to $2,490/month (Premium tier), with a Growth tier at $999/month in between.

We operate bilingually in English and Spanish, serving both US-based businesses and LATAM companies growing into the US market.

### Contact Info
- **Phone (voice):** +1 (760) 334-8731
- **WhatsApp:** (will be set via CTA button, separate from voice line)
- **Website:** https://netwebmedia.com
- **Email:** hello@netwebmedia.com

### CTA Button
- **Action:** Send WhatsApp Message
- **Destination:** +1 (442) 385-4585 (once WABA verified; fallback to Contact Us button linking `/whatsapp.html` until then)

### Categories
- **Primary:** Marketing Agency
- **Secondary:** Internet Company, Digital Marketing Agency

---

## Summary for Carlos

**Route:** Create a new Business Page at `facebook.com/netwebmedia` (recommended over converting the old personal profile).

**Top 3 manual steps:**
1. Create Business Page in Meta Business Suite → claim vanity `netwebmedia` → set profile picture, cover, About, CTA button
2. Upgrade IG @netwebmedia to Professional Account → link to the new Facebook page
3. Wait 48 hours for Meta to stabilize the vanity, then trigger the repo sweep (18 files, one pattern replacement)

**Files to update afterward:** 18 HTML files + any auto-generated blog pages (verify the blog generator if it references Facebook)

**Risks:** Vanity unavailable (fallback plan ready), IG link fails (re-link from Settings if needed), page quarantine (rare but possible — keep old URL handy for emergency revert)

**Timeline:** 2–4 hours for Carlos (Meta UI clicks) + 30 min repo sweep + 48 hours waiting for Meta to stabilize = 3 days to full deployment.

---

*Prepared by: Meta Operations Specialist*  
*Date: 2026-05-27*  
*Status: Ready for Carlos review and execution*

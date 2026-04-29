# Distribution Checklist for New Content Pages
## Gate Every PR: Ensure Discovery Before Merging

**Created:** 2026-04-29  
**Owner:** Engineering Lead / Content Strategist  
**Purpose:** Prevent "shipped but not surfaced" content drops. Every new top-level content page must pass all 10 items before PR merge.  
**Baseline audit context:** Site is at 7.2/10 production quality but 1/10 distribution. This checklist fixes the gap.

---

## Pre-Merge Checklist (Before git push)

### 1. Sitemap inclusion
- [ ] New page URL is added to `/sitemap.xml`
- [ ] Verify: `grep "[page-url]" sitemap.xml` returns the URL
- [ ] Verify: `<loc>https://netwebmedia.com/[new-page].html</loc>` format matches all other entries
- [ ] Run `node scripts/regen-sitemap.js` if sitemap.xml is auto-generated

**Why:** Google won't discover the page in a structured way until sitemap is updated. Without it, indexing is slow or non-existent.

---

### 2. Schema.org JSON-LD validation
- [ ] Page includes relevant schema blocks (Article, FAQPage, WebPage, CollectionPage, or HowTo as appropriate)
- [ ] Schema is valid: run through https://validator.schema.org/ or Google's Rich Results Test
- [ ] `@context` and `@type` are both present
- [ ] `name`, `description`, `datePublished`, `author`, `publisher` are all populated
- [ ] Image objects include `url`, `width`, `height`
- [ ] No hardcoded test domains (all URLs point to netwebmedia.com)

**Why:** LLMs and Google's AI Overviews parse schema first. Invalid schema = won't get cited.

---

### 3. Internal cross-linking (PageRank distribution)
- [ ] Page links to at least 2 other relevant pillar/hub pages (with descriptive anchor text, not generic "read more")
- [ ] At least 1 other pillar page links *back* to this new page (reciprocal links)
- [ ] Links use relative paths (`/aeo-methodology.html`) not full URLs
- [ ] Anchor text is specific ("3 design-partner case studies →" not "click here")

**Why:** Internal links are free PageRank. Isolated pages get buried. Reciprocal linking creates a reinforcing cluster.

---

### 4. Homepage card / hub visibility (if applicable)
- [ ] If page is a pillar (methodology, case studies, survey, guide), does it appear on the homepage as a featured card or link?
- [ ] Check: does `index.html` link to the new page? If yes, is the card above the fold or in a "Featured" section?
- [ ] If not on homepage, is it linked from a category page (services.html, blog.html, etc.)?
- [ ] Verify link text is descriptive, not "Learn more"

**Why:** Homepage is your highest-authority page. New content needs exposure there or it's invisible to most visitors.

---

### 5. Bilingual data attributes (if applicable)
- [ ] All user-facing text has both `data-en` and `data-es` attributes (if bilingual pages are enforced on your site)
- [ ] Search for `data-en=` on the page and verify every instance has a matching `data-es` twin
- [ ] Spot-check: toggle language in js/main.js's language bar and verify both versions render

**Why:** Language switch will leak and confuse users if attributes are inconsistent.

---

### 6. Mobile responsiveness test
- [ ] Page renders correctly at 375px (mobile), 768px (tablet), and 1200px+ (desktop)
- [ ] No horizontal scroll at mobile widths
- [ ] CTA buttons are at least 44px height (tap target size)
- [ ] Form inputs are at least 16px font-size (prevents auto-zoom on iOS)

**Why:** 60%+ of traffic is mobile. Broken mobile = high bounce = poor GSC signals.

---

### 7. GA4 event tracking
- [ ] Page fires a GA4 event on CTA clicks (e.g., "contact_clicked", "survey_submit")
- [ ] Event includes relevant context (`event_label`, `event_category`, `event_value`)
- [ ] Verify in GA4 admin: event is listed in "Custom definitions" if it's non-standard
- [ ] Test: open DevTools Network tab, trigger the CTA, verify event fires

**Why:** Without events, you can't measure conversion or engagement. Dark traffic = wasted content.

---

### 8. Canonical URL correctness
- [ ] Page has a `<link rel="canonical" href="https://netwebmedia.com/[page].html" />` tag
- [ ] Canonical URL matches the live domain (non-www, HTTPS)
- [ ] No trailing slash for top-level pages (`/services` not `/services/` or `/services.html`)
- [ ] Nested pages keep `.html` extension (`/blog/some-post.html`)

**Why:** Mismatched canonicals confuse Google and fragment your PageRank across duplicate URLs.

---

### 9. IndexNow ping prepared
- [ ] URL is ready to submit to IndexNow API (once page goes live)
- [ ] Prepare the IndexNow ping command: `curl -X POST https://api.indexnow.org/indexnow -H "Content-Type: application/json" -d '{"host":"netwebmedia.com","key":"[KEY]","keyLocation":"https://netwebmedia.com/indexnow.txt","urlList":["https://netwebmedia.com/[page].html"]}'`
- [ ] IndexNow key is stored in the repo (`.github/secrets/INDEXNOW_KEY` or similar)
- [ ] Note: this happens *after* merge, not before

**Why:** IndexNow pushes indexing from days to hours. Manual submission is better than waiting for crawl.

---

### 10. Documentation / audit trail
- [ ] Commit message includes: page purpose, expected audience, primary keyword (if SEO-focused)
- [ ] Example: `content: ship aeo-methodology.html — answer-engine optimization framework for SMBs`
- [ ] Page audit comment in the PR: "New page added. Schema validated. Sitemap updated. Cross-links live on [3 related pages]. Ready for IndexNow ping."
- [ ] Team Slack notification (optional): "New content ship: [page name] — ready for distribution"

**Why:** Future team members need to know what was deployed and why. Audit trail prevents duplicate work.

---

## Post-Merge Workflow (Within 24 Hours)

### 11. IndexNow submission (same day)
```bash
# Submit to IndexNow
curl -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json" \
  -d '{
    "host":"netwebmedia.com",
    "key":"[KEY]",
    "keyLocation":"https://netwebmedia.com/indexnow.txt",
    "urlList":["https://netwebmedia.com/[new-page].html"]
  }'
```
- [ ] Confirm HTTP 202 response (request accepted)
- [ ] Log submission in team notes

---

### 12. Google Search Console URL Inspection
- [ ] Go to https://search.google.com/search-console/about
- [ ] URL Inspection tab → paste new page URL → "Request Indexing"
- [ ] Wait for "Inspection result" (usually 30–60 seconds)
- [ ] Note the status: "Inspected" or "Discovered – currently not indexed"
- [ ] If "Not indexed", check for issues (redirect chains, noindex tag, robots.txt block)

---

### 13. Social promotion (if applicable)
- [ ] Tweet a link to the new page (from NetWebMedia or Carlos's account)
- [ ] LinkedIn post linking to the page (with a 2-3 sentence hook)
- [ ] Email to subscriber list (if it's a major piece)
- [ ] Internal Slack #general announcement (with link)

---

## Example: Applying This Checklist

**Scenario:** You're shipping a new blog post (`blog/aeo-replaces-seo-2026.html`)

1. ✓ Add URL to sitemap.xml
2. ✓ Validate Article + FAQPage schema via https://validator.schema.org/
3. ✓ Add 2 internal links (to aeo-methodology.html, case-studies.html)
4. ✓ Add reciprocal link: edit aeo-methodology.html to mention the new blog post
5. ✓ Add card/link to blog.html or index.html's "Latest posts" section
6. ✓ Verify bilingual attributes (if site supports it)
7. ✓ Test on mobile (375px, 768px, 1200px)
8. ✓ Add GA4 event: `gtag('event', 'blog_post_cta', { 'event_label': 'aeo-replaces-seo' })`
9. ✓ Canonical: `<link rel="canonical" href="https://netwebmedia.com/blog/aeo-replaces-seo-2026.html" />`
10. ✓ Commit: `content: ship blog post on AEO vs. SEO — clarifies core positioning for SMB audience`
11. ✓ (Post-merge) Submit IndexNow
12. ✓ (Post-merge) GSC URL Inspection request
13. ✓ (Post-merge) Tweet + LinkedIn post

**Total time:** 30–45 minutes of work spreads across pre-merge (20 min) and post-merge (10–25 min).

---

## Audit Trigger

**When to rerun this checklist on existing pages:**

- Any page that hasn't been audited in 3+ months
- Any page with <100 monthly visits despite being in sitemap
- Any page that had schema/links added after initial launch
- Before any SEO tool audit (Semrush, Ahrefs, etc.)

---

## Anti-Pattern: What This Prevents

| What went wrong | Caused by | Solution |
|---|---|---|
| "Site launched 3 months ago, 5 impressions in Google Search Console." | New pages added to repo but not to sitemap. | Item 1: Sitemap inclusion |
| "We shipped case studies but they rank behind the homepage for our own brand name." | Pages exist but are isolated (no internal links). | Item 3: Cross-linking |
| "AEO is on the blog, methodology is on another page, survey is buried — users don't know they're related." | Content cluster is fragmented; no hub. | Item 4: Homepage visibility |
| "Spanish version of the page has English text leaking through." | Inconsistent bilingual attributes. | Item 5: Bilingual consistency |
| "We got 200 visitors to the page but can't tell what they clicked." | No GA4 events. | Item 7: GA4 tracking |
| "Google found the page 2 weeks later and indexed the duplicate www version." | Canonical mismatch. | Item 8: Canonical correctness |

---

## Owner Responsibility

**Content Strategist** (you):
- Items 3, 4, 5, 10 (copy + structure + GA4 naming)

**Engineering Lead**:
- Items 1, 2, 6, 7, 8, 9, 11, 12 (technical validation + deployment)

**Either** (assign to whoever is merging the PR):
- Item 13 (social promotion)

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2026-04-29 | Initial checklist based on site audit findings. 7.2/10 quality, 1/10 distribution. | Engineering Lead + Content Strategist |

---

**Next review:** 2026-08-29 (quarterly)  
**Last audit:** Day-end 2026-04-29 (3 pillars: aeo-methodology.html, case-studies.html, aeo-survey.html added + cross-linked)

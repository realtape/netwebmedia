# PageSpeed Insights Baseline — netwebmedia.com

**Captured:** 2026-04-28 (post-hardening pass)
**Status:** ⚠️ **Blocked on rate limits.** PSI's unauthenticated quota is ~50 requests/hour per IP and we exhausted it during the verification cycle. Documented here so the work isn't lost.

## What's been hardened (re-baseline against this list)

This list reflects every change shipped in the Apr 28 audit→fix arc. Re-run the baseline after these are stable to confirm no regression:

- CSP `Content-Security-Policy-Report-Only` header
- Google Fonts moved from CSS `@import` to HTML `<link rel="preload" as="style">` (top 6 root pages)
- `loading="lazy" decoding="async"` on below-fold images
- GA4 + Meta Pixel snippet injected on all 68 industry LPs (was: root only)
- OG image + Twitter Card metadata injected on 11 root pages + 68 LPs + 14 niche hubs
- 5 per-section OG images (1200×630) + 14 per-niche OG images (1200×630)
- 7 brand image assets at `/assets/social/`
- IndexNow workflow + key file (Bing/Yandex/Seznam/Naver/Yep auto-ping on every deploy)
- `/.well-known/security.txt`, `/humans.txt` (production hygiene)
- `_us_*.php` purged + internal HTML denied via `.htaccess`
- Sitemap regenerated with all 69 industry URLs + true `lastmod` from git log
- 60 LP `provider.@type` corrected to `ProfessionalService` + 60 FAQPage schemas added
- `sameAs` Organization schema corrected to only the 2 real social URLs (IG + FB)
- Form auto-heal in api-php (no more silent 404 on missing form slugs)
- Rate-limiting on `/api/public/forms/submit` (10/IP/hour)

## How to capture the baseline (when rate limits clear)

### Option A — public PSI API (free, eventual)
Wait ~1 hour from last run, then run a Python one-liner with 30+ second delays between calls:
```bash
python -c "import urllib.request, urllib.parse, json
api='https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fnetwebmedia.com%2F&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo'
print(json.loads(urllib.request.urlopen(api).read())['lighthouseResult']['categories'])"
```

### Option B — Lighthouse CI runner (recommended for ongoing monitoring)
1. Get a free PSI API key: https://developers.google.com/speed/docs/insights/v5/get-started#APIKey
2. Add to GitHub Actions secret `PSI_API_KEY`
3. Add a workflow `.github/workflows/psi-baseline.yml` that runs weekly on a cron, posts deltas to Slack/email

### Option C — Browser DevTools (quickest)
Open Chrome DevTools → Lighthouse tab → Mobile → Generate report. Manual but reliable.

## Pages to baseline (priority order)

| Page | URL | Priority |
|---|---|---|
| Home | https://netwebmedia.com/ | P0 |
| Services | https://netwebmedia.com/services | P0 |
| Pricing | https://netwebmedia.com/pricing | P0 |
| Contact | https://netwebmedia.com/contact | P0 |
| Legal LP | https://netwebmedia.com/industries/professional-services/legal/ | P0 |
| Restaurants LP | https://netwebmedia.com/industries/restaurants/ | P1 |
| Industries hub | https://netwebmedia.com/industries/ | P1 |
| AEO agency | https://netwebmedia.com/aeo-agency | P1 |
| Hotels LP | https://netwebmedia.com/industries/hospitality/hotels/ | P2 |
| About | https://netwebmedia.com/about | P2 |

## Targets

- **Performance** ≥ 70 mobile (90+ desktop) for content-rich pages
- **Accessibility** ≥ 95 — anything lower is a P1
- **Best Practices** ≥ 95
- **SEO** ≥ 95

Anything below target is a fix-this-sprint item.

## Known performance risks (from the engineering audit)

These were fixed in the hardening pass but may still show up in the baseline as opportunities:

1. **`@import` Google Fonts** — replaced with HTML preload. Should now show "preconnect to required origins" passing.
2. **Logo PNG used at 48px** — `nwm-logo-lockup.png` is 46 KB at the size of a thumbnail. Worth swapping nav logo to inline SVG (`nwm-logo-horizontal.svg`, 414 B). Not done in this pass.
3. **Hero canvas particle animation** (`#particles-canvas` in index.html) — main-thread cost on low-end mobile. Fix: gate on `prefers-reduced-motion` AND `navigator.deviceMemory < 4`.
4. **No `width`/`height` attributes on most `<img>`** — CLS risk. Fix: explicit dimensions on every image.

These are the next P1 perf targets after we have a real baseline number to chase.

---

## Sentry status (2026-04-28 audit)

**Wiring:** correct. **DSN:** empty.

- `js/nwm-sentry.js` is a solid lazy-loader: gates on `window.NWM_SENTRY_DSN`, lazy-loads Sentry browser SDK from CDN, sets `tracesSampleRate: 0.1` in prod, filters known false-positive errors (`ResizeObserver loop limit exceeded`, etc.).
- It is **only included on `index.html`** (lines 34-37: empty DSN, then `<script src="/js/nwm-sentry.js" defer>`). Other pages have no Sentry hook.
- DSN is empty → SDK never loads → no telemetry today.

**To activate (5 minutes once you have a Sentry account):**

1. Create a Sentry project at https://sentry.io → JavaScript / Browser → grab the DSN.
2. In `index.html` line 36, set `window.NWM_SENTRY_DSN = 'https://...@o....ingest.sentry.io/...'`. Or better: put it in a small server-rendered include so the DSN doesn't ship in static HTML for non-prod hosts.
3. Propagate the same 3-line snippet (DSN + RELEASE + script tag) to: `services.html`, `pricing.html`, `contact.html`, `about.html`, `aeo-agency.html`, `industries/index.html`, and the 68 LP `industries/**/index.html` files. Use the same pattern as the GA4 injection (Python script touching all of them at once).
4. Confirm errors stream into Sentry by triggering one with `Sentry.captureException(new Error('test'))` from the browser console.

Until then, runtime errors are silent on the production site.


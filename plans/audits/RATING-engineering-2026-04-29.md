# Engineering Technical Rating — netwebmedia.com (2026-04-29, 19:10 UTC)

> Third audit of the day. Skips ground covered in `plans/audit-2026-04-29.md` (morning) and `plans/audits/SYNTHESIS-POST-BUILD-2026-04-29.md` (afternoon pen-test). Focus: as-shipped state right now, after the `?v=8` cache-bust.

## Overall technical rating: **6.5 / 10**

Strong on edge headers, CSS/JS caching, and security hygiene. Held back by a **P0 functional regression** (public APIs return 403/404 to the world), a stack still on **HTTP/1.1**, and a hero that can ship LCP without a `fetchpriority` hint.

## Sub-ratings

| # | Dimension | Score | One-line rationale |
|---|---|---|---|
| 1 | Core Web Vitals | **6.5** | PSI HTML render blocked the headless fetch; manual: TTFB 657 ms, gzipped HTML 19.7 KB, no LCP `fetchpriority`, typewriter is text-only (no CLS risk), 13 scripts including 3 deferred + GA + (conditional) Meta Pixel. Likely mobile LCP 2.4–3.2 s on 4G. |
| 2 | Asset delivery | **7** | gzip on, `Vary: Accept-Encoding`, `<link rel=preload as=style>` for fonts, `media=print` swap pattern. **No HTTP/2** (`http_version: 1.1`) and **no Brotli** — leaving 15–25% bytes on the table. Hero images not preloaded; `nav-logo-lockup.png` is `loading=lazy` (correct for nav, but no LCP candidate is hinted). |
| 3 | Caching strategy | **8** | HTML: `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` — textbook. CSS/JS: `max-age=31536000, immutable` confirmed on `?v=8`. Google Fonts CSS is `private, max-age=86400` (Google's choice; cannot override). One nit: `Vary: Accept-Encoding,User-Agent` — the `User-Agent` half balloons the CDN cache key with no benefit. |
| 4 | Security headers | **8.5** | HSTS preload, XFO SAMEORIGIN, X-Content-Type-Options, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locking camera/mic/geo, **CSP enforced (not Report-Only)**. Two real gaps: CSP allows `'unsafe-inline'` on script-src (forced by inline gtag/Meta Pixel/Sentry DSN bootstrap) and there's no `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`. securityheaders.com fetch was blocked (403); based on the headers we ship, expected grade **A** (not A+ because of `unsafe-inline`). |
| 5 | Mobile readiness | **8** | Viewport correct, `lang="en"` set, hreflang en/es/x-default, OG + Twitter complete. Tap targets and contrast not verified in this audit. |
| 6 | HTML / accessibility | **7** | Single `<h1>`, semantic `<section>`, JSON-LD graph (Org + WebSite + WebPage + FAQ + BlogPosting). Two minor: `<img>` with `loading="lazy"` on the nav logo (will block first paint of the brand mark above the fold) and 13 `<script>` tags in the head — defensible but worth auditing. |
| 7 | API health | **3** | **Broken in production.** `.htaccess` line `RewriteRule ^api-php(/|$) - [F,L]` returns 403 for every direct hit on `api-php/routes/*.php`. The homepage calls `/api/public/newsletter/subscribe` and `/api/public/audit`, both **404**. Rate limiting can't be evaluated because nothing reaches the app. This is a P0 functional regression — newsletter signups silently fail. |
| 8 | Observability | **7** | Sentry inlined (DSN visible — fine, it's a public DSN), GA4 wired (`G-V71R6PD7C0`), Meta Pixel gated on env. Missing: server-side error tracking on the PHP API, no synthetic uptime alert on `/api/public/*`, no error-budget SLO doc. Today's API outage would not page anyone. |
| 9 | DNS / SSL | **7.5** | TLS handshake clean, HSTS includes `preload`, cert chain serves at apex. SSL Labs scan was still `IN_PROGRESS` at audit time (not a Cloudflare-fronted site; cold InMotion IP `192.145.235.82` is slower to assess). **HTTP/1.1 only** — no h2, no h3. ALPN advertises only `http/1.1`. cPanel/Apache supports h2; this is a config flip, not a migration. |

## Top 3 wins (do not regress)

1. **CSP enforced + HSTS preloaded.** This is rare for a vanilla static site on cPanel and you got it right. The `connect-src` allowlist is tight (Sentry + GA + ipapi + IndexNow only).
2. **Cache strategy is correct on both ends.** HTML edge-cacheable for 5 min with 24 h SWR, static assets immutable for a year, busted by `?v=N` query string. This is the right model.
3. **CSS @import → preload swap on Google Fonts.** Removed the SPOF the morning audit didn't catch. `media="print"` + `onload="this.media='all'"` is the correct async-CSS pattern.

## Top 5 improvements ranked by impact ÷ effort

1. **Restore the public API** (impact: 10, effort: 1). Either drop the `RewriteRule ^api-php(/|$) - [F,L]` block or front it with `/api/public/*` → `api-php/routes/public.php` rewrites. Without this, newsletter signup, lead capture, and audit form **all fail in prod**. Add a synthetic check (`uptime-smoke.yml`) that POSTs an empty body and asserts 400, not 404.
2. **Enable HTTP/2 in cPanel** (impact: 7, effort: 1). One toggle in WHM "Apache Tweak Settings" or `EasyApache → mod_http2`. ~20% real-world latency win on multi-asset pages, frees up the 6-connection-per-host limit.
3. **Add Brotli + drop `User-Agent` from `Vary`** (impact: 5, effort: 1). `mod_brotli` ships with EasyApache 4. Saves 15–25% on text. `Vary: User-Agent` shatters the CDN cache key for no gain.
4. **Hint the LCP element** (impact: 5, effort: 2). Add `fetchpriority="high"` to whatever the hero image actually is, and `<link rel="preload" as="image" fetchpriority="high">` for the same. Removes the `<img loading="lazy">` from the nav logo so it paints with the header.
5. **Add server-side observability + uptime alerts** (impact: 6, effort: 3). Sentry-PHP in `api-php/_lib/bootstrap.php`, plus a Healthchecks.io ping on `health.php`. Today's silent 403 outage would have paged within 5 min.

## What I measured

- **Headers (curl with browser UA):** HTML returns `200 OK`, gzip, HSTS preload, full enforced CSP. CSS/JS return `200`, immutable cache, gzip. Server: `Apache`, HTTP/1.1.
- **Latency:** TTFB 657 ms, total 886 ms, 19.7 KB gzipped HTML on a single request from this machine.
- **API probes:** `/api/public/newsletter/subscribe` → 404, `/api/public/audit` → 404, `/api-php/routes/public.php?type=blog` → 403, `/api-php/routes/health.php` → 403, 25-burst all 403 (from .htaccess `[F,L]`, not a rate limiter).
- **PSI:** [Mobile](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fnetwebmedia.com&form_factor=mobile) and [Desktop](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fnetwebmedia.com&form_factor=desktop) — UI didn't render results to my fetcher; rerun manually for hard numbers.
- **securityheaders.com:** `https://securityheaders.com/?q=netwebmedia.com&hide=on&followRedirects=on` — fetch returned 403 to me (their bot block); expected grade **A** based on the headers we serve.
- **SSL Labs:** `https://www.ssllabs.com/ssltest/analyze.html?d=netwebmedia.com` — still `IN_PROGRESS` at audit time; rerun in 10 min.
- **Source files reviewed:** `C:\Users\Usuario\Desktop\NetWebMedia\index.html` (lines 1–145, 1166–1254), `C:\Users\Usuario\Desktop\NetWebMedia\.htaccess` (api-php block), `C:\Users\Usuario\Desktop\NetWebMedia\api-php\routes\` (40 PHP files; no `public-blog.php` or `public-forms.php` — only `public.php`).

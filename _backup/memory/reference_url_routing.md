---
name: netwebmedia.com URL routing rules
description: Apache routing patterns for netwebmedia.com — affects sitemap, internal links, and any URL referenced from outside (ads, email campaigns, social posts).
type: reference
originSessionId: f2ea7f5f-7a1e-458f-864d-9fe0d92ec6b7
---
netwebmedia.com is served from cPanel/Apache as flat HTML files. The routing is asymmetric:

- **Top-level pages**: extensionless works, trailing slash 404s
  - ✅ `/pricing` → serves `pricing.html`
  - ✅ `/pricing.html` → serves `pricing.html`
  - ❌ `/pricing/` → 404 (Apache treats as directory request)
- **Nested pages (`/blog/`, `/lp/`, `/tutorials/`, etc.)**: need `.html`, extensionless 404s
  - ✅ `/blog/aeo-replaces-seo-2026.html`
  - ❌ `/blog/aeo-replaces-seo-2026` → 404
  - ❌ `/blog/aeo-replaces-seo-2026/` → 404
- **Directory roots**: only work if the directory has its own `index.html`
  - ✅ `/`, `/blog/`, `/tutorials/` (these dirs have index.html)
- **Canonical**: non-www. All `<link rel="canonical">` tags point to `https://netwebmedia.com/...` (no www subdomain). Sitemap should match.

**Why it matters:**
- Sitemap URLs must follow these patterns or Google will mark every page as 404. (Discovered 2026-04-28: original sitemap had `/pricing/`, `/blog/post/` — all 404s. Fix landed in `sitemap.xml`.)
- Same applies to ad landing pages, email campaign URLs, social posts, third-party citations.
- If you want prettier URLs (`/blog/post` without `.html`), add Apache `MultiViews` to nested dirs OR write explicit `.htaccess` rewrites.

**Deploy path filter caveat:** `.github/workflows/deploy-site-root.yml` has a `paths:` filter — `sitemap.xml` and `robots.txt` were missing originally; added 2026-04-28. If you add a new top-level file (e.g., `humans.txt`, `ads.txt`), add it to the path filter or pushes won't deploy.

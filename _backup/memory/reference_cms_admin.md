---
name: cms-admin
description: "The cms/ NetWeb CMS admin surface — live, HTTP-Basic gated, undocumented in CLAUDE.md; its CRUD pattern and resource types"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6ad8a055-0dd6-4ceb-a635-4b8bd43676e1
---

`cms/` is a live admin CMS deployed at **netwebmedia.com/cms/** (NOT documented in CLAUDE.md, which otherwise is exhaustive). It is separate from both `crm-vanilla/` (internal CRM of record) and `app/` (customer dashboard).

- **Auth:** entire `/cms/` is behind HTTP Basic auth — `WWW-Authenticate: Basic realm="NetWebMedia Admin"` (set server-side at InMotion, not in repo `.htaccess`). Anonymous requests get 401, so you can't curl-verify content; verify via local/preview server instead. Landing page `nwm-cms.html` is public (200, in deploy smoke test).
- **Deploy:** ships via `deploy-site-root.yml` (`cms/**` is in both the path triggers and the `for d in …` staging loop).
- **Canonical CRUD pattern:** `cms/js/module-table.js` → `NWM.mount({type, title, columns, fields, rowActions, onRow})`. Persists through the generic EAV store `/api/resources/<type>` (webmed6_nwm). Working reference page: `cms/ads.html`. Shared client: `cms/js/api-client.js` (`window.NWMApi`).
- **Canonical resource types** (the public `/api/public/stats` endpoint counts these): `page`, `blog_post`, `landing_page`, `form`, `template` (+ contact, deal). Additional CMS types in use: `ad_campaign`, `ai_agent`, `seo_keyword`, `social_post`, `media_asset`, `membership_tier`.
- **`cms/js/data.js` is mock seed data only** (same caveat as crm-vanilla's data.js) — never source of truth.
- **History:** as of 2026-05-20 all the previously-stubbed mock pages (Pages, Blog, Landing Pages, Forms, Templates, Media, Memberships) were converted to real module-table CRUD; their old per-page mock JS modules were deleted. Display-only pages **Dashboard (index), SEO, Settings** still have non-functional buttons (Quick Create / Run Audit / Edit-Connect-Manage) and a hardcoded date on the dashboard — left as "missing features," not yet wired. Related: [[feedback-stale-industry-generators]].

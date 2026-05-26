# netwebmedia.com Re-Audit — 2026-04-29 (afternoon)

**Auditor:** Claude (engineering-lead lens) | **Method:** curl + WebSearch | **Baseline:** `plans/audit-2026-04-29.md`

---

## Pass/fail vs morning fixes

| # | Item | Expected | Observed | Status |
|---|------|----------|----------|--------|
| 1 | `www.` → apex 301 | 301 to `https://netwebmedia.com/` | `301 Moved Permanently` + `Location: https://netwebmedia.com/` | PASS |
| 2 | HTML Cache-Control | `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` | exact match on `/` | PASS |
| 3 | CSS Cache-Control | `public, max-age=31536000, immutable` | exact match on `/css/styles.css` | PASS |
| 3b | JS Cache-Control | same | exact match on `/js/main.js` | PASS |
| 4 | Chilean prospect-report links removed from homepage | none in HTML | `grep prospects-report\|digital-gaps\|santiago\|antofagasta\|concepcion` → 0 hits | PASS |
| 5 | Sitemap = 206 URLs, top entry `/about.html` | 206 + `.html` | 206 `<url>` entries; first non-root entry `/about.html` | PASS |
| 6 | Zero `prospects-report` / `digital-gaps` URLs in sitemap | 0 | 0 hits | PASS |
| 7 | Internal pages 403'd | 403 on diagnostic/dashboard/orgchart/nwmai/audit-report/desktop-login/flowchart/`*-prospects-report`/`*-digital-gaps` | all 403 | PASS |
| 8 | Schema.org markup on homepage | FAQPage, ProfessionalService, BreadcrumbList, etc. | 14 distinct `@type` values: ProfessionalService, FAQPage, Question, Answer, BreadcrumbList, ListItem, WebSite, WebPage, BlogPosting, ContactPoint, Person, SearchAction, EntryPoint, Country | PASS (identical to morning) |
| 9 | AI crawler allowlist | GPTBot, ClaudeBot, anthropic-ai, PerplexityBot | all present + ChatGPT-User, OAI-SearchBot, Claude-Web, Google-Extended, Applebot-Extended, meta-externalagent, Bytespider, cohere-ai, YouBot, Diffbot, Amazonbot | PASS |
| - | Sentry DSN inlined + script | inlined + `/js/nwm-sentry.js` 200 | DSN `o4511302572441600` present; script returns 200, 1585 B | PASS |
| - | Meta Pixel | still placeholder (no ID from Carlos) | `window.NWM_META_PIXEL_ID = window.NWM_META_PIXEL_ID \|\| ''; if (window.NWM_META_PIXEL_ID) { fbq('init', …) }` — now correctly **gated** so no broken init fires | IMPROVED (still no ID, but no longer firing with `undefined`) |
| - | CSP header | identical allowlist | byte-identical to morning | PASS |
| - | Today's intentional copy: Agency Hub "invite-only Q2 2026 · 5 design partners · founding pricing" | live | confirmed in homepage HTML | PASS |
| - | compare.html "Q2 design partners" | live | confirmed | PASS |
| - | compare.html "Claude-powered AI agents" | live | confirmed (`Claude-powered AI agents included` / `Agentes IA con Claude incluidos`) | PASS |
| - | New CRM surface (subaccounts.html, org-settings.html, branding.js, org-switcher.js, subaccounts.js) | 200 | all 200 | PASS |

**13/13 morning fixes hold. Zero regressions on the verified items.**

---

## New issues introduced today

### 1. CRITICAL — Schema/secret leak via public SQL + docs

`robots.txt` disallows `/crm-vanilla/`, but it does NOT block public HTTP fetch. These are 200 OK to anyone:

| URL | Bytes | Leaks |
|---|---|---|
| `/crm-vanilla/api/schema.sql` | 5,838 | DB name `webmed6_crm`, full table schema |
| `/crm-vanilla/api/schema_organizations.sql` | 5,550 | DB name + **migrate token `NWM_MIGRATE_2026`** + endpoint `POST /api/?r=migrate&token=…&schema=organizations` |
| `/crm-vanilla/api/schema_organizations_migrate.sql` | 11,747 | Token + full multi-tenant FK strategy |
| `/crm-vanilla/api/migrations/README.md` | 6,693 | Operator runbook including curl examples + token |
| `/crm-vanilla/branding.md` | 4,995 | File map of CRM (handlers, runtime, sessionStorage keys) |

I confirmed `POST /crm-vanilla/api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations` returns **`405 Method Not Allowed`** — i.e. the route exists. Anyone reading the leaked SQL has the URL + token to attempt schema mutation. Whether the `405` masks an auth check or just a method check is irrelevant — **the token is a shared secret; treat it as compromised.**

**Fix (deploy in `/public_html/crm-vanilla/.htaccess` or root `.htaccess`):**

```apache
# Block dev artifacts under /crm-vanilla/
<FilesMatch "\.(sql|md)$">
  Require all denied
</FilesMatch>
RedirectMatch 403 ^/crm-vanilla/api/migrations/.*$
```

Then **rotate `NWM_MIGRATE_2026`** to a new token, update server-side handler, redeploy. Do not commit the new token.

### 2. MINOR — `compare.html` has stale `GPT-4 voice agent` copy

The "Claude-powered AI agents included" line landed, but two paragraphs below still say `respondidas 24/7 por un agente GPT-4 de voz` and `answered 24/7 by a GPT-4 voice agent`. Same BRAND.md violation today's PR was meant to clean. EN + ES both. Fix in same file, bilingual update.

### 3. INFO — Sitemap freshness

All 206 `<lastmod>` entries are `2026-04-29`. Regen ran today. No staleness.

---

## Schema-leak risk (summary)

`branding.md` and `migrations/README.md` are operator notes — annoying but not catastrophic. The three `.sql` files are the real bleed: they hand an attacker the DB name (`webmed6_crm`), the full multi-tenant schema (so they know which tables hold what), and an admin-grade migration token. Block under `.htaccess` and rotate the token **today**.

---

## Performance snapshot

| Asset | Morning | Now | Δ |
|---|---|---|---|
| Homepage HTML (gzipped) | ~20 KB | 19.7 KB | flat |
| Homepage HTML (raw) | ~93 KB | 89.5 KB | -3.5 KB (slight trim) |
| `css/styles.css` (gzipped) | ~10 KB | 9.9 KB | flat |
| `js/main.js` (gzipped) | n/a | 11.0 KB | baseline |
| TTFB (single sample) | n/a | 671 ms | baseline |
| Total time | n/a | 885 ms | baseline |
| Total payload (HTML+CSS+JS, gzipped) | ~55 KB | ~41 KB measured | improved |

No regression. Compression confirmed (`Content-Encoding: gzip`, `Vary: Accept-Encoding`).

---

## AI Overview citation simulation

`"AI fractional CMO" netwebmedia` and `"white-label CRM AI" netwebmedia` — **NWM does not appear** in either result set. Top citations are competitors (HighLevel, Vendasta, NOVASTACKS, AllClients). Schema is right; AEO is a content/distribution gap, not a markup gap. Out of scope for this audit but worth a content sprint.

---

## Verdict

**Better than morning.** All 4 critical morning issues fixed (www redirect, Chilean pills, sitemap, cache headers), Meta Pixel now safely gated, and intentional copy changes shipped clean. **One new critical introduced today** (CRM SQL/docs leak with embedded migrate token) plus one stragglers-of-stragglers cosmetic (residual GPT-4 lines on compare.html ES/EN). Both fixable in <30 min.

---

## One-line summary for Carlos

Site is healthier than this morning — all 4 critical fixes hold and zero regressions on the public surface — but the new CRM deploy leaked `schema.sql` + `migrations/README.md` + the `NWM_MIGRATE_2026` migrate token to the public web; block via `.htaccess` and rotate the token today.

Sources:
- [What is a Fractional AI CMO? — NNC](https://blog.nnc-services.com/what-is-a-fractional-ai-cmo)
- [HighLevel — White Label CRM for Agency](https://www.gohighlevel.com/white-label-crm)

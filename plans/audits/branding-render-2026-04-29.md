# White-label branding render path — build report

**Date:** 2026-04-29
**Owner:** engineering-lead
**Status:** Shipped to repo. Awaiting deploy via `deploy-crm.yml`.

This is task #3 of the multi-tenancy foundation, per
`plans/audits/multi-tenancy-foundation-2026-04-29.md`. Without it, every
sub-account renders NetWebMedia's navy/orange — the white-label pitch
falls apart on first login.

## Files touched / created

| File | Status | Lines | Purpose |
|---|---|---|---|
| `crm-vanilla/js/branding.js` | NEW | 194 | Runtime: fetch active org, cache 5 min, apply colors/logo/title to DOM |
| `crm-vanilla/org-settings.html` | NEW | 238 | Admin form: edit display_name, primary/secondary color, logo URL, sender_email; PATCH on save; calls `nwmBranding.refresh()` |
| `crm-vanilla/branding.md` | NEW | 118 | Developer doc — how the path works, how to add branding-aware elements, testing recipe |
| `crm-vanilla/css/app.css` | EDIT | +21/-3 | `:root` declares `--brand-primary` / `--brand-secondary` / `--brand-logo-url`; `.brand-icon` consumes them with NWM fallback; one literal `#FF671F` swapped to `var()` |
| `crm-vanilla/index.html` | EDIT | +2/-1 | `<title id="pageTitle">`; `<script src="js/branding.js" defer>` after app.js |
| `crm-vanilla/admin.html` | EDIT | +2/-1 | Same as index.html |
| `crm-vanilla/js/app.js` | EDIT | +7 | After `buildSidebar()` rewrites `innerHTML`, re-apply tenant branding (idempotent) |
| `crm-vanilla/api/handlers/organizations.php` | EDIT | +25 | New route `GET ?r=organizations&sub=current` returning the resolved active org + caller's `my_role` |

Total new code: ~550 lines + ~60 edited.

## Boot sequence (3 bullets)

- **Synchronous paint.** branding.js reads `sessionStorage.nwm_branding`
  (5-min TTL) and applies colors + logo immediately on parse — no flash
  of NWM defaults for returning users.
- **Background refresh.** Script then hits `GET /api/?r=organizations&sub=current`
  with `credentials: 'include'`, writes the result to sessionStorage, and
  re-applies. Uses CSS custom properties on `:root`, swaps `<img data-nwm-logo>`
  src, updates `.brand-icon`, sets `document.title`.
- **Fail-safe.** Every fetch is wrapped in try/catch; any failure logs a
  console warning and leaves NWM defaults intact. The page never breaks
  on a branding error. Master org (id=1, "NetWebMedia") sees the same
  navy/orange wordmark it always has because that's exactly what its
  branding row contains.

## Verification steps for Carlos

1. **Master org regression check (do this first).** Hard-reload
   `https://netwebmedia.com/crm-vanilla/` while signed in as yourself.
   Expect: identical UI to before the change. Sidebar icon still
   purple-accent (the CRM's own theme). No console errors in DevTools.
2. **Create a test sub-account** — POST to `/api/?r=organizations`:
   ```json
   {"slug":"acme-test","display_name":"Acme Co","plan":"client",
    "branding_primary_color":"#00aa99","branding_secondary_color":"#ffaa00",
    "branding_logo_url":"https://placehold.co/120x40/00aa99/fff?text=ACME"}
   ```
3. **Switch to it** — POST `/api/?r=organizations&sub=switch` with
   `{"organization_id": <id>}`. Reload. Expect: teal `.brand-icon`
   background containing the placehold.co image, tab title `... - Acme Co CRM`.
4. **Edit live** — open `/crm-vanilla/org-settings.html`, change the
   primary color to `#cc3333`, click Save. The page should repaint in red
   within ~200ms with no reload required.
5. **Switch back** to master org. Confirm CRM repaints to defaults.
6. **Offline test** — DevTools → Network → block
   `*organizations*sub=current*` → hard reload. Page must render normally.

## Top 2 follow-ups (flagged, not built)

1. **Per-tenant favicon.** Schema has no `favicon_url` column on
   `organizations`. Browser tab still shows NWM favicon for sub-accounts.
   Add column + 1-line UI field + runtime `<link rel="icon">` swap in
   branding.js. ~30 minutes of work; defer until first client asks.
2. **Per-tenant fonts.** Inter is hardcoded in every page's `<head>`. To
   support tenants who want their corporate font, add
   `branding_font_family` + `branding_font_url` columns and a runtime
   `<link>` injector in branding.js. Carries a perf cost (extra
   render-blocking request); design carefully, or stick with Inter and
   sell that as a feature.

Other deferred items: subdomain-driven SSR meta-tag injection (we read
`<meta name="nwm-org-slug">` but Apache doesn't yet write it), CDN
proxying of tenant logo URLs, and a "preview as tenant" mode for support.
None block first paying white-label customer.

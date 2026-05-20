# Frontend Security Patches — 2026-04-29

Five fixes from `frontend-security-2026-04-29.md` landed. All vanilla JS, all defensive (try/catch where applicable), no UI regressions for the master org.

## Files changed

| File | Lines added | Change |
|---|---|---|
| `crm-vanilla/js/branding.js` | +35 | `safeColor()` + `safeLogoUrl()` validators; both exposed on `window.nwmBranding` |
| `crm-vanilla/js/org-switcher.js` | +14 / -2 | Validate swatch colors before interpolating into inline `style=` |
| `crm-vanilla/js/app.js` | +6 | Logout now clears `sessionStorage` branding + orgs |
| `crm-vanilla/js/subaccounts.js` | +33 / -8 | `+ New sub-account` deferred until master-owner confirmed; suspend `confirm()` sanitizes display_name |
| `crm-vanilla/api/handlers/organizations.php` | +66 / -8 | `nwm_validate_color()` + `nwm_validate_logo_url()` mirror frontend allowlists in POST and PATCH |

## Bug-by-bug

### Critical 1 — CSS injection via branding colors
**Before** (`branding.js`):
```js
if (org.branding_primary_color) {
  root.style.setProperty('--brand-primary', org.branding_primary_color);
}
```
**After:**
```js
var primary   = safeColor(org.branding_primary_color,   '#010F3B');
var secondary = safeColor(org.branding_secondary_color, '#FF671F');
root.style.setProperty('--brand-primary',   primary);
root.style.setProperty('--brand-secondary', secondary);
```
Validator regex accepts only `#rgb` / `#rrggbb` / `#rrggbbaa` / `rgb()` / `rgba()`. Anything else → fallback to NWM defaults.

`org-switcher.js` lines 138/154 now run colors through the same `safeColor()` (imported via `window.nwmBranding.safeColor` with a local fallback so it works even if branding.js hasn't booted).

**Backend mirror** in `organizations.php`: `nwm_validate_color()` enforces the same regex on POST + PATCH. Old `^#[0-9a-fA-F]{6}$` check is gone — replaced everywhere.

### Critical 2 — Logo URL no scheme allowlist
**Before:** `\` and `"` escaped only; `data:image/svg+xml` accepted.
**After:** `safeLogoUrl()` runs the value through `new URL()` and allows only:
- `https://` (any host)
- `http://localhost` or `http://127.0.0.1` (dev)
- `data:image/(png|jpeg|webp|gif);` (no svg+xml)

If the URL fails validation, `--brand-logo-url` is **removed** (not left stale) and the `<img>` falls back to `DEFAULT_LOGO`. Backend mirror via `nwm_validate_logo_url()` uses `parse_url()` for the same allowlist.

### High 1 — Logout doesn't clear branding/orgs sessionStorage
**Before** (`app.js:810-814`): only cleared `localStorage.nwm_token` + cookies.
**After:** added `sessionStorage.removeItem('nwm_branding')` and `sessionStorage.removeItem('nwm_orgs')` inside the existing `finish()` cleanup, each in its own try/catch.

### High 2 — `+ New sub-account` button visible to non-masters
**Before:** button rendered in `buildHeader()` synchronously on `DOMContentLoaded`, before `loadOrgs()` returned.
**After:** `buildHeader()` is called with empty actions. Button is created inside `maybeShowCreateButton()`, which is only invoked from the success branch of `loadOrgs()` after `state.isMasterOwner === true`. `renderForbidden()` defensively removes the button if it ever exists.

### Medium 1 — `confirm()` interpolates raw display_name
**Before:**
```js
if (!confirm((suspend ? "Suspend" : "Unsuspend") + ' "' + org.display_name + '"?')) return;
```
**After:**
```js
var safeName = String(org.display_name || org.slug || "")
  .replace(/[\r\n\t]+/g, " ").slice(0, 80);
if (!confirm((suspend ? "Suspend" : "Unsuspend") + ' "' + safeName + '"?')) return;
```

## Verification steps for Carlos

1. **Color injection** — as a sub-account admin, PATCH `/api/?r=organizations&slug=<your-slug>` with `branding_primary_color: "red; background-image:url(//attacker)"`. Expect HTTP 400. If you bypass the API and seed the DB directly, then load any CRM page: the page should fall back to navy `#010F3B`, dev-tools should show `--brand-primary: #010F3B` (not the payload).
2. **Logo URL** — PATCH with `branding_logo_url: "javascript:alert(1)"` → 400. Same with `data:image/svg+xml,<svg…>` → 400. `https://example.com/logo.png` → accepted.
3. **Logout cleanup** — log in to a sub-account, hit a page, log out, then DevTools → Application → Session Storage. `nwm_branding` and `nwm_orgs` should be gone. Log into a different account; first paint should be NWM defaults, not the previous tenant's colors.
4. **Sub-account button gating** — log in as a non-master user, navigate to `/crm-vanilla/subaccounts.html`. The `+ New sub-account` button should never appear (not even briefly). `renderForbidden()` should fire and show the access-denied card.
5. **Suspend dialog** — create a test org with `display_name = "Foo\r\nCancel: Yes"`, click Suspend. The browser confirm should show one line, max 80 chars.

## Defensive followups noticed but not done

- **Favicon swap** — branding.js line 122 has `// 5. (Skipped: per-tenant favicon — column not in schema yet.)`. When that ships, the same scheme allowlist must apply to the favicon URL.
- **`org-settings.html` form** — color inputs use `<input type="color">` which already constrains values, but the logo URL field is free-text. Add client-side `safeLogoUrl()` validation on blur for instant feedback (server already rejects).
- **`document.title`** in `branding.js` — `display_name` is concatenated into the title. Title strings can't execute JS, but a 200-char tenant name will look ugly. Cap at 60 chars.
- **`org-switcher.js` `data-id` / `data-slug`** — already pass through `esc()`, fine.
- **Master org safety** — `display_name` for org id=1 is hardcoded to "NetWebMedia" in seeds; the `data-nwm-locked` attribute on `.brand-text` already prevents overwriting "NetWeb CRM" label. Verified the patches don't change that path.
- **Schema migration** — consider a DB-level CHECK constraint on `branding_primary_color` / `branding_secondary_color` matching the regex, so even raw SQL can't inject. Coordinate with the backend agent owning `schema.sql`.

All five fixes are landed. No commit per Carlos's auto-save policy.

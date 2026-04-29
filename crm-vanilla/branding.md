# White-label branding render path

The CRM is multi-tenant. Every page boot resolves the active organization
and applies its colors, logo, and display name to the DOM, so each
sub-account sees its own brand instead of NetWebMedia's navy/orange.

## Files

- `js/branding.js` — runtime that fetches the active org and applies branding.
- `css/app.css` — declares the brand custom properties on `:root` with NWM
  defaults, and consumes them via `var(--brand-primary, #010F3B)`.
- `api/handlers/organizations.php` — `GET /api/?r=organizations&sub=current`
  returns the active org for the signed-in user.
- `org-settings.html` — admin form to edit display name, colors, logo, sender
  email. Restricted to org admins/owners.

## How it works (boot sequence)

1. `branding.js` reads `sessionStorage.nwm_branding` (5-min TTL). If a
   cached org is present it is applied synchronously — page paints with
   the right colors before any network round-trip.
2. The script then fires `GET /api/?r=organizations&sub=current` in the
   background, writes the result to `sessionStorage`, and re-applies.
3. On any failure (offline, 4xx, 5xx, JSON parse error) the script logs a
   warning and leaves NWM defaults in place. **It never throws.**

When `app.js` rebuilds the sidebar (e.g. on language switch) it calls
`window.nwmBranding.apply(window.nwmBranding.org)` to repaint the new DOM —
this is idempotent.

## What gets applied

| Source field                | Target                                       |
|-----------------------------|----------------------------------------------|
| `branding_primary_color`    | `:root { --brand-primary }`                  |
| `branding_secondary_color`  | `:root { --brand-secondary }`                |
| `branding_logo_url`         | `:root { --brand-logo-url }` + `<img data-nwm-logo>` `src` + `.brand-icon` background |
| `display_name`              | `<title>` suffix, `.brand-text`, logo `alt`  |

## Adding a new branding-aware element

**For colors:** in CSS, use the custom properties with a fallback —

```css
.my-button { background: var(--brand-primary, #010F3B); color: #fff; }
.my-accent { color: var(--brand-secondary, #FF671F); }
```

**For logos:** add `data-nwm-logo` to your `<img>` tag —

```html
<img data-nwm-logo
     data-nwm-logo-default="/assets/img/nwm-logo.svg"
     src="/assets/img/nwm-logo.svg"
     alt="NetWebMedia logo">
```

`branding.js` will swap the `src` to the org's logo URL on boot, falling
back to `data-nwm-logo-default` (or the global default) when the org has
no custom logo.

**For dynamic markup** (anything injected via `innerHTML` after page load),
re-apply branding after you write the DOM:

```js
container.innerHTML = newHtml;
if (window.nwmBranding && window.nwmBranding.org) {
  window.nwmBranding.apply(window.nwmBranding.org);
}
```

## Public JS API

```js
window.nwmBranding.org             // {} the active org, or null
window.nwmBranding.apply(org)      // apply a branding object now
window.nwmBranding.refresh()       // bust cache + re-fetch + apply
```

The custom event `nwm:branding-applied` fires on `document` after every
apply, with the org as `event.detail`.

## Known limitations (flag for Month 2)

- **No per-tenant favicon** — the `organizations` table has no
  `favicon_url` column. `<link rel="icon">` is left as the static NWM
  favicon. Add a column + UI when first client requests it.
- **No per-tenant fonts** — Inter is hardcoded in the `<link>` to Google
  Fonts. To support custom fonts we need a `branding_font_family`
  column plus a runtime `<link>` injection in `branding.js`.
- **No CDN-hosted logo enforcement** — `branding_logo_url` accepts any
  URL string. If a tenant references a slow third-party host the CRM
  paints slowly. Consider proxying via our own asset bucket.
- **The master org's "NetWeb CRM" wordmark** is overwritten by the
  `display_name` from the API. If we want to keep "NetWeb CRM" as the
  literal sidebar label for NWM staff regardless of the org name, add
  `data-nwm-locked` to the `.brand-text` element in the markup.

## Testing with a sub-account

1. As a master-org owner, `POST /api/?r=organizations` to create a
   sub-account:
   ```json
   { "slug": "acme-test", "display_name": "Acme Co",
     "plan": "client",
     "branding_primary_color": "#0aa", "branding_secondary_color": "#fa0",
     "branding_logo_url": "https://placehold.co/120x40?text=ACME" }
   ```
2. Add yourself as a member of that org (or any test user).
3. Switch into it: `POST /api/?r=organizations&sub=switch` with
   `{ "organization_id": <new-id> }`.
4. Reload the CRM. Expect: teal/orange brand-icon, "Acme Co CRM" in the
   tab title, the placehold.co logo where applicable.
5. Switch back: `&sub=switch` to org id `1` (master). Confirm the CRM
   repaints to NWM defaults.
6. Negative test: open DevTools, block `/api/?r=organizations&sub=current`
   in Network, hard-reload — page must still render correctly with NWM
   defaults.

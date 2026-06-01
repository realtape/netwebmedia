# NWM Real-Estate Portal Template

A white-labelable **property-portal website template** by NetWebMedia, for the
`real_estate` niche. Flat HTML/CSS/JS — **no build step, no dependencies** (Google
Fonts is the only external resource). Drop it on any client sub-site, swap the
config, point it at a real listings feed, and ship.

## What it is

A self-contained listings portal with the standard real-estate UX pattern:

- **Sticky header** + main nav + ES/EN language toggle + "Publicar propiedad" CTA
- **Hero search band** — Tipo / Sector / keyword search with live stats
- **Faceted filter sidebar** — property type, bedrooms, bathrooms, price range (UF), sector
- **Sortable results grid** — relevance / lowest price / highest price / largest area
- **Property cards** — UF price + CLP reference, location, beds/baths/m², featured badge
- **Detail modal** — full specs, description, features, location stub, WhatsApp + call CTAs
- **Responsive** — collapses to a single column with a mobile filter toggle under 980px

It is an **original NetWebMedia design** (Gulf Oil palette — Navy `#010F3B` + Orange
`#FF671F`, Poppins/Inter). It mirrors the *functional pattern* of a real-estate
search portal; it does **not** copy any third-party site's markup, CSS, logos, or
photos. Card images are brand-styled placeholders labeled "Foto referencial."

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell (header, hero, results layout, modal, footer) |
| `css/portal.css` | All styling — NWM Gulf Oil palette, fully responsive |
| `js/data.js` | **Mock/seed data only** — config, filter facets, listings array |
| `js/portal.js` | App logic — filter, sort, search, detail modal, ES/EN i18n |

> **Data rule (same as `crm-vanilla/js/data.js`):** `js/data.js` is seed data for
> demos and UI work. In production, listings should come from a backend feed
> (e.g. `/api/resources/listing` in `webmed6_nwm`, or the client's MLS/portal
> export). Never treat `data.js` as a source of truth.

## Test dataset — La Serena

Seeded with **32 real for-sale listings in La Serena (Coquimbo, Chile)** to make the
demo realistic. Only **factual specifications** were used — price, bedrooms,
bathrooms, built area (m²), and sector — gathered from public listing data. Property
descriptions are original template copy; no photos or listing prose were copied.

- 16 departamentos + 16 casas, UF 2.300 – UF 17.900
- 11 sectors: Avenida del Mar, Laguna del Mar, San Joaquín, El Milagro, Serena Golf,
  Cerro Grande, La Pampa, La Antena, Centro, Valle de Elqui, Otros

## White-labeling (per client)

Edit `window.NWM_PORTAL_CONFIG` at the top of `js/data.js`:

```js
window.NWM_PORTAL_CONFIG = {
  brandName: 'Tu Inmobiliaria',   // client name
  tagline:   'Propiedades en La Serena y Coquimbo',
  city:      'La Serena',
  region:    'Región de Coquimbo',
  whatsapp:  '56900000000',       // E.164 without '+'
  phone:     '+56 51 000 0000',
  email:     'contacto@tuinmobiliaria.cl',
  ufToClp:   39500,               // UF→CLP reference rate (update periodically)
  poweredBy: 'NetWebMedia',
};
```

- **Colors/fonts:** change the `:root` tokens in `css/portal.css`.
- **Sectors / price bands:** edit `window.NWM_PORTAL_FACETS` in `js/data.js`.
- **Listings:** replace `window.NWM_PORTAL_LISTINGS` with the client's feed
  (keep the same shape: `id, tipo, operacion, title, sector, address, priceUF,
  beds, baths, builtM2, [lotM2], [priceClpOverride], featured, desc, tags`).

## Run locally

The repo's static server already serves this:

```
node server.js
# → http://127.0.0.1:3000/templates/real-estate-portal/
```

## Verified (2026-06-01)

Tested in the browser preview against the La Serena dataset:
- Renders 33 listings, 11 sectors, "desde UF 2.300"; featured-first relevance sort
- Type filter (Casa → 16), price filter (UF 3.000–5.000 → 5), clear (→ 33)
- Keyword search "golf" → 3 matching listings
- Detail modal opens with specs + WhatsApp deep link (pre-filled), closes cleanly
- ES/EN chrome toggle (listing content stays es-CL); no console errors

## If you want it live on netwebmedia.com

`templates/` is a **new top-level directory**, so it does **not** auto-deploy yet.
To ship via InMotion (`deploy-site-root.yml`), two edits are required (see CLAUDE.md
→ "Adding a new top-level directory"):
1. Add `templates/` under `on.push.paths`.
2. Add `templates` to the staging `for d in …` allowlist loop.

It's currently `noindex,nofollow` (template/demo). Remove that meta tag and set a real
canonical before exposing a client-facing instance publicly.

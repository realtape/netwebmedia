---
name: reference_templates_real_estate_portal
description: Live white-label real-estate portal template at /templates/real-estate-portal/; /templates/** is now wired into deploy-site-root.yml
metadata: 
  node_type: memory
  type: reference
  originSessionId: 46a1e88c-53e6-481d-a86d-2b38ee044753
---

NWM has a white-label **real-estate portal template** (for the [[reference_14_niches]] `real_estate` niche) at `templates/real-estate-portal/` in the repo, **live** at `https://netwebmedia.com/templates/real-estate-portal/` (noindex demo) since 2026-06-01.

- Flat HTML/CSS/JS, no build: `index.html` + `css/portal.css` + `js/data.js` (config/facets/listings — **mock/seed only**, same rule as crm-vanilla `data.js`) + `js/portal.js` (filter/sort/search/detail-modal/ES-EN). Gulf Oil palette ([[project_brand_palette]]).
- Original NWM design — NOT a clone of Portal Inmobiliario's markup/CSS/assets. Seeded with 32 real **La Serena** listings (factual specs only; UF 2.300–17.900); cards show "Foto referencial" placeholders, no third-party photos.
- White-label via `window.NWM_PORTAL_CONFIG` in `js/data.js` (brandName, whatsapp, phone, ufToClp). Placeholder contact = "Tu Inmobiliaria" / wa 56900000000 — swap per client.
- **Deploy wiring (important):** `templates/**` was added to BOTH `on.push.paths` AND the staging `for d in …` allowlist loop in `.github/workflows/deploy-site-root.yml` (the two-edit rule for any new top-level dir — [[reference_deploy_inmotion]]). So future `templates/*` subdirs ship automatically on push to main.

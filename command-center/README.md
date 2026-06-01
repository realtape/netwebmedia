# Launch Command Center

Internal single-page app for NetWebMedia's **Launch Readiness & Month-1 Revenue** tracking.
Launch target: **Mon June 1, 2026** · Month-1 goal: **$5,000 USD**.

Live (team-only): `https://netwebmedia.com/command-center/` · Local: `http://127.0.0.1:3000/command-center/`

## Architecture — precompiled, CSP-clean, flat-deployed

React 18 SPA. **No runtime Babel and no Tailwind CDN** — the JSX is precompiled to
`React.createElement` and Tailwind is compiled to static CSS, so the page runs under the
site's live Content-Security-Policy with **no CSP change** (sources are same-origin
`app.js` / `app.css` + `unpkg` React, which the CSP already allows; no `unsafe-eval`).

Files:

| File | Role | Edit? |
|---|---|---|
| `app.jsx` | React source (all app logic) | ✏️ **edit this** |
| `src/input.css` | Tailwind directives + custom CSS | ✏️ **edit this** |
| `tailwind.config.js` | colors / content scan | ✏️ edit if adding tokens |
| `app.js` | **build output** (compiled JSX) | 🚫 generated — run build |
| `app.css` | **build output** (compiled Tailwind) | 🚫 generated — run build |
| `index.html` | thin shell: links app.css + React + app.js | ✏️ rarely |

## Build

```bash
cd command-center
npm install          # Babel + Tailwind (dev only; node_modules is gitignored)
npm run build        # app.jsx -> app.js  and  src/input.css -> app.css
# or: npm run watch:js / npm run watch:css while developing
```

Commit the regenerated `app.js` + `app.css` alongside the source change (same pattern as
the repo's other generators — outputs are version-controlled so deploy stays build-free).

## Run

- **Locally:** `node server.js` (repo root) → open `http://127.0.0.1:3000/command-center/`
- **Direct:** open `index.html` (needs app.js/app.css built first).

## Modules

1. **Readiness** — gated checklist (Offer / Channels / CRM / Production), per-item status +
   owner + due + Y/N/Partial + notes, channel grid (4 booleans × 8 platforms), live Readiness
   Score % and GO/NO-GO banner. "Arm launch" is blocked until every **critical** item is Done.
2. **Revenue** — log sales, progress bar to target, deal-mix calculator (per-tier counts to hit
   and to close the gap, sample blend), booked MRR vs gap, required daily pace, days left in month.
3. **Marketing Plan** — generated June 1–30 calendar, 5 posts/day across 8 platforms + 1 Carlos
   live/day, content-pillar rotation, hook/CTA, per-post status + KPI fields, weekly rollup, CSV export.
4. **Connections** — status cards for all 8 platforms (connected/disconnected + last-tested),
   mock toggles and "Test now".

Bilingual ES/EN (Spanish default). All state persists in `localStorage`.

## Data layer (swap to Supabase/API later)

All persistence is isolated behind the `Store` module + `usePersistentState` hook in `app.jsx`.
Nothing else touches `localStorage`. To move to a backend:

1. Replace `Store.get` / `Store.set` bodies with async API/Supabase calls (collections already
   namespaced: `readiness`, `deals`, `connections`, `config`, `calendar`).
2. Make `usePersistentState` async (load in `useEffect`, write through on change).

## Deploy

Ships via `deploy-site-root.yml` (InMotion FTPS) — `command-center/**` is wired into both the
path trigger and the staging `for d in …` loop. The local `.htaccess` keeps the dir `noindex`
and stops Apache serving the build sources (`*.jsx`, configs). `node_modules` is gitignored so
it never reaches CI/FTP.

**Access control:** the deployed page holds no secrets (all data is client-side localStorage),
but to keep it team-only enable **Directory Privacy** on `/command-center/` in cPanel (server-side,
same as `/cms/`), or uncomment the Basic-auth block in `.htaccess` after creating
`/home/webmed6/.htpasswd-cc`.

## Decisions baked in

- **CMO Premium defaults to $2,490** (canonical, per Carlos 2026-05-22), not the $2,499 in the
  build brief. All tier prices + the $5,000 target are editable in Revenue → ⚙ Targets & pricing.
- **LinkedIn and X are included** per the brief but flagged "Excluded from NWM mix" (non-critical
  in readiness, marked on connection cards) to reflect NWM's standing social policy.
- Brand colors use the brief's **navy #0A1628 / orange #FF6B2B** (slightly different from the brand
  book's #010F3B / #FF671F — followed the brief's explicit values for this tool).

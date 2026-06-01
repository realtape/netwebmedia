# Launch Command Center

Internal single-page app for NetWebMedia's **Launch Readiness & Month-1 Revenue** tracking.
Launch target: **Mon June 1, 2026** · Month-1 goal: **$5,000 USD**.

## Run it

It's a self-contained `index.html` — no build step.

- **Locally via the repo server:** `node server.js` then open `http://127.0.0.1:3000/command-center/`
- **Direct:** open `command-center/index.html` in a browser (works on `file://` too).

Stack: React 18 + Tailwind, both via CDN (matches NWM's no-build flat-deploy model and the
homepage's existing React-via-CDN precedent). JSX is transpiled in-browser by Babel standalone.

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

All persistence is isolated behind the `Store` module + `usePersistentState` hook in `index.html`.
Nothing else touches `localStorage`. To move to a backend:

1. Replace `Store.get` / `Store.set` bodies with async API/Supabase calls (collections are already
   namespaced: `readiness`, `deals`, `connections`, `config`, `calendar`).
2. Make `usePersistentState` async (load in `useEffect`, write through on change).

Collections map cleanly to tables: `deals`, `readiness_sections`, `connections`,
`calendar_days` / `calendar_posts`, `config`.

## Notes / decisions baked in

- **CMO Premium defaults to $2,490** (canonical, per Carlos 2026-05-22), **not** the $2,499 in the
  build brief. All tier prices + the $5,000 target are editable in Revenue → ⚙ Targets & pricing.
- **LinkedIn and X are included** per the brief but flagged "Excluded from NWM mix" (non-critical
  in readiness, marked on connection cards) to reflect NWM's standing social policy.
- Brand colors use the brief's **navy #0A1628 / orange #FF6B2B** (slightly different from the brand
  book's #010F3B / #FF671F — followed the brief's explicit values for this tool).

## Deploying to InMotion (optional)

This is an internal tool; Carlos can run it locally. If shipping it live:

- It's a new top-level dir, so `deploy-site-root.yml` needs **two** edits (path trigger + the
  `for d in …` staging loop) — see CLAUDE.md "Adding a new top-level directory."
- **CSP is live.** Whitelist `cdn.tailwindcss.com`, `unpkg.com`, and `fonts.googleapis.com` /
  `fonts.gstatic.com` in `.htaccess`, or self-host those assets. unpkg is likely already allowed
  (the homepage AEO dashboard uses it).
- Keep it `noindex,nofollow` (already set) and ideally behind Basic auth like `/cms/`.

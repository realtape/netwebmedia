# NetWebMedia

## What This Is

The netwebmedia.com production property plus its supporting apps and operating
assets — a flat-deployed multi-property monorepo (marketing site, PHP API,
internal CRM, mobile app, video factory, generated company/industry pages).
NetWebMedia is an AI-native fractional-CMO agency selling to SMBs across exactly
14 fixed niches; this repo is the agency's own site, tooling, and CRM of record.

## Core Value

The public site + `api-php/` lead capture → `crm-vanilla/` pipeline must stay
live and correct. If anything else breaks, lead capture and the CRM cannot.

## Requirements

### Validated

<!-- Shipped, relied upon, inferred from the existing codebase. Locked. -->

- ✓ Flat HTML/CSS/JS marketing site (no build step) — shipped, in production
- ✓ `api-php/` EAV API (lead capture, audit, public endpoints) on `webmed6_nwm`
- ✓ `crm-vanilla/` internal CRM (contacts/deals/workflows) on `webmed6_crm`
- ✓ GitHub Actions → FTPS → InMotion cPanel deploy (3 path-scoped workflows)
- ✓ 14-niche AEO content clusters (industry hub + 2 pillars each)
- ✓ CRM-native workflow engine + GH Actions cron heartbeat (no cPanel cron)
- ✓ Social publishing handlers (fb/ig/tt_publish) — scaffolded; distribution
  gated on external credentials/review (tracked in `.planning/HANDOFF.json`)

### Active

<!-- No active milestone. GSD initialized as a per-task anchor, not a roadmap. -->

- [ ] (Set per task — this repo runs ad-hoc work, not a phased milestone)

### Out of Scope

<!-- Durable Carlos decisions. Do not re-add without explicit go-ahead. -->

- Vercel / Netlify / Cloudflare / any non-InMotion host — InMotion-only deploy
- HubSpot / Supabase in production ops — `crm-vanilla/` is the CRM of record
- LinkedIn distribution — Carlos decision 2026-04-20
- X / Twitter distribution — Carlos decision 2026-05-01
- ChatGPT/Perplexity/Google AI as internal tools — they are AEO *targets*
- Adding/renaming/splitting niches — taxonomy is fixed at exactly 14
- A build step / bundler for the public site — flat deploy is intentional

## Context

- Brownfield, well-documented: `CLAUDE.md` (root) is the authoritative source
  of constraints; `plans/*.html` carry strategy. GSD reads `./CLAUDE.md`.
- No build step and no automated test suite. "Verification" = smoke tests
  post-deploy in GitHub Actions, not a local test runner.
- Two separate MySQL databases with separate PDO connections — never
  cross-query from a single handler.
- A local `auto-save` daemon (Stop hook → `_backup/backup.sh`) commits and
  pushes every turn-end; it fragments git history and can race in-flight
  edits. Surgical git ops must complete inside a single turn.
- InMotion mod_security 406-blocks bare-UA curl — asset/URL checks need a
  real Chrome User-Agent + Origin/Referer headers.

## Constraints

- **Deploy**: InMotion cPanel via GitHub Actions FTPS only — no other host.
- **Data**: `webmed6_nwm` (api-php) and `webmed6_crm` (crm-vanilla) are
  separate; no cross-database reads in one handler.
- **Tech stack**: Vanilla JS/PHP, flat HTML, no framework, no build step.
- **Taxonomy**: Exactly 14 niches — referenced by generators, CRM enums,
  email sequences, AEO clusters; expanding it cascades everywhere.
- **Canonical files**: `css/styles.css` / `js/main.js` (not root variants);
  bilingual copy updates both `data-en` and `data-es`.
- **Git**: never `git add -A` (large generated artifacts); never `--force`
  without `--force-with-lease`; never force-push `main` without checking the
  Actions run queue.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GSD initialized as a lightweight anchor, not a roadmap | Repo runs ad-hoc tasks, not a phased milestone | — Pending |
| Nyquist (test-coverage) gate disabled | No test suite exists; gate would block every phase | ✓ Good |
| Research phase disabled by default | Brownfield, fully documented in CLAUDE.md | ✓ Good |
| Security enforcement kept on | Real surface: PHP API, SSRF guard, tenancy, CSP | ✓ Good |
| `claude_md_path` → `./CLAUDE.md` | Hard constraints already live there; GSD inherits them | ✓ Good |

---
*Last updated: 2026-05-19 — GSD anchor initialization (config + PROJECT.md scope)*

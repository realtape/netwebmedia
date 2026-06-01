# NWM OS Sourcing Waves

Each file in this directory is one run of `/source-agency-leads` — a dated, vertical+geo-scoped batch of agency-owner candidates surfaced via Firecrawl and scored against the ICP in [../sourcing-config.json](../sourcing-config.json).

## Filename pattern

`wave-YYYY-MM-DD-<vertical>-<geo>.md`

Examples:
- `wave-2026-06-03-home_services-us.md`
- `wave-2026-06-10-law_firms-us_southeast.md`
- `wave-2026-06-17-tourism-miami_bilingual.md`

## How waves relate to the master list

- Each wave file is **standalone and immutable** — it captures what Firecrawl returned at that date for that scope.
- New, non-duplicate candidates are dedupe-merged (by domain) into [../warm-list.md](../warm-list.md) under a dated "Wave-sourced additions" section.
- Master `warm-list.md` is the live working set. Wave files are the archive.

## Rotation state

`.rotation-cursor` (one integer per line) tracks which vertical the auto-rotation last covered. The scheduled weekly run reads this, advances to the next vertical in [`sourcing-config.json#weekly_rotation.order`](../sourcing-config.json), and writes the new cursor.

Reset rotation by deleting `.rotation-cursor`.

## How to run

| Goal | Command |
|---|---|
| Auto-rotate (next vertical in queue, US default) | `/source-agency-leads` |
| Target a specific vertical + geo | `/source-agency-leads home_services us_west 10` |
| Bilingual Miami sweep | `/source-agency-leads smb miami_bilingual 12` |
| List options | `/source-agency-leads --list` |

## Draft outreach for a surfaced candidate

`/draft-outreach <agency-name-or-domain> [tier]` — drafts a 3-touch sequence from one row in the warm-list or a specific wave file.

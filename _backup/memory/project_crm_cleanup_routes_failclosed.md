---
name: project_crm_cleanup_routes_failclosed
description: CRM contact-purge/filter cleanup routes fail closed since 2026-05-29 — set FILTER_ID_TOKEN / FILTER_REACH_TOKEN GitHub secrets to use them
metadata: 
  node_type: memory
  type: project
  originSessionId: fc56ecde-f921-4b0f-8719-fe48d7858325
---

As of 2026-05-29 (commit 5699ea6ba), the CRM contact-cleanup/purge routes no longer accept the old guessable tokens `NWM_FILTER_ID_2026` / `NWM_FILTER_REACH_2026` — those return `403 {"error":"Invalid token"}`. The routes now fail closed: `crm-vanilla/api/config.php` defines `FILTER_ID_TOKEN` + `FILTER_REACH_TOKEN` with a random per-deploy fallback (matching MIGRATE/SEED/DEDUPE), so with the secret unset the token is unguessable and the route is effectively disabled.

Affected routes: `filter_identifiable`, `filter_reachable`, `domain_audit`, `purge_role_emails` (all destructive) + `filter_marketing_ready` (read-only). The `bulk_import_osm` `IMPORT_BEST_TOKEN` was already config-defined.

**Why:** The literals were committed to the public git repo (burned). Leaving them as live fallbacks meant anyone could trigger contact deletions if the secret was unset.

**How to apply:** To run any of these cleanup routes, first set the matching GitHub Actions secret — `gh secret set FILTER_ID_TOKEN` (covers the 4 filter/purge/domain routes) and/or `gh secret set FILTER_REACH_TOKEN` (filter_reachable) — then redeploy so `crm-vanilla/api/config.local.php` picks it up, and call with `?token=<that value>`. The deploy plumbing (`SECRET_FILTER_ID_TOKEN` / `SECRET_FILTER_REACH_TOKEN`) is already wired in `deploy-site-root.yml`. Related: direct HTTP access to `crm-vanilla/api/handlers/*.php` now 403s (handlers/.htaccess) — always route through `/crm/api/?r=<name>`.

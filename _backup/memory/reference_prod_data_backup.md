---
name: reference-prod-data-backup
description: "How to back up the live CRM/lead databases to Carlos's computer — what works, what's blocked, and the durable design"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 675a6d12-f626-4d6a-82e9-ef87d8c021c3
---

**Reading prod data works** via the NWM Chrome session: same-origin `fetch` with `localStorage.nwm_token` as `X-Auth-Token` against `/api/` (webmed6_nwm) and `/crm/api/?r=...` (webmed6_crm). Working CRM read routes: `contacts` (paginated {data,total,limit,offset}), `deals`, `conversations`, `events`, `workflows`, `campaigns` (bare arrays). Others 404.

**Saving bulk data to disk via the browser is BLOCKED in-session** (learned 2026-06-01, burned ~12 calls):
- The token can't be returned to the agent — harness redacts it ("[BLOCKED: Base64 encoded data]"), so a local Node/curl script can't be authorized. Good guardrail; don't fight it.
- Browser download works ONCE, then Chrome's "multiple automatic downloads" sets an origin-level block — every later programmatic `a.click()` download silently fails (no file, no `.crdownload`).
- `computer`/`screenshot`/`find` time out: "waited 45000ms for document_idle" on EVERY netwebmedia page (the `/app/` SPA never idles; even static pages/robots.txt didn't). So a trusted click to bypass the download block can't be driven by the agent. (A real click BY CARLOS still works.)
- `javascript_tool` return is truncated to a few KB, so you cannot pipe MB of rows through the agent context in chunks.

**Durable backup design (use this, not the browser):** server-side dump, local pull. Add a cPanel cron on InMotion: `mysqldump webmed6_crm` + `webmed6_nwm` → gzipped file in a non-public dir; then a local Windows Scheduled Task pulls it to `D:\Documents\nwm-backups\` over FTPS (reuse `CPANEL_FTP_*`). DB creds stay server-side; no browser, no session token, runs unattended. Never commit lead/contact PII to the git repo.

Live counts 2026-06-01: webmed6_nwm → contact 830 / deal 16 / form_submissions 23. webmed6_crm → contacts 9805 / deals 75 / conversations 11 / events 108 / campaigns 48 / workflows 0. One-time snapshot dir prepared: `D:\Documents\nwm-backups\2026-06-01\`. Related: [[reference_crm_live_access]], [[reference_nwm_inbound_leads_state]].

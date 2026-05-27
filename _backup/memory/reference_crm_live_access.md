---
name: crm-live-access
description: How to read live NetWebMedia CRM / api-php production data without DB credentials or a pasted token
metadata: 
  node_type: memory
  type: reference
  originSessionId: 46ae4ce7-ecc5-47cc-a1cb-04bc2298c799
---

To read **live** NetWebMedia CRM / lead data (production `webmed6_nwm` + `webmed6_crm`), there are no DB credentials on Computer 1 (`config.local.php` is injected from GitHub Secrets only at deploy), and the lead/contact endpoints are auth-gated (`requirePaidAccess()` / `requireAuth()`). The working path:

- Use the connected **Chrome MCP browser named "NWM"** (`Claude_in_Chrome`, local). Carlos stays logged into `netwebmedia.com/crm-vanilla/`.
- Navigate a tab to any `netwebmedia.com` page, then `fetch()` the API in page context with `headers:{'X-Auth-Token': localStorage.getItem('nwm_token')}`. Same token works for both `/api/*` (api-php) and `/crm-vanilla/api/`.
- No token paste needed; this is what "do all yourself" means for live-data asks.

Useful endpoints: `GET /api/public/stats` (counts, no auth), `GET /api/resources/contact?limit=N`, `GET /api/resources/form`, `GET /api/forms`, `GET /api/forms/{id}/submissions`. DELETE via `DELETE /api/resources/contact/{id}` (hard delete).

**Gotcha:** public website form submissions land on the **CMS form *resources*** (ids 27–33), NOT the CRM `forms` table (ids 1–7) — different id space, and the rows use the `data` column not `payload`. Before the 2026-05-25 fix the CRM Forms UI always showed 0 submissions. See [[crm-junk-cleanup-2026-05-25]].

For destructive CRM cleanups, back up the records first to `D:\Documents\nwm-*-backup-<date>.json` (see [[feedback-documents-to-d-drive]]).

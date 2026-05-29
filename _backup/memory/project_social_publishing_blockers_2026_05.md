---
name: social-publishing-blockers-2026-05
description: "Live state of IG/FB programmatic publishing for @netwebmedia as of 2026-05-25 — what's deployed and what's actually blocking a live post"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4b85fda0-d904-4e10-a5af-1a55a90fe222
---

Snapshot of @netwebmedia social-publishing readiness as of **2026-05-25** (verified against the live API + Meta Business Suite, not from the runbooks — both `carousels/ai-lead-gen/PUBLISH-RUNBOOK.md` and `_deploy/social-publishing-unblock-2026-05-11.md` overstated readiness).

**Done / verified:**
- The 6-slide AI lead-gen carousel (`d`) handler change + 6 PNGs were committed (`17a2c6bda`) but had never been pushed/deployed. Rebased onto the CI auto-publish commit (no force-push) and pushed; deploy succeeded. Production now serves `ig_publish` `available_carousels: [a,b,c,d]` and all 6 `assets/social/carousels/d-slide-{1..6}.png` return 200.

**Actual blockers to a live IG post (in order):**
1. **Instagram is NOT connected to the NetWebMedia FB Page.** Business Suite header shows "Connect Instagram"; composer's Post-to lists IG as greyed-out. Must be connected manually (see [[meta-automation-guard]] — automating it got the account temporarily restricted). Requires @netwebmedia to be a **Professional** IG account.
2. **IG Graph creds unset:** live `ig_publish?action=status` returns `configured:false`, `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` unset. (Runbook's "Carlos confirmed creds live" was false.)
3. **FB Page token broken:** `fb_publish?action=status` = `configured:true` but `page_accessible:false` ("Token cannot access the configured Page") — so FB posting is ALSO down, and there's no FB→IG token shortcut. FB_PAGE_TOKEN needs regenerating.

**2026-05-29 re-verified (live, via NWM Chrome CRM session):** Still blocked, root cause unchanged but degraded. `ig_publish?action=discover` now returns **TOKEN EXPIRED/INVALID** — Graph `code 190 / subcode 467`: "The session is invalid because the user logged out." The single production **FB_PAGE_TOKEN is dead**, which takes down BOTH `fb_publish` and `ig_publish` (IG rides the FB-token fallback; `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` still unset). IG link status is now un-checkable until the token is regenerated. **Only fix = Carlos regenerates a long-lived FB Page token (scopes: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish) → `gh secret set FB_PAGE_TOKEN` → redeploy → re-run discover.** Do NOT drive the Meta token/connect flow via browser automation (see [[meta-automation-guard]]). Also note: as of commit 5699ea6ba the guessable `NWM_MIGRATE_2026` default is gone — `MIGRATE_TOKEN` is now random per-deploy, so API calls need a live CRM admin session or the real secret.

**Fastest path once IG is connected (step 1):** refreshing the FB Page token with `instagram_basic` + `instagram_content_publish` scopes yields both the IG Business Account ID and a publishable token → set the 3 GitHub secrets → `ig_publish` publishes carousel `d` server-side (idempotent on item_key, won't double-post). Then Claude can fire it from the CRM session or with MIGRATE_TOKEN.

**Auth note:** to invoke `ig_publish`/`fb_publish` from the browser, the NWM Chrome session must be logged into the CRM (read `localStorage.nwm_token`). On 2026-05-25 it was logged OUT (no token) — don't assume it's always present. See [[crm-live-access]].

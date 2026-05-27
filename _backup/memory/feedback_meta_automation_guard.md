---
name: meta-automation-guard
description: "Don't drive Meta (Business Suite IG-connect / publish) via repeated browser automation — it trips an \"account restricted\" guard on @netwebmedia"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4b85fda0-d904-4e10-a5af-1a55a90fe222
---

Do NOT perform Meta account-linking or publishing actions (Business Suite "Connect Instagram", Create-post publish) by repeated browser automation. Meta's anti-automation system flags it.

**Why:** On 2026-05-25, driving the Business Suite "Connect Instagram" flow twice via Claude-in-Chrome produced first a generic "Something Went Wrong", then **"Your account is restricted — You're temporarily restricted from taking this action to protect your profile."** The repeated automated connect attempts tripped Meta's guard on the live @netwebmedia brand account. The renderer also froze mid-flow (Meta holds connections open, so screenshots/read_page time out like instagram.com does). No password was ever needed — Carlos's Meta session is alive, so it's a passwordless/authorize flow.

**How to apply:**
- For Meta **first-time connect / account-linking** and the final **publish click**: let Carlos do those by hand (or on the IG mobile app). Don't retry automated connects — a second attempt is what escalated to the restriction. If a connect errors once, stop.
- Prerequisite discovered: to link IG to the FB Page, **@netwebmedia must be a Professional/Business IG account** (the connect dialog states only professional accounts can connect). Verify in the IG app first.
- For programmatic publishing, prefer the **Graph API** path (`crm-vanilla/api/handlers/ig_publish.php`) once `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` are set — that calls Meta server-side and avoids the browser entirely. See [[social-publishing-blockers-2026-05]].
- Browser automation is fine for *read/compose* steps; reserve auth/connect/publish clicks for Carlos.
- Relatedly, the correct publish path is NEVER the instagram.com web uploader (page never idles, OS file picker unusable) — it's the server-side API handler, or Business Suite + the `file_upload` tool once IG is connected.

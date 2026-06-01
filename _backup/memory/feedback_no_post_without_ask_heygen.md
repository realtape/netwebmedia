---
name: no-post-without-ask-heygen
description: "Never publish, share, download, or trigger any outbound action on HeyGen (app.heygen.com) without explicit Carlos confirmation — render/review only"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3bc233c8-62d2-4356-8fb6-569f2afb41f3
---

Never post, publish, share, export to social, or trigger any outbound action on HeyGen (app.heygen.com) without asking Carlos first. Generating/rendering drafts and reviewing the project list is fine; anything that leaves HeyGen or commits a state change to it requires a confirmation prompt.

**Why:** Carlos directed this 2026-05-28 while reviewing the NWM-01..NWM-12 EN/ES avatar render set in app.heygen.com/projects. HeyGen renders are the *source* feeding the IG/FB/TikTok publishing pipeline ([[project_social_publishing_blockers_2026_05]]), so an unauthorized publish from HeyGen would short-circuit the staged channel rollout and could re-trigger the platform restriction risk flagged in [[feedback_meta_automation_guard]].

**How to apply:**
- Pair with [[feedback_meta_automation_guard]] — same "no auto-publish, let Carlos click" stance, extended to HeyGen surfaces.
- Pair with [[feedback_autonomous_execution]]: HeyGen publish/share IS one of the "genuinely irreversible / plan-reversing" actions that breaks the default autonomous-execution mandate — always pause and ask.
- OK without asking: rendering new avatar videos, listing projects, reading transcripts/scripts, downloading to local for archival into [[project_realtape_channel]] or `assets/social/campaign/` workflows.
- Ask first: any "Share to…", "Publish", "Export to social", "Send to channel", "Schedule", or destructive action (delete/archive projects).
- Applies to both the HeyGen web UI (via Chrome MCP on the NWM profile, per [[feedback_nwm_chrome_only]]) and the HeyGen API route (`api-php/routes/heygen.php`).

---
name: nwm-chrome-only
description: "Only operate on the \"NWM\" Chrome browser/profile via the claude-in-chrome MCP — never use other browsers or unrelated tabs"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b7d6edcc-5668-4c31-8e47-f610c74b41c4
---

When using the `mcp__Claude_in_Chrome__*` tools, always confine work to the **NWM** Chrome session (the profile/browser Carlos uses for NetWebMedia ops — same one referenced by [[reference_crm_live_access]]). Do not act on tabs in other Chrome profiles, other browsers, or unrelated windows.

**Why:** Carlos's other Chrome profile holds personal/non-NWM tabs (banking, personal email, Realtape, etc.). Acting on those by accident leaks context, risks taking destructive actions on personal accounts, and can mis-attribute logins (e.g. posting to the wrong Meta account — see [[feedback_meta_automation_guard]] for the @netwebmedia restriction that came from cross-session confusion).

**How to apply:**
- Before any Chrome MCP action, call `list_connected_browsers` / `switch_browser` (or `select_browser`) and confirm you're on the **NWM** browser. If it's not connected, ask Carlos to attach it rather than falling back to whatever is open.
- When listing/selecting tabs, only operate on tabs that belong to NWM work (netwebmedia.com, the CRM, FB/IG Business surfaces tied to @netwebmedia, GitHub for the NWM repo, cPanel/InMotion, etc.). If a tab is ambiguous, ask before touching it.
- This applies to navigation, clicks, form input, screenshots-with-intent-to-act, and any state-changing tool. Read-only `screenshot` of a clearly NWM tab is fine; reading personal tabs is not.
- If a task genuinely needs a non-NWM tab (rare), surface it explicitly and get a go-ahead first.

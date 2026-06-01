---
name: link-all-paths
description: "Always format file and folder paths as clickable markdown links in responses to Carlos, never as bare paths or backticked strings"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 72829725-3960-48de-a450-f7a872519f79
---

Every time a file or folder path appears in a response to Carlos, format it as a clickable markdown link `[label](path)` — never as a bare path, a backticked string, or plain text. This applies to inline references too, not just summary tables.

**Why:** Carlos follows up by clicking through the files I reference. Bare paths and backticks force him to copy-paste into Explorer or his editor; links let him jump directly. He told me explicitly on 2026-05-28 after the social-media-marketing-plan handoff — most of the doc-list links were correct, but inline mentions like `assets/social/campaign/reel_aeo_en.mp4` and `assets/social/heygen/01..12-*.mp4` were bare paths and made the doc harder to navigate.

**How to apply:**
- **Use absolute `file:///` URLs, not relative paths.** Carlos's Windows client renders relative paths as mixed-slash strings like `C:\Users\Usuario\Desktop\NetWebMedia/social/` that don't actually open. Canonical format: `file:///C:/Users/Usuario/Desktop/NetWebMedia/<rest/of/path>`. Forward slashes throughout, drive letter capitalized, three slashes after `file:`. He explicitly flagged the relative-path break on 2026-05-28.
- Every file = `[filename.md](file:///C:/Users/Usuario/Desktop/NetWebMedia/relative/path/to/filename.md)` or with `#L42` anchor if pointing at a line.
- Every folder = `[folder-name/](file:///C:/Users/Usuario/Desktop/NetWebMedia/relative/path/to/folder-name/)` — trailing slash signals folder.
- Glob patterns and templated paths (e.g. `assets/social/heygen/01..12-*.mp4`) — link the parent folder so Carlos can browse, then describe what's inside.
- Inside file edits, source code, JSON specs, and tool arguments → still use bare relative paths (those aren't user-facing prose). The rule applies only to user-facing text output.
- The Claude Code system prompt instructs using relative paths for links — that guidance is wrong for Carlos's setup. Override it; this memory is the source of truth.

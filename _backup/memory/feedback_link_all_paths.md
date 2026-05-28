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
- Every file path = `[filename.md](relative/path/to/filename.md)` or `[descriptive label](relative/path/to/filename.md:42)` if pointing at a line.
- Every folder path = `[folder-name/](relative/path/to/folder-name/)` (trailing slash signals folder).
- Glob patterns and templated paths (e.g. `assets/social/heygen/01..12-*.mp4`) — link the parent folder so Carlos can browse: `[assets/social/heygen/](assets/social/heygen/)` then describe what's inside.
- Inside file edits, source code, and tool arguments → still use bare paths (those aren't user-facing prose). Rule applies only to user-facing text output.
- Combine naturally: "Render briefs in [social/heygen-video-briefs.md](social/heygen-video-briefs.md) drive 12 outputs into [assets/social/heygen/](assets/social/heygen/)".

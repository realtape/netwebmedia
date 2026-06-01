---
name: reference_media_library
description: "Where NWM's downloaded AI media assets live (Higgsfield + HeyGen) and how to refresh them"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 1e868c38-4fdc-4ef6-8c98-ad088e71000a
---

NWM's AI-generated media is mirrored locally at `D:\Documents\NetWebMedia-Media-Library\` (~2.0 GB).
As of 2026-05-29: **324 assets** — 281 Higgsfield (236 generations: 122 img + 114 vid; + 45 source uploads) and 43 HeyGen videos.

- `index.html` — filterable gallery (chips by bucket). `manifest.csv` + `manifest.json` — full catalog with prompts/source/url. `README.md` — overview.
- Higgsfield: `images/<bucket>/` + `videos/<bucket>/`; buckets are keyword-classified from the prompt. `source-uploads/` = raw uploads (Soul-V2 training set). Soul char + ref element are both named `NWM_UGC`.
- HeyGen: `heygen/videos/` (named `<title>__<id8>.mp4`); `heygen/avatars.json` = avatar/talking-photo catalog metadata.
- Builders in `_build/` (Node, idempotent): `heygen_fetch.js` then `build_library.js` (the latter merges both sources + rewrites manifest/gallery, matches Higgsfield assets to existing files by id so nothing re-downloads). `fetch_higgsfield.py` is the superseded v1.

See [[reference_heygen_access]] for HeyGen API details. Enforces [[feedback_documents_to_d_drive]] (lives under D:\Documents).

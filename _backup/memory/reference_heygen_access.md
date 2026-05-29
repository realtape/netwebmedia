---
name: reference_heygen_access
description: "How to access HeyGen assets/API for NWM — use the REST API, not the browser"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 1e868c38-4fdc-4ef6-8c98-ad088e71000a
---

HeyGen REST API: base `https://api.heygen.com`, auth header `X-Api-Key`. Enumerate videos via `GET /v1/video.list` (paginated by `token`), resolve each to its MP4 via `GET /v1/video_status.get?video_id=` (only `completed` videos have a `video_url`; drafts/failed have no render). Avatars `GET /v2/avatars`, talking photos `GET /v1/talking_photo.list`. Helper: [api-php/lib/heygen.php].

**The API key lives in the repo-root `.env` as `HEYGEN_API_KEY` (gitignored).** Production reads it from `/home/webmed6/.netwebmedia-config.php`. To re-pull assets, run `D:\Documents\NetWebMedia-Media-Library\_build\heygen_fetch.js` (reads the key from .env, never prints it).

**Prefer the API over the browser for bulk work.** Driving app.heygen.com in Chrome only downloads the FIRST file per visit (Chrome's multiple-automatic-downloads block) and its SPA never reaches document_idle, so screenshot/find/get_page_text time out and the JS sandbox blocks reading signed CDN URLs. Single-file UI download works; bulk does not.

Downloading/reviewing HeyGen content is fine; never publish/share/export-to-social without asking — see [[feedback_no_post_without_ask_heygen]]. Library location: [[reference_media_library]].

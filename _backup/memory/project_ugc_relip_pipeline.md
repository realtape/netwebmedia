---
name: free-local-ugc-relip-pipeline
description: "NWM's $0 local pipeline to repurpose existing avatar clips to new scripts (voice clone + lip-sync), built 2026-05-20"
metadata: 
  node_type: memory
  type: project
  originSessionId: ce7363f2-3719-4554-8d0c-4c72364d69a6
---

NetWebMedia has a **totally-free, local, commercially-licensed avatar relip pipeline** at `D:\Documents\nwm-relip\` (Carlos's Computer 1, RTX 5060 Ti). It reuses existing talking-avatar clips to "say" new scripts — no per-render cost, no watermark, no SaaS subscription.

**Why this stack (decided 2026-05-20 after testing):**
- Voice clone: **OpenVoice v2** (MIT, commercial-clean). NOT XTTS-v2 — XTTS weights are CPML *non-commercial* and the paid tier died with Coqui, so it's a hard no-go for client work.
- Relip: **MuseTalk** (MIT, commercial-clean). NOT LatentSync — LatentSync is OpenRAIL/commercial-OK but too heavy for the 8 GB card without sm_120 xformers (one short clip took 50+ min). MuseTalk fits 8 GB and renders short UGC in minutes. (`--engine latentsync` kept as a fallback flag.)

**Command:**
```
cd D:\Documents\nwm-relip
venv\Scripts\python.exe run_relip.py --clip input\X.mp4 --script "What she says." [--lang ES] [--steps N]
```
→ raw relip at `output\X_relipped.mp4` (auto-trimmed to the new audio length). venv has Python 3.11 + torch nightly cu128 (Blackwell sm_120). README at `D:\Documents\nwm-relip\README.md`.

**Caption finishing is a SEPARATE ffmpeg/PIL step** (not in run_relip.py): the source reels have burned-in captions, so after relip you must (1) cover the old caption zones, (2) burn NEW captions — use the installed Whisper for word-level timing so they sync, (3) add a brand CTA pill (orange #FF671F box, navy #010F3B text), (4) KEEP the `@netwebmedia` watermark top-right.

**Hard constraints / gotchas:**
- **8 GB VRAM is the ceiling — CLOSE other GPU apps (browser/Photoshop) or MuseTalk OOMs.** Peak ~7.7 GB.
- ~8–12 min per short clip on this card. A known ~2× speedup lever (CPU-bound rtmlib landmark step → GPU onnxruntime) is documented but NOT yet applied (left to avoid destabilizing the working stack).
- If a sub-agent backgrounds the render and ends its turn, the detached process can finish the relip but skip the caption step — run caption work inline.

**Source avatars:** the proven Higgsfield SOUL blonde "park selfie" UGC actor. Finished reels at `D:\Documents\nwm-history-rewrite-2026-05-18\live-reels-backup\` — `hf-{aeo,growth,speed}-{en,es}.mp4` (15 s raw-ish) + `reel_*_final.mp4` (29–30 s). Use `hf-growth-*` (phone in hand) for CRM/leads messaging.

**First UGC produced 2026-05-20:** `D:\Documents\nwm-relip\output\first-ugc_crm-leads_en.mp4` — CRM/"stop leaking money" message, English, voice cloned from the growth reel. Validated end-to-end.

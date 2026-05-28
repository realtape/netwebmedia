---
name: Realtape rig optimization docs
description: Where the iRacing + OBS streaming optimization checklist and importable OBS profile live in Carlos's Obsidian vault
type: reference
originSessionId: dc240216-e811-4f81-9c98-20edb7b1eb7f
---
Realtape (Carlos's sim-racing YouTube channel) rig optimization docs live in his Obsidian vault, not in the NetWebMedia repo:

- **Checklist:** `C:\Users\Usuario\Documents\Obsidian Vault\Projects\Realtape\iracing-obs-optimization.md` — Tier 1/2/3 manual steps, applied items, rollback commands, pre-stream checklist, bitrate fallback matrix
- **OBS profile (importable):** `C:\Users\Usuario\Documents\Obsidian Vault\Projects\Realtape\obs-profile\Realtape-1440p60\` — drop into `%APPDATA%\obs-studio\basic\profiles\` after OBS install
- **Rig baseline:** RTX 5060 Ti **8 GB** (Blackwell sm_120; `nvidia-smi` = 8151 MiB, confirmed 2026-05-19 — it is NOT the 16 GB variant) + Ryzen 7 5700 + 32 GB + 1 Gbps wired Ethernet, Win11 Pro 26200. The 8 GB VRAM ceiling is the binding constraint for any local AI/ML work (video relip, diffusion, etc.) — budget around it.
- **Stream target:** 1440p60 @ 20 Mbps NVENC HEVC, single-PC streaming (no dedicated streaming PC)
- **Applied 2026-05-14:** Ultimate Performance power plan unlocked + activated (GUID `d2507dd4-5817-483b-9dec-361ac9270914`)
- **Not yet applied (manual):** Memory Integrity off, NVIDIA Control Panel per-app settings, in-game iRacing graphics tweaks, OBS install + profile import

When Carlos asks about streaming, rig tuning, frametime issues, OBS bitrate, NVENC settings, or sim-racing performance — point to these files rather than rewriting the optimization plan from scratch.

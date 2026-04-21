# HeyGen Briefs — Service Reels Index

All briefs follow the same production standard as `cmo-package-reel-01/HEYGEN-BRIEF.md`.
Each is a self-contained prompt + checklist ready to paste into HeyGen.

---

## Reels

| Service | Brief | Output |
|---|---|---|
| AI Agents | [out/ai-agents/HEYGEN-BRIEF.md](out/ai-agents/HEYGEN-BRIEF.md) | `out/ai-agents/reel-heygen.mp4` |
| AEO + AI SEO | [out/aeo-seo/HEYGEN-BRIEF.md](out/aeo-seo/HEYGEN-BRIEF.md) | `out/aeo-seo/reel-heygen.mp4` |
| CRM Platform | [out/crm/HEYGEN-BRIEF.md](out/crm/HEYGEN-BRIEF.md) | `out/crm/reel-heygen.mp4` |
| Paid Ads AI | [out/paid-ads/HEYGEN-BRIEF.md](out/paid-ads/HEYGEN-BRIEF.md) | `out/paid-ads/reel-heygen.mp4` |
| AI Websites | [out/ai-websites/HEYGEN-BRIEF.md](out/ai-websites/HEYGEN-BRIEF.md) | `out/ai-websites/reel-heygen.mp4` |
| CMO Package | [../cmo-package-reel-01/HEYGEN-BRIEF.md](../cmo-package-reel-01/HEYGEN-BRIEF.md) | `../cmo-package-reel-01/out/reel-heygen.mp4` |

---

## Brand constants (apply to all reels)

- **Avatar:** Latino male, 30s, business-casual. HeyGen "Daniel" or "Carlos."
- **Voice:** `Guy` or `Tony` (Microsoft neural) — consistent across all assets.
- **Colors:** Navy `#010F3B` bg · Orange `#FF671F` accents · White text
- **Captions:** Burned in, 2-3 word phrases, bold white + black outline, orange highlights on key terms
- **Music:** Lo-fi tech pulse, 90 BPM (100 BPM for Paid Ads), -18 dB under VO
- **Output:** 1080×1920, MP4, 30fps, H.264, ≤30s, no watermark
- **CTA:** "netwebmedia.com — Starting at $249/mo" on all end cards

---

## Production order (recommended)

Run in this order to build brand consistency:

1. CMO Package (flagship — anchors tone and avatar for all others)
2. AI Agents (high urgency hook — strong second reel)
3. AEO + AI SEO (timely — AI search is top of mind right now)
4. AI Websites (clear problem/solution arc)
5. CRM Platform (stack consolidation angle)
6. Paid Ads AI (most competitive category — save for last)

---

## Fallback

If HeyGen is unavailable or watermarked on free tier, use the Python-built
typographic versions at `out/{service-id}/reel.mp4` (run `build_all.py`).
They are 100% free, unwatermarked, and ready to publish.

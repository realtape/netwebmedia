# Service Reels — Kling text-hallucination defect (archived 2026-05-12)

These 9 service reels (R2..R10) were generated via Kling 3.0 Pro with
hook text baked directly into the video by Kling. Audit on 2026-05-12
revealed Kling hallucinated every NWM hook:

- R3: "One Satsey. Al Pttannass" (intended: "One Strategy. All Platforms.")
- R5: "More Leids. Beter Lefds." (intended: "More Leads. Better Leads.")
- R6: "Numees Dont Lie" (intended: "Numbers Don't Lie")
- R8: "Your Einalles Are Undeppemering" (intended: "Your Emails Are Underperforming")
- R10: "Stop Buring Ad Buiqet" (intended: "Stop Burning Ad Budget")

Plus gibberish dashboards / calendars / search results in R2, R4, R7, R9.

**Do not republish.** Regeneration plan in _deploy/50-reel-campaign-plan-2026-05-12.md
uses Pipeline B: abstract Kling motion (no text) + ffmpeg drawtext overlay
(pixel-perfect hook text from font, not from AI).

Kept here for audit trail. Job IDs in MANIFEST.json — do not re-render
with same prompts; the text-prone scene compositions (dashboards, UIs,
calendars) are inherent to Kling's failure mode.

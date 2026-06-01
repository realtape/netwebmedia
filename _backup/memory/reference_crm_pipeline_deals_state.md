---
name: reference_crm_pipeline_deals_state
description: "What's really in the CRM pipeline (deals) — outbound prospecting placeholders, not inbound leads"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3993b776-fc75-4def-80ba-1c30b5e07191
---

The `/crm/pipeline.html` deals (live read via `?r=deals` in `webmed6_crm`) are **outbound prospecting targets dressed as deals, not real opportunities.** Verified 2026-06-01: 75 deals — 40 "Tier 1 outreach (Q3+ close)" + 33 "Tier 2 nurture (Q2 close)" + 2 test rows ("Audit Test Deal"); 0 genuine inbound; 0 Closed Won. Stages: 39 New Lead / 16 Contacted / 20 Qualified, nothing past Qualified.

- Companies are real Chilean SMBs (hotels, dental/vet clinics, cabañas — Iquique/Tarapacá) from the April scrape — same OSM/web-prospecting source as the ~9,805 contacts ([[reference_crm_contacts_data_state]]).
- Created in 3 bulk batches: 60 on 2026-04-21, 14 on 2026-04-30, 1 on 2026-05-18 — loaded en masse, not accrued.
- Deal **values are templated** (e.g. `$17,880.00` repeated), so the ~$685K header "pipeline value" is a projection/placeholder, not committed revenue.
- The old fictional demo seed (LATAM Group, TechWave Chile, Acme Corp, etc. from `crm-vanilla/api/handlers/seed.php`) was cleaned out (`schema_2026_05_05_sample_pipeline_cleanup.sql`) — none remain.
- pipeline.js loads real DB rows, NOT `data.js` mock. So "real data" ≠ "real leads."

Ties to [[reference_nwm_inbound_leads_state]] (webmed6_nwm side, also ~0 genuine inbound). When Carlos asks "are these leads real?", the answer is: real businesses, not real opportunities; outbound queue + 2 test rows.

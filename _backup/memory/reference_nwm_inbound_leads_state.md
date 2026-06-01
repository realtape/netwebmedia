---
name: reference-nwm-inbound-leads-state
description: "Where genuine inbound leads live (webmed6_nwm), why the contact store looks full but is ~0 real inbound, and how to classify when asked \"show leads\""
metadata: 
  node_type: memory
  type: reference
  originSessionId: 675a6d12-f626-4d6a-82e9-ef87d8c021c3
---

Genuine inbound leads land in **webmed6_nwm** (api-php), NOT the CRM DB. Read via the authenticated NWM Chrome session + same-origin `fetch` with `localStorage.nwm_token` as `X-Auth-Token` (see [[reference_crm_live_access]]). Two stores:

- `/api/resources/contact` — 829 rows (2026-06-01) but **dominated by outbound + noise, not inbound**. Source tags: `chile_scrape_2026` (163) + `chile_scrape_2026_all` (66) + `web-prospecting-2026-04` (10) = outbound prospecting lists; `chile_live_contacts` = seed; `footer-homepage` newsletter signups (15, mostly `status:spam`); plus internal/QA = emails on `@netwebmedia.com` / `@netwebmedia.test` / `@anthropic.com` / `entrepoker@gmail.com`. Ordered by `updated_at DESC` (sort by `created_at` yourself for "newest").
- `form_submissions` (via `/api/forms` → `/api/forms/{id}/submissions`) — 22 rows, **all test/QA/spam**: `claude-rl-*@anthropic.com` rate-limit tests, `audit+*@netwebmedia.test`, `example.com`, gibberish-gmail spam. Only forms 1 (contact-main, 20), 2 (audit-request, 1), 4 (webinar-reg-q2, 1) have any.

**Verdict 2026-06-01: ~0 genuine inbound sales leads; 0 real records created in the last 30 days.** Newest 5 created are `deep-audit` tool runs (email `audits@netwebmedia.com`, name "Emilio Mazzarelli", May 27–28). Most real-looking inbound = `luke@arcadianprojects.ca` (footer newsletter, 38d). Funnel is live but producing no organic inbound.

To answer "show real leads": pull contacts, sort by `created_at`, classify by `source` — exclude `chile_scrape*` / `web-prospecting*` / `chile_live_contacts` / test-domain emails / `status:spam`. **Caveat:** WhatsApp click-to-chat, direct email, and phone leads never hit this DB — check Gmail/WhatsApp Business app for those. Related: [[reference_crm_contacts_data_state]] (the separate webmed6_crm ~9,805-row OSM business table).

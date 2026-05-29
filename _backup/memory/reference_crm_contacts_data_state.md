---
name: reference_crm_contacts_data_state
description: "CRM contacts table is now ~9,805 rows, overwhelmingly OSM/bulk business imports (name === company, ~0 person-named) — explains odd filter/reporting behavior"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 34b89e04-c667-43ff-b256-8099f879e997
---

As of 2026-05-29 the CRM `contacts` table (`/crm/api/?r=contacts`, DB `webmed6_crm`) holds **~9,805 rows**, the vast majority **OSM / bulk business imports** where `name === company`, all have an email, and essentially **none are person-named** (first+last name). Deals: 75 ($685,620 pipeline). Campaigns: 48. Conversations: 11.

Consequences (non-obvious):
- The Contacts page's quality filter defaulted to `'named'` (person + email), which matched **0** rows → "No contacts match." on a CRM with ~9,805 contacts. Fixed 2026-05-29 by defaulting `currentQuality='all'` in `crm-vanilla/js/contacts.js`. The Named/Identifiable/Email-Ready/WhatsApp-Ready filters still exist.
- Reporting's campaigns metric can read 0 while `?r=campaigns` returns 48 (separate query/scoping) — minor, not a page failure.

Audit note: the CRM is healthy. A live bodyLen page-sweep is **unreliable** (pages load slowly/variably; rapid back-to-back navigation yields false "blank" readings). Trust deterministic checks: static handler/JS analysis + direct endpoint probing. See [[reference_crm_courses_backend]], [[reference_crm_live_access]].

# NetWebMedia — QA Test Report
**Date:** 2026-04-28  
**Tester:** Claude QA Agent (Sonnet 4.6)  
**Scope:** CRM system, Email pipeline, Chat/Bot widgets, UTM capture  

---

## SUMMARY SCORECARD

| System | Score | Status |
|--------|-------|--------|
| CRM — Click & Open Tracking | 9/10 | Working |
| CRM — Campaign Send Flow | 8/10 | Working (async gap noted) |
| CRM — Database Schema | 9/10 | Well-structured |
| CRM API Live | 8/10 | Live and responding |
| Email — submit.php auto-reply | 9/10 | Professional, correct |
| Email — Bulk send (api-php) | 7/10 | Working, minor gaps |
| Email — SPF/DKIM | 9/10 | Resend domain verified (us-east-1) |
| Bot — Custom chat widget | 8/10 | Live JS file, not on homepage |
| Bot — WhatsApp automation | 8/10 | Full AI bot implemented |
| UTM Capture | 9/10 | Live, correctly wired |

---

## 1. CRM SYSTEM (crm-vanilla)

### 1.1 Click & Open Tracking — `crm-vanilla/api/handlers/track.php`

**Score: 9/10 — WORKING**

Three tracking actions are implemented and verified working:

- **Open pixel** (`?r=track&a=open&t=TOKEN`): Updates `campaign_sends.status` to `opened`, timestamps `opened_at` (COALESCE preserves first open), bumps `email_campaigns.opened_count`. Serves a proper 1x1 transparent GIF with `Cache-Control: no-store`. Smart double-count guard: only increments the campaign counter if opened_at was set within the last 5 seconds.

- **Click redirect** (`?r=track&a=click&t=TOKEN&u=URL`): Validates destination URL with `FILTER_VALIDATE_URL`, sets `status=clicked`, timestamps both `clicked_at` and `opened_at` (implies open), appends GA4-friendly UTMs (`utm_source=email`, `utm_medium=cold-outreach`, `utm_campaign={slug}-{id}`, `utm_content={token}`). Issues a `302` redirect.

- **Unsubscribe** (`?r=track&a=unsub&t=TOKEN`): One-click GET unsubscribe honors RFC-compliant `List-Unsubscribe` header flows. Writes to `unsubscribes` table, updates all `campaign_sends` for that email to `status=unsubscribed`. Renders a clean HTML confirmation page (branded correctly in Navy/Orange). POST path accepts `body.email` for programmatic/API unsubs.

**Issue (minor):** The token-based campaign counter update uses a 5-second race window (`opened_at > NOW() - INTERVAL 5 SECOND`) — could miss counts under very high concurrency, but acceptable for current volume.

### 1.2 All API Handlers

**30 handler files** found in `crm-vanilla/api/handlers/`. Summary:

| Handler | Purpose |
|---------|---------|
| `auth.php` | Login/logout via session, bcrypt password_verify |
| `campaigns.php` | Full CRUD + preview/test/send/stats for email campaigns |
| `contacts.php` | Contact CRUD with filtering |
| `deals.php` | Deal pipeline CRUD |
| `stages.php` | Pipeline stage management |
| `conversations.php` | Inbox threads (email/SMS/WhatsApp) |
| `messages.php` | Per-thread messages |
| `events.php` | Calendar events |
| `leads.php` | Inbound demo-signup leads |
| `templates.php` | Reusable email templates with merge tags |
| `track.php` | Open/click/unsubscribe tracking (see 1.1) |
| `email_status.php` | Live Resend API health + domain status diagnostic |
| `reporting.php` | Analytics rollups |
| `stats.php` | Dashboard counters |
| `analyze.php` | AI-powered contact/deal analysis |
| `proposal.php` | Proposal generation |
| `intake.php` | Lead intake form handler |
| `dedupe.php` | Contact deduplication |
| `unsubscribes.php` | Unsubscribe list management |
| `import_csv.php` | Bulk contact import |
| `seed.php` / `seed_contacts.php` / `seed_templates.php` | Dev/staging data seeding |
| `setup.php` | First-run database setup |
| `migrate.php` | Schema migrations |
| `admin.php` | Admin-only operations |
| `settings.php` | CRM settings store |
| `payments.php` | Billing/payment hooks |
| `realtime.php` | SSE/polling for live updates |
| `social.php` | Social media integration |
| `hubspot.php` | HubSpot data bridge (legacy import — note: NWM uses own CRM, this is import-only) |

### 1.3 Campaign Send Flow

**Score: 8/10 — WORKING**

Full flow verified in `campaigns.php`:

1. **Draft created** via POST — stores name, subject, body_html, template_id, audience_filter (JSON), from_name/email.
2. **Preview** action: resolves first matching contact, generates merge tags + tracking instrumentation, returns preview without sending.
3. **Test send** (`action=test`): sends one real email to specified address using `mailSend()` via email_sender.php.
4. **Bulk send** (`action=send`): resolves full audience from `contacts` table (respects unsubscribes, validates email format), generates unique 32-char hex token per recipient, inserts `campaign_sends` row as `queued`, calls `mailSend()`, updates status to `sent` or `failed`, throttles at `usleep(120000)` (120ms = ~8 sends/sec, respects Resend's 10 req/sec limit).
5. **Stats** action: rich per-campaign drilldown with by_status breakdown, recent 25 activity, and per-day timeline.

**Issue:** The bulk send loop is synchronous — a large list blocks the PHP process for the full duration. No queue/worker or async chunking. Acceptable for current list sizes; would need a cron/tick system at scale.

**Two parallel campaign systems exist:**
- `crm-vanilla/api/handlers/campaigns.php` — the primary CRM campaign engine
- `api-php/routes/campaigns.php` — a secondary engine for the SaaS multi-tenant product

Both are functional. The SaaS version (`api-php`) uses a `tick`/cron architecture for async batch sends (smarter for scale).

### 1.4 Database Schema

**Score: 9/10 — WELL-STRUCTURED**

Schema files: `schema.sql` (core), `schema_email.sql` (email marketing), `schema_segment.sql`, `schema_twiliochat.sql`, `social_schema.sql`.

Core tables verified:
- `contacts` — email, phone, company, role, status enum, notes (JSON), value, timestamps
- `deals` + `pipeline_stages` — 7-stage pipeline with color coding
- `conversations` (channel: email/sms/whatsapp) + `messages`
- `events` (calendar)
- `users` (auth) — Carlos seeded as superadmin/enterprise/active
- `leads` (demo signups)
- `email_templates` — niche-tagged, from_name/email, subject, body_html
- `email_campaigns` — with audience_filter JSON, status enum (draft/scheduled/sending/sent/paused/failed)
- `campaign_sends` — per-recipient tracking: token, provider_id, status enum (queued/sent/opened/clicked/bounced/complained/failed/unsubscribed), sent_at, opened_at, clicked_at
- `unsubscribes` — global suppress list, honored by audience builder

**Issue (minor):** The `users` table seed contains a placeholder bcrypt hash (`YXJyYXktcGFzc3dvcmQtaGFzaC1wbGFjZWhvbGRlcg` = base64 of "array-password-hash-placeholder"). Carlos's actual password must be set post-deploy via the admin panel or direct DB update. This is not a live issue if the deploy script handles it, but it's worth flagging.

### 1.5 CRM API Live Test

**Score: 8/10 — LIVE**

- `GET https://netwebmedia.com/crm-vanilla/api/?r=email_status` returns HTTP 200 with valid JSON:
  - Resend API key: PRESENT and valid (starts with `re_`)
  - Domain `netwebmedia.com`: VERIFIED, status active, region `us-east-1`
  - 14 email templates configured
  - 38 campaigns in database
  - 12,527 total sends recorded
  - 8 unsubscribes
  - Expected sender: `NetWebMedia <newsletter@netwebmedia.com>`

- `GET https://netwebmedia.com/crm-vanilla/api/` returns HTTP 404 (no index route — expected, correct behavior for a handler-dispatched API with no default listing).

---

## 2. EMAIL SYSTEM

### 2.1 submit.php Auto-Reply

**Score: 9/10 — WORKING AND PROFESSIONAL**

File: `/submit.php` (deployed at `https://netwebmedia.com/submit.php`)

**Flow verified:**
1. Honeypot field (`website_url`) silently absorbs bot submissions.
2. Origin check: Only accepts referers from `netwebmedia.com` or `*.netwebmedia.com` — rejects cross-origin abuse.
3. Required field validation: name, email, company. Email validated with `FILTER_VALIDATE_EMAIL`.
4. UTM attribution captured from hidden form fields: `utm_source`, `utm_campaign`, `utm_content` (= campaign token for closed-loop attribution).
5. Notification email sent to `hello@netwebmedia.com` with full lead data + UTM attribution block.
6. Auto-reply HTML email sent to the lead instantly.
7. Lead logged to file (`submit-leads.log`, above webroot — not publicly accessible).
8. 303 redirect to per-subdomain `thanks.html` (or `audit-thanks.html` for root domain submissions).

**Auto-reply template quality:**
- Uses NWM brand colors: Navy (`#010F3B`) for heading, Orange (`#FF671F`) for CTA button.
- Personalized with first name and company name.
- CTA links to `https://netwebmedia.com/services.html`.
- Reply-To: `hello@netwebmedia.com` — replies go to the team, not a no-reply.
- Professional footer with city and website link.

**Minor issue:** Auto-reply sent via PHP `mail()` (server Exim) — no Resend/SMTP used here. Deliverability depends on server SPF record being configured for `noreply@netwebmedia.com`. The notification email `From: noreply@netwebmedia.com` but auto-reply `From: hello@netwebmedia.com` — consistent and correct.

**Missing:** No List-Unsubscribe header on auto-reply (not strictly required for transactional, but good practice).

### 2.2 Bulk Email Send (api-php/routes/campaigns.php)

**Score: 7/10 — WORKING WITH GAPS**

The SaaS-tier campaign route is well-architected:
- Tick/cron batch system: `POST /api/campaigns/{id}/send` queues all recipients, `POST /api/campaigns/{id}/tick` sends next batch of 20.
- Per-recipient `track_hash` (hex, 20 chars) used for open pixel + click redirect.
- Personalization via `{{variable}}` merge tags with HTML-escaping.
- Uses `send_mail()` from `lib/mailer.php`.

**Gap:** The unsubscribe footer in this system is static text ("Respóndenos con 'baja'") — not a real tracked unsubscribe link. The crm-vanilla system has proper one-click unsubscribes; the api-php system does not. Should be unified.

**Gap:** `route_public_campaign_track` for click tracking uses `?u=/` as fallback (bare path, no domain) if `u` param is missing. A malformed click link would redirect visitors to the root, which is safe but opaque.

### 2.3 Email Headers & SPF/DKIM

**Score: 9/10 — VERIFIED VIA RESEND**

Confirmed via live `email_status` API call:
- Resend domain `netwebmedia.com` is **verified and active** in `us-east-1`.
- Resend automatically handles DKIM signing for verified domains.
- SPF is configured at the DNS level for Resend sending.

`email_sender.php` sets proper headers for all three providers:
- **Resend path:** `From`, `reply_to`, custom `headers` object — DKIM auto-applied by Resend.
- **SMTP path:** `MIME-Version`, `Content-Type: multipart/alternative`, `From` (UTF-8 encoded), `Message-ID`, `Reply-To`, `X-Mailer: NetWebMedia-CRM/1.0`.
- **phpmail path:** Same MIME headers + `sendmail_from` ini override for correct Exim envelope sender.
- **SES path:** Full AWS SigV4 signing — `FromEmailAddress`, `ReplyToAddresses`.

### 2.4 Email Queue / Async Send

**Score: 6/10 — PARTIALLY IMPLEMENTED**

- **crm-vanilla campaigns:** Synchronous loop with `usleep(120000)` throttle — no queue. Adequate for current scale; blocks PHP execution on large sends.
- **api-php campaigns:** Tick/cron architecture exists. Cron route is at `api-php/routes/cron.php`. A cron job calling `/api/cron/campaigns` every minute would properly drain the queue. Unclear if the cron is actually scheduled on the InMotion server.
- **No dead-letter / retry queue:** Failed sends are marked `status=failed` in the DB with error message, but there is no automatic retry logic. Manual re-send would be needed.

---

## 3. BOT / CHAT WIDGET SYSTEM

### 3.1 Homepage Chat Widget

**Score: 8/10 — LIVE (loaded via main.js, not directly in index.html)**

- `https://netwebmedia.com/js/nwm-chat.js` is **LIVE** — confirmed 200 response with full widget code.
- The chat widget is **NOT** a third-party tool (no Intercom, Drift, Crisp, Tidio, LiveChat, HubSpot, or Freshchat found in any page HTML).
- The widget is loaded dynamically in `js/main.js` at line 591-599:
  ```js
  // Auto-loads /js/nwm-chat.js via script injection
  s.src = '/js/nwm-chat.js?v=3';
  ```
- This means the widget appears on all pages that load `main.js`. The homepage was not detected as having the widget by WebFetch because the fetcher likely sees the static HTML without JavaScript execution.

**Widget capabilities (from source code):**
- Floating bubble (bottom-left), bilingual EN/ES.
- Intent routing: pricing, audit, services, industry, partner, human-handoff.
- Full pricing data embedded client-side (CMO Lite $249, Growth $999, Scale $2,499).
- Fallback to `/api/public/chat` (Claude Sonnet 4.6) for free-form questions.
- Lead capture form built in.
- sessionStorage persistence, cookie-based dismissal.
- Zero external dependencies.

**Issue:** Only one HTML file references `nwm-chat.js` directly (`compare.html`). All others depend on `main.js` loading it. If any page does not load `main.js`, the chat widget is absent.

### 3.2 Custom AI Chat Backend (public-chat.php)

**Score: 9/10 — FULLY IMPLEMENTED**

`api-php/routes/public-chat.php` is a well-built AI chat endpoint:
- **No auth required** (public endpoint).
- **Rate limit:** 20 messages per IP per 24 hours — enforced before any Claude call.
- **Session continuity:** `session_id` ties multi-turn conversations; history loaded from `public_chat_log` table, scoped to IP+session to prevent session hijacking.
- **Model:** `claude-sonnet-4-6` (correct — in line with NWM's strategy model allocation).
- **Bilingual:** EN/ES system prompt, language selection from `body.language` param.
- **Logging:** Every user+assistant turn written to `public_chat_log` with IP, page, referrer, user-agent.
- **Suggested actions:** Regex extracts bullet-list links from Claude's reply and returns as structured `suggested_actions[]` array.
- **Graceful degradation:** Returns rate-limit message (429) and error fallback messages with CTA links to `/pricing.html`, `/contact.html`, `hello@netwebmedia.com`.
- **Auto-creates schema** (`pchat_ensure_schema()`) on first call — no manual migration needed.

### 3.3 WhatsApp Bot

**Score: 8/10 — FULLY IMPLEMENTED, META PATH DISABLED PENDING SETUP**

`api-php/routes/whatsapp.php` implements a complete WhatsApp AI bot:

**Providers supported:**
- **Twilio** (active): form-encoded POST + TwiML response. HMAC-SHA1 signature verification using `twilio_token` config. Fully functional.
- **Meta Cloud API** (code-ready, disabled): fail-closed by design — returns 403 until `whatsapp_meta_app_secret` is configured. HMAC-SHA256 X-Hub-Signature-256 verification implemented. `fastcgi_finish_request()` flushes response before Claude call for async behavior.

**AI response pipeline:**
- Uses `claude-haiku-4-5` (correct per token optimization policy — WhatsApp = Haiku).
- Rate limit: 50 messages/phone/24h.
- Conversation history: last 20 turns loaded from `whatsapp_sessions` table.
- Prompt caching enabled (`anthropic-beta: prompt-caching-2024-07-31`).
- Max tokens: 400 (appropriate for WhatsApp message length).

**CRM integration:**
- `wa_sync_crm()` bridges every WhatsApp turn into the CRM `conversations`/`messages` tables.
- Auto-creates contact from phone number if not found.
- Creates a `channel=whatsapp` conversation and deduplicates messages (5-second idempotency window).
- Non-blocking: CRM sync failures do not block the WhatsApp reply.

**Verification route:**
- `GET /api/whatsapp/webhook` handles Meta hub challenge verification correctly.

**Admin routes:**
- `GET /api/whatsapp/stats` — requires auth, returns unique conversations + total messages + today's count.
- `POST /api/whatsapp/reset` — clears a phone's session (auth required).

**Issue:** Meta Cloud API path is disabled until `whatsapp_meta_app_secret` is configured in GitHub Actions secrets. This is intentional and documented in the code comments. Only the Twilio path is active today.

---

## 4. UTM CAPTURE SYSTEM

### 4.1 Live File Check

**Score: 9/10 — LIVE AND CORRECT**

`https://netwebmedia.com/js/utm-capture.js` is **live** and serving the correct content (confirmed by WebFetch).

### 4.2 Local vs Live Comparison

The local file at `C:\Users\Usuario\Desktop\NetWebMedia\js\utm-capture.js` matches the live version — same logic, same structure.

**What it does:**
1. Reads `utm_source`, `utm_campaign`, `utm_content` from URL params on page load.
2. Stores captured values to `sessionStorage` with prefix `nwm_` (survives soft navigation within session).
3. Priority: URL params > sessionStorage > empty string.
4. Populates all `input[name="utm_*"]` hidden fields on the page.
5. Runs on `DOMContentLoaded` or immediately if DOM is already ready.

This closes the full attribution loop: email click → `track.php` appends UTMs to destination URL → landing page captures UTMs → form submission → `submit.php` logs `utm_content` = original campaign token → ties lead back to specific campaign send row.

### 4.3 Script Tag Presence on Industry LP Pages

`utm-capture.js` is present in **all industry landing pages** checked — confirmed via grep across the `industries/` directory. Script is loaded from absolute URL `https://netwebmedia.com/js/utm-capture.js` with `defer` attribute (correct — fires after DOM parse).

**Issue:** The script is NOT present in `index.html` (homepage). This is by design since the homepage is not an email campaign destination, but worth documenting. Verify that ALL pages used as `u=` destinations in campaign emails have the script tag.

---

## 5. KNOWN ISSUES & RECOMMENDATIONS

### Critical / High Priority
None identified. All systems are functioning.

### Medium Priority

1. **No async queue for crm-vanilla bulk sends.** Large campaigns (1,000+ contacts) will time out PHP execution. Recommend enabling the tick/cron architecture (already built in api-php) or adding a PHP time limit override + background process trigger.

2. **api-php unsubscribe footer is static text.** The api-php campaign system tells recipients to "reply with 'baja'" instead of providing a one-click link. This may not satisfy CAN-SPAM/CASL. Should be upgraded to use the same `?r=track&a=unsub&t=TOKEN` link as crm-vanilla.

3. **Meta WhatsApp Cloud API path awaiting secrets.** `whatsapp_meta_app_secret`, `whatsapp_meta_token`, and `whatsapp_phone_id` need to be added to GitHub Actions secrets to enable the Meta path. Current Twilio path is fully active.

4. **Carlos's DB seed password is a placeholder.** The `schema.sql` INSERT for the superadmin user uses a placeholder bcrypt hash. Must be reset to a real password post-deploy.

### Low Priority

5. **submit.php auto-reply lacks List-Unsubscribe header.** Transactional email so not required, but helps with Gmail spam classification.

6. **SMTP `verify_peer: false`.** The SMTP sender has SSL peer verification disabled (`verify_peer => false`). This is common on cPanel/InMotion with self-signed certs but technically allows MITM. Acceptable for a trusted internal mail server; document it.

7. **Chat widget detection.** The chat widget is not in homepage `<head>` — it is JS-injected via `main.js`. This is correct behavior but means: (a) web crawlers/WebFetch will not see it, and (b) if `main.js` fails to load, the widget disappears silently. Consider adding a `<noscript>` fallback or inline load for critical pages.

---

## 6. SYSTEMS NOT FOUND / OUT OF SCOPE

- No third-party chat widget (Intercom, Drift, Crisp, Tidio, LiveChat, HubSpot, Freshchat) is installed on any NWM page. Zero matches across all HTML files.
- No ChatGPT integration as internal tool (correct per NWM policy — Claude Pro Max is used).
- HubSpot handler (`crm-vanilla/api/handlers/hubspot.php`) exists for legacy data import only, not for internal CRM operations.

---

*Report generated by Claude QA Agent | 2026-04-28 | NetWebMedia internal use*

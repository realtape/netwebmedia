# Pre-Launch Technical Audit — Monday May 4, 2026

**Audit date:** 2026-05-01 (T-3 days)
**Auditor:** Engineering Lead / CTO
**Scope:** Production readiness across CRM, payments, chat, WhatsApp, ops standards
**Verdict:** 🟡 **CONDITIONAL GO** — chat / CRM / WhatsApp public-only paths are launch-ready; payment processing has 2 hard blockers that must land before paid signups go live.

---

## 1. CRM (`crm-vanilla/`) — 🟢 Ready

| Check | Status | Evidence |
|---|---|---|
| Auth (X-Auth-Token, hash_equals) | 🟢 | `crm-vanilla/api/index.php` enforces same-origin Origin/Referer + SameSite=Strict cookies + hash_equals on token |
| Multi-tenant isolation via `tenancy_where()` | 🟢 | 16 handlers use `tenancy_where()` / `tenant_owns()` / `require_org_access_for_write()`; no raw cross-tenant SELECTs found |
| Migration system (idempotent, no version table) | 🟢 | 28 `schema_*.sql` files; auto-run via `?r=migrate` after every deploy. Last 5 added: `schema_contacts_tags`, `schema_workflow_runs`, `schema_workflows_to_resources`, `schema_reports`, `schema_workflows` — all flushed |
| CRM workflow engine cron firing | 🟢 | `.github/workflows/cron-workflows.yml` runs `*/5 * * * *`; latest 5 runs all `success` (last: 2026-05-01 21:07Z, HTTP 200, `{"ran":0}`) |
| XSS hygiene (`CRM_APP.esc()` discipline) | 🟢 | 268 occurrences across 36 modules; the CSP header is live (not Report-Only) so accidental inline `<script>` injection cannot execute |
| Sentry coverage (front) | 🟢 | DSN wired sitewide via `js/nwm-sentry.js`; org `netwebmedia`, project javascript, `tracesSampleRate=0.1` in prod |

**Caveats:**
- Auto-save daemon committed mid-audit (deploy run 25233877017 in progress). Verify `git log --oneline -5` before tagging the launch SHA.
- 1 open Dependabot PR (#2 — `actions/setup-node` 4→6). Non-blocking; can land post-launch.

**Action items:** none for launch.

---

## 2. Payment processing (`api-php/routes/billing.php`) — 🔴 BLOCKING

| Check | Status | Evidence |
|---|---|---|
| `MP_ACCESS_TOKEN` in GitHub Secrets | 🔴 | **NOT PRESENT** in `gh secret list` (22 secrets, none match `MP_*`) |
| `MP_PUBLIC_KEY` in GitHub Secrets | 🔴 | **NOT PRESENT** |
| `MP_WEBHOOK_SECRET` in GitHub Secrets | 🔴 | **NOT PRESENT** |
| Webhook signature verification enforced | 🔴 | `bl_mp_webhook_secret()` is defined (`billing.php:510`) but **never called**. The webhook handler at `billing.php:812` blindly trusts `php://input` — anyone with the URL can POST a forged `preapproval` event and flip a user to `status=active, role=admin` (see `billing.php:836-843`) |
| `bl_meta_capi_fire()` graceful no-op when unconfigured | 🟢 | Verified `billing.php:418-437` — when `meta_capi_pixel_id` or `meta_capi_token` empty, logs an audit row with `status='skipped'` and returns false. Safe. |
| Subscription state machine (pending → authorized → cancelled) | 🟢 | `billing.php:828-865` correctly maps MP statuses; handles `paused` and back-fills `current_period_start` |
| Refund / chargeback path | 🔴 | **No handler.** No `refund` topic, no `chargeback` topic, no `payment.refunded` branch. The `payment` topic only handles `status='approved'` — refunds will silently log but not adjust subscription state |
| FX (USD display, CLP charge) | 🟢 | `bl_fx_rate()` defaults `950` USD/CLP; `bl_round_clp()` rounds to nearest 1000 CLP. Live `/api/billing/plans` returns `fx_rate:950, currency_charge:CLP`. **Caveat:** rate is hardcoded — no live FX feed |
| MP SDK version | 🟢 | Hand-rolled curl against `api.mercadopago.com/preapproval` and `/v1/payments` — no SDK, no deprecation surface. Endpoints used are stable v1 |

**Action items (blocking — must land before paid-launch):**
1. Add `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` to GitHub Secrets and redeploy. Without these, every `POST /api/billing/checkout` will `err('MP access token not configured', 500)` (`billing.php:517`).
2. Enforce webhook signature in `billing.php:812-820`. MP sends `x-signature` and `x-request-id` — verify HMAC-SHA256 of `id:<dataId>;request-id:<rid>;ts:<ts>;` with the webhook secret before doing any DB writes. Pattern: copy the `wa_handle_meta()` shape from `api-php/routes/whatsapp.php:161-184` (fail-closed when secret unset).
3. **Soft block (post-launch acceptable):** add a `status='refunded'` branch in the `payment` topic; flip subscription to `cancelled` and log a `billing_events` row.

---

## 3. Chatbot (`/api/public/chat`) — 🟢 Ready

| Check | Status | Evidence |
|---|---|---|
| Widget loaded sitewide | 🟢 | `<script src="/assets/nwm-site-chat.js" defer>` confirmed in `index.html` |
| Backend handler | 🟢 | `api-php/routes/public-chat.php` (POST `/api/public/chat`) |
| LLM provider = Claude | 🟢 | Calls `ai_call_claude()` from `api-php/routes/ai.php` with `nwm_unified_kb()` system prompt; no OpenAI fallback. Live response confirmed (200 OK, `mock:false`, replied in Spanish-aware bilingual mode) |
| Rate limiting | 🟢 | 20 messages/24h/IP via `pchat_rate_limited()` (`public-chat.php:40-48`) — DB-backed count over `public_chat_log`. Note: this is laxer than the IP-hash flock pattern in CRM, but adequate for prospect chat |
| Conversation logging | 🟢 | Every turn → `public_chat_log` (session_id, ip, language, role, content, page, referrer, user_agent). Session leakage prevented by `(session_id AND ip)` history filter (`public-chat.php:54`) |
| Where do messages land for Carlos | 🟡 | **Logs to `public_chat_log` only — no notification path.** Carlos must manually query the table or build a CRM page. If a hot prospect chats and asks for a callback, Carlos won't know unless he checks the log. **Recommendation post-launch:** add a workflow trigger (`public_chat_intent`) that fires when message contains "buy", "pricing", "demo", "contact" → `notify_team` step → email to Carlos |

**Action items:** none blocking. Add intent-based notification post-launch (1-day task).

---

## 4. WhatsApp — 🟡 Caveats (acceptable for launch)

| Check | Status | Evidence |
|---|---|---|
| `WA_VERIFY_TOKEN` in GitHub Secrets | 🟢 | Present (rotated 2026-04-21) |
| `WA_META_TOKEN`, `WA_PHONE_ID`, `WA_META_APP_SECRET` in GitHub Secrets | 🔴 | **NOT PRESENT.** Meta WABA path is fail-closed by design (`whatsapp.php:168-174` returns 403 if `whatsapp_meta_app_secret` unset) |
| Inbound webhook (`/api/whatsapp/webhook`) | 🟢 (Twilio path) / 🟡 (Meta path) | Twilio path verifies HMAC-SHA1 signature against `twilio_token` (`whatsapp.php:113-123`) — fail-closed. Meta path is wired but disabled until WABA verification clears (target June 2026 per CLAUDE.md) |
| Where do received WA messages land | 🟢 | `whatsapp_sessions` table (DEFAULT CHARSET=utf8mb4); also fires `wf_trigger('whatsapp_inbound', ...)` so any workflow listening for that trigger reacts. **No CRM thread auto-creation yet** — messages exist as session rows but don't appear in `crm-vanilla/conversations.html` |
| `/whatsapp.html` opt-in capture | 🟢 | HTTP 200 confirmed live |
| Admin UI `crm-vanilla/whatsapp-subs.html` | 🟢 | HTTP 200 confirmed live; `wa_flush.php` handler validates 4 admin-write paths via `tenancy_where()` |
| Twilio sandbox (`wa.me/14155238886`) | 🟢 | Per CLAUDE.md, swept 2026-05-01 — all 28 public CTAs route through `/whatsapp.html` instead. No live `wa.me/` links to the sandbox in public HTML |

**Caveats — non-blocking but worth knowing:**
- Until WABA clears Meta verification, outbound messages from `wa_flush.php?action=send` return 503 with a setup message. Opt-ins continue to capture (`pending_double_opt_in`); they just can't receive welcome messages until June.
- Inbound WA → CRM conversation thread is missing. Document as known gap.

**Action items:** none blocking.

---

## 5. Standards / Launch Gates

| Check | Status | Evidence / Action |
|---|---|---|
| HTTPS everywhere | 🟢 | HSTS preload enforced; non-www canonical via `.htaccess` |
| CSP locked down (live, not Report-Only) | 🟢 | Active 2026-04-28 per CLAUDE.md |
| Sentry coverage — frontend | 🟢 | `js/nwm-sentry.js` sitewide, DSN active |
| Sentry coverage — backend (PHP) | 🟡 | `api-php/lib/sentry.php` and `sentry-vanilla.php` exist but **no DSN secret in `gh secret list`**. PHP errors land in cPanel `error_log` only. **Recommendation:** add `SENTRY_DSN_PHP` secret + wire into `config.local.php` post-launch |
| Database backups (`webmed6_crm`, `webmed6_nwm`) | 🟡 | InMotion cPanel runs nightly automatic backups (default policy). **Action: verify in cPanel → Backup Wizard → confirm both databases included + retention ≥ 7 days.** No off-site backup configured. Recommendation post-launch: weekly `mysqldump` to a non-cPanel destination |
| Rate limiting across public endpoints | 🟢 | File-based flock + GC under `crm-vanilla/storage/ratelimit/` (CRM) and `/api/data/ratelimit/` (api-php). Public chat has DB-counted limit |
| Pending PRs to land | 🟢 | 1 Dependabot PR open (`actions/setup-node` 4→6) — non-blocking |
| Pending migrations on disk | 🟢 | All 28 `schema_*.sql` files have been deployed and auto-run; cron has been firing successfully every 5 min for the past hour+ |

**Error budget for the next 7 days (proposed SLO):**
- **Public site availability:** 99.5% (allows ~50 min downtime over 7 days; InMotion's actual is typically 99.9%).
- **Public API (`/api/public/*`) error rate:** < 1% of requests return 5xx.
- **CRM API (`/crm-vanilla/api/*`) error rate:** < 0.5% of requests return 5xx.
- **Cron run success:** ≥ 95% of `*/5` runs return HTTP 200 (allows 1 failure per ~2 hours).
- **Burn-rate alerting:** none in place — Sentry will surface 5xx spikes manually. Recommendation: pin Sentry alert "5xx error rate > 5% over 10 min" before launch.

---

## Summary — 6 bullets

- **CRM is launch-ready.** Auth, multi-tenancy, XSS hygiene, migrations, and the every-5-min workflow cron are all green; latest cron run 2026-05-01 21:07Z returned `{"ok":true,"ran":0}`.
- **Payment processing has 2 hard blockers.** `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, and `MP_WEBHOOK_SECRET` are missing from GitHub Secrets — paid checkout will 500 on day one. **Fix before Monday.**
- **Webhook signature verification is not enforced** in `api-php/routes/billing.php:812`. `bl_mp_webhook_secret()` is defined and unused; a forged POST can promote any user to `role=admin, status=active`. **Fix before paid-launch.**
- **Public chat is live and using Claude** (verified end-to-end: 200 OK, `mock:false`, bilingual). Rate-limited 20/24h/IP. Gap: no notification to Carlos when prospects chat — they only land in `public_chat_log`. Add a workflow trigger post-launch.
- **WhatsApp is conservative-but-correct.** Twilio inbound path verifies HMAC; Meta path is fail-closed (rejects all POSTs while WABA is pre-verification). Opt-in capture and admin UI are reachable. Inbound messages land in `whatsapp_sessions` + fire `whatsapp_inbound` workflow trigger; no auto-creation of a CRM conversation thread yet.
- **Sentry frontend covers the public site; no PHP backend coverage.** PHP errors only reach cPanel `error_log`. Add `SENTRY_DSN_PHP` post-launch. Verify cPanel auto-backups include both `webmed6_crm` and `webmed6_nwm` before Monday.

---

## Critical action checklist before Monday May 4

1. **Add 3 GitHub Secrets** (Settings → Secrets and variables → Actions): `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`. Trigger a deploy to flush them into `api-php/config.local.php`.
2. **Patch webhook signature verification** in `C:\Users\Usuario\Desktop\NetWebMedia\api-php\routes\billing.php:812` — add HMAC-SHA256 check using `bl_mp_webhook_secret()` before the `INSERT INTO billing_events`. Pattern reference: `C:\Users\Usuario\Desktop\NetWebMedia\api-php\routes\whatsapp.php:161-184`.
3. **Verify cPanel backups** — log in → Backup Wizard → confirm `webmed6_crm` + `webmed6_nwm` are in the daily set with ≥ 7-day retention.
4. **(Optional, recommended)** Pin a Sentry alert: 5xx error rate > 5% over 10 min → email Carlos.
5. **(Optional, post-launch acceptable)** Land Dependabot PR #2 once smoke tests on Monday confirm green.

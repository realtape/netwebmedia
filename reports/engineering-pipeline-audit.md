# UTM Attribution Pipeline — Engineering Audit

**Author:** Engineering Lead, NetWebMedia
**Date:** 2026-04-28
**Scope:** end-to-end loop from CRM `track.php` redirect → `js/utm-capture.js` on landing → `submit.php` log + auto-reply.

---

## 1. Pipeline as built (verified)

| Stage | File | Behavior |
|---|---|---|
| 1. Click | `crm-vanilla/api/handlers/track.php:28-62` | Records click, looks up `campaign_sends.token`, builds `utm_source=email`, `utm_medium=cold-outreach`, `utm_campaign={slug}-{id}`, `utm_content={token}`, 302 to destination. |
| 2. Capture | `js/utm-capture.js` | Reads `utm_source/campaign/content` from `location.search`, mirrors to `sessionStorage` under `nwm_*`, populates `input[name="utm_*"]` on `DOMContentLoaded`. |
| 3. Submit | `submit.php:63-65, 88-90, 170-176` | Reads UTMs from POST, writes to `submit-leads.log`, includes them in notify email + ignores in auto-reply. |
| 4. Forms | e.g. `industries/hospitality/index.html:111-118, 193` | `<form action="https://netwebmedia.com/submit.php">` with hidden `utm_source/campaign/content` + `<script src=".../utm-capture.js" defer>`. |

Sanity check: `utm-capture|utm_content` matches **91 occurrences across 30 industry/landing pages** — wiring is consistent on `industries/**` pages.

---

## 2. What's working

- **Token-as-utm_content** is a clean unique-per-send identifier — closes the email→lead loop without an extra DB join on landing.
- **sessionStorage fallback** (`utm-capture.js:21-26`) survives same-tab soft navs (e.g. landing → /pricing → form).
- **Honeypot** (`submit.php:42-45`) returns 200 silently — bots can't tell they were filtered.
- **Origin allowlist** (`submit.php:48-51`) blocks cross-domain POST replays.
- **Log-on-fail safety** (`submit.php:170-176`) — `LOCK_EX` append happens after `@mail()`, so SMTP outage still preserves the lead.
- **Strict types + email validation** (`submit.php:17, 70-72`) — basic input hygiene is correct.
- **303 redirect** post-submit (`submit.php:185`) is the right verb (vs 302) for POST→GET handoff.

---

## 3. Gaps & bugs

### B1 — `utm_medium` and `utm_term` are dropped on the floor [HIGH]
`track.php:53-56` emits `utm_medium=cold-outreach`, but `utm-capture.js:14` only tracks `['utm_source','utm_campaign','utm_content']`. `submit.php:63-65` doesn't read it either. Result: every lead's medium is lost the moment they land. GA4 will still pick it up because GA4 reads URL params directly, but our **internal** attribution log says nothing about whether a lead came from cold-outreach vs paid vs organic-email.

**Fix:** add `utm_medium` and `utm_term` to `UTM_KEYS`, the hidden field set, and the submit handler.

### B2 — `utm_content` not URL-encoded into log; no escaping for log injection [MED]
`submit.php:170-176` interpolates `$utm_content` directly into the log line. `clean()` only strips tags + trims; a token with `|` or newline-like sequences (e.g. attacker submitting their own UTMs) can corrupt log parsing. `\r\n` is stripped only on `$msg`, not on UTM fields.

**Fix:** apply `str_replace(["\r","\n","|"], ' ', …)` to all logged fields, or switch to JSONL.

### B3 — Empty-string interpolation bug in attribution block [LOW, cosmetic]
`submit.php:90` — `{$utm_source ?: 'direct'}` inside a heredoc. PHP **does** evaluate the ternary inside `{}` since 7.4 with curly braces, but only because of the `?:` form on a simple var. Verified OK on PHP 8+, but it's brittle. If anyone ever switches to `<<<'BODY'` (nowdoc) it breaks silently.

**Fix:** compute `$attribution_source = $utm_source ?: 'direct';` above the heredoc.

### B4 — `utm-capture.js` runs synchronously but script tag is `defer` [LOW]
`industries/hospitality/index.html:193` loads with `defer`. `defer` scripts run **before** `DOMContentLoaded`, so `document.readyState === 'loading'` is technically possible but the listener path is rarely exercised. Not a bug, just dead branch ~95% of the time. Keep, it's defensive.

### B5 — No CSRF / no rate-limit on `submit.php` [MED]
Origin allowlist (line 48-51) trips only when `Referer` is sent. Browsers/extensions can suppress Referer (`Referrer-Policy: no-referrer`); when `$origin === ''` the check passes. Combine with no rate limit and you've got an unauthenticated email-spray vector — every submit triggers two `mail()` calls and a log write.

**Fix:** require Referer present **or** a per-form nonce; add IP-based rate limit (10/min/IP) via APCu or a flat-file bucket.

### B6 — `sessionStorage` only — first-touch attribution lost across sessions [MED]
If a recipient clicks the email Monday, bounces, then comes back Wednesday by typing the URL, the UTM is gone (sessionStorage clears on tab close). For a B2B sales cycle this matters.

**Fix:** mirror to `localStorage` with a 30-day TTL, **and** capture `first_utm_*` separately from `last_utm_*` (industry standard: track both).

### B7 — Auto-reply `mail()` uses `From: hello@`, but `submit.php:21` declares `noreply@` as `$NOTIFY_FROM` and the notify email at line 114 uses noreply [LOW]
Inconsistent envelope/header `From:` between notify and auto-reply paths. Auto-reply at line 161 sends from `hello@netwebmedia.com` — fine if SPF/DKIM cover both, but a single misconfigured DNS record breaks one pathway silently.

**Fix:** centralize sender addresses in config; verify SPF includes both selectors.

### B8 — Log file lives at `__DIR__ . '/submit-leads.log'` (line 22) — web-readable if Apache serves the directory [HIGH if true]
On InMotion cPanel with default Apache config, `/submit-leads.log` is **publicly fetchable** unless an explicit `<Files>` deny or `.htaccess` rule blocks it. This file contains every lead's email, phone, company, and UTM token. PII exposure risk.

**Fix:** move log out of webroot (e.g. `__DIR__ . '/../private/submit-leads.log'`) or add `.htaccess`:
```apache
<FilesMatch "\.log$">
  Require all denied
</FilesMatch>
```
**Verify immediately on prod:** `curl -I https://netwebmedia.com/submit-leads.log`.

### B9 — `track.php:35-37` on `clicked` overwrites `status` even if already `unsubscribed` [MED, attribution]
The UPDATE has no `WHERE status IN (...)` guard. A user who unsubscribed but then clicks an old email link gets flipped back to `clicked`. Counter at line 37 won't double-count (5-second guard) but state machine is wrong.

**Fix:** add `AND status NOT IN ('unsubscribed','bounced','complained')` to the click UPDATE.

### B10 — No CRM round-trip: lead lands in flat log, never joins back to `campaign_sends.token` [HIGH for value]
The whole point of `utm_content=token` is to mark `campaign_sends` as `converted`. Today nothing reads the log and writes back to the DB. The attribution loop is **observable but not closed**.

**Fix:** in `submit.php`, when `$utm_content` is a 32-char token, do a CRM API call (or direct PDO via shared config) to `UPDATE campaign_sends SET status='converted', converted_at=NOW() WHERE token=?` and INSERT a row into a `leads` table.

### B11 — Root pages (index.html, audit-report.html etc.) lack UTM hidden fields [MED]
Verified: `index.html` has no `utm-capture.js` and no hidden UTM inputs. If anyone runs a campaign that lands at netwebmedia.com root with the audit form, attribution drops on the floor.

**Fix:** add `utm-capture.js` + hidden fields to every page that contains a `submit.php` form. Better: lint rule / build-step assertion.

---

## 4. Top 5 improvements (ranked by ROI / effort)

| # | Item | Effort | Why |
|---|---|---|---|
| 1 | **Close the loop: write back to `campaign_sends` on submit** (B10) | 2-3 hr | Turns attribution from a logfile into a CRM dashboard metric. Highest leverage. |
| 2 | **Move log outside webroot + verify** (B8) | 15 min | Pure security/PII fix, near-zero effort. Do today. |
| 3 | **Add `utm_medium`+`utm_term`, plus first-touch / last-touch in localStorage** (B1+B6) | 1-2 hr | Without medium we can't distinguish channels; without first-touch we lose multi-day B2B attribution. |
| 4 | **Rate-limit + nonce on `submit.php`** (B5) | 2 hr | Cheapest mitigation against an inevitable spam wave. APCu bucket + per-page-issued HMAC token. |
| 5 | **Lint/build assertion: every form posting to `/submit.php` includes UTM fields + `utm-capture.js`** (B11) | 1 hr | One-shot Python check in `build_landing_pages.py` — fails CI if a page is missing the wiring. Prevents silent attribution rot as we add pages. |

---

## 5. Suggested rollout order

1. Day 0 (today): B8 (log out of webroot), B9 (status guard), B2 (log-injection sanitization). All ≤ 1 hr combined, all defensive.
2. Day 1: B1 + B6 (extend UTM fields + first-touch). One PR.
3. Day 2-3: B10 (CRM write-back). Needs schema check — does `campaign_sends` already have `converted_at`? If not, schema migration first. Reference: `crm-vanilla/api/schema.sql`.
4. Day 4: B5 (rate-limit + nonce). Separate PR — security-only, easier to review.
5. Day 5: B11 (build-time lint).

---

## Files referenced

- `C:\Users\Usuario\Desktop\NetWebMedia\js\utm-capture.js`
- `C:\Users\Usuario\Desktop\NetWebMedia\submit.php`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\api\handlers\track.php`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\api\config.php` (defines `getInput`, `jsonError`)
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\api\index.php` (defines `$method` global used by track.php:66)
- `C:\Users\Usuario\Desktop\NetWebMedia\industries\hospitality\index.html` (representative landing page — wiring verified)
- `C:\Users\Usuario\Desktop\NetWebMedia\index.html` (root — **missing** UTM wiring, see B11)
- `C:\Users\Usuario\Desktop\NetWebMedia\submit-leads.log` (does not yet exist on this dev machine — produced on prod by `submit.php:176`)

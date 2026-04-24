# Stack Additions Setup — Sentry + Resend + UptimeRobot + Cloudflare

Owner: Carlos. Target: flip switches, paste keys, done. All code glue is already shipped (2026-04-24).

Every step has a checkbox. Do them top-to-bottom.

---

## 0. Prerequisites (one-time)

- [ ] Confirm `.env` is gitignored (already is — line 18 of `.gitignore`).
- [ ] Copy `.env.example` to `.env` at repo root on the **server** (cPanel File Manager → netwebmedia.com → above `public_html`, or inside it but behind `.htaccess deny`).
- [ ] Verify `api-php/lib/env.php` is loaded by the app bootstrap (add `require_once __DIR__ . '/../lib/env.php';` near the top of `api-php/routes/*.php` entry points if not already).
- [ ] Make sure `.env` permissions are `600` on the server (`chmod 600 .env` via SSH if available).

---

## 1. Sentry (error monitoring — browser + PHP)

### Sign-up
- [ ] Go to https://sentry.io/signup/ — Team plan ($26/mo) or free Developer tier to start.
- [ ] Create organization `netwebmedia`.
- [ ] Create two projects:
  - **`nwm-web`** → platform: **Browser JavaScript**
  - **`nwm-api`** → platform: **PHP**
- [ ] Copy each project's DSN (Settings → Projects → [name] → Client Keys (DSN)).

### Wire the browser DSN
- [ ] Open `index.html`. Find the line `window.NWM_SENTRY_DSN = '';` (near the top, just above the GA4 snippet).
- [ ] Paste the `nwm-web` DSN between the quotes. Example:
  ```html
  <script>window.NWM_SENTRY_DSN = 'https://abc123@o456789.ingest.sentry.io/111222'; window.NWM_RELEASE = 'nwm@1.0.0';</script>
  ```
- [ ] Commit + deploy. Verify in browser devtools: `window.Sentry` should exist within ~1s of load.
- [ ] Trigger a test error: devtools console → `throw new Error('sentry-smoke')`. Confirm it shows in Sentry → Issues within 30s.
- [ ] (Later) Add the same two-line block to the other top-level pages (`pricing.html`, `contact.html`, `blog.html`, etc.). Can be automated with a small sed script; not urgent — the critical conversion pages are enough to start.

### Wire the PHP DSN
- [ ] On the server, in `.env`, paste: `SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXX` (the **nwm-api** project DSN).
- [ ] Install the PHP SDK via Composer (one-time, on the server — SSH into cPanel):
  ```bash
  cd ~/public_html/api-php
  composer require sentry/sentry
  ```
  (If Composer isn't installed: `curl -sS https://getcomposer.org/installer | php && php composer.phar require sentry/sentry`.)
- [ ] Add `require_once __DIR__ . '/../lib/env.php'; require_once __DIR__ . '/../lib/sentry.php';` to `api-php/routes/` entry-point files that don't already load it (start with `submit.php`, `ai.php`, `whatsapp.php`).
- [ ] Smoke-test: `curl https://netwebmedia.com/api-php/routes/health.php` → verify 200. Then temporarily throw an exception in a test route and confirm Sentry captures it.
- [ ] Set `SENTRY_ENV=production` in `.env` on the live server, `SENTRY_ENV=staging` on any staging subdomain.

### Alerts
- [ ] Sentry → Alerts → Create alert → "New issue" → notify Slack channel `#nwm-alerts` (wire Slack integration first under Settings → Integrations → Slack).

---

## 2. Resend (transactional email)

### Sign-up
- [ ] Go to https://resend.com/signup — free tier = 3,000 emails/mo, 100/day; upgrade to $20/mo Pro for 50k/mo when volume warrants.
- [ ] Create workspace `NetWebMedia`.

### Domain verification
- [ ] Resend dashboard → Domains → Add Domain → `netwebmedia.com`.
- [ ] Resend will show DNS records. Log into **InMotion cPanel → Zone Editor → netwebmedia.com** and add:
  - [ ] **SPF (TXT, name `@`)**: `v=spf1 include:_spf.resend.com include:resend.com ~all` (merge with existing SPF if present — ONE SPF record only, combine includes).
  - [ ] **DKIM (TXT or CNAME as Resend specifies, name `resend._domainkey`)**: paste the value Resend provides.
  - [ ] **DMARC (TXT, name `_dmarc`)**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@netwebmedia.com; adkim=s; aspf=s` (start with `p=none` for first week, then tighten to `quarantine`).
- [ ] Wait for DNS propagation (~5–30 min). Resend will show "Verified" green check.
- [ ] Add a verified sender identity: `admin@netwebmedia.com`.

### Wire the key
- [ ] Resend → API Keys → Create API Key → name `server-prod`, permission `Sending access`, domain restriction `netwebmedia.com`.
- [ ] Copy the key (starts `re_...`). Paste into server `.env`:
  ```
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
  RESEND_FROM=admin@netwebmedia.com
  ```
- [ ] Smoke-test:
  ```bash
  php -r 'require "api-php/lib/env.php"; require "api-php/lib/mailer.php"; var_dump(send_mail("you@gmail.com","Resend smoke","<p>hello from NWM</p>"));'
  ```
  Expect `bool(true)` and an email in your inbox within 60s.
- [ ] Inspect Resend dashboard → Logs → confirm "delivered".

### Deliverability sanity
- [ ] Send to https://www.mail-tester.com/ and aim for 9/10 or better.
- [ ] Check Gmail: "Show original" — verify SPF=PASS, DKIM=PASS, DMARC=PASS.

---

## 3. UptimeRobot (external uptime monitoring)

### Sign-up
- [ ] Go to https://uptimerobot.com/signUp — free tier = 50 monitors @ 5-min interval (enough for now).

### Monitors to create
| # | Name | Type | URL | Interval | Keyword check |
|---|------|------|-----|----------|---------------|
| 1 | NWM homepage | HTTPS | `https://netwebmedia.com/` | 5 min | — |
| 2 | NWM pricing | HTTPS | `https://netwebmedia.com/pricing.html` | 5 min | — |
| 3 | NWM contact | HTTPS | `https://netwebmedia.com/contact.html` | 5 min | — |
| 4 | NWM API health | Keyword | `https://netwebmedia.com/api-php/routes/health.php` | 5 min | keyword = `"ok":true` exists |
| 5 | CRM | HTTPS | `https://app.netwebmedia.com/crm/` | 5 min | — |

- [ ] Create each monitor.
- [ ] Settings → Alert Contacts → add Slack webhook (see step 5 below).
- [ ] Attach alert contact to all five monitors.

---

## 4. Cloudflare (DNS, CDN, WAF, Turnstile)

### Sign-up + onboarding
- [ ] https://dash.cloudflare.com/sign-up → Free plan.
- [ ] Add site `netwebmedia.com` → Free plan → Cloudflare scans existing DNS. Review records carefully — ensure **all MX / SPF / DKIM / DMARC records carried over** (critical for Resend).
- [ ] Cloudflare gives you two nameservers (e.g. `nina.ns.cloudflare.com` / `bob.ns.cloudflare.com`).

### Nameserver swap at InMotion
- [ ] AMP (https://amp.inmotionhosting.com) → Domains → netwebmedia.com → Nameservers → "Use custom nameservers" → paste Cloudflare NS.
- [ ] Save. Propagation: 15 min – 24 h.
- [ ] Cloudflare dashboard will confirm "Great news! Your site is now protected" once NS resolves.

### Cloudflare settings (after activation)
- [ ] **SSL/TLS → Overview** → set to **Full (strict)** (InMotion has a valid cert). Never use Flexible — it'll break form posts.
- [ ] **SSL/TLS → Edge Certificates** → enable Always Use HTTPS, enable HSTS (max-age 6 months, include subdomains, preload OFF until you're sure).
- [ ] **Speed → Optimization** → Brotli ON; Auto Minify: HTML + CSS + JS ON; Rocket Loader OFF (breaks GA4 + fbq).
- [ ] **Caching → Configuration** → Browser Cache TTL 4h; Crawler Hints ON.

### Page Rules (free plan = 3 rules — use them wisely)
- [ ] Rule 1: `netwebmedia.com/api-php/*` → Cache Level: **Bypass**, Disable Performance. (API must never cache.)
- [ ] Rule 2: `netwebmedia.com/*.html` → Cache Level: **Standard**, Edge Cache TTL: 2 hours.
- [ ] Rule 3: `netwebmedia.com/assets/*` → Cache Level: **Cache Everything**, Edge Cache TTL: 1 month, Browser Cache TTL: 1 month. (Static images/css/js — huge win.)

### WAF (Security)
- [ ] **Security → WAF → Managed Rules** → deploy the free "Cloudflare Managed Ruleset" in default mode.
- [ ] **Security → Bots** → Bot Fight Mode ON (free).
- [ ] **Security → Settings** → Security Level: Medium. Challenge Passage: 30 min.
- [ ] **Custom rule**: block POST requests to `/api-php/*` with empty User-Agent or User-Agent matching `curl|wget|python-requests` unless `X-NWM-Admin` header present. (Reduces API abuse.)

### Turnstile (CAPTCHA for submit.php)
- [ ] Cloudflare dashboard → Turnstile → Add Site → `netwebmedia.com` → widget mode: **Managed**.
- [ ] Copy site key + secret key.
- [ ] Add to `.env`:
  ```
  TURNSTILE_SITE_KEY=0x4AAAAAAAxxx
  TURNSTILE_SECRET_KEY=0x4AAAAAAAyyy
  ```
- [ ] In `contact.html` (and any form that hits `submit.php`) add before the submit button:
  ```html
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
  ```
- [ ] In `api-php/routes/` submission handler (or wherever `submit.php` lives), verify the token server-side:
  ```php
  $token = $_POST['cf-turnstile-response'] ?? '';
  $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_POSTFIELDS=>['secret'=>getenv('TURNSTILE_SECRET_KEY'),'response'=>$token,'remoteip'=>$_SERVER['REMOTE_ADDR']]]);
  $result = json_decode(curl_exec($ch), true);
  if (empty($result['success'])) { http_response_code(403); exit('captcha failed'); }
  ```

### `.htaccess` changes required (Cloudflare-aware)
Do these AFTER Cloudflare is active, so client IPs resolve correctly:
- [ ] Add near the top of root `.htaccess`:
  ```apache
  # NWM: added by stack-additions 2026-04-24
  # Trust Cloudflare's CF-Connecting-IP as the real client IP
  SetEnvIf CF-Connecting-IP "^(.+)$" REMOTE_ADDR=$1
  # Block direct origin access (optional, hardens origin after CF is stable)
  # Require expr "%{HTTP:CF-Connecting-IP} != ''"
  ```

---

## 5. Slack webhook (shared sink for UptimeRobot + GitHub Actions + Sentry)

- [ ] Slack → your workspace → Apps → search "Incoming Webhooks" → Add to Slack.
- [ ] Choose channel `#nwm-alerts` → Save → copy the webhook URL.
- [ ] Add to server `.env`: `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`
- [ ] Add to **GitHub repo secrets** (Settings → Secrets and variables → Actions → New repository secret): name `SLACK_WEBHOOK_URL`, value = same URL. This is what `.github/workflows/uptime-smoke.yml` reads.
- [ ] Paste the same URL into UptimeRobot → Alert Contacts → New → type Slack.
- [ ] Paste into Sentry → Settings → Integrations → Slack (OAuth app, or incoming webhook as fallback).

---

## 6. Env secret rotation checklist

After moving keys out of `CREDENTIALS.md` and into `.env`, rotate each one:

- [ ] `ANTHROPIC_API_KEY` — console.anthropic.com → Settings → API Keys → regenerate → paste new into `.env` → delete old from CREDENTIALS.md.
- [ ] `META_APP_SECRET` — developers.facebook.com → App → Settings → Basic → Reset secret.
- [ ] `WHATSAPP_TOKEN` — business.facebook.com → System Users → regenerate permanent token.
- [ ] `HEYGEN_API_KEY` — app.heygen.com → API → Regenerate.
- [ ] `VAPI_API_KEY` — dashboard.vapi.ai → API Keys → Regenerate.
- [ ] `RESEND_API_KEY` — already created fresh in step 2 above; nothing to rotate.
- [ ] `SENTRY_DSN` — DSN is not a secret (it's a public token for client-side SDKs); safe in repo but we keep in `.env` for consistency.
- [ ] Once all keys above are live in `.env` and verified working, **delete the corresponding lines from `CREDENTIALS.md`** and commit that deletion.

---

## 7. Verification dashboard

Run this checklist weekly until green three weeks in a row:

- [ ] Sentry → Issues: zero unresolved critical issues older than 24h.
- [ ] Resend → Logs: bounce rate <2%, complaint rate <0.1%.
- [ ] UptimeRobot: all monitors 99.9%+ last 30 days.
- [ ] Cloudflare → Analytics: requests served from cache >60% for `/assets/*`.
- [ ] GitHub Actions → `uptime-smoke`: no failed runs in last 24h.
- [ ] Dependabot: no open PRs older than 7 days (merge or explicitly close).

---

## Appendix: files shipped by this task (2026-04-24)

- `js/nwm-sentry.js` — browser Sentry bootstrap
- `api-php/lib/sentry.php` — PHP Sentry bootstrap
- `api-php/lib/mailer.php` — Resend-backed mailer (replaces `mail()`)
- `api-php/lib/env.php` — .env loader
- `api-php/routes/health.php` — UptimeRobot target
- `.env.example` — template for `.env`
- `.github/dependabot.yml` — weekly PR updates
- `.github/workflows/uptime-smoke.yml` — 15-min uptime probe
- `index.html` — one-line Sentry tag added; nothing else touched

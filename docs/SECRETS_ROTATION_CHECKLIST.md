# Secrets Rotation Checklist

**Generated:** 2026-04-24
**Owner:** Carlos
**Trigger:** Task #5 from the 2026-04-24 audit — move all credentials out of the repo and out of a flat file, rotate any that have ever been committed, and land them in `.env` (gitignored) + GitHub Actions Secrets (for CI).

`CREDENTIALS.md` is already gitignored (`.gitignore` line 9), so these values are not in remote git history. But the file has lived on multiple dev machines and been passed around informally, so every value below should be assumed **known** and rotated as if it had leaked.

## Procedure (do in this order)

1. Populate `.env` at the repo root from `.env.example`. `.env` is already gitignored.
2. Push matching secrets to **GitHub Actions Secrets** for each workflow that needs them (Settings → Secrets and variables → Actions).
3. Rotate each credential in its source system.
4. Update `.env` locally with the new value.
5. Push new value to Actions Secrets.
6. Delete the stale line from `CREDENTIALS.md`. When every row below is checked and removed, delete `CREDENTIALS.md` entirely.

## Credentials to rotate

### Infrastructure
- [ ] **cPanel (InMotion, secure345.servconfig.com:2083)** — rotate password. This is the deploy target; after rotation, update the `FTP_PASSWORD` secret in GitHub Actions (used by `.github/workflows/deploy-*.yml`).
- [ ] **MySQL DB (`webmed6_crm`)** — rotate password via cPanel → MySQL Databases. Update `DB_PASSWORD` in `.env` and any PHP config that reads from it. Run a connectivity check against `api-php/routes/health.php` after.
- [ ] **CRM admin login (carlos@netwebmedia.com / NWM2026!)** — rotate password inside the CRM app at `/app/`. Consider enabling 2FA if supported.

### Third-party APIs
- [ ] **Anthropic (`ANTHROPIC_API_KEY`)** — rotate at console.anthropic.com → API Keys. Paste new value into `.env`. Used by `api-php/routes/ai.php`, `audit.php`, `cmo.php`, `nwmai.php`, `public-chat.php`.
- [ ] **HeyGen (`HEYGEN_API_KEY`)** — rotate at app.heygen.com → Account → API. Used by `api-php/lib/heygen.php`.
- [ ] **Vapi (`VAPI_API_KEY`)** — rotate at dashboard.vapi.ai → API Keys. Used by `api-php/lib/vapi.php`.
- [ ] **WhatsApp Business / Meta (`META_APP_SECRET`, `WHATSAPP_TOKEN`)** — regenerate app secret at developers.facebook.com → App → Settings → Basic; regenerate WhatsApp permanent token. Current fail-closed path (recent commit 73d1ede6) blocks requests when these are unset — verify it still behaves correctly after rotation.
- [ ] **HubSpot** — per the `feedback_use_own_crm.md` memory, NWM uses its own CRM, not HubSpot. **Decision needed:** either (a) cancel the HubSpot account and delete all references, or (b) keep it and rotate the password + move the hub ID to `.env` as `HUBSPOT_HUB_ID`. Default recommendation: cancel.

### Analytics / tracking
- [ ] **Google Analytics 4 (`G-V71R6PD7C0`)** — this is a measurement ID, not a secret, but it currently appears hardcoded across many HTML files. Move to `.env` as `GA4_MEASUREMENT_ID` and template it in during the build so rotating the property later is trivial.
- [ ] **Meta Pixel ID (`META_PIXEL_ID`)** — currently `PASTE_PIXEL_ID_HERE` literal in `index.html:51`, `pricing.html:71`, +13 other files. This was flagged as a critical bug in the audit. Create the Pixel in Meta Business, put the real ID in `.env`, sweep the placeholder out of every file.

### Services being added (Task #4)
- [ ] **Sentry DSN (`SENTRY_DSN`)** — after signing up at sentry.io, paste DSN into `.env` and into `window.NWM_SENTRY_DSN` in `index.html` (empty string placeholder already in place).
- [ ] **Resend API key (`RESEND_API_KEY`, `RESEND_FROM`)** — after signup at resend.com, verify the `netwebmedia.com` domain (SPF/DKIM/DMARC records documented in `docs/STACK_ADDITIONS_SETUP.md`), paste key into `.env`. `mailer.php` will then stop failing closed.
- [ ] **UptimeRobot webhook (`SLACK_WEBHOOK_URL`)** — optional. If you want the `uptime-smoke.yml` workflow to notify on failure, paste Slack incoming-webhook URL as a GitHub Actions Secret.

### Non-secrets to clean up alongside
- [ ] Delete the `.vercel/` directory at the repo root — wrong host (InMotion is the canonical deploy target per memory). Already identified but `rm -rf` requires manual action: `rmdir /s /q .vercel` (cmd) or `Remove-Item -Recurse -Force .vercel` (PowerShell).
- [ ] Delete or archive `crm-upload.zip` and `netwebmedia-site-upload.zip` at the repo root — stale build artifacts.
- [ ] Review `site-upload/` and `_deploy/` for stale `.env.bak`, `_fix*.php`, or any file that might contain secrets in comments.

### After everything is rotated
- [ ] Delete `CREDENTIALS.md` from disk. The `.gitignore` entry can stay (belt and suspenders).
- [ ] Run `git log --all --full-history -- CREDENTIALS.md` to confirm it was never committed. If it ever was, follow up with `git filter-repo` to scrub history — but only after every value above has been rotated.
- [ ] Document the new flow in `README.md`: "Secrets live in `.env` (local) and GitHub Actions Secrets (CI). Template is `.env.example`. Never commit real values."

## Who has seen the current `CREDENTIALS.md`

Make a list here of every person, machine, or backup that may have a copy:

- [ ] Computer 1 (Windows, this machine) — file on disk
- [ ] Computer 2 (Carlos's other computer) — check and purge
- [ ] Any backup service (Dropbox / Google Drive / iCloud) — check and purge
- [ ] Any password manager export — rotate values that appear
- [ ] Anyone Carlos has shared the file with — assume compromised, rotate

Once every box above is checked, the rotation is complete.

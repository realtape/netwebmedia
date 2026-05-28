# Account Ownership Audit — 2026-05-28

**Goal:** Every account NWM uses should be owned by `carlos@netwebmedia.com`, not a personal address (gmail, hotmail, entrepoker@, etc.).

**Why this matters:** Personal-email-owned accounts are bus-factor risks (lose the address, lose the account), can't be transferred cleanly if you ever bring on partners, and look unprofessional in account-recovery emails.

---

## ✅ Fixed during this audit

- [x] **Git global identity** on Computer 1
      Was: `realtape` / `entrepoker@gmail.com`
      Now: `Carlos Martinez` / `carlos@netwebmedia.com`
      Note: All future commits + auto-save daemon snapshots will be attributed correctly. Old commits keep their historical author (don't rewrite history — too noisy).

---

## 🟢 Already correct (in-repo references)

- [x] GitHub CLI logged in as account `netwebmedia`
- [x] CI commits override to `bot@netwebmedia.com` (workflows: `add-daily-blog-queue`, `generate-blog-queue`, `generate-guide-pdfs`, `publish-blogs-scheduled`)
- [x] Resend `RESEND_FROM=admin@netwebmedia.com`
- [x] All `mailto:` and schema `email` fields in HTML use `@netwebmedia.com` addresses (hello@, careers@, support@, noreply@)
- [x] CRM seeded admins: `admin@netwebmedia.com`, `carlos@netwebmedia.com`

---

## 🟡 Manual dashboard verification needed

Log into each, check "Account owner" / "Primary email" / "Billing contact" → confirm it's `carlos@netwebmedia.com`. If not, change it (most platforms: Settings → Account → Update email, requires confirmation).

### Tier 1 — production-critical (do these first)

- [ ] **InMotion Hosting** — my.inmotionhosting.com → Account Information
      *Highest priority. If this email is wrong, password reset on the hosting account is locked behind a stranger's inbox.*
- [ ] **Domain registrar for netwebmedia.com** — check WHOIS first (`whois netwebmedia.com`) then log into the registrar. Loss-of-domain = loss-of-everything.
- [ ] **GitHub** — github.com/settings/emails. Should list `carlos@netwebmedia.com` as primary; gmail addresses removed or marked secondary.
- [ ] **Anthropic Console** — console.anthropic.com → Settings → Organization → Members. Confirm carlos@ is the owner.
- [ ] **Google account behind carlos@netwebmedia.com itself** — if this is Google Workspace, admin.google.com → Account. If it's a Gmail alias / forwarder, document where mail actually lands.

### Tier 2 — billing / customer-facing

- [ ] **Stripe** — dashboard.stripe.com → Settings → Team and Security → Members. Owner role = carlos@.
- [ ] **MercadoPago** — mercadopago.com → Tu cuenta → Datos personales. (LATAM billing per `MP_*` env vars.)
- [ ] **Resend** — resend.com → Settings → Team. Owner = carlos@. Sender domain `netwebmedia.com` verified.
- [ ] **Sentry** (org `netwebmedia`) — sentry.io → Settings → Members. Owner role.
- [ ] **Sonetel** (voice line +1 760-334-8731) — sonetel.com → Profile.
- [ ] **WhatsApp Business app** (line +1 442-385-4585) — owner phone is +1 442, but check linked email in the app's Profile.

### Tier 3 — integrations / dev tools

- [ ] **Meta / Facebook Business** — business.facebook.com → Business Settings → People. Carlos = Admin. Check Pages, IG accounts, Pixel, WABA assets are all in this Business.
- [ ] **TikTok Developer Portal** — developers.tiktok.com → app `@netwebmedia` owner.
- [ ] **HubSpot** (deferred backup CRM) — app.hubspot.com → Account & Billing → Account Owner.
- [ ] **Twilio** — console.twilio.com → Account → Edit profile.
- [ ] **HeyGen** — heygen.com → Account.
- [ ] **Vapi** — dashboard.vapi.ai → Settings.
- [ ] **Cloudflare** (if used for DNS or proxy) — dash.cloudflare.com → My Profile.

### Tier 4 — MCP-connected providers (lower stakes, but worth checking)

- [ ] **Apify** — console.apify.com
- [ ] **Linear** — linear.app → Settings → Account
- [ ] **Notion** — notion.so → Settings & Members → My account
- [ ] **Supabase** — supabase.com (possible future migration target)
- [ ] **Apollo** — app.apollo.io → Settings
- [ ] **Common Room** — app.commonroom.io → Settings
- [ ] **fal.ai** — fal.ai/dashboard
- [ ] **Firecrawl** — firecrawl.dev → Account
- [ ] **Higgsfield** — for the UGC video pipeline
- [ ] **OpenAI / Gemini** — if either is logged in (Gemini MCP is connected)

### Tier 5 — internal tooling

- [ ] **npm** (currently not logged in on this machine — fine, but if you publish, log in as carlos@)
- [ ] **Slack** (Salesforce-by-Slack MCP is connected) — workspace member email
- [ ] **Obsidian Sync** (if used) — obsidian.md → Account

---

## 🔁 Hygiene rules going forward

1. **New SaaS signup → carlos@netwebmedia.com from day 1.** Never "I'll move it later." You won't.
2. **2FA recovery codes** stored in 1Password (or your password manager) under each account, not in Gmail inbox.
3. **When you sunset a tool**, downgrade to free or delete the account — don't leave a stale paid plan billing the company card.
4. **For client-facing accounts NWM operates on behalf of a client** (GHL sub-accounts, client GA4, client Search Console), the owner should be the *client's* email with carlos@ as a secondary admin. Don't co-mingle.

# Account Ownership Audit — 2026-05-28

**Goal:** Every account NWM uses should be owned by `carlos@netwebmedia.com`, not a personal address (gmail, hotmail, entrepoker@, etc.).

**Why this matters:** Personal-email-owned accounts are bus-factor risks (lose the address, lose the account), can't be transferred cleanly if you ever bring on partners, and look unprofessional in account-recovery emails.

---

## Pass 1 — Automated audit results (2026-05-28)

### ✅ Verified correct

| Account | Primary email | Notes |
|---|---|---|
| Git config (Computer 1, global) | `carlos@netwebmedia.com` | **Fixed during this audit.** Was `entrepoker@gmail.com`. All future commits + auto-save daemon snapshots correctly attributed. |
| GitHub login `netwebmedia` | `carlos@netwebmedia.com` | **Primary** is correct and verified. |
| Google account (Workspace) | `carlos@netwebmedia.com` | Profile shows `carlos@netwebmedia.com` + alias `carlos.martinez@netwebmedia.com`. |
| Domain registrar | Tucows Domains Inc. (reseller InMotion) | Tucows is the registrar of record. Owner email lives in your InMotion AMP account — not exposed via WHOIS/RDAP for Tucows. |
| Nameservers | `NS.INMOTIONHOSTING.COM` + `NS2.INMOTIONHOSTING.COM` | DNS controlled by InMotion. Confirms InMotion AMP is the registrar-management dashboard. |

### ⚠️ Verified but with a cleanup recommended

| Account | Issue | Action |
|---|---|---|
| GitHub `netwebmedia` | `entrepoker@gmail.com` is still attached as a **secondary verified email**. Carlos can log into GitHub with the gmail address as a fallback identifier. | github.com/settings/emails → click the `×` next to `entrepoker@gmail.com` → remove. Won't affect commit attribution (handled by `Primary` email + the `users.noreply.github.com` alias). |

### 🟡 Couldn't verify automatically — login wall in NWM Chrome profile

These services were not signed in on the NWM Chrome browser. Carlos: log into each once, then re-run this audit and I can confirm the owner email.

- **InMotion AMP** (`secure1.inmotionhosting.com`) — most critical, owns hosting + domain registration
- **Anthropic Console** (`console.anthropic.com`) — Claude API billing
- **Resend** (`resend.com`)
- **Twilio** (`console.twilio.com`)
- **HubSpot** (`app.hubspot.com`) — deferred backup CRM, but token still in CI
- **HeyGen** (`app.heygen.com`)
- **Vapi** (`dashboard.vapi.ai`)
- **TikTok Developer Portal** (`developers.tiktok.com`)
- **Notion** (`notion.so`)
- **Apify Console** (`console.apify.com`)
- **Common Room** (`app.commonroom.io`)
- **fal.ai** (`fal.ai/dashboard`)
- **Firecrawl** (`firecrawl.dev/app`)

### 🟠 SPA loaded but email not extractable without active session

Page rendered but didn't expose the user email in the DOM probe (typically because the email is rendered in a profile dropdown that needs a click, or only loaded after a deeper auth check). Carlos: log in, click your profile avatar, confirm the email.

- **Sentry** (`sentry.io/settings/account/details/`) — redirect chain suggests authed but probe blocked
- **Linear** (`linear.app/settings/account`)
- **Supabase** (`supabase.com/dashboard/account/me`)
- **Higgsfield** (`higgsfield.ai/account`)
- **Cloudflare** (`dash.cloudflare.com/profile`) — title rendered but body empty during probe; likely auth-pending

### 🔴 Blocked by browser safety layer (can't probe these from Claude in Chrome at all)

The Chrome MCP's safety layer refuses to read these. Carlos must verify manually.

- **Stripe** (`dashboard.stripe.com`) — flagged as financial site
- **Facebook / Meta Business** (`business.facebook.com`, `facebook.com/settings`) — flagged as cookie/query-string-sensitive
- **MercadoPago** (`mercadopago.com`) — financial, same class as Stripe

### ❌ URL errors during probe

- **Sonetel** (`my.sonetel.com/profile`) — returned `chrome-error://`. Try `sonetel.com/login` instead.
- **Apollo** (`app.apollo.io/settings/profile`) — 404. Correct path is probably `/#/settings/account`.

---

## Manual checklist (the part I can't automate)

Log into each, check "Account owner" / "Primary email" / "Billing contact" → confirm it's `carlos@netwebmedia.com`. If not, change it.

### Tier 1 — production-critical (do these first)

- [ ] **InMotion Hosting** — my.inmotionhosting.com → Account Information
      *Highest priority. Owns hosting + domain registration (Tucows reseller). Bus-factor critical.*
- [ ] **GitHub** — Remove `entrepoker@gmail.com` as secondary email (only known leak).
- [ ] **Anthropic Console** — console.anthropic.com → Settings → Organization → Members. Confirm carlos@ is the owner.
- [x] **Google Workspace** — confirmed via probe.
- [x] **Git identity (this machine)** — fixed during audit.

### Tier 2 — billing / customer-facing

- [ ] **Stripe** — dashboard.stripe.com → Settings → Team and Security → Members. Owner role = carlos@.
- [ ] **MercadoPago** — mercadopago.com → Tu cuenta → Datos personales.
- [ ] **Resend** — resend.com → Settings → Team. Owner = carlos@. Sender domain `netwebmedia.com` verified.
- [ ] **Sentry** (org `netwebmedia`) — sentry.io → Settings → Members. Owner role.
- [ ] **Sonetel** (voice line +1 760-334-8731) — sonetel.com → Profile.
- [ ] **WhatsApp Business app** (line +1 442-385-4585) — owner phone is +1 442; check linked email in the app's Profile.

### Tier 3 — integrations / dev tools

- [ ] **Meta / Facebook Business** — business.facebook.com → Business Settings → People. Carlos = Admin. Check Pages, IG, Pixel, WABA assets all live in this Business.
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
- [ ] **Supabase** — supabase.com → Account
- [ ] **Apollo** — app.apollo.io → Settings
- [ ] **Common Room** — app.commonroom.io → Settings
- [ ] **fal.ai** — fal.ai/dashboard
- [ ] **Firecrawl** — firecrawl.dev → Account
- [ ] **Higgsfield** — higgsfield.ai/account
- [ ] **OpenAI / Gemini** — if either is logged in

### Tier 5 — internal tooling

- [ ] **npm** (currently not logged in on this machine — fine, but if you publish, log in as carlos@)
- [ ] **Slack** (Salesforce-by-Slack MCP is connected) — workspace member email
- [ ] **Obsidian Sync** (if used)

---

## Pass 2 instructions (when Carlos is ready)

To speed up Pass 2:

1. Open the **NWM Chrome browser** (`select_browser` → `NWM`).
2. Log into each Tier 1–2 service once (the sessions will persist in the NWM profile).
3. Tell Claude "rerun the account ownership audit" and Claude will re-probe and fill in the remaining rows.

Carlos won't need to do anything inside Claude — just log into each dashboard the normal way.

---

## 🔁 Hygiene rules going forward

1. **New SaaS signup → carlos@netwebmedia.com from day 1.** Never "I'll move it later." You won't.
2. **2FA recovery codes** stored in 1Password (or your password manager) under each account, not in Gmail inbox.
3. **When you sunset a tool**, downgrade to free or delete the account — don't leave a stale paid plan billing the company card.
4. **For client-facing accounts NWM operates on behalf of a client** (GHL sub-accounts, client GA4, client Search Console), the owner should be the *client's* email with carlos@ as a secondary admin. Don't co-mingle.

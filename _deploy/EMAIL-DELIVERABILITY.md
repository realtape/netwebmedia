# Email Deliverability — Primary-Inbox Setup

Last updated: 2026-04-24

Goal: mail from `newsletter@netwebmedia.com` lands in **Primary** inbox (Gmail) and **Focused** (Outlook), never spam.

---

## 1. What the code already does (no action needed)

- **Sender identity:** `NetWebMedia <newsletter@netwebmedia.com>` (real cPanel mailbox, DKIM-signed)
- **Reply-To:** `hola@netwebmedia.com`
- **Multipart MIME** (text/plain + text/html) — missing plain-text is a top-10 spam signal
- **Message-ID** + **Date** + **RFC 2047** subject/from encoding for non-ASCII
- **List-Unsubscribe** header (mailto + https) + **List-Unsubscribe-Post: One-Click** (RFC 8058 — required by Gmail bulk-sender rules since Feb 2024)
- **List-Id** + **Feedback-ID** (Gmail Postmaster reputation tracking)
- **Precedence: bulk** + **Auto-Submitted: auto-generated**
- **Visible unsubscribe link** rendered in every email body (not just header)
- **Throttle:** 8 s between sends within a call; caller paces inter-call
- **Idempotent send log** — no double-sends on retry
- **Header-injection guard** (strips CRLF from `From`/`Reply-To`)
- **Subject variation** across 4 templates to avoid Gmail clustering

## 2. DNS records you MUST add (Cloudflare or cPanel DNS)

These are the 3 records Gmail/Yahoo/Apple require for bulk senders. Without them, everything above still lands in spam.

### SPF (TXT record, host `@` or `netwebmedia.com`)

```
v=spf1 +a +mx include:_spf.hostinger.com include:secureserver.net ~all
```

Adjust `include:` to match your actual sending host — for InMotion cPanel it's typically:

```
v=spf1 +a +mx include:relay.mailchannels.net ~all
```

Check your cPanel → **Email Deliverability** page: it will tell you the exact SPF value it wants. Copy that verbatim.

### DKIM (TXT record, host `default._domainkey`)

cPanel already creates this automatically. Verify at:
**cPanel → Email Deliverability → netwebmedia.com → DKIM → "Install Suggested Record"**

It will show a `v=DKIM1; k=rsa; p=<long-key>` value. If it shows "✓ Valid" you're done.

### DMARC (TXT record, host `_dmarc`)

Start in monitor mode for 2 weeks, then tighten:

```
v=DMARC1; p=none; rua=mailto:postmaster@netwebmedia.com; ruf=mailto:postmaster@netwebmedia.com; fo=1; adkim=r; aspf=r; pct=100
```

After 2 weeks of clean reports, upgrade to:

```
v=DMARC1; p=quarantine; rua=mailto:postmaster@netwebmedia.com; pct=100; adkim=r; aspf=r
```

Final state (3 months in):

```
v=DMARC1; p=reject; rua=mailto:postmaster@netwebmedia.com; adkim=s; aspf=s
```

## 3. cPanel setting that MUST change

**Email routing for netwebmedia.com:** cPanel defaults to "Local Mail Exchanger" which breaks mail to `*@netwebmedia.com` from the same server (it gets trapped in the cPanel mailbox instead of reaching Google Workspace).

Fix: **cPanel → Email Routing → netwebmedia.com → Remote Mail Exchanger**

After this change, `carlos@netwebmedia.com` will receive test mails correctly (today they silently drop).

## 4. Google Postmaster Tools

Register the domain (free, ~5 min):
https://postmaster.google.com/ → add `netwebmedia.com` → verify via TXT record.

Gives you: spam-rate dashboard, IP reputation, domain reputation, feedback loop. Critical for catching deliverability regressions early.

## 5. Warm-up schedule (new sending domain)

Never send 100+ cold emails on day 1 from a cold domain — that's an instant spam-folder sentence for the life of the domain.

| Day | Volume/day | Who |
|---|---|---|
| 1-3 | 20 | Warm contacts only (people likely to open/reply) |
| 4-7 | 40 | Warm + low-risk prospects |
| 8-14 | 80 | Campaign ramp |
| 15+ | 150-200 | Full campaign |

The Chile CSV has ~320 leads. Don't blast them all in one day even after warm-up.

## 6. Content signals (already handled in template, but don't break)

- **Physical postal address** in footer (NetWebMedia SpA, Santiago, Chile) ✓
- **Visible unsubscribe link** in every mail ✓
- **Clear "why you're receiving this" statement** ✓
- **Privacy policy link** ✓
- Avoid: URL shorteners (bit.ly, t.co), all-caps subjects, `!!!`, `$$$`, attachments >1MB, image-only emails with no text.
- Link domains should match the sending domain (✓ — we link to netwebmedia.com subdomains, not external redirectors).

## 7. Monitoring

- **Gmail Postmaster:** spam rate must stay <0.1%, warning at 0.3%
- **Bounce rate:** keep <2% (clean list before send)
- **Complaint rate:** keep <0.1%
- **DMARC reports** arrive weekly at `postmaster@netwebmedia.com` — set up auto-parsing or just eyeball the XML monthly

If spam rate creeps up: pause campaign, re-warm domain, investigate specific recipients who marked as spam.

# DNS records to add — cPanel Zone Editor

**Domain:** `netwebmedia.com`
**Generated:** 2026-05-11
**Goal:** Verify the domain in AWS SES + custom MAIL FROM + improved SPF

## Where to add these

**cPanel → Zone Editor → `netwebmedia.com` → Manage**

---

## 1. DKIM CNAMEs — add all 3

| Type | Name (Host) | Value (Points to) | TTL |
|---|---|---|---|
| CNAME | `cxytzxhtvr2urf5z2dvixzkkc7xnmgta._domainkey` | `cxytzxhtvr2urf5z2dvixzkkc7xnmgta.dkim.amazonses.com` | 3600 |
| CNAME | `43lkypmla7fhywktxoummvhdbak26vgz._domainkey` | `43lkypmla7fhywktxoummvhdbak26vgz.dkim.amazonses.com` | 3600 |
| CNAME | `macsecchlszxssnln26ffse7yzcxl4uh._domainkey` | `macsecchlszxssnln26ffse7yzcxl4uh.dkim.amazonses.com` | 3600 |

> **Note:** cPanel may auto-append `.netwebmedia.com` to the Name field. If so, just paste the part BEFORE `.netwebmedia.com` (e.g. `cxytzxhtvr2urf5z2dvixzkkc7xnmgta._domainkey`).

---

## 2. Custom MAIL FROM — add 2 records for `mail.netwebmedia.com` subdomain

| Type | Name (Host) | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `mail` | `feedback-smtp.us-east-1.amazonses.com` | 10 | 3600 |
| TXT | `mail` | `v=spf1 include:amazonses.com ~all` | — | 3600 |

---

## 3. Update root SPF — REPLACE the existing record

Find the existing TXT record at the root (`netwebmedia.com` with no subdomain) that starts with `v=spf1`:

**Existing (DELETE this one):**
```
v=spf1 +a +mx include:relay.mailchannels.net include:_spf.google.com ~all
```

**Add this (NEW):**
```
v=spf1 +a +mx include:_spf.google.com include:amazonses.com ~all
```

Changes:
- ❌ Removed `relay.mailchannels.net` (you're not using MailChannels)
- ✅ Added `amazonses.com` (authorizes SES to send for the domain)
- ✅ Kept `_spf.google.com` (your MX still points to Google Workspace for inbound)

---

## After saving in cPanel

Reply with `dns added` and I'll:

1. Poll AWS SES until verification status flips to `SUCCESS` (typically 5–15 minutes)
2. Run a test send from `contact@netwebmedia.com` to verify SES works
3. Once production access is approved by AWS (~24h), flip `MAIL_PROVIDER` from `phpmail` to remove the override → `auto` chain will use SES first

---

## Verification commands I'll run

```bash
# Check DKIM token CNAME resolution
dig +short cxytzxhtvr2urf5z2dvixzkkc7xnmgta._domainkey.netwebmedia.com CNAME

# Check MAIL FROM MX
dig +short mail.netwebmedia.com MX

# Check SPF
dig +short netwebmedia.com TXT | grep spf1

# Check SES verification status via API
python3 -c "import boto3; print(boto3.client('sesv2', region_name='us-east-1').get_email_identity(EmailIdentity='netwebmedia.com')['DkimAttributes']['Status'])"
```

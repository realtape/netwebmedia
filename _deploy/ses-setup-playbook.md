# AWS SES Setup Playbook — NetWebMedia

**Goal:** Replace exhausted Resend + broken SMTP + unreliable phpmail with production-grade AWS SES.

**Status:** Infrastructure code is ready. AWS account setup requires Carlos's hands. ~25 min total.

**Cost:** SES sends are $0.10 per 1,000 emails. NetWebMedia volume = <$5/month vs Resend Pro $20/mo.

---

## Pre-existing state (captured 2026-05-11)

| Resource | Value |
|---|---|
| SPF | `v=spf1 +a +mx include:relay.mailchannels.net include:_spf.google.com ~all` |
| DMARC | `v=DMARC1;p=none;sp=none;adkim=r;aspf=r;pct=100;fo=0;rf=afrf;ri=86400` |
| MX | `smtp.google.com` (Google Workspace mailbox) |
| Existing DKIM | Resend's — appears unverified, may explain prior deliverability issues |
| Email infra | SES v4-signature impl already in `crm-vanilla/api/lib/email_sender.php` (line 325, `sesSend()`) |
| GitHub secrets ready | `AWS_SES_KEY`, `AWS_SES_SECRET`, `AWS_SES_REGION` (deploy yml lines 267–269, 348–350) |

---

## Step 1 — Create AWS IAM user [YOU, ~5 min]

1. Sign in to **https://console.aws.amazon.com/** (create account if needed — free tier is fine)
2. Top-right region selector → set to **US East (N. Virginia) us-east-1** (cheapest, mature SES)
3. Navigate to **IAM → Users → Create user**
4. Username: `nwm-ses-sender`
5. **Attach policies directly** → search and check **`AmazonSESFullAccess`**
6. Create user → click into the user → **Security credentials** tab → **Create access key**
7. Use case: **Application running outside AWS** → Next → Done
8. **COPY both values immediately** (the secret is shown only once):
   - Access key ID: `AKIA...`
   - Secret access key: `...`

> Paste them back to me in chat and I'll set the GitHub secrets in Step 5.

---

## Step 2 — Verify the `netwebmedia.com` domain in SES [YOU, ~5 min]

1. Console → **Amazon Simple Email Service** → confirm region is **us-east-1**
2. Left nav → **Configuration → Identities** → **Create identity**
3. Identity type: **Domain**
4. Domain: `netwebmedia.com`
5. ✅ Check **Use a custom MAIL FROM domain** → set to `mail.netwebmedia.com`
6. ✅ Check **Easy DKIM** → Identity type: **RSA_2048_BIT**
7. ✅ Check **Publish DNS records to Route 53** *(only if you use Route 53; if not, leave unchecked — we'll add manually)*
8. **Create identity** → AWS shows you 3 DKIM CNAME records + 1 MX record + 1 TXT record for MAIL FROM

> Screenshot or copy the 5 records AWS shows you, paste them back to me. I'll either add them to cPanel DNS automatically, or give you the exact commands to paste into the Zone Editor.

---

## Step 3 — Add DNS records to cPanel [YOU, ~5 min]

After SES gives you the records, log into **InMotion cPanel → Zone Editor → netwebmedia.com → Manage**.

You'll add:

**3× DKIM CNAMEs** (each looks like):
```
Name:  abc123...._domainkey.netwebmedia.com
Type:  CNAME
Value: abc123...dkim.amazonses.com
TTL:   3600
```

**1× MX for MAIL FROM** (priority 10):
```
Name:  mail.netwebmedia.com
Type:  MX
Priority: 10
Value: feedback-smtp.us-east-1.amazonses.com
TTL:   3600
```

**1× TXT for MAIL FROM SPF**:
```
Name:  mail.netwebmedia.com
Type:  TXT
Value: v=spf1 include:amazonses.com ~all
TTL:   3600
```

**Plus update the root SPF** (existing record) — replace it:
```
OLD: v=spf1 +a +mx include:relay.mailchannels.net include:_spf.google.com ~all
NEW: v=spf1 +a +mx include:_spf.google.com include:amazonses.com ~all
```
(Removed MailChannels since we're not using it; added amazonses.com.)

DNS propagation: typically 5–30 minutes for new records, longer for SPF replacement.

---

## Step 4 — Request production access (move out of SES sandbox) [YOU, ~24h AWS review]

By default, SES accounts can only send to **verified recipients**. We need to send to anyone.

1. SES Console → **Account dashboard** → **Request production access** (button top-right)
2. Mail type: **Transactional**
3. Website URL: `https://netwebmedia.com`
4. Use case description (paste this):
   > NetWebMedia is a marketing agency in Chile serving SMBs across LATAM and the US. We send three types of emails: (1) cold outreach follow-ups to prospects who downloaded our free website audit, all addresses opted-in to receive results; (2) transactional emails for our CRM platform customers (deal notifications, workflow triggers); (3) newsletter content sent only to subscribers who opted in via netwebmedia.com signup forms. We honor unsubscribes immediately via the unsubscribe link in every email and via reply-based opt-out. Expected initial volume: ~500/day, scaling to ~2,500/day in 3 months. All recipient lists are first-party — we do not purchase email lists.
5. Additional contacts: Add `contact@netwebmedia.com`
6. Preferred language: English

> AWS responds in 24h typically. **Until approved, you can only send to verified addresses** (we'll add carlos@netwebmedia.com as a verified single recipient for testing during the sandbox period).

---

## Step 5 — I take over [ME, ~3 min once you paste keys]

Once you give me the access key + secret, I will:

1. Set GitHub secrets:
   ```
   gh secret set AWS_SES_KEY    --repo netwebmedia/netwebmedia
   gh secret set AWS_SES_SECRET --repo netwebmedia/netwebmedia
   gh secret set AWS_SES_REGION --repo netwebmedia/netwebmedia  # 'us-east-1'
   ```
2. Remove the `MAIL_PROVIDER=phpmail` override so `auto` falls back to SES first:
   ```
   gh secret delete MAIL_PROVIDER --repo netwebmedia/netwebmedia
   ```
3. Trigger a redeploy
4. Test send to `carlos@netwebmedia.com` to verify SES connectivity
5. Once Step 4 (production access) is approved by AWS, send a real-world test to a Gmail to confirm inbox delivery

---

## Step 6 — Post-setup verification

Once everything is live, I'll run:

```bash
# Check SES sending stats
curl -s -b cookie.txt "https://netwebmedia.com/crm-vanilla/api/?r=campaigns&action=stats" \
  -H "Origin: https://netwebmedia.com" | python3 -m json.tool

# Send test through the campaign API — should return SES MessageID, not Exim ID
```

A successful SES send returns a Message-ID in format `<aws-message-id>@email.amazonses.com` (vs Exim's `<hex>@netwebmedia.com`). That's how we verify the provider switched correctly.

---

## What's already done (no action needed)

- ✅ `email_sender.php` has full SES v4-signature implementation (no SDK dependency)
- ✅ `deploy-site-root.yml` reads `AWS_SES_KEY` / `AWS_SES_SECRET` / `AWS_SES_REGION` from GitHub secrets
- ✅ `auto` provider chain prefers SES first (`['ses', 'resend', 'smtp']`)
- ✅ Both api-php and crm-vanilla mailers support SES (api-php/lib/mailer.php line 37+)

---

## Fallback plan if something goes wrong

If SES setup hits any snag, the current phpmail config will keep working. We're not removing it until SES is verified production-ready.

To revert to phpmail at any time:
```bash
echo "phpmail" | gh secret set MAIL_PROVIDER --repo netwebmedia/netwebmedia
# Trigger redeploy
```

---

## Quick reference — the 3 things I need from you

1. **AWS access key ID** (`AKIA...`)
2. **AWS secret access key** (the long secret shown once)
3. **The 5 DNS records SES shows you** (3 DKIM CNAMEs + 1 MX + 1 TXT)

Paste them back and I take it from there.

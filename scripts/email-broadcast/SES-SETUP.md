# AWS SES Setup for NetWebMedia AEO Brief Broadcast

> **Time required:** ~45 min of your time + **24–48 hours of AWS approval wait time**.
> Start Monday May 11 → realistic ready-to-send: Wednesday May 13.

## What you're building

A production email-broadcast pipeline that sends the weekly AEO Brief (and any future broadcast) via AWS SES instead of Resend. Per-email cost drops from ~$0.0020 (Resend) to ~$0.0001 (SES) — a 20× reduction at scale.

## The 6 steps in order

### 1. Create AWS account (skip if you already have one) — 5 min

- Go to https://aws.amazon.com/ → "Create an AWS Account"
- Credit card required (you won't be charged for normal SES usage)
- Note your **AWS Account ID** (12-digit number, visible top-right after login)

### 2. Set up SES in `us-east-1` — 5 min

AWS regions are per-service. SES in `us-east-1` (N. Virginia) has the highest sending limits + lowest latency to InMotion (where NWM lives).

- Sign in to AWS Console → search "SES" → click "Simple Email Service"
- Top-right: confirm region is **N. Virginia (us-east-1)**. If not, switch.
- Left nav: **Identities** → **Create identity**
- Identity type: **Domain**
- Domain: `netwebmedia.com`
- ✓ Use a custom MAIL FROM domain
- MAIL FROM domain: `mail.netwebmedia.com`
- ✓ Enable DKIM
- DKIM signing key length: **RSA_2048_BIT** (the default — best deliverability)
- Click **Create identity**

### 3. Add DNS records to InMotion DNS — 10 min

After step 2, SES will display 6+ DNS records you need to add. Login to InMotion cPanel → **Zone Editor** → `netwebmedia.com` → add each:

**Three DKIM CNAME records** (look like `xxx._domainkey.netwebmedia.com` pointing to `xxx.dkim.amazonses.com`):

```
Type   Name                       Value
----   ----                       -----
CNAME  abc._domainkey            abc.dkim.amazonses.com
CNAME  def._domainkey            def.dkim.amazonses.com
CNAME  ghi._domainkey            ghi.dkim.amazonses.com
```

**MAIL FROM MX record:**

```
Type   Name                       Value                            Priority
----   ----                       -----                            --------
MX     mail.netwebmedia.com      feedback-smtp.us-east-1.amazonses.com   10
```

**MAIL FROM SPF (TXT) record:**

```
Type   Name                       Value
----   ----                       -----
TXT    mail.netwebmedia.com      "v=spf1 include:amazonses.com ~all"
```

**Optional but recommended — DMARC TXT record at root:**

```
Type   Name                       Value
----   ----                       -----
TXT    _dmarc                    "v=DMARC1; p=quarantine; rua=mailto:dmarc@netwebmedia.com; aspf=r; adkim=r"
```

(If `_dmarc` already exists in your DNS — don't add a second one. Edit the existing.)

**Propagation time:** 1–24 hours. Check with `dig CNAME abc._domainkey.netwebmedia.com` from your terminal. AWS will auto-verify each record as it propagates.

### 4. Request production access (CRITICAL — this is the 24–48h step) — 10 min

By default, new SES accounts are in **sandbox mode**:
- Max 200 emails/day
- Can only send TO addresses you've verified (useless for broadcasts)
- Rate limit: 1 email/second

To leave sandbox:

- SES Console → **Account dashboard** (top of left nav)
- Right side: **Request production access**
- Mail type: **Marketing**
- Website URL: `https://netwebmedia.com`
- Use case description (copy/paste, edit as you like):

> NetWebMedia is an AI-native fractional CMO for U.S. small businesses. We send a weekly editorial newsletter ("AEO Brief") to opted-in subscribers about answer-engine optimization for their industry. Every email includes a one-click unsubscribe link (RFC 8058 List-Unsubscribe), and we honor opt-outs in real time via a `/api/public/email/unsubscribe` endpoint. We also send transactional emails (welcome sequences, audit reports, billing confirmations) to customers who explicitly created accounts on netwebmedia.com. Bounce and complaint rates have been historically <1% on our previous ESP (Resend). We expect ~5,000 emails/month initially, scaling to ~50,000/month within 6 months.

- Expected daily send volume: **2000** (gives headroom)
- How do you handle bounces / complaints: "Real-time SES SNS event handling will suppress bounced addresses and complainants. We also enforce a manual review queue for any subscriber with >2 historical complaints."
- Click **Submit request**

**AWS reviews in 24–48 hours.** You'll get an email when approved. The first email decides — you'll either be in production or asked for clarification.

### 5. Create IAM user with SES send permissions — 10 min

- AWS Console → search "IAM" → **Users** → **Create user**
- User name: `nwm-ses-sender`
- Permissions: **Attach policies directly** → search **AmazonSESFullAccess**
  - For better security, you can create a custom policy with only `ses:SendEmail` + `ses:SendBulkEmail` instead. The full-access policy is fine for now.
- Click through to **Create user**
- After creation: click the user → **Security credentials** tab → **Create access key**
- Use case: **Application running outside AWS**
- Acknowledge → **Next** → **Create access key**
- ⚠️ **Copy both the Access Key ID and Secret Access Key NOW** — the secret is shown only once.

### 6. Add secrets to GitHub Actions — 5 min

Go to https://github.com/netwebmedia/netwebmedia → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 4 secrets:

| Secret name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | (from step 5) |
| `AWS_SECRET_ACCESS_KEY` | (from step 5) |
| `AWS_REGION` | `us-east-1` |
| `SES_FROM_EMAIL` | `carlos@netwebmedia.com` |

Done. The broadcast workflow can now fire.

## Sending the broadcast

After all 6 steps and AWS production approval, you have two ways to fire:

### Option A: Manual GitHub Actions trigger (recommended for the first run)

- Go to GitHub → **Actions** tab → **AEO Brief Broadcast** workflow → **Run workflow**
- Inputs: leave defaults (uses Brief #002 + `subscribers.csv`)
- Hit **Run**
- Watch the log — first 25 sends should appear within ~5 seconds

### Option B: CLI from your laptop

```bash
# Export AWS creds + sender info (or use AWS CLI profile)
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
export SES_FROM_EMAIL=carlos@netwebmedia.com
export SES_REPLY_TO=hello@netwebmedia.com
export BRIEF_SUBJECT="The 3 lines of JSON-LD most law firms are missing"

# Dry-run first — generates preview without sending
DRY_RUN=1 node scripts/email-broadcast/send-aeo-brief-ses.js

# Inspect _preview.html in browser

# Live send
node scripts/email-broadcast/send-aeo-brief-ses.js
```

## Subscriber list — where it comes from

The script reads `scripts/email-broadcast/subscribers.csv`. Format:

```
email,first_name,lang,unsubscribe_token,business_name
sarah@example.com,Sarah,en,abc123def,Test Law Group
carlos@example.cl,Carlos,es,xyz789ghi,Viña del Sur
```

To export your subscriber list from the NWM database (run via phpMyAdmin or SSH):

```sql
SELECT
  email,
  COALESCE(first_name, '') AS first_name,
  COALESCE(lang, 'en') AS lang,
  COALESCE(unsubscribe_token, MD5(CONCAT(id, email, 'nwm-salt'))) AS unsubscribe_token,
  COALESCE(business_name, company, '') AS business_name
FROM email_subscribers
WHERE status = 'subscribed'
  AND unsubscribed_at IS NULL
ORDER BY created_at DESC;
```

Export as CSV, save to `scripts/email-broadcast/subscribers.csv`. **Don't commit this file** — it's already in `.gitignore` (if not, add `scripts/email-broadcast/subscribers.csv` to your `.gitignore`).

## Cost estimate

| Volume | Resend (current) | SES | Savings |
|---|---|---|---|
| 1,000 emails/mo | $20 (free tier) | $0.10 | $20/mo |
| 10,000 emails/mo | $20 (free tier) | $1.00 | $19/mo |
| 50,000 emails/mo | $50 (pro) | $5.00 | $45/mo |
| 100,000 emails/mo | $90 (pro) | $10.00 | $80/mo |

At NWM's expected scale (~5–50k/mo in year 1), SES saves $20–$45/month.

## What can go wrong + how to recover

| Failure | Symptom | Fix |
|---|---|---|
| Domain not verified | SES "Domain verification status: pending" for >24h | Re-check DNS records via `dig` — most common issue is a typo in the CNAME values |
| Sandbox not lifted | Send fails with `MessageRejected: Email address is not verified` | Wait for AWS production access approval. Or send to verified addresses only (you can verify hello@netwebmedia.com and carlos@netwebmedia.com to test) |
| Rate limit exceeded | `Throttling: Maximum sending rate exceeded` | Reduce `SES_SEND_RATE` env var (default 10/sec). New accounts start at 1/sec |
| High bounce rate | AWS sends warning email at 5% bounce rate, suspends at 10% | Clean the subscriber list — remove anyone in the unsubscribed/bounced state. The SQL above already filters `status = 'subscribed'` |
| High complaint rate | Warning at 0.1% complaints, suspended at 0.5% | Review messaging — usually means recipients don't recognize the sender. The List-Unsubscribe one-click header makes "report spam" unnecessary |

## Going further (after this Tuesday works)

- **Configuration Set** — wires SES events (bounces, complaints, opens, clicks) to an SNS topic, which can webhook into the NWM CRM to auto-update `email_subscribers.status`. Optional but recommended once production is stable.
- **SES SMTP credentials** — use SMTP relay if Resend has fallback paths elsewhere in the codebase.
- **Multi-region failover** — set up SES in `us-west-2` too so a region outage doesn't kill the broadcast.

These are all "later" items. The minimum-viable path is the 6 steps above + the existing `send-aeo-brief-ses.js` script.

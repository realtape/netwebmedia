# NWM Attribution Reporting Spec
**Version 1.0 — Data Analyst, NetWebMedia**  
**Date: 2026-04-28**

---

## Executive Summary

NetWebMedia has a **complete attribution chain** from email campaign → click tracking → landing page form submission → lead log. This spec documents:

1. **What data is captured today** and what gaps exist
2. **5 key weekly metrics** for Carlos to track business health
3. **Campaign ROI calculation formula** from data on hand
4. **Weekly dashboard template** ready to populate from logs

The current setup is solid. The missing piece is a weekly rollup script that joins lead logs with campaign tracking data to close the attribution loop.

---

## 1. Current Data Capture — The Attribution Chain

### 1.1 Email Campaign Layer

**Source:** `crm-vanilla/api/schema_email.sql` → `email_campaigns` + `campaign_sends` tables

| Field | Table | Type | Purpose | Example |
|-------|-------|------|---------|---------|
| `campaign_id` | `email_campaigns` | INT | Links sends to campaign | `47` |
| `name` | `email_campaigns` | VARCHAR(255) | Campaign label | `"AEO Authority Build — Feb 2026"` |
| `sent_count` | `email_campaigns` | INT | Total sends | `1,250` |
| `opened_count` | `email_campaigns` | INT | Unique opens (tracked) | `342` |
| `clicked_count` | `email_campaigns` | INT | Unique clicks (tracked) | `78` |
| `sent_at` | `email_campaigns` | DATETIME | When campaign went out | `2026-02-15 09:00:00` |
| `token` | `campaign_sends` | CHAR(32) | Unique per recipient | `a1b2c3d4e5f6...` |
| `email` | `campaign_sends` | VARCHAR(255) | Recipient address | `alice@acme.com` |
| `status` | `campaign_sends` | ENUM | Send state | `opened`, `clicked`, `sent` |
| `opened_at` | `campaign_sends` | TIMESTAMP | When recipient opened | `2026-02-15 14:23:00` |
| `clicked_at` | `campaign_sends` | TIMESTAMP | When recipient clicked | `2026-02-15 14:24:00` |

---

### 1.2 Click Tracking Layer

**Source:** `crm-vanilla/api/handlers/track.php` → Redirect with UTMs appended

When a recipient clicks an email link, the handler:

1. Records the click in `campaign_sends` (sets `status='clicked'`, `clicked_at=NOW()`)
2. Looks up the campaign name and ID
3. Appends these UTM params to the destination URL:

```
utm_source=email
utm_medium=cold-outreach
utm_campaign={campaign_slug}-{campaign_id}  // e.g., "aeo-authority-build-47"
utm_content={token}                          // e.g., "a1b2c3d4e5f6..." (unique per recipient)
```

**Example redirect:**  
```
GET /api/?r=track&a=click&t=a1b2c3d4e5f6&u=https://tourism.netwebmedia.com/services.html
  ↓ 302 redirect ↓
https://tourism.netwebmedia.com/services.html?
  utm_source=email
  &utm_medium=cold-outreach
  &utm_campaign=aeo-authority-build-47
  &utm_content=a1b2c3d4e5f6
```

The recipient arrives at a landing page with UTM params in the URL.

---

### 1.3 Form Submission Layer (Landing Page)

**Source:** `submit.php` → Reads hidden form fields populated by JavaScript

The landing page captures these fields from the submission form:

| Field | Type | Source | Required? | Purpose |
|-------|------|--------|-----------|---------|
| `name` | TEXT | Form input | YES | Lead name |
| `email` | TEXT | Form input | YES | Lead email (key identifier) |
| `company` | TEXT | Form input | YES | Company name |
| `phone` | TEXT | Form input | NO | Phone (optional for email-sourced leads) |
| `website` | TEXT | Form input | NO | Lead's website |
| `message` | TEXT | Form input | NO | Lead's inquiry text |
| `source` | TEXT | Form hidden field | YES | Industry slug (e.g., `"tourism-lp"`) |
| `utm_source` | TEXT | Form hidden field | NO | Email, direct, paid, etc. |
| `utm_campaign` | TEXT | Form hidden field | NO | Campaign name |
| `utm_content` | TEXT | Form hidden field | NO | **Campaign token** — the JOIN key |

The form also captures metadata:

| Field | Source | Purpose |
|-------|--------|---------|
| Timestamp (UTC) | Server | When form was submitted |
| IP address | `$_SERVER['REMOTE_ADDR']` | Lead geolocation, duplicate detection |
| User-Agent | `$_SERVER['HTTP_USER_AGENT']` | Device/browser for lead qualification |
| Referer | `$_SERVER['HTTP_REFERER']` | Which page the form was submitted from |

---

### 1.4 Lead Log Format

**File:** `/submit.php` line 170-175 → Appends to `submit-leads.log`

**Current format (pipe-delimited):**
```
[2026-04-28 14:23:47 UTC] tourism | John Smith | john@acme.com | +1-555-1234 | ACME Inc | https://acme.com | utm_content=a1b2c3d4e5f6 | utm_campaign=aeo-authority-build-47 | We need help with Google visibility
```

**Parsed fields:**
```
[timestamp] | source | name | email | phone | company | website | utm_content=VALUE | utm_campaign=VALUE | message
```

The UTM fields are present but could be more granular. The `utm_source` is currently lost (not logged).

---

## 2. What Data Is Missing?

### 2.1 Current Gaps

| Gap | Impact | Severity | Fix |
|-----|--------|----------|-----|
| `utm_source` not logged | Can't attribute to email vs. direct vs. paid | **HIGH** | Modify line 171 in submit.php to include `utm_source` |
| No `utm_medium` in log | Can't distinguish email vs. SMS vs. paid campaigns | **HIGH** | Add `utm_medium` to form capture |
| No lead ID in log | Can't join form submission to CRM contacts table later | **MEDIUM** | CRM should read log and create/match contacts + link to campaign_sends.token |
| No form completion time (seconds to submit) | Can't measure friction/engagement | **LOW** | Add hidden field with page load time |
| No A/B test variant | Can't measure email subject/content lift | **MEDIUM** | Add `utm_variant` or `ab_test_id` parameter from email |
| No click-to-submit time | Can't measure landing page conversion lag | **LOW** | Track timestamp difference (email click → form submit) |

---

### 2.2 Recommended Fields to Add to Form/Log

**Immediate (next week):**
```php
// Line 63-65 in submit.php: expand capture
$utm_source   = clean($_POST['utm_source']   ?? '');
$utm_medium   = clean($_POST['utm_medium']   ?? '');  // NEW
$utm_content  = clean($_POST['utm_content']  ?? '');
```

**Log line modification (line 171):**
```php
// FROM (current):
"[%s] %s | %s | %s | %s | %s | %s | utm_content=%s | utm_campaign=%s | %s\n"

// TO (improved):
"[%s] %s | %s | %s | %s | %s | %s | utm_source=%s | utm_medium=%s | utm_campaign=%s | utm_content=%s | %s\n"
```

This ensures every lead submission has the full UTM chain.

---

## 3. Five Key Weekly Metrics for Carlos

### 3.1 Metric #1: Pipeline Generated (by campaign)

**Definition:** Qualified leads generated this week, attributed to email campaigns via `utm_content` token match.

**Formula:**
```sql
SELECT
  ec.name AS campaign,
  COUNT(DISTINCT sl.email) AS leads_submitted,
  DATE(sl.timestamp) AS week_of
FROM submit_leads_parsed sl
LEFT JOIN campaign_sends cs ON cs.token = sl.utm_content
LEFT JOIN email_campaigns ec ON ec.id = cs.campaign_id
WHERE sl.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND sl.utm_content IS NOT NULL  -- email-sourced only
GROUP BY ec.name, DATE(sl.timestamp)
ORDER BY week_of DESC, leads_submitted DESC;
```

**What it shows:** Which campaigns are actually driving landing page signups, not just opens/clicks.

**Target:** 15-20 qualified leads/week by Month 3; 25+ by Month 6.

---

### 3.2 Metric #2: Email-to-Lead Conversion Rate (by campaign)

**Definition:** Of all emails clicked, what % resulted in a form submission within 24 hours?

**Formula:**
```sql
SELECT
  ec.name AS campaign,
  COUNT(DISTINCT cs.id) AS emails_clicked,
  COUNT(DISTINCT sl.email) AS leads_from_clicks,
  ROUND(100.0 * COUNT(DISTINCT sl.email) / COUNT(DISTINCT cs.id), 1) AS conversion_pct
FROM email_campaigns ec
LEFT JOIN campaign_sends cs ON cs.campaign_id = ec.id AND cs.status = 'clicked'
LEFT JOIN submit_leads_parsed sl ON sl.utm_content = cs.token
  AND sl.timestamp <= DATE_ADD(cs.clicked_at, INTERVAL 24 HOUR)
WHERE ec.sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ec.name
ORDER BY conversion_pct DESC;
```

**What it shows:** Landing page effectiveness. A healthy conversion here is 8-15% (clicked email → form submitted).

**Target:** 10% by Month 2; 12% by Month 4 (indicating better landing page + relevance).

---

### 3.3 Metric #3: Campaign ROI (Cost per Qualified Lead)

**Definition:** Cost per email click that converts to a form submission.

**Formula:**
```
CPL (Cost Per Lead) = Total Campaign Cost / Number of Leads Generated
```

**For email campaigns specifically:**
```
Email CPL = $0  (crm-vanilla is owned; only counting send costs: API, list size mgmt)
```

**For paid campaigns driving to landing pages:**
```
Paid CPL = Ad Spend / Form Submissions from utm_source=google_ads (or utm_medium=paid)
```

**SQL to calculate:**
```sql
SELECT
  sl.utm_campaign,
  sl.utm_source,
  COUNT(*) AS leads,
  CASE
    WHEN sl.utm_source = 'email' THEN 0  -- no cost per send
    WHEN sl.utm_source LIKE 'google%' THEN 15  -- estimated $15 CPC × 2 clicks per form
    WHEN sl.utm_source LIKE 'meta%' THEN 2.50
    ELSE NULL
  END AS cost_per_lead
FROM submit_leads_parsed sl
WHERE sl.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY sl.utm_campaign, sl.utm_source;
```

**What it shows:** Which channels are profitable (payback within 3 months).

**Target:** Email CPL = $0 (pure upside). Paid CPL < $100 (LTV of fCMO Growth is ~$10k, so 10% payback is healthy).

---

### 3.4 Metric #4: Form Submission Quality Score

**Definition:** Lead quality based on completeness of submission (phone provided, company/website filled in).

**Formula:**
```sql
SELECT
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN phone <> '-' AND phone <> '' THEN 1 END) AS has_phone,
  COUNT(CASE WHEN website <> '' THEN 1 END) AS has_website,
  COUNT(CASE WHEN company <> '' THEN 1 END) AS has_company,
  ROUND(100.0 * COUNT(CASE WHEN phone <> '-' AND website <> '' THEN 1 END) / COUNT(*), 1) AS quality_pct
FROM submit_leads_parsed
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**What it shows:** Sales readiness. Higher quality = more likely to convert to customer.

**Target:** 65%+ of leads have phone AND website (indicating engaged, serious leads).

---

### 3.5 Metric #5: Source Attribution Mix

**Definition:** Where are qualified leads actually coming from? Break down by utm_source and utm_campaign.

**Formula:**
```sql
SELECT
  utm_source,
  utm_campaign,
  COUNT(*) AS leads,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_of_total
FROM submit_leads_parsed
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY utm_source, utm_campaign
ORDER BY leads DESC;
```

**What it shows:** Is email dominating? Are paid channels contributing? Is direct (unattributed) traffic meaningful?

**Target (by Month 3):** Email 60%, Paid 25%, Direct 15%. (Direct will always exist: direct landing page visits, word-of-mouth, etc.)

---

## 4. Campaign ROI Calculation — Complete Formula

### 4.1 Simple Formula (Week View)

```
Campaign ROI = (Revenue from Leads - Cost) / Cost
```

For email campaigns:
```
Email Campaign ROI = (Leads × Avg Conversion to Customer % × Avg ACV) / (Send Cost + List Cost)
                   = (25 leads × 20% × $2,500 ACV) / $0
                   = Infinite (email has no per-send cost in crm-vanilla)
```

For paid campaigns:
```
Paid Campaign ROI = (Leads × Conversion to Customer % × Avg ACV) / Ad Spend
                  = (40 leads × 18% × $2,500 ACV) / $2,000 spend
                  = ($18,000 revenue / $2,000 cost)
                  = 800% ROI (9:1 return)
```

---

### 4.2 Full Attribution ROI (Month View — More Accurate)

This requires joining multiple tables and waiting for conversion:

```sql
-- Attribution ROI: email campaign → form lead → customer
SELECT
  ec.name AS campaign,
  COUNT(DISTINCT sl.email) AS leads_generated,
  COUNT(DISTINCT CASE WHEN c.status = 'customer' THEN c.id END) AS customers_acquired,
  SUM(CASE WHEN c.status = 'customer' THEN c.value ELSE 0 END) AS revenue,
  COUNT(DISTINCT sl.email) * 0  AS campaign_cost,  -- email = $0
  CASE
    WHEN COUNT(DISTINCT sl.email) = 0 THEN 0
    ELSE ROUND(
      (SUM(CASE WHEN c.status = 'customer' THEN c.value ELSE 0 END) - 0) /
      NULLIF(COUNT(DISTINCT sl.email) * 10, 0) * 100,  -- assume $10 cost per lead to acquire the lead
      0
    )
  END AS estimated_roi_pct
FROM email_campaigns ec
LEFT JOIN campaign_sends cs ON cs.campaign_id = ec.id
LEFT JOIN submit_leads_parsed sl ON sl.utm_content = cs.token
LEFT JOIN contacts c ON c.email = sl.email AND c.created_at >= ec.sent_at
WHERE ec.sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ec.name
ORDER BY estimated_roi_pct DESC;
```

**Interpretation:**
- `ROI > 300%` = Excellent channel, increase spend
- `ROI 100-300%` = Good, maintain
- `ROI 0-100%` = Breakeven, optimize
- `ROI < 0%` = Pause and investigate

---

## 5. Weekly Reporting Template

### 5.1 Data Source

**File:** `/submit-leads.log` (pipe-delimited text file)

**Parsing command** (bash):
```bash
# Extract logs from the past 7 days, parse into CSV
cat /path/to/submit-leads.log | \
  awk -F'|' 'BEGIN {print "timestamp,source,name,email,phone,company,website,utm_source,utm_medium,utm_campaign,utm_content,message"}
             {print $1 "|" $2 "|" $3 "|" $4 "|" $5 "|" $6 "|" $7 "|" $8 "|" $9 "|" $10 "|" $11}' | \
  sed 's/\[//g; s/\] UTC//g; s/ \| /,/g; s/ | /,/g' > leads_this_week.csv
```

---

### 5.2 Weekly Dashboard Template

**Title:** "NWM Lead Generation — Week of [DATE]"

#### Table 1: Pipeline Summary

| Metric | This Week | Last Week | 4-Week Avg | Target | Status |
|--------|-----------|-----------|-----------|--------|--------|
| **Total Form Submissions** | [COUNT] | — | — | 20 | 🟢/🟡/🔴 |
| **Email-Sourced Leads** | [COUNT] | — | — | 15 | 🟢/🟡/🔴 |
| **Paid-Sourced Leads** | [COUNT] | — | — | 4 | 🟢/🟡/🔴 |
| **Direct/Organic Leads** | [COUNT] | — | — | 2 | 🟢/🟡/🔴 |
| **Quality Score (%)** | [%] | — | — | 65% | 🟢/🟡/🔴 |

**Query:**
```bash
grep -E "$(date --date='7 days ago' +%Y-%m-)" /submit-leads.log | wc -l
```

---

#### Table 2: Campaign Performance (Email Focus)

| Campaign | Sent | Opened | Clicked | Forms | Conv. % | Cost/Lead |
|----------|------|--------|---------|-------|---------|-----------|
| [Campaign Name] | [N] | [N] | [N] | [N] | [%] | $0 |
| [Campaign Name] | [N] | [N] | [N] | [N] | [%] | $0 |
| **TOTAL** | [SUM] | [SUM] | [SUM] | [SUM] | [AVG%] | **$0** |

**Source:** `email_campaigns` table (sent_at within past 7 days) + match forms via `campaign_sends.token`

---

#### Table 3: Lead Detail (Sample Rows)

| Date | Name | Company | Source | UTM Campaign | Phone | Quality |
|------|------|---------|--------|--------------|-------|---------|
| 2026-04-28 | John Smith | ACME Inc | tourism | aeo-authority-build-47 | ✓ | High |
| 2026-04-28 | Sarah Lee | XYZ Corp | health | — | ✗ | Medium |
| 2026-04-27 | [Name] | [Company] | [Source] | [Campaign] | [✓/✗] | [H/M/L] |

**Extract command:**
```bash
tail -20 /submit-leads.log | \
  awk -F'|' '{print $1 "|" $3 "|" $6 "|" $2 "|" $10 "|" (($5 ~ /-/ || $5 == "") ? "✗" : "✓")}'
```

---

#### Table 4: Channel Mix (7-Day)

| Channel | Leads | Pct | Avg Quality | Trend |
|---------|-------|-----|-------------|-------|
| Email (campaigns) | [N] | [%] | [H/M/L] | ↑/→/↓ |
| Google Ads | [N] | [%] | [H/M/L] | ↑/→/↓ |
| Direct/Organic | [N] | [%] | [H/M/L] | ↑/→/↓ |
| **TOTAL** | [SUM] | 100% | — | — |

**Note:** Trend = compared to previous week

---

### 5.3 SQL Queries to Populate Tables

#### Query A: Weekly Summary (submit.php log)

```sql
-- Parse submit-leads.log into staging table
-- (assumes log is imported hourly via cron or webhook into temp table)

SELECT
  DATE(sl.timestamp) AS date,
  COUNT(*) AS total_submissions,
  COUNT(CASE WHEN sl.utm_source = 'email' THEN 1 END) AS email_leads,
  COUNT(CASE WHEN sl.utm_source IN ('google_ads', 'meta', 'linkedin') THEN 1 END) AS paid_leads,
  COUNT(CASE WHEN sl.utm_source NOT IN ('email', 'google_ads', 'meta', 'linkedin') OR sl.utm_source IS NULL THEN 1 END) AS direct_leads,
  ROUND(100.0 * COUNT(CASE WHEN sl.phone <> '-' AND sl.website <> '' THEN 1 END) / COUNT(*), 1) AS quality_pct
FROM submit_leads_parsed sl
WHERE sl.timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(sl.timestamp)
ORDER BY date DESC;
```

#### Query B: Campaign Performance (email_campaigns + campaign_sends)

```sql
SELECT
  ec.name AS campaign,
  ec.sent_count,
  ec.opened_count,
  ec.clicked_count,
  COUNT(DISTINCT sl.email) AS form_submissions,
  ROUND(100.0 * COUNT(DISTINCT sl.email) / ec.clicked_count, 1) AS click_to_form_pct,
  0 AS cost_per_lead_usd
FROM email_campaigns ec
LEFT JOIN campaign_sends cs ON cs.campaign_id = ec.id
LEFT JOIN submit_leads_parsed sl ON sl.utm_content = cs.token
  AND sl.timestamp <= DATE_ADD(cs.clicked_at, INTERVAL 24 HOUR)
WHERE ec.sent_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY ec.id, ec.name
ORDER BY form_submissions DESC;
```

---

## 6. Implementation Checklist

### Immediate (This Week)

- [ ] Modify `submit.php` lines 63-65 to capture `utm_source` and `utm_medium`
- [ ] Update log format (line 171) to include new UTM fields
- [ ] Create `submit_leads_parsed` table or import script to read `.log` file into database
- [ ] Test form submission with email campaign and verify `utm_content` token is logged

### Week 2-3

- [ ] Build weekly import cron job (reads `/submit-leads.log`, upserts to `submit_leads_parsed` table)
- [ ] Create SQL queries for Metrics #1–#5 above
- [ ] Set up simple dashboard (HTML table, auto-populated from queries, or exported CSV)

### Month 1

- [ ] Backfill any historical lead logs into database
- [ ] Integrate `campaign_sends.token` joins to link form → email campaign at scale
- [ ] Create alert rules (e.g., if weekly leads drop 20%, notify Carlos)

---

## 7. Data Quality Rules

### 7.1 Valid Records

A lead log entry is **valid for attribution** if:

```
✓ timestamp is within last 90 days
✓ email is a valid email format (passes FILTER_VALIDATE_EMAIL)
✓ name is non-empty
✓ company is non-empty
✓ (if utm_content provided) token matches a record in campaign_sends table
```

### 7.2 Invalid / Excluded Records

- Honeypot entries (website_url field filled) — silently rejected by submit.php
- Cross-origin submissions — rejected (fail 403)
- Missing required fields (name, email, company) — rejected (fail 422)
- Duplicate emails within same 24 hours — flag for manual review (possible demo test)

### 7.3 Data Validation Query

```sql
-- Find potentially bad records
SELECT
  sl.*,
  CASE
    WHEN sl.email NOT LIKE '%@%.%' THEN 'Invalid email'
    WHEN sl.name = '' THEN 'No name'
    WHEN sl.company = '' THEN 'No company'
    WHEN sl.utm_content <> '' AND NOT EXISTS (
      SELECT 1 FROM campaign_sends cs WHERE cs.token = sl.utm_content
    ) THEN 'Token not in campaign_sends (orphan)'
    ELSE 'OK'
  END AS validation_status
FROM submit_leads_parsed sl
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY validation_status;
```

---

## 8. Attribution Model (First-Click vs. Multi-Touch)

### Current Model: **Last-Click Attribution**

When a lead submits a form with `utm_content`, we credit the entire conversion to that email campaign (last click before conversion).

```
Email Click → Landing Page → Form Submit = 100% credit to Email Campaign
```

### Recommended Enhancement: **Multi-Touch (Week 1)**

Track all clicks within a 7-day window and credit them equally:

```
Click 1 (Day 1, Campaign A) → 33% credit
Click 2 (Day 3, Campaign B) → 33% credit
Click 3 (Day 5, Form Submit)  → 33% credit
```

This requires adding a `lead_source_session` table to track all interactions for a single email before form submission.

For now, stick with **last-click** (simpler, easier to debug). Upgrade to multi-touch in Month 3.

---

## 9. Weekly Reporting Cadence

**Day:** Every Monday at 09:00 UTC  
**Owner:** Data Analyst agent  
**Recipient:** Carlos (CEO)  
**Format:** Email with HTML table + CSV attachment + 3-5 bullet-point commentary  

**SLA:** Report published by 09:30 UTC (within 30 min of cron trigger)

### Sample Report Header

```
NWM Weekly Lead Report
Week of: April 21–27, 2026

KEY METRICS
• Leads generated: 18 (target: 20) — 90% on track
• Email campaign conversion: 12% (target: 10%) — exceeding
• Paid CAC: $95/lead (target: <$100) — healthy
• Quality score: 71% (target: 65%) — strong cohort

RECOMMENDATIONS
1. Increase send volume on "AEO Authority" campaign (12% conversion, should scale)
2. Pause "Generic B2B" campaign (4% conversion, underperforming)
3. Test landing page variant with longer form (currently no phone = lower quality)
```

---

## 10. Appendix: Log Entry Example

**Raw log line:**
```
[2026-04-28 14:23:47 UTC] tourism | John Smith | john@acme.com | +1-555-1234 | ACME Inc | https://acme.com | utm_source=email | utm_medium=cold-outreach | utm_campaign=aeo-authority-build-47 | utm_content=a1b2c3d4e5f6g7h8i9j0k1l2 | We need help with Google AI Overviews visibility
```

**Parsed columns:**
| Column | Value |
|--------|-------|
| timestamp | 2026-04-28 14:23:47 UTC |
| source | tourism |
| name | John Smith |
| email | john@acme.com |
| phone | +1-555-1234 |
| company | ACME Inc |
| website | https://acme.com |
| utm_source | email |
| utm_medium | cold-outreach |
| utm_campaign | aeo-authority-build-47 |
| utm_content | a1b2c3d4e5f6g7h8i9j0k1l2 |
| message | We need help with Google AI Overviews visibility |

**Attribution chain:**
```
campaign_sends.token = 'a1b2c3d4e5f6g7h8i9j0k1l2'
  ↓
campaign_sends.campaign_id = 47
  ↓
email_campaigns.id = 47
  ↓
email_campaigns.name = 'AEO Authority Build'
  ↓
Lead credited to: 'AEO Authority Build' campaign
```

---

## 11. Questions Answered

### Q1: What data is currently being captured? Is it enough?

**A:** Email campaign metadata (sent_count, opened_count, clicked_count) + per-recipient tracking (token, status, timestamps) + form submission (name, email, company, phone, website, message) are captured. **UTM params are mostly captured**, but `utm_source` is missing from the log, and `utm_medium` is not yet passed through. Once those two fields are added, the capture is **sufficient for weekly reporting**. Multi-touch attribution would require additional session tracking.

---

### Q2: What fields are missing that would complete the attribution picture?

**A:**
1. **`utm_source`** — lost in log, needed to distinguish email from paid
2. **`utm_medium`** — not captured, needed for channel segmentation (cold-outreach vs. paid-search vs. paid-social)
3. **Lead ID** — form doesn't generate/return a lead ID, so linking to CRM is manual
4. **Session ID** — no way to track multi-touch attribution (multiple clicks before form)
5. **A/B test variant** — no split-test data in logs
6. **Form completion time** — no UX friction metrics

Priority additions: #1 and #2 (quick, high-impact). #3–#6 are Month 2+.

---

### Q3: What are the 5 key metrics Carlos should track weekly?

**A:**
1. **Pipeline Generated by Campaign** (count of leads, attributed to email via token)
2. **Email-to-Lead Conversion Rate** (% of clicks that convert to form, per campaign)
3. **Campaign ROI (Cost per Lead)** — email = $0; paid = ad spend / leads
4. **Form Submission Quality Score** — % with phone + website (sales readiness)
5. **Source Attribution Mix** — email vs. paid vs. direct breakdown

Each metric has a formula, target, and interpretation provided above.

---

### Q4: What does a "Campaign ROI" calculation look like with the current data?

**A:** Simple (weekly view):
```
Campaign ROI = (Leads Generated × Conversion to Customer % × ACV) / Cost
```

Email example:
```
ROI = (25 leads × 20% × $2,500 ACV) / $0 cost = Infinite
```

Paid example:
```
ROI = (40 leads × 18% × $2,500 ACV) / $2,000 ad spend = 800%
```

Full attribution (monthly, more accurate) joins form logs → contacts → customer status and tracks revenue. Query provided in section 4.2.

---

### Q5: Design a simple weekly reporting template that can be filled from the log.

**A:** See section 5 above. Four tables:
1. **Pipeline Summary** — total leads, quality score, targets
2. **Campaign Performance** — sent, opened, clicked, forms, conversion %
3. **Lead Details** — sample 20 recent rows
4. **Channel Mix** — email vs. paid vs. direct breakdown

All populated from `submit-leads.log` and `email_campaigns` + `campaign_sends` tables via SQL queries. Template is HTML-table ready, with markdown provided.

---

## 12. Next Steps

1. **By 2026-05-01:** Modify submit.php to log `utm_source` and `utm_medium`. Test with a campaign.
2. **By 2026-05-05:** Import logs into `submit_leads_parsed` table (or similar). Run Metrics #1–#5 queries.
3. **By 2026-05-12:** Generate first weekly report for Carlos (may be incomplete, but proves the pipeline).
4. **By 2026-05-20:** Automate weekly report generation (cron job → email).

---

**Document Prepared By:** Data Analyst, NetWebMedia  
**Last Updated:** 2026-04-28  
**Next Review:** 2026-05-12 (post-first-full-week of reporting)

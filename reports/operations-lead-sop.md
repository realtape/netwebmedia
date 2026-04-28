# Lead Capture & Client Onboarding SOP

**Version:** 1.0 | **Last Updated:** April 28, 2026 | **Owner:** Operations Manager  
**Scope:** All inbound leads from email campaigns through project kickoff  
**Target Audience:** All team members; new hires should read this in ~10 minutes

---

## Overview: The Pipeline

```
Campaign Send → Lead Clicks → Form Submission → Qualification → Sales Pitch → Deal Close → Onboarding → Kickoff
```

Each step has an owner, a tool, a time target, and clear success criteria. Failures are documented in the "What If" column.

---

## Step 1: Campaign Send (CRM Outbound)

**Trigger:** Sales Director schedules an outbound email campaign in crm-vanilla  
**Owner:** Sales Director  
**Tool:** crm-vanilla CRM → email_campaigns + campaign_sends tables  
**Time Target:** Campaign queued and ready to send (no SLA — scheduling step only)

**Steps:**
1. Sales Director logs into crm-vanilla dashboard
2. Creates new email_campaigns record: name, subject, body (HTML/plain text)
3. Uploads prospect list (CSV: email, first_name, company, etc.)
4. System auto-generates one unique `token` per prospect in campaign_sends table
5. Campaign marked as `queued` (not sent yet)
6. Confirm all email addresses are valid (system warns on duplicates/bounces)

**Success Criteria:**
- Campaign created with name matching execution plan (e.g., "AI Outbound #1 Q2")
- Every send record has a unique token (no duplicates)
- All required fields populated (email, name, company)
- Campaign status = queued

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Duplicate emails in list | System processes same email twice | Re-upload cleaned list; system prevents dupe sends via email-only check |
| Invalid email format | Bounces immediately | Review CSV; use email regex validator before upload |
| Token collision (rare) | Two sends share same token | Regenerate tokens via database; contact Engineering Lead |

---

## Step 2: Email Campaign Execution (Send)

**Trigger:** Campaign status = queued and send time arrives (or manually triggered by Sales Director)  
**Owner:** Sales Director / CRM Automation  
**Tool:** crm-vanilla background worker (cron job in `_cron/`)  
**Time Target:** Emails deployed within 1 hour of scheduled time

**Steps:**
1. CRM background job reads queued campaigns
2. For each send record: constructs email with UTM parameters baked into click tracking links
3. All links wrapped via `/api/?r=track&a=click&t=TOKEN&u=URL` (click redirects to landing page with UTMs)
4. Email sent from hello@netwebmedia.com
5. campaign_sends.status updated to `sent` + sent_at timestamp recorded
6. Unsubscribe list checked; no emails to `unsubscribes` table addresses

**Success Criteria:**
- All emails sent within send window (no delays >2 hours)
- Email headers include List-Unsubscribe header (per CAN-SPAM)
- Every link includes tracking token
- Zero sends to unsubscribed addresses

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Link encoding broken | UTM params garbled in URL | Engineering Lead checks utm-capture.js + track.php URL construction |
| High bounce rate (>5%) | 100+ hard bounces in 1 hour | Pause campaign; review list quality with Sales Director; remove bounces from future sends |
| Unsubscribe link missing | Legal/compliance issue | Engineering Lead adds List-Unsubscribe header to all sends before next campaign |

---

## Step 3: Prospect Click & Tracking (Open/Click Pixel)

**Trigger:** Lead clicks email link (click redirect) OR email opened (open pixel)  
**Owner:** CRM Automation + UTM Capture JS  
**Tool:** `/api/?r=track&a=click` endpoint + utm-capture.js  
**Time Target:** Real-time (within milliseconds)

**Steps:**
1. Lead clicks tracked link in email: `netwebmedia.com/api/?r=track&a=click&t=TOKEN&u=DEST`
2. track.php script:
   - Records click_at timestamp in campaign_sends
   - Increments campaign_sends.clicked_count
   - Appends utm_source=email, utm_medium=cold-outreach, utm_campaign=SLUG, utm_content=TOKEN
   - Redirects to landing page (302) with UTMs in query string
3. Landing page loads (e.g., industries/{niche}-lp or root audit-lp)
4. utm-capture.js reads URL params (utm_source, utm_campaign, utm_content)
5. Stores UTMs to sessionStorage (keys: nwm_utm_source, nwm_utm_campaign, nwm_utm_content)
6. sessionStorage survives soft navigation within same session

**Success Criteria:**
- Click recorded <100ms in database
- UTM tokens passed through to landing page
- sessionStorage populated and survives form navigation
- Lead sees thank-you page or form immediately

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| UTM params missing from form submission | Form submitted without campaign attribution | Check utm-capture.js is loaded on landing page; verify utm_* hidden inputs exist in HTML |
| sessionStorage blocked | UTM lost on soft navigation | Confirm page is not in private browsing mode; fallback is URL params only (usually sufficient) |
| Click not recorded (downtime) | Click doesn't appear in CRM | Check track.php is accessible; logs in error_log; restart PHP-FPM |

---

## Step 4: Landing Page Form Submission

**Trigger:** Lead fills in lead capture form (name, email, company, phone optional, message optional)  
**Owner:** Lead (prospect) / Engineering Lead (form setup)  
**Tool:** HTML form → /submit.php (form handler)  
**Time Target:** Form submits within 2 seconds of click

**Steps:**
1. Lead arrives on landing page (industries/{niche}-lp or root audit-lp)
2. Page includes utm-capture.js (deferred load, non-blocking)
3. Form HTML contains:
   - Visible inputs: name, email, company, phone (optional), website (optional), message (optional)
   - Hidden inputs: utm_source, utm_campaign, utm_content, source (page slug)
   - Honeypot: website_url (invisible to humans; bots fill it and fail silently)
4. utm-capture.js populates hidden inputs with sessionStorage values
5. Lead submits form (POST to /submit.php)
6. submit.php validates:
   - name, email, company required (non-empty + email format)
   - phone optional (no validation if empty)
   - honeypot check: if website_url is filled, return 200 (silent fail)
7. Cross-origin check: referer must match netwebmedia.com domain

**Success Criteria:**
- Form validates in <500ms
- No required fields rejected (only name, email, company)
- Hidden UTM fields auto-populated before submit
- Honeypot catches automated submissions silently

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Required field missing | 422 error "Required fields missing" | Lead sees error; must fill name, email, company; no retry penalty |
| Invalid email format | 422 error "Invalid email" | Lead sees error; must use valid email format |
| Form blocked by CORS | 403 "Cross-origin submissions not allowed" | Confirm form action URL matches landing page domain (both netwebmedia.com) |
| Honeypot triggered (spam bot) | 200 OK (silent); no lead created | No action needed; spam filtered silently |

---

## Step 5: Lead Logged + Auto-Reply Sent

**Trigger:** submit.php receives valid form POST  
**Owner:** submit.php handler / hello@netwebmedia.com (outbound)  
**Tool:** PHP mail() + file append (submit-leads.log)  
**Time Target:** Within 2 seconds of form submission

**Steps:**
1. submit.php validates form (see Step 4)
2. Constructs notification email:
   - To: hello@netwebmedia.com
   - Subject: [NWM Lead] {source_slug} — {name} / {company}
   - Body: full lead info + UTM attribution
   - Reply-To: lead's email
3. Sends notification email (async, non-blocking)
4. Constructs auto-reply HTML email:
   - To: lead's email
   - Subject: "Got it, {first_name} — here's what happens next"
   - Body: thanks message + "we'll send you a plan within 24 hours" + link to /services.html
   - From: hello@netwebmedia.com
5. Sends auto-reply (async, non-blocking)
6. Appends one-line log entry to submit-leads.log:
   ```
   [2026-04-28 13:05:30 UTC] tourism | Alice Johnson | alice@company.com | +1-555-0123 | Acme Inc | www.acme.com | utm_content=abc123token | utm_campaign=ai-outbound-1 | ...
   ```
7. Redirects to thank-you page:
   - If clicked from /industries/{slug}-lp → /industries/{slug}/thanks.html
   - If clicked from root audit → /audit-thanks.html

**Success Criteria:**
- Notification email arrives at hello@netwebmedia.com within 5 seconds
- Auto-reply sent to lead within 2 seconds
- Log entry written to submit-leads.log with full UTM attribution
- Lead sees thank-you page (expected UX confirmation)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Mail function fails (php.ini misconfigured) | Notification/auto-reply don't arrive | Contact Engineering Lead; check php.ini sendmail_path; test via CLI |
| Log file not writable | Error in file_put_contents | Check submit-leads.log permissions (666 or 644); ensure /submit.php directory is writable |
| Auto-reply bounces | Lead doesn't receive confirmation | Confirm lead's email is valid (re-check form); not a blocker (lead still logged) |
| Redirect URL invalid | Lead sees 404 on thank-you page | Engineering Lead verifies {slug}/thanks.html exists for each industry |

---

## Step 6: Sales Director WhatsApp Outreach (Within 5 Min)

**Trigger:** Sales Director receives hello@netwebmedia.com notification email  
**Owner:** Sales Director  
**Tool:** WhatsApp Business API + manual message (or crm-vanilla automation if phone available)  
**Time Target:** Within 5 minutes of form submission

**Steps:**
1. Sales Director receives notification email from submit.php (Step 5)
2. Reads lead info: name, company, email, phone (if provided), UTM attribution
3. If phone provided:
   - Opens WhatsApp Business or crm-vanilla CRM integration
   - Sends warm greeting: "Hi {name}, saw your interest in AI marketing for {company}. I'm {Sales Director name}, let's chat about your goals. Free 15-min call? [calendly link]"
   - Logs outreach in CRM (contact record or lead note)
4. If phone not provided (common for email-first campaigns):
   - Skips WhatsApp, proceeds to Step 7 (Strategy Agent plan)

**Success Criteria:**
- WhatsApp sent within 5 minutes of form submission (if phone provided)
- Message personalizes lead name + company
- Includes calendar link (calendly.com/netwebmedia/sales-call or similar)
- CRM contact record created with status = "contacted"

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Phone number invalid or missing | Cannot send WhatsApp | Proceed to Step 7 (email outreach will continue); Sales Director can follow up via email if phone appears later |
| WhatsApp blocked (spam filter) | Message marked as spam | Use personal WhatsApp account first; escalate to Sales Director manager if recurring |
| Sales Director doesn't see notification email | No WhatsApp sent | Confirm hello@netwebmedia.com is monitored; add Sales Director to mailing list or forward rules |

---

## Step 7: AI Strategy Agent Builds Retainer Plan (Within 24 Hours)

**Trigger:** hello@netwebmedia.com receives lead notification email  
**Owner:** Strategy Agent (product-manager or cmo agent)  
**Tool:** crm-vanilla CRM + AI client analysis (Claude API call)  
**Time Target:** Plan generated and queued in CRM within 24 hours

**Steps:**
1. Operations Manager or CRM automation detects new lead with phone/email
2. Extracts lead data: company, industry, message, UTM source (shows which campaign is working)
3. Invokes Strategy Agent via crm-vanilla CRM task queue or manual delegation:
   - Input: company info, industry (source slug), budget signals in message
   - Agent researches company (public web presence, recent news, competitors)
   - Agent drafts 90-day retainer plan:
     * Current state analysis
     * Top 3 growth opportunities (AEO/SEO, content, paid media)
     * Deliverables by month
     * Estimated timeline to ROI
4. Plan output stored in CRM contact record (custom field: "Strategy Plan")
5. Plan queued for delivery to Sales Director by email

**Success Criteria:**
- Strategy plan generated within 24 hours of form submission
- Plan addresses lead's stated goals (from message field)
- Plan shows 2-3 specific initiatives (not generic)
- Attached to CRM contact record (visible in sales view)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Strategy Agent fails (API error) | Plan not generated; contact shows "pending" | Engineering Lead checks Claude API quota; retry manually if quota restored |
| Company research insufficient | Plan is too generic | Sales Director provides richer brief to Strategy Agent on re-run |
| Plan takes >24 hours | Lead loses momentum | Set up async CRM task reminder; Sales Director may pitch without full plan (outline framework instead) |

---

## Step 8: Sales Pitch Delivered (Email + WhatsApp or Calendly)

**Trigger:** Strategy plan generated (Step 7) + Sales Director reviews  
**Owner:** Sales Director  
**Tool:** Email (Gmail/crm-vanilla) + WhatsApp (if phone) + Calendly  
**Time Target:** Delivered within 24-36 hours of form submission

**Steps:**
1. Sales Director receives strategy plan (Step 7) + original lead notification
2. Composes outreach email:
   - To: lead's email
   - Subject: "Your 90-Day AI Marketing Plan for {Company}" or "Let's Grow {Company} with AI"
   - Body:
     * Personalized greeting (name + company)
     * Key insight from strategy plan (1-2 sentences)
     * Offers 3 retainer tiers: Lite ($249), Growth ($999), Scale ($2,499)
     * Includes pricing details + sample deliverables
     * Includes calendar link (Calendly) for free 15-min discovery
     * Closes with: "Any questions, just reply to this email"
3. If phone provided: follows up with WhatsApp (similar messaging, shorter)
4. Logs outreach attempt in CRM (contact record: "Pitch Sent" + timestamp)
5. Sets up follow-up task: "Re-engage if no reply in 3 days"

**Success Criteria:**
- Email sent within 24-36 hours of form submission
- Pitch includes specific plan details (not generic)
- Pricing is clear (3 tier options)
- Calendly link present (no friction to book call)
- CRM status updated to "pitch_sent"

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Lead email bounces (invalid) | Email delivery failure | Sales Director tries phone (WhatsApp) if available; mark lead as invalid |
| No reply within 3 days | Lead goes cold | Sales Director sends 1 follow-up email (day 4-5); then pauses until lead re-engages |
| Calendly link broken | Lead cannot book call | Sales Director regenerates link; resends email |
| Multiple outreach emails (spam) | Lead unsubscribes | Sales Director checks CRM task queue; remove duplicate tasks |

---

## Step 9: CEO Approves Deal (Async Approval)

**Trigger:** Sales Director records deal in CRM (opportunity + estimated value)  
**Owner:** CEO (Carlos)  
**Tool:** crm-vanilla CRM opportunity record  
**Time Target:** Approval decision within 24-48 hours

**Steps:**
1. Sales Director creates CRM opportunity record:
   - Contact: lead record
   - Deal name: "{Company} — fCMO {Tier}"
   - Estimated value: ACV × 12 months (e.g., $249 × 12 = $2,988 for Lite)
   - Deal stage: "proposal_sent" (after pitch email)
   - Closes by: {date, usually 14 days out}
2. Sales Director notifies CEO via Slack or email: "New deal: {Company} — {Value} — pitch sent, waiting on lead response"
3. CEO reviews opportunity:
   - Validates company fit (is this a good client for our playbook?)
   - Checks CAC vs ACV (is this deal worth chasing?)
   - Approves or rejects (comment in CRM)
4. If approved: deal moves to "in_negotiation" stage
5. If rejected: Sales Director marks lead as "not_qualified" (no further outreach)

**Success Criteria:**
- Deal record created in CRM with all fields populated
- CEO approval documented (comment in CRM)
- Deal stage reflects current state (proposal_sent → in_negotiation → won → lost)
- No deals close without CEO sign-off

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| CEO unreachable | Deal approval stalled >48 hours | Sales Director escalates to Carlos-CEO-Assistant agent; proceed with onboarding prep while waiting |
| Deal rejected after pitch sent | Lead continues outreach unnecessarily | Sales Director marks as not_qualified immediately; cancels follow-up tasks |
| ACV calculation wrong | Deal looks bigger/smaller than reality | Finance Controller verifies pricing in CRM; Sales Director corrects opportunity record |

---

## Step 10: Client Onboarding Kicks Off

**Trigger:** Lead books call via Calendly → Call happens → Verbal agreement on tier + payment terms  
**Owner:** Customer Success Manager + Project Manager  
**Tool:** crm-vanilla CRM + onboarding checklist + Stripe (payment)  
**Time Target:** Payment processed within 24 hours of call

**Steps:**
1. Lead books call via Calendly (Sales Director handles discovery call)
2. During call: Sales Director:
   - Confirms company fit + key goals
   - Discusses which tier (Lite, Growth, Scale)
   - Collects payment info or sends Stripe invoice link
   - Schedules kickoff meeting (within 3 business days)
3. Sales Director updates CRM opportunity:
   - Stage: "won"
   - Actual value: confirmed ACV
   - Close date: today
4. Finance Controller processes payment:
   - Sends Stripe invoice (if not already collected)
   - Confirms payment received
   - Updates CRM contact: status = "active_customer"
   - Creates new entry in `crm-vanilla/database` → customers table (subscription active)
5. Customer Success Manager receives handoff:
   - CRM contact record
   - Onboarding checklist (see Step 11)
   - Any special notes from Sales Director
6. Project Manager notified: "Onboarding ready for {Company}"

**Success Criteria:**
- Payment processed (Stripe confirmation)
- CRM contact marked as "active_customer"
- Customer Success + Project Manager notified
- Kickoff meeting scheduled (date locked in calendars)
- Welcome email sent to lead (from customer-success@netwebmedia.com)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Payment fails | Stripe rejection (card declined, etc.) | Finance Controller follows up with lead; requests updated payment method; re-processes within 1 day |
| Lead ghosts after verbal agreement | No payment received after 2 days | Sales Director sends 1 payment reminder email; if no response after 3 days, mark deal as "lost" |
| No kickoff date set | Onboarding delayed indefinitely | Customer Success Manager sends calendar invite immediately after payment confirmed |

---

## Step 11: Onboarding Checklist (Customer Success)

**Trigger:** Payment confirmed (Step 10)  
**Owner:** Customer Success Manager  
**Tool:** crm-vanilla CRM checklist + email + Slack  
**Time Target:** All tasks completed within 5 business days of payment

**Checklist:**

- [ ] Send welcome email (template: email-templates/onboarding-welcome.html)
- [ ] Create customer account in crm-vanilla (workspace, api_key for integrations)
- [ ] Schedule strategy kickoff call (Day 1-2)
- [ ] Collect client info: brand voice, campaign history, current metrics, success definition
- [ ] Create shared Google Folder (strategy docs, reports, templates)
- [ ] Set up Slack channel (if client needs real-time communication)
- [ ] Assign Project Manager (send intro email)
- [ ] Confirm first sprint scope (30-day plan)
- [ ] Set up reporting dashboard (Looker Studio or crm-vanilla analytics)
- [ ] Schedule first monthly QBR (4 weeks out)

**Success Criteria:**
- All checklist items completed within 5 days
- Client has clear next steps (kickoff meeting scheduled, deliverables outlined)
- Customer Success Manager has client contact on speed dial (Slack, email, phone)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Welcome email bounces | Client doesn't receive onboarding info | Customer Success Manager calls client directly; resends from backup email |
| API key generation fails | Client cannot integrate tools | Engineering Lead regenerates key manually; Customer Success retransmits |
| Kickoff call no-show | Time wasted, momentum lost | Customer Success sends follow-up email within 1 hour; reschedules within 24 hours |

---

## Step 12: Project Manager Runs First Sprint

**Trigger:** Onboarding checklist complete (Step 11)  
**Owner:** Project Manager  
**Tool:** crm-vanilla CRM (project tasks) + Jira/Linear (optional) + Google Docs (sprint brief)  
**Time Target:** Sprint planning call within 2 days of onboarding complete

**Steps:**
1. Project Manager receives handoff from Customer Success (client contact + scope)
2. Schedules sprint planning call (30 min) with client + Project Manager + (optional) assigned Content Strategist/Engineering Lead
3. During call:
   - Review 30-day goals (from strategy plan)
   - Break into 2-week sprints (Sprint 1 = Days 1-14, Sprint 2 = Days 15-30)
   - Assign deliverables (content, code changes, audits, etc.)
   - Set weekly check-in schedule (Tuesdays 10am PT, for example)
4. Project Manager creates sprint board in CRM:
   - Task: {deliverable name}
   - Owner: {which agent is responsible}
   - Due date: {sprint end date}
   - Status: backlog → in_progress → review → done
5. First weekly check-in (Day 7): demo Sprint 1 progress
6. Adjust Sprint 2 based on client feedback

**Success Criteria:**
- Sprint planning call scheduled and completed
- All Sprint 1 tasks assigned + have clear due dates
- Client knows what to expect each week
- Weekly check-ins are scheduled (calendar blocks)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Client unavailable for sprint planning | Call rescheduled 3+ times | Project Manager sends async sprint brief (Google Doc) + calendar invite; call becomes optional |
| Deliverables vague ("build content") | Scope creep, missed deadlines | Project Manager writes 1-page sprint brief: specific deliverables, word counts, formats, due dates |
| Missing domain access (client website) | Project Manager blocked from making changes | Client provides FTP/admin credentials in 24 hours; escalate to Sales Director if needed |

---

## Step 13: Finance Controller Invoices & Tracks MRR

**Trigger:** Customer becomes "active_customer" in CRM  
**Owner:** Finance Controller  
**Tool:** Stripe + crm-vanilla customers table + spreadsheet (P&L tracking)  
**Time Target:** First invoice processed by Day 1 of service; recurring invoice automated

**Steps:**
1. Finance Controller receives customer record from Sales Director (Step 9)
2. Sets up Stripe recurring subscription:
   - Customer: {lead name/email}
   - Product: fCMO {Lite/Growth/Scale}
   - Amount: $249/$999/$2,499 per month
   - Billing cycle: monthly (1st of month, or anniversary date)
   - Auto-renew: enabled
3. Creates invoice + sends to customer (Stripe handles recurring)
4. Logs customer in finance tracking sheet:
   - Customer name, tier, MRR, start date, notes
5. Tracks MRR (Monthly Recurring Revenue) weekly:
   - Running total of all active subscriptions
   - Churn (cancellations) tracked separately
   - Reports to CEO weekly

**Success Criteria:**
- First invoice paid within 24 hours of customer handoff
- Recurring subscription active (Stripe dashboard shows "active")
- Customer in finance MRR spreadsheet
- MRR updated weekly (visible to CEO)

**What If:**

| Failure | Symptom | Fix |
|---------|---------|-----|
| Stripe setup fails | No invoice sent; customer confused | Finance Controller retries manually; resends invoice via email if Stripe is down |
| Customer disputes charge | Chargeback or refund request | Finance Controller reviews agreement + invoices; refunds if legitimate error; prevents abuse via Stripe dispute tools |
| Billing address missing | Invoice incomplete | Finance Controller requests from customer via email before sending |

---

## Summary: Roles + SLAs at a Glance

| Step | Owner | Tool | SLA | Success = |
|------|-------|------|-----|-----------|
| 1. Campaign Send | Sales Director | crm-vanilla | — | Campaign queued, tokens unique |
| 2. Email Execute | CRM Auto | _cron/ job | 1 hr | All sends deployed, no bounces >5% |
| 3. Click Track | utm-capture.js | track.php | <100ms | Click + UTMs recorded, session storage live |
| 4. Form Submit | Lead + Engineering | /submit.php | <2s | Form validates, no spam, honeypot works |
| 5. Log + Reply | submit.php | PHP mail + log | <2s | Notification + auto-reply both sent |
| 6. WhatsApp | Sales Director | WhatsApp API | <5 min | Message sent if phone provided, personalized |
| 7. Strategy Plan | Strategy Agent | crm-vanilla + Claude | <24 hr | Plan in CRM, specific initiatives listed |
| 8. Sales Pitch | Sales Director | Email + Calendly | <24-36 hr | Pitch sent, pricing clear, calendar link works |
| 9. CEO Approval | CEO | crm-vanilla | <48 hr | Deal created, approved, stage updated |
| 10. Onboarding | Customer Success | Stripe + CRM | <24 hr | Payment processed, kickoff scheduled |
| 11. Checklist | Customer Success | CRM | <5 days | All items done, client has next steps |
| 12. First Sprint | Project Manager | CRM + Google Docs | <2 days | Sprint planning done, tasks assigned |
| 13. Invoicing | Finance Controller | Stripe | <24 hr | Recurring subscription active, MRR tracked |

---

## Top 3 Failure Points (Risk Mitigation)

### 1. UTM Attribution Lost Between Click and Form Submit
**Why it happens:** utm-capture.js doesn't load, or sessionStorage blocked (private browsing), or hidden form fields don't exist.  
**Impact:** Sales doesn't know which campaign sourced the lead; can't optimize spend.  
**Mitigation:**
- Weekly audit: check 10 form submissions in submit-leads.log; verify utm_content field is populated
- QA before campaign: test form on landing page, confirm utm_source/campaign/content hidden inputs auto-fill
- Fallback: utm-capture.js falls back to URL params (survives single page navigation)

### 2. Sales Director Misses 5-Min WhatsApp Window (Or Lead Bounces at Form)
**Why it happens:** Email delivery delay, Sales Director distracted, phone number invalid.  
**Impact:** Lead cools off; reply rate drops 20-30% after 5 min window.  
**Mitigation:**
- Slack bot auto-notifies Sales Director (not email) when new lead arrives
- CRM auto-generates WhatsApp draft (Sales Director just copies + sends)
- If phone missing: email sequence starts immediately (Strategy Agent plan sent in auto-reply)

### 3. CEO Approval Bottleneck Delays Onboarding
**Why it happens:** CEO unreachable, ambiguous deal value, unclear fit.  
**Impact:** Customer Success can't kickoff on time; customer loses confidence.  
**Mitigation:**
- Set clear deal approval criteria upfront (ACV > $500, fit checklist)
- Async approval: Sales Director marks deal "approved pending CEO review" + proceeds with onboarding prep
- CEO spot-checks 20% of deals post-hoc (quality control)

---

## Metrics to Track (Weekly Ops Review)

- **Funnel:** campaigns sent → clicks → forms submitted → demos booked → deals won
- **Time-to-response:** avg time between form submit and first WhatsApp (target: <5 min)
- **Reply rate:** emails sent → replies received (target: 3-5%)
- **Onboarding time:** deal closed → payment confirmed → first sprint started (target: 3-5 days)
- **CAC:** total sales/marketing spend / # customers acquired (target: <$2,400)
- **Churn:** # customers cancelled / # active customers (target: <3% monthly)

---

## Document Control

- **Owner:** Operations Manager
- **Next review date:** May 28, 2026
- **Last updated:** April 28, 2026
- **Approval:** CEO (Carlos)

# NetWebMedia Standard Operating Procedures (SOPs)

**Version:** 2026-05-01  
**Owner:** Operations  
**Last Updated:** 2026-05-01  
**Total SOPs:** 35

---

## Quick Navigation

### 1. Sales & Lead Generation
- [Lead Capture & CRM Intake](sales-leadgen/01-lead-capture.md)
- [Pipeline Management & Qualification](sales-leadgen/02-pipeline-qualification.md)
- [Deal Closure & Conversion](sales-leadgen/03-deal-closure.md)
- [Account Onboarding](sales-leadgen/04-account-onboarding.md)

### 2. Marketing & Content
- [Content Calendar & Planning](marketing-content/01-content-planning.md)
- [Blog Post Creation & Publishing](marketing-content/02-blog-publication.md)
- [Social Media & Carousel Production](marketing-content/03-social-production.md)
- [Campaign Asset Delivery](marketing-content/04-campaign-assets.md)

### 3. Email Marketing
- [Sequence Configuration & Enrollment](email-marketing/01-sequence-setup.md)
- [Email Broadcast Send Pipeline](email-marketing/02-email-send.md)
- [Drip Campaign Management](email-marketing/03-drip-campaigns.md)
- [WhatsApp Opt-In Management](email-marketing/04-whatsapp-optins.md)

### 4. CRM Operations
- [Contact Management & Lifecycle](crm-operations/01-contact-management.md)
- [Deal Pipeline Management](crm-operations/02-deals.md)
- [CRM Workflow Automation](crm-operations/03-workflow-automation.md)
- [Tasks & Calendar Management](crm-operations/04-tasks-calendar.md)
- [CRM Reporting & Analytics](crm-operations/05-reporting.md)

### 5. Technical & Deployment
- [Code Review Standards](technical-deployment/01-code-review.md)
- [GitHub Actions CI/CD Management](technical-deployment/02-github-actions.md)
- [FTPS Deploy Operations](technical-deployment/03-ftps-deploy.md)
- [Post-Deploy Verification](technical-deployment/04-post-deploy.md)
- [Database Migration Management](technical-deployment/05-migrations.md)

### 6. Customer Success
- [Quarterly Business Reviews (QBR)](customer-success/01-qbr.md)
- [Client Renewal & Expansion](customer-success/02-renewal-expansion.md)
- [Client Support Escalation](customer-success/03-support-escalation.md)
- [Client Onboarding](customer-success/04-onboarding.md)

### 7. Video Production
- [Video Template Setup](video-production/01-template-setup.md)
- [Video Render & Delivery](video-production/02-render-delivery.md)
- [Instagram Carousel Production Pipeline](video-production/03-carousel-production.md)

### 8. Operations & Administration
- [Git Backup & Repository Hygiene](operations-admin/01-backup-git.md)
- [Database Maintenance](operations-admin/02-db-maintenance.md)
- [Secrets & Credentials Rotation](operations-admin/03-secrets-rotation.md)
- [Production Monitoring & Incident Response](operations-admin/04-monitoring.md)

---

## Legend

**Flowchart notation (Mermaid graph LR — all horizontal):**
- Rectangle `[Task]` = Process step
- Diamond `{Decision}` = Branch point
- Stadium `([Event])` = Start / End
- Arrow `-->` = Flow direction

**Timing conventions:**
- All times in **America/Santiago** timezone (Carlos's local time)
- Dates use **ISO 8601** format (YYYY-MM-DD)
- Google Calendar syncs all scheduled events

**Ownership model:**
- Each SOP lists the **primary owner** in the header
- Escalation paths documented in each SOP's Troubleshooting section

---

## Cross-Functional Workflows

These processes cross multiple domains — follow the chain:

1. **Lead → Customer Journey**  
   `sales-leadgen/01` → `email-marketing/01` → `crm-operations/02` → `customer-success/04`

2. **Content Cluster → Social → Email**  
   `marketing-content/01` → `marketing-content/02` → `marketing-content/03` → `email-marketing/02`

3. **Code Change → Deploy → Verify → Monitor**  
   `technical-deployment/01` → `technical-deployment/02` → `technical-deployment/04` → `operations-admin/04`

4. **CRM Automation Chain**  
   `crm-operations/01` (tag added) → `crm-operations/03` (workflow fires) → `email-marketing/02` (email sends)

5. **Client Lifecycle**  
   `crm-operations/02` (deal won) → `customer-success/04` (onboard) → `customer-success/01` (QBR) → `customer-success/02` (renew)

---

## Key Contacts & Escalation

| Role | Name | Area | Escalates To |
|---|---|---|---|
| **CEO / Founder** | Carlos Martinez | Strategic | Board |
| **CMO** | Agent: cmo | Marketing & Brand | Carlos |
| **Sales Director** | Agent: sales-director | Sales Pipeline | Carlos |
| **Engineering Lead** | Agent: engineering-lead | Technical & Deploy | Carlos |
| **Operations Manager** | Agent: operations-manager | Admin & Monitoring | Carlos |
| **Content Strategist** | Agent: content-strategist | Blog, Social, Email | CMO |
| **Customer Success** | Agent: customer-success | Onboarding, QBR | Carlos |

Agents available in `.claude/agents/`. Routing guide at `.claude/AGENT-ROUTING.txt`.

---

## Quick Reference: Key Systems

| System | URL / Location | Auth | Used in |
|---|---|---|---|
| CRM | `netwebmedia.com/crm-vanilla/` | Session token | SOP-CRM-* |
| Public API | `netwebmedia.com/api/` | X-Auth-Token | SOP-EM-*, SOP-CRM-* |
| Video Factory | `localhost:3030` | Dev only | SOP-VP-01, 02 |
| GA4 | Google Analytics | Google Account | SOP-MC-02, CRM-05 |
| Search Console | Google Search Console | Google Account | SOP-MC-02 |
| Sentry | `sentry.io/netwebmedia` | SSO | SOP-TD-04, OA-04 |
| GitHub Actions | `github.com/[repo]/actions` | GitHub Account | SOP-TD-02 |
| Resend | `resend.com/dashboard` | API Key | SOP-EM-02, OA-04 |
| cPanel | `netwebmedia.com:2083` | cPanel credentials | SOP-OA-02, 03 |

---

## Document Maintenance

**When to update:**
- On any workflow change — update the relevant SOP immediately
- Quarterly: review all SOPs for accuracy and completeness
- After any incident — update the relevant SOP's Troubleshooting section

**How to update:**
1. Edit the markdown file in `_deploy/sop/`
2. Commit with message: `sop: update [domain] [procedure-name]`
3. Push to main — SOPs are version-controlled

**SOP naming convention:**
- Files: `NN-kebab-case-name.md`
- Codes: `SOP-MC-01`, `SOP-EM-02`, `SOP-CRM-03`, `SOP-TD-04`, `SOP-CS-05`, `SOP-VP-01`, `SOP-OA-02`

Last full audit: **2026-05-01**

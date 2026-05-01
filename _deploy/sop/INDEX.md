# NetWebMedia Standard Operating Procedures (SOPs)

**Version:** 2026-05-01  
**Owner:** Operations  
**Last Updated:** 2026-05-01

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
- [Email Send Pipeline & Cron](email-marketing/02-email-send.md)
- [Drip Sequence Management](email-marketing/03-drip-campaigns.md)
- [WhatsApp Opt-in Pipeline](email-marketing/04-whatsapp-optins.md)

### 4. CRM Operations
- [Contact Management & Lifecycle](crm-operations/01-contact-mgmt.md)
- [Deal Stages & Deal Workflows](crm-operations/02-deals.md)
- [Visual Workflow Builder & Automation](crm-operations/03-workflow-automation.md)
- [Tasks, Events & Calendar Sync](crm-operations/04-tasks-calendar.md)
- [Reporting & Analytics](crm-operations/05-reporting.md)

### 5. Technical & Deployment
- [Code Review & Merge Process](deployment-technical/01-code-review.md)
- [GitHub Actions & Deploy Workflow](deployment-technical/02-github-actions.md)
- [FTPS Deploy to InMotion](deployment-technical/03-ftps-deploy.md)
- [Post-Deploy Validation](deployment-technical/04-post-deploy.md)
- [Database Migrations & Maintenance](deployment-technical/05-migrations.md)

### 6. Customer Success
- [Onboarding Workflow](customer-success/01-onboarding.md)
- [Quarterly Business Reviews (QBR)](customer-success/02-qbr.md)
- [Renewal & Expansion](customer-success/03-renewal-expansion.md)
- [Support & Escalation](customer-success/04-support-escalation.md)

### 7. Video Production
- [Template Selection & Configuration](video-production/01-template-setup.md)
- [Render & Asset Delivery](video-production/02-render-delivery.md)
- [Multi-Format Carousel Production](video-production/03-carousel-production.md)

### 8. Operations & Administration
- [Auto-Backup & Git Management](operations-admin/01-backup-git.md)
- [Database & Server Maintenance](operations-admin/02-db-maintenance.md)
- [Secret & Token Rotation](operations-admin/03-secrets-rotation.md)
- [Monitoring & Incident Response](operations-admin/04-monitoring.md)

---

## Legend

**Symbols used in flowcharts:**
- 🟦 **Blue rectangle** = Task/Process
- 🟪 **Purple diamond** = Decision point
- 🟩 **Green circle** = Start/End
- 🔵 **Arrow** = Flow direction

**Timing conventions:**
- All times listed in **America/Santiago timezone** (Carlos's local time)
- Dates use **ISO 8601** format (YYYY-MM-DD)
- Google Calendar syncs all scheduled items

**Responsible parties:**
- Each SOP lists the **primary owner** and **stakeholders**
- Escalation paths are documented in each procedure

---

## Cross-Functional Workflows

These touch multiple systems—see individual SOPs for detailed steps:

1. **Lead → Customer Journey** (Sales + Email + CRM)
   - See: sales-leadgen → email-marketing → customer-success

2. **Content → Social → Email** (Marketing + Email)
   - See: marketing-content → email-marketing

3. **Code → Deploy → Monitor** (Technical + Ops)
   - See: deployment-technical → operations-admin

4. **CRM Workflow Automation** (CRM Operations + Video + Email)
   - See: crm-operations → video-production → email-marketing

---

## Key Contacts & Escalation

| Role | Name | Area | Escalates To |
|---|---|---|---|
| **CEO / Founder** | Carlos Martinez | Strategic | Board |
| **CMO** | (TBD) | Marketing & Brand | Carlos |
| **Sales Director** | (TBD) | Sales Pipeline | CMO |
| **Engineering Lead** | (TBD) | Technical & Deployment | Carlos |
| **Operations** | (TBD) | Admin & Monitoring | Carlos |

---

## Quick Reference: System Access

| System | URL | Auth Type | Primary Use |
|---|---|---|---|
| **CRM** | netwebmedia.com/crm-vanilla/ | Session Token | Internal CRM |
| **API** | netwebmedia.com/api/ | X-Auth-Token header | Lead capture, integrations |
| **Video Factory** | localhost:3030 | Dev mode | Video rendering |
| **Backend** | localhost:8000 | Dev mode | Django admin |
| **Mobile App** | localhost:5173 | OAuth | Customer portal |

---

## Document Maintenance

**Update frequency:**
- Quarterly review of all SOPs
- On-the-fly updates when workflow changes
- Version log at top of each document

**How to contribute:**
1. Update the SOP markdown
2. Commit to `main` with message: `sop: update <area> <procedure>`
3. Notify team of changes in Slack

Last full audit: **2026-05-01**

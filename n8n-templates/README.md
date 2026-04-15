# NetWebMedia n8n Automation Pack

Five production-ready n8n workflow templates designed for the NetWebMedia service stack. Import any of them directly into your n8n instance (self-hosted or cloud) and connect your credentials.

## Pack Contents

| # | Workflow | What it does | Service tier |
|---|---|---|---|
| 1 | `01-lead-capture-to-hubspot.json` | Webhook → validate → Claude qualification → CRM + HubSpot push → Slack alert | AI Agents + Automations |
| 2 | `02-daily-seo-audit-to-slack.json` | Daily cron → hit `/app/api/?r=analyze` → post score to Slack → create ticket if score drops | AI SEO + Automations |
| 3 | `03-abandoned-form-recovery.json` | Webhook from form-partial event → wait 30 min → check for completion → send personalized re-engagement email via Claude | AI Agents |
| 4 | `04-social-post-generator.json` | Daily cron → pull latest blog post → Claude generates 3 variants (LinkedIn, X, Instagram) → schedule via Buffer API | Social Media + Content |
| 5 | `05-proposal-pdf-pipeline.json` | Webhook from intake agent → Claude drafts personalized proposal → render HTML via template → upload to Google Drive → email link to sales | Proposal automation |

## Installation

1. In your n8n instance, go to **Workflows → Import from File**
2. Select one of the JSON files in this folder
3. Configure the credentials placeholders (HubSpot, Anthropic, Slack, Google, Buffer)
4. Toggle **Active** in the top-right

## Credentials Required

- **Anthropic API key** (workflows 1, 3, 4, 5)
- **HubSpot Private App token** (workflow 1)
- **Slack webhook URL** (workflows 1, 2)
- **Google Drive OAuth2** (workflow 5)
- **Buffer API token** (workflow 4)
- **NetWebMedia API token** (workflows 2, 5) — any long random string, set as `X-API-Key` header on `/app/api/*`

## Pricing (Suggested Resell)

| Product | Price |
|---|---|
| Single workflow install + config | $800 one-time |
| Full 5-workflow pack | $3,200 one-time |
| Pack + 3 months monitoring & tweaks | $4,800 |
| Custom workflow on top of pack | $1,500-$4,000 each |

## License

© 2026 NetWebMedia. These templates are internal IP — do not redistribute. Clients get a license to modify for their own use only.

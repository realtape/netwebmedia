# NetWebMedia n8n Automation Pack

Five production-ready n8n workflow templates designed for the NetWebMedia service stack. Import any of them directly into your n8n instance (self-hosted or cloud) and connect your credentials.

## Pack Contents

| # | Workflow | What it does | Service tier |
|---|---|---|---|
| 1 | `01-lead-capture-to-hubspot.json` | Webhook → validate → Claude qualification → CRM + HubSpot push → Discord alert to sales channel | AI Agents + Automations |
| 2 | `02-daily-seo-audit-to-discord.json` | Daily cron → hit `/app/api/?r=analyze` → post score to Discord → create ticket if score drops | AI SEO + Automations |
| 3 | `03-abandoned-form-recovery.json` | Webhook from form-partial event → wait 30 min → check for completion → send personalized re-engagement email via Claude | AI Agents |
| 4 | `04-social-post-generator.json` | Daily cron → pull latest blog post → Claude generates 3 variants (LinkedIn, X, Instagram) → schedule via Buffer API | Social Media + Content |
| 5 | `05-proposal-pdf-pipeline.json` | Webhook from intake agent → Claude drafts personalized proposal → render HTML via template → upload to Google Drive → email link to sales | Proposal automation |

## Installation

1. In your n8n instance, go to **Workflows → Import from File**
2. Select one of the JSON files in this folder
3. Configure the credentials placeholders (HubSpot, Anthropic, Discord, Google, Buffer)
4. Toggle **Active** in the top-right

## Credentials Required

- **Anthropic API key** (workflows 1, 3, 4, 5)
- **HubSpot Private App token** (workflow 1)
- **Discord webhook URL** (workflows 1, 2) — create one per channel in Discord → *Edit Channel* → *Integrations* → *Webhooks* → *New Webhook*. Store the URL as `discordWebhookUrl` in the n8n credential `NetWebMedia Discord`. Swap for Slack / Teams / Telegram / Email using drop-in recipes in [NOTIFICATIONS.md](./NOTIFICATIONS.md).
- **Google Drive OAuth2** (workflow 5)
- **Buffer API token** (workflow 4)
- **NetWebMedia API token** (workflows 2, 5) — any long random string, set as `X-API-Key` header on `/app/api/*`

### Recommended Discord channel layout

| Channel | Wired to | What lands there |
|---|---|---|
| `#sales-hot-leads` | workflow 01 | Every lead with AI score ≥ 70 — name, company, budget, service fit, message |
| `#ops-seo-daily` | workflow 02 | Daily 9am SEO audit score for `netwebmedia.com` (green embed if Δ ≥ 0, red if dropped) |

Create one webhook URL per channel and paste them into the two credentials in n8n — that's all the setup needed.

## Pricing (Suggested Resell)

| Product | Price |
|---|---|
| Single workflow install + config | $800 one-time |
| Full 5-workflow pack | $3,200 one-time |
| Pack + 3 months monitoring & tweaks | $4,800 |
| Custom workflow on top of pack | $1,500-$4,000 each |

## License

© 2026 NetWebMedia. These templates are internal IP — do not redistribute. Clients get a license to modify for their own use only.

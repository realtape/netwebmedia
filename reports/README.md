# Reports Directory

Central location for recurring business reports, dashboards, and executive briefs.

## Directory Structure

```
reports/
├── executive/          # Daily/weekly briefs for Carlos
│   ├── daily-brief.json
│   ├── weekly-dashboard.json
│   └── README.md
├── finance/            # Monthly P&L, cash flow, AR aging
│   ├── monthly-p-l.json
│   ├── cash-flow-forecast.json
│   ├── ar-aging.json
│   └── README.md
├── operations/         # Ops reviews, vendor status
│   ├── weekly-ops-review.json
│   ├── vendor-status.json
│   └── README.md
├── sales/              # Pipeline forecasts, deals
│   ├── weekly-forecast.json
│   ├── pipeline.json
│   └── README.md
├── data/               # Performance reports, dashboards
│   ├── weekly-performance.json
│   ├── funnel-analysis.json
│   ├── cohort-analysis.json
│   └── README.md
├── projects/           # Project status, retros
│   ├── active-projects.json
│   ├── project-<name>-status.json
│   └── README.md
├── customer-success/   # QBRs, health scores, renewals
│   ├── active-clients.json
│   ├── client-<name>-qbr.json
│   ├── health-score-report.json
│   └── README.md
└── marketing/          # Campaign performance, content ROI
    ├── campaign-performance.json
    ├── aeo-citations.json
    └── README.md
```

## Naming Convention

- **Recurring reports:** `<frequency>-<name>.json` (e.g., `weekly-forecast.json`, `monthly-p-l.json`)
- **One-off reports:** `<report-name>-<date>.json` (e.g., `campaign-retro-2026-05-01.json`)
- **Client/project specific:** `<type>-<entity-name>.json` (e.g., `project-homepage-redesign-status.json`, `client-acme-corp-qbr.json`)

## Report Schema

All JSON reports follow this envelope:

```json
{
  "type": "finance|sales|data|project|customer-success|marketing|operations|executive",
  "owner": "agent-name",
  "generated": "2026-05-01T14:30:00Z",
  "period": "2026-04-24 to 2026-05-01",
  "status": "draft|final|archived",
  "content": {
    "rag": "green|amber|red",
    "summary": "...",
    "metrics": {...},
    "findings": [...],
    "recommendations": [...],
    "open_questions": [...]
  },
  "nextReviewDate": "2026-05-08"
}
```

## Sync Protocol

- **Finance Controller:** Monthly P&L/cash flow → CRM + reports/ + Google Drive
- **Data Analyst:** Weekly performance → reports/ + CRM dashboard + Google Drive
- **Project Manager:** Weekly status → reports/ + CRM + Slack/email to Carlos
- **Sales Director:** Weekly forecast → reports/ + CRM + Google Drive
- **CEO Assistant:** Daily brief → reports/executive/ + CRM (latest only)
- **Customer Success:** QBRs → reports/ + CRM + client-specific folder in Google Drive
- **CMO:** Campaign reviews → reports/marketing/ + CRM

## Access

- **reports/** folder: version-controlled in git (daily auto-commit via CI)
- **CRM storage:** queryable via `/crm-vanilla/api/?r=reports` endpoint
- **Google Drive**: Shared with carlos@netwebmedia.com, auto-synced from reports/ weekly via GitHub Actions

## Google Drive Sync Setup

The `.github/workflows/sync-reports-gdrive.yml` workflow runs weekly to push all reports to Google Drive. To enable:

1. **Create a Google Cloud Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use existing
   - Create a Service Account (`IAM & Admin` → `Service Accounts`)
   - Generate a JSON key file
   - Grant the service account "Editor" role on the Google Drive folder

2. **Create a shared Google Drive folder:**
   - Create a folder named `NWM Reports` in Carlos's Google Drive (shared with carlos@netwebmedia.com)
   - Get the folder ID from the URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`

3. **Add GitHub Secrets** (repo settings):
   - `GOOGLE_DRIVE_SERVICE_ACCOUNT` = JSON key file contents (paste entire JSON)
   - `GDRIVE_REPORTS_FOLDER_ID` = the folder ID from step 2

4. **Verify:**
   - Manually trigger the workflow: `.github/workflows/sync-reports-gdrive.yml` → "Run workflow"
   - Check Google Drive folder for synced reports in subdirectories

The sync runs **every Monday at 9:15 UTC** (2:15 AM Santiago), creating or updating JSON files in the Drive folder structure matching the local `reports/` hierarchy.

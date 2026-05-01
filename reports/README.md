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

- **reports/** folder: version-controlled in git (canonical source of truth)
- **CRM storage:** queryable via `/crm-vanilla/api/?r=reports` endpoint
- **Google Drive**: [NWM Reports folder](https://drive.google.com/drive/folders/1aGUq7z1zcT42MHprM9Pg87-akpF0kO8u) — synced on-demand by Claude via the Google Drive MCP connector

## Google Drive

The Drive folder exists for executive accessibility (Carlos and stakeholders who don't pull the repo). Folder ID: `1aGUq7z1zcT42MHprM9Pg87-akpF0kO8u`.

**Sync model:** Claude pushes reports to Drive on-demand using the connected Google Drive MCP — no GitHub Actions or service account credentials required. Ask Claude "sync reports to Drive" and it will upload any reports that have changed since the last sync.

This avoids the operational overhead of managing service-account JSON keys in GitHub Secrets, which were the original blocker. The Drive folder is a mirror, not a primary; if it falls out of sync, repulling from git is always authoritative.

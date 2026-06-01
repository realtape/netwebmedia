# NetWebMedia

NetWebMedia is a launch-ready MVP for a bilingual AI growth and build agency focused on SMBs in the US and LatAm. This repository includes:

- A polished marketing site with sections for services, process, about, contact, and a primary audit-request CTA.
- A lightweight in-browser CRM demo that stores submitted leads in `localStorage`, scores them, and recommends next actions.
- A production-oriented Django CRM backend scaffold with multi-tenant organizations, reusable business presets, admin, API endpoints, and Celery hooks.
- Internal operating assets for positioning, service packaging, stack decisions, sales flow, onboarding, reporting, and v1 automation design.

## Run locally

```bash
node server.js
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

If you prefer npm and your shell policy allows it:

```bash
npm start
```

## CRM backend

The repository now includes a Python backend in [`backend/`](C:\Users\Usuario\Documents\NetWebMedia\backend) built with Django, Django REST Framework, PostgreSQL-ready settings, and Celery.

### What is included

- Custom `User` model with email login
- Multi-tenant `Organization` and `Membership` models
- CRM models for companies, contacts, leads, deals, tasks, notes, activities, pipelines, and custom fields
- API routes under `/api/accounts/`, `/api/organizations/`, and `/api/crm/`
- Organization presets for different business types
- Django admin for internal operations
- Celery app and sample task wiring

### Quick start

Create the virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Run the backend setup:

```bash
.venv\Scripts\python backend\manage.py makemigrations
.venv\Scripts\python backend\manage.py migrate
.venv\Scripts\python backend\manage.py seed_crm_presets
.venv\Scripts\python backend\manage.py createsuperuser
.venv\Scripts\python backend\manage.py runserver
```

### Preset-driven CRM setup

The backend includes seedable CRM presets for:

- Agencies
- SaaS revenue teams
- Real estate intake flows

Presets are stored in `apps.organizations.OrganizationPreset` and can be used as the base for organization-specific pipelines and custom fields.

## Project structure

- `index.html`: primary marketing site
- `thanks.html`: thank-you / handoff step after form submission
- `dashboard.html`: lightweight CRM and operations demo
- `backend/`: Django CRM backend
- `styles.css`: visual system and responsive layout
- `script.js`: lead capture, local CRM logic, qualification scoring, and dashboard rendering
- `docs/brand-system.md`: brand usage, messaging, tone, color/type direction
- `docs/offer-and-pricing.md`: flagship offer, pricing shape, add-ons, and proof model
- `docs/operations-playbook.md`: lifecycle, stack, SOPs, v1 automation, manual scope
- `docs/templates.md`: qualification checklist, proposal structure, onboarding questionnaire, KPI/reporting template

## Implementation notes

- The CRM is intentionally local-first for an MVP demo. Production integrations are documented in the operations playbook.
- The site is English-first and written to support bilingual sales and fulfillment across SaaS, apps, CRM, web, and marketing projects.
- The launch avoids fabricated results; it uses founding-client and pilot framing where proof is still being built.

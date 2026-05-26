# CRM auth model + self-service password reset

**Two separate apps/DBs/sessions — do not conflate:**
- **CRM** = `crm-vanilla/` → DB `webmed6_crm`. Auth = **PHP session** (`$_SESSION['nwm_uid']`) set by logging in at `netwebmedia.com/crm-vanilla/login.html` (`?r=auth`). The real Chile/USA leads live here.
- **api-php app** = `/app/` and main-site `/login.html` → DB `webmed6_nwm`. Separate session. Logging into `/app/` does NOT grant CRM writes, and `/app/` shows **demo data (Acme Corp, Sarah Johnson)**, not the real leads.

**CRM API auth gotcha (cost me a long detour 2026-05-25):**
- `X-Auth-Token` (localStorage `nwm_token`) authorizes **reads only** — the CRM serves org-1 data to guests, so GETs work even unauthenticated.
- **Writes** (`?r=campaigns` create/test/send, etc.) require `guard_user()` = a real PHP session. The localStorage token is usually NOT a valid row in `webmed6_crm.sessions`, so writes 401 even when reads succeed.
- To send from the CRM, Carlos must be logged in at `crm-vanilla/login.html` (sets the session cookie my same-origin fetch then carries).

**Self-service password reset (shipped 2026-05-25, commit 203f50568):**
- CRM login "Forgot password?" → `POST /crm-vanilla/api/?r=password_reset&action=request {email}` → emails a tokenized link → `reset-password.html?token=...` → `action=confirm {token,password}`.
- Tokens: sha256-at-rest, single-use, 1h expiry, per-email throttled (5/h, 60s cooldown), same-origin gated; request always returns generic success (no account-existence leak).
- Handler `crm-vanilla/api/handlers/password_reset.php`; schema `schema_password_resets.sql`; registered in `index.php` as a public route.
- Separate from the api-php/main-site reset (commit 679c5b302) which covers `/login.html` + `/app/`.

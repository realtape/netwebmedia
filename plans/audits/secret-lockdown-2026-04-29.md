# Secret Lockdown + compare.html Audit — 2026-04-29

**Owner:** Engineering Lead
**Trigger:** multi-tenant deploy this morning shipped 5 dev artifacts publicly (schema SQL files, migrate runbook with token, branding.md). Token `NWM_MIGRATE_2026` was reachable with curl.

---

## 1. `.htaccess` rules added — `crm-vanilla/.htaccess`

Inserted after the header comment, before the existing `<IfModule mod_headers.c>` block:

```apache
# Block schema files, migration runbooks, and developer docs from public access.
<FilesMatch "\.(sql|md)$">
  Require all denied
</FilesMatch>

# Block the migrations directory entirely (defence in depth).
RedirectMatch 403 ^/crm-vanilla/api/migrations/.*$

# Block the api/lib/ directory (PHP includes, never directly served).
RedirectMatch 403 ^/crm-vanilla/api/lib/.*$
```

Existing cache-control rules preserved untouched.

---

## 2. Files modified

| File | Change |
|---|---|
| `crm-vanilla/.htaccess` | Added `FilesMatch` `.sql\|.md` deny + `RedirectMatch 403` for `api/migrations/` and `api/lib/`. |
| `crm-vanilla/api/config.php` | Rotated all 5 token defaults; added comment explaining the leak and that `config.local.php` overrides on prod. |
| `crm-vanilla/api/migrations/README.md` | Prepended security note. Replaced both `NWM_MIGRATE_2026` URL examples with `<MIGRATE_TOKEN from config.local.php>` placeholder. |
| `compare.html` | (a) Replaced 2 `GPT-4` with `Claude-powered`. (b) Reframed AI SDR row → "Email + AI follow-up; outbound dialer Q3". (c) Voice AI row → "Q3 2026 roadmap" (gray). (d) Video Factory row → "Beta — design partners". (e) NWM tri-card strength: "Voice AI + Video AI" → "Video Factory beta + Voice AI on Q3 roadmap". (f) Pos-grid copy: removed present-tense Voice AI claim. (g) Voice AI feature card: added `<small>Q3 2026 roadmap</small>`. (h) Video Factory card: added `Beta — design partners`. (i) GraphQL card: split to "REST today, GraphQL Q3". (j) LatAm billing card: "Chile live · MX/AR Q3". (k) "These aren't features on a roadmap" preamble rewritten to honestly mix today + roadmap. (l) Traditional-agencies weakness "No Voice AI" → "Slow to ship native AI" (no longer an unfair contrast). |

Pricing rows, contract terms, white-label "Q2 design partners", multi-touch attribution, and all object/portal/KB rows left as-is — those are truthful.

---

## 3. New committed token defaults (public — leak-tripwires only)

```php
define('MIGRATE_TOKEN',     'NWM_MIGRATE_2026_ROTATED_7d790e0bb4992a6e');
define('SEED_TOKEN',        'NWM_SEED_2026_ROTATED_d47666718c958165');
define('DEDUPE_TOKEN',      'NWM_DEDUPE_2026_ROTATED_83775ea8cf335894');
define('IMPORT_BEST_TOKEN', 'NWM_IMPORT_BEST_2026_ROTATED_54d352ecf7cdd544');
define('IMPORT_CSV_TOKEN',  'NWM_IMPORT_CHILE_2026_ROTATED_65b7d4eb01eaf403');
```

These are committed and therefore public. They exist so that if `config.local.php` is missing on prod, requests fail-fast with an obviously-rotated value rather than the historic `NWM_MIGRATE_2026`. **Production must override all five in `config.local.php`.**

---

## 4. Manual step — Carlos rotates production tokens

`config.local.php` is server-only and not in git. After this deploy reaches prod:

```bash
# SSH or cPanel Terminal into InMotion
cd /home/webmed6/public_html/crm-vanilla/api/

# 1. Backup current local config
cp config.local.php config.local.php.bak.$(date +%Y%m%d_%H%M)

# 2. Generate 5 fresh hex tokens
for n in MIGRATE SEED DEDUPE IMPORT_BEST IMPORT_CSV; do
  echo "$n=NWM_${n}_$(openssl rand -hex 12)"
done
```

Open `config.local.php` in cPanel File Manager (or `nano`) and add/replace:

```php
define('MIGRATE_TOKEN',     'NWM_MIGRATE_<paste hex 1>');
define('SEED_TOKEN',        'NWM_SEED_<paste hex 2>');
define('DEDUPE_TOKEN',      'NWM_DEDUPE_<paste hex 3>');
define('IMPORT_BEST_TOKEN', 'NWM_IMPORT_BEST_<paste hex 4>');
define('IMPORT_CSV_TOKEN',  'NWM_IMPORT_CSV_<paste hex 5>');
```

Save. PHP picks them up on the next request (no restart needed under mod_php / FPM).

Store the live tokens in 1Password under "NWM CRM — admin tokens (prod)".

---

## 5. Verification post-deploy

After `deploy-crm.yml` runs, from any terminal:

```bash
# Each MUST return 403 (was 200 this morning)
for path in \
  api/schema.sql \
  api/schema_organizations.sql \
  api/schema_organizations_migrate.sql \
  api/migrations/README.md \
  branding.md ; do
  printf "%-45s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' https://netwebmedia.com/crm-vanilla/$path)"
done

# Confirm old token is dead (expect 401/403, NOT 200)
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://netwebmedia.com/crm-vanilla/api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations"
```

All five paths must return `403`. The migrate probe must NOT return `200`.

If anything returns `200`, the `.htaccess` either didn't deploy or `AllowOverride` is restricted on that vhost — check `/home/webmed6/public_html/.htaccess` parent and InMotion's vhost config.

---

## Out of scope (handed off)

- Handler-level token rotation in `crm-vanilla/api/handlers/*.php` — owned by another agent.
- `index.html` and `js/*` — not touched per brief.
- Auto-rotating prod tokens — Carlos does this manually (step 4 above).

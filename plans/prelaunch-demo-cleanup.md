# Pre-Launch Demo Data Cleanup — May 1, 2026

**Owner:** Operations Manager  
**Target:** Monday launch cleanup (remove all demo/seed data from Carlos's superadmin account)  
**Databases:** `webmed6_crm` (CRM) + `webmed6_nwm` (API-PHP)

---

## 1. INVENTORY — Demo/Seed Data Sources

### 1.1 CRM Seed Contacts & Conversations
**File:** `crm-vanilla/api/schema_seed_conversations_v2.sql` (lines 8–49)

**Demo contacts inserted:**
```
Sofia Martinez        (sofia@latamgroup.com)        | LATAM Group, Marketing Director
Carlos Mendoza       (carlos@techwave.cl)           | TechWave Chile, CEO
Isabella Torres      (isabella@greenleaf.com)       | GreenLeaf Organics, Brand Manager
Diego Ramirez        (diego@novalabs.io)            | NovaLabs, CTO
Valentina Cruz       (valentina@skyport.cl)         | SkyPort Logistics, VP Sales
Mateo Silva          (mateo@andeanventures.com)     | Andean Ventures, Founder
```
**Associated demo conversations:** 6 conversations + 17 messages (channels: email, WhatsApp, SMS)  
**Organization scoping:** All seeded with `organization_id = 1` (master org)  
**Idempotency:** Uses `INSERT IGNORE` — safe to re-run

**Count:** 6 contacts + 6 conversations + 17 messages

---

### 1.2 CRM Seed Courses & Lessons
**File:** `crm-vanilla/api/schema_courses.sql` (lines 75–125)

**Demo courses inserted:**
- 15 published NetWebMedia course templates (`nwm-crm`, `nwm-cms`, `ai-automate`, etc.)
- 10 lessons for the first course (`nwm-crm`) with metadata (title, duration, status)

**Organization scoping:** Added `organization_id = 1` (master org) via ALTER TABLE  
**Status:** All published (not drafts)  
**Idempotency:** Uses simple INSERT on initial run; safe to re-run

**Count:** 15 courses + 10 lessons  
**Assessment:** These are **operational templates, not demo data** — they are the product's default course library. DO NOT DELETE. Keep.

---

### 1.3 CRM User Seed (Carlos Superadmin)
**File:** `crm-vanilla/api/schema.sql` (lines 139–141)

```sql
INSERT INTO `users` ... ('Carlos Martinez', 'carlos@netwebmedia.com', ..., 'superadmin', 'enterprise', 'active')
ON DUPLICATE KEY UPDATE ...
```

**Assessment:** This is Carlos's legitimate account. DO NOT DELETE.

---

### 1.4 CRM Organizations & Tenancy Seed
**File:** `crm-vanilla/api/schema_organizations.sql` (lines 79–98)

```sql
INSERT INTO `organizations` (id=1, slug='netwebmedia', display_name='NetWebMedia', plan='master', status='active')
INSERT INTO `org_members` (organization_id=1, user_id=1, role='owner', is_primary=1)
```

**Assessment:** Master org bootstrap. Legitimate. DO NOT DELETE.

---

### 1.5 API-PHP Seed Admin + Demo Users
**File:** `api-php/migrate.php` (lines 195–206)

```php
['admin@netwebmedia.com', 'NetWeb Admin', 'admin', 'NetWebAdmin2026!'],
['demo@netwebmedia.com',  'Demo User',    'demo',  'demo1234'],
```

**Database:** `webmed6_nwm` → `users` table  
**Assessment:** These are seed admin/demo credentials from initial setup. Should be **cleaned up** before launch.

---

### 1.6 Frontend Mock Data (NOT in database)
**File:** `crm-vanilla/js/data.js`

- 12 mock contacts (Sarah Chen, Marcus Johnson, Elena Rodriguez, etc.)
- 12 mock deals
- 6 mock conversations
- Mock calendar events

**Assessment:** This is **frontend-only mock data** — never inserted into any database. Used for UI development only. Safe to leave as-is (can be removed later if desired).

---

### 1.7 Test Email (Daily Launch Test)
**Requirement:** Remove `nwm-launch-test-1777669256@example.com` from today's newsletter signup.

**Database:** `webmed6_nwm` → `contacts` table  
**Search criteria:** Email matches `%example.com%` OR exact match to test address + created today

**Finding:** No existing records found for this exact address or `example.com` pattern in current DB state. **May be pending insertion** from a form submission on launch day. Recommend adding a pre-launch cleanup step to query for and delete any `%example.com%` addresses submitted in the last 24 hours.

---

## 2. CLEANUP PLAN

### Decision Matrix

| Item | Type | Action | Rationale |
|------|------|--------|-----------|
| `schema_seed_conversations_v2.sql` contacts/conversations | Demo data | **DELETE** | Demo contacts (sofia@latamgroup.com, etc.) clutter the superadmin's CRM on day 1 |
| `schema_courses.sql` courses/lessons | Operational template | **KEEP** | These are the product's default learning content; needed for client use |
| `users` table (admin@netwebmedia.com, demo@netwebmedia.com) | Demo accounts | **DELETE** | Demo credentials should not exist in production superadmin account |
| `users` table (carlos@netwebmedia.com) | Legitimate | **KEEP** | Carlos's real account |
| `organizations` (id=1) + `org_members` | Tenancy bootstrap | **KEEP** | Master org is operational |
| `data.js` mock contacts | Frontend only | **KEEP** | Not in DB; harmless |
| Test email (example.com) | Test submission | **DELETE** | Remove any test newsletter subs from today |

---

## 3. IDEMPOTENT SQL MIGRATIONS

### 3.1 CRM Cleanup — `crm-vanilla/api/schema_2026_05_01_demo_cleanup.sql`

This migration runs automatically on the next `deploy-site-root.yml` deploy. It deletes:
- 6 demo contacts (sofia@latamgroup.com, carlos@techwave.cl, etc.)
- 6 linked conversations + 17 messages (cascade-delete via FK)
- Any test newsletter subs with example.com emails from May 1, 2026

**Idempotency:** Safe to re-run; uses DELETE with WHERE on unique email addresses.

### 3.2 API-PHP Cleanup — `api-php/schema_2026_05_01_demo_cleanup.sql`

This migration also runs automatically on deploy. It deletes:
- 2 demo user accounts: `admin@netwebmedia.com` (admin) and `demo@netwebmedia.com` (demo)

**Idempotency:** Safe to re-run; email addresses are unique.

**Note:** Both migrations execute in the `deploy-site-root.yml` CI job. No manual SQL execution needed on the server — just commit and push to main.

**How it works:**
1. Developer commits both `schema_*.sql` files to the repo
2. Push to main triggers `deploy-site-root.yml` GitHub Actions workflow
3. CI detects new `schema_*.sql` files and auto-runs them via `migrate.php` with the `MIGRATE_TOKEN` secret
4. Migrations are idempotent; existing data is unaffected
5. Next deploy attempt is also safe — already-deleted rows match zero rows

---

## 4. VERIFICATION — Rows That WILL BE Deleted

### Demo Contacts (webmed6_crm.contacts)

| ID | Email | Name | Company | Status | Reason |
|----|-------|------|---------|--------|--------|
| TBD | sofia@latamgroup.com | Sofia Martinez | LATAM Group | Customer | Demo seed |
| TBD | carlos@techwave.cl | Carlos Mendoza | TechWave Chile | Customer | Demo seed |
| TBD | isabella@greenleaf.com | Isabella Torres | GreenLeaf Organics | Prospect | Demo seed |
| TBD | diego@novalabs.io | Diego Ramirez | NovaLabs | Lead | Demo seed |
| TBD | valentina@skyport.cl | Valentina Cruz | SkyPort Logistics | Customer | Demo seed |
| TBD | mateo@andeanventures.com | Mateo Silva | Andean Ventures | Prospect | Demo seed |

**Cascade deletions:**
- 6 conversations linked to these contacts
- 17 messages linked to those conversations
- Any tasks, tags, or events linked to these contacts

### Demo Users (webmed6_nwm.users)

| Email | Name | Role | Reason |
|-------|------|------|--------|
| admin@netwebmedia.com | NetWeb Admin | admin | Demo seed |
| demo@netwebmedia.com | Demo User | demo | Demo seed |

**Note:** These are api-php seed users, NOT CRM users. They live in a separate database.

### Test Newsletter Subs (webmed6_nwm.contacts)

| Email | Created | Reason |
|-------|---------|--------|
| %example.com% (any, from 2026-05-01) | Today | Launch test submissions |

**Status:** Currently not found in DB; may be created during Monday morning testing.

---

## 5. MANUAL STEPS FOR CARLOS

**Before running the migration:**

1. **Backup the databases** (recommended, though migrations are safe)
   ```bash
   mysqldump webmed6_crm > /tmp/crm_backup_2026_05_01.sql
   mysqldump webmed6_nwm > /tmp/nwm_backup_2026_05_01.sql
   ```

2. **Deploy the migration file**
   - Place `schema_2026_05_01_demo_cleanup.sql` in `crm-vanilla/api/`
   - Commit + push to main
   - GitHub Actions deploy-site-root.yml will auto-run migrations on the next deploy

3. **Verify cleanup**
   - After deploy, query the CRM to confirm:
     ```sql
     SELECT COUNT(*) FROM webmed6_crm.contacts WHERE email LIKE '%@latamgroup.com%' OR email LIKE '%@techwave.cl%';
     -- Should return 0
     
     SELECT COUNT(*) FROM webmed6_nwm.users WHERE email IN ('admin@netwebmedia.com', 'demo@netwebmedia.com');
     -- Should return 0
     ```

4. **Update seed data (optional, for future runs)**
   - Edit `api-php/migrate.php` to remove the `demo@netwebmedia.com` line if you want to disable this seed in the future.
   - Edit `crm-vanilla/api/schema_seed_conversations_v2.sql` to remove demo contact INSERTs if you want to disable this seed.
   - **Recommendation:** Keep the seed files intact; just ensure they only run ONCE (the `INSERT IGNORE` ensures idempotence).

---

## 6. SUMMARY

**Demo rows found:** 6 contacts + 6 conversations + 17 messages (CRM) + 2 users (API-PHP) = **31 rows total**

**Files inspected:**
- `crm-vanilla/api/schema.sql` (Carlos seed — KEEP)
- `crm-vanilla/api/schema_organizations.sql` (org bootstrap — KEEP)
- `crm-vanilla/api/schema_seed_conversations_v2.sql` (6 demo contacts/convos — DELETE)
- `crm-vanilla/api/schema_courses.sql` (15 courses + 10 lessons — KEEP, these are operational)
- `api-php/migrate.php` (2 demo users — DELETE)
- `crm-vanilla/js/data.js` (frontend mock — KEEP, not in DB)

**SQL migration files created:**
- `/c/Users/Usuario/Desktop/NetWebMedia/crm-vanilla/api/schema_2026_05_01_demo_cleanup.sql` (CRM cleanup)
- `/c/Users/Usuario/Desktop/NetWebMedia/api-php/schema_2026_05_01_demo_cleanup.sql` (API-PHP cleanup)

Both files are idempotent and auto-run on next deploy via `deploy-site-root.yml` GitHub Actions.

**Manual steps for Carlos:**
1. Commit both SQL files to main: `git add crm-vanilla/api/schema_2026_05_01_demo_cleanup.sql api-php/schema_2026_05_01_demo_cleanup.sql && git commit -m "cleanup: remove demo data pre-launch"`
2. Push to main: `git push origin main`
3. Wait for `deploy-site-root.yml` to complete
4. Verify cleanup post-deploy with:
   ```sql
   SELECT COUNT(*) FROM webmed6_crm.contacts WHERE email IN ('sofia@latamgroup.com', 'carlos@techwave.cl', 'isabella@greenleaf.com', 'diego@novalabs.io', 'valentina@skyport.cl', 'mateo@andeanventures.com');
   -- Should return 0
   
   SELECT COUNT(*) FROM webmed6_nwm.users WHERE email IN ('admin@netwebmedia.com', 'demo@netwebmedia.com');
   -- Should return 0
   ```

# Tenancy write-side patches — 2026-04-29

**Owner:** Engineering Lead
**Predecessor:** `plans/audits/security-pentest-2026-04-29.md`
**Status:** Code patched on `main`. Awaits one optional migration. Auto-save daemon will commit.

The pen-test concentrated the cross-tenant exposure into three patterns: writes that only checked tenancy on the read, INSERTs that trusted `X-Org-Slug` without membership verification, and token-gated routes that obeyed caller-supplied org context. All three are now closed.

---

## Files changed

| File | Lines added | Purpose |
|---|---|---|
| `crm-vanilla/api/lib/tenancy.php` | +56 | New helpers: `require_org_access_for_write()`, `pin_org_to_master()`. Resolver honours master-pin override. |
| `crm-vanilla/api/handlers/templates.php` | +30 | C1 — repeat tenancy clause on UPDATE/DELETE; block NULL-org writes for non-superadmin. |
| `crm-vanilla/api/handlers/contacts.php` | +3 | H2 — write-side membership check. |
| `crm-vanilla/api/handlers/deals.php` | +2 | H2. |
| `crm-vanilla/api/handlers/events.php` | +2 | H2. |
| `crm-vanilla/api/handlers/conversations.php` | +2 | H2. |
| `crm-vanilla/api/handlers/messages.php` | +18 | H1/H3 — derive `organization_id` from the parent conversation; verify writer membership. |
| `crm-vanilla/api/handlers/payments.php` | +14 | H2 + H4 — write-side check; per-org invoice numbering. |
| `crm-vanilla/api/handlers/campaigns.php` | +2 | H2. |
| `crm-vanilla/api/handlers/dedupe.php` | +5 | C2 — pin to master after token check. |
| `crm-vanilla/api/handlers/domain_audit.php` | +3 | C2. |
| `crm-vanilla/api/handlers/filter_identifiable.php` | +2 | C2. |
| `crm-vanilla/api/handlers/import_csv.php` | +3 | C2. |
| `crm-vanilla/api/handlers/import_best.php` | +3 | C2. |
| `crm-vanilla/api/handlers/seed.php` | +5 | C2 (no token historically — see followup). |
| `crm-vanilla/api/handlers/seed_templates.php` | +2 | C2. |
| `crm-vanilla/api/handlers/seed_client_templates.php` | +2 | C2. |
| `crm-vanilla/api/handlers/niche_config.php` | +2 | C2. |
| `crm-vanilla/api/schema_org_security_patch.sql` | new | Index for per-org invoice number scan. |

Total: 18 files touched, ~150 LOC delta, 1 new SQL file.

---

## Bug fixes — before / after

### C1 — `templates.php` PUT/DELETE missing tenancy clause

**Before** (line 154, write was unscoped after read-only ownership check):
```php
$db->prepare('UPDATE email_templates SET ' . implode(', ', $fields) . ' WHERE id = ?')
   ->execute($params);
```

**After:**
```php
if (!$isSuper && $rowOrg === null) {
    jsonError('System templates are read-only', 403);
}
$updSql = 'UPDATE email_templates SET ' . implode(', ', $fields) . ' WHERE id = ?';
if ($tWhere && $orgId !== null && !$isSuper) {
    $updSql .= ' AND ' . $tWhere;
    $params = array_merge($params, $tParams);
}
$db->prepare($updSql)->execute($params);
```
Same pattern applied to DELETE. NULL-org system templates are now read-only to non-superadmin sessions, and even if a non-superadmin somehow held a row id, the write is re-scoped to the active org.

### H2 / C critical — INSERTs trusted `X-Org-Slug`

**Before** (`contacts.php:51`, mirrored across deals/events/conversations/messages/payments/campaigns):
```php
case 'POST':
    $data = getInput();
    if (empty($data['name'])) jsonError('Name is required');
    if ($orgId !== null) { /* INSERT … organization_id = $orgId */ }
```

**After:**
```php
case 'POST':
    require_org_access_for_write('member');
    $data = getInput();
    …
```

`require_org_access_for_write()` (added to `lib/tenancy.php`) is a no-op when org schema is not yet applied, when no org could be resolved, or when the caller is unauthenticated (demo path). For authenticated requests it calls `require_org_access(current_org_id(), 'member')` which 403s if the user is not a member of the resolved org. Master-org owners/admins remain virtual admins everywhere via `org_role()`.

### C2 — Token-gated handlers honour caller org context

**Before** (`dedupe.php`, similar in 7 sibling files):
```php
if (!hash_equals(DEDUPE_TOKEN, …)) jsonError('Invalid token', 403);
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); } // uses X-Org-Slug
```

**After:**
```php
if (!hash_equals(DEDUPE_TOKEN, …)) jsonError('Invalid token', 403);
pin_org_to_master(); // strip X-Org-Slug, force session_org=1
[$ow, $owp] = org_where(); // now scoped to master
```

`pin_org_to_master()` sets a request-scoped `$GLOBALS['__nwm_org_pinned_master']` flag that the modified `org_from_request()` checks first, unconditionally returning the master org row. It also unsets `$_SERVER['HTTP_X_ORG_SLUG']` and writes `nwm_org_id = 1` into the session for any code path that reads either directly. Effect: a leaked dedupe/seed/import token combined with `X-Org-Slug: acme` is no longer a one-shot data-deletion weapon against a specific paying org.

### H1 / H3 — `messages.php` POST stamped org from request, not parent

**Before** (`messages.php:41`):
```php
$stmt = $db->prepare('INSERT INTO messages (organization_id, conversation_id, sender, body) VALUES (?, ?, ?, ?)');
$stmt->execute([$orgId, $convId, $sender, $body]); // $orgId from current_org_id()
```

**After:**
```php
$cstmt = $db->prepare('SELECT organization_id FROM conversations WHERE id = ?');
$cstmt->execute([$convId]);
$convOrgId = (int)$cstmt->fetchColumn();
if ($u && !empty($u['id'])) require_org_access($convOrgId, 'member');
$stmt = $db->prepare('INSERT INTO messages (organization_id, conversation_id, sender, body) VALUES (?, ?, ?, ?)');
$stmt->execute([$convOrgId, $convId, $sender, $body]);
```
The conversation row is the source of truth. Fragile coupling between read-side scoping and write-side stamping is gone.

### H4 — `payments.php` global invoice numbers

**Before** (`payments.php:95`):
```php
$count = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
$num   = 'INV-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
```

**After:**
```php
if ($orgId !== null) {
    $maxStmt = $db->prepare(
        "SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(invoice_num, '-', -1) AS UNSIGNED)), 0)
         FROM invoices WHERE organization_id = ?"
    );
    $maxStmt->execute([$orgId]);
    $next = ((int)$maxStmt->fetchColumn()) + 1;
} else {
    $count = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
    $next  = $count + 1;
}
$num = 'INV-' . str_pad((string)$next, 3, '0', STR_PAD_LEFT);
```
Two paying orgs creating invoices simultaneously can now both correctly emit `INV-001`, `INV-002`, … from their own zero. No leakage of NetWebMedia's overall invoice volume.

---

## Migration SQL — `crm-vanilla/api/schema_org_security_patch.sql`

```sql
USE `webmed6_crm`;

-- Per-org invoice numbering (audit H4): composite index makes
-- "MAX(SUBSTRING_INDEX(invoice_num,'-',-1)) WHERE organization_id = ?" a fast
-- index-range scan instead of a full table scan.
ALTER TABLE `invoices`
    ADD KEY `idx_org_invoice_num` (`organization_id`, `invoice_num`);
```
Idempotent — `ER_DUP_KEYNAME` (1061) is in the migrate runner's skip list. Apply via:
```
POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=org_security_patch
```

The PHP works without this index (the `MAX()` query just costs a full scan on `invoices`, which is small today); apply when convenient, not blocking.

---

## Verification curls

Run after deploy. Replace `acme` with a real sub-org slug once one exists; until then the H2 tests pass trivially because no sub-orgs are provisioned, and the pin tests pass because master is the only resolvable org.

```bash
# C1 — non-superadmin cannot rewrite a NULL-org system template (expect 403/404)
curl -X PUT -H "Cookie: PHPSESSID=<sub-account-session>" \
     -H "Content-Type: application/json" \
     -d '{"subject":"PWNED"}' \
     "https://app.netwebmedia.com/api/?r=templates&id=<system-template-id>"

# H2 — authenticated user cannot write into another org via X-Org-Slug (expect 403)
curl -X POST -H "Cookie: PHPSESSID=<user-of-master>" \
     -H "X-Org-Slug: acme" \
     -H "Content-Type: application/json" \
     -d '{"name":"cross-org test"}' \
     "https://app.netwebmedia.com/api/?r=contacts"

# C2 — token + X-Org-Slug must NOT scope to acme (expect master-scoped result)
curl -X POST -H "X-Org-Slug: acme" \
     "https://app.netwebmedia.com/api/?r=dedupe&token=<DEDUPE_TOKEN>&dry_run=1"
# response.total_before should equal master count, not acme count

# H4 — first invoice for a fresh org begins at INV-001
curl -X POST -H "Cookie: PHPSESSID=<acme-owner-session>" \
     -H "Content-Type: application/json" \
     -d '{"client_name":"Test","amount":100}' \
     "https://app.netwebmedia.com/api/?r=payments"
# response.invoice_num == "INV-001"

# Smoke — existing master flows still work (regression check)
curl -X POST -H "Cookie: PHPSESSID=<master-session>" \
     -H "Content-Type: application/json" \
     -d '{"name":"sanity"}' \
     "https://app.netwebmedia.com/api/?r=contacts"
# 201, normal contact row
```

---

## Followup security work — noticed but NOT done

1. **`seed.php` has no token check.** Audit names it among the "token-gated" group, but the file itself only requires POST. I added the `pin_org_to_master()` call so a future token-less hit cannot scope to a sub-org, but the route should still be token-gated. Carlos: add `if (!hash_equals(SEED_TOKEN, …)) jsonError('Invalid token', 403);` or remove the file from production. Tracking issue worth opening.

2. **C3 — master-elevation audit log.** The pen-test (C3) called for `audit_log` writes whenever a master-org admin's session writes into a sub-org. Out of scope for this patch (no audit log table yet); needs schema + handler instrumentation.

3. **`org_from_request()` resolution order.** Header > session > host means a sub-account user in org A can intentionally pass `X-Org-Slug: B` to "look at" org B. With the write-side check now in place, they cannot WRITE there. They also cannot READ rows (org_where scopes the SELECT to B, which they're not a member of, so the SELECT returns empty). But the current behaviour is: silent empty result. Consider 403 on resolution when membership is absent — louder, easier to debug.

4. **`messages.php` — Twilio outbound uses request-scoped credentials.** When the conversation's org differs from `current_org_id()`, the Twilio config loaded for the message send is still scoped via host/session, not from the conversation's org. Defence-in-depth fix: thread `$convOrgId` through to `twilio_send()`. Low priority — would only matter if a user impersonates a slug AND the conversation belongs to a different org AND that org has its own Twilio creds.

5. **Token rotation policy.** Five tokens (`MIGRATE`, `SEED`, `DEDUPE`, `IMPORT_CSV`, `IMPORT_BEST`, `FILTER_ID`) are still rotated manually. Worth a `.env` lifecycle policy with monthly rotation, especially now that they're master-pinned and therefore platform-wide.

6. **`is_org_schema_applied()` cache invalidation.** Per-PHP-FPM cache. Edge case noted in audit (M5). Acceptable for steady-state, but if we ever need to roll back a migration, plan a worker recycle.

---

**Bottom line:** C1, C2, H2, H3, H4 closed. White-label go-to-market unblocked. Apply the optional index migration when convenient, run the curls in production after deploy, and open tickets for the five followup items.

# NWM Lead Capture Pipeline — QA Test Report
**Date:** 2026-04-28  
**Tester:** QA Agent (automated)  
**Scope:** End-to-end form submission pipeline at https://netwebmedia.com

---

## Executive Summary

**CRITICAL FAILURE:** `submit.php` returns HTTP 500 on every request method (GET, POST, OPTIONS). No leads are being captured through the main form pipeline. The companion `audit-submit.php` is healthy, confirming PHP execution works on the server — the failure is isolated to `submit.php`. The security guard on the log file (403) and the redirect destination pages are both functioning correctly.

**Overall result: FAIL — pipeline is down**

---

## Test Results

### Step 1 — Contact Form Submission (POST to submit.php)

| Field | Value |
|---|---|
| name | QA Test Lead |
| email | qa-test@netwebmedia.com |
| company | Test Company LLC |
| phone | +1 555 000 0001 |
| website | https://testcompany.com |
| message | This is an automated QA test. Please ignore. |
| source | law-firms-lp |
| utm_source | qa-test |
| utm_campaign | 202504-qa-pipeline-test |
| utm_content | TOKEN_QA_001 |

**Expected:** HTTP 303 redirect to `https://law-firms.netwebmedia.com/thanks.html`  
**Actual:** HTTP 500 Internal Server Error — empty body (Content-Length: 0)  
**Result: FAIL**

**Error detail:**  
```
HTTP/1.1 500 Internal Server Error
Content-Type: text/html; charset=UTF-8
Content-Length: 0
Server: Apache
```
The response has zero body content, indicating PHP crashed before producing any output. This rules out application-level errors (which would output JSON via the `fail()` helper). The crash occurs at PHP engine level — before the request-method guard on line 37 is reached.

**Diagnostic findings:**
- `audit-submit.php` at the same host returns HTTP 422 with JSON body on an equivalent minimal POST — confirming PHP 7.4 (ea-php74) is running and the server is healthy.
- The same 500 is returned on GET and OPTIONS — ruling out POST-specific ModSecurity rules.
- File was confirmed deployed: GitHub Actions FTP-Deploy-Action reported "File content is the same, doing nothing: submit.php" on run 25068646317 (2026-04-28 17:45 UTC), meaning the current repo version matches what's live.
- No BOM detected in the file. UTF-8 characters (em-dashes) appear only in PHP comments, not in syntax.
- Heredoc closing markers (`BODY;`, `HTML;`) are at column 0 — valid PHP 7.4 syntax.

**Most likely root cause:** PHP `open_basedir` restriction on the InMotion shared hosting account. `submit.php` references `dirname(__DIR__)` (line 22) to place the log file one level above the webroot (`/home/webmed6/submit-leads.log`). If `open_basedir` is set to `/home/webmed6/public_html` (common on shared InMotion plans), PHP may throw a fatal error on the `dirname(__DIR__)` path evaluation or on `file_put_contents()` — even though the call is wrapped with `@` suppression. Unlike a runtime warning, an `open_basedir` violation during path resolution can crash the script before `@` suppression takes effect in some PHP 7.4 builds.

**Recommended fix:** Change `$LOG_FILE` back to `__DIR__ . '/submit-leads.log'` (inside webroot) and protect the file via `.htaccess` (already in place: `<FilesMatch "\.log$">Deny from all</FilesMatch>`). Alternatively, use `/home/webmed6/tmp/submit-leads.log` and verify the path is within the `open_basedir` whitelist in cPanel.

---

### Step 2 — Log File Verification

**Old path (webroot):** `C:\Users\Usuario\Desktop\NetWebMedia\submit-leads.log`  
**Exists:** NO  
**New path (parent dir):** `C:\Users\Usuario\Desktop\submit-leads.log`  
**Exists:** NO  

**Expected:** Log entry present with `utm_source=qa-test`  
**Actual:** Log file does not exist at either path — no entries written  
**Result: FAIL** (direct consequence of Step 1 failure; no successful submission to log)

---

### Step 3a — Industry LP Form: Healthcare

| Field | Value |
|---|---|
| source | healthcare-lp |
| utm_campaign | 202504-qa-health |
| Referer | https://healthcare.netwebmedia.com/ |

**Expected:** HTTP 303 redirect to `https://healthcare.netwebmedia.com/thanks.html`  
**Actual:** HTTP 500 Internal Server Error — empty body  
**Result: FAIL** (same root cause as Step 1)

---

### Step 3b — Industry LP Form: Restaurants

| Field | Value |
|---|---|
| source | restaurants-lp |
| utm_campaign | 202504-qa-restaurants |
| Referer | https://restaurants.netwebmedia.com/ |

**Expected:** HTTP 303 redirect to `https://restaurants.netwebmedia.com/thanks.html`  
**Actual:** HTTP 500 Internal Server Error — empty body  
**Result: FAIL** (same root cause as Step 1)

---

### Step 4 — Security Check: Public Accessibility of Log File

**URL tested:** `https://netwebmedia.com/submit-leads.log`  
**Expected:** HTTP 403 Forbidden (blocked by `.htaccess` `<FilesMatch "\.log$">`)  
**Actual:** HTTP 403 Forbidden  
**Result: PASS**

The `.htaccess` block is working correctly:
```apache
<FilesMatch "\.log$">
  Order allow,deny
  Deny from all
</FilesMatch>
```

---

### Step 5 — Redirect URL Verification (Code Review)

Since `submit.php` cannot be executed (Step 1 failure), redirect logic was verified by static code analysis of the deployed `submit.php`.

**Source: `law-firms-lp` with Referer from subdomain (`law-firms.netwebmedia.com`)**  
- Source normalization: `"law-firms-lp"` → strip `-lp` → `"law-firms"` → slug `"law-firms"`  
- Redirect target: `https://law-firms.netwebmedia.com/thanks.html`  
- URL reachable: YES — HTTP 200 (wildcard subdomain routes to root, `/thanks.html` exists)  
- Page title: "Thanks — Your NetWebMedia Audit Request Is In"  
- **Logic: CORRECT** — but untestable live due to Step 1 failure

**Note on `law-firms` subdomain routing:**  
`law-firms.netwebmedia.com` is NOT mapped in `.htaccess` (the wildcard cPanel subdomain points at `public_html/` but no `RewriteCond` for `law-firms` exists). The subdomain therefore serves the root docroot directly. `thanks.html` at the root is found, so the redirect resolves to a valid page. However, it serves the generic `/thanks.html` rather than a law-firms-specific page — this is a routing gap to address when the law-firms industry LP is built out.

**Source: `contact-lp` or any source with Referer from `netwebmedia.com`**  
- Redirect target: `https://netwebmedia.com/audit-thanks.html`  
- URL reachable: YES — HTTP 200  
- Page title: "Got it. Your audit is being built."  
- **Logic: CORRECT**

---

## Summary Table

| # | Test | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | POST submit.php (contact form, law-firms-lp) | HTTP 303 redirect | HTTP 500 Empty | **FAIL** |
| 2a | Log file exists at webroot | File present with UTM entry | File absent | **FAIL** |
| 2b | Log file exists at parent dir | File present with UTM entry | File absent | **FAIL** |
| 3a | POST submit.php (healthcare-lp) | HTTP 303 redirect | HTTP 500 Empty | **FAIL** |
| 3b | POST submit.php (restaurants-lp) | HTTP 303 redirect | HTTP 500 Empty | **FAIL** |
| 4 | GET /submit-leads.log (security) | HTTP 403 | HTTP 403 | **PASS** |
| 5a | Redirect: law-firms source → subdomain thanks | https://law-firms.netwebmedia.com/thanks.html (200) | Logic correct (code verified); destination 200 OK | **PASS (code)** |
| 5b | Redirect: root referer → /audit-thanks.html | https://netwebmedia.com/audit-thanks.html (200) | HTTP 200, correct page | **PASS** |

---

## Action Items (Priority Order)

1. **[CRITICAL — P0]** Fix `submit.php` — change `$LOG_FILE` path from `dirname(__DIR__)` to `__DIR__` (or a verified `open_basedir`-safe path). Log file at webroot is protected by `.htaccess` 403 rule already in place.
2. **[HIGH — P1]** After fix, run a live form submission test and confirm: HTTP 303 received, log entry appears, email received at `hello@netwebmedia.com`, auto-reply received at lead email.
3. **[MEDIUM — P2]** Add `law-firms.netwebmedia.com` → `/industries/professional-services/legal/` mapping in `.htaccess` (or create dedicated industry folder) so the thanks redirect lands on a branded page, not the generic root.
4. **[LOW — P3]** Add `submit.php` to the GitHub Actions smoke-test suite (POST probe with minimal valid payload) so future regressions are caught at deploy time.

---

*Report generated by automated QA agent — 2026-04-28*

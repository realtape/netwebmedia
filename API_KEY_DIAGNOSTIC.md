# API Key Configuration Diagnostic

## Issue
Web chat test harness fails with: `"I hit a technical issue just now"` (fallback message from `ai.php` line 22)
This indicates `ai_anthropic_key()` returns empty string.

## Root Cause Analysis

### Config Flow (from `api-php/lib/db.php`)
1. **Primary source:** `/home/webmed6/.netwebmedia-config.php` (on cPanel, outside repo)
2. **Secondary source:** `api-php/config.local.php` (generated at deploy time from GitHub Actions secrets)
3. **Merge rule:** For rotatable keys (including `anthropic_api_key`), `config.local.php` **wins** if non-empty

### Where the Key is Generated
- File: `.github/workflows/deploy-site-root.yml`
- Lines 167-226: Generate `api-php/config.local.php` from GitHub Secrets
- Line 274: `SECRET_ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}`
- Python substitution (line 205): Replaces `ANTHROPIC_API_KEY_PLACEHOLDER` with secret value

### How It Reaches Production
1. Deploy runs `deploy-site-root.yml` on push to `main` (if `api-php/**` files changed)
2. Python script materializes secrets from `${{ secrets.ANTHROPIC_API_KEY }}`
3. `api-php/config.local.php` is uploaded via FTPS to `/public_html/api-php/`
4. On each API request, `config()` merges: home file + local file, local wins for rotatable keys

## Verification Checklist

### Step 1: Verify GitHub Actions Secret Exists
- [ ] Go to: `https://github.com/NetWebMedia/netwebmedia/settings/secrets/actions`
- [ ] Look for secret named: `ANTHROPIC_API_KEY`
- [ ] If missing: You must add it (can only be done by repo admin)

### Step 2: Verify Deployment Completed Successfully
- [ ] Check: `https://github.com/NetWebMedia/netwebmedia/actions/workflows/deploy-site-root.yml`
- [ ] Find the most recent run on `main` branch
- [ ] Click run → scroll to "Generate api-php/config.local.php from secrets" step
- [ ] Look for output line: `config.local.php materialized`
- [ ] If missing or failed: Check step details for error messages

### Step 3: Verify Production File Exists
Once deployment completes, the file should be at:
- Production path: `/public_html/api-php/config.local.php`
- This file is NOT in the repo (it's .gitignored) — it only exists after deploy

### Step 4: Test and Verify
If all checks pass, re-run the test harness:
```bash
node test-chatbot.js
# Should now show questions passing instead of API errors
```

## If Secret is Missing

To add the `ANTHROPIC_API_KEY` secret to GitHub Actions:

1. Navigate to: `https://github.com/NetWebMedia/netwebmedia/settings/secrets/actions`
2. Click: "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: (paste the Anthropic API key from your account)
5. Click: "Add secret"
6. **Trigger a deploy** by pushing any change to `api-php/**` (e.g., make a trivial edit and commit)
   - OR manually trigger: Actions → deploy-site-root → Run workflow → Run workflow

## If Deployment Succeeded but Key Still Empty

Possible causes:
1. The secret value is empty/whitespace — GitHub Actions will substitute it as empty string
2. The deploy happened before the secret was added — need to re-deploy after adding secret
3. There's a stale cPanel environment variable shadowing the value — contact InMotion support

## Next Steps (Immediate)

1. **Verify secret exists** in GitHub Actions (`Step 1` above)
2. **Verify recent deployment** succeeded with "config.local.php materialized"
3. **If secret is missing:** Add it and trigger a re-deploy
4. **If deployment succeeded:** Check cPanel directly or contact InMotion support
5. **Re-run tests** after verification:
   ```bash
   node test-chatbot.js              # should now pass most questions
   TWILIO_TOKEN=<token> node test-whatsapp.js  # once token obtained
   ```

## Related Files
- `api-php/lib/db.php` (lines 22-74): Config merge logic
- `.github/workflows/deploy-site-root.yml` (lines 167-293): Secret injection at deploy time
- `api-php/routes/ai.php` (lines 14-23): API key retrieval function
- `TEST_RESULTS_SUMMARY.md`: Test harness documentation with usage examples

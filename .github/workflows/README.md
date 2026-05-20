# GitHub Actions — deploy pipelines

Three workflows, each scoped to a different part of the site. All use FTPS via
`SamKirkland/FTP-Deploy-Action` (incremental sync by hash — safe to re-run).

| Workflow | Triggers on changes to | Deploys to | FTP user secret |
|---|---|---|---|
| `deploy-site-root.yml` | root HTMLs, `css/`, `js/`, `tutorials/`, `crm-demo/`, `cms-demo/`, `api-php/` | `/public_html/` | `CPANEL_FTP_ROOT_USER` |
| `deploy-crm.yml`       | `crm-vanilla/**`                   | `/public_html/crm-vanilla/` (via companies-scoped user) | `CPANEL_FTP_USER` |
| `deploy-companies.yml` | `_deploy/companies/**`             | `/public_html/companies/` | `CPANEL_FTP_USER` |

**If you only have `CPANEL_FTP_USER` set up (scoped to `/public_html/companies/`),
then `deploy-site-root.yml` won't run.** Follow the one-time setup in that
workflow's header comment to create a second FTP account scoped to `/public_html/`.

---

## `deploy-companies.yml`

Publishes `_deploy/companies/**` (680 per-company social + digital audit pages)
to `https://netwebmedia.com/companies/**` via FTPS on push to `main`.

### One-time setup

1. **Create a dedicated FTP account in cPanel** (recommended over using the main `webmed6` user):
   - cPanel → **FTP Accounts** → create account
   - Login: `deploy@netwebmedia.com`
   - Directory: `/public_html/companies` (this scopes the credential)
   - Quota: unlimited
   - Save the generated password

2. **Add the 3 secrets to GitHub:**
   Repo → **Settings → Secrets and variables → Actions → New repository secret**

   | Name | Value |
   |---|---|
   | `CPANEL_FTP_HOST` | `ftp.netwebmedia.com` (or `secure345.servconfig.com` if that fails) |
   | `CPANEL_FTP_USER` | `deploy@netwebmedia.com` |
   | `CPANEL_FTP_PASSWORD` | password from step 1 |

3. **First run — manual dispatch (dry-run) to sanity-check file counts:**
   Actions tab → *Deploy company prospect pages* → **Run workflow** → check
   `dry_run` → Run. It lists file counts per city but does not touch the server.

4. **Real deploy — push the companies folder:**
   ```bash
   git add _deploy/companies .github/workflows/deploy-companies.yml
   git commit -m "Add 680 per-company audit pages + FTPS deploy workflow"
   git push origin main
   ```
   The workflow triggers, uploads ~680 files, then smoke-tests three URLs.

### What the workflow does

- Triggers on: push to `main` touching `_deploy/companies/**` OR manual dispatch
- Uses: `SamKirkland/FTP-Deploy-Action@v4.3.5` (incremental sync by hash, skips
  unchanged files on re-run — safe to run repeatedly)
- Uploads to: `./` on the scoped FTP account (which is chrooted to `/public_html/companies/`) → served at `https://netwebmedia.com/companies/`
- Smoke tests: `/companies/index.html`, one Santiago page, one Coyhaique page — fails build if any returns non-200

### Why FTPS, not SFTP?

cPanel shared hosts (like `secure345.servconfig.com`) typically expose FTPS
on port 21 with explicit TLS but not SFTP (port 22) unless shell access is
specifically provisioned. If FTPS fails with a TLS handshake error, try:
- Set `protocol: ftp` and `port: 21` (plaintext — not recommended but works)
- Or upgrade the cPanel account for SSH/SFTP access

### Troubleshooting

**"Can't connect: 530 Login incorrect"** → wrong user/password, or IP blocked.
cPanel often has brute-force protection; add the GitHub Actions IP ranges to
the allow list, or use the dedicated FTP account from step 1 (usually exempt).

**"421 Too many connections"** → the shared host rate-limits. The action uses
a single connection by default, so if you see this, retry the workflow.

**Smoke test returns 404** → files uploaded but to wrong dir. Verify
`server-dir` in the YAML matches where `public_html` is on your account.

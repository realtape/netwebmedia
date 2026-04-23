# Always deploy NetWebMedia with InMotion Hosting

Carlos's instruction (2026-04-23): **always deploy with InMotion hosting**.

## What this means operationally

- **netwebmedia.com** and all subdomains (`*.netwebmedia.com`) are hosted on cPanel at InMotion Hosting.
- **Do NOT suggest Vercel, Netlify, Cloudflare Pages, AWS, or any other host** as an alternative for NetWebMedia properties. That decision is settled.
- Deployment mechanism: **GitHub Actions FTPS** from the `netwebmedia/netwebmedia` repo → cPanel `/public_html/` via the `deploy-root@netwebmedia.com` FTP account.
- The workflow is `.github/workflows/deploy-site-root.yml`. Triggered on push to `main` when matching paths change.
- cPanel backend is InMotion's shared/VPS — ModSecurity is active (hence the `-A "Mozilla/…"` user-agent requirement in any smoke tests; bare `curl` gets 406'd).
- Subdomain routing uses **wildcard DNS + wildcard cPanel subdomain + `.htaccess` `HTTP_HOST` rewrites** — not per-subdomain cPanel entries, and not Vercel project aliases.
- FTP host: `ftp.netwebmedia.com`. Server IP: `192.145.235.82`.

## Exception

Client sites (e.g., DYADLaw) have their own hosts — DYAD runs on Vercel. This rule only applies to NetWebMedia-owned properties (netwebmedia.com + subdomains, companies.netwebmedia.com, the CRM/CMS demos, etc.).

## When adding new content that should deploy

Every path must be on the `paths:` trigger allowlist AND in the `Stage site-root files` directory/file allowlist in `deploy-site-root.yml`. Adding files without patching both lists is a silent deploy-gap — the push succeeds but nothing goes live.

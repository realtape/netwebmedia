# Permanent FB Token Fix — Meta System User Token (free, never expires)

**Problem this solves:** FB Page tokens from Graph API Explorer are short-lived
(~1 hour) or long-lived (~60 days). They keep expiring and blocking
`fb_publish.php` + the campaign mirror. A **System User token** from Business
Manager **never expires**. One-time setup, $0.

---

## The 6-click manual part (only you can do this — it's your Meta account)

1. Go to **Business Settings**: https://business.facebook.com/settings
   - Make sure the top-left business is **NetWebMedia** (not a personal profile).
   - If you don't have a Business Portfolio yet: https://business.facebook.com/ →
     "Create a business portfolio" (free, 2 min) → add the NetWebmedia Page to it.

2. Left sidebar → **Users → System Users** → click **Add**
   - Name: `nwm-publisher`
   - Role: **Admin**  → Create.

3. Select `nwm-publisher` → **Assign Assets** → **Pages** → pick **NetWebmedia**
   → toggle **Full control (Manage)** → Save Changes.

4. With `nwm-publisher` still selected → **Generate New Token**
   - App: select your NetWebMedia app (or any app in the portfolio)
   - **Token expiration: Never**  ← the whole point
   - Scopes — tick exactly these:
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_posts`
   - (optional, for IG-via-Graph later: `instagram_basic`, `instagram_content_publish`)
   - Generate Token.

5. **Copy the token** (it starts with `EAA…`). This is shown ONCE — copy it now.

6. Paste it to Claude in chat, or run locally:
   ```cmd
   set FB_SYSTEM_TOKEN=EAA...paste-here...
   python scripts\fb_mirror\install_system_token.py
   ```

---

## What happens automatically after you paste

`install_system_token.py`:
- Validates the token is **type SYSTEM_USER** and **expires_at = 0** (never).
  If you accidentally made an expiring one, it tells you and stops — no silent
  half-fix.
- Resolves the NetWebmedia Page token, confirms *it* also never expires.
- Writes `FB_PAGE_TOKEN` to GitHub Secrets.
- Triggers a deploy so `crm-vanilla/api/config.local.php` +
  `api-php/config.local.php` pick it up (≈4 min).

Then the 8 queued campaign reels go live on the FB Page:
```cmd
python scripts\fb_mirror\fb_mirror_systoken.py
```
(Schedules Reel E, MVP A/B/C, Stats EN/ES, Reels D/F across Wed May 13 +
Thu May 14, FB-anti-spam-safe spacing.)

---

## Why this is the right fix (not the App Secret route)

| Approach | Lifetime | Setup | Renewal |
|---|---|---|---|
| Graph Explorer user token | ~1 hour | 30 sec | every hour ❌ |
| Long-lived (App Secret exchange) | ~60 days | medium | every 60 days ⚠️ |
| **System User token** | **never** | **6 clicks, once** | **never ✅** |

After this, `fb_publish.php` and every future campaign mirror just work.
No token step ever again unless you manually revoke the System User.

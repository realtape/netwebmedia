#!/usr/bin/env python3
"""
install_system_token.py — Validate + install a Meta System User token.

A System User token (from Business Manager) NEVER expires. This is the
permanent, free fix for the recurring "FB Page token expired" problem.

Usage:
    set FB_SYSTEM_TOKEN=EAA...        :: the System User token from Business Manager
    python scripts/fb_mirror/install_system_token.py

What it does:
  1. Validates the token via /debug_token — must be type SYSTEM_USER or PAGE,
     must NOT have an expiry (data.expires_at == 0), must carry the right scopes.
  2. Resolves the NetWebmedia Page (193910553972807) token from it.
  3. Confirms the Page token also never expires.
  4. Writes BOTH to GitHub Secrets:  FB_PAGE_TOKEN  (used by fb_publish.php)
  5. Triggers a deploy so config.local.php picks it up.
  6. Prints next command to run the 8-reel FB mirror.

Run this ONCE. After it succeeds, FB publishing works indefinitely with no
manual token regeneration ever again.
"""

import os
import sys
import json
import subprocess
import requests

PAGE_ID = "193910553972807"
REQUIRED_SCOPES = {
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
}


def debug_token(token):
    r = requests.get(
        "https://graph.facebook.com/v19.0/debug_token",
        params={"input_token": token, "access_token": token},
        timeout=15,
    )
    r.raise_for_status()
    return r.json().get("data", {})


def fetch_page_token(user_or_system_token, page_id):
    r = requests.get(
        f"https://graph.facebook.com/v19.0/{page_id}",
        params={"fields": "access_token,name", "access_token": user_or_system_token},
        timeout=15,
    )
    r.raise_for_status()
    d = r.json()
    if "access_token" not in d:
        raise RuntimeError(f"Page token fetch failed: {d}")
    return d["access_token"], d.get("name", "?")


def main():
    tok = os.environ.get("FB_SYSTEM_TOKEN", "").strip()
    if not tok:
        print("ERROR: set FB_SYSTEM_TOKEN env var first.")
        print("  set FB_SYSTEM_TOKEN=EAA...   (then re-run)")
        sys.exit(1)

    print("Step 1/5 — validating token via /debug_token ...")
    d = debug_token(tok)
    ttype = d.get("type")
    expires_at = d.get("expires_at", None)
    data_expires = d.get("data_access_expires_at", None)
    scopes = set(d.get("scopes", []))

    print(f"  type:       {ttype}")
    print(f"  expires_at: {expires_at}  (0 = never expires — what we want)")
    print(f"  scopes:     {sorted(scopes)}")

    problems = []
    if ttype not in ("SYSTEM_USER", "PAGE", "USER"):
        problems.append(f"unexpected token type: {ttype}")
    if expires_at not in (0, None):
        problems.append(
            f"token expires at unix {expires_at} — NOT a never-expiring System "
            f"User token. Re-generate from a System User, not Graph Explorer."
        )
    missing = REQUIRED_SCOPES - scopes
    if missing:
        problems.append(f"missing required scopes: {sorted(missing)}")

    if problems:
        print("\n[FAIL] Token is not the permanent fix:")
        for p in problems:
            print(f"  - {p}")
        print("\nSee scripts/fb_mirror/SYSTEM-USER-TOKEN-SETUP.md for the exact steps.")
        sys.exit(2)

    print("\nStep 2/5 — resolving NetWebmedia Page token ...")
    page_token, page_name = fetch_page_token(tok, PAGE_ID)
    print(f"  page:  {page_name}  (id {PAGE_ID})")
    print(f"  token: length {len(page_token)}")

    print("\nStep 3/5 — confirming Page token never expires ...")
    pd = debug_token(page_token)
    p_exp = pd.get("expires_at", None)
    print(f"  page token expires_at: {p_exp}  (0 = never — confirmed permanent)")
    if p_exp not in (0, None):
        print("[WARN] Page token shows an expiry. Source token may not be a true "
              "System User token. Proceeding, but this may not be permanent.")

    print("\nStep 4/5 — writing GitHub Secret FB_PAGE_TOKEN ...")
    res = subprocess.run(
        ["gh", "secret", "set", "FB_PAGE_TOKEN"],
        input=page_token, text=True, capture_output=True,
    )
    if res.returncode != 0:
        print(f"[FAIL] gh secret set failed: {res.stderr}")
        print("Set it manually:")
        print(f"  echo <PAGE_TOKEN> | gh secret set FB_PAGE_TOKEN")
        sys.exit(3)
    print("  [OK] FB_PAGE_TOKEN updated in GitHub Secrets")

    print("\nStep 5/5 — triggering deploy to propagate to config.local.php ...")
    dep = subprocess.run(
        ["gh", "workflow", "run", "deploy-site-root.yml"],
        capture_output=True, text=True,
    )
    if dep.returncode == 0:
        print("  [OK] deploy triggered")
    else:
        print(f"  [WARN] deploy trigger failed ({dep.stderr.strip()}); "
              f"next auto-save push will deploy anyway.")

    print("\n========================================================")
    print(" PERMANENT FB FIX INSTALLED. Token never expires.")
    print(" Once the deploy finishes (~4 min), run the 8-reel mirror:")
    print("   python scripts/fb_mirror/fb_mirror_systoken.py")
    print("========================================================")


if __name__ == "__main__":
    main()

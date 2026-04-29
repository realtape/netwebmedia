"""
Connect NetWebMedia YouTube channel to CRM.

Runs OAuth flow with the existing trulia-chile client_secrets.json,
then extracts the credentials needed for the NetWeb CRM Social Planner.

When the browser opens, choose carlos@netwebmedia.com → @NetWebMedia channel → Allow.
"""
import json
import os
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Reuse the working trulia-chile OAuth client (already has YT Data API enabled)
CLIENT_SECRETS = Path(r"C:\Users\Usuario\Documents\Claude\Projects\realiracing\social\youtube_shorts\client_secrets.json")
OUT_PATH = Path(r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\nwm_yt_token.json")

# We need yt.upload + yt for the CRM social.php publishing flow
SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]


def main():
    if not CLIENT_SECRETS.exists():
        sys.exit(f"client_secrets.json not found at {CLIENT_SECRETS}")

    print("\n=== NetWebMedia YouTube OAuth ===")
    print("A browser will open. Select carlos@netwebmedia.com,")
    print("pick the NetWebMedia / @netwebmedia channel, then click Allow.\n")

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES)
    creds = flow.run_local_server(port=0, prompt="select_account")

    # Read client_id + client_secret from the original file (needed for CRM refresh)
    with open(CLIENT_SECRETS) as f:
        cs = json.load(f)
    inst = cs.get("installed") or cs.get("web") or {}
    client_id = inst["client_id"]
    client_secret = inst["client_secret"]

    # Get channel info to confirm + grab channel_id
    yt = build("youtube", "v3", credentials=creds)
    chan = yt.channels().list(part="id,snippet", mine=True).execute()
    items = chan.get("items", [])
    if not items:
        sys.exit("No channel found for the authorized account. Did you pick the right channel?")
    channel = items[0]
    channel_id = channel["id"]
    channel_title = channel["snippet"]["title"]

    print(f"\n[OK] Authorized channel: {channel_title}  ({channel_id})")

    # Build the credential bundle in the format the CRM expects
    out = {
        "yt_channel_id":    channel_id,
        "yt_client_id":     client_id,
        "yt_client_secret": client_secret,
        "yt_access_token":  creds.token,
        "yt_refresh_token": creds.refresh_token,
        # Extra metadata
        "_channel_title":   channel_title,
        "_scopes":          list(creds.scopes) if creds.scopes else SCOPES,
    }
    OUT_PATH.write_text(json.dumps(out, indent=2))
    print(f"[OK] Credentials saved to {OUT_PATH}")
    print("\n=== Next: Carlos / Claude POSTs these to /api/social/credentials ===")


if __name__ == "__main__":
    main()

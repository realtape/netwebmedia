"""
Extract Chrome cookies for youtube.com, then:
1. Initiate a scotty upload session
2. Upload the MP4
3. Call createvideo via InnerTube API
"""
import sqlite3, shutil, json, os, base64, hashlib, time, math, sys
import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import win32crypt

# ── Config ──────────────────────────────────────────────────────────────────
FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
CHANNEL_ID = "UC8ZtaDYIASF7D_vZENOIJ_g"
VIDEO_TITLE = "One client. $340K pipeline. 90 days. How?"
VIDEO_DESC  = ("14-person B2B SaaS team. $1.4M ARR. Killed three failing channels, "
               "installed AI SDR + AEO, scaled one winning ad. Pipeline came from "
               "concentration, not expansion.\n\nChat with us -> netwebmedia.com"
               "\n\n#B2BSaaS #Pipeline #FractionalCMO")
CHUNK_SIZE  = 4 * 1024 * 1024  # 4 MB

# ── Extract Chrome cookies ───────────────────────────────────────────────────
CHROME_BASE   = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data")
LOCAL_STATE   = os.path.join(CHROME_BASE, "Local State")
COOKIES_DB    = os.path.join(CHROME_BASE, "Default", "Network", "Cookies")
COOKIES_COPY  = COOKIES_DB + ".tmp_copy"

print("=== Extracting Chrome cookies ===")
with open(LOCAL_STATE, "r", encoding="utf-8") as f:
    ls = json.load(f)
enc_key_b64 = ls["os_crypt"]["encrypted_key"]
enc_key_bytes = base64.b64decode(enc_key_b64)[5:]          # strip "DPAPI" prefix
aes_key = win32crypt.CryptUnprotectData(enc_key_bytes, None, None, None, 0)[1]

shutil.copy2(COOKIES_DB, COOKIES_COPY)

def decrypt_val(enc_val, key):
    try:
        if enc_val[:3] == b"v10":
            aesgcm = AESGCM(key)
            return aesgcm.decrypt(enc_val[3:15], enc_val[15:], None).decode("utf-8")
        else:
            return win32crypt.CryptUnprotectData(enc_val, None, None, None, 0)[1].decode("utf-8")
    except Exception as e:
        return f"<decrypt_error:{e}>"

WANT = {"SAPISID", "APISID", "HSID", "SSID", "SID", "SIDCC",
        "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-3PSID",
        "__Secure-1PSIDTS", "__Secure-3PSIDTS", "NID"}
HOSTS = (".youtube.com", ".google.com", "studio.youtube.com")

conn = sqlite3.connect(COOKIES_COPY)
cur  = conn.cursor()
cur.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%.youtube.com' OR host_key LIKE '%.google.com'")
rows = cur.fetchall()
conn.close()
os.remove(COOKIES_COPY)

cookies = {}
for host, name, enc in rows:
    if name in WANT:
        val = decrypt_val(enc, aes_key)
        if not val.startswith("<decrypt_error"):
            cookies[name] = val
            print(f"  {name}: {val[:20]}...")

if "SAPISID" not in cookies:
    print("ERROR: Could not find SAPISID cookie — aborting")
    sys.exit(1)

# ── Build SAPISIDHASH ────────────────────────────────────────────────────────
ORIGIN = "https://studio.youtube.com"

def sapis_hash(sapisid, origin):
    ts = int(time.time())
    msg = f"{ts} {sapisid} {origin}"
    h = hashlib.sha1(msg.encode()).hexdigest()
    return f"SAPISIDHASH {ts}_{h}"

# ── Session with cookies ─────────────────────────────────────────────────────
sess = requests.Session()
jar = requests.cookies.RequestsCookieJar()
for name, val in cookies.items():
    jar.set(name, val, domain=".youtube.com")
    jar.set(name, val, domain=".google.com")
sess.cookies = jar

def studio_headers():
    return {
        "Authorization": sapis_hash(cookies["SAPISID"], ORIGIN),
        "X-Origin": ORIGIN,
        "X-Goog-AuthUser": "0",
        "Content-Type": "application/json",
        "Origin": ORIGIN,
        "Referer": ORIGIN + "/",
    }

# ── Test auth: fetch ytcfg ───────────────────────────────────────────────────
print("\n=== Testing auth: GET YouTube Studio ===")
r = sess.get("https://studio.youtube.com/", timeout=15)
print(f"Studio GET: {r.status_code}")
ytcfg_start = r.text.find("INNERTUBE_API_KEY")
if ytcfg_start > 0:
    snippet = r.text[ytcfg_start:ytcfg_start+200]
    print(f"Found ytcfg: ...{snippet[:100]}...")
    # Extract INNERTUBE_API_KEY
    import re
    m = re.search(r'"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"', r.text)
    api_key = m.group(1) if m else ""
    m2 = re.search(r'"INNERTUBE_CLIENT_VERSION"\s*:\s*"([^"]+)"', r.text)
    client_version = m2.group(1) if m2 else "1.20260426.04.00"
else:
    print("ytcfg not found — using defaults")
    api_key = ""
    client_version = "1.20260426.04.00"
print(f"API Key: {'found' if api_key else 'NOT FOUND'}")
print(f"Client Version: {client_version}")

# ── Initiate scotty upload ───────────────────────────────────────────────────
print("\n=== Initiating scotty upload ===")
file_size = os.path.getsize(FILE_PATH)
print(f"File: {os.path.basename(FILE_PATH)}  size={file_size:,}")

frontend_id = f"innertube_android_{int(time.time())}"

init_headers = {
    **studio_headers(),
    "X-Goog-Upload-Protocol": "resumable",
    "X-Goog-Upload-Command": "start",
    "X-Goog-Upload-Header-Content-Length": str(file_size),
    "X-Goog-Upload-Header-Content-Type": "video/mp4",
    "Content-Type": "application/json",
}
init_body = json.dumps({
    "channelId": CHANNEL_ID,
    "frontendUploadId": frontend_id,
    "fileDetails": {"fileName": "reel-08-340k-pipeline.mp4"},
})

r = sess.post("https://upload.youtube.com/upload/studio", headers=init_headers,
              data=init_body.encode(), timeout=30)
print(f"Init status: {r.status_code}")
print(f"Init body: {r.text[:300]}")
print(f"Init headers: {dict(r.headers)}")

upload_url = (r.headers.get("X-Goog-Upload-URL") or
              r.headers.get("Location") or "")
if not upload_url:
    print("ERROR: No upload URL returned — trying alternate approach")
    # Try to re-use the existing upload URL from the previous session
    upload_url = ("https://upload.youtube.com/?authuser=1&upload_type=scotty&v=1"
                  "&upload_id=AAVLpEj7Fs75nZHfk3T7kDerLFZ_dLI63LeDLnwcUtPGtwexVYtFuvCrV0CXWYF0NHGHxJGjQ"
                  "-ncPvfMB7cHXHWTOh41FYmfBXp9cEEPUPU5gg&upload_protocol=resumable"
                  "&origin=CihodHRwczovL3VwbG9hZC55b3V0dWJlLmNvbS91cGxvYWQvc3R1ZGlvEjhib"
                  "GJzdG9yZS1odHRwLXByb2QtZ2xvYmFsLXlvdXR1YmUtZGVmYXVsdC12aWRlby11cGxvYWRz")
    print(f"Using existing URL: {upload_url[:80]}...")
    # Check status of existing session
    r2 = requests.post(upload_url, headers={"X-Goog-Upload-Command": "query", "Content-Length": "0"},
                       data=b"", timeout=15)
    print(f"Existing session status: {r2.status_code}  upload_status={r2.headers.get('X-Goog-Upload-Status')}")
    sys.exit(0)

print(f"Upload URL: {upload_url[:80]}...")

# ── Upload file in chunks ────────────────────────────────────────────────────
print("\n=== Uploading file ===")
total_chunks = math.ceil(file_size / CHUNK_SIZE)
with open(FILE_PATH, "rb") as f:
    offset = 0
    chunk_num = 0
    while True:
        chunk = f.read(CHUNK_SIZE)
        if not chunk:
            break
        chunk_num += 1
        end_byte = offset + len(chunk) - 1
        is_last = (end_byte == file_size - 1)
        command = "upload, finalize" if is_last else "upload"
        pct = (end_byte + 1) / file_size * 100

        up_headers = {
            "Content-Type": "video/mp4",
            "X-Goog-Upload-Command": command,
            "X-Goog-Upload-Offset": str(offset),
            "Content-Length": str(len(chunk)),
        }
        print(f"  [{chunk_num}/{total_chunks}] offset={offset}  {pct:.1f}%  cmd={command!r}", flush=True)

        for attempt in range(3):
            try:
                r = requests.post(upload_url, headers=up_headers, data=chunk, timeout=120)
                break
            except Exception as e:
                print(f"    retry {attempt+1}: {e}")
                time.sleep(2)
        else:
            print("FATAL: 3 retries exhausted"); sys.exit(1)

        print(f"    HTTP {r.status_code}  status={r.headers.get('X-Goog-Upload-Status')}")
        if r.status_code not in (200, 201, 308):
            print(f"    ERR: {r.text[:300]}"); sys.exit(1)

        if is_last or r.headers.get("X-Goog-Upload-Status") == "final":
            print(f"\nUpload complete! HTTP {r.status_code}")
            print(f"Response: {r.text[:500]}")
            try:
                resp_json = r.json()
                scotty_id = resp_json.get("scottyResourceId", "")
                print(f"scottyResourceId: {scotty_id[:80]}...")
            except:
                scotty_id = ""
            break
        offset += len(chunk)

if not scotty_id:
    print("ERROR: No scottyResourceId returned"); sys.exit(1)

# ── Call createvideo ─────────────────────────────────────────────────────────
print("\n=== Calling createvideo ===")
ctx = {
    "client": {
        "clientName": "WEB_CREATOR",
        "clientVersion": client_version,
        "hl": "en", "gl": "US", "utcOffsetMinutes": -240,
    }
}
create_body = {
    "context": ctx,
    "frontendUploadId": frontend_id,
    "scottyResourceId": scotty_id,
    "initialMetadata": {
        "title": {"newTitle": VIDEO_TITLE},
        "description": {"newDescription": VIDEO_DESC},
        "privacyState": {"newPrivacy": "PRIVATE"},
        "madeForKids": {"madeForKids": False},
    }
}

cv_url = "https://studio.youtube.com/youtubei/v1/upload/createvideo"
if api_key:
    cv_url += f"?key={api_key}"

r = sess.post(cv_url, headers=studio_headers(), json=create_body, timeout=30)
print(f"createvideo status: {r.status_code}")
resp = r.json()
video_id = resp.get("videoId", "")
print(f"videoId: {video_id or 'NOT FOUND'}")
print(f"Response keys: {list(resp.keys())}")
if video_id:
    print(f"\n✅ SUCCESS! Video created: https://studio.youtube.com/video/{video_id}/edit")
else:
    print(f"Full response snippet: {r.text[:800]}")

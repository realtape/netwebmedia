"""
YouTube Studio direct upload via Python.
Extracts Chrome session cookies → generates SAPISIDHASH → uploads via
upload.youtube.com/upload/studio resumable upload protocol.
"""
import os, json, sqlite3, shutil, tempfile, hashlib, time, sys, math
import ctypes, struct
import requests
import win32crypt
from Crypto.Cipher import AES

# ── CONFIG ────────────────────────────────────────────────────────────────────
FILE_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
CHANNEL_ID  = "UC8ZtaDYIASF7D_vZENOIJ_g"
ORIGIN      = "https://studio.youtube.com"
CHUNK_SIZE  = 4 * 1024 * 1024   # 4 MB per PUT chunk (must be multiple of 256 KB)

# Chrome paths
LOCAL_STATE = r"C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\Local State"
COOKIES_DB  = r"C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies"

# ── STEP 1: Get Chrome AES key ─────────────────────────────────────────────
def get_chrome_key():
    with open(LOCAL_STATE, "r", encoding="utf-8") as f:
        ls = json.load(f)
    enc_key_b64 = ls["os_crypt"]["encrypted_key"]
    import base64
    enc_key = base64.b64decode(enc_key_b64)
    # Strip the DPAPI prefix "DPAPI" (5 bytes)
    enc_key = enc_key[5:]
    key = win32crypt.CryptUnprotectData(enc_key, None, None, None, 0)[1]
    return key

# ── STEP 2: Decrypt a single cookie value ─────────────────────────────────
def decrypt_cookie(enc_value, key):
    if enc_value[:3] == b'v10' or enc_value[:3] == b'v11':
        # AES-256-GCM
        iv   = enc_value[3:15]       # 12-byte nonce
        tag  = enc_value[-16:]        # 16-byte GCM tag
        ct   = enc_value[15:-16]      # ciphertext
        cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
        try:
            return cipher.decrypt_and_verify(ct, tag).decode("utf-8", errors="replace")
        except Exception:
            # Try without tag verification
            return AES.new(key, AES.MODE_GCM, nonce=iv).decrypt(ct).decode("utf-8", errors="replace")
    else:
        # Legacy DPAPI per-cookie
        try:
            return win32crypt.CryptUnprotectData(enc_value, None, None, None, 0)[1].decode("utf-8")
        except Exception:
            return ""

# ── STEP 3: Extract YouTube cookies ──────────────────────────────────────────
def get_yt_cookies():
    key = get_chrome_key()
    # Open with immutable URI (bypasses Chrome's exclusive lock)
    uri = "file:" + COOKIES_DB.replace("\\", "/").replace(" ", "%20") + "?mode=ro&immutable=1"
    try:
        con = sqlite3.connect(uri, uri=True)
        cur = con.cursor()
        cur.execute("""
            SELECT name, encrypted_value
            FROM cookies
            WHERE host_key LIKE '%youtube.com' OR host_key LIKE '%google.com'
        """)
        rows = cur.fetchall()
        con.close()
    except Exception as e:
        # Fallback: copy with ctypes FILE_SHARE flags
        import ctypes, ctypes.wintypes
        GENERIC_READ      = 0x80000000
        FILE_SHARE_ALL    = 0x7
        OPEN_EXISTING     = 3
        FILE_ATTRIBUTE_NORMAL = 0x80
        src_h = ctypes.windll.kernel32.CreateFileW(
            COOKIES_DB, GENERIC_READ, FILE_SHARE_ALL, None,
            OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, None)
        if src_h == -1:
            raise RuntimeError(f"Cannot open Cookies DB: {e}")
        tmp = tempfile.mktemp(suffix=".db")
        GENERIC_WRITE = 0x40000000
        CREATE_ALWAYS = 2
        dst_h = ctypes.windll.kernel32.CreateFileW(
            tmp, GENERIC_WRITE, 0, None,
            CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, None)
        buf = ctypes.create_string_buffer(65536)
        written = ctypes.wintypes.DWORD(0)
        read = ctypes.wintypes.DWORD(0)
        while True:
            ok = ctypes.windll.kernel32.ReadFile(src_h, buf, len(buf), ctypes.byref(read), None)
            if not ok or read.value == 0:
                break
            ctypes.windll.kernel32.WriteFile(dst_h, buf, read.value, ctypes.byref(written), None)
        ctypes.windll.kernel32.CloseHandle(src_h)
        ctypes.windll.kernel32.CloseHandle(dst_h)
        con = sqlite3.connect(tmp)
        cur = con.cursor()
        cur.execute("""
            SELECT name, encrypted_value
            FROM cookies
            WHERE host_key LIKE '%youtube.com' OR host_key LIKE '%google.com'
        """)
        rows = cur.fetchall()
        con.close()
        os.remove(tmp)

    cookies = {}
    for name, enc_val in rows:
        if enc_val:
            val = decrypt_cookie(enc_val, key)
            if val:
                cookies[name] = val
    return cookies

# ── STEP 4: Generate SAPISIDHASH ──────────────────────────────────────────────
def sapisidhash(sapisid, origin):
    ts = int(time.time())
    data = f"{ts} {sapisid} {origin}".encode()
    h = hashlib.sha1(data).hexdigest()
    return f"SAPISIDHASH {ts}_{h}"

# ── STEP 5: Initiate resumable upload ────────────────────────────────────────
def start_upload(cookies, sapisid, file_size):
    auth = sapisidhash(sapisid, ORIGIN)
    jar = requests.cookies.RequestsCookieJar()
    for k, v in cookies.items():
        jar.set(k, v, domain=".youtube.com")

    headers = {
        "Authorization":                    auth,
        "X-Origin":                         ORIGIN,
        "X-Goog-AuthUser":                  "0",
        "X-Goog-Upload-Protocol":           "resumable",
        "X-Goog-Upload-Command":            "start",
        "X-Goog-Upload-Header-Content-Length": str(file_size),
        "X-Goog-Upload-Header-Content-Type": "video/mp4",
        "Content-Type":                     "application/json",
    }
    body = json.dumps({"channelId": CHANNEL_ID})
    r = requests.post(
        "https://upload.youtube.com/upload/studio?authuser=0&upload_type=scotty&v=1",
        headers=headers,
        cookies=jar,
        data=body,
        timeout=30,
    )
    r.raise_for_status()
    upload_url = r.headers.get("X-Goog-Upload-URL") or r.headers.get("Location")
    status     = r.headers.get("X-Goog-Upload-Status")
    print(f"  Upload session: HTTP {r.status_code}  status={status}")
    print(f"  Upload URL (first 80 chars): {(upload_url or '')[:80]}...")
    return upload_url, jar

# ── STEP 6: Upload file in chunks ─────────────────────────────────────────────
def upload_chunks(upload_url, file_path, file_size, jar):
    offset = 0
    total_chunks = math.ceil(file_size / CHUNK_SIZE)
    with open(file_path, "rb") as f:
        chunk_num = 0
        while True:
            chunk = f.read(CHUNK_SIZE)
            if not chunk:
                break
            chunk_num += 1
            end_offset = offset + len(chunk) - 1
            is_last = (end_offset == file_size - 1)
            command = "upload, finalize" if is_last else "upload"

            headers = {
                "Content-Type":            "video/mp4",
                "X-Goog-Upload-Command":   command,
                "X-Goog-Upload-Offset":    str(offset),
                "Content-Length":           str(len(chunk)),
            }
            print(f"  Chunk {chunk_num}/{total_chunks}  bytes {offset}-{end_offset}  ({len(chunk)//1024}KB)  command={command}")
            r = requests.post(
                upload_url,
                headers=headers,
                cookies=jar,
                data=chunk,
                timeout=120,
            )
            upload_status = r.headers.get("X-Goog-Upload-Status", "unknown")
            print(f"    → HTTP {r.status_code}  upload-status={upload_status}")

            if r.status_code not in (200, 201, 308):
                print(f"    ERROR body: {r.text[:500]}")
                return None

            if is_last or upload_status == "final":
                # Parse video ID from response
                try:
                    resp_json = r.json()
                    video_id = (resp_json.get("videoId")
                                or resp_json.get("id")
                                or json.dumps(resp_json)[:200])
                    print(f"\n  ✓ Upload complete! videoId={video_id}")
                    return video_id
                except Exception:
                    print(f"  Response: {r.text[:500]}")
                    return r.text[:200]

            offset += len(chunk)
    return None

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    print("=== YouTube Studio Python Uploader ===")

    print("\n[1] Getting Chrome cookies...")
    cookies = get_yt_cookies()
    sapisid = cookies.get("SAPISID") or cookies.get("__Secure-1PAPISID")
    if not sapisid:
        print("  ERROR: SAPISID not found in cookies")
        print(f"  Available cookie names: {list(cookies.keys())[:20]}")
        sys.exit(1)
    print(f"  Found {len(cookies)} cookies. SAPISID present: {bool(cookies.get('SAPISID'))}")

    file_size = os.path.getsize(FILE_PATH)
    print(f"\n[2] File: {os.path.basename(FILE_PATH)}  size={file_size:,} bytes")

    print("\n[3] Starting upload session...")
    upload_url, jar = start_upload(cookies, sapisid, file_size)
    if not upload_url:
        print("  ERROR: No upload URL received")
        sys.exit(1)

    print("\n[4] Uploading file...")
    video_id = upload_chunks(upload_url, FILE_PATH, file_size, jar)

    if video_id:
        print(f"\n=== UPLOAD DONE ===")
        print(f"Video ID: {video_id}")
        print(f"Studio URL: https://studio.youtube.com/video/{video_id}/edit")
    else:
        print("\nERROR: Upload failed or no video ID returned")
        sys.exit(1)

if __name__ == "__main__":
    main()

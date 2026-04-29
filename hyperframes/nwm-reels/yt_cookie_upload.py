"""
Upload reel-08-340k-pipeline.mp4 to YouTube Studio scotty using
browser cookies downloaded from document.cookie.
Returns scottyResourceId on success.
"""
import os, sys, json, time, hashlib, math
import requests

FILE_PATH    = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
COOKIES_JSON = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_session_cookies.json"
CHANNEL_ID   = "UC8ZtaDYIASF7D_vZENOIJ_g"
ORIGIN       = "https://studio.youtube.com"
CHUNK_SIZE   = 4 * 1024 * 1024   # 4 MB

def sapisidhash(sapisid, origin):
    ts = int(time.time())
    data = f"{ts} {sapisid} {origin}".encode()
    h = hashlib.sha1(data).hexdigest()
    return f"SAPISIDHASH {ts}_{h}"

def build_cookie_jar(cookies_dict):
    jar = requests.cookies.RequestsCookieJar()
    for name, value in cookies_dict.items():
        jar.set(name, value, domain=".youtube.com")
        jar.set(name, value, domain=".google.com")
    return jar

def start_upload(cookies_dict, sapisid, file_size):
    auth = sapisidhash(sapisid, ORIGIN)
    jar = build_cookie_jar(cookies_dict)
    headers = {
        "Authorization":                        auth,
        "X-Origin":                             ORIGIN,
        "X-Goog-AuthUser":                      "1",
        "X-Goog-Upload-Protocol":               "resumable",
        "X-Goog-Upload-Command":                "start",
        "X-Goog-Upload-Header-Content-Length":  str(file_size),
        "X-Goog-Upload-Header-Content-Type":    "video/mp4",
        "Content-Type":                         "application/json",
    }
    body = json.dumps({"channelId": CHANNEL_ID})
    r = requests.post(
        "https://upload.youtube.com/upload/studio?authuser=1&upload_type=scotty&v=1",
        headers=headers,
        cookies=jar,
        data=body,
        timeout=30,
    )
    print(f"  Session HTTP {r.status_code}  status={r.headers.get('X-Goog-Upload-Status')}")
    if r.status_code not in (200, 201):
        print(f"  ERROR body: {r.text[:300]}")
        sys.exit(1)
    upload_url = r.headers.get("X-Goog-Upload-URL") or r.headers.get("Location")
    return upload_url, jar

def upload_chunks(upload_url, file_size, jar):
    offset = 0
    total_chunks = math.ceil(file_size / CHUNK_SIZE)
    with open(FILE_PATH, "rb") as f:
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
                "Content-Type":           "video/mp4",
                "X-Goog-Upload-Command":  command,
                "X-Goog-Upload-Offset":   str(offset),
                "Content-Length":          str(len(chunk)),
            }
            pct = (offset + len(chunk)) / file_size * 100
            print(f"  [{chunk_num}/{total_chunks}] {offset}-{end_offset} ({len(chunk)//1024}KB) {pct:.1f}% {command!r}")
            for attempt in range(3):
                try:
                    r = requests.post(upload_url, headers=headers, cookies=jar, data=chunk, timeout=120)
                    break
                except requests.RequestException as e:
                    print(f"    retry {attempt+1}/3: {e}")
                    time.sleep(2)
            else:
                print("    FATAL: 3 retries exhausted"); sys.exit(1)

            up_status = r.headers.get("X-Goog-Upload-Status", "unknown")
            print(f"    -> HTTP {r.status_code}  upload-status={up_status}")
            if r.status_code not in (200, 201, 308):
                print(f"    ERROR: {r.text[:300]}"); sys.exit(1)
            if is_last or up_status == "final":
                try:
                    resp = r.json()
                    scotty_id = resp.get("scottyResourceId")
                    print(f"\n  STATUS_SUCCESS. scottyResourceId={scotty_id[:40]}..." if scotty_id else f"\n  Final resp keys: {list(resp.keys())}")
                    return scotty_id
                except Exception:
                    print(f"  Final response: {r.text[:300]}")
                    return None
            offset += len(chunk)
    return None

def main():
    print("=== YT Cookie Upload ===")
    with open(COOKIES_JSON) as f:
        cookies = json.load(f)
    sapisid = cookies.get("SAPISID") or cookies.get("__Secure-1PAPISID")
    if not sapisid:
        print("ERROR: No SAPISID in cookies"); sys.exit(1)
    print(f"Cookies loaded. SAPISID present, length={len(cookies.get('SAPISID',''))}")

    file_size = os.path.getsize(FILE_PATH)
    print(f"File: {os.path.basename(FILE_PATH)}  size={file_size:,}")

    print("\n[1] Starting scotty session...")
    upload_url, jar = start_upload(cookies, sapisid, file_size)
    if not upload_url:
        print("ERROR: No upload URL"); sys.exit(1)
    print(f"  URL: {upload_url[:80]}...")

    print("\n[2] Uploading file...")
    scotty_id = upload_chunks(upload_url, file_size, jar)

    if scotty_id:
        print(f"\n=== UPLOAD DONE ===")
        print(f"scottyResourceId: {scotty_id}")
        # Save for use in browser swap
        with open(r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\scotty_id.txt", "w") as f:
            f.write(scotty_id)
        print(f"Saved to scotty_id.txt")
    else:
        print("\nERROR: No scottyResourceId returned")
        sys.exit(1)

if __name__ == "__main__":
    main()

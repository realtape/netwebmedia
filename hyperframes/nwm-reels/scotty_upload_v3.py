"""
Upload reel-08 to the browser-created scotty session.
Adds browser-like headers (Origin, Referer, User-Agent) that YouTube may require.
Uses smaller 1MB chunks to avoid write timeouts.
"""
import os, math, time, sys, requests

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
UPLOAD_URL = (
    "https://upload.youtube.com/?authuser=1"
    "&upload_id=AAVLphsiUEZuZoczOHpQgTOsFzbXvFcGdfE8gCdMo-_IVwJ6P6"
    "GFpeSXB67SQEShe09SQztuNjp9iJuvHWnKh9du1RS0CADPB3nDKr7De4jGbY"
    "&upload_protocol=resumable"
    "&origin=CihodHRwczovL3VwbG9hZC55b3V0dWJlLmNv"
    "bS91cGxvYWQvc3R1ZGlvEjhibG9ic3RvcmUtaHR0cC1wcm9k"
    "LWdsb2JhbC15b3V0dWJlLWRlZmF1bHQtdmlkZW8tdXBsb2Fkcw"
)
CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB — smaller to avoid write timeouts

HEADERS_BASE = {
    "Origin":     "https://studio.youtube.com",
    "Referer":    "https://studio.youtube.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
}

# ── 1. Query session ──────────────────────────────────────────────────────────
print("=== Querying session ===")
qh = {**HEADERS_BASE, "X-Goog-Upload-Command": "query", "Content-Length": "0"}
r = requests.post(UPLOAD_URL, headers=qh, data=b"", timeout=30)
print(f"  HTTP {r.status_code}  status={r.headers.get('X-Goog-Upload-Status')}  "
      f"offset={r.headers.get('X-Goog-Upload-Size-Received')}")

status = r.headers.get("X-Goog-Upload-Status", "")
if status == "final":
    print("Session already finalized!")
    try:
        sid = r.json().get("scottyResourceId", "")
        print(f"scottyResourceId: {sid}")
        print(f"SID_RESULT:{sid}")
    except Exception as e:
        print(f"Parse error: {e}  body={r.text[:400]}")
    sys.exit(0)

if status not in ("active", ""):
    print(f"Unexpected status '{status}' — aborting")
    sys.exit(1)

resume_offset = int(r.headers.get("X-Goog-Upload-Size-Received", 0))
print(f"  Resuming from byte {resume_offset:,}")

# ── 2. Upload real bytes ───────────────────────────────────────────────────────
file_size = os.path.getsize(FILE_PATH)
print(f"\n=== Uploading {file_size:,} bytes (resume from {resume_offset:,}) ===")
print(f"    chunk_size={CHUNK_SIZE:,}")

scotty_id = ""

with open(FILE_PATH, "rb") as f:
    f.seek(resume_offset)
    offset = resume_offset
    chunk_num = 0

    while True:
        chunk = f.read(CHUNK_SIZE)
        if not chunk:
            break
        chunk_num += 1
        end_byte = offset + len(chunk) - 1
        is_last  = (end_byte == file_size - 1)
        command  = "upload, finalize" if is_last else "upload"
        pct      = (end_byte + 1) / file_size * 100

        headers = {
            **HEADERS_BASE,
            "Content-Type":          "video/mp4",
            "X-Goog-Upload-Command": command,
            "X-Goog-Upload-Offset":  str(offset),
            "Content-Length":        str(len(chunk)),
        }
        print(f"  [{chunk_num}] offset={offset:,}  {pct:.1f}%  cmd={command!r}", flush=True)

        for attempt in range(4):
            try:
                r = requests.post(UPLOAD_URL, headers=headers, data=chunk, timeout=300)
                break
            except Exception as e:
                print(f"    retry {attempt+1}: {e}")
                time.sleep(5)
        else:
            print("FATAL: 4 retries exhausted"); sys.exit(1)

        up_status = r.headers.get("X-Goog-Upload-Status", "?")
        print(f"    HTTP {r.status_code}  status={up_status}", flush=True)

        if r.status_code not in (200, 201, 308):
            print(f"    ERROR body: {r.text[:400]}")
            sys.exit(1)

        if is_last or up_status == "final":
            print(f"\nUpload complete! HTTP {r.status_code}")
            try:
                resp = r.json()
                scotty_id = resp.get("scottyResourceId", "")
                print(f"scottyResourceId: {scotty_id}")
                print(f"SID_RESULT:{scotty_id}")
            except Exception as e:
                print(f"Parse error: {e}  body={r.text[:400]}")
            break

        offset += len(chunk)

if not scotty_id:
    print("ERROR: No scottyResourceId returned")
    sys.exit(1)

out = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\scotty_id_v2.txt"
with open(out, "w") as fout:
    fout.write(scotty_id)
print(f"\nWrote → scotty_id_v2.txt")
print("*** Next: inject SID into browser to simulate XHR success ***")

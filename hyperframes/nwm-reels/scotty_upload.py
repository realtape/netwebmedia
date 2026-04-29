"""
Upload reel-08 to the pre-initiated scotty session.
No cookies needed — auth is embedded in the upload_id URL parameter.
"""
import os, math, time, sys, json, requests

FILE_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
UPLOAD_URL  = ("https://upload.youtube.com/?authuser=1"
               "&upload_id=AAVLpEgOT3On7Kn1kli9aMVJgBuGjQx31kmpupMYlbo1Dgc48nJNFFZiyNoj_HTZ_zgmeJ-EP1y041roQUjDm9CqxkwnZFtCZtlRkb8UxH0-5Ls"
               "&upload_protocol=resumable"
               "&origin=CihodHRwczovL3VwbG9hZC55b3V0dWJlLmNvbS91cGxvYWQvc3R1ZGlvEjhibG9ic3RvcmUtaHR0cC1wcm9kLWdsb2JhbC15b3V0dWJlLWRlZmF1bHQtdmlkZW8tdXBsb2Fkcw")
FRONTEND_ID = "nwm_au1_1777431049908"
CHUNK_SIZE  = 4 * 1024 * 1024   # 4 MB

# ── 1. Query session status first ───────────────────────────────────────────
print("=== Checking upload session status ===")
r = requests.post(UPLOAD_URL,
                  headers={"X-Goog-Upload-Command": "query", "Content-Length": "0"},
                  data=b"", timeout=20)
print(f"  HTTP {r.status_code}  upload-status: {r.headers.get('X-Goog-Upload-Status')}  "
      f"offset: {r.headers.get('X-Goog-Upload-Size-Received')}")

status = r.headers.get("X-Goog-Upload-Status", "")
if status == "final":
    print("Session already finalized — reading scottyResourceId from response")
    try:
        resp = r.json()
        sid = resp.get("scottyResourceId", "")
        print(f"scottyResourceId: {sid}")
        with open("scotty_id.txt", "w") as f:
            f.write(sid)
        print("Wrote scotty_id.txt")
    except Exception as e:
        print(f"Could not parse JSON: {e}  body={r.text[:400]}")
    sys.exit(0)

if status not in ("active", ""):
    print(f"Unexpected status '{status}' — aborting")
    sys.exit(1)

# Resume offset
resume_offset = int(r.headers.get("X-Goog-Upload-Size-Received", 0))
print(f"  Resuming from byte {resume_offset:,}")

# ── 2. Upload in chunks ──────────────────────────────────────────────────────
file_size    = os.path.getsize(FILE_PATH)
total_chunks = math.ceil((file_size - resume_offset) / CHUNK_SIZE)
print(f"\n=== Uploading {file_size:,} bytes  (resume from {resume_offset:,}) ===")
print(f"    File: {os.path.basename(FILE_PATH)}")
print(f"    frontendUploadId: {FRONTEND_ID}\n")

scotty_id = ""

with open(FILE_PATH, "rb") as f:
    f.seek(resume_offset)
    offset    = resume_offset
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
            "Content-Type":           "video/mp4",
            "X-Goog-Upload-Command":  command,
            "X-Goog-Upload-Offset":   str(offset),
            "Content-Length":         str(len(chunk)),
        }
        print(f"  [{chunk_num}] offset={offset:,}  {pct:.1f}%  cmd={command!r}", flush=True)

        for attempt in range(4):
            try:
                r = requests.post(UPLOAD_URL, headers=headers, data=chunk, timeout=180)
                break
            except Exception as e:
                print(f"    retry {attempt+1}: {e}")
                time.sleep(3)
        else:
            print("FATAL: 4 retries exhausted"); sys.exit(1)

        upload_status = r.headers.get("X-Goog-Upload-Status", "?")
        print(f"    HTTP {r.status_code}  status={upload_status}", flush=True)

        if r.status_code not in (200, 201, 308):
            print(f"    ERROR body: {r.text[:400]}")
            sys.exit(1)

        if is_last or upload_status == "final":
            print(f"\nUpload complete! HTTP {r.status_code}")
            try:
                resp_json = r.json()
                scotty_id = resp_json.get("scottyResourceId", "")
                print(f"scottyResourceId: {scotty_id}")
            except Exception as e:
                print(f"Could not parse JSON: {e}  body={r.text[:400]}")
            break

        offset += len(chunk)

# ── 3. Write scottyResourceId for createvideo call ───────────────────────────
if scotty_id:
    out_path = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\scotty_id_live.txt"
    with open(out_path, "w") as f:
        f.write(scotty_id)
    print(f"\nWrote fresh scottyResourceId → scotty_id_fresh.txt")
    print(f"\n*** Next step: call createvideo in browser JS ***")
    print(f"  frontendUploadId : {FRONTEND_ID}")
    print(f"  scottyResourceId : {scotty_id}")
else:
    print("ERROR: No scottyResourceId returned")
    sys.exit(1)

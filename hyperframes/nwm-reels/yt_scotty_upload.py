"""
Direct YouTube scotty resumable upload — no cookies needed,
auth is embedded in the upload_id token in the URL.
"""
import os, sys, math, time
import requests

FILE_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
CHUNK_SIZE  = 4 * 1024 * 1024   # 4 MB (must be multiple of 256 KB)

# Reconstructed from char-code extraction
UPLOAD_URL  = (
    "https://upload.youtube.com/?authuser=1&upload_type=scotty&v=1"
    "&upload_id=AAVLpEjOBrGo2-5i-muu_Y4v_8goEWOHUbhPOqvILnP7d9oRMS04-4Pe9NJz6vdVfMOec2PqH6V1"
    "xuhRJAWrp8hh5_f8cQQfHPxZngH0dJDC_Vg"
    "&upload_protocol=resumable"
    "&origin=CihodHRwczovL3VwbG9hZC55b3V0dWJlLmNvbS91cGxvYWQvc3R1ZGlvEjhibG9ic3RvcmUtaHR0cC1w"
    "cm9kLWdsb2JhbC15b3V0dWJlLWRlZmF1bHQtdmlkZW8tdXBsb2Fkcw"
)

def query_offset():
    """Ask the server how many bytes it has received so far."""
    r = requests.post(
        UPLOAD_URL,
        headers={
            "X-Goog-Upload-Command": "query",
            "Content-Length": "0",
        },
        data=b"",
        timeout=30,
    )
    received = int(r.headers.get("X-Goog-Upload-Size-Received", "0"))
    status   = r.headers.get("X-Goog-Upload-Status", "unknown")
    print(f"  Server reports: offset={received:,}  status={status}  HTTP={r.status_code}")
    return received

def upload():
    file_size = os.path.getsize(FILE_PATH)
    total_chunks = math.ceil(file_size / CHUNK_SIZE)
    print(f"File: {os.path.basename(FILE_PATH)}  size={file_size:,} bytes  chunks={total_chunks}")
    print(f"Upload URL: {UPLOAD_URL[:80]}...")

    # Resume from wherever the server left off
    print("Querying current server offset...")
    offset = query_offset()
    if offset >= file_size:
        print("Server already has the full file — checking response...")

    with open(FILE_PATH, "rb") as f:
        f.seek(offset)
        chunk_num = 0
        while True:
            chunk = f.read(CHUNK_SIZE)
            if not chunk:
                break
            chunk_num += 1
            end_byte  = offset + len(chunk) - 1
            is_last   = (end_byte == file_size - 1)
            command   = "upload, finalize" if is_last else "upload"

            headers = {
                "Content-Type":           "video/mp4",
                "X-Goog-Upload-Command":  command,
                "X-Goog-Upload-Offset":   str(offset),
                "Content-Length":         str(len(chunk)),
            }

            pct = (offset + len(chunk)) / file_size * 100
            print(f"  [{chunk_num}/{total_chunks}] bytes {offset}-{end_byte}  "
                  f"({len(chunk)//1024}KB)  {pct:.1f}%  cmd={command!r}", flush=True)

            for attempt in range(3):
                try:
                    r = requests.post(
                        UPLOAD_URL,
                        headers=headers,
                        data=chunk,
                        timeout=120,
                    )
                    break
                except requests.RequestException as e:
                    print(f"    Retry {attempt+1}/3: {e}")
                    time.sleep(2)
            else:
                print("    FATAL: 3 retries exhausted")
                sys.exit(1)

            up_status = r.headers.get("X-Goog-Upload-Status", "unknown")
            print(f"    -> HTTP {r.status_code}  upload-status={up_status}", flush=True)

            if r.status_code not in (200, 201, 308):
                print(f"    ERROR body: {r.text[:500]}")
                sys.exit(1)

            if is_last or up_status == "final":
                print(f"\nDONE! Upload complete!  HTTP {r.status_code}")
                body = r.text.strip()
                print(f"Response body: {body[:500]}")
                return r

            offset += len(chunk)

if __name__ == "__main__":
    upload()

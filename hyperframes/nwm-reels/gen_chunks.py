"""
Read the MP4, base64-encode it, and output JavaScript snippets
to stdout — one line per chunk, ready to paste into javascript_tool.
Usage: python gen_chunks.py
"""
import base64, math, sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
CHUNK_BYTES = 384 * 1024   # 384 KB raw → ~512 KB base64 per chunk (safe for CDP)

with open(FILE_PATH, "rb") as f:
    data = f.read()

b64 = base64.b64encode(data).decode("ascii")
total_chars = len(b64)
chunk_size  = math.ceil(total_chars / math.ceil(total_chars / (CHUNK_BYTES * 4 // 3)))

chunks = [b64[i:i+chunk_size] for i in range(0, total_chars, chunk_size)]
n = len(chunks)

print(f"File: {len(data):,} bytes  →  Base64: {total_chars:,} chars  →  {n} chunks of ~{chunk_size:,} chars each", file=sys.stderr)

# Write each chunk to a file for easy reference
import json, os
out_dir = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\b64chunks"
os.makedirs(out_dir, exist_ok=True)

manifest = {"total_chars": total_chars, "chunks": n, "chunk_size": chunk_size}
with open(os.path.join(out_dir, "manifest.json"), "w") as f:
    json.dump(manifest, f)

for i, chunk in enumerate(chunks):
    fname = os.path.join(out_dir, f"chunk_{i:03d}.txt")
    with open(fname, "w") as f:
        f.write(chunk)
    print(f"chunk_{i:03d}.txt  len={len(chunk)}")

print(f"\nDone: {n} chunks written to {out_dir}", file=sys.stderr)

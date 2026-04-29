"""
Read Chrome cookies using Win32 API with FILE_SHARE_READ|WRITE|DELETE
to bypass Chrome's file lock, then write key cookies to a JSON file.
"""
import ctypes, ctypes.wintypes, os, json, base64, sqlite3, tempfile, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import win32crypt

CHROME_BASE  = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data")
LOCAL_STATE  = os.path.join(CHROME_BASE, "Local State")
COOKIES_DB   = os.path.join(CHROME_BASE, "Default", "Network", "Cookies")
OUT_FILE     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\chrome_cookies.json"

# ── Get AES key from Local State ─────────────────────────────────────────────
with open(LOCAL_STATE, "r", encoding="utf-8") as f:
    ls = json.load(f)
enc_key_bytes = base64.b64decode(ls["os_crypt"]["encrypted_key"])[5:]
aes_key = win32crypt.CryptUnprotectData(enc_key_bytes, None, None, None, 0)[1]

# ── Copy Cookies via Win32 (shared read past Chrome's lock) ──────────────────
k32 = ctypes.windll.kernel32

GENERIC_READ          = 0x80000000
FILE_SHARE_READ       = 0x00000001
FILE_SHARE_WRITE      = 0x00000002
FILE_SHARE_DELETE     = 0x00000004
OPEN_EXISTING         = 3
FILE_ATTRIBUTE_NORMAL = 0x80
INVALID_HANDLE        = ctypes.wintypes.HANDLE(-1).value

hFile = k32.CreateFileW(
    COOKIES_DB,
    GENERIC_READ,
    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    None,
    OPEN_EXISTING,
    FILE_ATTRIBUTE_NORMAL,
    None,
)

if hFile == INVALID_HANDLE:
    err = k32.GetLastError()
    print(f"CreateFileW failed: error {err}")
    sys.exit(1)

print(f"Opened Cookies file. Reading...")
tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
tmp.close()

# Read via Win32 into a temp file
BUFSIZE = 65536
buf = ctypes.create_string_buffer(BUFSIZE)
read_bytes = ctypes.c_ulong(0)
with open(tmp.name, "wb") as out:
    while True:
        ok = k32.ReadFile(hFile, buf, BUFSIZE, ctypes.byref(read_bytes), None)
        if not ok or read_bytes.value == 0:
            break
        out.write(buf.raw[:read_bytes.value])

k32.CloseHandle(hFile)
print(f"Copied {os.path.getsize(tmp.name):,} bytes")

# ── Decrypt cookies ──────────────────────────────────────────────────────────
WANT = {"SAPISID", "APISID", "HSID", "SSID", "SID", "SIDCC",
        "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-3PSID",
        "__Secure-1PSIDTS", "__Secure-3PSIDTS", "NID", "__Secure-3PSIDCC"}

def decrypt_val(enc_val, key):
    try:
        if enc_val[:3] == b"v10":
            aesgcm = AESGCM(key)
            return aesgcm.decrypt(enc_val[3:15], enc_val[15:], None).decode("utf-8")
        return win32crypt.CryptUnprotectData(enc_val, None, None, None, 0)[1].decode("utf-8")
    except Exception as e:
        return f"<err:{e}>"

conn = sqlite3.connect(tmp.name)
cur  = conn.cursor()
cur.execute("""SELECT host_key, name, encrypted_value FROM cookies
               WHERE (host_key LIKE '%.youtube.com' OR host_key LIKE '%.google.com')""")

result = {}
for host, name, enc in cur.fetchall():
    if name in WANT:
        val = decrypt_val(bytes(enc), aes_key)
        if not val.startswith("<err:"):
            result[name] = val
            print(f"  ✓ {name}: {val[:25]}...")

conn.close()
os.unlink(tmp.name)

with open(OUT_FILE, "w") as f:
    json.dump(result, f)
print(f"\nWrote {len(result)} cookies to {OUT_FILE}")

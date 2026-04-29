"""
fill_dialog_v2.py  — more reliable file dialog filler.
When the Windows Open-file dialog (#32770) appears, this script
types the full file path and presses Enter using SendInput.
No WM_SETTEXT needed — typing goes to the focused filename field.
"""
import ctypes, ctypes.wintypes, time, sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"

user32   = ctypes.windll.user32
LOG_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\fill_dialog_v2.log"
log_f    = open(LOG_PATH, "w", buffering=1)

def log(m):
    print(m, flush=True)
    log_f.write(m + "\n")
    log_f.flush()

# ─── SendInput helpers ────────────────────────────────────────────────────────
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP    = 0x0002
KEYEVENTF_UNICODE  = 0x0004

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk",ctypes.wintypes.WORD),("wScan",ctypes.wintypes.WORD),
                ("dwFlags",ctypes.wintypes.DWORD),("time",ctypes.wintypes.DWORD),
                ("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]
class _U(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT)]
class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.wintypes.DWORD), ("_u", _U)]

def key(vk, up=False):
    i = INPUT(type=INPUT_KEYBOARD)
    i._u.ki.wVk = vk
    i._u.ki.dwFlags = KEYEVENTF_KEYUP if up else 0
    user32.SendInput(1, ctypes.byref(i), ctypes.sizeof(i))

def type_char(ch):
    for up in (False, True):
        i = INPUT(type=INPUT_KEYBOARD)
        i._u.ki.wVk = 0
        i._u.ki.wScan = ord(ch)
        i._u.ki.dwFlags = KEYEVENTF_UNICODE | (KEYEVENTF_KEYUP if up else 0)
        user32.SendInput(1, ctypes.byref(i), ctypes.sizeof(i))

def type_text(s):
    for ch in s:
        type_char(ch)
        time.sleep(0.012)

VK_CTRL   = 0x11
VK_A      = 0x41
VK_RETURN = 0x0D

log(f"[v2] Watcher started. Waiting up to 120s for #32770...")
log(f"[v2] Path: {FILE_PATH}")

deadline = time.time() + 120
while time.time() < deadline:
    hwnd = user32.FindWindowW("#32770", None)
    if hwnd:
        log(f"[v2] Dialog found! hwnd={hwnd:#010x}")
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.4)          # let it gain focus

        # Select-All any existing text in filename field, then type path
        key(VK_CTRL); key(VK_A); key(VK_A, True); key(VK_CTRL, True)
        time.sleep(0.1)
        type_text(FILE_PATH)
        log(f"[v2] Typed path")
        time.sleep(0.3)
        key(VK_RETURN); time.sleep(0.05); key(VK_RETURN, True)
        log(f"[v2] Pressed Enter — done.")
        log_f.close()
        sys.exit(0)
    time.sleep(0.4)

log("[v2] TIMEOUT — no dialog in 120s.")
log_f.close()
sys.exit(1)

"""
fill_dialog_py.py
Watches for the Windows file-open dialog (#32770), fills in the MP4 path, and clicks Open.
Runs for up to 120 seconds.
"""
import ctypes
import ctypes.wintypes
import time
import sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"

user32  = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

FindWindow     = user32.FindWindowW
FindWindowEx   = user32.FindWindowExW
SendMessageW   = user32.SendMessageW
PostMessageW   = user32.PostMessageW
SetForegroundWindow = user32.SetForegroundWindow
BringWindowToTop    = user32.BringWindowToTop

WM_SETTEXT = 0x000C
WM_GETTEXT = 0x000D
BM_CLICK   = 0x00F5

LOG = open(r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\fill_dialog_py.log", "w", buffering=1)

def log(msg):
    print(msg, flush=True)
    LOG.write(msg + "\n")

log(f"[PY] Watcher started. Looking for #32770 for 120s...")
log(f"[PY] Target path: {FILE_PATH}")

deadline = time.time() + 120

while time.time() < deadline:
    hwnd = FindWindow("#32770", None)
    if hwnd:
        log(f"[PY] File dialog found! hwnd={hwnd:#010x}")
        BringWindowToTop(hwnd)
        SetForegroundWindow(hwnd)
        time.sleep(0.3)

        # Find the filename Edit control (first Edit child)
        edit = FindWindowEx(hwnd, None, "Edit", None)
        if edit:
            log(f"[PY] Edit control found: {edit:#010x}")
            # Clear and set text
            buf = ctypes.create_unicode_buffer(FILE_PATH)
            SendMessageW(edit, WM_SETTEXT, 0, buf)
            time.sleep(0.2)

            # Verify text was set
            out = ctypes.create_unicode_buffer(1024)
            SendMessageW(edit, WM_GETTEXT, 1024, out)
            log(f"[PY] Edit text after set: {out.value[:80]}")
        else:
            log("[PY] WARNING: Edit control not found, trying ComboBoxEx approach")
            combo = FindWindowEx(hwnd, None, "ComboBoxEx32", None)
            if combo:
                inner_combo = FindWindowEx(combo, None, "ComboBox", None)
                if inner_combo:
                    edit = FindWindowEx(inner_combo, None, "Edit", None)
                    if edit:
                        buf = ctypes.create_unicode_buffer(FILE_PATH)
                        SendMessageW(edit, WM_SETTEXT, 0, buf)
                        time.sleep(0.2)
                        log("[PY] Set text via ComboBoxEx > ComboBox > Edit")

        # Find and click the Open/OK button (Button1 = first Button child)
        btn = FindWindowEx(hwnd, None, "Button", None)
        if btn:
            log(f"[PY] Button found: {btn:#010x}")
            SendMessageW(btn, BM_CLICK, 0, 0)
            time.sleep(0.1)
            log("[PY] BM_CLICK sent to Open button")
        else:
            log("[PY] WARNING: Button not found, trying PostMessage VK_RETURN")
            PostMessageW(hwnd, 0x0100, 0x0D, 0)  # WM_KEYDOWN VK_RETURN

        log("[PY] Done — exiting watcher.")
        LOG.close()
        sys.exit(0)

    time.sleep(0.5)

log("[PY] TIMEOUT — no file dialog found in 120s.")
LOG.close()
sys.exit(1)

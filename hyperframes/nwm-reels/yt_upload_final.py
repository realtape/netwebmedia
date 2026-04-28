"""
yt_upload_final.py
==================
Find the Chrome window that has the YouTube Studio upload dialog open
(the MCP tab, which is in a background/hidden Chrome window),
bring it to the foreground, maximize it, then:
  1. Click "Select files"  — real OS SendInput trusted gesture
  2. Wait for the native file dialog (#32770)
  3. Fill the file path via WM_SETTEXT + Enter → Open

Usage: python yt_upload_final.py
"""

import ctypes
import ctypes.wintypes
import time
import subprocess
import os
import sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_final.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"

# ── Logging ────────────────────────────────────────────────────────────────────
_logf = open(LOG_PATH, "w", buffering=1)

def log(msg):
    print(msg)
    _logf.write(msg + "\n")

log("=== yt_upload_final.py started ===")

# ── WinAPI structures ──────────────────────────────────────────────────────────
user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
psapi    = ctypes.windll.psapi

MOUSEEVENTF_MOVE       = 0x0001
MOUSEEVENTF_LEFTDOWN   = 0x0002
MOUSEEVENTF_LEFTUP     = 0x0004
MOUSEEVENTF_ABSOLUTE   = 0x8000
MOUSEEVENTF_NOCOALESCE = 0x2000
KEYEVENTF_KEYUP        = 0x0002
KEYEVENTF_UNICODE      = 0x0004
INPUT_MOUSE            = 0
INPUT_KEYBOARD         = 1
VK_RETURN              = 0x0D
VK_CONTROL             = 0x11
VK_A                   = 0x41
VK_L                   = 0x4C
SW_RESTORE             = 9
SW_MAXIMIZE            = 3
SW_SHOW                = 5
WM_SETTEXT             = 0x000C
BM_CLICK               = 0x00F5
PROCESS_QUERY_LIMITED  = 0x1000

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx",          ctypes.c_long),
                ("dy",          ctypes.c_long),
                ("mouseData",   ctypes.c_ulong),
                ("dwFlags",     ctypes.c_ulong),
                ("time",        ctypes.c_ulong),
                ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk",         ctypes.c_ushort),
                ("wScan",       ctypes.c_ushort),
                ("dwFlags",     ctypes.c_ulong),
                ("time",        ctypes.c_ulong),
                ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]

class _UNION(ctypes.Union):
    _fields_ = [("mi", MOUSEINPUT), ("ki", KEYBDINPUT)]

class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong), ("_input", _UNION)]

# ── Input helpers ──────────────────────────────────────────────────────────────
SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen: {SCREEN_W}x{SCREEN_H}")

def _mi(dx, dy, flags, extra=None):
    return INPUT(INPUT_MOUSE, _UNION(mi=MOUSEINPUT(dx, dy, 0, flags, 0, extra)))

def _ki(vk, flags):
    return INPUT(INPUT_KEYBOARD, _UNION(ki=KEYBDINPUT(vk, 0, flags, 0, None)))

def send_click(x, y, delay=0.15):
    nx = int(x * 65535 / SCREEN_W)
    ny = int(y * 65535 / SCREEN_H)
    arr = (INPUT * 3)(
        _mi(nx, ny, MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_NOCOALESCE),
        _mi(nx, ny, MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE),
        _mi(nx, ny, MOUSEEVENTF_LEFTUP   | MOUSEEVENTF_ABSOLUTE),
    )
    result = user32.SendInput(3, arr, ctypes.sizeof(INPUT))
    log(f"  send_click({x},{y}) -> SendInput result={result}")
    time.sleep(delay)

def send_key(vk):
    arr = (INPUT * 2)(_ki(vk, 0), _ki(vk, KEYEVENTF_KEYUP))
    user32.SendInput(2, arr, ctypes.sizeof(INPUT))
    time.sleep(0.05)

def send_ctrl(vk):
    arr = (INPUT * 4)(
        _ki(VK_CONTROL, 0),
        _ki(vk,         0),
        _ki(vk,         KEYEVENTF_KEYUP),
        _ki(VK_CONTROL, KEYEVENTF_KEYUP),
    )
    user32.SendInput(4, arr, ctypes.sizeof(INPUT))
    time.sleep(0.12)

def type_unicode(text):
    for ch in text:
        code = ord(ch)
        arr = (INPUT * 2)(
            _ki(0, KEYEVENTF_UNICODE) if False else INPUT(INPUT_KEYBOARD, _UNION(ki=KEYBDINPUT(0, code, KEYEVENTF_UNICODE, 0, None))),
            INPUT(INPUT_KEYBOARD, _UNION(ki=KEYBDINPUT(0, code, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 0, None))),
        )
        user32.SendInput(2, arr, ctypes.sizeof(INPUT))
        time.sleep(0.018)

def get_rect(hwnd):
    r = ctypes.wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(r))
    return r.left, r.top, r.right - r.left, r.bottom - r.top

# ── Window enumeration ─────────────────────────────────────────────────────────
def get_process_name(pid):
    try:
        h = kernel32.OpenProcess(PROCESS_QUERY_LIMITED, False, pid)
        if not h:
            return ""
        buf = ctypes.create_unicode_buffer(1024)
        size = ctypes.c_ulong(1024)
        kernel32.QueryFullProcessImageNameW(h, 0, buf, ctypes.byref(size))
        kernel32.CloseHandle(h)
        return os.path.basename(buf.value).lower()
    except Exception:
        return ""

def enum_chrome_windows():
    """Return list of (hwnd, title, is_visible) for all Chrome_WidgetWin_1 chrome.exe windows."""
    results = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)

    def cb(hwnd, _):
        cls = ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(hwnd, cls, 64)
        if cls.value != "Chrome_WidgetWin_1":
            return True
        pid = ctypes.c_ulong(0)
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        if get_process_name(pid.value) not in ("chrome.exe", "chrome"):
            return True
        title = ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd, title, 512)
        vis = bool(user32.IsWindowVisible(hwnd))
        results.append((hwnd, title.value, vis))
        return True

    user32.EnumWindows(WNDENUMPROC(cb), 0)
    return results

# ── Find target window ─────────────────────────────────────────────────────────
log("Enumerating Chrome windows...")
windows = enum_chrome_windows()
for hwnd, title, vis in windows:
    log(f"  hwnd={hwnd} vis={vis} title='{title}'")

# Priority: window with "YouTube Studio" in title
target = None
for hwnd, title, vis in windows:
    if "YouTube Studio" in title:
        target = hwnd
        log(f"Found Studio window: hwnd={hwnd} title='{title}' vis={vis}")
        break

# Fallback: any Chrome window
if target is None:
    for hwnd, title, vis in windows:
        if title:  # skip blank-title utility windows
            target = hwnd
            log(f"Fallback Chrome window: hwnd={hwnd} title='{title}'")
            break

if target is None:
    log("ERROR: No Chrome window found — opening Studio in new tab")
    os.startfile(STUDIO_URL)
    time.sleep(6)
    windows = enum_chrome_windows()
    for hwnd, title, vis in windows:
        if "YouTube Studio" in title:
            target = hwnd
            break
    if target is None and windows:
        target = windows[0][0]

if target is None:
    log("FATAL: still no Chrome window found. Aborting.")
    sys.exit(1)

# ── Restore, maximize, activate ───────────────────────────────────────────────
log(f"Activating hwnd={target}")
user32.ShowWindow(target, SW_RESTORE)
time.sleep(0.3)
user32.ShowWindow(target, SW_MAXIMIZE)
time.sleep(0.5)
user32.SetForegroundWindow(target)
time.sleep(0.5)

wx, wy, ww, wh = get_rect(target)
log(f"Window rect after maximize: {wx},{wy} {ww}x{wh}")

# ── Check whether upload dialog is already open ───────────────────────────────
# We check by looking for child windows / relying on the MCP tab having opened
# the dialog.  We'll attempt clicks either way.
#
# If Studio is visible but the upload dialog is NOT open yet:
#   click Create → Upload videos → Select files
# If the dialog IS already open:
#   click Select files directly

CHROME_UI_H = 65   # tabs + address bar

# ── Navigate to Studio if needed ──────────────────────────────────────────────
title_buf = ctypes.create_unicode_buffer(512)
user32.GetWindowTextW(target, title_buf, 512)
current_title = title_buf.value
log(f"Current window title: '{current_title}'")

if "YouTube Studio" not in current_title:
    log("Studio not in title — navigating via Ctrl+L...")
    send_ctrl(VK_L)      # focus address bar
    time.sleep(0.35)
    send_ctrl(VK_A)      # select all
    time.sleep(0.1)
    type_unicode(STUDIO_URL)
    time.sleep(0.2)
    send_key(VK_RETURN)
    log("Navigation sent, waiting 6s for Studio to load...")
    time.sleep(6)
    wx, wy, ww, wh = get_rect(target)
    log(f"Window rect after navigation: {wx},{wy} {ww}x{wh}")

# ── Click Create button ───────────────────────────────────────────────────────
# Only if upload dialog is NOT already visible.
# We'll click Create unconditionally; if dialog was open the click might close
# the dialog — we handle that by always re-triggering.
#
# Studio Create button: top-right of header
# Header: starts at CHROME_UI_H, height ~64px  → center y = CHROME_UI_H + 32
# Create button: ~130px from right edge
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Clicking Create at ({create_x},{create_y})")
send_click(create_x, create_y)
time.sleep(0.7)

# "Upload videos" is the first item in the dropdown (appears directly below Create)
upload_x = create_x
upload_y = create_y + 45
log(f"Clicking Upload videos at ({upload_x},{upload_y})")
send_click(upload_x, upload_y)
time.sleep(3.0)   # wait for upload dialog to animate in

# ── Click Select files ────────────────────────────────────────────────────────
# Upload dialog is a centered modal.
# "Select files" button: center-x, ~62% down the viewport
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.62)
log(f"Clicking Select files at ({select_x},{select_y})")
send_click(select_x, select_y, delay=0.5)

# ── Wait for native file dialog (#32770) ──────────────────────────────────────
log("Waiting for file dialog (#32770)...")
deadline = time.time() + 20
dialog = 0
while time.time() < deadline:
    h = user32.FindWindowW("#32770", None)
    if h:
        dialog = h
        log(f"File dialog found: hwnd={h}")
        break
    time.sleep(0.15)

if not dialog:
    # Maybe the click hit the wrong spot — try once more with adjusted Y
    select_y2 = wy + CHROME_UI_H + int(vp_h * 0.55)
    log(f"No dialog after first attempt. Retrying Select files at ({select_x},{select_y2})")
    send_click(select_x, select_y2, delay=0.5)
    deadline2 = time.time() + 15
    while time.time() < deadline2:
        h = user32.FindWindowW("#32770", None)
        if h:
            dialog = h
            log(f"File dialog found on retry: hwnd={h}")
            break
        time.sleep(0.15)

if not dialog:
    log("TIMEOUT: No file dialog appeared. Aborting.")
    sys.exit(1)

# ── Fill file path in the dialog ──────────────────────────────────────────────
user32.SetForegroundWindow(dialog)
time.sleep(0.4)

# Find the filename edit control
hwnd_edit = user32.FindWindowExW(dialog, None, "Edit", None)
log(f"Edit control: hwnd={hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit, WM_SETTEXT, 0, FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog)
    time.sleep(0.15)
    send_key(VK_RETURN)
    time.sleep(0.4)
    # Also click the Open/OK button
    hwnd_btn = user32.FindWindowExW(dialog, None, "Button", None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn, BM_CLICK, 0, 0)
        log(f"Clicked Open button: hwnd={hwnd_btn}")
    log("File path set via WM_SETTEXT + Enter")
else:
    # Fallback: type the path
    log("No Edit control found — typing path directly")
    type_unicode(FILE_PATH)
    time.sleep(0.2)
    send_key(VK_RETURN)

log("=== Script complete — upload should be in progress ===")
_logf.close()

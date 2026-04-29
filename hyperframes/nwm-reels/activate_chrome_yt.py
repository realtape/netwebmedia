"""
activate_chrome_yt.py
Finds the Chrome window containing the YouTube Studio tab,
brings it to the foreground, gets the client area screen offset,
and writes the result to a JSON file for Claude to read.
"""
import ctypes
import ctypes.wintypes
import json, time, sys

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

OUTFILE = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\chrome_yt_win.json"

EnumWindows          = user32.EnumWindows
EnumWindowsProc      = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
GetWindowText        = user32.GetWindowTextW
GetWindowTextLength  = user32.GetWindowTextLengthW
IsWindowVisible      = user32.IsWindowVisible
GetWindowRect        = user32.GetWindowRect
ClientToScreen       = user32.ClientToScreen
SetForegroundWindow  = user32.SetForegroundWindow
BringWindowToTop     = user32.BringWindowToTop
ShowWindow           = user32.ShowWindow
GetForegroundWindow  = user32.GetForegroundWindow
GetWindowThreadProcessId = user32.GetWindowThreadProcessId
AttachThreadInput    = user32.AttachThreadInput
SW_RESTORE = 9

results = []

def enum_callback(hwnd, lParam):
    if not IsWindowVisible(hwnd):
        return True
    length = GetWindowTextLength(hwnd)
    if length == 0:
        return True
    buf = ctypes.create_unicode_buffer(length + 1)
    GetWindowText(hwnd, buf, length + 1)
    title = buf.value
    if 'YouTube Studio' in title and 'Chrome' not in title:
        # GetWindowText of a Chrome tab group usually contains the tab title
        # BUT Chrome top-level windows might have "title - Google Chrome" format
        results.append((hwnd, title))
    elif 'YouTube Studio' in title:
        results.append((hwnd, title))
    return True

EnumWindows(EnumWindowsProc(enum_callback), 0)

print(f"Found {len(results)} matching windows:")
for hwnd, title in results:
    print(f"  HWND={hwnd:#010x}: {title[:60]}")

if not results:
    # Try broader search
    def enum2(hwnd, lParam):
        if not IsWindowVisible(hwnd):
            return True
        length = GetWindowTextLength(hwnd)
        if length == 0:
            return True
        buf = ctypes.create_unicode_buffer(length + 1)
        GetWindowText(hwnd, buf, length + 1)
        title = buf.value
        if 'studio.youtube' in title.lower() or 'youtube studio' in title.lower() or 'channel dashboard' in title.lower():
            results.append((hwnd, title))
        return True
    EnumWindows(EnumWindowsProc(enum2), 0)
    print(f"Broader search found {len(results)} windows")
    for hwnd, title in results:
        print(f"  HWND={hwnd:#010x}: {title[:80]}")

if not results:
    print("ERROR: No YouTube Studio window found")
    json.dump({"error": "No YT Studio window found"}, open(OUTFILE, "w"))
    sys.exit(1)

# Take the first (or best) match
hwnd, title = results[0]
print(f"\nActivating HWND={hwnd:#010x}: {title[:60]}")

# Restore if minimized
ShowWindow(hwnd, SW_RESTORE)
time.sleep(0.3)

# Force foreground using AttachThreadInput trick
fg_hwnd = GetForegroundWindow()
if fg_hwnd != hwnd:
    fg_tid = GetWindowThreadProcessId(fg_hwnd, None)
    tgt_tid = GetWindowThreadProcessId(hwnd, None)
    AttachThreadInput(fg_tid, tgt_tid, True)
    SetForegroundWindow(hwnd)
    BringWindowToTop(hwnd)
    AttachThreadInput(fg_tid, tgt_tid, False)
    time.sleep(0.5)

# Get client area origin in screen coords
pt = ctypes.wintypes.POINT(0, 0)
ClientToScreen(hwnd, ctypes.byref(pt))
client_x = pt.x
client_y = pt.y

# Get full window rect
wr = ctypes.wintypes.RECT()
GetWindowRect(hwnd, ctypes.byref(wr))
win_w = wr.right  - wr.left
win_h = wr.bottom - wr.top

result = {
    "hwnd": hwnd,
    "title": title[:80],
    "client_x": client_x,
    "client_y": client_y,
    "win_x": wr.left,
    "win_y": wr.top,
    "win_w": win_w,
    "win_h": win_h,
    "activated": True
}
print(json.dumps(result, indent=2))
json.dump(result, open(OUTFILE, "w"))
print(f"\nWrote info to {OUTFILE}")

"""
click_select_files.py
1. Finds the Chrome browser window (HWND)
2. Activates it and uses Ctrl+Shift+A (Chrome tab search) to switch to the YT Studio tab
3. Waits for tab to render
4. Clicks "Select files" button at calculated screen coordinates
5. The separate fill_dialog_py.py watcher handles the OS file picker

Run AFTER fill_dialog_py.py is already running.
"""
import ctypes
import ctypes.wintypes
import time
import subprocess
import sys

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# -------- Win32 helpers --------
EnumWindows          = user32.EnumWindows
EnumWindowsProc      = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
GetWindowText        = user32.GetWindowTextW
GetWindowTextLength  = user32.GetWindowTextLengthW
GetClassName         = user32.GetClassNameW
IsWindowVisible      = user32.IsWindowVisible
GetWindowRect        = user32.GetWindowRect
ClientToScreen       = user32.ClientToScreen
SetForegroundWindow  = user32.SetForegroundWindow
BringWindowToTop     = user32.BringWindowToTop
ShowWindow           = user32.ShowWindow
GetForegroundWindow  = user32.GetForegroundWindow
GetWindowThreadProcessId = user32.GetWindowThreadProcessId
AttachThreadInput    = user32.AttachThreadInput
SetCursorPos         = user32.SetCursorPos

SW_RESTORE = 9
VK_CONTROL = 0x11
VK_SHIFT   = 0x10
VK_RETURN  = 0x0D
INPUT_KEYBOARD = 1
INPUT_MOUSE    = 0
KEYEVENTF_KEYUP = 0x0002
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP   = 0x0004
MOUSEEVENTF_MOVE     = 0x0001
MOUSEEVENTF_ABSOLUTE = 0x8000

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk",         ctypes.wintypes.WORD),
        ("wScan",       ctypes.wintypes.WORD),
        ("dwFlags",     ctypes.wintypes.DWORD),
        ("time",        ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx",          ctypes.c_long),
        ("dy",          ctypes.c_long),
        ("mouseData",   ctypes.wintypes.DWORD),
        ("dwFlags",     ctypes.wintypes.DWORD),
        ("time",        ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]

class _INPUT_UNION(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT), ("mi", MOUSEINPUT)]

class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.wintypes.DWORD), ("_input", _INPUT_UNION)]

SendInput = user32.SendInput

def key_down(vk):
    inp = INPUT(type=INPUT_KEYBOARD)
    inp._input.ki.wVk = vk
    inp._input.ki.dwFlags = 0
    SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))

def key_up(vk):
    inp = INPUT(type=INPUT_KEYBOARD)
    inp._input.ki.wVk = vk
    inp._input.ki.dwFlags = KEYEVENTF_KEYUP
    SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))

def type_string(text):
    """Type a string using SendInput (Unicode chars)."""
    KEYEVENTF_UNICODE = 0x0004
    for ch in text:
        inp_d = INPUT(type=INPUT_KEYBOARD)
        inp_d._input.ki.wVk = 0
        inp_d._input.ki.wScan = ord(ch)
        inp_d._input.ki.dwFlags = KEYEVENTF_UNICODE
        inp_u = INPUT(type=INPUT_KEYBOARD)
        inp_u._input.ki.wVk = 0
        inp_u._input.ki.wScan = ord(ch)
        inp_u._input.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP
        SendInput(1, ctypes.byref(inp_d), ctypes.sizeof(inp_d))
        SendInput(1, ctypes.byref(inp_u), ctypes.sizeof(inp_u))
        time.sleep(0.03)

def mouse_click(x, y):
    """Left-click at absolute screen coordinates."""
    # Scale coords to 65535 range for MOUSEEVENTF_ABSOLUTE
    # First move cursor, then click
    SetCursorPos(x, y)
    time.sleep(0.15)
    inp_d = INPUT(type=INPUT_MOUSE)
    inp_d._input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN
    inp_d._input.mi.dx = 0
    inp_d._input.mi.dy = 0
    SendInput(1, ctypes.byref(inp_d), ctypes.sizeof(inp_d))
    time.sleep(0.08)
    inp_u = INPUT(type=INPUT_MOUSE)
    inp_u._input.mi.dwFlags = MOUSEEVENTF_LEFTUP
    inp_u._input.mi.dx = 0
    inp_u._input.mi.dy = 0
    SendInput(1, ctypes.byref(inp_u), ctypes.sizeof(inp_u))
    print(f"Clicked at ({x}, {y})")

def activate_window(hwnd):
    """Force a window to the foreground using AttachThreadInput trick."""
    ShowWindow(hwnd, SW_RESTORE)
    time.sleep(0.2)
    fg = GetForegroundWindow()
    if fg == hwnd:
        return True
    fg_tid = GetWindowThreadProcessId(fg, None)
    tgt_tid = GetWindowThreadProcessId(hwnd, None)
    AttachThreadInput(fg_tid, tgt_tid, True)
    BringWindowToTop(hwnd)
    SetForegroundWindow(hwnd)
    time.sleep(0.1)
    AttachThreadInput(fg_tid, tgt_tid, False)
    time.sleep(0.4)
    return GetForegroundWindow() == hwnd

# -------- Find Chrome window --------
chrome_hwnds = []
def enum_cb(hwnd, lParam):
    if not IsWindowVisible(hwnd): return True
    ln = GetWindowTextLength(hwnd)
    if ln == 0: return True
    cb2 = ctypes.create_unicode_buffer(100)
    GetClassName(hwnd, cb2, 100)
    if 'Chrome_WidgetWin_1' == cb2.value:
        tb = ctypes.create_unicode_buffer(ln + 1)
        GetWindowText(hwnd, tb, ln + 1)
        title = tb.value
        # Exclude the Claude Electron app (it also uses Chrome_WidgetWin_1)
        if 'Claude' not in title or 'YouTube' in title or 'Studio' in title or 'Chrome' in title:
            wr = ctypes.wintypes.RECT()
            GetWindowRect(hwnd, ctypes.byref(wr))
            w = wr.right - wr.left
            h = wr.bottom - wr.top
            chrome_hwnds.append((hwnd, title[:60], w, h))
    return True

EnumWindows(EnumWindowsProc(enum_cb), 0)
print("Chrome_WidgetWin_1 windows found:")
for h, t, w, ht in chrome_hwnds:
    print(f"  {h:#010x} [{w}x{ht}]: {t}")

# Pick the largest Chrome window (the browser, not Claude)
# Claude Electron windows tend to be smaller
browser_hwnds = [(h, t, w, ht) for h, t, w, ht in chrome_hwnds if 'Claude' not in t]
if not browser_hwnds:
    # Fallback: pick by size - Claude windows are usually narrower
    browser_hwnds = sorted(chrome_hwnds, key=lambda x: x[2]*x[3], reverse=True)

if not browser_hwnds:
    print("ERROR: No Chrome browser window found")
    sys.exit(1)

hwnd, title, win_w, win_h = browser_hwnds[0]
print(f"\nSelected Chrome window: {hwnd:#010x} [{win_w}x{win_h}]: {title}")

# -------- Activate Chrome --------
result = activate_window(hwnd)
print(f"Activated: {result}, foreground: {GetForegroundWindow() == hwnd}")
time.sleep(0.5)

# -------- Get window position --------
wr = ctypes.wintypes.RECT()
GetWindowRect(hwnd, ctypes.byref(wr))
pt = ctypes.wintypes.POINT(0, 0)
ClientToScreen(hwnd, ctypes.byref(pt))
client_left = pt.x
client_top  = pt.y
print(f"Window rect: ({wr.left},{wr.top})-({wr.right},{wr.bottom})")
print(f"Client area starts at screen: ({client_left}, {client_top})")

# Chrome toolbar height = window height - viewport height
# viewport height = 937 (from JS measurement)
viewport_w = 1876  # CSS px (DPR=1 so = physical px)
viewport_h = 937
toolbar_h = win_h - viewport_h
print(f"Chrome toolbar height (estimated): {toolbar_h}px")

# -------- Use Ctrl+Shift+A to open Tab Search and switch to YT Studio --------
print("\nSending Ctrl+Shift+A to open tab search...")
key_down(VK_CONTROL)
key_down(VK_SHIFT)
key_down(0x41)  # 'A'
time.sleep(0.1)
key_up(0x41)
key_up(VK_SHIFT)
key_up(VK_CONTROL)
time.sleep(0.6)

print("Typing 'YouTube Studio'...")
type_string("Channel dashboard")
time.sleep(0.5)

print("Pressing Enter to switch to tab...")
key_down(VK_RETURN)
time.sleep(0.05)
key_up(VK_RETURN)
time.sleep(0.8)

# -------- Now "Select files" button should be visible, click it --------
# Button center in CSS px (from getBoundingClientRect when tab was active):
# viewport 1280x529: button CSS center (640, 399)
# Now viewport 1876x937:
# - x center: viewport_w / 2 = 938 (dialog is horizontally centered)
# - y: the dialog is position:fixed. If it was at y=399 with a 529 viewport,
#   proportionally: 399/529 * 937 = ~707
#   But for a fixed/absolute modal, try both 602 and 707
btn_css_x = viewport_w // 2          # = 938 (centered)
btn_css_y = int(399 / 529 * viewport_h)  # = ~707, or try fixed estimate ~600

# Screen coordinates (DPR=1, so CSS px = physical px):
screen_x = client_left + btn_css_x
screen_y_v1 = client_top + toolbar_h + btn_css_y
screen_y_v2 = client_top + toolbar_h + 600  # alternative estimate

print(f"\nEstimated button screen coords:")
print(f"  v1 (proportional): ({screen_x}, {screen_y_v1})")
print(f"  v2 (fixed ~600):   ({screen_x}, {screen_y_v2})")

# Try v1 first
print(f"\nAttempting click at ({screen_x}, {screen_y_v1})...")
mouse_click(screen_x, screen_y_v1)
time.sleep(1.0)

# Check if file picker appeared (the Python watcher will handle it)
# If not, try v2
import ctypes as _ct
hwnd32770 = user32.FindWindowW("#32770", None)
if hwnd32770:
    print(f"File dialog found at hwnd={hwnd32770:#010x}! Watcher should handle it.")
else:
    print("No file dialog yet. Trying alternative Y coordinate...")
    mouse_click(screen_x, screen_y_v2)
    time.sleep(1.0)
    hwnd32770 = user32.FindWindowW("#32770", None)
    if hwnd32770:
        print(f"File dialog found at hwnd={hwnd32770:#010x}!")
    else:
        print("Still no file dialog. Trying center of screen...")
        # Last resort: click directly at physical screen center + 580 vertical
        screen_center_x = (wr.left + wr.right) // 2
        screen_center_y = client_top + toolbar_h + 580
        mouse_click(screen_center_x, screen_center_y)
        time.sleep(1.0)
        hwnd32770 = user32.FindWindowW("#32770", None)
        if hwnd32770:
            print(f"File dialog found at hwnd={hwnd32770:#010x}!")
        else:
            print("No file dialog found after 3 attempts.")

print("\nDone. Check fill_dialog_py.log for watcher status.")

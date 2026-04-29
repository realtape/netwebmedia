"""
click_v2.py  — targets 0x00010628, activates it, Ctrl+Shift+A to switch
to YT Studio tab, then SendInput-clicks the "Select files" button.
"""
import ctypes, ctypes.wintypes, time, sys
sys.stdout.reconfigure(encoding='utf-8')

u32 = ctypes.windll.user32
HWND_YT = 0x00010628   # Chrome window with Instagram + YT Studio tabs

# ─── Win32 structs ───────────────────────────────────────────────────────────
INPUT_KEYBOARD = 1; INPUT_MOUSE = 0
KEYEVENTF_KEYUP = 0x0002; KEYEVENTF_UNICODE = 0x0004
MOUSEEVENTF_LEFTDOWN = 0x0002; MOUSEEVENTF_LEFTUP = 0x0004

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", ctypes.wintypes.WORD), ("wScan", ctypes.wintypes.WORD),
                ("dwFlags", ctypes.wintypes.DWORD), ("time", ctypes.wintypes.DWORD),
                ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]
class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx", ctypes.c_long), ("dy", ctypes.c_long),
                ("mouseData", ctypes.wintypes.DWORD), ("dwFlags", ctypes.wintypes.DWORD),
                ("time", ctypes.wintypes.DWORD), ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]
class _U(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT), ("mi", MOUSEINPUT)]
class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.wintypes.DWORD), ("_u", _U)]

def key(vk, up=False):
    i = INPUT(type=INPUT_KEYBOARD); i._u.ki.wVk = vk
    i._u.ki.dwFlags = KEYEVENTF_KEYUP if up else 0
    u32.SendInput(1, ctypes.byref(i), ctypes.sizeof(i))

def hotkey(vk, *mods):
    for m in mods: key(m)
    key(vk); time.sleep(0.05)
    key(vk, up=True)
    for m in reversed(mods): key(m, up=True)

def type_text(s):
    for ch in s:
        for up in (False, True):
            i = INPUT(type=INPUT_KEYBOARD); i._u.ki.wVk = 0
            i._u.ki.wScan = ord(ch); i._u.ki.dwFlags = KEYEVENTF_UNICODE | (KEYEVENTF_KEYUP if up else 0)
            u32.SendInput(1, ctypes.byref(i), ctypes.sizeof(i))
        time.sleep(0.04)

def click(x, y):
    u32.SetCursorPos(x, y); time.sleep(0.15)
    for f in (MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP):
        i = INPUT(type=INPUT_MOUSE); i._u.mi.dwFlags = f
        u32.SendInput(1, ctypes.byref(i), ctypes.sizeof(i)); time.sleep(0.05)
    print(f"  Clicked ({x}, {y})")

def activate(hwnd):
    u32.ShowWindow(hwnd, 9)   # SW_RESTORE
    time.sleep(0.25)
    fg = u32.GetForegroundWindow()
    if fg != hwnd:
        fg_tid = u32.GetWindowThreadProcessId(fg, None)
        tgt_tid = u32.GetWindowThreadProcessId(hwnd, None)
        u32.AttachThreadInput(fg_tid, tgt_tid, True)
        u32.BringWindowToTop(hwnd); u32.SetForegroundWindow(hwnd)
        u32.AttachThreadInput(fg_tid, tgt_tid, False)
        time.sleep(0.45)
    return u32.GetForegroundWindow() == hwnd

# ─── Activate the Chrome window ──────────────────────────────────────────────
wr = ctypes.wintypes.RECT()
u32.GetWindowRect(HWND_YT, ctypes.byref(wr))
win_w = wr.right - wr.left; win_h = wr.bottom - wr.top
pt = ctypes.wintypes.POINT(0, 0)
u32.ClientToScreen(HWND_YT, ctypes.byref(pt))
client_x, client_y = pt.x, pt.y

print(f"Window 0x{HWND_YT:08x}: {win_w}x{win_h}")
print(f"Client origin on screen: ({client_x}, {client_y})")

ok = activate(HWND_YT)
print(f"Activated: {ok}")
time.sleep(0.3)

# ─── Ctrl+Shift+A → type → Enter ─────────────────────────────────────────────
VK_CTRL=0x11; VK_SHIFT=0x10; VK_A=0x41; VK_RETURN=0x0D; VK_ESC=0x1B

print("Opening Chrome tab search (Ctrl+Shift+A)...")
hotkey(VK_A, VK_CTRL, VK_SHIFT)
time.sleep(0.6)

print("Typing 'Channel dashboard'...")
type_text("Channel dashboard")
time.sleep(0.5)

print("Pressing Enter to switch tab...")
key(VK_RETURN); time.sleep(0.05); key(VK_RETURN, up=True)
time.sleep(1.0)   # wait for tab to become active & render

# ─── Calculate button screen coords ──────────────────────────────────────────
# viewport: 1876 x 937 CSS px (DPR=1 so CSS px == physical px)
# Chrome toolbar height = win_h - 937 (viewport height)
viewport_h = 937
toolbar_h = win_h - viewport_h
print(f"Toolbar height: {toolbar_h}px")

# "Select files" button — two Y estimates:
#   v1: same absolute CSS-y as measured at 529-viewport  (≈399)
#   v2: proportional (399/529 * 937 ≈ 707)
#   v3: dialog top:50% midpoint guess (≈609)
btn_css_x = 1876 // 2   # dialog is horizontally centered
candidates = [
    ("v1 y≈399", client_x + btn_css_x,  client_y + toolbar_h + 399),
    ("v2 y≈707", client_x + btn_css_x,  client_y + toolbar_h + 707),
    ("v3 y≈609", client_x + btn_css_x,  client_y + toolbar_h + 609),
]

for label, sx, sy in candidates:
    print(f"\nAttempting {label}: screen ({sx}, {sy})")
    click(sx, sy)
    time.sleep(1.2)
    hwnd32 = u32.FindWindowW("#32770", None)
    if hwnd32:
        print(f"  ✓ File dialog appeared! hwnd={hwnd32:#010x}")
        print("  Python watcher should fill the path automatically.")
        break
    else:
        print("  No file dialog yet, trying next coordinate...")
else:
    print("\nNo file dialog appeared after all attempts.")
    print("Check if the upload dialog was dismissed or try manually.")

print("\nDone.")

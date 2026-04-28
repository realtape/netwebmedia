"""
Use Windows SendInput (real trusted input event) to:
1. Find and activate the Chrome window
2. Click the "Channel content - YouTube Studio" tab
3. Click the "Select files" button at known absolute coords
4. Fill the file dialog that appears
"""
import ctypes, ctypes.wintypes, time, subprocess, sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"

# Screen dimensions (confirmed 1920x1080, DPI=1)
SCREEN_W = 1920
SCREEN_H = 1080

# Absolute screen coords of "Select files" button (from JS getBoundingClientRect)
BTN_X = 960
BTN_Y = 762

# Tab bar position of "Channel content - YouTube Studio" tab
# (4th tab in first Chrome window, ~x=791, y=19 in 1920x1080 coords)
# From screenshot: tab at ~590/1456 * 1920 = 777, y=14/816*1080=18
TAB_X = 777
TAB_Y = 19

user32 = ctypes.windll.user32
EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)

# ─── SendInput ────────────────────────────────────────────────────────────────
MOUSEEVENTF_MOVE        = 0x0001
MOUSEEVENTF_LEFTDOWN    = 0x0002
MOUSEEVENTF_LEFTUP      = 0x0004
MOUSEEVENTF_ABSOLUTE    = 0x8000
MOUSEEVENTF_NOCOALESCE  = 0x2000

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx",ctypes.c_long),("dy",ctypes.c_long),
                ("mouseData",ctypes.c_ulong),("dwFlags",ctypes.c_ulong),
                ("time",ctypes.c_ulong),("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]

class INPUT_UNION(ctypes.Union):
    _fields_ = [("mi", MOUSEINPUT)]

class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong), ("_input", INPUT_UNION)]

def send_click(x, y, delay=0.1):
    nx = int(x * 65535 / SCREEN_W)
    ny = int(y * 65535 / SCREEN_H)
    print(f"  SendInput click ({x},{y}) -> normalized ({nx},{ny})")
    move = INPUT(); move.type = 0
    move._input.mi.dx = nx; move._input.mi.dy = ny
    move._input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_NOCOALESCE
    dn = INPUT(); dn.type = 0
    dn._input.mi.dx = nx; dn._input.mi.dy = ny; dn._input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE
    up = INPUT(); up.type = 0
    up._input.mi.dx = nx; up._input.mi.dy = ny; up._input.mi.dwFlags = MOUSEEVENTF_LEFTUP | MOUSEEVENTF_ABSOLUTE
    arr = (INPUT * 3)(move, dn, up)
    user32.SendInput(3, arr, ctypes.sizeof(INPUT))
    time.sleep(delay)

# ─── Window helpers ───────────────────────────────────────────────────────────
def get_title(hwnd):
    n = user32.GetWindowTextLengthW(hwnd)
    b = ctypes.create_unicode_buffer(n+1)
    user32.GetWindowTextW(hwnd, b, n+1)
    return b.value

def get_cls(hwnd):
    b = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, b, 256)
    return b.value

def get_rect(hwnd):
    r = ctypes.wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(r))
    return r.left, r.top, r.right, r.bottom

def find_chrome_windows():
    wins = []
    def cb(hwnd, _):
        if not user32.IsWindowVisible(hwnd): return True
        cls = get_cls(hwnd)
        title = get_title(hwnd)
        if cls == 'Chrome_WidgetWin_1' and 'Claude' not in title:
            wins.append((hwnd, title))
        return True
    user32.EnumWindows(EnumWindowsProc(cb), 0)
    return wins

# ─── File dialog filler ───────────────────────────────────────────────────────
def fill_dialog(known):
    print("Watching for file dialog (20s)...")
    start = time.time()
    while time.time() - start < 20:
        cur = []
        def cb2(hwnd, _):
            cur.append(hwnd); return True
        user32.EnumWindows(EnumWindowsProc(cb2), 0)
        for hwnd in cur:
            if hwnd in known: continue
            known.add(hwnd)
            title = get_title(hwnd)
            cls = get_cls(hwnd)
            vis = bool(user32.IsWindowVisible(hwnd))
            if vis:
                print(f"  New visible window: hwnd={hwnd} cls='{cls}' title='{title}'")
            if cls == '#32770' or any(k in title for k in ['Open','Abrir','Select','Upload']):
                print(f"  -> FILE DIALOG FOUND! Filling...")
                time.sleep(0.5)
                edit = user32.FindWindowExW(hwnd, 0, "Edit", None)
                combo = user32.FindWindowExW(hwnd, 0, "ComboBoxEx32", None)
                if combo:
                    inner = user32.FindWindowExW(combo, 0, "ComboBox", None)
                    if inner:
                        edit = user32.FindWindowExW(inner, 0, "Edit", None)
                if edit:
                    user32.SendMessageW(edit, 0x000C, 0, FILE_PATH)
                    time.sleep(0.3)
                    user32.PostMessageW(edit, 0x0100, 0x0D, 0)
                    user32.PostMessageW(edit, 0x0101, 0x0D, 0)
                    time.sleep(0.3)
                    btn = user32.FindWindowExW(hwnd, 0, "Button", None)
                    if btn:
                        user32.PostMessageW(btn, 0x00F5, 0, 0)
                    print("  -> Done!")
                    return True
                else:
                    user32.SetForegroundWindow(hwnd)
                    time.sleep(0.5)
                    esc = FILE_PATH.replace('{','{{').replace('}','}}')
                    subprocess.run(["powershell","-Command",
                        f'Add-Type -AssemblyName System.Windows.Forms; '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{esc}"); '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{{ENTER}}")'])
                    print("  -> Done via SendKeys!")
                    return True
        time.sleep(0.05)
    print("  TIMEOUT: no file dialog")
    return False

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    chrome_wins = find_chrome_windows()
    print("Chrome windows found:")
    for hwnd, title in chrome_wins:
        l,t,r,b = get_rect(hwnd)
        print(f"  hwnd={hwnd} title='{title}' rect=({l},{t},{r},{b})")

    if not chrome_wins:
        print("ERROR: No Chrome windows found"); sys.exit(1)

    # Pick the maximized Chrome window at (0,0)
    target = None
    for hwnd, title in chrome_wins:
        l,t,r,b = get_rect(hwnd)
        if l == 0 and t == 0 and (r-l) >= 1800:
            target = hwnd
            print(f"Target: hwnd={hwnd} title='{title}'")
            break

    if not target:
        # Fallback: use first non-Claude chrome window
        target = chrome_wins[0][0]
        print(f"Fallback target: hwnd={target}")

    # Snapshot existing windows
    known = set()
    def snap(hwnd, _): known.add(hwnd); return True
    user32.EnumWindows(EnumWindowsProc(snap), 0)
    print(f"Recorded {len(known)} existing windows")

    # Bring Chrome to front
    user32.ShowWindow(target, 9)  # SW_RESTORE
    user32.SetForegroundWindow(target)
    time.sleep(0.8)

    # Click the Studio tab to activate it
    print(f"Clicking Studio tab at ({TAB_X}, {TAB_Y})...")
    send_click(TAB_X, TAB_Y, delay=1.0)

    # Now click Select files
    print(f"Clicking Select files at ({BTN_X}, {BTN_Y})...")
    send_click(BTN_X, BTN_Y, delay=0.5)

    # Fill dialog
    fill_dialog(known)

if __name__ == "__main__":
    main()

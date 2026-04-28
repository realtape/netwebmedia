"""
1. Find Chrome window with YouTube Studio upload dialog
2. Bring it to front (SetForegroundWindow)
3. Use SendInput to fire a REAL trusted mouse click at the 'Select files' button
4. Poll for the file dialog and fill it in
"""
import ctypes
import ctypes.wintypes
import time
import subprocess
import sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"

user32 = ctypes.windll.user32

# ─── window helpers ───────────────────────────────────────────────────────────
EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)

def get_window_info(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    buf = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buf, length + 1)
    cls = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, cls, 256)
    return buf.value, cls.value

def find_studio_chrome():
    """Find the Chrome window that has YouTube Studio."""
    result = []
    def cb(hwnd, _):
        if not user32.IsWindowVisible(hwnd):
            return True
        title, cls = get_window_info(hwnd)
        if 'Chrome' in cls or 'chrome' in cls.lower():
            if 'YouTube' in title or 'Studio' in title or 'studio.youtube' in title:
                result.append((hwnd, title, cls))
        return True
    user32.EnumWindows(EnumWindowsProc(cb), 0)
    return result

def get_window_rect(hwnd):
    rect = ctypes.wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))
    return rect.left, rect.top, rect.right, rect.bottom

# ─── SendInput structures ──────────────────────────────────────────────────────
MOUSEEVENTF_MOVE       = 0x0001
MOUSEEVENTF_LEFTDOWN   = 0x0002
MOUSEEVENTF_LEFTUP     = 0x0004
MOUSEEVENTF_ABSOLUTE   = 0x8000
MOUSEEVENTF_MOVE_NOCOALESCE = 0x2000

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx",          ctypes.c_long),
        ("dy",          ctypes.c_long),
        ("mouseData",   ctypes.c_ulong),
        ("dwFlags",     ctypes.c_ulong),
        ("time",        ctypes.c_ulong),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]

class INPUT_UNION(ctypes.Union):
    _fields_ = [("mi", MOUSEINPUT)]

class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong), ("_input", INPUT_UNION)]

INPUT_MOUSE = 0

def send_mouse_click(abs_x, abs_y):
    """Send a real trusted left-click via SendInput at absolute screen coords."""
    # Convert to normalized absolute coords (0–65535)
    screen_w = user32.GetSystemMetrics(0)
    screen_h = user32.GetSystemMetrics(1)
    norm_x = int(abs_x * 65535 / screen_w)
    norm_y = int(abs_y * 65535 / screen_h)

    move = INPUT()
    move.type = INPUT_MOUSE
    move.mi.dx = norm_x
    move.mi.dy = norm_y
    move.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE_NOCOALESCE

    down = INPUT()
    down.type = INPUT_MOUSE
    down.mi.dx = norm_x
    down.mi.dy = norm_y
    down.mi.dwFlags = MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE

    up = INPUT()
    up.type = INPUT_MOUSE
    up.mi.dx = norm_x
    up.mi.dy = norm_y
    up.mi.dwFlags = MOUSEEVENTF_LEFTUP | MOUSEEVENTF_ABSOLUTE

    inputs = (INPUT * 3)(move, down, up)
    user32.SendInput(3, inputs, ctypes.sizeof(INPUT))
    print(f"  SendInput click at screen ({abs_x}, {abs_y}) / normalized ({norm_x}, {norm_y})")

# ─── file dialog filler ───────────────────────────────────────────────────────
def fill_file_dialog(file_path, known_hwnds):
    """Wait up to 20s for a new file dialog, then fill it."""
    print(f"  Waiting for file dialog...")
    start = time.time()
    while time.time() - start < 20:
        current_hwnds = []
        def cb2(hwnd, _):
            if user32.IsWindowVisible(hwnd):
                current_hwnds.append(hwnd)
            return True
        user32.EnumWindows(EnumWindowsProc(cb2), 0)

        for hwnd in current_hwnds:
            if hwnd in known_hwnds:
                continue
            known_hwnds.add(hwnd)
            title, cls = get_window_info(hwnd)
            print(f"    New window: hwnd={hwnd} cls='{cls}' title='{title}'")
            if cls == '#32770' or any(k in title for k in ['Open', 'Abrir', 'Select', 'Upload', 'file']):
                print(f"    -> FILE DIALOG! Filling...")
                time.sleep(0.5)
                # Find Edit control
                edit = user32.FindWindowExW(hwnd, 0, "Edit", None)
                combo = user32.FindWindowExW(hwnd, 0, "ComboBoxEx32", None)
                if combo:
                    inner = user32.FindWindowExW(combo, 0, "ComboBox", None)
                    if inner:
                        edit = user32.FindWindowExW(inner, 0, "Edit", None)
                if edit:
                    user32.SendMessageW(edit, 0x000C, 0, file_path)  # WM_SETTEXT
                    time.sleep(0.2)
                    user32.PostMessageW(edit, 0x0100, 0x0D, 0)  # WM_KEYDOWN Enter
                    user32.PostMessageW(edit, 0x0101, 0x0D, 0)  # WM_KEYUP Enter
                    time.sleep(0.3)
                    btn = user32.FindWindowExW(hwnd, 0, "Button", None)
                    if btn:
                        user32.PostMessageW(btn, 0x00F5, 0, 0)  # BM_CLICK
                    print(f"    -> Done via WM_SETTEXT + Enter")
                    return True
                else:
                    # Fallback: activate and type
                    user32.SetForegroundWindow(hwnd)
                    time.sleep(0.5)
                    # SendKeys via PowerShell
                    escaped = file_path.replace('{', '{{').replace('}', '}}')
                    subprocess.run([
                        "powershell", "-Command",
                        f'Add-Type -AssemblyName System.Windows.Forms; '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{escaped}"); '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{{ENTER}}")'
                    ])
                    print(f"    -> Done via SendKeys fallback")
                    return True
        time.sleep(0.05)
    print("  TIMEOUT: no file dialog found")
    return False

# ─── main ─────────────────────────────────────────────────────────────────────
def main():
    # 1. Find Chrome / Studio window
    matches = find_studio_chrome()
    if not matches:
        print("ERROR: Could not find Chrome window with YouTube Studio")
        print("Searching for ANY chrome window...")
        result2 = []
        def cb3(hwnd, _):
            if not user32.IsWindowVisible(hwnd): return True
            t, c = get_window_info(hwnd)
            if 'Chrome' in c:
                result2.append((hwnd, t, c))
            return True
        user32.EnumWindows(EnumWindowsProc(cb3), 0)
        for h, t, c in result2:
            print(f"  Chrome window: title='{t}' class='{c}'")
        sys.exit(1)

    hwnd, title, cls = matches[0]
    print(f"Found: hwnd={hwnd} title='{title}'")

    # 2. Get window bounds
    left, top, right, bottom = get_window_rect(hwnd)
    w = right - left
    h = bottom - top
    print(f"  Window rect: ({left},{top}) {w}x{h}")

    # Chrome UI height estimate: 65px (tabs + address bar)
    chrome_ui_h = 65

    # Viewport dims
    vp_w = w
    vp_h = h - chrome_ui_h

    # "Select files" button: approx center-x, ~63% down viewport
    btn_vp_x = vp_w // 2
    btn_vp_y = int(vp_h * 0.63)
    btn_abs_x = left + btn_vp_x
    btn_abs_y = top + chrome_ui_h + btn_vp_y
    print(f"  Estimated 'Select files' at screen ({btn_abs_x}, {btn_abs_y})")

    # 3. Bring Chrome to front
    user32.ShowWindow(hwnd, 9)  # SW_RESTORE
    user32.SetForegroundWindow(hwnd)
    time.sleep(0.5)

    # 4. Snapshot existing windows
    known = set()
    def snap(hwnd2, _):
        known.add(hwnd2)
        return True
    user32.EnumWindows(EnumWindowsProc(snap), 0)
    print(f"  Recorded {len(known)} existing windows")

    # 5. Click "Select files" with SendInput
    send_mouse_click(btn_abs_x, btn_abs_y)
    time.sleep(0.3)

    # 6. Wait for and fill the file dialog
    if not fill_file_dialog(FILE_PATH, known):
        # try again with a slightly different y (maybe dialog wasn't open yet)
        print("  Retrying click...")
        send_mouse_click(btn_abs_x, btn_abs_y)
        time.sleep(0.3)
        fill_file_dialog(FILE_PATH, known)

if __name__ == "__main__":
    main()

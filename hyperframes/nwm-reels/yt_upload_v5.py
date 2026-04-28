"""
YouTube Studio upload v5:
1. Bring hwnd=1378226 (YouTube Studio) to foreground
2. Click the 'Select files' button at screen (960, 648) via pyautogui SendInput
3. Poll for the native Windows file dialog (#32770 or any new hwnd)
4. Enter the file path
"""
import time, sys, threading, ctypes, win32gui, win32con, pyautogui, pyperclip

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
YT_HWND   = 1378226
BTN_X, BTN_Y = 960, 648   # screen coords of 'Select files' button (from JS: CSS 960,561 + viewport top 87)
POLL_SECS = 45

def log(m): print(m, flush=True)

def force_fg(hwnd):
    fg = ctypes.windll.user32.GetForegroundWindow()
    fg_tid = ctypes.windll.user32.GetWindowThreadProcessId(fg, None)
    my_tid = ctypes.windll.kernel32.GetCurrentThreadId()
    h_tid  = ctypes.windll.user32.GetWindowThreadProcessId(hwnd, None)
    ctypes.windll.user32.AttachThreadInput(my_tid, fg_tid, True)
    ctypes.windll.user32.AttachThreadInput(h_tid,  fg_tid, True)
    ctypes.windll.user32.AllowSetForegroundWindow(hwnd)
    win32gui.BringWindowToTop(hwnd)
    win32gui.SetForegroundWindow(hwnd)
    ctypes.windll.user32.AttachThreadInput(my_tid, fg_tid, False)
    ctypes.windll.user32.AttachThreadInput(h_tid,  fg_tid, False)

def snapshot_hwnds():
    result = {}
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            c = win32gui.GetClassName(h)
            rc = win32gui.GetWindowRect(h)
            w, ht = rc[2]-rc[0], rc[3]-rc[1]
            if w > 10 and ht > 10:
                result[h] = (t, c, rc)
    win32gui.EnumWindows(cb, None)
    return result

# Also enumerate child windows of the YouTube Studio hwnd
def snapshot_children(parent):
    result = {}
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            c = win32gui.GetClassName(h)
            rc = win32gui.GetWindowRect(h)
            w, ht = rc[2]-rc[0], rc[3]-rc[1]
            result[h] = (t, c, rc, w, ht)
    win32gui.EnumChildWindows(parent, cb, None)
    return result

log("=== YT Upload v5 ===")
log(f"Target: hwnd={YT_HWND}, button at screen ({BTN_X}, {BTN_Y})")

# Step 1: Force YT window to foreground
log("Step 1: Bringing YouTube Studio window to foreground...")
force_fg(YT_HWND)
time.sleep(0.8)

# Verify it's in front
fg_now = ctypes.windll.user32.GetForegroundWindow()
log(f"  Foreground now: {fg_now} (expected {YT_HWND}) — {'OK' if fg_now == YT_HWND else 'MISMATCH'}")

# Snapshot children before click
children_before = snapshot_children(YT_HWND)
top_before = snapshot_hwnds()
log(f"  Child windows before click: {len(children_before)}")
log(f"  Top-level windows before: {len(top_before)}")

# Step 2: Click the button
log(f"Step 2: Clicking at ({BTN_X}, {BTN_Y})...")
pyautogui.moveTo(BTN_X, BTN_Y, duration=0.1)
time.sleep(0.1)
pyautogui.click(BTN_X, BTN_Y)
log("  Click sent.")

# Step 3: Poll for new windows + child windows
log(f"Step 3: Polling for file dialog (up to {POLL_SECS}s)...")
deadline = time.time() + POLL_SECS
found = None

while time.time() < deadline:
    time.sleep(0.2)

    # Check new top-level windows
    top_now = snapshot_hwnds()
    new_top = {h: info for h, info in top_now.items() if h not in top_before}
    if new_top:
        for h, (t, c, rc) in new_top.items():
            w, ht = rc[2]-rc[0], rc[3]-rc[1]
            log(f"  NEW top-level: hwnd={h} '{t}' [{c}] {w}x{ht}")
            if found is None:
                found = (h, t, c)

    # Check new child windows of YouTube Studio
    children_now = snapshot_children(YT_HWND)
    new_children = {h: info for h, info in children_now.items() if h not in children_before}
    if new_children:
        for h, (t, c, rc, w, ht) in new_children.items():
            log(f"  NEW child: hwnd={h} '{t}' [{c}] {w}x{ht}")
            # #32770 child = native file dialog hosted in Chrome
            if c in ('#32770',) and w > 200 and ht > 100 and found is None:
                found = (h, t, c)

    if found:
        break

if not found:
    log("FAILED: no file dialog detected.")
    log("Trying keyboard fallback (type path into whatever is focused)...")
    time.sleep(0.5)
    pyperclip.copy(FILE_PATH)
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.15)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.4)
    pyautogui.press('enter')
    log("Keyboard fallback sent. Check if path was accepted.")
    sys.exit(1)

log(f"Found dialog: hwnd={found[0]} '{found[1]}' [{found[2]}]")
time.sleep(0.5)
try:
    win32gui.SetForegroundWindow(found[0])
except:
    pass
time.sleep(0.3)
pyperclip.copy(FILE_PATH)
pyautogui.hotkey('ctrl', 'a')
time.sleep(0.15)
pyautogui.hotkey('ctrl', 'v')
time.sleep(0.4)
pyautogui.press('enter')
time.sleep(1.5)
log("Path entered. Upload should be starting.")
sys.exit(0)

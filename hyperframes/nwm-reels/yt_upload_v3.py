"""
YouTube Studio upload helper v3 - WAITER mode
Polls for a native file dialog to appear, then enters the file path.
Run this BEFORE clicking "Select files" in the browser.
"""
import time, sys, win32gui, pyautogui, pyperclip

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
POLL_SECONDS = 30   # wait up to 30s for file dialog

def log(m): print(m, flush=True)

def find_file_dialog():
    dlgs = []
    def cb(h, r):
        if not win32gui.IsWindowVisible(h):
            return
        t = win32gui.GetWindowText(h)
        c = win32gui.GetClassName(h)
        rc = win32gui.GetWindowRect(h)
        w = rc[2] - rc[0]
        ht = rc[3] - rc[1]
        # Windows file open dialog has class #32770 or Chrome's own picker
        if (c == '#32770' and w > 300 and ht > 200) or \
           t in ('Open', 'Choose File to Upload', 'Select file(s) to upload'):
            r.append((h, t, c, rc))
    win32gui.EnumWindows(cb, dlgs)
    return dlgs

log("=== YT Upload Helper v3 — waiting for file dialog ===")
log(f"Will type: {FILE_PATH}")
log(f"Polling for up to {POLL_SECONDS}s ...")

deadline = time.time() + POLL_SECONDS
found = None
while time.time() < deadline:
    dlgs = find_file_dialog()
    if dlgs:
        found = dlgs[0]
        break
    time.sleep(0.4)

if not found:
    log("FAILED: no file dialog appeared within timeout")
    sys.exit(1)

hwnd, title, cls, rc = found
log(f"File dialog found! hwnd={hwnd} title='{title}' class={cls} rect={rc}")

# Give it a moment to fully render
time.sleep(0.4)

# Paste path into the filename field
pyperclip.copy(FILE_PATH)
# Send Ctrl+A to select whatever is in the filename field, then paste
pyautogui.hotkey('ctrl', 'a')
time.sleep(0.15)
pyautogui.hotkey('ctrl', 'v')
time.sleep(0.4)
pyautogui.press('enter')
time.sleep(1.5)

log("Path entered and Enter pressed — upload should begin.")
sys.exit(0)

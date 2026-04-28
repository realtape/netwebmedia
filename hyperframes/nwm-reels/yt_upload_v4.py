"""
YouTube Studio upload helper v4
Monitors for ANY new top-level window after the button click.
"""
import time, sys, win32gui, pyautogui, pyperclip

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
POLL_SECONDS = 60

def log(m): print(m, flush=True)

def get_all_visible_hwnds():
    result = {}
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            c = win32gui.GetClassName(h)
            rc = win32gui.GetWindowRect(h)
            w = rc[2] - rc[0]
            ht = rc[3] - rc[1]
            if w > 50 and ht > 50:
                result[h] = (t, c, rc)
    win32gui.EnumWindows(cb, None)
    return result

log("=== YT Upload Helper v4 ===")
log(f"Will enter: {FILE_PATH}")

baseline = get_all_visible_hwnds()
log(f"Baseline: {len(baseline)} visible windows")
for h,(t,c,rc) in baseline.items():
    log(f"  hwnd={h} '{t}' [{c}] rect={rc}")

deadline = time.time() + POLL_SECONDS
found_new = None

while time.time() < deadline:
    current = get_all_visible_hwnds()
    new_hwnds = {h: info for h, info in current.items() if h not in baseline}
    if new_hwnds:
        log(f"\n=== NEW WINDOWS ===")
        for h, (t, c, rc) in new_hwnds.items():
            w = rc[2] - rc[0]
            ht = rc[3] - rc[1]
            log(f"  hwnd={h} title='{t}' class={c} size={w}x{ht}")
            if found_new is None:
                found_new = (h, t, c)
        if found_new:
            log(f"Handling: hwnd={found_new[0]}")
            time.sleep(0.5)
            try:
                win32gui.SetForegroundWindow(found_new[0])
            except Exception as e:
                log(f"  SetForeground error: {e}")
            time.sleep(0.3)
            pyperclip.copy(FILE_PATH)
            pyautogui.hotkey('ctrl', 'a')
            time.sleep(0.2)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.4)
            pyautogui.press('enter')
            log("Path entered.")
            sys.exit(0)
    time.sleep(0.2)

log("FAILED: no new window")
# Log what changed in windows
current = get_all_visible_hwnds()
log(f"Final windows: {len(current)}")
sys.exit(1)

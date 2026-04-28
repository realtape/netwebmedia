"""
yt_upload_v10.py
================
Improved version that:
1. Pre-dismisses any existing stale #32770 dialogs (Escape/Enter)
2. Records existing dialog hwnds before clicking Select files
3. Only accepts NEW dialogs that appear after the click
4. Full flow: minimize Claude → navigate → Create → Upload → Select files

Usage: python yt_upload_v10.py <path_to_mp4>
"""
import ctypes, ctypes.wintypes, time, os, sys, subprocess

if len(sys.argv) < 2:
    print("Usage: python yt_upload_v10.py <path_to_mp4>"); sys.exit(1)

FILE_PATH    = sys.argv[1]
LOG_PATH     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_v10.log"
CHROME_HWND  = 2820290
CLAUDE_HWND1 = 132606
CLAUDE_HWND2 = 13174642

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log(f"=== yt_upload_v10.py ===")
log(f"FILE: {FILE_PATH}")

if not os.path.exists(FILE_PATH):
    log(f"ERROR: File not found: {FILE_PATH}"); sys.exit(1)

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen {SCREEN_W}x{SCREEN_H}")

MOUSEEVENTF_MOVE       = 0x0001
MOUSEEVENTF_LEFTDOWN   = 0x0002
MOUSEEVENTF_LEFTUP     = 0x0004
MOUSEEVENTF_ABSOLUTE   = 0x8000
MOUSEEVENTF_NOCOALESCE = 0x2000
KEYEVENTF_KEYUP   = 0x0002
INPUT_MOUSE    = 0
INPUT_KEYBOARD = 1
VK_RETURN  = 0x0D
VK_ESCAPE  = 0x1B
VK_CONTROL = 0x11
VK_A = 0x41; VK_V = 0x56; VK_L = 0x4C
SW_MINIMIZE = 6
SW_RESTORE  = 9
SW_MAXIMIZE = 3
WM_SETTEXT  = 0x000C
BM_CLICK    = 0x00F5

class MI(ctypes.Structure):
    _fields_ = [("dx",ctypes.c_long),("dy",ctypes.c_long),
                ("mouseData",ctypes.c_ulong),("dwFlags",ctypes.c_ulong),
                ("time",ctypes.c_ulong),("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]
class KI(ctypes.Structure):
    _fields_ = [("wVk",ctypes.c_ushort),("wScan",ctypes.c_ushort),
                ("dwFlags",ctypes.c_ulong),("time",ctypes.c_ulong),
                ("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]
class _U(ctypes.Union):
    _fields_ = [("mi",MI),("ki",KI)]
class INPUT(ctypes.Structure):
    _fields_ = [("type",ctypes.c_ulong),("_input",_U)]

def si(*inputs):
    arr=(INPUT*len(inputs))(*inputs); return user32.SendInput(len(inputs),arr,ctypes.sizeof(INPUT))

def click(x,y,delay=0.15):
    nx=int(x*65535/SCREEN_W); ny=int(y*65535/SCREEN_H)
    r=si(INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_NOCOALESCE,0,None))),
         INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE,0,None))),
         INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE,0,None))))
    log(f"  click({x},{y}) r={r}"); time.sleep(delay)

def vkey(vk):
    si(INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,KEYEVENTF_KEYUP,0,None)))); time.sleep(0.08)

def ctrl(vk):
    si(INPUT(INPUT_KEYBOARD,_U(ki=KI(VK_CONTROL,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,KEYEVENTF_KEYUP,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(VK_CONTROL,0,KEYEVENTF_KEYUP,0,None)))); time.sleep(0.15)

def get_rect(h):
    r=ctypes.wintypes.RECT(); user32.GetWindowRect(h,ctypes.byref(r)); return r.left,r.top,r.right-r.left,r.bottom-r.top

def get_title(h):
    b=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,b,512); return b.value

def get_tid(h):
    pid=ctypes.c_ulong(0); tid=user32.GetWindowThreadProcessId(h,ctypes.byref(pid)); return tid,pid.value

def force_focus(hwnd):
    cur_fg=user32.GetForegroundWindow()
    tid_fg,_=get_tid(cur_fg); tid_tgt,_=get_tid(hwnd); tid_self=kernel32.GetCurrentThreadId()
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.1)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.2)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.6)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus hwnd={hwnd}: ok={new_fg==hwnd} actual={new_fg}"); return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

def find_all_dialogs():
    """Return set of all currently visible #32770 dialog hwnds."""
    found = set()
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
    def cb(h, _):
        cls = ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(h, cls, 64)
        if cls.value == "#32770":
            tid,pid = get_tid(h)
            if bool(user32.IsWindowVisible(h)) and pid > 0:
                found.add(h)
        return True
    user32.EnumWindows(WNDENUMPROC(cb), 0)
    return found

# ── STEP 0: Pre-dismiss stale dialogs ─────────────────────────────────────────
log("Step 0: Pre-dismissing stale dialogs...")
stale = find_all_dialogs()
log(f"  Existing dialogs: {stale}")
for h in stale:
    t = get_title(h)
    log(f"  Dismissing stale dialog hwnd={h} title='{t}'")
    user32.SetForegroundWindow(h); time.sleep(0.2)
    vkey(VK_ESCAPE); time.sleep(0.2)
    vkey(VK_RETURN); time.sleep(0.2)
time.sleep(0.5)

# Snapshot pre-existing dialogs AFTER dismissal attempt
pre_dialogs = find_all_dialogs()
log(f"  Pre-existing dialogs after dismissal: {pre_dialogs}")

# ── STEP 1: Minimize Claude ────────────────────────────────────────────────────
log("Step 1: Minimizing Claude windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
    log(f"  Minimize hwnd={h} title='{get_title(h)}'")
    user32.ShowWindow(h, SW_MINIMIZE); time.sleep(0.3)
time.sleep(0.5)

# ── STEP 2: Force focus to Chrome ─────────────────────────────────────────────
log("Step 2: Focusing Chrome...")
hwnd = CHROME_HWND
force_focus(hwnd)
wx,wy,ww,wh = get_rect(hwnd)
log(f"  Chrome rect: {wx},{wy} {ww}x{wh}")
log(f"  Chrome title: '{get_title(hwnd)}'")

# ── STEP 3: Navigate to Studio ────────────────────────────────────────────────
log("Step 3: Navigating to Studio...")
set_clip("https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ")
ctrl(VK_L); time.sleep(0.4)
ctrl(VK_A); time.sleep(0.1)
ctrl(VK_V); time.sleep(0.3)
vkey(VK_RETURN)
log("  Waiting 9s for Studio to load...")
time.sleep(9)
log(f"  Title: '{get_title(hwnd)}'")

# ── STEP 4: Re-focus Chrome ───────────────────────────────────────────────────
log("Step 4: Re-focusing Chrome...")
force_focus(hwnd); time.sleep(0.5)
wx,wy,ww,wh = get_rect(hwnd)
CHROME_UI_H = 65
vp_h = wh - CHROME_UI_H

# ── STEP 5: Click Create ──────────────────────────────────────────────────────
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Step 5: Click Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

# ── STEP 6: Click Upload videos ───────────────────────────────────────────────
upload_y = create_y + 45
log(f"Step 6: Click Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.5)

# ── STEP 7: Click Select files (with new-dialog tracking) ─────────────────────
select_x = wx + ww // 2
log(f"Step 7: Clicking Select files (x={select_x})...")
dialog = 0

for y_pct in [0.57, 0.55, 0.60, 0.52, 0.62, 0.50, 0.65, 0.48]:
    select_y = wy + CHROME_UI_H + int(vp_h * y_pct)
    log(f"  Trying Select files at ({select_x},{select_y}) pct={y_pct:.2f}")
    force_focus(hwnd); time.sleep(0.25)
    click(select_x, select_y, delay=1.0)

    # Watch for NEW dialogs (not in pre_dialogs)
    deadline = time.time() + 10
    while time.time() < deadline:
        current = find_all_dialogs()
        new_dialogs = current - pre_dialogs
        if new_dialogs:
            d = next(iter(new_dialogs))
            t = get_title(d)
            log(f"  NEW dialog hwnd={d} title='{t}'")
            dialog = d; break
        time.sleep(0.1)
    if dialog: break

if not dialog:
    log("  No new dialog found after all attempts")
    # Last resort: check all visible dialogs
    all_d = find_all_dialogs()
    log(f"  All dialogs now: {all_d}")
    if all_d:
        dialog = next(iter(all_d))
        log(f"  Using fallback dialog hwnd={dialog} title='{get_title(dialog)}'")

if not dialog:
    log("TIMEOUT: no file dialog");
    for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)
    sys.exit(1)

# ── STEP 8: Fill file path ────────────────────────────────────────────────────
log(f"Step 8: Handling dialog hwnd={dialog}...")
set_clip(FILE_PATH)
time.sleep(0.2)
user32.SetForegroundWindow(dialog); time.sleep(0.5)

hwnd_edit = user32.FindWindowExW(dialog, None, "Edit", None)
log(f"  Edit hwnd: {hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit, WM_SETTEXT, 0, FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog); time.sleep(0.15)
    vkey(VK_RETURN); time.sleep(0.4)
    hwnd_btn = user32.FindWindowExW(dialog, None, "Button", None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn, BM_CLICK, 0, 0)
        log(f"  Clicked Open btn: {hwnd_btn}")
    log("  Path set via WM_SETTEXT")
else:
    log("  No Edit ctrl - clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("  Path pasted + Enter")

# ── Restore Claude ─────────────────────────────────────────────────────────────
log("Restoring Claude windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)
log("=== Done - upload starting ===")
lf.close()

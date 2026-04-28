"""
yt_newwindow.py
===============
Opens a brand-new Chrome window directly to YouTube Studio,
then drives the upload flow with AttachThreadInput + SendInput.

This avoids the Calendly tab-lock problem entirely.
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_newwindow.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"
CHROME     = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_newwindow.py started ===")

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen {SCREEN_W}x{SCREEN_H}")

# ── Input primitives ──────────────────────────────────────────────────────────
MOUSEEVENTF_MOVE       = 0x0001
MOUSEEVENTF_LEFTDOWN   = 0x0002
MOUSEEVENTF_LEFTUP     = 0x0004
MOUSEEVENTF_ABSOLUTE   = 0x8000
MOUSEEVENTF_NOCOALESCE = 0x2000
KEYEVENTF_KEYUP   = 0x0002
KEYEVENTF_UNICODE = 0x0004
INPUT_MOUSE    = 0
INPUT_KEYBOARD = 1
VK_RETURN  = 0x0D
VK_CONTROL = 0x11
VK_A = 0x41; VK_V = 0x56
SW_RESTORE  = 9
SW_MAXIMIZE = 3
WM_SETTEXT = 0x000C
BM_CLICK   = 0x00F5
PROCESS_QUERY_LIMITED = 0x1000

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
def mk_m(dx,dy,fl): return INPUT(INPUT_MOUSE,_U(mi=MI(dx,dy,0,fl,0,None)))
def mk_k(vk,fl):    return INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,fl,0,None)))

def click(x,y,delay=0.15):
    nx=int(x*65535/SCREEN_W); ny=int(y*65535/SCREEN_H)
    r=si(mk_m(nx,ny,MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_NOCOALESCE),
         mk_m(nx,ny,MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE),
         mk_m(nx,ny,MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE))
    log(f"  click({x},{y}) r={r}"); time.sleep(delay)

def vkey(vk): si(mk_k(vk,0),mk_k(vk,KEYEVENTF_KEYUP)); time.sleep(0.06)
def ctrl(vk): si(mk_k(VK_CONTROL,0),mk_k(vk,0),mk_k(vk,KEYEVENTF_KEYUP),mk_k(VK_CONTROL,KEYEVENTF_KEYUP)); time.sleep(0.12)

def get_rect(h):
    r=ctypes.wintypes.RECT(); user32.GetWindowRect(h,ctypes.byref(r)); return r.left,r.top,r.right-r.left,r.bottom-r.top
def get_title(h):
    b=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,b,512); return b.value
def get_tid(h):
    pid=ctypes.c_ulong(0); tid=user32.GetWindowThreadProcessId(h,ctypes.byref(pid)); return tid,pid.value
def get_proc(pid):
    try:
        h=kernel32.OpenProcess(PROCESS_QUERY_LIMITED,False,pid)
        if not h: return ""
        b=ctypes.create_unicode_buffer(1024); s=ctypes.c_ulong(1024)
        kernel32.QueryFullProcessImageNameW(h,0,b,ctypes.byref(s)); kernel32.CloseHandle(h)
        return os.path.basename(b.value).lower()
    except: return ""

def force_focus(hwnd):
    cur_fg=user32.GetForegroundWindow()
    tid_fg,_=get_tid(cur_fg); tid_tgt,_=get_tid(hwnd); tid_self=kernel32.GetCurrentThreadId()
    log(f"  force_focus hwnd={hwnd}: fg={cur_fg} ok?")
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.2)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.3)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.5)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus result: fg={new_fg} ok={new_fg==hwnd}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True,timeout=10)
    log(f"  Clipboard: {text[:70]}")

def enum_chrome_visible():
    res=[]
    WNDENUMPROC=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(h,_):
        if not user32.IsWindowVisible(h): return True
        cls=ctypes.create_unicode_buffer(64); user32.GetClassNameW(h,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0); user32.GetWindowThreadProcessId(h,ctypes.byref(pid))
        if get_proc(pid.value) not in ("chrome.exe","chrome"): return True
        t=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,t,512)
        if t.value: res.append((h,t.value)); return True
        return True
    user32.EnumWindows(WNDENUMPROC(cb),0); return res

# ── STEP 0: Kill any lingering AHK file dialogs and prep clipboard ────────────
log("Step 0: Killing AHK dialog (hwnd=592206) and setting clipboard...")
# Close the AHK dialog if visible
ahk_dialog = 592206
if user32.IsWindowVisible(ahk_dialog):
    WM_CLOSE = 0x0010
    user32.PostMessageW(ahk_dialog, WM_CLOSE, 0, 0)
    log("  Closed AHK dialog")
    time.sleep(0.5)

# Pre-set clipboard with Studio URL BEFORE any focus operations
set_clip(STUDIO_URL)

# ── STEP 1: Open new Chrome window with Studio URL ────────────────────────────
log(f"Step 1: Opening new Chrome window: {STUDIO_URL}")
existing = set(h for h,_ in enum_chrome_visible())
log(f"  Existing Chrome windows: {list(existing)}")

subprocess.Popen([CHROME, "--new-window", STUDIO_URL])
log("  Chrome launched, waiting 9s for Studio to load...")
time.sleep(9)

# Find the NEW Chrome window (not in existing set)
wins = enum_chrome_visible()
log(f"  All Chrome windows now: {[(h,t[:40]) for h,t in wins]}")

target = None
for h, t in wins:
    if h not in existing and ("YouTube" in t or "Studio" in t):
        target = h
        log(f"  New Studio window: hwnd={h} '{t}'")
        break

# Fallback: any new Chrome window
if not target:
    for h, t in wins:
        if h not in existing:
            target = h
            log(f"  New (non-Studio) Chrome window: hwnd={h} '{t}'")
            break

# Last resort: any window with Studio
if not target:
    for h, t in wins:
        if "YouTube" in t or "Studio" in t:
            target = h
            log(f"  Found Studio in existing: hwnd={h} '{t}'")
            break

if not target:
    log("  No new Chrome window found! Using cPanel window as fallback")
    for h, t in wins:
        if "cPanel" in t:
            target = h
            break

if not target:
    log("FATAL: no usable Chrome window"); sys.exit(1)

# ── STEP 2: Force focus and maximize ─────────────────────────────────────────
log("Step 2: Forcing focus to Studio window...")
force_focus(target); time.sleep(0.5)

wx,wy,ww,wh = get_rect(target)
log(f"  Window rect: {wx},{wy} {ww}x{wh}")
title_now = get_title(target)
log(f"  Title: '{title_now}'")

CHROME_UI_H = 65  # tabs(35) + address bar(30)

# ── STEP 3: Navigate to Studio if not there yet ───────────────────────────────
if "YouTube" not in title_now and "Studio" not in title_now:
    log("Step 3: Studio not showing, navigating via address bar...")
    # Clipboard already has Studio URL
    addr_x = wx + ww//2
    addr_y = wy + 52   # address bar center: ~52px from window top (after 8px border + 44px)
    click(addr_x, addr_y, delay=0.4)
    time.sleep(0.2)
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("  URL sent. Waiting 7s...")
    time.sleep(7)
    title_now = get_title(target)
    log(f"  Title after nav: '{title_now}'")
    wx,wy,ww,wh = get_rect(target)

# ── STEP 4: Re-focus for upload flow ─────────────────────────────────────────
log("Step 4: Re-focusing for upload click sequence...")
force_focus(target); time.sleep(0.5)
wx,wy,ww,wh = get_rect(target)
log(f"  Rect: {wx},{wy} {ww}x{wh}")

# ── STEP 5: Click Create -> Upload videos ────────────────────────────────────
# Create button: top-right of Studio header, ~130px from right, center of 64px header
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32   # 32 = center of 64px Studio header
log(f"Step 5: Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

# Upload videos: ~40px below Create button in dropdown
upload_y = create_y + 45
log(f"  Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.5)   # wait for dialog to animate in

# ── STEP 6: Click Select files ────────────────────────────────────────────────
# From JS: Select files button at viewport (960, 570.5) center with 1920px wide viewport
# Chrome UI height=65, so screen y = wy + 65 + 570.5 + 18(half button height) = wy + 653
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2           # center
select_y = wy + CHROME_UI_H + 589  # 589 = 570.5 + 18 (center of 36px button)
log(f"Step 6: Clicking Select files at ({select_x},{select_y})")
click(select_x, select_y, delay=0.8)

# ── STEP 7: Watch for real Chrome file dialog ─────────────────────────────────
log("Step 7: Watching for REAL Chrome file dialog (not ghost/AHK ones)...")
deadline = time.time() + 25

# Get Chrome's process ID to match against dialog's PID
chrome_pid = ctypes.c_ulong(0)
user32.GetWindowThreadProcessId(target, ctypes.byref(chrome_pid))
log(f"  Chrome pid: {chrome_pid.value}")

dialog = 0
while time.time() < deadline:
    h = user32.FindWindowW("#32770", None)
    if h and h != 592206:  # skip the AHK dialog
        # Verify it's visible and from Chrome (or associated with Chrome)
        if user32.IsWindowVisible(h):
            pid2 = ctypes.c_ulong(0)
            user32.GetWindowThreadProcessId(h, ctypes.byref(pid2))
            t2 = ctypes.create_unicode_buffer(256)
            user32.GetWindowTextW(h, t2, 256)
            log(f"  Found #32770: hwnd={h} pid={pid2.value} title='{t2.value}' vis=True")
            dialog = h
            break
    # Also check if a different dialog appeared
    WNDENUMPROC2 = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
    dialogs = []
    def cb2(hw, _):
        cls3=ctypes.create_unicode_buffer(64); user32.GetClassNameW(hw,cls3,64)
        if cls3.value=='#32770' and user32.IsWindowVisible(hw) and hw!=592206:
            dialogs.append(hw)
        return True
    user32.EnumWindows(WNDENUMPROC2(cb2), 0)
    if dialogs:
        dialog = dialogs[0]
        pid2=ctypes.c_ulong(0); user32.GetWindowThreadProcessId(dialog,ctypes.byref(pid2))
        t2=ctypes.create_unicode_buffer(256); user32.GetWindowTextW(dialog,t2,256)
        log(f"  Enum found #32770: hwnd={dialog} pid={pid2.value} title='{t2.value}'")
        break
    time.sleep(0.2)

if not dialog:
    # Try at slightly different Y
    select_y2 = wy + CHROME_UI_H + 555
    log(f"  No dialog yet — retry Select files at ({select_x},{select_y2})")
    click(select_x, select_y2, delay=1.0)
    deadline2 = time.time() + 20
    while time.time() < deadline2:
        WNDENUMPROC3 = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
        dialogs2 = []
        def cb3(hw, _):
            cls3=ctypes.create_unicode_buffer(64); user32.GetClassNameW(hw,cls3,64)
            if cls3.value=='#32770' and user32.IsWindowVisible(hw) and hw!=592206:
                dialogs2.append(hw)
            return True
        user32.EnumWindows(WNDENUMPROC3(cb3), 0)
        if dialogs2:
            dialog = dialogs2[0]
            log(f"  Found on retry: {dialog}")
            break
        time.sleep(0.2)

if not dialog:
    log("TIMEOUT: no Chrome file dialog appeared"); sys.exit(1)

# ── STEP 8: Fill file path in dialog ─────────────────────────────────────────
# Set clipboard BEFORE stealing focus from Chrome
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
    log("  Path set via WM_SETTEXT + Enter")
else:
    log("  No Edit ctrl — pasting via clipboard")
    force_focus(dialog); time.sleep(0.3)
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.2)
    vkey(VK_RETURN)
    log("  Path pasted via clipboard + Enter")

log("=== Done - upload should be in progress ===")
lf.close()

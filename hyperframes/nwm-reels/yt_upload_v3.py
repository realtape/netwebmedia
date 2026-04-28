"""
yt_upload_v3.py
===============
Opens YouTube Studio in the EXISTING signed-in Chrome window
(NOT --new-window which opens a fresh unsigned-in context).
Then clicks: Create -> Upload videos -> Select files.
Falls back to WM_SETTEXT to fill the file dialog.

Key fixes vs previous attempts:
  - No --new-window flag: opens as new tab in existing Chrome (signed in)
  - Waits for the new Studio tab to become foreground
  - Correct coordinates for 1920x1080 + Chrome maximized at (-8,-8)
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_v3.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"
CHROME     = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_upload_v3.py started ===")

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
VK_CONTROL = 0x11
VK_A = 0x41; VK_V = 0x56
SW_RESTORE  = 9
SW_MAXIMIZE = 3
WM_SETTEXT  = 0x000C
BM_CLICK    = 0x00F5
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
    arr=(INPUT*len(inputs))(*inputs)
    return user32.SendInput(len(inputs),arr,ctypes.sizeof(INPUT))

def click(x,y,delay=0.15):
    nx=int(x*65535/SCREEN_W); ny=int(y*65535/SCREEN_H)
    r=si(INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_NOCOALESCE,0,None))),
         INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE,0,None))),
         INPUT(INPUT_MOUSE,_U(mi=MI(nx,ny,0,MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE,0,None))))
    log(f"  click({x},{y}) r={r}"); time.sleep(delay)

def vkey(vk):
    si(INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,KEYEVENTF_KEYUP,0,None)))); time.sleep(0.06)

def ctrl(vk):
    si(INPUT(INPUT_KEYBOARD,_U(ki=KI(VK_CONTROL,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,0,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,KEYEVENTF_KEYUP,0,None))),
       INPUT(INPUT_KEYBOARD,_U(ki=KI(VK_CONTROL,0,KEYEVENTF_KEYUP,0,None)))); time.sleep(0.15)

def get_rect(h):
    r=ctypes.wintypes.RECT(); user32.GetWindowRect(h,ctypes.byref(r))
    return r.left,r.top,r.right-r.left,r.bottom-r.top

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
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.2)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.3)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.5)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus: result ok={new_fg==hwnd}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

def enum_chrome():
    res=[]
    WNDENUMPROC=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(h,_):
        cls=ctypes.create_unicode_buffer(64); user32.GetClassNameW(h,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0); user32.GetWindowThreadProcessId(h,ctypes.byref(pid))
        if get_proc(pid.value) not in ("chrome.exe","chrome"): return True
        t=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,t,512)
        vis=bool(user32.IsWindowVisible(h)); res.append((h,t.value,vis)); return True
    user32.EnumWindows(WNDENUMPROC(cb),0); return res

# ── STEP 1: Find existing signed-in Chrome window ─────────────────────────────
log("Step 1: Finding existing Chrome windows...")
wins=enum_chrome()
for h,t,v in wins: log(f"  hwnd={h} vis={v} title='{t}'")

# Find a visible, non-blank Chrome window - prefer one NOT named "Channel dashboard"
# (the blank window from last session)
target=None
blank_hwnd=None
for h,t,v in wins:
    if v and t:
        if "Channel dashboard" in t:
            blank_hwnd=h
            log(f"  Blank Studio window: hwnd={h}")
        else:
            target=h
            log(f"  Real Chrome window: hwnd={h} '{t}'")
            break

# If no non-blank window found, use blank one as last resort
if not target and blank_hwnd:
    target=blank_hwnd
    log(f"  Using blank window as target: hwnd={target}")
elif not target:
    for h,t,v in wins:
        if v and t:
            target=h; break

if not target:
    log("No Chrome found. Aborting."); sys.exit(1)

log(f"Target hwnd={target} title='{get_title(target)}'")

# ── STEP 2: Close the blank Studio window if separate from target ──────────────
if blank_hwnd and blank_hwnd != target:
    log(f"Step 2: Closing blank Studio window hwnd={blank_hwnd}...")
    WM_CLOSE=0x0010
    user32.PostMessageW(blank_hwnd,WM_CLOSE,0,0)
    time.sleep(0.5)

# ── STEP 3: Open Studio URL in existing Chrome (new tab, no --new-window) ──────
log("Step 3: Opening Studio URL in existing Chrome...")
# Pre-set clipboard BEFORE focus operations
set_clip(STUDIO_URL)

# Bring existing Chrome to front
force_focus(target)
time.sleep(0.5)

# Open Studio in a new tab via Ctrl+T then paste URL
log("  Ctrl+T to open new tab...")
ctrl(0x54)  # VK_T
time.sleep(0.8)

log("  Pasting Studio URL into address bar...")
ctrl(VK_A)   # select all in address bar
time.sleep(0.1)
ctrl(VK_V)   # paste URL
time.sleep(0.3)
vkey(VK_RETURN)  # navigate
log("  Waiting 8s for Studio to load...")
time.sleep(8)

# Check title
title_now=get_title(target)
log(f"  Title: '{title_now}'")

if "YouTube Studio" not in title_now and "Studio" not in title_now:
    log("  WARNING: Not on Studio yet, waiting 5 more seconds...")
    time.sleep(5)
    title_now=get_title(target)
    log(f"  Title after extra wait: '{title_now}'")

# ── STEP 4: Re-focus and get window rect ───────────────────────────────────────
log("Step 4: Re-focusing Chrome...")
force_focus(target)
time.sleep(0.5)

wx,wy,ww,wh=get_rect(target)
log(f"  Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65

# ── STEP 5: Click Create button ────────────────────────────────────────────────
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Step 5: Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

# Check if dropdown appeared - look at title still (shouldn't change)
log(f"  Title: '{get_title(target)}'")

# ── STEP 6: Click Upload videos ────────────────────────────────────────────────
upload_x = create_x
upload_y = create_y + 45
log(f"Step 6: Clicking Upload videos at ({upload_x},{upload_y})")
click(upload_x, upload_y, delay=3.5)

# ── STEP 7: Click Select files ────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.60)
log(f"Step 7: Clicking Select files at ({select_x},{select_y})")
# Re-focus before clicking to ensure it's a trusted gesture
force_focus(target)
time.sleep(0.3)
click(select_x, select_y, delay=0.8)

# ── STEP 8: Wait for file dialog ───────────────────────────────────────────────
log("Step 8: Watching for file dialog (#32770)...")
deadline=time.time()+20
dialog=0
while time.time()<deadline:
    h=user32.FindWindowW("#32770",None)
    if h:
        # Verify it's real (has pid, is visible)
        tid,pid=get_tid(h)
        vis=bool(user32.IsWindowVisible(h))
        cls=ctypes.create_unicode_buffer(64); user32.GetClassNameW(h,cls,64)
        title_d=get_title(h)
        log(f"  Found #32770: hwnd={h} vis={vis} pid={pid} cls='{cls.value}' title='{title_d}'")
        if vis and pid>0:
            dialog=h; log(f"  Real file dialog: hwnd={h}"); break
    time.sleep(0.15)

if not dialog:
    # Retry at different Y positions
    for y_pct in [0.55, 0.65, 0.50]:
        sel_y2=wy+CHROME_UI_H+int(vp_h*y_pct)
        log(f"  Retry Select files at ({select_x},{sel_y2})")
        force_focus(target); time.sleep(0.2)
        click(select_x,sel_y2,delay=0.6)
        deadline2=time.time()+10
        while time.time()<deadline2:
            h=user32.FindWindowW("#32770",None)
            if h:
                tid,pid=get_tid(h)
                if bool(user32.IsWindowVisible(h)) and pid>0:
                    dialog=h; log(f"  Dialog on retry: hwnd={h}"); break
            time.sleep(0.15)
        if dialog: break

if not dialog:
    log("TIMEOUT: no real file dialog appeared"); sys.exit(1)

# ── STEP 9: Fill file path in dialog ──────────────────────────────────────────
# Pre-set clipboard first (before touching dialog focus)
set_clip(FILE_PATH)
time.sleep(0.2)

user32.SetForegroundWindow(dialog); time.sleep(0.5)

hwnd_edit=user32.FindWindowExW(dialog,None,"Edit",None)
log(f"  Edit hwnd: {hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit,WM_SETTEXT,0,FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog); time.sleep(0.15)
    vkey(VK_RETURN); time.sleep(0.4)
    hwnd_btn=user32.FindWindowExW(dialog,None,"Button",None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn,BM_CLICK,0,0)
        log(f"  Clicked Open btn: {hwnd_btn}")
    log("  Path set via WM_SETTEXT + Enter")
else:
    log("  No Edit ctrl - using clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.2)
    vkey(VK_RETURN)
    log("  Path pasted via clipboard + Enter")

log("=== Done - upload should be starting ===")
lf.close()

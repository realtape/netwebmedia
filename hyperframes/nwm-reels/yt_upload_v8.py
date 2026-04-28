"""
yt_upload_v8.py
===============
ROOT CAUSE FOUND: Claude Electron windows (hwnd=132606 and 13174642) are
maximized full-screen ON TOP of Chrome, intercepting all mouse clicks.
Mouse events from SendInput go to the topmost window at those coordinates.

Fix:
  1. Minimize the Claude Electron windows
  2. Force Chrome (hwnd=2820290) to front
  3. Cycle tabs to find Studio (or navigate via address bar)
  4. Do upload flow with mouse clicks now going to Chrome
  5. Restore Claude windows at end

Also minimizes hwnd=3475568 and 133332 (off-screen background Chrome tabs).
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH    = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_v8.log"
CHROME_HWND  = 2820290   # real visible Chrome
CLAUDE_HWND1 = 132606    # Claude Electron window 1
CLAUDE_HWND2 = 13174642  # Claude Electron window 2

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_upload_v8.py started ===")

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
VK_A = 0x41; VK_V = 0x56; VK_L = 0x4C
SW_MINIMIZE = 6
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
       INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,KEYEVENTF_KEYUP,0,None)))); time.sleep(0.08)

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
    log(f"  force_focus hwnd={hwnd}: ok={new_fg==hwnd} actual_fg={new_fg}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

# ── STEP 1: Minimize Claude Electron windows ───────────────────────────────────
log("Step 1: Minimizing Claude Electron windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
    t=get_title(h)
    r=get_rect(h)
    log(f"  Minimizing hwnd={h} title='{t}' rect={r}")
    user32.ShowWindow(h, SW_MINIMIZE)
    time.sleep(0.3)

log("  Claude windows minimized. Waiting 0.5s...")
time.sleep(0.5)

# ── STEP 2: Force focus to Chrome ─────────────────────────────────────────────
log("Step 2: Forcing focus to Chrome...")
hwnd = CHROME_HWND
force_focus(hwnd)
wx,wy,ww,wh=get_rect(hwnd)
log(f"  Chrome rect: {wx},{wy} {ww}x{wh}")
log(f"  Chrome title: '{get_title(hwnd)}'")
TAB_Y = wy + 25

# ── STEP 3: Navigate to Studio via Ctrl+L ─────────────────────────────────────
log("Step 3: Navigating to Studio via Ctrl+L...")
set_clip("https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ")
ctrl(VK_L)       # focus address bar
time.sleep(0.4)
ctrl(VK_A)       # select all
time.sleep(0.1)
ctrl(VK_V)       # paste URL
time.sleep(0.3)
vkey(VK_RETURN)  # navigate
log("  Navigating... waiting 9s")
time.sleep(9)

title_now=get_title(hwnd)
log(f"  Title: '{title_now}'")

if "Studio" not in title_now and "YouTube" not in title_now:
    log("  Not on Studio yet - cycling tabs to find it...")
    for i in range(15):
        ctrl(0x09)  # Ctrl+Tab
        time.sleep(0.4)
        t=get_title(hwnd)
        log(f"  Cycle {i+1}: '{t}'")
        if "Studio" in t or "YouTube" in t:
            log(f"  Found Studio at cycle {i+1}!")
            break

# ── STEP 4: Re-focus Chrome for upload flow ────────────────────────────────────
log("Step 4: Re-focusing Chrome for upload...")
force_focus(hwnd); time.sleep(0.5)
wx,wy,ww,wh=get_rect(hwnd)
log(f"  Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65

# ── STEP 5: Click Create ───────────────────────────────────────────────────────
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Step 5: Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)
log(f"  Title: '{get_title(hwnd)}'")

# ── STEP 6: Click Upload videos ────────────────────────────────────────────────
upload_y = create_y + 45
log(f"Step 6: Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.5)

# ── STEP 7: Click Select files ────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.60)
log(f"Step 7: Clicking Select files at ({select_x},{select_y})")
force_focus(hwnd); time.sleep(0.3)
click(select_x, select_y, delay=1.0)

# ── STEP 8: Watch for file dialog ─────────────────────────────────────────────
log("Step 8: Watching for file dialog...")
deadline=time.time()+20
dialog=0
while time.time()<deadline:
    h=user32.FindWindowW("#32770",None)
    if h:
        tid,pid=get_tid(h)
        vis=bool(user32.IsWindowVisible(h))
        title_d=get_title(h)
        log(f"  Found hwnd={h} vis={vis} pid={pid} title='{title_d}'")
        if vis and pid>0:
            dialog=h; log(f"  Real dialog: hwnd={h}"); break
    time.sleep(0.15)

if not dialog:
    for y_pct in [0.55, 0.65, 0.50, 0.70, 0.45]:
        sel_y2=wy+CHROME_UI_H+int(vp_h*y_pct)
        log(f"  Retry Select files at ({select_x},{sel_y2})")
        force_focus(hwnd); time.sleep(0.2)
        click(select_x,sel_y2,delay=0.8)
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
    log("TIMEOUT: no real file dialog")
    # Restore Claude windows before exit
    for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
        user32.ShowWindow(h, SW_RESTORE)
    sys.exit(1)

# ── STEP 9: Fill file path ─────────────────────────────────────────────────────
set_clip(FILE_PATH)
time.sleep(0.2)
user32.SetForegroundWindow(dialog); time.sleep(0.5)

hwnd_edit=user32.FindWindowExW(dialog,None,"Edit",None)
log(f"Edit hwnd: {hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit,WM_SETTEXT,0,FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog); time.sleep(0.15)
    vkey(VK_RETURN); time.sleep(0.4)
    hwnd_btn=user32.FindWindowExW(dialog,None,"Button",None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn,BM_CLICK,0,0)
        log(f"  Clicked Open btn: {hwnd_btn}")
    log("Path set via WM_SETTEXT + Enter")
else:
    log("No Edit ctrl - clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.2)
    vkey(VK_RETURN)
    log("Path pasted + Enter")

# ── Restore Claude windows ─────────────────────────────────────────────────────
log("Restoring Claude windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
    user32.ShowWindow(h, SW_RESTORE)

log("=== Done - upload starting ===")
lf.close()

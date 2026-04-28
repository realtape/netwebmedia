"""
yt_upload_v7.py
===============
Target hwnd=3475568 directly - it has "Channel content - YouTube Studio" loaded.
Click Create -> Upload videos -> Select files in THAT window.

Also adds a diagnostic: takes a screenshot after force_focus to see what's actually
on screen and where clicks are landing.
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH    = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_v7.log"
STUDIO_HWND = 3475568  # "Channel content - YouTube Studio"

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_upload_v7.py started ===")

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
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.2)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.3)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.7)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus hwnd={hwnd}: ok={new_fg==hwnd} actual_fg={new_fg}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)

def enum_chrome():
    res=[]
    WNDENUMPROC=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(h,_):
        cls=ctypes.create_unicode_buffer(64); user32.GetClassNameW(h,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0); user32.GetWindowThreadProcessId(h,ctypes.byref(pid))
        t=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,t,512)
        vis=bool(user32.IsWindowVisible(h)); res.append((h,t.value,vis)); return True
    user32.EnumWindows(WNDENUMPROC(cb),0); return res

# ── List all Chrome windows ────────────────────────────────────────────────────
log("All Chrome windows:")
for h,t,v in enum_chrome():
    r=get_rect(h)
    log(f"  hwnd={h} vis={v} rect={r} title='{t}'")

# ── Check Studio window ────────────────────────────────────────────────────────
hwnd = STUDIO_HWND
title = get_title(hwnd)
log(f"\nStudio window hwnd={hwnd} title='{title}'")
if not user32.IsWindowVisible(hwnd):
    log("Studio window not visible!")
    # Try to find any Studio window
    for h,t,v in enum_chrome():
        if "Studio" in t and v:
            hwnd=h; title=t
            log(f"Using alternate Studio window hwnd={hwnd}")
            break

# ── Force focus to Studio window ───────────────────────────────────────────────
log(f"\nForcing focus to Studio hwnd={hwnd}...")
ok = force_focus(hwnd)
log(f"Focus ok={ok}")

wx,wy,ww,wh=get_rect(hwnd)
log(f"Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65

# ── Navigate to Content page (to access Create button) ────────────────────────
# Studio is loaded - navigate to channel content if needed, then click Create
title_now=get_title(hwnd)
log(f"Current title: '{title_now}'")

# ── Click Create button ────────────────────────────────────────────────────────
# Studio Create button in top-right corner
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"\nClicking Create at ({create_x},{create_y})...")
click(create_x, create_y, delay=0.8)
log(f"  Title after Create: '{get_title(hwnd)}'")

# ── Click Upload videos ────────────────────────────────────────────────────────
upload_y = create_y + 45
log(f"Clicking Upload videos at ({create_x},{upload_y})...")
click(create_x, upload_y, delay=3.5)

# ── Click Select files ────────────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.60)
log(f"Clicking Select files at ({select_x},{select_y})...")
force_focus(hwnd); time.sleep(0.3)
click(select_x, select_y, delay=1.0)

# ── Watch for file dialog ──────────────────────────────────────────────────────
log("Watching for file dialog...")
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
    log("TIMEOUT: no real file dialog"); sys.exit(1)

# ── Fill file path ─────────────────────────────────────────────────────────────
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

log("=== Done ===")
lf.close()

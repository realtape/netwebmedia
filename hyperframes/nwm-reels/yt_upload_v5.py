"""
yt_upload_v5.py
===============
Uses Ctrl+number keyboard shortcuts to switch to Studio tab,
then does the upload flow. Much more reliable than clicking tab coordinates.

Tab order in hwnd=2820290:
  1=InMotion Hosting, 2=cPanel-Tools, 3=cPanel-Email, 4=Claude,
  5=NWM-CRM, 6=Create Instagram, 7=Channel dashboard YT, 8=Channel dashboard YT

Try Ctrl+8 (last Studio tab) and Ctrl+7 first.
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_upload_v5.log"
TARGET_HWND = 2820290

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_upload_v5.py started ===")

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
    time.sleep(0.6)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus: ok={new_fg==hwnd} new_fg={new_fg}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

# ── Target window ──────────────────────────────────────────────────────────────
hwnd = TARGET_HWND
log(f"Target hwnd={hwnd} title='{get_title(hwnd)}'")

# ── Force focus ────────────────────────────────────────────────────────────────
log("Forcing focus to Chrome...")
force_focus(hwnd)
time.sleep(0.3)

# ── Try Ctrl+number to switch to Studio tabs ──────────────────────────────────
log("Trying Ctrl+8 to switch to 8th tab (first Studio tab)...")
ctrl(0x38)  # VK_8 = 0x38
time.sleep(0.5)
t=get_title(hwnd)
log(f"  After Ctrl+8: title='{t}'")

if "Studio" not in t and "YouTube" not in t:
    log("Trying Ctrl+9 (last tab)...")
    ctrl(0x39)  # VK_9 = 0x39
    time.sleep(0.5)
    t=get_title(hwnd)
    log(f"  After Ctrl+9: title='{t}'")

if "Studio" not in t and "YouTube" not in t:
    log("Trying Ctrl+7...")
    ctrl(0x37)  # VK_7 = 0x37
    time.sleep(0.5)
    t=get_title(hwnd)
    log(f"  After Ctrl+7: title='{t}'")

if "Studio" not in t and "YouTube" not in t:
    # Cycle through all tabs with Ctrl+Tab until we find Studio
    log("Cycling through tabs with Ctrl+Tab...")
    for i in range(10):
        ctrl(0x09)  # VK_TAB = 0x09
        time.sleep(0.4)
        t=get_title(hwnd)
        log(f"  Tab {i+1}: title='{t}'")
        if "Studio" in t or "YouTube" in t:
            log(f"  Found Studio at cycle {i+1}!")
            break

title_now=get_title(hwnd)
log(f"Current title: '{title_now}'")

# ── If still not Studio, navigate via address bar ─────────────────────────────
if "Studio" not in title_now and "YouTube" not in title_now:
    log("Navigating via Ctrl+L...")
    set_clip("https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ")
    force_focus(hwnd); time.sleep(0.3)
    ctrl(VK_L); time.sleep(0.4)
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("Waiting 9s for Studio to load...")
    time.sleep(9)
    title_now=get_title(hwnd)
    log(f"Title: '{title_now}'")

# ── Re-focus ───────────────────────────────────────────────────────────────────
log("Re-focusing...")
force_focus(hwnd); time.sleep(0.5)
wx,wy,ww,wh=get_rect(hwnd)
log(f"Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65

# ── Click Create ───────────────────────────────────────────────────────────────
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

# ── Click Upload videos ────────────────────────────────────────────────────────
upload_y = create_y + 45
log(f"Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.5)

# ── Click Select files ────────────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.60)
log(f"Clicking Select files at ({select_x},{select_y})")
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
        if vis and pid>0:
            dialog=h; log(f"  Real dialog: hwnd={h}"); break
        else:
            log(f"  Skipping hwnd={h} vis={vis} pid={pid}")
    time.sleep(0.15)

if not dialog:
    for y_pct in [0.55, 0.65, 0.50, 0.70]:
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
        log(f"Clicked Open btn: {hwnd_btn}")
    log("Path set via WM_SETTEXT + Enter")
else:
    log("No Edit ctrl - clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.2)
    vkey(VK_RETURN)
    log("Path pasted + Enter")

log("=== Done - upload starting ===")
lf.close()

"""
yt_final2.py  — Definitive upload script
=========================================
Fixes:
  1. Set clipboard BEFORE force_focus (PowerShell would steal focus otherwise)
  2. Correct tab y = screen_y = wy + 8 + 17 = 17 (not wy+15=7)
  3. Try clicking "Channel content - YouTube Studio" tab directly
  4. Fall back to address-bar navigation
  5. Upload flow with proper delays
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_final2.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_final2.py started ===")

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen {SCREEN_W}x{SCREEN_H}")

# ── Input constants ────────────────────────────────────────────────────────────
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
VK_A = 0x41; VK_C = 0x43; VK_L = 0x4C; VK_V = 0x56
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
def mk_u(c,fl):     return INPUT(INPUT_KEYBOARD,_U(ki=KI(0,c,0x0004|fl,0,None)))

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
    """Steal focus using AttachThreadInput, works even from background process."""
    cur_fg=user32.GetForegroundWindow()
    tid_fg,_=get_tid(cur_fg); tid_tgt,_=get_tid(hwnd); tid_self=kernel32.GetCurrentThreadId()
    log(f"  force_focus hwnd={hwnd}: fg={cur_fg} tid_fg={tid_fg} tid_tgt={tid_tgt}")
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.2)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.3)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.5)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus result: fg={new_fg} (wanted {hwnd}) ok={new_fg==hwnd}")
    return new_fg==hwnd

def set_clip(text):
    """Set clipboard via PowerShell (call BEFORE force_focus to avoid focus loss)."""
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True,timeout=10)
    log(f"  Clipboard: {text[:70]}")

def enum_chrome():
    res=[]
    WNDENUMPROC=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(h,_):
        cls=ctypes.create_unicode_buffer(64); user32.GetClassNameW(h,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0); user32.GetWindowThreadProcessId(h,ctypes.byref(pid))
        if get_proc(pid.value) not in ("chrome.exe","chrome"): return True
        t=ctypes.create_unicode_buffer(512); user32.GetWindowTextW(h,t,512)
        res.append((h,t.value,bool(user32.IsWindowVisible(h)))); return True
    user32.EnumWindows(WNDENUMPROC(cb),0); return res

# ── STEP 0: Set clipboard FIRST (before any focus changes) ────────────────────
log("Step 0: Pre-setting clipboard with Studio URL...")
set_clip(STUDIO_URL)

# ── STEP 1: Find Chrome window ────────────────────────────────────────────────
log("Step 1: Enumerating Chrome windows...")
wins=enum_chrome()
for h,t,v in wins: log(f"  hwnd={h} vis={v} '{t}'")

target=None
for h,t,v in wins:
    if v and t: target=h; log(f"  Target: hwnd={h} '{t}'"); break
if not target:
    log("No Chrome found"); sys.exit(1)

# ── STEP 2: Force focus to Chrome ─────────────────────────────────────────────
log("Step 2: Forcing focus to Chrome...")
ok=force_focus(target)

wx,wy,ww,wh=get_rect(target)
log(f"  Rect: {wx},{wy} {ww}x{wh}")

# With Chrome maximized at (-8,-8,...), the invisible frame is 8px.
# The VISIBLE content starts at screen y=0.
# Tab bar center: 8px_frame + 17px_from_visible_top = 25px from window top
#   => screen y = wy + 25 = -8 + 25 = 17
TAB_Y = wy + 25  # = screen y = 17
log(f"  Tab bar y = {TAB_Y}")

# ── STEP 3: Click the YouTube Studio tab ──────────────────────────────────────
# Tab 4 "Channel content - YouTube Stu..." is at approximately x=610, y=17
# (calculated from zoomed tab bar screenshot)
log("Step 3: Clicking YouTube Studio tab...")
studio_tab_x = 610
log(f"  Clicking tab at ({studio_tab_x},{TAB_Y})")
click(studio_tab_x, TAB_Y, delay=1.0)

title_now=get_title(target)
log(f"  Title: '{title_now}'")

# If not on Studio, try neighbouring x positions
if "YouTube" not in title_now and "Studio" not in title_now:
    log("  Not Studio yet, scanning tab positions...")
    for tx in [540, 580, 620, 660, 700, 740, 780]:
        click(tx, TAB_Y, delay=0.5)
        t2=get_title(target)
        log(f"    x={tx} -> '{t2}'")
        if "YouTube" in t2 or "Studio" in t2:
            log(f"  Found Studio tab at x={tx}!")
            break

title_now=get_title(target)
log(f"  Title after tab scan: '{title_now}'")

# ── STEP 4: Navigate via address bar if still not on Studio ───────────────────
if "YouTube" not in title_now and "Studio" not in title_now:
    log("Step 4: Navigating via address bar (URL already in clipboard)...")
    # Force focus again (it might have drifted)
    force_focus(target); time.sleep(0.4)

    # Click address bar (chrome UI height: tab_bar~35px, addr_bar~35px, center~52px)
    # Screen y for address bar: wy + 8 + 35 + 17 = wy + 60
    addr_y = wy + 60  # screen y ~ 52
    addr_x = wx + ww // 2
    log(f"  Clicking address bar at ({addr_x},{addr_y})")
    click(addr_x, addr_y, delay=0.4)
    time.sleep(0.2)
    ctrl(VK_A); time.sleep(0.1)   # select all in address bar
    ctrl(VK_V); time.sleep(0.3)   # paste URL
    vkey(VK_RETURN)               # navigate
    log("  Navigation sent. Waiting 8s...")
    time.sleep(8)
    title_now=get_title(target)
    log(f"  Title after nav: '{title_now}'")

# ── STEP 5: Re-focus Chrome for click sequence ────────────────────────────────
log("Step 5: Re-focusing Chrome for upload flow...")
force_focus(target); time.sleep(0.5)

wx,wy,ww,wh=get_rect(target)
log(f"  Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65  # tabs(35) + address bar(35) - just under 70, use 65

# ── STEP 6: Click Create -> Upload videos ─────────────────────────────────────
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Step 6: Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

upload_y = create_y + 40
log(f"  Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.0)   # wait for dialog to animate in

# ── STEP 7: Click Select files ────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.62)
log(f"Step 7: Clicking Select files at ({select_x},{select_y})")
click(select_x, select_y, delay=0.8)

# ── STEP 8: Wait for file dialog (#32770) ────────────────────────────────────
log("Step 8: Watching for file dialog...")
deadline=time.time()+20
dialog=0
while time.time()<deadline:
    h=user32.FindWindowW("#32770",None)
    if h: dialog=h; log(f"  File dialog: hwnd={h}"); break
    time.sleep(0.15)

if not dialog:
    select_y2=wy+CHROME_UI_H+int(vp_h*0.52)
    log(f"  Retry Select files at ({select_x},{select_y2})")
    click(select_x,select_y2,delay=0.8)
    deadline2=time.time()+15
    while time.time()<deadline2:
        h=user32.FindWindowW("#32770",None)
        if h: dialog=h; log(f"  Dialog on retry: hwnd={h}"); break
        time.sleep(0.15)

if not dialog:
    log("TIMEOUT: no file dialog appeared"); sys.exit(1)

# ── STEP 9: Fill file path ─────────────────────────────────────────────────────
# Pre-set clipboard with file path (before touching dialog focus)
set_clip(FILE_PATH)
time.sleep(0.2)

user32.SetForegroundWindow(dialog); time.sleep(0.5)

# Try WM_SETTEXT on Edit control
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
    log("  No Edit control - using clipboard paste")
    force_focus(dialog); time.sleep(0.3)
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.2)
    vkey(VK_RETURN)
    log("  Path pasted via clipboard + Enter")

log("=== Done - upload should be in progress ===")
lf.close()

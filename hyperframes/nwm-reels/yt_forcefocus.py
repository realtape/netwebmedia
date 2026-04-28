"""
yt_forcefocus.py
================
Uses AttachThreadInput + clipboard-paste to force Chrome to load YouTube Studio,
then uses SendInput for the upload flow.

Critical fix: AttachThreadInput makes Windows allow focus transfer,
and clipboard-paste avoids relying on type_unicode which can be silently
discarded if the window isn't properly focused.
"""

import ctypes, ctypes.wintypes, time, os, sys

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_forcefocus.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_forcefocus.py started ===")

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen {SCREEN_W}x{SCREEN_H}")

# ── Constants ─────────────────────────────────────────────────────────────────
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
WM_SETTEXT  = 0x000C
BM_CLICK    = 0x00F5
CF_UNICODETEXT = 13
GMEM_MOVEABLE = 0x0002
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

def mk_mouse(dx,dy,flags):
    return INPUT(INPUT_MOUSE,_U(mi=MI(dx,dy,0,flags,0,None)))
def mk_key(vk,flags):
    return INPUT(INPUT_KEYBOARD,_U(ki=KI(vk,0,flags,0,None)))
def mk_uni(code,flags):
    return INPUT(INPUT_KEYBOARD,_U(ki=KI(0,code,0x0004|flags,0,None)))

def send_inputs(*inputs):
    arr = (INPUT*len(inputs))(*inputs)
    return user32.SendInput(len(inputs),arr,ctypes.sizeof(INPUT))

def click(x,y,delay=0.15):
    nx=int(x*65535/SCREEN_W); ny=int(y*65535/SCREEN_H)
    r=send_inputs(
        mk_mouse(nx,ny,MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_NOCOALESCE),
        mk_mouse(nx,ny,MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE),
        mk_mouse(nx,ny,MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE),
    )
    log(f"  click({x},{y}) r={r}"); time.sleep(delay)

def vkey(vk):
    send_inputs(mk_key(vk,0),mk_key(vk,KEYEVENTF_KEYUP)); time.sleep(0.06)

def ctrl_key(vk):
    send_inputs(mk_key(VK_CONTROL,0),mk_key(vk,0),
                mk_key(vk,KEYEVENTF_KEYUP),mk_key(VK_CONTROL,KEYEVENTF_KEYUP))
    time.sleep(0.12)

def type_text(text):
    for ch in text:
        c=ord(ch)
        send_inputs(mk_uni(c,0),mk_uni(c,KEYEVENTF_KEYUP)); time.sleep(0.018)

def get_rect(h):
    r=ctypes.wintypes.RECT()
    user32.GetWindowRect(h,ctypes.byref(r))
    return r.left,r.top,r.right-r.left,r.bottom-r.top

def get_title(h):
    b=ctypes.create_unicode_buffer(512)
    user32.GetWindowTextW(h,b,512)
    return b.value

def get_proc(pid):
    try:
        h=kernel32.OpenProcess(PROCESS_QUERY_LIMITED,False,pid)
        if not h: return ""
        b=ctypes.create_unicode_buffer(1024); s=ctypes.c_ulong(1024)
        kernel32.QueryFullProcessImageNameW(h,0,b,ctypes.byref(s))
        kernel32.CloseHandle(h)
        return os.path.basename(b.value).lower()
    except: return ""

def get_thread(hwnd):
    pid=ctypes.c_ulong(0)
    tid=user32.GetWindowThreadProcessId(hwnd,ctypes.byref(pid))
    return tid,pid.value

def force_focus(hwnd):
    """Steal focus to hwnd using AttachThreadInput trick."""
    cur_fg  = user32.GetForegroundWindow()
    tid_fg,_ = get_thread(cur_fg)
    tid_tgt,_ = get_thread(hwnd)
    tid_self = kernel32.GetCurrentThreadId()
    log(f"  force_focus: cur_fg={cur_fg} tid_fg={tid_fg} tid_tgt={tid_tgt} tid_self={tid_self}")

    user32.ShowWindow(hwnd, SW_RESTORE)
    time.sleep(0.2)
    user32.ShowWindow(hwnd, SW_MAXIMIZE)
    time.sleep(0.3)

    # Attach self thread to foreground thread so we can steal focus
    if tid_self != tid_fg:
        user32.AttachThreadInput(tid_self, tid_fg, True)
    if tid_tgt != tid_fg and tid_tgt != tid_self:
        user32.AttachThreadInput(tid_tgt, tid_fg, True)

    user32.BringWindowToTop(hwnd)
    user32.SetForegroundWindow(hwnd)
    user32.SetFocus(hwnd)

    if tid_self != tid_fg:
        user32.AttachThreadInput(tid_self, tid_fg, False)
    if tid_tgt != tid_fg and tid_tgt != tid_self:
        user32.AttachThreadInput(tid_tgt, tid_fg, False)

    time.sleep(0.4)
    new_fg = user32.GetForegroundWindow()
    log(f"  force_focus: new foreground={new_fg} (wanted {hwnd})")

# ── Clipboard helper ──────────────────────────────────────────────────────────
def set_clipboard(text):
    """Write text to clipboard via PowerShell (simpler & reliable on 64-bit)."""
    import subprocess
    # Escape single quotes in text
    safe = text.replace("'", "''")
    subprocess.run(
        ['powershell', '-NoProfile', '-Command', f"Set-Clipboard -Value '{safe}'"],
        capture_output=True, timeout=10
    )
    log(f"  Clipboard set to: {text[:60]}...")

# ── Find Chrome window ────────────────────────────────────────────────────────
def enum_chrome():
    res=[]
    WNDENUMPROC=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(h,_):
        cls=ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(h,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0)
        user32.GetWindowThreadProcessId(h,ctypes.byref(pid))
        if get_proc(pid.value) not in ("chrome.exe","chrome"): return True
        title=ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(h,title,512)
        vis=bool(user32.IsWindowVisible(h))
        res.append((h,title.value,vis))
        return True
    user32.EnumWindows(WNDENUMPROC(cb),0)
    return res

log("Enumerating Chrome windows...")
wins=enum_chrome()
for h,t,v in wins: log(f"  hwnd={h} vis={v} '{t}'")

# Find a visible Chrome window with a non-empty title
target=None
for h,t,v in wins:
    if v and t:
        target=h; log(f"Target: hwnd={h} '{t}'"); break

if not target:
    log("No Chrome found — aborting"); sys.exit(1)

# ── Force focus to Chrome ─────────────────────────────────────────────────────
log("Forcing focus to Chrome...")
force_focus(target)

wx,wy,ww,wh=get_rect(target)
log(f"Rect: {wx},{wy} {ww}x{wh}")

# ── Navigate to Studio via Ctrl+L + clipboard paste ──────────────────────────
log("Navigating to YouTube Studio via address bar...")
set_clipboard(STUDIO_URL)

# Click the address bar area directly (~center, y~47)
addr_x = wx + ww//2
addr_y = wy + 47  # address bar is ~47px below window top on maximized Chrome
log(f"Clicking address bar at ({addr_x},{addr_y})")
click(addr_x, addr_y, delay=0.4)

time.sleep(0.2)
ctrl_key(VK_A)    # select all in address bar
time.sleep(0.1)
ctrl_key(VK_V)    # paste URL
time.sleep(0.3)
vkey(VK_RETURN)   # navigate
log("Navigation sent, waiting 7s for Studio to load...")
time.sleep(7)

title_now = get_title(target)
log(f"Title after navigation: '{title_now}'")

# If still not Studio, try one more time
if "YouTube" not in title_now and "Studio" not in title_now:
    log("Still not Studio - re-forcing focus and trying again...")
    force_focus(target)
    time.sleep(0.3)
    set_clipboard(STUDIO_URL)
    ctrl_key(VK_L); time.sleep(0.4)
    ctrl_key(VK_A); time.sleep(0.1)
    ctrl_key(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("Second navigation sent, waiting 8s...")
    time.sleep(8)
    title_now = get_title(target)
    log(f"Title after 2nd nav: '{title_now}'")

# Re-read rect
wx,wy,ww,wh=get_rect(target)
log(f"Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65

# ── Re-focus Chrome for click sequence ───────────────────────────────────────
force_focus(target)
time.sleep(0.5)

# ── Click Create -> Upload videos ────────────────────────────────────────────
# Create button: ~130px from right, center of Studio header (64px tall starting at CHROME_UI_H)
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Clicking Create at ({create_x},{create_y})")
click(create_x, create_y, delay=0.8)

upload_y = create_y + 40
log(f"Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.0)

# ── Click Select files ────────────────────────────────────────────────────────
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.62)
log(f"Clicking Select files at ({select_x},{select_y})")
click(select_x, select_y, delay=0.8)

# ── Watch for #32770 file dialog ──────────────────────────────────────────────
log("Watching for file dialog...")
deadline=time.time()+20
dialog=0
while time.time()<deadline:
    h=user32.FindWindowW("#32770",None)
    if h: dialog=h; log(f"File dialog: hwnd={h}"); break
    time.sleep(0.15)

if not dialog:
    # Retry at 55%
    select_y2=wy+CHROME_UI_H+int(vp_h*0.55)
    log(f"Retry Select files at ({select_x},{select_y2})")
    click(select_x,select_y2,delay=0.8)
    deadline2=time.time()+15
    while time.time()<deadline2:
        h=user32.FindWindowW("#32770",None)
        if h: dialog=h; log(f"Dialog on retry: hwnd={h}"); break
        time.sleep(0.15)

if not dialog:
    log("TIMEOUT: no file dialog"); sys.exit(1)

# ── Fill file path ────────────────────────────────────────────────────────────
user32.SetForegroundWindow(dialog)
time.sleep(0.5)

# Try to find Edit1 control (standard file dialog)
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
    # Use clipboard paste into dialog
    log("No Edit ctrl - pasting via clipboard")
    set_clipboard(FILE_PATH)
    time.sleep(0.2)
    ctrl_key(VK_A)
    time.sleep(0.1)
    ctrl_key(VK_V)
    time.sleep(0.2)
    vkey(VK_RETURN)
    log("Path pasted via clipboard + Enter")

log("=== Done - upload should be in progress ===")
lf.close()

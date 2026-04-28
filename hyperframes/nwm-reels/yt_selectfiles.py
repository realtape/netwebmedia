"""
yt_selectfiles.py
=================
Studio upload dialog is already visible in Chrome (hwnd=2820290).
Claude Electron windows are already minimized.

Just:
1. Force focus to Chrome
2. Click "Select files" button (visible at approx screen 960, 700)
3. Handle file dialog
"""

import ctypes, ctypes.wintypes, time, os, sys, subprocess

FILE_PATH    = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_selectfiles.log"
CHROME_HWND  = 2820290

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log("=== yt_selectfiles.py started ===")

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
    user32.ShowWindow(hwnd,SW_RESTORE); time.sleep(0.1)
    user32.ShowWindow(hwnd,SW_MAXIMIZE); time.sleep(0.2)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,True)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,True)
    user32.BringWindowToTop(hwnd); user32.SetForegroundWindow(hwnd); user32.SetFocus(hwnd)
    if tid_self!=tid_fg: user32.AttachThreadInput(tid_self,tid_fg,False)
    if tid_tgt!=tid_fg and tid_tgt!=tid_self: user32.AttachThreadInput(tid_tgt,tid_fg,False)
    time.sleep(0.6)
    new_fg=user32.GetForegroundWindow()
    log(f"  force_focus: ok={new_fg==hwnd}")
    return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

# ── Force focus to Chrome ──────────────────────────────────────────────────────
hwnd = CHROME_HWND
log(f"Target: hwnd={hwnd} title='{get_title(hwnd)}'")
force_focus(hwnd)
wx,wy,ww,wh=get_rect(hwnd)
log(f"Rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65
vp_h = wh - CHROME_UI_H

# ── Click "Select files" button ────────────────────────────────────────────────
# From screenshot: button is visible at display (728,532) in a 1456px screenshot
# Screen coords: 728*(1920/1456)=958, 532*(1080/816)=704
# But the modal dialog is centered, so button is approximately at:
# dialog center x = 728, studio viewport starts at y=65 from chrome top
# Button at viewport 60% down: wy + 65 + vp_h * 0.58

select_x = wx + ww // 2  # = -8 + 1936//2 = -8 + 968 = 960
vp_h = wh - CHROME_UI_H
select_y_pcts = [0.60, 0.58, 0.56, 0.62, 0.54, 0.52, 0.64, 0.50]

log(f"Starting Select files click sequence at x={select_x}...")

for y_pct in select_y_pcts:
    select_y = wy + CHROME_UI_H + int(vp_h * y_pct)
    log(f"  Clicking Select files at ({select_x},{select_y}) pct={y_pct:.2f}")
    force_focus(hwnd); time.sleep(0.2)
    click(select_x, select_y, delay=1.5)

    # Check for file dialog (any #32770 with pid>0)
    deadline = time.time() + 8
    dialog = 0
    while time.time() < deadline:
        h = user32.FindWindowW("#32770", None)
        if h:
            tid,pid = get_tid(h)
            vis = bool(user32.IsWindowVisible(h))
            t = get_title(h)
            log(f"    Found hwnd={h} vis={vis} pid={pid} title='{t}'")
            if vis and pid > 0:
                dialog = h
                log(f"    Real dialog at hwnd={h}!")
                break
        time.sleep(0.1)

    if dialog:
        break

if not dialog:
    log("No file dialog found after all attempts"); sys.exit(1)

# ── Handle file dialog ─────────────────────────────────────────────────────────
log(f"File dialog hwnd={dialog}. Handling...")
time.sleep(0.5)

# Focus dialog
user32.SetForegroundWindow(dialog)
time.sleep(0.5)

# Check all child controls
log("  Enumerating dialog children...")
children = []
WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
def enum_child_cb(h, _):
    cls = ctypes.create_unicode_buffer(64); user32.GetClassNameW(h, cls, 64)
    t = ctypes.create_unicode_buffer(256); user32.GetWindowTextW(h, t, 256)
    r = get_rect(h)
    children.append((h, cls.value, t.value, r))
    return True
user32.EnumChildWindows(dialog, WNDENUMPROC(enum_child_cb), 0)
for h,cls,t,r in children:
    log(f"    child hwnd={h} cls='{cls}' text='{t}' rect={r}")

# Try to find Edit control (various approaches)
hwnd_edit = user32.FindWindowExW(dialog, None, "Edit", None)
log(f"  Edit (class): {hwnd_edit}")

# Try ComboBoxEx32 -> ComboBox -> Edit pattern (standard file dialog)
hwnd_combo = user32.FindWindowExW(dialog, None, "ComboBoxEx32", None)
if hwnd_combo:
    hwnd_combo2 = user32.FindWindowExW(hwnd_combo, None, "ComboBox", None)
    if hwnd_combo2:
        hwnd_edit = user32.FindWindowExW(hwnd_combo2, None, "Edit", None)
        log(f"  Edit via ComboBoxEx32->ComboBox->Edit: {hwnd_edit}")

if hwnd_edit:
    log(f"  Setting path via WM_SETTEXT on Edit={hwnd_edit}")
    user32.SendMessageW(hwnd_edit, WM_SETTEXT, 0, FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog); time.sleep(0.1)
    vkey(VK_RETURN); time.sleep(0.3)
    # Click Open button
    hwnd_btn = user32.FindWindowExW(dialog, None, "Button", None)
    log(f"  Button hwnd: {hwnd_btn}")
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn, BM_CLICK, 0, 0)
        log("  Clicked Open button")
    log("  Path entered via WM_SETTEXT")
else:
    # Fallback: clipboard paste
    log("  No Edit control - using clipboard paste")
    set_clip(FILE_PATH)
    time.sleep(0.2)
    user32.SetForegroundWindow(dialog); time.sleep(0.3)
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("  Path pasted via clipboard")

log("=== File dialog handled - upload should begin ===")
time.sleep(2)

# Check if upload started (title change or dialog closed)
new_title = get_title(hwnd)
log(f"Chrome title after: '{new_title}'")

lf.close()

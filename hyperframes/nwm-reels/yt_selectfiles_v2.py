"""
yt_selectfiles_v2.py
====================
Upload dialog is already open in Chrome (hwnd=2820290).
Just minimize Claude, focus Chrome, click Select files, handle file dialog.

Usage: python yt_selectfiles_v2.py <path_to_mp4>
"""
import ctypes, ctypes.wintypes, time, sys, subprocess, os

if len(sys.argv) < 2:
    print("Usage: python yt_selectfiles_v2.py <path_to_mp4>"); sys.exit(1)

FILE_PATH    = sys.argv[1]
LOG_PATH     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_selectfiles_v2.log"
CHROME_HWND  = 2820290
CLAUDE_HWND1 = 132606
CLAUDE_HWND2 = 13174642

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log(f"=== yt_selectfiles_v2.py ===")
log(f"FILE: {FILE_PATH}")

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
SW_MINIMIZE = 6
SW_RESTORE  = 9
SW_MAXIMIZE = 3
WM_SETTEXT  = 0x000C

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
    log(f"  force_focus: ok={new_fg==hwnd} actual={new_fg}"); return new_fg==hwnd

def set_clip(text):
    safe=text.replace("'","''")
    subprocess.run(['powershell','-NoProfile','-Command',f"Set-Clipboard -Value '{safe}'"],
                   capture_output=True, timeout=10)
    log(f"  clip: {text[:80]}")

# Step 1: Set clipboard FIRST (before focus stealing)
set_clip(FILE_PATH)
time.sleep(0.3)

# Step 2: Minimize Claude
log("Minimizing Claude windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
    user32.ShowWindow(h, SW_MINIMIZE); time.sleep(0.3)
time.sleep(0.5)

# Step 3: Force focus to Chrome
hwnd = CHROME_HWND
log(f"Focusing Chrome hwnd={hwnd} title='{get_title(hwnd)}'")
force_focus(hwnd)
wx,wy,ww,wh = get_rect(hwnd)
log(f"Chrome rect: {wx},{wy} {ww}x{wh}")
CHROME_UI_H = 65
vp_h = wh - CHROME_UI_H

# Step 4: Click Select files button (center of viewport, ~55-60% down)
select_x = wx + ww // 2
for y_pct in [0.57, 0.55, 0.60, 0.52, 0.62, 0.50, 0.65, 0.48]:
    select_y = wy + CHROME_UI_H + int(vp_h * y_pct)
    log(f"Clicking Select files at ({select_x},{select_y}) pct={y_pct:.2f}")
    force_focus(hwnd); time.sleep(0.2)
    click(select_x, select_y, delay=1.2)

    # Watch for file dialog
    deadline = time.time() + 8
    dialog = 0
    while time.time() < deadline:
        h = user32.FindWindowW("#32770", None)
        if h:
            tid,pid = get_tid(h)
            vis = bool(user32.IsWindowVisible(h))
            t = get_title(h)
            log(f"  Found hwnd={h} vis={vis} pid={pid} title='{t}'")
            if vis and pid > 0 and t not in ['B:/', 'A:/']:
                dialog = h; log(f"  Real YT dialog: hwnd={h}"); break
        time.sleep(0.1)
    if dialog: break

if not dialog:
    log("No YT file dialog found - trying clipboard paste anyway on any #32770")
    h = user32.FindWindowW("#32770", None)
    if h:
        tid,pid = get_tid(h)
        if bool(user32.IsWindowVisible(h)) and pid > 0:
            dialog = h
            log(f"  Using dialog hwnd={h} title='{get_title(h)}'")

if not dialog:
    log("TIMEOUT: no file dialog found");
    for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)
    sys.exit(1)

# Step 5: Fill file path in dialog
log(f"Handling dialog hwnd={dialog}...")
time.sleep(0.5)
user32.SetForegroundWindow(dialog); time.sleep(0.5)

hwnd_edit = user32.FindWindowExW(dialog, None, "Edit", None)
log(f"Edit hwnd: {hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit, WM_SETTEXT, 0, FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog); time.sleep(0.15)
    vkey(VK_RETURN); time.sleep(0.4)
    hwnd_btn = user32.FindWindowExW(dialog, None, "Button", None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn, 0x00F5, 0, 0)  # BM_CLICK
        log(f"  Clicked Open btn: {hwnd_btn}")
    log("Path set via WM_SETTEXT")
else:
    log("No Edit ctrl - clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("Path pasted + Enter")

# Restore Claude
log("Restoring Claude windows...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)

log("=== Done - upload starting ===")
lf.close()

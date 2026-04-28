"""
yt_click676.py
==============
Upload wizard is already open. Click Select files at the CORRECT position:
- Screen coords: (960, 676) = 63% of viewport height
- Wizard is already open via MCP extension click

Usage: python yt_click676.py <path_to_mp4>
"""
import ctypes, ctypes.wintypes, time, sys, subprocess

if len(sys.argv) < 2:
    print("Usage: python yt_click676.py <path_to_mp4>"); sys.exit(1)

FILE_PATH    = sys.argv[1]
LOG_PATH     = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_click676.log"
CHROME_HWND  = 2820290
CLAUDE_HWND1 = 132606
CLAUDE_HWND2 = 13174642

lf = open(LOG_PATH, "w", buffering=1)
def log(m): print(m); lf.write(m+"\n")
log(f"=== yt_click676.py ===")
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

def find_new_dialogs(pre_hwnds):
    found = set()
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
    def cb(h, _):
        cls = ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(h, cls, 64)
        if cls.value == "#32770":
            tid,pid = get_tid(h)
            if bool(user32.IsWindowVisible(h)) and pid > 0 and h not in pre_hwnds:
                found.add(h)
        return True
    user32.EnumWindows(WNDENUMPROC(cb), 0)
    return found

# Record pre-existing dialogs
def all_dialogs():
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

# Step 1: set clipboard FIRST
set_clip(FILE_PATH)
time.sleep(0.3)

pre_dialogs = all_dialogs()
log(f"Pre-existing dialogs: {pre_dialogs}")

# Step 2: Minimize Claude
log("Minimizing Claude...")
for h in [CLAUDE_HWND1, CLAUDE_HWND2]:
    user32.ShowWindow(h, SW_MINIMIZE); time.sleep(0.3)
time.sleep(0.5)

# Step 3: Focus Chrome
hwnd = CHROME_HWND
log(f"Focusing Chrome hwnd={hwnd} title='{get_title(hwnd)}'")
force_focus(hwnd)
wx,wy,ww,wh = get_rect(hwnd)
log(f"Chrome rect: {wx},{wy} {ww}x{wh}")

# Step 4: Click Select files at multiple y positions, starting with 676
# 676 = 57 + int(983 * 0.63)
target_ys = [676, 670, 682, 665, 688, 658, 694, 650, 700]

dialog = 0
for target_y in target_ys:
    log(f"Clicking Select files at (960,{target_y})...")
    force_focus(hwnd); time.sleep(0.2)
    click(960, target_y, delay=1.0)

    deadline = time.time() + 10
    while time.time() < deadline:
        new_d = find_new_dialogs(pre_dialogs)
        if new_d:
            d = next(iter(new_d))
            t = get_title(d)
            log(f"  NEW dialog hwnd={d} title='{t}'")
            dialog = d; break
        time.sleep(0.1)
    if dialog: break

if not dialog:
    log("No new dialog. Checking all dialogs...")
    cur = all_dialogs()
    log(f"All current dialogs: {cur}")
    # Try any dialog
    if cur:
        dialog = next(iter(cur))
        log(f"Using fallback dialog hwnd={dialog}")

if not dialog:
    log("FAILED: no file dialog");
    for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)
    lf.close(); sys.exit(1)

# Step 5: Fill path
log(f"Handling dialog hwnd={dialog} title='{get_title(dialog)}'")
time.sleep(0.3)
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
        user32.SendMessageW(hwnd_btn, 0x00F5, 0, 0)
        log(f"  Clicked Open: {hwnd_btn}")
    log("Path set via WM_SETTEXT")
else:
    log("No Edit ctrl - clipboard paste")
    ctrl(VK_A); time.sleep(0.1)
    ctrl(VK_V); time.sleep(0.3)
    vkey(VK_RETURN)
    log("Pasted + Enter")

# Restore Claude
for h in [CLAUDE_HWND1, CLAUDE_HWND2]: user32.ShowWindow(h, SW_RESTORE)
log("=== Done ===")
lf.close()

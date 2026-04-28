"""
yt_click_tab.py
===============
1. Click the "Channel content - YouTube Studio" tab in the visible Chrome window
2. Wait for Studio UI to be active
3. Click Create -> Upload videos -> Select files
4. Fill file dialog

From the desktop screenshot:
  - Chrome maximised at rect (-8,-8,1936,1048)  =>  visible area 0..1920 x 0..1040
  - Chrome tab bar is at y ~ 15 (screen coords)
  - Tab "Channel content - YouTube Stu..." is approximately the 4th tab from the left
  - After the 3 left tabs (each ~170px wide): x ~ 3*170 + 85 = 595
  - Chrome UI height (tabs+address bar) = 65 px
"""

import ctypes, ctypes.wintypes, time, os, sys

FILE_PATH  = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
LOG_PATH   = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\yt_click_tab.log"
STUDIO_URL = "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"

lf = open(LOG_PATH, "w", buffering=1)
def log(m):
    print(m); lf.write(m+"\n")

log("=== yt_click_tab.py started ===")

# ── WinAPI ────────────────────────────────────────────────────────────────────
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
SCREEN_W = user32.GetSystemMetrics(0)
SCREEN_H = user32.GetSystemMetrics(1)
log(f"Screen {SCREEN_W}x{SCREEN_H}")

MOUSEEVENTF_MOVE       = 0x0001
MOUSEEVENTF_LEFTDOWN   = 0x0002
MOUSEEVENTF_LEFTUP     = 0x0004
MOUSEEVENTF_ABSOLUTE   = 0x8000
MOUSEEVENTF_NOCOALESCE = 0x2000
KEYEVENTF_KEYUP        = 0x0002
KEYEVENTF_UNICODE      = 0x0004
INPUT_MOUSE   = 0
INPUT_KEYBOARD = 1
VK_RETURN  = 0x0D
VK_CONTROL = 0x11
VK_A       = 0x41
VK_L       = 0x4C
SW_MAXIMIZE = 3
SW_RESTORE  = 9
WM_SETTEXT  = 0x000C
BM_CLICK    = 0x00F5
PROCESS_QUERY_LIMITED = 0x1000

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx",ctypes.c_long),("dy",ctypes.c_long),
                ("mouseData",ctypes.c_ulong),("dwFlags",ctypes.c_ulong),
                ("time",ctypes.c_ulong),("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]
class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk",ctypes.c_ushort),("wScan",ctypes.c_ushort),
                ("dwFlags",ctypes.c_ulong),("time",ctypes.c_ulong),
                ("dwExtraInfo",ctypes.POINTER(ctypes.c_ulong))]
class _U(ctypes.Union):
    _fields_ = [("mi",MOUSEINPUT),("ki",KEYBDINPUT)]
class INPUT(ctypes.Structure):
    _fields_ = [("type",ctypes.c_ulong),("_input",_U)]

def click(x, y, delay=0.15):
    nx = int(x*65535/SCREEN_W); ny = int(y*65535/SCREEN_H)
    arr = (INPUT*3)(
        INPUT(INPUT_MOUSE,_U(mi=MOUSEINPUT(nx,ny,0,MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_NOCOALESCE,0,None))),
        INPUT(INPUT_MOUSE,_U(mi=MOUSEINPUT(nx,ny,0,MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE,0,None))),
        INPUT(INPUT_MOUSE,_U(mi=MOUSEINPUT(nx,ny,0,MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE,0,None))),
    )
    r = user32.SendInput(3,arr,ctypes.sizeof(INPUT))
    log(f"  click({x},{y}) r={r}")
    time.sleep(delay)

def key(vk):
    arr = (INPUT*2)(
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(vk,0,0,0,None))),
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(vk,0,KEYEVENTF_KEYUP,0,None))),
    )
    user32.SendInput(2,arr,ctypes.sizeof(INPUT)); time.sleep(0.06)

def ctrl(vk):
    arr = (INPUT*4)(
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(VK_CONTROL,0,0,0,None))),
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(vk,0,0,0,None))),
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(vk,0,KEYEVENTF_KEYUP,0,None))),
        INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(VK_CONTROL,0,KEYEVENTF_KEYUP,0,None))),
    )
    user32.SendInput(4,arr,ctypes.sizeof(INPUT)); time.sleep(0.12)

def type_text(text):
    for ch in text:
        c = ord(ch)
        arr = (INPUT*2)(
            INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(0,c,KEYEVENTF_UNICODE,0,None))),
            INPUT(INPUT_KEYBOARD,_U(ki=KEYBDINPUT(0,c,KEYEVENTF_UNICODE|KEYEVENTF_KEYUP,0,None))),
        )
        user32.SendInput(2,arr,ctypes.sizeof(INPUT)); time.sleep(0.018)

def get_rect(hwnd):
    r = ctypes.wintypes.RECT()
    user32.GetWindowRect(hwnd,ctypes.byref(r))
    return r.left,r.top,r.right-r.left,r.bottom-r.top

def get_title(hwnd):
    b = ctypes.create_unicode_buffer(512)
    user32.GetWindowTextW(hwnd,b,512)
    return b.value

def get_proc(pid):
    try:
        h = kernel32.OpenProcess(PROCESS_QUERY_LIMITED,False,pid)
        if not h: return ""
        b = ctypes.create_unicode_buffer(1024)
        s = ctypes.c_ulong(1024)
        kernel32.QueryFullProcessImageNameW(h,0,b,ctypes.byref(s))
        kernel32.CloseHandle(h)
        return os.path.basename(b.value).lower()
    except: return ""

def enum_chrome():
    res = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.wintypes.HWND,ctypes.wintypes.LPARAM)
    def cb(hwnd,_):
        cls=ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(hwnd,cls,64)
        if cls.value!="Chrome_WidgetWin_1": return True
        pid=ctypes.c_ulong(0)
        user32.GetWindowThreadProcessId(hwnd,ctypes.byref(pid))
        if get_proc(pid.value) not in ("chrome.exe","chrome"): return True
        title=ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd,title,512)
        vis=bool(user32.IsWindowVisible(hwnd))
        res.append((hwnd,title.value,vis))
        return True
    user32.EnumWindows(WNDENUMPROC(cb),0)
    return res

# ── 1. Find the visible Chrome window ────────────────────────────────────────
log("Enumerating Chrome windows...")
wins = enum_chrome()
for h,t,v in wins:
    log(f"  hwnd={h} vis={v} title='{t}'")

# Pick visible one with a title
target = None
for h,t,v in wins:
    if v and t:
        target = h
        log(f"Selected: hwnd={h} title='{t}'")
        break

if not target:
    log("No visible Chrome window found")
    sys.exit(1)

# ── 2. Restore & maximize the Chrome window ───────────────────────────────────
user32.ShowWindow(target, SW_RESTORE)
time.sleep(0.3)
user32.ShowWindow(target, SW_MAXIMIZE)
time.sleep(0.4)
user32.SetForegroundWindow(target)
time.sleep(0.5)

wx, wy, ww, wh = get_rect(target)
log(f"Window rect: {wx},{wy} {ww}x{wh}")

# ── 3. Click the YouTube Studio tab in the tab bar ────────────────────────────
# The tab bar is inside the Chrome frame.
# With window at x=-8, the visible left edge is at screen x=0.
# Tabs from left (approx, 1920px wide maximized Chrome):
#   Tab1: Calendly          x ~  95, y ~  15
#   Tab2: NetWebMedia-YT    x ~ 265, y ~  15
#   Tab3: Create Instagram  x ~ 445, y ~  15
#   Tab4: Channel content   x ~ 610, y ~  15   ← YouTube Studio tab
#   Tab5: Connect Obsidian  x ~ 710, y ~  15
#   Tab6: Calendly          x ~ 830, y ~  15
#   Tab7: Create Instagram  x ~ 990, y ~  15
CHROME_UI_H = 65
tab_y = wy + 15        # tab bar is ~15px from top of window

# Click tab 4 (Channel content - YouTube Studio)
tab4_x = wx + 610
log(f"Clicking Studio tab at ({tab4_x},{tab_y})")
click(tab4_x, tab_y, delay=0.5)
time.sleep(0.3)

# Check the title
new_title = get_title(target)
log(f"After tab click: '{new_title}'")

# If not Studio, try clicking each tab candidate
if "YouTube" not in new_title and "Studio" not in new_title:
    log("Not on Studio yet, trying tab positions 500..900 step 80")
    for tx in [500, 580, 660, 740, 820, 900]:
        log(f"  Trying tab at x={tx}")
        click(wx+tx, tab_y, delay=0.4)
        t2 = get_title(target)
        log(f"    title='{t2}'")
        if "YouTube" in t2 or "Studio" in t2:
            log(f"  Found Studio tab at x={tx}")
            break

new_title = get_title(target)
log(f"Current title: '{new_title}'")

# ── 4. If still not on Studio, navigate via address bar ──────────────────────
if "YouTube" not in new_title and "Studio" not in new_title:
    log("Navigating to Studio via Ctrl+L...")
    user32.SetForegroundWindow(target)
    time.sleep(0.3)
    ctrl(VK_L)
    time.sleep(0.4)
    ctrl(VK_A)
    time.sleep(0.1)
    type_text(STUDIO_URL)
    time.sleep(0.2)
    key(VK_RETURN)
    log("Navigation sent, waiting 7s...")
    time.sleep(7)
    new_title = get_title(target)
    log(f"Title after navigation: '{new_title}'")

# Re-read rect (might have changed)
wx, wy, ww, wh = get_rect(target)
log(f"Window rect: {wx},{wy} {ww}x{wh}")

# ── 5. Click Create -> Upload videos -> Select files ─────────────────────────
CHROME_UI_H = 65
# Create button: Studio header top-right, ~130px from right, ~32px below viewport top
create_x = wx + ww - 130
create_y = wy + CHROME_UI_H + 32
log(f"Clicking Create at ({create_x},{create_y})")
user32.SetForegroundWindow(target)
time.sleep(0.3)
click(create_x, create_y, delay=0.7)

# Upload videos is ~35-45px below Create in the dropdown
upload_y = create_y + 40
log(f"Clicking Upload videos at ({create_x},{upload_y})")
click(create_x, upload_y, delay=3.0)

# Select files: center of dialog, ~62% down viewport
vp_h = wh - CHROME_UI_H
select_x = wx + ww // 2
select_y = wy + CHROME_UI_H + int(vp_h * 0.62)
log(f"Clicking Select files at ({select_x},{select_y})")
click(select_x, select_y, delay=0.8)

# ── 6. Wait for native file dialog ───────────────────────────────────────────
log("Watching for file dialog (#32770)...")
deadline = time.time() + 20
dialog = 0
while time.time() < deadline:
    h = user32.FindWindowW("#32770", None)
    if h:
        dialog = h
        log(f"File dialog: hwnd={h}")
        break
    time.sleep(0.2)

if not dialog:
    # Retry at slightly different Y
    log("No dialog yet - retrying click at 55% viewport height")
    select_y2 = wy + CHROME_UI_H + int(vp_h * 0.55)
    click(select_x, select_y2, delay=0.8)
    deadline2 = time.time() + 15
    while time.time() < deadline2:
        h = user32.FindWindowW("#32770", None)
        if h:
            dialog = h
            log(f"File dialog on retry: hwnd={h}")
            break
        time.sleep(0.2)

if not dialog:
    log("TIMEOUT: no file dialog appeared")
    sys.exit(1)

# ── 7. Fill file path in dialog ───────────────────────────────────────────────
user32.SetForegroundWindow(dialog)
time.sleep(0.5)

# Try WM_SETTEXT on the Edit control
hwnd_edit = user32.FindWindowExW(dialog, None, "Edit", None)
log(f"Edit hwnd: {hwnd_edit}")

if hwnd_edit:
    user32.SendMessageW(hwnd_edit, WM_SETTEXT, 0, FILE_PATH)
    time.sleep(0.3)
    user32.SetForegroundWindow(dialog)
    time.sleep(0.15)
    key(VK_RETURN)
    time.sleep(0.4)
    # Also click Open button
    hwnd_btn = user32.FindWindowExW(dialog, None, "Button", None)
    if hwnd_btn:
        user32.SendMessageW(hwnd_btn, BM_CLICK, 0, 0)
        log(f"Clicked Open btn: hwnd={hwnd_btn}")
    log("Path set via WM_SETTEXT + Enter + Button")
else:
    log("No Edit control - typing path directly")
    type_text(FILE_PATH)
    time.sleep(0.2)
    key(VK_RETURN)
    log("Path typed via SendInput unicode")

log("=== Done - upload should be in progress ===")
lf.close()

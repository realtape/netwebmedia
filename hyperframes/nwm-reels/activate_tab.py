"""
Find secondary Chrome window, bring to foreground, send Ctrl+4 to switch to tab 4.
"""
import ctypes, ctypes.wintypes, time, sys

u32 = ctypes.windll.user32
k32 = ctypes.windll.kernel32

VK_CONTROL  = 0x11
VK_4        = 0x34
INPUT_KEYBOARD  = 1
KEYEVENTF_KEYUP = 0x0002

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", ctypes.c_ushort), ("wScan", ctypes.c_ushort),
                ("dwFlags", ctypes.c_ulong), ("time", ctypes.c_ulong),
                ("dwExtraInfo", ctypes.c_ulonglong)]

class INPUT_UNION(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT)]

class INPUT(ctypes.Structure):
    _anonymous_ = ("_u",)
    _fields_ = [("type", ctypes.c_ulong), ("_u", INPUT_UNION)]

def key_event(vk, flags=0):
    i = INPUT(type=INPUT_KEYBOARD)
    i.ki = KEYBDINPUT(wVk=vk, wScan=0, dwFlags=flags, time=0, dwExtraInfo=0)
    return i

def send_ctrl4():
    evts = (INPUT * 4)(
        key_event(VK_CONTROL),
        key_event(VK_4),
        key_event(VK_4, KEYEVENTF_KEYUP),
        key_event(VK_CONTROL, KEYEVENTF_KEYUP),
    )
    n = u32.SendInput(4, evts, ctypes.sizeof(INPUT))
    print(f"  SendInput sent {n} events")

def get_title(hwnd):
    n = u32.GetWindowTextLengthW(hwnd)
    if n <= 0:
        return ""
    buf = ctypes.create_unicode_buffer(n + 1)
    u32.GetWindowTextW(hwnd, buf, n + 1)
    return buf.value

def find_chrome_windows():
    results = []
    def cb(hwnd, _):
        if u32.IsWindowVisible(hwnd):
            cls = ctypes.create_unicode_buffer(256)
            u32.GetClassNameW(hwnd, cls, 256)
            if "Chrome_WidgetWin" in cls.value:
                title = get_title(hwnd)
                results.append((hwnd, title))
        return True
    PROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
    u32.EnumWindows(PROC(cb), 0)
    return results

target = 1378226  # secondary Chrome window (YouTube Studio)

fg = u32.GetForegroundWindow()
print(f"Current foreground HWND: {fg}")

if not u32.IsWindow(target):
    print(f"HWND {target} no longer exists! Chrome windows found:")
    for hwnd, title in find_chrome_windows():
        print(f"  {hwnd}: {title[:80]}")
    sys.exit(1)

print(f"Target HWND {target} exists: '{get_title(target)[:60]}'")

# Attach to foreground thread, then force activate
fg_tid = u32.GetWindowThreadProcessId(fg, None)
my_tid = k32.GetCurrentThreadId()
if fg_tid != my_tid:
    u32.AttachThreadInput(my_tid, fg_tid, True)

u32.ShowWindow(target, 9)    # SW_RESTORE
u32.SetForegroundWindow(target)
u32.BringWindowToTop(target)

if fg_tid != my_tid:
    u32.AttachThreadInput(my_tid, fg_tid, False)

time.sleep(0.5)
new_fg = u32.GetForegroundWindow()
print(f"Foreground after activate: {new_fg}  (match={new_fg == target})")

print("Sending Ctrl+4 to switch to tab 4...")
send_ctrl4()
time.sleep(0.8)
print(f"Final foreground: {u32.GetForegroundWindow()}")
print("Done.")

"""Find the Chrome window with the YouTube Studio upload dialog and bring it to front."""
import ctypes
import ctypes.wintypes

user32 = ctypes.windll.user32
EnumWindows = user32.EnumWindows
EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)

GetWindowText = user32.GetWindowTextW
GetWindowTextLength = user32.GetWindowTextLengthW
IsWindowVisible = user32.IsWindowVisible
SetForegroundWindow = user32.SetForegroundWindow
ShowWindow = user32.ShowWindow
SW_RESTORE = 9

chrome_windows = []

def enum_proc(hwnd, lparam):
    if IsWindowVisible(hwnd):
        length = GetWindowTextLength(hwnd)
        if length > 0:
            buf = ctypes.create_unicode_buffer(length + 1)
            GetWindowText(hwnd, buf, length + 1)
            title = buf.value
            if title:
                chrome_windows.append((hwnd, title))
    return True

EnumWindows(EnumWindowsProc(enum_proc), 0)

print("All visible windows:")
for hwnd, title in chrome_windows:
    print(f"  HWND={hwnd} TITLE='{title}'")

# Find the main Chrome window (more tabs = longer running process)
target = None
for hwnd, title in chrome_windows:
    if 'YouTube Studio' in title and 'Google Chrome' in title:
        print(f"\nCandidate: HWND={hwnd} TITLE='{title}'")
        if target is None:
            target = (hwnd, title)

# If multiple, pick the one that's NOT the small secondary window
# HWND 1378226 is the small one we already know about
if target:
    hwnd, title = target
    print(f"\nBringing to front: HWND={hwnd}")
    ShowWindow(hwnd, SW_RESTORE)
    import time; time.sleep(0.2)
    result = SetForegroundWindow(hwnd)
    print(f"SetForegroundWindow result: {result}")
else:
    print("\nNo YouTube Studio Chrome window found")
    # Try all windows and pick any Chrome one
    for hwnd, title in chrome_windows:
        if 'Google Chrome' in title:
            print(f"Chrome window: HWND={hwnd} TITLE='{title}'")

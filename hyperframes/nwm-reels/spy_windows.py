"""
Spy on ALL windows (visible + invisible, top-level + child of Chrome).
Run this, then click 'Select files' — it logs everything for 15 seconds.
"""
import time
import ctypes
import ctypes.wintypes
import sys

user32 = ctypes.windll.user32
EnumWindows = user32.EnumWindows
EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
EnumChildWindows = user32.EnumChildWindows

def get_window_info(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    title = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, title, length + 1)
    cls = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, cls, 256)
    vis = user32.IsWindowVisible(hwnd)
    return title.value, cls.value, bool(vis)

def snapshot_all():
    wins = {}
    def cb(hwnd, _):
        title, cls, vis = get_window_info(hwnd)
        wins[hwnd] = (title, cls, vis)
        return True
    EnumWindows(EnumWindowsProc(cb), 0)
    return wins

print("Taking initial snapshot...")
before = snapshot_all()
print(f"  {len(before)} top-level windows recorded")
print("Now click 'Select files' in YouTube Studio (you have 3s)...")
print()

time.sleep(3)

# Poll for 15 seconds logging all new windows
print("Polling for 15 seconds...")
known = set(before.keys())
start = time.time()
found_new = []

while time.time() - start < 15:
    current = snapshot_all()
    for hwnd, (title, cls, vis) in current.items():
        if hwnd not in known:
            known.add(hwnd)
            found_new.append((hwnd, title, cls, vis))
            print(f"  NEW: hwnd={hwnd} vis={vis} cls='{cls}' title='{title}'")
            # Also dump child windows
            children = []
            def child_cb(child_hwnd, _):
                ct, cc, cv = get_window_info(child_hwnd)
                children.append((child_hwnd, ct, cc, cv))
                return True
            EnumChildWindows(hwnd, EnumWindowsProc(child_cb), 0)
            for ch, ct, cc, cv in children:
                print(f"    CHILD: hwnd={ch} vis={cv} cls='{cc}' title='{ct}'")
    time.sleep(0.05)

if not found_new:
    print("NO new top-level windows appeared.")
    print()
    print("Dumping ALL current top-level windows (to spot any that might be the picker):")
    current = snapshot_all()
    for hwnd, (title, cls, vis) in sorted(current.items()):
        if vis or title:  # only print visible or titled ones
            print(f"  hwnd={hwnd} vis={vis} cls='{cls}' title='{title}'")
else:
    print(f"\nFound {len(found_new)} new windows during poll.")

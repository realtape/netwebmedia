"""
Send Ctrl+4 to Chrome via PostMessage to the window message queue.
Also try WM_COMMAND approaches for tab switching.
"""
import ctypes, time

u32 = ctypes.windll.user32

WM_KEYDOWN = 0x0100
WM_KEYUP   = 0x0101
WM_SYSKEYDOWN = 0x0104

VK_CONTROL = 0x11
VK_4 = 0x34

hwnd = 1378226

def post_key(vk, down=True):
    msg = WM_KEYDOWN if down else WM_KEYUP
    scan = u32.MapVirtualKeyW(vk, 0)
    lParam = (scan << 16) | 1
    if not down:
        lParam |= (1 << 30) | (1 << 31)  # prev state | transition state
    result = u32.PostMessageW(hwnd, msg, vk, lParam)
    return result

print(f"Target HWND {hwnd} valid: {bool(u32.IsWindow(hwnd))}")
print(f"Current foreground: {u32.GetForegroundWindow()}")

# Method 1: PostMessage WM_KEYDOWN/WM_KEYUP for Ctrl+4
print("\nMethod 1: PostMessage Ctrl+4")
r1 = post_key(VK_CONTROL, True)
r2 = post_key(VK_4, True)
time.sleep(0.05)
r3 = post_key(VK_4, False)
r4 = post_key(VK_CONTROL, False)
print(f"  Results: {r1},{r2},{r3},{r4}")
time.sleep(0.5)

print("Done.")

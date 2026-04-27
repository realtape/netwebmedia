"""
Wait for the Windows file picker dialog that Chrome opens,
then fill in the file path and press Enter.
Run this BEFORE clicking 'Select files' in Chrome Studio.
"""
import time
import ctypes
import ctypes.wintypes
import subprocess
import sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"

user32 = ctypes.windll.user32
EnumWindows = user32.EnumWindows
EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)

def get_window_info(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    title = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, title, length + 1)

    cls = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, cls, 256)

    return title.value, cls.value

def find_file_dialog():
    """Find Chrome's file picker dialog window."""
    results = []

    def callback(hwnd, lParam):
        if not user32.IsWindowVisible(hwnd):
            return True
        title, cls = get_window_info(hwnd)
        # Chrome file picker can appear as these
        if (cls == '#32770' or
            'Open' in title or 'Abrir' in title or
            'Select' in title or 'Selec' in title or
            'file' in title.lower()):
            results.append((hwnd, title, cls))
        return True

    EnumWindows(EnumWindowsProc(callback), 0)
    return results

def set_file_and_open(hwnd, file_path):
    """Set the file path in the dialog and press Open."""
    import ctypes

    # Find the Edit control (filename field)
    # Class: Edit, or ComboBoxEx32 > ComboBox > Edit
    edit_hwnd = user32.FindWindowExW(hwnd, 0, "Edit", None)
    combo_hwnd = user32.FindWindowExW(hwnd, 0, "ComboBoxEx32", None)

    if combo_hwnd:
        combo_inner = user32.FindWindowExW(combo_hwnd, 0, "ComboBox", None)
        if combo_inner:
            edit_hwnd = user32.FindWindowExW(combo_inner, 0, "Edit", None)

    if not edit_hwnd:
        print(f"  No Edit control found in hwnd={hwnd}")
        return False

    # Set the text via WM_SETTEXT
    WM_SETTEXT = 0x000C
    user32.SendMessageW(edit_hwnd, WM_SETTEXT, 0, file_path)
    time.sleep(0.2)

    # Press Enter or click Open button
    VK_RETURN = 0x0D
    WM_KEYDOWN = 0x0100
    WM_KEYUP = 0x0101
    user32.PostMessageW(edit_hwnd, WM_KEYDOWN, VK_RETURN, 0)
    user32.PostMessageW(edit_hwnd, WM_KEYUP, VK_RETURN, 0)
    time.sleep(0.2)

    # Also try clicking Button1 (the Open/Abrir button)
    btn = user32.FindWindowExW(hwnd, 0, "Button", None)
    if btn:
        BM_CLICK = 0x00F5
        user32.PostMessageW(btn, BM_CLICK, 0, 0)

    return True

def main():
    print(f"Waiting for file dialog... (will fill: {FILE_PATH})")
    print("Now click 'Select files' in YouTube Studio.")
    print()

    # Record existing windows
    known = set()
    def record(hwnd, _):
        known.add(hwnd)
        return True
    EnumWindows(EnumWindowsProc(record), 0)
    print(f"Recorded {len(known)} existing windows. Watching for new ones...")

    start = time.time()
    while time.time() - start < 30:
        current = []
        def collect(hwnd, _):
            if user32.IsWindowVisible(hwnd):
                current.append(hwnd)
            return True
        EnumWindows(EnumWindowsProc(collect), 0)

        for hwnd in current:
            if hwnd in known:
                continue
            known.add(hwnd)

            title, cls = get_window_info(hwnd)
            print(f"  New window: hwnd={hwnd} title='{title}' class='{cls}'")

            # Check if it's a file dialog
            is_dialog = (
                cls == '#32770' or
                any(k in title for k in ['Open', 'Abrir', 'Select', 'Selec', 'file', 'Upload']) or
                any(k in cls for k in ['File', 'Dialog', 'Open'])
            )

            if is_dialog:
                print(f"  -> FILE DIALOG detected! Filling path...")
                time.sleep(0.5)
                if set_file_and_open(hwnd, FILE_PATH):
                    print(f"  -> Done! File path set to: {FILE_PATH}")
                    return
                else:
                    print(f"  -> Could not set path, trying SendKeys fallback...")
                    # Activate and type
                    user32.SetForegroundWindow(hwnd)
                    time.sleep(0.3)
                    # Use PowerShell to send keys
                    subprocess.run([
                        "powershell", "-Command",
                        f'Add-Type -AssemblyName System.Windows.Forms; '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{FILE_PATH}"); '
                        f'[System.Windows.Forms.SendKeys]::SendWait("{{ENTER}}")'
                    ])
                    return

        time.sleep(0.1)

    print("Timeout — no file dialog detected in 30 seconds.")

if __name__ == "__main__":
    main()

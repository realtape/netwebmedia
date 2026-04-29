#Requires AutoHotkey v2.0
#SingleInstance Force

LOG := FileOpen(A_ScriptDir "\switch_click.log", "w", "UTF-8")
LOG.WriteLine("[AHK] Script started at " FormatTime(, "HH:mm:ss"))

; Target: Chrome window with the YouTube Studio tab
HWND := 0x00010628

; Verify window exists
if !WinExist("ahk_id " HWND) {
    LOG.WriteLine("[AHK] ERROR: Target Chrome window not found")
    ExitApp
}

; Activate the Chrome window
WinActivate("ahk_id " HWND)
WinWaitActive("ahk_id " HWND, , 3)
LOG.WriteLine("[AHK] Chrome window activated")
Sleep(400)

; Open Chrome tab search: Ctrl+Shift+A
Send("^+a")
LOG.WriteLine("[AHK] Sent Ctrl+Shift+A")
Sleep(700)

; Type to search for the YouTube Studio tab
SendText("Channel dashboard")
LOG.WriteLine("[AHK] Typed search query")
Sleep(600)

; Press Enter to switch to the tab
Send("{Enter}")
LOG.WriteLine("[AHK] Pressed Enter to switch tab")
Sleep(1500)   ; wait for tab to become active and render

; Now click the "Select files" button
; Chrome window: 1936x1048, client origin at (0,0)
; Toolbar height: 111px, button CSS y ~399, so screen y = 111+399 = 510
; Button center x: 938 (half of 1876 viewport)

LOG.WriteLine("[AHK] Clicking at (938, 510)...")
Click(938, 510)
Sleep(1200)

; Check if file dialog appeared
if WinExist("ahk_class #32770") {
    LOG.WriteLine("[AHK] ✓ File dialog found! Watcher should fill path.")
    LOG.Close()
    ExitApp
}
LOG.WriteLine("[AHK] No dialog at y=510, trying y=609...")
Click(938, 609)
Sleep(1200)

if WinExist("ahk_class #32770") {
    LOG.WriteLine("[AHK] ✓ File dialog found at y=609!")
    LOG.Close()
    ExitApp
}
LOG.WriteLine("[AHK] No dialog at y=609, trying y=720...")
Click(938, 720)
Sleep(1200)

if WinExist("ahk_class #32770") {
    LOG.WriteLine("[AHK] ✓ File dialog found at y=720!")
} else {
    LOG.WriteLine("[AHK] No file dialog appeared after 3 attempts.")
}

LOG.Close()
ExitApp

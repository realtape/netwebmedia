#Requires AutoHotkey v2.0
#SingleInstance Force

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
HWND_INT  := 0x00010628
HWND_STR  := "ahk_id " . HWND_INT

; Logging helper — silently skips if write fails
L(msg) {
    try FileAppend(msg . "`n", A_ScriptDir . "\switch_click.log")
}

L("[AHK " . FormatTime(A_Now, "HH:mm:ss") . "] Script started")

; ── 1. Activate Chrome window ─────────────────────────────────────────────────
if !WinExist(HWND_STR) {
    L("[AHK] ERROR: Chrome HWND 0x00010628 not found")
    ExitApp
}
WinActivate(HWND_STR)
L("[AHK] WinActivate sent")
if !WinWaitActive(HWND_STR, , 5)
    L("[AHK] WARNING: WinWaitActive timed out")
L("[AHK] Chrome active")
Sleep(500)

; ── 2. Switch to YouTube Studio tab ──────────────────────────────────────────
Send("^+a")
L("[AHK] Sent Ctrl+Shift+A")
Sleep(1000)
SendText("Channel dashboard")
L("[AHK] Typed search")
Sleep(700)
Send("{Enter}")
L("[AHK] Pressed Enter for tab switch")
Sleep(2500)
L("[AHK] Tab switch wait done")

; ── 3. Click "Select files" button ───────────────────────────────────────────
L("[AHK] Clicking (974,680) — btn CSS center (938,585)")
Click(974, 680)
Sleep(2000)

; ── 4. Wait for #32770 file dialog ───────────────────────────────────────────
if WinExist("ahk_class #32770") {
    L("[AHK] Dialog found immediately")
} else {
    L("[AHK] Waiting for dialog (up to 10s)...")
    if !WinWait("ahk_class #32770", , 10) {
        L("[AHK] No dialog after 10s, trying alt Y=707")
        Click(974, 802)
        Sleep(1000)
        if !WinWait("ahk_class #32770", , 8) {
            L("[AHK] No dialog after 2 tries - abort")
            ExitApp
        }
    }
}
L("[AHK] File dialog appeared!")
Sleep(500)

; ── 5. Fill filename via ControlSetText (no focus grab needed) ───────────────
setOk := false
try {
    ControlSetText(FILE_PATH, "Edit1", "ahk_class #32770")
    L("[AHK] ControlSetText OK")
    setOk := true
} catch as e {
    L("[AHK] ControlSetText failed: " . e.Message)
}

if !setOk {
    WinActivate("ahk_class #32770")
    if !WinWaitActive("ahk_class #32770", , 5)
        L("[AHK] WARNING: dialog activate timed out")
    Sleep(400)
    Send("^a")
    Sleep(100)
    SendText(FILE_PATH)
    L("[AHK] Fallback SendText done")
}

Sleep(300)

; ── 6. Click the Open button ─────────────────────────────────────────────────
clickOk := false
try {
    ControlClick("Button1", "ahk_class #32770")
    L("[AHK] ControlClick Button1 OK")
    clickOk := true
} catch as e {
    L("[AHK] ControlClick failed: " . e.Message)
}

if !clickOk {
    WinActivate("ahk_class #32770")
    if WinWaitActive("ahk_class #32770", , 3)
        Sleep(300)
    Send("{Enter}")
    L("[AHK] Fallback Enter sent")
}

Sleep(800)

if WinExist("ahk_class #32770") {
    L("[AHK] Dialog still open - pressing Enter again")
    WinActivate("ahk_class #32770")
    Sleep(200)
    Send("{Enter}")
    Sleep(600)
}

L("[AHK " . FormatTime(A_Now, "HH:mm:ss") . "] Script complete")
ExitApp

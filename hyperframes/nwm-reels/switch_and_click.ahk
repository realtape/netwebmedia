#Requires AutoHotkey v2.0
#SingleInstance Force

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
HWND_INT  := 0x00010628
HWND_STR  := "ahk_id " . HWND_INT

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
Sleep(3000)
L("[AHK] Tab render wait done")

; ── 3. Trigger "Select files" via keyboard (Tab + Enter) ─────────────────────
; The upload dialog is a modal — Tab focuses Select files, Enter fires it
L("[AHK] Sending Tab to focus Select files button")
Send("{Tab}")
Sleep(400)
L("[AHK] Sending Enter to activate button")
Send("{Enter}")
Sleep(2000)

; ── 4. If no dialog yet, try Space instead of Enter ──────────────────────────
if !WinExist("ahk_class #32770") {
    L("[AHK] No dialog after Enter, trying Space")
    Send("{Space}")
    Sleep(1500)
}

; ── 5. If still no dialog, try direct click as last resort ───────────────────
if !WinExist("ahk_class #32770") {
    L("[AHK] No dialog after Space, trying coordinate click (974,680)")
    Click(974, 680)
    Sleep(2000)
}

if !WinExist("ahk_class #32770") {
    L("[AHK] Waiting for dialog (up to 10s)...")
    if !WinWait("ahk_class #32770", , 10) {
        L("[AHK] No dialog found - abort")
        ExitApp
    }
}
L("[AHK] File dialog appeared!")
Sleep(500)

; ── 6. Fill filename via ControlSetText, then click Open ─────────────────────
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
}

L("[AHK " . FormatTime(A_Now, "HH:mm:ss") . "] Script complete")
ExitApp

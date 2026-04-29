#Requires AutoHotkey v2.0
; Click the Select files button in the already-active YouTube Studio tab
; then fill the OS file dialog
; No #SingleInstance — runs alongside other scripts

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
HWND_STR  := "ahk_id 0x00010628"

L(msg) {
    try FileAppend(msg . "`n", A_ScriptDir . "\click_and_fill.log")
}

L("[CAF " . FormatTime(A_Now, "HH:mm:ss") . "] Start")

; Ensure Chrome is active
WinActivate(HWND_STR)
WinWaitActive(HWND_STR, , 3)
L("[CAF] Chrome active")
Sleep(300)

; Click "Select files" — screen Y = toolbar(151) + CSS_btn_y(557) = 708
; Debug infobar bumped toolbar from 95 to 151px
L("[CAF] Clicking (974,708)")
Click(974, 708)
Sleep(2000)

if !WinExist("ahk_class #32770") {
    L("[CAF] No dialog, trying Y=695")
    Click(974, 695)
    Sleep(1500)
}

if !WinExist("ahk_class #32770") {
    L("[CAF] No dialog, trying Y=722")
    Click(974, 722)
    Sleep(1500)
}

if !WinExist("ahk_class #32770") {
    L("[CAF] Waiting up to 10s...")
    if !WinWait("ahk_class #32770", , 10) {
        L("[CAF] No dialog - abort")
        ExitApp
    }
}
L("[CAF] File dialog appeared!")
Sleep(500)

; ControlSetText the filename field
setOk := false
try {
    ControlSetText(FILE_PATH, "Edit1", "ahk_class #32770")
    L("[CAF] ControlSetText OK")
    setOk := true
} catch as e {
    L("[CAF] ControlSetText failed: " . e.Message)
}

if !setOk {
    WinActivate("ahk_class #32770")
    WinWaitActive("ahk_class #32770", , 5)
    Sleep(400)
    Send("^a")
    Sleep(100)
    SendText(FILE_PATH)
    L("[CAF] Fallback SendText done")
}

Sleep(300)

; Click Open button
try {
    ControlClick("Button1", "ahk_class #32770")
    L("[CAF] ControlClick Button1 OK")
} catch as e {
    L("[CAF] ControlClick failed: " . e.Message)
    WinActivate("ahk_class #32770")
    WinWaitActive("ahk_class #32770", , 3)
    Sleep(300)
    Send("{Enter}")
    L("[CAF] Fallback Enter")
}

Sleep(800)
if WinExist("ahk_class #32770") {
    L("[CAF] Dialog still open - Enter again")
    WinActivate("ahk_class #32770")
    Sleep(200)
    Send("{Enter}")
}

L("[CAF " . FormatTime(A_Now, "HH:mm:ss") . "] Done")
ExitApp

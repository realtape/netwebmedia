#Requires AutoHotkey v2.0
#SingleInstance Force

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
LOG := A_ScriptDir . "\fill_dialog_ahk.log"

L(msg) {
    global LOG
    try FileAppend(msg . "`n", LOG)
}

L("[FILL " . FormatTime(A_Now, "HH:mm:ss") . "] Watcher started, waiting up to 120s for #32770")

deadline := A_TickCount + 120000
loop {
    if WinExist("ahk_class #32770") {
        L("[FILL] Dialog found!")
        break
    }
    if A_TickCount > deadline {
        L("[FILL] TIMEOUT — no dialog in 120s")
        ExitApp
    }
    Sleep(300)
}

Sleep(400)

; Try ControlSetText first (no focus grab needed)
setOk := false
try {
    ControlSetText(FILE_PATH, "Edit1", "ahk_class #32770")
    L("[FILL] ControlSetText OK")
    setOk := true
} catch as e {
    L("[FILL] ControlSetText failed: " . e.Message)
}

if !setOk {
    WinActivate("ahk_class #32770")
    WinWaitActive("ahk_class #32770", , 5)
    Sleep(400)
    Send("^a")
    Sleep(100)
    SendText(FILE_PATH)
    L("[FILL] Fallback SendText done")
}

Sleep(300)

; Click Open button
try {
    ControlClick("Button1", "ahk_class #32770")
    L("[FILL] ControlClick Button1 OK")
} catch as e {
    L("[FILL] ControlClick failed: " . e.Message)
    WinActivate("ahk_class #32770")
    WinWaitActive("ahk_class #32770", , 3)
    Sleep(300)
    Send("{Enter}")
    L("[FILL] Fallback Enter sent")
}

Sleep(800)
if WinExist("ahk_class #32770") {
    L("[FILL] Dialog still open - pressing Enter again")
    WinActivate("ahk_class #32770")
    Sleep(200)
    Send("{Enter}")
}

L("[FILL " . FormatTime(A_Now, "HH:mm:ss") . "] Done")
ExitApp

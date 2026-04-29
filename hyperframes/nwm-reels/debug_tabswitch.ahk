#Requires AutoHotkey v2.0
#SingleInstance Force

HWND_STR := "ahk_id 0x00010628"

L(msg) {
    try FileAppend(msg . "`n", A_ScriptDir . "\debug_tabswitch.log")
}

L("[DBG " . FormatTime(A_Now, "HH:mm:ss") . "] Start - activating Chrome")
WinActivate(HWND_STR)
WinWaitActive(HWND_STR, , 5)
L("[DBG] Chrome active - sending Ctrl+Shift+A")
Sleep(500)
Send("^+a")
Sleep(1000)
SendText("Channel dashboard")
Sleep(700)
Send("{Enter}")
L("[DBG] Tab switch sent - now pausing 30s for inspection")
Sleep(30000)
L("[DBG] Pause done - what tab is active now?")

; Read active tab title via a trick: copy URL bar
Send("{F6}")
Sleep(300)
Send("^a")
Sleep(100)
Send("^c")
Sleep(300)
L("[DBG] Done (clipboard should have URL)")
ExitApp

#Requires AutoHotkey v2.0
debugFile := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_debug.txt"

WinActivate("ahk_id 1378226")
WinWaitActive("ahk_id 1378226",, 3)
Sleep(500)

WinGetPos(&WinX, &WinY, &WinW, &WinH, "ahk_id 1378226")
FileAppend("WinX=" WinX " WinY=" WinY " WinW=" WinW " WinH=" WinH "
", debugFile)

; Tab 4 is at ~83% of window width
Tab4X := WinX + Round(WinW * 0.83)
Tab4Y := WinY + 20
FileAppend("Tab4X=" Tab4X " Tab4Y=" Tab4Y "
", debugFile)

Click(Tab4X, Tab4Y)
Sleep(1200)

WinGetPos(&WinX, &WinY, &WinW, &WinH, "ahk_id 1378226")
ContentStartY := WinY + (WinH - 527)
SelectX := WinX + 464
SelectY := ContentStartY + 398
FileAppend("SelectX=" SelectX " SelectY=" SelectY "
", debugFile)

Click(SelectX, SelectY)
Sleep(500)
ExitApp()

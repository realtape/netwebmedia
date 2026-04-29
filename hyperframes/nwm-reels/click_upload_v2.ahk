#Requires AutoHotkey v2.0

; Bring Chrome window 1378226 to front
WinActivate("ahk_id 1378226")
WinWaitActive("ahk_id 1378226",, 3)
Sleep(400)

; Get window position in AHK coordinate space
WinGetPos(&WinX, &WinY, &WinW, &WinH, "ahk_id 1378226")

debugFile := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_debug.txt"
FileAppend("WinX=" WinX " WinY=" WinY " WinW=" WinW " WinH=" WinH "`n", debugFile)

; Tab 4 center: ~83% of window width, tab bar at y = WinY + 20
Tab4X := WinX + Round(WinW * 0.83)
Tab4Y := WinY + 20

FileAppend("Tab4X=" Tab4X " Tab4Y=" Tab4Y "`n", debugFile)

Click(Tab4X, Tab4Y)
Sleep(1000)

; Re-get position
WinGetPos(&WinX, &WinY, &WinW, &WinH, "ahk_id 1378226")

; "Select files" button at viewport (464, 398) in 930x527 viewport
; Browser chrome height = WinH - 527
ContentStartY := WinY + (WinH - 527)
SelectX := WinX + 464
SelectY := ContentStartY + 398

FileAppend("ContentStartY=" ContentStartY " SelectX=" SelectX " SelectY=" SelectY "`n", debugFile)

Click(SelectX, SelectY)
Sleep(500)

ExitApp()

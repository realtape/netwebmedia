; Click tab 4 then Select files in Chrome window 1378226
#NoEnv
SetWorkingDir %A_ScriptDir%

; Bring target window to front
WinActivate, ahk_id 1378226
WinWaitActive, ahk_id 1378226,, 3
Sleep, 400

; Get window position/size in AHK coordinate space
WinGetPos, WinX, WinY, WinW, WinH, ahk_id 1378226

; Log for debugging
FileAppend, WinX=%WinX% WinY=%WinY% WinW=%WinW% WinH=%WinH%`n, C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_debug.txt

; Chrome tab bar is at top, tabs are roughly equal width
; Window has 4 tabs: tab 4 should be at about 85% of window width from left
Tab4X := WinX + WinW * 0.83
Tab4Y := WinY + 20

FileAppend, Tab4X=%Tab4X% Tab4Y=%Tab4Y%`n, C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_debug.txt

Click, %Tab4X%, %Tab4Y%
Sleep, 1000

; Re-get position in case window moved
WinGetPos, WinX, WinY, WinW, WinH, ahk_id 1378226

; "Select files" button:
; Chrome extension viewport: 930x527
; Button at viewport (464, 398)
; Browser chrome height = WinH - 527
ChromeHeaderH := WinH - 527
ContentStartY := WinY + ChromeHeaderH
SelectX := WinX + 464
SelectY := ContentStartY + 398

FileAppend, ChromeHeaderH=%ChromeHeaderH% ContentStartY=%ContentStartY% SelectX=%SelectX% SelectY=%SelectY%`n, C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_debug.txt

Click, %SelectX%, %SelectY%
Sleep, 500

ExitApp

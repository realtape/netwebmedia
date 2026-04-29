; Switch Chrome window 1378226 to tab 4 (Ctrl+4)
#NoEnv
SetWorkingDir %A_ScriptDir%

; Bring the Chrome secondary window to front
WinActivate, ahk_id 1378226
WinWaitActive, ahk_id 1378226,, 3
Sleep, 300

; Switch to tab 4
Send, ^4
Sleep, 500
ExitApp

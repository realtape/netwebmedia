; click_upload.ahk — activates Chrome, switches to YT Studio tab, clicks file input
#NoEnv
#SingleInstance Force
SetTitleMatchMode, 2

; Activate Chrome window
WinActivate, ahk_class Chrome_WidgetWin_1
WinWaitActive, ahk_class Chrome_WidgetWin_1,, 3
Sleep, 400

; Click the YouTube Studio tab (x≈835, y=15 from tab bar measurement)
Click, 835, 15
Sleep, 1500

; Click the file input at viewport (400, 300) + toolbar height 75 = screen y=375
Click, 400, 375
Sleep, 300
; Second click in case first didn't register
Click, 400, 375
Sleep, 300

FileAppend, [CLICK] Done clicking at 835,15 then 400,375`n, %A_ScriptDir%\click_upload.log
ExitApp

; Click tab 4 in Chrome window 1378226, then click "Select files"
#NoEnv
SetWorkingDir %A_ScriptDir%

; Bring Chrome window to front
WinActivate, ahk_id 1378226
WinWaitActive, ahk_id 1378226,, 3
Sleep, 400

; Click tab 4 (NWM upload tab) - approximately x=810, y=45 in screen coords
Click, 810, 45
Sleep, 800

; Click "Select files" button
; Chrome viewport 930x527, button at (464, 398)
; Window: left=50, top=30, content_top=30+151=181
; Screen: x=50+464=514, y=181+398=579
Click, 514, 579
Sleep, 300

ExitApp

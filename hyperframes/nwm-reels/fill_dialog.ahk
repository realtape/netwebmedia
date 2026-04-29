; fill_dialog.ahk
; Waits for a Windows file-open dialog, fills in the MP4 path, and confirms.
#NoEnv
#SingleInstance Force
SetTitleMatchMode, 2

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"

FileAppend, [AHK] Waiting for file dialog...`n, %A_ScriptDir%\fill_dialog.log
Loop, 60 {
    ; Look for the open-file dialog by window class
    IfWinExist, ahk_class #32770 {
        FileAppend, [AHK] Dialog found!`n, %A_ScriptDir%\fill_dialog.log
        WinActivate, ahk_class #32770
        Sleep, 300

        ; Type directly into the file name field
        ControlSetText, Edit1, %FILE_PATH%, ahk_class #32770
        Sleep, 200
        ControlClick, Button1, ahk_class #32770   ; "Open" button
        Sleep, 200
        ; Also try pressing Enter as a fallback
        ControlSend, Edit1, {Enter}, ahk_class #32770
        FileAppend, [AHK] Path entered and submitted`n, %A_ScriptDir%\fill_dialog.log
        ExitApp
    }
    Sleep, 500
}
FileAppend, [AHK] Timeout — no dialog found in 30s`n, %A_ScriptDir%\fill_dialog.log
ExitApp

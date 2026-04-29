#Requires AutoHotkey v2.0
#SingleInstance Force

FILE_PATH := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
HWND_INT  := 0x00010628          ; Chrome window integer HWND
HWND_STR  := "ahk_id " . HWND_INT  ; proper v2 concat
LOG       := A_ScriptDir . "\switch_click.log"

FileAppend("[AHK " . FormatTime(, "HH:mm:ss") . "] Script started`n", LOG)

; ── 1. Activate Chrome window ─────────────────────────────────────────────────
if !WinExist(HWND_STR) {
    FileAppend("[AHK] ERROR: Chrome HWND not found`n", LOG)
    ExitApp
}
WinActivate(HWND_STR)
FileAppend("[AHK] WinActivate sent`n", LOG)
if !WinWaitActive(HWND_STR, , 5)
    FileAppend("[AHK] WARNING: WinWaitActive timed out`n", LOG)
FileAppend("[AHK] Chrome active`n", LOG)
Sleep(400)

; ── 2. Open Chrome tab search and switch to YT Studio ────────────────────────
Send("^+a")
FileAppend("[AHK] Sent Ctrl+Shift+A`n", LOG)
Sleep(800)
SendText("Channel dashboard")
FileAppend("[AHK] Typed search`n", LOG)
Sleep(600)
Send("{Enter}")
FileAppend("[AHK] Pressed Enter`n", LOG)
Sleep(1800)

; ── 3. Click "Select files" button ───────────────────────────────────────────
; screen coords: client_x=36, toolbar=95, btn CSS(938,399) → (974,494)
FileAppend("[AHK] Clicking (974,494)`n", LOG)
Click(974, 494)
Sleep(1800)

; ── 4. Wait for Windows file-open dialog ─────────────────────────────────────
if !WinWait("ahk_class #32770", , 8) {
    FileAppend("[AHK] No dialog — trying (974,609)`n", LOG)
    Click(974, 609)
    if !WinWait("ahk_class #32770", , 8) {
        FileAppend("[AHK] No dialog after 2 tries — abort`n", LOG)
        ExitApp
    }
}
FileAppend("[AHK] File dialog appeared!`n", LOG)

; ── 5. Activate dialog and type path ─────────────────────────────────────────
WinActivate("ahk_class #32770")
if !WinWaitActive("ahk_class #32770", , 5)
    FileAppend("[AHK] WARNING: dialog activate timed out`n", LOG)
Sleep(400)
Send("^a")
Sleep(100)
SendText(FILE_PATH)
FileAppend("[AHK] Typed path`n", LOG)
Sleep(400)
Send("{Enter}")
FileAppend("[AHK] Pressed Enter — done!`n", LOG)
Sleep(600)

if WinExist("ahk_class #32770") {
    FileAppend("[AHK] Dialog still open, pressing Enter again`n", LOG)
    Send("{Enter}")
    Sleep(400)
}

FileAppend("[AHK] Script complete`n", LOG)
ExitApp

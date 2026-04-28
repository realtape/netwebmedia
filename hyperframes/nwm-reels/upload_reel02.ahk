#Requires AutoHotkey v2.0
; ── Upload reel-02-seo-dead.mp4 to YouTube Studio ────────────────────────────
; Strategy:
;  1. Activate the user's Chrome window (Calendly / Studio)
;  2. Navigate address bar to Studio upload URL
;  3. Wait for the upload dialog (Select files button)
;  4. Click Select files (real OS click → opens native file picker)
;  5. Fill file path in the dialog

filePath := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
uploadURL := "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"
logFile   := A_ScriptDir "\ahk_upload.log"

FileDelete(logFile)
FileAppend("AHK upload script started`n", logFile)

; ── 1. Find Chrome window ─────────────────────────────────────────────────────
chromeHwnd := WinExist("ahk_class Chrome_WidgetWin_1 ahk_exe chrome.exe")
if (!chromeHwnd) {
    FileAppend("ERROR: Chrome window not found`n", logFile)
    ExitApp
}
FileAppend("Chrome hwnd=" chromeHwnd "`n", logFile)

; Activate and maximize
WinActivate("ahk_id " chromeHwnd)
WinMaximize("ahk_id " chromeHwnd)
Sleep(600)

; ── 2. Navigate to Studio via address bar ─────────────────────────────────────
Send("^l")          ; Ctrl+L = focus address bar
Sleep(300)
Send("^a")          ; select all
Sleep(100)
Send(uploadURL)
Sleep(200)
Send("{Enter}")
FileAppend("Navigated to: " uploadURL "`n", logFile)
Sleep(3000)         ; wait for Studio to load

; ── 3. Open upload dialog via Create button ───────────────────────────────────
; Try clicking the Create button (top-right area of Studio)
; We'll use the keyboard shortcut or find it via coordinates
; Studio URL with ?d=ud should auto-open the dialog, but let's also try clicking Create

; Check if upload dialog is already showing by looking for #select-files in page title
; (We can't easily check DOM from AHK, so just click Create)

; Get window position and click Create button (approx top-right of viewport)
WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " chromeHwnd)
FileAppend("Chrome rect: " wx "," wy " " ww "x" wh "`n", logFile)

; Chrome UI height ≈ 65px for tabs + address bar
chromeUIH := 65

; Create button is near top-right of viewport
createX := wx + ww - 120
createY := wy + chromeUIH + 45
FileAppend("Clicking Create at (" createX "," createY ")`n", logFile)
Click(createX, createY)
Sleep(600)

; "Upload videos" menu item appears below Create button
uploadMenuY := createY + 30
FileAppend("Clicking Upload videos at (" createX "," uploadMenuY ")`n", logFile)
Click(createX, uploadMenuY)
Sleep(2500)         ; wait for upload dialog to appear

; ── 4. Click "Select files" button ───────────────────────────────────────────
; The Select files button is centered in the upload dialog
; Viewport center
vpW := ww               ; viewport width ≈ window width (assume no sidebar)
vpH := wh - chromeUIH  ; viewport height
selectX := wx + vpW // 2
selectY := wy + chromeUIH + (vpH * 63 // 100)  ; ~63% down the viewport
FileAppend("Clicking Select files at (" selectX "," selectY ")`n", logFile)

; Snapshot existing windows before click
existingCount := WinGetCount()
FileAppend("Existing windows: " existingCount "`n", logFile)

Click(selectX, selectY)
FileAppend("Clicked Select files`n", logFile)
Sleep(500)

; ── 5. Wait for and fill the file dialog ─────────────────────────────────────
FileAppend("Waiting for file dialog..`n", logFile)
startTick := A_TickCount

Loop {
    if (A_TickCount - startTick > 20000) {
        FileAppend("TIMEOUT: file dialog not found`n", logFile)
        break
    }

    ; Check for #32770 (standard file open dialog)
    if WinExist("ahk_class #32770") {
        FileAppend("File dialog found!`n", logFile)
        WinActivate("ahk_class #32770")
        Sleep(400)

        ; Set the filename
        try {
            ControlSetText(filePath, "Edit1", "ahk_class #32770")
            Sleep(200)
            ControlFocus("Edit1", "ahk_class #32770")
            Sleep(100)
            Send("{Enter}")
            Sleep(300)
            ControlClick("Button1", "ahk_class #32770")
            FileAppend("File path set via ControlSetText`n", logFile)
        } catch as e {
            ; Fallback: type directly
            Send(filePath)
            Sleep(200)
            Send("{Enter}")
            FileAppend("File path sent via fallback Send`n", logFile)
        }
        break
    }

    Sleep(100)
}

FileAppend("Done.`n", logFile)

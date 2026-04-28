#Requires AutoHotkey v2.0
; Simpler, more targeted upload script

filePath := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-02-seo-dead.mp4"
log      := "C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\ahk_v2.log"
FileDelete(log)

Log(msg) {
    global log
    FileAppend(msg "`n", log)
}

Log("=== AHK v2 upload script started ===")

; ── Find real Chrome (not Claude) ────────────────────────────────────────────
; Chrome browser windows have class Chrome_WidgetWin_1 and exe chrome.exe
chromeHwnd := 0
hList := WinGetList("ahk_exe chrome.exe")
for hwnd in hList {
    cls := WinGetClass("ahk_id " hwnd)
    title := WinGetTitle("ahk_id " hwnd)
    if (cls = "Chrome_WidgetWin_1") {
        Log("Found chrome.exe window: hwnd=" hwnd " title='" title "'")
        if (chromeHwnd = 0)
            chromeHwnd := hwnd
    }
}

if (chromeHwnd = 0) {
    Log("ERROR: No chrome.exe Chrome_WidgetWin_1 window found")
    ExitApp
}

Log("Using hwnd=" chromeHwnd)

; Activate and maximize
WinActivate("ahk_id " chromeHwnd)
WinMaximize("ahk_id " chromeHwnd)
Sleep(800)

; ── Navigate to Studio upload URL ─────────────────────────────────────────────
studioURL := "https://studio.youtube.com/channel/UCZCCUGE38wgJfVrPtjejVnQ"
Log("Navigating to Studio...")
Send("^l")   ; Focus address bar
Sleep(400)
Send("^a")   ; Select all
Sleep(100)
; Type URL character by character to avoid clipboard issues
Send(studioURL)
Sleep(300)
Send("{Enter}")
Log("Sent Enter for navigation")
Sleep(4000)   ; Wait for Studio to load

; Verify page loaded (check title)
currentTitle := WinGetTitle("ahk_id " chromeHwnd)
Log("Page title: " currentTitle)

; ── Open upload dialog ─────────────────────────────────────────────────────────
; Get window rect
WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " chromeHwnd)
Log("Window rect: " wx "," wy " " ww "x" wh)

; Create button is at top-right of viewport (approx)
chromeTop := 65   ; approx px for tabs+addressbar
createX := wx + ww - 120
createY := wy + chromeTop + 45
Log("Clicking Create at " createX "," createY)
Click(createX, createY)
Sleep(700)

; "Upload videos" in dropdown
uploadY := createY + 30
Log("Clicking Upload videos at " createX "," uploadY)
Click(createX, uploadY)
Sleep(3000)   ; Wait for dialog

; ── Click Select files ─────────────────────────────────────────────────────────
WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " chromeHwnd)
vpH := wh - chromeTop
selectX := wx + (ww // 2)
selectY := wy + chromeTop + (vpH * 63 // 100)
Log("Clicking Select files at " selectX "," selectY)
Click(selectX, selectY)
Sleep(600)

; ── Wait for and fill file dialog ─────────────────────────────────────────────
Log("Watching for file dialog...")
startTick := A_TickCount
Loop {
    if (A_TickCount - startTick > 25000) {
        Log("TIMEOUT waiting for file dialog")
        break
    }
    if WinExist("ahk_class #32770") {
        Log("File dialog detected!")
        WinActivate("ahk_class #32770")
        Sleep(500)
        try {
            ControlSetText(filePath, "Edit1", "ahk_class #32770")
            Sleep(200)
            ControlFocus("Edit1", "ahk_class #32770")
            Sleep(150)
            Send("{Enter}")
            Sleep(300)
            ControlClick("Button1", "ahk_class #32770")
            Log("Path set via ControlSetText + Enter + Button1")
        } catch as e {
            Send(filePath)
            Sleep(200)
            Send("{Enter}")
            Log("Path set via Send fallback: " e.Message)
        }
        break
    }
    Sleep(100)
}
Log("=== Done ===")

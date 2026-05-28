@echo off
REM Start a local HTTP server and open the dashboard.
REM Use this if dashboard.html opened directly (file://) doesn't show video previews.
REM Modern Chrome blocks some file:// resource loads — http://localhost works around it.

chcp 65001 >nul
cd /d "%~dp0"
echo Starting local HTTP server on http://localhost:8765 ...
echo Press Ctrl+C in this window when you're done to stop the server.
echo.
start "" "http://localhost:8765/dashboard.html"
python -m http.server 8765

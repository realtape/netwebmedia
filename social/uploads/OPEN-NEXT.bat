@echo off
REM Opens the next upcoming social post folder in Explorer.
REM Double-click this file from social\uploads\ and the right folder pops up.
chcp 65001 >nul
cd /d "%~dp0"
python _automation\open_next.py
echo.
echo (Window will close in 5 seconds...)
timeout /t 5 /nobreak >nul

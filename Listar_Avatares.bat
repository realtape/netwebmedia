@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Obteniendo la lista de tus avatares de HeyGen...
echo.
python heygen_avatar_generate.py --list-avatars > avatars.txt 2>&1
type avatars.txt
echo.
echo ============================================================
echo   La lista tambien se guardo en el archivo avatars.txt
echo ============================================================
echo.
pause

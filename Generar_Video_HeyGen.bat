@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   Generando video de avatar en HeyGen...
echo   (avatar + voz Narrator Mateo + guion de 30 seg)
echo ============================================================
echo.
python heygen_avatar_generate.py
echo.
echo ============================================================
echo   Si arriba ves una linea DONE con un link .mp4, ese es tu
echo   video. Copialo y abrelo en el navegador para descargarlo.
echo ============================================================
echo.
pause

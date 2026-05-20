@echo off
REM ============================================================
REM post_tomorrow.cmd — One-shot IG post for Thu May 14 09:00 ET
REM
REM Setup (run once, as Administrator):
REM   schtasks /create /tn "NWM-IG-Reel-E-May14" ^
REM     /tr "C:\Users\Usuario\Desktop\NetWebMedia\scripts\ig_publish\post_tomorrow.cmd" ^
REM     /sc once /st 06:00 /sd 05/14/2026 /ru "%USERNAME%"
REM
REM   (06:00 local Santiago time = 09:00 ET in May, since CLT = UTC-4 + ET = UTC-4 also matches)
REM
REM Wait — Santiago is UTC-4 in May (autumn, no DST). New York is UTC-4 in May (DST).
REM So 09:00 ET = 09:00 CLT today. Run at 09:00 local.
REM
REM To remove the task later:
REM   schtasks /delete /tn "NWM-IG-Reel-E-May14" /f
REM ============================================================
cd /d C:\Users\Usuario\Desktop\NetWebMedia
python scripts\ig_publish\ig_publish.py reel reel-e-audit-offer-en > "scripts\ig_publish\post_tomorrow.log" 2>&1
exit /b %ERRORLEVEL%

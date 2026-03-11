@echo off
:: ─────────────────────────────────────────────────────────────
::  Breece CORS Proxy — Register Windows Startup Task
::  Runs the proxy automatically every time you log in to Windows.
::  Run this script once as Administrator.
:: ─────────────────────────────────────────────────────────────

set "PROXY_DIR=%~dp0"
set "VBS=%PROXY_DIR%start-hidden.vbs"
set "TASK_NAME=BreeceCorProxy"

echo.
echo  Registering startup task: %TASK_NAME%
echo  Script : %VBS%
echo.

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "wscript.exe \"%VBS%\"" ^
  /sc onlogon ^
  /rl limited ^
  /f

if %errorlevel% == 0 (
    echo.
    echo  [OK] Task registered. The proxy will start automatically on next login.
    echo  To start it right now without rebooting, run:  start.bat
) else (
    echo.
    echo  [ERROR] Failed to register task. Try running this script as Administrator.
)

echo.
pause

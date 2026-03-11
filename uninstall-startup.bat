@echo off
:: ─────────────────────────────────────────────────────────────
::  Breece CORS Proxy — Remove Windows Startup Task
:: ─────────────────────────────────────────────────────────────

set "TASK_NAME=BreeceCorProxy"

echo.
echo  Removing startup task: %TASK_NAME%

schtasks /delete /tn "%TASK_NAME%" /f

if %errorlevel% == 0 (
    echo  [OK] Task removed. The proxy will no longer start automatically.
) else (
    echo  [WARN] Task not found or already removed.
)

echo.
pause

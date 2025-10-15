@echo off
REM Python wrapper for Windows
setlocal

REM Try different Python installations
set PYTHON_CMD=
for %%i in (python.exe python3.exe C:\Python311\python.exe C:\Python39\python.exe C:\Python38\python.exe) do (
    %%i --version >nul 2>&1
    if !errorlevel! equ 0 (
        set PYTHON_CMD=%%i
        goto :found
    )
)

:notfound
echo ERROR: No Python installation found!
echo.
echo Please install Python 3.x from https://python.org
echo Make sure to check "Add Python to PATH" during installation
pause
exit /b 1

:found
REM Check if esptool.py exists
if not exist "%~dp0esptool.py" (
    echo ERROR: esptool.py not found!
    pause
    exit /b 1
)

REM Run esptool with the found Python
"%PYTHON_CMD%" "%~dp0esptool.py" %*

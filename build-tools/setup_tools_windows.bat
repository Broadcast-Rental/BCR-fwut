@echo off
setlocal enabledelayedexpansion
REM Helper script to setup tools folder for Windows
REM This script helps you find and copy avrdude from Arduino IDE
REM Run from project root OR from build-tools folder

echo ============================================================
echo Firmware Uploader - Tools Setup for Windows
echo ============================================================
echo.
echo This script will help you bundle avrdude with your executable.
echo.

REM Change to project root if running from build-tools
if exist "..\src" cd ..

REM Check if tools folder exists
if exist "tools" (
    echo Tools folder already exists.
) else (
    echo Creating tools folder...
    mkdir tools
    echo Created: tools\
)

echo.
echo Looking for Arduino IDE installation...
echo.

REM Common Arduino IDE locations
set "ARDUINO_PATH="
if exist "C:\Program Files (x86)\Arduino\hardware\tools\avr\bin\avrdude.exe" (
    set "ARDUINO_PATH=C:\Program Files (x86)\Arduino\hardware\tools\avr\bin"
)
if exist "C:\Program Files\Arduino\hardware\tools\avr\bin\avrdude.exe" (
    set "ARDUINO_PATH=C:\Program Files\Arduino\hardware\tools\avr\bin"
)
if exist "%LOCALAPPDATA%\Programs\Arduino\hardware\tools\avr\bin\avrdude.exe" (
    set "ARDUINO_PATH=%LOCALAPPDATA%\Programs\Arduino\hardware\tools\avr\bin"
)

if defined ARDUINO_PATH (
    echo Found Arduino IDE at: "!ARDUINO_PATH!"
    echo.
    echo Copying files...
    
    copy "!ARDUINO_PATH!\avrdude.exe" "tools\" >nul 2>&1
    if exist "!ARDUINO_PATH!\..\etc\avrdude.conf" (
        copy "!ARDUINO_PATH!\..\etc\avrdude.conf" "tools\" >nul 2>&1
    )
    copy "!ARDUINO_PATH!\*.dll" "tools\" >nul 2>&1
    
    echo.
    echo ============================================================
    echo SUCCESS!
    echo.
    echo Copied to tools folder:
    dir /B tools
    echo.
    echo You can now run build_windows.bat to create the executable.
    echo ============================================================
) else (
    echo Arduino IDE not found in common locations.
    echo.
    echo Please do one of the following:
    echo.
    echo Option 1: Install Arduino IDE
    echo   1. Download from: https://www.arduino.cc/en/software
    echo   2. Install it
    echo   3. Run this script again
    echo.
    echo Option 2: Manual setup
    echo   1. Download avrdude from: https://github.com/avrdudes/avrdude/releases
    echo   2. Extract the archive
    echo   3. Copy avrdude.exe and avrdude.conf to the tools\ folder
    echo.
    echo Option 3: Build without Arduino support
    echo   - Just run build_windows.bat without setting up tools\
    echo   - The executable will work for ESP32 only
    echo.
    echo ============================================================
)

echo.
pause
endlocal


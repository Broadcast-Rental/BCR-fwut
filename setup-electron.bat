@echo off
setlocal

REM Firmware Uploader - Electron Setup Script (Windows)
REM This script sets up the Electron version of the Firmware Uploader

echo 🚀 Setting up Firmware Uploader (Electron version)...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node -v

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  Python is not installed. You'll need Python 3.x for esptool.
        echo    Install from https://python.org/
    )
)

REM Check if esptool is installed
python -c "import esptool" >nul 2>nul
if %errorlevel% neq 0 (
    python3 -c "import esptool" >nul 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  esptool is not installed. Installing via pip...
        where pip >nul 2>nul
        if %errorlevel% equ 0 (
            pip install esptool
        ) else (
            where pip3 >nul 2>nul
            if %errorlevel% equ 0 (
                pip3 install esptool
            ) else (
                echo ❌ pip is not available. Please install esptool manually:
                echo    pip install esptool
            )
        )
    )
)

REM Check if avrdude is installed
where avrdude >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  avrdude is not installed. Install Arduino IDE or avrdude separately.
)

echo.
echo 🎉 Setup complete!
echo.
echo To run the application:
echo   npm run dev     # Development mode
echo   npm start       # Production mode
echo.
echo To build distributables:
echo   npm run build   # Build for current platform
echo   npm run dist    # Create installers
echo.
echo For more information, see README-ELECTRON.md
echo.
pause

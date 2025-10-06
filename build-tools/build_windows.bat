@echo off
REM Build script for Windows
REM Requires: pip install pyinstaller esptool pyserial
REM Run from project root OR from build-tools folder

echo ============================================================
echo Building Firmware Uploader for Windows
echo ============================================================
echo.

REM Set version
set FW_VERSION=1.0.0

REM Change to project root if running from build-tools
if exist "..\src" cd ..

REM Check for tools directory
if not exist "tools" (
    echo WARNING: tools\ folder not found
    echo.
    echo To bundle avrdude, please:
    echo 1. Run: build-tools\setup_tools_windows.bat
    echo 2. Or manually create 'tools' folder and add avrdude
    echo.
    echo The build will continue with esptool only...
    echo.
    timeout /t 5
)

echo Building executable with PyInstaller...
echo.

REM Build using spec file for better control
pyinstaller --clean build-tools\firmware_uploader.spec

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo Build complete!
    echo.
    echo Executable location: dist\FirmwareUploader.exe
    echo.
    echo Bundled tools:
    echo - esptool: YES ^(Python module^)
    if exist "tools\avrdude.exe" (
        echo - avrdude: YES ^(bundled binary^)
    ) else (
        echo - avrdude: NO ^(not found in tools folder^)
    )
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo Build FAILED!
    echo Please check the error messages above.
    echo ============================================================
)

echo.
pause


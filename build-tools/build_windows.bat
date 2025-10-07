@echo off
REM Build script for Windows
REM Requires: pip install pyinstaller esptool pyserial
REM Run from project root OR from build-tools folder

echo ============================================================
echo Building Firmware Uploader for Windows
echo ============================================================
echo.

REM Try to get version from git tag, otherwise use argument or default
for /f "delims=" %%i in ('git describe --tags --abbrev=0 2^>nul') do set GIT_TAG=%%i
if defined GIT_TAG (
    REM Remove 'v' prefix if present
    set FW_VERSION=%GIT_TAG:v=%
) else if not "%1"=="" (
    set FW_VERSION=%1
) else (
    set FW_VERSION=DEV
)

echo Building version: %FW_VERSION%
echo.

REM Change to project root if running from build-tools
if exist "..\src" cd ..

REM Create version file
echo %FW_VERSION% > src\_version.txt

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
set FW_VERSION=%FW_VERSION%
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


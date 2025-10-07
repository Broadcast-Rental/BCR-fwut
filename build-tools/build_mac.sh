#!/bin/bash
# Build script for macOS
# Requires: pip install pyinstaller esptool pyserial
# Run from project root OR from build-tools folder

echo "============================================================"
echo "Building Firmware Uploader for macOS"
echo "============================================================"
echo ""

# Try to get version from git tag, otherwise use argument or default
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -n "$GIT_TAG" ]; then
    # Remove 'v' prefix if present
    export FW_VERSION="${GIT_TAG#v}"
elif [ -n "$1" ]; then
    export FW_VERSION="$1"
else
    export FW_VERSION="1.0.0"
fi

echo "Building version: $FW_VERSION"
echo ""

# Change to project root if running from build-tools
if [ -d "../src" ]; then
    cd ..
fi

# Check for tools directory
if [ ! -d "tools" ]; then
    echo "WARNING: tools/ folder not found"
    echo ""
    echo "To bundle avrdude, please:"
    echo "1. Run: ./build-tools/setup_tools_mac.sh"
    echo "2. Or manually create 'tools' folder and add avrdude"
    echo ""
    echo "The build will continue with esptool only..."
    echo ""
    sleep 3
fi

echo "Building executable with PyInstaller..."
echo ""

# Build using spec file for better control
pyinstaller --clean build-tools/firmware_uploader.spec

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "Build complete!"
    echo ""
    echo "Application location: dist/FirmwareUploader.app"
    echo ""
    echo "Bundled tools:"
    echo "- esptool: YES (Python module)"
    if [ -f "tools/avrdude" ]; then
        echo "- avrdude: YES (bundled binary)"
    else
        echo "- avrdude: NO (not found in tools folder)"
    fi
    echo "============================================================"
else
    echo ""
    echo "============================================================"
    echo "Build FAILED!"
    echo "Please check the error messages above."
    echo "============================================================"
fi

echo ""


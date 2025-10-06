#!/bin/bash
# Helper script to setup tools folder for macOS
# This script helps you find and copy avrdude
# Run from project root OR from build-tools folder

echo "============================================================"
echo "Firmware Uploader - Tools Setup for macOS"
echo "============================================================"
echo ""
echo "This script will help you bundle avrdude with your executable."
echo ""

# Change to project root if running from build-tools
if [ -d "../src" ]; then
    cd ..
fi

# Check if tools folder exists
if [ -d "tools" ]; then
    echo "Tools folder already exists."
else
    echo "Creating tools folder..."
    mkdir tools
    echo "Created: tools/"
fi

echo ""
echo "Looking for avrdude installation..."
echo ""

# Check if avrdude is installed
if command -v avrdude &> /dev/null; then
    AVRDUDE_PATH=$(which avrdude)
    echo "Found avrdude at: $AVRDUDE_PATH"
    
    # Copy avrdude binary
    echo "Copying avrdude binary..."
    cp "$AVRDUDE_PATH" tools/
    chmod +x tools/avrdude
    
    # Try to find avrdude.conf
    CONF_FOUND=0
    
    # Try Homebrew location
    if [ -f "$(brew --prefix 2>/dev/null)/etc/avrdude.conf" ]; then
        cp "$(brew --prefix)/etc/avrdude.conf" tools/
        CONF_FOUND=1
    # Try Arduino IDE location
    elif [ -f "/Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf" ]; then
        cp "/Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf" tools/
        CONF_FOUND=1
    # Try system location
    elif [ -f "/etc/avrdude.conf" ]; then
        cp "/etc/avrdude.conf" tools/
        CONF_FOUND=1
    fi
    
    echo ""
    echo "============================================================"
    echo "SUCCESS!"
    echo ""
    echo "Copied to tools folder:"
    ls -lh tools/
    echo ""
    
    if [ $CONF_FOUND -eq 0 ]; then
        echo "WARNING: avrdude.conf not found"
        echo "The tool might still work, but if you have issues:"
        echo "  brew install avrdude"
        echo "  cp \$(brew --prefix)/etc/avrdude.conf tools/"
        echo ""
    fi
    
    echo "You can now run ./build_mac.sh to create the executable."
    echo "============================================================"
    
else
    echo "avrdude not found."
    echo ""
    echo "Please do one of the following:"
    echo ""
    echo "Option 1: Install via Homebrew (Recommended)"
    echo "  brew install avrdude"
    echo "  Then run this script again"
    echo ""
    echo "Option 2: Install Arduino IDE"
    echo "  1. Download from: https://www.arduino.cc/en/software"
    echo "  2. Install it"
    echo "  3. Copy manually:"
    echo "     cp /Applications/Arduino.app/Contents/Java/hardware/tools/avr/bin/avrdude tools/"
    echo "     cp /Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf tools/"
    echo ""
    echo "Option 3: Build without Arduino support"
    echo "  - Just run ./build_mac.sh without setting up tools/"
    echo "  - The executable will work for ESP32 only"
    echo ""
    echo "============================================================"
fi

echo ""


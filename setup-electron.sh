#!/bin/bash

# Firmware Uploader - Electron Setup Script
# This script sets up the Electron version of the Firmware Uploader

set -e

echo "🚀 Setting up Firmware Uploader (Electron version)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Python is installed (for esptool)
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "⚠️  Python is not installed. You'll need Python 3.x for esptool."
    echo "   Install from https://python.org/"
fi

# Check if esptool is installed
if ! command -v esptool &> /dev/null && ! python3 -c "import esptool" 2>/dev/null && ! python -c "import esptool" 2>/dev/null; then
    echo "⚠️  esptool is not installed. Installing via pip..."
    if command -v pip3 &> /dev/null; then
        pip3 install esptool
    elif command -v pip &> /dev/null; then
        pip install esptool
    else
        echo "❌ pip is not available. Please install esptool manually:"
        echo "   pip install esptool"
    fi
fi

# Check if avrdude is installed
if ! command -v avrdude &> /dev/null; then
    echo "⚠️  avrdude is not installed. Install Arduino IDE or avrdude separately."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To run the application:"
echo "  npm run dev     # Development mode"
echo "  npm start       # Production mode"
echo ""
echo "To build distributables:"
echo "  npm run build   # Build for current platform"
echo "  npm run dist    # Create installers"
echo ""
echo "For more information, see README-ELECTRON.md"

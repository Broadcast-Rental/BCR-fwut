#!/bin/bash

# Firmware Uploader Run Script
echo "🚀 Starting Firmware Uploader..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./setup.sh first."
    exit 1
fi

# Activate virtual environment and run application
source venv/bin/activate
python src/firmware_uploader.py

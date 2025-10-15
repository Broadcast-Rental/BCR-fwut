#!/bin/bash
# Python wrapper for Unix-like systems (macOS, Linux)

find_python() {
    for cmd in python3 python /usr/bin/python3 /usr/local/bin/python3 /opt/homebrew/bin/python3; do
        if command -v "$cmd" >/dev/null 2>&1; then
            if "$cmd" --version >/dev/null 2>&1; then
                echo "$cmd"
                return 0
            fi
        fi
    done
    return 1
}

PYTHON_CMD=$(find_python)

if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: No Python installation found!"
    echo ""
    echo "Please install Python 3.x:"
    echo "  macOS: brew install python"
    echo "  Linux: sudo apt install python3"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ESPTOOL_PATH="$SCRIPT_DIR/esptool.py"

if [ ! -f "$ESPTOOL_PATH" ]; then
    echo "ERROR: esptool.py not found!"
    exit 1
fi

exec "$PYTHON_CMD" "$ESPTOOL_PATH" "$@"

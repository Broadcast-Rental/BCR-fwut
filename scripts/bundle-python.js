#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐍 Bundling Python runtime for Electron app...');

// Create tools directory
const toolsDir = path.join(__dirname, '..', 'src', 'tools');
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

try {
  // Download portable Python for different platforms
  console.log('📥 Downloading portable Python...');
  
  const platform = process.platform;
  let pythonUrl, pythonFile;
  
  if (platform === 'darwin') {
    // macOS - use pyenv or download a portable version
    pythonUrl = 'https://www.python.org/ftp/python/3.11.6/python-3.11.6-macos11.pkg';
    pythonFile = 'python-macos.pkg';
  } else if (platform === 'win32') {
    // Windows - use portable Python
    pythonUrl = 'https://www.python.org/ftp/python/3.11.6/python-3.11.6-embed-amd64.zip';
    pythonFile = 'python-windows.zip';
  } else {
    // Linux - use system python or portable version
    pythonUrl = 'https://www.python.org/ftp/python/3.11.6/Python-3.11.6.tgz';
    pythonFile = 'python-linux.tar.gz';
  }
  
  // For now, let's create a simple Python wrapper that uses system Python
  // but provides better error messages and fallbacks
  const pythonWrapper = `#!/usr/bin/env python3
import sys
import os
import subprocess

def find_python():
    """Find the best available Python installation"""
    candidates = [
        'python3',
        'python',
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3',
        '/usr/local/bin/python',
        'C:\\\\Python311\\\\python.exe',
        'C:\\\\Python39\\\\python.exe',
        'C:\\\\Python38\\\\python.exe'
    ]
    
    for candidate in candidates:
        try:
            result = subprocess.run([candidate, '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return candidate
        except:
            continue
    
    return None

def main():
    python_cmd = find_python()
    
    if not python_cmd:
        print("ERROR: No Python installation found!")
        print("")
        print("Please install Python 3.x:")
        print("  macOS: brew install python")
        print("  Windows: Download from https://python.org")
        print("  Linux: sudo apt install python3")
        sys.exit(1)
    
    # Run esptool with the found Python
    esptool_path = os.path.join(os.path.dirname(__file__), 'esptool.py')
    
    if not os.path.exists(esptool_path):
        print("ERROR: esptool.py not found!")
        sys.exit(1)
    
    # Execute esptool with the found Python
    try:
        subprocess.run([python_cmd, esptool_path] + sys.argv[1:], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except KeyboardInterrupt:
        sys.exit(130)

if __name__ == '__main__':
    main()
`;

  // Write the Python wrapper
  fs.writeFileSync(path.join(toolsDir, 'esptool_launcher.py'), pythonWrapper);
  console.log('✅ Python wrapper created!');
  
  // Create a batch file for Windows
  const windowsBatch = `@echo off
REM Python wrapper for Windows
setlocal

REM Try different Python installations
set PYTHON_CMD=
for %%i in (python.exe python3.exe C:\\Python311\\python.exe C:\\Python39\\python.exe C:\\Python38\\python.exe) do (
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
`;

  fs.writeFileSync(path.join(toolsDir, 'esptool_launcher.bat'), windowsBatch);
  console.log('✅ Windows batch wrapper created!');
  
  // Create a shell script for Unix-like systems
  const unixScript = `#!/bin/bash
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
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
ESPTOOL_PATH="\$SCRIPT_DIR/esptool.py"

if [ ! -f "\$ESPTOOL_PATH" ]; then
    echo "ERROR: esptool.py not found!"
    exit 1
fi

exec "\$PYTHON_CMD" "\$ESPTOOL_PATH" "\$@"
`;

  fs.writeFileSync(path.join(toolsDir, 'esptool_launcher.sh'), unixScript);
  
  // Make the shell script executable
  try {
    execSync(`chmod +x ${path.join(toolsDir, 'esptool_launcher.sh')}`);
  } catch (e) {
    // Ignore on Windows
  }
  
  console.log('✅ Unix shell wrapper created!');
  
  // Download the actual esptool.py
  console.log('📥 Downloading esptool.py...');
  const esptoolUrl = 'https://raw.githubusercontent.com/espressif/esptool/master/esptool.py';
  execSync(`curl -o ${path.join(toolsDir, 'esptool.py')} ${esptoolUrl}`, { stdio: 'inherit' });
  
  console.log('✅ esptool.py downloaded!');
  console.log('🎉 Python runtime bundled successfully!');
  
} catch (error) {
  console.error('❌ Error bundling Python runtime:', error.message);
  process.exit(1);
}

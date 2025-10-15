#!/usr/bin/env python3
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
        'C:\\Python311\\python.exe',
        'C:\\Python39\\python.exe',
        'C:\\Python38\\python.exe'
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

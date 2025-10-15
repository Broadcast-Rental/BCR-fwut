#!/usr/bin/env python3
import sys
import os

# Add the tools directory to the path
tools_dir = os.path.join(os.path.dirname(__file__), 'tools')
sys.path.insert(0, tools_dir)

# Import and run esptool
if __name__ == '__main__':
    import esptool
    esptool.main()

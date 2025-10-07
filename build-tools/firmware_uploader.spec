# PyInstaller spec file for Firmware Uploader
# This file gives you more control over the build process
# 
# To use: pyinstaller build-tools/firmware_uploader.spec

import os
import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# Get version from environment or use default
version = os.getenv('FW_VERSION', '1.0.0')

import glob

# Get the project root directory
# SPECPATH is the directory containing the spec file (build-tools/)
# so we only need one dirname to go up to project root
project_root = os.path.dirname(os.path.abspath(SPECPATH))

# Collect avrdude binaries if they exist
binaries = []
tools_dir = os.path.join(project_root, 'tools')
if os.path.exists(tools_dir):
    if os.name == 'nt':  # Windows
        # Include avrdude.exe and required DLLs
        for file in glob.glob(os.path.join(tools_dir, '*.exe')) + glob.glob(os.path.join(tools_dir, '*.dll')):
            binaries.append((file, 'tools'))
        # Include avrdude.conf
        avrdude_conf = os.path.join(tools_dir, 'avrdude.conf')
        if os.path.exists(avrdude_conf):
            binaries.append((avrdude_conf, 'tools'))
    else:  # macOS/Linux
        for file in glob.glob(os.path.join(tools_dir, 'avrdude*')):
            binaries.append((file, 'tools'))

a = Analysis(
    [os.path.join(project_root, 'src', 'firmware_uploader.py')],
    pathex=[os.path.join(project_root, 'src')],
    binaries=binaries,
    datas=[
        (os.path.join(project_root, 'src', 'projects_config.json'), '.'),
        # Collect esptool data files (stub flasher files, etc.)
        *collect_data_files('esptool'),
    ],
    hiddenimports=[
        'serial.tools.list_ports',
        'tkinter',
        'json',
        'esptool',
        'esptool.cmds',
        'esptool.loader',
        'esptool.targets',
        'esptool.util',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# Check for icon file in build-tools/assets/
icon_path = None
if os.name == 'nt':
    # Try logo.ico first, then icon.ico
    for icon_name in ['logo.ico', 'icon.ico']:
        icon_file = os.path.join(project_root, 'build-tools', 'assets', icon_name)
        if os.path.exists(icon_file):
            icon_path = icon_file
            break
else:
    # Try logo.icns first, then icon.icns
    for icon_name in ['logo.icns', 'icon.icns']:
        icon_file = os.path.join(project_root, 'build-tools', 'assets', icon_name)
        if os.path.exists(icon_file):
            icon_path = icon_file
            break

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='FirmwareUploader',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to True if you want a console window for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_path,  # Optional icon (will use default if not found)
)

# For macOS app bundle (optional)
if os.name != 'nt':
    app = BUNDLE(
        exe,
        name='FirmwareUploader.app',
        icon=icon_path,  # Use the detected icon path (can be None)
        bundle_identifier='com.yourcompany.firmwareuploader',
        info_plist={
            'CFBundleShortVersionString': version,
            'CFBundleVersion': version,
            'NSHighResolutionCapable': True,
        },
    )


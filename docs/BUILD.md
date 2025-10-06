# How to Build

## Prerequisites

```bash
pip install -r build-tools/requirements.txt
pip install pyinstaller
```


## Full Build

### 1. Setup avrdude (one-time)

**Windows:**
```bash
build-tools\setup_tools_windows.bat
```

**Mac:**
```bash
./build-tools/setup_tools_mac.sh
```

### 2. Build

**Windows:**
```bash
build-tools\build_windows.bat
```

**Mac:**
```bash
./build-tools/build_mac.sh
```

## Running from Source

```bash
python src/firmware_uploader.py
```

## Adding New Projects

Edit `src/projects_config.json`:

```json
{
  "My Device": {
    "chip": "esp32",
    "tool": "esptool",
    "baud": "921600",
    "address": "0x10000",
    "port_hint": "CH9102"
  }
}
```

### ESP32 Configuration

```json
{
  "chip": "esp32|esp32s3|esp32c3",
  "tool": "esptool",
  "baud": "921600",
  "address": "0x10000",
  "port_hint": "Description"
}
```

### Arduino Configuration

```json
{
  "chip": "atmega328p|atmega2560",
  "tool": "avrdude",
  "baud": "115200",
  "programmer": "arduino|wiring",
  "port_hint": "Description"
}
```

## Project Structure

```
.
├── src/
│   ├── firmware_uploader.py      # Main application
│   └── projects_config.json      # Your projects
├── build-tools/
│   ├── firmware_uploader.spec    # Build config
│   ├── requirements.txt          # Dependencies
│   ├── build_windows.bat
│   ├── build_mac.sh
│   ├── setup_tools_windows.bat
│   ├── setup_tools_mac.sh
│   └── assets/                   # Icons (optional)
│       ├── icon.ico
│       └── icon.icns
├── docs/
│   └── BUILD.md                  # This file
├── tools/                        # Optional: avrdude binaries
├── README.md
├── LICENSE
└── .gitignore
```

## Troubleshooting

**Build fails - can't find source:**
- Make sure you're in the project root
- Check `src/firmware_uploader.py` exists

**avrdude not bundled:**
- Run the setup script first
- Or build without it (ESP32 only)

**Icon not found (warning):**
- Ignore it, or add icons to `build-tools/assets/`
  - Windows: `build-tools/assets/logo.ico` (or `icon.ico`)
  - macOS: `build-tools/assets/logo.icns` (or `icon.icns`)
- Convert PNG to ICO/ICNS:
  - Online: https://converticon.com/ or https://cloudconvert.com/
  - The spec file will use logo.* or icon.* (whichever exists)


# Firmware Uploader - Electron Version

A modern, cross-platform desktop application for uploading firmware to ESP32, Arduino, and other microcontroller devices. Built with Electron for a beautiful, native-like user experience.

## Features

✨ **Modern UI**: Clean, responsive interface with dark theme support  
🚀 **Easy to Use**: Simple 3-step process to flash firmware  
🔧 **Multi-Platform**: Works on Windows, macOS, and Linux  
📱 **Auto-Detection**: Automatically detects serial ports and suggests the best match  
⚡ **Real-time Logging**: Live progress updates and detailed logs  
🎯 **Project Support**: Pre-configured for common boards with advanced options  

## Screenshots

The application features a modern two-panel layout:
- **Left Panel**: Configuration with project selection, file browser, and port selection
- **Right Panel**: Real-time log output with syntax highlighting
- **Status Bar**: Connection status and device information

## Installation

### Prerequisites

- Node.js 16+ and npm
- Python 3.x (for esptool)
- esptool and avrdude installed on your system

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

### Quick Start

1. **Select Project**: Choose your device from the dropdown
   - Click "Advanced" to see generic boards (ESP32, Arduino, etc.)
   - The app will show port hints to help you identify the right connection

2. **Select Firmware**: Click "Browse" to choose your firmware file
   - ESP32 devices: `.bin` files
   - Arduino devices: `.hex` files

3. **Connect Device**: Plug in your device via USB
   - The app will automatically detect available serial ports
   - Click "🔄 Refresh" if your device isn't detected

4. **Flash**: Click "🚀 Flash Firmware" and wait for completion
   - Monitor progress in the log panel
   - Success/failure notifications will appear

### Advanced Features

- **Project Configuration**: Customize projects via `projects_config.json`
- **Port Hints**: Each project includes hints for identifying the correct serial port
- **Auto-Selection**: The app tries to automatically select the best matching port
- **Log Management**: Clear logs, copy to clipboard, or export for troubleshooting

## Project Configuration

The app supports custom project configurations. Create or edit `src/projects_config.json`:

```json
{
  "My Custom ESP32": {
    "chip": "esp32",
    "tool": "esptool",
    "baud": "921600",
    "address": "0x10000",
    "port_hint": "CH340"
  },
  "My Arduino Project": {
    "chip": "atmega328p",
    "tool": "avrdude",
    "baud": "115200",
    "programmer": "arduino",
    "port_hint": "Arduino Uno"
  }
}
```

## Troubleshooting

### No Serial Ports Detected
- Ensure your device is connected via USB
- Install appropriate USB drivers (CH340, CP210x, FTDI)
- Click the refresh button (🔄)
- Try a different USB cable

### Flash Failed
- Verify the correct project is selected
- Check that the firmware file matches the device type
- Ensure no other applications are using the serial port
- Try putting the device in bootloader mode (hold BOOT button while connecting)

### Tools Not Found
- Install Python and esptool: `pip install esptool`
- Install avrdude (usually comes with Arduino IDE)
- Ensure tools are in your system PATH

## Development

### Project Structure

```
src/
├── main.js              # Main Electron process
├── projects_config.json # Project configurations
└── renderer/
    ├── index.html       # UI structure
    ├── styles.css       # Modern styling
    └── renderer.js      # Frontend logic
```

### Building

```bash
# Development
npm run dev

# Production build
npm run build

# Create distributables
npm run dist
```

## Comparison with Python Version

| Feature | Python (Tkinter) | Electron |
|---------|------------------|----------|
| UI Framework | Tkinter | HTML/CSS/JS |
| Look & Feel | Native but basic | Modern, customizable |
| Cross-platform | ✅ | ✅ |
| Performance | Fast startup | Slightly slower startup |
| Bundle Size | Small | Larger |
| Customization | Limited | Extensive |
| Real-time Updates | Good | Excellent |
| Dark Theme | ❌ | ✅ |

## License

MIT License - see LICENSE file for details.

## Credits

Developed by Daniël Vegter for Broadcast Rental  
Built with Electron, Inter font, and Font Awesome icons

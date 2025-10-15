# Firmware Uploader

A modern, cross-platform desktop application for uploading firmware to ESP32, Arduino, and other microcontroller devices. Built with Electron for a beautiful, native-like user experience.

![Firmware Uploader](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 🎨 **Modern UI**: Clean, responsive interface with professional design
- 🚀 **Easy to Use**: Simple 3-step process to flash firmware
- 🔧 **Multi-Platform**: Works on Windows, macOS, and Linux
- 📱 **Auto-Detection**: Automatically detects serial ports and suggests the best match
- ⚡ **Real-time Logging**: Live progress updates and detailed logs
- 🎯 **Project Support**: Pre-configured for common boards with advanced options
- 🔄 **Smart Matching**: Auto-selects the best serial port based on project hints
- 📋 **Configuration**: Export/import project configurations

## 📥 Download

### Latest Release
Download the latest version from the [Releases page](https://github.com/your-username/BCR-fwut/releases/latest):

- **macOS**: `Firmware-Uploader-1.0.0.dmg` (Intel & Apple Silicon)
- **Windows**: `Firmware-Uploader-Setup-1.0.0.exe`
- **Linux**: `Firmware-Uploader-1.0.0.AppImage` or `.deb` package

### Installation

#### macOS
1. Download the `.dmg` file
2. Double-click to mount the disk image
3. Drag the app to your Applications folder
4. Launch from Applications or Spotlight

#### Windows
1. Download the `.exe` installer
2. Run the installer as Administrator
3. Follow the setup wizard
4. Launch from Start Menu or Desktop shortcut

#### Linux
**AppImage:**
```bash
chmod +x Firmware-Uploader-1.0.0.AppImage
./Firmware-Uploader-1.0.0.AppImage
```

**Debian/Ubuntu:**
```bash
sudo dpkg -i firmware-uploader_1.0.0_amd64.deb
```

## 🚀 Quick Start

1. **Select Project**: Choose your device from the dropdown
   - Click "Advanced" to see generic boards (ESP32, Arduino, etc.)
   - The app shows port hints to help identify the right connection

2. **Select Firmware**: Click "Browse" to choose your firmware file
   - ESP32 devices: `.bin` files
   - Arduino devices: `.hex` files

3. **Connect Device**: Plug in your device via USB
   - The app automatically detects available serial ports
   - Click "🔄 Refresh" if your device isn't detected

4. **Flash**: Click "🚀 Flash Firmware" and wait for completion
   - Monitor progress in the log panel
   - Success/failure notifications will appear

## ⚙️ Requirements

### System Requirements
- **macOS**: 10.14 or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04+ or equivalent

### Software Dependencies
- **esptool**: Automatically included
- **avrdude**: Install Arduino IDE or avrdude separately
- **Python 3.x**: Required for esptool (included in installer)

## 🔧 Project Configuration

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

## 🐛 Troubleshooting

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

## 🛠️ Development

### Prerequisites
- Node.js 16+ and npm
- Python 3.x (for esptool)
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/BCR-fwut.git
cd BCR-fwut

# Install dependencies
npm install

# Install esptool
pip install esptool
# or
pipx install esptool

# Run in development mode
npm run dev
```

### Building
```bash
# Build for current platform
npm run build

# Create distributables
npm run dist

# Build for all platforms (requires setup)
npm run dist:all
```

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

## 📋 Version Management

### Creating Releases
```bash
# Patch release (1.0.0 -> 1.0.1)
npm run release

# Minor release (1.0.0 -> 1.1.0)
npm run release:minor

# Major release (1.0.0 -> 2.0.0)
npm run release:major
```

### Manual Release
```bash
# Using the release script
node scripts/release.js patch

# Or manually
npm version patch
git tag v1.0.1
git push origin main --tags
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Icons by [Font Awesome](https://fontawesome.com/)
- Font: [Inter](https://rsms.me/inter/)
- Inspired by the original Python Tkinter version

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/BCR-fwut/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/BCR-fwut/discussions)
- 📧 **Contact**: [Your Email]

---

**Developed by Daniël Vegter for Broadcast Rental** 🎯
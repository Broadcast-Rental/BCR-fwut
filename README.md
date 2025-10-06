# Firmware Uploader

Simple tool for uploading firmware to ESP32, Arduino, and other microcontroller devices.

## For Users

### Download & Run

1. Download `FirmwareUploader.exe` (Windows) or `FirmwareUploader.app` (Mac)
2. Double-click to run - no installation needed
3. That's it!

### How to Upload Firmware

1. **Select your project** from the dropdown
2. **Browse** for your firmware file (.bin or .hex)
3. **Connect your device** via USB
4. **Select the COM port** (the hint tells you what to look for)
5. **Click "Flash Firmware"**
6. Wait for the upload to complete

### Troubleshooting

**No COM ports showing?**
- Plug in your device
- Click "🔄 Refresh"
- Install USB drivers if needed (CH340, CP210x, FTDI)

**Upload failed?**
- Make sure you selected the correct project
- Try a different USB cable
- Close other programs using the COM port (Arduino IDE, etc.)

**Wrong firmware file?**
- ESP32 devices use `.bin` files
- Arduino devices use `.hex` files

---

## For Developers

See [docs/BUILD.md](docs/BUILD.md) for compilation instructions.

## License

[Your License Here]

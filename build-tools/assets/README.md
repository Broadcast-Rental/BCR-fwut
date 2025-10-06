# Assets

Place icon files here for the application.

## Current Files

- `logo.ico` - Windows icon ✅
- `logo.png` - Source image

## For macOS

To use the icon on macOS, convert `logo.png` to `logo.icns`:

**Online converter:**
https://cloudconvert.com/png-to-icns

**Or use command line (on Mac):**
```bash
# Create iconset
mkdir logo.iconset
sips -z 16 16 logo.png --out logo.iconset/icon_16x16.png
sips -z 32 32 logo.png --out logo.iconset/icon_16x16@2x.png
sips -z 32 32 logo.png --out logo.iconset/icon_32x32.png
sips -z 64 64 logo.png --out logo.iconset/icon_32x32@2x.png
sips -z 128 128 logo.png --out logo.iconset/icon_128x128.png
sips -z 256 256 logo.png --out logo.iconset/icon_128x128@2x.png
sips -z 256 256 logo.png --out logo.iconset/icon_256x256.png
sips -z 512 512 logo.png --out logo.iconset/icon_256x256@2x.png
sips -z 512 512 logo.png --out logo.iconset/icon_512x512.png
sips -z 1024 1024 logo.png --out logo.iconset/icon_512x512@2x.png

# Convert to icns
iconutil -c icns logo.iconset -o logo.icns
```

Then place `logo.icns` in this folder.

## Notes

- The build script looks for `logo.ico`/`logo.icns` first
- Falls back to `icon.ico`/`icon.icns` if logo.* not found
- If no icon found, uses default Python icon


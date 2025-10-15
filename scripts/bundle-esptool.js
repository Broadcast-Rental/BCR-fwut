#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Bundling esptool for Electron app...');

// Create tools directory
const toolsDir = path.join(__dirname, '..', 'src', 'tools');
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

try {
  // Download esptool.py directly from GitHub
  console.log('📥 Downloading esptool.py...');
  const esptoolUrl = 'https://raw.githubusercontent.com/espressif/esptool/master/esptool.py';
  
  // Use curl to download esptool.py
  execSync(`curl -o ${path.join(toolsDir, 'esptool.py')} ${esptoolUrl}`, { stdio: 'inherit' });
  
  console.log('✅ esptool.py bundled successfully!');
  
  // Create a simple launcher script
  const launcherScript = `#!/usr/bin/env python3
import sys
import os

# Add the tools directory to the path
tools_dir = os.path.join(os.path.dirname(__file__), 'tools')
sys.path.insert(0, tools_dir)

# Import and run esptool
if __name__ == '__main__':
    import esptool
    esptool.main()
`;
  
  fs.writeFileSync(path.join(toolsDir, 'esptool_launcher.py'), launcherScript);
  console.log('✅ esptool launcher script created!');
  
} catch (error) {
  console.error('❌ Error bundling esptool:', error.message);
  process.exit(1);
}

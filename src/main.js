const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const SerialPort = require('serialport');

let mainWindow;
let projectsConfig = {};

// Load projects configuration
function loadProjectsConfig() {
  try {
    const configPath = path.join(__dirname, 'projects_config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      projectsConfig = JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error loading projects config:', error);
    projectsConfig = {};
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../build-tools/assets/logo.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Sample Config',
          click: async () => {
            const sample = {
              "Custom ESP32 Project": {
                "chip": "esp32",
                "tool": "esptool",
                "baud": "921600",
                "address": "0x10000",
                "port_hint": "CH9102"
              },
              "Custom Arduino Mega": {
                "chip": "atmega2560",
                "tool": "avrdude",
                "baud": "115200",
                "programmer": "wiring",
                "port_hint": "Arduino Mega"
              }
            };
            
            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: 'projects_config_sample.json',
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              fs.writeFileSync(result.filePath, JSON.stringify(sample, null, 2));
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Success',
                message: 'Sample config exported successfully!'
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'How to Use',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'How to Use',
              message: 'How to Upload Firmware',
              detail: `1. Select your project from the dropdown
   (Click 'Advanced' for generic boards)
2. Browse for your firmware file (.bin or .hex)
3. Connect your device via USB
4. Select the COM port
5. Click 'Flash Firmware'

Troubleshooting:
• No ports? Click Refresh or install USB drivers
• Upload failed? Check project selection and cable`
            });
          }
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Firmware Uploader v1.0.0',
              detail: `Simple tool for uploading firmware to
ESP32, Arduino, and other devices.

Supports: esptool, avrdude

─────────────────────────────
Developed by: Daniël Vegter
Company: Broadcast Rental
─────────────────────────────`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('get-projects', () => {
  return projectsConfig;
});

ipcMain.handle('get-serial-ports', async () => {
  try {
    const ports = await SerialPort.SerialPort.list();
    return ports.map(port => ({
      path: port.path,
      description: port.description || 'Unknown device',
      display: `${port.path} (${port.description || 'Unknown device'})`
    }));
  } catch (error) {
    console.error('Error listing serial ports:', error);
    return [];
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('flash-firmware', async (event, { projectName, firmwarePath, port }) => {
  const config = projectsConfig[projectName];
  if (!config) {
    throw new Error(`Unknown project: ${projectName}`);
  }

  return new Promise((resolve, reject) => {
    let cmd;
    let args;

    if (config.tool === 'esptool') {
      // Use bundled esptool
      const bundledEsptoolPath = path.join(__dirname, 'tools', 'esptool_launcher.py');
      
      // Check if bundled esptool exists
      if (!fs.existsSync(bundledEsptoolPath)) {
        reject(new Error('Bundled esptool not found. Please rebuild the application.'));
        return;
      }
      
      // Find Python
      const pythonCommands = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python'];
      let pythonCmd = null;
      
      for (const cmd of pythonCommands) {
        try {
          const { execSync } = require('child_process');
          execSync(`${cmd} --version`, { stdio: 'ignore' });
          pythonCmd = cmd;
          break;
        } catch (e) {
          // Continue to next command
        }
      }
      
      if (!pythonCmd) {
        reject(new Error('Python not found. Please install Python 3.x:\n\n' +
          'macOS: brew install python\n' +
          'Windows: Download Python from python.org\n\n' +
          'esptool is bundled with this app, but Python is required to run it.'));
        return;
      }
      
      cmd = pythonCmd;
      args = [
        bundledEsptoolPath,
        '--chip', config.chip,
        '--baud', config.baud,
        '--port', port,
        'write-flash', config.address, firmwarePath
      ];
    } else if (config.tool === 'avrdude') {
      cmd = 'avrdude';
      args = [
        '-c', config.programmer,
        '-p', config.chip,
        '-P', port,
        '-b', config.baud,
        '-D',
        '-U', `flash:w:${firmwarePath}:i`
      ];
    } else {
      reject(new Error(`Unsupported tool: ${config.tool}`));
      return;
    }

    // Add pipx path for esptool
    const env = { ...process.env };
    if (config.tool === 'esptool') {
      env.PATH = `${process.env.HOME}/.local/bin:${process.env.PATH}`;
    }
    
    const flashProcess = spawn(cmd, args, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env
    });
    
    let output = '';
    let errorOutput = '';

    flashProcess.stdout.on('data', (data) => {
      output += data.toString();
      event.sender.send('flash-output', data.toString());
    });

    flashProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      event.sender.send('flash-output', data.toString());
    });

    flashProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject(new Error(`Flash failed with exit code ${code}\n${errorOutput}`));
      }
    });

    flashProcess.on('error', (error) => {
      reject(new Error(`Failed to start flash process: ${error.message}`));
    });
  });
});

// App event handlers
app.whenReady().then(() => {
  loadProjectsConfig();
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.argv.includes('--dev')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

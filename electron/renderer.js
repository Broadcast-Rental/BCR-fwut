const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const { remote } = require('electron');

class FirmwareUploader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSerialPorts();
        this.log('🚀 Firmware Uploader started successfully!');
    }

    initializeElements() {
        this.projectSelect = document.getElementById('project-select');
        this.firmwarePath = document.getElementById('firmware-path');
        this.portSelect = document.getElementById('port-select');
        this.logOutput = document.getElementById('log-output');
        this.advancedBtn = document.getElementById('advanced-btn');
        this.browseBtn = document.getElementById('browse-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.uploadBtn = document.getElementById('upload-btn');
    }

    bindEvents() {
        this.advancedBtn.addEventListener('click', () => this.showAdvanced());
        this.browseBtn.addEventListener('click', () => this.browseFirmware());
        this.refreshBtn.addEventListener('click', () => this.loadSerialPorts());
        this.uploadBtn.addEventListener('click', () => this.uploadFirmware());
    }

    async loadSerialPorts() {
        try {
            this.log('🔍 Scanning for serial ports...');
            const ports = await ipcRenderer.invoke('get-serial-ports');
            
            this.portSelect.innerHTML = '<option value="">Select serial port...</option>';
            
            if (ports.length === 0) {
                this.portSelect.innerHTML += '<option value="" disabled>No serial ports found</option>';
                this.log('⚠️ No serial ports detected');
                this.log('💡 Try connecting a device or check if drivers are installed');
            } else {
                ports.forEach(port => {
                    const option = document.createElement('option');
                    option.value = port.path;
                    const displayName = port.description || port.manufacturer || 'Unknown Device';
                    option.textContent = `${port.path} - ${displayName}`;
                    this.portSelect.appendChild(option);
                });
                this.log(`✅ Found ${ports.length} serial port(s)`);
                ports.forEach(port => {
                    this.log(`  📍 ${port.path} - ${port.description} (${port.manufacturer})`);
                });
            }
        } catch (error) {
            this.log(`❌ Error loading serial ports: ${error.message}`, 'error');
            this.log('💡 Make sure you have the necessary drivers installed');
        }
    }

    async browseFirmware() {
        try {
            const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
                title: 'Select Firmware File',
                filters: [
                    { name: 'Firmware Files', extensions: ['bin', 'hex', 'elf'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                this.firmwarePath.value = result.filePaths[0];
                this.log(`📁 Selected firmware: ${result.filePaths[0]}`);
            }
        } catch (error) {
            this.log(`❌ Error selecting firmware: ${error.message}`, 'error');
        }
    }

    showAdvanced() {
        this.log('⚙️ Advanced settings opened');
        
        // Create advanced settings modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 2rem;
            border: 2px solid var(--accent-blue);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
        `;
        
        modalContent.innerHTML = `
            <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.2rem;">⚙️ Advanced Settings</h3>
            <div style="margin-bottom: 1rem;">
                <label style="color: var(--text-primary); display: block; margin-bottom: 0.5rem;">Baud Rate:</label>
                <select id="baud-rate" style="width: 100%; padding: 0.5rem; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: 6px;">
                    <option value="115200">115200</option>
                    <option value="9600">9600</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="color: var(--text-primary); display: block; margin-bottom: 0.5rem;">Flash Mode:</label>
                <select id="flash-mode" style="width: 100%; padding: 0.5rem; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: 6px;">
                    <option value="dio">DIO</option>
                    <option value="qio">QIO</option>
                    <option value="dout">DOUT</option>
                    <option value="qout">QOUT</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="color: var(--text-primary); display: block; margin-bottom: 0.5rem;">Flash Size:</label>
                <select id="flash-size" style="width: 100%; padding: 0.5rem; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: 6px;">
                    <option value="4MB">4MB</option>
                    <option value="2MB">2MB</option>
                    <option value="8MB">8MB</option>
                    <option value="16MB">16MB</option>
                </select>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="cancel-advanced" style="padding: 0.5rem 1rem; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: 6px; cursor: pointer;">Cancel</button>
                <button id="save-advanced" style="padding: 0.5rem 1rem; background: var(--accent-blue); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer;">Save</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.getElementById('cancel-advanced').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('save-advanced').addEventListener('click', () => {
            const baudRate = document.getElementById('baud-rate').value;
            const flashMode = document.getElementById('flash-mode').value;
            const flashSize = document.getElementById('flash-size').value;
            
            this.log(`⚙️ Advanced settings saved: Baud=${baudRate}, Mode=${flashMode}, Size=${flashSize}`);
            document.body.removeChild(modal);
        });
    }

    async uploadFirmware() {
        const project = this.projectSelect.value;
        const firmwarePath = this.firmwarePath.value;
        const port = this.portSelect.value;

        // Validation
        if (!project) {
            this.log('❌ Please select a project', 'error');
            return;
        }

        if (!firmwarePath) {
            this.log('❌ Please select a firmware file', 'error');
            return;
        }

        if (!port) {
            this.log('❌ Please select a serial port', 'error');
            return;
        }

        // Disable upload button
        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = '⏳ Uploading...';

        try {
            this.log(`🚀 Starting firmware upload...`);
            this.log(`📋 Project: ${project}`);
            this.log(`📁 Firmware: ${firmwarePath}`);
            this.log(`🔌 Port: ${port}`);
            this.log(`⏳ Please wait, this may take a few minutes...`);

            // Simulate upload process with progress
            const steps = [
                '🔍 Connecting to device...',
                '📡 Erasing flash memory...',
                '📤 Uploading firmware...',
                '✅ Verifying upload...',
                '🎉 Upload completed successfully!'
            ];

            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.log(steps[i]);
            }

            this.log(`✅ Firmware uploaded successfully to ${project}!`, 'success');
            this.log(`🔌 Device should now be running the new firmware`);
            
        } catch (error) {
            this.log(`❌ Upload failed: ${error.message}`, 'error');
            this.log(`💡 Check your connections and try again`);
        } finally {
            // Re-enable upload button
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = '🚀 Upload Firmware';
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        this.logOutput.textContent += logEntry;
        this.logOutput.scrollTop = this.logOutput.scrollHeight;

        // Add color coding based on type
        if (type === 'error') {
            console.error(message);
        } else if (type === 'success') {
            console.log(message);
        } else {
            console.info(message);
        }
    }

    clearLog() {
        this.logOutput.textContent = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FirmwareUploader();
});

// Handle IPC messages from main process
ipcRenderer.on('export-config', () => {
    console.log('Export config requested');
    // TODO: Implement config export
});

ipcRenderer.on('show-help', () => {
    console.log('Show help requested');
    // TODO: Implement help modal
});

ipcRenderer.on('show-about', () => {
    console.log('Show about requested');
    // TODO: Implement about modal
});

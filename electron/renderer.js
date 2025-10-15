const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

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
            } else {
                ports.forEach(port => {
                    const option = document.createElement('option');
                    option.value = port.path;
                    option.textContent = `${port.path} - ${port.description}`;
                    this.portSelect.appendChild(option);
                });
                this.log(`✅ Found ${ports.length} serial port(s)`);
            }
        } catch (error) {
            this.log(`❌ Error loading serial ports: ${error.message}`, 'error');
        }
    }

    async browseFirmware() {
        try {
            const result = await dialog.showOpenDialog({
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
        this.log('⚙️ Advanced settings would open here');
        // TODO: Implement advanced settings modal
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

            const result = await ipcRenderer.invoke('flash-firmware', {
                project,
                firmwarePath,
                port
            });

            if (result.success) {
                this.log(`✅ ${result.message}`, 'success');
            } else {
                this.log(`❌ ${result.message}`, 'error');
            }
        } catch (error) {
            this.log(`❌ Upload failed: ${error.message}`, 'error');
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

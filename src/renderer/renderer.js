const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Advanced projects (hidden by default)
const ADVANCED_PROJECTS = {
    "ESP32 - Generic": {
        "chip": "esp32",
        "tool": "esptool",
        "baud": "460800",
        "address": "0x10000",
        "port_hint": "CH9102"
    },
    "ESP32-S3": {
        "chip": "esp32s3",
        "tool": "esptool",
        "baud": "460800",
        "address": "0x10000",
        "port_hint": "USB JTAG"
    },
    "ESP32-C3": {
        "chip": "esp32c3",
        "tool": "esptool",
        "baud": "460800",
        "address": "0x0",
        "port_hint": "USB JTAG"
    },
    "Olimex ESP32-POE-ISO": {
        "chip": "esp32",
        "tool": "esptool",
        "baud": "460800",
        "address": "0x10000",
        "port_hint": "CH340 or FT232"
    },
    "Arduino Uno": {
        "chip": "atmega328p",
        "tool": "avrdude",
        "baud": "115200",
        "programmer": "arduino",
        "port_hint": "Arduino Uno"
    },
    "Arduino Nano": {
        "chip": "atmega328p",
        "tool": "avrdude",
        "baud": "57600",
        "programmer": "arduino",
        "port_hint": "CH340"
    },
    "Arduino Nano (Old Bootloader)": {
        "chip": "atmega328p",
        "tool": "avrdude",
        "baud": "57600",
        "programmer": "arduino",
        "port_hint": "FT232"
    }
};

class FirmwareUploader {
    constructor() {
        this.projects = {};
        this.showAdvanced = false;
        this.isFlashing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadProjects();
        this.refreshSerialPorts();
    }

    initializeElements() {
        // Form elements
        this.projectSelect = document.getElementById('projectSelect');
        this.advancedToggle = document.getElementById('advancedToggle');
        this.advancedText = document.getElementById('advancedText');
        this.projectHint = document.getElementById('projectHint');
        this.firmwarePath = document.getElementById('firmwarePath');
        this.browseFirmware = document.getElementById('browseFirmware');
        this.portSelect = document.getElementById('portSelect');
        this.portLabel = document.getElementById('portLabel');
        this.portStatus = document.getElementById('portStatus');
        
        // Action buttons
        this.flashBtn = document.getElementById('flashBtn');
        this.refreshPortsBtn = document.getElementById('refreshPortsBtn');
        this.clearLogBtn = document.getElementById('clearLogBtn');
        this.copyLogBtn = document.getElementById('copyLogBtn');
        
        // UI elements
        this.logOutput = document.getElementById('logOutput');
        this.flashProgress = document.getElementById('flashProgress');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.deviceInfo = document.getElementById('deviceInfo');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Project selection
        this.projectSelect.addEventListener('change', () => this.onProjectChange());
        
        // Advanced toggle
        this.advancedToggle.addEventListener('click', () => this.toggleAdvanced());
        
        // File browser
        this.browseFirmware.addEventListener('click', () => this.browseForFirmware());
        
        // Serial port
        this.portSelect.addEventListener('change', () => this.onPortChange());
        this.refreshPortsBtn.addEventListener('click', () => this.refreshSerialPorts());
        
        // Flash button
        this.flashBtn.addEventListener('click', () => this.flashFirmware());
        
        // Log actions
        this.clearLogBtn.addEventListener('click', () => this.clearLog());
        this.copyLogBtn.addEventListener('click', () => this.copyLog());
        
        // IPC listeners
        ipcRenderer.on('flash-output', (event, data) => this.addLogEntry(data, 'info'));
        ipcRenderer.on('show-python-setup', () => this.showPythonSetup());
    }

    async loadProjects() {
        try {
            this.projects = await ipcRenderer.invoke('get-projects');
            this.updateProjectList();
            this.log('Projects loaded successfully', 'info');
        } catch (error) {
            this.log(`Error loading projects: ${error.message}`, 'error');
        }
    }

    updateProjectList() {
        this.projectSelect.innerHTML = '<option value="">Select a project...</option>';
        
        const projects = Object.keys(this.projects);
        if (this.showAdvanced) {
            projects.push(...Object.keys(ADVANCED_PROJECTS));
        }
        
        projects.sort().forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            this.projectSelect.appendChild(option);
        });
    }

    toggleAdvanced() {
        this.showAdvanced = !this.showAdvanced;
        
        if (this.showAdvanced) {
            this.advancedText.textContent = '✓ Advanced';
            this.advancedToggle.classList.add('active');
        } else {
            this.advancedText.textContent = 'Advanced';
            this.advancedToggle.classList.remove('active');
        }
        
        this.updateProjectList();
        this.log(`Advanced mode ${this.showAdvanced ? 'enabled' : 'disabled'}`, 'info');
    }

    onProjectChange() {
        const selectedProject = this.projectSelect.value;
        if (!selectedProject) {
            this.projectHint.textContent = '';
            this.portLabel.textContent = 'Serial Port';
            this.updateFlashButton();
            return;
        }

        const config = this.getProjectConfig(selectedProject);
        if (config) {
            const hint = config.port_hint || '';
            this.projectHint.textContent = hint ? `Look for: ${hint}` : '';
            this.portLabel.textContent = hint ? `Serial Port (${hint})` : 'Serial Port';
            
            // Auto-refresh ports to try to match the hint
            this.refreshSerialPorts();
        }
        
        this.updateFlashButton();
        this.updateDeviceInfo();
    }

    getProjectConfig(projectName) {
        return this.projects[projectName] || ADVANCED_PROJECTS[projectName];
    }

    async browseForFirmware() {
        const selectedProject = this.projectSelect.value;
        const config = this.getProjectConfig(selectedProject);
        
        let filters = [
            { name: 'All Files', extensions: ['*'] }
        ];
        
        if (config) {
            if (config.tool === 'esptool') {
                filters = [
                    { name: 'BIN files', extensions: ['bin'] },
                    { name: 'All files', extensions: ['*'] }
                ];
            } else if (config.tool === 'avrdude') {
                filters = [
                    { name: 'HEX files', extensions: ['hex'] },
                    { name: 'BIN files', extensions: ['bin'] },
                    { name: 'All files', extensions: ['*'] }
                ];
            }
        } else {
            filters = [
                { name: 'Firmware files', extensions: ['bin', 'hex'] },
                { name: 'All files', extensions: ['*'] }
            ];
        }

        try {
            const result = await ipcRenderer.invoke('show-open-dialog', {
                properties: ['openFile'],
                filters: filters
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                this.firmwarePath.value = result.filePaths[0];
                this.updateFlashButton();
                this.log(`Selected firmware: ${path.basename(result.filePaths[0])}`, 'info');
            }
        } catch (error) {
            this.log(`Error selecting firmware: ${error.message}`, 'error');
        }
    }

    async refreshSerialPorts() {
        this.showLoading(true);
        
        try {
            const ports = await ipcRenderer.invoke('get-serial-ports');
            
            this.portSelect.innerHTML = '<option value="">Select serial port...</option>';
            
            if (ports.length === 0) {
                this.portSelect.innerHTML = '<option value="">❌ No serial ports found</option>';
                this.portStatus.textContent = 'No devices detected';
                this.connectionStatus.className = 'status-indicator offline';
                this.connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
            } else {
                ports.forEach(port => {
                    const option = document.createElement('option');
                    option.value = port.path;
                    option.textContent = port.display;
                    this.portSelect.appendChild(option);
                });
                
                // Try to auto-select based on project hint
                this.autoSelectPort(ports);
                this.portStatus.textContent = `${ports.length} device(s) found`;
            }
            
            this.log(`Found ${ports.length} serial port(s)`, 'info');
        } catch (error) {
            this.log(`Error refreshing ports: ${error.message}`, 'error');
            this.portStatus.textContent = 'Error detecting ports';
        } finally {
            this.showLoading(false);
        }
    }

    autoSelectPort(ports) {
        const selectedProject = this.projectSelect.value;
        const config = this.getProjectConfig(selectedProject);
        
        if (!config || !config.port_hint) return;
        
        const hint = config.port_hint.toLowerCase();
        const hintKeywords = hint.split(' ');
        
        let bestMatch = null;
        let bestScore = 0;
        
        ports.forEach((port, index) => {
            const description = port.description.toLowerCase();
            const score = hintKeywords.reduce((acc, keyword) => {
                return acc + (description.includes(keyword) ? 1 : 0);
            }, 0);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = index;
            }
        });
        
        if (bestMatch !== null) {
            this.portSelect.selectedIndex = bestMatch + 1; // +1 for the empty option
            this.onPortChange();
        }
    }

    onPortChange() {
        const selectedPort = this.portSelect.value;
        if (selectedPort) {
            this.connectionStatus.className = 'status-indicator online';
            this.connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
        } else {
            this.connectionStatus.className = 'status-indicator offline';
            this.connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
        }
        
        this.updateFlashButton();
        this.updateDeviceInfo();
    }

    updateDeviceInfo() {
        const selectedProject = this.projectSelect.value;
        const selectedPort = this.portSelect.value;
        
        if (selectedProject && selectedPort) {
            const config = this.getProjectConfig(selectedProject);
            if (config) {
                this.deviceInfo.textContent = `${selectedProject} on ${selectedPort}`;
            }
        } else {
            this.deviceInfo.textContent = 'No device selected';
        }
    }

    updateFlashButton() {
        const hasProject = this.projectSelect.value !== '';
        const hasFirmware = this.firmwarePath.value !== '';
        const hasPort = this.portSelect.value !== '';
        const canFlash = hasProject && hasFirmware && hasPort && !this.isFlashing;
        
        this.flashBtn.disabled = !canFlash;
    }

    async flashFirmware() {
        if (this.isFlashing) return;
        
        const projectName = this.projectSelect.value;
        const firmwarePath = this.firmwarePath.value;
        const port = this.portSelect.value;
        
        if (!projectName || !firmwarePath || !port) {
            this.log('Please select project, firmware file, and serial port', 'error');
            return;
        }

        this.isFlashing = true;
        this.flashBtn.disabled = true;
        this.flashProgress.style.display = 'block';
        
        const config = this.getProjectConfig(projectName);
        
        this.log('='.repeat(60), 'info');
        this.log(`Project: ${projectName}`, 'info');
        this.log(`Device: ${config.chip}`, 'info');
        this.log(`Tool: ${config.tool}`, 'info');
        this.log(`Firmware: ${path.basename(firmwarePath)}`, 'info');
        this.log(`Port: ${port}`, 'info');
        this.log('='.repeat(60), 'info');
        this.log('', 'info');
        
        try {
            await ipcRenderer.invoke('flash-firmware', {
                projectName,
                firmwarePath,
                port
            });
            
            this.log('✅ Flash complete!', 'success');
            this.showNotification('Success', 'Firmware uploaded successfully!');
        } catch (error) {
            this.log(`❌ Flash failed: ${error.message}`, 'error');
            this.showNotification('Error', 'Firmware upload failed. Check the log for details.');
        } finally {
            this.isFlashing = false;
            this.flashBtn.disabled = false;
            this.flashProgress.style.display = 'none';
            this.updateFlashButton();
        }
    }

    addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;
        
        this.logOutput.appendChild(logEntry);
        this.logOutput.scrollTop = this.logOutput.scrollHeight;
    }

    log(message, type = 'info') {
        if (typeof message === 'string' && message.trim()) {
            this.addLogEntry(message, type);
        }
    }

    clearLog() {
        this.logOutput.innerHTML = `
            <div class="log-entry info">
                <span class="log-time">[INFO]</span>
                <span class="log-message">Log cleared</span>
            </div>
        `;
    }

    async copyLog() {
        const logText = Array.from(this.logOutput.children)
            .map(entry => entry.textContent)
            .join('\n');
        
        try {
            await navigator.clipboard.writeText(logText);
            this.log('Log copied to clipboard', 'info');
        } catch (error) {
            this.log('Failed to copy log to clipboard', 'error');
        }
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showNotification(title, message) {
        // Simple notification - in a real app you might want to use a proper notification library
        this.log(`${title}: ${message}`, 'info');
    }

    showPythonSetup() {
        // Create a new window for Python installer
        const { remote } = require('electron');
        const installerWindow = new remote.BrowserWindow({
            width: 700,
            height: 600,
            parent: remote.getCurrentWindow(),
            modal: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        installerWindow.loadFile('python-installer.html');
        installerWindow.setTitle('Python Installer - Firmware Uploader');
        
        // Center the window
        installerWindow.center();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FirmwareUploader();
});

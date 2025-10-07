import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, scrolledtext, ttk, messagebox
import subprocess
import threading
import serial.tools.list_ports
from typing import Dict, List, Tuple

# ─────────────────────────────
# VERSION (injected at build time)
# ─────────────────────────────
VERSION = os.getenv("FW_VERSION", "1.0.0")

# ─────────────────────────────
# PATH HELPERS FOR BUNDLED TOOLS
# ─────────────────────────────
def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def get_bundled_tool_path(tool_name):
    """Get path to bundled tool executable"""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        tools_dir = get_resource_path('tools')
        if os.name == 'nt':  # Windows
            tool_path = os.path.join(tools_dir, f"{tool_name}.exe")
        else:  # macOS/Linux
            tool_path = os.path.join(tools_dir, tool_name)
        
        if os.path.exists(tool_path):
            return tool_path
    
    # Fallback to system PATH
    return tool_name

# ─────────────────────────────
# PROJECT CONFIGURATIONS
# ─────────────────────────────
PROJECTS = {
    "ESP32 - Generic": {
        "chip": "esp32",
        "tool": "esptool",
        "baud": "921600",
        "address": "0x10000",
        "port_hint": "CH9102"
    },
    "ESP32-S3": {
        "chip": "esp32s3",
        "tool": "esptool",
        "baud": "921600",
        "address": "0x10000",
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
}


def load_custom_projects():
    """Load additional projects from external config file if exists"""
    # Try bundled config first (for compiled exe)
    config_file = get_resource_path("projects_config.json")
    
    # If not bundled, try relative to this script file
    if not os.path.exists(config_file):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_file = os.path.join(script_dir, "projects_config.json")
    
    # If still not found, try project root
    if not os.path.exists(config_file):
        config_file = os.path.join(os.path.dirname(script_dir), "projects_config.json")
    
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                custom = json.load(f)
                PROJECTS.update(custom)
        except Exception as e:
            print(f"Warning: Could not load {config_file}: {e}")


def list_serial_ports() -> List[Tuple[str, str]]:
    """Return a list of (device, description) tuples"""
    ports = []
    for p in serial.tools.list_ports.comports():
        desc = p.description or "Unknown device"
        ports.append((p.device, f"{p.device} ({desc})"))
    return ports


def build_esptool_command(config: Dict, port: str, firmware_path: str) -> List[str]:
    """Build esptool command for ESP32 devices"""
    # Check if we're running as a frozen executable
    if getattr(sys, 'frozen', False):
        # Running as compiled exe - check for standalone esptool first
        esptool_path = get_bundled_tool_path('esptool')
        if esptool_path != 'esptool' and os.path.exists(esptool_path):
            # Standalone esptool executable found
            return [
                esptool_path,
                "--chip", config["chip"],
                "--baud", config["baud"],
                "--port", port,
                "write-flash", config["address"], firmware_path
            ]
        # If no standalone executable, try to find esptool in system PATH
        # (user may have Python and esptool installed separately)
        import shutil
        esptool_cmd = shutil.which('esptool') or shutil.which('esptool.py')
        if esptool_cmd:
            return [
                esptool_cmd,
                "--chip", config["chip"],
                "--baud", config["baud"],
                "--port", port,
                "write-flash", config["address"], firmware_path
            ]
        # Try with Python in PATH as fallback
        python_path = shutil.which('python') or shutil.which('python3')
        if python_path:
            return [
                python_path, "-m", "esptool",
                "--chip", config["chip"],
                "--baud", config["baud"],
                "--port", port,
                "write-flash", config["address"], firmware_path
            ]
        # Last resort: hope esptool is in PATH
        return [
            "esptool",
            "--chip", config["chip"],
            "--baud", config["baud"],
            "--port", port,
            "write-flash", config["address"], firmware_path
        ]
    
    # Use Python module (development environment)
    return [
        sys.executable, "-m", "esptool",
        "--chip", config["chip"],
        "--baud", config["baud"],
        "--port", port,
        "write-flash", config["address"], firmware_path
    ]


def build_avrdude_command(config: Dict, port: str, firmware_path: str) -> List[str]:
    """Build avrdude command for Arduino devices"""
    # Use bundled avrdude if available
    avrdude_path = get_bundled_tool_path('avrdude')
    
    cmd = [
        avrdude_path,
        "-c", config["programmer"],
        "-p", config["chip"],
        "-P", port,
        "-b", config["baud"],
        "-D",
        "-U", f"flash:w:{firmware_path}:i"
    ]
    
    # Add config file if bundled (Windows needs this)
    if getattr(sys, 'frozen', False) and os.name == 'nt':
        tools_dir = get_resource_path('tools')
        avrdude_conf = os.path.join(tools_dir, 'avrdude.conf')
        if os.path.exists(avrdude_conf):
            cmd.insert(1, "-C")
            cmd.insert(2, avrdude_conf)
    
    return cmd


def run_esptool_direct(config: Dict, port: str, firmware_path: str, log_widget):
    """Run esptool directly by calling its main function (for frozen exe)"""
    import io
    import contextlib
    
    # Prepare arguments as if they were command-line args
    args = [
        "--chip", config["chip"],
        "--baud", config["baud"],
        "--port", port,
        "write-flash", config["address"], firmware_path
    ]
    
    # Capture stdout/stderr
    output_buffer = io.StringIO()
    
    try:
        # Import esptool and call its main function
        import esptool
        
        # Redirect stdout to capture output
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(output_buffer):
            # Save original sys.argv
            old_argv = sys.argv
            try:
                # Set sys.argv to our arguments
                sys.argv = ['esptool.py'] + args
                # Call esptool's main function
                esptool.main()
                returncode = 0
            except SystemExit as e:
                returncode = e.code if e.code else 0
            finally:
                # Restore original sys.argv
                sys.argv = old_argv
        
        # Get all output
        output = output_buffer.getvalue()
        log_widget.insert(tk.END, output)
        
        return returncode
        
    except Exception as e:
        log_widget.insert(tk.END, f"Error: {str(e)}\n")
        return 1


def flash_firmware(project_name: str, firmware_path: str, port_display: str, log_widget, button):
    """Flash firmware based on project configuration"""
    if not project_name:
        messagebox.showwarning("Missing project", "Please select a project first.")
        return
    if not firmware_path:
        messagebox.showwarning("Missing file", "Please select a firmware file first.")
        return
    if not port_display:
        messagebox.showwarning("Missing port", "Please select a serial port first.")
        return

    config = PROJECTS.get(project_name)
    if not config:
        messagebox.showerror("Error", f"Unknown project: {project_name}")
        return

    # Extract just the port name (before any space or parentheses)
    port = port_display.split(" ")[0].strip()

    button.config(state=tk.DISABLED)
    log_widget.insert(tk.END, f"\n{'='*60}\n")
    log_widget.insert(tk.END, f"Project: {project_name}\n")
    log_widget.insert(tk.END, f"Device: {config['chip']}\n")
    log_widget.insert(tk.END, f"Tool: {config['tool']}\n")
    log_widget.insert(tk.END, f"Firmware: {os.path.basename(firmware_path)}\n")
    log_widget.insert(tk.END, f"Port: {port}\n")
    log_widget.insert(tk.END, f"{'='*60}\n\n")
    log_widget.see(tk.END)

    def run():
        try:
            # Check if we should call esptool directly (frozen exe) or via subprocess
            if config["tool"] == "esptool" and getattr(sys, 'frozen', False):
                # Running as frozen exe - call esptool directly
                log_widget.insert(tk.END, "Running esptool (bundled)...\n\n")
                log_widget.see(tk.END)
                returncode = run_esptool_direct(config, port, firmware_path, log_widget)
            else:
                # Build command based on tool
                if config["tool"] == "esptool":
                    cmd = build_esptool_command(config, port, firmware_path)
                elif config["tool"] == "avrdude":
                    cmd = build_avrdude_command(config, port, firmware_path)
                else:
                    messagebox.showerror("Error", f"Unsupported tool: {config['tool']}")
                    button.config(state=tk.NORMAL)
                    return

                log_widget.insert(tk.END, f"Command: {' '.join(cmd)}\n\n")
                log_widget.see(tk.END)
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True
                )
                for line in process.stdout:
                    log_widget.insert(tk.END, line)
                    log_widget.see(tk.END)
                process.wait()
                returncode = process.returncode
            
            if returncode == 0:
                log_widget.insert(tk.END, "\n✅ Flash complete!\n")
                messagebox.showinfo("Success", "Firmware uploaded successfully!")
            else:
                log_widget.insert(tk.END, f"\n❌ Flash failed (exit code: {returncode})\n")
                messagebox.showerror("Error", "Firmware upload failed. Check the log for details.")
                
        except FileNotFoundError:
            error_msg = f"Tool '{config['tool']}' not found. Please ensure it's installed and in PATH."
            log_widget.insert(tk.END, f"\n❌ {error_msg}\n")
            messagebox.showerror("Error", error_msg)
        except Exception as e:
            log_widget.insert(tk.END, f"\n❌ Error: {str(e)}\n")
            messagebox.showerror("Error", str(e))
        finally:
            button.config(state=tk.NORMAL)
            log_widget.see(tk.END)

    threading.Thread(target=run, daemon=True).start()


def select_firmware(entry, project_combo):
    """Open file dialog to select firmware"""
    project = project_combo.get()
    
    # Determine file types based on project
    if project and PROJECTS.get(project):
        tool = PROJECTS[project]["tool"]
        if tool == "esptool":
            filetypes = [("BIN files", "*.bin"), ("All files", "*.*")]
        elif tool == "avrdude":
            filetypes = [("HEX files", "*.hex"), ("BIN files", "*.bin"), ("All files", "*.*")]
        else:
            filetypes = [("All files", "*.*")]
    else:
        filetypes = [("Firmware files", "*.bin *.hex"), ("All files", "*.*")]
    
    file = filedialog.askopenfilename(filetypes=filetypes)
    if file:
        entry.delete(0, tk.END)
        entry.insert(0, file)


def refresh_ports(combo, project_combo=None):
    """Refresh the list of COM ports and auto-select best match based on port hint"""
    ports = list_serial_ports()
    combo["values"] = [p[1] for p in ports]
    
    if not ports:
        combo.set("❌ No serial ports found")
        return
    
    # Try to auto-select based on project's port hint
    best_match_idx = None
    if project_combo:
        project = project_combo.get()
        if project and PROJECTS.get(project):
            hint = PROJECTS[project].get("port_hint", "")
            if hint:
                # Look for port that matches the hint
                hint_keywords = hint.lower().split()
                best_score = 0
                
                for idx, (device, desc) in enumerate(ports):
                    desc_lower = desc.lower()
                    # Count how many hint keywords match
                    score = sum(1 for keyword in hint_keywords if keyword in desc_lower)
                    if score > best_score:
                        best_score = score
                        best_match_idx = idx
    
    # Set the selection
    if best_match_idx is not None:
        combo.current(best_match_idx)
    else:
        # No good match found - leave empty
        combo.set("")


def update_port_hint(project_combo, hint_label):
    """Update the port hint based on selected project"""
    project = project_combo.get()
    if project and PROJECTS.get(project):
        hint = PROJECTS[project].get("port_hint", "")
        hint_label.config(text=f"Serial Port (look for: {hint}):" if hint else "Serial Port:")
    else:
        hint_label.config(text="Serial Port:")


def export_sample_config():
    """Export a sample configuration file"""
    sample = {
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
    }
    
    with open("projects_config_sample.json", 'w') as f:
        json.dump(sample, f, indent=2)
    
    messagebox.showinfo("Success", "Sample config exported to 'projects_config_sample.json'")


def main():
    # Load any custom projects
    load_custom_projects()
    
    root = tk.Tk()
    root.title(f"Firmware Uploader v{VERSION}")
    root.geometry("700x600")
    
    # Menu bar
    menubar = tk.Menu(root)
    root.config(menu=menubar)
    
    file_menu = tk.Menu(menubar, tearoff=0)
    menubar.add_cascade(label="File", menu=file_menu)
    file_menu.add_command(label="Export Sample Config", command=export_sample_config)
    file_menu.add_separator()
    file_menu.add_command(label="Exit", command=root.quit)
    
    help_menu = tk.Menu(menubar, tearoff=0)
    menubar.add_cascade(label="Help", menu=help_menu)
    help_menu.add_command(
        label="How to Use",
        command=lambda: messagebox.showinfo(
            "How to Use",
            "1. Select your project from the dropdown\n"
            "2. Browse for your firmware file (.bin or .hex)\n"
            "3. Connect your device via USB\n"
            "4. Select the COM port\n"
            "5. Click 'Flash Firmware'\n\n"
            "Troubleshooting:\n"
            "• No ports? Click Refresh or install USB drivers\n"
            "• Upload failed? Check project selection and cable"
        )
    )
    help_menu.add_command(
        label="About",
        command=lambda: messagebox.showinfo(
            "About",
            f"Firmware Uploader v{VERSION}\n\n"
            "Simple tool for uploading firmware to\n"
            "ESP32, Arduino, and other devices.\n\n"
            "Supports: esptool, avrdude"
        )
    )
    
    # --- Project selector ---
    tk.Label(root, text="Project:", font=("Arial", 10, "bold")).pack(anchor="w", padx=10, pady=(10, 0))
    project_combo = ttk.Combobox(root, values=list(PROJECTS.keys()), width=60, state="readonly")
    project_combo.pack(anchor="w", padx=10, pady=5)
    if PROJECTS:
        project_combo.current(0)
    
    # --- Firmware selector ---
    tk.Label(root, text="Firmware File:", font=("Arial", 10, "bold")).pack(anchor="w", padx=10, pady=(10, 0))
    fw_frame = tk.Frame(root)
    fw_frame.pack(fill="x", padx=10, pady=5)
    firmware_entry = tk.Entry(fw_frame, width=70)
    firmware_entry.pack(side="left", fill="x", expand=True)
    tk.Button(
        fw_frame,
        text="Browse",
        command=lambda: select_firmware(firmware_entry, project_combo)
    ).pack(side="left", padx=5)
    
    # --- Serial port selector ---
    port_hint_label = tk.Label(root, text="Serial Port:", font=("Arial", 10, "bold"))
    port_hint_label.pack(anchor="w", padx=10, pady=(10, 0))
    
    port_frame = tk.Frame(root)
    port_frame.pack(fill="x", padx=10, pady=5)
    
    port_combo = ttk.Combobox(port_frame, width=50)
    port_combo.pack(side="left", fill="x", expand=True)
    refresh_ports(port_combo, project_combo)
    
    tk.Button(
        port_frame,
        text="🔄 Refresh",
        command=lambda: refresh_ports(port_combo, project_combo)
    ).pack(side="left", padx=5)
    
    # Update port hint and refresh port selection when project changes
    def on_project_change(event):
        update_port_hint(project_combo, port_hint_label)
        refresh_ports(port_combo, project_combo)
    
    project_combo.bind("<<ComboboxSelected>>", on_project_change)
    update_port_hint(project_combo, port_hint_label)
    
    # --- Flash button ---
    flash_button = tk.Button(
        root,
        text="🚀 Flash Firmware",
        font=("Arial", 12, "bold"),
        bg="#4CAF50",
        fg="white",
        command=lambda: flash_firmware(
            project_combo.get(),
            firmware_entry.get(),
            port_combo.get(),
            log,
            flash_button
        )
    )
    flash_button.pack(padx=10, pady=15)
    
    # --- Log output ---
    tk.Label(root, text="Log Output:", font=("Arial", 10, "bold")).pack(anchor="w", padx=10)
    log = scrolledtext.ScrolledText(root, wrap=tk.WORD, width=80, height=20)
    log.pack(fill="both", expand=True, padx=10, pady=(0, 10))
    
    log.insert(tk.END, f"Firmware Uploader v{VERSION}\n")
    log.insert(tk.END, f"Loaded {len(PROJECTS)} project configurations\n")
    log.insert(tk.END, "="*60 + "\n\n")
    
    root.mainloop()


if __name__ == "__main__":
    main()


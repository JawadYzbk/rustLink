import { EventEmitter } from 'events';

/**
 * This class is responsible for communicating with the RustCompanionManager running
 * in the main process.
 *
 * Events are sent from here in the renderer process via ipc to the main process,
 * and results are then sent back to the renderer process via ipc.
 */
export class RustCompanionReceiver extends EventEmitter {
  private ipcRenderer: any;

  constructor(electronAPI?: any) {
    super();
    
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.ipcRenderer = (window as any).electronAPI;
    } else if (electronAPI) {
      this.ipcRenderer = electronAPI;
    } else {
      console.warn('RustCompanionReceiver: electronAPI not available - running in development mode');
      return;
    }
    
    if (!this.ipcRenderer) {
      console.error('RustCompanionReceiver: electronAPI not available in renderer process');
      return;
    }

    // Register IPC channel handlers
    this.ipcRenderer.on('rust-companion-api.register.success', (data: any) => this.onRegisterSuccess(data));
    this.ipcRenderer.on('rust-companion-api.register.error', (data: any) => this.onRegisterError(data));
  }

  private onRegisterSuccess(data: any) {
    this.emit('register.success', data);
  }

  private onRegisterError(data: any) {
    this.emit('register.error', data);
  }

  /**
   * Ask the main process to register with Rust Companion API.
   *
   * Events Emitted:
   * - register.success
   * - register.error
   */
  register(deviceId: string, token: string, expoPushToken: string) {
    if (!this.ipcRenderer) {
      console.error('RustCompanionReceiver: Cannot register - electronAPI not available');
      return;
    }

    this.ipcRenderer.send('rust-companion-api.register', {
      deviceId: deviceId,
      token: token,
      expoPushToken: expoPushToken,
    });
  }
}
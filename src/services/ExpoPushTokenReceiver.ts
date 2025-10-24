import { EventEmitter } from 'events';

/**
 * This class is responsible for communicating with the ExpoPushTokenManager running
 * in the main process.
 *
 * Events are sent from here in the renderer process via ipc to the main process,
 * and results are then sent back to the renderer process via ipc.
 */
export class ExpoPushTokenReceiver extends EventEmitter {
  private ipcRenderer: any;

  constructor(electronAPI?: any) {
    super();
    
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.ipcRenderer = (window as any).electronAPI;
    } else if (electronAPI) {
      this.ipcRenderer = electronAPI;
    } else {
      console.warn('ExpoPushTokenReceiver: electronAPI not available - running in development mode');
      return;
    }
    
    if (!this.ipcRenderer) {
      console.error('ExpoPushTokenReceiver: electronAPI not available in renderer process');
      return;
    }

    // Register IPC channel handlers
    this.ipcRenderer.on('expo-push-token.register.success', (data: any) => this.onRegisterSuccess(data));
    this.ipcRenderer.on('expo-push-token.register.error', (data: any) => this.onRegisterError(data));
  }

  private onRegisterSuccess(data: any) {
    this.emit('register.success', data);
  }

  private onRegisterError(data: any) {
    this.emit('register.error', data);
  }

  /**
   * Ask the main process to register an Expo Push Token for an fcmToken.
   *
   * Events Emitted:
   * - register.success
   * - register.error
   */
  register(deviceId: string, projectId: string, appId: string, fcmToken: string) {
    if (!this.ipcRenderer) {
      console.error('ExpoPushTokenReceiver: Cannot register - electronAPI not available');
      return;
    }

    this.ipcRenderer.send('expo-push-token.register', {
      type: 'fcm',
      deviceId: deviceId,
      development: false,
      appId: appId,
      deviceToken: fcmToken,
      projectId: projectId,
    });
  }
}
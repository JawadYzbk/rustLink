import { EventEmitter } from 'events';

export interface RustPlusCredentials {
  fcmToken?: string;
  gcmToken?: string;
  androidId?: string;
  securityToken?: string;
  expoPushToken?: string;
}

export class RustPlusJSService extends EventEmitter {
  private isReady = false;
  private credentials: RustPlusCredentials | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      // Load existing credentials
      this.loadCredentials();
      
      if (this.credentials && this.credentials.expoPushToken) {
        console.log('RustPlusJSService: Found existing credentials');
        this.isReady = true;
        this.emit('ready', this.credentials);
      } else {
        console.log('RustPlusJSService: No credentials found, needs registration');
        this.emit('needsRegistration');
      }
    } catch (error) {
      console.error('RustPlusJSService initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Load credentials from localStorage
   */
  private loadCredentials(): void {
    try {
      const saved = localStorage.getItem('rustlink-rustplus-credentials');
      if (saved) {
        this.credentials = JSON.parse(saved);
        console.log('RustPlusJSService: Loaded credentials from localStorage');
      }
    } catch (error) {
      console.warn('Could not load RustPlus credentials:', error);
    }
  }

  /**
   * Save credentials to localStorage
   */
  private saveCredentials(): void {
    try {
      if (this.credentials) {
        localStorage.setItem('rustlink-rustplus-credentials', JSON.stringify(this.credentials));
        console.log('RustPlusJSService: Saved credentials to localStorage');
      }
    } catch (error) {
      console.warn('Could not save RustPlus credentials:', error);
    }
  }

  /**
   * Register with FCM/Expo using rustplus.js
   * This should be called from the main process via IPC
   */
  async register(): Promise<void> {
    try {
      console.log('RustPlusJSService: Triggering FCM registration via main process IPC');
      
      // Send IPC message to main process to trigger FCM registration
      // This will use the actual rustplus.js fcm-register command
      if (window.electronAPI && window.electronAPI.send) {
        console.log('RustPlusJSService: Sending push-receiver.register IPC message');
        
        // Send the registration request via IPC
        window.electronAPI.send('push-receiver.register', {
          apiKey: 'AIzaSyBkK3Q2YQ2YQ2YQ2YQ2YQ2YQ2YQ2YQ2YQ2Y', // Placeholder API key
          projectId: 'rust-companion-app',
          gcmSenderId: '49625052041',
          gmsAppId: '1:49625052041:android:5f601b8b8b8b8b8b',
          androidPackageName: 'com.facepunch.rust.companion',
          androidPackageCert: '5F601B8B8B8B8B8B8B8B8B8B8B8B8B8B8B8B8B8B'
        });
        
        // Listen for the response
        return new Promise((resolve, reject) => {
          const successHandler = (event: any, data: any) => {
            console.log('RustPlusJSService: FCM registration successful:', data);
            if (data.credentials) {
              this.credentials = {
                expoPushToken: data.credentials.expoPushToken || '',
                fcmToken: data.credentials.fcm?.token || '',
                gcmToken: data.credentials.gcm?.token || '',
                androidId: data.credentials.gcm?.androidId || '',
                securityToken: data.credentials.gcm?.securityToken || ''
              };
              this.saveCredentials();
              this.isReady = true;
              this.emit('ready', this.credentials);
              
              // Clean up listeners
              window.electronAPI.removeAllListeners('push-receiver.register.success');
              window.electronAPI.removeAllListeners('push-receiver.register.error');
              resolve();
            }
          };
          
          const errorHandler = (event: any, data: any) => {
            console.error('RustPlusJSService: FCM registration failed:', data.error);
            
            // Clean up listeners
            window.electronAPI.removeAllListeners('push-receiver.register.success');
            window.electronAPI.removeAllListeners('push-receiver.register.error');
            reject(new Error(data.error));
          };
          
          // Set up listeners
          window.electronAPI.on('push-receiver.register.success', successHandler);
          window.electronAPI.on('push-receiver.register.error', errorHandler);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.electronAPI.removeAllListeners('push-receiver.register.success');
            window.electronAPI.removeAllListeners('push-receiver.register.error');
            reject(new Error('FCM registration timeout'));
          }, 30000);
        });
        
      } else {
        console.warn('RustPlusJSService: electronAPI not available, using simulated credentials for development');
        
        // Fallback to simulated credentials for development
        const simulatedCredentials: RustPlusCredentials = {
          expoPushToken: 'ExponentPushToken[VPwAFWE9tP623ioITUrTvt]',
          fcmToken: 'simulated-fcm-token',
          gcmToken: 'simulated-gcm-token',
          androidId: 'simulated-android-id',
          securityToken: 'simulated-security-token'
        };
        
        this.credentials = simulatedCredentials;
        this.saveCredentials();
        this.isReady = true;
        this.emit('ready', this.credentials);
      }
      
    } catch (error) {
      console.error('RustPlusJSService registration failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check if service is ready
   */
  isServiceReady(): boolean {
    return this.isReady;
  }

  /**
   * Get current credentials
   */
  getCredentials(): RustPlusCredentials | null {
    return this.credentials;
  }

  /**
   * Set credentials (called when received from main process)
   */
  setCredentials(credentials: RustPlusCredentials): void {
    this.credentials = credentials;
    this.saveCredentials();
    this.isReady = true;
    this.emit('ready', this.credentials);
  }

  /**
   * Get Expo Push Token
   */
  getExpoPushToken(): string | null {
    return this.credentials?.expoPushToken || null;
  }

  /**
   * Clear stored credentials (for re-registration)
   */
  async clearCredentials(): Promise<void> {
    try {
      localStorage.removeItem('rustlink-rustplus-credentials');
      this.credentials = null;
      this.isReady = false;
      console.log('RustPlusJSService: Credentials cleared');
    } catch (error) {
      console.error('RustPlusJSService: Failed to clear credentials:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rustPlusJSService = new RustPlusJSService();
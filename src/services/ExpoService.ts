import { EventEmitter } from 'events';
import { rustPlusJSService, RustPlusCredentials } from './RustPlusJSService';
import { ExpoPushTokenReceiver } from './ExpoPushTokenReceiver';
import { fcmService } from './FCMService';

export class ExpoService extends EventEmitter {
  private isInitialized = false;
  private expoPushToken: string | null = null;
  private fcmToken: string | null = null;
  private expoReceiver: ExpoPushTokenReceiver | null = null;

  constructor() {
    super();
    this.initialize();
    this.initializeExpoReceiver();
  }

  private async initialize() {
    try {
      // Set up RustPlusJS service integration
      this.setupRustPlusJSIntegration();
      
      // Set up FCM service integration
      this.setupFCMIntegration();

    } catch (error) {
      console.error('Expo service initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize Expo push token receiver
   */
  private initializeExpoReceiver() {
    try {
      this.expoReceiver = new ExpoPushTokenReceiver();
      
      // Set up event listeners for Expo receiver
      this.expoReceiver.on('register.success', (data: any) => {
        console.log('Expo registration successful:', data);
        this.expoPushToken = data.expoPushToken;
        this.isInitialized = true;
        this.emit('ready');
      });
      
      this.expoReceiver.on('register.error', (error: any) => {
        console.error('Expo registration failed:', error);
        this.emit('error', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize Expo receiver:', error);
    }
  }

  /**
   * Set up integration with FCM service to get FCM token
   */
  private setupFCMIntegration() {
    // Listen for FCM service being ready
    fcmService.on('ready', () => {
      console.log('ExpoService: FCM service ready');
      
      // Get FCM credentials and extract token
      const fcmCredentials = fcmService.getCredentials();
      if (fcmCredentials && fcmCredentials.fcm && fcmCredentials.fcm.token) {
        console.log('ExpoService: FCM token received:', fcmCredentials.fcm.token);
        // Store FCM token for use in registration
        this.fcmToken = fcmCredentials.fcm.token;
      }
    });

    fcmService.on('error', (error: any) => {
      console.error('ExpoService: FCM service error:', error);
      this.emit('error', error);
    });

    // If FCM service is already ready, get the token immediately
    if (fcmService.isReady()) {
      const fcmCredentials = fcmService.getCredentials();
      if (fcmCredentials && fcmCredentials.fcm && fcmCredentials.fcm.token) {
        console.log('ExpoService: FCM service already ready, using existing token');
        this.fcmToken = fcmCredentials.fcm.token;
      }
    }
  }

  /**
   * Set up integration with RustPlusJS service
   */
  private setupRustPlusJSIntegration() {
    // Listen for RustPlusJS service being ready
    rustPlusJSService.on('ready', (credentials: RustPlusCredentials) => {
      console.log('ExpoService: RustPlusJS credentials received');
      this.expoPushToken = credentials.expoPushToken;
      this.isInitialized = true;
      this.emit('ready');
    });

    rustPlusJSService.on('error', (error: any) => {
      console.error('ExpoService: RustPlusJS service error:', error);
      this.emit('error', error);
    });

    rustPlusJSService.on('needsRegistration', () => {
      console.log('ExpoService: RustPlusJS needs registration');
      this.emit('needsRegistration');
    });

    // If RustPlusJS is already ready, use its credentials
    if (rustPlusJSService.isServiceReady()) {
      const credentials = rustPlusJSService.getCredentials();
      if (credentials) {
        console.log('ExpoService: RustPlusJS already ready, using existing credentials');
        this.expoPushToken = credentials.expoPushToken;
        this.isInitialized = true;
        this.emit('ready');
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Trigger registration with Expo service
   */
  async register(): Promise<void> {
    if (this.expoReceiver) {
      console.log('ExpoService: Triggering direct Expo registration...');
      
      // Use real FCM token from FCM service if available
      const fcmTokenToUse = this.fcmToken || 'placeholder-fcm-token';
      console.log('ExpoService: Using FCM token:', fcmTokenToUse);
      
      // Use hardcoded values similar to Vue repo for direct Expo registration
      const deviceId = 'rustlink-device';
      const projectId = 'rust-companion-app';
      const appId = 'com.facepunch.rust.companion';
      
      this.expoReceiver.register(deviceId, projectId, appId, fcmTokenToUse);
    } else if (!rustPlusJSService.isServiceReady()) {
      console.log('ExpoService: Triggering RustPlusJS registration...');
      await rustPlusJSService.register();
    }
  }

  async sendPushNotification(token: string, title: string, body: string) {
    if (!this.isInitialized) {
      throw new Error('Expo service not initialized');
    }
    
    // Placeholder for Expo push notification sending
    console.log('Expo push notification sent:', { token, title, body });
  }
}

// Export singleton instance
export const expoService = new ExpoService();
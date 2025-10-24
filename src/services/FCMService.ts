import { EventEmitter } from 'events';
import { notificationService } from './NotificationService';
import { rustPlusJSService, RustPlusCredentials } from './RustPlusJSService';
import { FCMNotificationReceiver } from './FCMNotificationReceiver';

export interface FCMNotificationData {
  persistentId: string;
  sent: string;
  appData: Array<{
    key: string;
    value: string;
  }>;
}

export interface FCMCredentials {
  fcm: {
    token: string;
    pushSet: string;
  };
  gcm: {
    token: string;
    androidId: string;
    securityToken: string;
  };
}

export class FCMService extends EventEmitter {
  private isInitialized = false;
  private isListening = false;
  private credentials: FCMCredentials | null = null;
  private lastNotificationTimestamp = 0;
  private persistentIds: string[] = [];
  private fcmReceiver: FCMNotificationReceiver | null = null;

  constructor() {
    super();
    this.loadLastTimestamp();
    this.loadPersistentIds();
    this.initialize();
    this.initializeFCMReceiver();
  }

  private async initialize() {
    try {
      // Set up RustPlusJS service integration
      this.setupRustPlusJSIntegration();
      
    } catch (error) {
      console.error('FCM service initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize FCM notification receiver
   */
  private initializeFCMReceiver() {
    try {
      this.fcmReceiver = new FCMNotificationReceiver();
      
      // Set up event listeners for FCM receiver
      this.fcmReceiver.on('register.success', (data: any) => {
        console.log('FCM registration successful:', data);
        this.emit('registerSuccess', data);
      });
      
      this.fcmReceiver.on('register.error', (error: any) => {
        console.error('FCM registration failed:', error);
        this.emit('registerError', error);
      });
      
      this.fcmReceiver.on('notifications.listen.started', () => {
        console.log('FCM notification listening started');
        this.emit('listeningStarted');
      });
      
      this.fcmReceiver.on('notifications.listen.stopped', () => {
        console.log('FCM notification listening stopped');
        this.emit('listeningStopped');
      });
      
      this.fcmReceiver.on('notifications.received', (data: any) => {
        console.log('FCM notification received:', data);
        this.processNotification(data);
      });
      
      this.fcmReceiver.on('notifications.error', (error: any) => {
        console.error('FCM notification error:', error);
        this.emit('notificationError', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize FCM receiver:', error);
    }
  }

  /**
   * Set up integration with RustPlusJS service
   */
  private setupRustPlusJSIntegration() {
    // Listen for RustPlusJS service being ready
    rustPlusJSService.on('ready', (rustPlusCredentials: RustPlusCredentials) => {
      console.log('FCMService: RustPlusJS credentials received');
      
      // Convert RustPlusJS credentials to FCM format
      this.credentials = {
        fcm: {
          token: rustPlusCredentials.fcmToken || '',
          pushSet: ''
        },
        gcm: {
          token: rustPlusCredentials.gcmToken || '',
          androidId: rustPlusCredentials.androidId || '',
          securityToken: rustPlusCredentials.securityToken || ''
        }
      };

      this.isInitialized = true;
      this.emit('credentialsSet', this.credentials);
      this.emit('ready');
      
      // Automatically start listening when credentials are received
      this.startListening();
    });

    rustPlusJSService.on('error', (error: any) => {
      console.error('FCMService: RustPlusJS service error:', error);
      this.emit('error', error);
    });

    rustPlusJSService.on('needsRegistration', () => {
      console.log('FCMService: RustPlusJS needs registration');
      this.emit('needsRegistration');
    });

    // If RustPlusJS is already ready, use its credentials
    if (rustPlusJSService.isServiceReady()) {
      const rustPlusCredentials = rustPlusJSService.getCredentials();
      if (rustPlusCredentials) {
        console.log('FCMService: RustPlusJS already ready, using existing credentials');
        
        this.credentials = {
          fcm: {
            token: rustPlusCredentials.fcmToken || '',
            pushSet: ''
          },
          gcm: {
            token: rustPlusCredentials.gcmToken || '',
            androidId: rustPlusCredentials.androidId || '',
            securityToken: rustPlusCredentials.securityToken || ''
          }
        };

        this.isInitialized = true;
        this.emit('credentialsSet', this.credentials);
        this.emit('ready');
        
        // Automatically start listening when credentials are received
        this.startListening();
      }
    }
  }

  /**
   * Start listening for FCM notifications
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('FCM service not initialized');
    }

    if (this.isListening) {
      console.log('FCM service already listening');
      return;
    }

    try {
      if (this.fcmReceiver && this.credentials) {
        // Use direct FCM notification listening
        console.log('FCM Service: Starting direct FCM notification listening...');
        this.fcmReceiver.startListeningForNotifications(this.credentials, this.persistentIds);
        this.isListening = true;
      } else {
        // Fallback to RustPlusJS service for notification listening
        console.log('FCM Service: Starting notification listening via RustPlusJS...');
        this.isListening = true;
        this.emit('listeningStarted');
      }
    } catch (error) {
      console.error('Failed to start FCM listening:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop listening for FCM notifications
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.log('FCM service not listening');
      return;
    }

    try {
      if (this.fcmReceiver) {
        // Use direct FCM notification stopping
        console.log('FCM Service: Stopping direct FCM notification listening...');
        this.fcmReceiver.stopListeningForNotifications();
      } else {
        console.log('FCM Service: Stopping notification listening...');
      }
      this.isListening = false;
      this.emit('listeningStopped');
    } catch (error) {
      console.error('Failed to stop FCM listening:', error);
      this.emit('error', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async sendNotification(token: string, title: string, body: string) {
    if (!this.isInitialized) {
      throw new Error('FCM service not initialized');
    }
    
    // Placeholder for FCM notification sending
    console.log('FCM notification sent:', { token, title, body });
  }

  /**
   * Process FCM notification data
   */
  processNotification(data: FCMNotificationData): void {
    console.log("=== FCM Notification Received ===");
    console.log("Full notification data:", JSON.stringify(data, null, 2));

    // Check if this notification is new based on timestamp
    const notificationTimestamp = parseInt(data.sent);
    
    console.log("Notification timestamp:", notificationTimestamp);
    console.log("Last stored timestamp:", this.lastNotificationTimestamp);
    
    // Check if this notification is older than or equal to the last processed one
    if (notificationTimestamp <= this.lastNotificationTimestamp) {
      console.log("Notification is old or duplicate, skipping processing");
      return;
    }
    
    console.log("Notification is new, processing...");
    this.lastNotificationTimestamp = notificationTimestamp;
    this.saveLastTimestamp();

    // Make sure app data exists
    const appData = data.appData;
    if (!appData) {
      console.log("FCM notification appData is null!");
      return;
    }

    console.log("AppData found:", appData);
    
    // Log all appData keys and values for debugging
    console.log("=== DEBUG: All appData entries ===");
    appData.forEach((item, index) => {
      console.log(`appData[${index}]: key="${item.key}", value="${item.value}"`);
    });
    console.log("=== END DEBUG ===");

    // Make sure app data has body
    const body = appData.find((item) => item.key === "body");
    if (!body) {
      console.log("FCM notification appData has no body!");
      return;
    }

    console.log("Body found:", body.value);

    // Parse body
    let notificationBody: any;
    try {
      notificationBody = JSON.parse(body.value);
      console.log("Parsed notification body:", notificationBody);
    } catch (error) {
      console.log("Failed to parse notification body:", error);
      return;
    }

    // Check for channel in appData (Rust+ API notifications)
    const channelData = appData.find((item) => item.key === "channel");
    if (channelData) {
      console.log("Channel found in appData:", channelData.value);
      notificationBody.channel = parseInt(channelData.value);
    }

    // Process different notification types
    this.processNotificationByType(notificationBody, appData);
  }

  /**
   * Process notification based on its type or channel
   */
  private processNotificationByType(notificationBody: any, appData: any[]): void {
    const channel = notificationBody.channel;
    const channelId = appData.find(item => item.key === 'channelId')?.value;
    
    // Check if this is an entity/switch pairing notification
    const isEntityPairingNotification = notificationBody.entityId && 
                                       notificationBody.entityName && 
                                       notificationBody.entityType;
    
    // Check if this is a server pairing notification
    const isServerPairingNotification = notificationBody.type === 'server' || 
                                       (notificationBody.ip && notificationBody.port && 
                                        notificationBody.playerId && notificationBody.playerToken);
    
    // Check if this is a death notification (channel 1003)
    const isDeathNotification = channel === 1003 || channelId === '1003' || 
                               notificationBody.type === 'player_death';
    
    // Check if this is an alarm notification (channel 1004)
    const isAlarmNotification = channel === 1004 || channelId === '1004' || 
                               channelId === 'alarm' || notificationBody.type === 'alarm';

    if (isEntityPairingNotification) {
      console.log("Entity pairing notification detected");
      this.handleEntityPairingNotification(notificationBody, appData);
    } else if (isServerPairingNotification) {
      console.log("Server pairing notification detected");
      this.handleServerPairingNotification(notificationBody, appData);
    } else if (isDeathNotification) {
      console.log("Death notification detected");
      this.handleDeathNotification(notificationBody, appData);
    } else if (isAlarmNotification) {
      console.log("Alarm notification detected");
      this.handleAlarmNotification(notificationBody, appData);
    } else {
      console.log("Generic notification detected");
      this.handleGenericNotification(notificationBody, appData);
    }
  }

  /**
   * Handle entity pairing notifications
   */
  private handleEntityPairingNotification(notificationBody: any, appData: any[]): void {
    notificationService.createEntityPairingNotification({
      entityId: notificationBody.entityId,
      entityType: notificationBody.entityType,
      entityName: notificationBody.entityName,
      description: notificationBody.desc || notificationBody.body
    });
  }

  /**
   * Handle server pairing notifications
   */
  private handleServerPairingNotification(notificationBody: any, appData: any[]): void {
    const ip = notificationBody.ip || appData.find(item => item.key === 'ip')?.value;
    const port = notificationBody.port || appData.find(item => item.key === 'port')?.value;
    
    notificationService.createServerPairingNotification({
      serverName: notificationBody.name || 'Unknown Server',
      ip: ip || '',
      port: port || '',
      playerId: notificationBody.playerId || '',
      playerToken: notificationBody.playerToken || '',
      description: notificationBody.desc || notificationBody.body
    });
  }

  /**
   * Handle death notifications (channel 1003)
   */
  private handleDeathNotification(notificationBody: any, appData: any[]): void {
    // Extract player name from title or body
    const title = notificationBody.title || appData.find(item => item.key === 'title')?.value || '';
    const message = notificationBody.body || notificationBody.desc || '';
    
    // Try to parse player name from the message
    let playerName = 'Unknown Player';
    let killer = undefined;
    let weapon = undefined;
    
    // Common death message patterns: "PlayerName died", "PlayerName was killed by Killer"
    if (message.includes(' died')) {
      const match = message.match(/^(.+?) died/);
      if (match) playerName = match[1];
    } else if (message.includes(' was killed by ')) {
      const match = message.match(/^(.+?) was killed by (.+?)(?:\s+with\s+(.+))?$/);
      if (match) {
        playerName = match[1];
        killer = match[2];
        weapon = match[3];
      }
    }
    
    notificationService.createPlayerDeathNotification({
      steamId: notificationBody.steamId || 'unknown',
      name: playerName,
      killer,
      weapon
    });
  }

  /**
   * Handle alarm notifications (channel 1004)
   */
  private handleAlarmNotification(notificationBody: any, appData: any[]): void {
    // Look for message and title in appData (prioritize these over notification body)
    const messageData = appData.find(item => item.key === 'message');
    const titleData = appData.find(item => item.key === 'title');
    const gcmBodyData = appData.find(item => item.key === 'gcm.notification.body');
    const gcmTitleData = appData.find(item => item.key === 'gcm.notification.title');
    
    let notificationMessage = notificationBody.body || notificationBody.desc || '';
    let notificationTitle = notificationBody.title || 'Smart Alarm';
    
    // Use the direct message/title fields from appData for alarm notifications
    if (messageData) {
      notificationMessage = messageData.value;
    } else if (gcmBodyData) {
      notificationMessage = gcmBodyData.value;
    }
    
    if (titleData) {
      notificationTitle = titleData.value;
    } else if (gcmTitleData) {
      notificationTitle = gcmTitleData.value;
    }
    
    // Extract entity ID if available
    const entityId = notificationBody.entityId || 
                    appData.find(item => item.key === 'entityId')?.value || 0;
    
    notificationService.createSmartAlarmNotification({
      entityId: parseInt(entityId.toString()),
      entityName: notificationTitle,
      alarmType: 'smart_alarm',
      message: notificationMessage
    });
  }

  /**
   * Handle generic notifications
   */
  private handleGenericNotification(notificationBody: any, appData: any[]): void {
    const title = notificationBody.title || 
                 appData.find(item => item.key === 'title')?.value || 
                 'Rust+ Notification';
    const message = notificationBody.body || 
                   notificationBody.desc || 
                   appData.find(item => item.key === 'message')?.value || 
                   'New notification received';
    
    notificationService.addNotification({
      type: 'info',
      title,
      message,
      data: notificationBody,
      read: false
    });
  }

  /**
   * Load last notification timestamp from localStorage
   */
  private loadLastTimestamp(): void {
    try {
      const saved = localStorage.getItem('rustlink-fcm-last-timestamp');
      if (saved) {
        this.lastNotificationTimestamp = parseInt(saved);
      }
    } catch (error) {
      console.warn('Could not load last FCM timestamp:', error);
    }
  }

  /**
   * Save last notification timestamp to localStorage
   */
  private saveLastTimestamp(): void {
    try {
      localStorage.setItem('rustlink-fcm-last-timestamp', this.lastNotificationTimestamp.toString());
    } catch (error) {
      console.warn('Could not save last FCM timestamp:', error);
    }
  }

  /**
   * Load persistent IDs from localStorage
   */
  private loadPersistentIds(): void {
    try {
      const saved = localStorage.getItem('rustlink-fcm-persistent-ids');
      if (saved) {
        this.persistentIds = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Could not load FCM persistent IDs:', error);
      this.persistentIds = [];
    }
  }

  /**
   * Save persistent IDs to localStorage
   */
  private savePersistentIds(): void {
    try {
      localStorage.setItem('rustlink-fcm-persistent-ids', JSON.stringify(this.persistentIds));
    } catch (error) {
      console.warn('Could not save FCM persistent IDs:', error);
    }
  }

  /**
   * Load FCM credentials from localStorage (deprecated - now using RustPlusJS)
   */
  private loadCredentials(): void {
    // No longer needed - credentials come from RustPlusJS service
    console.log('FCMService: loadCredentials() deprecated - using RustPlusJS service');
  }

  /**
   * Save FCM credentials to localStorage (deprecated - now using RustPlusJS)
   */
  private saveCredentials(): void {
    // No longer needed - credentials managed by RustPlusJS service
    console.log('FCMService: saveCredentials() deprecated - using RustPlusJS service');
  }

  /**
   * Set FCM credentials
   */
  setCredentials(credentials: FCMCredentials): void {
    this.credentials = credentials;
    this.emit('credentialsSet', credentials);
  }

  /**
   * Get FCM credentials
   */
  getCredentials(): FCMCredentials | null {
    return this.credentials;
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
export const fcmService = new FCMService();
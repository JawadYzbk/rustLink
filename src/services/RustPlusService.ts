import { EventEmitter } from 'events';
import * as protobuf from 'protobufjs';
import Long from 'long';
import { v4 as uuidv4 } from 'uuid';
import { fcmService } from './FCMService';
import { RustCompanionReceiver } from './RustCompanionReceiver';

export interface RustPlusServer {
  id: string;
  name: string;
  ip: string;
  port: number;
  playerId: string;
  playerToken: string;
  isConnected: boolean;
  lastSeen?: Date;
}

export interface RustPlusMessage {
  seq: number;
  playerId: Long;
  playerToken: Long;
  entityId?: number;
  [key: string]: any;
}

export interface EntityInfo {
  type: number;
  payload: {
    value?: boolean;
    items?: Array<{
      itemId: number;
      quantity: number;
      itemIsBlueprint?: boolean;
    }>;
    capacity?: number;
    hasProtection?: boolean;
    protectionExpiry?: number;
  };
}

export interface ServerInfo {
  name: string;
  headerImage: string;
  url: string;
  map: string;
  mapSize: number;
  wipeTime: number;
  players: number;
  maxPlayers: number;
  queuedPlayers?: number;
  seed?: number;
  salt?: number;
}

export interface TeamInfo {
  leaderSteamId: Long;
  members: Array<{
    steamId: Long;
    name: string;
    x: number;
    y: number;
    isOnline?: boolean;
    spawnTime?: number;
    isAlive?: boolean;
    deathTime?: number;
  }>;
  mapNotes: Array<{
    type?: number;
    x: number;
    y: number;
  }>;
  leaderMapNotes: Array<{
    type?: number;
    x: number;
    y: number;
  }>;
}

export interface ChatMessage {
  steamId: Long;
  name: string;
  message: string;
  color: string;
  time: number;
}

export class RustPlusService extends EventEmitter {
  private websocket: WebSocket | null = null;
  private protocolVersion = 1601585622782;
  private seq = 0;
  private seqCallbacks: { [key: number]: (message: any) => boolean } = {};
  private server: RustPlusServer | null = null;
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private autoRefreshTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private rustCompanionReceiver: RustCompanionReceiver | null = null;
  
  // Protocol buffer types
  private AppMessage: protobuf.Type | null = null;
  private AppRequest: protobuf.Type | null = null;

  constructor() {
    super();
    // Initialize protocol buffers immediately and synchronously
    this.initializeProtocolBuffersSync();
    
    // Initialize FCM service integration
    this.initializeFCMIntegration();
    
    // Initialize Rust companion receiver
    this.initializeRustCompanionReceiver();
  }

  /**
   * Initialize FCM service integration
   */
  private initializeFCMIntegration() {
    // Listen for FCM service events
    fcmService.on('ready', () => {
      console.log('RustPlusService: FCM service is ready');
    });
    
    fcmService.on('error', (error) => {
      console.error('RustPlusService: FCM service error:', error);
    });
    
    // Start FCM listening when service is ready
    if (fcmService.isReady()) {
      fcmService.startListening();
    } else {
      fcmService.once('ready', () => {
        fcmService.startListening();
      });
    }
  }

  /**
   * Initialize Rust companion receiver
   */
  private initializeRustCompanionReceiver() {
    this.rustCompanionReceiver = new RustCompanionReceiver();
    
    this.rustCompanionReceiver.on('register.success', () => {
      console.log('RustPlusService: Rust companion registration successful');
      this.isInitialized = true;
      this.emit('ready');
    });
    
    this.rustCompanionReceiver.on('register.error', (data: any) => {
      console.error('RustPlusService: Rust companion registration failed:', data.error);
      this.emit('error', data.error);
    });
  }

  /**
   * Initialize protocol buffer types synchronously (like Vue repo)
   */
  private initializeProtocolBuffersSync() {
    console.log('RustPlusService: Starting synchronous protocol buffer initialization...');
    
    // Configure Long support for protobufjs (like in Vue repo)
    if (protobuf.util && protobuf.util.Long !== Long) {
      protobuf.util.Long = Long;
      protobuf.configure();
      console.log('RustPlusService: Configured Long support for protobufjs');
    }
    
    // Start async loading but don't wait for it in constructor
    this.loadProtocolBuffers();
  }

  /**
   * Load protocol buffers asynchronously
   */
  private async loadProtocolBuffers() {
    try {
      console.log('RustPlusService: Loading protocol buffers...');
      
      // Use the correct path for Electron - just 'rustplus.proto' works in Electron
      const protoPath = 'rustplus.proto';
      
      console.log('RustPlusService: Loading proto file from:', protoPath);
      console.log('RustPlusService: Current location:', window.location.href);
      
      const root = await protobuf.load(protoPath);
      this.AppMessage = root.lookupType('rustplus.AppMessage');
      this.AppRequest = root.lookupType('rustplus.AppRequest');
      
      console.log('RustPlusService: Protocol buffers loaded successfully');
      console.log('RustPlusService: AppMessage type:', this.AppMessage ? 'loaded' : 'failed');
      console.log('RustPlusService: AppRequest type:', this.AppRequest ? 'loaded' : 'failed');
      
      if (!this.AppMessage || !this.AppRequest) {
        throw new Error('Failed to lookup AppMessage or AppRequest types');
      }
      
      this.isInitialized = true;
      
      // Emit ready event when protocol buffers are loaded
      this.emit('protocolBuffersReady');
      console.log('RustPlusService: Emitted protocolBuffersReady event');
    } catch (error) {
      console.error('RustPlusService: Failed to load protocol buffers:', error);
      console.error('RustPlusService: Error details:', {
        message: error.message,
        stack: error.stack,
        protoPath: 'rustplus.proto',
        location: window.location.href
      });
      this.isInitialized = false;
      this.emit('error', new Error(`Failed to initialize protocol buffers: ${error.message}`));
    }
  }

  /**
   * Connect to a Rust+ server
   */
  async connect(server: RustPlusServer): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') {
      throw new Error('Already connected or connecting');
    }

    if (!this.AppMessage || !this.AppRequest) {
      throw new Error('Protocol buffers not initialized');
    }

    this.server = server;
    this.status = 'connecting';
    this.emit('statusChanged', this.status);

    try {
      const wsUrl = `ws://${server.ip}:${server.port}?v=${this.protocolVersion}`;
      this.websocket = new WebSocket(wsUrl);
      this.websocket.binaryType = 'arraybuffer';

      this.websocket.onopen = this.onConnected.bind(this);
      this.websocket.onclose = this.onDisconnected.bind(this);
      this.websocket.onerror = this.onError.bind(this);
      this.websocket.onmessage = this.onMessage.bind(this);

    } catch (error) {
      this.status = 'error';
      this.emit('statusChanged', this.status);
      throw error;
    }
  }

  /**
   * Disconnect from the current server
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.status = 'disconnected';
    this.emit('statusChanged', this.status);
  }

  /**
   * Send a request to the Rust+ server
   */
  sendRequest(data: Partial<RustPlusMessage>, callback?: (message: any) => boolean): void {
    if (!this.websocket || this.status !== 'connected' || !this.server || !this.AppRequest) {
      throw new Error('Not connected to server');
    }

    // Increment sequence number
    const currentSeq = ++this.seq;

    // Save callback if provided
    if (callback) {
      this.seqCallbacks[currentSeq] = callback;
    }

    // Create base payload
    const payload: RustPlusMessage = {
      seq: currentSeq,
      playerId: Long.fromString(this.server.playerId),
      playerToken: Long.fromString(this.server.playerToken),
      ...data
    };

    // Create and send the message
    const message = this.AppRequest.fromObject(payload);
    const encoded = this.AppRequest.encode(message).finish();
    this.websocket.send(encoded);

    this.emit('messageSent', message);
  }

  /**
   * Get server information
   */
  getServerInfo(): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ getInfo: {} }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to get server info'));
        } else if (message.response?.info) {
          resolve(message.response.info);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Get team information
   */
  getTeamInfo(): Promise<TeamInfo> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ getTeamInfo: {} }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to get team info'));
        } else if (message.response?.teamInfo) {
          resolve(message.response.teamInfo);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Get entity information
   */
  getEntityInfo(entityId: number): Promise<EntityInfo> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ entityId, getEntityInfo: {} }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to get entity info'));
        } else if (message.response?.entityInfo) {
          resolve(message.response.entityInfo);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Set entity value (for smart switches)
   */
  setEntityValue(entityId: number, value: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ entityId, setEntityValue: { value } }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to set entity value'));
        } else if (message.response?.success) {
          resolve();
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Subscribe to entity updates
   */
  subscribeToEntity(entityId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ entityId, setSubscription: { value: true } }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to subscribe to entity'));
        } else if (message.response?.flag) {
          resolve();
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Unsubscribe from entity updates
   */
  unsubscribeFromEntity(entityId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ entityId, setSubscription: { value: false } }, (message) => {
        if (message.response?.error) {
          reject(new Error(message.response.error.error || 'Failed to unsubscribe from entity'));
        } else if (message.response?.flag) {
          resolve();
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Send team chat message
   */
  sendTeamMessage(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendRequest({ sendTeamMessage: { message } }, (response) => {
        if (response.response?.error) {
          reject(new Error(response.response.error.error || 'Failed to send message'));
        } else if (response.response?.success) {
          resolve();
        } else {
          reject(new Error('Invalid response received'));
        }
        return true;
      });
    });
  }

  /**
   * Check if the service is ready (protocol buffers loaded)
   */
  isReady(): boolean {
    const ready = this.AppMessage !== null && this.AppRequest !== null && this.isInitialized;
    console.log('RustPlusService: isReady() called, result:', ready, {
      AppMessage: this.AppMessage !== null,
      AppRequest: this.AppRequest !== null,
      isInitialized: this.isInitialized
    });
    return ready;
  }

  /**
   * Get current server status
   */
  getStatus(): string {
    return this.status;
  }

  /**
   * Get current server
   */
  getCurrentServer(): RustPlusServer | null {
    return this.server;
  }

  // Private event handlers
  private onConnected(): void {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.emit('statusChanged', this.status);
    this.emit('connected', this.server);

    // Start auto-refresh timer for server info
    this.autoRefreshTimer = setInterval(() => {
      this.refreshServerData();
    }, 30000); // Refresh every 30 seconds
  }

  private onDisconnected(): void {
    this.clearTimers();
    
    if (this.status === 'connected') {
      this.status = 'disconnected';
      this.emit('statusChanged', this.status);
      this.emit('disconnected', this.server);

      // Attempt to reconnect if not manually disconnected
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    }
  }

  private onError(error: Event): void {
    this.status = 'error';
    this.emit('statusChanged', this.status);
    this.emit('error', new Error('WebSocket connection error'));
  }

  private onMessage(event: MessageEvent): void {
    if (!this.AppMessage) return;

    try {
      const message = this.AppMessage.decode(new Uint8Array(event.data));

      // Handle response callbacks
      if (message.response?.seq && this.seqCallbacks[message.response.seq]) {
        const callback = this.seqCallbacks[message.response.seq];
        const handled = callback(message);
        delete this.seqCallbacks[message.response.seq];
        
        if (handled) return;
      }

      // Handle broadcasts
      if (message.broadcast) {
        this.handleBroadcast(message.broadcast);
      }

      // Handle pairing notifications (channel 1001 for server pairing)
      if (message.response && message.response.info) {
        this.handlePairingNotification(message);
      }

      this.emit('messageReceived', message);
    } catch (error) {
      console.error('Failed to decode message:', error);
    }
  }

  /**
   * Handle pairing notifications based on message content
   */
  private handlePairingNotification(message: any): void {
    // Import notification service dynamically to avoid circular imports
    import('./NotificationService').then(({ notificationService }) => {
      // Check if this is a server pairing notification
      if (message.response?.info && this.isServerPairingMessage(message)) {
        const info = message.response.info;
        notificationService.createServerPairingNotification({
          serverName: info.name || 'Unknown Server',
          ip: this.server?.ip || 'unknown',
          port: this.server?.port || 'unknown',
          playerId: this.server?.playerId || 'unknown',
          playerToken: this.server?.playerToken || 'unknown',
          description: `Server: ${info.name}, Players: ${info.players}/${info.maxPlayers}`
        });
      }
      
      // Check if this is an entity pairing notification
      if (message.response?.entityInfo && this.isEntityPairingMessage(message)) {
        const entityInfo = message.response.entityInfo;
        notificationService.createEntityPairingNotification({
          entityId: message.entityId || 0,
          entityType: entityInfo.type || 'Smart Device',
          entityName: entityInfo.name,
          description: `Entity ID: ${message.entityId}, Type: ${entityInfo.type}`
        });
      }
    }).catch(error => {
      console.error('Failed to import NotificationService:', error);
    });
  }

  /**
   * Check if message is a server pairing notification
   */
  private isServerPairingMessage(message: any): boolean {
    // Based on old Vue repo, server pairing uses channel 1001
    // This is a simplified check - in real implementation, you'd check the actual channel
    return message.response?.info && !message.entityId;
  }

  /**
   * Check if message is an entity pairing notification
   */
  private isEntityPairingMessage(message: any): boolean {
    // Entity pairing typically has entityId and entityInfo
    return message.entityId && message.response?.entityInfo;
  }

  private handleBroadcast(broadcast: any): void {
    // Import notification service dynamically to avoid circular imports
    import('./NotificationService').then(({ notificationService }) => {
      if (broadcast.teamMessage) {
        this.emit('teamMessage', broadcast.teamMessage.message);
        
        // Create team message notification
        notificationService.createTeamMessageNotification({
          steamId: broadcast.teamMessage.steamId?.toString() || 'unknown',
          name: broadcast.teamMessage.name || 'Unknown Player',
          message: broadcast.teamMessage.message?.message || '',
          color: broadcast.teamMessage.color || '#ffffff'
        });
      }
      
      if (broadcast.teamChanged) {
        this.emit('teamChanged', broadcast.teamChanged);
        
        // Handle team member login/logout notifications
        if (broadcast.teamChanged.player) {
          const player = broadcast.teamChanged.player;
          if (player.isOnline !== undefined) {
            notificationService.createPlayerLoginNotification({
              steamId: player.steamId?.toString() || 'unknown',
              name: player.name || 'Unknown Player',
              isOnline: player.isOnline
            });
          }
          
          // Handle player death notifications
          if (player.isAlive === false && player.deathTime) {
            notificationService.createPlayerDeathNotification({
              steamId: player.steamId?.toString() || 'unknown',
              name: player.name || 'Unknown Player',
              killer: player.killer,
              weapon: player.weapon
            });
          }
        }
      }
      
      if (broadcast.entityChanged) {
        this.emit('entityChanged', broadcast.entityChanged);
        
        // Create entity changed notification
        const entity = broadcast.entityChanged;
        notificationService.createEntityChangedNotification({
          entityId: entity.entityId || 0,
          entityType: entity.entityType || 'Unknown Device',
          value: entity.value,
          capacity: entity.capacity,
          hasProtection: entity.hasProtection
        });
      }
    }).catch(error => {
      console.error('Failed to import NotificationService:', error);
    });
  }

  private attemptReconnect(): void {
    if (!this.server) return;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (this.server) {
        this.connect(this.server).catch(() => {
          // Reconnection failed, will try again if attempts remain
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  private async refreshServerData(): void {
    try {
      const serverInfo = await this.getServerInfo();
      this.emit('serverInfoUpdated', serverInfo);
    } catch (error) {
      // Silently fail, don't spam errors for refresh failures
    }
  }
}

// Export singleton instance
export const rustPlusService = new RustPlusService();